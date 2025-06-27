import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots, bookings, payments } from '$lib/db/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const tourId = params.id;

	try {
		// First check if tour exists and belongs to user
		const [tour] = await db
			.select()
			.from(tours)
			.where(and(eq(tours.id, tourId), eq(tours.userId, locals.user.id)))
			.limit(1);

		if (!tour) {
			throw error(404, 'Tour not found');
		}

		// Get booking statistics for logging
		const allBookings = await db
			.select({ 
				id: bookings.id, 
				status: bookings.status,
				participants: bookings.participants,
				totalAmount: bookings.totalAmount,
				paymentStatus: bookings.paymentStatus
			})
			.from(bookings)
			.where(eq(bookings.tourId, tourId));

		const activeBookings = allBookings.filter(b => 
			b.status === 'confirmed' || b.status === 'pending'
		);
		
		const paidBookings = allBookings.filter(b => 
			b.paymentStatus === 'paid' && (b.status === 'confirmed' || b.status === 'completed')
		);
		
		const totalRevenue = paidBookings.reduce((sum, b) => 
			sum + (parseFloat(b.totalAmount) || 0), 0
		);

		// PREVENT deletion if there are active bookings
		if (activeBookings.length > 0) {
			throw error(400, JSON.stringify({
				error: 'Cannot delete tour with active bookings',
				details: {
					activeBookings: activeBookings.length,
					totalBookings: allBookings.length,
					revenue: totalRevenue,
					message: 'Please cancel all bookings before deleting this tour'
				}
			}));
		}

		// Log deletion for audit purposes
		if (allBookings.length > 0) {
			console.warn(`⚠️ TOUR DELETION: User ${locals.user.id} is deleting tour ${tourId} "${tour.name}" with ${allBookings.length} historical bookings (all cancelled/completed, €${totalRevenue} historical revenue)`);
		} else {
			console.log(`Tour deletion: User ${locals.user.id} is deleting tour ${tourId} "${tour.name}" with no bookings`);
		}

		// Delete in the correct order to respect foreign key constraints
		console.log(`Starting deletion process for tour ${tourId}`);
		
		// 1. First delete payments (references bookings)
		for (const booking of allBookings) {
			try {
				await db.delete(payments).where(eq(payments.bookingId, booking.id));
			} catch (paymentError) {
				console.warn(`Failed to delete payments for booking ${booking.id}:`, paymentError);
				// Continue - payments might not exist
			}
		}

		// 2. Then delete all bookings
		if (allBookings.length > 0) {
			await db.delete(bookings).where(eq(bookings.tourId, tourId));
			console.log(`Deleted ${allBookings.length} bookings for tour ${tourId}`);
		}

		// 3. Then delete all time slots
		await db.delete(timeSlots).where(eq(timeSlots.tourId, tourId));
		console.log(`Deleted time slots for tour ${tourId}`);

		// 4. Finally delete the tour
		await db.delete(tours).where(eq(tours.id, tourId));
		console.log(`Successfully deleted tour ${tourId}`);

		return json({ 
			success: true,
			deletedBookings: allBookings.length,
			message: allBookings.length > 0 
				? `Tour deleted along with ${allBookings.length} historical bookings`
				: 'Tour deleted successfully'
		});
	} catch (err) {
		console.error('Failed to delete tour:', err);
		
		if (err instanceof Response) {
			throw err;
		}
		
		// Check if it's our custom error
		if (err && typeof err === 'object' && 'status' in err && err.status === 400) {
			throw err;
		}
		
		throw error(500, 'An unexpected error occurred while deleting the tour');
	}
}; 
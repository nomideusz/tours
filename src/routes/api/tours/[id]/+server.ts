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

		// Check if there are any confirmed bookings
		const confirmedBookings = await db
			.select({ id: bookings.id })
			.from(bookings)
			.where(and(eq(bookings.tourId, tourId), eq(bookings.status, 'confirmed')))
			.limit(1);

		if (confirmedBookings.length > 0) {
			throw error(400, 'This tour has confirmed bookings. Please cancel all bookings before deleting the tour.');
		}

		// Delete in the correct order to respect foreign key constraints
		console.log(`Starting deletion process for tour ${tourId}`);
		
		// 1. First delete payments (references bookings)
		const tourBookings = await db
			.select({ id: bookings.id })
			.from(bookings)
			.where(eq(bookings.tourId, tourId));

		console.log(`Found ${tourBookings.length} bookings to process`);

		for (const booking of tourBookings) {
			try {
				await db.delete(payments).where(eq(payments.bookingId, booking.id));
				console.log(`Deleted payments for booking ${booking.id}`);
			} catch (paymentError) {
				console.warn(`Failed to delete payments for booking ${booking.id}:`, paymentError);
				// Continue - payments might not exist
			}
		}

		// 2. Then delete all bookings (references tours and time_slots)
		try {
			const deletedBookings = await db.delete(bookings).where(eq(bookings.tourId, tourId));
			console.log(`Deleted bookings for tour ${tourId}`);
		} catch (bookingError) {
			console.error(`Failed to delete bookings for tour ${tourId}:`, bookingError);
			throw new Error(`Failed to delete bookings: ${bookingError instanceof Error ? bookingError.message : 'Unknown error'}`);
		}

		// 3. Skip QR codes deletion - using simplified schema with QR codes in tours table

		// 4. Then delete all time slots (references tours)
		try {
			await db.delete(timeSlots).where(eq(timeSlots.tourId, tourId));
			console.log(`Deleted time slots for tour ${tourId}`);
		} catch (timeslotError) {
			console.error(`Failed to delete time slots for tour ${tourId}:`, timeslotError);
			throw new Error(`Failed to delete time slots: ${timeslotError instanceof Error ? timeslotError.message : 'Unknown error'}`);
		}

		// 5. Finally delete the tour
		try {
			await db.delete(tours).where(eq(tours.id, tourId));
			console.log(`Successfully deleted tour ${tourId}`);
		} catch (tourError) {
			console.error(`Failed to delete tour ${tourId}:`, tourError);
			throw new Error(`Failed to delete tour: ${tourError instanceof Error ? tourError.message : 'Unknown error'}`);
		}

		return json({ success: true });
	} catch (err) {
		console.error('Failed to delete tour:', err);
		
		if (err instanceof Response) {
			throw err;
		}
		
		throw error(500, 'An unexpected error occurred while deleting the tour');
	}
}; 
import type { PageServerLoad, Actions } from './$types.js';
import { error, redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, bookings } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { getTourAllBookings } from '$lib/utils/shared-stats.js';

export const load: PageServerLoad = async ({ locals, url, params, parent }) => {
	console.log('Tour bookings page load started for tour:', params.id);
	
	// Get parent layout data first
	const parentData = await parent();
	
	// Check if user is authenticated (should already be handled by layout)
	if (!locals.user) {
		console.log('Tour bookings: User not authenticated, redirecting to login');
		const redirectTo = url.pathname + url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}
	
	console.log('Tour bookings: User authenticated:', locals.user.id);
	
	// Validate that tour ID is provided
	if (!params.id) {
		console.error('Tour bookings: Tour ID is missing');
		throw error(400, 'Tour ID is required');
	}
	
	try {
		// Use the shared stats approach to get tour and all bookings data
		console.log('Loading tour bookings using shared-stats approach');
		const tourBookingsData = await getTourAllBookings(locals.user.id, params.id);
		
		// Calculate stats server-side to avoid frontend complexity
		const bookings = tourBookingsData.bookings || [];
		let totalBookings = bookings.length;
		let confirmed = 0;
		let pending = 0;
		let cancelled = 0;
		let completed = 0;
		let totalRevenue = 0;
		let totalParticipants = 0;
		let upcoming = 0;
		const now = new Date();
		
		for (const booking of bookings) {
			// Status counts
			switch (booking.status) {
				case 'confirmed':
					confirmed++;
					if (booking.paymentStatus === 'paid') {
						const amount = typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : (booking.totalAmount || 0);
						totalRevenue += amount;
						totalParticipants += booking.participants || 0;
					}
					break;
				case 'pending':
					pending++;
					break;
				case 'cancelled':
					cancelled++;
					break;
				case 'completed':
					completed++;
					break;
			}
			
			// Check if upcoming (safe date handling)
			if ((booking.status === 'confirmed' || booking.status === 'pending') && booking.expand?.timeSlot?.startTime) {
				try {
					const tourDate = new Date(booking.expand.timeSlot.startTime);
					if (tourDate > now) {
						upcoming++;
					}
				} catch (dateError) {
					// Skip invalid dates
					console.warn('Invalid date for booking', booking.id, ':', booking.expand.timeSlot.startTime);
				}
			}
		}
		
		const stats = {
			total: totalBookings,
			confirmed,
			pending,
			cancelled,
			completed,
			revenue: totalRevenue,
			participants: totalParticipants,
			upcoming
		};
		
		console.log('Tour bookings page load completed successfully');
		
		// Return parent data merged with bookings data and stats
		return {
			...parentData,
			...tourBookingsData, // Include tour and bookings
			stats // Include pre-calculated stats
		};
		
	} catch (err) {
		console.error('CRITICAL ERROR loading tour bookings:', err);
		console.error('Error details:', {
			message: err instanceof Error ? err.message : 'Unknown error',
			stack: err instanceof Error ? err.stack : 'No stack trace',
			type: err instanceof Error ? err.constructor.name : typeof err,
			status: (err as any)?.status
		});
		
		if (err instanceof Error && err.message.includes('not found')) {
			throw error(404, 'Tour not found or access denied');
		}
		
		if ((err as any)?.status) {
			throw err; // Re-throw SvelteKit errors
		}
		
		// Return parent data with empty bookings and zero stats on error
		return {
			...parentData,
			bookings: [],
			stats: {
				total: 0,
				confirmed: 0,
				pending: 0,
				cancelled: 0,
				completed: 0,
				revenue: 0,
				participants: 0,
				upcoming: 0
			}
		};
	}
};

export const actions: Actions = {
	updateStatus: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const bookingId = formData.get('bookingId') as string;
		const newStatus = formData.get('status') as 'confirmed' | 'cancelled' | 'completed' | 'no_show';

		if (!bookingId || !newStatus) {
			return fail(400, { error: 'Missing booking ID or status' });
		}

		try {
			// Get booking with tour ownership check
			const bookingData = await db
				.select({
					id: bookings.id,
					status: bookings.status,
					paymentStatus: bookings.paymentStatus
				})
				.from(bookings)
				.innerJoin(tours, eq(bookings.tourId, tours.id))
				.where(and(
					eq(bookings.id, bookingId),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);

			if (bookingData.length === 0) {
				return fail(404, { error: 'Booking not found' });
			}

			const booking = bookingData[0];

			// Validate status transitions
			if (newStatus === 'confirmed' && booking.paymentStatus !== 'paid') {
				return fail(400, { 
					error: 'Cannot confirm booking: Payment not completed. Customer must complete payment first.' 
				});
			}

			if (newStatus === 'completed' && booking.status !== 'confirmed') {
				return fail(400, { 
					error: 'Cannot complete booking: Only confirmed bookings can be marked as completed.' 
				});
			}

			// Update booking status
			await db
				.update(bookings)
				.set({ 
					status: newStatus,
					updatedAt: new Date()
				})
				.where(eq(bookings.id, bookingId));

			return { success: true };
		} catch (err) {
			console.error('Error updating booking status:', err);
			return fail(500, { error: 'Failed to update booking status' });
		}
	}
}; 
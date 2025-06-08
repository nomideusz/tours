import type { PageServerLoad, Actions } from './$types.js';
import { error, redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { bookings, tours } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { getBookingDetails } from '$lib/utils/shared-stats.js';

export const load: PageServerLoad = async ({ locals, url, params, parent }) => {
	// Get parent layout data first
	const parentData = await parent();
	
	// Check if user is authenticated (should already be handled by layout)
	if (!locals.user) {
		console.log('Booking detail: User not authenticated, redirecting to login');
		const redirectTo = url.pathname + url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}
	
	// Validate that booking ID is provided
	if (!params.id) {
		throw error(400, 'Booking ID is required');
	}
	
	try {
		console.log(`Loading booking ${params.id} for user ${locals.user.id}`);
		
		// Use the shared stats approach to get booking details
		const bookingDetailsData = await getBookingDetails(locals.user.id, params.id);
		
		// Return parent data merged with booking data
		return {
			...parentData,
			...bookingDetailsData // Include booking and payment
		};
		
	} catch (err) {
		console.error('Error loading booking details for booking:', params.id);
		console.error('User ID:', locals.user?.id);
		console.error('Error details:', {
			message: err instanceof Error ? err.message : 'Unknown error',
			status: (err as any)?.status,
			stack: err instanceof Error ? err.stack : 'No stack trace'
		});
		
		if (err instanceof Error && err.message.includes('not found')) {
			console.error('Booking not found - 404 error for booking:', params.id);
			throw error(404, 'Booking not found');
		}
		
		if (err instanceof Error && err.message.includes('Access denied')) {
			console.error('Access denied - 403 error for booking:', params.id);
			throw error(403, 'You can only view bookings for your own tours');
		}
		
		// For any other error, including timeouts
		console.error('Server error (500) for booking:', params.id, 'Error:', err);
		throw error(500, 'Failed to load booking details');
	}
};

export const actions: Actions = {
	updateStatus: async ({ request, locals, params }) => {
		if (!locals.user) {
			throw error(401, 'Unauthorized');
		}

		if (!params.id) {
			throw error(400, 'Booking ID is required');
		}

		const formData = await request.formData();
		const status = formData.get('status') as string;

		if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
			return fail(400, { error: 'Invalid status' });
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
					eq(bookings.id, params.id),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);

			if (bookingData.length === 0) {
				return fail(404, { error: 'Booking not found' });
			}

			const booking = bookingData[0];

			// Validate status transitions
			if (status === 'confirmed' && booking.paymentStatus !== 'paid') {
				return fail(400, { 
					error: 'Cannot confirm booking: Payment not completed. Customer must complete payment first.' 
				});
			}

			if (status === 'completed' && booking.status !== 'confirmed') {
				return fail(400, { 
					error: 'Cannot complete booking: Only confirmed bookings can be marked as completed.' 
				});
			}

			// Update booking status
			await db
				.update(bookings)
				.set({ 
					status: status as any,
					updatedAt: new Date()
				})
				.where(eq(bookings.id, params.id));

			return { success: true };
		} catch (err) {
			console.error('Error updating booking status:', err);
			return fail(500, { error: 'Failed to update booking status' });
		}
	},

	updateAttendance: async ({ request, locals, params }) => {
		if (!locals.user) {
			throw error(401, 'Unauthorized');
		}

		if (!params.id) {
			throw error(400, 'Booking ID is required');
		}

		const formData = await request.formData();
		const attendanceStatus = formData.get('attendanceStatus') as string;

		if (!attendanceStatus || !['checked_in', 'no_show'].includes(attendanceStatus)) {
			return fail(400, { error: 'Invalid attendance status' });
		}

		try {
			// Get booking with tour ownership check
			const bookingData = await db
				.select({
					id: bookings.id,
					status: bookings.status
				})
				.from(bookings)
				.innerJoin(tours, eq(bookings.tourId, tours.id))
				.where(and(
					eq(bookings.id, params.id),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);

			if (bookingData.length === 0) {
				return fail(404, { error: 'Booking not found' });
			}

			const booking = bookingData[0];

			// Only confirmed bookings can have attendance updated
			if (booking.status !== 'confirmed') {
				return fail(400, { 
					error: 'Can only update attendance for confirmed bookings' 
				});
			}

			// Update attendance status
			await db
				.update(bookings)
				.set({ 
					attendanceStatus: attendanceStatus as any,
					checkedInAt: attendanceStatus === 'checked_in' ? new Date() : null,
					updatedAt: new Date()
				})
				.where(eq(bookings.id, params.id));

			return { success: true };
		} catch (err) {
			console.error('Error updating attendance:', err);
			return fail(500, { error: 'Failed to update attendance' });
		}
	}
}; 
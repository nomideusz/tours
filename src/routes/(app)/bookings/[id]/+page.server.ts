import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

export const actions: Actions = {
	updateStatus: async ({ request, locals, params }) => {
		try {
			if (!locals.user) {
				return fail(401, { error: 'Unauthorized' });
			}

			const data = await request.formData();
			const status = data.get('status') as string;
			const bookingId = params.id;

			if (!bookingId) {
				return fail(400, { error: 'Booking ID is required' });
			}

			if (!status || !['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
				return fail(400, { error: 'Invalid status' });
			}

			// Verify that the booking belongs to the current user
			const bookingData = await db.select({
				id: bookings.id,
				tourId: bookings.tourId
			})
			.from(bookings)
			.innerJoin(tours, eq(bookings.tourId, tours.id))
			.where(and(
				eq(bookings.id, bookingId),
				eq(tours.userId, locals.user.id)
			))
			.limit(1);

			if (bookingData.length === 0) {
				return fail(404, { error: 'Booking not found or access denied' });
			}

			// Update the booking status
			await db.update(bookings)
				.set({ 
					status: status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
					updatedAt: new Date()
				})
				.where(eq(bookings.id, bookingId));

			return { success: true };

		} catch (error) {
			console.error('Error updating booking status:', error);
			return fail(500, { error: 'Failed to update booking status' });
		}
	}
}; 
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users, tours, bookings, sessions, notifications, timeSlots, payments } from '$lib/db/schema/index.js';
import { eq, sql, inArray } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ locals, params }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = params.id;

	try {
		// Get the user first
		const userToDelete = await db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!userToDelete.length) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const user = userToDelete[0];

		// Don't allow deleting admins
		if (user.role === 'admin') {
			return json({ error: 'Cannot delete admin users' }, { status: 403 });
		}

		// Don't allow deleting yourself
		if (user.id === locals.user.id) {
			return json({ error: 'Cannot delete your own account' }, { status: 403 });
		}

		// Start a transaction to delete all related data
		await db.transaction(async (tx) => {
			// First, get all tour IDs for this user
			const userTours = await tx
				.select({ id: tours.id })
				.from(tours)
				.where(eq(tours.userId, userId));
			
			const tourIds = userTours.map(tour => tour.id);

			// If user has tours, delete related data in correct order
			if (tourIds.length > 0) {
				// 1. Get all booking IDs for user's tours
				const userBookings = await tx
					.select({ id: bookings.id })
					.from(bookings)
					.where(inArray(bookings.tourId, tourIds));
				
				const bookingIds = userBookings.map(booking => booking.id);

				// 2. Delete payments for these bookings
				if (bookingIds.length > 0) {
					await tx.delete(payments)
						.where(inArray(payments.bookingId, bookingIds));
				}

				// 3. Delete bookings for user's tours
				await tx.delete(bookings)
					.where(inArray(bookings.tourId, tourIds));

				// 4. Delete time slots for user's tours
				await tx.delete(timeSlots)
					.where(inArray(timeSlots.tourId, tourIds));

				// 5. Delete user's tours
				await tx.delete(tours).where(eq(tours.userId, userId));
			}

			// 6. Delete user's sessions
			await tx.delete(sessions).where(eq(sessions.userId, userId));

			// 7. Delete user's notifications
			await tx.delete(notifications).where(eq(notifications.userId, userId));

			// 8. Finally delete the user (cascade will handle oauth accounts, tokens, etc.)
			await tx.delete(users).where(eq(users.id, userId));
		});

		return json({ 
			success: true,
			message: `User ${user.email} and all their data (tours, bookings, payments, sessions) have been deleted`
		});
	} catch (error) {
		console.error('Error deleting user:', error);
		return json({ error: 'Failed to delete user' }, { status: 500 });
	}
}; 
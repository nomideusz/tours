import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users, tours, bookings, sessions, notifications, timeSlots, payments } from '$lib/db/schema/index.js';
import { eq, sql, inArray } from 'drizzle-orm';
import { deleteAvatar } from '$lib/utils/avatar-storage.js';
import { deleteImages } from '$lib/utils/image-storage.js';

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
			// First, get all tour data for this user (including images)
			const userTours = await tx
				.select({ id: tours.id, images: tours.images })
				.from(tours)
				.where(eq(tours.userId, userId));
			
			const tourIds = userTours.map(tour => tour.id);

			// Clean up images from MinIO storage before deleting database records
			console.log(`🗂️ Cleaning up images for ${userTours.length} tours and user avatar...`);
			
			// Delete user's avatar from MinIO if it exists and is not an OAuth2 avatar
			if (user.avatar && !user.avatar.startsWith('http')) {
				try {
					// Extract filename from current avatar URL (assumes format /api/avatars/userId/filename)
					const avatarUrlParts = user.avatar.split('/');
					const avatarFilename = avatarUrlParts[avatarUrlParts.length - 1]?.split('?')[0];
					if (avatarFilename) {
						await deleteAvatar(userId, avatarFilename);
						console.log(`✅ Deleted user avatar from MinIO: ${avatarFilename}`);
					}
				} catch (avatarError) {
					console.warn('⚠️ Failed to delete user avatar from MinIO:', avatarError);
					// Continue with deletion even if avatar cleanup fails
				}
			}

			// Delete tour images from MinIO
			for (const tour of userTours) {
				if (tour.images && Array.isArray(tour.images) && tour.images.length > 0) {
					try {
						await deleteImages(tour.id, tour.images);
						console.log(`✅ Deleted ${tour.images.length} images for tour ${tour.id}`);
					} catch (imageError) {
						console.warn(`⚠️ Failed to delete images for tour ${tour.id}:`, imageError);
						// Continue with deletion even if image cleanup fails
					}
				}
			}

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
			message: `User ${user.email} and all their data (tours, bookings, payments, sessions, images) have been deleted`
		});
	} catch (error) {
		console.error('Error deleting user:', error);
		return json({ error: 'Failed to delete user' }, { status: 500 });
	}
}; 
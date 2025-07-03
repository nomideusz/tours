import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users, tours, bookings, sessions, notifications } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

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
			// Delete user's sessions
			await tx.delete(sessions).where(eq(sessions.userId, userId));

			// Delete user's notifications
			await tx.delete(notifications).where(eq(notifications.userId, userId));

			// Delete user's tours (cascade will handle timeSlots)
			await tx.delete(tours).where(eq(tours.userId, userId));

			// Finally delete the user (cascade will handle oauth accounts, tokens, etc.)
			await tx.delete(users).where(eq(users.id, userId));
		});

		return json({ 
			success: true,
			message: `User ${user.email} and all their data have been deleted`
		});
	} catch (error) {
		console.error('Error deleting user:', error);
		return json({ error: 'Failed to delete user' }, { status: 500 });
	}
}; 
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { hash, verify } from '@node-rs/argon2';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const formData = await request.formData();
		const currentPassword = formData.get('currentPassword')?.toString() || '';
		const newPassword = formData.get('newPassword')?.toString() || '';
		const confirmPassword = formData.get('confirmPassword')?.toString() || '';

		// Validation
		if (!currentPassword) {
			return json({ error: 'Current password is required' }, { status: 400 });
		}

		if (!newPassword || newPassword.length < 8) {
			return json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
		}

		if (newPassword !== confirmPassword) {
			return json({ error: 'New passwords do not match' }, { status: 400 });
		}

		// Get current user with hashed password
		const currentUser = await db.select()
			.from(users)
			.where(eq(users.id, locals.user.id))
			.limit(1);

		if (currentUser.length === 0) {
			return json({ error: 'User not found' }, { status: 400 });
		}

		// Verify current password
		const user = currentUser[0];
		if (!user.hashedPassword) {
			return json({ error: 'No password set for this account' }, { status: 400 });
		}

		const isCurrentPasswordValid = await verify(user.hashedPassword, currentPassword, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		if (!isCurrentPasswordValid) {
			return json({ error: 'Current password is incorrect' }, { status: 400 });
		}

		// Hash new password
		const hashedNewPassword = await hash(newPassword, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		// Update password
		await db.update(users)
			.set({
				hashedPassword: hashedNewPassword,
				updatedAt: new Date()
			})
			.where(eq(users.id, locals.user.id));

		return json({ success: true, message: 'Password changed successfully!' });
	} catch (error) {
		console.error('Password change error:', error);
		return json({ error: 'Failed to change password. Please try again.' }, { status: 500 });
	}
}; 
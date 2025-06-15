import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { 
	processAndSaveAvatar, 
	deleteAvatar, 
	getAvatarUrl,
	isAvatarStorageAvailable,
	initializeAvatarStorage
} from '$lib/utils/avatar-storage.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const formData = await request.formData();
		const avatar = formData.get('avatar') as File;

		if (!avatar) {
			return json({ error: 'No avatar file provided' }, { status: 400 });
		}

		// Check if avatar storage is available
		const storageAvailable = await isAvatarStorageAvailable();
		
		if (!storageAvailable) {
			return json({
				error: 'Avatar upload unavailable',
				message: 'Unable to upload avatar. Please try again later.'
			}, { status: 500 });
		}

		// Initialize avatar storage
		await initializeAvatarStorage();
		
		// Delete old avatar if it exists and is not an OAuth2 avatar (external URL)
		if (locals.user.avatar && !locals.user.avatar.startsWith('http')) {
			try {
				// Extract filename from current avatar URL (assumes format /api/avatars/userId/filename)
				const avatarUrlParts = locals.user.avatar.split('/');
				const oldFilename = avatarUrlParts[avatarUrlParts.length - 1]?.split('?')[0];
				if (oldFilename) {
					await deleteAvatar(locals.user.id, oldFilename);
				}
			} catch (deleteError) {
				console.warn('Failed to delete old avatar:', deleteError);
				// Continue with upload even if old avatar deletion fails
			}
		}
		
		// Process and save new avatar using MinIO
		const processedAvatar = await processAndSaveAvatar(avatar, locals.user.id);
		const avatarUrl = await getAvatarUrl(locals.user.id, processedAvatar.filename, 'medium');

		// Update user avatar in database
		await db.update(users)
			.set({ 
				avatar: avatarUrl,
				updatedAt: new Date()
			})
			.where(eq(users.id, locals.user.id));

		console.log(`✅ Avatar uploaded successfully: ${avatarUrl}`);

		return json({ 
			success: true, 
			avatar: avatarUrl,
			message: 'Avatar updated successfully'
		});

	} catch (error) {
		console.error('Avatar upload error:', error);
		return json({ 
			error: 'Avatar upload failed', 
			message: error instanceof Error ? error.message : 'Internal server error'
		}, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Delete existing avatar from MinIO if it exists and is not an OAuth2 avatar
		if (locals.user.avatar && !locals.user.avatar.startsWith('http')) {
			try {
				// Extract filename from current avatar URL
				const avatarUrlParts = locals.user.avatar.split('/');
				const filename = avatarUrlParts[avatarUrlParts.length - 1]?.split('?')[0];
				if (filename) {
					await deleteAvatar(locals.user.id, filename);
					console.log(`✅ Deleted avatar from storage: ${filename}`);
				}
			} catch (deleteError) {
				console.warn('Failed to delete avatar from storage:', deleteError);
				// Continue with database update even if file deletion fails
			}
		}

		// Remove avatar from database (set to null)
		await db.update(users)
			.set({ 
				avatar: null,
				updatedAt: new Date()
			})
			.where(eq(users.id, locals.user.id));

		return json({ 
			success: true, 
			message: 'Avatar removed successfully'
		});

	} catch (error) {
		console.error('Avatar removal error:', error);
		return json({ 
			error: 'Avatar removal failed',
			message: error instanceof Error ? error.message : 'Internal server error'
		}, { status: 500 });
	}
}; 
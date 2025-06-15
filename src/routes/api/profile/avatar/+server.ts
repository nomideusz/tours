import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

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

		// Validate file type
		const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		if (!validTypes.includes(avatar.type)) {
			return json({ error: 'Invalid file type. Please use JPEG, PNG, or WebP.' }, { status: 400 });
		}

		// Validate file size (2MB limit)
		if (avatar.size > 2 * 1024 * 1024) {
			return json({ error: 'File too large. Maximum size is 2MB.' }, { status: 400 });
		}

		// Generate unique filename
		const fileExtension = avatar.name.split('.').pop();
		const fileName = `${randomUUID()}.${fileExtension}`;
		const uploadDir = join(process.cwd(), 'static', 'uploads', 'avatars');
		const filePath = join(uploadDir, fileName);

		// Ensure upload directory exists
		await mkdir(uploadDir, { recursive: true });

		// Save file
		const buffer = Buffer.from(await avatar.arrayBuffer());
		await writeFile(filePath, buffer);

		// Update user avatar in database
		const avatarUrl = `/uploads/avatars/${fileName}`;
		
		await db.update(users)
			.set({ 
				avatar: avatarUrl,
				updatedAt: new Date()
			})
			.where(eq(users.id, locals.user.id));

		return json({ 
			success: true, 
			avatar: avatarUrl,
			message: 'Avatar updated successfully'
		});

	} catch (error) {
		console.error('Avatar upload error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
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
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}; 
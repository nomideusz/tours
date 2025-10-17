import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { announcementsSent } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const subject = url.searchParams.get('subject');
		
		if (!subject) {
			return json([]);
		}

		// Get all announcements sent with this subject
		const sent = await db
			.select()
			.from(announcementsSent)
			.where(eq(announcementsSent.subject, subject));

		return json(sent);
	} catch (error) {
		console.error('Error fetching sent announcements:', error);
		return json({ error: 'Failed to fetch sent announcements' }, { status: 500 });
	}
};


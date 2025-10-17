import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { announcementsSent } from '$lib/db/schema/index.js';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get announcement history grouped by subject
		// Shows: subject, heading, total sent, last sent date, first sent date
		const history = await db
			.select({
				subject: announcementsSent.subject,
				heading: announcementsSent.heading,
				totalSent: sql<number>`count(*)`.as('total_sent'),
				lastSent: sql<string>`max(${announcementsSent.sentAt})`.as('last_sent'),
				firstSent: sql<string>`min(${announcementsSent.sentAt})`.as('first_sent'),
				sentBy: sql<string>`array_agg(distinct ${announcementsSent.sentBy})`.as('sent_by')
			})
			.from(announcementsSent)
			.groupBy(announcementsSent.subject, announcementsSent.heading)
			.orderBy(sql`max(${announcementsSent.sentAt}) desc`);

		return json(history);
	} catch (error) {
		console.error('Error fetching announcement history:', error);
		return json({ error: 'Failed to fetch announcement history' }, { status: 500 });
	}
};


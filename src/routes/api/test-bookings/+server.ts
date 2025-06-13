import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours } from '$lib/db/schema/index.js';
import { eq, count } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		console.log('[test-bookings] Starting test endpoint');
		
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Super simple query - just count user's tours
		console.log('[test-bookings] Counting tours for user:', locals.user.id);
		const tourCount = await db.select({ count: count(tours.id) })
			.from(tours)
			.where(eq(tours.userId, locals.user.id));
		
		console.log('[test-bookings] Tour count result:', tourCount);
		
		// Return minimal response
		return json({
			success: true,
			userId: locals.user.id,
			tourCount: tourCount[0]?.count || 0,
			timestamp: new Date().toISOString()
		});
		
	} catch (error) {
		console.error('[test-bookings] Error:', error);
		return json({ 
			error: 'Test endpoint failed', 
			details: error instanceof Error ? error.message : 'Unknown error' 
		}, { status: 500 });
	}
}; 
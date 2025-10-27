import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq, count } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		// Count users with beta_group = 'beta_2'
		const beta2CountResult = await db
			.select({ count: count() })
			.from(users)
			.where(eq(users.betaGroup, 'beta_2'));
		
		const beta2Count = beta2CountResult[0]?.count || 0;
		const totalSpots = 100;
		const spotsRemaining = Math.max(0, totalSpots - beta2Count);

		return json({
			totalSpots,
			acceptedCount: beta2Count,
			spotsRemaining,
			isFull: spotsRemaining === 0
		});
	} catch (error) {
		console.error('Error fetching beta stats:', error);
		return json({ 
			error: 'Failed to fetch stats',
			totalSpots: 100,
			spotsRemaining: null
		}, { status: 500 });
	}
};


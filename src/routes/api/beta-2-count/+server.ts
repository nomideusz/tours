import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq, count } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		// Count users with beta_group = 'beta_2'
		const result = await db
			.select({ count: count() })
			.from(users)
			.where(eq(users.betaGroup, 'beta_2'));
		
		const beta2Count = result[0]?.count || 0;
		const totalSpots = 100;
		const remainingSpots = Math.max(0, totalSpots - beta2Count);
		
		return json({
			total: totalSpots,
			accepted: beta2Count,
			remaining: remainingSpots,
			percentFilled: Math.round((beta2Count / totalSpots) * 100)
		});
	} catch (error) {
		console.error('Error fetching Beta 2 count:', error);
		// Return default values on error
		return json({
			total: 100,
			accepted: 0,
			remaining: 100,
			percentFilled: 0
		});
	}
};


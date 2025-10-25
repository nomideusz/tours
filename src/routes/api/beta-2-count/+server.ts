import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { betaApplications } from '$lib/db/schema/index.js';
import { eq, count } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		// Count accepted Beta 2 applications
		const result = await db
			.select({ count: count() })
			.from(betaApplications)
			.where(eq(betaApplications.status, 'accepted'));
		
		const acceptedCount = result[0]?.count || 0;
		const totalSpots = 100;
		const remainingSpots = Math.max(0, totalSpots - acceptedCount);
		
		return json({
			total: totalSpots,
			accepted: acceptedCount,
			remaining: remainingSpots,
			percentFilled: Math.round((acceptedCount / totalSpots) * 100)
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


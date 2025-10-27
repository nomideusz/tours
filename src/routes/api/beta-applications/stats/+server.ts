import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { betaApplications } from '$lib/db/schema/index.js';
import { eq, count } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		// Count accepted Beta 2 applications
		const acceptedCountResult = await db
			.select({ count: count() })
			.from(betaApplications)
			.where(eq(betaApplications.status, 'accepted'));
		
		const acceptedCount = acceptedCountResult[0]?.count || 0;
		const totalSpots = 100;
		const spotsRemaining = Math.max(0, totalSpots - acceptedCount);

		return json({
			totalSpots,
			acceptedCount,
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


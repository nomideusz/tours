import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours } from '$lib/db/schema/index.js';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Fetch user's tours
		const userTours = await db.select()
			.from(tours)
			.where(eq(tours.userId, locals.user.id))
			.orderBy(desc(tours.updatedAt))
			.limit(100); // Reasonable limit to prevent 502 errors

		// Format tours data to match expected client format
		const formattedTours = userTours.map(tour => ({
			...tour,
			price: parseFloat(tour.price),
			created: tour.createdAt.toISOString(),
			updated: tour.updatedAt.toISOString()
		}));
		
		return json(formattedTours, {
			headers: {
				'Cache-Control': 'max-age=60, stale-while-revalidate=30' // 1 min cache, 30s stale
			}
		});
	} catch (error) {
		console.error('Error fetching tours:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}; 
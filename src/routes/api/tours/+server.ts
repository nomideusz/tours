import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots } from '$lib/db/schema/index.js';
import { eq, desc, and, gte, count } from 'drizzle-orm';

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

		// Get time slot counts for each tour to determine booking availability
		const now = new Date();
		const tourIds = userTours.map(tour => tour.id);
		
		// Get upcoming time slot counts for each tour
		const timeSlotCounts = new Map();
		if (tourIds.length > 0) {
			for (const tourId of tourIds) {
				try {
					const result = await db
						.select({ count: count() })
						.from(timeSlots)
						.where(and(
							eq(timeSlots.tourId, tourId),
							eq(timeSlots.status, 'available'),
							gte(timeSlots.startTime, now)
						));
					
					timeSlotCounts.set(tourId, result[0]?.count || 0);
				} catch (err) {
					console.warn(`Failed to get slot count for tour ${tourId}:`, err);
					timeSlotCounts.set(tourId, 0);
				}
			}
		}

		// Format tours data to match expected client format with booking availability
		const formattedTours = userTours.map(tour => ({
			...tour,
			price: tour.price ? parseFloat(tour.price) : 0,
			created: tour.createdAt?.toISOString() || new Date().toISOString(),
			updated: tour.updatedAt?.toISOString() || new Date().toISOString(),
			upcomingSlots: timeSlotCounts.get(tour.id) || 0
		}));
		
		return json(formattedTours, {
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate', // Don't cache mutations
				'Pragma': 'no-cache',
				'Expires': '0'
			}
		});
	} catch (error) {
		console.error('Error fetching tours:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}; 
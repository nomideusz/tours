import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { getToursSpecificStats, type SharedStats } from '$lib/utils/shared-stats.js';
import { db } from '$lib/db/connection.js';
import { tours } from '$lib/db/schema/index.js';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url, parent, fetch }) => {
	// Get parent layout data first (includes queryClient for prefetching)
	const parentData = await parent();
	
	// Check if user is authenticated
	if (!locals.user) {
		const redirectTo = url.pathname + url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	try {
		const userId = locals.user.id;
		
		// Get shared stats from parent layout
		const sharedStats: SharedStats = parentData.sharedStats || {
			totalTours: 0,
			activeTours: 0,
			monthlyTours: 0
		};

		// Get tours-specific stats that extend the shared stats
		const toursStats = await getToursSpecificStats(userId, sharedStats);
		
		// Fetch user's tours for display
		const userTours = await db.select()
			.from(tours)
			.where(eq(tours.userId, userId))
			.orderBy(desc(tours.updatedAt))
			.limit(100); // Reasonable limit to prevent 502 errors

		const formattedTours = userTours.map(tour => ({
			...tour,
			price: parseFloat(tour.price),
			created: tour.createdAt.toISOString(),
			updated: tour.updatedAt.toISOString()
		}));

		// Prefetch data for TanStack Query if queryClient is available
		if ((parentData as any).queryClient) {
			try {
				// Prefetch tours stats using the API endpoint
				await (parentData as any).queryClient.prefetchQuery({
					queryKey: ['toursStats'],
					queryFn: async () => (await fetch('/api/tours-stats')).json(),
					staleTime: 2 * 60 * 1000, // 2 minutes
				});

				// Prefetch user tours using the API endpoint
				await (parentData as any).queryClient.prefetchQuery({
					queryKey: ['userTours'],
					queryFn: async () => (await fetch('/api/tours')).json(),
					staleTime: 1 * 60 * 1000, // 1 minute
				});
			} catch (prefetchError) {
				console.log('Tours page: TanStack Query prefetch failed (continuing with SSR data):', prefetchError);
			}
		}

		return {
			...parentData,
			stats: toursStats, // This includes both shared and tours-specific stats
			tours: formattedTours
		};
	} catch (err) {
		console.error('Error loading tours page:', err);
		
		// Return fallback data with shared stats
		const fallbackSharedStats: SharedStats = parentData.sharedStats || {
			totalTours: 0,
			activeTours: 0,
			monthlyTours: 0
		};
		
		return {
			...parentData,
			tours: [],
			stats: {
				...fallbackSharedStats,
				draftTours: 0,
				totalRevenue: 0,
				todayBookings: 0,
				weekBookings: 0,
				monthRevenue: 0,
				totalBookings: 0,
				confirmedBookings: 0,
				totalParticipants: 0
			}
		};
	}
}; 
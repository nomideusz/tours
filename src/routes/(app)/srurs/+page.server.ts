import type { PageServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';
import { getToursSpecificStats, type SharedStats } from '$lib/utils/shared-stats.js';
import { db } from '$lib/db/connection.js';
import { tours } from '$lib/db/schema/index.js';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	// Get parent layout data first
	const parentData = await parent();
	
	// Check if user is authenticated (should already be handled by layout)
	if (!locals.user) {
		console.log('Tours: User not authenticated, redirecting to login');
		const redirectTo = url.pathname + url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}
	
	try {
		const userId = locals.user.id;
		
		console.log('Tours: Loading tours-specific data for user:', locals.user.email);
		
		// Get shared stats from parent or create defaults
		const sharedStats: SharedStats = (parentData as any).sharedStats || {
			totalTours: 0,
			activeTours: 0,
			monthlyTours: 0
		};
		
		// Get tours-specific stats that extend the shared stats
		const toursStats = await getToursSpecificStats(userId, sharedStats);
		
		// Fetch user's tours for the list
		let userTours: typeof tours.$inferSelect[] = [];
		try {
			console.log('Fetching tours list for user:', userId);
			userTours = await db.select()
				.from(tours)
				.where(eq(tours.userId, userId))
				.orderBy(desc(tours.updatedAt))
				.limit(50); // Reasonable limit for UI
			console.log(`Found ${userTours.length} tours for user ${userId}`);
		} catch (toursError) {
			console.error('Error fetching user tours:', toursError);
			userTours = [];
		}
		
		console.log('Tours: Loaded tours data and statistics successfully');
		
		// Return parent data merged with tours-specific data
		return {
			...parentData,
			stats: toursStats, // This includes both shared and tours-specific stats
			tours: userTours.map(tour => ({
				...tour,
				price: parseFloat(tour.price),
				created: tour.createdAt.toISOString(),
				updated: tour.updatedAt.toISOString()
			}))
		};
		
	} catch (err) {
		console.error('Error loading tours data:', err);
		// Return parent data with fallback stats
		const fallbackSharedStats: SharedStats = (parentData as any).sharedStats || {
			totalTours: 0,
			activeTours: 0,
			monthlyTours: 0
		};
		
		return {
			...parentData,
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
			},
			tours: []
		};
	}
}; 
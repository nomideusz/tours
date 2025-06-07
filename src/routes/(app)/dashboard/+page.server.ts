import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { formatRecentBooking, createTodaysSchedule, type ProcessedBooking } from '$lib/utils/booking-helpers.js';
import { getDashboardSpecificStats, getRecentBookings, type SharedStats } from '$lib/utils/shared-stats.js';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	// Get parent layout data first
	const parentData = await parent();
	
	// Check if user is authenticated (should already be handled by layout)
	if (!locals.user) {
		console.log('Dashboard: User not authenticated, redirecting to login');
		const redirectTo = url.pathname + url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}
	
	try {
		const userId = locals.user.id;
		
		console.log('Dashboard: Loading dashboard-specific data for user:', locals.user.email);
		
		// Get shared stats from parent or create defaults
		const sharedStats: SharedStats = (parentData as any).sharedStats || {
			totalTours: 0,
			activeTours: 0,
			monthlyTours: 0
		};
		
		// Get dashboard-specific stats that extend the shared stats
		const dashboardStats = await getDashboardSpecificStats(userId, sharedStats);
		
		// Get recent bookings for display
		const recentBookingsData = await getRecentBookings(userId, 10);
		
		// Format recent bookings for display
		const recentBookings = recentBookingsData.slice(0, 5).map(formatRecentBooking);
		
		// Create today's schedule
		let todaysSchedule: any[] = [];
		try {
			todaysSchedule = createTodaysSchedule(recentBookingsData);
		} catch (err) {
			console.error('Dashboard: Failed to create today\'s schedule:', err);
			todaysSchedule = [];
		}
		
		console.log(`Dashboard: Loaded stats and ${recentBookings.length} recent bookings`);
		
		// Return parent data merged with dashboard-specific data
		return {
			...parentData,
			stats: dashboardStats, // This now includes both shared and dashboard-specific stats
			recentBookings,
			todaysSchedule
		};
		
	} catch (err) {
		console.error('Error loading dashboard data:', err);
		// Return parent data with fallback dashboard data
		const fallbackSharedStats: SharedStats = (parentData as any).sharedStats || {
			totalTours: 0,
			activeTours: 0,
			monthlyTours: 0
		};
		
		return {
			...parentData,
			stats: {
				...fallbackSharedStats,
				todayBookings: 0,
				weeklyRevenue: 0,
				upcomingTours: 0,
				totalCustomers: 0
			},
			recentBookings: [],
			todaysSchedule: []
		};
	}
}; 
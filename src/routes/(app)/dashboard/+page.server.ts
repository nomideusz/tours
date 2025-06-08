import type { PageServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';
import { formatRecentBooking, createTodaysSchedule } from '$lib/utils/booking-helpers.js';
import { getDashboardSpecificStats, getRecentBookings, type SharedStats } from '$lib/utils/shared-stats.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
	// Check if user is authenticated (should already be handled by layout)
	if (!locals.user) {
		console.log('Dashboard: User not authenticated, redirecting to login');
		throw redirect(303, `/auth/login`);
	}
	
	try {
		const userId = locals.user.id;
		
		// Get parent layout data first
		const parentData = await parent();
		
		console.log('Dashboard: Loading dashboard data for user:', locals.user.email);
		
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
		
		// Return user's profile data with dashboard functionality
		return {
			...parentData,
			profile: {
				id: locals.user.id,
				name: locals.user.name,
				username: locals.user.username,
				businessName: locals.user.businessName,
				avatar: locals.user.avatar,
				description: locals.user.description,
				location: locals.user.location,
				website: locals.user.website,
				email: locals.user.email,
				phone: locals.user.phone,
				emailVerified: locals.user.emailVerified
			},
			stats: dashboardStats, // Include dashboard stats
			recentBookings,
			todaysSchedule
		};
		
	} catch (err) {
		console.error('Error loading dashboard data:', err);
		
		// Return profile data with fallback dashboard data
		return {
			profile: {
				id: locals.user.id,
				name: locals.user.name,
				username: locals.user.username,
				businessName: locals.user.businessName,
				avatar: locals.user.avatar,
				description: locals.user.description,
				location: locals.user.location,
				website: locals.user.website,
				email: locals.user.email,
				phone: locals.user.phone,
				emailVerified: locals.user.emailVerified
			},
			stats: {
				totalTours: 0,
				activeTours: 0,
				todayBookings: 0,
				weeklyRevenue: 0,
				upcomingTours: 0,
				totalCustomers: 0,
				monthlyTours: 0
			},
			recentBookings: [],
			todaysSchedule: []
		};
	}
}; 
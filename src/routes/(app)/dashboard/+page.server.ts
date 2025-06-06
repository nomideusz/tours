import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { formatRecentBooking, createTodaysSchedule, type ProcessedBooking } from '$lib/utils/booking-helpers.js';
import { db } from '$lib/db/connection.js';
import { tours, bookings, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, desc, gte } from 'drizzle-orm';

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
		
		// Fetch user's tours
		const userTours = await db.select({
			id: tours.id,
			name: tours.name,
			status: tours.status,
			createdAt: tours.createdAt
		})
		.from(tours)
		.where(eq(tours.userId, userId))
		.limit(50);
		
		const tourIds = userTours.map(t => t.id);
		
		// Initialize stats with defaults
		let stats = {
			totalTours: userTours.length,
			activeTours: userTours.filter(t => t.status === 'active').length,
			todayBookings: 0,
			weeklyRevenue: 0,
			upcomingTours: 0,
			totalCustomers: 0,
			monthlyTours: 0
		};
		
		let recentBookings: any[] = [];
		let todaysSchedule: any[] = [];
		
		// Only fetch booking data if user has tours
		if (tourIds.length > 0) {
			let allBookings: ProcessedBooking[] = [];
			
			try {
				console.log(`Dashboard: Fetching data for ${tourIds.length} tours`);
				
				// Fetch recent bookings with tour and time slot information
				const recentBookingsData = await db.select({
					id: bookings.id,
					customerName: bookings.customerName,
					customerEmail: bookings.customerEmail,
					participants: bookings.participants,
					status: bookings.status,
					createdAt: bookings.createdAt,
					totalAmount: bookings.totalAmount,
					paymentStatus: bookings.paymentStatus,
					tourName: tours.name,
					timeSlotStartTime: timeSlots.startTime
				})
				.from(bookings)
				.innerJoin(tours, eq(bookings.tourId, tours.id))
				.innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
				.where(eq(tours.userId, userId))
				.orderBy(desc(bookings.createdAt))
				.limit(10);
				
				// Process for display - structure data to match what formatRecentBooking expects
				allBookings = recentBookingsData.map((booking: any) => ({
					...booking,
					created: booking.createdAt, // Map to expected field name
					effectiveDate: booking.timeSlotStartTime || booking.createdAt,
					totalAmount: typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : (booking.totalAmount || 0),
					participants: booking.participants || 1,
					expand: {
						tour: { name: booking.tourName },
						timeSlot: { startTime: booking.timeSlotStartTime }
					}
				}));
				
				console.log(`Dashboard: Fetched ${allBookings.length} recent bookings`);
			} catch (err) {
				console.error('Dashboard: Failed to fetch recent bookings:', err);
				allBookings = [];
			}
			
			// Calculate stats from the bookings data
			const confirmedCount = allBookings.filter(b => b.status === 'confirmed').length;
			const todayCount = allBookings.filter(b => {
				const created = new Date(b.created);
				const today = new Date();
				return created.toDateString() === today.toDateString();
			}).length;
			
			// Calculate revenue from confirmed and paid bookings
			const recentRevenue = allBookings
				.filter(b => b.status === 'confirmed' && b.paymentStatus === 'paid')
				.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
			
			// Update stats with calculated data
			stats.todayBookings = todayCount;
			stats.weeklyRevenue = recentRevenue;
			stats.upcomingTours = confirmedCount;
			stats.totalCustomers = allBookings.reduce((sum, b) => sum + (b.participants || 0), 0);
			
			// Tours created this month
			const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
			stats.monthlyTours = userTours.filter(tour => {
				const tourDate = new Date(tour.createdAt);
				return tourDate >= monthStart;
			}).length;
			
			// Get recent bookings for display
			recentBookings = allBookings.slice(0, 5).map(formatRecentBooking);
			
			// Create today's schedule (simplified for now)
			try {
				todaysSchedule = createTodaysSchedule(allBookings);
			} catch (err) {
				console.error('Dashboard: Failed to create today\'s schedule:', err);
				todaysSchedule = [];
			}
		}
		
		// Return parent data merged with dashboard-specific data
		return {
			...parentData,
			stats,
			recentBookings,
			todaysSchedule
		};
		
	} catch (err) {
		console.error('Error loading dashboard data:', err);
		// Return parent data with default dashboard data
		return {
			...parentData,
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
import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';
import { fetchBookingsForTours, formatRecentBooking, createTodaysSchedule, type ProcessedBooking } from '$lib/utils/booking-helpers.js';
import { fetchRecentBookingsForUser } from '$lib/utils/booking-queries.js';

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
		
		// Get user's tours
		const tours = await locals.pb.collection('tours').getFullList({
			filter: `user = "${userId}"`,
			fields: 'id,name,status,created'
		});
		
		const tourIds = tours.map(t => t.id);
		
		// Initialize stats with defaults
		let stats = {
			totalTours: tours.length,
			activeTours: tours.filter(t => t.status === 'active').length,
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
			
			// Use different strategies based on number of tours
			if (tourIds.length > 15) {
				// For users with many tours, use date-based filtering
				console.log('Using optimized query for user with many tours');
				const recentBookings = await fetchRecentBookingsForUser(locals.pb, userId, 30);
				
				// Process the bookings to match expected format
				allBookings = recentBookings.map((booking: any) => ({
					...booking,
					effectiveDate: booking.expand?.timeSlot?.startTime || booking.created,
					totalAmount: booking.totalAmount || 0,
					participants: booking.participants || 1
				}));
			} else {
				// For users with fewer tours, use the standard approach with timeout
				const bookingsPromise = fetchBookingsForTours(locals.pb, tourIds);
				const timeoutPromise = new Promise<ProcessedBooking[]>((resolve) => 
					setTimeout(() => {
						console.warn('Dashboard bookings fetch timed out, returning empty array');
						resolve([]);
					}, 8000) // 8 second timeout
				);
				
				allBookings = await Promise.race([bookingsPromise, timeoutPromise]);
			}
			
			// Calculate today's date
			const today = new Date();
			const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
			const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
			
			// Calculate this week's date range
			const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
			
			// Calculate this month's date range
			const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
			
			// Filter confirmed/paid bookings for revenue calculation
			const confirmedBookings = allBookings.filter((b: any) => 
				b.status === 'confirmed' && b.paymentStatus === 'paid'
			);
			
			// Calculate stats from bookings
			stats.todayBookings = allBookings.filter(booking => {
				if (!booking.expand?.timeSlot?.startTime) return false;
				const bookingDate = new Date(booking.expand.timeSlot.startTime);
				return bookingDate >= todayStart && bookingDate < todayEnd;
			}).length;
			
			// Calculate weekly revenue from actual booking amounts
			const weeklyBookings = confirmedBookings.filter(booking => {
				const bookingDate = new Date(booking.created);
				return bookingDate >= weekStart;
			});
			
			// Use actual booking revenue
			stats.weeklyRevenue = weeklyBookings.reduce((total, booking) => {
				return total + (booking.totalAmount || 0);
			}, 0);
			
			// Get total participants from confirmed bookings
			stats.totalCustomers = confirmedBookings.reduce((sum: number, b: any) => sum + (b.participants || 0), 0);
			
			// Get tours created this month
			stats.monthlyTours = tours.filter(tour => {
				const tourDate = new Date(tour.created);
				return tourDate >= monthStart;
			}).length;
			
			// Get upcoming tours (today and future)
			stats.upcomingTours = allBookings.filter(booking => {
				if (!booking.expand?.timeSlot?.startTime) return false;
				const bookingDate = new Date(booking.expand.timeSlot.startTime);
				return bookingDate >= todayStart && booking.status === 'confirmed';
			}).length;
			
			// Get recent bookings (last 5) using shared utility
			recentBookings = allBookings
				.slice(0, 5)
				.map(formatRecentBooking);
			
			// Get today's schedule using shared utility
			todaysSchedule = createTodaysSchedule(allBookings);
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
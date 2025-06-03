import type { PageServerLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';

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
			fields: 'id,name,isActive,created'
		});
		
		const tourIds = tours.map(t => t.id);
		
		// Initialize stats with defaults
		let stats = {
			totalTours: tours.length,
			activeTours: tours.filter(t => t.isActive).length,
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
			// Get all bookings for user's tours with totalAmount field
			const allBookings = await locals.pb.collection('bookings').getFullList({
				filter: tourIds.map(id => `tour = "${id}"`).join(' || '),
				expand: 'tour,timeSlot',
				sort: '-created',
				fields: 'id,customerName,customerEmail,participants,status,created,tour,timeSlot,totalAmount,paymentStatus,expand.tour.name,expand.timeSlot.startTime,expand.timeSlot.date'
			});
			
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
				if (!booking.expand?.timeSlot?.date) return false;
				const bookingDate = new Date(booking.expand.timeSlot.date);
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
				if (!booking.expand?.timeSlot?.date) return false;
				const bookingDate = new Date(booking.expand.timeSlot.date);
				return bookingDate >= todayStart && booking.status === 'confirmed';
			}).length;
			
			// Get recent bookings (last 5)
			recentBookings = allBookings
				.slice(0, 5)
				.map(booking => ({
					id: booking.id,
					customerName: booking.customerName,
					tourName: booking.expand?.tour?.name || 'Unknown Tour',
					date: booking.expand?.timeSlot?.date && booking.expand?.timeSlot?.startTime
						? `${booking.expand.timeSlot.date}T${booking.expand.timeSlot.startTime}:00Z`
						: booking.created,
					participants: booking.participants,
					status: booking.status
				}));
			
			// Get today's schedule
			const todayBookings = allBookings.filter(booking => {
				if (!booking.expand?.timeSlot?.date) return false;
				const bookingDate = new Date(booking.expand.timeSlot.date);
				return bookingDate >= todayStart && bookingDate < todayEnd && booking.status === 'confirmed';
			});
			
			// Group by tour and time
			const scheduleMap = new Map();
			todayBookings.forEach(booking => {
				const key = `${booking.expand?.tour?.name}-${booking.expand?.timeSlot?.startTime}`;
				if (!scheduleMap.has(key)) {
					scheduleMap.set(key, {
						tourName: booking.expand?.tour?.name || 'Unknown Tour',
						time: booking.expand?.timeSlot?.startTime || '00:00',
						participants: 0
					});
				}
				scheduleMap.get(key).participants += booking.participants;
			});
			
			todaysSchedule = Array.from(scheduleMap.values())
				.sort((a, b) => a.time.localeCompare(b.time));
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
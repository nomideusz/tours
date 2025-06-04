import type { RequestHandler } from './$types.js';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	// Check authentication
	if (!locals.user || !locals.pb?.authStore?.isValid) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const userId = locals.user.id;
		
		// Get user's active tours count
		const activeTours = await locals.pb.collection('tours').getList(1, 1, {
			filter: `user = "${userId}" && status = "active"`,
			fields: 'id'
		});
		
		// Get today's bookings count
		const today = new Date();
		const todayStart = today.toISOString().split('T')[0];
		const todayBookings = await locals.pb.collection('bookings').getList(1, 1, {
			filter: `tour.user = "${userId}" && created >= "${todayStart}"`,
			fields: 'id'
		});
		
		// Get this week's confirmed bookings for revenue
		const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
		const weekStart = weekAgo.toISOString();
		const weeklyRevenue = await locals.pb.collection('bookings').getList(1, 100, {
			filter: `tour.user = "${userId}" && created >= "${weekStart}" && status = "confirmed" && paymentStatus = "paid"`,
			fields: 'totalAmount',
			perPage: 100
		});
		
		// Calculate revenue
		const revenue = weeklyRevenue.items.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
		
		// Return stats
		return json({
			activeTours: activeTours.totalItems || 0,
			todayBookings: todayBookings.totalItems || 0,
			weeklyRevenue: revenue,
			// These can be fetched later if needed
			upcomingTours: 0,
			totalCustomers: 0,
			monthlyTours: 0
		});
		
	} catch (error) {
		console.error('Error fetching dashboard stats:', error);
		return json({
			activeTours: 0,
			todayBookings: 0,
			weeklyRevenue: 0,
			upcomingTours: 0,
			totalCustomers: 0,
			monthlyTours: 0
		});
	}
}; 
import type { RequestHandler } from './$types.js';
import { json } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, bookings } from '$lib/db/schema/index.js';
import { eq, and, gte, count } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	// Check authentication
	if (!locals.user || !locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const userId = locals.user.id;
		
		// Get user's active tours count
		const activeToursResult = await db.select({ count: count() })
			.from(tours)
			.where(and(
				eq(tours.userId, userId),
				eq(tours.status, 'active')
			));
		const activeTours = activeToursResult[0]?.count || 0;
		
		// Get today's bookings count
		const today = new Date();
		const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		
		const todayBookingsResult = await db.select({ count: count() })
			.from(bookings)
			.innerJoin(tours, eq(bookings.tourId, tours.id))
			.where(and(
				eq(tours.userId, userId),
				gte(bookings.createdAt, todayStart)
			));
		const todayBookingsCount = todayBookingsResult[0]?.count || 0;
		
		// Get this week's confirmed bookings for revenue
		const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
		
		const weeklyBookings = await db.select({ totalAmount: bookings.totalAmount })
			.from(bookings)
			.innerJoin(tours, eq(bookings.tourId, tours.id))
			.where(and(
				eq(tours.userId, userId),
				gte(bookings.createdAt, weekAgo),
				eq(bookings.status, 'confirmed'),
				eq(bookings.paymentStatus, 'paid')
			));
		
		// Calculate revenue - convert decimal strings to numbers
		const revenue = weeklyBookings.reduce((sum, booking) => {
			const amount = typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : booking.totalAmount;
			return sum + (amount || 0);
		}, 0);
		
		// Return stats
		return json({
			activeTours,
			todayBookings: todayBookingsCount,
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
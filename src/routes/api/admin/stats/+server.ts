import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users, tours, bookings } from '$lib/db/schema/index.js';
import { sql, count, sum, and, gte } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get total users count
		const totalUsersResult = await db
			.select({ count: count() })
			.from(users)
			.where(sql`${users.role} != 'admin'`);
		const totalUsers = totalUsersResult[0]?.count || 0;

		// Get active users (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		
		const activeUsersResult = await db
			.select({ count: count() })
			.from(users)
			.where(
				and(
					sql`${users.role} != 'admin'`,
					gte(users.lastLogin, thirtyDaysAgo)
				)
			);
		const activeUsers = activeUsersResult[0]?.count || 0;

		// Get total revenue from bookings
		const revenueResult = await db
			.select({ total: sum(bookings.totalAmount) })
			.from(bookings)
			.where(sql`${bookings.status} = 'confirmed'`);
		const totalRevenue = Number(revenueResult[0]?.total || 0);

		// Get total bookings count
		const bookingsResult = await db
			.select({ count: count() })
			.from(bookings)
			.where(sql`${bookings.status} = 'confirmed'`);
		const totalBookings = bookingsResult[0]?.count || 0;

		// Get total tours count
		const toursResult = await db
			.select({ count: count() })
			.from(tours);
		const totalTours = toursResult[0]?.count || 0;

		// Get new users today
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);
		
		const newUsersTodayResult = await db
			.select({ count: count() })
			.from(users)
			.where(
				and(
					sql`${users.role} != 'admin'`,
					gte(users.createdAt, todayStart)
				)
			);
		const newUsersToday = newUsersTodayResult[0]?.count || 0;

		return json({
			totalUsers,
			activeUsers,
			totalRevenue,
			totalBookings,
			totalTours,
			newUsersToday
		});
	} catch (error) {
		console.error('Error fetching admin stats:', error);
		return json({ error: 'Failed to fetch stats' }, { status: 500 });
	}
}; 
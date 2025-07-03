import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users, tours, bookings } from '$lib/db/schema/index.js';
import { sql, count, sum, eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get all users
		const allUsers = await db
			.select()
			.from(users)
			.orderBy(sql`${users.createdAt} DESC`);

		// Get stats for each user
		const usersWithStats = await Promise.all(
			allUsers.map(async (user) => {
				// Get tour count
				const tourCountResult = await db
					.select({ count: count() })
					.from(tours)
					.where(eq(tours.userId, user.id));
				const tourCount = tourCountResult[0]?.count || 0;

				// Get booking count (as customer)
				const bookingCountResult = await db
					.select({ count: count() })
					.from(bookings)
					.where(eq(bookings.customerEmail, user.email));
				const bookingCount = bookingCountResult[0]?.count || 0;

				// Get total revenue (sum of bookings where they are the tour guide)
				const revenueResult = await db
					.select({ total: sum(bookings.totalAmount) })
					.from(bookings)
					.innerJoin(tours, eq(tours.id, bookings.tourId))
					.where(
						sql`${tours.userId} = ${user.id} AND ${bookings.status} = 'confirmed'`
					);
				const totalRevenue = Number(revenueResult[0]?.total || 0);

				return {
					id: user.id,
					email: user.email,
					name: user.name,
					username: user.username,
					businessName: user.businessName,
					role: user.role,
					avatar: user.avatar,
					phone: user.phone,
					website: user.website,
					description: user.description,
					location: user.location,
					country: user.country,
					currency: user.currency,
					emailVerified: user.emailVerified,
					lastLogin: user.lastLogin,
					createdAt: user.createdAt,
					subscriptionPlan: user.subscriptionPlan || 'free',
					stripeAccountId: user.stripeAccountId,
					tourCount,
					bookingCount,
					totalRevenue
				};
			})
		);

		return json(usersWithStats);
	} catch (error) {
		console.error('Error fetching users:', error);
		return json({ error: 'Failed to fetch users' }, { status: 500 });
	}
}; 
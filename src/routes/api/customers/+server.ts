import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours } from '$lib/db/schema/index.js';
import { eq, sql, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get all customers from bookings for this tour guide's tours
		const customersData = await db
			.select({
				customerEmail: bookings.customerEmail,
				// Get the most recent name and phone for each email
				customerName: sql<string>`(array_agg(${bookings.customerName} ORDER BY ${bookings.createdAt} DESC))[1]`,
				customerPhone: sql<string>`(array_agg(${bookings.customerPhone} ORDER BY ${bookings.createdAt} DESC))[1]`,
				// Aggregate booking data
				totalBookings: sql<number>`count(${bookings.id})`,
				totalSpent: sql<number>`sum(case when ${bookings.paymentStatus} = 'paid' then cast(${bookings.totalAmount} as decimal) else 0 end)`,
				totalParticipants: sql<number>`sum(${bookings.participants})`,
				firstBooking: sql<string>`min(${bookings.createdAt})`,
				lastBooking: sql<string>`max(${bookings.createdAt})`,
				// Booking status breakdown
				confirmedBookings: sql<number>`sum(case when ${bookings.status} = 'confirmed' then 1 else 0 end)`,
				pendingBookings: sql<number>`sum(case when ${bookings.status} = 'pending' then 1 else 0 end)`,
				cancelledBookings: sql<number>`sum(case when ${bookings.status} = 'cancelled' then 1 else 0 end)`,
				completedBookings: sql<number>`sum(case when ${bookings.status} = 'completed' then 1 else 0 end)`,
			})
			.from(bookings)
			.innerJoin(tours, eq(bookings.tourId, tours.id))
			.where(eq(tours.userId, locals.user.id))
			.groupBy(bookings.customerEmail)
			.orderBy(desc(sql`max(${bookings.createdAt})`)); // Order by most recent booking

		// Format the data for the frontend
		const customers = customersData.map(customer => ({
			email: customer.customerEmail,
			name: customer.customerName,
			phone: customer.customerPhone,
			totalBookings: Number(customer.totalBookings),
			totalSpent: Number(customer.totalSpent) || 0,
			totalParticipants: Number(customer.totalParticipants),
			firstBooking: customer.firstBooking,
			lastBooking: customer.lastBooking,
			confirmedBookings: Number(customer.confirmedBookings),
			pendingBookings: Number(customer.pendingBookings),
			cancelledBookings: Number(customer.cancelledBookings),
			completedBookings: Number(customer.completedBookings),
		}));

		return json(customers);
	} catch (error) {
		console.error('Error fetching customers:', error);
		return json({ error: 'Failed to fetch customers' }, { status: 500 });
	}
}; 
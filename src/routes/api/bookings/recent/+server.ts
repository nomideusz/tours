import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours } from '$lib/db/schema/index.js';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	// Check if user is admin
	const isAdmin = locals.user?.isAdmin === true || locals.user?.role === 'admin';
	if (!locals.user || !isAdmin) {
		throw error(403, 'Unauthorized - Admin only');
	}

	try {
		const limit = parseInt(url.searchParams.get('limit') || '10');

		// Fetch recent bookings with tour info
		const recentBookings = await db
			.select({
				id: bookings.id,
				bookingReference: bookings.bookingReference,
				customerName: bookings.customerName,
				customerEmail: bookings.customerEmail,
				participants: bookings.participants,
				totalAmount: bookings.totalAmount,
				status: bookings.status,
				createdAt: bookings.createdAt,
				tourId: bookings.tourId,
				tour: {
					id: tours.id,
					name: tours.name
				}
			})
			.from(bookings)
			.leftJoin(tours, eq(bookings.tourId, tours.id))
			.orderBy(desc(bookings.createdAt))
			.limit(limit);

		return json(recentBookings);
	} catch (err) {
		console.error('Error fetching recent bookings:', err);
		throw error(500, 'Failed to fetch recent bookings');
	}
};


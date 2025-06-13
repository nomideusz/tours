import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours } from '$lib/db/schema/index.js';
import { eq, desc, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const limitParam = url.searchParams.get('limit');
		const limit = Math.min(parseInt(limitParam || '10', 10), 50); // Cap at 50
		
		// Get user's tour IDs
		const userTours = await db.select({ id: tours.id, name: tours.name })
			.from(tours)
			.where(eq(tours.userId, locals.user.id));
		
		const tourIds = userTours.map(t => t.id);
		
		if (tourIds.length === 0) {
			return json([]);
		}

		// Get bookings - minimal data only
		const bookingsData = await db.select({
			id: bookings.id,
			tourId: bookings.tourId,
			customerName: bookings.customerName,
			participants: bookings.participants,
			status: bookings.status,
			createdAt: bookings.createdAt,
			totalAmount: bookings.totalAmount
		})
		.from(bookings)
		.where(inArray(bookings.tourId, tourIds))
		.orderBy(desc(bookings.createdAt))
		.limit(limit);
		
		// Minimal processing
		const result = bookingsData.map(booking => ({
			id: booking.id,
			customerName: booking.customerName || 'Unknown',
			participants: booking.participants || 1,
			status: booking.status || 'pending',
			created: booking.createdAt || new Date().toISOString(),
			tour: userTours.find(t => t.id === booking.tourId)?.name || 'Unknown Tour',
			totalAmount: Number(booking.totalAmount) || 0,
			effectiveDate: booking.createdAt || new Date().toISOString()
		}));
		
		return json(result);
	} catch (error) {
		console.error('Minimal bookings error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
}; 
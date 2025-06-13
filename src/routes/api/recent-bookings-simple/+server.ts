import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots } from '$lib/db/schema/index.js';
import { eq, desc, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		console.log('[recent-bookings-simple] Request started', { userId: locals.user?.id });
		
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get limit from query params, default to 10
		const limitParam = url.searchParams.get('limit');
		const limit = limitParam ? parseInt(limitParam, 10) : 10;
		
		// Validate limit
		if (isNaN(limit) || limit < 1 || limit > 200) {
			return json({ error: 'Invalid limit parameter' }, { status: 400 });
		}
		
		console.log('[recent-bookings-simple] Fetching bookings with limit:', limit);

		// Step 1: Get user's tour IDs first
		console.log('[recent-bookings-simple] Step 1: Getting user tours');
		const userTours = await db.select({ id: tours.id, name: tours.name })
			.from(tours)
			.where(eq(tours.userId, locals.user.id));
		
		const tourIds = userTours.map(t => t.id);
		console.log('[recent-bookings-simple] Found tours:', tourIds.length);
		
		if (tourIds.length === 0) {
			return json([]); // No tours, no bookings
		}

		// Step 2: Get bookings for those tours (simple query, no joins)
		console.log('[recent-bookings-simple] Step 2: Getting bookings');
		const bookingsData = await db.select({
			id: bookings.id,
			tourId: bookings.tourId,
			customerName: bookings.customerName,
			customerEmail: bookings.customerEmail,
			participants: bookings.participants,
			status: bookings.status,
			createdAt: bookings.createdAt,
			totalAmount: bookings.totalAmount,
			paymentStatus: bookings.paymentStatus,
			timeSlotId: bookings.timeSlotId
		})
		.from(bookings)
		.where(inArray(bookings.tourId, tourIds))
		.orderBy(desc(bookings.createdAt))
		.limit(Math.min(limit, 100));
		
		console.log('[recent-bookings-simple] Found bookings:', bookingsData.length);

		// Step 3: Create tour name map from already fetched data
		const tourNameMap = new Map(userTours.map(t => [t.id, t.name]));

		// Step 4: Process bookings with safe date handling
		console.log('[recent-bookings-simple] Step 4: Processing bookings');
		const processedBookings = bookingsData.map(booking => {
			// Safe date conversion
			const createdAt = booking.createdAt ? new Date(booking.createdAt) : new Date();
			const createdAtStr = !isNaN(createdAt.getTime()) ? createdAt.toISOString() : new Date().toISOString();
			
			return {
				id: booking.id,
				customerName: booking.customerName || '',
				customerEmail: booking.customerEmail || '',
				participants: booking.participants || 1,
				status: booking.status || 'pending',
				created: createdAtStr,
				updated: createdAtStr,
				tour: tourNameMap.get(booking.tourId) || 'Unknown Tour',
				tourName: tourNameMap.get(booking.tourId) || 'Unknown Tour',
				totalAmount: typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) || 0 : (booking.totalAmount || 0),
				paymentStatus: booking.paymentStatus || 'pending',
				effectiveDate: createdAtStr, // Simple fallback for now
				// Don't include timeSlot at all if we don't have the data
				timeSlot: undefined
			};
		});
		
		console.log('[recent-bookings-simple] Returning processed bookings:', processedBookings.length);
		
		return json(processedBookings, {
			headers: {
				'Cache-Control': 'max-age=60, stale-while-revalidate=30'
			}
		});
	} catch (error) {
		console.error('Error in simple recent bookings:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}; 
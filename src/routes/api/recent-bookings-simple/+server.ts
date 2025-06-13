import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots } from '$lib/db/schema/index.js';
import { eq, desc, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
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

		// Step 1: Get user's tour IDs first
		const userTours = await db.select({ id: tours.id })
			.from(tours)
			.where(eq(tours.userId, locals.user.id));
		
		const tourIds = userTours.map(t => t.id);
		
		if (tourIds.length === 0) {
			return json([]); // No tours, no bookings
		}

		// Step 2: Get bookings for those tours (simple query, no joins)
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

		// Step 3: Get tour names in a simple map
		const tourMap = new Map(userTours.map(t => [t.id, t]));
		
		// Get tour details for the bookings
		const tourDetails = await db.select({
			id: tours.id,
			name: tours.name
		})
		.from(tours)
		.where(eq(tours.userId, locals.user.id));
		
		const tourNameMap = new Map(tourDetails.map(t => [t.id, t.name]));

		// Step 4: Process bookings with safe date handling
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
				// Minimal time slot info - will be fetched separately if needed
				timeSlot: booking.timeSlotId ? {
					id: booking.timeSlotId,
					startTime: null,
					endTime: null
				} : undefined
			};
		});
		
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
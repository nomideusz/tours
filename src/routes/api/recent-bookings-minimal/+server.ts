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

		// Get bookings with time slot data
		const bookingsData = await db.select({
			id: bookings.id,
			tourId: bookings.tourId,
			timeSlotId: bookings.timeSlotId,
			customerName: bookings.customerName,
			participants: bookings.participants,
			status: bookings.status,
			createdAt: bookings.createdAt,
			totalAmount: bookings.totalAmount,
			// Time slot fields
			timeSlotStartTime: timeSlots.startTime,
			timeSlotEndTime: timeSlots.endTime
		})
		.from(bookings)
		.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
		.where(inArray(bookings.tourId, tourIds))
		.orderBy(desc(bookings.createdAt))
		.limit(limit);
		
		// Process bookings with time slot data
		const result = bookingsData.map(booking => {
			// Safe date conversion
			const createdAt = booking.createdAt ? new Date(booking.createdAt) : new Date();
			const createdAtStr = !isNaN(createdAt.getTime()) ? createdAt.toISOString() : new Date().toISOString();
			
			// Handle time slot dates safely
			let timeSlotData = undefined;
			let effectiveDateStr = createdAtStr;
			
			if (booking.timeSlotStartTime && booking.timeSlotEndTime) {
				const startDate = new Date(booking.timeSlotStartTime);
				const endDate = new Date(booking.timeSlotEndTime);
				
				if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
					timeSlotData = {
						id: booking.timeSlotId,
						startTime: startDate.toISOString(),
						endTime: endDate.toISOString()
					};
					effectiveDateStr = startDate.toISOString();
				}
			}
			
			return {
				id: booking.id,
				tourId: booking.tourId,
				customerName: booking.customerName || 'Unknown',
				participants: booking.participants || 1,
				status: booking.status || 'pending',
				created: createdAtStr,
				tour: userTours.find(t => t.id === booking.tourId)?.name || 'Unknown Tour',
				totalAmount: Number(booking.totalAmount) || 0,
				effectiveDate: effectiveDateStr,
				timeSlot: timeSlotData
			};
		});
		
		return json(result);
	} catch (error) {
		console.error('Minimal bookings error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
}; 
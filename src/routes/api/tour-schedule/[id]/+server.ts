import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots, bookings } from '$lib/db/schema/index.js';
import { eq, and, gte, desc, count, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, params }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!params.id) {
			return json({ error: 'Tour ID required' }, { status: 400 });
		}

		const tourId = params.id;
		const userId = locals.user.id;

		// Step 1: Get tour data (simple query, no JOINs)
		const [tour] = await db
			.select({
				id: tours.id,
				name: tours.name,
				capacity: tours.capacity,
				duration: tours.duration,
				status: tours.status
			})
			.from(tours)
			.where(and(
				eq(tours.id, tourId),
				eq(tours.userId, userId)
			))
			.limit(1);

		if (!tour) {
			return json({ error: 'Tour not found' }, { status: 404 });
		}

		// Step 2: Get all time slots for this tour (simple query)
		const allTimeSlots = await db
			.select({
				id: timeSlots.id,
				startTime: timeSlots.startTime,
				endTime: timeSlots.endTime,
				availableSpots: timeSlots.availableSpots,
				bookedSpots: timeSlots.bookedSpots,
				status: timeSlots.status,
				createdAt: timeSlots.createdAt
			})
			.from(timeSlots)
			.where(eq(timeSlots.tourId, tourId))
			.orderBy(timeSlots.startTime);

		// Step 3: Get booking counts per time slot (simple aggregation)
		const slotBookingCounts = await db
			.select({
				timeSlotId: bookings.timeSlotId,
				totalBookings: count(bookings.id),
				confirmedBookings: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'confirmed' THEN 1 ELSE 0 END), 0)`,
				pendingBookings: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'pending' THEN 1 ELSE 0 END), 0)`,
				totalParticipants: sql<number>`COALESCE(SUM(${bookings.participants}), 0)`
			})
			.from(bookings)
			.where(eq(bookings.tourId, tourId))
			.groupBy(bookings.timeSlotId);

		// Step 4: Create booking count map for easy lookup
		const bookingCountMap = new Map(
			slotBookingCounts.map(count => [
				count.timeSlotId,
				{
					totalBookings: Number(count.totalBookings || 0),
					confirmedBookings: Number(count.confirmedBookings || 0),
					pendingBookings: Number(count.pendingBookings || 0),
					totalParticipants: Number(count.totalParticipants || 0)
				}
			])
		);

		// Step 5: Process time slots with booking data
		const now = new Date();
		const processedTimeSlots = allTimeSlots.map(slot => {
			const bookingData = bookingCountMap.get(slot.id) || {
				totalBookings: 0,
				confirmedBookings: 0,
				pendingBookings: 0,
				totalParticipants: 0
			};

			const startTime = slot.startTime ? new Date(slot.startTime) : new Date();
			const endTime = slot.endTime ? new Date(slot.endTime) : new Date();
			const isPast = startTime < now;
			
			// slot.availableSpots in DB = capacity (max people who can book)
			// slot.bookedSpots in DB = currently booked spots (should match totalBookings)
			const slotCapacity = slot.availableSpots || tour.capacity;
			
			// Use database bookedSpots if available, fallback to calculated totalBookings
			const bookedSpots = slot.bookedSpots || bookingData.totalBookings;
			const remainingSpots = Math.max(0, slotCapacity - bookedSpots);
			
			// Debug logging
			if (bookingData.totalBookings > 0) {
				console.log(`Slot ${slot.id}: DB_capacity=${slot.availableSpots}, DB_booked=${slot.bookedSpots}, calculated_bookings=${bookingData.totalBookings}, remaining=${remainingSpots}`);
			}
			
			return {
				id: slot.id,
				startTime: slot.startTime ? slot.startTime.toISOString() : new Date().toISOString(),
				endTime: slot.endTime ? slot.endTime.toISOString() : new Date().toISOString(),
				capacity: slotCapacity,
				bookedSpots: bookedSpots,
				status: slot.status || 'active',
				isPast,
				isUpcoming: !isPast,
				availableSpots: remainingSpots,
				...bookingData,
				created: slot.createdAt ? slot.createdAt.toISOString() : new Date().toISOString()
			};
		});

		// Step 6: Calculate schedule statistics
		const upcomingSlots = processedTimeSlots.filter(slot => !slot.isPast);
		const pastSlots = processedTimeSlots.filter(slot => slot.isPast);
		
		const scheduleStats = {
			totalSlots: processedTimeSlots.length,
			upcomingSlots: upcomingSlots.length,
			pastSlots: pastSlots.length,
			totalBookings: processedTimeSlots.reduce((sum, slot) => sum + slot.totalBookings, 0),
			pendingBookings: processedTimeSlots.reduce((sum, slot) => sum + slot.pendingBookings, 0),
			totalParticipants: processedTimeSlots.reduce((sum, slot) => sum + slot.totalParticipants, 0),
			averageBookingRate: processedTimeSlots.length > 0 
				? Math.round((processedTimeSlots.filter(slot => slot.totalBookings > 0).length / processedTimeSlots.length) * 100)
				: 0
		};

		return json({
			tour: {
				id: tour.id,
				name: tour.name,
				capacity: tour.capacity,
				duration: tour.duration,
				status: tour.status
			},
			timeSlots: processedTimeSlots,
			scheduleStats
		});

	} catch (error) {
		console.error('Tour schedule API error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
}; 
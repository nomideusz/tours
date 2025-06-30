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
			.select()
			.from(tours)
			.where(and(
				eq(tours.id, tourId),
				eq(tours.userId, userId)
			))
			.limit(1);

		if (!tour) {
			return json({ error: 'Tour not found' }, { status: 404 });
		}

		// Step 2: Get upcoming time slots (simple query)
		const now = new Date();
		const upcomingSlots = await db
			.select({
				id: timeSlots.id,
				startTime: timeSlots.startTime,
				endTime: timeSlots.endTime,
				bookedSpots: timeSlots.bookedSpots,
				status: timeSlots.status
			})
			.from(timeSlots)
			.where(and(
				eq(timeSlots.tourId, tourId),
				gte(timeSlots.startTime, now)
			))
			.orderBy(timeSlots.startTime)
			.limit(10);

		// Step 3: Get recent bookings (simple query)
		const recentBookings = await db
			.select({
				id: bookings.id,
				customerName: bookings.customerName,
				customerEmail: bookings.customerEmail,
				participants: bookings.participants,
				totalAmount: bookings.totalAmount,
				status: bookings.status,
				createdAt: bookings.createdAt
			})
			.from(bookings)
			.where(eq(bookings.tourId, tourId))
			.orderBy(desc(bookings.createdAt))
			.limit(10);

		// Step 4: Calculate stats (simple aggregations)
		const [tourStats] = await db
			.select({
				totalBookings: count(bookings.id),
				totalRevenue: sql<number>`COALESCE(SUM(CAST(${bookings.totalAmount} AS DECIMAL)), 0)`,
				totalParticipants: sql<number>`COALESCE(SUM(${bookings.participants}), 0)`,
				confirmedBookings: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'confirmed' THEN 1 ELSE 0 END), 0)`,
				pendingBookings: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'pending' THEN 1 ELSE 0 END), 0)`
			})
			.from(bookings)
			.where(eq(bookings.tourId, tourId));

		// Step 5: Check for future bookings (for delete button logic)
		const futureBookingsCount = await db
			.select({
				count: sql<number>`COUNT(*)`
			})
			.from(bookings)
			.innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.where(and(
				eq(bookings.tourId, tourId),
				eq(bookings.status, 'confirmed'),
				gte(timeSlots.startTime, now)
			));

		const hasFutureBookings = Number(futureBookingsCount[0]?.count || 0) > 0;
		console.log(`🔍 Tour ${tourId} future bookings check:`, {
			futureBookingsCount: Number(futureBookingsCount[0]?.count || 0),
			hasFutureBookings,
			now: now.toISOString()
		});

		// Step 6: Process data safely
		const processedTour = {
			...tour,
			price: tour.price ? parseFloat(tour.price) : 0,
			created: tour.createdAt ? tour.createdAt.toISOString() : new Date().toISOString(),
			updated: tour.updatedAt ? tour.updatedAt.toISOString() : new Date().toISOString(),
			upcomingSlots: upcomingSlots.filter(slot => slot.status === 'available').length,
			hasFutureBookings: hasFutureBookings
		};

		const processedUpcomingSlots = upcomingSlots.map(slot => ({
			...slot,
			startTime: slot.startTime ? slot.startTime.toISOString() : new Date().toISOString(),
			endTime: slot.endTime ? slot.endTime.toISOString() : new Date().toISOString()
		}));

		const processedRecentBookings = recentBookings.map(booking => ({
			...booking,
			totalAmount: booking.totalAmount ? parseFloat(booking.totalAmount) : 0,
			createdAt: booking.createdAt ? booking.createdAt.toISOString() : new Date().toISOString()
		}));

		const processedStats = {
			totalBookings: Number(tourStats?.totalBookings || 0),
			totalRevenue: Number(tourStats?.totalRevenue || 0),
			totalParticipants: Number(tourStats?.totalParticipants || 0),
			confirmedBookings: Number(tourStats?.confirmedBookings || 0),
			pendingBookings: Number(tourStats?.pendingBookings || 0),
			totalSlots: upcomingSlots.length,
			upcomingSlots: upcomingSlots.length,
			qrScans: tour.qrScans || 0,
			qrConversions: tour.qrConversions || 0,
			// Calculate conversion rate
			conversionRate: (tour.qrScans || 0) > 0 ? ((tour.qrConversions || 0) / (tour.qrScans || 0)) * 100 : 0,
			recentBookings: processedRecentBookings
		};

		return json({
			tour: processedTour,
			stats: processedStats,
			upcomingSlots: processedUpcomingSlots,
			recentBookings: processedRecentBookings
		});

	} catch (error) {
		console.error('Tour details API error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
}; 
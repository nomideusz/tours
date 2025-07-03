import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots, bookings } from '$lib/db/schema/index.js';
import { eq, and, gte, desc, count, sql, between } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, params, url }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!params.id) {
			return json({ error: 'Tour ID required' }, { status: 400 });
		}

		const tourId = params.id;
		const userId = locals.user.id;
		
		// Get time range from query params (defaults to 'all' for backward compatibility)
		const timeRange = url.searchParams.get('range') || 'all';
		
		// Calculate date range based on timeRange parameter
		const now = new Date();
		let startDate: Date | null = null;
		
		switch (timeRange) {
			case 'week':
				startDate = new Date();
				startDate.setDate(startDate.getDate() - 7);
				break;
			case 'month':
				startDate = new Date();
				startDate.setMonth(startDate.getMonth() - 1);
				break;
			case 'quarter':
				startDate = new Date();
				startDate.setMonth(startDate.getMonth() - 3);
				break;
			case 'year':
				startDate = new Date();
				startDate.setFullYear(startDate.getFullYear() - 1);
				break;
			case 'all':
			default:
				// No date filtering for all time
				startDate = null;
				break;
		}

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
		const recentBookingsQuery = db
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
			
		const recentBookings = await recentBookingsQuery;

		// Step 4: Calculate stats (with time filtering)
		const statsConditions = [eq(bookings.tourId, tourId)];
		
		// Add date filtering if not "all time"
		if (startDate) {
			statsConditions.push(gte(bookings.createdAt, startDate));
		}
		
		const [tourStats] = await db
			.select({
				totalBookings: count(bookings.id),
				totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} IN ('confirmed', 'completed') AND ${bookings.paymentStatus} = 'paid' THEN CAST(${bookings.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
				totalParticipants: sql<number>`COALESCE(SUM(${bookings.participants}), 0)`,
				confirmedBookings: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'confirmed' THEN 1 ELSE 0 END), 0)`,
				pendingBookings: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'pending' THEN 1 ELSE 0 END), 0)`
			})
			.from(bookings)
			.where(and(...statsConditions));
			
		// Calculate previous period stats for trends (only if not "all time")
		let previousPeriodStats = null;
		if (startDate && timeRange !== 'all') {
			const previousStartDate = new Date(startDate);
			const previousEndDate = new Date(startDate);
			
			// Calculate previous period dates
			switch (timeRange) {
				case 'week':
					previousStartDate.setDate(previousStartDate.getDate() - 7);
					break;
				case 'month':
					previousStartDate.setMonth(previousStartDate.getMonth() - 1);
					break;
				case 'quarter':
					previousStartDate.setMonth(previousStartDate.getMonth() - 3);
					break;
				case 'year':
					previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
					break;
			}
			
			const [prevStats] = await db
				.select({
					totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} IN ('confirmed', 'completed') AND ${bookings.paymentStatus} = 'paid' THEN CAST(${bookings.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
					totalBookings: count(bookings.id)
				})
				.from(bookings)
				.where(and(
					eq(bookings.tourId, tourId),
					between(bookings.createdAt, previousStartDate, previousEndDate)
				));
				
			previousPeriodStats = prevStats;
		}

		// Step 5: Check for future bookings (for delete button logic)
		// Include both confirmed AND pending bookings to prevent deletion during payment processing
		const futureBookingsCount = await db
			.select({
				count: sql<number>`COUNT(*)`
			})
			.from(bookings)
			.innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.where(and(
				eq(bookings.tourId, tourId),
				sql`${bookings.status} IN ('confirmed', 'pending')`,
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
			recentBookings: processedRecentBookings,
			// Add time range info
			timeRange: timeRange,
			// Add trend data if available
			trends: previousPeriodStats ? {
				revenueTrend: previousPeriodStats.totalRevenue > 0 
					? Math.round(((Number(tourStats?.totalRevenue || 0) - previousPeriodStats.totalRevenue) / previousPeriodStats.totalRevenue) * 100)
					: 0,
				bookingsTrend: previousPeriodStats.totalBookings > 0
					? Math.round(((Number(tourStats?.totalBookings || 0) - previousPeriodStats.totalBookings) / previousPeriodStats.totalBookings) * 100)
					: 0
			} : null
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
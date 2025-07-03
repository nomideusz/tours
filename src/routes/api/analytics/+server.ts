import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, users, timeSlots } from '$lib/db/schema/index.js';
import { and, eq, gte, lte, sql, desc, inArray, count, sum, between } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = locals.user.id;
		const timeRange = url.searchParams.get('range') || 'month';
		const tourId = url.searchParams.get('tourId') || null; // Optional tour filter
		
		// Calculate date range
		const now = new Date();
		let startDate: Date;
		let previousStartDate: Date;
		let previousEndDate: Date;
		
		switch (timeRange) {
			case 'week':
				startDate = new Date();
				startDate.setDate(startDate.getDate() - 7);
				previousStartDate = new Date();
				previousStartDate.setDate(previousStartDate.getDate() - 14);
				previousEndDate = new Date();
				previousEndDate.setDate(previousEndDate.getDate() - 7);
				break;
			case 'month':
				startDate = new Date();
				startDate.setMonth(startDate.getMonth() - 1);
				previousStartDate = new Date();
				previousStartDate.setMonth(previousStartDate.getMonth() - 2);
				previousEndDate = new Date();
				previousEndDate.setMonth(previousEndDate.getMonth() - 1);
				break;
			case 'quarter':
				startDate = new Date();
				startDate.setMonth(startDate.getMonth() - 3);
				previousStartDate = new Date();
				previousStartDate.setMonth(previousStartDate.getMonth() - 6);
				previousEndDate = new Date();
				previousEndDate.setMonth(previousEndDate.getMonth() - 3);
				break;
			case 'year':
				startDate = new Date();
				startDate.setFullYear(startDate.getFullYear() - 1);
				previousStartDate = new Date();
				previousStartDate.setFullYear(previousStartDate.getFullYear() - 2);
				previousEndDate = new Date();
				previousEndDate.setFullYear(previousEndDate.getFullYear() - 1);
				break;
			default:
				startDate = new Date();
				startDate.setMonth(startDate.getMonth() - 1);
				previousStartDate = new Date();
				previousStartDate.setMonth(previousStartDate.getMonth() - 2);
				previousEndDate = new Date();
				previousEndDate.setMonth(previousEndDate.getMonth() - 1);
		}
		
		// Build base conditions for bookings
		const baseConditions = [
			sql`${bookings.status} IN ('confirmed', 'completed')`,
			gte(bookings.createdAt, startDate)
		];
		
		// Add tour filter if specified
		let tourIds: string[] = [];
		if (tourId) {
			baseConditions.push(eq(bookings.tourId, tourId));
			tourIds = [tourId];
		} else {
			// Only include user's bookings if not filtering by tour
			const userTours = await db
				.select({ id: tours.id })
				.from(tours)
				.where(eq(tours.userId, userId));
			
			tourIds = userTours.map(tour => tour.id);
			if (tourIds.length > 0) {
				baseConditions.push(sql`${bookings.tourId} IN (${sql.raw(tourIds.map(id => `'${id}'`).join(', '))})`);
			}
		}
		
		// Revenue and bookings for current period
		const [currentPeriod] = await db
			.select({
				totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.paymentStatus} = 'paid' THEN CAST(${bookings.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
				totalBookings: count(bookings.id),
				totalParticipants: sql<number>`COALESCE(SUM(${bookings.participants}), 0)`
			})
			.from(bookings)
			.where(and(...baseConditions));
		
		// Previous period conditions
		const prevConditions = [
			sql`${bookings.status} IN ('confirmed', 'completed')`,
			between(bookings.createdAt, previousStartDate, previousEndDate)
		];
		
		if (tourId) {
			prevConditions.push(eq(bookings.tourId, tourId));
		} else if (tourIds && tourIds.length > 0) {
			prevConditions.push(sql`${bookings.tourId} IN (${sql.raw(tourIds.map(id => `'${id}'`).join(', '))})`);
		}
		
		// Revenue and bookings for previous period (for trend calculation)
		const [previousPeriod] = await db
			.select({
				totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.paymentStatus} = 'paid' THEN CAST(${bookings.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
				totalBookings: count(bookings.id)
			})
			.from(bookings)
			.where(and(...prevConditions));
		
		// Calculate trends
		const revenueTrend = previousPeriod.totalRevenue > 0 
			? Math.round(((currentPeriod.totalRevenue - previousPeriod.totalRevenue) / previousPeriod.totalRevenue) * 100)
			: 0;
		
		const bookingsTrend = previousPeriod.totalBookings > 0
			? Math.round(((currentPeriod.totalBookings - previousPeriod.totalBookings) / previousPeriod.totalBookings) * 100)
			: 0;
		
		// Get the actual bookings data for detailed analysis
		const periodBookings = await db
			.select({
				id: bookings.id,
				tourId: bookings.tourId,
				totalAmount: bookings.totalAmount,
				status: bookings.status,
				paymentStatus: bookings.paymentStatus,
				createdAt: bookings.createdAt,
				customerEmail: bookings.customerEmail,
				source: bookings.source,
				sourceQrCode: bookings.sourceQrCode,
				participants: bookings.participants,
			})
			.from(bookings)
			.where(and(...baseConditions));

		// Get unique customers and identify new vs returning
		const currentCustomers = new Set(periodBookings.map(b => b.customerEmail).filter(Boolean));
		const allTimeCustomersBeforePeriod = await db
			.select({ customerEmail: bookings.customerEmail })
			.from(bookings)
			.where(
				and(
					tourIds.length > 0 ? sql`${bookings.tourId} IN (${sql.raw(tourIds.map(id => `'${id}'`).join(', '))})` : sql`1=1`,
					sql`${bookings.status} IN ('confirmed', 'completed')`,
					lte(bookings.createdAt, startDate)
				)
			);
		
		const previousCustomerEmails = new Set(allTimeCustomersBeforePeriod.map(b => b.customerEmail).filter(Boolean));
		const newCustomers = Array.from(currentCustomers).filter(email => !previousCustomerEmails.has(email));
		const returningCustomers = Array.from(currentCustomers).filter(email => previousCustomerEmails.has(email));

		// Get tour performance
		const tourPerformance = await db
			.select({
				id: tours.id,
				name: tours.name,
				bookingCount: sql<number>`COUNT(DISTINCT ${bookings.id})`,
				revenue: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.paymentStatus} = 'paid' THEN ${bookings.totalAmount} ELSE 0 END), 0)`,
				participants: sql<number>`COALESCE(SUM(${bookings.participants}), 0)`,
				qrScans: tours.qrScans,
				qrConversions: tours.qrConversions,
			})
			.from(tours)
			.leftJoin(
				bookings,
				and(
					eq(bookings.tourId, tours.id),
					sql`${bookings.status} IN ('confirmed', 'completed')`,
					gte(bookings.createdAt, startDate)
				)
			)
			.where(eq(tours.userId, userId))
			.groupBy(tours.id, tours.name, tours.qrScans, tours.qrConversions)
			.orderBy(desc(sql`COALESCE(SUM(CASE WHEN ${bookings.paymentStatus} = 'paid' THEN ${bookings.totalAmount} ELSE 0 END), 0)`))
			.limit(10);

		// Calculate QR code metrics
		const totalQrScans = tourPerformance.reduce((sum, t) => sum + (t.qrScans || 0), 0);
		const totalQrConversions = tourPerformance.reduce((sum, t) => sum + (t.qrConversions || 0), 0);
		const qrConversionRate = totalQrScans > 0 ? Math.round((totalQrConversions / totalQrScans) * 100) : 0;

		// Format popular tours
		const popularTours = tourPerformance.map(tour => ({
			id: tour.id || '',
			name: tour.name || 'Unknown Tour',
			bookings: Number(tour.bookingCount || 0),
			revenue: Number(tour.revenue || 0),
			participants: Number(tour.participants || 0),
			avgValue: Number(tour.bookingCount || 0) > 0 
				? Number(tour.revenue || 0) / Number(tour.bookingCount || 0)
				: 0,
		}));

		// Source analytics
		const sourceData = periodBookings.reduce((acc: Record<string, any>, booking) => {
			const source = booking.source || 'direct';
			if (!acc[source]) {
				acc[source] = { count: 0, revenue: 0 };
			}
			acc[source].count++;
			// Only count revenue if payment is confirmed
			if (booking.paymentStatus === 'paid') {
				acc[source].revenue += Number(booking.totalAmount || 0);
			}
			return acc;
		}, {});
		
		const sourceAnalytics = Object.entries(sourceData).map(([source, data]: [string, any]) => ({
			source,
			bookings: data.count,
			revenue: data.revenue,
			percentage: Math.round((data.count / currentPeriod.totalBookings) * 100) || 0,
		})).sort((a, b) => b.bookings - a.bookings);

		// Peak times analysis - get bookings by hour of day
		let peakTimes: any[] = [];
		try {
			const bookingsByHour = await db
				.select({
					hour: sql<number>`EXTRACT(HOUR FROM ${timeSlots.startTime})`,
					count: count(),
				})
				.from(bookings)
				.innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
				.where(
					and(
						sql`${bookings.status} IN ('confirmed', 'completed')`,
						gte(bookings.createdAt, startDate)
					)
				)
				.groupBy(sql`EXTRACT(HOUR FROM ${timeSlots.startTime})`)
				.orderBy(desc(count()));

			peakTimes = bookingsByHour.map(item => ({
				hour: Number(item.hour),
				bookings: Number(item.count),
				label: `${String(item.hour).padStart(2, '0')}:00`,
			}));
		} catch (err) {
			console.error('Peak times query error:', err);
		}

		// Generate chart data
		const chartData = generateChartData(periodBookings, startDate, now, timeRange);

		// Customer retention rate
		const retentionRate = currentCustomers.size > 0
			? Math.round((returningCustomers.length / currentCustomers.size) * 100)
			: 0;

		return json({
			revenue: { 
				total: currentPeriod.totalRevenue || 0, 
				trend: revenueTrend || 0,
				chartData: chartData.revenue,
			},
			bookings: { 
				total: currentPeriod.totalBookings || 0, 
				trend: bookingsTrend || 0,
				chartData: chartData.bookings,
			},
			customers: { 
				total: currentCustomers.size || 0, 
				new: newCustomers.length || 0,
				returning: returningCustomers.length || 0,
			},
			tours: { 
				views: totalQrScans || 0, 
				bookings: currentPeriod.totalBookings || 0, 
				conversionRate: qrConversionRate || 0,
			},
			qrCodes: { 
				scans: totalQrScans || 0, 
				conversions: totalQrConversions || 0, 
				conversionRate: qrConversionRate || 0,
			},
			popularTours: popularTours || [],
			peakTimes: peakTimes || [],
			sourceAnalytics: sourceAnalytics || [],
			customerRetention: {
				rate: retentionRate,
				returningCustomers: returningCustomers.length,
			},
		});
	} catch (err) {
		console.error('Analytics error:', err);
		throw error(500, 'Failed to fetch analytics data');
	}
};

// Helper function to generate chart data
function generateChartData(
	bookings: any[], 
	startDate: Date, 
	endDate: Date, 
	range: string
): { revenue: any[], bookings: any[] } {
	const revenueData: any[] = [];
	const bookingsData: any[] = [];
	
	// Group data by appropriate time period
	const groupedData = new Map<string, { revenue: number, count: number }>();
	
	bookings.forEach(booking => {
		const date = new Date(booking.createdAt);
		let key: string;
		
		switch (range) {
			case 'week':
			case 'month':
				// Group by day
				key = date.toISOString().split('T')[0];
				break;
			case 'quarter':
				// Group by week
				const weekStart = new Date(date);
				weekStart.setDate(date.getDate() - date.getDay());
				key = weekStart.toISOString().split('T')[0];
				break;
			case 'year':
				// Group by month
				key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
				break;
			default:
				key = date.toISOString().split('T')[0];
		}
		
		if (!groupedData.has(key)) {
			groupedData.set(key, { revenue: 0, count: 0 });
		}
		
		const data = groupedData.get(key)!;
		// Only count revenue if payment is confirmed
		if (booking.paymentStatus === 'paid') {
			data.revenue += Number(booking.totalAmount || 0);
		}
		data.count += 1;
	});
	
	// Convert to array format for charts
	groupedData.forEach((data, date) => {
		revenueData.push({ date, value: data.revenue });
		bookingsData.push({ date, value: data.count });
	});
	
	// Sort by date
	revenueData.sort((a, b) => a.date.localeCompare(b.date));
	bookingsData.sort((a, b) => a.date.localeCompare(b.date));
	
	return { revenue: revenueData, bookings: bookingsData };
} 
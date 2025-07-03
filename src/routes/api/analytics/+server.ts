import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, users, timeSlots } from '$lib/db/schema/index.js';
import { and, eq, gte, lte, sql, desc, inArray, count, sum } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const range = url.searchParams.get('range') || 'month';
	const userId = locals.user.id;

	// Calculate date range
	const now = new Date();
	let startDate: Date;
	let previousStartDate: Date;
	
	switch (range) {
		case 'week':
			startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		case 'month':
			startDate = new Date(now.getFullYear(), now.getMonth(), 1);
			previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			break;
		case 'quarter':
			startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
			previousStartDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
			break;
		case 'year':
			startDate = new Date(now.getFullYear(), 0, 1);
			previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
			break;
		case 'all':
			// Show all data for debugging
			startDate = new Date(2020, 0, 1); // Very old date
			previousStartDate = new Date(2019, 0, 1);
			break;
		default:
			startDate = new Date(now.getFullYear(), now.getMonth(), 1);
			previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	}

	try {
		// Get user's tours
		const userTours = await db
			.select({ id: tours.id })
			.from(tours)
			.where(eq(tours.userId, userId));
		
		const tourIds = userTours.map(t => t.id);
		
		console.log('[Analytics Debug] User ID:', userId);
		console.log('[Analytics Debug] User tours found:', userTours.length);
		console.log('[Analytics Debug] Tour IDs:', tourIds);
		console.log('[Analytics Debug] Date range:', { startDate, endDate: now, range });
		
		if (tourIds.length === 0) {
			// Return empty analytics if no tours
			return json({
				revenue: { total: 0, trend: 0, chartData: [] },
				bookings: { total: 0, trend: 0, chartData: [] },
				customers: { total: 0, new: 0, returning: 0 },
				tours: { views: 0, bookings: 0, conversionRate: 0 },
				qrCodes: { scans: 0, conversions: 0, conversionRate: 0 },
				popularTours: [],
				peakTimes: [],
				sourceAnalytics: [],
				customerRetention: { rate: 0, returningCustomers: 0 },
			});
		}

		// Debug: Get ALL bookings for these tours to check data
		const allBookings = await db
			.select({
				id: bookings.id,
				tourId: bookings.tourId,
				status: bookings.status,
				createdAt: bookings.createdAt,
				totalAmount: bookings.totalAmount,
			})
			.from(bookings)
			.where(inArray(bookings.tourId, tourIds));

		console.log('[Analytics Debug] ALL bookings for user tours:', allBookings.length);
		console.log('[Analytics Debug] Sample bookings:', allBookings.slice(0, 3).map(b => ({
			id: b.id,
			status: b.status,
			createdAt: b.createdAt,
			amount: b.totalAmount
		})));

		// Get bookings for current and previous periods
		const [periodBookings, previousPeriodBookings] = await Promise.all([
			db
				.select({
					id: bookings.id,
					tourId: bookings.tourId,
					totalAmount: bookings.totalAmount,
					status: bookings.status,
					createdAt: bookings.createdAt,
					customerEmail: bookings.customerEmail,
					source: bookings.source,
					sourceQrCode: bookings.sourceQrCode,
					participants: bookings.participants,
				})
				.from(bookings)
				.where(
					and(
						inArray(bookings.tourId, tourIds),
						gte(bookings.createdAt, startDate),
						lte(bookings.createdAt, now)
					)
				),
			db
				.select({
					totalAmount: bookings.totalAmount,
					status: bookings.status,
				})
				.from(bookings)
				.where(
					and(
						inArray(bookings.tourId, tourIds),
						gte(bookings.createdAt, previousStartDate),
						lte(bookings.createdAt, startDate)
					)
				)
		]);

		console.log('[Analytics Debug] Period bookings found:', periodBookings.length);
		console.log('[Analytics Debug] Booking statuses:', periodBookings.map(b => b.status));

		// Calculate totals
		const confirmedBookings = periodBookings.filter(b => b.status === 'confirmed');
		const previousConfirmedBookings = previousPeriodBookings.filter(b => b.status === 'confirmed');
		
		console.log('[Analytics Debug] Confirmed bookings:', confirmedBookings.length);
		console.log('[Analytics Debug] Other statuses in period:', periodBookings.filter(b => b.status !== 'confirmed').map(b => ({ id: b.id, status: b.status })));
		
		// For debugging: include all bookings regardless of status if no confirmed bookings
		const bookingsToAnalyze = confirmedBookings.length > 0 ? confirmedBookings : periodBookings;
		console.log('[Analytics Debug] Using bookings for analysis:', bookingsToAnalyze.length);
		
		const totalRevenue = bookingsToAnalyze.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
		const previousRevenue = previousConfirmedBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
		
		const totalBookings = bookingsToAnalyze.length;
		const previousBookings = previousConfirmedBookings.length;

		// Calculate trends
		const revenueTrend = previousRevenue > 0 
			? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
			: 0;
		const bookingsTrend = previousBookings > 0
			? Math.round(((totalBookings - previousBookings) / previousBookings) * 100)
			: 0;

		// Get unique customers and identify new vs returning
		const currentCustomers = new Set(bookingsToAnalyze.map(b => b.customerEmail).filter(Boolean));
		const allTimeCustomersBeforePeriod = await db
			.select({ customerEmail: bookings.customerEmail })
			.from(bookings)
			.where(
				and(
					inArray(bookings.tourId, tourIds),
					eq(bookings.status, 'confirmed'),
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
				revenue: sql<number>`COALESCE(SUM(${bookings.totalAmount}), 0)`,
				participants: sql<number>`COALESCE(SUM(${bookings.participants}), 0)`,
				qrScans: tours.qrScans,
				qrConversions: tours.qrConversions,
			})
			.from(tours)
			.leftJoin(
				bookings,
				and(
					eq(bookings.tourId, tours.id),
					eq(bookings.status, 'confirmed'),
					gte(bookings.createdAt, startDate)
				)
			)
			.where(eq(tours.userId, userId))
			.groupBy(tours.id, tours.name, tours.qrScans, tours.qrConversions)
			.orderBy(desc(sql`COALESCE(SUM(${bookings.totalAmount}), 0)`))
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
		const sourceData = bookingsToAnalyze.reduce((acc, booking) => {
			const source = booking.source || 'direct';
			if (!acc[source]) {
				acc[source] = { count: 0, revenue: 0 };
			}
			acc[source].count++;
			acc[source].revenue += Number(booking.totalAmount || 0);
			return acc;
		}, {} as Record<string, { count: number; revenue: number }>);

		const sourceAnalytics = Object.entries(sourceData).map(([source, data]) => ({
			source,
			bookings: data.count,
			revenue: data.revenue,
			percentage: Math.round((data.count / totalBookings) * 100) || 0,
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
						inArray(bookings.tourId, tourIds),
						eq(bookings.status, 'confirmed'),
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
			console.error('[Analytics Debug] Peak times query error:', err);
		}

		// Generate chart data
		const chartData = generateChartData(bookingsToAnalyze, startDate, now, range);

		// Customer retention rate
		const retentionRate = currentCustomers.size > 0
			? Math.round((returningCustomers.length / currentCustomers.size) * 100)
			: 0;

		return json({
			revenue: { 
				total: totalRevenue || 0, 
				trend: revenueTrend || 0,
				chartData: chartData.revenue,
			},
			bookings: { 
				total: totalBookings || 0, 
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
				bookings: totalBookings || 0, 
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
		data.revenue += Number(booking.totalAmount || 0);
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
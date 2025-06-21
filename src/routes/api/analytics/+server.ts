import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, users } from '$lib/db/schema/index.js';
import { and, eq, gte, lte, sql, desc, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const range = url.searchParams.get('range') || 'month';
	const userId = locals.user.id;

	// Calculate date range
	const now = new Date();
	let startDate: Date;
	
	switch (range) {
		case 'week':
			startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		case 'month':
			startDate = new Date(now.getFullYear(), now.getMonth(), 1);
			break;
		case 'quarter':
			startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
			break;
		case 'year':
			startDate = new Date(now.getFullYear(), 0, 1);
			break;
		default:
			startDate = new Date(now.getFullYear(), now.getMonth(), 1);
	}

	try {
		// Get user's tours
		const userTours = await db
			.select({ id: tours.id })
			.from(tours)
			.where(eq(tours.userId, userId));
		
		const tourIds = userTours.map(t => t.id);
		
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
			});
		}

		// Get bookings for the period
		const periodBookings = await db
			.select({
				id: bookings.id,
				tourId: bookings.tourId,
				totalAmount: bookings.totalAmount,
				status: bookings.status,
				createdAt: bookings.createdAt,
				customerEmail: bookings.customerEmail,
			})
			.from(bookings)
			.where(
				and(
					inArray(bookings.tourId, tourIds),
					gte(bookings.createdAt, startDate),
					lte(bookings.createdAt, now)
				)
			);

		// Calculate totals
		const confirmedBookings = periodBookings.filter(b => b.status === 'confirmed');
		const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
		const totalBookings = confirmedBookings.length;

		// Get unique customers
		const uniqueCustomers = new Set(confirmedBookings.map(b => b.customerEmail).filter(Boolean)).size;

		// Get tour performance
		const tourPerformance = await db
			.select({
				id: tours.id,
				name: tours.name,
				bookingCount: sql<number>`COUNT(DISTINCT ${bookings.id})`,
				revenue: sql<number>`COALESCE(SUM(${bookings.totalAmount}), 0)`,
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
		}));

		// TODO: Calculate trends by comparing to previous period
		const revenueTrend = 0; // Placeholder
		const bookingsTrend = 0; // Placeholder

		return json({
			revenue: { 
				total: totalRevenue || 0, 
				trend: revenueTrend || 0,
				chartData: [] // TODO: Implement chart data
			},
			bookings: { 
				total: totalBookings || 0, 
				trend: bookingsTrend || 0,
				chartData: [] // TODO: Implement chart data
			},
			customers: { 
				total: uniqueCustomers || 0, 
				new: uniqueCustomers || 0, // TODO: Distinguish new vs returning
				returning: 0 
			},
			tours: { 
				views: totalQrScans || 0, 
				bookings: totalBookings || 0, 
				conversionRate: qrConversionRate || 0 
			},
			qrCodes: { 
				scans: totalQrScans || 0, 
				conversions: totalQrConversions || 0, 
				conversionRate: qrConversionRate || 0 
			},
			popularTours: popularTours || [],
			peakTimes: [], // TODO: Implement peak times analysis
		});
	} catch (err) {
		console.error('Analytics error:', err);
		throw error(500, 'Failed to fetch analytics data');
	}
}; 
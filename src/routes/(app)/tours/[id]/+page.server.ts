import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots, bookings } from '$lib/db/schema/index.js';
import { eq, and, gte, desc, count, sql } from 'drizzle-orm';
import { getUpcomingTimeSlots, getTimeSlotStats } from '$lib/utils/tour-helpers-server.js';

export const load: PageServerLoad = async ({ locals, url, params, parent }) => {
	// Get parent layout data first
	const parentData = await parent();
	
	// Check if user is authenticated
	if (!locals.user) {
		const redirectTo = url.pathname + url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	// Validate that tour ID is provided
	if (!params.id) {
		throw error(400, 'Tour ID is required');
	}

	try {
		const userId = locals.user.id;
		const tourId = params.id;

		// Load tour data and verify ownership
		const [tour] = await db
			.select()
			.from(tours)
			.where(and(
				eq(tours.id, tourId),
				eq(tours.userId, userId)
			))
			.limit(1);

		if (!tour) {
			throw error(404, 'Tour not found or you do not have permission to view it');
		}

		// Get current date for filtering
		const now = new Date();
		const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const startOfWeek = new Date(startOfToday);
		startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		// Get upcoming time slots (next 10) using shared utility
		const upcomingSlots = await getUpcomingTimeSlots(tourId, 10);

		// Get recent bookings (last 10)
		const recentBookings = await db
			.select({
				id: bookings.id,
				customerName: bookings.customerName,
				customerEmail: bookings.customerEmail,
				participants: bookings.participants,
				totalAmount: bookings.totalAmount,
				status: bookings.status,
				bookingReference: bookings.bookingReference,
				createdAt: bookings.createdAt
			})
			.from(bookings)
			.where(eq(bookings.tourId, tourId))
			.orderBy(desc(bookings.createdAt))
			.limit(10);

		// Calculate tour-specific statistics
		const [tourStats] = await db
			.select({
				totalBookings: count(bookings.id),
				totalRevenue: sql<number>`COALESCE(SUM(CAST(${bookings.totalAmount} AS DECIMAL)), 0)`,
				totalParticipants: sql<number>`COALESCE(SUM(${bookings.participants}), 0)`,
				todayBookings: sql<number>`COALESCE(SUM(CASE WHEN DATE(${bookings.createdAt}) = DATE(NOW()) THEN 1 ELSE 0 END), 0)`,
				weekBookings: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.createdAt} >= ${startOfWeek.toISOString()} THEN 1 ELSE 0 END), 0)`,
				monthBookings: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.createdAt} >= ${startOfMonth.toISOString()} THEN 1 ELSE 0 END), 0)`,
				confirmedBookings: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'confirmed' THEN 1 ELSE 0 END), 0)`,
				pendingBookings: sql<number>`COALESCE(SUM(CASE WHEN ${bookings.status} = 'pending' THEN 1 ELSE 0 END), 0)`
			})
			.from(bookings)
			.where(eq(bookings.tourId, tourId));

		// Get time slot statistics using shared utility
		const timeSlotStats = await getTimeSlotStats(tourId);

		return {
			...parentData,
			tour: {
				...tour,
				price: tour.price ? parseFloat(tour.price) : 0,
				created: tour.createdAt ? (new Date(tour.createdAt).toISOString()) : new Date().toISOString(),
				updated: tour.updatedAt ? (new Date(tour.updatedAt).toISOString()) : new Date().toISOString()
			},
			tourStats: {
				totalBookings: Number(tourStats?.totalBookings || 0),
				totalRevenue: Number(tourStats?.totalRevenue || 0),
				totalParticipants: Number(tourStats?.totalParticipants || 0),
				todayBookings: Number(tourStats?.todayBookings || 0),
				weekBookings: Number(tourStats?.weekBookings || 0),
				monthBookings: Number(tourStats?.monthBookings || 0),
				confirmedBookings: Number(tourStats?.confirmedBookings || 0),
				pendingBookings: Number(tourStats?.pendingBookings || 0),
				totalSlots: timeSlotStats.total,
				upcomingSlots: timeSlotStats.upcoming,
				qrScans: tour.qrScans || 0,
				qrConversions: tour.qrConversions || 0
			},
			upcomingSlots: upcomingSlots.map(slot => {
				const startDate = slot.startTime ? new Date(slot.startTime) : new Date();
				const endDate = slot.endTime ? new Date(slot.endTime) : new Date();
				const createdDate = slot.createdAt ? new Date(slot.createdAt) : new Date();
				const updatedDate = slot.updatedAt ? new Date(slot.updatedAt) : new Date();
				const recurringEndDate = slot.recurringEnd ? new Date(slot.recurringEnd) : null;
				
				return {
					...slot,
					startTime: !isNaN(startDate.getTime()) ? startDate.toISOString() : new Date().toISOString(),
					endTime: !isNaN(endDate.getTime()) ? endDate.toISOString() : new Date().toISOString(),
					createdAt: !isNaN(createdDate.getTime()) ? createdDate.toISOString() : new Date().toISOString(),
					updatedAt: !isNaN(updatedDate.getTime()) ? updatedDate.toISOString() : new Date().toISOString(),
					recurringEnd: recurringEndDate && !isNaN(recurringEndDate.getTime()) ? recurringEndDate.toISOString() : null
				};
			}),
			recentBookings: recentBookings.map(booking => {
				const createdDate = booking.createdAt ? new Date(booking.createdAt) : new Date();
				
				return {
					...booking,
					totalAmount: booking.totalAmount ? parseFloat(booking.totalAmount) : 0,
					createdAt: !isNaN(createdDate.getTime()) ? createdDate.toISOString() : new Date().toISOString()
				};
			})
		};
	} catch (err) {
		console.error('Error loading tour details page:', err);
		
		// Re-throw SvelteKit errors (like 404, 403)
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		
		throw error(500, 'Failed to load tour details');
	}
}; 
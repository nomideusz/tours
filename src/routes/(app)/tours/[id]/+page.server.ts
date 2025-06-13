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
				price: parseFloat(tour.price),
				created: tour.createdAt.toISOString(),
				updated: tour.updatedAt.toISOString()
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
			upcomingSlots: upcomingSlots.map(slot => ({
				...slot,
				startTime: slot.startTime.toISOString(),
				endTime: slot.endTime.toISOString(),
				createdAt: slot.createdAt.toISOString(),
				updatedAt: slot.updatedAt.toISOString(),
				recurringEnd: slot.recurringEnd ? slot.recurringEnd.toISOString() : null
			})),
			recentBookings: recentBookings.map(booking => ({
				...booking,
				totalAmount: parseFloat(booking.totalAmount),
				createdAt: booking.createdAt.toISOString()
			}))
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
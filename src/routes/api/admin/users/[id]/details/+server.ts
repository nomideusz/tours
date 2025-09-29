import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users, tours, bookings, timeSlots, payments } from '$lib/db/schema/index.js';
import { eq, sql, count, sum, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, params }) => {
	// Check admin access
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id: userId } = params;

	if (!userId) {
		return json({ error: 'User ID is required' }, { status: 400 });
	}

	try {
		// Get user details
		const user = await db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (user.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const userData = user[0];

		// Get all tours created by this user (including drafts)
		const userTours = await db
			.select({
				id: tours.id,
				name: tours.name,
				description: tours.description,
				price: tours.price,
				duration: tours.duration,
				capacity: tours.capacity,
				status: tours.status,
				categories: tours.categories,
				location: tours.location,
				images: tours.images,
				publicListing: tours.publicListing,
				qrScans: tours.qrScans,
				qrConversions: tours.qrConversions,
				createdAt: tours.createdAt,
				updatedAt: tours.updatedAt
			})
			.from(tours)
			.where(eq(tours.userId, userId))
			.orderBy(desc(tours.updatedAt));

		// Get tour stats for each tour
		const toursWithStats = await Promise.all(
			userTours.map(async (tour) => {
				try {
					// Get booking count for this tour
					const bookingCountResult = await db
						.select({ count: count() })
						.from(bookings)
						.where(eq(bookings.tourId, tour.id));
					const bookingCount = bookingCountResult[0]?.count || 0;

					// Get revenue for this tour
					const revenueResult = await db
						.select({ total: sum(bookings.totalAmount) })
						.from(bookings)
						.where(
							sql`${bookings.tourId} = ${tour.id} AND ${bookings.status} = 'confirmed'`
						);
					const revenue = Number(revenueResult[0]?.total || 0);

					// Get upcoming time slots count
					const upcomingTimeSlotsResult = await db
						.select({ count: count() })
						.from(timeSlots)
						.where(
							sql`${timeSlots.tourId} = ${tour.id} AND ${timeSlots.startTime} > NOW()`
						);
					const upcomingTimeSlots = upcomingTimeSlotsResult[0]?.count || 0;

					return {
						...tour,
						bookingCount,
						revenue,
						upcomingTimeSlots
					};
				} catch (error) {
					console.error(`Error fetching stats for tour ${tour.id}:`, error);
					// Return tour with default stats if query fails
					return {
						...tour,
						bookingCount: 0,
						revenue: 0,
						upcomingTimeSlots: 0
					};
				}
			})
		);

		// Get bookings made by this user (as a customer)
		let customerBookings: any[] = [];
		try {
			customerBookings = await db
				.select({
					id: bookings.id,
					tourId: bookings.tourId,
					customerName: bookings.customerName,
					customerEmail: bookings.customerEmail,
					participants: bookings.participants,
					totalAmount: bookings.totalAmount,
					status: bookings.status,
					paymentStatus: bookings.paymentStatus,
					bookingReference: bookings.bookingReference,
					createdAt: bookings.createdAt,
					// Tour details
					tourName: tours.name,
					tourLocation: tours.location,
					// Time slot details
					startTime: timeSlots.startTime,
					endTime: timeSlots.endTime
				})
				.from(bookings)
				.innerJoin(tours, eq(tours.id, bookings.tourId))
				.innerJoin(timeSlots, eq(timeSlots.id, bookings.timeSlotId))
				.where(eq(bookings.customerEmail, userData.email))
				.orderBy(desc(bookings.createdAt))
				.limit(10); // Limit to recent bookings
		} catch (error) {
			console.error('Error fetching customer bookings:', error);
			// Continue with empty array if this query fails
		}

		// Get payment history for tours they guide
		let paymentHistory: any[] = [];
		try {
			paymentHistory = await db
				.select({
					id: payments.id,
					bookingId: payments.bookingId,
					amount: payments.amount,
					currency: payments.currency,
					status: payments.status,
					paymentType: payments.paymentType,
					processingFee: payments.processingFee,
					netAmount: payments.netAmount,
					createdAt: payments.createdAt,
					// Booking details
					bookingReference: bookings.bookingReference,
					customerName: bookings.customerName,
					// Tour details
					tourName: tours.name
				})
				.from(payments)
				.innerJoin(bookings, eq(bookings.id, payments.bookingId))
				.innerJoin(tours, eq(tours.id, bookings.tourId))
				.where(eq(tours.userId, userId))
				.orderBy(desc(payments.createdAt))
				.limit(20); // Limit to recent payments
		} catch (error) {
			console.error('Error fetching payment history:', error);
			// Continue with empty array if this query fails
		}

		// Calculate overall stats
		const totalRevenue = toursWithStats.reduce((sum, tour) => sum + tour.revenue, 0);
		const totalBookings = toursWithStats.reduce((sum, tour) => sum + tour.bookingCount, 0);
		const activeTours = toursWithStats.filter(tour => tour.status === 'active').length;
		const draftTours = toursWithStats.filter(tour => tour.status === 'draft').length;
		const totalQrScans = toursWithStats.reduce((sum, tour) => sum + tour.qrScans, 0);
		const totalQrConversions = toursWithStats.reduce((sum, tour) => sum + tour.qrConversions, 0);

		return json({
			user: {
				id: userData.id,
				email: userData.email,
				name: userData.name,
				username: userData.username,
				businessName: userData.businessName,
				role: userData.role,
				avatar: userData.avatar,
				phone: userData.phone,
				website: userData.website,
				description: userData.description,
				location: userData.location,
				country: userData.country,
				currency: userData.currency,
				subscriptionPlan: userData.subscriptionPlan,
				subscriptionStatus: userData.subscriptionStatus,
				promoCodeUsed: userData.promoCodeUsed,
				subscriptionDiscountPercentage: userData.subscriptionDiscountPercentage,
				isLifetimeDiscount: userData.isLifetimeDiscount,
				earlyAccessMember: userData.earlyAccessMember,
				emailVerified: userData.emailVerified,
				whatsappNotifications: userData.whatsappNotifications,
				lastLogin: userData.lastLogin,
				createdAt: userData.createdAt,
				updatedAt: userData.updatedAt
			},
			tours: toursWithStats,
			customerBookings,
			paymentHistory,
			stats: {
				totalRevenue,
				totalBookings,
				activeTours,
				draftTours,
				totalTours: toursWithStats.length,
				totalQrScans,
				totalQrConversions,
				conversionRate: totalQrScans > 0 ? (totalQrConversions / totalQrScans * 100) : 0
			}
		});

	} catch (error) {
		console.error('Error fetching user details:', error);
		return json({ error: 'Failed to fetch user details' }, { status: 500 });
	}
};

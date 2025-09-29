import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users, tours, bookings, timeSlots, payments, notifications } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = locals.user.id;

		// Gather all user data
		const [
			userData,
			userTours,
			userBookings,
			userNotifications
		] = await Promise.all([
			// Get user data
			db.select().from(users).where(eq(users.id, userId)).limit(1),
			
			// Get all tours
			db.select().from(tours).where(eq(tours.userId, userId)),
			
			// Get all bookings for user's tours
			db.select({
				booking: bookings,
				tour: tours,
				timeSlot: timeSlots,
				payment: payments
			})
			.from(bookings)
			.innerJoin(tours, eq(bookings.tourId, tours.id))
			.innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.leftJoin(payments, eq(payments.bookingId, bookings.id))
			.where(eq(tours.userId, userId)),
			
			// Get notifications
			db.select().from(notifications).where(eq(notifications.userId, userId))
		]);

		if (userData.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const user = userData[0];

		// Prepare export data
		const exportData = {
			exportDate: new Date().toISOString(),
			userData: {
				id: user.id,
				email: user.email,
				name: user.name,
				username: user.username,
				businessName: user.businessName,
				phone: user.phone,
				website: user.website,
				location: user.location,
				country: user.country,
				currency: user.currency,
				description: user.description,
				emailVerified: user.emailVerified,
				role: user.role,
				createdAt: user.createdAt,
				subscriptionPlan: user.subscriptionPlan,
				subscriptionStatus: user.subscriptionStatus
			},
			tours: userTours.map(tour => ({
				id: tour.id,
				name: tour.name,
				description: tour.description,
				price: tour.price,
				duration: tour.duration,
				capacity: tour.capacity,
				status: tour.status,
				categories: tour.categories || [],
				location: tour.location,
				includedItems: tour.includedItems,
				requirements: tour.requirements,
				cancellationPolicy: tour.cancellationPolicy,
				qrCode: tour.qrCode,
				qrScans: tour.qrScans,
				qrConversions: tour.qrConversions,
				createdAt: tour.createdAt
			})),
			bookings: userBookings.map(({ booking, tour, timeSlot, payment }) => ({
				id: booking.id,
				tourName: tour.name,
				customerName: booking.customerName,
				customerEmail: booking.customerEmail,
				customerPhone: booking.customerPhone,
				participants: booking.participants,
				totalAmount: booking.totalAmount,
				status: booking.status,
				paymentStatus: booking.paymentStatus,
				bookingReference: booking.bookingReference,
				specialRequests: booking.specialRequests,
				attendanceStatus: booking.attendanceStatus,
				checkedInAt: booking.checkedInAt,
				createdAt: booking.createdAt,
				timeSlot: {
					startTime: timeSlot.startTime,
					endTime: timeSlot.endTime
				},
				payment: payment ? {
					amount: payment.amount,
					currency: payment.currency,
					status: payment.status,
					processingFee: payment.processingFee,
					netAmount: payment.netAmount
				} : null
			})),
			notifications: userNotifications.map(notification => ({
				id: notification.id,
				type: notification.type,
				title: notification.title,
				message: notification.message,
				read: notification.read,
				createdAt: notification.createdAt
			})),
			statistics: {
				totalTours: userTours.length,
				activeTours: userTours.filter(t => t.status === 'active').length,
				totalBookings: userBookings.length,
				confirmedBookings: userBookings.filter(b => b.booking.status === 'confirmed').length,
				totalRevenue: userBookings
					.filter(b => b.payment && b.payment.status === 'paid')
					.reduce((sum, b) => sum + parseFloat(b.payment!.netAmount), 0)
			}
		};

		// Return as downloadable JSON file
		const filename = `zaur-export-${user.username || user.id}-${new Date().toISOString().split('T')[0]}.json`;
		
		return new Response(JSON.stringify(exportData, null, 2), {
			headers: {
				'Content-Type': 'application/json',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
		
	} catch (error) {
		console.error('Data export error:', error);
		return json({ error: 'Failed to export data' }, { status: 500 });
	}
}; 
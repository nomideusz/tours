import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, bookings, timeSlots, qrCodes } from '$lib/db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Load the tour and verify ownership
		const tourData = await db
			.select()
			.from(tours)
			.where(and(
				eq(tours.id, params.id),
				eq(tours.userId, locals.user.id)
			))
			.limit(1);
		
		if (tourData.length === 0) {
			throw error(404, 'Tour not found or access denied');
		}
		
		const tour = tourData[0];

		// Load bookings with related data (first 500)
		const bookingsData = await db
			.select({
				// Booking fields
				id: bookings.id,
				status: bookings.status,
				paymentStatus: bookings.paymentStatus,
				totalAmount: bookings.totalAmount,
				participants: bookings.participants,
				customerName: bookings.customerName,
				customerEmail: bookings.customerEmail,
				customerPhone: bookings.customerPhone,
				specialRequests: bookings.specialRequests,
				createdAt: bookings.createdAt,
				updatedAt: bookings.updatedAt,
				
				// Time slot fields
				timeSlotId: bookings.timeSlotId,
				timeSlotStartTime: timeSlots.startTime,
				timeSlotEndTime: timeSlots.endTime,
				timeSlotAvailableSpots: timeSlots.availableSpots,
				timeSlotBookedSpots: timeSlots.bookedSpots,
				
				// QR code fields
				qrCodeId: bookings.qrCodeId,
				qrCodeCode: qrCodes.code,
				qrCodeCategory: qrCodes.category
			})
			.from(bookings)
			.leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.leftJoin(qrCodes, eq(bookings.qrCodeId, qrCodes.id))
			.where(eq(bookings.tourId, params.id))
			.orderBy(desc(bookings.createdAt))
			.limit(500);

		// Transform to match expected format with expand structure
		const transformedBookings = bookingsData.map(booking => ({
			id: booking.id,
			status: booking.status,
			paymentStatus: booking.paymentStatus,
			totalAmount: booking.totalAmount,
			participants: booking.participants,
			customerName: booking.customerName,
			customerEmail: booking.customerEmail,
			customerPhone: booking.customerPhone,
			specialRequests: booking.specialRequests,
			created: booking.createdAt.toISOString(),
			updated: booking.updatedAt.toISOString(),
			expand: {
				tour: tour,
				timeSlot: booking.timeSlotId ? {
					id: booking.timeSlotId,
					startTime: booking.timeSlotStartTime?.toISOString(),
					endTime: booking.timeSlotEndTime?.toISOString(),
					availableSpots: booking.timeSlotAvailableSpots,
					bookedSpots: booking.timeSlotBookedSpots
				} : null,
				qrCode: booking.qrCodeId ? {
					id: booking.qrCodeId,
					code: booking.qrCodeCode,
					category: booking.qrCodeCategory
				} : null
			}
		}));

		return {
			tour,
			bookings: transformedBookings
		};
	} catch (err) {
		console.error('Error loading tour bookings:', err);
		if ((err as any).status === 404) {
			throw error(404, 'Tour not found');
		}
		if ((err as any).status) {
			throw err;
		}
		throw error(500, 'Failed to load tour bookings');
	}
}; 
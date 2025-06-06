import type { PageServerLoad, Actions } from './$types.js';
import { error, fail } from '@sveltejs/kit';
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

		// Load bookings with related data (limit to prevent timeout)
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
				bookingReference: bookings.bookingReference,
				attendanceStatus: bookings.attendanceStatus,
				checkedInAt: bookings.checkedInAt,
				ticketQRCode: bookings.ticketQRCode,
				
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
			.limit(50); // Reduced from 100 to 50 to prevent 502 timeout

		// Transform to match expected format with expand structure
		const transformedBookings = bookingsData.map(booking => ({
			id: booking.id,
			status: booking.status,
			paymentStatus: booking.paymentStatus,
			totalAmount: booking.totalAmount ? parseFloat(booking.totalAmount) : 0,
			participants: booking.participants || 0,
			customerName: booking.customerName || '',
			customerEmail: booking.customerEmail || '',
			customerPhone: booking.customerPhone || null,
			specialRequests: booking.specialRequests || null,
			created: booking.createdAt.toISOString(),
			updated: booking.updatedAt.toISOString(),
			bookingReference: booking.bookingReference || '',
			attendanceStatus: booking.attendanceStatus || null,
			checkedInAt: booking.checkedInAt?.toISOString() || null,
			ticketQRCode: booking.ticketQRCode || null,
			expand: {
				tour: {
					...tour,
					price: tour.price ? parseFloat(tour.price) : 0
				},
				timeSlot: booking.timeSlotId ? {
					id: booking.timeSlotId,
					startTime: booking.timeSlotStartTime?.toISOString() || null,
					endTime: booking.timeSlotEndTime?.toISOString() || null,
					availableSpots: booking.timeSlotAvailableSpots || 0,
					bookedSpots: booking.timeSlotBookedSpots || 0
				} : null,
				qrCode: booking.qrCodeId ? {
					id: booking.qrCodeId,
					code: booking.qrCodeCode || '',
					category: booking.qrCodeCategory || null
				} : null
			}
		}));

		return {
			tour: {
				...tour,
				price: tour.price ? parseFloat(tour.price) : 0
			},
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

export const actions: Actions = {
	updateStatus: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const bookingId = formData.get('bookingId') as string;
		const newStatus = formData.get('status') as 'confirmed' | 'cancelled' | 'completed' | 'no_show';

		if (!bookingId || !newStatus) {
			return fail(400, { error: 'Missing booking ID or status' });
		}

		try {
			// Get booking with tour ownership check
			const bookingData = await db
				.select({
					id: bookings.id,
					status: bookings.status,
					paymentStatus: bookings.paymentStatus
				})
				.from(bookings)
				.innerJoin(tours, eq(bookings.tourId, tours.id))
				.where(and(
					eq(bookings.id, bookingId),
					eq(tours.userId, locals.user.id)
				))
				.limit(1);

			if (bookingData.length === 0) {
				return fail(404, { error: 'Booking not found' });
			}

			const booking = bookingData[0];

			// Validate status transitions
			if (newStatus === 'confirmed' && booking.paymentStatus !== 'paid') {
				return fail(400, { 
					error: 'Cannot confirm booking: Payment not completed. Customer must complete payment first.' 
				});
			}

			if (newStatus === 'completed' && booking.status !== 'confirmed') {
				return fail(400, { 
					error: 'Cannot complete booking: Only confirmed bookings can be marked as completed.' 
				});
			}

			// Update booking status
			await db
				.update(bookings)
				.set({ 
					status: newStatus,
					updatedAt: new Date()
				})
				.where(eq(bookings.id, bookingId));

			return { success: true };
		} catch (err) {
			console.error('Error updating booking status:', err);
			return fail(500, { error: 'Failed to update booking status' });
		}
	}
}; 
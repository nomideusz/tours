import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, payments } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (!params.id) {
		throw error(400, 'Booking ID required');
	}

	try {
		// Step 1: Get booking data
		const bookingData = await db
			.select()
			.from(bookings)
			.where(eq(bookings.id, params.id))
			.limit(1);

		if (bookingData.length === 0) {
			throw error(404, 'Booking not found');
		}

		const booking = bookingData[0];

		// Step 2: Get tour data separately  
		const tourData = await db
			.select()
			.from(tours)
			.where(eq(tours.id, booking.tourId))
			.limit(1);

		if (tourData.length === 0 || tourData[0].userId !== locals.user.id) {
			throw error(403, 'Access denied');
		}

		const tour = tourData[0];

		// Step 3: Get time slot data separately (if exists)
		let timeSlot = null;
		if (booking.timeSlotId) {
			const timeSlotData = await db
				.select()
				.from(timeSlots)
				.where(eq(timeSlots.id, booking.timeSlotId))
				.limit(1);

			if (timeSlotData.length > 0) {
				timeSlot = {
					id: timeSlotData[0].id,
					startTime: timeSlotData[0].startTime?.toISOString(),
					endTime: timeSlotData[0].endTime?.toISOString(),
					availableSpots: timeSlotData[0].availableSpots,
					bookedSpots: timeSlotData[0].bookedSpots
				};
			}
		}

		// Step 4: Get payment data separately (if exists)
		let payment = null;
		if (booking.paymentId) {
			const paymentData = await db
				.select()
				.from(payments)
				.where(eq(payments.stripePaymentIntentId, booking.paymentId))
				.limit(1);

			if (paymentData.length > 0) {
				payment = {
					...paymentData[0],
					created: paymentData[0].createdAt?.toISOString(),
					updated: paymentData[0].updatedAt?.toISOString()
				};
			}
		}

		// Format response to match expected structure
		const response = {
			booking: {
				id: booking.id,
				status: booking.status,
				paymentStatus: booking.paymentStatus,
				paymentId: booking.paymentId,
				totalAmount: booking.totalAmount,
				participants: booking.participants,
				customerName: booking.customerName,
				customerEmail: booking.customerEmail,
				customerPhone: booking.customerPhone,
				specialRequests: booking.specialRequests,
				bookingReference: booking.bookingReference,
				ticketQRCode: booking.ticketQRCode,
				attendanceStatus: booking.attendanceStatus,
				checkedInAt: booking.checkedInAt?.toISOString(),
				created: booking.createdAt?.toISOString() || new Date().toISOString(),
				updated: booking.updatedAt?.toISOString() || new Date().toISOString(),
				expand: {
					tour: {
						id: tour.id,
						name: tour.name,
						description: tour.description,
						location: tour.location,
						price: tour.price,
						duration: tour.duration
					},
					timeSlot
				}
			},
			payment
		};

		return json(response);

	} catch (err) {
		console.error('Error fetching booking details:', err);
		if (err instanceof Error && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to fetch booking details');
	}
}; 
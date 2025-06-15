import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { generateTicketQRCode } from '$lib/ticket-qr.js';
import { broadcastBookingNotification } from '$lib/notifications/server.js';

export const load: PageServerLoad = async ({ params }) => {
	return {
		qrCode: params.code
	};
};

export const actions: Actions = {
	book: async ({ request, params }) => {
		const formData = await request.formData();
		const qrCode = params.code;

		// Extract form data
		const timeSlotId = formData.get('timeSlotId') as string;
		const participants = parseInt(formData.get('participants') as string);
		const customerName = formData.get('customerName') as string;
		const customerEmail = formData.get('customerEmail') as string;
		const customerPhone = formData.get('customerPhone') as string;
		const specialRequests = formData.get('specialRequests') as string;

		// Validate required fields
		if (!timeSlotId || !participants || !customerName || !customerEmail) {
			return fail(400, {
				error: 'Missing required fields',
				customerName,
				customerEmail,
				customerPhone,
				specialRequests
			});
		}

		let booking;
		
		try {
			// Get tour by QR code
			const tourData = await db
				.select()
				.from(tours)
				.where(and(
					eq(tours.qrCode, qrCode),
					eq(tours.status, 'active')
				))
				.limit(1);

			if (tourData.length === 0) {
				return fail(404, {
					error: 'Tour not found or inactive',
					customerName,
					customerEmail,
					customerPhone,
					specialRequests
				});
			}

			const tour = tourData[0];

			// Get time slot and check availability
			const timeSlotData = await db
				.select()
				.from(timeSlots)
				.where(eq(timeSlots.id, timeSlotId))
				.limit(1);

			if (timeSlotData.length === 0) {
				return fail(404, {
					error: 'Time slot not found',
					customerName,
					customerEmail,
					customerPhone,
					specialRequests
				});
			}

			const timeSlot = timeSlotData[0];

			// Check if time slot is in the future
			if (timeSlot.startTime && new Date(timeSlot.startTime) <= new Date()) {
				return fail(400, {
					error: 'Cannot book past time slots',
					customerName,
					customerEmail,
					customerPhone,
					specialRequests
				});
			}

			// Check availability
			const availableSpots = timeSlot.availableSpots - (timeSlot.bookedSpots || 0);
			
			if (availableSpots < participants) {
				return fail(400, {
					error: `Only ${availableSpots} spots available`,
					customerName,
					customerEmail,
					customerPhone,
					specialRequests
				});
			}

			// Calculate total amount
			const totalAmount = (parseFloat(tour.price) * participants).toFixed(2);

			// Generate booking reference and ticket QR code
			const bookingReference = `BK-${createId().slice(0, 8).toUpperCase()}`;
			const ticketQRCode = generateTicketQRCode();

			console.log(`✅ Creating booking for ${customerName} - ${tour.name} (${participants} participants)`);

			// Create booking
			const bookingResult = await db.insert(bookings).values({
				tourId: tour.id,
				timeSlotId: timeSlot.id,
				source: 'direct',
				sourceQrCode: qrCode,
				customerName,
				customerEmail,
				customerPhone: customerPhone || null,
				participants,
				totalAmount,
				status: 'pending',
				paymentStatus: 'pending',
				bookingReference,
				specialRequests: specialRequests || null,
				ticketQRCode
			}).returning();

			booking = bookingResult[0];

			// Update time slot booked spots
			await db.update(timeSlots)
				.set({
					bookedSpots: (timeSlot.bookedSpots || 0) + participants,
					updatedAt: new Date()
				})
				.where(eq(timeSlots.id, timeSlotId));

			// Update tour QR conversions
			await db.update(tours)
				.set({
					qrConversions: (tour.qrConversions || 0) + 1,
					updatedAt: new Date()
				})
				.where(eq(tours.id, tour.id));

			// Send notifications (don't await to avoid blocking)
			broadcastBookingNotification({
				id: booking.id,
				tourId: tour.id,
				tourName: tour.name,
				customerName: booking.customerName,
				participants: booking.participants,
				totalAmount: booking.totalAmount,
				status: booking.status
			}).catch(console.error);

		} catch (error) {
			console.error('💥 Booking creation error:', error);
			console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

			return fail(500, {
				error: 'Failed to create booking. Please try again.',
				customerName,
				customerEmail,
				customerPhone,
				specialRequests
			});
		}

		// If we get here, booking was successful - redirect to payment
		console.log(`✅ Booking ${booking.bookingReference} created successfully, redirecting to payment`);
		redirect(303, `/book/${qrCode}/payment?booking=${booking.id}`);
	}
}; 
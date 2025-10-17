import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { sendWhatsAppMessage } from '$lib/whatsapp/sender.js';
import { formatCurrency } from '$lib/utils/currency.js';
import { formatEmailDateTime } from '$lib/email/utils.js';
import type { Currency } from '$lib/utils/countries.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check if user is admin
	const isAdmin = locals.user?.isAdmin === true || locals.user?.role === 'admin';
	if (!locals.user || !isAdmin) {
		throw error(403, 'Unauthorized - Admin only');
	}

	try {
		const { phone, bookingId } = await request.json();

		if (!phone) {
			throw error(400, 'Phone number is required');
		}

		// Get a test booking
		let testBooking;
		if (bookingId) {
			const bookingData = await db
				.select()
				.from(bookings)
				.where(eq(bookings.id, bookingId))
				.limit(1);
			testBooking = bookingData[0];
		} else {
			// Get most recent booking
			const bookingData = await db
				.select()
				.from(bookings)
				.orderBy(bookings.createdAt)
				.limit(1);
			testBooking = bookingData[0];
		}

		if (!testBooking) {
			throw error(404, 'No booking found for testing');
		}

		// Get tour first
		const tourData = await db.select().from(tours).where(eq(tours.id, testBooking.tourId)).limit(1);
		const tour = tourData[0];
		
		if (!tour) {
			throw error(404, 'Tour not found');
		}

		// Get time slot and user
		const [timeSlotData, userData] = await Promise.all([
			testBooking.timeSlotId
				? db.select().from(timeSlots).where(eq(timeSlots.id, testBooking.timeSlotId)).limit(1)
				: Promise.resolve([null]),
			db.select().from(users).where(eq(users.id, tour.userId)).limit(1)
		]);

		const timeSlot = timeSlotData[0];
		const tourOwner = userData[0];

		if (!timeSlot || !tourOwner) {
			throw error(404, 'Time slot or tour owner not found');
		}

		// Format parameters for the template
		const startTime = new Date(timeSlot.startTime);
		const parameters = [
			testBooking.customerName || 'Test Customer',
			tour.name,
			formatEmailDateTime(startTime),
			tour.location || 'TBD',
			String(testBooking.participants),
			formatCurrency(testBooking.totalAmount, { currency: tourOwner.currency as Currency }),
			testBooking.ticketQRCode || testBooking.bookingReference,
			tourOwner.businessName || tourOwner.name || 'Zaur Tours'
		];

		// Send WhatsApp message
		const result = await sendWhatsAppMessage({
			to: phone,
			template: 'booking_confirmation',
			parameters
		});

		if (result.success) {
			return json({
				success: true,
				message: `Test WhatsApp sent to ${phone}`,
				messageId: result.messageId
			});
		} else {
			throw new Error(result.error || 'Failed to send WhatsApp message');
		}
	} catch (err) {
		console.error('Error sending test WhatsApp:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, err instanceof Error ? err.message : 'Failed to send test WhatsApp');
	}
};


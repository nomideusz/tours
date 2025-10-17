import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { sendEmail } from '$lib/email/sender.js';
import { bookingConfirmationTemplate } from '$lib/email/templates/booking-confirmation.js';
import { guideBookingNotificationTemplate } from '$lib/email/templates/guide-booking-notification.js';
import { tourReminderTemplate } from '$lib/email/templates/tour-reminder.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check if user is admin
	if (!locals.user || !locals.user.isAdmin) {
		throw error(403, 'Unauthorized - Admin only');
	}

	try {
		const { action, bookingId } = await request.json();

		if (!action) {
			throw error(400, 'Action is required');
		}

		// Get a test booking (most recent one)
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

		// Get tour and time slot
		const [tourData, timeSlotData, userData] = await Promise.all([
			db.select().from(tours).where(eq(tours.id, testBooking.tourId)).limit(1),
			testBooking.timeSlotId
				? db.select().from(timeSlots).where(eq(timeSlots.id, testBooking.timeSlotId)).limit(1)
				: Promise.resolve([null]),
			db.select().from(users).where(eq(users.id, tourData[0]?.userId || '')).limit(1)
		]);

		const tour = tourData[0];
		const timeSlot = timeSlotData[0];
		const tourOwner = userData[0];

		if (!tour || !timeSlot || !tourOwner) {
			throw error(404, 'Tour, time slot, or tour owner not found');
		}

		let emailSent = false;
		let emailType = '';

		switch (action) {
			case 'customer-confirmation':
				{
					const template = bookingConfirmationTemplate({
						booking: testBooking as any,
						tour: tour as any,
						timeSlot: {
							...timeSlot,
							startTime: timeSlot.startTime?.toISOString() || new Date().toISOString(),
							endTime: timeSlot.endTime?.toISOString() || new Date().toISOString()
						} as any,
						tourOwnerCurrency: tourOwner.currency || 'EUR'
					});

					await sendEmail({
						to: locals.user.email, // Send to admin for testing
						subject: template.subject,
						html: template.html
					});

					emailSent = true;
					emailType = 'Customer Booking Confirmation';
				}
				break;

			case 'guide-notification':
				{
					const template = guideBookingNotificationTemplate({
						booking: testBooking as any,
						tour: tour as any,
						timeSlot: {
							startTime: timeSlot.startTime?.toISOString() || new Date().toISOString(),
							endTime: timeSlot.endTime?.toISOString() || new Date().toISOString()
						} as any,
						guideName: tourOwner.name || 'Tour Guide',
						guideCurrency: tourOwner.currency || 'EUR'
					});

					await sendEmail({
						to: locals.user.email, // Send to admin for testing
						subject: template.subject,
						html: template.html
					});

					emailSent = true;
					emailType = 'Guide Booking Notification';
				}
				break;

			case 'tour-reminder':
				{
					const template = tourReminderTemplate({
						booking: testBooking as any,
						tour: tour as any,
						timeSlot: {
							startTime: timeSlot.startTime?.toISOString() || new Date().toISOString(),
							endTime: timeSlot.endTime?.toISOString() || new Date().toISOString()
						} as any,
						tourOwnerCurrency: tourOwner.currency || 'EUR'
					});

					await sendEmail({
						to: locals.user.email, // Send to admin for testing
						subject: template.subject,
						html: template.html
					});

					emailSent = true;
					emailType = 'Tour Reminder';
				}
				break;

			default:
				throw error(400, `Unknown action: ${action}`);
		}

		return json({
			success: true,
			message: `Test email sent! Check ${locals.user.email} for ${emailType}`,
			bookingId: testBooking.id
		});
	} catch (err) {
		console.error('Error sending test email:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to send test email');
	}
};


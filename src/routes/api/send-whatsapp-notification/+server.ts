import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { 
	sendWhatsAppBookingConfirmation, 
	sendWhatsAppGuideNotification,
	sendWhatsAppBookingCancellation,
	sendWhatsAppBookingReminder,
	isWhatsAppEnabled 
} from '$lib/whatsapp/notifications.js';
import { isFeatureEnabled } from '$lib/feature-flags.js';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { bookingId, notificationType } = body;
		
		if (!bookingId || !notificationType) {
			return json({ error: 'bookingId and notificationType are required' }, { status: 400 });
		}
		
		// Check if WhatsApp is enabled
		if (!isFeatureEnabled('WHATSAPP_NOTIFICATIONS')) {
			return json({ 
				success: false, 
				message: 'WhatsApp notifications are not enabled' 
			});
		}
		
		// Get booking details with all related data
		const bookingData = await db
			.select({
				// Booking fields
				bookingId: bookings.id,
				customerName: bookings.customerName,
				customerEmail: bookings.customerEmail,
				customerPhone: bookings.customerPhone,
				participants: bookings.participants,
				totalAmount: bookings.totalAmount,
				status: bookings.status,
				paymentStatus: bookings.paymentStatus,
				bookingReference: bookings.bookingReference,
				ticketQRCode: bookings.ticketQRCode,
				specialRequests: bookings.specialRequests,
				// Tour fields
				tourId: tours.id,
				tourName: tours.name,
				tourDescription: tours.description,
				tourPrice: tours.price,
				tourDuration: tours.duration,
				tourLocation: tours.location,
				tourUserId: tours.userId,
				// Time slot fields
				timeSlotStartTime: timeSlots.startTime,
				timeSlotEndTime: timeSlots.endTime,
				// Tour owner fields
				tourOwnerId: users.id,
				tourOwnerEmail: users.email,
				tourOwnerName: users.name,
				tourOwnerBusinessName: users.businessName,
				tourOwnerPhone: users.phone,
				tourOwnerCurrency: users.currency,
				tourOwnerSubscriptionPlan: users.subscriptionPlan
			})
			.from(bookings)
			.innerJoin(tours, eq(bookings.tourId, tours.id))
			.innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
			.innerJoin(users, eq(tours.userId, users.id))
			.where(eq(bookings.id, bookingId))
			.limit(1);
			
		if (bookingData.length === 0) {
			return json({ error: 'Booking not found' }, { status: 404 });
		}
		
		const data = bookingData[0];
		
		// Format data for notification functions
		const booking = {
			id: data.bookingId,
			tourId: data.tourId,
			timeSlotId: data.timeSlotStartTime ? 'slot-id' : '',
			customerName: data.customerName,
			customerEmail: data.customerEmail,
			customerPhone: data.customerPhone || undefined,
			participants: data.participants,
			totalAmount: typeof data.totalAmount === 'string' ? data.totalAmount : String(data.totalAmount),
			status: data.status,
			paymentStatus: data.paymentStatus,
			bookingReference: data.bookingReference,
			ticketQRCode: data.ticketQRCode || undefined,
			specialRequests: data.specialRequests || undefined,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		
		const tour = {
			id: data.tourId,
			name: data.tourName,
			description: data.tourDescription,
			price: typeof data.tourPrice === 'string' ? data.tourPrice : String(data.tourPrice),
			duration: data.tourDuration,
			capacity: 10, // Default value
			userId: data.tourUserId,
			status: 'active' as const,
			location: data.tourLocation || undefined,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		
		const timeSlot = {
			id: 'slot-id',
			tourId: data.tourId,
			startTime: data.timeSlotStartTime?.toISOString() || new Date().toISOString(),
			endTime: data.timeSlotEndTime?.toISOString() || new Date().toISOString(),
			availableSpots: 10,
			bookedSpots: 1,
			status: 'available' as const,
			isRecurring: false,
			recurringPattern: null,
			recurringEnd: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};
		
		const tourOwner = {
			id: data.tourOwnerId,
			email: data.tourOwnerEmail,
			name: data.tourOwnerName,
			businessName: data.tourOwnerBusinessName || undefined,
			phone: data.tourOwnerPhone || undefined,
			currency: data.tourOwnerCurrency,
			subscriptionPlan: data.tourOwnerSubscriptionPlan
		};
		
		// Send appropriate notification based on type
		switch (notificationType) {
			case 'booking_confirmation':
				// Send to customer if they have a phone number
				if (booking.customerPhone) {
					await sendWhatsAppBookingConfirmation(booking, tour, timeSlot, tourOwner);
				}
				break;
				
			case 'guide_notification':
				// Send to tour guide
				await sendWhatsAppGuideNotification(booking, tour, timeSlot, tourOwner);
				break;
				
			case 'booking_reminder':
				// Send reminder to customer
				if (booking.customerPhone) {
					const { sendWhatsAppBookingReminder } = await import('$lib/whatsapp/notifications.js');
					await sendWhatsAppBookingReminder(booking, tour, timeSlot, tourOwner);
				}
				break;
				
			case 'booking_cancellation':
				// Send cancellation to customer
				const { cancellationReason } = body;
				await sendWhatsAppBookingCancellation(booking, tour, timeSlot, tourOwner, cancellationReason);
				break;
				
			default:
				return json({ error: 'Invalid notification type' }, { status: 400 });
		}
		
		return json({
			success: true,
			message: `WhatsApp ${notificationType} notification queued`,
			bookingId,
			hasCustomerPhone: !!booking.customerPhone,
			hasGuidePhone: !!tourOwner.phone
		});
		
	} catch (error) {
		console.error('Error in send-whatsapp-notification API:', error);
		return json({
			error: 'Failed to send WhatsApp notification',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}; 
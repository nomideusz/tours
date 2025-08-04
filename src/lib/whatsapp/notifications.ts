import { sendWhatsAppMessage, canSendWhatsApp, logWhatsAppMessage } from './sender.js';
import type { WhatsAppTemplateType } from './config.js';
import type { AuthUser } from '$lib/stores/auth.js';
import type { Booking, Tour, TimeSlot } from '$lib/types.js';
import { formatCurrency } from '$lib/utils/currency.js';
import { formatEmailDateTime } from '$lib/email/utils.js';
import type { Currency } from '$lib/utils/countries.js';

/**
 * Send WhatsApp booking confirmation to customer
 */
export async function sendWhatsAppBookingConfirmation(
	booking: Booking,
	tour: Tour,
	timeSlot: TimeSlot,
	tourOwner: AuthUser
): Promise<void> {
	try {
		// Check if tour guide has Professional+ subscription for WhatsApp
		const canSend = await canSendWhatsApp(tourOwner);
		if (!canSend) {
			console.log(`Tour guide ${tourOwner.id} (${tourOwner.subscriptionPlan}) cannot send WhatsApp notifications to customers`);
			return;
		}
		
		// Check if customer provided phone number
		if (!booking.customerPhone) {
			console.log('❌ No customer phone number provided for WhatsApp notification');
			return;
		}
		
		console.log(`📱 Attempting to send WhatsApp confirmation to: ${booking.customerPhone}`);
		
		// Format parameters for the template
		const startTime = new Date(timeSlot.startTime);
		const parameters = [
			booking.customerName,
			tour.name,
			formatEmailDateTime(startTime),
			tour.location || 'TBD',
			String(booking.participants),
			formatCurrency(booking.totalAmount, { currency: tourOwner.currency as Currency }),
			booking.ticketQRCode || booking.bookingReference,
			tourOwner.businessName || tourOwner.name || 'Tour Guide'
		];
		
		// Send WhatsApp message
		const result = await sendWhatsAppMessage({
			to: booking.customerPhone,
			template: 'booking_confirmation',
			parameters
		});
		
		// Log the message
		await logWhatsAppMessage(
			tourOwner.id,
			'booking_confirmation',
			booking.customerPhone,
			result
		);
		
		if (result.success) {
			console.log(`✅ WhatsApp booking confirmation sent to ${booking.customerPhone}`);
		} else {
			console.warn(`⚠️ Failed to send WhatsApp booking confirmation: ${result.error}`);
		}
	} catch (error) {
		console.error('Error sending WhatsApp booking confirmation:', error);
	}
}

/**
 * Send WhatsApp booking reminder to customer (24 hours before)
 */
export async function sendWhatsAppBookingReminder(
	booking: Booking,
	tour: Tour,
	timeSlot: TimeSlot,
	tourOwner: AuthUser
): Promise<void> {
	try {
		// Check if tour guide has Professional+ subscription for WhatsApp
		const canSend = await canSendWhatsApp(tourOwner);
		if (!canSend) {
			console.log(`Tour guide ${tourOwner.id} (${tourOwner.subscriptionPlan}) cannot send WhatsApp reminders to customers`);
			return;
		}
		
		// Check if customer provided phone number
		if (!booking.customerPhone) {
			return;
		}
		
		// Format parameters for the template
		const startTime = new Date(timeSlot.startTime);
		const parameters = [
			booking.customerName,
			tour.name,
			formatEmailDateTime(startTime),
			tour.location || 'TBD',
			booking.ticketQRCode || booking.bookingReference
		];
		
		// Send WhatsApp message
		const result = await sendWhatsAppMessage({
			to: booking.customerPhone,
			template: 'booking_reminder',
			parameters
		});
		
		console.log(`WhatsApp reminder result for ${booking.customerPhone}:`, result);
	} catch (error) {
		console.error('Error sending WhatsApp booking reminder:', error);
	}
}

/**
 * Send WhatsApp notification to tour guide about new booking
 */
export async function sendWhatsAppGuideNotification(
	booking: Booking,
	tour: Tour,
	timeSlot: TimeSlot,
	tourGuide: AuthUser
): Promise<void> {
	try {
		// Check if guide can receive WhatsApp notifications
		const canSend = await canSendWhatsApp(tourGuide);
		if (!canSend) {
			console.log(`Tour guide ${tourGuide.id} cannot receive WhatsApp notifications`);
			return;
		}
		
		if (!tourGuide.phone) {
			console.log('❌ Tour guide has no phone number configured');
			return;
		}
		
		console.log(`📱 Attempting to send WhatsApp guide notification to: ${tourGuide.phone}`);
		
		// Format parameters for the template
		const startTime = new Date(timeSlot.startTime);
		const parameters = [
			tourGuide.name || 'Tour Guide',
			tour.name,
			formatEmailDateTime(startTime),
			booking.customerName,
			String(booking.participants),
			formatCurrency(booking.totalAmount, { currency: tourGuide.currency as Currency })
		];
		
		// Send WhatsApp message
		const result = await sendWhatsAppMessage({
			to: tourGuide.phone,
			template: 'new_booking_guide',
			parameters
		});
		
		// Log the message
		await logWhatsAppMessage(
			tourGuide.id,
			'new_booking_guide',
			tourGuide.phone,
			result
		);
		
		if (result.success) {
			console.log(`✅ WhatsApp guide notification sent to ${tourGuide.phone}`);
		} else {
			console.warn(`⚠️ Failed to send WhatsApp guide notification: ${result.error}`);
		}
	} catch (error) {
		console.error('Error sending WhatsApp guide notification:', error);
	}
}

/**
 * Send WhatsApp booking cancellation to customer
 */
export async function sendWhatsAppBookingCancellation(
	booking: Booking,
	tour: Tour,
	timeSlot: TimeSlot,
	tourOwner: AuthUser,
	reason?: string
): Promise<void> {
	try {
		// Check if tour guide has Professional+ subscription for WhatsApp
		const canSend = await canSendWhatsApp(tourOwner);
		if (!canSend) {
			console.log(`Tour guide ${tourOwner.id} (${tourOwner.subscriptionPlan}) cannot send WhatsApp cancellations to customers`);
			return;
		}
		
		// Check if customer provided phone number
		if (!booking.customerPhone) {
			return;
		}
		
		// Format parameters for the template
		const startTime = new Date(timeSlot.startTime);
		const parameters = [
			booking.customerName,
			tour.name,
			formatEmailDateTime(startTime),
			reason || 'Your booking has been cancelled. We apologize for any inconvenience.'
		];
		
		// Send WhatsApp message
		const result = await sendWhatsAppMessage({
			to: booking.customerPhone,
			template: 'booking_cancelled',
			parameters
		});
		
		console.log(`WhatsApp cancellation result for ${booking.customerPhone}:`, result);
	} catch (error) {
		console.error('Error sending WhatsApp booking cancellation:', error);
	}
}

/**
 * Check if WhatsApp notifications are enabled and configured
 */
export function isWhatsAppEnabled(): boolean {
	// Check if feature flag is enabled
	// This can be controlled via environment variable or feature flags
	return process.env.WHATSAPP_ENABLED === 'true';
} 
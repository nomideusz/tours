/**
 * Example: How to integrate WhatsApp notifications into your booking flow
 * This shows the patterns you should use in your actual application code
 */

import { sendWhatsAppMessage } from '../src/lib/whatsapp/sender.js';

// Example 1: Send booking confirmation to customer
async function sendBookingConfirmation(booking, tour, timeSlot, customer) {
	if (!customer.phone) {
		console.log('Customer has no phone number, skipping WhatsApp notification');
		return;
	}
	
	try {
		const result = await sendWhatsAppMessage({
			to: customer.phone, // Must be in E.164 format (e.g., "15558084471")
			template: 'booking_confirmation',
			parameters: [
				customer.name,                           // {{1}} - Customer name
				tour.name,                              // {{2}} - Tour name  
				timeSlot.startTime,                     // {{3}} - Tour date/time
				tour.location || 'TBD',                 // {{4}} - Meeting point
				booking.participants.toString(),        // {{5}} - Number of participants
				`$${booking.totalAmount}`,              // {{6}} - Total amount
				booking.ticketQRCode || booking.id,     // {{7}} - Ticket code
				tour.businessName || 'Zaur Tours'       // {{8}} - Business name
			],
			languageCode: 'en' // Optional, defaults to 'en'
		});
		
		if (result.success) {
			console.log(`✅ WhatsApp confirmation sent to ${customer.phone}`);
			console.log(`Message ID: ${result.messageId}`);
			
			// Optional: Log the message for tracking
			// await logWhatsAppMessage(customer.id, 'booking_confirmation', customer.phone, result);
		} else {
			console.error(`❌ Failed to send WhatsApp confirmation: ${result.error}`);
		}
		
		return result;
	} catch (error) {
		console.error('Error sending WhatsApp booking confirmation:', error);
		return { success: false, error: error.message };
	}
}

// Example 2: Send new booking notification to tour guide
async function notifyGuideOfNewBooking(booking, tour, timeSlot, guide) {
	if (!guide.phone) {
		console.log('Guide has no phone number, skipping WhatsApp notification');
		return;
	}
	
	try {
		const result = await sendWhatsAppMessage({
			to: guide.phone,
			template: 'new_booking_guide',
			parameters: [
				guide.name || guide.businessName,       // {{1}} - Guide name
				tour.name,                              // {{2}} - Tour name
				timeSlot.startTime,                     // {{3}} - Tour date/time
				booking.customerName,                   // {{4}} - Customer name
				booking.participants.toString(),        // {{5}} - Number of participants
				`$${booking.totalAmount}`               // {{6}} - Booking amount
			]
		});
		
		if (result.success) {
			console.log(`✅ WhatsApp guide notification sent to ${guide.phone}`);
		} else {
			console.error(`❌ Failed to send guide notification: ${result.error}`);
		}
		
		return result;
	} catch (error) {
		console.error('Error sending WhatsApp guide notification:', error);
		return { success: false, error: error.message };
	}
}

// Example 3: Send booking reminder (day before tour)
async function sendBookingReminder(booking, tour, timeSlot) {
	if (!booking.customerPhone) {
		return;
	}
	
	try {
		const result = await sendWhatsAppMessage({
			to: booking.customerPhone,
			template: 'booking_reminder', 
			parameters: [
				booking.customerName,                   // {{1}} - Customer name
				tour.name,                              // {{2}} - Tour name
				timeSlot.startTime,                     // {{3}} - Tour date/time
				tour.location || 'TBD',                 // {{4}} - Meeting point
				booking.ticketQRCode || booking.id     // {{5}} - Ticket code
			]
		});
		
		return result;
	} catch (error) {
		console.error('Error sending WhatsApp reminder:', error);
		return { success: false, error: error.message };
	}
}

// Example 4: Integration in your booking creation endpoint
async function processNewBooking(bookingData) {
	// 1. Create booking in database
	const booking = await createBooking(bookingData);
	
	// 2. Send WhatsApp notifications (non-blocking)
	Promise.all([
		// Send confirmation to customer
		sendBookingConfirmation(booking, booking.tour, booking.timeSlot, {
			name: booking.customerName,
			phone: booking.customerPhone
		}),
		
		// Notify tour guide
		notifyGuideOfNewBooking(booking, booking.tour, booking.timeSlot, booking.tour.owner)
	]).catch(error => {
		console.error('WhatsApp notification error:', error);
		// Don't fail the booking if WhatsApp fails
	});
	
	return booking;
}

// Example 5: Phone number validation and formatting
function validateAndFormatPhone(phone) {
	if (!phone) return null;
	
	// Remove all non-digit characters
	const cleaned = phone.replace(/\D/g, '');
	
	// Must be at least 10 digits
	if (cleaned.length < 10) {
		throw new Error('Phone number too short');
	}
	
	// For US numbers, add country code if missing
	if (cleaned.length === 10) {
		return '1' + cleaned; // US country code
	}
	
	return cleaned;
}

// Example 6: Check if user can receive WhatsApp messages
async function canSendWhatsAppToUser(user) {
	// Check feature flags
	if (!isFeatureEnabled('WHATSAPP_NOTIFICATIONS')) {
		return false;
	}
	
	// Check subscription plan
	const allowedPlans = ['professional', 'agency'];
	if (!allowedPlans.includes(user.subscriptionPlan)) {
		return false;
	}
	
	// Check if user has opted in (implement this in your user preferences)
	if (!user.whatsappOptIn) {
		return false;
	}
	
	// Check if phone number is valid
	try {
		validateAndFormatPhone(user.phone);
		return true;
	} catch {
		return false;
	}
}

export {
	sendBookingConfirmation,
	notifyGuideOfNewBooking,
	sendBookingReminder,
	processNewBooking,
	validateAndFormatPhone,
	canSendWhatsAppToUser
};
/**
 * Simple WhatsApp Test Script
 * Usage: node scripts/test-whatsapp.js [phone-number] [template]
 */

import { sendWhatsAppMessage } from '../src/lib/whatsapp/sender.js';
import { config } from 'dotenv';

// Load environment variables
config();

async function testWhatsApp() {
	const args = process.argv.slice(2);
	const phoneNumber = args[0] || '+48602846912'; // Default to your Polish number
	const template = args[1] || 'booking_confirmation';

	console.log('🔄 Testing WhatsApp integration...');
	console.log(`📱 Phone: ${phoneNumber}`);
	console.log(`📋 Template: ${template}`);
	console.log('');

	// Test parameters for different templates (updated for approved Gupshup templates)
	const testParameters = {
		booking_confirmation: [
			'Test User',           // {{1}} - Customer name
			'Test Tour from Script', // {{2}} - Tour name  
			'Tomorrow at 2:00 PM',   // {{3}} - Date/time
			'Main Square',          // {{4}} - Meeting point
			'2',                   // {{5}} - Participants
			'$50',                 // {{6}} - Total amount
			'SCRIPT123',           // {{7}} - Ticket code
			'Zaur'                 // {{8}} - Business name
		],
		booking_reminder: [
			'Test User',           // {{1}} - Customer name (also used in URL)
			'Test Tour from Script', // {{2}} - Tour name
			'Tomorrow at 2:00 PM',   // {{3}} - Date/time  
			'Main Square',          // {{4}} - Meeting point
			'SCRIPT123'            // {{5}} - Ticket code
		],
		new_booking_guide: [
			'Zaur',               // {{1}} - Guide name (also used in URL)
			'Test Tour from Script', // {{2}} - Tour name
			'Tomorrow at 2:00 PM',   // {{3}} - Date/time
			'Test User',          // {{4}} - Customer name
			'2',                  // {{5}} - Participants
			'$50'                 // {{6}} - Amount
		],
		booking_cancelled: [
			'Test User',          // {{1}} - Customer name
			'Test Tour from Script', // {{2}} - Tour name
			'Tomorrow at 2:00 PM',   // {{3}} - Date/time
			'Test cancellation from script' // {{4}} - Reason
		]
	};

	try {
		const result = await sendWhatsAppMessage({
			to: phoneNumber,
			template: template,
			parameters: testParameters[template] || testParameters.booking_confirmation,
			languageCode: 'en'
		});

		if (result.success) {
			console.log('✅ WhatsApp message sent successfully!');
			console.log(`📨 Message ID: ${result.messageId}`);
			console.log(`🔗 Provider: ${result.provider}`);
		} else {
			console.log('❌ Failed to send WhatsApp message');
			console.log(`🚫 Error: ${result.error}`);
		}

	} catch (error) {
		console.error('💥 Script error:', error.message);
	}
}

// Check if script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
testWhatsApp(); 
}

export { testWhatsApp };
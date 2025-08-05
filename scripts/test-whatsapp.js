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

	// Test parameters for different templates
	const testParameters = {
		booking_confirmation: [
			'Test User',
			'Test Tour from Script',
			'Tomorrow at 2:00 PM',
			'Main Square',
			'2',
			'$50',
			'SCRIPT123',
			'Zaur',
			'https://zaur.app/ticket/SCRIPT123'
		],
		booking_reminder: [
			'Test User',
			'Test Tour from Script',
			'Tomorrow at 2:00 PM',
			'Main Square',
			'SCRIPT123',
			'https://zaur.app/ticket/SCRIPT123'
		],
		new_booking_guide: [
			'Zaur',
			'Test Tour from Script',
			'Tomorrow at 2:00 PM',
			'Test User',
			'2',
			'$50',
			'https://zaur.app/dashboard/bookings/123'
		],
		booking_cancelled: [
			'Test User',
			'Test Tour from Script',
			'Tomorrow at 2:00 PM',
			'Test cancellation from script'
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
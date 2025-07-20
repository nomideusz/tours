/**
 * Test script for WhatsApp integration
 * Usage: node scripts/test-whatsapp.js
 */

import 'dotenv/config';
import { sendWhatsAppMessage } from '../src/lib/whatsapp/sender.js';

async function testWhatsApp() {
	console.log('🔍 Testing WhatsApp Integration...\n');
	
	// Check environment variables
	const provider = process.env.PLIVO_AUTH_ID ? 'Plivo' : 
	                process.env.GUPSHUP_API_KEY ? 'Gupshup' : 
	                process.env.TWILIO_ACCOUNT_SID ? 'Twilio' : null;
	
	if (!provider) {
		console.error('❌ No WhatsApp provider configured!');
		console.log('\nPlease set one of the following in your .env file:');
		console.log('- For Plivo: PLIVO_AUTH_ID and PLIVO_AUTH_TOKEN');
		console.log('- For Gupshup: GUPSHUP_API_KEY and GUPSHUP_APP_NAME');
		console.log('- For Twilio: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
		process.exit(1);
	}
	
	console.log(`✅ Provider detected: ${provider}`);
	
	if (!process.env.WHATSAPP_PHONE_NUMBER) {
		console.error('❌ WHATSAPP_PHONE_NUMBER not set in .env file');
		process.exit(1);
	}
	
	console.log(`✅ WhatsApp number: ${process.env.WHATSAPP_PHONE_NUMBER}`);
	
	// Get test phone number from command line or prompt
	const testPhone = process.argv[2];
	if (!testPhone) {
		console.error('\n❌ Please provide a test phone number');
		console.log('Usage: node scripts/test-whatsapp.js +1234567890');
		process.exit(1);
	}
	
	console.log(`\n📱 Sending test message to: ${testPhone}`);
	
	// Send test message
	try {
		const result = await sendWhatsAppMessage({
			to: testPhone,
			template: 'booking_confirmation',
			parameters: [
				'Test Customer',              // Customer name
				'City Walking Tour',          // Tour name
				'December 10, 2024 at 10:00 AM', // Date/time
				'Main Square, City Center',   // Meeting point
				'2',                         // Participants
				'€50.00',                    // Total amount
				'TEST-123-ABC',              // Ticket code
				'Zaur Tours'                 // Business name
			]
		});
		
		if (result.success) {
			console.log(`\n✅ Success! Message sent via ${result.provider}`);
			console.log(`Message ID: ${result.messageId}`);
			console.log('\nCheck your WhatsApp for the test message!');
		} else {
			console.error(`\n❌ Failed to send message: ${result.error}`);
			console.log(`Provider: ${result.provider}`);
		}
	} catch (error) {
		console.error('\n❌ Error:', error.message);
	}
}

// Run the test
testWhatsApp(); 
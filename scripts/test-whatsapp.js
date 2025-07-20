/**
 * Test script for WhatsApp integration
 * Usage: node scripts/test-whatsapp.js
 */

import 'dotenv/config';
// Import doesn't work in standalone Node.js script
// Let's make a direct API call instead

async function testWhatsApp() {
	console.log('🔍 Testing WhatsApp Integration...\n');
	
	// Check which provider we'll actually use
	const provider = process.env.GUPSHUP_API_KEY && process.env.GUPSHUP_APP_NAME ? 'Gupshup' :
	                process.env.PLIVO_AUTH_ID && process.env.PLIVO_AUTH_TOKEN ? 'Plivo' : 
	                process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN ? 'Twilio' : null;
	
	if (!provider) {
		console.error('❌ No WhatsApp provider configured!');
		console.log('\nPlease set one of the following in your .env file:');
		console.log('- For Gupshup: GUPSHUP_API_KEY and GUPSHUP_APP_NAME');
		console.log('- For Plivo: PLIVO_AUTH_ID and PLIVO_AUTH_TOKEN');
		console.log('- For Twilio: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
		process.exit(1);
	}
	
	if (provider !== 'Gupshup') {
		console.error(`❌ This test script only supports Gupshup for now.`);
		console.log(`Detected provider: ${provider}`);
		console.log('Please ensure GUPSHUP_API_KEY and GUPSHUP_APP_NAME are set in .env');
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
	
	// Send test message via API
	try {
		console.log('\n📱 Calling WhatsApp API directly...');
		
		// Use the Gupshup API (already validated above)
		const apiKey = process.env.GUPSHUP_API_KEY;
		const appName = process.env.GUPSHUP_APP_NAME;
		const fromNumber = process.env.WHATSAPP_PHONE_NUMBER;
		
		// Format message with parameters
		const messageText = `🎉 *Booking Confirmed!*

Hello Test Customer,

Your booking for *City Walking Tour* on December 10, 2024 at 10:00 AM has been confirmed!

📍 Meeting point: Main Square, City Center
👥 Participants: 2
💰 Total: €50.00

Your ticket code: *TEST-123-ABC*

Show this code at check-in.

Thank you for booking with Zaur Tours`;

		const params = new URLSearchParams({
			channel: 'whatsapp',
			source: fromNumber.replace('+', ''),
			destination: testPhone.replace('+', ''),
			'src.name': appName,
			message: messageText
		});
		
		const response = await fetch('https://api.gupshup.io/wa/api/v1/msg', {
			method: 'POST',
			headers: {
				'apikey': apiKey,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: params.toString()
		});
		
		const data = await response.json();
		
		if (response.ok && data.status === 'submitted') {
			console.log(`\n✅ Success! Message sent via Gupshup`);
			console.log(`Message ID: ${data.messageId}`);
			console.log(`\nCheck WhatsApp on ${testPhone} for the test message!`);
			console.log('\n📊 Watch your dev server logs for webhook events (delivery status)');
		} else {
			console.error(`\n❌ Failed to send message:`);
			console.error(`Status: ${response.status}`);
			console.error(`Response:`, data);
		}
	} catch (error) {
		console.error('\n❌ Error:', error.message);
	}
}

// Run the test
testWhatsApp(); 
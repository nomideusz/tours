/**
 * Test script for Gupshup webhook endpoint
 * Usage: node scripts/test-gupshup-webhook.js
 */

import 'dotenv/config';

const WEBHOOK_URL = 'http://localhost:5173/api/webhooks/gupshup';
const TOKEN = process.env.GUPSHUP_WEBHOOK_TOKEN;

// Test payloads
const testPayloads = {
	messageEvent: {
		type: 'message-event',
		messageId: 'test-msg-123',
		destAddr: '1234567890',
		status: 'delivered',
		timestamp: Date.now()
	},
	
	incomingMessage: {
		type: 'message',
		sender: {
			phone: '1234567890',
			name: 'Test Customer'
		},
		message: {
			type: 'text',
			text: 'Hello, I need help with my booking'
		},
		timestamp: Date.now()
	},
	
	userEvent: {
		type: 'user-event',
		payload: {
			type: 'opted-out',
			phone: '1234567890'
		}
	}
};

async function testWebhook(payloadName, payload) {
	console.log(`\n🧪 Testing ${payloadName}...`);
	
	try {
		const url = TOKEN ? `${WEBHOOK_URL}?token=${TOKEN}` : WEBHOOK_URL;
		
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});
		
		const result = await response.json();
		
		if (response.ok) {
			console.log(`✅ ${payloadName} test passed`);
			console.log(`Response:`, result);
		} else {
			console.error(`❌ ${payloadName} test failed`);
			console.error(`Status: ${response.status}`);
			console.error(`Response:`, result);
		}
	} catch (error) {
		console.error(`❌ ${payloadName} test error:`, error.message);
	}
}

async function runTests() {
	console.log('🔍 Testing Gupshup Webhook Endpoint...\n');
	
	if (TOKEN) {
		console.log(`✅ Token configured: ${TOKEN.substring(0, 10)}...`);
	} else {
		console.log(`⚠️ No token configured (webhook will accept all requests)`);
	}
	
	// Test all payload types
	for (const [name, payload] of Object.entries(testPayloads)) {
		await testWebhook(name, payload);
		await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
	}
	
	// Test invalid token
	if (TOKEN) {
		console.log(`\n🧪 Testing invalid token...`);
		try {
			const response = await fetch(`${WEBHOOK_URL}?token=invalid`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(testPayloads.messageEvent)
			});
			
			if (response.status === 401) {
				console.log(`✅ Token validation working (401 Unauthorized)`);
			} else {
				console.log(`❌ Token validation not working (got ${response.status})`);
			}
		} catch (error) {
			console.error(`❌ Token test error:`, error.message);
		}
	}
	
	console.log('\n🎉 Webhook tests completed!');
	console.log('\nNext steps:');
	console.log('1. Check your server logs for webhook processing details');
	console.log('2. Send a real WhatsApp message to test end-to-end');
	console.log('3. Monitor webhook events in Gupshup dashboard');
}

// Run tests
runTests(); 
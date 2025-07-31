/**
 * Test script to simulate Gupshup webhook events
 * Usage: node scripts/test-webhook.js
 */

import 'dotenv/config';

async function testWebhook() {
	console.log('🔗 Testing Gupshup Webhook...\n');
	
	const webhookUrl = 'https://zaur.app/api/webhooks/gupshup?token=WHgup_2024_7k9mR3nP8qL5zX2vN9jW4uB6eT1yH8sA';
	
	// Test 1: Message status event (sent)
	console.log('📤 Testing message status event (sent)...');
	const messageEvent = {
		type: 'message-event',
		messageId: '785e3174-ef53-4e85-ba01-76093685fc22',
		destAddr: '15558084471',
		status: 'sent',
		timestamp: Date.now()
	};
	
	try {
		const response1 = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(messageEvent)
		});
		
		const result1 = await response1.json();
		console.log(`Status: ${response1.status}`, result1);
	} catch (error) {
		console.error('❌ Error testing message event:', error.message);
	}
	
	// Test 2: Incoming message simulation
	console.log('\n💬 Testing incoming message...');
	const incomingMessage = {
		type: 'message',
		sender: {
			phone: '15558084471',
			name: 'Test User'
		},
		message: {
			type: 'text',
			text: 'Hello, I need help with my booking'
		},
		timestamp: Date.now()
	};
	
	try {
		const response2 = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(incomingMessage)
		});
		
		const result2 = await response2.json();
		console.log(`Status: ${response2.status}`, result2);
	} catch (error) {
		console.error('❌ Error testing incoming message:', error.message);
	}
	
	// Test 3: User opt-out event
	console.log('\n🚫 Testing user opt-out event...');
	const optOutEvent = {
		type: 'user-event',
		payload: {
			type: 'opted-out',
			phone: '15558084471'
		},
		timestamp: Date.now()
	};
	
	try {
		const response3 = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(optOutEvent)
		});
		
		const result3 = await response3.json();
		console.log(`Status: ${response3.status}`, result3);
	} catch (error) {
		console.error('❌ Error testing opt-out event:', error.message);
	}
	
	console.log('\n✅ Webhook tests completed!');
	console.log('Check your server logs at https://zaur.app for webhook processing details.');
}

// Run the test
testWebhook();
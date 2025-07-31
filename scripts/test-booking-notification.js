/**
 * Test script for booking WhatsApp notifications
 * Usage: node scripts/test-booking-notification.js [booking-id]
 */

import 'dotenv/config';

async function testBookingNotification() {
	console.log('📱 Testing Booking WhatsApp Notifications...\n');
	
	// You can replace this with an actual booking ID from your database
	const testBookingId = process.argv[2] || 'test-booking-123';
	
	console.log(`Using booking ID: ${testBookingId}`);
	
	// Test different notification types
	const notificationTypes = [
		'booking_confirmation',
		'guide_notification',
		'booking_reminder'
	];
	
	const baseUrl = 'https://zaur.app/api/send-whatsapp-notification';
	// For local testing, use: 'http://localhost:5173/api/send-whatsapp-notification';
	
	for (const notificationType of notificationTypes) {
		console.log(`\n📤 Testing ${notificationType}...`);
		
		try {
			const response = await fetch(baseUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					bookingId: testBookingId,
					notificationType: notificationType,
					...(notificationType === 'booking_cancellation' && {
						cancellationReason: 'Test cancellation reason'
					})
				})
			});
			
			const result = await response.json();
			
			if (response.ok) {
				console.log(`✅ ${notificationType} notification sent successfully`);
				console.log(`   - Has customer phone: ${result.hasCustomerPhone}`);
				console.log(`   - Has guide phone: ${result.hasGuidePhone}`);
				console.log(`   - Message: ${result.message}`);
			} else {
				console.log(`❌ Failed to send ${notificationType}:`);
				console.log(`   - Status: ${response.status}`);
				console.log(`   - Error: ${result.error}`);
				console.log(`   - Details: ${result.details || 'N/A'}`);
			}
		} catch (error) {
			console.error(`❌ Error testing ${notificationType}:`, error.message);
		}
	}
	
	console.log('\n✅ Booking notification tests completed!');
	console.log('\nNote: If you see "Booking not found" errors, that\'s expected when using a test booking ID.');
	console.log('To test with real data, create a booking through your app and use its ID.');
}

// Run the test
testBookingNotification();
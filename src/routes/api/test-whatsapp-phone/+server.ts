import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendWhatsAppMessage } from '$lib/whatsapp/sender.js';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { phoneNumber, template = 'booking_confirmation' } = await request.json();
		
		if (!phoneNumber) {
			return json({ 
				error: 'Phone number is required' 
			}, { status: 400 });
		}
		
		// Test phone number formatting
		const testParameters = [
			'Test User',
			'Test Tour',
			'January 15, 2024 at 2:00 PM',
			'Test Location',
			'2',
			'€25.00',
			'TEST123',
			'Test Business',
			'https://zaur.app/ticket/TEST123'
		];
		
		console.log(`🧪 Testing WhatsApp phone formatting for: ${phoneNumber}`);
		
		// Attempt to send test message
		const result = await sendWhatsAppMessage({
			to: phoneNumber,
			template: template as any,
			parameters: testParameters
		});
		
		return json({
			success: result.success,
			phoneNumber,
			result,
			debug: {
				originalPhone: phoneNumber,
				provider: result.provider,
				message: result.error || 'Message sent successfully'
			}
		});
		
	} catch (error) {
		console.error('WhatsApp test error:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			debug: {
				originalPhone: null,
				provider: null,
				message: 'Failed to process phone number'
			}
		}, { status: 500 });
	}
};
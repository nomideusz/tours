import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendWhatsAppMessage } from '$lib/whatsapp/sender.js';
import { isAdmin } from '$lib/auth/server.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check admin authentication
		const user = locals.user;
		if (!user || !isAdmin(user)) {
			return error(403, 'Admin access required');
		}

		const { phoneNumber, template, parameters } = await request.json();

		// Validate inputs
		if (!phoneNumber) {
			return error(400, 'Phone number is required');
		}

		if (!template) {
			return error(400, 'Template is required');
		}

		// Send WhatsApp message
		const result = await sendWhatsAppMessage({
			to: phoneNumber,
			template: template,
			parameters: parameters || [],
			languageCode: 'en'
		});

		if (!result.success) {
			return error(500, result.error || 'Failed to send WhatsApp message');
		}

		return json({
			success: true,
			messageId: result.messageId,
			provider: result.provider,
			message: 'WhatsApp test message sent successfully'
		});

	} catch (err) {
		console.error('WhatsApp test error:', err);
		return error(500, 'Internal server error');
	}
};
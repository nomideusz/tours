import { env } from '$env/dynamic/private';
import { WHATSAPP_PROVIDERS, type WhatsAppProviderType, type WhatsAppTemplateType, WHATSAPP_TEMPLATES } from './config.js';
import type { AuthUser } from '$lib/stores/auth.js';

export interface WhatsAppMessage {
	to: string; // Phone number in E.164 format
	template: WhatsAppTemplateType;
	parameters: string[];
	languageCode?: string;
}

export interface WhatsAppResult {
	success: boolean;
	messageId?: string;
	error?: string;
	provider?: WhatsAppProviderType;
}

/**
 * Format phone number to WhatsApp format (without + prefix)
 */
function formatWhatsAppPhone(phone: string): string {
	// Remove all non-digit characters
	let cleaned = phone.replace(/\D/g, '');
	
	// Ensure it has a country code
	if (cleaned.length < 10) {
		throw new Error('Phone number too short');
	}
	
	return cleaned;
}

/**
 * Send WhatsApp message using Plivo
 */
async function sendViaPlivio(message: WhatsAppMessage): Promise<WhatsAppResult> {
	const authId = env.PLIVO_AUTH_ID;
	const authToken = env.PLIVO_AUTH_TOKEN;
	const fromNumber = env.WHATSAPP_PHONE_NUMBER; // Your WhatsApp Business number
	
	if (!authId || !authToken || !fromNumber) {
		return { 
			success: false, 
			error: 'Plivo credentials not configured' 
		};
	}
	
	try {
		const template = WHATSAPP_TEMPLATES[message.template];
		const url = `${WHATSAPP_PROVIDERS.plivo.apiUrl}/${authId}/Message/`;
		
		// Format the message body with parameters
		let body = template.components.find(c => c.type === 'body')?.text || '';
		message.parameters.forEach((param, index) => {
			body = body.replace(`{{${index + 1}}}`, param);
		});
		
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Authorization': 'Basic ' + btoa(`${authId}:${authToken}`),
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				src: fromNumber,
				dst: message.to,
				type: 'whatsapp',
				template: {
					name: template.name,
					language: message.languageCode || 'en',
					components: [
						{
							type: 'body',
							parameters: message.parameters.map(text => ({ type: 'text', text }))
						}
					]
				}
			})
		});
		
		const data = await response.json();
		
		if (response.ok) {
			return {
				success: true,
				messageId: data.message_uuid?.[0],
				provider: 'plivo'
			};
		} else {
			return {
				success: false,
				error: data.error || 'Failed to send message',
				provider: 'plivo'
			};
		}
	} catch (error) {
		console.error('Plivo WhatsApp error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			provider: 'plivo'
		};
	}
}

/**
 * Send WhatsApp message using Gupshup
 */
async function sendViaGupshup(message: WhatsAppMessage): Promise<WhatsAppResult> {
	const apiKey = env.GUPSHUP_API_KEY;
	const appName = env.GUPSHUP_APP_NAME;
	const fromNumber = env.WHATSAPP_PHONE_NUMBER;
	
	if (!apiKey || !appName || !fromNumber) {
		return { 
			success: false, 
			error: 'Gupshup credentials not configured' 
		};
	}
	
	try {
		const template = WHATSAPP_TEMPLATES[message.template];
		const url = `${WHATSAPP_PROVIDERS.gupshup.apiUrl}/msg`;
		
		// Build template message
		const templateMessage = {
			id: template.name,
			params: message.parameters
		};
		
		const params = new URLSearchParams({
			channel: 'whatsapp',
			source: fromNumber.replace('+', ''),
			destination: message.to,
			'src.name': appName,
			template: JSON.stringify(templateMessage)
		});
		
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'apikey': apiKey,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: params.toString()
		});
		
		const data = await response.json();
		
		if (response.ok && data.status === 'submitted') {
			return {
				success: true,
				messageId: data.messageId,
				provider: 'gupshup'
			};
		} else {
			return {
				success: false,
				error: data.message || 'Failed to send message',
				provider: 'gupshup'
			};
		}
	} catch (error) {
		console.error('Gupshup WhatsApp error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			provider: 'gupshup'
		};
	}
}

/**
 * Send WhatsApp message using Twilio
 */
async function sendViaTwilio(message: WhatsAppMessage): Promise<WhatsAppResult> {
	const accountSid = env.TWILIO_ACCOUNT_SID;
	const authToken = env.TWILIO_AUTH_TOKEN;
	const messagingServiceSid = env.TWILIO_WHATSAPP_SERVICE_SID;
	
	if (!accountSid || !authToken || !messagingServiceSid) {
		return { 
			success: false, 
			error: 'Twilio credentials not configured' 
		};
	}
	
	try {
		const template = WHATSAPP_TEMPLATES[message.template];
		const url = `${WHATSAPP_PROVIDERS.twilio.apiUrl}/Accounts/${accountSid}/Messages.json`;
		
		// Format content variables
		const contentVariables: Record<number, string> = {};
		message.parameters.forEach((param, index) => {
			contentVariables[index + 1] = param;
		});
		
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				To: `whatsapp:+${message.to}`,
				MessagingServiceSid: messagingServiceSid,
				ContentSid: template.name, // Assumes template is pre-approved in Twilio
				ContentVariables: JSON.stringify(contentVariables)
			}).toString()
		});
		
		const data = await response.json();
		
		if (response.ok) {
			return {
				success: true,
				messageId: data.sid,
				provider: 'twilio'
			};
		} else {
			return {
				success: false,
				error: data.message || 'Failed to send message',
				provider: 'twilio'
			};
		}
	} catch (error) {
		console.error('Twilio WhatsApp error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			provider: 'twilio'
		};
	}
}

/**
 * Get the configured WhatsApp provider
 */
function getConfiguredProvider(): WhatsAppProviderType | null {
	// Check which provider is configured
	if (env.PLIVO_AUTH_ID && env.PLIVO_AUTH_TOKEN) {
		return 'plivo';
	} else if (env.GUPSHUP_API_KEY && env.GUPSHUP_APP_NAME) {
		return 'gupshup';
	} else if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
		return 'twilio';
	}
	
	return null;
}

/**
 * Check if user has WhatsApp notifications enabled
 */
export async function canSendWhatsApp(user: AuthUser): Promise<boolean> {
	// Check if feature is enabled for user's plan
	const allowedPlans = ['professional', 'agency'];
	if (!allowedPlans.includes(user.subscriptionPlan || 'free')) {
		return false;
	}
	
	// Check if user has a valid phone number
	if (!user.phone || user.phone.length < 10) {
		return false;
	}
	
	// TODO: Check if user has opted in to WhatsApp notifications
	// This could be stored in user preferences
	
	return true;
}

/**
 * Send WhatsApp message using configured provider
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<WhatsAppResult> {
	try {
		// Format phone number
		const formattedPhone = formatWhatsAppPhone(message.to);
		const formattedMessage = { ...message, to: formattedPhone };
		
		// Get configured provider
		const provider = getConfiguredProvider();
		
		if (!provider) {
			return {
				success: false,
				error: 'No WhatsApp provider configured'
			};
		}
		
		// Send via appropriate provider
		switch (provider) {
			case 'plivo':
				return await sendViaPlivio(formattedMessage);
			case 'gupshup':
				return await sendViaGupshup(formattedMessage);
			case 'twilio':
				return await sendViaTwilio(formattedMessage);
			default:
				return {
					success: false,
					error: 'Invalid provider'
				};
		}
	} catch (error) {
		console.error('WhatsApp send error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to send WhatsApp message'
		};
	}
}

/**
 * Log WhatsApp message for tracking
 */
export async function logWhatsAppMessage(
	userId: string,
	messageType: WhatsAppTemplateType,
	recipient: string,
	result: WhatsAppResult
): Promise<void> {
	// TODO: Implement message logging to database
	// This can be used for:
	// - Tracking message delivery
	// - Billing/usage tracking
	// - Debugging
	// - Analytics
	
	console.log('WhatsApp message log:', {
		userId,
		messageType,
		recipient,
		...result,
		timestamp: new Date().toISOString()
	});
} 
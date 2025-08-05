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
 * Format phone number to E.164 format (international standard)
 */
function formatPhoneToE164(phone: string): string {
	// Remove all non-digit characters except the leading +
	let cleaned = phone.replace(/[^\d+]/g, '');
	
	// Ensure it starts with +
	if (!cleaned.startsWith('+')) {
		// If it's a 10-digit number, assume US/Canada and add +1
		if (cleaned.length === 10 && cleaned[0] >= '2' && cleaned[0] <= '9') {
			cleaned = '+1' + cleaned;
		} else if (cleaned.length > 10) {
			// For longer numbers, add + prefix
			cleaned = '+' + cleaned;
		} else {
			throw new Error('Phone number too short or invalid format');
		}
	}
	
	// Validate the format (must start with + and have at least 7 digits after country code)
	const e164Regex = /^\+[1-9]\d{6,14}$/;
	
	if (!e164Regex.test(cleaned)) {
		throw new Error(`Invalid phone number format: ${phone}`);
	}
	
	return cleaned;
}

/**
 * Format phone number for specific WhatsApp provider
 */
function formatPhoneForProvider(e164Phone: string, provider: WhatsAppProviderType): string {
	switch (provider) {
		case 'gupshup':
			// Gupshup expects phone without + prefix
			return e164Phone.replace('+', '');
		case 'twilio':
			// Twilio expects full E.164 format with +
			return e164Phone;
		case 'plivo':
			// Plivo expects phone without + prefix
			return e164Phone.replace('+', '');
		default:
			return e164Phone.replace('+', '');
	}
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
		
		// Build template components
		const components: any[] = [
			{
				type: 'body',
				parameters: message.parameters.slice(0, template.components.find(c => c.type === 'body')?.text.match(/\{\{\d+\}\}/g)?.length || 0).map(text => ({ type: 'text', text }))
			}
		];
		
		// Add button components if template has buttons
		const buttonComponent = template.components.find(c => c.type === 'buttons');
		if (buttonComponent && 'buttons' in buttonComponent) {
			const buttonParams = message.parameters.slice(components[0].parameters.length);
			components.push({
				type: 'button',
				sub_type: 'url',
				index: '0',
				parameters: buttonParams.map(text => ({ type: 'text', text }))
			});
		}

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
					components: components
				}
			})
		});
		
		// Handle both JSON and non-JSON responses
		let data;
		const responseText = await response.text();
		
		try {
			data = JSON.parse(responseText);
		} catch {
			// If response is not JSON, treat it as an error message
			data = { error: responseText };
		}
		
		if (response.ok) {
			return {
				success: true,
				messageId: data.message_uuid?.[0],
				provider: 'plivo'
			};
		} else {
			return {
				success: false,
				error: data.error || responseText || 'Failed to send message',
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
		
		// Build template message for Gupshup
		const templateMessage = {
			id: template.name,
			params: message.parameters
		};
		
		console.log('📤 Gupshup template payload:', {
			template: template.name,
			parameters: message.parameters,
			destination: message.to,
			source: fromNumber.replace('+', '')
		});
		
		// Debug: Try text message first to ensure basic API works
		const isTemplate = false; // Temporarily back to text for debugging
		
		let params;
		if (isTemplate) {
			// Gupshup template message format - using HSM template structure
			const hsmTemplate = {
				isHSM: true,
				type: 'template',
				template: {
					templateType: 'ACCOUNT_UPDATE',
					id: template.name,
					params: message.parameters
				}
			};
			
			params = new URLSearchParams({
				channel: 'whatsapp',
				source: fromNumber.replace('+', ''),
				destination: message.to,
				'src.name': appName,
				'message': JSON.stringify(hsmTemplate)
			});
			
			console.log('📤 Gupshup HSM payload:', JSON.stringify(hsmTemplate, null, 2));
		} else {
			// Simple text message format for testing
			let textMessage = template.components.find(c => c.type === 'body')?.text || 'Test message';
			
			// Replace parameters in the text
			message.parameters.forEach((param, index) => {
				textMessage = textMessage.replace(`{{${index + 1}}}`, param);
			});
			
			console.log('📤 Gupshup text message:', textMessage);
			
			// Try simplest possible format
			params = new URLSearchParams({
				channel: 'whatsapp',
				source: fromNumber.replace('+', ''),
				destination: message.to,
				'src.name': appName,
				message: textMessage  // Try without JSON.stringify
			});
			
			console.log('📤 All request params:', params.toString());
		}
		
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'apikey': apiKey,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: params.toString()
		});
		
		console.log('📥 Gupshup response status:', response.status);
		
		// Handle both JSON and non-JSON responses
		let data;
		const responseText = await response.text();
		console.log('📥 Gupshup response body:', responseText);
		
		try {
			data = JSON.parse(responseText);
		} catch {
			// If response is not JSON, treat it as an error message
			data = { message: responseText };
		}
		
		if (response.ok && data.status === 'submitted') {
			return {
				success: true,
				messageId: data.messageId,
				provider: 'gupshup'
			};
		} else {
			return {
				success: false,
				error: data.message || responseText || 'Failed to send message',
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
				To: `whatsapp:${message.to}`, // message.to already includes + for Twilio
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
	// Check for explicit provider setting first
	const explicitProvider = env.WHATSAPP_PROVIDER as WhatsAppProviderType;
	if (explicitProvider && ['plivo', 'gupshup', 'twilio'].includes(explicitProvider)) {
		// Verify the explicit provider has required credentials
		if (explicitProvider === 'plivo' && env.PLIVO_AUTH_ID && env.PLIVO_AUTH_TOKEN) {
			return 'plivo';
		} else if (explicitProvider === 'gupshup' && env.GUPSHUP_API_KEY && env.GUPSHUP_APP_NAME) {
			return 'gupshup';
		} else if (explicitProvider === 'twilio' && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
			return 'twilio';
		}
	}
	
	// Fall back to auto-detection (prioritize Gupshup since that's what's configured)
	if (env.GUPSHUP_API_KEY && env.GUPSHUP_APP_NAME) {
		return 'gupshup';
	} else if (env.PLIVO_AUTH_ID && env.PLIVO_AUTH_TOKEN) {
		return 'plivo';
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
	
	// Check if user has enabled WhatsApp notifications in their preferences
	if (user.whatsappNotifications === false) {
		return false;
	}
	
	return true;
}

/**
 * Send WhatsApp message using configured provider
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<WhatsAppResult> {
	try {
		// Get configured provider first
		const provider = getConfiguredProvider();
		
		if (!provider) {
			return {
				success: false,
				error: 'No WhatsApp provider configured'
			};
		}
		
		// Format phone number to E.164 first, then provider-specific format
		const e164Phone = formatPhoneToE164(message.to);
		const providerPhone = formatPhoneForProvider(e164Phone, provider);
		const formattedMessage = { ...message, to: providerPhone };
		
		console.log(`📱 Formatting phone for ${provider}: ${message.to} → ${e164Phone} → ${providerPhone}`);
		
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
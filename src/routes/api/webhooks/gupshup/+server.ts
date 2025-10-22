import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/db/connection.js';
import { notifications } from '$lib/db/schema/index.js';
import { createId } from '@paralleldrive/cuid2';
import { sendNotificationToUser } from '$lib/notifications/server.js';

interface GupshupWebhookPayload {
	app?: string;
	timestamp?: number;
	version?: number;
	type: 'message-event' | 'user-event' | 'message' | 'system-event';
	payload: {
		id?: string;
		gsId?: string;  // Gupshup message ID
		type?: string;  // Status: sent, delivered, read, failed, etc.
		destination?: string;
		phone?: string;
		whatsappMessageId?: string;
		payload?: {  // Error details when status is failed
			code?: number;
			reason?: string;
			message?: string;
		};
		context?: {
			id?: string;
			gsId?: string;
		};
	};
	// For message events (legacy fields - may not be used)
	messageId?: string;
	destAddr?: string;
	srcAddr?: string;
	// Status events (legacy fields - may not be used)
	status?: 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';
	statusCode?: number;
	errors?: Array<{
		code: number;
		title: string;
		details?: string;
	}>;
	// For incoming messages
	message?: {
		text?: string;
		type?: string;
		url?: string;
		caption?: string;
	};
	sender?: {
		phone?: string;
		name?: string;
	};
}

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		// Optional: Verify webhook token if configured
		const token = env.GUPSHUP_WEBHOOK_TOKEN;
		if (token) {
			const providedToken = url.searchParams.get('token') || request.headers.get('x-gupshup-token');
			if (providedToken !== token) {
				console.warn('❌ Invalid Gupshup webhook token');
				return json({ error: 'Unauthorized' }, { status: 401 });
			}
		}
		
		// Gupshup can send different content types
		const contentType = request.headers.get('content-type') || '';
		let payload: GupshupWebhookPayload;
		
		if (contentType.includes('application/json')) {
			payload = await request.json();
		} else {
			// Form data or URL encoded
			const text = await request.text();
			const params = new URLSearchParams(text);
			payload = JSON.parse(params.get('payload') || '{}');
		}
		
		// Extract data from the correct Gupshup webhook structure
		const messageId = payload.payload?.gsId || payload.payload?.id;
		const status = payload.payload?.type;
		const recipient = payload.payload?.destination;
		const errorDetails = payload.payload?.payload;
		
		console.log('📱 Gupshup webhook received:', {
			type: payload.type,
			messageId: messageId,
			status: status,
			recipient: recipient,
			timestamp: new Date(payload.timestamp || Date.now()).toISOString()
		});
		
		// Debug: Log the full payload structure to understand the format
		console.log('🔍 Full webhook payload:', JSON.stringify(payload, null, 2));
		
		// Handle different event types
		switch (payload.type) {
			case 'message-event':
				await handleMessageEvent(payload);
				break;
				
			case 'message':
				await handleIncomingMessage(payload);
				break;
				
			case 'user-event':
				await handleUserEvent(payload);
				break;
				
			case 'system-event':
				console.log('System event:', payload);
				break;
				
			default:
				console.log('Unknown webhook type:', payload.type);
		}
		
		// Gupshup expects 200 OK response
		return json({ success: true });
		
	} catch (error) {
		console.error('❌ Gupshup webhook error:', error);
		return json({ 
			error: 'Webhook processing failed',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};

/**
 * Handle message delivery status events
 */
async function handleMessageEvent(payload: GupshupWebhookPayload) {
	// Extract from the correct Gupshup webhook structure
	const messageId = payload.payload?.gsId || payload.payload?.id;
	const status = payload.payload?.type;
	const recipient = payload.payload?.destination;
	const errorDetails = payload.payload?.payload;
	
	console.log(`📊 Message status update:`, {
		messageId,
		status,
		recipient,
		errors: errorDetails ? [errorDetails] : undefined
	});
	
	// Map Gupshup status to user-friendly message
	let statusMessage = '';
	let notificationType: 'info' | 'success' | 'error' = 'info';
	
	switch (status) {
		case 'sent':
			statusMessage = 'WhatsApp message sent successfully';
			notificationType = 'success';
			break;
		case 'delivered':
			statusMessage = 'WhatsApp message delivered';
			notificationType = 'success';
			break;
		case 'read':
			statusMessage = 'WhatsApp message read by recipient';
			notificationType = 'success';
			break;
		case 'failed':
			const errorMessage = errorDetails?.reason || errorDetails?.message || 'Unknown error';
			const errorCode = errorDetails?.code;
			
			// Error 470 is WhatsApp's 24-hour messaging window policy - not a technical error
			if (errorCode === 470) {
				statusMessage = `WhatsApp delivery skipped: Customer outside 24-hour messaging window`;
				notificationType = 'info'; // Not an error, just a policy limitation
				console.log(`ℹ️ WhatsApp message not sent (24-hour window):`, {
					messageId,
					recipient,
					note: 'Customer needs to message first or be within 24h of last interaction'
				});
			} else {
				statusMessage = `WhatsApp delivery failed: ${errorMessage}`;
				notificationType = 'error';
				console.error(`⚠️ WhatsApp message failed:`, {
					messageId,
					recipient,
					errorDetails
				});
			}
			break;
		case 'deleted':
			statusMessage = 'WhatsApp message was deleted';
			notificationType = 'info';
			break;
		default:
			statusMessage = `WhatsApp message status: ${status}`;
			notificationType = status === 'failed' ? 'error' : 'info';
	}
	
	// TODO: Update message status in database if you're tracking messages
	// await updateMessageStatus(messageId, status);
	
	// Only log actual errors, not policy-based restrictions
	if (status === 'deleted') {
		console.warn(`⚠️ WhatsApp message deleted:`, {
			messageId,
			recipient
		});
	}
	// Error 470 is already logged above with proper context
}

/**
 * Handle incoming messages from customers
 */
async function handleIncomingMessage(payload: GupshupWebhookPayload) {
	const { sender, message, timestamp } = payload;
	
	if (!sender?.phone || !message) {
		console.warn('Invalid incoming message payload');
		return;
	}
	
	console.log(`💬 Incoming WhatsApp message:`, {
		from: sender.phone,
		name: sender.name,
		type: message.type,
		text: message.text?.substring(0, 100) // Log first 100 chars
	});
	
	// TODO: Implement your incoming message handling logic
	// Examples:
	// - Auto-reply with tour information
	// - Create support ticket
	// - Forward to tour guide
	// - Store in conversation history
	
	// For now, just log it
	if (message.type === 'text' && message.text) {
		// Handle text messages
		await handleCustomerQuery(sender.phone, message.text);
	} else if (message.type === 'image' || message.type === 'document') {
		// Handle media messages
		console.log(`Received ${message.type} from ${sender.phone}`);
	}
}

/**
 * Handle user events (opt-in/opt-out)
 */
async function handleUserEvent(payload: GupshupWebhookPayload) {
	const { payload: eventData } = payload;
	
	console.log('👤 User event:', {
		type: eventData.type,
		phone: eventData.phone || eventData.destination
	});
	
	// Handle opt-out events
	if (eventData.type === 'opted-out' || eventData.type === 'opted_out') {
		const phone = eventData.phone || eventData.destination;
		if (phone) {
			console.warn(`⚠️ User opted out: ${phone}`);
			// TODO: Update user preferences to disable WhatsApp
			// await updateUserWhatsAppOptOut(phone, true);
		}
	}
}

/**
 * Handle customer queries (basic example)
 */
async function handleCustomerQuery(phone: string, message: string) {
	// Convert common queries to lowercase for matching
	const query = message.toLowerCase().trim();
	
	// Basic keyword matching (you can enhance this)
	if (query.includes('help') || query.includes('info')) {
		// Send automated help response
		console.log(`Auto-reply triggered for ${phone}: Help request`);
		// TODO: Send help message via WhatsApp
	} else if (query.includes('cancel') || query.includes('refund')) {
		// Flag for manual review
		console.log(`Manual review needed for ${phone}: Cancellation query`);
		// TODO: Create support ticket or notify tour guide
	} else {
		// Log for future enhancement
		console.log(`Unhandled query from ${phone}: "${message.substring(0, 50)}..."`);
	}
}

// Helper function to update message tracking (implement if needed)
async function updateMessageStatus(messageId: string, status: string) {
	// Example implementation:
	// await db.update(whatsappMessages)
	//   .set({ 
	//     status, 
	//     updatedAt: new Date() 
	//   })
	//   .where(eq(whatsappMessages.messageId, messageId));
} 
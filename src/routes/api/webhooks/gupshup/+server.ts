import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/db/connection.js';
import { notifications } from '$lib/db/schema/index.js';
import { createId } from '@paralleldrive/cuid2';
import { sendNotificationToUser } from '$lib/notifications/server.js';

interface GupshupWebhookPayload {
	type: 'message-event' | 'user-event' | 'message' | 'system-event';
	payload: {
		id?: string;
		type?: string;
		destination?: string;
		phone?: string;
		whatsappMessageId?: string;
		context?: {
			id?: string;
			gsId?: string;
		};
	};
	// For message events
	messageId?: string;
	destAddr?: string;
	srcAddr?: string;
	// Status events
	status?: 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';
	statusCode?: number;
	errors?: Array<{
		code: number;
		title: string;
		details?: string;
	}>;
	timestamp?: number;
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
		
		console.log('📱 Gupshup webhook received:', {
			type: payload.type,
			messageId: payload.messageId,
			status: payload.status,
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
	const { messageId, status, destAddr, errors, timestamp } = payload;
	
	console.log(`📊 Message status update:`, {
		messageId,
		status,
		recipient: destAddr,
		errors: errors?.length ? errors : undefined
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
			statusMessage = `WhatsApp delivery failed: ${errors?.[0]?.title || 'Unknown error'}`;
			notificationType = 'error';
			break;
		case 'deleted':
			statusMessage = 'WhatsApp message was deleted';
			notificationType = 'info';
			break;
	}
	
	// TODO: Update message status in database if you're tracking messages
	// await updateMessageStatus(messageId, status);
	
	// Log significant events
	if (status === 'failed' || status === 'deleted') {
		console.error(`⚠️ WhatsApp message ${status}:`, {
			messageId,
			recipient: destAddr,
			errors
		});
	}
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
/**
 * WhatsApp Business API Configuration
 * Supports multiple providers: Plivo, Gupshup, Twilio
 */

export interface WhatsAppProvider {
	name: string;
	apiUrl: string;
	authType: 'bearer' | 'basic' | 'custom';
	pricing: {
		perMessage?: number;
		perConversation?: number;
		currency: string;
	};
}

export const WHATSAPP_PROVIDERS = {
	plivo: {
		name: 'Plivo',
		apiUrl: 'https://api.plivo.com/v1/Account',
		authType: 'basic',
		pricing: {
			perConversation: 0.00080,
			currency: 'USD'
		}
	},
	gupshup: {
		name: 'Gupshup',
		apiUrl: 'https://api.gupshup.io/wa/api/v1',
		authType: 'custom',
		pricing: {
			perMessage: 0.001,
			currency: 'USD'
		}
	},
	twilio: {
		name: 'Twilio',
		apiUrl: 'https://api.twilio.com/2010-04-01',
		authType: 'basic',
		pricing: {
			perMessage: 0.005,
			currency: 'USD'
		}
	}
} as const;

export type WhatsAppProviderType = keyof typeof WHATSAPP_PROVIDERS;

// WhatsApp message templates - Updated to match approved Gupshup templates
export const WHATSAPP_TEMPLATES = {
	booking_confirmation: {
		name: 'booking_confirmation',
		category: 'utility',
		components: [
			{
				type: 'header',
				format: 'text',
				text: 'Booking Confirmed!'
			},
			{
				type: 'body',
				text: 'Hello {{1}},\n\nYour booking for *{{2}}* on {{3}} has been confirmed!\n\n📍 Meeting point: {{4}}\n👥 Participants: {{5}}\n💰 Total: {{6}}\n\nYour ticket code: *{{7}}*\n\nShow this code at check-in.\n\nThank you for booking with {{8}}'
			},
			{
				type: 'buttons',
				buttons: [
					{
						type: 'url',
						text: 'View Ticket',
						url: 'https://zaur.app/ticket/{{1}}'  // Uses customer name/code parameter
					}
				]
			}
		]
	},
	booking_reminder: {
		name: 'booking_reminder',
		category: 'utility',
		components: [
			{
				type: 'header',
				format: 'text',
				text: 'Tour Reminder'
			},
			{
				type: 'body',
				text: 'Hi {{1}},\n\nThis is a friendly reminder about your tour tomorrow!\n\n🎯 *{{2}}*\n📅 {{3}}\n📍 Meeting point: {{4}}\n\nYour ticket code: *{{5}}*\n\nPlease arrive 10 minutes early. See you there!'
			},
			{
				type: 'buttons',
				buttons: [
					{
						type: 'url',
						text: 'View Ticket',
						url: 'https://zaur.app/ticket{{1}}'  // Uses customer parameter
					}
				]
			}
		]
	},
	new_booking_guide: {
		name: 'new_booking_guide',
		category: 'utility',
		components: [
			{
				type: 'header',
				format: 'text',
				text: 'New Booking Received!'
			},
			{
				type: 'body',
				text: 'Hello {{1}},\n\nYou have a new booking!\n\n🎯 Tour: *{{2}}*\n📅 Date: {{3}}\n👤 Customer: {{4}}\n👥 Participants: {{5}}\n💰 Amount: {{6}}\n\nCheck your dashboard for full details.'
			},
			{
				type: 'buttons',
				buttons: [
					{
						type: 'url',
						text: 'View Bookin',  // Matches Gupshup template exactly
						url: 'https://zaur.app/bookings{{1}}'  // Uses guide parameter
					}
				]
			}
		]
	},
	booking_cancelled: {
		name: 'booking_cancelled',
		category: 'utility',
		components: [
			{
				type: 'header',
				format: 'text',
				text: 'Booking Cancelled'
			},
			{
				type: 'body',
				text: 'Hi {{1}},\n\nYour booking for *{{2}}* on {{3}} has been cancelled.\n\n{{4}}\n\nIf you have any questions, please contact us.'
			}
		]
	}
} as const;

export type WhatsAppTemplateType = keyof typeof WHATSAPP_TEMPLATES; 
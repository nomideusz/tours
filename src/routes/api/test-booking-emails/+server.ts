import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { bookingsApi } from '$lib/pocketbase.js';

// Server-side email API - calls PocketBase directly
const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { action, bookingId, emailType } = await request.json();

    if (!action) {
      return json({ error: 'Action is required' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'test':
        const testResponse = await fetch(`${POCKETBASE_URL}/api/send-booking-test-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!testResponse.ok) {
          const errorData = await testResponse.json();
          throw new Error(`Test email API error: ${errorData.error || 'Unknown error'}`);
        }
        result = { message: 'Test email sent successfully' };
        break;

      case 'send-email':
        if (!bookingId || !emailType) {
          return json({ error: 'bookingId and emailType are required for send-email' }, { status: 400 });
        }
        const emailResponse = await fetch(`${POCKETBASE_URL}/api/send-manual-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId, emailType })
        });
        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          throw new Error(`Email API error: ${errorData.error || 'Unknown error'}`);
        }
        result = { message: `${emailType} email sent successfully` };
        break;

      case 'send-qr-ticket':
        if (!bookingId) {
          return json({ error: 'bookingId is required for send-qr-ticket' }, { status: 400 });
        }
        const qrResponse = await fetch(`${POCKETBASE_URL}/api/send-qr-ticket`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId })
        });
        if (!qrResponse.ok) {
          const errorData = await qrResponse.json();
          throw new Error(`QR ticket API error: ${errorData.error || 'Unknown error'}`);
        }
        result = { message: 'QR ticket email sent successfully' };
        break;

      case 'send-reminders':
        const reminderResponse = await fetch(`${POCKETBASE_URL}/api/send-booking-reminders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!reminderResponse.ok) {
          const errorData = await reminderResponse.json().catch(() => ({ error: `HTTP ${reminderResponse.status}` }));
          console.error('PocketBase reminders API error:', errorData);
          throw new Error(`Booking reminders API error: ${errorData.error || errorData.details || `HTTP ${reminderResponse.status}`}`);
        }
        const reminderResult = await reminderResponse.json();
        result = { message: reminderResult.message || 'Booking reminders sent successfully' };
        break;

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }

    return json(result);
  } catch (error) {
    console.error('Error in test booking emails API:', error);
    return json({ 
      error: 'Failed to process email request', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}; 
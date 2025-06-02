import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    // Simple authentication using a secret token
    const authHeader = request.headers.get('authorization');
    const expectedToken = env.CRON_SECRET_TOKEN;
    
    if (!expectedToken) {
      return json({ error: 'Cron functionality not configured' }, { status: 500 });
    }
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Call the booking reminders API using event.fetch
    const reminderResponse = await fetch('/api/send-booking-reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!reminderResponse.ok) {
      const errorData = await reminderResponse.json().catch(() => ({ error: `HTTP ${reminderResponse.status}` }));
      throw new Error(`Booking reminders API error: ${errorData.error || 'Unknown error'}`);
    }
    
    const result = await reminderResponse.json();
    
    return json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });
    
  } catch (error) {
    console.error('❌ Error in daily reminders cron job:', error);
    return json({
      success: false,
      error: 'Failed to process daily reminders',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}; 
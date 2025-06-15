import { json, type RequestHandler } from '@sveltejs/kit';
import { sendNotificationToUser } from '$lib/notifications/server.js';

export const POST: RequestHandler = async ({ locals }) => {
  // Check authentication
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = locals.user.id;
  
  // Create a test notification
  const testNotification = {
    type: 'new_booking',
    id: `test_${Date.now()}`,
    timestamp: new Date().toISOString(),
    title: 'Test SSE Notification',
    message: 'This is a test notification sent via SSE to verify the connection works',
    data: {
      bookingId: 'test-booking',
      tourId: 'test-tour',
      tourName: 'Test Tour',
      customerName: 'Test Customer'
    },
    actions: [
      {
        label: 'View Test',
        url: '/dashboard'
      }
    ]
  };

  console.log(`🧪 Test notification requested for user: ${userId}`);
  
  try {
    const success = await sendNotificationToUser(userId, testNotification);
    
    if (success) {
      return json({ 
        success: true, 
        message: 'Test notification sent successfully via SSE',
        notification: testNotification
      });
    } else {
      return json({ 
        success: false, 
        error: 'Failed to send test notification - no active SSE connection found'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    return json({ 
      success: false, 
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 
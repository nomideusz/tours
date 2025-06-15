import { json, type RequestHandler } from '@sveltejs/kit';
import { sendNotificationToUser } from '$lib/notifications/server.js';

export const POST: RequestHandler = async ({ locals }) => {
  // Check authentication
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = locals.user.id;
  
  try {
    console.log('🧪 Creating test notification for user:', userId);
    
    const testNotification = {
      type: 'new_booking',
      id: `test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'Test Notification!',
      message: 'This is a test notification to verify the hybrid system works.',
      data: {
        bookingId: 'test-booking-123',
        tourId: 'test-tour-456',
        tourName: 'Test Tour',
        customerName: 'Test Customer',
        participants: 2,
        totalAmount: 50.00,
        status: 'confirmed'
      },
      actions: [
        {
          label: 'View Test',
          url: '/dashboard'
        }
      ]
    };

    console.log('📤 Sending test notification via hybrid system...');
    const success = await sendNotificationToUser(userId, testNotification);
    
    return json({
      success: true,
      message: 'Test notification sent successfully via hybrid system (DB + SSE)',
      notification: testNotification,
      sseDelivered: success
    });

  } catch (error) {
    console.error('❌ Error sending test notification:', error);
    return json({
      success: false,
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 
import { db } from '$lib/db/connection.js';
import { tours, notifications } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Store active SSE connections by user ID
export const connections = new Map<string, (data: any) => void>();

// Function to send notification to a specific user (HYBRID: Database + SSE)
export async function sendNotificationToUser(userId: string, notification: any, options?: { skipSSE?: boolean }): Promise<boolean> {
  console.log(`📧 Sending notification to user: "${userId}"`);
  console.log(`📧 Notification data:`, notification);
  
  // 1. FIRST: Store notification in database (ensures it's never lost)
  let dbSuccess = false;
  try {
    console.log('💾 Storing notification in database...');
    await db.insert(notifications).values({
      id: notification.id || createId(),
      userId: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data ? JSON.stringify(notification.data) : null,
      actions: notification.actions ? JSON.stringify(notification.actions) : null,
      read: false
    });
    console.log('✅ Notification stored in database successfully');
    dbSuccess = true;
  } catch (dbError) {
    console.error('❌ Failed to store notification in database:', dbError);
    // Continue with SSE even if DB fails, but log the error
  }

  // 2. SECOND: Try to send via SSE if connection exists (unless skipped)
  if (options?.skipSSE) {
    console.log('⏭️ Skipping SSE delivery as requested');
    return dbSuccess;
  }
  
  const sendMessage = connections.get(userId);
  if (!sendMessage) {
    console.log(`⚠️ No active SSE connection for user: "${userId}"`);
    return dbSuccess; // DB storage may have succeeded, SSE not available
  }

  try {
    console.log(`📤 Sending SSE notification to user "${userId}"`);
    
    // Add a flag to indicate this is a real-time notification
    const sseNotification = {
      ...notification,
      isRealtime: true
    };
    
    // Call the sendMessage function stored from the SSE endpoint
    sendMessage(sseNotification);
    console.log(`✅ Notification sent via SSE to user: "${userId}"`);
    return true; // Both DB and SSE succeeded
  } catch (error) {
    console.error(`❌ Failed to send SSE notification to user "${userId}":`, error);
    // Remove broken connection
    connections.delete(userId);
    return dbSuccess; // DB may have succeeded, SSE failed
  }
}

// Function to broadcast booking notifications (called from webhook/API)
export async function broadcastBookingNotification(bookingData: any) {
  try {
    // Get tour owner ID
    const tourOwner = await db.select({ userId: tours.userId })
      .from(tours)
      .where(eq(tours.id, bookingData.tourId))
      .limit(1);

    if (tourOwner.length === 0) {
      console.warn('No tour owner found for booking notification');
      return false;
    }

    const userId = tourOwner[0].userId;
    console.log(`🔍 Broadcasting notification to tour owner: "${userId}" (type: ${typeof userId})`);
    
    const notification = {
      type: 'new_booking',
      id: createId(),
      timestamp: new Date().toISOString(),
      title: 'New Booking!',
      message: `${bookingData.customerName} booked ${bookingData.tourName}`,
      data: {
        bookingId: bookingData.id,
        tourId: bookingData.tourId,
        tourName: bookingData.tourName,
        customerName: bookingData.customerName,
        participants: bookingData.participants,
        totalAmount: bookingData.totalAmount,
        status: bookingData.status
      },
      actions: [
        {
          label: 'View Booking',
          url: `/bookings/${bookingData.id}`
        },
        {
          label: 'View Tour',
          url: `/tours/${bookingData.tourId}`
        }
      ]
    };

    return await sendNotificationToUser(userId, notification);
  } catch (error) {
    console.error('Error broadcasting booking notification:', error);
    return false;
  }
} 
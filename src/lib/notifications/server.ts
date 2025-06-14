import { db } from '$lib/db/connection.js';
import { tours } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

// Store active SSE connections by user ID
export const connections = new Map<string, WritableStreamDefaultWriter>();

// Function to send notification to specific user (called from webhook)
export async function sendNotificationToUser(userId: string, notification: any) {
  console.log(`🔍 Looking for SSE connection for user: "${userId}" (type: ${typeof userId})`);
  console.log(`🔍 Available connections:`, Array.from(connections.keys()));
  
  const sendMessage = connections.get(userId);
  if (sendMessage) {
    try {
      (sendMessage as any)(notification);
      console.log(`✅ SSE notification sent to user ${userId}:`, notification.type);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send SSE notification to user ${userId}:`, error);
      connections.delete(userId);
      return false;
    }
  } else {
    console.log(`❌ No SSE connection found for user ${userId}`);
  }
  return false;
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
      id: `booking_${bookingData.id}`,
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
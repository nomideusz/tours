import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { notifications } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = locals.user.id;
  
  try {
    const { notificationId, markAll = false } = await request.json();
    
    if (markAll) {
      // Mark all notifications as read for this user
      const result = await db
        .update(notifications)
        .set({ 
          read: true,
          readAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(notifications.userId, userId))
        .returning({ id: notifications.id });
      
      console.log(`✅ Marked ${result.length} notifications as read for user ${userId}`);
      
      return json({
        success: true,
        message: `Marked ${result.length} notifications as read`,
        updatedCount: result.length
      });
    } else {
      // Mark specific notification as read
      if (!notificationId) {
        return json({ error: 'Notification ID is required' }, { status: 400 });
      }
      
      const result = await db
        .update(notifications)
        .set({ 
          read: true,
          readAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ))
        .returning({ id: notifications.id });
      
      if (result.length === 0) {
        return json({ error: 'Notification not found' }, { status: 404 });
      }
      
      console.log(`✅ Marked notification ${notificationId} as read for user ${userId}`);
      
      return json({
        success: true,
        message: 'Notification marked as read',
        notificationId: result[0].id
      });
    }
    
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}; 
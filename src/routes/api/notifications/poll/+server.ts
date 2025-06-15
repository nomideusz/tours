import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { notifications } from '$lib/db/schema/index.js';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
  // Check authentication
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = locals.user.id;
  const since = url.searchParams.get('since');
  
  try {
    // Get recent notifications for this user
    let query = db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    // If 'since' timestamp provided, only get notifications after that time
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        query = db.select()
          .from(notifications)
          .where(eq(notifications.userId, userId))
          .orderBy(desc(notifications.createdAt))
          .limit(20);
        // TODO: Add proper date filtering when needed
      }
    }

    const userNotifications = await query;
    
    // Transform to match SSE notification format
    const transformedNotifications = userNotifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.createdAt.toISOString(),
      read: notification.read,
      data: notification.data ? JSON.parse(notification.data) : undefined,
      actions: notification.actions ? JSON.parse(notification.actions) : undefined
    }));

    return json({
      success: true,
      notifications: transformedNotifications,
      count: transformedNotifications.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error polling notifications:', error);
    return json({
      success: false,
      error: 'Failed to fetch notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 
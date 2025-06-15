import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { notifications } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ locals }) => {
  // Check authentication
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = locals.user.id;
  
  try {
    // Delete all notifications for this user
    const result = await db.delete(notifications)
      .where(eq(notifications.userId, userId));

    console.log(`✅ Cleared all notifications for user ${userId}`);
    
    return json({
      success: true,
      message: 'All notifications cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing notifications:', error);
    return json({
      success: false,
      error: 'Failed to clear notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 
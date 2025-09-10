import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, requireAdmin } from '$lib/server/auth.js';
import { db } from '$lib/db/client.js';
import { users } from '$lib/db/schema.js';
import { eq, and, or, inArray } from 'drizzle-orm';
import { sendBulkAnnouncement } from '$lib/email/sender.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Require admin authentication
    const session = await requireAuth(locals);
    await requireAdmin(locals);

    const data = await request.json();
    const { 
      subject, 
      heading, 
      message, 
      ctaText, 
      ctaUrl, 
      footer,
      recipientType,
      recipientFilter 
    } = data;

    // Validate required fields
    if (!subject || !heading || !message || !recipientType) {
      return json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Build user query based on recipient type
    let userQuery = db.select().from(users);
    
    switch (recipientType) {
      case 'all':
        // All users
        break;
        
      case 'beta':
        // Beta testers only
        userQuery = userQuery.where(eq(users.betaTester, true));
        break;
        
      case 'plan':
        // Users with specific subscription plan
        if (!recipientFilter?.plan) {
          return json({ 
            success: false, 
            error: 'Plan filter required' 
          }, { status: 400 });
        }
        userQuery = userQuery.where(eq(users.subscriptionPlan, recipientFilter.plan));
        break;
        
      case 'verified':
        // Only verified users
        userQuery = userQuery.where(eq(users.emailVerified, true));
        break;
        
      case 'active':
        // Active users (logged in within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        userQuery = userQuery.where(
          and(
            users.lastLogin !== null,
            users.lastLogin > thirtyDaysAgo
          )
        );
        break;
        
      case 'custom':
        // Custom user IDs
        if (!recipientFilter?.userIds || !Array.isArray(recipientFilter.userIds)) {
          return json({ 
            success: false, 
            error: 'User IDs required for custom recipients' 
          }, { status: 400 });
        }
        userQuery = userQuery.where(inArray(users.id, recipientFilter.userIds));
        break;
        
      default:
        return json({ 
          success: false, 
          error: 'Invalid recipient type' 
        }, { status: 400 });
    }

    // Execute query to get recipients
    const recipients = await userQuery;
    
    if (recipients.length === 0) {
      return json({ 
        success: false, 
        error: 'No recipients found matching the criteria' 
      }, { status: 400 });
    }

    // Send emails
    const result = await sendBulkAnnouncement(
      recipients,
      { subject, heading, message, ctaText, ctaUrl, footer }
    );

    return json({
      success: true,
      totalRecipients: recipients.length,
      sent: result.sent,
      failed: result.failed,
      details: result.results.map(r => ({
        email: r.user.email,
        name: r.user.name,
        success: r.result.success,
        error: r.result.error
      }))
    });

  } catch (error) {
    console.error('Error sending announcement:', error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send announcement' 
    }, { status: 500 });
  }
};

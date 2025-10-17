import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq, and, inArray, gt, isNotNull } from 'drizzle-orm';
import { sendBulkAnnouncement } from '$lib/email/sender.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check admin access
    if (!locals.user || locals.user.role !== 'admin') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    let recipients;
    
    switch (recipientType) {
      case 'specific':
        // Single email address (handled by 'custom' case with emails array)
        if (recipientFilter?.emails && recipientFilter.emails.length > 0) {
          recipients = await db.select().from(users).where(inArray(users.email, recipientFilter.emails));
        } else {
          return json({ 
            success: false, 
            error: 'Specific email address required' 
          }, { status: 400 });
        }
        break;
        
      case 'all':
        // All users
        recipients = await db.select().from(users);
        break;
        
      case 'beta':
        // Beta testers (stored as earlyAccessMember in database)
        recipients = await db.select().from(users).where(eq(users.earlyAccessMember, true));
        break;
        
      case 'plan':
        // Users with specific subscription plan
        if (!recipientFilter?.plan) {
          return json({ 
            success: false, 
            error: 'Plan filter required' 
          }, { status: 400 });
        }
        recipients = await db.select().from(users).where(eq(users.subscriptionPlan, recipientFilter.plan));
        break;
        
      case 'verified':
        // Only verified users
        recipients = await db.select().from(users).where(eq(users.emailVerified, true));
        break;
        
      case 'active':
        // Active users (logged in within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        recipients = await db.select().from(users).where(
          and(
            isNotNull(users.lastLogin),
            gt(users.lastLogin, thirtyDaysAgo)
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
        recipients = await db.select().from(users).where(inArray(users.id, recipientFilter.userIds));
        break;
        
      case 'test':
        // Send test email to admin only
        recipients = await db.select().from(users).where(eq(users.email, 'b.dymet@gmail.com'));
        if (recipients.length === 0) {
          // Fallback to current logged-in admin
          recipients = await db.select().from(users).where(eq(users.id, locals.user.id));
        }
        break;
        
      default:
        return json({ 
          success: false, 
          error: 'Invalid recipient type' 
        }, { status: 400 });
    }
    
    if (recipients.length === 0) {
      return json({ 
        success: false, 
        error: 'No recipients found matching the criteria' 
      }, { status: 400 });
    }

    // Convert database results to User type (handle null vs undefined)
    const typedRecipients = recipients.map(r => ({
      ...r,
      username: r.username || undefined,
      businessName: r.businessName || undefined,
      stripeAccountId: r.stripeAccountId || undefined,
      avatar: r.avatar || undefined,
      phone: r.phone || undefined,
      website: r.website || undefined,
      description: r.description || undefined,
      location: r.location || undefined,
      country: r.country || undefined,
      mainQrCode: r.mainQrCode || undefined,
      mainQrScans: r.mainQrScans || undefined,
      lastLogin: r.lastLogin?.toISOString() || undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }));

    // Send emails
    const result = await sendBulkAnnouncement(
      typedRecipients as any,
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

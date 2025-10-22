import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/db/connection.js';
import { bookings, tours, users } from '$lib/db/schema/index.js';
import { eq, and, lte, isNull, or } from 'drizzle-orm';

/**
 * Diagnostic endpoint to check transfer status
 * Shows why bookings aren't being picked up by the cron job
 */
export const GET: RequestHandler = async ({ request }) => {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('Authorization');
  const cronSecret = env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('❌ CRON_SECRET not configured');
    return json({ error: 'Server misconfigured' }, { status: 500 });
  }
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('⚠️ Unauthorized access attempt');
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const now = new Date();
    
    // Get ALL bookings with pending transfers (no time filter)
    const allPending = await db
      .select({
        bookingId: bookings.id,
        bookingReference: bookings.bookingReference,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        paymentId: bookings.paymentId,
        transferId: bookings.transferId,
        transferStatus: bookings.transferStatus,
        transferScheduledFor: bookings.transferScheduledFor,
        totalAmount: bookings.totalAmount,
        guideName: users.name,
        guideStripeAccountId: users.stripeAccountId,
        tourName: tours.name
      })
      .from(bookings)
      .innerJoin(tours, eq(bookings.tourId, tours.id))
      .innerJoin(users, eq(tours.userId, users.id))
      .where(and(
        or(
          eq(bookings.transferStatus, 'pending'),
          isNull(bookings.transferStatus)
        ),
        isNull(bookings.transferId)
      ))
      .limit(50);
    
    // Categorize bookings
    const diagnostics = allPending.map(booking => {
      const reasons = [];
      let readyForCron = true;
      
      // Check each condition
      if (booking.paymentStatus !== 'paid') {
        reasons.push(`Payment status is '${booking.paymentStatus}' (needs 'paid')`);
        readyForCron = false;
      }
      
      if (booking.status !== 'confirmed') {
        reasons.push(`Booking status is '${booking.status}' (needs 'confirmed')`);
        readyForCron = false;
      }
      
      if (booking.transferId) {
        reasons.push('Already has transferId (already transferred)');
        readyForCron = false;
      }
      
      if (!booking.transferScheduledFor) {
        reasons.push('transferScheduledFor is NULL (not scheduled)');
        readyForCron = false;
      } else if (new Date(booking.transferScheduledFor) > now) {
        const minutesUntil = Math.round((new Date(booking.transferScheduledFor).getTime() - now.getTime()) / 60000);
        reasons.push(`Scheduled for future (in ${minutesUntil} minutes)`);
        readyForCron = false;
      }
      
      if (!booking.guideStripeAccountId) {
        reasons.push('Guide has no Stripe account');
        readyForCron = false;
      }
      
      if (!booking.paymentId) {
        reasons.push('No paymentId');
        readyForCron = false;
      }
      
      return {
        bookingReference: booking.bookingReference,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        transferStatus: booking.transferStatus,
        transferScheduledFor: booking.transferScheduledFor,
        minutesUntilTransfer: booking.transferScheduledFor 
          ? Math.round((new Date(booking.transferScheduledFor).getTime() - now.getTime()) / 60000)
          : null,
        hasPaymentId: !!booking.paymentId,
        hasStripeAccount: !!booking.guideStripeAccountId,
        readyForCron,
        reasons: reasons.length > 0 ? reasons : ['✅ Ready for transfer']
      };
    });
    
    const readyCount = diagnostics.filter(d => d.readyForCron).length;
    const notReadyCount = diagnostics.filter(d => !d.readyForCron).length;
    
    // Group by reason
    const reasonCounts: Record<string, number> = {};
    diagnostics.forEach(d => {
      d.reasons.forEach(reason => {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });
    });
    
    return json({
      timestamp: now.toISOString(),
      summary: {
        total: allPending.length,
        readyForCron: readyCount,
        notReady: notReadyCount
      },
      commonIssues: reasonCounts,
      bookings: diagnostics
    });
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    return json({
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};


import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/db/connection.js';
import { bookings, tours, users } from '$lib/db/schema/index.js';
import { eq, and, lte, isNull } from 'drizzle-orm';
import { createTransferToGuide, isReadyForTransfer } from '$lib/payment-transfers.js';

/**
 * Automated transfer processing cron job
 * Transfers funds from platform to tour guides after cancellation window passes
 * Run every hour via cron scheduler
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
    console.warn('⚠️ Unauthorized cron access attempt');
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const now = new Date();
    console.log(`🔄 Transfer cron job started at ${now.toISOString()}`);
    
    // Find bookings ready for transfer
    const pendingTransfers = await db
      .select({
        bookingId: bookings.id,
        bookingAmount: bookings.totalAmount,
        bookingReference: bookings.bookingReference,
        bookingStatus: bookings.status,
        paymentStatus: bookings.paymentStatus,
        paymentId: bookings.paymentId,
        transferScheduledFor: bookings.transferScheduledFor,
        transferId: bookings.transferId,
        
        tourId: tours.id,
        tourName: tours.name,
        
        guideId: users.id,
        guideName: users.name,
        guideEmail: users.email,
        guideStripeAccountId: users.stripeAccountId,
        guideCurrency: users.currency
      })
      .from(bookings)
      .innerJoin(tours, eq(bookings.tourId, tours.id))
      .innerJoin(users, eq(tours.userId, users.id))
      .where(and(
        eq(bookings.paymentStatus, 'paid'),
        eq(bookings.status, 'confirmed'),
        isNull(bookings.transferId), // Not yet transferred
        lte(bookings.transferScheduledFor, now) // Transfer time has passed
      ))
      .limit(100); // Process up to 100 per run for safety
    
    console.log(`📊 Found ${pendingTransfers.length} bookings ready for transfer`);
    
    // Debug: Log first few bookings to diagnose issues
    if (pendingTransfers.length > 0) {
      console.log('🔍 Sample booking details:');
      pendingTransfers.slice(0, 3).forEach((booking, idx) => {
        console.log(`  [${idx + 1}] ${booking.bookingReference}:`);
        console.log(`      Status: ${booking.bookingStatus}, Payment: ${booking.paymentStatus}`);
        console.log(`      TransferID: ${booking.transferId}, Scheduled: ${booking.transferScheduledFor}`);
        console.log(`      Guide: ${booking.guideName}, StripeID: ${booking.guideStripeAccountId}`);
        console.log(`      PaymentID: ${booking.paymentId}`);
      });
    }
    
    if (pendingTransfers.length === 0) {
      return json({ 
        success: true, 
        message: 'No transfers to process',
        processed: 0
      });
    }
    
    let successCount = 0;
    let failCount = 0;
    const results: Array<{ bookingId: string; status: 'success' | 'failed'; error?: string }> = [];
    
    for (const booking of pendingTransfers) {
      try {
        console.log(`\n🔄 Checking booking ${booking.bookingReference}...`);
        
        // Validate guide has Stripe account
        if (!booking.guideStripeAccountId) {
          const error = `Guide ${booking.guideName} has no Stripe account`;
          console.error(`   ❌ ${error}`);
          throw new Error(error);
        }
        console.log(`   ✅ Guide has Stripe account: ${booking.guideStripeAccountId}`);
        
        // Validate payment ID exists
        if (!booking.paymentId) {
          const error = 'No payment ID found for booking';
          console.error(`   ❌ ${error}`);
          throw new Error(error);
        }
        console.log(`   ✅ Payment ID exists: ${booking.paymentId}`);
        
        // Final validation
        const readyCheck = isReadyForTransfer(booking);
        console.log(`   🔍 isReadyForTransfer check: ${readyCheck}`);
        if (!readyCheck) {
          console.warn(`   ⚠️ Booking ${booking.bookingReference} not ready for transfer (status check failed)`);
          console.warn(`      - Status: ${booking.bookingStatus}, Payment: ${booking.paymentStatus}`);
          console.warn(`      - TransferID: ${booking.transferId}, Scheduled: ${booking.transferScheduledFor}`);
          continue;
        }
        
        console.log(`💸 Processing transfer for booking ${booking.bookingReference}`);
        console.log(`   Amount: ${booking.guideCurrency}${booking.bookingAmount}`);
        console.log(`   Guide: ${booking.guideName} (${booking.guideStripeAccountId})`);
        console.log(`   Scheduled: ${booking.transferScheduledFor}`);
        
        // Create transfer to guide's account
        const transfer = await createTransferToGuide(
          parseFloat(booking.bookingAmount),
          booking.guideCurrency || 'EUR',
          booking.guideStripeAccountId,
          {
            bookingId: booking.bookingId,
            bookingReference: booking.bookingReference,
            tourId: booking.tourId,
            tourName: booking.tourName,
            guideId: booking.guideId,
            guideName: booking.guideName
          }
        );
        
        // Update booking with transfer info
        await db.update(bookings).set({
          transferId: transfer.id,
          transferStatus: 'completed',
          transferProcessedAt: new Date(),
          transferNotes: `Transferred ${booking.guideCurrency}${booking.bookingAmount} to ${booking.guideName}`
        }).where(eq(bookings.id, booking.bookingId));
        
        successCount++;
        results.push({ bookingId: booking.bookingId, status: 'success' });
        
        console.log(`   ✅ [${successCount}/${pendingTransfers.length}] Transfer ${transfer.id} completed for ${booking.bookingReference}`);
        
      } catch (error) {
        failCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ bookingId: booking.bookingId, status: 'failed', error: errorMessage });
        
        console.error(`   ❌ Transfer failed for ${booking.bookingReference}:`, error);
        
        // Mark as failed in database
        await db.update(bookings).set({
          transferStatus: 'failed',
          transferNotes: `Transfer failed: ${errorMessage}`
        }).where(eq(bookings.id, booking.bookingId));
      }
    }
    
    const summary = {
      timestamp: now.toISOString(),
      totalPending: pendingTransfers.length,
      succeeded: successCount,
      failed: failCount,
      results
    };
    
    console.log(`✅ Transfer cron completed:`, summary);
    
    // Send alert if there were failures
    if (failCount > 0) {
      console.error(`⚠️ ${failCount} transfers failed - admin attention required`);
      // TODO: Send alert to admin (email, Slack, etc.)
    }
    
    return json({
      success: true,
      ...summary
    });
    
  } catch (error) {
    console.error('❌ Transfer cron job fatal error:', error);
    return json({
      error: 'Transfer processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};


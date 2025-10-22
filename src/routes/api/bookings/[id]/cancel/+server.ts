import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';
import { calculateRefund, canCancelBooking } from '$lib/utils/cancellation-policies.js';
import { createDirectRefund, checkRefundAvailability, formatAmountForStripe } from '$lib/stripe.server.js';
import { processSmartRefund } from '$lib/utils/refund-handler.js';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    const bookingId = params.id;
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { reason, customMessage } = body;

    console.log(`📋 Cancel request for booking ${bookingId}`, { reason, customMessage });

    // Fetch booking with tour, time slot, and guide information
    const bookingData = await db
      .select({
        // Booking fields
        bookingId: bookings.id,
        bookingStatus: bookings.status,
        bookingPaymentStatus: bookings.paymentStatus,
        bookingPaymentId: bookings.paymentId,
        bookingTotalAmount: bookings.totalAmount,
        bookingCustomerName: bookings.customerName,
        bookingCustomerEmail: bookings.customerEmail,
        bookingParticipants: bookings.participants,
        bookingReference: bookings.bookingReference,
        // Transfer tracking fields
        bookingTransferId: bookings.transferId,
        bookingTransferStatus: bookings.transferStatus,
        
        // Tour fields
        tourId: tours.id,
        tourName: tours.name,
        tourUserId: tours.userId,
        tourCancellationPolicyId: tours.cancellationPolicyId,
        
        // Time slot
        timeSlotStartTime: timeSlots.startTime,
        
        // Tour guide
        guideStripeAccountId: users.stripeAccountId,
        guideName: users.name,
        guideCurrency: users.currency
      })
      .from(bookings)
      .innerJoin(tours, eq(bookings.tourId, tours.id))
      .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
      .innerJoin(users, eq(tours.userId, users.id))
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (bookingData.length === 0) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingData[0];

    // Determine who is cancelling
    const isGuide = locals.user?.id === booking.tourUserId;
    const cancelledBy = isGuide ? 'guide' : 'customer';

    console.log(`   Cancelled by: ${cancelledBy} (user ID: ${locals.user?.id || 'public'})`);

    // Check if cancellation is allowed
    const cancellationCheck = canCancelBooking(
      booking.timeSlotStartTime,
      booking.bookingStatus,
      booking.bookingPaymentStatus
    );

    if (!cancellationCheck.allowed) {
      console.warn(`   ❌ Cancellation not allowed: ${cancellationCheck.reason}`);
      return json({ 
        error: cancellationCheck.reason || 'Cancellation not allowed' 
      }, { status: 400 });
    }

    // Calculate refund
    const bookingAmount = parseFloat(booking.bookingTotalAmount);
    const refundCalc = calculateRefund(
      bookingAmount,
      booking.timeSlotStartTime,
      booking.tourCancellationPolicyId || 'flexible',
      cancelledBy
    );

    console.log(`   💰 Refund calculation:`, {
      amount: bookingAmount,
      percentage: refundCalc.refundPercentage,
      refundAmount: refundCalc.refundAmount,
      rule: refundCalc.rule,
      hoursUntilTour: refundCalc.timeUntilTour.toFixed(1)
    });

    let stripeRefundId: string | null | undefined = null;
    let refundStatus: 'succeeded' | 'failed' | 'not_required' = 'not_required';

    // Process refund if needed
    if (refundCalc.isRefundable && refundCalc.refundAmount > 0 && booking.bookingPaymentStatus === 'paid') {
      if (!booking.bookingPaymentId) {
        console.error(`   ❌ No payment ID for paid booking ${bookingId}`);
        return json({ 
          error: 'Cannot process refund: payment information missing' 
        }, { status: 400 });
      }

      if (!booking.guideStripeAccountId) {
        console.error(`   ❌ Guide has no Stripe account`);
        return json({ 
          error: 'Cannot process refund: tour guide payment account not configured' 
        }, { status: 400 });
      }

      // Check guide's balance before attempting refund
      const currency = booking.guideCurrency || 'EUR';
      const refundAmountCents = formatAmountForStripe(refundCalc.refundAmount, currency);
      
      const balanceCheck = await checkRefundAvailability(
        booking.guideStripeAccountId,
        refundAmountCents
      );

      if (!balanceCheck.canRefund) {
        console.error(`   ❌ Insufficient balance for refund:`, {
          required: refundAmountCents,
          available: balanceCheck.availableBalance,
          reason: balanceCheck.reason
        });
        
        // Don't fail the cancellation, but mark refund as failed
        // Guide will need to process manually
        // Mark booking as cancelled with refund failed (insufficient balance)
        // SAFE MIGRATION: Write to BOTH old and new columns
        await db.update(bookings).set({
          status: 'cancelled',
          cancelledBy,
          cancellationReason: reason || 'other',
          refundStatus: 'failed',
          refundStatusNew: 'failed',
          refundAmount: refundCalc.refundAmount.toFixed(2),
          refundPercentage: refundCalc.refundPercentage,
          updatedAt: new Date()
        }).where(eq(bookings.id, bookingId));
        
        return json({
          success: false,
          error: 'Insufficient balance in tour guide account for automatic refund',
          details: {
            bookingCancelled: true,
            refundRequired: refundCalc.refundAmount,
            refundCurrency: currency,
            message: 'Booking has been cancelled. Tour guide will process refund manually.',
            contactGuide: true
          }
        }, { status: 400 });
      }

      // Process Stripe refund using smart handler
      // This handles both pre-transfer and post-transfer scenarios
      try {
        console.log(`   💳 Processing smart refund...`);
        console.log(`   📊 Transfer status: transferId=${booking.bookingTransferId}, status=${booking.bookingTransferStatus}`);
        
        const refundResult = await processSmartRefund({
          paymentIntentId: booking.bookingPaymentId,
          connectedAccountId: booking.guideStripeAccountId,
          amount: refundCalc.refundAmount,
          currency,
          reason: 'requested_by_customer',
          metadata: {
            bookingId,
            bookingReference: booking.bookingReference,
            reason: reason || 'customer_request',
            cancelledBy,
            refundPercentage: refundCalc.refundPercentage.toString()
          },
          // Transfer info for smart refund decision
          transferId: booking.bookingTransferId,
          transferStatus: booking.bookingTransferStatus
        });

        if (!refundResult.success) {
          throw new Error(refundResult.error || 'Refund failed');
        }

        stripeRefundId = refundResult.refundId;
        refundStatus = 'succeeded';

        console.log(`   ✅ Smart refund successful: ${refundResult.method}`);
        console.log(`      RefundID: ${stripeRefundId}`);
        if (refundResult.transferReversalId) {
          console.log(`      Transfer reversed: ${refundResult.transferReversalId}`);
        }
      } catch (refundError) {
        console.error(`   ❌ Smart refund failed:`, refundError);
        refundStatus = 'failed';
        
        // Still cancel the booking, but mark refund as failed
        // SAFE MIGRATION: Write to BOTH old and new columns
        await db.update(bookings).set({
          status: 'cancelled',
          cancelledBy,
          cancellationReason: reason || 'other',
          refundStatus: 'failed',
          refundStatusNew: 'failed',
          refundAmount: refundCalc.refundAmount.toFixed(2),
          refundPercentage: refundCalc.refundPercentage,
          updatedAt: new Date()
        }).where(eq(bookings.id, bookingId));

        return json({
          success: false,
          error: 'Refund processing failed',
          details: {
            bookingCancelled: true,
            refundRequired: refundCalc.refundAmount,
            message: 'Booking cancelled but automatic refund failed. Tour guide will process manually.',
            stripeError: refundError instanceof Error ? refundError.message : 'Unknown error'
          }
        }, { status: 500 });
      }
    }

    // Update booking with cancellation and refund info
    const updateData: any = {
      status: 'cancelled',
      cancelledBy,
      cancellationReason: reason || 'other',
      updatedAt: new Date()
    };

    // Only add refundId if it exists
    if (stripeRefundId) {
      updateData.refundId = stripeRefundId;
    }

    // Set refund status
    // SAFE MIGRATION: Write to BOTH old and new columns
    if (refundCalc.refundAmount > 0) {
      updateData.refundAmount = refundCalc.refundAmount.toFixed(2);
      updateData.refundPercentage = refundCalc.refundPercentage;
      updateData.refundStatus = refundStatus;
      updateData.refundStatusNew = refundStatus;
      updateData.refundProcessedAt = new Date();
    } else {
      // No refund needed
      updateData.refundStatus = null;
      updateData.refundStatusNew = 'not_required';
    }

    await db.update(bookings)
      .set(updateData)
      .where(eq(bookings.id, bookingId));

    console.log(`   ✅ Booking ${bookingId} cancelled successfully`);

    // Restore time slot capacity
    try {
      // Get the time slot to update
      const timeSlot = await db
        .select({ id: timeSlots.id, bookedSpots: timeSlots.bookedSpots, timeSlotId: timeSlots.id })
        .from(timeSlots)
        .innerJoin(bookings, eq(bookings.timeSlotId, timeSlots.id))
        .where(eq(bookings.id, bookingId))
        .limit(1);
      
      if (timeSlot.length > 0) {
        const newBookedSpots = Math.max(0, (timeSlot[0].bookedSpots || 0) - booking.bookingParticipants);
        await db.update(timeSlots)
          .set({
            bookedSpots: newBookedSpots,
            updatedAt: new Date()
          })
          .where(eq(timeSlots.id, timeSlot[0].timeSlotId));
        
        console.log(`   ✅ Restored ${booking.bookingParticipants} spots to time slot (new total: ${newBookedSpots})`);
      }
    } catch (slotError) {
      console.warn(`   ⚠️ Failed to restore time slot capacity:`, slotError);
      // Don't fail the cancellation if this fails
    }

    // Send cancellation email
    try {
      const emailResponse = await fetch(`${new URL(request.url).origin}/api/send-booking-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          emailType: 'cancelled',
          cancellationReason: reason,
          customMessage: customMessage || undefined,
          isBulkCancellation: false
        })
      });

      if (emailResponse.ok) {
        console.log(`   ✅ Cancellation email sent to ${booking.bookingCustomerEmail}`);
      } else {
        console.warn(`   ⚠️ Failed to send cancellation email:`, await emailResponse.text());
      }
    } catch (emailError) {
      console.warn(`   ⚠️ Error sending cancellation email:`, emailError);
      // Don't fail the cancellation if email fails
    }

    // Return success with refund details
    return json({
      success: true,
      booking: {
        id: bookingId,
        status: 'cancelled',
        cancelledBy,
        refundStatus
      },
      refund: {
        isRefundable: refundCalc.isRefundable,
        percentage: refundCalc.refundPercentage,
        amount: refundCalc.refundAmount,
        rule: refundCalc.rule,
        stripeRefundId,
        status: refundStatus,
        processingTime: refundStatus === 'succeeded' ? '5-10 business days' : undefined
      },
      message: refundCalc.isRefundable 
        ? `Booking cancelled. ${refundCalc.refundPercentage}% refund (${booking.guideCurrency}${refundCalc.refundAmount.toFixed(2)}) will be processed.`
        : 'Booking cancelled. No refund available per cancellation policy.'
    });

  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    return json({
      error: 'Failed to cancel booking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};


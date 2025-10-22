import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { calculateRefund, canCancelBooking } from '$lib/utils/cancellation-policies.js';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const bookingId = params.id;
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Fetch booking with tour and time slot
    const bookingData = await db
      .select({
        bookingId: bookings.id,
        bookingStatus: bookings.status,
        bookingPaymentStatus: bookings.paymentStatus,
        bookingTotalAmount: bookings.totalAmount,
        bookingCustomerEmail: bookings.customerEmail,
        bookingParticipants: bookings.participants,
        
        tourId: tours.id,
        tourName: tours.name,
        tourUserId: tours.userId,
        tourCancellationPolicyId: tours.cancellationPolicyId,
        
        timeSlotStartTime: timeSlots.startTime,
        
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

    // Check if cancellation is allowed
    const cancellationCheck = canCancelBooking(
      booking.timeSlotStartTime,
      booking.bookingStatus,
      booking.bookingPaymentStatus
    );

    if (!cancellationCheck.allowed) {
      return json({
        canCancel: false,
        reason: cancellationCheck.reason,
        refund: null
      });
    }

    // Determine who is cancelling
    const isGuide = locals.user?.id === booking.tourUserId;
    const cancelledBy = isGuide ? 'guide' : 'customer';

    // Calculate refund
    const bookingAmount = parseFloat(booking.bookingTotalAmount);
    const refundCalc = calculateRefund(
      bookingAmount,
      booking.timeSlotStartTime,
      booking.tourCancellationPolicyId || 'flexible',
      cancelledBy
    );

    // Format currency symbol
    const currencySymbol = booking.guideCurrency === 'USD' ? '$' 
      : booking.guideCurrency === 'EUR' ? '€'
      : booking.guideCurrency === 'GBP' ? '£'
      : booking.guideCurrency === 'PLN' ? 'zł'
      : booking.guideCurrency || 'EUR';

    // Return refund preview
    return json({
      canCancel: true,
      booking: {
        id: booking.bookingId,
        reference: booking.bookingReference,
        status: booking.bookingStatus,
        paymentStatus: booking.bookingPaymentStatus,
        amount: bookingAmount,
        currency: booking.guideCurrency || 'EUR',
        currencySymbol
      },
      refund: {
        isRefundable: refundCalc.isRefundable,
        percentage: refundCalc.refundPercentage,
        amount: refundCalc.refundAmount,
        formattedAmount: `${currencySymbol}${refundCalc.refundAmount.toFixed(2)}`,
        rule: refundCalc.rule,
        timeUntilTour: {
          hours: Math.floor(refundCalc.timeUntilTour),
          minutes: Math.round((refundCalc.timeUntilTour % 1) * 60),
          formatted: refundCalc.timeUntilTour >= 24 
            ? `${Math.floor(refundCalc.timeUntilTour / 24)} day${Math.floor(refundCalc.timeUntilTour / 24) !== 1 ? 's' : ''}`
            : `${Math.floor(refundCalc.timeUntilTour)} hour${Math.floor(refundCalc.timeUntilTour) !== 1 ? 's' : ''}`
        }
      },
      policy: {
        id: booking.tourCancellationPolicyId || 'flexible',
        cancelledBy
      },
      message: refundCalc.isRefundable
        ? `You'll receive a ${refundCalc.refundPercentage}% refund (${currencySymbol}${refundCalc.refundAmount.toFixed(2)}) if you cancel now.`
        : 'No refund available per the cancellation policy.'
    });

  } catch (error) {
    console.error('❌ Error getting refund preview:', error);
    return json({
      error: 'Failed to calculate refund',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};


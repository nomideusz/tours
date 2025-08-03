import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createPaymentIntent } from '$lib/stripe.server.js';
import { db } from '$lib/db/connection.js';
import { bookings, payments, tours, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { getMinimumChargeAmount } from '$lib/utils/currency.js';
import { getPaymentMethod } from '$lib/utils/countries.js';
import type { Currency } from '$lib/utils/countries.js';

/**
 * Platform payment collection endpoint for tour guides in countries 
 * that don't support Stripe Connect but do support cross-border payouts.
 * 
 * This endpoint collects payments on the platform account and tracks
 * them for later payout to the tour guide.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  let bookingId: string | undefined;
  let amount: number | undefined;
  let currency: string = 'eur';
  
  try {
    const body = await request.json();
    ({ bookingId, amount, currency = 'eur' } = body);

    if (!bookingId || !amount) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert amount to number for proper comparison
    const requestAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Validate minimum charge amount for the currency
    const minimumAmount = getMinimumChargeAmount(currency.toUpperCase() as Currency);
    if (requestAmount < minimumAmount) {
      return json({ 
        error: `Minimum charge amount is ${minimumAmount} ${currency.toUpperCase()}` 
      }, { status: 400 });
    }

    // Get booking details with tour and user data
    const bookingData = await db.select({
      id: bookings.id,
      totalAmount: bookings.totalAmount,
      bookingReference: bookings.bookingReference,
      customerEmail: bookings.customerEmail,
      customerName: bookings.customerName,
      tourId: bookings.tourId,
      tourName: tours.name,
      tourUserId: users.id,
      tourUserCountry: users.country,
      tourUserCurrency: users.currency,
      tourUserStripeAccountId: users.stripeAccountId
    })
    .from(bookings)
    .innerJoin(tours, eq(bookings.tourId, tours.id))
    .innerJoin(users, eq(tours.userId, users.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

    if (bookingData.length === 0) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingData[0];
    
    // Verify that the tour guide's country requires platform collection
    const paymentMethod = getPaymentMethod(booking.tourUserCountry || 'DE');
    
    if (paymentMethod === 'connect') {
      return json({ 
        error: 'This tour guide supports direct payments. Use the regular payment endpoint.' 
      }, { status: 400 });
    }
    
    if (paymentMethod === 'unsupported') {
      return json({ 
        error: 'Payment processing is not available for this tour guide\'s country.' 
      }, { status: 400 });
    }

    // Convert booking amount to number for comparison
    const bookingAmount = parseFloat(booking.totalAmount);
    
    // Verify amount matches booking (allow small floating point differences)
    if (Math.abs(bookingAmount - requestAmount) > 0.01) {
      console.log('Amount mismatch:', { 
        bookingAmount, 
        requestAmount, 
        bookingTotalAmount: booking.totalAmount,
        originalAmount: amount 
      });
      return json({ 
        error: 'Payment amount does not match booking total' 
      }, { status: 400 });
    }

    // Create payment intent on the PLATFORM account (not tour guide's account)
    const paymentIntent = await createPaymentIntent(
      requestAmount, 
      currency,
      {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        tourId: booking.tourId,
        tourName: booking.tourName,
        customerEmail: booking.customerEmail,
        customerName: booking.customerName,
        tourGuideUserId: booking.tourUserId,
        paymentType: 'platform_collected'
      }
    );

    // Create payment record with platform collection tracking
    const paymentResult = await db.insert(payments).values({
      bookingId: bookingId,
      stripePaymentIntentId: paymentIntent.id,
      amount: requestAmount.toString(),
      currency: currency.toUpperCase(),
      status: 'pending',
      paymentType: 'platform_collected',
      tourGuideUserId: booking.tourUserId,
      payoutCompleted: false,
      processingFee: '0', // Will be updated after payment
      netAmount: requestAmount.toString(), // Tour guide gets 100% (minus actual processing fees)
    }).returning();

    const payment = paymentResult[0];

    // Update booking with payment intent ID
    await db.update(bookings)
      .set({
        paymentId: paymentIntent.id,
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId));

    return json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment.id,
      paymentType: 'platform_collected',
      message: 'Payment will be collected on behalf of the tour guide and paid out weekly.'
    });
    
  } catch (error) {
    console.error('Error creating platform payment intent:', error);
    
    // Provide more specific error messages for common Stripe errors
    if (error instanceof Error) {
      // Check for Stripe-specific errors
      if ('type' in error && error.type === 'StripeInvalidRequestError') {
        if (error.message.includes('currency')) {
          return json(
            { error: 'This currency is not supported for platform payments.' },
            { status: 400 }
          );
        }
        if (error.message.includes('amount')) {
          return json(
            { error: 'Invalid payment amount. Please check the booking details.' },
            { status: 400 }
          );
        }
      }
      
      // Log detailed error for debugging
      console.error('Platform payment error details:', {
        message: error.message,
        type: 'type' in error ? error.type : 'unknown',
        code: 'code' in error ? error.code : 'unknown',
        bookingId,
        amount,
        currency
      });
    }
    
    return json(
      { error: 'Failed to create payment. Please try again or contact support.' },
      { status: 500 }
    );
  }
};
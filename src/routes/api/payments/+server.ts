import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createDirectPaymentIntent } from '$lib/stripe.server.js';
import { db } from '$lib/db/connection.js';
import { bookings, payments, tours, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { getMinimumChargeAmount, formatCurrencyWithCode } from '$lib/utils/currency.js';
import type { Currency } from '$lib/stores/currency.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  // Declare variables outside try block for error handling
  let bookingId: string | undefined;
  let amount: number | undefined;
  let currency: string = 'eur';
  let connectedAccountId: string | null | undefined;
  
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
        error: `Amount must be at least ${formatCurrencyWithCode(minimumAmount, currency.toUpperCase() as Currency)}` 
      }, { status: 400 });
    }

    // Get booking details with tour and user data INCLUDING Stripe account ID
    const bookingData = await db.select({
      id: bookings.id,
      totalAmount: bookings.totalAmount,
      bookingReference: bookings.bookingReference,
      customerEmail: bookings.customerEmail,
      customerName: bookings.customerName,
      tourId: bookings.tourId,
      tourUserId: users.id,
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
    
    // Store connected account ID for error handling
    connectedAccountId = booking.tourUserStripeAccountId;

    // Check if tour guide has a Stripe account
    if (!connectedAccountId) {
      console.error('Tour guide missing Stripe account:', { 
        tourUserId: booking.tourUserId,
        bookingId: booking.id 
      });
      return json({ 
        error: 'Tour guide has not set up payment processing. Please contact them directly.' 
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
      return json({ error: 'Amount mismatch' }, { status: 400 });
    }

    // Create payment intent DIRECTLY on the tour guide's Stripe account
    // No platform fee since this is a no-commission model
    const paymentIntent = await createDirectPaymentIntent(
      requestAmount, 
      currency,
      connectedAccountId, // We already checked this is not null
      {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        tourId: booking.tourId,
        customerEmail: booking.customerEmail,
        customerName: booking.customerName,
      }
      // No platform fee parameter - tour guides keep 100%
    );

    // Create payment record in database
    const paymentResult = await db.insert(payments).values({
      bookingId: bookingId,
      stripePaymentIntentId: paymentIntent.id,
      amount: requestAmount.toString(),
      currency: currency.toUpperCase(),
      status: 'pending',
      processingFee: '0', // Will be updated after payment
      netAmount: requestAmount.toString(), // Tour guide gets 100%
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
      connectedAccountId: booking.tourUserStripeAccountId // Include for frontend to handle properly
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    // Provide more specific error messages for common Stripe errors
    if (error instanceof Error) {
      // Check for Stripe-specific errors
      if ('type' in error && error.type === 'StripeInvalidRequestError') {
        // Common Stripe errors
        if (error.message.includes('account')) {
          return json(
            { error: 'The tour guide\'s payment account is not properly configured. Please contact them.' },
            { status: 400 }
          );
        }
        if (error.message.includes('currency')) {
          return json(
            { error: 'This currency is not supported for the tour guide\'s location.' },
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
      console.error('Stripe error details:', {
        message: error.message,
        type: 'type' in error ? error.type : 'unknown',
        code: 'code' in error ? error.code : 'unknown',
        bookingId,
        amount,
        currency,
        connectedAccountId
      });
    }
    
    return json(
      { error: 'Failed to create payment. Please try again or contact support.' },
      { status: 500 }
    );
  }
}; 
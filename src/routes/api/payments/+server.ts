import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { stripe, createPaymentIntent } from '$lib/stripe.js';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { bookingId, amount, currency = 'eur' } = body;

    if (!bookingId || !amount) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Initialize PocketBase
    const pb = new PocketBase(POCKETBASE_URL);

    // Get booking details
    const booking = await pb.collection('bookings').getOne(bookingId, {
      expand: 'tour,tour.user'
    });

    if (!booking) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify amount matches booking
    if (booking.totalAmount !== amount) {
      return json({ error: 'Amount mismatch' }, { status: 400 });
    }

    // Create payment intent with metadata
    const paymentIntent = await createPaymentIntent(amount, currency, {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      tourId: booking.tour,
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
    });

    // Create payment record in database
    const payment = await pb.collection('payments').create({
      booking: bookingId,
      stripePaymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency,
      status: 'pending',
      processingFee: 0, // Will be updated after payment
      netAmount: amount, // Will be updated after payment
    });

    // Update booking with payment intent ID
    await pb.collection('bookings').update(bookingId, {
      paymentId: paymentIntent.id,
    });

    return json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}; 
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createPaymentIntent } from '$lib/stripe.server.js';
import { db } from '$lib/db/connection.js';
import { bookings, payments, tours, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { bookingId, amount, currency = 'eur' } = body;

    if (!bookingId || !amount) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get booking details with tour and user data
    const bookingData = await db.select({
      id: bookings.id,
      totalAmount: bookings.totalAmount,
      bookingReference: bookings.bookingReference,
      customerEmail: bookings.customerEmail,
      customerName: bookings.customerName,
      tourId: bookings.tourId,
      tourUserId: users.id
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

    // Verify amount matches booking
    if (parseFloat(booking.totalAmount) !== amount) {
      return json({ error: 'Amount mismatch' }, { status: 400 });
    }

    // Create payment intent with metadata
    const paymentIntent = await createPaymentIntent(amount, currency, {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      tourId: booking.tourId,
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
    });

    // Create payment record in database
    const paymentResult = await db.insert(payments).values({
      bookingId: bookingId,
      stripePaymentIntentId: paymentIntent.id,
      amount: amount.toString(),
      currency: currency.toUpperCase(),
      status: 'pending',
      processingFee: '0', // Will be updated after payment
      netAmount: amount.toString(), // Will be updated after payment
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
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}; 
import { json, type RequestHandler } from '@sveltejs/kit';
import { stripe } from '$lib/stripe.js';
import PocketBase from 'pocketbase';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { Stripe } from 'stripe';

const POCKETBASE_URL = publicEnv.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return json({ error: 'No signature' }, { status: 400 });
  }

  if (!privateEnv.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      privateEnv.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return json({ error: 'Invalid signature' }, { status: 400 });
  }

  const pb = new PocketBase(POCKETBASE_URL);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;

        if (!bookingId) {
          console.error('No bookingId in payment intent metadata');
          break;
        }

        try {
          // Update payment record
          const payments = await pb.collection('payments').getFullList({
            filter: `stripePaymentIntentId = "${paymentIntent.id}"`
          });

          if (payments.length > 0) {
            const payment = payments[0];
            
            // Calculate Stripe fees (approximate - actual fees come from balance transaction)
            const stripeFee = Math.round(paymentIntent.amount * 0.029 + 30); // 2.9% + 30 cents
            const netAmount = (paymentIntent.amount - stripeFee) / 100; // Convert back to euros

            await pb.collection('payments').update(payment.id, {
              status: 'succeeded',
              processingFee: stripeFee / 100,
              netAmount: netAmount
            });
          }

          // Update booking status
          await pb.collection('bookings').update(bookingId, {
            status: 'confirmed',
            paymentStatus: 'paid'
          });
        } catch (updateError) {
          console.error('Failed to update payment/booking status:', updateError);
          // Continue processing - payment was successful even if we couldn't update the database
        }

        // Note: QR code conversion tracking is handled during booking creation
        // Webhooks don't have authenticated access to update QR codes

        // TODO: Send confirmation email to customer
        // TODO: Send notification to tour guide

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;

        if (!bookingId) break;

        // Update payment record
        const payments = await pb.collection('payments').getFullList({
          filter: `stripePaymentIntentId = "${paymentIntent.id}"`
        });

        if (payments.length > 0) {
          await pb.collection('payments').update(payments[0].id, {
            status: 'failed'
          });
        }

        // Update booking status
        await pb.collection('bookings').update(bookingId, {
          paymentStatus: 'failed'
        });

        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;

        if (!bookingId) break;

        // Update payment record
        const payments = await pb.collection('payments').getFullList({
          filter: `stripePaymentIntentId = "${paymentIntent.id}"`
        });

        if (payments.length > 0) {
          await pb.collection('payments').update(payments[0].id, {
            status: 'cancelled'
          });
        }

        // Update booking status
        await pb.collection('bookings').update(bookingId, {
          status: 'cancelled',
          paymentStatus: 'failed'
        });

        // Restore time slot availability
        const booking = await pb.collection('bookings').getOne(bookingId);
        const timeSlot = await pb.collection('time_slots').getOne(booking.timeSlot);
        
        await pb.collection('time_slots').update(booking.timeSlot, {
          bookedSpots: Math.max(0, timeSlot.bookedSpots - booking.participants),
          availableSpots: timeSlot.availableSpots + booking.participants
        });

        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}; 
import { json, type RequestHandler } from '@sveltejs/kit';
import { getStripe } from '$lib/stripe.server.js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { Stripe } from 'stripe';
import { generateTicketQRCode } from '$lib/ticket-qr.js';
import { createAuthenticatedPB } from '$lib/admin-auth.server.js';

const POCKETBASE_URL = publicEnv.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    console.error('Webhook error: No signature provided');
    return json({ error: 'No signature' }, { status: 400 });
  }

  if (!privateEnv.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      privateEnv.STRIPE_WEBHOOK_SECRET
    );
    console.log(`Webhook received: ${event.type} - ID: ${event.id}`);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Get authenticated PocketBase instance
  let pb;
  try {
    console.log('Webhook: Attempting PocketBase admin authentication...');
    pb = await createAuthenticatedPB();
    console.log('Webhook: PocketBase admin authentication successful');
  } catch (authError) {
    console.error('Webhook: Failed to authenticate with PocketBase admin:', authError);
    return json({ error: 'Database authentication failed' }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;

        console.log(`Payment succeeded for booking ${bookingId}, payment intent ${paymentIntent.id}`);

        if (!bookingId) {
          console.error('No bookingId in payment intent metadata');
          break;
        }

        try {
          console.log(`Webhook: Processing payment success for booking ${bookingId}...`);
          
          // Update payment record
          console.log(`Webhook: Looking for payment record with Stripe ID: ${paymentIntent.id}`);
          const payments = await pb.collection('payments').getFullList({
            filter: `stripePaymentIntentId = "${paymentIntent.id}"`
          });
          console.log(`Webhook: Found ${payments.length} payment records`);

          if (payments.length > 0) {
            const payment = payments[0];
            console.log(`Webhook: Updating payment record ${payment.id}`);
            
            // Calculate Stripe fees (approximate - actual fees come from balance transaction)
            const stripeFee = Math.round(paymentIntent.amount * 0.029 + 30); // 2.9% + 30 cents
            const netAmount = (paymentIntent.amount - stripeFee) / 100; // Convert back to euros

            await pb.collection('payments').update(payment.id, {
              status: 'succeeded',
              processingFee: stripeFee / 100,
              netAmount: netAmount
            });
            console.log(`Webhook: Payment record updated successfully: ${payment.id} - Status: succeeded`);
          } else {
            console.warn(`Webhook: No payment record found for payment intent ${paymentIntent.id}`);
          }

          // Generate ticket QR code
          const ticketQRCode = generateTicketQRCode();
          console.log(`Webhook: Generated ticket QR code: ${ticketQRCode} for booking ${bookingId}`);

          // Update booking status with ticket QR code
          console.log(`Webhook: Updating booking ${bookingId} with ticket QR code and status...`);
          const updateData = {
            status: 'confirmed',
            paymentStatus: 'paid',
            ticketQRCode: ticketQRCode,
            attendanceStatus: 'not_arrived'
          };
          console.log(`Webhook: Booking update data:`, updateData);
          
          // Update booking directly and trigger emails
          await pb.collection('bookings').update(bookingId, updateData);
          
          // Send emails via SvelteKit email service
          try {
            // Send confirmation email
            const emailResponse = await fetch(`${new URL(request.url).origin}/api/send-booking-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId,
                emailType: 'confirmation'
              })
            });
            
            if (emailResponse.ok) {
              console.log(`Webhook: Confirmation email sent for booking ${bookingId}`);
            } else {
              console.warn(`Webhook: Failed to send confirmation email:`, await emailResponse.text());
            }
            
            // Send QR ticket
            const qrResponse = await fetch(`${new URL(request.url).origin}/api/send-booking-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                bookingId,
                emailType: 'qr-ticket'
              })
            });
            
            if (qrResponse.ok) {
              console.log(`Webhook: QR ticket sent for booking ${bookingId}`);
            } else {
              console.warn(`Webhook: Failed to send QR ticket:`, await qrResponse.text());
            }
          } catch (emailError) {
            console.warn('Webhook: Error sending emails:', emailError);
          }
          
          console.log(`Webhook: Booking confirmed successfully: ${bookingId} - Status: confirmed, Payment: paid, Ticket: ${ticketQRCode}`);

        } catch (updateError) {
          console.error('Webhook: Failed to update payment/booking status:', updateError);
          console.error('Webhook: Update error details:', {
            error: updateError,
            bookingId,
            paymentIntentId: paymentIntent.id
          });
          // Continue processing - payment was successful even if we couldn't update the database
        }

        // Note: QR code conversion tracking is handled during booking creation via API
        // No need to track conversions again in webhook as they're already counted

        // TODO: Send confirmation email to customer with ticket QR code
        // TODO: Send notification to tour guide

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;

        console.log(`Payment failed for booking ${bookingId}, payment intent ${paymentIntent.id}`);

        if (!bookingId) {
          console.warn('No bookingId in failed payment intent metadata');
          break;
        }

        // Update payment record
        const payments = await pb.collection('payments').getFullList({
          filter: `stripePaymentIntentId = "${paymentIntent.id}"`
        });

        if (payments.length > 0) {
          await pb.collection('payments').update(payments[0].id, {
            status: 'failed'
          });
          console.log(`Payment record marked as failed: ${payments[0].id}`);
        }

        // Update booking status
        await pb.collection('bookings').update(bookingId, {
          paymentStatus: 'failed'
        });
        console.log(`Booking payment marked as failed: ${bookingId}`);

        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;

        console.log(`Payment canceled for booking ${bookingId}, payment intent ${paymentIntent.id}`);

        if (!bookingId) {
          console.warn('No bookingId in canceled payment intent metadata');
          break;
        }

        // Update payment record
        const payments = await pb.collection('payments').getFullList({
          filter: `stripePaymentIntentId = "${paymentIntent.id}"`
        });

        if (payments.length > 0) {
          await pb.collection('payments').update(payments[0].id, {
            status: 'cancelled'
          });
          console.log(`Payment record marked as cancelled: ${payments[0].id}`);
        }

        // Update booking status
        await pb.collection('bookings').update(bookingId, {
          status: 'cancelled',
          paymentStatus: 'failed'
        });
        console.log(`Booking cancelled: ${bookingId}`);

        // Restore time slot availability
        try {
          const booking = await pb.collection('bookings').getOne(bookingId);
          const timeSlot = await pb.collection('time_slots').getOne(booking.timeSlot);
          
          await pb.collection('time_slots').update(booking.timeSlot, {
            bookedSpots: Math.max(0, timeSlot.bookedSpots - booking.participants),
            availableSpots: timeSlot.availableSpots + booking.participants
          });
          console.log(`Time slot availability restored for booking ${bookingId}`);
        } catch (timeSlotError) {
          console.error('Failed to restore time slot availability:', timeSlotError);
        }

        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    console.log(`Webhook ${event.type} processed successfully`);
    return json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}; 
import { json, type RequestHandler } from '@sveltejs/kit';
import { getStripe } from '$lib/stripe.server.js';
import { env as privateEnv } from '$env/dynamic/private';
import type { Stripe } from 'stripe';
import { generateTicketQRCode } from '$lib/ticket-qr.js';
import { db } from '$lib/db/connection.js';
import { bookings, payments, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { broadcastBookingNotification } from '$lib/notifications/server.js';
import { updateUserSubscription, incrementBookingUsage } from '$lib/stripe-subscriptions.server.js';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    console.error('Webhook error: No signature provided');
    return json({ error: 'No signature' }, { status: 400 });
  }

  if (!privateEnv.STRIPE_WEBHOOK_SECRET && !privateEnv.STRIPE_CONNECT_WEBHOOK_SECRET) {
    console.error('No webhook secrets configured');
    return json({ error: 'Webhook secrets not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    
    // Try platform webhook secret first (for customer payment events)
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        privateEnv.STRIPE_WEBHOOK_SECRET
      );
      console.log(`Platform webhook received: ${event.type} - ID: ${event.id}`);
    } catch (err) {
      // If platform secret fails, try connect webhook secret
      if (privateEnv.STRIPE_CONNECT_WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(
          body,
          sig,
          privateEnv.STRIPE_CONNECT_WEBHOOK_SECRET
        );
        console.log(`Connect webhook received: ${event.type} - ID: ${event.id} - Account: ${event.account}`);
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return json({ error: 'Invalid signature' }, { status: 400 });
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
          const paymentRecords = await db.select().from(payments).where(eq(payments.stripePaymentIntentId, paymentIntent.id));
          console.log(`Webhook: Found ${paymentRecords.length} payment records`);

          if (paymentRecords.length > 0) {
            const payment = paymentRecords[0];
            console.log(`Webhook: Updating payment record ${payment.id}`);
            
            // Calculate Stripe fees (approximate - actual fees come from balance transaction)
            const stripeFee = Math.round(paymentIntent.amount * 0.029 + 30); // 2.9% + 30 cents
            const netAmount = (paymentIntent.amount - stripeFee) / 100; // Convert back to euros

            await db.update(payments)
              .set({
                status: 'paid',
                processingFee: (stripeFee / 100).toString(),
                netAmount: netAmount.toString(),
                updatedAt: new Date()
              })
              .where(eq(payments.id, payment.id));
            console.log(`Webhook: Payment record updated successfully: ${payment.id} - Status: paid`);
          } else {
            console.warn(`Webhook: No payment record found for payment intent ${paymentIntent.id}`);
          }

          // Generate ticket QR code
          const ticketQRCode = generateTicketQRCode();
          console.log(`Webhook: Generated ticket QR code: ${ticketQRCode} for booking ${bookingId}`);

          // Update booking status with ticket QR code
          console.log(`Webhook: Updating booking ${bookingId} with ticket QR code and status...`);
          const updateData = {
            status: 'confirmed' as const,
            paymentStatus: 'paid' as const,
            ticketQRCode: ticketQRCode,
            attendanceStatus: 'not_arrived' as const,
            updatedAt: new Date()
          };
          console.log(`Webhook: Booking update data:`, updateData);
          
          // Update booking directly and trigger emails
          await db.update(bookings)
            .set(updateData)
            .where(eq(bookings.id, bookingId));
          
          console.log(`Webhook: Booking confirmed successfully: ${bookingId} - Status: confirmed, Payment: paid, Ticket: ${ticketQRCode}`);

          // No need to transfer payment - with direct charges, the payment already went to the tour guide!
          // This is the beauty of the no-commission model - simpler and cleaner

          // Send emails via SvelteKit email service with rate limit handling
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
              console.error('Webhook: Failed to send confirmation email:', 
                emailResponse.status, 
                await emailResponse.text()
              );
            }
            
            // Don't need to wait anymore since we're not sending separate QR ticket email
            // await new Promise(resolve => setTimeout(resolve, 600));

            // Send booking notification email to tour guide
            const guideEmailResponse = await fetch(`${new URL(request.url).origin}/api/send-guide-booking-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookingId })
            });
            
            if (guideEmailResponse.ok) {
              console.log(`Webhook: Guide notification email sent for booking ${bookingId}`);
            } else {
              console.warn(`Webhook: Failed to send guide notification email:`, await guideEmailResponse.text());
            }
          } catch (emailError) {
            console.warn('Webhook: Error sending emails:', emailError);
          }
          
          // Send real-time notification to tour owner
          try {
            // Get booking details for notification
            const fullBookingData = await db.select({
              bookingId: bookings.id,
              customerName: bookings.customerName, 
              customerEmail: bookings.customerEmail,
              participants: bookings.participants,
              totalAmount: bookings.totalAmount,
              status: bookings.status,
              tourId: tours.id,
              tourName: tours.name,
              tourOwnerId: tours.userId
            })
            .from(bookings)
            .innerJoin(tours, eq(bookings.tourId, tours.id))
            .where(eq(bookings.id, bookingId))
            .limit(1);

            if (fullBookingData.length > 0) {
              // Increment booking usage for the tour owner
              await incrementBookingUsage(fullBookingData[0].tourOwnerId);
              console.log(`Webhook: Incremented booking usage for tour owner ${fullBookingData[0].tourOwnerId}`);
              
              const bookingNotificationData = {
                id: fullBookingData[0].bookingId,
                tourId: fullBookingData[0].tourId,
                tourName: fullBookingData[0].tourName,
                customerName: fullBookingData[0].customerName,
                customerEmail: fullBookingData[0].customerEmail,
                participants: fullBookingData[0].participants,
                totalAmount: fullBookingData[0].totalAmount,
                status: fullBookingData[0].status
              };

              const notificationSent = await broadcastBookingNotification(bookingNotificationData);
              if (notificationSent) {
                console.log(`Webhook: Real-time notification sent for booking ${bookingId}`);
              } else {
                console.warn(`Webhook: Failed to send real-time notification for booking ${bookingId}`);
              }
            }
          } catch (notificationError) {
            console.warn('Webhook: Error sending real-time notification:', notificationError);
          }

        } catch (updateError) {
          console.error('Webhook: Failed to update payment/booking status:', updateError);
          console.error('Webhook: Update error details:', {
            error: updateError,
            bookingId,
            paymentIntentId: paymentIntent.id
          });
          // Continue processing - payment was successful even if we couldn't update the database
        }

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
        const paymentRecords = await db.select().from(payments).where(eq(payments.stripePaymentIntentId, paymentIntent.id));

        if (paymentRecords.length > 0) {
          await db.update(payments)
            .set({
              status: 'failed',
              updatedAt: new Date()
            })
            .where(eq(payments.id, paymentRecords[0].id));
          console.log(`Payment record marked as failed: ${paymentRecords[0].id}`);
        }

        // Update booking status
        await db.update(bookings)
          .set({
            paymentStatus: 'failed',
            updatedAt: new Date()
          })
          .where(eq(bookings.id, bookingId));
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
        const paymentRecords = await db.select().from(payments).where(eq(payments.stripePaymentIntentId, paymentIntent.id));

        if (paymentRecords.length > 0) {
          await db.update(payments)
            .set({
              status: 'failed',
              updatedAt: new Date()
            })
            .where(eq(payments.id, paymentRecords[0].id));
          console.log(`Payment record marked as failed: ${paymentRecords[0].id}`);
        }

        // Update booking status
        await db.update(bookings)
          .set({
            status: 'cancelled',
            paymentStatus: 'failed',
            updatedAt: new Date()
          })
          .where(eq(bookings.id, bookingId));
        console.log(`Booking cancelled: ${bookingId}`);

        // Restore time slot availability
        try {
          const booking = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
          if (booking.length > 0) {
            const timeSlot = await db.select().from(timeSlots).where(eq(timeSlots.id, booking[0].timeSlotId)).limit(1);
            
            if (timeSlot.length > 0) {
              await db.update(timeSlots)
                .set({
                  bookedSpots: Math.max(0, timeSlot[0].bookedSpots - booking[0].participants),
                  availableSpots: timeSlot[0].availableSpots + booking[0].participants,
                  updatedAt: new Date()
                })
                .where(eq(timeSlots.id, booking[0].timeSlotId));
              console.log(`Time slot availability restored for booking ${bookingId}`);
            }
          }
        } catch (timeSlotError) {
          console.error('Failed to restore time slot availability:', timeSlotError);
        }

        break;
      }

      // Subscription events
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription created: ${subscription.id} for customer ${subscription.customer}`);

        try {
          await updateUserSubscription(subscription.customer as string, subscription);
          console.log(`Subscription created successfully: ${subscription.id}`);
        } catch (error) {
          console.error('Failed to create user subscription:', error);
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription updated: ${subscription.id} for customer ${subscription.customer}`);

        try {
          await updateUserSubscription(subscription.customer as string, subscription);
          console.log(`Subscription updated successfully: ${subscription.id}`);
        } catch (error) {
          console.error('Failed to update user subscription:', error);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription deleted: ${subscription.id} for customer ${subscription.customer}`);

        try {
          // When subscription is deleted, reset user to free plan
          const userRecords = await db.select().from(users).where(eq(users.stripeCustomerId, subscription.customer as string));
          
          if (userRecords.length > 0) {
            await db.update(users)
              .set({
                subscriptionPlan: 'free',
                subscriptionStatus: null,
                subscriptionCancelAtPeriodEnd: false,
                subscriptionCurrentPeriodEnd: null,
                subscriptionId: null,
                monthlyBookingsUsed: 0,
                monthlyBookingsResetAt: null,
                updatedAt: new Date()
              })
              .where(eq(users.id, userRecords[0].id));
            
            console.log(`User ${userRecords[0].id} subscription reset to free plan`);
          }
        } catch (error) {
          console.error('Failed to handle subscription deletion:', error);
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          console.log(`Invoice payment succeeded for subscription: ${invoice.subscription}`);
          // Subscription is automatically active, no additional action needed
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          console.log(`Invoice payment failed for subscription: ${invoice.subscription}`);
          // Stripe will handle retry logic and eventual subscription cancellation
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
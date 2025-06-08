import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { generateTicketQRCode } from '$lib/ticket-qr.js';
import { db } from '$lib/db/connection.js';
import { bookings, payments } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { bookingId, paymentIntentId } = await request.json();
    
    if (!bookingId || !paymentIntentId) {
      return json({ 
        success: false, 
        error: 'bookingId and paymentIntentId are required' 
      }, { status: 400 });
    }

    console.log(`Test webhook: Processing booking ${bookingId} with payment ${paymentIntentId}`);

    try {
      console.log(`Test webhook: Processing payment success for booking ${bookingId}...`);
      
      // Look for payment record
      console.log(`Test webhook: Looking for payment record with Stripe ID: ${paymentIntentId}`);
      const paymentRecords = await db.select().from(payments).where(eq(payments.stripePaymentIntentId, paymentIntentId));
      console.log(`Test webhook: Found ${paymentRecords.length} payment records`);

      let paymentUpdateResult = null;
      if (paymentRecords.length > 0) {
        const payment = paymentRecords[0];
        console.log(`Test webhook: Updating payment record ${payment.id}`);
        
        const paymentUpdate = await db.update(payments)
          .set({
            status: 'paid',
            processingFee: '2.50', // Test fee
            netAmount: '47.50', // Test amount
            updatedAt: new Date()
          })
          .where(eq(payments.id, payment.id))
          .returning();
        
        paymentUpdateResult = paymentUpdate[0];
        console.log(`Test webhook: Payment record updated successfully: ${payment.id} - Status: paid`);
      } else {
        console.warn(`Test webhook: No payment record found for payment intent ${paymentIntentId}`);
      }

      // Generate ticket QR code
      const ticketQRCode = generateTicketQRCode();
      console.log(`Test webhook: Generated ticket QR code: ${ticketQRCode} for booking ${bookingId}`);

      // Update booking status with ticket QR code
      console.log(`Test webhook: Updating booking ${bookingId} with ticket QR code and status...`);
      const updateData = {
        status: 'confirmed' as const,
        paymentStatus: 'paid' as const,
        ticketQRCode: ticketQRCode,
        attendanceStatus: 'not_arrived' as const,
        updatedAt: new Date()
      };
      console.log(`Test webhook: Booking update data:`, updateData);
      
      const bookingUpdate = await db.update(bookings)
        .set(updateData)
        .where(eq(bookings.id, bookingId))
        .returning();
      
      console.log(`Test webhook: Booking confirmed successfully: ${bookingId} - Status: confirmed, Payment: paid, Ticket: ${ticketQRCode}`);

      return json({
        success: true,
        message: 'Test webhook processed successfully',
        details: {
          bookingId,
          paymentIntentId,
          ticketQRCode,
          paymentUpdated: !!paymentUpdateResult,
          bookingUpdated: true,
          bookingUpdate: bookingUpdate[0],
          paymentUpdate: paymentUpdateResult
        }
      });

    } catch (updateError) {
      console.error('Test webhook: Failed to update payment/booking status:', updateError);
      return json({ 
        success: false, 
        error: 'Failed to update records',
        details: updateError instanceof Error ? updateError.message : String(updateError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Test webhook: Error:', error);
    return json({ 
      success: false, 
      error: 'Test webhook failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}; 
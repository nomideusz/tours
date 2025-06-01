import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createAuthenticatedPB } from '$lib/admin-auth.server.js';
import { generateTicketQRCode } from '$lib/ticket-qr.js';

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

    // Get authenticated PocketBase instance
    let pb;
    try {
      console.log('Test webhook: Attempting PocketBase admin authentication...');
      pb = await createAuthenticatedPB();
      console.log('Test webhook: PocketBase admin authentication successful');
    } catch (authError) {
      console.error('Test webhook: Failed to authenticate with PocketBase admin:', authError);
      return json({ 
        success: false, 
        error: 'Database authentication failed',
        details: authError instanceof Error ? authError.message : String(authError)
      }, { status: 500 });
    }

    try {
      console.log(`Test webhook: Processing payment success for booking ${bookingId}...`);
      
      // Look for payment record
      console.log(`Test webhook: Looking for payment record with Stripe ID: ${paymentIntentId}`);
      const payments = await pb.collection('payments').getFullList({
        filter: `stripePaymentIntentId = "${paymentIntentId}"`
      });
      console.log(`Test webhook: Found ${payments.length} payment records`);

      let paymentUpdateResult = null;
      if (payments.length > 0) {
        const payment = payments[0];
        console.log(`Test webhook: Updating payment record ${payment.id}`);
        
        const paymentUpdate = await pb.collection('payments').update(payment.id, {
          status: 'succeeded',
          processingFee: 2.50, // Test fee
          netAmount: 47.50 // Test amount
        });
        paymentUpdateResult = paymentUpdate;
        console.log(`Test webhook: Payment record updated successfully: ${payment.id} - Status: succeeded`);
      } else {
        console.warn(`Test webhook: No payment record found for payment intent ${paymentIntentId}`);
      }

      // Generate ticket QR code
      const ticketQRCode = generateTicketQRCode();
      console.log(`Test webhook: Generated ticket QR code: ${ticketQRCode} for booking ${bookingId}`);

      // Update booking status with ticket QR code
      console.log(`Test webhook: Updating booking ${bookingId} with ticket QR code and status...`);
      const updateData = {
        status: 'confirmed',
        paymentStatus: 'paid',
        ticketQRCode: ticketQRCode,
        attendanceStatus: 'not_arrived'
      };
      console.log(`Test webhook: Booking update data:`, updateData);
      
      const bookingUpdate = await pb.collection('bookings').update(bookingId, updateData);
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
          bookingUpdate,
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
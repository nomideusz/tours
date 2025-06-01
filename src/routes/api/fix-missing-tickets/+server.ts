import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createAuthenticatedPB } from '$lib/admin-auth.server.js';
import { generateTicketQRCode } from '$lib/ticket-qr.js';

export const POST: RequestHandler = async () => {
  try {
    const pb = await createAuthenticatedPB();
    
    // Find bookings that are confirmed/paid but missing ticket QR codes
    const bookingsToFix = await pb.collection('bookings').getFullList({
      filter: `status = "confirmed" && paymentStatus = "paid" && (ticketQRCode = "" || ticketQRCode = null)`,
      expand: 'tour'
    });
    
    console.log(`Found ${bookingsToFix.length} bookings to fix`);
    
    const results = [];
    for (const booking of bookingsToFix) {
      try {
        const ticketQRCode = generateTicketQRCode();
        
        await pb.collection('bookings').update(booking.id, {
          ticketQRCode: ticketQRCode,
          attendanceStatus: booking.attendanceStatus || 'not_arrived'
        });
        
        results.push({
          id: booking.id,
          bookingReference: booking.bookingReference,
          customerName: booking.customerName,
          ticketQRCode: ticketQRCode,
          status: 'fixed'
        });
        
        console.log(`Fixed booking ${booking.id} - Generated ticket: ${ticketQRCode}`);
      } catch (error) {
        results.push({
          id: booking.id,
          bookingReference: booking.bookingReference,
          customerName: booking.customerName,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Also fix payment records that are stuck in pending
    const paymentsToFix = await pb.collection('payments').getFullList({
      filter: `status = "pending" && booking.status = "confirmed" && booking.paymentStatus = "paid"`,
      expand: 'booking'
    });
    
    console.log(`Found ${paymentsToFix.length} payment records to fix`);
    
    for (const payment of paymentsToFix) {
      try {
        await pb.collection('payments').update(payment.id, {
          status: 'succeeded',
          processingFee: payment.amount * 0.029 + 0.30,
          netAmount: payment.amount - (payment.amount * 0.029 + 0.30)
        });
        console.log(`Fixed payment ${payment.id} - Status: succeeded`);
      } catch (error) {
        console.error(`Failed to fix payment ${payment.id}:`, error);
      }
    }
    
    return json({
      success: true,
      message: `Fixed ${results.filter(r => r.status === 'fixed').length} bookings`,
      bookingsFixed: results.filter(r => r.status === 'fixed').length,
      bookingsFailed: results.filter(r => r.status === 'error').length,
      paymentsFixed: paymentsToFix.length,
      results
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}; 
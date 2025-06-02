import { json, type RequestHandler } from '@sveltejs/kit';
import { createAuthenticatedPB } from '$lib/admin-auth.server.js';

export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return json({ error: 'bookingId is required' }, { status: 400 });
    }

    // Get booking details to check status
    const pb = await createAuthenticatedPB();
    const booking = await pb.collection('bookings').getOne(bookingId);

    console.log(`📋 Booking created webhook: ${bookingId} - Status: ${booking.status}, Payment: ${booking.paymentStatus}`);

    // If booking is already confirmed and paid, send confirmation email
    if (booking.status === 'confirmed' && booking.paymentStatus === 'paid') {
      try {
        // Send confirmation email
        const emailResponse = await fetch('/api/send-booking-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            emailType: 'confirmation'
          })
        });

        if (emailResponse.ok) {
          console.log(`✅ Confirmation email sent for new booking ${bookingId}`);
        } else {
          console.warn(`⚠️ Failed to send confirmation email for new booking ${bookingId}`);
        }

        // Send QR ticket if available
        if (booking.ticketQRCode) {
          const qrResponse = await fetch('/api/send-booking-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId,
              emailType: 'qr-ticket'
            })
          });

          if (qrResponse.ok) {
            console.log(`✅ QR ticket sent for new booking ${bookingId}`);
          } else {
            console.warn(`⚠️ Failed to send QR ticket for new booking ${bookingId}`);
          }
        }
      } catch (emailError) {
        console.warn('📧 Error sending emails for new booking:', emailError);
      }
    }

    return json({
      success: true,
      message: 'Booking creation processed',
      bookingId,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      emailsSent: booking.status === 'confirmed' && booking.paymentStatus === 'paid'
    });

  } catch (error) {
    console.error('Error in booking-created API:', error);
    return json({
      error: 'Failed to process booking creation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 
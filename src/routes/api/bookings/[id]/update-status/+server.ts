import { json, type RequestHandler } from '@sveltejs/kit';
import { bookingsApi } from '$lib/pocketbase.js';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const bookingId = params.id;
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const { status, paymentStatus, ticketQRCode, attendanceStatus } = await request.json();

    // Initialize PocketBase for direct updates
    const pb = new PocketBase(POCKETBASE_URL);

    // Get current booking
    const currentBooking = await pb.collection('bookings').getOne(bookingId);
    const oldStatus = currentBooking.status;
    const oldPaymentStatus = currentBooking.paymentStatus;

    // Update booking directly (webhook context)
    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (ticketQRCode) updateData.ticketQRCode = ticketQRCode;
    if (attendanceStatus) updateData.attendanceStatus = attendanceStatus;

    const updatedBooking = await pb.collection('bookings').update(bookingId, updateData);

    // Trigger appropriate email notifications
    try {
      const newStatus = status || oldStatus;
      const newPaymentStatus = paymentStatus || oldPaymentStatus;
      
      // Determine which email to send based on status changes
      let emailType = null;
      
      // Check if booking just became confirmed and paid
      if ((oldStatus !== 'confirmed' && newStatus === 'confirmed') && newPaymentStatus === 'paid') {
        emailType = 'confirmation';
      }
      // Check if payment status changed to paid (but not first time confirmation)
      else if (oldPaymentStatus !== 'paid' && newPaymentStatus === 'paid' && newStatus === 'confirmed') {
        emailType = 'payment';
      }
      // Check if booking was cancelled
      else if (oldStatus !== 'cancelled' && newStatus === 'cancelled') {
        emailType = 'cancelled';
      }
      
      // Send email if appropriate
      if (emailType) {
        const emailResponse = await fetch(`${new URL(request.url).origin}/api/send-booking-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            emailType
          })
        });

        if (!emailResponse.ok) {
          console.warn(`Failed to send ${emailType} email:`, await emailResponse.text());
        } else {
          console.log(`Successfully sent ${emailType} email for booking ${bookingId}`);
        }
      }
      
      // Also send QR ticket for confirmed and paid bookings
      if (newStatus === 'confirmed' && newPaymentStatus === 'paid') {
        const qrResponse = await fetch(`${POCKETBASE_URL}/api/send-qr-ticket`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId })
        });
        
        if (!qrResponse.ok) {
          console.warn('Failed to send QR ticket:', await qrResponse.text());
        } else {
          console.log(`Successfully sent QR ticket for booking ${bookingId}`);
        }
      }
      
    } catch (emailError) {
      console.warn('Error triggering email notifications:', emailError);
      // Don't fail the request if emails fail
    }

    return json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    return json({ 
      error: 'Failed to update booking status', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}; 
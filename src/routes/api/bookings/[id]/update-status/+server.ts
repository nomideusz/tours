import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { bookings, payments } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { generateTicketQRCode } from '$lib/ticket-qr.js';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const bookingId = params.id;
    if (!bookingId) {
      return json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { status, paymentStatus, ticketQRCode, attendanceStatus, action } = body;

    console.log(`Update-status: Processing booking ${bookingId} with data:`, { status, paymentStatus, ticketQRCode, attendanceStatus, action });

    // Get current booking
    const currentBookingResult = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    
    if (currentBookingResult.length === 0) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }
    
    const currentBooking = currentBookingResult[0];
    const oldStatus = currentBooking.status;
    const oldPaymentStatus = currentBooking.paymentStatus;

    console.log(`Update-status: Current booking status: ${oldStatus}, payment: ${oldPaymentStatus}`);

    // Special action to manually confirm payment (for testing/debugging)
    if (action === 'confirm_payment') {
      const newTicketQRCode = generateTicketQRCode();
      
      const updateData = {
        status: 'confirmed' as const,
        paymentStatus: 'paid' as const,
        ticketQRCode: newTicketQRCode,
        attendanceStatus: 'not_arrived' as const,
        updatedAt: new Date()
      };

      console.log(`Update-status: Manually confirming payment with data:`, updateData);

      const updatedBookingResult = await db.update(bookings)
        .set(updateData)
        .where(eq(bookings.id, bookingId))
        .returning();

      if (updatedBookingResult.length === 0) {
        return json({ error: 'Failed to update booking' }, { status: 500 });
      }

      // Also update the payment record if it exists
      if (currentBooking.paymentId) {
        try {
                     const paymentRecords = await db.select().from(payments).where(eq(payments.stripePaymentIntentId, currentBooking.paymentId));
           if (paymentRecords.length > 0) {
             await db.update(payments)
               .set({
                 status: 'paid',
                 updatedAt: new Date()
               })
               .where(eq(payments.id, paymentRecords[0].id));
             console.log(`Update-status: Updated payment record ${paymentRecords[0].id} to paid`);
          }
        } catch (paymentUpdateError) {
          console.warn('Update-status: Failed to update payment record:', paymentUpdateError);
        }
      }

      console.log(`Update-status: Payment manually confirmed for booking ${bookingId}`);
      
      return json({ 
        ...updatedBookingResult[0],
        action: 'payment_confirmed',
        message: 'Payment manually confirmed'
      });
    }

    // Prepare update data for normal updates
    const updateData: Partial<typeof bookings.$inferInsert> = {
      updatedAt: new Date()
    };
    
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (ticketQRCode !== undefined) updateData.ticketQRCode = ticketQRCode;
    if (attendanceStatus !== undefined) updateData.attendanceStatus = attendanceStatus;

    console.log(`Update-status: Updating booking with data:`, updateData);

    // Update booking
    const updatedBookingResult = await db.update(bookings)
      .set(updateData)
      .where(eq(bookings.id, bookingId))
      .returning();

    if (updatedBookingResult.length === 0) {
      return json({ error: 'Failed to update booking' }, { status: 500 });
    }

    const updatedBooking = updatedBookingResult[0];

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
        // TODO: Update this when we migrate the QR ticket endpoint
        console.log(`QR ticket sending not yet implemented for booking ${bookingId}`);
      }
      
    } catch (emailError) {
      console.warn('Error triggering email notifications:', emailError);
      // Don't fail the request if emails fail
    }

    console.log(`Update-status: Successfully updated booking ${bookingId}`);
    return json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    return json({ 
      error: 'Failed to update booking status', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}; 
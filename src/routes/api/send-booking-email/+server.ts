import { json, type RequestHandler } from '@sveltejs/kit';
import { createAuthenticatedPB } from '$lib/admin-auth.server.js';
import { sendBookingEmail, type EmailType } from '$lib/email.server.js';
import type { Booking, Tour, TimeSlot } from '$lib/types.js';

// Extended booking type with expand data
interface ExpandedBooking extends Booking {
  expand?: {
    tour?: Tour;
    timeSlot?: TimeSlot;
  };
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { bookingId, emailType } = await request.json();

    if (!bookingId || !emailType) {
      return json({ error: 'bookingId and emailType are required' }, { status: 400 });
    }

    // Validate email type
    const validTypes: EmailType[] = ['confirmation', 'payment', 'reminder', 'cancelled', 'qr-ticket'];
    if (!validTypes.includes(emailType as EmailType)) {
      return json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Fetch booking data with expanded relations
    const pb = await createAuthenticatedPB();
    const booking = await pb.collection('bookings').getOne<ExpandedBooking>(bookingId, {
      expand: 'tour,timeSlot'
    });

    if (!booking.expand?.tour || !booking.expand?.timeSlot) {
      throw new Error('Booking data incomplete - missing tour or timeSlot');
    }

    // Send the email
    const emailResult = await sendBookingEmail(emailType as EmailType, {
      booking,
      tour: booking.expand.tour,
      timeSlot: booking.expand.timeSlot
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send email');
    }

    console.log(`✅ ${emailType} email sent successfully for booking ${bookingId} to ${booking.customerEmail}`);

    return json({
      success: true,
      message: `${emailType} email sent successfully`,
      messageId: emailResult.messageId,
      recipient: booking.customerEmail
    });

  } catch (error) {
    console.error('Error in send-booking-email API:', error);
    return json({
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 
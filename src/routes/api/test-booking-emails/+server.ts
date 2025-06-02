import { json, type RequestHandler } from '@sveltejs/kit';
import { createAuthenticatedPB } from '$lib/admin-auth.server.js';
import { sendBookingEmail, sendTestEmail, type EmailType } from '$lib/email.server.js';
import type { Booking, Tour, TimeSlot } from '$lib/types.js';

// Extended booking type with expand data
interface ExpandedBooking extends Booking {
  expand?: {
    tour?: Tour;
    timeSlot?: TimeSlot;
  };
}

export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const { action, bookingId, emailType } = await request.json();

    if (!action) {
      return json({ error: 'Action is required' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'test':
        const testResult = await sendTestEmail();
        if (!testResult.success) {
          throw new Error(testResult.error || 'Failed to send test email');
        }
        result = { message: 'Test email sent successfully', messageId: testResult.messageId };
        break;

      case 'send-email':
        if (!bookingId || !emailType) {
          return json({ error: 'bookingId and emailType are required for send-email' }, { status: 400 });
        }
        
        // Fetch booking data with expanded relations
        const pb = await createAuthenticatedPB();
        const booking = await pb.collection('bookings').getOne<ExpandedBooking>(bookingId, {
          expand: 'tour,timeSlot'
        });
        
        if (!booking.expand?.tour || !booking.expand?.timeSlot) {
          throw new Error('Booking data incomplete - missing tour or timeSlot');
        }
        
        const emailResult = await sendBookingEmail(emailType as EmailType, {
          booking,
          tour: booking.expand.tour,
          timeSlot: booking.expand.timeSlot
        });
        
        if (!emailResult.success) {
          throw new Error(emailResult.error || 'Failed to send email');
        }
        
        result = { message: `${emailType} email sent successfully`, messageId: emailResult.messageId };
        break;

      case 'send-qr-ticket':
        if (!bookingId) {
          return json({ error: 'bookingId is required for send-qr-ticket' }, { status: 400 });
        }
        
        // Fetch booking data for QR ticket
        const pbForQR = await createAuthenticatedPB();
        const qrBooking = await pbForQR.collection('bookings').getOne<ExpandedBooking>(bookingId, {
          expand: 'tour,timeSlot'
        });
        
        if (!qrBooking.expand?.tour || !qrBooking.expand?.timeSlot) {
          throw new Error('Booking data incomplete - missing tour or timeSlot');
        }
        
        const qrResult = await sendBookingEmail('qr-ticket', {
          booking: qrBooking,
          tour: qrBooking.expand.tour,
          timeSlot: qrBooking.expand.timeSlot
        });
        
        if (!qrResult.success) {
          throw new Error(qrResult.error || 'Failed to send QR ticket email');
        }
        
        result = { message: 'QR ticket email sent successfully', messageId: qrResult.messageId };
        break;

      case 'send-reminders':
        const reminderResponse = await fetch('/api/send-booking-reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!reminderResponse.ok) {
          const errorData = await reminderResponse.json().catch(() => ({ error: `HTTP ${reminderResponse.status}` }));
          throw new Error(`Booking reminders API error: ${errorData.error || 'Unknown error'}`);
        }
        
        const reminderResult = await reminderResponse.json();
        result = { 
          message: reminderResult.message,
          sent: reminderResult.sent,
          found: reminderResult.found,
          errors: reminderResult.errors
        };
        break;

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }

    return json(result);
  } catch (error) {
    console.error('Error in booking emails API:', error);
    return json({ 
      error: 'Failed to process email request', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}; 
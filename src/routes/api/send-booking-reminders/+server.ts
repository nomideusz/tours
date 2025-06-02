import { json, type RequestHandler } from '@sveltejs/kit';
import { createAuthenticatedPB } from '$lib/admin-auth.server.js';
import { sendBookingEmail } from '$lib/email.server.js';
import type { Booking, Tour, TimeSlot } from '$lib/types.js';

// Extended booking type with expand data
interface ExpandedBooking extends Booking {
  expand?: {
    tour?: Tour;
    timeSlot?: TimeSlot;
  };
}

export const POST: RequestHandler = async () => {
  try {
    // Calculate tomorrow's date range
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // Connect to PocketBase
    const pb = await createAuthenticatedPB();
    
    // Query for confirmed bookings with tours starting tomorrow
    const bookings = await pb.collection('bookings').getFullList<ExpandedBooking>({
      expand: 'tour,timeSlot',
      filter: `status = 'confirmed' && timeSlot.startTime >= '${startOfTomorrow.toISOString()}' && timeSlot.startTime <= '${endOfTomorrow.toISOString()}'`
    });

    console.log(`📅 Found ${bookings.length} confirmed bookings for tomorrow (${tomorrow.toDateString()})`);

    let sent = 0;
    const errors: string[] = [];

    // Send reminder email for each booking
    for (const booking of bookings) {
      try {
        if (!booking.expand?.tour || !booking.expand?.timeSlot) {
          errors.push(`Booking ${booking.bookingReference}: Missing tour or timeSlot data`);
          continue;
        }

        const emailResult = await sendBookingEmail('reminder', {
          booking,
          tour: booking.expand.tour,
          timeSlot: booking.expand.timeSlot
        });

        if (emailResult.success) {
          sent++;
          console.log(`✅ Reminder sent to ${booking.customerEmail} for booking ${booking.bookingReference}`);
        } else {
          errors.push(`Booking ${booking.bookingReference}: ${emailResult.error}`);
          console.error(`❌ Failed to send reminder for booking ${booking.bookingReference}:`, emailResult.error);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Booking ${booking.bookingReference}: ${errorMsg}`);
        console.error(`❌ Error processing booking ${booking.bookingReference}:`, error);
      }
    }

    const result = {
      success: true,
      found: bookings.length,
      sent,
      errors: errors.length > 0 ? errors : undefined,
      message: `Processed ${bookings.length} bookings, sent ${sent} reminder emails`,
      date: tomorrow.toDateString()
    };

    console.log(`📧 Booking reminders summary:`, result);
    return json(result);

  } catch (error) {
    console.error('❌ Error in booking reminders API:', error);
    return json({
      success: false,
      found: 0,
      sent: 0,
      error: 'Failed to process booking reminders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 
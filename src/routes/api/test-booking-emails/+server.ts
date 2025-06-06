import { json, type RequestHandler } from '@sveltejs/kit';
import { sendBookingEmail, sendTestEmail, type EmailType } from '$lib/email.server.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
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
        const bookingData = await db
          .select({
            // Booking fields
            id: bookings.id,
            status: bookings.status,
            paymentStatus: bookings.paymentStatus,
            totalAmount: bookings.totalAmount,
            participants: bookings.participants,
            customerName: bookings.customerName,
            customerEmail: bookings.customerEmail,
            customerPhone: bookings.customerPhone,
            specialRequests: bookings.specialRequests,
            bookingReference: bookings.bookingReference,
            ticketQRCode: bookings.ticketQRCode,
            createdAt: bookings.createdAt,
            updatedAt: bookings.updatedAt,
            
            // Tour fields
            tourId: bookings.tourId,
            tourName: tours.name,
            tourDescription: tours.description,
            tourLocation: tours.location,
            tourPrice: tours.price,
            tourDuration: tours.duration,
            
            // Time slot fields
            timeSlotId: bookings.timeSlotId,
            timeSlotStartTime: timeSlots.startTime,
            timeSlotEndTime: timeSlots.endTime,
            timeSlotAvailableSpots: timeSlots.availableSpots,
            timeSlotBookedSpots: timeSlots.bookedSpots
          })
          .from(bookings)
          .leftJoin(tours, eq(bookings.tourId, tours.id))
          .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
          .where(eq(bookings.id, bookingId))
          .limit(1);
        
        if (bookingData.length === 0) {
          throw new Error('Booking not found');
        }
        
        const booking = bookingData[0];
        
        if (!booking.tourId || !booking.timeSlotId) {
          throw new Error('Booking data incomplete - missing tour or timeSlot');
        }
        
        // Transform to expected format
        const formattedBooking = {
          id: booking.id,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalAmount: booking.totalAmount,
          participants: booking.participants,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          specialRequests: booking.specialRequests,
          bookingReference: booking.bookingReference,
          ticketQRCode: booking.ticketQRCode,
          created: booking.createdAt.toISOString(),
          updated: booking.updatedAt.toISOString(),
          expand: {
            tour: {
              id: booking.tourId,
              name: booking.tourName,
              description: booking.tourDescription,
              location: booking.tourLocation,
              price: booking.tourPrice,
              duration: booking.tourDuration
            } as unknown as Tour,
            timeSlot: {
              id: booking.timeSlotId,
              startTime: booking.timeSlotStartTime?.toISOString(),
              endTime: booking.timeSlotEndTime?.toISOString(),
              availableSpots: booking.timeSlotAvailableSpots,
              bookedSpots: booking.timeSlotBookedSpots
            } as unknown as TimeSlot
          }
        } as unknown as ExpandedBooking;
        
        const emailResult = await sendBookingEmail(emailType as EmailType, {
          booking: formattedBooking,
          tour: formattedBooking.expand!.tour!,
          timeSlot: formattedBooking.expand!.timeSlot!
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
        
        // Fetch booking data for QR ticket (same logic as above)
        const qrBookingData = await db
          .select({
            // Booking fields
            id: bookings.id,
            status: bookings.status,
            paymentStatus: bookings.paymentStatus,
            totalAmount: bookings.totalAmount,
            participants: bookings.participants,
            customerName: bookings.customerName,
            customerEmail: bookings.customerEmail,
            customerPhone: bookings.customerPhone,
            specialRequests: bookings.specialRequests,
            bookingReference: bookings.bookingReference,
            ticketQRCode: bookings.ticketQRCode,
            createdAt: bookings.createdAt,
            updatedAt: bookings.updatedAt,
            
            // Tour fields
            tourId: bookings.tourId,
            tourName: tours.name,
            tourDescription: tours.description,
            tourLocation: tours.location,
            tourPrice: tours.price,
            tourDuration: tours.duration,
            
            // Time slot fields
            timeSlotId: bookings.timeSlotId,
            timeSlotStartTime: timeSlots.startTime,
            timeSlotEndTime: timeSlots.endTime,
            timeSlotAvailableSpots: timeSlots.availableSpots,
            timeSlotBookedSpots: timeSlots.bookedSpots
          })
          .from(bookings)
          .leftJoin(tours, eq(bookings.tourId, tours.id))
          .leftJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
          .where(eq(bookings.id, bookingId))
          .limit(1);
        
        if (qrBookingData.length === 0) {
          throw new Error('Booking not found');
        }
        
        const qrBooking = qrBookingData[0];
        
        if (!qrBooking.tourId || !qrBooking.timeSlotId) {
          throw new Error('Booking data incomplete - missing tour or timeSlot');
        }
        
        // Transform to expected format
        const formattedQRBooking = {
          id: qrBooking.id,
          status: qrBooking.status,
          paymentStatus: qrBooking.paymentStatus,
          totalAmount: qrBooking.totalAmount,
          participants: qrBooking.participants,
          customerName: qrBooking.customerName,
          customerEmail: qrBooking.customerEmail,
          customerPhone: qrBooking.customerPhone,
          specialRequests: qrBooking.specialRequests,
          bookingReference: qrBooking.bookingReference,
          ticketQRCode: qrBooking.ticketQRCode,
          created: qrBooking.createdAt.toISOString(),
          updated: qrBooking.updatedAt.toISOString(),
          expand: {
            tour: {
              id: qrBooking.tourId,
              name: qrBooking.tourName,
              description: qrBooking.tourDescription,
              location: qrBooking.tourLocation,
              price: qrBooking.tourPrice,
              duration: qrBooking.tourDuration
            } as unknown as Tour,
            timeSlot: {
              id: qrBooking.timeSlotId,
              startTime: qrBooking.timeSlotStartTime?.toISOString(),
              endTime: qrBooking.timeSlotEndTime?.toISOString(),
              availableSpots: qrBooking.timeSlotAvailableSpots,
              bookedSpots: qrBooking.timeSlotBookedSpots
            } as unknown as TimeSlot
          }
        } as unknown as ExpandedBooking;
        
        const qrResult = await sendBookingEmail('qr-ticket', {
          booking: formattedQRBooking,
          tour: formattedQRBooking.expand!.tour!,
          timeSlot: formattedQRBooking.expand!.timeSlot!
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
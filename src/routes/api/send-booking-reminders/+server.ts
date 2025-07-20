import { json, type RequestHandler } from '@sveltejs/kit';
import { sendBookingEmail } from '$lib/email.server.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, gte, lte } from 'drizzle-orm';

export const POST: RequestHandler = async () => {
  try {
    // Calculate tomorrow's date range
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // Query for confirmed bookings with tours starting tomorrow
    const bookingData = await db.select({
      // Booking fields
      id: bookings.id,
      customerName: bookings.customerName,
      customerEmail: bookings.customerEmail,
      customerPhone: bookings.customerPhone,
      participants: bookings.participants,
      totalAmount: bookings.totalAmount,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      bookingReference: bookings.bookingReference,
      specialRequests: bookings.specialRequests,
      ticketQRCode: bookings.ticketQRCode,
      attendanceStatus: bookings.attendanceStatus,
      checkedInAt: bookings.checkedInAt,
      checkedInBy: bookings.checkedInBy,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      // Tour fields
      tourId: tours.id,
      tourName: tours.name,
      tourDescription: tours.description,
      tourPrice: tours.price,
      tourDuration: tours.duration,
      tourCapacity: tours.capacity,
      tourStatus: tours.status,
      tourLocation: tours.location,
      // TimeSlot fields
      timeSlotId: timeSlots.id,
      timeSlotStartTime: timeSlots.startTime,
      timeSlotEndTime: timeSlots.endTime,
      timeSlotAvailableSpots: timeSlots.availableSpots,
      timeSlotBookedSpots: timeSlots.bookedSpots,
      timeSlotStatus: timeSlots.status
    })
    .from(bookings)
    .innerJoin(tours, eq(bookings.tourId, tours.id))
    .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
    .where(and(
      eq(bookings.status, 'confirmed'),
      gte(timeSlots.startTime, startOfTomorrow),
      lte(timeSlots.startTime, endOfTomorrow)
    ));

    console.log(`📅 Found ${bookingData.length} confirmed bookings for tomorrow (${tomorrow.toDateString()})`);

    let sent = 0;
    const errors: string[] = [];

    // Send reminder email for each booking
    for (const data of bookingData) {
      try {
        // Format data to match the expected interface
        const booking = {
          id: data.id,
          tourId: data.tourId,
          timeSlotId: data.timeSlotId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone || undefined,
          participants: data.participants,
          totalAmount: data.totalAmount,
          status: data.status,
          paymentStatus: data.paymentStatus,
          bookingReference: data.bookingReference,
          specialRequests: data.specialRequests || undefined,
          ticketQRCode: data.ticketQRCode || undefined,
          attendanceStatus: data.attendanceStatus || undefined,
          checkedInAt: data.checkedInAt?.toISOString(),
          checkedInBy: data.checkedInBy || undefined,
          createdAt: data.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toISOString() || new Date().toISOString(),
        };

        const tour = {
          id: data.tourId,
          name: data.tourName,
          description: data.tourDescription,
          price: data.tourPrice,
          duration: data.tourDuration,
          capacity: data.tourCapacity,
          status: data.tourStatus,
          location: data.tourLocation || undefined,
          userId: '', // Not needed for email functionality
          createdAt: new Date().toISOString(), // Not needed for email functionality
          updatedAt: new Date().toISOString(), // Not needed for email functionality
        };

        const timeSlot = {
          id: data.timeSlotId,
          tourId: data.tourId,
          startTime: data.timeSlotStartTime?.toISOString() || new Date().toISOString(),
          endTime: data.timeSlotEndTime?.toISOString() || new Date().toISOString(),
          availableSpots: data.timeSlotAvailableSpots,
          bookedSpots: data.timeSlotBookedSpots,
          status: data.timeSlotStatus,
          isRecurring: false,
          recurringPattern: null,
          recurringEnd: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const emailResult = await sendBookingEmail('reminder', {
          booking,
          tour,
          timeSlot
        });

        if (emailResult.success) {
          sent++;
          console.log(`✅ Reminder sent to ${booking.customerEmail} for booking ${booking.bookingReference}`);
        } else {
          errors.push(`Booking ${booking.bookingReference}: ${emailResult.error}`);
          console.error(`❌ Failed to send reminder for booking ${booking.bookingReference}:`, emailResult.error);
        }
        
        // Also send WhatsApp reminder if customer has phone number
        if (data.customerPhone) {
          try {
            const whatsappResponse = await fetch(`${new URL(request.url).origin}/api/send-whatsapp-notification`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: data.id,
                notificationType: 'booking_reminder'
              })
            });
            
            if (whatsappResponse.ok) {
              console.log(`📱 WhatsApp reminder queued for ${data.customerPhone}`);
            }
          } catch (whatsappError) {
            console.warn('Failed to send WhatsApp reminder:', whatsappError);
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Booking ${data.bookingReference}: ${errorMsg}`);
        console.error(`❌ Error processing booking ${data.bookingReference}:`, error);
      }
    }

    const result = {
      success: true,
      found: bookingData.length,
      sent,
      errors: errors.length > 0 ? errors : undefined,
      message: `Processed ${bookingData.length} bookings, sent ${sent} reminder emails`,
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
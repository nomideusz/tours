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
          tour: data.tourId,
          timeSlot: data.timeSlotId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone || undefined,
          participants: data.participants,
          totalAmount: parseFloat(data.totalAmount),
          status: data.status,
          paymentStatus: data.paymentStatus,
          bookingReference: data.bookingReference,
          specialRequests: data.specialRequests || undefined,
          ticketQRCode: data.ticketQRCode || undefined,
          attendanceStatus: data.attendanceStatus || undefined,
          checkedInAt: data.checkedInAt?.toISOString(),
          checkedInBy: data.checkedInBy || undefined,
          created: data.createdAt?.toISOString() || new Date().toISOString(),
          updated: data.updatedAt?.toISOString() || new Date().toISOString(),
        };

        const tour = {
          id: data.tourId,
          name: data.tourName,
          description: data.tourDescription,
          price: parseFloat(data.tourPrice),
          duration: data.tourDuration,
          capacity: data.tourCapacity,
          status: data.tourStatus,
          location: data.tourLocation || undefined,
          user: '', // Not needed for email functionality
          created: '', // Not needed for email functionality
          updated: '', // Not needed for email functionality
        };

        const timeSlot = {
          id: data.timeSlotId,
          tour: data.tourId,
          startTime: data.timeSlotStartTime?.toISOString() || new Date().toISOString(),
          endTime: data.timeSlotEndTime?.toISOString() || new Date().toISOString(),
          availableSpots: data.timeSlotAvailableSpots,
          bookedSpots: data.timeSlotBookedSpots,
          status: data.timeSlotStatus,
          isRecurring: false, // Not needed for email functionality
          created: '', // Not needed for email functionality
          updated: '', // Not needed for email functionality
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
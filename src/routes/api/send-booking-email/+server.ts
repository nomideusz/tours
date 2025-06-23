import { json, type RequestHandler } from '@sveltejs/kit';
import { sendBookingEmail, type BookingEmailType } from '$lib/email.server.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { bookingId, emailType } = await request.json();

    if (!bookingId || !emailType) {
      return json({ error: 'bookingId and emailType are required' }, { status: 400 });
    }

    // Validate email type
    const validTypes: BookingEmailType[] = ['confirmation', 'payment', 'reminder', 'cancelled', 'qr-ticket'];
    if (!validTypes.includes(emailType as BookingEmailType)) {
      return json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Fetch booking data with tour and time slot information
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
    .where(eq(bookings.id, bookingId))
    .limit(1);

    if (bookingData.length === 0) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }

    const data = bookingData[0];

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

    // Send the email
    const emailResult = await sendBookingEmail(emailType as BookingEmailType, {
      booking,
      tour,
      timeSlot
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
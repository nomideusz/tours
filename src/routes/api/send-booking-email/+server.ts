import { json, type RequestHandler } from '@sveltejs/kit';
import { sendBookingEmail, type BookingEmailType } from '$lib/email/sender.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import type { User } from '$lib/types.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { bookingId, emailType, cancellationReason, customMessage, isBulkCancellation } = body;

    if (!bookingId || !emailType) {
      return json({ error: 'bookingId and emailType are required' }, { status: 400 });
    }

    // Validate email type
    const validTypes: BookingEmailType[] = ['confirmation', 'payment', 'reminder', 'cancelled', 'qr-ticket'];
    if (!validTypes.includes(emailType as BookingEmailType)) {
      return json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Fetch booking data with tour, time slot, and tour owner information
    const bookingData = await db.select({
      bookingId: bookings.id,
      bookingTourId: bookings.tourId,
      bookingTimeSlotId: bookings.timeSlotId,
      bookingCustomerName: bookings.customerName,
      bookingCustomerEmail: bookings.customerEmail,
      bookingCustomerPhone: bookings.customerPhone,
      bookingParticipants: bookings.participants,
      bookingTotalAmount: bookings.totalAmount,
      bookingParticipantBreakdown: bookings.participantBreakdown,
      bookingStatus: bookings.status,
      bookingPaymentId: bookings.paymentId,
      bookingPaymentStatus: bookings.paymentStatus,
      bookingBookingReference: bookings.bookingReference,
      bookingSpecialRequests: bookings.specialRequests,
      bookingTicketQRCode: bookings.ticketQRCode,
      bookingAttendanceStatus: bookings.attendanceStatus,
      bookingCheckedInAt: bookings.checkedInAt,
      bookingCheckedInBy: bookings.checkedInBy,
      bookingCreatedAt: bookings.createdAt,
      bookingUpdatedAt: bookings.updatedAt,
      
      tourId: tours.id,
      tourName: tours.name,
      tourDescription: tours.description,
      tourPrice: tours.price,
      tourDuration: tours.duration,
      tourCapacity: tours.capacity,
      tourUserId: tours.userId,
      tourImages: tours.images,
      tourStatus: tours.status,
      tourCategory: tours.category,
      tourLocation: tours.location,
      tourIncludedItems: tours.includedItems,
      tourRequirements: tours.requirements,
      tourCancellationPolicy: tours.cancellationPolicy,
      tourEnablePricingTiers: tours.enablePricingTiers,
      tourPricingTiers: tours.pricingTiers,
      tourQrCode: tours.qrCode,
      tourCreatedAt: tours.createdAt,
      tourUpdatedAt: tours.updatedAt,
      
      timeSlotId: timeSlots.id,
      timeSlotTourId: timeSlots.tourId,
      timeSlotStartTime: timeSlots.startTime,
      timeSlotEndTime: timeSlots.endTime,
      timeSlotAvailableSpots: timeSlots.availableSpots,
      timeSlotBookedSpots: timeSlots.bookedSpots,
      timeSlotStatus: timeSlots.status,
      
      tourOwnerCurrency: users.currency
    })
    .from(bookings)
    .innerJoin(tours, eq(bookings.tourId, tours.id))
    .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
    .innerJoin(users, eq(tours.userId, users.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

    if (bookingData.length === 0) {
      return json({ error: 'Booking not found' }, { status: 404 });
    }

    const data = bookingData[0];

    // Format data to match the expected interface
    const booking = {
      id: data.bookingId,
      tourId: data.bookingTourId,
      timeSlotId: data.bookingTimeSlotId,
      customerName: data.bookingCustomerName,
      customerEmail: data.bookingCustomerEmail,
      customerPhone: data.bookingCustomerPhone || undefined,
      participants: data.bookingParticipants,
      totalAmount: data.bookingTotalAmount,
      status: data.bookingStatus,
      paymentStatus: data.bookingPaymentStatus,
      bookingReference: data.bookingBookingReference,
      specialRequests: data.bookingSpecialRequests || undefined,
      ticketQRCode: data.bookingTicketQRCode || undefined,
      attendanceStatus: data.bookingAttendanceStatus || undefined,
      checkedInAt: data.bookingCheckedInAt?.toISOString(),
      checkedInBy: data.bookingCheckedInBy || undefined,
      createdAt: data.bookingCreatedAt?.toISOString() || new Date().toISOString(),
      updatedAt: data.bookingUpdatedAt?.toISOString() || new Date().toISOString(),
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
      tourId: data.timeSlotTourId,
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

    // Also fetch tour owner data for cancellation emails
    const tourOwnerData = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      username: users.username,
      businessName: users.businessName,
      phone: users.phone,
      currency: users.currency
    })
    .from(users)
    .where(eq(users.id, data.tourUserId))
    .limit(1);

    const tourOwner = tourOwnerData.length > 0 ? {
      ...tourOwnerData[0],
      role: 'user' as const,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as User : undefined;

    // Send the email
    const emailResult = await sendBookingEmail(emailType as BookingEmailType, {
      booking,
      tour,
      timeSlot,
      tourOwner,
      tourOwnerCurrency: data.tourOwnerCurrency || 'EUR',
      cancellationReason,
      customMessage,
      isBulkCancellation
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
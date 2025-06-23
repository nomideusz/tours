import { json, type RequestHandler } from '@sveltejs/kit';
import { sendGuideNotificationEmail } from '$lib/email.server.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, timeSlots, users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
import { formatCurrency } from '$lib/utils/currency.js';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

// Helper function to format participant display for guide emails
function formatParticipantDisplayForGuide(participants: number, participantBreakdown: any): string {
  if (participantBreakdown && typeof participantBreakdown === 'object') {
    const breakdown = participantBreakdown as { adults: number; children: number };
    const parts = [];
    
    if (breakdown.adults > 0) {
      parts.push(`${breakdown.adults} adult${breakdown.adults === 1 ? '' : 's'}`);
    }
    
    if (breakdown.children > 0) {
      parts.push(`${breakdown.children} child${breakdown.children === 1 ? '' : 'ren'}`);
    }
    
    if (parts.length === 0) {
      return `${participants} ${participants === 1 ? 'person' : 'people'}`;
    }
    
    return `${parts.join(' + ')} (${participants} total)`;
  }
  
  // Fallback to simple participant count
  return `${participants} ${participants === 1 ? 'person' : 'people'}`;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return json({ error: 'bookingId is required' }, { status: 400 });
    }

    // Fetch booking data with tour, time slot, and guide information
    const bookingData = await db.select({
      // Booking fields
      id: bookings.id,
      customerName: bookings.customerName,
      customerEmail: bookings.customerEmail,
      customerPhone: bookings.customerPhone,
      participants: bookings.participants,
      participantBreakdown: bookings.participantBreakdown,
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
      tourUserId: tours.userId,
      // TimeSlot fields
      timeSlotId: timeSlots.id,
      timeSlotStartTime: timeSlots.startTime,
      timeSlotEndTime: timeSlots.endTime,
      timeSlotAvailableSpots: timeSlots.availableSpots,
      timeSlotBookedSpots: timeSlots.bookedSpots,
      timeSlotStatus: timeSlots.status,
      // Guide/User fields
      guideId: users.id,
      guideName: users.name,
      guideEmail: users.email,
      guideBusinessName: users.businessName,
      guideCurrency: users.currency
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

    // Format data to match the expected interfaces
    const booking = {
      id: data.id,
      tourId: data.tourId,
      timeSlotId: data.timeSlotId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone || undefined,
      participants: data.participants,
      participantBreakdown: data.participantBreakdown || undefined,
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
      userId: data.tourUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

    // Send the guide notification email
    const emailResult = await sendGuideNotificationEmail({
      booking,
      tour,
      timeSlot,
      guideEmail: data.guideEmail,
      guideName: data.guideName || data.guideBusinessName || undefined,
      guideCurrency: data.guideCurrency || 'EUR'
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send guide notification email');
    }

    console.log(`✅ Guide notification email sent successfully for booking ${bookingId} to ${data.guideEmail}`);

    return json({
      success: true,
      message: 'Guide notification email sent successfully',
      messageId: emailResult.messageId,
      recipient: data.guideEmail,
      guideName: data.guideName || data.guideBusinessName
    });

  } catch (error) {
    console.error('Error in send-guide-booking-email API:', error);
    return json({
      error: 'Failed to send guide notification email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 
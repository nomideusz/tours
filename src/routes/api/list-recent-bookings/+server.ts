import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db } from '$lib/db/connection.js';
import { bookings, tours, payments } from '$lib/db/schema/index.js';
import { eq, desc, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
  try {
    // Get recent bookings with tour information
    const recentBookings = await db.select({
      id: bookings.id,
      customerName: bookings.customerName,
      customerEmail: bookings.customerEmail,
      bookingReference: bookings.bookingReference,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      ticketQRCode: bookings.ticketQRCode,
      attendanceStatus: bookings.attendanceStatus,
      createdAt: bookings.createdAt,
      paymentId: bookings.paymentId,
      tourName: tours.name
    })
    .from(bookings)
    .innerJoin(tours, eq(bookings.tourId, tours.id))
    .orderBy(desc(bookings.createdAt))
    .limit(10);
    
    // Get payment records for these bookings
    const bookingIds = recentBookings.map(b => b.id);
    const paymentsData = bookingIds.length > 0 
      ? await db.select({
          bookingId: payments.bookingId,
          stripePaymentIntentId: payments.stripePaymentIntentId,
          status: payments.status
        })
        .from(payments)
        .where(inArray(payments.bookingId, bookingIds))
      : [];
    
    // Map bookings with their payment info
    const bookingsWithPayments = recentBookings.map(booking => {
      const payment = paymentsData.find(p => p.bookingId === booking.id);
      return {
        id: booking.id,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        bookingReference: booking.bookingReference,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        ticketQRCode: booking.ticketQRCode || 'NOT_GENERATED',
        attendanceStatus: booking.attendanceStatus || 'NOT_SET',
        created: booking.createdAt,
        paymentId: payment?.stripePaymentIntentId || booking.paymentId || 'NO_PAYMENT',
        paymentRecordStatus: payment?.status || 'NO_PAYMENT_RECORD',
        tourName: booking.tourName || 'Unknown'
      };
    });
    
    return json({
      success: true,
      count: bookingsWithPayments.length,
      bookings: bookingsWithPayments
    });
  } catch (error) {
    console.error('Error fetching recent bookings:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
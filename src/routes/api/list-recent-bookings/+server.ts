import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createAuthenticatedPB } from '$lib/admin-auth.server.js';

export const GET: RequestHandler = async () => {
  try {
    const pb = await createAuthenticatedPB();
    
    // Get recent bookings
    const bookings = await pb.collection('bookings').getList(1, 10, {
      sort: '-created',
      expand: 'tour,timeSlot'
    });
    
    // Get payment records for these bookings
    const bookingIds = bookings.items.map(b => b.id);
    const payments = await pb.collection('payments').getFullList({
      filter: bookingIds.map(id => `booking = "${id}"`).join(' || '),
      expand: 'booking'
    });
    
    // Map bookings with their payment info
    const bookingsWithPayments = bookings.items.map(booking => {
      const payment = payments.find(p => p.booking === booking.id);
      return {
        id: booking.id,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        bookingReference: booking.bookingReference,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        ticketQRCode: booking.ticketQRCode || 'NOT_GENERATED',
        attendanceStatus: booking.attendanceStatus || 'NOT_SET',
        created: booking.created,
        paymentId: payment?.stripePaymentIntentId || 'NO_PAYMENT',
        paymentRecordStatus: payment?.status || 'NO_PAYMENT_RECORD',
        tourName: booking.expand?.tour?.name || 'Unknown'
      };
    });
    
    return json({
      success: true,
      count: bookingsWithPayments.length,
      bookings: bookingsWithPayments
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
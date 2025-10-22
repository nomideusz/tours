import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { bookings, tours } from '$lib/db/schema/index.js';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all bookings for user's tours with transfer information
    const userBookings = await db
      .select({
        bookingId: bookings.id,
        bookingReference: bookings.bookingReference,
        bookingStatus: bookings.status,
        paymentStatus: bookings.paymentStatus,
        totalAmount: bookings.totalAmount,
        transferId: bookings.transferId,
        transferStatus: bookings.transferStatus,
        transferScheduledFor: bookings.transferScheduledFor,
        transferProcessedAt: bookings.transferProcessedAt,
        transferNotes: bookings.transferNotes,
        tourId: tours.id,
        tourName: tours.name
      })
      .from(bookings)
      .innerJoin(tours, eq(bookings.tourId, tours.id))
      .where(and(
        eq(tours.userId, locals.user.id),
        eq(bookings.paymentStatus, 'paid') // Only paid bookings
      ));

    // Categorize transfers
    const pending = userBookings
      .filter(b => !b.transferId && b.transferScheduledFor)
      .map(b => ({
        bookingId: b.bookingId,
        bookingReference: b.bookingReference,
        totalAmount: b.totalAmount,
        transferScheduledFor: b.transferScheduledFor?.toISOString(),
        transferStatus: b.transferStatus,
        tourId: b.tourId,
        tourName: b.tourName
      }))
      .sort((a, b) => 
        new Date(a.transferScheduledFor || 0).getTime() - new Date(b.transferScheduledFor || 0).getTime()
      );

    const completed = userBookings
      .filter(b => b.transferId && b.transferStatus === 'completed')
      .map(b => ({
        bookingId: b.bookingId,
        bookingReference: b.bookingReference,
        totalAmount: b.totalAmount,
        transferId: b.transferId,
        transferProcessedAt: b.transferProcessedAt?.toISOString(),
        tourId: b.tourId,
        tourName: b.tourName
      }))
      .sort((a, b) => 
        new Date(b.transferProcessedAt || 0).getTime() - new Date(a.transferProcessedAt || 0).getTime()
      );

    const failed = userBookings
      .filter(b => b.transferStatus === 'failed')
      .map(b => ({
        bookingId: b.bookingId,
        bookingReference: b.bookingReference,
        totalAmount: b.totalAmount,
        transferNotes: b.transferNotes,
        tourId: b.tourId,
        tourName: b.tourName
      }));

    // Calculate stats
    const pendingAmount = pending.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
    const completedAmount = completed.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);

    return json({
      pending,
      completed,
      failed,
      stats: {
        pendingAmount,
        completedAmount,
        pendingCount: pending.length,
        completedCount: completed.length,
        failedCount: failed.length
      }
    });

  } catch (error) {
    console.error('Error fetching transfers:', error);
    return json({
      error: 'Failed to fetch transfers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};


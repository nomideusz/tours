import type { PageServerLoad, Actions } from './$types.js';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, bookings, qrCodes } from '$lib/db/schema/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ locals, url }) => {
  // Check if user is authenticated
  if (!locals.user) {
    const redirectTo = url.pathname + url.search;
    throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  try {
    const userId = locals.user.id;
    
    // Fetch user's tours
    const userTours = await db.select()
      .from(tours)
      .where(eq(tours.userId, userId))
      .orderBy(desc(tours.updatedAt));
    
    // Get aggregated booking statistics efficiently
    const bookingStats = await db.select({
      totalBookings: sql<number>`count(*)::int`,
      confirmedBookings: sql<number>`count(*) filter (where ${bookings.status} = 'confirmed' and ${bookings.paymentStatus} = 'paid')::int`,
      totalRevenue: sql<number>`coalesce(sum(case when ${bookings.status} = 'confirmed' and ${bookings.paymentStatus} = 'paid' then ${bookings.totalAmount}::numeric else 0 end), 0)`,
      totalParticipants: sql<number>`coalesce(sum(case when ${bookings.status} = 'confirmed' and ${bookings.paymentStatus} = 'paid' then ${bookings.participants} else 0 end), 0)::int`,
      todayBookings: sql<number>`count(*) filter (where date(${bookings.createdAt}) = current_date and (${bookings.status} = 'confirmed' or ${bookings.status} = 'pending'))::int`,
      weekBookings: sql<number>`count(*) filter (where ${bookings.createdAt} >= current_date - interval '7 days' and (${bookings.status} = 'confirmed' or ${bookings.status} = 'pending'))::int`,
      monthRevenue: sql<number>`coalesce(sum(case when ${bookings.createdAt} >= current_date - interval '30 days' and ${bookings.status} = 'confirmed' and ${bookings.paymentStatus} = 'paid' then ${bookings.totalAmount}::numeric else 0 end), 0)`
    })
    .from(bookings)
    .innerJoin(tours, eq(bookings.tourId, tours.id))
    .where(eq(tours.userId, userId));

    const stats = {
      total: userTours.length,
      active: userTours.filter(t => t.status === 'active').length,
      draft: userTours.filter(t => t.status === 'draft').length,
      totalRevenue: bookingStats[0]?.totalRevenue || 0,
      todayBookings: bookingStats[0]?.todayBookings || 0,
      weekBookings: bookingStats[0]?.weekBookings || 0,
      monthRevenue: bookingStats[0]?.monthRevenue || 0,
      totalBookings: bookingStats[0]?.totalBookings || 0,
      confirmedBookings: bookingStats[0]?.confirmedBookings || 0,
      totalParticipants: bookingStats[0]?.totalParticipants || 0
    };

    return {
      user: locals.user,
      tours: userTours.map(tour => ({
        ...tour,
        price: parseFloat(tour.price),
        created: tour.createdAt.toISOString(),
        updated: tour.updatedAt.toISOString()
      })),
      stats
    };
  } catch (err) {
    console.error('Error loading tours data:', err);
    
    return {
      user: locals.user,
      tours: [],
      stats: {
        total: 0,
        active: 0,
        draft: 0,
        totalRevenue: 0,
        todayBookings: 0,
        weekBookings: 0,
        monthRevenue: 0,
        totalBookings: 0,
        confirmedBookings: 0,
        totalParticipants: 0
      }
    };
  }
};

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const tourId = formData.get('tourId') as string;

    if (!tourId) {
      return fail(400, { error: 'Tour ID is required' });
    }

    try {
      // Verify ownership before deletion
      const tourData = await db
        .select({ id: tours.id })
        .from(tours)
        .where(and(
          eq(tours.id, tourId),
          eq(tours.userId, locals.user.id)
        ))
        .limit(1);
      
      if (tourData.length === 0) {
        return fail(404, { error: 'Tour not found' });
      }

      // Delete tour (cascade will handle related records)
      await db
        .delete(tours)
        .where(and(
          eq(tours.id, tourId),
          eq(tours.userId, locals.user.id)
        ));

      return { success: true };
    } catch (err) {
      console.error('Error deleting tour:', err);
      return fail(500, { error: 'Failed to delete tour' });
    }
  },

  duplicate: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const tourId = formData.get('tourId') as string;

    if (!tourId) {
      return fail(400, { error: 'Tour ID is required' });
    }

    try {
      // Get original tour
      const originalTour = await db
        .select()
        .from(tours)
        .where(and(
          eq(tours.id, tourId),
          eq(tours.userId, locals.user.id)
        ))
        .limit(1);
      
      if (originalTour.length === 0) {
        return fail(404, { error: 'Tour not found' });
      }

      const tour = originalTour[0];
      const newTourId = createId();

      // Create duplicate tour
      await db.insert(tours).values({
        id: newTourId,
        userId: locals.user.id,
        name: `${tour.name} (Copy)`,
        description: tour.description,
        price: tour.price,
        duration: tour.duration,
        capacity: tour.capacity,
        status: 'draft',
        category: tour.category,
        location: tour.location,
        includedItems: tour.includedItems,
        requirements: tour.requirements,
        cancellationPolicy: tour.cancellationPolicy,
        images: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create a default QR code for the duplicated tour
      await db.insert(qrCodes).values({
        id: createId(),
        tourId: newTourId,
        userId: locals.user.id,
        name: `${tour.name} (Copy) - Main QR Code`,
        category: 'digital',
        code: `${tour.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'TUR'}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        scans: 0,
        conversions: 0,
        isActive: true,
        customization: {
          color: '#000000',
          backgroundColor: '#FFFFFF',
          style: 'square'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return { success: true, tourId: newTourId };
    } catch (err) {
      console.error('Error duplicating tour:', err);
      return fail(500, { error: 'Failed to duplicate tour' });
    }
  }
}; 
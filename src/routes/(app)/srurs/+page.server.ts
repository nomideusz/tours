import type { PageServerLoad, Actions } from './$types.js';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, qrCodes } from '$lib/db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { getToursSpecificStats, type SharedStats } from '$lib/utils/shared-stats.js';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
  // Get parent layout data first
  const parentData = await parent();
  
  // Check if user is authenticated
  if (!locals.user) {
    const redirectTo = url.pathname + url.search;
    throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  console.log('Tours page load started for user:', locals.user.id);

  try {
    const userId = locals.user.id;
    
    // Get shared stats from parent or create defaults
    const sharedStats: SharedStats = (parentData as any).sharedStats || {
      totalTours: 0,
      activeTours: 0,
      monthlyTours: 0
    };
    
    // Fetch user's tours (this is the main data for this page)
    let userTours: typeof tours.$inferSelect[] = [];
    try {
      console.log('Fetching tours for user:', userId);
      userTours = await db.select()
        .from(tours)
        .where(eq(tours.userId, userId))
        .orderBy(desc(tours.updatedAt));
      console.log(`Found ${userTours.length} tours for user ${userId}`);
    } catch (toursError) {
      console.error('Error fetching user tours:', toursError);
      userTours = [];
    }
    
    // Get tours-specific stats that extend shared stats
    const toursStats = await getToursSpecificStats(userId, sharedStats);
    
    // Convert stats to match the expected format in the component
    const stats = {
      total: toursStats.totalTours,
      active: toursStats.activeTours,
      draft: toursStats.draftTours,
      totalRevenue: toursStats.totalRevenue,
      todayBookings: toursStats.todayBookings,
      weekBookings: toursStats.weekBookings,
      monthRevenue: toursStats.monthRevenue,
      totalBookings: toursStats.totalBookings,
      confirmedBookings: toursStats.confirmedBookings,
      totalParticipants: toursStats.totalParticipants
    };

    console.log('Tours page load completed successfully');

    return {
      ...parentData,
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
    
    // Return fallback data with shared stats
    const fallbackSharedStats: SharedStats = (parentData as any).sharedStats || {
      totalTours: 0,
      activeTours: 0,
      monthlyTours: 0
    };
    
    return {
      ...parentData,
      tours: [],
      stats: {
        total: fallbackSharedStats.totalTours,
        active: fallbackSharedStats.activeTours,
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
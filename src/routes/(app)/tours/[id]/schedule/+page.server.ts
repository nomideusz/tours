import type { PageServerLoad, Actions } from './$types.js';
import { redirect, error, fail } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, gte, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ locals, url, params }) => {
  // Check if user is authenticated
  if (!locals.user) {
    console.log('Tour schedule page: User not authenticated, redirecting to login');
    // Store the current URL to redirect back after login
    const redirectTo = url.pathname + url.search;
    throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  // Validate that tour ID is provided
  if (!params.id) {
    throw error(400, 'Tour ID is required');
  }

  try {
    // Load tour data from Drizzle
    const tourResults = await db
      .select()
      .from(tours)
      .where(and(
        eq(tours.id, params.id),
        eq(tours.userId, locals.user.id)
      ))
      .limit(1);

    if (tourResults.length === 0) {
      throw error(404, 'Tour not found');
    }

    const tour = tourResults[0];

    // Load time slots for this tour
    const timeSlotsData = await db
      .select()
      .from(timeSlots)
      .where(eq(timeSlots.tourId, params.id))
      .orderBy(desc(timeSlots.startTime));

    // User is authenticated, return user data, tour ID, and tour data
    return {
      user: locals.user,
      isAuthenticated: true,
      tourId: params.id,
      tour: {
        id: tour.id,
        name: tour.name,
        description: tour.description,
        price: parseFloat(tour.price),
        duration: tour.duration,
        capacity: tour.capacity,
        status: tour.status,
        category: tour.category,
        location: tour.location,
        includedItems: tour.includedItems,
        requirements: tour.requirements,
        cancellationPolicy: tour.cancellationPolicy,
        images: tour.images,
        createdAt: tour.createdAt,
        updatedAt: tour.updatedAt
      },
      timeSlots: timeSlotsData.map(slot => ({
        id: slot.id,
        tourId: slot.tourId,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        availableSpots: slot.availableSpots,
        bookedSpots: slot.bookedSpots,
        status: slot.status,
        isRecurring: slot.isRecurring || false,
        recurringPattern: slot.recurringPattern,
        recurringEnd: slot.recurringEnd?.toISOString() || null,
        createdAt: slot.createdAt.toISOString(),
        updatedAt: slot.updatedAt?.toISOString() || null
      }))
    };
  } catch (err) {
    console.error('Error loading tour:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }
    throw error(500, 'Failed to load tour');
  }
};

export const actions: Actions = {
  publishTour: async ({ params, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'Unauthorized' });
    }

    try {
      // Update tour status to active
      await db
        .update(tours)
        .set({ 
          status: 'active',
          updatedAt: new Date()
        })
        .where(and(
          eq(tours.id, params.id),
          eq(tours.userId, locals.user.id)
        ));

      return { success: 'Tour published successfully!' };
    } catch (err) {
      console.error('Error publishing tour:', err);
      return fail(500, { error: 'Failed to publish tour' });
    }
  },

  createSlot: async ({ request, params, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'Unauthorized' });
    }

    try {
      const formData = await request.formData();
      const startDate = formData.get('startDate') as string;
      const startTime = formData.get('startTime') as string;
      const endTime = formData.get('endTime') as string;
      const availableSpots = parseInt(formData.get('availableSpots') as string);
      const isRecurring = formData.get('isRecurring') === 'true';
      const recurringPattern = formData.get('recurringPattern') as 'daily' | 'weekly' | 'monthly';
      const recurringEnd = formData.get('recurringEnd') as string;

      if (!startDate || !startTime || !endTime || !availableSpots) {
        return fail(400, { error: 'Missing required fields' });
      }

      // Verify tour ownership
      const tourData = await db
        .select({ id: tours.id })
        .from(tours)
        .where(and(
          eq(tours.id, params.id),
          eq(tours.userId, locals.user.id)
        ))
        .limit(1);

      if (tourData.length === 0) {
        return fail(404, { error: 'Tour not found' });
      }

      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${startDate}T${endTime}`);

      if (isRecurring) {
        // Create recurring time slots
        const slotsToCreate = [];
        let currentDate = new Date(startDateTime);
        const recurringEndDate = recurringEnd ? new Date(recurringEnd) : null;
        const slotDuration = endDateTime.getTime() - startDateTime.getTime();
        
        // Set appropriate limits based on pattern
        const patternLimits = {
          daily: 365,    // 1 year of daily slots
          weekly: 52,    // 1 year of weekly slots  
          monthly: 24    // 2 years of monthly slots
        };
        const maxSlots = patternLimits[recurringPattern] || 52;
        
        let count = 0;
        while (count < maxSlots) {
          // Check if we've reached the end date
          if (recurringEndDate && currentDate > recurringEndDate) {
            break;
          }
          
          // Create time slot for current date
          const slotStart = new Date(currentDate);
          const slotEnd = new Date(currentDate.getTime() + slotDuration);
          
          slotsToCreate.push({
            id: createId(),
            tourId: params.id,
            startTime: slotStart,
            endTime: slotEnd,
            availableSpots: availableSpots,
            bookedSpots: 0,
            status: 'available' as const,
            isRecurring: false, // Individual slots are not marked as recurring
            recurringPattern: null,
            recurringEnd: null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Calculate next occurrence
          switch (recurringPattern) {
            case 'daily':
              currentDate.setDate(currentDate.getDate() + 1);
              break;
            case 'weekly':
              currentDate.setDate(currentDate.getDate() + 7);
              break;
            case 'monthly':
              currentDate.setMonth(currentDate.getMonth() + 1);
              break;
          }
          
          count++;
        }
        
        // Create all slots
        if (slotsToCreate.length > 0) {
          await db.insert(timeSlots).values(slotsToCreate);
        }
        
        return { success: `Created ${slotsToCreate.length} recurring time slots successfully!` };
      } else {
        // Create single time slot
        await db.insert(timeSlots).values({
          id: createId(),
          tourId: params.id,
          startTime: startDateTime,
          endTime: endDateTime,
          availableSpots: availableSpots,
          bookedSpots: 0,
          status: 'available',
          isRecurring: false,
          recurringPattern: null,
          recurringEnd: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        return { success: 'Time slot created successfully!' };
      }
    } catch (err) {
      console.error('Error creating time slot:', err);
      return fail(500, { error: 'Failed to create time slot' });
    }
  },

  updateSlot: async ({ request, params, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'Unauthorized' });
    }

    try {
      const formData = await request.formData();
      const slotId = formData.get('slotId') as string;
      const startDate = formData.get('startDate') as string;
      const startTime = formData.get('startTime') as string;
      const endTime = formData.get('endTime') as string;
      const availableSpots = parseInt(formData.get('availableSpots') as string);

      if (!slotId || !startDate || !startTime || !endTime || !availableSpots) {
        return fail(400, { error: 'Missing required fields' });
      }

      // Verify ownership through tour
      const slotData = await db
        .select({ id: timeSlots.id })
        .from(timeSlots)
        .innerJoin(tours, eq(timeSlots.tourId, tours.id))
        .where(and(
          eq(timeSlots.id, slotId),
          eq(tours.id, params.id),
          eq(tours.userId, locals.user.id)
        ))
        .limit(1);

      if (slotData.length === 0) {
        return fail(404, { error: 'Time slot not found' });
      }

      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${startDate}T${endTime}`);

      await db
        .update(timeSlots)
        .set({
          startTime: startDateTime,
          endTime: endDateTime,
          availableSpots: availableSpots,
          updatedAt: new Date()
        })
        .where(eq(timeSlots.id, slotId));

      return { success: 'Time slot updated successfully!' };
    } catch (err) {
      console.error('Error updating time slot:', err);
      return fail(500, { error: 'Failed to update time slot' });
    }
  },

  deleteSlot: async ({ request, params, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'Unauthorized' });
    }

    try {
      const formData = await request.formData();
      const slotId = formData.get('slotId') as string;

      if (!slotId) {
        return fail(400, { error: 'Time slot ID is required' });
      }

      // Verify ownership through tour
      const slotData = await db
        .select({ id: timeSlots.id })
        .from(timeSlots)
        .innerJoin(tours, eq(timeSlots.tourId, tours.id))
        .where(and(
          eq(timeSlots.id, slotId),
          eq(tours.id, params.id),
          eq(tours.userId, locals.user.id)
        ))
        .limit(1);

      if (slotData.length === 0) {
        return fail(404, { error: 'Time slot not found' });
      }

      await db
        .delete(timeSlots)
        .where(eq(timeSlots.id, slotId));

      return { success: 'Time slot deleted successfully!' };
    } catch (err) {
      console.error('Error deleting time slot:', err);
      return fail(500, { error: 'Failed to delete time slot' });
    }
  }
}; 
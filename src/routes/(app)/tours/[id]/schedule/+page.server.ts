import type { PageServerLoad } from './$types.js';
import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours } from '$lib/db/schema/index.js';
import { eq, and } from 'drizzle-orm';

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
      }
    };
  } catch (err) {
    console.error('Error loading tour:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }
    throw error(500, 'Failed to load tour');
  }
}; 
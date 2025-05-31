import type { PageServerLoad } from './$types.js';
import { redirect, error } from '@sveltejs/kit';

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

  // User is authenticated, return user data and tour ID
  return {
    user: locals.user,
    isAuthenticated: true,
    tourId: params.id
  };
}; 
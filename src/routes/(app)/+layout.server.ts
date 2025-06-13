import type { LayoutServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';
import { getSharedStats } from '$lib/utils/shared-stats.js';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Use locals directly since hooks.server.ts already processed auth
  const isAuthenticated = !!locals.user;
  
  // App layout only handles routes in the (app) group
  // Auth routes are now at root level and won't reach this layout
  
  // For app routes, require authentication
  if (!isAuthenticated) {
    console.log('App layout load: Unauthenticated user accessing protected route, redirecting to login');
    throw redirect(303, '/auth/login?redirect=' + encodeURIComponent(url.pathname));
  }
  
  // Return authenticated user data from locals
  let user = null;
  let isAdmin = false;
  let sharedStats = null;
  
  if (isAuthenticated && locals.user) {
    // Map user data to match the AuthUser interface from auth store
    const userData = locals.user;
    user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      username: userData.username,
      businessName: userData.businessName,
      role: userData.role,
      avatar: userData.avatar,
      phone: userData.phone,
      website: userData.website,
      description: userData.description,
      location: userData.location,
      emailVerified: userData.emailVerified,
      lastLogin: userData.lastLogin
    };
    
    // Pass the admin status to the client
    isAdmin = locals.isAdmin || false;
    
    // Stats moved to client-side TanStack Query to avoid 502 timeouts
    sharedStats = {
      totalTours: 0,
      activeTours: 0,
      monthlyTours: 0
    };
    
    console.log('App layout server sending authenticated user:', user.email);
  }
  
  return { 
    isAuthenticated,
    isAdmin,
    user,
    sharedStats
  };
}; 
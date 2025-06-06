import type { LayoutServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Use locals directly since hooks.server.ts already processed auth
  const isAuthenticated = !!locals.user;
  
  // App layout only handles routes in the (app) group
  // Auth routes are now in (public) group and won't reach this layout
  
  // For app routes, require authentication
  if (!isAuthenticated) {
    console.log('App layout load: Unauthenticated user accessing protected route, redirecting to login');
    throw redirect(303, '/auth/login?redirect=' + encodeURIComponent(url.pathname));
  }
  
  // Return authenticated user data from locals
  let user = null;
  let isAdmin = false;
  
  if (isAuthenticated && locals.user) {
    // Map user data to the expected format
    const userData = locals.user;
    user = {
      id: userData.id,
      email: userData.email,
      username: userData.username || userData.name || userData.email,
      avatarUrl: userData.avatarUrl,
      created: userData.created,
      updated: userData.updated
    };
    
    // Pass the admin status to the client
    isAdmin = locals.isAdmin;
    
    console.log('App layout server sending authenticated user:', user.email);
  }
  
  return { 
    isAuthenticated,
    isAdmin,
    user
  };
}; 
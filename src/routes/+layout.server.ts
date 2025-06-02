import type { LayoutServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Check if this is a public page
  // Note: /ticket/ is public for customers, but /checkin/ requires auth for guides  
  const isPublicPage = url.pathname.includes('/book/') || 
                      url.pathname.includes('/ticket/');
  
  // For public pages, don't process any auth data
  if (isPublicPage) {
    console.log('Layout server load: Public page, skipping auth processing');
    return { 
      isAuthenticated: false,
      isAdmin: false,
      user: null
    };
  }
  
  // Use locals directly since hooks.server.ts already processed auth
  const isAuthenticated = !!locals.user;
  
  // Define auth pages that should redirect authenticated users away
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthPage = authPages.some(page => url.pathname.startsWith(page));
  
  // Handle redirects based on auth state and page type
  if (isAuthenticated && isAuthPage) {
    // Redirect authenticated users away from auth pages
    console.log('App layout load: Authenticated user on auth page, redirecting to dashboard');
    throw redirect(303, '/');
  }
  
  // Note: We don't redirect unauthenticated users from non-auth pages
  // because the app layout serves both public (landing page) and private content
  // Individual protected routes should handle their own auth requirements
  
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
    
    console.log('Server sending authenticated user:', user.email);
  }
  
  return { 
    isAuthenticated,
    isAdmin,
    user
  };
}; 
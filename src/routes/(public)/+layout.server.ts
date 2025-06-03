import type { LayoutServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Use locals directly since hooks.server.ts already processed auth
  const isAuthenticated = !!locals.user;
  
  // Define auth pages that should redirect authenticated users away
  const authPages = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
  const isAuthPage = authPages.some(page => url.pathname.startsWith(page));
  
  // Handle redirects for authenticated users trying to access auth pages
  if (isAuthenticated && isAuthPage) {
    console.log('Public layout load: Authenticated user on auth page, redirecting to dashboard');
    throw redirect(303, '/tours');
  }
  
  // Public layout doesn't enforce authentication
  // Return minimal data for public pages
  return {
    isAuthenticated,
    user: isAuthenticated ? locals.user : null
  };
}; 
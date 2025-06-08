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
    throw redirect(303, '/dashboard');
  }

  // Public layout provides minimal data for auth and booking pages
  let user = null;
  if (locals.user) {
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
  }

  return {
    isAuthenticated,
    isAdmin: locals.isAdmin,
    user
  };
}; 
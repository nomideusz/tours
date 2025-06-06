import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Root layout exposes authentication state from Lucia (handled in hooks.server.ts)
  // This makes auth data available to all child layouts and pages
  console.log('Root layout server load for:', url.pathname, '- Auth:', !!locals.user);
  
  return {
    isAuthenticated: !!locals.user,
    user: locals.user ? {
      id: locals.user.id,
      email: locals.user.email,
      name: locals.user.name,
      businessName: locals.user.businessName,
      role: locals.user.role,
      avatar: locals.user.avatar,
      phone: locals.user.phone,
      website: locals.user.website,
      description: locals.user.description,
      location: locals.user.location,
      emailVerified: locals.user.emailVerified,
      lastLogin: locals.user.lastLogin
    } : null,
    isAdmin: locals.isAdmin,
    session: locals.session ? {
      id: locals.session.id,
      userId: locals.session.userId,
      expiresAt: locals.session.expiresAt
    } : null
  };
}; 
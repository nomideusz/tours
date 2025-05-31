import type { LayoutLoad } from './$types.js';
import { browser } from '$app/environment';
import { currentUser, pb } from '$lib/pocketbase.js';

export const load: LayoutLoad = async ({ data }) => {
  // Update the currentUser store with the user data from the server
  if (browser && data.user) {
    // Add required RecordModel properties to user object
    const userWithRequiredProps = {
      ...data.user,
      collectionId: 'users',
      collectionName: 'users',
      expand: {}
    };
    currentUser.set(userWithRequiredProps);
    
    // Sync client-side PocketBase auth store with server
    if (pb && data.user) {
      // Wait for PocketBase to initialize
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Always try to load auth from cookie and refresh for OAuth2 compatibility
      try {
        // Load auth state from cookie (important for OAuth2 flows)
        pb.authStore.loadFromCookie(document.cookie);
        
        // If we have a valid token or if server says user is authenticated, refresh
        if (pb.authStore.isValid || data.isAuthenticated) {
          await pb.collection('users').authRefresh();
          // Ensure currentUser store is updated with fresh data
          if (pb.authStore.record) {
            currentUser.set(pb.authStore.record);
          }
        }
      } catch (e) {
        console.warn('Auth refresh failed (this is normal for new OAuth2 sessions):', e);
        // For OAuth2 users, the auth might not be in cookie yet, so just use server data
        if (data.isAuthenticated) {
          currentUser.set(userWithRequiredProps);
        }
      }
    }
  }
  
  // Pass through all server data including isAuthenticated flag and isAdmin
  return {
    user: data.user,
    isAuthenticated: data.isAuthenticated,
    isAdmin: data.isAdmin
  };
}; 
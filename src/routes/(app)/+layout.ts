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
      // Only attempt to refresh if we have a token
      if (!pb.authStore.isValid) {
        try {
          // Attempt to load auth from cookie if available
          pb.authStore.loadFromCookie(document.cookie);
          if (pb.authStore.isValid) {
            await pb.collection('users').authRefresh();
          }
        } catch (e) {
          console.error('Failed to refresh auth state:', e);
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
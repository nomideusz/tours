import { pb, currentUser } from './pocketbase.js';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';

// OAuth2 provider types
export type OAuth2Provider = 'google' | 'github' | 'microsoft' | 'discord' | 'twitter' | 'facebook' | 'apple';

// OAuth2 provider configurations
export const oauth2Providers = {
    google: {
        name: 'Google',
        icon: '🔍', // You can replace with actual icons
        color: 'bg-red-500 hover:bg-red-600'
    },
    github: {
        name: 'GitHub',
        icon: '🐙',
        color: 'bg-gray-800 hover:bg-gray-900'
    },
    microsoft: {
        name: 'Microsoft',
        icon: '🪟',
        color: 'bg-blue-500 hover:bg-blue-600'
    },
    discord: {
        name: 'Discord',
        icon: '🎮',
        color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    twitter: {
        name: 'Twitter',
        icon: '🐦',
        color: 'bg-sky-500 hover:bg-sky-600'
    },
    facebook: {
        name: 'Facebook',
        icon: '📘',
        color: 'bg-blue-600 hover:bg-blue-700'
    },
    apple: {
        name: 'Apple',
        icon: '🍎',
        color: 'bg-black hover:bg-gray-800'
    }
} as const;

// OAuth2 authentication function
export async function authenticateWithOAuth2(provider: OAuth2Provider): Promise<boolean> {
    if (!browser || !pb) {
        console.warn('OAuth2 authentication can only be used in the browser with PocketBase client');
        return false;
    }

    try {
        // Show loading state (you can emit an event or use a store for this)
        console.log(`Starting OAuth2 authentication with ${provider}...`);

        // Authenticate with the OAuth2 provider with explicit options
        const authData = await pb.collection('users').authWithOAuth2({ 
            provider,
            // Add options to handle popup closing
            createData: {},
            scopes: [],
            urlCallback: (url) => {
                // Custom popup handling
                const popup = window.open(
                    url,
                    'oauth2-popup',
                    'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
                );
                
                return new Promise((resolve, reject) => {
                    // Check if popup was blocked
                    if (!popup || popup.closed || typeof popup.closed == 'undefined') {
                        reject(new Error('Popup blocked. Please allow popups for this site.'));
                        return;
                    }

                    // Poll for popup closure or completion
                    const checkClosed = setInterval(() => {
                        try {
                            if (popup.closed) {
                                clearInterval(checkClosed);
                                // Don't reject here - the auth might have completed
                                // Let PocketBase handle the success/failure
                                resolve();
                            }
                        } catch (e) {
                            // Cross-origin access blocked, continue polling
                        }
                    }, 1000);

                    // Timeout after 5 minutes
                    setTimeout(() => {
                        clearInterval(checkClosed);
                        if (!popup.closed) {
                            popup.close();
                        }
                        reject(new Error('Authentication timed out'));
                    }, 5 * 60 * 1000);
                });
            }
        });

        if (authData && pb.authStore.isValid) {
            console.log('OAuth2 authentication successful:', {
                userId: pb.authStore.record?.id,
                email: pb.authStore.record?.email,
                provider: provider,
                fullUserRecord: pb.authStore.record
            });
            
            // Debug: OAuth2 authentication completed
            console.log('OAuth2 auth completed for:', pb.authStore.record?.email);
            
            // Force trigger auth store change event to sync frontend state
            // This ensures the auth state updates properly by refreshing the auth data
            await pb.collection('users').authRefresh();

            // Manually update the currentUser store to ensure frontend state sync
            currentUser.set(pb.authStore.record);

            // Make a simple API call to let the server-side know about the auth state
            // This should trigger the server to set the proper cookies
            try {
                console.log('Making server call to sync auth state...');
                const response = await fetch('/api/auth/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${pb.authStore.token}`
                    },
                    body: JSON.stringify({
                        token: pb.authStore.token,
                        userId: pb.authStore.record?.id
                    })
                });
                
                if (response.ok) {
                    console.log('Auth sync successful');
                } else {
                    console.log('Auth sync failed:', response.status);
                }
            } catch (error) {
                console.log('Auth sync error:', error);
            }

            // Small delay to ensure auth state propagates
            await new Promise(resolve => setTimeout(resolve, 200));

            // Use SvelteKit's navigation to go to tours page
            // This should trigger the layout to reload and sync auth state
            await goto('/tours', { replaceState: true, invalidateAll: true });
            return true;
        } else {
            throw new Error('Authentication failed - no valid auth data received');
        }
    } catch (error) {
        console.error(`OAuth2 authentication failed for ${provider}:`, error);
        
        // Handle specific error cases
        if (error instanceof Error) {
            if (error.message.includes('popup') || error.message.includes('Popup blocked')) {
                alert('Please allow popups for this site to use OAuth2 authentication.');
            } else if (error.message.includes('cancelled') || error.message.includes('timed out')) {
                console.log('OAuth2 authentication was cancelled or timed out');
            } else {
                alert(`Authentication failed: ${error.message}`);
            }
        } else {
            alert('Authentication failed. Please try again.');
        }
        
        return false;
    }
}

// Get available OAuth2 providers from PocketBase
export async function getAvailableOAuth2Providers(): Promise<OAuth2Provider[]> {
    try {
        // This would typically come from PocketBase's auth methods endpoint
        // For now, we'll return the commonly available ones
        // You can customize this based on what you've configured in PocketBase
        return ['google', 'github'];
    } catch (error) {
        console.error('Failed to fetch available OAuth2 providers:', error);
        return [];
    }
}

// Check if user is authenticated via OAuth2
export function isOAuth2User(): boolean {
    if (!browser || !pb || !pb.authStore.record) return false;
    
    // Check if user has OAuth2 data (this depends on your PocketBase schema)
    return !!(pb.authStore.record.avatar || pb.authStore.record.provider);
}

// Logout function that clears OAuth2 session
export async function logoutOAuth2(): Promise<void> {
    try {
        if (pb) {
            pb.authStore.clear();
        }
        await goto('/auth/login');
    } catch (error) {
        console.error('Logout failed:', error);
    }
} 
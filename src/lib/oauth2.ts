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

        // Authenticate with the OAuth2 provider
        const authData = await pb.collection('users').authWithOAuth2({ provider });

        if (authData && pb.authStore.isValid) {
            console.log('OAuth2 authentication successful:', {
                userId: pb.authStore.record?.id,
                email: pb.authStore.record?.email,
                provider: provider
            });

            // Force trigger auth store change event to sync frontend state
            // This ensures the auth state updates properly by refreshing the auth data
            await pb.collection('users').authRefresh();

            // Manually update the currentUser store to ensure frontend state sync
            currentUser.set(pb.authStore.record);

            // Small delay to ensure auth state propagates
            await new Promise(resolve => setTimeout(resolve, 100));

            // Redirect to dashboard or intended page
            await goto('/tours');
            return true;
        } else {
            throw new Error('Authentication failed - no valid auth data received');
        }
    } catch (error) {
        console.error(`OAuth2 authentication failed for ${provider}:`, error);
        
        // Handle specific error cases
        if (error instanceof Error) {
            if (error.message.includes('popup')) {
                alert('Please allow popups for this site to use OAuth2 authentication.');
            } else if (error.message.includes('cancelled')) {
                console.log('OAuth2 authentication was cancelled by user');
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
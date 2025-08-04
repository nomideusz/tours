import { browser } from '$app/environment';
import { goto } from '$app/navigation';

// OAuth2 provider types
export type OAuth2Provider = 'google' | 'github';

// OAuth2 provider information for UI display
export const oauth2ProviderInfo = {
    google: {
        name: 'Google',
        icon: '🔍',
        color: 'bg-red-500 hover:bg-red-600'
    },
    github: {
        name: 'GitHub',
        icon: '🐙', 
        color: 'bg-gray-800 hover:bg-gray-900'
    }
} as const;

// Authenticate with OAuth2 provider (Lucia-based)
export async function authenticateWithOAuth2(provider: OAuth2Provider, redirectTo?: string): Promise<boolean> {
    if (!browser || typeof window === 'undefined') {
        console.warn('OAuth2 authentication can only be used in the browser');
        return false;
    }

    try {
        console.log(`Starting OAuth2 authentication with ${provider}...`);
        
        // Build the OAuth2 authorization URL with optional redirect
        const authUrl = `/auth/oauth2/${provider}`;
        const params = new URLSearchParams();
        if (redirectTo) {
            params.set('redirectTo', redirectTo);
        }
        
        const fullAuthUrl = params.toString() ? `${authUrl}?${params}` : authUrl;
        
        // Navigate to the OAuth2 authorization endpoint
        // This will redirect to the provider's authorization server
        window.location.href = fullAuthUrl;
        
        return true;
    } catch (error) {
        console.error(`OAuth2 authentication failed for ${provider}:`, error);
        
        if (error instanceof Error) {
            alert(`Authentication failed: ${error.message}`);
        } else {
            alert('Authentication failed. Please try again.');
        }
        
        return false;
    }
}

// Get available OAuth2 providers
export async function getAvailableOAuth2Providers(): Promise<OAuth2Provider[]> {
    try {
        // OAuth2 disabled during beta program - users must apply for beta access
        // Return the providers we have configured
        // In a real app, you might want to check server configuration
        return []; // Disabled for beta program
    } catch (error) {
        console.error('Failed to fetch available OAuth2 providers:', error);
        return [];
    }
}

// Check if user is authenticated via OAuth2 (would need to be implemented based on user data)
export function isOAuth2User(user: any): boolean {
    // This would check if the user has OAuth accounts linked
    // For now, return false as we'd need to query the database
    return false;
} 
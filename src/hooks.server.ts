import PocketBase from 'pocketbase';
import type { Handle } from '@sveltejs/kit';

// Add type for locals
declare global {
    namespace App {
        interface Locals {
            pb: PocketBase;
            user: any; // Using any instead of Record as it's not directly exported
            isAdmin: boolean; // Add a property to easily check admin status
        }
    }
}

// Default fallback if env var isn't set
const POCKETBASE_URL = process.env.POCKETBASE_URL || 'https://z.xeon.pl';

export const handle: Handle = async ({ event, resolve }) => {
    // Initialize PocketBase with URL from environment variable
    event.locals.pb = new PocketBase(POCKETBASE_URL);
    event.locals.user = null;
    event.locals.isAdmin = false;

    // Load the auth store data from the request cookie string
    const cookies = event.request.headers.get('cookie') || '';
    event.locals.pb.authStore.loadFromCookie(cookies);
    
    // Log if we're processing a booking route for debugging
    if (event.url.pathname.includes('/book/')) {
        console.log('Server sending authenticated user:', event.locals.pb.authStore.record?.email || 'none');
    }
    
    // Debug logging for auth issues (remove in production)
    if (event.url.pathname.includes('/api/') || event.url.pathname.includes('/auth/')) {
        console.log('Server hooks - URL:', event.url.pathname, 'Auth valid:', event.locals.pb.authStore.isValid);
    }

    // If the user is authenticated, set the user in locals
    if (event.locals.pb.authStore.isValid) {
        try {
            // Skip auth refresh for public routes and certain paths
            const skipRefreshPaths = [
                '/api/health', 
                '/favicon.ico', 
                '/_app/',
                '/book/',  // Skip auth refresh for booking pages
                '/api/qr/',  // Skip for QR tracking APIs
                '/ticket/',  // Skip for ticket pages
                '/checkin/'  // Skip for checkin pages
            ];
            const shouldSkipRefresh = skipRefreshPaths.some(path => event.url.pathname.includes(path));
            
            // Only refresh auth for authenticated-only routes
            if (!shouldSkipRefresh && !event.url.pathname.includes('/api/')) {
                // Get an up-to-date auth store state by verifying and refreshing the loaded auth model
                // Add timeout to prevent hanging
                const authRefreshPromise = event.locals.pb.collection('users').authRefresh();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Auth refresh timeout')), 3000)
                );
                
                try {
                    await Promise.race([authRefreshPromise, timeoutPromise]);
                } catch (refreshErr) {
                    console.warn('Auth refresh failed or timed out:', refreshErr);
                    // Don't throw - just continue with existing auth data
                }
            }
            
            // Set the user data in locals for easy access in routes
            event.locals.user = event.locals.pb.authStore.record;
            
            // Check if user has admin role before any DB updates
            event.locals.isAdmin = 
                event.locals.user.role === 'admin' || 
                (event.locals.user.roles && event.locals.user.roles.includes('admin')) ||
                (event.locals.user.expand && event.locals.user.expand.roles && 
                 event.locals.user.expand.roles.some((r: any) => r.name === 'admin'));
            
            // Try to update last_login but don't fail if it doesn't work
            try {
                const currentTime = new Date().toISOString();
                if (!event.locals.user.last_login || 
                    new Date(event.locals.user.last_login).getTime() < Date.now() - 12 * 60 * 60 * 1000) {
                    await event.locals.pb.collection('users').update(event.locals.user.id, {
                        last_login: currentTime
                    });
                    event.locals.user.last_login = currentTime;
                }
            } catch (updateErr) {
                // Log but don't fail - last_login is not critical
                console.warn('Failed to update last_login:', updateErr);
            }
        } catch (err) {
            // Log the error for debugging in production
            console.error('Auth refresh failed:', err);
            // Clear the auth store on failed refresh
            event.locals.pb.authStore.clear();
        }
    }

    // Resolve the request
    const response = await resolve(event);

    // Only send auth cookie if we have valid auth data or need to clear it
    if (event.locals.pb.authStore.isValid || 
        (cookies && cookies.includes('pb_auth') && !event.locals.pb.authStore.isValid)) {
        const authCookie = event.locals.pb.authStore.exportToCookie({
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax', // Helps with CSRF protection
            httpOnly: false, // Allow client-side access for PocketBase auth store
            path: '/',       // Make cookie available on all routes
            maxAge: 7 * 24 * 60 * 60 // Cookie expires in 7 days
        });
        
        response.headers.append('set-cookie', authCookie);
    }

    return response;
} 
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
    
    // Debug logging for auth issues (remove in production)
    if (event.url.pathname.includes('/api/') || event.url.pathname.includes('/auth/')) {
        console.log('Server hooks - URL:', event.url.pathname, 'Auth valid:', event.locals.pb.authStore.isValid);
    }

    // If the user is authenticated, set the user in locals
    if (event.locals.pb.authStore.isValid) {
        try {
            // Get an up-to-date auth store state by verifying and refreshing the loaded auth model
            await event.locals.pb.collection('users').authRefresh();
            
            // Set the user data in locals for easy access in routes
            event.locals.user = event.locals.pb.authStore.record;
            
            // Update the last_login field to the current timestamp
            // Only update if this is a new login session (to avoid updating on every request)
            const currentTime = new Date().toISOString();
            if (!event.locals.user.last_login || 
                new Date(event.locals.user.last_login).getTime() < Date.now() - 12 * 60 * 60 * 1000) { // Only update if last login was > 12 hours ago
                await event.locals.pb.collection('users').update(event.locals.user.id, {
                    last_login: currentTime
                });
                // Update the local user record with the new last_login time
                event.locals.user.last_login = currentTime;
            }

            // Check if user has admin role
            // Adjust this check based on how roles are stored in your PocketBase setup
            event.locals.isAdmin = 
                event.locals.user.role === 'admin' || 
                (event.locals.user.roles && event.locals.user.roles.includes('admin')) ||
                (event.locals.user.expand && event.locals.user.expand.roles && 
                 event.locals.user.expand.roles.some((r: any) => r.name === 'admin'));
        } catch (err) {
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
            httpOnly: true,  // Prevents client-side JS from reading the cookie
            path: '/',       // Make cookie available on all routes
            maxAge: 7 * 24 * 60 * 60 // Cookie expires in 7 days
        });
        
        response.headers.append('set-cookie', authCookie);
    }

    return response;
} 
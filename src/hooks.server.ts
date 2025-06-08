import type { Handle } from '@sveltejs/kit';
import { lucia } from '$lib/auth/lucia.js';
import { initializeUploadDirs } from '$lib/utils/image-storage.js';

// Types are declared in src/app.d.ts

// Initialize upload directories on server startup
initializeUploadDirs().catch(console.error);

export const handle: Handle = async ({ event, resolve }) => {
    // Get session ID from cookies
    const sessionId = event.cookies.get(lucia.sessionCookieName);
    
    if (!sessionId) {
        event.locals.user = null;
        event.locals.session = null;
        event.locals.isAdmin = false;
        return resolve(event);
    }

    try {
        // Validate session with Lucia
        const { session, user } = await lucia.validateSession(sessionId);
        
        if (session && session.fresh) {
            // Session is fresh, create new session cookie
            const sessionCookie = lucia.createSessionCookie(session.id);
            event.cookies.set(sessionCookie.name, sessionCookie.value, {
                path: ".",
                ...sessionCookie.attributes
            });
        }
        
        if (!session) {
            // Session is invalid, clear cookie
            const sessionCookie = lucia.createBlankSessionCookie();
            event.cookies.set(sessionCookie.name, sessionCookie.value, {
                path: ".",
                ...sessionCookie.attributes
            });
        }
        
        // Set user and session in locals
        event.locals.user = user;
        event.locals.session = session;
        event.locals.isAdmin = user?.role === 'admin' || false;
        
        // Debug logging for auth status
        if (event.url.pathname.includes('/dashboard') || event.url.pathname.includes('/auth/')) {
            console.log('Server hooks - URL:', event.url.pathname, 'Auth valid:', !!user);
            if (user) {
                console.log('Authenticated user:', { id: user.id, email: user.email, role: user.role });
            }
        }
        
    } catch (error) {
        console.error('Lucia session validation error:', error);
        // Clear invalid session
        event.locals.user = null;
        event.locals.session = null;
        event.locals.isAdmin = false;
        
        const sessionCookie = lucia.createBlankSessionCookie();
        event.cookies.set(sessionCookie.name, sessionCookie.value, {
            path: ".",
            ...sessionCookie.attributes
        });
    }

    return resolve(event);
}; 
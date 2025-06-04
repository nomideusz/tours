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

// Disable auth refresh completely if this env var is set
const DISABLE_AUTH_REFRESH = process.env.DISABLE_AUTH_REFRESH === 'true';

export const handle: Handle = async ({ event, resolve }) => {
    try {
        // Initialize PocketBase with URL from environment variable
        event.locals.pb = new PocketBase(POCKETBASE_URL);
        
        // EMERGENCY: Set aggressive timeout for production
        if (process.env.NODE_ENV === 'production') {
            // Set very short timeout for all PocketBase requests in production
            event.locals.pb.beforeSend = function(url, options) {
                options.signal = AbortSignal.timeout(2000); // 2 second timeout
                return { url, options };
            };
        }
        
        event.locals.user = null;
        event.locals.isAdmin = false;
        
        // Test PocketBase connection for non-API routes during SSR (skip in production to avoid delays)
        const isSSRNavigation = event.request.headers.get('sec-fetch-dest') === 'document';
        const isProduction = process.env.NODE_ENV === 'production';
        if (isSSRNavigation && !event.url.pathname.includes('/api/') && !isProduction) {
            try {
                // Quick health check with timeout (development only)
                const healthPromise = event.locals.pb.health.check();
                const healthTimeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('PocketBase health check timeout')), 2000)
                );
                await Promise.race([healthPromise, healthTimeout]);
            } catch (healthErr) {
                console.error('PocketBase connection issue during SSR:', healthErr);
                // Continue but log the issue for debugging
            }
        }

        // Check if this is a public page
        // Note: /ticket/ is public for customers, but /checkin/ requires auth for guides
        const isPublicPage = event.url.pathname.includes('/book/') || 
                            event.url.pathname.includes('/ticket/');

        // Load the auth store data from the request cookie string ONLY for non-public pages
        if (!isPublicPage) {
            try {
                const cookies = event.request.headers.get('cookie') || '';
                event.locals.pb.authStore.loadFromCookie(cookies);
            } catch (cookieErr) {
                console.error('Failed to load auth from cookie:', cookieErr);
                // Clear auth store if cookie loading fails
                event.locals.pb.authStore.clear();
            }
        } else {
            // For public pages, explicitly clear auth to prevent any issues
            event.locals.pb.authStore.clear();
        }
        
        // Log if we're processing a booking route for debugging
        if (event.url.pathname.includes('/book/')) {
            console.log('Server sending authenticated user:', event.locals.pb.authStore.record?.email || 'none');
        }
        
        // Debug logging for auth issues (remove in production)
        if (event.url.pathname.includes('/api/') || event.url.pathname.includes('/auth/') || event.url.pathname.includes('/book/')) {
            console.log('Server hooks - URL:', event.url.pathname, 'Auth valid:', event.locals.pb.authStore.isValid);
        }
    } catch (initErr) {
        console.error('Error in hooks initialization:', initErr);
        // Continue with minimal setup
        event.locals.pb = new PocketBase(POCKETBASE_URL);
        event.locals.user = null;
        event.locals.isAdmin = false;
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
            
            // Skip auth refresh entirely in production SSR to prevent 502 errors
            // Check multiple ways to detect production environment
            const isProduction = process.env.NODE_ENV === 'production' || 
                                event.url.hostname !== 'localhost' && 
                                !event.url.hostname.includes('127.0.0.1') &&
                                !event.url.hostname.includes('192.168.');
            const isSSRRefresh = !event.request.headers.get('x-sveltekit-action');
            const shouldAvoidRefresh = isProduction && isSSRRefresh;
            
            // Debug logging for production auth refresh issues
            if (isProduction) {
                console.log('Production auth check:', {
                    url: event.url.pathname,
                    hostname: event.url.hostname,
                    NODE_ENV: process.env.NODE_ENV,
                    isSSRRefresh,
                    shouldAvoidRefresh,
                    skipRefreshPaths: shouldSkipRefresh
                });
            }
            
            // Only refresh auth for authenticated-only routes
            // Always skip auth refresh for SSR to prevent 502 errors
            // Also skip if DISABLE_AUTH_REFRESH env var is set
            if (!DISABLE_AUTH_REFRESH && !shouldSkipRefresh && !event.url.pathname.includes('/api/') && !isSSRRefresh) {
                // Wrap auth refresh in aggressive error handling
                try {
                    // Get an up-to-date auth store state by verifying and refreshing the loaded auth model
                    // Add very short timeout to prevent hanging
                    const authRefreshPromise = event.locals.pb.collection('users').authRefresh()
                        .catch((err: any) => {
                            // Suppress any auth refresh errors
                            console.warn('Auth refresh error suppressed:', err.message || err);
                            return null;
                        });
                    
                    const timeoutMs = 500; // Very short timeout
                    const timeoutPromise = new Promise((resolve) => 
                        setTimeout(() => resolve(null), timeoutMs)
                    );
                    
                    // Don't throw on timeout - just continue
                    await Promise.race([authRefreshPromise, timeoutPromise]);
                } catch (refreshErr) {
                    // Suppress all errors - auth refresh is not critical
                    console.warn('Auth refresh completely failed:', refreshErr);
                }
            } else {
                console.log('Skipping auth refresh for:', event.url.pathname, { isSSRRefresh, shouldSkipRefresh });
            }
            
            // Set the user data in locals for easy access in routes
            event.locals.user = event.locals.pb.authStore.record;
            
            // Check if user has admin role before any DB updates
            event.locals.isAdmin = 
                event.locals.user.role === 'admin' || 
                (event.locals.user.roles && event.locals.user.roles.includes('admin')) ||
                (event.locals.user.expand && event.locals.user.expand.roles && 
                 event.locals.user.expand.roles.some((r: any) => r.name === 'admin'));
            
            // EMERGENCY FIX: Completely skip last_login updates in production
            // This was causing additional database writes on every request
            if (!shouldAvoidRefresh && !isProduction) {
                try {
                    const currentTime = new Date().toISOString();
                    if (!event.locals.user.last_login || 
                        new Date(event.locals.user.last_login).getTime() < Date.now() - 12 * 60 * 60 * 1000) {
                        
                        // Add timeout for last_login update
                        const updatePromise = event.locals.pb.collection('users').update(event.locals.user.id, {
                            last_login: currentTime
                        });
                        const updateTimeout = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('last_login update timeout')), 1000)
                        );
                        
                        await Promise.race([updatePromise, updateTimeout]);
                        event.locals.user.last_login = currentTime;
                    }
                } catch (updateErr) {
                    // Log but don't fail - last_login is not critical
                    console.warn('Failed to update last_login:', updateErr);
                }
            }
        } catch (err) {
            // Log the error for debugging in production
            console.error('Auth processing failed:', err);
            console.error('URL:', event.url.pathname);
            console.error('User agent:', event.request.headers.get('user-agent'));
            
            // In production, try to gracefully handle auth failures instead of clearing auth
            const isProduction = process.env.NODE_ENV === 'production';
            if (isProduction) {
                console.warn('Production auth error - continuing with basic auth data to avoid 502');
                // Keep the user data from the auth store if it exists, but mark as potentially stale
                if (event.locals.pb.authStore.record) {
                    event.locals.user = event.locals.pb.authStore.record;
                }
            } else {
                // In development, clear the auth store on failed refresh
                event.locals.pb.authStore.clear();
            }
        }
    }

    // Resolve the request
    let response;
    try {
        response = await resolve(event);
    } catch (resolveErr) {
        console.error('Error during request resolution:', resolveErr);
        console.error('Failed URL:', event.url.pathname);
        console.error('Request method:', event.request.method);
        console.error('User agent:', event.request.headers.get('user-agent'));
        console.error('Auth valid:', event.locals.pb?.authStore?.isValid);
        console.error('Error details:', {
            message: resolveErr instanceof Error ? resolveErr.message : 'Unknown error',
            stack: resolveErr instanceof Error ? resolveErr.stack : 'No stack trace'
        });
        throw resolveErr; // Re-throw to maintain error behavior
    }

    try {
        // Check if this is a public page (re-check in case of redirects)
        // Note: /ticket/ is public for customers, but /checkin/ requires auth for guides
        const isPublicPage = event.url.pathname.includes('/book/') || 
                            event.url.pathname.includes('/ticket/');
        
        // Only handle cookies for non-public pages
        if (!isPublicPage) {
            // Get cookies for cookie handling
            const cookies = event.request.headers.get('cookie') || '';
            
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
        }
    } catch (cookieErr) {
        console.error('Error setting auth cookie:', cookieErr);
        // Don't fail the request if cookie setting fails
    }

    return response;
} 
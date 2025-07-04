import type { Handle } from '@sveltejs/kit';
import { lucia } from '$lib/auth/lucia.js';
import { initializeImageStorage } from '$lib/utils/image-storage.js';
import { db } from '$lib/db/connection.js';
import { promoCodes } from '$lib/db/schema/index.js';
import { count } from 'drizzle-orm';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';

// Types are declared in src/app.d.ts

// Initialize MinIO storage on server startup
initializeImageStorage().catch(console.error);

// One-time promo setup check
let promoSetupChecked = false;

async function ensurePromoCodesExist() {
  if (promoSetupChecked) return;
  
  try {
    // Check if promo codes exist
    const [{ count: promoCount }] = await db.select({ count: count() }).from(promoCodes);
    
    if (promoCount === 0) {
      console.log('🎁 No promo codes found, setting up default codes...');
      
      // Insert basic promo codes directly
      await db.insert(promoCodes).values([
        {
          code: 'FOUNDER',
          description: 'Founder member - 1 year free + 50% lifetime discount',
          type: 'early_access',
          discountPercentage: 50,
          freeMonths: 12,
          isLifetime: true,
          maxUses: 10,
          isActive: true
        },
        {
          code: 'PREMIUM50',
          description: '50% lifetime discount',
          type: 'lifetime_discount',
          discountPercentage: 50,
          isLifetime: true,
          isActive: true
        },
        {
          code: 'FREETRIAL6',
          description: '6 months free trial',
          type: 'free_period',
          freeMonths: 6,
          isActive: true
        }
      ]);
      
      console.log('✅ Basic promo codes created successfully!');
    }
    
    promoSetupChecked = true;
  } catch (error) {
    console.error('Error checking/creating promo codes:', error);
    promoSetupChecked = true; // Don't retry on every request
  }
}

// Auth handle
const authHandle: Handle = async ({ event, resolve }) => {
    // One-time promo setup check
    await ensurePromoCodesExist();
    
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
        
        // Check if user account is deleted
        if (user && user.deletedAt) {
            // User account is deleted, treat as logged out
            console.log('Deleted user attempting to access:', user.email);
            
            const sessionCookie = lucia.createBlankSessionCookie();
            event.cookies.set(sessionCookie.name, sessionCookie.value, {
                path: ".",
                ...sessionCookie.attributes
            });
            
            event.locals.user = null;
            event.locals.session = null;
            event.locals.isAdmin = false;
        } else {
            // Set user and session in locals
            event.locals.user = user;
            event.locals.session = session;
            event.locals.isAdmin = user?.role === 'admin' || false;
        }
        
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

// Dashboard redirect handle
const dashboardRedirectHandle: Handle = async ({ event, resolve }) => {
  // Auto-redirect authenticated users from root to dashboard
  if (event.url.pathname === '/' && event.locals.user && !event.url.searchParams.has('view')) {
    throw redirect(302, '/dashboard');
  }
  
  return resolve(event);
};

export const handle = sequence(authHandle, dashboardRedirectHandle); 
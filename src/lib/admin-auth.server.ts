/**
 * PocketBase Admin Authentication Service
 * 
 * Provides centralized admin authentication for server-side operations.
 * Requires environment variables:
 * - PB_ADMIN_EMAIL: Admin email for PocketBase
 * - PB_ADMIN_PASSWORD: Admin password for PocketBase
 * 
 * Used by:
 * - Stripe webhooks (for updating payment status and generating ticket QR codes)
 * - QR tracking APIs (for updating scan/conversion counts)
 */

import PocketBase from 'pocketbase';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const POCKETBASE_URL = publicEnv.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

/**
 * Creates and authenticates a PocketBase instance with admin credentials
 * @returns Promise<PocketBase> - Authenticated PocketBase instance
 * @throws Error if authentication fails
 */
export async function createAuthenticatedPB(): Promise<PocketBase> {
  const pb = new PocketBase(POCKETBASE_URL);
  
  const adminEmail = privateEnv.PB_ADMIN_EMAIL;
  const adminPassword = privateEnv.PB_ADMIN_PASSWORD;
  
  if (!adminEmail || !adminPassword) {
    throw new Error('PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD environment variables are required');
  }
  
  try {
    // Add timeout to prevent hanging in production
    const authPromise = pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Admin auth timeout')), 3000) // 3 second timeout
    );
    
    await Promise.race([authPromise, timeoutPromise]);
    return pb;
  } catch (error) {
    console.error('Failed to authenticate with PocketBase admin:', error);
    throw new Error('Failed to authenticate with PocketBase admin');
  }
}

/**
 * Attempts to authenticate with admin credentials, returns null if fails
 * Use this for non-critical operations where you want to gracefully handle auth failures
 */
export async function tryCreateAuthenticatedPB(): Promise<PocketBase | null> {
  try {
    return await createAuthenticatedPB();
  } catch (error) {
    console.warn('Admin authentication failed:', error);
    return null;
  }
}

/**
 * Check if admin credentials are configured
 */
export function hasAdminCredentials(): boolean {
  return !!(privateEnv.PB_ADMIN_EMAIL && privateEnv.PB_ADMIN_PASSWORD);
} 
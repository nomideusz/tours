import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

// Get PocketBase URL from environment variables
const POCKETBASE_URL = env.PUBLIC_POCKETBASE_URL || 'https://z.xeon.pl';

/**
 * Creates a clean PocketBase instance for public access
 * This instance doesn't load any auth state from cookies
 * Used for public pages like booking, tickets, etc.
 */
export function createPublicPB(): PocketBase {
  const pb = new PocketBase(POCKETBASE_URL);
  // Explicitly clear any auth state
  pb.authStore.clear();
  return pb;
} 
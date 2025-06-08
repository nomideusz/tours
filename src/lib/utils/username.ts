import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

/**
 * Generate a username from a name string
 * Converts to lowercase, removes special characters, and replaces spaces with nothing
 */
export function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .slice(0, 50); // Limit to 50 characters
}

/**
 * Check if a username is available in the database
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!username || username.length < 2) return false;
  
  const existingUser = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
    
  return existingUser.length === 0;
}

/**
 * Generate a unique username from a name
 * If the base username is taken, append numbers until we find an available one
 */
export async function generateUniqueUsername(name: string): Promise<string> {
  const baseUsername = generateUsername(name);
  
  if (await isUsernameAvailable(baseUsername)) {
    return baseUsername;
  }
  
  // Try with numbers appended
  for (let i = 1; i <= 999; i++) {
    const candidateUsername = `${baseUsername}${i}`;
    if (await isUsernameAvailable(candidateUsername)) {
      return candidateUsername;
    }
  }
  
  // Fallback: use timestamp
  return `${baseUsername}${Date.now()}`;
}

/**
 * Validate username format
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }
  
  if (username.length < 2) {
    return { valid: false, error: 'Username must be at least 2 characters' };
  }
  
  if (username.length > 50) {
    return { valid: false, error: 'Username must be 50 characters or less' };
  }
  
  if (!/^[a-z0-9]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain lowercase letters and numbers' };
  }
  
  // Reserved usernames to avoid conflicts with routes
  const reservedUsernames = [
    'api', 'auth', 'admin', 'dashboard', 'tours', 'book', 'checkin', 'ticket',
    'robots', 'sitemap', 'uploads', 'static', 'public', 'app', 'www', 'mail',
    'help', 'support', 'about', 'contact', 'privacy', 'terms', 'legal'
  ];
  
  if (reservedUsernames.includes(username)) {
    return { valid: false, error: 'This username is reserved' };
  }
  
  return { valid: true };
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
    
  return user.length > 0 ? user[0] : null;
} 
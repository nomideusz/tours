import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { dev } from '$app/environment';
import { db } from '$lib/db/connection.js';
import { users, sessions, type User as DatabaseUser } from '$lib/db/schema/index.js';

// Create Lucia adapter for Drizzle + PostgreSQL
const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

// Initialize Lucia
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: !dev // Only send over HTTPS in production
    }
  },
  getUserAttributes: (attributes) => {
    return {
      id: attributes.id,
      email: attributes.email,
      name: attributes.name,
      username: attributes.username,
      businessName: attributes.businessName,
      role: attributes.role,
      avatar: attributes.avatar,
      phone: attributes.phone,
      website: attributes.website,
      description: attributes.description,
      location: attributes.location,
      emailVerified: attributes.emailVerified,
      lastLogin: attributes.lastLogin
    };
  }
});

// Extend Lucia types
declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUser;
  }
}

// Password hashing utilities
import { hash, verify } from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return await hash(password);
}

export async function verifyPassword(hashedPassword: string, password: string): Promise<boolean> {
  return await verify(hashedPassword, password);
} 
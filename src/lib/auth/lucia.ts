import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { dev } from '$app/environment';
import { db } from '$lib/db/connection.js';
import { users, sessions } from '$lib/db/schema/index.js';

// Infer User type from the users table
type DatabaseUser = typeof users.$inferSelect;

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
      country: attributes.country,
      currency: attributes.currency,
      emailVerified: attributes.emailVerified,
      lastLogin: attributes.lastLogin,
      // Payment fields
      stripeAccountId: attributes.stripeAccountId,
      // Subscription fields
      subscriptionPlan: attributes.subscriptionPlan,
      subscriptionStatus: attributes.subscriptionStatus,
      subscriptionId: attributes.subscriptionId,
      subscriptionCurrentPeriodStart: attributes.subscriptionCurrentPeriodStart,
      subscriptionCurrentPeriodEnd: attributes.subscriptionCurrentPeriodEnd,
      subscriptionCancelAtPeriodEnd: attributes.subscriptionCancelAtPeriodEnd,
      monthlyBookingsUsed: attributes.monthlyBookingsUsed,
      monthlyBookingsResetAt: attributes.monthlyBookingsResetAt,
      // Promo code fields
      promoCodeUsed: attributes.promoCodeUsed,
      subscriptionDiscountPercentage: attributes.subscriptionDiscountPercentage,
      subscriptionFreeUntil: attributes.subscriptionFreeUntil,
      isLifetimeDiscount: attributes.isLifetimeDiscount,
      earlyAccessMember: attributes.earlyAccessMember,
      deletedAt: attributes.deletedAt
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
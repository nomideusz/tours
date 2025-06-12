import { pgTable, text, varchar, timestamp, boolean, pgEnum, integer } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Keep existing roles to avoid rewriting auth system
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);

// Users table (compatible with Lucia auth)
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  hashedPassword: text('hashed_password'), // Made nullable for OAuth2 users
  name: varchar('name', { length: 255 }).notNull(),
  username: varchar('username', { length: 50 }).unique(), // Unique username for personal routes
  businessName: varchar('business_name', { length: 255 }),
  stripeAccountId: varchar('stripe_account_id', { length: 255 }),
  avatar: text('avatar'), // URL to avatar image
  role: userRoleEnum('role').notNull().default('user'), // Default to user (tour guide)
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 255 }),
  country: text('country'), // Country code for the user
  description: text('description'),
  location: varchar('location', { length: 255 }), // City/region for guides
  
  // Main QR code for the new simplified approach
  mainQrCode: varchar('main_qr_code', { length: 100 }).unique(), // Auto-generated main QR code
  mainQrScans: integer('main_qr_scans').notNull().default(0), // Track main QR scans
  
  emailVerified: boolean('email_verified').notNull().default(false),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Sessions table for Lucia auth
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

// Password reset tokens table
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

// Email verification tokens table
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

// OAuth2 accounts table
export const oauthAccounts = pgTable('oauth_accounts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(), // 'google', 'github', etc.
  providerUserId: varchar('provider_user_id', { length: 255 }).notNull(), // ID from OAuth provider
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert; 
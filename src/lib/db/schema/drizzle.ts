// Drizzle Studio compatible schema file
// This file uses imports without extensions for drizzle-kit compatibility

import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum, json } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// User role enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  hashedPassword: text('hashed_password'),
  name: varchar('name', { length: 255 }).notNull(),
  username: varchar('username', { length: 50 }).unique(),
  businessName: varchar('business_name', { length: 255 }),
  stripeAccountId: varchar('stripe_account_id', { length: 255 }),
  avatar: text('avatar'),
  role: userRoleEnum('role').notNull().default('user'),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 255 }),
  country: text('country'),
  description: text('description'),
  location: varchar('location', { length: 255 }),
  currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
  
  // Main QR code for simplified approach
  mainQrCode: varchar('main_qr_code', { length: 100 }).unique(),
  mainQrScans: integer('main_qr_scans').notNull().default(0),
  
  emailVerified: boolean('email_verified').notNull().default(false),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Sessions table
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
  provider: varchar('provider', { length: 50 }).notNull(),
  providerUserId: varchar('provider_user_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// Tour status enum
export const tourStatusEnum = pgEnum('tour_status', ['active', 'draft']);

// Tours table
export const tours = pgTable('tours', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  duration: integer('duration').notNull(),
  capacity: integer('capacity').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  images: json('images').$type<string[]>().default([]),
  status: tourStatusEnum('status').notNull().default('draft'),
  category: varchar('category', { length: 100 }),
  location: varchar('location', { length: 255 }),
  includedItems: json('included_items').$type<string[]>().default([]),
  requirements: json('requirements').$type<string[]>().default([]),
  cancellationPolicy: text('cancellation_policy'),
  
  // Simplified QR code approach
  qrCode: varchar('qr_code', { length: 100 }).unique(),
  qrScans: integer('qr_scans').notNull().default(0),
  qrConversions: integer('qr_conversions').notNull().default(0),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Time slot enums
export const timeSlotStatusEnum = pgEnum('time_slot_status', ['available', 'full', 'cancelled']);
export const recurringPatternEnum = pgEnum('recurring_pattern', ['daily', 'weekly', 'monthly']);

// Time slots table
export const timeSlots = pgTable('time_slots', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tourId: text('tour_id').notNull().references(() => tours.id, { onDelete: 'cascade' }),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  availableSpots: integer('available_spots').notNull(),
  bookedSpots: integer('booked_spots').notNull().default(0),
  status: timeSlotStatusEnum('status').notNull().default('available'),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurringPattern: recurringPatternEnum('recurring_pattern'),
  recurringEnd: timestamp('recurring_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Booking enums
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 'paid', 'failed', 'refunded'
]);

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'not_arrived', 'checked_in', 'no_show'
]);

export const bookingSourceEnum = pgEnum('booking_source', [
  'main_qr', 'tour_qr', 'direct', 'referral', 'social', 'other'
]);

// Bookings table
export const bookings = pgTable('bookings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tourId: text('tour_id').notNull().references(() => tours.id),
  timeSlotId: text('time_slot_id').notNull().references(() => timeSlots.id),
  
  source: bookingSourceEnum('source').notNull().default('direct'),
  sourceQrCode: varchar('source_qr_code', { length: 100 }),
  
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }),
  participants: integer('participants').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: bookingStatusEnum('status').notNull().default('pending'),
  paymentId: varchar('payment_id', { length: 255 }),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  bookingReference: varchar('booking_reference', { length: 100 }).notNull().unique(),
  specialRequests: text('special_requests'),
  
  ticketQRCode: varchar('ticket_qr_code', { length: 100 }).unique(),
  attendanceStatus: attendanceStatusEnum('attendance_status').default('not_arrived'),
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  checkedInBy: text('checked_in_by').references(() => users.id),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Payments table
export const payments = pgTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  bookingId: text('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }).notNull().unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }),
  processingFee: decimal('processing_fee', { precision: 10, scale: 2 }).notNull().default('0'),
  netAmount: decimal('net_amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}); 
// Drizzle Studio compatible schema file
// This file uses imports without extensions for drizzle-kit compatibility

import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum, json } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// User role enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);

// Subscription plan enum
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['free', 'starter_pro', 'professional', 'agency']);

// Subscription status enum
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing']);

// Promo code type enum
export const promoCodeTypeEnum = pgEnum('promo_code_type', ['early_access', 'lifetime_discount', 'free_period', 'percentage_discount']);

// Beta application status enum
export const betaApplicationStatusEnum = pgEnum('beta_application_status', ['pending', 'accepted', 'rejected', 'waitlisted']);

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  hashedPassword: text('hashed_password'),
  name: varchar('name', { length: 255 }).notNull(),
  username: varchar('username', { length: 50 }).unique(),
  businessName: varchar('business_name', { length: 255 }),
  stripeAccountId: varchar('stripe_account_id', { length: 255 }),
  bankAccountInfo: text('bank_account_info'),
  paymentSetup: boolean('payment_setup').notNull().default(false),
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
  
  // Subscription fields
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  subscriptionPlan: subscriptionPlanEnum('subscription_plan').notNull().default('free'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('active'),
  subscriptionId: varchar('subscription_id', { length: 255 }),
  subscriptionCurrentPeriodStart: timestamp('subscription_current_period_start', { withTimezone: true }),
  subscriptionCurrentPeriodEnd: timestamp('subscription_current_period_end', { withTimezone: true }),
  subscriptionCancelAtPeriodEnd: boolean('subscription_cancel_at_period_end').notNull().default(false),
  
  // Promo code and discount fields
  promoCodeUsed: varchar('promo_code_used', { length: 50 }),
  subscriptionDiscountPercentage: integer('subscription_discount_percentage').notNull().default(0),
  subscriptionFreeUntil: timestamp('subscription_free_until', { withTimezone: true }),
  isLifetimeDiscount: boolean('is_lifetime_discount').notNull().default(false),
  earlyAccessMember: boolean('early_access_member').notNull().default(false),
  
  // Usage tracking for plan limits
  monthlyBookingsUsed: integer('monthly_bookings_used').notNull().default(0),
  monthlyBookingsResetAt: timestamp('monthly_bookings_reset_at', { withTimezone: true }),
  
  emailVerified: boolean('email_verified').notNull().default(false),
  
  // Notification preferences
  whatsappNotifications: boolean('whatsapp_notifications').notNull().default(true),
  
  lastLogin: timestamp('last_login', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
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

// Beta applications table
export const betaApplications = pgTable('beta_applications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  // Basic contact info
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 255 }),
  
  // Business info
  businessName: varchar('business_name', { length: 255 }),
  location: varchar('location', { length: 255 }).notNull(),
  country: varchar('country', { length: 2 }).notNull(),
  
  // Screening questions
  tourTypes: text('tour_types').notNull(),
  tourFrequency: text('tour_frequency').notNull(),
  currentBookingMethod: text('current_booking_method').notNull(),
  biggestChallenge: text('biggest_challenge').notNull(),
  betaContribution: text('beta_contribution').notNull(),
  
  // Additional info
  yearsExperience: integer('years_experience').notNull(),
  teamSize: integer('team_size').notNull().default(1),
  interestedFeatures: text('interested_features').array().default([]),
  availabilityForFeedback: boolean('availability_for_feedback').notNull().default(true),
  
  // Application status
  status: betaApplicationStatusEnum('status').notNull().default('pending'),
  reviewerNotes: text('reviewer_notes'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: text('reviewed_by'),
  
  // Metadata
  referralSource: varchar('referral_source', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
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
  categories: json('categories').$type<string[]>().default([]),
  location: varchar('location', { length: 255 }),
  includedItems: json('included_items').$type<string[]>().default([]),
  requirements: json('requirements').$type<string[]>().default([]),
  cancellationPolicy: text('cancellation_policy'),
  
  // Pricing tiers
  enablePricingTiers: boolean('enable_pricing_tiers').notNull().default(false),
  pricingTiers: json('pricing_tiers').$type<{
    adult: number;
    child?: number;
  }>(),
  
  // Simplified QR code approach
  qrCode: varchar('qr_code', { length: 100 }).unique(),
  qrScans: integer('qr_scans').notNull().default(0),
  qrConversions: integer('qr_conversions').notNull().default(0),
  
  // Public listing
  publicListing: boolean('public_listing').notNull().default(true),
  
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

export const paymentTypeEnum = pgEnum('payment_type', [
  'direct', 'platform_collected'
]);

export const payoutStatusEnum = pgEnum('payout_status', [
  'pending', 'processing', 'completed', 'failed'
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
  // Pricing breakdown for tiers
  participantBreakdown: json('participant_breakdown').$type<{
    adults: number;
    children?: number;
  }>(),
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
  paymentType: paymentTypeEnum('payment_type').notNull().default('direct'),
  refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }),
  processingFee: decimal('processing_fee', { precision: 10, scale: 2 }).notNull().default('0'),
  netAmount: decimal('net_amount', { precision: 10, scale: 2 }).notNull(),
  
  // For platform_collected payments - tracking tour guide payout
  tourGuideUserId: text('tour_guide_user_id').references(() => users.id),
  payoutId: text('payout_id'), // Will reference payouts table
  payoutCompleted: boolean('payout_completed').notNull().default(false),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Cross-border payouts table
export const payouts = pgTable('payouts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tourGuideUserId: text('tour_guide_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Payout details
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  payoutCurrency: varchar('payout_currency', { length: 3 }).notNull(),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 6 }),
  payoutAmountLocal: decimal('payout_amount_local', { precision: 10, scale: 2 }),
  
  // Stripe payout tracking
  stripePayoutId: varchar('stripe_payout_id', { length: 255 }).unique(),
  status: payoutStatusEnum('status').notNull().default('pending'),
  
  // Period covered by this payout
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  
  // Bank details used for payout
  bankAccountInfo: json('bank_account_info').$type<{
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    country: string;
  }>(),
  
  // Processing details
  processingStartedAt: timestamp('processing_started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Payout items - individual payments included in each payout
export const payoutItems = pgTable('payout_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  payoutId: text('payout_id').notNull().references(() => payouts.id, { onDelete: 'cascade' }),
  paymentId: text('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// Notifications table  
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'new_booking', 'booking_cancelled', 'payment_received', 'system', 'info'
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: text('data'), // JSON string for additional data
  actions: text('actions'), // JSON string for action buttons
  read: boolean('read').notNull().default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Promo codes table
export const promoCodes = pgTable('promo_codes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // Using varchar instead of enum for flexibility
  
  // Benefit details
  discountPercentage: integer('discount_percentage'), // 0-100
  freeMonths: integer('free_months'), // Number of free months
  isLifetime: boolean('is_lifetime').notNull().default(false), // If discount applies forever
  
  // Usage limits
  maxUses: integer('max_uses'), // NULL for unlimited
  currentUses: integer('current_uses').notNull().default(0),
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull().defaultNow(),
  validUntil: timestamp('valid_until', { withTimezone: true }), // NULL for no expiry
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}); 
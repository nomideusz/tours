import { pgTable, text, varchar, decimal, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { bookings, paymentStatusEnum as bookingPaymentStatusEnum } from './bookings';

// Payments table
export const payments = pgTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  bookingId: text('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }).notNull().unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
  status: bookingPaymentStatusEnum('status').notNull().default('pending'),
  refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }),
  processingFee: decimal('processing_fee', { precision: 10, scale: 2 }).notNull().default('0'),
  netAmount: decimal('net_amount', { precision: 10, scale: 2 }).notNull(), // amount after fees
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert; 
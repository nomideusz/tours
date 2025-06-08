import { pgTable, text, varchar, integer, decimal, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { tours, timeSlots } from './tours.js';
import { users } from './users.js';

// Booking status enum
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
]);

// Payment status enum
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 'paid', 'failed', 'refunded'
]);

// Attendance status enum
export const attendanceStatusEnum = pgEnum('attendance_status', [
  'not_arrived', 'checked_in', 'no_show'
]);

// Booking source enum - track how customer found the tour
export const bookingSourceEnum = pgEnum('booking_source', [
  'main_qr',     // Scanned main guide QR code
  'tour_qr',     // Scanned specific tour QR code  
  'direct',      // Direct website access
  'referral',    // From another customer
  'social',      // Social media
  'other'        // Other sources
]);

// Bookings table
export const bookings = pgTable('bookings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tourId: text('tour_id').notNull().references(() => tours.id),
  timeSlotId: text('time_slot_id').notNull().references(() => timeSlots.id),
  
  // Track booking source for analytics
  source: bookingSourceEnum('source').notNull().default('direct'),
  sourceQrCode: varchar('source_qr_code', { length: 100 }), // Which QR code was scanned (if any)
  
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }),
  participants: integer('participants').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: bookingStatusEnum('status').notNull().default('pending'),
  paymentId: varchar('payment_id', { length: 255 }), // Stripe payment intent ID
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  bookingReference: varchar('booking_reference', { length: 100 }).notNull().unique(),
  specialRequests: text('special_requests'),
  
  // Ticket QR fields
  ticketQRCode: varchar('ticket_qr_code', { length: 100 }).unique(), // unique ticket identifier
  attendanceStatus: attendanceStatusEnum('attendance_status').default('not_arrived'),
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  checkedInBy: text('checked_in_by').references(() => users.id), // guide who checked them in
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert; 
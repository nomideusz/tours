import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum, json } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';

// Tour status enum
export const tourStatusEnum = pgEnum('tour_status', ['active', 'draft']);

// Tours table
export const tours = pgTable('tours', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  duration: integer('duration').notNull(), // in minutes
  capacity: integer('capacity').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  images: json('images').$type<string[]>().default([]), // Array of image URLs
  status: tourStatusEnum('status').notNull().default('draft'),
  category: varchar('category', { length: 100 }),
  location: varchar('location', { length: 255 }),
  includedItems: json('included_items').$type<string[]>().default([]),
  requirements: json('requirements').$type<string[]>().default([]),
  cancellationPolicy: text('cancellation_policy'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Time slot status enum
export const timeSlotStatusEnum = pgEnum('time_slot_status', ['available', 'full', 'cancelled']);

// Recurring pattern enum
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

export type Tour = typeof tours.$inferSelect;
export type NewTour = typeof tours.$inferInsert;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type NewTimeSlot = typeof timeSlots.$inferInsert; 
import { pgTable, text, varchar, integer, boolean, pgEnum, json, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users.js';
import { tours } from './tours.js';

// QR code category enum
export const qrCategoryEnum = pgEnum('qr_category', ['digital', 'print', 'partner', 'event', 'promo']);

// QR customization type
export interface QRCustomization {
  color?: string;
  backgroundColor?: string;
  logo?: string;
  style?: 'square' | 'rounded' | 'dots';
}

// QR codes table
export const qrCodes = pgTable('qr_codes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  tourId: text('tour_id').notNull().references(() => tours.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 100 }).notNull().unique(), // unique identifier
  name: varchar('name', { length: 255 }).notNull(), // user-friendly name
  category: qrCategoryEnum('category'),
  scans: integer('scans').notNull().default(0),
  conversions: integer('conversions').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  customization: json('customization').$type<QRCustomization>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type QRCode = typeof qrCodes.$inferSelect;
export type NewQRCode = typeof qrCodes.$inferInsert; 
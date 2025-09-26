// Development Tracking Extensions for Feedback System
// This extends the existing feedback_submissions table with development tracking fields

import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum, json } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Development priority enum
export const developmentPriorityEnum = pgEnum('development_priority', ['critical', 'high', 'medium', 'low', 'backlog']);

// Development category enum for better organization
export const developmentCategoryEnum = pgEnum('development_category', [
  'tours', 'bookings', 'payments', 'qr_codes', 'notifications', 
  'analytics', 'ui_ux', 'performance', 'security', 'integrations', 
  'mobile', 'api', 'admin', 'other'
]);

// Development effort enum (story points/complexity)
export const developmentEffortEnum = pgEnum('development_effort', ['xs', 's', 'm', 'l', 'xl', 'xxl']);

// Release/milestone tracking
export const releaseStatusEnum = pgEnum('release_status', ['planned', 'in_development', 'testing', 'deployed', 'cancelled']);

// Development items table (extends feedback with development tracking)
export const developmentItems = pgTable('development_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  // Link to original feedback (if originated from feedback)
  feedbackId: text('feedback_id'), // References feedback_submissions.id
  
  // Basic info
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // bug, feature, improvement, technical_debt
  
  // Development tracking
  priority: developmentPriorityEnum('priority').notNull().default('medium'),
  category: developmentCategoryEnum('category').notNull().default('other'),
  effort: developmentEffortEnum('effort'), // Story points/complexity estimation
  
  // Status and progress
  status: varchar('status', { length: 50 }).notNull().default('backlog'), // backlog, planned, in_progress, testing, completed, cancelled
  progress: integer('progress').notNull().default(0), // 0-100 percentage
  
  // Assignment and ownership
  assignedTo: text('assigned_to'), // References users.id
  reportedBy: text('reported_by'), // References users.id
  
  // Business impact
  userImpact: integer('user_impact').default(3), // 1-5 scale (how many users affected)
  businessValue: integer('business_value').default(3), // 1-5 scale (business importance)
  
  // Technical details
  technicalNotes: text('technical_notes'),
  acceptanceCriteria: json('acceptance_criteria').$type<string[]>().default([]),
  tags: json('tags').$type<string[]>().default([]),
  
  // Release tracking
  targetRelease: varchar('target_release', { length: 50 }),
  releaseStatus: releaseStatusEnum('release_status').default('planned'),
  
  // Dependencies
  blockedBy: json('blocked_by').$type<string[]>().default([]), // Array of development_item IDs
  blocks: json('blocks').$type<string[]>().default([]), // Array of development_item IDs
  
  // Time tracking
  estimatedHours: decimal('estimated_hours', { precision: 5, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 5, scale: 2 }),
  
  // Dates
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  targetDate: timestamp('target_date', { withTimezone: true })
});

// Development comments/updates table
export const developmentComments = pgTable('development_comments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  developmentItemId: text('development_item_id').notNull().references(() => developmentItems.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(), // References users.id
  comment: text('comment').notNull(),
  type: varchar('type', { length: 50 }).notNull().default('comment'), // comment, status_change, assignment, etc.
  metadata: json('metadata').$type<Record<string, any>>(), // Additional data for different comment types
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// Releases/milestones table
export const releases = pgTable('releases', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 100 }).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  description: text('description'),
  status: releaseStatusEnum('status').notNull().default('planned'),
  
  // Dates
  plannedDate: timestamp('planned_date', { withTimezone: true }),
  releaseDate: timestamp('release_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Development metrics for tracking velocity and progress
export const developmentMetrics = pgTable('development_metrics', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  // Time period
  weekNumber: integer('week_number').notNull(),
  year: integer('year').notNull(),
  
  // Velocity metrics
  storyPointsCompleted: integer('story_points_completed').notNull().default(0),
  itemsCompleted: integer('items_completed').notNull().default(0),
  bugsFixed: integer('bugs_fixed').notNull().default(0),
  featuresDelivered: integer('features_delivered').notNull().default(0),
  
  // Quality metrics
  bugsIntroduced: integer('bugs_introduced').notNull().default(0),
  cycleTime: decimal('cycle_time', { precision: 5, scale: 2 }), // Average days from start to completion
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

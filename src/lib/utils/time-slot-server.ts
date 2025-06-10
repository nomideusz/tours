/**
 * Server-side time slot utilities
 * 
 * This file contains server-side utilities for time slot operations including:
 * - Database queries for time slots
 * - Time slot filtering and calculations
 * - Statistics calculations for time slots
 * 
 * Shared across schedule, tour details, and dashboard server files
 */

import { db } from '$lib/db/connection.js';
import { timeSlots } from '$lib/db/schema/index.js';
import { eq, and, gte, count, sql } from 'drizzle-orm';
import type { TimeSlot } from '$lib/types.js';

/**
 * Get upcoming time slots for a specific tour
 */
export async function getUpcomingTimeSlots(tourId: string, limit?: number): Promise<TimeSlot[]> {
	try {
		const now = new Date();
		
		const query = db
			.select({
				id: timeSlots.id,
				tourId: timeSlots.tourId,
				startTime: timeSlots.startTime,
				endTime: timeSlots.endTime,
				availableSpots: timeSlots.availableSpots,
				bookedSpots: timeSlots.bookedSpots,
				status: timeSlots.status,
				isRecurring: timeSlots.isRecurring,
				recurringPattern: timeSlots.recurringPattern,
				recurringEnd: timeSlots.recurringEnd,
				createdAt: timeSlots.createdAt,
				updatedAt: timeSlots.updatedAt
			})
			.from(timeSlots)
			.where(and(
				eq(timeSlots.tourId, tourId),
				gte(timeSlots.startTime, now)
			))
			.orderBy(timeSlots.startTime);
		
		if (limit) {
			query.limit(limit);
		}
		
		const slots = await query;
		
		return slots.map(slot => ({
			...slot,
			startTime: slot.startTime.toISOString(),
			endTime: slot.endTime.toISOString(),
			createdAt: slot.createdAt.toISOString(),
			updatedAt: slot.updatedAt.toISOString(),
			recurringEnd: slot.recurringEnd?.toISOString() || null
		}));
	} catch (error) {
		console.error('Error fetching upcoming time slots:', error);
		return [];
	}
}

/**
 * Get all time slots for a specific tour
 */
export async function getAllTimeSlots(tourId: string): Promise<TimeSlot[]> {
	try {
		const slots = await db
			.select({
				id: timeSlots.id,
				tourId: timeSlots.tourId,
				startTime: timeSlots.startTime,
				endTime: timeSlots.endTime,
				availableSpots: timeSlots.availableSpots,
				bookedSpots: timeSlots.bookedSpots,
				status: timeSlots.status,
				isRecurring: timeSlots.isRecurring,
				recurringPattern: timeSlots.recurringPattern,
				recurringEnd: timeSlots.recurringEnd,
				createdAt: timeSlots.createdAt,
				updatedAt: timeSlots.updatedAt
			})
			.from(timeSlots)
			.where(eq(timeSlots.tourId, tourId))
			.orderBy(timeSlots.startTime);
		
		return slots.map(slot => ({
			...slot,
			startTime: slot.startTime.toISOString(),
			endTime: slot.endTime.toISOString(),
			createdAt: slot.createdAt.toISOString(),
			updatedAt: slot.updatedAt.toISOString(),
			recurringEnd: slot.recurringEnd?.toISOString() || null
		}));
	} catch (error) {
		console.error('Error fetching all time slots:', error);
		return [];
	}
}

/**
 * Get time slot statistics for a specific tour
 */
export async function getTimeSlotStats(tourId: string) {
	try {
		const now = new Date();
		
		const [stats] = await db
			.select({
				totalSlots: count(timeSlots.id),
				upcomingSlots: sql<number>`COALESCE(SUM(CASE WHEN ${timeSlots.startTime} >= NOW() THEN 1 ELSE 0 END), 0)`,
				totalAvailableSpots: sql<number>`COALESCE(SUM(${timeSlots.availableSpots}), 0)`,
				totalBookedSpots: sql<number>`COALESCE(SUM(${timeSlots.bookedSpots}), 0)`
			})
			.from(timeSlots)
			.where(eq(timeSlots.tourId, tourId));
		
		// Calculate today's bookings from time slots
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);
		const todayEnd = new Date(todayStart);
		todayEnd.setDate(todayEnd.getDate() + 1);
		
		const [todayStats] = await db
			.select({
				todaySlots: count(timeSlots.id),
				todayBookedSpots: sql<number>`COALESCE(SUM(${timeSlots.bookedSpots}), 0)`
			})
			.from(timeSlots)
			.where(and(
				eq(timeSlots.tourId, tourId),
				gte(timeSlots.startTime, todayStart),
				sql`${timeSlots.startTime} < ${todayEnd.toISOString()}`
			));
		
		return {
			totalSlots: Number(stats?.totalSlots || 0),
			upcomingSlots: Number(stats?.upcomingSlots || 0),
			totalAvailableSpots: Number(stats?.totalAvailableSpots || 0),
			totalBookedSpots: Number(stats?.totalBookedSpots || 0),
			todaySlots: Number(todayStats?.todaySlots || 0),
			todayBookedSpots: Number(todayStats?.todayBookedSpots || 0),
			utilizationRate: stats?.totalAvailableSpots ? 
				(Number(stats.totalBookedSpots) / Number(stats.totalAvailableSpots)) * 100 : 0
		};
	} catch (error) {
		console.error('Error fetching time slot stats:', error);
		return {
			totalSlots: 0,
			upcomingSlots: 0,
			totalAvailableSpots: 0,
			totalBookedSpots: 0,
			todaySlots: 0,
			todayBookedSpots: 0,
			utilizationRate: 0
		};
	}
}

/**
 * Filter time slots for today
 */
export function filterTodaysSlots(slots: TimeSlot[]): TimeSlot[] {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	
	return slots.filter(slot => {
		const slotDate = new Date(slot.startTime);
		return slotDate >= today && slotDate < tomorrow;
	});
}

/**
 * Calculate total booked spots from an array of time slots
 */
export function calculateTotalBookedSpots(slots: TimeSlot[]): number {
	return slots.reduce((total, slot) => total + slot.bookedSpots, 0);
}

/**
 * Get today's booked spots from an array of time slots
 */
export function getTodayBookedSpotsFromSlots(slots: TimeSlot[]): number {
	const todaysSlots = filterTodaysSlots(slots);
	return calculateTotalBookedSpots(todaysSlots);
} 
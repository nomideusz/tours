/**
 * Server-side tour utilities
 * 
 * This file contains server-only tour utilities that require database access.
 * These functions should only be imported in +page.server.ts, +server.ts files, or other server-side code.
 */

import { db } from '$lib/db/connection.js';
import { tours, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, max, gte } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

/**
 * Verify tour ownership and load tour data
 */
export async function loadTourWithOwnership(tourId: string, userId: string) {
	const [tour] = await db
		.select()
		.from(tours)
		.where(and(
			eq(tours.id, tourId),
			eq(tours.userId, userId)
		))
		.limit(1);

	if (!tour) {
		throw error(404, 'Tour not found or you do not have permission to access it');
	}

	return tour;
}

/**
 * Get maximum booked spots across all time slots for a tour
 */
export async function getMaxBookedSpots(tourId: string): Promise<number> {
	const maxBookedResult = await db
		.select({ maxBooked: max(timeSlots.bookedSpots) })
		.from(timeSlots)
		.where(eq(timeSlots.tourId, tourId));
	
	return maxBookedResult[0]?.maxBooked || 0;
}

/**
 * Get booking constraints for a tour
 */
export async function getBookingConstraints(tourId: string, currentCapacity: number) {
	const maxBookedSpots = await getMaxBookedSpots(tourId);
	
	return {
		maxBookedSpots,
		canReduceCapacity: currentCapacity > maxBookedSpots,
		minimumCapacity: maxBookedSpots
	};
}

/**
 * Validate if a capacity change is allowed
 */
export function validateCapacityChange(newCapacity: number, maxBookedSpots: number) {
	if (newCapacity < maxBookedSpots) {
		return {
			isValid: false,
			error: `Cannot reduce capacity to ${newCapacity}. You have ${maxBookedSpots} people booked in one or more time slots. Cancel bookings first or increase capacity.`,
			capacityError: {
				attempted: newCapacity,
				minimum: maxBookedSpots,
				reason: 'existing_bookings'
			}
		};
	}
	
	return { isValid: true };
}

/**
 * Update all time slots to match new tour capacity
 */
export async function updateTimeSlotsCapacity(tourId: string, newCapacity: number) {
	await db
		.update(timeSlots)
		.set({
			availableSpots: newCapacity,
			updatedAt: new Date()
		})
		.where(eq(timeSlots.tourId, tourId));
}

/**
 * Get upcoming time slots for a tour
 */
export async function getUpcomingTimeSlots(tourId: string, limit: number = 10) {
	const now = new Date();
	
	const slots = await db
		.select()
		.from(timeSlots)
		.where(and(
			eq(timeSlots.tourId, tourId),
			timeSlots.startTime ? gte(timeSlots.startTime, now) : undefined
		))
		.orderBy(timeSlots.startTime)
		.limit(limit);
	
	return slots;
}

/**
 * Get time slot statistics for a tour
 */
export async function getTimeSlotStats(tourId: string) {
	const now = new Date();
	
	// Get all time slots for the tour
	const allSlots = await db
		.select()
		.from(timeSlots)
		.where(eq(timeSlots.tourId, tourId));
	
	// Calculate stats
	const total = allSlots.length;
	const upcoming = allSlots.filter(slot => slot.startTime && slot.startTime > now).length;
	const past = allSlots.filter(slot => slot.startTime && slot.startTime <= now).length;
	const availableSlots = allSlots.filter(slot => 
		slot.status === 'available' && 
		slot.startTime && 
		slot.startTime > now
	).length;
	
	return {
		total,
		upcoming,
		past,
		available: availableSlots
	};
} 
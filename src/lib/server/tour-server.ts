/**
 * Server-side tour utilities
 * 
 * This file contains server-side utilities for tour operations including:
 * - Database operations (loading tours, time slots)
 * - Ownership verification and authentication
 * - Capacity and booking validation
 * - Server-side business logic
 * 
 * For client-side utilities (formatting, display logic), see tour-client.ts
 */

import { error } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { tours, timeSlots } from '$lib/db/schema/index.js';
import { eq, and, max } from 'drizzle-orm';

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
 * Validate time slot capacity against tour capacity and existing bookings
 */
export function validateSlotCapacity(
	availableSpots: number, 
	tourCapacity: number, 
	currentBookedSpots: number = 0
) {
	if (availableSpots < currentBookedSpots) {
		return {
			isValid: false,
			error: `Cannot reduce available spots to ${availableSpots}. You have ${currentBookedSpots} people already booked for this time slot.`
		};
	}

	if (availableSpots > tourCapacity) {
		return {
			isValid: false,
			error: `Available spots cannot exceed tour capacity of ${tourCapacity}`
		};
	}

	if (availableSpots < 1) {
		return {
			isValid: false,
			error: 'Available spots must be at least 1'
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
 * Load tour with time slots for schedule page
 */
export async function loadTourWithTimeSlots(tourId: string, userId: string) {
	// Load tour and verify ownership
	const tour = await loadTourWithOwnership(tourId, userId);

	// Load all time slots for this tour
	const tourTimeSlots = await db
		.select()
		.from(timeSlots)
		.where(eq(timeSlots.tourId, tourId))
		.orderBy(timeSlots.startTime);

	return {
		tour: {
			...tour,
			price: parseFloat(tour.price),
			created: tour.createdAt.toISOString(),
			updated: tour.updatedAt.toISOString()
		},
		timeSlots: tourTimeSlots.map(slot => ({
			...slot,
			startTime: slot.startTime.toISOString(),
			endTime: slot.endTime.toISOString(),
			createdAt: slot.createdAt.toISOString(),
			updatedAt: slot.updatedAt.toISOString(),
			recurringEnd: slot.recurringEnd?.toISOString() || null
		}))
	};
} 
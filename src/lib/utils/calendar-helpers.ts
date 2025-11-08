/**
 * Calendar utility functions
 */

import type { Tour } from '$lib/types.js';

// Type definitions for time slots
interface TimeSlot {
	createdAt?: string | Date;
	created?: string | Date;
	startTime?: string | Date;
	capacity?: number;
	availableSpots?: number;
	tourId?: string;
}

/**
 * Format date for input (YYYY-MM-DD format)
 */
export function formatDateForInput(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Calculate end time based on start time and duration in minutes
 */
export function calculateEndTime(startTime: string, duration: number): string {
	if (!startTime || !duration) return startTime;
	
	const [hours, minutes] = startTime.split(':').map(Number);
	const totalMinutes = hours * 60 + minutes + duration;
	
	const endHours = Math.floor(totalMinutes / 60) % 24;
	const endMinutes = totalMinutes % 60;
	
	return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

/**
 * Calculate recurring end date
 */
export function getRecurringEndDate(startDate: string, recurringType: string, count: number): string {
	const date = new Date(startDate);
	
	switch (recurringType) {
		case 'daily':
			date.setDate(date.getDate() + count - 1);
			break;
		case 'weekly':
			date.setDate(date.getDate() + (count - 1) * 7);
			break;
		case 'monthly':
			date.setMonth(date.getMonth() + count - 1);
			break;
	}
	
	return date.toISOString().split('T')[0];
}

/**
 * Calculate total recurring slots
 */
export function calculateTotalRecurringSlots(startDate: string, recurringType: string, count: number): number {
	return count; // Simple: the count is the total number of slots
}

/**
 * Get last used capacity from existing time slots
 */
export function getLastUsedCapacity(timeSlots: TimeSlot[]): number | null {
	if (!timeSlots || timeSlots.length === 0) return null;
	
	// Sort by creation time descending and get the first one
	const sortedSlots = [...timeSlots].sort((a, b) => {
		const aTime = new Date(a.createdAt || a.created || a.startTime || 0).getTime();
		const bTime = new Date(b.createdAt || b.created || b.startTime || 0).getTime();
		return bTime - aTime; // Most recent first
	});
	
	// Check both field names for compatibility
	// API returns 'capacity' but database stores as 'availableSpots'
	return sortedSlots[0]?.capacity || sortedSlots[0]?.availableSpots || null;
}

/**
 * Get smart capacity default based on various factors
 */
export function getSmartCapacity(tourId: string, tour: Tour, timeSlots?: TimeSlot[], lastCreatedSlot?: TimeSlot): number {
	// Priority order:
	// 1. Last created slot for the same tour (if within this session)
	// 2. Last used capacity from existing slots for this tour
	// 3. Tour's default capacity (but min 10 for better UX)
	
	// Check if we have a recent slot for this same tour
	if (lastCreatedSlot && lastCreatedSlot.tourId === tourId && lastCreatedSlot.capacity) {
		return lastCreatedSlot.capacity;
	}
	
	// Check existing slots for this tour
	const lastUsed = timeSlots ? getLastUsedCapacity(timeSlots) : null;
	if (lastUsed && lastUsed > 1) {
		return lastUsed;
	}
	
	// Fallback to tour capacity
	const tourCapacity = tour?.capacity || 10;
	return tourCapacity;
}

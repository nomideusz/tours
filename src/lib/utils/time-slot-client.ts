/**
 * Client-side time slot utilities
 * 
 * This file contains client-side utilities for time slot operations including:
 * - Time slot formatting functions
 * - Status color utilities
 * - Availability calculations
 * - Display helpers
 * 
 * Shared across schedule, tour details, and dashboard pages
 */

import type { TimeSlot } from '$lib/types.js';
import { formatDate, formatTime, formatDateTime } from '$lib/utils/date-helpers.js';

/**
 * Format time slot date and time with consistent display format
 */
export function formatSlotDateTime(dateInput: string | Date | undefined): string {
	if (!dateInput) return 'No date';
	try {
		const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
		if (isNaN(date.getTime())) return 'Invalid date';
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
	} catch (error) {
		console.warn('Error formatting slot date:', dateInput);
		return 'Invalid date';
	}
}

/**
 * Format time range for a time slot
 */
export function formatSlotTimeRange(startTime: string | undefined, endTime: string | undefined): string {
	if (!startTime || !endTime) return 'No time';
	try {
		const start = new Date(startTime);
		const end = new Date(endTime);
		
		if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid time';
		
		const startStr = start.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
		
		const endStr = end.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
		
		return `${startStr} - ${endStr}`;
	} catch (error) {
		console.warn('Error formatting time range:', startTime, endTime);
		return 'Invalid time';
	}
}

/**
 * Get availability text for a time slot
 */
export function getSlotAvailabilityText(slot: TimeSlot): string {
	const bookedSpots = slot.bookedSpots || 0;
	const availableSpots = slot.availableSpots || 0;
	const available = Math.max(0, availableSpots - bookedSpots);
	return `${bookedSpots} booked, ${available} available`;
}

/**
 * Get status color for a time slot based on its booking status
 * Uses CSS variables instead of hard-coded colors
 */
export function getSlotStatusColor(slot: TimeSlot): string {
	if (slot.bookedSpots >= slot.availableSpots) return 'var(--color-error-500)'; // Red - full
	if (slot.bookedSpots > 0) return 'var(--color-warning-500)'; // Amber - partial
	return 'var(--color-success-500)'; // Green - available
}

/**
 * Get CSS classes for time slot status badges
 * Using semantic classes that work with CSS variables
 */
export function getSlotStatusClasses(status: string): string {
	switch (status) {
		case 'active': 
			return 'status-confirmed';
		case 'full': 
			return 'status-cancelled';
		case 'cancelled': 
			return 'status-default';
		default: 
			return 'status-completed';
	}
}

/**
 * Get utilization percentage for a time slot
 */
export function getSlotUtilization(slot: TimeSlot): number {
	return slot.availableSpots > 0 ? (slot.bookedSpots / slot.availableSpots) * 100 : 0;
}

/**
 * Check if a time slot is full
 */
export function isSlotFull(slot: TimeSlot): boolean {
	return slot.bookedSpots >= slot.availableSpots;
}

/**
 * Check if a time slot is upcoming (future date)
 */
export function isSlotUpcoming(slot: TimeSlot): boolean {
	return new Date(slot.startTime) > new Date();
}

/**
 * Check if a time slot is today
 */
export function isSlotToday(slot: TimeSlot): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	
	const slotDate = new Date(slot.startTime);
	return slotDate >= today && slotDate < tomorrow;
}

/**
 * Sort time slots by start time
 */
export function sortSlotsByTime(slots: TimeSlot[]): TimeSlot[] {
	return [...slots].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

/**
 * Filter upcoming time slots
 */
export function getUpcomingSlots(slots: TimeSlot[], limit?: number): TimeSlot[] {
	const upcoming = slots.filter(isSlotUpcoming);
	const sorted = sortSlotsByTime(upcoming);
	return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * Filter today's time slots
 */
export function getTodaysSlots(slots: TimeSlot[]): TimeSlot[] {
	return slots.filter(isSlotToday);
}

/**
 * Calculate total booked spots for today
 */
export function getTodayBookedSpots(slots: TimeSlot[]): number {
	return getTodaysSlots(slots).reduce((total, slot) => total + slot.bookedSpots, 0);
}

/**
 * Get slot status text based on booking status
 */
export function getSlotStatusText(slot: TimeSlot): string {
	if (isSlotFull(slot)) return 'Full';
	if (slot.bookedSpots > 0) return 'Partial';
	return 'Available';
}

/**
 * Format time slot for mobile display (compact format)
 */
export function formatSlotForMobile(slot: TimeSlot): {
	time: string;
	date: string;
	status: string;
	availability: string;
} {
	return {
		time: formatTime(slot.startTime),
		date: formatDate(slot.startTime),
		status: getSlotStatusText(slot),
		availability: getSlotAvailabilityText(slot)
	};
}

/**
 * Format time slot for desktop display (full format)
 */
export function formatSlotForDesktop(slot: TimeSlot): {
	dateTime: string;
	timeRange: string;
	status: string;
	availability: string;
	utilization: number;
} {
	return {
		dateTime: formatSlotDateTime(slot.startTime),
		timeRange: formatSlotTimeRange(slot.startTime, slot.endTime),
		status: getSlotStatusText(slot),
		availability: getSlotAvailabilityText(slot),
		utilization: getSlotUtilization(slot)
	};
}

/**
 * Get status color for schedule page slots (with totalBookings, isPast, etc.)
 * Using semantic classes that work with CSS variables
 */
export function getScheduleSlotStatusColor(slot: any): string {
	if (slot.isPast) return 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-primary)]';
	if (slot.status === 'cancelled') return 'bg-[var(--color-error-50)] text-[var(--color-error-700)] border-[var(--color-error-200)]';
	if (slot.availableSpots === 0) return 'bg-[var(--color-warning-50)] text-[var(--color-warning-700)] border-[var(--color-warning-200)]';
	if (slot.totalBookings > 0) return 'bg-[var(--color-info-50)] text-[var(--color-info-700)] border-[var(--color-info-200)]';
	return 'bg-[var(--color-success-50)] text-[var(--color-success-700)] border-[var(--color-success-200)]';
}

/**
 * Get status text for schedule page slots (with totalBookings, isPast, etc.)
 */
export function getScheduleSlotStatusText(slot: any): string {
	if (slot.isPast) return 'Completed';
	if (slot.status === 'cancelled') return 'Cancelled';
	if (slot.availableSpots === 0) return 'Fully Booked';
	if (slot.totalBookings > 0) return `${slot.availableSpots} spots left`;
	return 'Available';
}

/**
 * Get status icon name for schedule page slots (with totalBookings, isPast, etc.)
 * Returns the icon name as a string for use with dynamic imports
 */
export function getScheduleSlotStatusIcon(slot: any): string {
	if (slot.isPast) return 'Clock';
	if (slot.status === 'cancelled') return 'XCircle';
	if (slot.availableSpots === 0) return 'AlertCircle';
	if (slot.totalBookings > 0) return 'Users';
	return 'CheckCircle';
} 
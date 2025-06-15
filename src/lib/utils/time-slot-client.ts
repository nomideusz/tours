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
	const available = slot.availableSpots - slot.bookedSpots;
	return `${slot.bookedSpots} booked, ${available} available`;
}

/**
 * Get status color for a time slot based on its booking status
 */
export function getSlotStatusColor(slot: TimeSlot): string {
	if (slot.bookedSpots >= slot.availableSpots) return '#EF4444'; // Red - full
	if (slot.bookedSpots > 0) return '#F59E0B'; // Amber - partial
	return '#10B981'; // Green - available
}

/**
 * Get CSS classes for time slot status badges
 */
export function getSlotStatusClasses(status: string): string {
	switch (status) {
		case 'active': 
			return 'bg-green-50 text-green-700 border-green-200';
		case 'full': 
			return 'bg-red-50 text-red-700 border-red-200';
		case 'cancelled': 
			return 'bg-gray-50 text-gray-700 border-gray-200';
		default: 
			return 'bg-blue-50 text-blue-700 border-blue-200';
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
 */
export function getScheduleSlotStatusColor(slot: any): string {
	if (slot.isPast) return 'bg-gray-50 text-gray-600 border-gray-200';
	if (slot.status === 'cancelled') return 'bg-red-50 text-red-700 border-red-200';
	if (slot.availableSpots === 0) return 'bg-orange-50 text-orange-700 border-orange-200';
	if (slot.totalBookings > 0) return 'bg-blue-50 text-blue-700 border-blue-200';
	return 'bg-green-50 text-green-700 border-green-200';
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
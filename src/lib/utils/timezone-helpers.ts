/**
 * Timezone utilities for tour booking system
 * 
 * This handles timezone conversions to ensure consistent behavior
 * across server and client, accounting for tour guide timezones
 */

/**
 * Get today's date range in a specific timezone
 * Returns start and end of today in UTC for database queries
 */
export function getTodayRange(timezone: string = 'UTC'): { start: Date; end: Date } {
	try {
		// Get current time in the specified timezone
		const now = new Date();
		const formatter = new Intl.DateTimeFormat('en-CA', {
			timeZone: timezone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
		
		const localDateString = formatter.format(now);
		
		// Create start of day in the target timezone
		const startOfDay = new Date(`${localDateString}T00:00:00`);
		const endOfDay = new Date(`${localDateString}T23:59:59.999`);
		
		// Convert to UTC for database queries
		const timezoneOffset = getTimezoneOffset(timezone, startOfDay);
		
		return {
			start: new Date(startOfDay.getTime() - timezoneOffset),
			end: new Date(endOfDay.getTime() - timezoneOffset)
		};
	} catch (error) {
		console.error('Error calculating today range for timezone:', timezone, error);
		// Fallback to UTC
		const today = new Date();
		today.setUTCHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
		return { start: today, end: tomorrow };
	}
}

/**
 * Check if a date (ISO string) is "today" in a specific timezone
 */
export function isDateTodayInTimezone(dateString: string, timezone: string = 'UTC'): boolean {
	try {
		const date = new Date(dateString);
		const { start, end } = getTodayRange(timezone);
		return date >= start && date < end;
	} catch (error) {
		console.error('Error checking if date is today:', error);
		return false;
	}
}

/**
 * Format date to show in tour guide's local timezone
 */
export function formatDateInTimezone(dateString: string, timezone: string = 'UTC', options?: Intl.DateTimeFormatOptions): string {
	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return 'Invalid date';
		
		const defaultOptions: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
			timeZone: timezone
		};
		
		return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
	} catch (error) {
		console.error('Error formatting date in timezone:', error);
		return 'Invalid date';
	}
}

/**
 * Format time range in tour guide's timezone
 */
export function formatTimeRangeInTimezone(
	startTime: string, 
	endTime: string, 
	timezone: string = 'UTC'
): string {
	try {
		const start = new Date(startTime);
		const end = new Date(endTime);
		
		if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid time';
		
		const timeOptions: Intl.DateTimeFormatOptions = {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
			timeZone: timezone
		};
		
		const startStr = new Intl.DateTimeFormat('en-US', timeOptions).format(start);
		const endStr = new Intl.DateTimeFormat('en-US', timeOptions).format(end);
		
		return `${startStr} - ${endStr}`;
	} catch (error) {
		console.error('Error formatting time range in timezone:', error);
		return 'Invalid time';
	}
}

/**
 * Get timezone offset for a specific timezone at a given date
 * Returns offset in milliseconds
 */
function getTimezoneOffset(timezone: string, date: Date): number {
	try {
		// Create dates in UTC and target timezone
		const utcDate = new Date(date.toISOString());
		const targetDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
		
		return targetDate.getTime() - utcDate.getTime();
	} catch (error) {
		console.error('Error calculating timezone offset:', error);
		return 0;
	}
}

/**
 * Convert a local datetime (from form input) to UTC ISO string
 * accounting for the tour guide's timezone
 */
export function localDateTimeToUTC(dateString: string, timeString: string, timezone: string = 'UTC'): string {
	try {
		// Create a date object assuming the input is in the target timezone
		const localDateTime = new Date(`${dateString}T${timeString}`);
		
		// Get the offset for this timezone at this date
		const timezoneOffset = getTimezoneOffset(timezone, localDateTime);
		
		// Adjust to UTC
		const utcDateTime = new Date(localDateTime.getTime() - timezoneOffset);
		
		return utcDateTime.toISOString();
	} catch (error) {
		console.error('Error converting local datetime to UTC:', error);
		throw new Error('Invalid date/time format');
	}
}

/**
 * Common timezone options for tour guides
 */
export const COMMON_TIMEZONES = [
	{ value: 'Europe/London', label: 'London (GMT/BST)' },
	{ value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
	{ value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
	{ value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
	{ value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
	{ value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
	{ value: 'America/New_York', label: 'New York (EST/EDT)' },
	{ value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
	{ value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
	{ value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
	{ value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
	{ value: 'UTC', label: 'UTC (Coordinated Universal Time)' }
];

/**
 * Detect browser timezone (for initial default)
 */
export function detectBrowserTimezone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch (error) {
		console.warn('Could not detect browser timezone:', error);
		return 'UTC';
	}
} 
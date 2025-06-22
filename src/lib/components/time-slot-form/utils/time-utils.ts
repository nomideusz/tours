import type { SmartTime, TimeSlotConflict } from '../types.js';

export function findNextAvailableTime(
	targetDate: string,
	preferredDuration: number | null,
	lastCreatedTime: string | null,
	lastCreatedDate: string,
	existingSlots: any[],
	tourDuration?: number,
	recursionDepth: number = 0
): SmartTime {
	const duration = preferredDuration || tourDuration || 120; // Use custom duration, tour duration, or 2 hours
	const durationMs = duration * 60000;
	const breakTime = 30 * 60000; // 30 minute break between slots
	
	// Check if it's today and we need to avoid past times
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const targetDateObj = new Date(targetDate);
	targetDateObj.setHours(0, 0, 0, 0);
	const isToday = targetDateObj.getTime() === today.getTime();
	
	if (!targetDate) {
		const defaultStart = '10:00';
		const start = new Date(`2000-01-01T${defaultStart}:00`);
		const end = new Date(start.getTime() + durationMs);
		return { startTime: defaultStart, endTime: end.toTimeString().slice(0, 5), suggestedNewDate: false };
	}
	
	// If we just created a slot, suggest next time with break
	if (lastCreatedTime && lastCreatedDate === targetDate) {
		const lastTime = new Date(`2000-01-01T${lastCreatedTime}:00`);
		const suggestedStart = new Date(lastTime.getTime() + durationMs + breakTime);
		
		// If suggested time is after 8 PM, suggest next day instead
		if (suggestedStart.getHours() >= 20) {
			const tomorrow = new Date(targetDateObj);
			tomorrow.setDate(tomorrow.getDate() + 1);
			const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
			// Start fresh on new day (pass recursion depth to prevent infinite loops)
			const nextDayTime = findNextAvailableTime(tomorrowDateStr, preferredDuration, null, '', existingSlots, tourDuration, recursionDepth + 1);
			return { ...nextDayTime, suggestedNewDate: true };
		}
		
		// Use the suggested time if it doesn't conflict
		const suggestedTimeStr = suggestedStart.toTimeString().slice(0, 5);
		const hasConflict = existingSlots.some((slot: any) => {
			const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
			if (slotDate !== targetDate) return false;
			
			const slotStart = new Date(slot.startTime);
			const slotEnd = new Date(slot.endTime);
			const checkStart = new Date(`${targetDate}T${suggestedTimeStr}:00`);
			const checkEnd = new Date(checkStart.getTime() + durationMs);
			
			return checkStart < slotEnd && checkEnd > slotStart;
		});
		
		if (!hasConflict) {
			const end = new Date(suggestedStart.getTime() + durationMs);
			return { 
				startTime: suggestedTimeStr, 
				endTime: end.toTimeString().slice(0, 5),
				suggestedNewDate: false
			};
		}
	}
	
	// For today, start from next hour rounded up
	let defaultStart = '10:00';
	if (isToday) {
		const now = new Date();
		const nextHour = new Date(now);
		nextHour.setHours(now.getHours() + 1, 0, 0, 0);
		if (nextHour.getHours() < 22) { // Don't go past 10 PM
			defaultStart = nextHour.toTimeString().slice(0, 5);
		}
	}
	
	if (!existingSlots.length) {
		// No existing slots, use smart defaults
		const start = new Date(`2000-01-01T${defaultStart}:00`);
		const end = new Date(start.getTime() + durationMs);
		return { startTime: defaultStart, endTime: end.toTimeString().slice(0, 5), suggestedNewDate: false };
	}
	
	// Get existing slots for this date, sorted by start time
	const sameDaySlots = existingSlots
		.filter((slot: any) => {
			const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
			return slotDate === targetDate;
		})
		.map((slot: any) => ({
			start: new Date(slot.startTime),
			end: new Date(slot.endTime)
		}))
		.sort((a: {start: Date}, b: {start: Date}) => a.start.getTime() - b.start.getTime());
	
	if (sameDaySlots.length === 0) {
		// No slots on this date, use smart defaults
		const start = new Date(`2000-01-01T${defaultStart}:00`);
		const end = new Date(start.getTime() + durationMs);
		return { 
			startTime: defaultStart, 
			endTime: end.toTimeString().slice(0, 5),
			suggestedNewDate: false
		};
	}
	
	// Try to find a gap between slots or after all slots
	const baseDate = `${targetDate}T`;
	
	// Start with smart time based on whether it's today
	let candidateStart = new Date(`${baseDate}${defaultStart}:00`);
	
	// If today, ensure we start from current time
	if (isToday) {
		const now = new Date();
		const todayCandidate = new Date(`${baseDate}${now.toTimeString().slice(0, 5)}:00`);
		if (todayCandidate > candidateStart) {
			candidateStart = todayCandidate;
			// Round up to next 30 minutes
			const minutes = candidateStart.getMinutes();
			if (minutes > 0 && minutes < 30) {
				candidateStart.setMinutes(30);
			} else if (minutes > 30) {
				candidateStart.setHours(candidateStart.getHours() + 1, 0, 0, 0);
			}
		}
	}
	
	// Check each potential time slot
	for (let attempt = 0; attempt < 48; attempt++) { // 48 = 24 hours * 2 (30-min intervals)
		const candidateEnd = new Date(candidateStart.getTime() + durationMs);
		
		// Check if this time conflicts with any existing slot
		const hasConflict = sameDaySlots.some((slot: {start: Date, end: Date}) => {
			// Add a small buffer (1 minute) to avoid edge cases
			const slotStartWithBuffer = new Date(slot.start.getTime() - 60000);
			const slotEndWithBuffer = new Date(slot.end.getTime() + 60000);
			return candidateStart < slotEndWithBuffer && candidateEnd > slotStartWithBuffer;
		});
		
		if (!hasConflict && candidateStart.getHours() < 22) {
			// Found a free slot!
			return {
				startTime: candidateStart.toTimeString().slice(0, 5),
				endTime: candidateEnd.toTimeString().slice(0, 5),
				suggestedNewDate: false
			};
		}
		
		// Move to next 30-minute interval
		candidateStart = new Date(candidateStart.getTime() + 30 * 60000);
		
		// Don't go past 10 PM
		if (candidateStart.getHours() >= 22) break;
	}
	
	// Prevent infinite recursion - if we've checked more than 7 days, just return a default
	if (recursionDepth >= 7) {
		return {
			startTime: '10:00',
			endTime: getEndTimeFromDuration('10:00', duration),
			suggestedNewDate: true
		};
	}
	
	// If no slot found on this date, suggest the next day
	const tomorrow = new Date(targetDateObj);
	tomorrow.setDate(tomorrow.getDate() + 1);
	const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
	
	// Check if there are any slots on the next day
	const tomorrowSlots = existingSlots.filter((slot: any) => {
		const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
		return slotDate === tomorrowDateStr;
	});
	
	if (tomorrowSlots.length === 0) {
		// No slots on tomorrow, use default time
		return {
			startTime: '10:00',
			endTime: getEndTimeFromDuration('10:00', duration),
			suggestedNewDate: true
		};
	}
	
	// Recursively find available slot on next day, but mark it as suggested new date
	const nextDayResult = findNextAvailableTime(tomorrowDateStr, preferredDuration, null, '', existingSlots, tourDuration, recursionDepth + 1);
	return {
		...nextDayResult,
		suggestedNewDate: true
	};
}

export function checkConflicts(
	date: string,
	startTime: string,
	endTime: string,
	existingSlots: any[]
): TimeSlotConflict[] {
	if (!date || !startTime || !endTime) return [];
	
	const newStart = new Date(`${date}T${startTime}:00`);
	const newEnd = new Date(`${date}T${endTime}:00`);
	
	return existingSlots.filter((slot: any) => {
		const slotStart = new Date(slot.startTime);
		const slotEnd = new Date(slot.endTime);
		
		// Check if times overlap
		return (newStart < slotEnd && newEnd > slotStart);
	});
}

export function getEndTimeFromDuration(startTime: string, duration: number): string {
	if (!startTime || !duration) return '';
	
	const start = new Date(`2000-01-01T${startTime}:00`);
	const end = new Date(start.getTime() + duration * 60000);
	return end.toTimeString().slice(0, 5);
} 
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
	
	if (!targetDate) {
		const defaultStart = '10:00';
		const start = new Date(`2000-01-01T${defaultStart}:00`);
		const end = new Date(start.getTime() + durationMs);
		return { startTime: defaultStart, endTime: end.toTimeString().slice(0, 5), suggestedNewDate: false };
	}
	
	// Check if it's today and we need to avoid past times
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const targetDateObj = new Date(targetDate);
	targetDateObj.setHours(0, 0, 0, 0);
	const isToday = targetDateObj.getTime() === today.getTime();
	
	// If we just created a slot, suggest next time with break
	if (lastCreatedTime && lastCreatedDate === targetDate) {
		const lastTime = new Date(`2000-01-01T${lastCreatedTime}:00`);
		const suggestedStart = new Date(lastTime.getTime() + durationMs + breakTime);
		
		// If suggested time is before 8 PM, check if it conflicts
		if (suggestedStart.getHours() < 20) {
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
	}
	
	// Search for available slots (check up to 14 days to handle multi-day conflicts)
	for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
		const searchDate = new Date(targetDate);
		searchDate.setDate(searchDate.getDate() + dayOffset);
		const searchDateStr = searchDate.toISOString().split('T')[0];
		const suggestedNewDate = dayOffset > 0;
		
		// Determine start time for this day
		let startTime = '10:00';
		const isSearchToday = searchDate.getTime() === today.getTime();
		
		if (isSearchToday) {
			const now = new Date();
			const nextHour = new Date(now);
			nextHour.setHours(now.getHours() + 1, 0, 0, 0);
			if (nextHour.getHours() < 22) {
				startTime = nextHour.toTimeString().slice(0, 5);
			} else {
				// Too late today, skip to tomorrow
				continue;
			}
		}
		
		// Get existing slots for this date only
		const sameDaySlots = existingSlots
			.filter((slot: any) => {
				const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
				return slotDate === searchDateStr;
			})
			.map((slot: any) => ({
				start: new Date(slot.startTime),
				end: new Date(slot.endTime)
			}))
			.sort((a, b) => a.start.getTime() - b.start.getTime());
		
		// If no slots on this day, use default start time
		if (sameDaySlots.length === 0) {
			return {
				startTime,
				endTime: getEndTimeFromDuration(startTime, duration),
				suggestedNewDate
			};
		}
		
		// Try to find a gap
		const baseDate = `${searchDateStr}T`;
		let candidateStart = new Date(`${baseDate}${startTime}:00`);
		
		// Check 30-minute intervals until 10 PM
		while (candidateStart.getHours() < 22) {
			const candidateEnd = new Date(candidateStart.getTime() + durationMs);
			
			// Quick conflict check - only check same-day slots
			const hasConflict = sameDaySlots.some((slot) => {
				// Add 1-minute buffer to avoid edge cases
				const slotStart = new Date(slot.start.getTime() - 60000);
				const slotEnd = new Date(slot.end.getTime() + 60000);
				return candidateStart < slotEnd && candidateEnd > slotStart;
			});
			
			if (!hasConflict) {
				return {
					startTime: candidateStart.toTimeString().slice(0, 5),
					endTime: candidateEnd.toTimeString().slice(0, 5),
					suggestedNewDate
				};
			}
			
			// Move to next 30-minute interval
			candidateStart = new Date(candidateStart.getTime() + 30 * 60000);
		}
	}
	
	// Fallback: return a slot 14 days in the future
	const futureDate = new Date(targetDate);
	futureDate.setDate(futureDate.getDate() + 14);
	
	return {
		startTime: '10:00',
		endTime: getEndTimeFromDuration('10:00', duration),
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
	
	const [startHour, startMinute] = startTime.split(':').map(Number);
	const [endHour, endMinute] = endTime.split(':').map(Number);
	
	const startMinutes = startHour * 60 + startMinute;
	const endMinutes = endHour * 60 + endMinute;
	
	// Check if the new slot spans midnight
	const spansMidnight = endMinutes < startMinutes;
	
	const newStart = new Date(`${date}T${startTime}:00`);
	let newEnd: Date;
	
	if (spansMidnight) {
		// If slot spans midnight, end time is on the next day
		const nextDay = new Date(date);
		nextDay.setDate(nextDay.getDate() + 1);
		const nextDayStr = nextDay.toISOString().split('T')[0];
		newEnd = new Date(`${nextDayStr}T${endTime}:00`);
	} else {
		newEnd = new Date(`${date}T${endTime}:00`);
	}
	
	return existingSlots.filter((slot: any) => {
		const slotStart = new Date(slot.startTime);
		const slotEnd = new Date(slot.endTime);
		
		// Check if times overlap
		return (newStart < slotEnd && newEnd > slotStart);
	});
}

export function checkRecurringConflicts(
	formData: any,
	existingSlots: any[]
): {hasConflicts: boolean, conflictCount: number} {
	if (!formData.recurring || !formData.date || !formData.startTime || !formData.endTime) {
		return {hasConflicts: false, conflictCount: 0};
	}
	
	let conflictCount = 0;
	let currentDate = new Date(formData.date);
	const endDate = formData.recurringEnd ? new Date(formData.recurringEnd) : null;
	let count = 0;
	const maxCount = endDate ? 365 : (formData.recurringCount || 1);
	
	while (count < maxCount && (!endDate || currentDate <= endDate)) {
		const dateStr = currentDate.toISOString().split('T')[0];
		const conflicts = checkConflicts(dateStr, formData.startTime, formData.endTime, existingSlots);
		
		if (conflicts.length > 0) {
			conflictCount++;
		}
		
		// Increment date based on recurring type
		switch (formData.recurringType) {
			case 'daily':
				currentDate.setDate(currentDate.getDate() + 1);
				break;
			case 'weekly':
				currentDate.setDate(currentDate.getDate() + 7);
				break;
			case 'monthly':
				currentDate.setMonth(currentDate.getMonth() + 1);
				break;
		}
		
		count++;
	}
	
	return {
		hasConflicts: conflictCount > 0,
		conflictCount
	};
}

export function getEndTimeFromDuration(startTime: string, duration: number): string {
	if (!startTime || !duration) return '';
	
	const start = new Date(`2000-01-01T${startTime}:00`);
	const end = new Date(start.getTime() + duration * 60000);
	return end.toTimeString().slice(0, 5);
} 
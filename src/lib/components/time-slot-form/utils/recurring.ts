import type { RecurringPreview, TimeSlotFormData } from '../types.js';
import { formatDate } from '$lib/utils/date-helpers.js';

export function getRecurringPreview(formData: TimeSlotFormData): RecurringPreview[] {
	if (!formData.recurring || !formData.date || !formData.startTime) return [];
	
	const slots: RecurringPreview[] = [];
	let currentDate = new Date(`${formData.date}T${formData.startTime}:00`);
	const endDate = formData.recurringEnd ? new Date(formData.recurringEnd) : null;
	let count = 0;
	
	// If using end date, allow up to 365 slots (but limit preview to 20)
	// If using count, use the specified count (but limit preview to 10)
	const maxCount = endDate 
		? Math.min(365, 20) // End date mode: allow many but limit preview
		: Math.min(formData.recurringCount || 1, 10); // Count mode: use specified count
	
	while (count < maxCount && (!endDate || currentDate <= endDate)) {
		slots.push({
			date: currentDate.toISOString().split('T')[0],
			startTime: currentDate.toTimeString().slice(0, 5)
		});
		
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
	
	return slots;
}

export function getRecurringText(formData: TimeSlotFormData): string {
	if (!formData.recurring) return '';
	
	const pattern = formData.recurringType;
	const endDate = formData.recurringEnd;
	const count = formData.recurringCount;
	
	if (endDate) {
		return `${pattern} until ${formatDate(endDate)}`;
	} else if (count && count > 1) {
		return `${pattern} for ${count} occurrences`;
	}
	
	return pattern;
}

export function getActualRecurringCount(formData: TimeSlotFormData): number {
	if (!formData.recurring || !formData.date || !formData.startTime) return 0;
	
	if (!formData.recurringEnd) {
		return formData.recurringCount || 1;
	}
	
	// Calculate actual count based on end date
	let currentDate = new Date(`${formData.date}T${formData.startTime}:00`);
	const endDate = new Date(formData.recurringEnd);
	let count = 0;
	const maxCount = 365; // Safety limit
	
	while (currentDate <= endDate && count < maxCount) {
		count++;
		
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
	}
	
	return count;
}

export function getActualRecurringEndDate(formData: TimeSlotFormData): string {
	if (!formData.recurring || !formData.date || !formData.startTime) return '';
	
	// If using end date, return that date
	if (formData.recurringEnd) {
		return formData.recurringEnd;
	}
	
	// If using count, calculate the actual end date
	const count = formData.recurringCount || 1;
	if (count <= 1) return formData.date;
	
	let currentDate = new Date(`${formData.date}T${formData.startTime}:00`);
	
	// Calculate the last slot date
	for (let i = 1; i < count; i++) {
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
	}
	
	return currentDate.toISOString().split('T')[0];
} 
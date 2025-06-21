import { type ValidationError } from '$lib/validation.js';
import type { TimeSlotFormData } from '../types.js';

export function validateField(
	fieldName: string,
	formData: TimeSlotFormData,
	isEditMode: boolean,
	currentSlot?: any
): ValidationError | null {
	switch (fieldName) {
		case 'date':
			if (!formData.date) {
				return { field: 'date', message: 'Date is required' };
			} else if (!isEditMode) {
				// Check if date is in the past (only for create mode)
				const selectedDate = new Date(formData.date);
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				if (selectedDate < today) {
					return { field: 'date', message: 'Cannot create slots in the past' };
				}
			}
			break;
			
		case 'startTime':
			if (!formData.startTime) {
				return { field: 'startTime', message: 'Start time is required' };
			} else if (!isEditMode && formData.date) {
				// Check if time is in the past for today's date
				const selectedDate = new Date(formData.date);
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				selectedDate.setHours(0, 0, 0, 0);
				
				if (selectedDate.getTime() === today.getTime()) {
					// It's today, check if time is in the past
					const now = new Date();
					const selectedTime = new Date(`${formData.date}T${formData.startTime}:00`);
					if (selectedTime < now) {
						return { field: 'startTime', message: 'Cannot create slots in the past' };
					}
				}
			}
			break;
			
		case 'endTime':
			if (!formData.endTime) {
				return { field: 'endTime', message: 'End time is required' };
			} else if (formData.startTime && formData.endTime <= formData.startTime) {
				return { field: 'endTime', message: 'End time must be after start time' };
			}
			break;
			
		case 'capacity':
			const minCapacity = isEditMode && currentSlot?.bookedSpots ? currentSlot.bookedSpots : 1;
			if (!formData.capacity || formData.capacity < minCapacity) {
				return { 
					field: 'capacity', 
					message: `Capacity must be at least ${minCapacity}${isEditMode && currentSlot?.bookedSpots ? ' (current bookings)' : ''}` 
				};
			} else if (formData.capacity > 500) {
				return { field: 'capacity', message: 'Capacity cannot exceed 500' };
			}
			break;
	}
	
	return null;
}

export function validateForm(
	formData: TimeSlotFormData,
	isEditMode: boolean,
	currentSlot?: any
): ValidationError[] {
	const errors: ValidationError[] = [];
	const fields = ['date', 'startTime', 'endTime', 'capacity'];
	
	for (const field of fields) {
		const error = validateField(field, formData, isEditMode, currentSlot);
		if (error) {
			errors.push(error);
		}
	}
	
	// Additional time logic validation
	if (formData.date && formData.startTime && formData.endTime) {
		const start = new Date(`${formData.date}T${formData.startTime}:00`);
		const end = new Date(`${formData.date}T${formData.endTime}:00`);
		
		if (end <= start) {
			errors.push({ field: 'endTime', message: 'End time must be after start time' });
		}
	}
	
	return errors;
} 
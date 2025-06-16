import type { Tour, TimeSlot } from './types.js';

export interface ValidationError {
	field: string;
	message: string;
}

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

export interface TourFormData {
	name: string;
	description: string;
	price: number;
	duration: number;
	capacity: number;
	status: Tour['status'];
	category: string;
	location: string;
	includedItems: string[];
	requirements: string[];
	cancellationPolicy: string;
	enablePricingTiers?: boolean;
	pricingTiers?: {
		adult: number;
		child?: number;
	};
}

export interface TimeSlotFormData {
	startDate: string;
	startTime: string;
	endTime: string;
	availableSpots: number;
	isRecurring: boolean;
	recurringPattern: TimeSlot['recurringPattern'];
	recurringEnd: string;
}

// Validation rules
const VALIDATION_RULES = {
	name: {
		required: true,
		minLength: 3,
		maxLength: 100
	},
	description: {
		required: true,
		minLength: 20,
		maxLength: 2000
	},
	price: {
		required: true,
		min: 0.5,
		max: 10000
	},
	duration: {
		required: true,
		min: 15,
		max: 1440 // 24 hours
	},
	capacity: {
		required: true,
		min: 1,
		max: 100
	},
	category: {
		required: false,
		maxLength: 50
	},
	location: {
		required: false,
		maxLength: 100
	},
	includedItems: {
		required: false,
		maxItems: 20,
		itemMaxLength: 200
	},
	requirements: {
		required: false,
		maxItems: 20,
		itemMaxLength: 200
	},
	cancellationPolicy: {
		required: false,
		maxLength: 1000
	}
};

// Valid categories
const VALID_CATEGORIES = ['walking', 'food', 'cultural', 'historical', 'art', 'adventure', 'other'];

// Valid statuses
const VALID_STATUSES: Tour['status'][] = ['draft', 'active'];

// Time slot validation rules
const TIME_SLOT_VALIDATION_RULES = {
	startDate: {
		required: true
	},
	startTime: {
		required: true
	},
	endTime: {
		required: true
	},
	availableSpots: {
		required: true,
		min: 1,
		max: 100
	},
	recurringEnd: {
		required: false
	}
};

// Valid recurring patterns
const VALID_RECURRING_PATTERNS: TimeSlot['recurringPattern'][] = ['daily', 'weekly', 'monthly'];

export function validateTourForm(data: Partial<TourFormData>): ValidationResult {
	const errors: ValidationError[] = [];

	// Validate name
	if (!data.name || data.name.trim() === '') {
		errors.push({ field: 'name', message: 'Tour name is required' });
	} else {
		const name = data.name.trim();
		if (name.length < VALIDATION_RULES.name.minLength) {
			errors.push({ field: 'name', message: `Tour name must be at least ${VALIDATION_RULES.name.minLength} characters` });
		}
		if (name.length > VALIDATION_RULES.name.maxLength) {
			errors.push({ field: 'name', message: `Tour name must be no more than ${VALIDATION_RULES.name.maxLength} characters` });
		}
	}

	// Validate description
	if (!data.description || data.description.trim() === '') {
		errors.push({ field: 'description', message: 'Tour description is required' });
	} else {
		const description = data.description.trim();
		if (description.length < VALIDATION_RULES.description.minLength) {
			errors.push({ field: 'description', message: `Description must be at least ${VALIDATION_RULES.description.minLength} characters` });
		}
		if (description.length > VALIDATION_RULES.description.maxLength) {
			errors.push({ field: 'description', message: `Description must be no more than ${VALIDATION_RULES.description.maxLength} characters` });
		}
	}

	// Validate price (only if pricing tiers are disabled)
	if (!data.enablePricingTiers) {
		if (data.price === undefined || data.price === null) {
			errors.push({ field: 'price', message: 'Price is required' });
		} else {
			if (data.price < VALIDATION_RULES.price.min) {
				errors.push({ field: 'price', message: `Price must be at least €${VALIDATION_RULES.price.min}` });
			}
			if (data.price > VALIDATION_RULES.price.max) {
				errors.push({ field: 'price', message: `Price must be no more than €${VALIDATION_RULES.price.max}` });
			}
		}
	}

	// Validate pricing tiers (if enabled)
	if (data.enablePricingTiers) {
		if (!data.pricingTiers) {
			errors.push({ field: 'pricingTiers', message: 'Pricing tiers are required when enabled' });
		} else {
			// Validate adult price
			if (data.pricingTiers.adult === undefined || data.pricingTiers.adult === null) {
				errors.push({ field: 'pricingTiers.adult', message: 'Adult price is required' });
			} else {
				if (data.pricingTiers.adult < VALIDATION_RULES.price.min) {
					errors.push({ field: 'pricingTiers.adult', message: `Adult price must be at least €${VALIDATION_RULES.price.min}` });
				}
				if (data.pricingTiers.adult > VALIDATION_RULES.price.max) {
					errors.push({ field: 'pricingTiers.adult', message: `Adult price must be no more than €${VALIDATION_RULES.price.max}` });
				}
			}

			// Validate child price (optional, but if provided must be valid)
			if (data.pricingTiers.child !== undefined && data.pricingTiers.child !== null) {
				if (data.pricingTiers.child < 0) {
					errors.push({ field: 'pricingTiers.child', message: 'Child price cannot be negative' });
				}
				if (data.pricingTiers.child > VALIDATION_RULES.price.max) {
					errors.push({ field: 'pricingTiers.child', message: `Child price must be no more than €${VALIDATION_RULES.price.max}` });
				}
			}
		}
	}

	// Validate duration
	if (data.duration === undefined || data.duration === null) {
		errors.push({ field: 'duration', message: 'Duration is required' });
	} else {
		if (data.duration < VALIDATION_RULES.duration.min) {
			errors.push({ field: 'duration', message: `Duration must be at least ${VALIDATION_RULES.duration.min} minutes` });
		}
		if (data.duration > VALIDATION_RULES.duration.max) {
			errors.push({ field: 'duration', message: `Duration must be no more than ${VALIDATION_RULES.duration.max} minutes` });
		}
	}

	// Validate capacity
	if (data.capacity === undefined || data.capacity === null) {
		errors.push({ field: 'capacity', message: 'Capacity is required' });
	} else {
		if (data.capacity < VALIDATION_RULES.capacity.min) {
			errors.push({ field: 'capacity', message: `Capacity must be at least ${VALIDATION_RULES.capacity.min} person` });
		}
		if (data.capacity > VALIDATION_RULES.capacity.max) {
			errors.push({ field: 'capacity', message: `Capacity must be no more than ${VALIDATION_RULES.capacity.max} people` });
		}
	}

	// Validate status
	if (data.status && !VALID_STATUSES.includes(data.status)) {
		errors.push({ field: 'status', message: 'Invalid tour status' });
	}

	// Validate category (optional)
	if (data.category && data.category.trim() !== '') {
		if (!VALID_CATEGORIES.includes(data.category)) {
			errors.push({ field: 'category', message: 'Invalid category selected' });
		}
	}

	// Validate location (optional)
	if (data.location && data.location.length > VALIDATION_RULES.location.maxLength!) {
		errors.push({ field: 'location', message: `Location must be no more than ${VALIDATION_RULES.location.maxLength} characters` });
	}

	// Validate included items
	if (data.includedItems) {
		const nonEmptyItems = data.includedItems.filter(item => item.trim() !== '');
		if (nonEmptyItems.length > VALIDATION_RULES.includedItems.maxItems!) {
			errors.push({ field: 'includedItems', message: `Maximum ${VALIDATION_RULES.includedItems.maxItems} included items allowed` });
		}
		nonEmptyItems.forEach((item, index) => {
			if (item.length > VALIDATION_RULES.includedItems.itemMaxLength!) {
				errors.push({ field: `includedItems.${index}`, message: `Included item must be no more than ${VALIDATION_RULES.includedItems.itemMaxLength} characters` });
			}
		});
	}

	// Validate requirements
	if (data.requirements) {
		const nonEmptyRequirements = data.requirements.filter(req => req.trim() !== '');
		if (nonEmptyRequirements.length > VALIDATION_RULES.requirements.maxItems!) {
			errors.push({ field: 'requirements', message: `Maximum ${VALIDATION_RULES.requirements.maxItems} requirements allowed` });
		}
		nonEmptyRequirements.forEach((req, index) => {
			if (req.length > VALIDATION_RULES.requirements.itemMaxLength!) {
				errors.push({ field: `requirements.${index}`, message: `Requirement must be no more than ${VALIDATION_RULES.requirements.itemMaxLength} characters` });
			}
		});
	}

	// Validate cancellation policy (optional)
	if (data.cancellationPolicy && data.cancellationPolicy.length > VALIDATION_RULES.cancellationPolicy.maxLength!) {
		errors.push({ field: 'cancellationPolicy', message: `Cancellation policy must be no more than ${VALIDATION_RULES.cancellationPolicy.maxLength} characters` });
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

export function validateTimeSlotForm(data: Partial<TimeSlotFormData>, tourCapacity?: number): ValidationResult {
	const errors: ValidationError[] = [];

	// Validate start date
	if (!data.startDate || data.startDate.trim() === '') {
		errors.push({ field: 'startDate', message: 'Start date is required' });
	} else {
		const startDate = new Date(data.startDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Reset time to compare just dates
		
		if (startDate < today) {
			errors.push({ field: 'startDate', message: 'Start date cannot be in the past' });
		}
		
		// Check if date is too far in the future (2 years)
		const maxDate = new Date();
		maxDate.setFullYear(maxDate.getFullYear() + 2);
		if (startDate > maxDate) {
			errors.push({ field: 'startDate', message: 'Start date cannot be more than 2 years in the future' });
		}
	}

	// Validate start time
	if (!data.startTime || data.startTime.trim() === '') {
		errors.push({ field: 'startTime', message: 'Start time is required' });
	}

	// Validate end time
	if (!data.endTime || data.endTime.trim() === '') {
		errors.push({ field: 'endTime', message: 'End time is required' });
	}

	// Validate start time vs end time
	if (data.startTime && data.endTime && data.startDate) {
		const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
		const endDateTime = new Date(`${data.startDate}T${data.endTime}`);
		
		if (endDateTime <= startDateTime) {
			errors.push({ field: 'endTime', message: 'End time must be after start time' });
		}
		
		// Check minimum duration (15 minutes)
		const durationMs = endDateTime.getTime() - startDateTime.getTime();
		const durationMinutes = durationMs / (1000 * 60);
		
		if (durationMinutes < 15) {
			errors.push({ field: 'endTime', message: 'Duration must be at least 15 minutes' });
		}
		
		// Check maximum duration (24 hours)
		if (durationMinutes > 1440) {
			errors.push({ field: 'endTime', message: 'Duration cannot exceed 24 hours' });
		}
	}

	// Validate available spots
	if (data.availableSpots === undefined || data.availableSpots === null) {
		errors.push({ field: 'availableSpots', message: 'Available spots is required' });
	} else {
		if (data.availableSpots < TIME_SLOT_VALIDATION_RULES.availableSpots.min) {
			errors.push({ field: 'availableSpots', message: `Available spots must be at least ${TIME_SLOT_VALIDATION_RULES.availableSpots.min}` });
		}
		if (data.availableSpots > TIME_SLOT_VALIDATION_RULES.availableSpots.max) {
			errors.push({ field: 'availableSpots', message: `Available spots must be no more than ${TIME_SLOT_VALIDATION_RULES.availableSpots.max}` });
		}
		
		// Check against tour capacity if provided
		if (tourCapacity && data.availableSpots > tourCapacity) {
			errors.push({ field: 'availableSpots', message: `Available spots cannot exceed tour capacity (${tourCapacity})` });
		}
	}

	// Validate recurring pattern
	if (data.isRecurring && data.recurringPattern && !VALID_RECURRING_PATTERNS.includes(data.recurringPattern)) {
		errors.push({ field: 'recurringPattern', message: 'Invalid recurring pattern' });
	}

	// Validate recurring end date
	if (data.isRecurring && data.recurringEnd && data.recurringEnd.trim() !== '') {
		const recurringEndDate = new Date(data.recurringEnd);
		const startDate = new Date(data.startDate || '');
		
		if (recurringEndDate <= startDate) {
			errors.push({ field: 'recurringEnd', message: 'Recurring end date must be after start date' });
		}
		
		// Check if recurring end is too far in the future (2 years from start)
		const maxRecurringEnd = new Date(startDate);
		maxRecurringEnd.setFullYear(maxRecurringEnd.getFullYear() + 2);
		if (recurringEndDate > maxRecurringEnd) {
			errors.push({ field: 'recurringEnd', message: 'Recurring end date cannot be more than 2 years from start date' });
		}
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

// Helper function to get error message for a specific field
export function getFieldError(errors: ValidationError[], fieldName: string): string | null {
	const error = errors.find(err => err.field === fieldName);
	return error ? error.message : null;
}

// Helper function to check if a field has an error
export function hasFieldError(errors: ValidationError[], fieldName: string): boolean {
	return errors.some(err => err.field === fieldName);
}

// Sanitize and clean form data
export function sanitizeTourFormData(data: any): TourFormData {
	return {
		name: String(data.name || '').trim(),
		description: String(data.description || '').trim(),
		price: Number(data.price) || 0,
		duration: Number(data.duration) || 60,
		capacity: Number(data.capacity) || 1,
		status: (data.status as Tour['status']) || 'draft',
		category: String(data.category || '').trim(),
		location: String(data.location || '').trim(),
		includedItems: Array.isArray(data.includedItems) ? data.includedItems.map((item: any) => String(item).trim()).filter((item: string) => item !== '') : [],
		requirements: Array.isArray(data.requirements) ? data.requirements.map((req: any) => String(req).trim()).filter((req: string) => req !== '') : [],
		cancellationPolicy: String(data.cancellationPolicy || '').trim(),
		enablePricingTiers: Boolean(data.enablePricingTiers),
		pricingTiers: data.pricingTiers ? {
			adult: Number(data.pricingTiers.adult) || 0,
			child: Number(data.pricingTiers.child) || 0
		} : undefined
	};
}

export function sanitizeTimeSlotFormData(data: any): TimeSlotFormData {
	return {
		startDate: String(data.startDate || '').trim(),
		startTime: String(data.startTime || '').trim(),
		endTime: String(data.endTime || '').trim(),
		availableSpots: Number(data.availableSpots) || 1,
		isRecurring: Boolean(data.isRecurring),
		recurringPattern: (data.recurringPattern as TimeSlot['recurringPattern']) || 'weekly',
		recurringEnd: String(data.recurringEnd || '').trim()
	};
} 
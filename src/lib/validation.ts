import type { Tour } from './types.js';

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
const VALID_STATUSES: Tour['status'][] = ['draft', 'active', 'inactive'];

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

	// Validate price
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
		cancellationPolicy: String(data.cancellationPolicy || '').trim()
	};
} 
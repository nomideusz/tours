import type { Tour, TimeSlot } from './types.js';
import { get } from 'svelte/store';
import { userCurrency } from '$lib/stores/currency.js';
import { getMinimumChargeAmount, getCurrencySymbol } from '$lib/utils/currency.js';
import { sanitizeLocation } from '$lib/utils/location.js';

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
	categories: string[];
	location: string;
	languages?: string[];
	includedItems: string[];
	requirements: string[];
	cancellationPolicy: string;
	cancellationPolicyId?: string;
	pricingModel?: 'per_person' | 'participant_categories' | 'group_tiers' | 'private_tour';
	enablePricingTiers?: boolean;
	pricingTiers?: {
		adult: number;
		child?: number;
	};
	participantCategories?: {
		categories: Array<{
			id: string;
			label: string;
			price: number;
			ageRange?: string;
			description?: string;
			sortOrder: number;
			minAge?: number;
			maxAge?: number;
			countsTowardCapacity?: boolean;
		}>;
		minCapacity?: number;
		maxCapacity?: number;
	};
	privateTour?: {
		flatPrice: number;
		minCapacity?: number;
		maxCapacity?: number;
	};
	groupPricingTiers?: {
		tiers: Array<{
			minParticipants: number;
			maxParticipants: number;
			price: number;
			label?: string;
		}>;
		privateBooking?: boolean;
	};
	optionalAddons?: {
		addons: Array<{
			id: string;
			name: string;
			description?: string;
			price: number;
			required: boolean;
			icon?: string;
		}>;
	};
	publicListing?: string | boolean;
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
		min: 0.5, // This will be overridden by currency-specific minimum
		max: 10000
	},
	duration: {
		required: true,
		min: 15,
		max: 43200 // 30 days (30 * 24 * 60 minutes)
	},
	capacity: {
		required: true,
		min: 1,
		max: 200
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
		max: 200
	},
	recurringEnd: {
		required: false
	}
};

// Valid recurring patterns
const VALID_RECURRING_PATTERNS: TimeSlot['recurringPattern'][] = ['daily', 'weekly', 'monthly'];

export function validateTourForm(data: Partial<TourFormData>): ValidationResult {
	const errors: ValidationError[] = [];

	// Get current currency for validation
	const currency = get(userCurrency);
	const currencySymbol = getCurrencySymbol(currency);
	const minimumPrice = getMinimumChargeAmount(currency);

	// Validate name
	if (!data.name || data.name.trim() === '') {
		errors.push({ field: 'name', message: 'Tour name is required' });
	} else {
		const name = data.name.trim();
		if (name.length < VALIDATION_RULES.name.minLength) {
			errors.push({ field: 'name', message: `Minimum ${VALIDATION_RULES.name.minLength} characters` });
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
		// Count visible characters (excluding excessive whitespace)
		const visibleCharCount = description.replace(/\s+/g, ' ').trim().length;
		
		if (visibleCharCount < VALIDATION_RULES.description.minLength) {
			errors.push({ field: 'description', message: `Minimum ${VALIDATION_RULES.description.minLength} characters` });
		}
		if (visibleCharCount > VALIDATION_RULES.description.maxLength) {
			errors.push({ field: 'description', message: `Description must be no more than ${VALIDATION_RULES.description.maxLength} characters` });
		}
	}

	// Validate price (only for per_person pricing model)
	const pricingModel = data.pricingModel || 'per_person';
	if (pricingModel === 'per_person') {
		if (data.price === undefined || data.price === null) {
			errors.push({ field: 'price', message: 'Price is required' });
		} else {
			// Allow 0 for free tours
			if (data.price < 0) {
				errors.push({ field: 'price', message: 'Price cannot be negative' });
			} else if (data.price > 0 && data.price < minimumPrice) {
				errors.push({ field: 'price', message: `Minimum price for paid tours is ${currencySymbol}${minimumPrice}` });
			}
			if (data.price > VALIDATION_RULES.price.max) {
				errors.push({ field: 'price', message: `Price must be no more than ${currencySymbol}${VALIDATION_RULES.price.max}` });
			}
		}
	}


	// Validate participant categories (for participant_categories model)
	if (pricingModel === 'participant_categories') {
		if (!data.participantCategories || !data.participantCategories.categories || data.participantCategories.categories.length === 0) {
			errors.push({ field: 'participantCategories', message: 'At least one participant category is required' });
		} else {
			// Validate each category
			data.participantCategories.categories.forEach((category, index) => {
				// Label is optional, but if provided, validate length
				if (category.label && category.label.length > 50) {
					errors.push({ field: `participantCategories.categories.${index}`, message: 'Category label must be no more than 50 characters' });
				}
				if (category.price < 0) {
					errors.push({ field: `participantCategories.categories.${index}`, message: 'Category price cannot be negative' });
				}
				if (category.price > VALIDATION_RULES.price.max) {
					errors.push({ field: `participantCategories.categories.${index}`, message: `Category price must be no more than ${currencySymbol}${VALIDATION_RULES.price.max}` });
				}
				if (category.minAge !== undefined && category.minAge < 0) {
					errors.push({ field: `participantCategories.categories.${index}`, message: 'Minimum age cannot be negative' });
				}
				if (category.maxAge !== undefined && category.maxAge < 0) {
					errors.push({ field: `participantCategories.categories.${index}`, message: 'Maximum age cannot be negative' });
				}
				if (category.minAge !== undefined && category.maxAge !== undefined && category.minAge > category.maxAge) {
					errors.push({ field: `participantCategories.categories.${index}`, message: 'Minimum age cannot be greater than maximum age' });
				}
			});
			
			// Check for duplicate category IDs
			const categoryIds = data.participantCategories.categories.map(c => c.id);
			const duplicateIds = categoryIds.filter((id, index) => categoryIds.indexOf(id) !== index);
			if (duplicateIds.length > 0) {
				errors.push({ field: 'participantCategories', message: 'Duplicate category IDs found' });
			}
		}
	}

	// Validate group pricing tiers (for group_tiers model)
	if (pricingModel === 'group_tiers') {
		if (!data.groupPricingTiers || !data.groupPricingTiers.tiers || data.groupPricingTiers.tiers.length === 0) {
			errors.push({ field: 'groupPricingTiers', message: 'At least one pricing tier is required for group pricing' });
		} else {
			// Validate each tier
			data.groupPricingTiers.tiers.forEach((tier, index) => {
				if (tier.minParticipants < 1) {
					errors.push({ field: `groupPricingTiers.tiers.${index}`, message: 'Minimum participants must be at least 1' });
				}
				if (tier.maxParticipants < tier.minParticipants) {
					errors.push({ field: `groupPricingTiers.tiers.${index}`, message: 'Maximum participants must be greater than or equal to minimum' });
				}
				if (tier.price < 0) {
					errors.push({ field: `groupPricingTiers.tiers.${index}`, message: 'Tier price cannot be negative' });
				}
				if (tier.price > VALIDATION_RULES.price.max) {
					errors.push({ field: `groupPricingTiers.tiers.${index}`, message: `Tier price must be no more than ${currencySymbol}${VALIDATION_RULES.price.max}` });
				}
				// Validate that tier max doesn't exceed capacity
				if (data.capacity && tier.maxParticipants > data.capacity) {
					errors.push({ field: `groupPricingTiers.tiers.${index}`, message: `Tier maximum (${tier.maxParticipants}) cannot exceed tour capacity (${data.capacity})` });
				}
			});
		}
	}

	// Validate optional add-ons (available for all models)
	if (data.optionalAddons?.addons && data.optionalAddons.addons.length > 0) {
		data.optionalAddons.addons.forEach((addon, index) => {
			if (!addon.name || addon.name.trim().length === 0) {
				errors.push({ field: `optionalAddons.addons.${index}`, message: 'Add-on name is required' });
			}
			if (addon.price < 0) {
				errors.push({ field: `optionalAddons.addons.${index}`, message: 'Add-on price cannot be negative' });
			}
			if (addon.price > VALIDATION_RULES.price.max) {
				errors.push({ field: `optionalAddons.addons.${index}`, message: `Add-on price must be no more than ${currencySymbol}${VALIDATION_RULES.price.max}` });
			}
		});
	}

	// Validate duration
	if (data.duration === undefined || data.duration === null) {
		errors.push({ field: 'duration', message: 'Duration is required' });
	} else {
		if (data.duration < VALIDATION_RULES.duration.min) {
			errors.push({ field: 'duration', message: `Duration must be at least ${VALIDATION_RULES.duration.min} minutes` });
		}
		if (data.duration > VALIDATION_RULES.duration.max) {
			errors.push({ field: 'duration', message: `Duration cannot exceed 30 days (${VALIDATION_RULES.duration.max} minutes)` });
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

	// Validate languages
	if (!data.languages || data.languages.length === 0) {
		errors.push({ field: 'languages', message: 'At least one language must be selected' });
	}
	
	// Validate status
	if (data.status && !VALID_STATUSES.includes(data.status)) {
		errors.push({ field: 'status', message: 'Invalid tour status' });
	}

	// Validate categories (optional) - allow custom categories
	if (data.categories && Array.isArray(data.categories)) {
		if (data.categories.length > 5) {
			errors.push({ field: 'categories', message: 'Maximum 5 categories allowed' });
		}
		
		for (const category of data.categories) {
			if (typeof category !== 'string') {
				errors.push({ field: 'categories', message: 'All categories must be text' });
				break;
			}
			const trimmedCategory = category.trim();
			if (trimmedCategory === '') {
				errors.push({ field: 'categories', message: 'Categories cannot be empty' });
				break;
			}
			if (trimmedCategory.length > VALIDATION_RULES.category.maxLength!) {
				errors.push({ field: 'categories', message: `Each category must be no more than ${VALIDATION_RULES.category.maxLength} characters` });
				break;
			}
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
		
		// Check maximum duration (30 days)
		if (durationMinutes > 43200) {
			errors.push({ field: 'endTime', message: 'Duration cannot exceed 30 days' });
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
		categories: Array.isArray(data.categories) ? data.categories.map((cat: any) => String(cat).trim()).filter((cat: string) => cat !== '') : [],
		location: sanitizeLocation(String(data.location || '')),
		languages: Array.isArray(data.languages) ? data.languages.filter((lang: any) => typeof lang === 'string' && lang.trim()) : ['en'],
		includedItems: Array.isArray(data.includedItems) ? data.includedItems.map((item: any) => String(item).trim()).filter((item: string) => item !== '') : [],
		requirements: Array.isArray(data.requirements) ? data.requirements.map((req: any) => String(req).trim()).filter((req: string) => req !== '') : [],
		cancellationPolicy: String(data.cancellationPolicy || '').trim(),
		cancellationPolicyId: data.cancellationPolicyId ? String(data.cancellationPolicyId).trim() : undefined,
		pricingModel: data.pricingModel || 'participant_categories',
		enablePricingTiers: Boolean(data.enablePricingTiers),
		pricingTiers: data.pricingTiers ? {
			adult: Number(data.pricingTiers.adult) || 0,
			child: Number(data.pricingTiers.child) || 0
		} : undefined,
		participantCategories: data.participantCategories,
		privateTour: data.privateTour,
		groupPricingTiers: data.groupPricingTiers,
		groupDiscounts: data.groupDiscounts,
		optionalAddons: data.optionalAddons,
		guidePaysStripeFee: data.guidePaysStripeFee,
		countInfantsTowardCapacity: data.countInfantsTowardCapacity,
		publicListing: data.publicListing
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
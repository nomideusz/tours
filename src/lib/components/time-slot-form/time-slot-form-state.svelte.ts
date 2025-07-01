import type { TimeSlotFormData, TimeSlotConflict } from './types.js';
import { validateTourForm, type ValidationError } from '$lib/validation.js';

// Initial form data
const initialFormData: TimeSlotFormData = {
	date: '',
	startTime: '',
	endTime: '',
	capacity: 10,
	availability: 'available',
	notes: '',
	recurring: false,
	recurringType: 'weekly',
	recurringEnd: '',
	recurringCount: 2
};

// Create form state
export function createTimeSlotFormState() {
	// Form data
	let formData = $state<TimeSlotFormData>({ ...initialFormData });
	
	// UI state
	let isSubmitting = $state(false);
	let isDeleting = $state(false);
	let isAddingAnother = $state(false);
	let showDeleteConfirm = $state(false);
	
	// Success tracking
	let justCreatedSlot = $state(false);
	let lastCreatedDate = $state('');
	let lastCreatedStartTime = $state('');
	let slotsCreated = $state(1);
	
	// Validation state
	let validationErrors = $state<Array<{ field: string; message: string }>>([]);
	let touchedFields = $state<Set<string>>(new Set());
	let error = $state<string | null>(null);
	let conflicts = $state<Array<any>>([]);
	
	// Custom duration tracking
	let customDuration = $state<number | null>(null);
	let initialDefaults = $state(false);
	
	// Helper functions
	function setFormData(data: Partial<TimeSlotFormData>) {
		Object.assign(formData, data);
	}
	
	function resetForm() {
		formData = { ...initialFormData };
		touchedFields.clear();
		validationErrors.length = 0;
		error = null;
		conflicts.length = 0;
		customDuration = null;
		initialDefaults = false;
		justCreatedSlot = false;
		isSubmitting = false;
		isDeleting = false;
		isAddingAnother = false;
		showDeleteConfirm = false;
	}
	
	function addTouchedField(field: string) {
		touchedFields.add(field);
	}
	
	function setValidationError(errors: Array<{ field: string; message: string }>) {
		validationErrors = errors;
	}
	
	function removeValidationError(field: string) {
		validationErrors = validationErrors.filter(e => e.field !== field);
	}
	
	function setError(message: string | null) {
		error = message;
	}
	
	function setConflicts(conflictList: Array<any>) {
		conflicts = conflictList;
	}
	
	// Computed properties
	let duration = $derived.by(() => {
		if (!formData.startTime || !formData.endTime) return 0;
		
		const start = new Date(`2000-01-01T${formData.startTime}:00`);
		const end = new Date(`2000-01-01T${formData.endTime}:00`);
		
		if (end <= start) return 0;
		
		return (end.getTime() - start.getTime()) / (1000 * 60); // minutes
	});
	
	// Return state object
	return {
		// Data
		get formData() { return formData; },
		get isSubmitting() { return isSubmitting; },
		get isDeleting() { return isDeleting; },
		get isAddingAnother() { return isAddingAnother; },
		get showDeleteConfirm() { return showDeleteConfirm; },
		get justCreatedSlot() { return justCreatedSlot; },
		get lastCreatedDate() { return lastCreatedDate; },
		get lastCreatedStartTime() { return lastCreatedStartTime; },
		get slotsCreated() { return slotsCreated; },
		get validationErrors() { return validationErrors; },
		get touchedFields() { return touchedFields; },
		get error() { return error; },
		get conflicts() { return conflicts; },
		get customDuration() { return customDuration; },
		get initialDefaults() { return initialDefaults; },
		get duration() { return duration; },
		
		// Setters
		set formData(value: TimeSlotFormData) { formData = value; },
		set isSubmitting(value: boolean) { isSubmitting = value; },
		set isDeleting(value: boolean) { isDeleting = value; },
		set isAddingAnother(value: boolean) { isAddingAnother = value; },
		set showDeleteConfirm(value: boolean) { showDeleteConfirm = value; },
		set justCreatedSlot(value: boolean) { justCreatedSlot = value; },
		set lastCreatedDate(value: string) { lastCreatedDate = value; },
		set lastCreatedStartTime(value: string) { lastCreatedStartTime = value; },
		set slotsCreated(value: number) { slotsCreated = value; },
		set customDuration(value: number | null) { customDuration = value; },
		set initialDefaults(value: boolean) { initialDefaults = value; },
		
		// Methods
		setFormData,
		resetForm,
		addTouchedField,
		setValidationError,
		removeValidationError,
		setError,
		setConflicts
	};
}

export type TimeSlotFormState = ReturnType<typeof createTimeSlotFormState>; 
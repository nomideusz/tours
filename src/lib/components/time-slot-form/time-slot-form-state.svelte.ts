import type { TimeSlotFormData, TimeSlotConflict } from './types.js';
import { validateTourForm, type ValidationError } from '$lib/validation.js';

export function createTimeSlotFormState(initialData?: Partial<TimeSlotFormData>) {
	// Form data
	let formData = $state<TimeSlotFormData>({
		date: '',
		startTime: '',
		endTime: '',
		capacity: 0,
		availability: 'available',
		notes: '',
		recurring: false,
		recurringType: 'weekly',
		recurringEnd: '',
		recurringCount: 2,
		...initialData
	});

	// UI state
	let isSubmitting = $state(false);
	let isDeleting = $state(false);
	let showDeleteConfirm = $state(false);
	let showAdvanced = $state(false);
	let error = $state<string | null>(null);
	let conflicts = $state<TimeSlotConflict[]>([]);
	let validationErrors = $state<ValidationError[]>([]);
	let touchedFields = $state<Set<string>>(new Set());
	let justCreatedSlot = $state(false);
	let lastCreatedDate = $state<string>('');
	let lastCreatedStartTime = $state<string>('');
	let customDuration = $state<number | null>(null);
	let initialDefaults = $state(false);
	let isAddingAnother = $state(false);

	// Calculate duration in minutes
	const duration = $derived(() => {
		if (!formData.startTime || !formData.endTime) return 0;
		const start = new Date(`2000-01-01T${formData.startTime}:00`);
		const end = new Date(`2000-01-01T${formData.endTime}:00`);
		return Math.max(0, (end.getTime() - start.getTime()) / 60000);
	});

	// Helper methods
	function setFormData(data: Partial<TimeSlotFormData>) {
		Object.assign(formData, data);
	}

	function resetForm(keepDate = false) {
		const savedDate = keepDate ? formData.date : '';
		formData = {
			date: savedDate,
			startTime: '',
			endTime: '',
			capacity: 0,
			availability: 'available',
			notes: '',
			recurring: false,
			recurringType: 'weekly',
			recurringEnd: '',
			recurringCount: 2
		};
		validationErrors = [];
		touchedFields.clear();
		error = null;
		conflicts = [];
		showAdvanced = false;
		justCreatedSlot = false;
	}

	function setError(errorMessage: string | null) {
		error = errorMessage;
	}

	function setConflicts(newConflicts: TimeSlotConflict[]) {
		conflicts = newConflicts;
	}

	function addTouchedField(field: string) {
		touchedFields.add(field);
	}

	function setValidationError(errors: ValidationError[]) {
		validationErrors = errors;
	}

	function removeValidationError(field: string) {
		validationErrors = validationErrors.filter(e => e.field !== field);
	}

	return {
		// State
		get formData() { return formData; },
		get isSubmitting() { return isSubmitting; },
		get isDeleting() { return isDeleting; },
		get showDeleteConfirm() { return showDeleteConfirm; },
		get showAdvanced() { return showAdvanced; },
		get error() { return error; },
		get conflicts() { return conflicts; },
		get validationErrors() { return validationErrors; },
		get touchedFields() { return touchedFields; },
		get justCreatedSlot() { return justCreatedSlot; },
		get lastCreatedDate() { return lastCreatedDate; },
		get lastCreatedStartTime() { return lastCreatedStartTime; },
		get customDuration() { return customDuration; },
		get initialDefaults() { return initialDefaults; },
		get isAddingAnother() { return isAddingAnother; },
		get duration() { return duration(); },

		// Setters
		set isSubmitting(value: boolean) { isSubmitting = value; },
		set isDeleting(value: boolean) { isDeleting = value; },
		set showDeleteConfirm(value: boolean) { showDeleteConfirm = value; },
		set showAdvanced(value: boolean) { showAdvanced = value; },
		set justCreatedSlot(value: boolean) { justCreatedSlot = value; },
		set lastCreatedDate(value: string) { lastCreatedDate = value; },
		set lastCreatedStartTime(value: string) { lastCreatedStartTime = value; },
		set customDuration(value: number | null) { customDuration = value; },
		set initialDefaults(value: boolean) { initialDefaults = value; },
		set isAddingAnother(value: boolean) { isAddingAnother = value; },

		// Methods
		setFormData,
		resetForm,
		setError,
		setConflicts,
		addTouchedField,
		setValidationError,
		removeValidationError
	};
}

export type TimeSlotFormState = ReturnType<typeof createTimeSlotFormState>; 
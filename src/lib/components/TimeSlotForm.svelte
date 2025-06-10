<script lang="ts">
	import { enhance } from '$app/forms';
	import DatePicker from './DatePicker.svelte';
	import TimePicker from './TimePicker.svelte';
	import NumberInput from './NumberInput.svelte';
	import type { TimeSlot } from '$lib/types.js';

	interface Props {
		slot?: TimeSlot;
		tourCapacity: number;
		tourDuration?: number;
		isEdit?: boolean;
		onCancel?: () => void;
		onSuccess?: () => void;
	}

	let {
		slot,
		tourCapacity,
		tourDuration = 120, // Default to 2 hours if not provided
		isEdit = false,
		onCancel,
		onSuccess
	}: Props = $props();

	// Convert slot data for form fields
	function initializeFormData() {
		if (slot) {
			const startDate = new Date(slot.startTime);
			const endDate = new Date(slot.endTime);
			
			return {
				startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
				startTime: startDate.toTimeString().slice(0, 5), // HH:MM format
				endTime: endDate.toTimeString().slice(0, 5), // HH:MM format
				availableSpots: slot.availableSpots,
				isRecurring: slot.isRecurring || false,
				recurringPattern: slot.recurringPattern || 'weekly',
				recurringEnd: slot.recurringEnd ? new Date(slot.recurringEnd).toISOString().split('T')[0] : ''
			};
		}
		
		// Default values for new slot
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		
		// Calculate default end time based on tour duration
		const defaultStartMinutes = 10 * 60; // 10:00 in minutes
		const defaultEndMinutes = defaultStartMinutes + tourDuration;
		const defaultEndHour = Math.floor(defaultEndMinutes / 60);
		const defaultEndMin = defaultEndMinutes % 60;
		const defaultEndTime = `${String(defaultEndHour).padStart(2, '0')}:${String(defaultEndMin).padStart(2, '0')}`;
		
		return {
			startDate: tomorrow.toISOString().split('T')[0],
			startTime: '10:00',
			endTime: defaultEndTime,
			availableSpots: tourCapacity,
			isRecurring: false,
			recurringPattern: 'weekly' as const,
			recurringEnd: ''
		};
	}

	// Form data
	let formData = $state(initializeFormData());
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	// Today's date for validation
	const today = new Date().toISOString().split('T')[0];

	// Calculate minimum available spots (can't reduce below booked spots when editing)
	let minAvailableSpots = $derived(() => {
		if (isEdit && slot?.bookedSpots) {
			return slot.bookedSpots;
		}
		return 1;
	});

	// Auto-update end time when start time changes (use tour duration)
	function handleStartTimeChange(newStartTime: string) {
		if (newStartTime && !isEdit) { // Only auto-update for new slots
			const [hours, minutes] = newStartTime.split(':').map(Number);
			
			// Calculate end time based on tour duration
			const totalMinutes = hours * 60 + minutes + tourDuration;
			const endHours = Math.floor(totalMinutes / 60);
			const endMinutes = totalMinutes % 60;
			
			// Handle hour overflow (next day)
			if (endHours >= 24) {
				formData.endTime = `${String(endHours - 24).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
			} else {
				formData.endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
			}
		}
	}

	function handleDateChange(_value: string) {
		// DatePicker change handler - no action needed
	}

	function handleEndTimeChange(_value: string) {
		// TimePicker change handler - no action needed
	}

	// Validation
	let validationErrors = $derived(() => {
		const errors: string[] = [];

		if (!formData.startDate) {
			errors.push('Start date is required');
		} else if (formData.startDate < today) {
			errors.push('Start date cannot be in the past');
		}

		if (!formData.startTime) {
			errors.push('Start time is required');
		}

		if (!formData.endTime) {
			errors.push('End time is required');
		}

		// Validate time range
		if (formData.startTime && formData.endTime) {
			const startMinutes = parseInt(formData.startTime.split(':')[0]) * 60 + parseInt(formData.startTime.split(':')[1]);
			const endMinutes = parseInt(formData.endTime.split(':')[0]) * 60 + parseInt(formData.endTime.split(':')[1]);
			
			if (endMinutes <= startMinutes) {
				errors.push('End time must be after start time');
			} else {
				const durationMinutes = endMinutes - startMinutes;
				if (durationMinutes < 15) {
					errors.push('Duration must be at least 15 minutes');
				}
				if (durationMinutes > 720) { // 12 hours max
					errors.push('Duration cannot exceed 12 hours');
				}
			}
		}

		if (formData.availableSpots < minAvailableSpots()) {
			errors.push(`Available spots cannot be less than ${minAvailableSpots()} (current bookings)`);
		}

		if (formData.availableSpots > tourCapacity) {
			errors.push(`Available spots cannot exceed tour capacity (${tourCapacity})`);
		}

		if (formData.isRecurring && formData.recurringEnd && formData.startDate) {
			if (formData.recurringEnd <= formData.startDate) {
				errors.push('Recurring end date must be after start date');
			}
		}

		return errors;
	});

	let isValid = $derived(validationErrors().length === 0);

	function handleCancel() {
		onCancel?.();
	}

	function handleSubmit() {
		if (!isValid) {
			const errors = validationErrors();
			error = errors[0] || 'Please fix the errors above';
			return;
		}
		
		// Form submission will be handled by enhance
		error = null;
	}
</script>

<form
	method="POST"
	action={isEdit ? '?/update-slot' : '?/create-slot'}
	use:enhance={({ formData: submitFormData, cancel }) => {
		if (!isValid) {
			cancel();
			const errors = validationErrors();
			error = errors[0] || 'Please fix the form errors';
			return;
		}

		isSubmitting = true;
		error = null;

		// Add slot ID for updates
		if (isEdit && slot?.id) {
			submitFormData.append('slotId', slot.id);
		}

		// Helper function to safely create and validate dates
		function createValidDate(dateStr: string, timeStr: string): Date | null {
			try {
				if (!dateStr || !timeStr) return null;
				
				const dateParts = dateStr.split('-').map(Number);
				const timeParts = timeStr.split(':').map(Number);
				
				if (dateParts.length !== 3 || timeParts.length !== 2) return null;
				if (dateParts.some(isNaN) || timeParts.some(isNaN)) return null;
				
				const [year, month, day] = dateParts;
				const [hour, minute] = timeParts;
				
				const date = new Date(year, month - 1, day, hour, minute);
				
				// Check if the date is valid
				if (isNaN(date.getTime())) return null;
				
				// Verify the date components match (catches invalid dates like Feb 30)
				if (date.getFullYear() !== year || 
					date.getMonth() !== month - 1 || 
					date.getDate() !== day ||
					date.getHours() !== hour ||
					date.getMinutes() !== minute) {
					return null;
				}
				
				return date;
			} catch (e) {
				console.error('Date creation error:', e);
				return null;
			}
		}

		// Combine date and time into ISO datetime strings
		if (formData.startDate && formData.startTime) {
			const startDateTime = createValidDate(formData.startDate, formData.startTime);
			if (startDateTime) {
				submitFormData.set('startTime', startDateTime.toISOString());
			} else {
				cancel();
				error = 'Invalid start date or time';
				return;
			}
		}

		if (formData.startDate && formData.endTime) {
			let endDateTime = createValidDate(formData.startDate, formData.endTime);
			if (!endDateTime) {
				cancel();
				error = 'Invalid end date or time';
				return;
			}
			
			// Handle next day scenario for end time
			if (formData.startTime && formData.endTime) {
				const startHour = parseInt(formData.startTime.split(':')[0]);
				const endHour = parseInt(formData.endTime.split(':')[0]);
				const startMinute = parseInt(formData.startTime.split(':')[1]);
				const endMinute = parseInt(formData.endTime.split(':')[1]);
				
				// If end time is earlier than start time, assume next day
				if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
					endDateTime.setDate(endDateTime.getDate() + 1);
				}
			}
			
			submitFormData.set('endTime', endDateTime.toISOString());
		}

		if (formData.recurringEnd) {
			try {
				const [year, month, day] = formData.recurringEnd.split('-').map(Number);
				if ([year, month, day].some(isNaN)) {
					cancel();
					error = 'Invalid recurring end date';
					return;
				}
				
				const recurringEndDate = new Date(year, month - 1, day);
				if (isNaN(recurringEndDate.getTime())) {
					cancel();
					error = 'Invalid recurring end date';
					return;
				}
				
				submitFormData.set('recurringEnd', recurringEndDate.toISOString());
			} catch (e) {
				cancel();
				error = 'Invalid recurring end date format';
				return;
			}
		}

		return async ({ result, update }) => {
			isSubmitting = false;
			
			if (result.type === 'success') {
				onSuccess?.();
			} else if (result.type === 'failure') {
				error = (result.data as any)?.message || 'Failed to save time slot';
			} else {
				error = 'An unexpected error occurred';
			}
			
			await update();
		};
	}}
	class="space-y-6"
>
	{#if error}
		<div class="rounded-xl p-4" style="background: var(--color-error-light); border: 1px solid var(--color-error);">
			<p class="text-sm" style="color: var(--color-error);">{error}</p>
		</div>
	{/if}

	{#if validationErrors().length > 0}
		<div class="rounded-xl p-4" style="background: var(--color-warning-light); border: 1px solid var(--color-warning);">
			<ul class="text-sm space-y-1" style="color: var(--color-warning);">
				{#each validationErrors() as validationError}
					<li>• {validationError}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Date and Time -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<DatePicker
			bind:value={formData.startDate}
			label="Date"
			placeholder="Select date"
			required
			minDate={today}
			onchange={handleDateChange}
		/>

		<TimePicker
			bind:value={formData.startTime}
			label="Start Time"
			placeholder="Select start time"
			required
			use24hour={true}
			onchange={(newTime: string) => handleStartTimeChange(newTime)}
		/>

		<TimePicker
			bind:value={formData.endTime}
			label="End Time"
			placeholder="Select end time"
			required
			use24hour={true}
			onchange={handleEndTimeChange}
		/>
	</div>

	<!-- Capacity -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<NumberInput
			id="availableSpots"
			name="availableSpots"
			label="Available Spots"
			bind:value={formData.availableSpots}
			min={minAvailableSpots()}
			max={tourCapacity}
			step={1}
			placeholder={tourCapacity.toString()}
			required
			integerOnly={true}
		/>

		{#if isEdit && slot?.bookedSpots && slot.bookedSpots > 0}
			<div class="flex flex-col justify-end">
				<p class="text-sm p-3 rounded-lg" style="background: var(--bg-secondary); color: var(--text-secondary);">
					<strong>{slot.bookedSpots}</strong> people already booked
				</p>
			</div>
		{/if}
	</div>

	<!-- Recurring Options -->
	<div class="border-t pt-6" style="border-color: var(--border-primary);">
		<label class="flex items-center gap-3 mb-4 cursor-pointer">
			<input
				type="checkbox"
				name="isRecurring"
				bind:checked={formData.isRecurring}
				class="form-checkbox"
			/>
			<span class="font-medium" style="color: var(--text-primary);">Make this a recurring time slot</span>
		</label>

		{#if formData.isRecurring}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
				<div>
					<label class="form-label">Repeat Pattern</label>
					<select
						name="recurringPattern"
						bind:value={formData.recurringPattern}
						class="form-select"
					>
						<option value="daily">Daily</option>
						<option value="weekly">Weekly</option>
						<option value="monthly">Monthly</option>
					</select>
				</div>

				<DatePicker
					bind:value={formData.recurringEnd}
					label="End Date (Optional)"
					placeholder="Select end date"
					minDate={formData.startDate || today}
					onchange={handleDateChange}
				/>
			</div>
		{/if}
	</div>

	<!-- Actions -->
	<div class="flex gap-3 pt-4">
		<button
			type="button"
			onclick={handleCancel}
			class="button-secondary flex-1"
			disabled={isSubmitting}
		>
			Cancel
		</button>
		
		<button
			type="submit"
			onclick={handleSubmit}
			disabled={!isValid || isSubmitting}
			class="button-primary flex-1 button--gap"
		>
			{#if isSubmitting}
				<div class="form-spinner"></div>
				{isEdit ? 'Updating...' : 'Creating...'}
			{:else}
				{isEdit ? 'Update Slot' : 'Create Slot'}
			{/if}
		</button>
	</div>
</form> 
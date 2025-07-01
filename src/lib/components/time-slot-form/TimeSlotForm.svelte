<script lang="ts">
	import { formatDate, formatTime } from '$lib/utils/date-helpers.js';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';
	import { getFieldError, hasFieldError } from '$lib/validation.js';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { createTimeSlotMutation, updateTimeSlotMutation, deleteTimeSlotMutation } from '$lib/queries/mutations.js';
	
	// Components
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import DateSelection from './components/DateSelection.svelte';
	import RecurringOptions from './components/RecurringOptions.svelte';
	import ConflictWarning from './components/ConflictWarning.svelte';
	import TimePicker from '$lib/components/TimePicker.svelte';
	import NumberInput from '$lib/components/NumberInput.svelte';
	
	// Icons
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Copy from 'lucide-svelte/icons/copy';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Info from 'lucide-svelte/icons/info';
	import Plus from 'lucide-svelte/icons/plus';

	// State and utilities
	import { createTimeSlotFormState } from './time-slot-form-state.svelte.js';
	import { findNextAvailableTime, checkConflicts, getEndTimeFromDuration } from './utils/time-utils.js';
	import { getRecurringPreview, getActualRecurringCount } from './utils/recurring.js';
	import { validateField, validateForm } from './utils/validation.js';
	import type { TimeSlotFormProps } from './types.js';

	let {
		tourId,
		slotId,
		mode = 'page',
		onSuccess,
		onCancel,
		class: className = '',
		tour: propTour,
		preselectedDate
	}: TimeSlotFormProps = $props();

	// Check if we're editing
	let isEditMode = $derived(!!slotId);
	
	// Initialize state
	const state = createTimeSlotFormState();
	
	// Reset state when component mounts or when mode changes
	$effect(() => {
		if (!slotId) {
			state.initialDefaults = false;
		}
	});
	
	// Initialize mutations
	const createSlotMutation = createTimeSlotMutation(tourId);
	const updateSlotMutation = isEditMode && slotId ? updateTimeSlotMutation(tourId, slotId) : null;
	const deleteSlotMutation = deleteTimeSlotMutation(tourId);
	
	// Fetch tour details if not provided
	let tourQuery = $derived(propTour ? null : createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 1 * 60 * 1000,
		gcTime: 5 * 60 * 1000,
	}));

	// Fetch existing schedule to check for conflicts and get slot data if editing
	let scheduleQuery = $derived(createQuery({
		queryKey: queryKeys.tourSchedule(tourId),
		queryFn: () => queryFunctions.fetchTourSchedule(tourId),
		staleTime: 30 * 1000,
		gcTime: 2 * 60 * 1000,
	}));

	let tour = $derived(propTour || $tourQuery?.data?.tour || null);
	let allSlots = $derived($scheduleQuery.data?.timeSlots || []);
	let currentSlot = $derived(isEditMode ? allSlots.find((slot: any) => slot.id === slotId) : null);
	let existingSlots = $derived(isEditMode ? allSlots.filter((slot: any) => slot.id !== slotId) : allSlots);
	// Always use fresh data for conflict checking
	let freshSlots = $derived((() => {
		const slots = $scheduleQuery.data?.timeSlots || [];
		return isEditMode ? slots.filter((slot: any) => slot.id !== slotId) : slots;
	})());
	let isLoading = $derived(propTour ? $scheduleQuery.isLoading : ($tourQuery?.isLoading || $scheduleQuery.isLoading));

	// Create slots map for MiniMonthCalendar
	let slotsMap = $derived(() => {
		const map = new Map<string, number>();
		allSlots.forEach((slot: any) => {
			const date = new Date(slot.startTime).toISOString().split('T')[0];
			map.set(date, (map.get(date) || 0) + 1);
		});
		return map;
	});

	// Check if slot has bookings
	let hasBookings = $derived(isEditMode && currentSlot?.bookedSpots > 0);

	// Combine all errors
	let allErrors = $derived([...state.validationErrors]);

	// Compact mode styling
	let containerClass = $derived(
		mode === 'inline' ? 'bg-white dark:bg-gray-900 rounded-xl border' : 
		mode === 'modal' ? '' : 
		'rounded-xl'
	);

	// Set smart defaults when both tour and schedule data load (for create mode)
	$effect(() => {
		if (tour && !isEditMode && !$scheduleQuery.isLoading && !state.initialDefaults) {
			state.initialDefaults = true;
			state.formData.capacity = tour.capacity;
			state.formData.availability = 'available';
			
			// Get fresh slots data
			const currentSlots = $scheduleQuery.data?.timeSlots || [];
			
			// Set default date to preselected date or today/tomorrow
			let defaultDate = preselectedDate;
			if (!defaultDate) {
				const today = new Date();
				const tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				
				// Use today if it's before 8 PM, otherwise tomorrow
				if (today.getHours() < 20) {
					defaultDate = today.toISOString().split('T')[0];
				} else {
					defaultDate = tomorrow.toISOString().split('T')[0];
				}
			}
			
			// Try to find an available slot, checking multiple days if necessary
			let targetDate = defaultDate;
			let smartTime = null;
			let daysChecked = 0;
			const maxDaysToCheck = 30; // Check up to 30 days ahead
			
			while (daysChecked < maxDaysToCheck) {
				smartTime = findNextAvailableTime(
					targetDate, 
					state.customDuration, 
					null,
					'',
					currentSlots,
					tour.duration
				);
				
				// If we found a non-conflicting time on this date, use it
				if (!smartTime.suggestedNewDate) {
					break;
				}
				
				// If this is a preselected date, don't change it
				if (preselectedDate) {
					break;
				}
				
				// Move to next day
				const nextDate = new Date(targetDate);
				nextDate.setDate(nextDate.getDate() + 1);
				targetDate = nextDate.toISOString().split('T')[0];
				daysChecked++;
			}
			
			// Set the date and times
			state.formData.date = targetDate;
			state.formData.startTime = smartTime?.startTime || '10:00';
			state.formData.endTime = smartTime?.endTime || getEndTimeFromDuration('10:00', tour.duration);
			
			// If we couldn't find a non-conflicting slot and there are many existing slots,
			// show a helpful message (with a small delay to avoid flashing during init)
			if (daysChecked >= maxDaysToCheck || (smartTime?.suggestedNewDate && currentSlots.length > 20)) {
				setTimeout(() => {
					if (!state.touchedFields.has('date')) {
						state.setError('Your schedule is quite full. Please select a specific date to see available times.');
					}
				}, 300);
			}
		}
	});

	// Populate form when slot loads (for edit mode)
	$effect(() => {
		if (currentSlot && isEditMode) {
			const startDate = new Date(currentSlot.startTime);
			const endDate = new Date(currentSlot.endTime);
			
			state.setFormData({
				date: startDate.toISOString().split('T')[0],
				startTime: startDate.toTimeString().slice(0, 5),
				endTime: endDate.toTimeString().slice(0, 5),
				capacity: currentSlot.capacity || tour?.capacity || 10,
				availability: currentSlot.status === 'cancelled' ? 'cancelled' : 'available',
				notes: currentSlot.notes || ''
			});
		}
	});

		// Smart time adjustment when date changes in create mode
	$effect(() => {
		if (state.formData.date && tour && !isEditMode && !$scheduleQuery.isLoading) {
			// Only auto-adjust if we haven't manually set times yet
			const hasManualTimes = state.touchedFields.has('startTime') || state.touchedFields.has('endTime');
			if (!hasManualTimes && !state.isAddingAnother) {
				// Get fresh slots data
				const currentSlots = $scheduleQuery.data?.timeSlots || [];
				
				const smartTime = findNextAvailableTime(
					state.formData.date, 
					state.customDuration, 
					null,
					'',
					currentSlots,
					tour.duration
				);
				
				// Only update times if no conflict found on current date
				// If suggestedNewDate is true, user should manually change the date
				if (!smartTime.suggestedNewDate) {
					state.formData.startTime = smartTime.startTime;
					state.formData.endTime = smartTime.endTime;
					// Clear any date warning
					if (state.error?.includes('slots available')) {
						state.setError(null);
					}
				} else if (!state.touchedFields.has('date')) {
					// Show warning that no slots are available on this date
					state.setError('No time slots available on this date. Try selecting a different date.');
				}
			}
		}
	});
	
	// Track custom duration when end time changes
	$effect(() => {
		if (state.formData.startTime && state.formData.endTime && state.touchedFields.has('endTime')) {
			const calculatedDuration = state.duration;
			if (calculatedDuration > 0 && calculatedDuration !== tour?.duration) {
				state.customDuration = calculatedDuration;
			}
		}
	});
	
	// Update end time when start time changes (respecting custom duration)
	$effect(() => {
		if (state.formData.startTime && state.touchedFields.has('startTime')) {
			const durationToUse = state.customDuration || tour?.duration || 120;
			state.formData.endTime = getEndTimeFromDuration(state.formData.startTime, durationToUse);
		}
	});

	// Check for conflicts when date/time changes
	$effect(() => {
		// Don't check conflicts while schedule is loading or when adding another slot
		if ($scheduleQuery.isLoading || state.isAddingAnother || state.justCreatedSlot || state.isSubmitting) {
			return;
		}
		
		if (state.formData.date && state.formData.startTime && state.formData.endTime) {
			// Get fresh slots data
			const currentSlots = $scheduleQuery.data?.timeSlots || [];
			const slotsToCheck = isEditMode ? 
				currentSlots.filter((slot: any) => slot.id !== slotId) : 
				currentSlots;
			
			if (slotsToCheck.length > 0) {
				const conflicts = checkConflicts(state.formData.date, state.formData.startTime, state.formData.endTime, slotsToCheck);
				state.setConflicts(conflicts);
			} else {
				state.setConflicts([]);
			}
		}
	});

	// Auto-enable recurring when advanced section is opened
	$effect(() => {
		if (state.showAdvanced && !isEditMode) {
			state.formData.recurring = true;
			// Ensure we have valid default values
			if (!state.formData.recurringType) {
				state.formData.recurringType = 'weekly';
			}
			if (!state.formData.recurringCount || state.formData.recurringCount < 2) {
				state.formData.recurringCount = 2;
			}
		} else if (!state.showAdvanced && !isEditMode) {
			state.formData.recurring = false;
			state.formData.recurringType = 'weekly';
			state.formData.recurringEnd = '';
			state.formData.recurringCount = 2;
		}
	});

	// Event handlers
	function handleValidateField(fieldName: string) {
		state.addTouchedField(fieldName);
		state.removeValidationError(fieldName);
		
		const error = validateField(fieldName, state.formData, isEditMode, currentSlot);
		if (error) {
			state.setValidationError([...state.validationErrors, error]);
		}
	}

	function handleGetEndTimeFromDuration() {
		if (!tour?.duration || !state.formData.startTime) return;
		state.formData.endTime = getEndTimeFromDuration(state.formData.startTime, tour.duration);
		handleValidateField('endTime');
	}

	function copyFromExisting() {
		// Use fresh slots data
		const currentSlots = $scheduleQuery.data?.timeSlots || [];
		const slotsToUse = isEditMode ? 
			currentSlots.filter((slot: any) => slot.id !== slotId) : 
			currentSlots;
			
		if (slotsToUse.length === 0) return;
		
		// Sort by most recent start time
		const sortedSlots = [...slotsToUse].sort((a: any, b: any) => 
			new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
		);
		
		const recent = sortedSlots[0];
		const recentStart = new Date(recent.startTime);
		const recentEnd = new Date(recent.endTime);
		
		state.formData.startTime = recentStart.toTimeString().slice(0, 5);
		state.formData.endTime = recentEnd.toTimeString().slice(0, 5);
		
		handleValidateField('startTime');
		handleValidateField('endTime');
	}

	async function handleSubmit() {
		if (state.isSubmitting) return;
		
		// Mark all required fields as touched
		['date', 'startTime', 'endTime', 'capacity'].forEach(field => {
			state.addTouchedField(field);
			handleValidateField(field);
		});
		
		// Validate form
		const errors = validateForm(state.formData, isEditMode, currentSlot);
		if (errors.length > 0) {
			state.setValidationError(errors);
			state.setError('Please correct the errors below');
			return;
		}
		
		// Double-check for conflicts with latest data
		const currentSlots = $scheduleQuery.data?.timeSlots || [];
		const latestExistingSlots = isEditMode ? 
			currentSlots.filter((slot: any) => slot.id !== slotId) : 
			currentSlots;
		
		const finalConflicts = checkConflicts(
			state.formData.date, 
			state.formData.startTime, 
			state.formData.endTime, 
			latestExistingSlots
		);
		
		if (finalConflicts.length > 0) {
			state.setError('This time slot conflicts with existing slots. Please choose a different time.');
			state.setConflicts(finalConflicts);
			return;
		}
		
		state.isSubmitting = true;
		state.setError(null);
		
		try {
			const start = new Date(`${state.formData.date}T${state.formData.startTime}:00`);
			const end = new Date(`${state.formData.date}T${state.formData.endTime}:00`);
			
			const slotData = {
				...state.formData,
				startTime: start.toISOString(),
				endTime: end.toISOString(),
				status: state.formData.availability,
				recurringEnd: state.formData.recurringEnd ? new Date(state.formData.recurringEnd).toISOString() : null
			};
			
			let result;
			if (isEditMode && updateSlotMutation && $updateSlotMutation) {
				result = await $updateSlotMutation.mutateAsync(slotData);
			} else {
				result = await $createSlotMutation.mutateAsync(slotData);
			}
			
			// Handle success
			state.setError(null);
			state.setConflicts([]);
			
			if (!isEditMode) {
				state.lastCreatedDate = state.formData.date;
				state.lastCreatedStartTime = state.formData.startTime;
				state.justCreatedSlot = true;
				
				// Track how many slots were created (from API response)
				state.slotsCreated = result?.slots?.length || 1;
				
				if (mode !== 'modal') {
					onSuccess?.();
				}
			} else {
				onSuccess?.();
			}
			
		} catch (err) {
			state.setError(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} time slot`);
		} finally {
			state.isSubmitting = false;
		}
	}

	async function handleDelete() {
		if (state.isDeleting || !isEditMode) return;
		
		state.isDeleting = true;
		state.setError(null);
		
		try {
			if (!slotId) throw new Error('No slot ID provided');
			await $deleteSlotMutation.mutateAsync(slotId);
			onSuccess?.();
		} catch (err) {
			state.setError(err instanceof Error ? err.message : 'Failed to delete time slot');
		} finally {
			state.isDeleting = false;
			state.showDeleteConfirm = false;
		}
	}

	async function handleAddAnother() {
		state.isAddingAnother = true;
		state.setConflicts([]);
		state.setError(null);
		
		const savedDate = state.formData.date;
		
		// Wait a bit for the schedule to update after the last creation
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Make sure we have the latest slots data
		const currentSlots = $scheduleQuery.data?.timeSlots || [];
		const updatedExistingSlots = isEditMode ? 
			currentSlots.filter((slot: any) => slot.id !== slotId) : 
			currentSlots;
		
		// Try to find time on the same date first
		let targetDate = savedDate;
		let maxAttempts = 7; // Prevent infinite loops by limiting to 7 days ahead
		let attempt = 0;
		let smartTime = null;
		
		while (attempt < maxAttempts) {
			smartTime = findNextAvailableTime(
				targetDate, 
				state.customDuration, 
				attempt === 0 ? state.lastCreatedStartTime : null,
				attempt === 0 ? state.lastCreatedDate : '',
				updatedExistingSlots,
				tour?.duration
			);
			
			// If we found a slot without needing to change date, use it
			if (!smartTime.suggestedNewDate) {
				break;
			}
			
			// Move to next day
			const nextDate = new Date(targetDate);
			nextDate.setDate(nextDate.getDate() + 1);
			targetDate = nextDate.toISOString().split('T')[0];
			attempt++;
		}
		
		// If we couldn't find any slot in the next 7 days, show error
		if (!smartTime || (attempt >= maxAttempts && smartTime.suggestedNewDate)) {
			state.setError('No available time slots found in the next 7 days. Please review your schedule.');
			state.isAddingAnother = false;
			return;
		}
		
		state.resetForm();
		state.setFormData({
			date: targetDate,
			startTime: smartTime.startTime,
			endTime: smartTime.endTime,
			capacity: tour?.capacity || 10,
			availability: 'available'
		});
		
		state.justCreatedSlot = false;
		state.showAdvanced = false;
		
		// Clear the flag after a short delay
		setTimeout(() => {
			state.isAddingAnother = false;
		}, 300);
	}
	
	function resetDuration() {
		state.customDuration = null;
		if (state.formData.startTime && tour?.duration) {
			state.formData.endTime = getEndTimeFromDuration(state.formData.startTime, tour.duration);
			handleValidateField('endTime');
		}
	}

	// Get current slot time for display
	let currentSlotTime = $derived(
		currentSlot ? {
			start: formatTime(currentSlot.startTime),
			end: formatTime(currentSlot.endTime)
		} : undefined
	);

	// Get recurring preview
	let recurringPreview = $derived(getRecurringPreview(state.formData));
</script>

<div class="{containerClass} {className}" style="{mode === 'inline' ? 'border-color: var(--border-primary);' : ''}">
	{#if isLoading}
		<div class="p-8 text-center">
			<Loader2 class="w-8 h-8 mx-auto mb-2 animate-spin" style="color: var(--text-tertiary);" />
			<p class="text-sm" style="color: var(--text-secondary);">Loading {isEditMode ? 'time slot' : 'tour'} details...</p>
		</div>
	{:else if !tour || (isEditMode && !currentSlot)}
		<div class="p-4 rounded-xl" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
			<p class="font-medium" style="color: var(--color-danger-900);">{isEditMode ? 'Time slot' : 'Tour'} not found</p>
			<p class="text-sm mt-1" style="color: var(--color-danger-700);">Please check the {isEditMode ? 'slot' : 'tour'} ID and try again.</p>
		</div>
	{:else}
		{#if mode === 'inline'}
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h3 class="font-semibold" style="color: var(--text-primary);">{isEditMode ? 'Edit' : 'Add'} Time Slot</h3>
				<p class="text-sm mt-1" style="color: var(--text-secondary);">
					{isEditMode ? `Modify the time slot for ${tour.name}` : `Create a new available time for ${tour.name}`}
				</p>
			</div>
		{/if}

		<div class="{mode === 'inline' ? 'p-6' : ''}">
			
			{#if state.error}
				<div class="mb-6 rounded-lg p-4 border" style="background: var(--color-danger-50); border-color: var(--color-danger-200);">
					<div class="flex gap-3">
						<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-danger-600);" />
						<div class="flex-1">
							<p class="text-sm font-medium" style="color: var(--color-danger-900);">{state.error}</p>
						</div>
					</div>
				</div>
			{/if}

			{#if isEditMode && hasBookings}
				<div class="mb-6 rounded-xl p-4" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
					<div class="flex gap-3">
						<Info class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
						<div>
							<p class="font-medium" style="color: var(--color-warning-900);">This slot has active bookings</p>
							<p class="text-sm mt-1" style="color: var(--color-warning-700);">
								{currentSlot.bookedSpots} guest{currentSlot.bookedSpots === 1 ? '' : 's'} booked. 
								Changes may affect existing bookings. Consider notifying customers of any changes.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<ConflictWarning conflicts={state.conflicts} justCreatedSlot={state.justCreatedSlot} />

			<!-- Mobile: Stacked layout -->
			<div class="md:hidden space-y-4">
				<!-- Date Selection -->
				<DateSelection
					bind:date={state.formData.date}
					slotsMap={slotsMap()}
					errors={allErrors}
					isEditMode={isEditMode}
					onDateChange={(date) => {
						state.formData.date = date;
						handleValidateField('date');
					}}
					isMobile={true}
				/>
				
				<!-- Time Selection -->
				<div>
					<label class="form-label mb-2">Time</label>
					<div class="flex gap-2 items-start">
						<div class="flex-1">
							<TimePicker
								bind:value={state.formData.startTime}
								label="Start"
								placeholder="Start"
								use24hour={true}
								onchange={() => {
									handleValidateField('startTime');
								}}
								error={hasFieldError(allErrors, 'startTime')}
							/>
						</div>
						<div class="pt-8 text-xs" style="color: var(--text-tertiary);">to</div>
						<div class="flex-1">
							<TimePicker
								bind:value={state.formData.endTime}
								label="End"
								placeholder="End"
								use24hour={true}
								onchange={() => handleValidateField('endTime')}
								error={hasFieldError(allErrors, 'endTime')}
							/>
						</div>
					</div>
					
					{#if state.formData.startTime && state.formData.endTime}
						<div class="mt-2 text-xs flex items-center justify-between" style="color: var(--text-secondary);">
							<span>Duration: <strong>{state.duration > 0 ? formatDuration(state.duration) : '--'}</strong></span>
							{#if tour.duration && state.duration !== tour.duration && state.duration > 0}
								<button
									type="button"
									onclick={() => {
										handleGetEndTimeFromDuration();
										handleValidateField('endTime');
									}}
									class="px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
								>
									Use {formatDuration(tour.duration)}
								</button>
							{/if}
						</div>
					{/if}
					
					{#if getFieldError(allErrors, 'startTime')}
						<p class="form-error mt-1">{getFieldError(allErrors, 'startTime')}</p>
					{/if}
					{#if getFieldError(allErrors, 'endTime')}
						<p class="form-error mt-1">{getFieldError(allErrors, 'endTime')}</p>
					{/if}
				</div>

				<!-- Capacity & Availability -->
				<div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<NumberInput
								id="capacity"
								name="capacity"
								label="Capacity"
								bind:value={state.formData.capacity}
								min={isEditMode && currentSlot?.bookedSpots ? currentSlot.bookedSpots : 1}
								max={500}
								step={1}
								placeholder="10"
								incrementLabel="Increase capacity"
								decrementLabel="Decrease capacity"
								error={getFieldError(allErrors, 'capacity')}
								hasError={hasFieldError(allErrors, 'capacity')}
								integerOnly={true}
								size="small"
								onblur={() => handleValidateField('capacity')}
							/>
						</div>
						
						{#if isEditMode}
							<div>
								<label for="availability" class="form-label">Availability</label>
								<select id="availability" bind:value={state.formData.availability} class="form-select w-full size-small">
									<option value="available">Available</option>
									<option value="cancelled">Cancelled</option>
								</select>
							</div>
						{/if}
					</div>
					
					{#if tour.capacity && state.formData.capacity !== tour.capacity}
						<div class="text-xs mt-2 p-2 rounded" style="background: var(--bg-secondary); color: var(--text-secondary);">
							Tour default: {tour.capacity} guests
							<button
								type="button"
								onclick={() => {
									state.formData.capacity = tour.capacity;
									handleValidateField('capacity');
								}}
								class="ml-2 px-1.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
							>
								Use default
							</button>
						</div>
					{/if}

					{#if isEditMode && hasBookings}
						<p class="text-xs mt-2" style="color: var(--text-tertiary);">
							{currentSlot.bookedSpots} already booked • {state.formData.availability === 'cancelled' ? 'Cancelling will affect existing bookings' : 'Customers can book remaining spots'}
						</p>
					{:else if isEditMode}
						<p class="text-xs mt-2" style="color: var(--text-tertiary);">
							{state.formData.availability === 'available' ? 'Customers can book this time slot' : 'This time slot will not be visible to customers'}
						</p>
					{:else}
						<p class="text-xs mt-2" style="color: var(--text-tertiary);">
							Customers will be able to book this time slot once created
						</p>
					{/if}
				</div>

				<!-- Recurring Options -->
				{#if !isEditMode}
					<RecurringOptions
						bind:formData={state.formData}
						bind:showAdvanced={state.showAdvanced}
						isEditMode={isEditMode}
						onToggle={() => state.showAdvanced = !state.showAdvanced}
						isMobile={true}
					/>
				{/if}
			</div>

			<!-- Desktop: Optimized layout -->
			<div class="hidden md:block">
				{#if mode === 'inline'}
					<!-- Inline mode: No calendar, just form fields -->
					<div class="space-y-6">
						<!-- Date Display (no calendar) -->
						<div>
							<label class="form-label">Selected Date</label>
							<div class="p-3 rounded-lg border" style="background: var(--bg-secondary); border-color: var(--border-primary);">
								<p class="text-sm font-medium" style="color: var(--text-primary);">
									{state.formData.date ? formatDate(state.formData.date) : 'Click a date on the calendar'}
								</p>
								{#if getFieldError(allErrors, 'date')}
									<p class="form-error mt-1">{getFieldError(allErrors, 'date')}</p>
								{/if}
							</div>
						</div>
						
						<!-- Time Selection - Compact layout -->
						<div>
							<label class="form-label mb-3">Time</label>
							<div class="flex gap-3 items-start">
								<div class="flex-1">
									<TimePicker
										bind:value={state.formData.startTime}
										label="Start"
										placeholder="Start time"
										use24hour={true}
										onchange={() => {
											handleValidateField('startTime');
										}}
										error={hasFieldError(allErrors, 'startTime')}
									/>
								</div>
								<div class="pt-8 text-sm" style="color: var(--text-tertiary);">to</div>
								<div class="flex-1">
									<TimePicker
										bind:value={state.formData.endTime}
										label="End"
										placeholder="End time"
										use24hour={true}
										onchange={() => handleValidateField('endTime')}
										error={hasFieldError(allErrors, 'endTime')}
									/>
								</div>
							</div>
							
							<!-- Duration info and validation -->
							<div class="mt-3 flex items-center justify-between">
								<div class="text-sm" style="color: var(--text-secondary);">
									Duration: 
									<span class="font-medium">
										{state.duration > 0 ? formatDuration(state.duration) : 'Not set'}
									</span>
									{#if tour.duration && state.duration !== tour.duration}
										<span class="text-xs ml-1" style="color: var(--text-tertiary);">
											(default: {formatDuration(tour.duration)})
										</span>
									{/if}
								</div>
								{#if state.customDuration && tour.duration}
									<button
										type="button"
										onclick={resetDuration}
										class="text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
										style="color: var(--color-primary-600);"
									>
										Use default
									</button>
								{/if}
							</div>
							
							{#if getFieldError(allErrors, 'startTime')}
								<p class="form-error mt-2">{getFieldError(allErrors, 'startTime')}</p>
							{/if}
							{#if getFieldError(allErrors, 'endTime')}
								<p class="form-error mt-2">{getFieldError(allErrors, 'endTime')}</p>
							{/if}
							
							{#if isEditMode && currentSlotTime}
								<div class="text-sm mt-2" style="color: var(--text-tertiary);">
									Current: {currentSlotTime.start} - {currentSlotTime.end}
								</div>
							{/if}
						</div>
						
						<!-- Capacity & Availability -->
						<div>
							<div class="grid grid-cols-2 gap-4">
								<div>
									<NumberInput
										id="capacity"
										name="capacity"
										label="Capacity"
										bind:value={state.formData.capacity}
										min={isEditMode && currentSlot?.bookedSpots ? currentSlot.bookedSpots : 1}
										max={500}
										step={1}
										placeholder="10"
										incrementLabel="Increase capacity"
										decrementLabel="Decrease capacity"
										error={getFieldError(allErrors, 'capacity')}
										hasError={hasFieldError(allErrors, 'capacity')}
										integerOnly={true}
										onblur={() => handleValidateField('capacity')}
									/>
								</div>
								{#if isEditMode}
									<div>
										<label for="availability" class="form-label">Availability</label>
										<select id="availability" bind:value={state.formData.availability} class="form-select w-full">
											<option value="available">Available</option>
											<option value="cancelled">Cancelled</option>
										</select>
									</div>
								{/if}
							</div>
							
							<!-- Capacity info -->
							{#if tour.capacity && state.formData.capacity !== tour.capacity}
								<div class="text-sm mt-2 p-2 rounded" style="background: var(--bg-secondary); color: var(--text-secondary);">
									Tour default: {tour.capacity} guests
									<button
										type="button"
										onclick={() => {
											state.formData.capacity = tour.capacity;
											handleValidateField('capacity');
										}}
										class="ml-2 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
									>
										Use default
									</button>
								</div>
							{/if}
							
							{#if isEditMode && hasBookings}
								<div class="text-sm mt-2 p-2 rounded" style="background: var(--color-warning-50); color: var(--color-warning-700);">
									{currentSlot.bookedSpots} already booked
								</div>
							{/if}
						</div>
						
						<!-- Recurring Options for inline mode -->
						{#if !isEditMode}
							<RecurringOptions
								bind:formData={state.formData}
								bind:showAdvanced={state.showAdvanced}
								isEditMode={isEditMode}
								onToggle={() => state.showAdvanced = !state.showAdvanced}
							/>
						{/if}
					</div>
				{:else if mode === 'page'}
					<!-- Page mode: Large desktop form with calendar -->
					<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-6 border-b" style="border-color: var(--border-primary);">
							<h3 class="text-xl font-semibold" style="color: var(--text-primary);">{isEditMode ? 'Edit' : 'Create'} Time Slot</h3>
							<p class="text-base mt-2" style="color: var(--text-secondary);">
								{isEditMode ? `Modify the time slot for ${tour.name}` : `Create a new available time for ${tour.name}`}
							</p>
						</div>
						<div class="p-8">
							<div class="grid grid-cols-1 xl:grid-cols-2 gap-10">
								<!-- Left Column: Date Selection -->
								<div>
									<div class="mb-2">
										<h4 class="text-lg font-medium mb-4" style="color: var(--text-primary);">Select Date</h4>
									</div>
									<DateSelection
										bind:date={state.formData.date}
										slotsMap={slotsMap()}
										errors={allErrors}
										isEditMode={isEditMode}
										onDateChange={(date) => {
											state.formData.date = date;
											handleValidateField('date');
										}}
									/>
									
									<!-- Recurring Options - Move under calendar for better grouping -->
									{#if !isEditMode}
										<div class="mt-8">
											<RecurringOptions
												bind:formData={state.formData}
												bind:showAdvanced={state.showAdvanced}
												isEditMode={isEditMode}
												onToggle={() => state.showAdvanced = !state.showAdvanced}
											/>
										</div>
									{/if}
								</div>
								
								<!-- Right Column: Time & Settings -->
								<div class="space-y-8">
									<!-- Time Selection - Large desktop layout -->
									<div>
										<h4 class="text-lg font-medium mb-6" style="color: var(--text-primary);">Time & Details</h4>
										<div class="space-y-6">
											<div class="grid grid-cols-2 gap-6">
												<div>
													<TimePicker
														bind:value={state.formData.startTime}
														label="Start Time"
														placeholder="Start time"
														use24hour={true}
														onchange={() => {
															handleValidateField('startTime');
														}}
														error={hasFieldError(allErrors, 'startTime')}
													/>
												</div>
												<div>
													<TimePicker
														bind:value={state.formData.endTime}
														label="End Time"
														placeholder="End time"
														use24hour={true}
														onchange={() => handleValidateField('endTime')}
														error={hasFieldError(allErrors, 'endTime')}
													/>
												</div>
											</div>
										</div>
											
											<!-- Duration info and validation -->
											<div class="mt-4 p-4 rounded-lg" style="background: var(--bg-secondary);">
												<div class="flex items-center justify-between">
													<div class="text-base" style="color: var(--text-secondary);">
														Duration: 
														<span class="font-semibold text-lg" style="color: var(--text-primary);">
															{state.duration > 0 ? formatDuration(state.duration) : 'Not set'}
														</span>
														{#if tour.duration && state.duration !== tour.duration}
															<span class="text-sm ml-2" style="color: var(--text-tertiary);">
																(default: {formatDuration(tour.duration)})
															</span>
														{/if}
													</div>
													{#if state.customDuration && tour.duration}
														<button
															type="button"
															onclick={resetDuration}
															class="text-sm px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
															style="color: var(--color-primary-600);"
														>
															Use default
														</button>
													{/if}
												</div>
											</div>
											
											{#if getFieldError(allErrors, 'startTime')}
												<p class="form-error mt-3">{getFieldError(allErrors, 'startTime')}</p>
											{/if}
											{#if getFieldError(allErrors, 'endTime')}
												<p class="form-error mt-3">{getFieldError(allErrors, 'endTime')}</p>
											{/if}
											
											{#if isEditMode && currentSlotTime}
												<div class="text-base mt-3 p-3 rounded-lg" style="background: var(--bg-secondary); color: var(--text-tertiary);">
													Current: {currentSlotTime.start} - {currentSlotTime.end}
												</div>
											{/if}
										</div>
									
									<!-- Capacity & Availability -->
									<div>
										<h5 class="text-base font-medium mb-4" style="color: var(--text-primary);">Capacity Settings</h5>
										<div class="grid grid-cols-2 gap-6">
											<div>
												<NumberInput
													id="capacity"
													name="capacity"
													label="Guest Capacity"
													bind:value={state.formData.capacity}
													min={isEditMode && currentSlot?.bookedSpots ? currentSlot.bookedSpots : 1}
													max={500}
													step={1}
													placeholder="10"
													incrementLabel="Increase capacity"
													decrementLabel="Decrease capacity"
													error={getFieldError(allErrors, 'capacity')}
													hasError={hasFieldError(allErrors, 'capacity')}
													integerOnly={true}
													onblur={() => handleValidateField('capacity')}
												/>
											</div>
											{#if isEditMode}
												<div>
													<label for="availability" class="form-label text-base">Availability Status</label>
													<select id="availability" bind:value={state.formData.availability} class="form-select w-full text-base py-3">
														<option value="available">Available for Booking</option>
														<option value="cancelled">Cancelled</option>
													</select>
												</div>
											{/if}
										</div>
										
										<!-- Capacity info -->
										{#if tour.capacity && state.formData.capacity !== tour.capacity}
											<div class="text-sm mt-2 p-2 rounded" style="background: var(--bg-secondary); color: var(--text-secondary);">
												Tour default: {tour.capacity} guests
												<button
													type="button"
													onclick={() => {
														state.formData.capacity = tour.capacity;
														handleValidateField('capacity');
													}}
													class="ml-2 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
												>
													Use default
												</button>
											</div>
										{/if}
										
										{#if isEditMode && hasBookings}
											<div class="text-sm mt-2 p-2 rounded" style="background: var(--color-warning-50); color: var(--color-warning-700);">
												{currentSlot.bookedSpots} already booked
											</div>
										{/if}
									</div>
									
									<!-- Action Buttons for Page mode -->
									<div class="pt-6 border-t" style="border-color: var(--border-primary);">
										<div class="flex gap-4 justify-between items-center">
											<div class="flex gap-3">
												{#if existingSlots.length > 0 && !isEditMode}
													<button
														type="button"
														onclick={copyFromExisting}
														class="button-secondary button--gap px-6 py-3"
													>
														<Copy class="h-5 w-5" />
														Copy from recent
													</button>
												{/if}
												{#if isEditMode}
													<button
														type="button"
														onclick={() => state.showDeleteConfirm = true}
														disabled={state.isDeleting}
														class="button-danger button--gap px-6 py-3"
													>
														{#if state.isDeleting}
															<Loader2 class="w-5 h-5 animate-spin" />
															Deleting...
														{:else}
															<Trash2 class="w-5 h-5" />
															Delete Slot
														{/if}
													</button>
												{/if}
											</div>
											
											<div class="flex gap-4">
												<button
													type="button"
													onclick={() => {
														if (state.justCreatedSlot) {
															state.justCreatedSlot = false;
															onSuccess?.();
														} else {
															onCancel?.();
														}
													}}
													disabled={state.isSubmitting}
													class="button-secondary px-6 py-3 text-base"
												>
													{state.justCreatedSlot ? 'Done' : 'Cancel'}
												</button>
												<button
													type="button"
													onclick={() => {
														if (state.justCreatedSlot) {
															handleAddAnother();
														} else {
															handleSubmit();
														}
													}}
													disabled={state.isSubmitting || (!state.justCreatedSlot && state.conflicts.length > 0)}
													class="button-primary button--gap px-8 py-3 text-base"
												>
													{#if state.isSubmitting}
														<Loader2 class="w-5 h-5 animate-spin" />
														{isEditMode ? 'Saving...' : (state.formData.recurring ? 'Creating slots...' : 'Creating...')}
													{:else if state.justCreatedSlot}
														<Plus class="h-5 w-5" />
														Create Another
													{:else}
														<CheckCircle class="w-5 h-5" />
														{isEditMode ? 'Save Changes' : (state.showAdvanced && recurringPreview.length > 1 ? `Create ${recurringPreview.length} slots` : 'Create Time Slot')}
													{/if}
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- Modal/Drawer mode: Original grid layout with calendar -->
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<!-- Left Column: Date Selection -->
						<div>
							<DateSelection
								bind:date={state.formData.date}
								slotsMap={slotsMap()}
								errors={allErrors}
								isEditMode={isEditMode}
								onDateChange={(date) => {
									state.formData.date = date;
									handleValidateField('date');
								}}
							/>
							
							<!-- Recurring Options - Move under calendar for better grouping -->
							{#if !isEditMode}
								<div class="mt-6">
									<RecurringOptions
										bind:formData={state.formData}
										bind:showAdvanced={state.showAdvanced}
										isEditMode={isEditMode}
										onToggle={() => state.showAdvanced = !state.showAdvanced}
									/>
								</div>
							{/if}
						</div>
						
						<!-- Right Column: Time & Settings -->
						<div class="space-y-6">
							<!-- Time Selection - Compact layout -->
							<div>
								<label class="form-label mb-3">Time</label>
								<div class="flex gap-3 items-start">
									<div class="flex-1">
										<TimePicker
											bind:value={state.formData.startTime}
											label="Start"
											placeholder="Start time"
											use24hour={true}
											onchange={() => {
												handleValidateField('startTime');
											}}
											error={hasFieldError(allErrors, 'startTime')}
										/>
									</div>
									<div class="pt-8 text-sm" style="color: var(--text-tertiary);">to</div>
									<div class="flex-1">
										<TimePicker
											bind:value={state.formData.endTime}
											label="End"
											placeholder="End time"
											use24hour={true}
											onchange={() => handleValidateField('endTime')}
											error={hasFieldError(allErrors, 'endTime')}
										/>
									</div>
								</div>
								
								<!-- Duration info and validation -->
								<div class="mt-3 flex items-center justify-between">
									<div class="text-sm" style="color: var(--text-secondary);">
										Duration: 
										<span class="font-medium">
											{state.duration > 0 ? formatDuration(state.duration) : 'Not set'}
										</span>
										{#if tour.duration && state.duration !== tour.duration}
											<span class="text-xs ml-1" style="color: var(--text-tertiary);">
												(default: {formatDuration(tour.duration)})
											</span>
										{/if}
									</div>
									{#if state.customDuration && tour.duration}
										<button
											type="button"
											onclick={resetDuration}
											class="text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
											style="color: var(--color-primary-600);"
										>
											Use default
										</button>
									{/if}
								</div>
								
								{#if getFieldError(allErrors, 'startTime')}
									<p class="form-error mt-2">{getFieldError(allErrors, 'startTime')}</p>
								{/if}
								{#if getFieldError(allErrors, 'endTime')}
									<p class="form-error mt-2">{getFieldError(allErrors, 'endTime')}</p>
								{/if}
								
								{#if isEditMode && currentSlotTime}
									<div class="text-sm mt-2" style="color: var(--text-tertiary);">
										Current: {currentSlotTime.start} - {currentSlotTime.end}
									</div>
								{/if}
							</div>
							
							<!-- Capacity & Availability -->
							<div>
								<div class="grid grid-cols-2 gap-4">
									<div>
										<NumberInput
											id="capacity"
											name="capacity"
											label="Capacity"
											bind:value={state.formData.capacity}
											min={isEditMode && currentSlot?.bookedSpots ? currentSlot.bookedSpots : 1}
											max={500}
											step={1}
											placeholder="10"
											incrementLabel="Increase capacity"
											decrementLabel="Decrease capacity"
											error={getFieldError(allErrors, 'capacity')}
											hasError={hasFieldError(allErrors, 'capacity')}
											integerOnly={true}
											onblur={() => handleValidateField('capacity')}
										/>
									</div>
									{#if isEditMode}
										<div>
											<label for="availability" class="form-label">Availability</label>
											<select id="availability" bind:value={state.formData.availability} class="form-select w-full">
												<option value="available">Available</option>
												<option value="cancelled">Cancelled</option>
											</select>
										</div>
									{/if}
								</div>
								
								<!-- Capacity info -->
								{#if tour.capacity && state.formData.capacity !== tour.capacity}
									<div class="text-sm mt-2 p-2 rounded" style="background: var(--bg-secondary); color: var(--text-secondary);">
										Tour default: {tour.capacity} guests
										<button
											type="button"
											onclick={() => {
												state.formData.capacity = tour.capacity;
												handleValidateField('capacity');
											}}
											class="ml-2 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
										>
											Use default
										</button>
									</div>
								{/if}
								
								{#if isEditMode && hasBookings}
									<div class="text-sm mt-2 p-2 rounded" style="background: var(--color-warning-50); color: var(--color-warning-700);">
										{currentSlot.bookedSpots} already booked
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Success Message - Simple inline success instead of bulky banner -->
			{#if state.justCreatedSlot && (mode === 'modal' || mode === 'page')}
				<div class="mt-4 rounded-lg p-3 flex items-start gap-2" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
					<CheckCircle class="h-4 w-4 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" />
					<p class="text-sm" style="color: var(--color-success-700);">
						{#if state.slotsCreated > 1}
							{state.slotsCreated} time slots created successfully!
						{:else}
							Time slot created for {formatDate(state.lastCreatedDate)}
						{/if}
					</p>
				</div>
			{/if}

			<!-- Action Buttons - Always visible with consistent layout -->
			{#if mode !== 'page'}
			<div class="mt-6 {mode === 'inline' ? 'flex gap-3 justify-end' : ''}">
				{#if mode !== 'inline'}
					<!-- Mobile: Stack buttons -->
					<div class="md:hidden space-y-3">
						{#if existingSlots.length > 0 && !isEditMode}
							<button
								type="button"
								onclick={copyFromExisting}
								class="button-secondary button--gap w-full"
							>
								<Copy class="h-4 w-4" />
								Copy from recent
							</button>
						{/if}
						{#if isEditMode}
							<button
								type="button"
								onclick={() => state.showDeleteConfirm = true}
								disabled={state.isDeleting}
								class="button-danger button--gap w-full"
							>
								{#if state.isDeleting}
									<Loader2 class="w-4 h-4 animate-spin" />
									Deleting...
								{:else}
									<Trash2 class="w-4 h-4" />
									Delete
								{/if}
							</button>
						{/if}
						<div class="flex gap-3">
							<button
								type="button"
								onclick={() => {
									if (state.justCreatedSlot) {
										state.justCreatedSlot = false;
										onSuccess?.();
									} else {
										onCancel?.();
									}
								}}
								disabled={state.isSubmitting}
								class="button-secondary flex-1"
							>
								{state.justCreatedSlot ? 'Done' : 'Cancel'}
							</button>
							<button
								type="button"
								onclick={() => {
									if (state.justCreatedSlot) {
										handleAddAnother();
									} else {
										handleSubmit();
									}
								}}
								disabled={state.isSubmitting || (!state.justCreatedSlot && state.conflicts.length > 0)}
								class="button-primary button--gap flex-1"
							>
								{#if state.isSubmitting}
									<Loader2 class="w-4 h-4 animate-spin" />
									{isEditMode ? 'Saving' : 'Creating'}
								{:else if state.justCreatedSlot}
									<Plus class="h-4 w-4" />
									Add Another
								{:else}
									<CheckCircle class="w-4 h-4" />
									{isEditMode ? 'Save' : 'Create'}
								{/if}
							</button>
						</div>
					</div>
					
					<!-- Desktop: Original layout -->
					<div class="hidden md:flex gap-3 justify-between">
						{#if existingSlots.length > 0 || isEditMode}
							<div class="flex gap-2">
								{#if existingSlots.length > 0 && !isEditMode}
									<button
										type="button"
										onclick={copyFromExisting}
										class="button-secondary button--small button--gap"
									>
										<Copy class="h-4 w-4" />
										Copy from recent
									</button>
								{/if}
								{#if isEditMode}
									<button
										type="button"
										onclick={() => state.showDeleteConfirm = true}
										disabled={state.isDeleting}
										class="button-danger button--gap"
									>
										{#if state.isDeleting}
											<Loader2 class="w-4 h-4 animate-spin" />
											Deleting...
										{:else}
											<Trash2 class="w-4 h-4" />
											Delete
										{/if}
									</button>
								{/if}
							</div>
						{/if}
						
						<div class="flex gap-3 {!(existingSlots.length > 0 || isEditMode) ? 'w-full justify-end' : ''}">
							<button
								type="button"
								onclick={() => {
									if (state.justCreatedSlot) {
										state.justCreatedSlot = false;
										onSuccess?.();
									} else {
										onCancel?.();
									}
								}}
								disabled={state.isSubmitting}
								class="button-secondary"
							>
								{state.justCreatedSlot ? 'Done' : 'Cancel'}
							</button>
							<button
								type="button"
								onclick={() => {
									if (state.justCreatedSlot) {
										handleAddAnother();
									} else {
										handleSubmit();
									}
								}}
								disabled={state.isSubmitting || (!state.justCreatedSlot && state.conflicts.length > 0)}
								class="button-primary button--gap"
							>
								{#if state.isSubmitting}
									<Loader2 class="w-4 h-4 animate-spin" />
									{isEditMode ? 'Saving...' : (state.formData.recurring ? 'Creating slots...' : 'Creating...')}
								{:else if state.justCreatedSlot}
									<Plus class="h-4 w-4" />
									Create Another
								{:else}
									<CheckCircle class="w-4 h-4" />
									{isEditMode ? 'Save Changes' : (state.showAdvanced && recurringPreview.length > 1 ? `Create ${recurringPreview.length} slots` : 'Create Slot')}
								{/if}
							</button>
						</div>
					</div>
				{:else}
					<!-- Inline mode: Keep original simple layout -->
					{#if existingSlots.length > 0}
						<div class="flex gap-2">
							{#if existingSlots.length > 0 && !isEditMode}
								<button
									type="button"
									onclick={copyFromExisting}
									class="button-secondary button--small button--gap"
								>
									<Copy class="h-4 w-4" />
									Copy from recent
								</button>
							{/if}
							{#if isEditMode}
								<button
									type="button"
									onclick={() => state.showDeleteConfirm = true}
									disabled={state.isDeleting}
									class="button-danger button--gap"
								>
									{#if state.isDeleting}
										<Loader2 class="w-4 h-4 animate-spin" />
										Deleting...
									{:else}
										<Trash2 class="w-4 h-4" />
										Delete
									{/if}
								</button>
							{/if}
						</div>
					{/if}
					
					<div class="flex gap-3">
						<button
							type="button"
							onclick={() => {
								if (state.justCreatedSlot) {
									state.justCreatedSlot = false;
									onSuccess?.();
								} else {
									onCancel?.();
								}
							}}
							disabled={state.isSubmitting}
							class="button-secondary"
						>
							{state.justCreatedSlot ? 'Done' : 'Cancel'}
						</button>
						<button
							type="button"
							onclick={() => {
								if (state.justCreatedSlot) {
									handleAddAnother();
								} else {
									handleSubmit();
								}
							}}
							disabled={state.isSubmitting || (!state.justCreatedSlot && state.conflicts.length > 0)}
							class="button-primary button--gap"
						>
							{#if state.isSubmitting}
								<Loader2 class="w-4 h-4 animate-spin" />
								{isEditMode ? 'Saving...' : (state.formData.recurring ? 'Creating slots...' : 'Creating...')}
							{:else if state.justCreatedSlot}
								<Plus class="h-4 w-4" />
								Create Another
							{:else}
								<CheckCircle class="w-4 h-4" />
								{isEditMode ? 'Save Changes' : (state.showAdvanced && recurringPreview.length > 1 ? `Create ${recurringPreview.length} slots` : 'Create Slot')}
							{/if}
						</button>
					</div>
				{/if}
			</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
{#if state.showDeleteConfirm}
	<ConfirmationModal
		bind:isOpen={state.showDeleteConfirm}
		title="Cancel Time Slot"
		message={hasBookings 
			? `⚠️ This slot has ${currentSlot.bookedSpots} active booking${currentSlot.bookedSpots === 1 ? '' : 's'}. Cancelling will:\n\n• Cancel all bookings immediately\n• Send cancellation emails to all ${currentSlot.bookedSpots} customer${currentSlot.bookedSpots === 1 ? '' : 's'}\n• Process full refunds automatically\n\nThis action cannot be undone.`
			: 'Are you sure you want to cancel this time slot? This action cannot be undone.'}
		confirmText={hasBookings ? `Cancel Slot & Notify ${currentSlot.bookedSpots} Customer${currentSlot.bookedSpots === 1 ? '' : 's'}` : "Cancel Slot"}
		cancelText="Keep Slot"
		onConfirm={handleDelete}
		onCancel={() => state.showDeleteConfirm = false}
		variant="danger"
		icon={Trash2}
	/>
{/if} 
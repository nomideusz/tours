<script lang="ts">
	import { untrack } from 'svelte';
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
	import Calendar from 'lucide-svelte/icons/calendar';

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
		onSubmissionStart,
		onSubmissionEnd,
		class: className = '',
		tour: propTour,
		preselectedDate
	}: TimeSlotFormProps = $props();

	// Check if we're editing
	let isEditMode = $derived(!!slotId);
	
	// Initialize state
	const formState = createTimeSlotFormState();
	
	// Add initialization tracking
	let isInitializing = $state(true);
	let hasSetInitialValues = $state(false);
	
	// Reset state when component mounts or when mode changes
	$effect(() => {
		// Use untrack to prevent loops
		untrack(() => {
			if (!slotId) {
				// Reset all state for new slot creation
				formState.resetForm();
				formState.initialDefaults = false;
				isInitializing = true;
				hasSetInitialValues = false;
			}
		});
	});
	
	// Initialize mutations
	const createSlotMutation = createTimeSlotMutation(tourId);
	const deleteSlotMutation = deleteTimeSlotMutation(tourId);
	// Create update mutation reactively based on edit mode
	let updateSlotMutation = $derived(isEditMode && slotId ? updateTimeSlotMutation(tourId, slotId) : null);
	
	// Fetch getTour() details if not provided
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

	// Simple getters that access data directly without creating reactive subscriptions
	const getTour = () => propTour || $tourQuery?.data?.tour || null;
	const getAllSlots = () => $scheduleQuery.data?.timeSlots || [];
	const getCurrentSlot = () => {
		const slots = getAllSlots();
		return isEditMode ? slots.find((slot: any) => slot.id === slotId) : null;
	};
	const getExistingSlots = () => {
		const slots = getAllSlots();
		return isEditMode ? slots.filter((slot: any) => slot.id !== slotId) : slots;
	};
	const getIsLoading = () => propTour ? $scheduleQuery.isLoading : ($tourQuery?.isLoading || $scheduleQuery.isLoading);
	const getHasBookings = () => {
		const slot = getCurrentSlot();
		return isEditMode && slot?.bookedSpots > 0;
	};
	
	// Create slots map for MiniMonthCalendar - using a getter function
	const getSlotsMap = () => {
		const map = new Map<string, number>();
		const slots = getAllSlots();
		slots.forEach((slot: any) => {
			const date = new Date(slot.startTime).toISOString().split('T')[0];
			map.set(date, (map.get(date) || 0) + 1);
		});
		return map;
	};

	// Combine all errors
	let allErrors = $derived([...formState.validationErrors]);

	// Mode styling
	let containerClass = $derived(
		mode === 'inline' ? 'bg-white dark:bg-gray-900 rounded-xl border' : 
		mode === 'modal' ? 'time-slot-modal-form' : 
		mode === 'drawer' ? 'time-slot-drawer-form' :
		'rounded-xl'
	);

	// Set smart defaults when both getTour() and schedule data load (for create mode)
	$effect(() => {
		// Skip if we've already initialized
		if (hasSetInitialValues) return;
		
		if (getTour() && !isEditMode && !$scheduleQuery.isLoading && !formState.initialDefaults) {
			// Use untrack to prevent triggering other effects during initialization
			untrack(() => {
				// Immediately mark as initialized to prevent re-runs
				hasSetInitialValues = true;
				formState.initialDefaults = true;
				formState.formData.capacity = getTour().capacity;
				formState.formData.availability = 'available';
				
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
						formState.customDuration, 
						null,
						'',
						currentSlots,
						getTour().duration
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
				formState.formData.date = targetDate;
				formState.formData.startTime = smartTime?.startTime || '10:00';
				formState.formData.endTime = smartTime?.endTime || getEndTimeFromDuration('10:00', getTour().duration);
				
				// Mark initialization as complete
				isInitializing = false;
				
				// If we couldn't find a non-conflicting slot and there are many existing slots,
				// show a helpful message (with a small delay to avoid flashing during init)
				if (daysChecked >= maxDaysToCheck || (smartTime?.suggestedNewDate && currentSlots.length > 20)) {
					setTimeout(() => {
						if (!formState.touchedFields.has('date')) {
							formState.setError('Your schedule is quite full. Please select a specific date to see available times.');
						}
					}, 300);
				}
				
				// Mark initialization as complete after a small delay to ensure all reactive updates are done
				setTimeout(() => {
					isInitializing = false;
				}, 100);
			});
		}
	});

	// Populate form when slot loads (for edit mode)
	$effect(() => {
		if (getCurrentSlot() && isEditMode) {
			untrack(() => {
				const startDate = new Date(getCurrentSlot().startTime);
				const endDate = new Date(getCurrentSlot().endTime);
				
				formState.setFormData({
					date: startDate.toISOString().split('T')[0],
					startTime: startDate.toTimeString().slice(0, 5),
					endTime: endDate.toTimeString().slice(0, 5),
					capacity: getCurrentSlot().capacity || getTour()?.capacity || 10,
					availability: getCurrentSlot().status === 'cancelled' ? 'cancelled' : 'available',
					notes: getCurrentSlot().notes || ''
				});
			});
		}
	});

		// Smart time adjustment when date changes in create mode
	$effect(() => {
		// Only track the date value
		const currentDate = formState.formData.date;
		
		// Skip if we're initializing or have already set initial values
		if (isInitializing || !hasSetInitialValues) {
			return;
		}
		
		// Use untrack to read all other values without creating dependencies
		untrack(() => {
			if (currentDate && getTour() && !isEditMode && !$scheduleQuery.isLoading) {
				// Only auto-adjust if we haven't manually set times yet
				const hasManualTimes = formState.touchedFields.has('startTime') || formState.touchedFields.has('endTime');
				// Also skip if the date hasn't been manually changed by the user
				const hasManualDateChange = formState.touchedFields.has('date');
				
				if (!hasManualTimes && !formState.isAddingAnother && hasManualDateChange) {
					// Get fresh slots data
					const currentSlots = $scheduleQuery.data?.timeSlots || [];
					
					const smartTime = findNextAvailableTime(
						currentDate, 
						formState.customDuration, 
						null,
						'',
						currentSlots,
						getTour().duration
					);
					
					// Only update times if no conflict found on current date
					// If suggestedNewDate is true, user should manually change the date
					if (!smartTime.suggestedNewDate) {
						formState.formData.startTime = smartTime.startTime;
						formState.formData.endTime = smartTime.endTime;
						// Clear any date warning
						if (formState.error?.includes('slots available')) {
							formState.setError(null);
						}
					} else if (!formState.touchedFields.has('date')) {
						// Show warning that no slots are available on this date
						formState.setError('No time slots available on this date. Try selecting a different date.');
					}
				}
			}
		});
	});
	
	// Track custom duration when end time changes
	$effect(() => {
		// Only track the end time value
		const currentEndTime = formState.formData.endTime;
		
		// Skip during initialization
		if (isInitializing || !hasSetInitialValues) return;
		
		untrack(() => {
			if (formState.formData.startTime && currentEndTime && formState.touchedFields.has('endTime')) {
				const calculatedDuration = formState.duration;
				if (calculatedDuration > 0 && calculatedDuration !== getTour()?.duration) {
					formState.customDuration = calculatedDuration;
				}
			}
		});
	});
	
	// Update end time when start time changes (respecting custom duration)
	let isUpdatingEndTime = $state(false);
	$effect(() => {
		// Only track the start time value
		const currentStartTime = formState.formData.startTime;
		
		// Skip during initialization or if already updating
		if (isInitializing || !hasSetInitialValues || isUpdatingEndTime) return;
		
		untrack(() => {
			if (currentStartTime && formState.touchedFields.has('startTime') && !formState.touchedFields.has('endTime')) {
				const durationToUse = formState.customDuration || getTour()?.duration || 120;
				const newEndTime = getEndTimeFromDuration(currentStartTime, durationToUse);
				
				// Only update if the end time would actually change
				if (newEndTime !== formState.formData.endTime) {
					isUpdatingEndTime = true;
					formState.formData.endTime = newEndTime;
					// Reset flag after a microtask
					Promise.resolve().then(() => {
						isUpdatingEndTime = false;
					});
				}
			}
		});
	});

	// Check for conflicts when date/time changes
	$effect(() => {
		// Track only the values we need to react to
		const currentDate = formState.formData.date;
		const currentStartTime = formState.formData.startTime;
		const currentEndTime = formState.formData.endTime;
		
		// Don't check conflicts during initialization, while schedule is loading or when adding another slot
		if (isInitializing || $scheduleQuery.isLoading || formState.isAddingAnother || formState.justCreatedSlot || formState.isSubmitting) {
			return;
		}
		
		untrack(() => {
			if (currentDate && currentStartTime && currentEndTime) {
				// Get fresh slots data
				const currentSlots = $scheduleQuery.data?.timeSlots || [];
				const slotsToCheck = isEditMode ? 
					currentSlots.filter((slot: any) => slot.id !== slotId) : 
					currentSlots;
				
				if (slotsToCheck.length > 0) {
					const conflicts = checkConflicts(currentDate, currentStartTime, currentEndTime, slotsToCheck);
					formState.setConflicts(conflicts);
				} else {
					formState.setConflicts([]);
				}
			}
		});
	});

	// The recurring defaults are already handled in RecurringOptions component's onchange handler

	// Event handlers
	function handleValidateField(fieldName: string) {
		formState.addTouchedField(fieldName);
		formState.removeValidationError(fieldName);
		
		const error = validateField(fieldName, formState.formData, isEditMode, getCurrentSlot());
		if (error) {
			formState.setValidationError([...formState.validationErrors, error]);
		}
	}

	function handleGetEndTimeFromDuration() {
		if (!getTour()?.duration || !formState.formData.startTime) return;
		formState.formData.endTime = getEndTimeFromDuration(formState.formData.startTime, getTour().duration);
		handleValidateField('endTime');
	}



	async function handleSubmit() {
		if (formState.isSubmitting) return;
		
		// Mark all required fields as touched
		['date', 'startTime', 'endTime', 'capacity'].forEach(field => {
			formState.addTouchedField(field);
			handleValidateField(field);
		});
		
		// Validate form
		const errors = validateForm(formState.formData, isEditMode, getCurrentSlot());
		if (errors.length > 0) {
			formState.setValidationError(errors);
			formState.setError('Please correct the errors below');
			return;
		}
		
		// Double-check for conflicts with latest data
		const currentSlots = $scheduleQuery.data?.timeSlots || [];
		const latestExistingSlots = isEditMode ? 
			currentSlots.filter((slot: any) => slot.id !== slotId) : 
			currentSlots;
		
		const finalConflicts = checkConflicts(
			formState.formData.date, 
			formState.formData.startTime, 
			formState.formData.endTime, 
			latestExistingSlots
		);
		
		if (finalConflicts.length > 0) {
			formState.setError('This time slot conflicts with existing slots. Please choose a different time.');
			formState.setConflicts(finalConflicts);
			return;
		}
		
		formState.isSubmitting = true;
		formState.setError(null);
		
		// Notify modal that submission started
		onSubmissionStart?.();
		
		try {
			const start = new Date(`${formState.formData.date}T${formState.formData.startTime}:00`);
			const end = new Date(`${formState.formData.date}T${formState.formData.endTime}:00`);
			
			const slotData = {
				...formState.formData,
				startTime: start.toISOString(),
				endTime: end.toISOString(),
				status: formState.formData.availability,
				recurringEnd: formState.formData.recurringEnd ? new Date(formState.formData.recurringEnd).toISOString() : null
			};
			
			let result;
			if (isEditMode && updateSlotMutation && $updateSlotMutation) {
				result = await $updateSlotMutation.mutateAsync(slotData);
			} else {
				result = await $createSlotMutation.mutateAsync(slotData);
			}
			
			// Handle success
			formState.setError(null);
			formState.setConflicts([]);
			
			if (!isEditMode) {
				formState.lastCreatedDate = formState.formData.date;
				formState.lastCreatedStartTime = formState.formData.startTime;
				formState.justCreatedSlot = true;
				
				// Track how many slots were created (from API response)
				formState.slotsCreated = result?.slots?.length || 1;
			}
			
			// Always call onSuccess with the result, regardless of mode
			onSuccess?.(result);
			
		} catch (err) {
			formState.setError(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} time slot`);
		} finally {
			formState.isSubmitting = false;
			// Notify modal that submission ended
			onSubmissionEnd?.();
		}
	}

	async function handleDelete() {
		if (formState.isDeleting || !isEditMode) return;
		
		formState.isDeleting = true;
		formState.setError(null);
		
		try {
			if (!slotId) throw new Error('No slot ID provided');
			await $deleteSlotMutation.mutateAsync(slotId);
			onSuccess?.();
		} catch (err) {
			formState.setError(err instanceof Error ? err.message : 'Failed to delete time slot');
		} finally {
			formState.isDeleting = false;
			formState.showDeleteConfirm = false;
		}
	}

	async function handleAddAnother() {
		formState.isAddingAnother = true;
		formState.setConflicts([]);
		formState.setError(null);
		
		const savedDate = formState.formData.date;
		
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
				formState.customDuration, 
				attempt === 0 ? formState.lastCreatedStartTime : null,
				attempt === 0 ? formState.lastCreatedDate : '',
				updatedExistingSlots,
				getTour()?.duration
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
			formState.setError('No available time slots found in the next 7 days. Please review your schedule.');
			formState.isAddingAnother = false;
			return;
		}
		
		formState.resetForm();
		formState.setFormData({
			date: targetDate,
			startTime: smartTime.startTime,
			endTime: smartTime.endTime,
			capacity: getTour()?.capacity || 10,
			availability: 'available'
		});
		
		formState.justCreatedSlot = false;
		
		// Clear the flag after a short delay
		setTimeout(() => {
			formState.isAddingAnother = false;
		}, 300);
	}
	
	function resetDuration() {
		formState.customDuration = null;
		if (formState.formData.startTime && getTour()?.duration) {
			formState.formData.endTime = getEndTimeFromDuration(formState.formData.startTime, getTour().duration);
			handleValidateField('endTime');
		}
	}

	// Get current slot time for display
	let currentSlotTime = $derived(
		getCurrentSlot() ? {
			start: formatTime(getCurrentSlot().startTime),
			end: formatTime(getCurrentSlot().endTime)
		} : undefined
	);

	// Get recurring preview
	let recurringPreview = $derived(getRecurringPreview(formState.formData));
	let actualRecurringCount = $derived(getActualRecurringCount(formState.formData));
	
	// Expose resetForm method for modal to use
	function resetForm() {
		formState.resetForm();
	}
	
	// Helper methods for modal to access form data
	function getFormData() {
		return { ...formState.formData };
	}
	
	function setFormData(data: any) {
		formState.setFormData(data);
	}
	
	// Export functions for parent components
	export { resetForm, getFormData, setFormData };
</script>

<div class="{containerClass} {className}" style="{mode === 'inline' ? 'border-color: var(--border-primary);' : ''}">
	{#if getIsLoading()}
		<div class="p-8 text-center">
			<Loader2 class="w-8 h-8 mx-auto mb-2 animate-spin" style="color: var(--text-tertiary);" />
			<p class="text-sm" style="color: var(--text-secondary);">Loading {isEditMode ? 'time slot' : 'tour'} details...</p>
		</div>
	{:else if !getTour() || (isEditMode && !getCurrentSlot())}
		<div class="p-4 rounded-xl" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
			<p class="font-medium" style="color: var(--color-danger-900);">{isEditMode ? 'Time slot' : 'Tour'} not found</p>
			<p class="text-sm mt-1" style="color: var(--color-danger-700);">Please check the {isEditMode ? 'slot' : 'tour'} ID and try again.</p>
		</div>
	{:else}
		{#if mode === 'inline'}
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h3 class="font-semibold" style="color: var(--text-primary);">{isEditMode ? 'Edit' : 'Add'} Time Slot</h3>
				<p class="text-sm mt-1" style="color: var(--text-secondary);">
					{isEditMode ? `Modify the time slot for ${getTour().name}` : `Create a new available time for ${getTour().name}`}
				</p>
			</div>
		{/if}

		<div class="{mode === 'inline' ? 'p-6' : ''}">
			
			{#if formState.error}
				<div class="mb-6 rounded-lg p-4 border" style="background: var(--color-danger-50); border-color: var(--color-danger-200);">
					<div class="flex gap-3">
						<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-danger-600);" />
						<div class="flex-1">
							<p class="text-sm font-medium" style="color: var(--color-danger-900);">{formState.error}</p>
						</div>
					</div>
				</div>
			{/if}

			{#if isEditMode && getHasBookings()}
				<div class="mb-6 rounded-xl p-4" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
					<div class="flex gap-3">
						<Info class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
						<div>
							<p class="font-medium" style="color: var(--color-warning-900);">This slot has active bookings</p>
							<p class="text-sm mt-1" style="color: var(--color-warning-700);">
								{getCurrentSlot().bookedSpots} guest{getCurrentSlot().bookedSpots === 1 ? '' : 's'} booked. 
								Changes may affect existing bookings. Consider notifying customers of any changes.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<ConflictWarning conflicts={formState.conflicts} justCreatedSlot={formState.justCreatedSlot} />

			<!-- Mobile: Stacked layout -->
			<div class="md:hidden space-y-4">
				<!-- Date Selection -->
				<DateSelection
					bind:date={formState.formData.date}
					slotsMap={getSlotsMap()}
					errors={allErrors}
					isEditMode={isEditMode}
					onDateChange={(date) => {
						formState.formData.date = date;
						handleValidateField('date');
					}}
					isMobile={true}
				/>
				
				<!-- Time Selection -->
				<div>
					<div class="form-label mb-2">Time</div>
					<div class="flex gap-2 items-start">
						<div class="flex-1">
							<TimePicker
								bind:value={formState.formData.startTime}
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
								bind:value={formState.formData.endTime}
								label="End"
								placeholder="End"
								use24hour={true}
								onchange={() => handleValidateField('endTime')}
								error={hasFieldError(allErrors, 'endTime')}
							/>
						</div>
					</div>
					
					{#if formState.formData.startTime && formState.formData.endTime}
						<div class="mt-3 mb-2 text-xs flex items-center justify-between" style="color: var(--text-secondary);">
							<span>Duration: <strong>{formState.duration > 0 ? formatDuration(formState.duration) : '--'}</strong></span>
							{#if getTour().duration && formState.duration !== getTour().duration && formState.duration > 0}
								<button
									type="button"
									onclick={() => {
										handleGetEndTimeFromDuration();
										handleValidateField('endTime');
									}}
									class="px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
								>
									Use {formatDuration(getTour().duration)}
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
				<div class="mt-1">
					<div class="grid grid-cols-2 gap-3">
						<div>
							<NumberInput
								id="capacity"
								name="capacity"
								label="Max Group Size"
								bind:value={formState.formData.capacity}
								min={isEditMode && getCurrentSlot()?.bookedSpots ? getCurrentSlot().bookedSpots : 1}
								max={500}
								step={1}
								placeholder="10"
								incrementLabel="Increase group size"
								decrementLabel="Decrease group size"
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
								<select id="availability" bind:value={formState.formData.availability} class="form-select w-full size-small">
									<option value="available">Available</option>
									<option value="cancelled">Cancelled</option>
								</select>
							</div>
						{/if}
					</div>
					
					{#if getTour().capacity && formState.formData.capacity !== getTour().capacity}
						<div class="text-xs mt-2 p-2 rounded" style="background: var(--bg-secondary); color: var(--text-secondary);">
							Tour default: {getTour().capacity} guests
							<button
								type="button"
								onclick={() => {
									formState.formData.capacity = getTour().capacity;
									handleValidateField('capacity');
								}}
								class="ml-2 px-1.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
							>
								Use default
							</button>
						</div>
					{/if}

					{#if isEditMode && getHasBookings()}
						<p class="text-xs mt-2" style="color: var(--text-tertiary);">
							{getCurrentSlot().bookedSpots} already booked • {formState.formData.availability === 'cancelled' ? 'Cancelling will affect existing bookings' : 'Customers can book remaining spots'}
						</p>
					{:else if isEditMode}
						<p class="text-xs mt-2" style="color: var(--text-tertiary);">
							{formState.formData.availability === 'available' ? 'Customers can book this time slot' : 'This time slot will not be visible to customers'}
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
						bind:formData={formState.formData}
						isEditMode={isEditMode}
						isMobile={true}
						onRecurringChange={() => formState.addTouchedField('recurring')}
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
							<div class="form-label">Selected Date</div>
							<div class="p-3 rounded-lg border" style="background: var(--bg-secondary); border-color: var(--border-primary);">
								<p class="text-sm font-medium" style="color: var(--text-primary);">
									{formState.formData.date ? formatDate(formState.formData.date) : 'Click a date on the calendar'}
								</p>
								{#if getFieldError(allErrors, 'date')}
									<p class="form-error mt-1">{getFieldError(allErrors, 'date')}</p>
								{/if}
							</div>
						</div>
						
						<!-- Time Selection - Compact layout -->
						<div>
							<div class="form-label mb-3">Time</div>
							<div class="flex gap-3 items-start">
								<div class="flex-1">
									<TimePicker
										bind:value={formState.formData.startTime}
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
										bind:value={formState.formData.endTime}
										label="End"
										placeholder="End time"
										use24hour={true}
										onchange={() => handleValidateField('endTime')}
										error={hasFieldError(allErrors, 'endTime')}
									/>
								</div>
							</div>
							
							<!-- Duration info and validation -->
							<div class="mt-4 flex items-center justify-between">
								<div class="text-sm" style="color: var(--text-secondary);">
									Duration: 
									<span class="font-medium">
										{formState.duration > 0 ? formatDuration(formState.duration) : 'Not set'}
									</span>
									{#if getTour().duration && formState.duration !== getTour().duration}
										<span class="text-xs ml-1" style="color: var(--text-tertiary);">
											(default: {formatDuration(getTour().duration)})
										</span>
									{/if}
								</div>
								{#if formState.customDuration && getTour().duration}
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
										label="Max Group Size"
										bind:value={formState.formData.capacity}
										min={isEditMode && getCurrentSlot()?.bookedSpots ? getCurrentSlot().bookedSpots : 1}
										max={500}
										step={1}
										placeholder="10"
										incrementLabel="Increase group size"
										decrementLabel="Decrease group size"
										error={getFieldError(allErrors, 'capacity')}
										hasError={hasFieldError(allErrors, 'capacity')}
										integerOnly={true}
										onblur={() => handleValidateField('capacity')}
									/>
								</div>
								{#if isEditMode}
									<div>
										<label for="availability" class="form-label">Availability</label>
										<select id="availability" bind:value={formState.formData.availability} class="form-select w-full">
											<option value="available">Available</option>
											<option value="cancelled">Cancelled</option>
										</select>
									</div>
								{/if}
							</div>
							
							<!-- Capacity info -->
							{#if getTour().capacity && formState.formData.capacity !== getTour().capacity}
								<div class="text-sm mt-2 p-2 rounded" style="background: var(--bg-secondary); color: var(--text-secondary);">
									Tour default: {getTour().capacity} guests
									<button
										type="button"
										onclick={() => {
											formState.formData.capacity = getTour().capacity;
											handleValidateField('capacity');
										}}
										class="ml-2 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
									>
										Use default
									</button>
								</div>
							{/if}
							
							{#if isEditMode && getHasBookings()}
								<div class="text-sm mt-2 p-2 rounded" style="background: var(--color-warning-50); color: var(--color-warning-700);">
									{getCurrentSlot().bookedSpots} already booked
								</div>
							{/if}
						</div>
						
						<!-- Recurring Options for inline mode -->
						{#if !isEditMode}
							<RecurringOptions
								bind:formData={formState.formData}
								isEditMode={isEditMode}
								onRecurringChange={() => formState.addTouchedField('recurring')}
							/>
						{/if}
					</div>
				{:else if mode === 'page'}
					<!-- Page mode: Large desktop form with calendar -->
					<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-6 border-b" style="border-color: var(--border-primary);">
							<h3 class="text-xl font-semibold" style="color: var(--text-primary);">{isEditMode ? 'Edit' : 'Create'} Time Slot</h3>
							<p class="text-base mt-2" style="color: var(--text-secondary);">
								{isEditMode ? `Modify the time slot for ${getTour().name}` : `Create a new available time for ${getTour().name}`}
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
										bind:date={formState.formData.date}
										slotsMap={getSlotsMap()}
										errors={allErrors}
										isEditMode={isEditMode}
										onDateChange={(date) => {
											formState.formData.date = date;
											handleValidateField('date');
										}}
									/>
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
														bind:value={formState.formData.startTime}
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
														bind:value={formState.formData.endTime}
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
															{formState.duration > 0 ? formatDuration(formState.duration) : 'Not set'}
														</span>
														{#if getTour().duration && formState.duration !== getTour().duration}
															<span class="text-sm ml-2" style="color: var(--text-tertiary);">
																(default: {formatDuration(getTour().duration)})
															</span>
														{/if}
													</div>
													{#if formState.customDuration && getTour().duration}
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
										<h5 class="text-base font-medium mb-4" style="color: var(--text-primary);">Group Size Settings</h5>
										<div class="grid grid-cols-2 gap-6">
											<div>
												<NumberInput
													id="capacity"
													name="capacity"
													label="Max Group Size"
													bind:value={formState.formData.capacity}
													min={isEditMode && getCurrentSlot()?.bookedSpots ? getCurrentSlot().bookedSpots : 1}
													max={500}
													step={1}
													placeholder="10"
													incrementLabel="Increase group size"
													decrementLabel="Decrease group size"
													error={getFieldError(allErrors, 'capacity')}
													hasError={hasFieldError(allErrors, 'capacity')}
													integerOnly={true}
													onblur={() => handleValidateField('capacity')}
												/>
											</div>
											{#if isEditMode}
												<div>
													<label for="availability" class="form-label text-base">Availability Status</label>
													<select id="availability" bind:value={formState.formData.availability} class="form-select w-full text-base py-3">
														<option value="available">Available for Booking</option>
														<option value="cancelled">Cancelled</option>
													</select>
												</div>
											{/if}
										</div>
										
										<!-- Capacity info -->
										{#if getTour().capacity && formState.formData.capacity !== getTour().capacity}
											<div class="text-sm mt-2 p-2 rounded" style="background: var(--bg-secondary); color: var(--text-secondary);">
												Tour default: {getTour().capacity} guests
												<button
													type="button"
													onclick={() => {
														formState.formData.capacity = getTour().capacity;
														handleValidateField('capacity');
													}}
													class="ml-2 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
												>
													Use default
												</button>
											</div>
										{/if}
										
										{#if isEditMode && getHasBookings()}
											<div class="text-sm mt-2 p-2 rounded" style="background: var(--color-warning-50); color: var(--color-warning-700);">
												{getCurrentSlot().bookedSpots} already booked
											</div>
										{/if}
									</div>
									
									<!-- Action Buttons for Page mode -->
									<div class="pt-6 border-t" style="border-color: var(--border-primary);">
										<div class="flex gap-4 justify-between items-center">
											<div class="flex gap-3">
												{#if isEditMode}
													<button
														type="button"
														onclick={() => formState.showDeleteConfirm = true}
														disabled={formState.isDeleting}
														class="button-danger button--gap px-6 py-3"
													>
														{#if formState.isDeleting}
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
														if (formState.justCreatedSlot) {
															formState.justCreatedSlot = false;
															onSuccess?.();
														} else {
															onCancel?.();
														}
													}}
													disabled={formState.isSubmitting}
													class="button-secondary px-6 py-3 text-base"
												>
													{formState.justCreatedSlot ? 'Done' : 'Cancel'}
												</button>
												<button
													type="button"
													onclick={() => {
														if (formState.justCreatedSlot) {
															handleAddAnother();
														} else {
															handleSubmit();
														}
													}}
													disabled={formState.isSubmitting || (!formState.justCreatedSlot && formState.conflicts.length > 0)}
													class="button-primary button--gap px-8 py-3 text-base"
												>
													{#if formState.isSubmitting}
														<Loader2 class="w-5 h-5 animate-spin" />
														{isEditMode ? 'Saving...' : (formState.formData.recurring ? 'Creating slots...' : 'Creating...')}
													{:else if formState.justCreatedSlot}
														<Plus class="h-5 w-5" />
														Create Another
													{:else}
														<CheckCircle class="w-5 h-5" />
														{isEditMode ? 'Save Changes' : (formState.formData.recurring && actualRecurringCount > 1 ? `Create ${actualRecurringCount} slots` : 'Create Time Slot')}
													{/if}
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
							
							<!-- Full-width Recurring Options outside grid -->
							{#if !isEditMode}
								<div class="mt-10 pt-8 border-t" style="border-color: var(--border-primary);">
									<h4 class="text-lg font-medium mb-6" style="color: var(--text-primary);">Recurring Options</h4>
									<RecurringOptions
										bind:formData={formState.formData}
										isEditMode={isEditMode}
										onRecurringChange={() => formState.addTouchedField('recurring')}
									/>
								</div>
							{/if}
						</div>
					</div>
				{:else if mode === 'modal'}
					<!-- Modal mode: Original grid layout with calendar -->
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<!-- Left Column: Date Selection -->
						<div>
							<DateSelection
								bind:date={formState.formData.date}
								slotsMap={getSlotsMap()}
								errors={allErrors}
								isEditMode={isEditMode}
								onDateChange={(date) => {
									formState.formData.date = date;
									handleValidateField('date');
								}}
							/>
						</div>
						
						<!-- Right Column: Time & Settings -->
						<div class="space-y-6">
							<!-- Time Selection - Compact layout -->
							<div>
								<div class="form-label mb-3">Time</div>
								<div class="flex gap-3 items-start">
									<div class="flex-1">
										<TimePicker
											bind:value={formState.formData.startTime}
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
											bind:value={formState.formData.endTime}
											label="End"
											placeholder="End time"
											use24hour={true}
											onchange={() => handleValidateField('endTime')}
											error={hasFieldError(allErrors, 'endTime')}
										/>
									</div>
								</div>
								
								<!-- Selected Date & Time Display -->
								{#if formState.formData.date && formState.formData.startTime && formState.formData.endTime}
									<div class="mt-3 p-3 rounded-lg" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
										<div class="flex items-center gap-2">
											<Calendar class="h-4 w-4" style="color: var(--color-primary-600);" />
											<span class="text-sm font-medium" style="color: var(--color-primary-900);">
												Selected: {formatDate(formState.formData.date)} • {formState.formData.startTime} - {formState.formData.endTime}
											</span>
										</div>
									</div>
								{/if}
								
								<!-- Duration info and validation -->
								<div class="mt-4 flex items-center justify-between">
									<div class="text-sm" style="color: var(--text-secondary);">
										Duration: 
										<span class="font-medium">
											{formState.duration > 0 ? formatDuration(formState.duration) : 'Not set'}
										</span>
										{#if getTour().duration && formState.duration !== getTour().duration}
											<span class="text-xs ml-1" style="color: var(--text-tertiary);">
												(default: {formatDuration(getTour().duration)})
											</span>
										{/if}
									</div>
									{#if formState.customDuration && getTour().duration}
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
							<div class="mt-2">
								<div class="grid gap-4 {isEditMode ? 'grid-cols-2' : 'grid-cols-1'}">
									<div>
										<NumberInput
											id="capacity"
											name="capacity"
											label="Max Group Size"
											bind:value={formState.formData.capacity}
											min={isEditMode && getCurrentSlot()?.bookedSpots ? getCurrentSlot().bookedSpots : 1}
											max={500}
											step={1}
											placeholder="10"
											incrementLabel="Increase group size"
											decrementLabel="Decrease group size"
											error={getFieldError(allErrors, 'capacity')}
											hasError={hasFieldError(allErrors, 'capacity')}
											integerOnly={true}
											onblur={() => handleValidateField('capacity')}
										/>
									</div>
									{#if isEditMode}
										<div>
											<label for="availability" class="form-label">Availability</label>
											<select id="availability" bind:value={formState.formData.availability} class="form-select w-full">
												<option value="available">Available</option>
												<option value="cancelled">Cancelled</option>
											</select>
										</div>
									{/if}
								</div>
								
								<!-- Capacity info -->
								{#if getTour().capacity && formState.formData.capacity !== getTour().capacity}
									<div class="text-sm mt-2 p-2 rounded" style="background: var(--bg-secondary); color: var(--text-secondary);">
										Tour default: {getTour().capacity} guests
										<button
											type="button"
											onclick={() => {
												formState.formData.capacity = getTour().capacity;
												handleValidateField('capacity');
											}}
											class="ml-2 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
										>
											Use default
										</button>
									</div>
								{/if}
								
								{#if isEditMode && getHasBookings()}
									<div class="text-sm mt-2 p-2 rounded" style="background: var(--color-warning-50); color: var(--color-warning-700);">
										{getCurrentSlot().bookedSpots} already booked
									</div>
								{/if}
							</div>
						</div>
					</div>
					
					<!-- Full-width Recurring Options outside grid -->
					{#if !isEditMode}
						<div class="mt-6">
							<RecurringOptions
								bind:formData={formState.formData}
								isEditMode={isEditMode}
								onRecurringChange={() => formState.addTouchedField('recurring')}
							/>
						</div>
					{/if}
				{:else}
					<!-- Drawer mode: Mobile-optimized vertical layout -->
					<div class="space-y-6">
						<!-- Date & Time Selection -->
						<div class="space-y-4">
							<DateSelection
								bind:date={formState.formData.date}
								slotsMap={getSlotsMap()}
								errors={allErrors}
								isEditMode={isEditMode}
								onDateChange={(date) => {
									formState.formData.date = date;
									handleValidateField('date');
								}}
								isMobile={true}
							/>
							
							<!-- Time Selection -->
							<div>
								<div class="form-label mb-3">Time</div>
								<div class="flex gap-3 items-start">
									<div class="flex-1">
										<TimePicker
											bind:value={formState.formData.startTime}
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
											bind:value={formState.formData.endTime}
											label="End"
											placeholder="End time"
											use24hour={true}
											onchange={() => handleValidateField('endTime')}
											error={hasFieldError(allErrors, 'endTime')}
										/>
									</div>
								</div>
								
								<!-- Selected Date & Time Display -->
								{#if formState.formData.date && formState.formData.startTime && formState.formData.endTime}
									<div class="mt-3 p-3 rounded-lg" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
										<div class="flex items-center gap-2">
											<Calendar class="h-4 w-4" style="color: var(--color-primary-600);" />
											<span class="text-sm font-medium" style="color: var(--color-primary-900);">
												Selected: {formatDate(formState.formData.date)} • {formState.formData.startTime} - {formState.formData.endTime}
											</span>
										</div>
									</div>
								{/if}
								
								<!-- Duration info and validation -->
								<div class="mt-4 flex items-center justify-between">
									<div class="text-sm" style="color: var(--text-secondary);">
										Duration: 
										<span class="font-medium">
											{formState.duration > 0 ? formatDuration(formState.duration) : 'Not set'}
										</span>
										{#if getTour().duration && formState.duration !== getTour().duration}
											<span class="text-xs ml-1" style="color: var(--text-tertiary);">
												(default: {formatDuration(getTour().duration)})
											</span>
										{/if}
									</div>
									{#if formState.customDuration && getTour().duration}
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
						</div>
						
						<!-- Capacity & Availability -->
						<div>
							<div class="grid gap-4 {isEditMode ? 'grid-cols-2' : 'grid-cols-1'}">
								<div>
									<NumberInput
										id="capacity"
										name="capacity"
										label="Max Group Size"
										bind:value={formState.formData.capacity}
										min={isEditMode && getCurrentSlot()?.bookedSpots ? getCurrentSlot().bookedSpots : 1}
										max={500}
										step={1}
										placeholder="10"
										incrementLabel="Increase group size"
										decrementLabel="Decrease group size"
										error={getFieldError(allErrors, 'capacity')}
										hasError={hasFieldError(allErrors, 'capacity')}
										integerOnly={true}
										onblur={() => handleValidateField('capacity')}
									/>
								</div>
								{#if isEditMode}
									<div>
										<label for="availability" class="form-label">Availability</label>
										<select id="availability" bind:value={formState.formData.availability} class="form-select w-full">
											<option value="available">Available</option>
											<option value="cancelled">Cancelled</option>
										</select>
									</div>
								{/if}
							</div>
							
							<!-- Capacity info -->
							{#if getTour().capacity && formState.formData.capacity !== getTour().capacity}
								<div class="text-sm mt-2 p-2 rounded" style="background: var(--bg-secondary); color: var(--text-secondary);">
									Tour default: {getTour().capacity} guests
									<button
										type="button"
										onclick={() => {
											formState.formData.capacity = getTour().capacity;
											handleValidateField('capacity');
										}}
										class="ml-2 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
									>
										Use default
									</button>
								</div>
							{/if}
							
							{#if isEditMode && getHasBookings()}
								<div class="text-sm mt-2 p-2 rounded" style="background: var(--color-warning-50); color: var(--color-warning-700);">
									{getCurrentSlot().bookedSpots} already booked
								</div>
							{/if}
						</div>
					</div>
					
					<!-- Full-width Recurring Options -->
					{#if !isEditMode}
						<div class="mt-6 pt-6 border-t" style="border-color: var(--border-primary);">
							<RecurringOptions
								bind:formData={formState.formData}
								isEditMode={isEditMode}
								isMobile={true}
								onRecurringChange={() => formState.addTouchedField('recurring')}
							/>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Success Message - Simple inline success instead of bulky banner (not for drawer mode) -->
			{#if formState.justCreatedSlot && (mode === 'modal' || mode === 'page')}
				<div class="mt-4 rounded-lg p-4" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
					<div class="flex items-start gap-3">
						<CheckCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" />
						<div class="flex-1">
							<p class="text-sm font-medium" style="color: var(--color-success-800);">
								{#if formState.slotsCreated > 1}
									{formState.slotsCreated} time slots created successfully!
								{:else}
									Time slot created successfully!
								{/if}
							</p>
							<div class="mt-1 flex items-center gap-2 text-xs" style="color: var(--color-success-700);">
								<Calendar class="h-3 w-3" />
								<span>
									{#if formState.slotsCreated > 1}
										Starting from {formatDate(formState.lastCreatedDate)}
									{:else}
										{formatDate(formState.lastCreatedDate)} at {formState.lastCreatedStartTime}
									{/if}
								</span>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Action Buttons - Always visible with consistent layout -->
			{#if mode !== 'page'}
			<div class="mt-6 {mode === 'inline' ? 'flex gap-3 justify-end' : mode === 'drawer' ? 'drawer-actions' : ''}">
				{#if mode !== 'inline' && mode !== 'drawer'}
					<!-- Mobile: Stack buttons -->
					<div class="md:hidden space-y-3">
						{#if isEditMode}
							<button
								type="button"
								onclick={() => formState.showDeleteConfirm = true}
								disabled={formState.isDeleting}
								class="button-danger button--gap w-full"
							>
								{#if formState.isDeleting}
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
									if (formState.justCreatedSlot) {
										formState.justCreatedSlot = false;
										onSuccess?.();
									} else {
										onCancel?.();
									}
								}}
								disabled={formState.isSubmitting}
								class="button-secondary flex-1"
							>
								{formState.justCreatedSlot ? 'Done' : 'Cancel'}
							</button>
							<button
								type="button"
								onclick={() => {
									if (formState.justCreatedSlot) {
										handleAddAnother();
									} else {
										handleSubmit();
									}
								}}
								disabled={formState.isSubmitting || (!formState.justCreatedSlot && formState.conflicts.length > 0)}
								class="button-primary button--gap flex-1"
							>
								{#if formState.isSubmitting}
									<Loader2 class="w-4 h-4 animate-spin" />
									{isEditMode ? 'Saving' : 'Creating'}
								{:else if formState.justCreatedSlot}
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
						{#if isEditMode}
							<div class="flex gap-2">
								<button
									type="button"
									onclick={() => formState.showDeleteConfirm = true}
									disabled={formState.isDeleting}
									class="button-danger button--gap"
								>
									{#if formState.isDeleting}
										<Loader2 class="w-4 h-4 animate-spin" />
										Deleting...
									{:else}
										<Trash2 class="w-4 h-4" />
										Delete
									{/if}
								</button>
							</div>
						{/if}
						
						<div class="flex gap-3 {!isEditMode ? 'w-full justify-end' : ''}">
							<button
								type="button"
								onclick={() => {
									if (formState.justCreatedSlot) {
										formState.justCreatedSlot = false;
										onSuccess?.();
									} else {
										onCancel?.();
									}
								}}
								disabled={formState.isSubmitting}
								class="button-secondary"
							>
								{formState.justCreatedSlot ? 'Done' : 'Cancel'}
							</button>
							<button
								type="button"
								onclick={() => {
									if (formState.justCreatedSlot) {
										handleAddAnother();
									} else {
										handleSubmit();
									}
								}}
								disabled={formState.isSubmitting || (!formState.justCreatedSlot && formState.conflicts.length > 0)}
								class="button-primary button--gap"
							>
								{#if formState.isSubmitting}
									<Loader2 class="w-4 h-4 animate-spin" />
									{isEditMode ? 'Saving...' : (formState.formData.recurring ? 'Creating slots...' : 'Creating...')}
								{:else if formState.justCreatedSlot}
									<Plus class="h-4 w-4" />
									Create Another
								{:else}
									<CheckCircle class="w-4 h-4" />
									{isEditMode ? 'Save Changes' : (formState.formData.recurring && actualRecurringCount > 1 ? `Create ${actualRecurringCount} slots` : 'Create Slot')}
								{/if}
							</button>
						</div>
					</div>
				{:else if mode === 'drawer'}
					<!-- Drawer mode: Mobile-optimized bottom actions -->
					<div class="space-y-3">
						{#if isEditMode}
							<button
								type="button"
								onclick={() => formState.showDeleteConfirm = true}
								disabled={formState.isDeleting}
								class="button-danger button--gap w-full"
							>
								{#if formState.isDeleting}
									<Loader2 class="w-4 h-4 animate-spin" />
									Deleting...
								{:else}
									<Trash2 class="w-4 h-4" />
									Delete Slot
								{/if}
							</button>
						{/if}
						<div class="flex gap-3">
							<button
								type="button"
								onclick={() => {
									if (formState.justCreatedSlot) {
										formState.justCreatedSlot = false;
										onSuccess?.();
									} else {
										onCancel?.();
									}
								}}
								disabled={formState.isSubmitting}
								class="button-secondary flex-1"
							>
								{formState.justCreatedSlot ? 'Done' : 'Cancel'}
							</button>
							<button
								type="button"
								onclick={() => {
									if (formState.justCreatedSlot) {
										handleAddAnother();
									} else {
										handleSubmit();
									}
								}}
								disabled={formState.isSubmitting || (!formState.justCreatedSlot && formState.conflicts.length > 0)}
								class="button-primary button--gap flex-1"
							>
								{#if formState.isSubmitting}
									<Loader2 class="w-4 h-4 animate-spin" />
									{isEditMode ? 'Saving...' : (formState.formData.recurring ? 'Creating slots...' : 'Creating...')}
								{:else if formState.justCreatedSlot}
									<Plus class="h-4 w-4" />
									Create Another
								{:else}
									<CheckCircle class="w-4 h-4" />
									{isEditMode ? 'Save Changes' : (formState.formData.recurring && actualRecurringCount > 1 ? `Create ${actualRecurringCount} slots` : 'Create Slot')}
								{/if}
							</button>
						</div>
					</div>
				{:else}
					<!-- Inline mode: Keep original simple layout -->
					{#if isEditMode}
						<div class="flex gap-2">
							<button
								type="button"
								onclick={() => formState.showDeleteConfirm = true}
								disabled={formState.isDeleting}
								class="button-danger button--gap"
							>
								{#if formState.isDeleting}
									<Loader2 class="w-4 h-4 animate-spin" />
									Deleting...
								{:else}
									<Trash2 class="w-4 h-4" />
									Delete
								{/if}
							</button>
						</div>
					{/if}
					
					<div class="flex gap-3">
						<button
							type="button"
							onclick={() => {
								if (formState.justCreatedSlot) {
									formState.justCreatedSlot = false;
									onSuccess?.();
								} else {
									onCancel?.();
								}
							}}
							disabled={formState.isSubmitting}
							class="button-secondary"
						>
							{formState.justCreatedSlot ? 'Done' : 'Cancel'}
						</button>
						<button
							type="button"
							onclick={() => {
								if (formState.justCreatedSlot) {
									handleAddAnother();
								} else {
									handleSubmit();
								}
							}}
							disabled={formState.isSubmitting || (!formState.justCreatedSlot && formState.conflicts.length > 0)}
							class="button-primary button--gap"
						>
							{#if formState.isSubmitting}
								<Loader2 class="w-4 h-4 animate-spin" />
								{isEditMode ? 'Saving...' : (formState.formData.recurring ? 'Creating slots...' : 'Creating...')}
							{:else if formState.justCreatedSlot}
								<Plus class="h-4 w-4" />
								Create Another
							{:else}
								<CheckCircle class="w-4 h-4" />
								{isEditMode ? 'Save Changes' : (formState.formData.recurring && actualRecurringCount > 1 ? `Create ${actualRecurringCount} slots` : 'Create Slot')}
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
{#if formState.showDeleteConfirm}
	<ConfirmationModal
		bind:isOpen={formState.showDeleteConfirm}
		title="Cancel Time Slot"
		message={getHasBookings() 
			? `⚠️ This slot has ${getCurrentSlot().bookedSpots} active booking${getCurrentSlot().bookedSpots === 1 ? '' : 's'}. Cancelling will:\n\n• Cancel all bookings immediately\n• Send cancellation emails to all ${getCurrentSlot().bookedSpots} customer${getCurrentSlot().bookedSpots === 1 ? '' : 's'}\n• Process full refunds automatically\n\nThis action cannot be undone.`
			: 'Are you sure you want to cancel this time slot? This action cannot be undone.'}
		confirmText={getHasBookings() ? `Cancel Slot & Notify ${getCurrentSlot().bookedSpots} Customer${getCurrentSlot().bookedSpots === 1 ? '' : 's'}` : "Cancel Slot"}
		cancelText="Keep Slot"
		onConfirm={handleDelete}
		onCancel={() => formState.showDeleteConfirm = false}
		variant="danger"
		icon={Trash2}
	/>
{/if}

<style>
	/* Modal form styling */
	:global(.time-slot-modal-form) {
		/* Remove any conflicting background/border from modal mode */
		background: none !important;
		border: none !important;
		border-radius: 0 !important;
		padding: 0 !important;
		box-shadow: none !important;
	}
	
	/* Improve form spacing in modal */
	:global(.time-slot-modal-form .form-group) {
		margin-bottom: 1.5rem;
	}
	
	/* Better input styling in modal */
	:global(.time-slot-modal-form .form-input),
	:global(.time-slot-modal-form .form-select),
	:global(.time-slot-modal-form .form-textarea) {
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}
	
	:global(.time-slot-modal-form .form-input:focus),
	:global(.time-slot-modal-form .form-select:focus),
	:global(.time-slot-modal-form .form-textarea:focus) {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}
	
	/* Label styling */
	:global(.time-slot-modal-form .form-label) {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	/* Success message in modal */
	:global(.time-slot-modal-form .alert-success) {
		display: none; /* Hide inline success - modal handles it */
	}
	
	/* Button styling in modal */
	:global(.time-slot-modal-form .button-primary),
	:global(.time-slot-modal-form .button-secondary) {
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		transition: all 0.15s ease;
	}
	
	/* Hide the default action buttons in modal mode - modal handles its own */
	:global(.time-slot-modal-form .form-actions) {
		display: none;
	}
	
	/* Ensure form elements don't cause overflow */
	:global(.time-slot-modal-form) {
		overflow-x: hidden;
		min-width: 0;
	}
	
	:global(.time-slot-modal-form .grid) {
		min-width: 0;
	}
	
	:global(.time-slot-modal-form .form-input),
	:global(.time-slot-modal-form .form-select) {
		min-width: 0;
		width: 100%;
		box-sizing: border-box;
	}
	
	/* Drawer form styling */
	:global(.time-slot-drawer-form) {
		/* Optimize for drawer/mobile experience */
		overflow-x: hidden;
		min-width: 0;
		margin: 0;
		padding: 0;
	}
	
	:global(.time-slot-drawer-form .form-input),
	:global(.time-slot-drawer-form .form-select),
	:global(.time-slot-drawer-form .form-textarea) {
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		font-size: 1rem; /* Slightly larger for mobile */
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}
	
	:global(.time-slot-drawer-form .form-input:focus),
	:global(.time-slot-drawer-form .form-select:focus),
	:global(.time-slot-drawer-form .form-textarea:focus) {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}
	
	:global(.time-slot-drawer-form .form-label) {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	/* Mobile-optimized grid layout for drawer */
	:global(.time-slot-drawer-form .grid) {
		display: grid;
		gap: 1rem;
		min-width: 0;
	}
	
	@media (max-width: 640px) {
		:global(.time-slot-drawer-form .grid) {
			grid-template-columns: 1fr; /* Stack on mobile */
		}
	}
	
	/* Drawer actions styling */
	.drawer-actions {
		padding: 1rem 0 0.5rem 0;
		border-top: 1px solid var(--border-primary);
		margin-top: 1.5rem !important;
		position: sticky;
		bottom: 0;
		background: var(--bg-primary);
		z-index: 10;
	}
</style> 
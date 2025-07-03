<script lang="ts">
	import { untrack, onDestroy } from 'svelte';
	import { formatDate } from '$lib/utils/date-helpers.js';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { createTimeSlotMutation } from '$lib/queries/mutations.js';
	
	// Components
	import MiniMonthCalendar from '$lib/components/MiniMonthCalendar.svelte';
	import TimeRange from '$lib/components/TimeRange.svelte';
	import NumberInput from '$lib/components/NumberInput.svelte';
	import ConflictWarning from './components/ConflictWarning.svelte';
	import RecurringOptions from './components/RecurringOptions.svelte';
	
	// Icons
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Plus from 'lucide-svelte/icons/plus';
	import X from 'lucide-svelte/icons/x';
	
	// Utilities
	import { findNextAvailableTime, checkConflicts, getEndTimeFromDuration, checkRecurringConflicts } from './utils/time-utils.js';
	import { getRecurringPreview, getActualRecurringCount } from './utils/recurring.js';
	
	interface Props {
		tourId: string;
		tour?: any;
		onSuccess?: () => void;
		onCancel?: () => void;
	}
	
	let { tourId, tour: propTour, onSuccess, onCancel }: Props = $props();
	
	// State
	let date = $state('');
	let startTime = $state('');
	let endTime = $state('');
	let capacity = $state(0);
	let recurring = $state(false);
	let recurringEnd = $state('');
	let recurringCount = $state(4);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let touchedFields = $state(new Set<string>());
	let customDuration = $state<number | null>(null);
	let isInitialized = $state(false);
	let lastCreatedSlot = $state<{time: string, date: string} | null>(null);
	let justCreatedSlot = $state(false);
	let autoSuggestedTime = $state(false);
	let resetTimeRangeFlag = $state(false);
	let successMessageTimer: ReturnType<typeof setTimeout> | null = null;
	let errorMessageTimer: ReturnType<typeof setTimeout> | null = null;
	
	// Form data for RecurringOptions - no need for $effect, just create reactive object
	let formData = $state({
		date: '',
		startTime: '',
		endTime: '',
		capacity: 10,
		availability: 'available' as const,
		notes: '',
		recurring: false,
		recurringType: 'weekly' as 'daily' | 'weekly' | 'monthly',
		recurringEnd: '',
		recurringCount: 4
	});
	
	// Sync formData with individual fields reactively
	$effect(() => {
		formData.date = date;
		formData.startTime = startTime;
		formData.endTime = endTime;
		formData.capacity = capacity;
		formData.recurring = recurring;
		formData.recurringEnd = recurringEnd;
		formData.recurringCount = recurringCount;
	});
	
	// Fetch tour details if not provided
	let tourQuery = $derived(propTour ? null : createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 1 * 60 * 1000,
	}));
	
	// Fetch existing schedule
	let scheduleQuery = $derived(createQuery({
		queryKey: queryKeys.tourSchedule(tourId),
		queryFn: () => queryFunctions.fetchTourSchedule(tourId),
		staleTime: 30 * 1000,
	}));
	
	// Get tour data
	let tour = $derived(propTour || $tourQuery?.data?.tour);
	let isLoading = $derived(propTour ? $scheduleQuery.isLoading : ($tourQuery?.isLoading || $scheduleQuery.isLoading));
	
	// Create slots map for calendar
	let slotsMap = $derived.by(() => {
		const map = new Map<string, number>();
		const slots = $scheduleQuery.data?.timeSlots || [];
		slots.forEach((slot: any) => {
			const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
			map.set(slotDate, (map.get(slotDate) || 0) + 1);
		});
		return map;
	});
	
	// Calculate duration
	let duration = $derived.by(() => {
		if (!startTime || !endTime) return 0;
		
		const [startHour, startMinute] = startTime.split(':').map(Number);
		const [endHour, endMinute] = endTime.split(':').map(Number);
		
		const startMinutes = startHour * 60 + startMinute;
		let endMinutes = endHour * 60 + endMinute;
		
		// If end time is before start time, it spans midnight
		if (endMinutes <= startMinutes) {
			endMinutes += 24 * 60; // Add 24 hours
		}
		
		return endMinutes - startMinutes;
	});
	
	// Check for conflicts
	let conflicts = $derived.by(() => {
		if (!date || !startTime || !endTime || isSubmitting) return [];
		const slots = $scheduleQuery.data?.timeSlots || [];
		return checkConflicts(date, startTime, endTime, slots);
	});
	
	// Check for recurring conflicts
	let recurringConflictInfo = $derived.by(() => {
		if (!recurring || !date || !startTime || !endTime || isSubmitting) return null;
		const slots = $scheduleQuery.data?.timeSlots || [];
		return checkRecurringConflicts(formData, slots);
	});
	
	// Form validation
	let isValid = $derived(
		date && 
		startTime && 
		endTime && 
		capacity > 0 && 
		duration > 0 &&
		(recurring ? recurringConflictInfo?.conflictCount === 0 : conflicts.length === 0)
	);
	
	// Initialize form with smart defaults
	$effect(() => {
		if (tour && !isInitialized && !$scheduleQuery.isLoading) {
			untrack(() => {
				isInitialized = true;
				capacity = tour.capacity || 10;
				
				// Set smart date/time defaults
				const today = new Date();
				const tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				
				// Use today if before 8 PM, otherwise tomorrow
				const defaultDate = today.getHours() < 20 ? today : tomorrow;
				date = defaultDate.toISOString().split('T')[0];
				
				// Find next available time
				const currentSlots = $scheduleQuery.data?.timeSlots || [];
				const smartTime = findNextAvailableTime(
					date,
					customDuration,
					lastCreatedSlot?.time || null,
					lastCreatedSlot?.date || '',
					currentSlots,
					tour.duration
				);
				
				// Always use the smart time (it will find a non-conflicting time)
				startTime = smartTime.startTime;
				endTime = smartTime.endTime;
				
				// If suggested a new date, update it
				if (smartTime.suggestedNewDate) {
					const nextDay = new Date(defaultDate);
					nextDay.setDate(nextDay.getDate() + 1);
					date = nextDay.toISOString().split('T')[0];
					
					// Get time for the new date
					const newDayTime = findNextAvailableTime(
						date,
						customDuration,
						null,
						'',
						currentSlots,
						tour.duration
					);
					startTime = newDayTime.startTime;
					endTime = newDayTime.endTime;
				}
			});
		}
	});
	
	// Track start time changes (TimeRange component handles auto-updating end time)
	$effect(() => {
		if (startTime && isInitialized) {
			handleFieldChange('startTime');
		}
	});
	
	// Track changes to end time
	$effect(() => {
		if (endTime && isInitialized) {
			handleFieldChange('endTime');
		}
	});
	
	$effect(() => {
		if (capacity && isInitialized) {
			handleFieldChange('capacity');
		}
	});
	
	// Track custom duration when end time changes
	$effect(() => {
		if (startTime && endTime && touchedFields.has('endTime') && duration > 0) {
			untrack(() => {
				if (duration !== tour?.duration) {
					customDuration = duration;
				}
			});
		}
	});
	
	// Update times when date changes
	$effect(() => {
		if (date && tour && touchedFields.has('date') && !touchedFields.has('startTime')) {
			untrack(() => {
				const currentSlots = $scheduleQuery.data?.timeSlots || [];
				const smartTime = findNextAvailableTime(
					date,
					customDuration,
					lastCreatedSlot?.date === date ? lastCreatedSlot.time : null,
					lastCreatedSlot?.date || '',
					currentSlots,
					tour.duration
				);
				
				startTime = smartTime.startTime;
				endTime = smartTime.endTime;
				
				// Show auto-suggestion hint if we found a conflict-free time
				if (currentSlots.some((slot: any) => {
					const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
					return slotDate === date;
				})) {
					autoSuggestedTime = true;
					setTimeout(() => autoSuggestedTime = false, 3000);
				}
			});
		}
	});
	
	// Get recurring preview
	let recurringPreview = $derived(getRecurringPreview({
		date,
		startTime,
		endTime,
		capacity,
		availability: 'available',
		notes: '',
		recurring,
		recurringType: formData.recurringType,
		recurringEnd,
		recurringCount
	}));
	
	let actualRecurringCount = $derived(getActualRecurringCount({
		date,
		startTime,
		endTime,
		capacity,
		availability: 'available',
		notes: '',
		recurring,
		recurringType: formData.recurringType,
		recurringEnd,
		recurringCount
	}));
	
	// Create mutation
	const createSlotMutation = createTimeSlotMutation(tourId);
	
	// Cleanup timers on component destroy
	onDestroy(() => {
		if (successMessageTimer) {
			clearTimeout(successMessageTimer);
		}
		if (errorMessageTimer) {
			clearTimeout(errorMessageTimer);
		}
	});
	
	// Message dismissal functions
	function dismissSuccessMessage() {
		successMessage = null;
		if (successMessageTimer) {
			clearTimeout(successMessageTimer);
			successMessageTimer = null;
		}
	}
	
	function dismissErrorMessage() {
		error = null;
		if (errorMessageTimer) {
			clearTimeout(errorMessageTimer);
			errorMessageTimer = null;
		}
	}
	
	function setSuccessMessage(message: string) {
		// Clear any existing error message
		dismissErrorMessage();
		
		successMessage = message;
		
		// Auto-dismiss after 5 seconds
		if (successMessageTimer) {
			clearTimeout(successMessageTimer);
		}
		successMessageTimer = setTimeout(() => {
			successMessage = null;
			successMessageTimer = null;
		}, 5000);
	}
	
	function setErrorMessage(message: string) {
		// Clear any existing success message
		dismissSuccessMessage();
		
		error = message;
		
		// Auto-dismiss after 8 seconds (errors need more time to read)
		if (errorMessageTimer) {
			clearTimeout(errorMessageTimer);
		}
		errorMessageTimer = setTimeout(() => {
			error = null;
			errorMessageTimer = null;
		}, 8000);
	}
	
	// Event handlers
	function handleFieldChange(field: string) {
		touchedFields.add(field);
		dismissErrorMessage(); // Clear error when user starts fixing
	}
	
	async function handleSubmit() {
		if (!isValid || isSubmitting) return;
		
		isSubmitting = true;
		error = null;
		
		try {
			const start = new Date(`${date}T${startTime}:00`);
			let end: Date;
			
			// Check if slot spans midnight
			const [startHour, startMinute] = startTime.split(':').map(Number);
			const [endHour, endMinute] = endTime.split(':').map(Number);
			const startMinutes = startHour * 60 + startMinute;
			const endMinutes = endHour * 60 + endMinute;
			
			if (endMinutes <= startMinutes) {
				// Slot spans midnight, end time is on the next day
				const nextDay = new Date(date);
				nextDay.setDate(nextDay.getDate() + 1);
				const nextDayStr = nextDay.toISOString().split('T')[0];
				end = new Date(`${nextDayStr}T${endTime}:00`);
			} else {
				// Same day slot
				end = new Date(`${date}T${endTime}:00`);
			}
			
			const result = await $createSlotMutation.mutateAsync({
				startTime: start.toISOString(),
				endTime: end.toISOString(),
				capacity,
				status: 'available',
				recurring,
				recurringType: recurring ? formData.recurringType : undefined,
				recurringEnd: recurring && recurringEnd ? new Date(recurringEnd).toISOString() : undefined,
				recurringCount: recurring && !recurringEnd ? recurringCount : undefined
			});
			
			setSuccessMessage(recurring && actualRecurringCount > 1
				? `Created ${actualRecurringCount} time slots successfully!` 
				: 'Time slot created successfully!');
			
			// Store last created slot info for smart suggestions
			lastCreatedSlot = { time: startTime, date: date };
			justCreatedSlot = true;
			
			// Reset form for next slot with smart suggestions
			const currentSlots = $scheduleQuery.data?.timeSlots || [];
			const nextTime = findNextAvailableTime(
				date,
				customDuration,
				startTime,
				date,
				currentSlots,
				tour.duration
			);
			
			// If next slot should be on a different day, update the date
			if (nextTime.suggestedNewDate) {
				const nextDay = new Date(date);
				nextDay.setDate(nextDay.getDate() + 1);
				date = nextDay.toISOString().split('T')[0];
				touchedFields.delete('date'); // Allow date change to trigger time update
			}
			
			startTime = nextTime.startTime;
			endTime = nextTime.endTime;
			
			// Show auto-suggestion hint
			autoSuggestedTime = true;
			setTimeout(() => autoSuggestedTime = false, 3000);
			
			// Reset other fields
			recurring = false;
			recurringCount = 4;
			recurringEnd = '';
			
			// Clear touched fields to allow auto-calculation
			touchedFields.clear();
			
			// Reset TimeRange manual flag
			resetTimeRangeFlag = true;
			setTimeout(() => resetTimeRangeFlag = false, 100);
			
			// Call success callback after a short delay
			setTimeout(() => {
				justCreatedSlot = false;
				// Don't close the form, let user create more slots
			}, 3000);
			
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : 'Failed to create time slot');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="time-slot-form">
	{#if isLoading}
		<div class="loading-state">
			<Loader2 class="w-8 h-8 animate-spin" />
			<p>Loading tour details...</p>
		</div>
	{:else if !tour}
		<div class="error-state">
			<AlertCircle class="w-8 h-8" />
			<p>Tour not found</p>
		</div>
	{:else}
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<!-- Success Message -->
			{#if successMessage}
				<div class="alert-success mb-4">
					<CheckCircle class="w-5 h-5" />
					<span class="alert-message">{successMessage}</span>
					<button 
						type="button" 
						class="alert-dismiss"
						onclick={dismissSuccessMessage}
						aria-label="Dismiss success message"
					>
						<X class="w-4 h-4" />
					</button>
				</div>
			{/if}
			
			<!-- Error Message -->
			{#if error}
				<div class="alert-error mb-4">
					<AlertCircle class="w-5 h-5" />
					<span class="alert-message">{error}</span>
					<button 
						type="button" 
						class="alert-dismiss"
						onclick={dismissErrorMessage}
						aria-label="Dismiss error message"
					>
						<X class="w-4 h-4" />
					</button>
				</div>
			{/if}
			
			<!-- Conflict Warning -->
			{#if conflicts.length > 0 && !recurring}
				<ConflictWarning {conflicts} {justCreatedSlot} />
			{/if}
			
			<!-- Recurring Conflict Warning -->
			{#if recurring && recurringConflictInfo?.hasConflicts}
				<div class="alert-error mb-4">
					<AlertCircle class="w-5 h-5" />
					<span>
						{recurringConflictInfo.conflictCount} of {actualRecurringCount} recurring slots conflict with existing time slots. 
						Please adjust your schedule.
					</span>
				</div>
			{/if}
			
			<div class="form-grid">
				<!-- Date Selection -->
				<div class="form-section">
					<div class="section-header">
						<Calendar class="w-5 h-5" />
						<h3>Select Date</h3>
					</div>
					
					<MiniMonthCalendar
						slotsMap={slotsMap}
						selectedDate={date}
						minDate={new Date().toISOString().split('T')[0]}
						onDateClick={(newDate) => {
							date = newDate;
							handleFieldChange('date');
						}}
					/>
					
					{#if date}
						<div class="selected-date-info">
							<span>Selected:</span>
							<strong>{formatDate(date)}</strong>
						</div>
					{/if}
				</div>
				
				<!-- Time & Details -->
				<div class="form-section">
					<div class="section-header">
						<Clock class="w-5 h-5" />
						<h3>Time & Details</h3>
					</div>
					
					<div class="form-fields">
						<!-- Time Selection -->
						<div class="form-field">
							<TimeRange
								bind:startTime
								bind:endTime
								label=""
								defaultDuration={tour.duration}
								resetManualFlag={resetTimeRangeFlag}
								onEndTimeChange={(time) => {
									handleFieldChange('endTime');
								}}
							/>
							{#if autoSuggestedTime}
								<p class="auto-suggest-hint">
									<CheckCircle class="w-4 h-4 inline" />
									Found next available time slot
								</p>
							{/if}
						</div>
						
						<!-- Capacity -->
						<div class="form-field">
							<label for="capacity" class="form-label">
								<Users class="w-4 h-4 inline mr-1" />
								Max Group Size
							</label>
							<div class="capacity-input-wrapper">
								<NumberInput
									id="capacity"
									name="capacity"
									label=""
									bind:value={capacity}
									min={1}
									max={500}
									step={1}
									integerOnly={true}
								/>
							</div>
							{#if tour.capacity && capacity !== tour.capacity}
								<button 
									type="button"
									onclick={() => capacity = tour.capacity}
									class="button--text button--small mt-1 max-w-fit"
								>
									Use tour default ({tour.capacity} guests)
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>
			
			<!-- Recurring Options -->
			<div class="recurring-options-container">
				<RecurringOptions
					formData={formData}
					isEditMode={false}
					onRecurringChange={() => {
						// Sync changes back to individual fields
						recurring = formData.recurring;
						recurringEnd = formData.recurringEnd;
						recurringCount = formData.recurringCount;
						handleFieldChange('recurring');
					}}
				/>
			</div>
			
			<!-- Form Actions -->
			<div class="form-actions">
				{#if justCreatedSlot}
					<button 
						type="button" 
						onclick={() => {
							onSuccess?.();
						}}
						class="button-secondary"
					>
						Finish
					</button>
					<button 
						type="submit"
						class="button-primary"
						disabled={!isValid || isSubmitting}
					>
						{#if isSubmitting}
							<Loader2 class="w-4 h-4 animate-spin" />
							Creating...
						{:else}
							<Plus class="w-4 h-4" />
							Create Another Slot
						{/if}
					</button>
				{:else}
					<button 
						type="button" 
						onclick={onCancel}
						class="button-secondary"
						disabled={isSubmitting}
					>
						Cancel
					</button>
					<button 
						type="submit"
						class="button-primary"
						disabled={!isValid || isSubmitting}
					>
						{#if isSubmitting}
							<Loader2 class="w-4 h-4 animate-spin" />
							Creating...
						{:else}
							<Plus class="w-4 h-4" />
							Create {recurring && actualRecurringCount > 1 ? `${actualRecurringCount} Slots` : 'Slot'}
						{/if}
					</button>
				{/if}
			</div>
		</form>
	{/if}
</div>

<style>
	.time-slot-form {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
	}
	
	@media (max-width: 768px) {
		.time-slot-form {
			padding: 0;
		}
	}
	
	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 4rem 2rem;
		text-align: center;
		color: var(--text-tertiary);
	}
	
	.alert-success {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: 500;
		background: var(--color-success-50);
		color: var(--color-success-700);
		border: 1px solid var(--color-success-200);
		position: relative;
	}
	
	.alert-error {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: 500;
		background: var(--color-error-50);
		color: var(--color-error-700);
		border: 1px solid var(--color-error-200);
		position: relative;
	}
	
	.alert-message {
		flex: 1;
		min-width: 0;
	}
	
	.alert-dismiss {
		background: transparent;
		border: none;
		color: inherit;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.7;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}
	
	.alert-dismiss:hover {
		opacity: 1;
		background: rgba(0, 0, 0, 0.1);
	}
	
	.alert-dismiss:focus {
		outline: none;
		opacity: 1;
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
	}
	
	@media (max-width: 768px) {
		.alert-success,
		.alert-error {
			position: sticky;
			top: 0;
			z-index: 100;
			margin-left: -1.5rem;
			margin-right: -1.5rem;
			margin-top: -1.5rem;
			margin-bottom: 1rem;
			border-radius: 0;
			box-shadow: var(--shadow-md);
		}
	}
	
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}
	
	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}
	
	.form-section {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		box-shadow: var(--shadow-sm);
	}
	
	@media (max-width: 768px) {
		.form-section {
			border: none;
			padding: 0.75rem;
			background: transparent;
			box-shadow: none;
		}
	}
	
	.section-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-primary);
		color: var(--text-secondary);
	}
	
	@media (max-width: 768px) {
		.section-header {
			margin-bottom: 0.75rem;
			padding-bottom: 0.5rem;
			border-bottom: 1px solid var(--border-secondary);
		}
	}
	
	.section-header h3 {
		margin: 0;
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.selected-date-info {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
	}
	
	@media (max-width: 768px) {
		.selected-date-info {
			margin-top: 0.75rem;
			padding: 0.5rem 0.75rem;
			background: var(--bg-tertiary);
			border-radius: var(--radius-sm);
		}
	}
	
	.selected-date-info strong {
		color: var(--text-primary);
	}
	
	.form-fields {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	@media (max-width: 768px) {
		.form-fields {
			gap: 1rem;
		}
	}
	
	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.recurring-options-container {
		display: flex;
		justify-content: center;
		width: 100%;
		margin-top: 1.5rem;
	}
	
	.recurring-options-container :global(.recurring-container) {
		width: 100%;
		max-width: 800px;
		margin: 0;
	}
	
	@media (max-width: 768px) {
		.recurring-options-container {
			margin-top: 1rem;
		}
	}
	
	.form-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border-primary);
	}
	
	@media (max-width: 768px) {
		.form-actions {
			margin-top: 1.5rem;
			padding-top: 1.5rem;
			border-top: 1px solid var(--border-secondary);
		}
	}
	
	/* Make TimeRange fit properly */
	.form-field :global(.time-range) {
		width: 100%;
	}
	
	/* Constrain capacity input width */
	.capacity-input-wrapper {
		max-width: 150px;
	}
	
	@media (max-width: 768px) {
		.capacity-input-wrapper {
			max-width: 200px;
		}
	}
	
	/* Button styles */
	.form-actions button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.button--text {
		background: transparent;
		border: none;
		color: var(--color-primary-600);
		padding: 0.25rem 0.5rem;
		font-size: var(--text-xs);
		cursor: pointer;
		transition: all var(--transition-fast) ease;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	
	.button--text:hover {
		color: var(--color-primary-700);
		background: var(--bg-secondary);
		border-radius: var(--radius-sm);
	}
	
	.button--text.button--small {
		padding: 0.125rem 0.375rem;
		font-size: 0.75rem;
	}
	
	.auto-suggest-hint {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: var(--text-sm);
		color: var(--color-success-600);
		margin-top: 0.5rem;
		animation: fadeIn 0.3s ease;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style> 
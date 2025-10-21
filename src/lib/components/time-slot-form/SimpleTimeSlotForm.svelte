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
	import CapacitySlider from '$lib/components/CapacitySlider.svelte';
	import NumberInput from '$lib/components/NumberInput.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import ConflictWarning from './components/ConflictWarning.svelte';
	import DaySlotPreview from './components/DaySlotPreview.svelte';
	import MultiDayTimeRange from './components/MultiDayTimeRange.svelte';
	
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
	
	// Helper function to get last used capacity from existing time slots
	function getLastUsedCapacity(timeSlots: any[]): number | null {
		if (!timeSlots || timeSlots.length === 0) return null;
		
		// Sort by creation time descending and get the first one
		const sortedSlots = [...timeSlots].sort((a, b) => {
			const aTime = new Date(a.createdAt || a.created || a.startTime).getTime();
			const bTime = new Date(b.createdAt || b.created || b.startTime).getTime();
			return bTime - aTime; // Most recent first
		});
		
		// Check both field names for compatibility
		// API returns 'capacity' but database stores as 'availableSpots'
		return sortedSlots[0]?.capacity || sortedSlots[0]?.availableSpots || null;
	}
	
	// State
	let date = $state('');
	let startTime = $state('');
	let endTime = $state('');
	let endDate = $state('');
	let capacity = $state(0);
	

	let recurring = $state(false);
	let recurringEnd = $state('');
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let touchedFields = $state(new Set<string>());
	let customDuration = $state<number | null>(null);
	let isInitialized = $state(false);
	let lastCreatedSlot = $state<{time: string, date: string, capacity: number} | null>(null);
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
		endDate: '',
		capacity: 10,
		availability: 'available' as const,
		notes: '',
		recurring: false,
		recurringType: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
		recurringEnd: ''
	});
	
	// Sync formData with individual fields reactively
	$effect(() => {
		formData.date = date;
		formData.startTime = startTime;
		formData.endTime = endTime;
		formData.endDate = endDate;
		formData.capacity = capacity;
		formData.recurring = recurring;
		formData.recurringEnd = recurringEnd;
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
	
	// Create slots map for calendar (including multi-day spans)
	let slotsMap = $derived.by(() => {
		const map = new Map<string, number>();
		const slots = $scheduleQuery.data?.timeSlots || [];
		
		slots.forEach((slot: any) => {
			const startDate = new Date(slot.startTime);
			const endDate = new Date(slot.endTime);
			
			// Reset times to compare dates only
			startDate.setHours(0, 0, 0, 0);
			endDate.setHours(0, 0, 0, 0);
			
			// Add entry for each day the slot spans
			const currentDate = new Date(startDate);
			while (currentDate <= endDate) {
				const dateStr = currentDate.toISOString().split('T')[0];
				map.set(dateStr, (map.get(dateStr) || 0) + 1);
				currentDate.setDate(currentDate.getDate() + 1);
			}
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
		if (!date || isSubmitting) return [];
		const slots = $scheduleQuery.data?.timeSlots || [];
		
		// Check main slot
		return startTime && endTime ? checkConflicts(date, startTime, endTime, slots, endDate) : [];
	});
	
	// Check for recurring conflicts
	let recurringConflictInfo = $derived.by(() => {
		if (!recurring || !date || !startTime || !endTime || isSubmitting) return null;
		const slots = $scheduleQuery.data?.timeSlots || [];
		return checkRecurringConflicts(formData, slots);
	});
	
	// Form validation
	let isValid = $derived.by(() => {
		// Basic validation
		if (!date || !startTime || !endTime || capacity <= 0 || duration <= 0) return false;
		
		// Multi-day validation
		if (tour?.duration > 1440 && !endDate) return false;
		
		// Check recurring requirements
		if (recurring && (!formData.recurringEnd || new Date(formData.recurringEnd) <= new Date(date))) return false;
		
		// Check if recurring conflicts exist
		if (recurring && (recurringConflictInfo?.conflictCount || 0) > 0) return false;
		
		// Note: We allow overlapping time slots - conflicts are shown as warnings but don't block creation
		// This supports multiple guides, different capacity tiers, or offering same time with different options
		
		return true;
	});
	
	// Initialize form with smart defaults
	$effect(() => {
		if (tour && !isInitialized && !$scheduleQuery.isLoading) {
			untrack(() => {
				isInitialized = true;
				// Use capacity from most recent time slot, or default to tour's maxCapacity
				const currentSlots = $scheduleQuery.data?.timeSlots || [];
				const lastUsedCapacity = getLastUsedCapacity(currentSlots);
				capacity = lastUsedCapacity || (tour as any).maxCapacity || tour.capacity || 10;
				
				// Set smart date/time defaults
				const today = new Date();
				const tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				
				// Use today if before 8 PM, otherwise tomorrow
				const defaultDate = today.getHours() < 20 ? today : tomorrow;
				date = defaultDate.toISOString().split('T')[0];
				
				// Find next available time
				const smartTime = findNextAvailableTime(
					date,
					customDuration,
					lastCreatedSlot?.time || null,
					lastCreatedSlot?.date || '',
					currentSlots,
					tour.duration
				);
				
				// Always use the smart time (it will find a non-conflicting time)
				startTime = smartTime.startTime || '10:00';
				endTime = smartTime.endTime;
				endDate = smartTime.endDate || '';
				
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
					startTime = newDayTime.startTime || '10:00';
					endTime = newDayTime.endTime;
					endDate = newDayTime.endDate || '';
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
				// If no start time is set yet, default to 10:00
				if (!startTime) {
					startTime = '10:00';
				}
				
				const currentSlots = $scheduleQuery.data?.timeSlots || [];
				const smartTime = findNextAvailableTime(
					date,
					customDuration || tour.duration,
					lastCreatedSlot?.date === date ? lastCreatedSlot.time : null,
					lastCreatedSlot?.date || '',
					currentSlots,
					tour.duration
				);
				
				startTime = smartTime.startTime || '10:00';
				endTime = smartTime.endTime;
				endDate = smartTime.endDate || '';
				
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
		recurringType: formData.recurringType === 'none' ? 'weekly' : formData.recurringType,
		recurringEnd,
		recurringCount: 0
	}));
	
	let actualRecurringCount = $derived(getActualRecurringCount({
		date,
		startTime,
		endTime,
		capacity,
		availability: 'available',
		notes: '',
		recurring,
		recurringType: formData.recurringType === 'none' ? 'weekly' : formData.recurringType,
		recurringEnd,
		recurringCount: 0
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
			// Prepare slot to create
			const mainStart = new Date(`${date}T${startTime}:00`);
			let mainEnd: Date;
			
			// Handle multi-day slots
			if (endDate && endDate !== date) {
				// Multi-day slot
				mainEnd = new Date(`${endDate}T${endTime}:00`);
			} else {
				// Same day or overnight slot
				const [startHour, startMinute] = startTime.split(':').map(Number);
				const [endHour, endMinute] = endTime.split(':').map(Number);
				const startMinutes = startHour * 60 + startMinute;
				const endMinutes = endHour * 60 + endMinute;
				
				if (endMinutes <= startMinutes) {
					// Slot spans midnight, end time is on the next day
					const nextDay = new Date(date);
					nextDay.setDate(nextDay.getDate() + 1);
					const nextDayStr = nextDay.toISOString().split('T')[0];
					mainEnd = new Date(`${nextDayStr}T${endTime}:00`);
				} else {
					// Same day slot
					mainEnd = new Date(`${date}T${endTime}:00`);
				}
			}
			
			const slotData = {
				startTime: mainStart.toISOString(),
				endTime: mainEnd.toISOString(),
				capacity,
				status: 'available',
				recurring,
				recurringType: recurring && formData.recurringType !== 'none' ? formData.recurringType : undefined,
				recurringEnd: recurring && formData.recurringEnd ? new Date(formData.recurringEnd).toISOString() : undefined
			};
			
			// Create slot
			await $createSlotMutation.mutateAsync(slotData);
			
			const totalMessage = recurring && actualRecurringCount > 1 
				? `Created ${actualRecurringCount} time slots successfully!`
				: 'Time slot created successfully!';
			
			setSuccessMessage(totalMessage);
			
			// Store last created slot info for smart suggestions
			lastCreatedSlot = { time: startTime, date: date, capacity: capacity };
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
			formData.recurringType = 'none';
			recurringEnd = '';
			
			// Clear touched fields to allow auto-calculation
			touchedFields.clear();
			
			// Reset TimeRange manual flag
			resetTimeRangeFlag = true;
			setTimeout(() => resetTimeRangeFlag = false, 100);
			
			// Keep the "justCreatedSlot" state - don't revert buttons
			// This provides better UX by keeping "Finish" and "Create Another" buttons
			
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
						<Calendar class="w-6 h-6" />
						<h3>Select Date</h3>
					</div>
					
					<p class="section-hint">
						Click on a date to view existing time slots
					</p>
					
					<MiniMonthCalendar
						slotsMap={slotsMap}
						selectedDate={date}
						minDate={new Date().toISOString().split('T')[0]}
						size="large"
						onDateClick={(newDate) => {
							date = newDate;
							handleFieldChange('date');
						}}
					/>
					
					{#if date}
						<!-- Show selected date and existing slots -->
						<DaySlotPreview 
							date={date}
							slots={$scheduleQuery.data?.timeSlots || []}
							isVisible={!!date}
						/>
					{/if}
				</div>
				
				<!-- Time & Details -->
				<div class="form-section">
					<div class="section-header">
						<Clock class="w-6 h-6" />
						<h3>Time & Details</h3>
					</div>
					
					<div class="form-fields">
						<!-- Time Selection -->
						<div class="form-field time-field">
							{#if tour.duration > 1440}
								<!-- Multi-day tour: use MultiDayTimeRange -->
								<MultiDayTimeRange
									bind:startDate={date}
									bind:startTime
									bind:endDate
									bind:endTime
									label=""
									tourDuration={tour.duration}
									onStartTimeChange={() => handleFieldChange('startTime')}
									onEndTimeChange={() => handleFieldChange('endTime')}
									onEndDateChange={() => handleFieldChange('endDate')}
								/>
							{:else}
								<!-- Single-day tour: use TimeRange -->
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
							{/if}
							{#if autoSuggestedTime}
								<p class="auto-suggest-hint">
									<CheckCircle class="w-4 h-4 inline" />
									Found next available time slot
								</p>
							{/if}
						</div>
						
						<!-- Capacity -->
						<div class="capacity-field">
							<CapacitySlider
								bind:value={capacity}
								label="Max Group Size"
								min={1}
								max={200}
								step={1}
								defaultValue={(tour as any)?.maxCapacity || tour?.capacity || 10}
								onChange={(value) => {
									capacity = value;
									handleFieldChange('capacity');
								}}
							/>
						</div>
						
						<!-- Recurring Options -->
						<div class="recurring-field">
							<label class="form-label">Repeat Options</label>
							<div class="repeat-options">
								<label class="repeat-option">
									<input 
										type="radio" 
										bind:group={formData.recurringType} 
										value="none" 
										name="recurringType"
										onchange={() => {
											recurring = false;
											formData.recurringEnd = '';
											handleFieldChange('recurring');
										}}
									/>
									<span>Create single slot</span>
								</label>
								<label class="repeat-option">
									<input 
										type="radio" 
										bind:group={formData.recurringType} 
										value="daily"
										name="recurringType"
										onchange={() => {
											recurring = true;
											// Set default end date to 2 weeks from selected date
											const endDate = new Date(date);
											endDate.setDate(endDate.getDate() + 14); // 2 weeks
											formData.recurringEnd = endDate.toISOString().split('T')[0];
											handleFieldChange('recurring');
										}}
									/>
									<span>Repeat daily</span>
								</label>
								<label class="repeat-option">
									<input 
										type="radio" 
										bind:group={formData.recurringType} 
										value="weekly"
										name="recurringType"
										onchange={() => {
											recurring = true;
											// Set default end date to 4 weeks from selected date
											const endDate = new Date(date);
											endDate.setDate(endDate.getDate() + 28); // 4 weeks
											formData.recurringEnd = endDate.toISOString().split('T')[0];
											handleFieldChange('recurring');
										}}
									/>
									<span>Repeat weekly</span>
								</label>
								<label class="repeat-option">
									<input 
										type="radio" 
										bind:group={formData.recurringType} 
										value="monthly"
										name="recurringType"
										onchange={() => {
											recurring = true;
											// Set default end date to 6 months from selected date
											const endDate = new Date(date);
											endDate.setMonth(endDate.getMonth() + 6); // 6 months
											formData.recurringEnd = endDate.toISOString().split('T')[0];
											handleFieldChange('recurring');
										}}
									/>
									<span>Repeat monthly</span>
								</label>
							</div>
							
							<!-- Reserve space to prevent layout jumping -->
							<div class="repeat-details-container">
								{#if recurring}
									<div class="repeat-details">
										<div class="repeat-until">
											<DatePicker
												bind:value={formData.recurringEnd}
												label="Until date"
												placeholder="Select end date"
												minDate={date}
												onchange={() => handleFieldChange('recurring')}
											/>
										</div>
										
										{#if actualRecurringCount > 1}
											<div class="repeat-preview">
												Will create {actualRecurringCount} {formData.recurringType} slots until {new Date(formData.recurringEnd).toLocaleDateString()}
											</div>
										{/if}
									</div>
								{:else}
									<!-- Reserve space for date picker to prevent layout jumping -->
									<div class="repeat-spacer"></div>
								{/if}
							</div>
						</div>

					</div>
				</div>
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
							{#if recurring && actualRecurringCount > 1}
								Create {actualRecurringCount} Slots
							{:else}
								Create Slot
							{/if}
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
		max-width: 1200px;
		margin: 0 auto;
	}
	
	@media (max-width: 1400px) {
		.time-slot-form {
			max-width: 1000px;
		}
	}
	
	@media (max-width: 1200px) {
		.time-slot-form {
			max-width: 900px;
		}
	}
	
	@media (max-width: 768px) {
		.time-slot-form {
			padding: 0;
			max-width: 100%;
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
		gap: 2.5rem;
		margin-bottom: 1.5rem;
	}
	
	@media (max-width: 1200px) {
		.form-grid {
			gap: 2rem;
		}
	}
	
	@media (max-width: 1024px) {
		.form-grid {
			gap: 1.5rem;
		}
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
		padding: 2.5rem;
		box-shadow: var(--shadow-sm);
	}
	
	/* Allow calendar to use full width in form context */
	.form-section :global(.calendar-container) {
		max-width: none;
		width: 100%;
	}
	
	@media (max-width: 1024px) {
		.form-section {
			padding: 2rem;
		}
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
		gap: 0.75rem;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--border-primary);
		color: var(--text-secondary);
	}
	
	@media (max-width: 768px) {
		.section-header {
			margin-bottom: 0.75rem;
			padding-bottom: 0.5rem;
			border-bottom: 1px solid var(--border-secondary);
			gap: 0.5rem;
		}
	}
	
	.section-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	@media (max-width: 768px) {
		.section-header h3 {
			font-size: var(--text-base);
		}
		
		.section-header :global(svg) {
			width: 1.25rem;
			height: 1.25rem;
		}
	}
	
	.section-hint {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		margin: -0.5rem 0 1rem 0;
		font-style: italic;
	}
	
	@media (max-width: 768px) {
		.section-hint {
			margin: -0.25rem 0 0.75rem 0;
		}
	}
	

	
	.form-fields {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}
	
	@media (max-width: 1024px) {
		.form-fields {
			gap: 2rem;
		}
	}
	
	@media (max-width: 768px) {
		.form-fields {
			gap: 1.5rem;
		}
	}
	
	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	/* Time field specific */
	.time-field {
		margin-bottom: 0;
	}
	

	
	.capacity-field {
		width: 100%;
	}
	
	/* Recurring field styles */
	.recurring-field {
		width: 100%;
	}
	
	.repeat-details-container {
		width: 100%;
		min-height: 140px; /* Reserve space to prevent layout jumping */
	}
	
	.repeat-spacer {
		height: 140px; /* Match the typical height of repeat-details */
		width: 100%;
	}
	
	.repeat-options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	
	@media (max-width: 640px) {
		.repeat-options {
			grid-template-columns: 1fr;
		}
		
		.repeat-details-container {
			min-height: 120px; /* Slightly smaller on mobile */
		}
		
		.repeat-spacer {
			height: 120px;
		}
	}
	
	.repeat-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		transition: all 0.15s ease;
		background: var(--bg-primary);
	}
	
	.repeat-option:hover {
		border-color: var(--color-primary-300);
		background: var(--color-primary-50);
	}
	
	.repeat-option:has(input:checked) {
		border-color: var(--color-primary-500);
		background: var(--color-primary-100);
	}
	
	.repeat-option input[type="radio"] {
		width: 1rem;
		height: 1rem;
		margin: 0;
		accent-color: var(--color-primary-500);
	}
	
	.repeat-option span {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.repeat-details {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-secondary);
		border-radius: var(--radius-md);
		margin-top: 0.5rem;
	}
	

	
	.repeat-until {
		width: 100%;
	}
	
	.repeat-preview {
		font-size: 0.8125rem;
		color: var(--color-primary-600);
		font-weight: 500;
		padding: 0.5rem 0.75rem;
		background: var(--color-primary-50);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-primary-200);
	}
	
	/* Add more slots section */
	.add-more-field {
		margin-top: 0.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-secondary);
	}
	
	.add-more-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: transparent;
		border: 2px dashed var(--border-secondary);
		color: var(--text-secondary);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		width: fit-content;
	}
	
	.add-more-button:hover {
		border-color: var(--color-primary-500);
		color: var(--color-primary-600);
		background: var(--color-primary-50);
	}
	
	.help-text {
		font-size: var(--text-xs);
		color: var(--text-secondary);
		margin: 0.5rem 0 0 0;
		font-style: italic;
	}
	
	/* Additional slots redesign */
	.additional-slot {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-secondary);
		border-radius: var(--radius-md);
		animation: slideIn 0.2s ease;
	}
	
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.additional-slot-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}
	
	.slot-number {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.remove-slot-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		background: transparent;
		border: none;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: all 0.15s ease;
		border-radius: var(--radius-sm);
	}
	
	.remove-slot-button:hover {
		background: var(--color-error-50);
		color: var(--color-error-600);
	}
	
	/* Simplified slot time row */
	.slot-time-row {
		display: flex;
		align-items: flex-end;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
	}
	
	.time-input-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 90px;
	}
	
	.time-label {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		font-weight: 400;
	}
	
	.time-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		background: var(--bg-input);
		color: var(--text-primary);
		font-size: var(--text-sm);
		font-weight: 500;
		transition: all var(--transition-fast) ease;
	}
	
	.time-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 2px var(--color-primary-200);
	}
	
	.time-input:hover {
		border-color: var(--border-secondary);
	}
	
	.time-separator {
		color: var(--text-tertiary);
		font-size: var(--text-sm);
		padding-bottom: 0.5rem;
	}
	
	/* Inline duration display */
	.slot-duration-inline {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-tertiary);
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		font-size: var(--text-xs);
		white-space: nowrap;
		flex-shrink: 0;
	}
	
	.slot-duration-inline .duration-text {
		font-weight: 500;
	}
	
	.reset-duration-inline {
		margin-left: 0.25rem;
		padding: 0.125rem 0.375rem;
		font-size: 0.6875rem;
		background: transparent;
		border: 1px solid var(--border-secondary);
		color: var(--text-secondary);
		border-radius: var(--radius-xs);
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}
	
	.reset-duration-inline:hover {
		background: var(--color-primary-50);
		border-color: var(--color-primary-200);
		color: var(--color-primary-700);
	}
	
	/* Capacity row */
	.slot-capacity-row {
		width: 100%;
		margin-top: 0.5rem;
	}
	
	/* Recurring options container */
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
	
	/* Form actions */
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
	
	/* Button styles in form actions */
	.form-actions button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	/* Auto suggest hint animation */
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
	
	/* Additional slot content wrapper */
	.additional-slot-content {
		width: 100%;
	}
	
	/* Make TimeRange fit properly */
	.form-field :global(.time-range) {
		width: 100%;
	}
	
	/* Mobile adjustments */
	@media (max-width: 768px) {
		.additional-slot {
			margin-top: 0.75rem;
			padding: 0.75rem;
		}
		
		.slot-time-row {
			gap: 0.5rem;
			margin-bottom: 0.5rem;
		}
		
		.time-input-wrapper {
			min-width: 80px;
		}
		
		.time-input {
			font-size: var(--text-sm);
			padding: 0.375rem 0.5rem;
		}
		
		.slot-duration-inline {
			order: 10;
			width: 100%;
			margin-top: 0.5rem;
			justify-content: center;
		}
	}
</style> 
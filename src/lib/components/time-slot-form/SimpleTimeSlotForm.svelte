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
	import DaySlotPreview from './components/DaySlotPreview.svelte';
	
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
	
	// Multiple time slots for the same date
	interface TimeSlotEntry {
		id: string;
		startTime: string;
		endTime: string;
		capacity: number;
	}
	
	let additionalSlots = $state<TimeSlotEntry[]>([]);
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
	
	// Check for conflicts (including additional slots)
	let conflicts = $derived.by(() => {
		if (!date || isSubmitting) return [];
		const slots = $scheduleQuery.data?.timeSlots || [];
		
		// Check main slot
		const mainConflicts = startTime && endTime ? checkConflicts(date, startTime, endTime, slots) : [];
		
		// Check additional slots
		const additionalConflicts = additionalSlots
			.filter(slot => slot.startTime && slot.endTime)
			.flatMap(slot => checkConflicts(date, slot.startTime, slot.endTime, slots));
		
		// Check for conflicts between main slot and additional slots
		const internalConflicts: any[] = [];
		if (startTime && endTime) {
			additionalSlots
				.filter(slot => slot.startTime && slot.endTime)
				.forEach(slot => {
					// Create a mock slot array to check conflicts between main and additional
					const mockSlot = {
						id: 'temp',
						startTime: new Date(`${date}T${slot.startTime}:00`).toISOString(),
						endTime: new Date(`${date}T${slot.endTime}:00`).toISOString()
					};
					const conflicts = checkConflicts(date, startTime, endTime, [mockSlot]);
					internalConflicts.push(...conflicts);
				});
		}
		
		// Check conflicts between additional slots
		additionalSlots.forEach((slotA, indexA) => {
			if (!slotA.startTime || !slotA.endTime) return;
			
			additionalSlots.slice(indexA + 1).forEach(slotB => {
				if (!slotB.startTime || !slotB.endTime) return;
				
				const mockSlot = {
					id: 'temp',
					startTime: new Date(`${date}T${slotB.startTime}:00`).toISOString(),
					endTime: new Date(`${date}T${slotB.endTime}:00`).toISOString()
				};
				const conflicts = checkConflicts(date, slotA.startTime, slotA.endTime, [mockSlot]);
				internalConflicts.push(...conflicts.map(c => ({ ...c, isInternal: true })));
			});
		});
		
		return [...mainConflicts, ...additionalConflicts, ...internalConflicts];
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
		
		// Check if recurring conflicts exist
		if (recurring && (recurringConflictInfo?.conflictCount || 0) > 0) return false;
		
		// Check if there are any conflicts
		if (conflicts.length > 0) return false;
		
		// Validate additional slots
		const validAdditionalSlots = additionalSlots.every(slot => {
			if (!slot.startTime || !slot.endTime || slot.capacity <= 0) return false;
			
			// Calculate duration for additional slot
			const [startHour, startMinute] = slot.startTime.split(':').map(Number);
			const [endHour, endMinute] = slot.endTime.split(':').map(Number);
			const startMinutes = startHour * 60 + startMinute;
			let endMinutes = endHour * 60 + endMinute;
			
			// Handle midnight crossing
			if (endMinutes <= startMinutes) {
				endMinutes += 24 * 60;
			}
			
			const slotDuration = endMinutes - startMinutes;
			return slotDuration > 0;
		});
		
		return validAdditionalSlots;
	});
	
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
	
	// Additional slots management
	function addTimeSlot() {
		// Calculate smart defaults for the new slot
		let suggestedStartTime = '';
		let suggestedEndTime = '';
		
		// Get the last slot's end time to suggest the next slot
		let lastEndTime = '';
		if (additionalSlots.length > 0) {
			// Use the last additional slot's end time
			const lastSlot = additionalSlots[additionalSlots.length - 1];
			lastEndTime = lastSlot.endTime;
		} else if (endTime) {
			// Use the main slot's end time
			lastEndTime = endTime;
		}
		
		if (lastEndTime) {
			// Add 15 minutes buffer after the last slot
			const [hours, minutes] = lastEndTime.split(':').map(Number);
			let totalMinutes = hours * 60 + minutes + 15; // 15 min buffer
			
			// Handle day overflow
			if (totalMinutes >= 24 * 60) {
				totalMinutes = totalMinutes % (24 * 60);
			}
			
			const startHours = Math.floor(totalMinutes / 60);
			const startMinutes = totalMinutes % 60;
			suggestedStartTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
			
			// Calculate end time based on tour duration or custom duration
			const slotDuration = customDuration || tour?.duration || 60;
			const endTotalMinutes = totalMinutes + slotDuration;
			const endHours = Math.floor(endTotalMinutes / 60) % 24;
			const endMinutes = endTotalMinutes % 60;
			suggestedEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
			
			// Check for conflicts with existing slots
			const currentSlots = $scheduleQuery.data?.timeSlots || [];
			const allSlots = [
				...currentSlots,
				// Include main slot if it has times
				...(startTime && endTime ? [{
					startTime: new Date(`${date}T${startTime}:00`).toISOString(),
					endTime: new Date(`${date}T${endTime}:00`).toISOString()
				}] : []),
				// Include existing additional slots
				...additionalSlots.map(slot => ({
					startTime: new Date(`${date}T${slot.startTime}:00`).toISOString(),
					endTime: new Date(`${date}T${slot.endTime}:00`).toISOString()
				}))
			];
			
			// Find next available time that doesn't conflict
			const nextTime = findNextAvailableTime(
				date,
				slotDuration,
				suggestedStartTime,
				date,
				allSlots,
				slotDuration
			);
			
			suggestedStartTime = nextTime.startTime;
			suggestedEndTime = nextTime.endTime;
		} else {
			// Fallback to default times
			suggestedStartTime = '10:00';
			const defaultDuration = customDuration || tour?.duration || 60;
			const [hours, minutes] = suggestedStartTime.split(':').map(Number);
			const totalMinutes = hours * 60 + minutes + defaultDuration;
			const endHours = Math.floor(totalMinutes / 60);
			const endMinutes = totalMinutes % 60;
			suggestedEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
		}
		
		const newSlot: TimeSlotEntry = {
			id: crypto.randomUUID(),
			startTime: suggestedStartTime,
			endTime: suggestedEndTime,
			capacity: capacity || tour?.capacity || 10
		};
		additionalSlots = [...additionalSlots, newSlot];
	}
	
	function removeTimeSlot(id: string) {
		additionalSlots = additionalSlots.filter(slot => slot.id !== id);
	}
	
	function updateTimeSlot(id: string, field: keyof TimeSlotEntry, value: string | number) {
		additionalSlots = additionalSlots.map(slot => 
			slot.id === id ? { ...slot, [field]: value } : slot
		);
	}
	
	// Calculate duration for additional slots
	function calculateSlotDuration(startTime: string, endTime: string): number {
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
	}
	
	// Reset slot duration to tour default
	function resetSlotDuration(id: string) {
		const slot = additionalSlots.find(s => s.id === id);
		if (!slot || !slot.startTime) return;
		
		const defaultDuration = customDuration || tour?.duration || 60;
		const [startHour, startMinute] = slot.startTime.split(':').map(Number);
		const startMinutes = startHour * 60 + startMinute;
		const endMinutes = startMinutes + defaultDuration;
		
		const endHour = Math.floor(endMinutes / 60) % 24;
		const endMin = endMinutes % 60;
		const newEndTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
		
		updateTimeSlot(id, 'endTime', newEndTime);
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
			// Prepare all slots to create (main slot + additional slots)
			const slotsToCreate = [];
			
			// Add main slot
			const mainStart = new Date(`${date}T${startTime}:00`);
			let mainEnd: Date;
			
			// Check if main slot spans midnight
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
			
			slotsToCreate.push({
				startTime: mainStart.toISOString(),
				endTime: mainEnd.toISOString(),
				capacity,
				status: 'available',
				recurring,
				recurringType: recurring ? formData.recurringType : undefined,
				recurringEnd: recurring && recurringEnd ? new Date(recurringEnd).toISOString() : undefined,
				recurringCount: recurring && !recurringEnd ? recurringCount : undefined
			});
			
			// Add additional slots
			additionalSlots.forEach(slot => {
				const slotStart = new Date(`${date}T${slot.startTime}:00`);
				let slotEnd: Date;
				
				// Check if additional slot spans midnight
				const [slotStartHour, slotStartMinute] = slot.startTime.split(':').map(Number);
				const [slotEndHour, slotEndMinute] = slot.endTime.split(':').map(Number);
				const slotStartMinutes = slotStartHour * 60 + slotStartMinute;
				const slotEndMinutes = slotEndHour * 60 + slotEndMinute;
				
				if (slotEndMinutes <= slotStartMinutes) {
					// Slot spans midnight, end time is on the next day
					const nextDay = new Date(date);
					nextDay.setDate(nextDay.getDate() + 1);
					const nextDayStr = nextDay.toISOString().split('T')[0];
					slotEnd = new Date(`${nextDayStr}T${slot.endTime}:00`);
				} else {
					// Same day slot
					slotEnd = new Date(`${date}T${slot.endTime}:00`);
				}
				
				slotsToCreate.push({
					startTime: slotStart.toISOString(),
					endTime: slotEnd.toISOString(),
					capacity: slot.capacity,
					status: 'available'
				});
			});
			
			// Create all slots
			const results = await Promise.all(
				slotsToCreate.map(slotData => $createSlotMutation.mutateAsync(slotData))
			);
			
			const totalCreated = slotsToCreate.length;
			const totalMessage = recurring && actualRecurringCount > 1 
				? `Created ${actualRecurringCount * totalCreated} time slots successfully!`
				: totalCreated === 1 
					? 'Time slot created successfully!'
					: `Created ${totalCreated} time slots successfully!`;
			
			setSuccessMessage(totalMessage);
			
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
			additionalSlots = []; // Clear additional slots
			
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
						<Calendar class="w-5 h-5" />
						<h3>Select Date</h3>
					</div>
					
					<p class="section-hint">
						Click on a date to view existing time slots
					</p>
					
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
						<Clock class="w-5 h-5" />
						<h3>Time & Details</h3>
					</div>
					
					<div class="form-fields">
						<!-- Time Selection -->
						<div class="form-field time-field">
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
						
						<!-- Duration and Capacity Row -->
						<div class="details-row">
							<!-- Duration Display -->
							{#if duration > 0}
								<div class="duration-display">
									<Clock class="w-4 h-4" />
									<span class="duration-text">Duration: {formatDuration(duration)}</span>
								</div>
							{/if}
							
							<!-- Capacity -->
							<div class="capacity-field">
								<label for="capacity" class="capacity-label">
									<Users class="w-4 h-4" />
									Max Group Size
								</label>
								<div class="capacity-input-group">
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
									{#if tour.capacity && capacity !== tour.capacity}
										<button 
											type="button"
											onclick={() => capacity = tour.capacity}
											class="use-default-button"
											title="Use tour default ({tour.capacity} guests)"
										>
											Use default
										</button>
									{/if}
								</div>
							</div>
						</div>
						
						<!-- Add More Time Slots -->
						<div class="form-field add-more-field">
							<button 
								type="button"
								onclick={addTimeSlot}
								class="add-more-button"
							>
								<Plus class="w-4 h-4" />
								Add more time slots for this date
							</button>
							{#if additionalSlots.length > 0}
								<p class="help-text">
									Creating {additionalSlots.length + 1} time slot{additionalSlots.length + 1 === 1 ? '' : 's'} for {formatDate(date)} • You can add as many as needed
								</p>
							{/if}
						</div>
						
						<!-- Additional Time Slots -->
						{#each additionalSlots as slot, index (slot.id)}
							<div class="additional-slot">
								<div class="additional-slot-header">
									<span class="slot-number">Time Slot #{index + 2}</span>
									<button 
										type="button"
										onclick={() => removeTimeSlot(slot.id)}
										class="remove-slot-button"
										aria-label="Remove time slot"
									>
										<X class="w-4 h-4" />
									</button>
								</div>
								
								<div class="additional-slot-content">
									<div class="slot-time-row">
										<div class="time-input-wrapper">
											<label for="start-{slot.id}" class="time-label">Start</label>
											<input
												id="start-{slot.id}"
												type="time"
												bind:value={slot.startTime}
												class="time-input"
												required
											/>
										</div>
										
										<span class="time-separator">to</span>
										
										<div class="time-input-wrapper">
											<label for="end-{slot.id}" class="time-label">End</label>
											<input
												id="end-{slot.id}"
												type="time"
												bind:value={slot.endTime}
												class="time-input"
												required
											/>
										</div>
										
										<!-- Duration display inline with times -->
										{#if calculateSlotDuration(slot.startTime, slot.endTime) > 0}
											<div class="slot-duration-inline">
												<Clock class="w-3 h-3" />
												<span class="duration-text">{formatDuration(calculateSlotDuration(slot.startTime, slot.endTime))}</span>
												{#if calculateSlotDuration(slot.startTime, slot.endTime) !== (customDuration || tour?.duration || 60)}
													<button 
														type="button"
														onclick={() => resetSlotDuration(slot.id)}
														class="reset-duration-inline"
														title="Reset to {formatDuration(customDuration || tour?.duration || 60)}"
													>
														Reset
													</button>
												{/if}
											</div>
										{/if}
									</div>
									
									<div class="slot-capacity-row">
										<label for="capacity-{slot.id}" class="capacity-label">
											<Users class="w-3 h-3" />
											<span>Max Group Size</span>
										</label>
										<div class="capacity-input-with-default">
											<NumberInput
												id="capacity-{slot.id}"
												name="capacity-{slot.id}"
												label=""
												bind:value={slot.capacity}
												min={1}
												max={500}
												step={1}
												integerOnly={true}
											/>
											{#if tour.capacity && slot.capacity !== tour.capacity}
												<button 
													type="button"
													onclick={() => updateTimeSlot(slot.id, 'capacity', tour.capacity)}
													class="use-default-small"
													title="Use tour default ({tour.capacity} guests)"
												>
													Use default
												</button>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
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
							{#if recurring && actualRecurringCount > 1}
								Create {actualRecurringCount * (additionalSlots.length + 1)} Slots
							{:else if additionalSlots.length > 0}
								Create {additionalSlots.length + 1} Slots
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
		gap: 1.25rem;
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
	
	/* Time field specific */
	.time-field {
		margin-bottom: 0.5rem;
	}
	
	/* Details row for duration and capacity */
	.details-row {
		display: flex;
		align-items: flex-start;
		gap: 2rem;
		flex-wrap: wrap;
	}
	
	@media (max-width: 768px) {
		.details-row {
			gap: 1rem;
		}
	}
	
	.duration-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-secondary);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: var(--text-sm);
	}
	
	.duration-text {
		font-weight: 500;
	}
	
	.capacity-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
		min-width: 200px;
	}
	
	.capacity-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: var(--text-sm);
		color: var(--text-secondary);
		font-weight: 500;
	}
	
	.capacity-input-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.capacity-input-group :global(.number-input) {
		max-width: 160px;
	}
	
	.use-default-button {
		padding: 0.375rem 0.75rem;
		font-size: var(--text-xs);
		background: transparent;
		border: 1px solid var(--border-secondary);
		color: var(--text-secondary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}
	
	.use-default-button:hover {
		background: var(--bg-secondary);
		border-color: var(--border-primary);
		color: var(--text-primary);
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
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	
	.slot-capacity-row .capacity-label {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}
	
	.capacity-input-with-default {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}
	
	.capacity-input-with-default :global(.number-input) {
		max-width: 120px;
		min-width: 100px;
	}
	
	.use-default-small {
		padding: 0.25rem 0.5rem;
		font-size: var(--text-xs);
		background: transparent;
		border: 1px solid var(--border-secondary);
		color: var(--text-secondary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
		flex-shrink: 0;
	}
	
	.use-default-small:hover {
		background: var(--bg-secondary);
		border-color: var(--border-primary);
		color: var(--text-primary);
	}
	
	/* Remove old styles */
	.slot-capacity,
	.slot-duration-row,
	.slot-duration-display,
	.reset-duration-button {
		/* These styles are no longer needed */
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
		.details-row {
			flex-direction: column;
			gap: 0.75rem;
		}
		
		.duration-display {
			width: fit-content;
		}
		
		.capacity-field {
			min-width: 100%;
		}
		
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
		
		.slot-capacity-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
		
		.capacity-input-with-default {
			width: 100%;
			justify-content: space-between;
		}
		
		.capacity-input-with-default :global(.number-input) {
			flex: 1;
			max-width: none;
			min-width: 120px;
		}
	}
</style> 
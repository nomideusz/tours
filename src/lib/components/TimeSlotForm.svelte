<script lang="ts">
	import { formatDate, formatTime } from '$lib/utils/date-helpers.js';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';
	import { validateTourForm, getFieldError, hasFieldError, type ValidationError } from '$lib/validation.js';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { invalidatePublicTourData } from '$lib/queries/public-queries.js';
	
	// Components
	import NumberInput from '$lib/components/NumberInput.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import TimePicker from '$lib/components/TimePicker.svelte';
	import MiniMonthCalendar from '$lib/components/MiniMonthCalendar.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	
	// Icons
	import Clock from 'lucide-svelte/icons/clock';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Copy from 'lucide-svelte/icons/copy';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Info from 'lucide-svelte/icons/info';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import Repeat from 'lucide-svelte/icons/repeat';
	import Plus from 'lucide-svelte/icons/plus';

	interface Props {
		tourId: string;
		slotId?: string; // If provided, we're editing
		mode?: 'inline' | 'modal' | 'page';
		onSuccess?: () => void;
		onCancel?: () => void;
		class?: string;
		tour?: any; // Optional - can be passed to avoid fetching
		preselectedDate?: string; // Optional - pre-select a date when creating
	}

	let {
		tourId,
		slotId,
		mode = 'page',
		onSuccess,
		onCancel,
		class: className = '',
		tour: propTour,
		preselectedDate
	}: Props = $props();

	// Get query client for invalidation
	const queryClient = useQueryClient();
	
	// Check if we're editing
	let isEditMode = $derived(!!slotId);
	
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
	let isLoading = $derived(propTour ? $scheduleQuery.isLoading : ($tourQuery?.isLoading || $scheduleQuery.isLoading));

	// Form state
	let isSubmitting = $state(false);
	let isDeleting = $state(false);
	let showDeleteConfirm = $state(false);
	let showAdvanced = $state(false);
	let error = $state<string | null>(null);
	let conflicts = $state<any[]>([]);
	let validationErrors = $state<ValidationError[]>([]);
	let touchedFields = $state<Set<string>>(new Set());
	let justCreatedSlot = $state(false);
	let lastCreatedDate = $state<string>('');
	let lastCreatedStartTime = $state<string>(''); // Track last created start time
	let customDuration = $state<number | null>(null); // Track custom duration
	let initialDefaults = $state(false); // Track if initial defaults are set
	let isAddingAnother = $state(false); // Track when we're adding another slot
	
	// Smart defaults based on tour
	let formData = $state({
		date: '',
		startTime: '', // Will be set dynamically to avoid conflicts
		endTime: '', // Will be set dynamically based on tour duration
		capacity: 0,
		availability: 'available' as 'available' | 'cancelled',
		notes: '',
		// Advanced options
		recurring: false,
		recurringType: 'weekly' as 'daily' | 'weekly' | 'monthly',
		recurringEnd: '',
		recurringCount: 1
	});

	// Set smart defaults when both tour and schedule data load (for create mode)
	$effect(() => {
		if (tour && !isEditMode && !$scheduleQuery.isLoading && !initialDefaults) {
			initialDefaults = true;
			formData.capacity = tour.capacity;
			formData.availability = 'available'; // New slots are always available
			
			// Set default date to preselected date or tomorrow
			if (preselectedDate) {
				formData.date = preselectedDate;
			} else {
				const tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				formData.date = tomorrow.toISOString().split('T')[0];
			}
			
			// Find smart default time that doesn't conflict (now that schedule is loaded)
			const smartTime = findNextAvailableTime(formData.date, customDuration, null);
			formData.startTime = smartTime.startTime;
			formData.endTime = smartTime.endTime;
		}
	});

	// Populate form when slot loads (for edit mode)
	$effect(() => {
		if (currentSlot && isEditMode) {
			const startDate = new Date(currentSlot.startTime);
			const endDate = new Date(currentSlot.endTime);
			
			formData.date = startDate.toISOString().split('T')[0];
			formData.startTime = startDate.toTimeString().slice(0, 5);
			formData.endTime = endDate.toTimeString().slice(0, 5);
			formData.capacity = currentSlot.capacity || tour?.capacity || 10;
			formData.availability = currentSlot.status === 'cancelled' ? 'cancelled' : 'available';
			formData.notes = currentSlot.notes || '';
		}
	});

	// Smart time adjustment when date changes in create mode
	$effect(() => {
		if (formData.date && tour && !isEditMode && !$scheduleQuery.isLoading) {
			// Only auto-adjust if we haven't manually set times yet
			const hasManualTimes = touchedFields.has('startTime') || touchedFields.has('endTime');
			if (!hasManualTimes) {
				// If date changed, don't consider last created time
				const smartTime = findNextAvailableTime(formData.date, customDuration, null);
				formData.startTime = smartTime.startTime;
				formData.endTime = smartTime.endTime;
			}
		}
	});
	
	// Track custom duration when end time changes
	$effect(() => {
		if (formData.startTime && formData.endTime && touchedFields.has('endTime')) {
			const calculatedDuration = duration();
			if (calculatedDuration > 0 && calculatedDuration !== tour?.duration) {
				customDuration = calculatedDuration;
			}
		}
	});
	
	// Update end time when start time changes (respecting custom duration)
	$effect(() => {
		if (formData.startTime && touchedFields.has('startTime')) {
			// Always update end time when start time changes, unless user is currently editing end time
			const durationToUse = customDuration || tour?.duration || 120;
			const start = new Date(`2000-01-01T${formData.startTime}:00`);
			const end = new Date(start.getTime() + durationToUse * 60000);
			formData.endTime = end.toTimeString().slice(0, 5);
		}
	});

	// Check for conflicts when date/time changes
	$effect(() => {
		// Skip conflict checking when we're in the process of adding another slot
		if (formData.date && formData.startTime && formData.endTime && existingSlots.length > 0 && !justCreatedSlot && !isAddingAnother) {
			checkConflicts();
		}
	});

	// Create slots map for MiniMonthCalendar
	let slotsMap = $derived(() => {
		const map = new Map<string, number>();
		allSlots.forEach((slot: any) => {
			const date = new Date(slot.startTime).toISOString().split('T')[0];
			map.set(date, (map.get(date) || 0) + 1);
		});
		return map;
	});

	// Auto-enable recurring when advanced section is opened
	$effect(() => {
		if (showAdvanced && !isEditMode) {
			formData.recurring = true;
		} else if (!showAdvanced && !isEditMode) {
			formData.recurring = false;
			// Reset recurring settings when closed
			formData.recurringType = 'weekly';
			formData.recurringEnd = '';
			formData.recurringCount = 1;
		}
	});

	function findNextAvailableTime(targetDate: string, preferredDuration?: number | null, lastCreatedTime?: string | null): { startTime: string; endTime: string; suggestedNewDate: boolean } {
		const duration = preferredDuration || tour?.duration || 120; // Use custom duration, tour duration, or 2 hours
		const durationMs = duration * 60000;
		const breakTime = 30 * 60000; // 30 minute break between slots
		
		// Check if it's today and we need to avoid past times
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const targetDateObj = new Date(targetDate);
		targetDateObj.setHours(0, 0, 0, 0);
		const isToday = targetDateObj.getTime() === today.getTime();
		
		if (!targetDate) {
			const defaultStart = '10:00';
			const start = new Date(`2000-01-01T${defaultStart}:00`);
			const end = new Date(start.getTime() + durationMs);
			return { startTime: defaultStart, endTime: end.toTimeString().slice(0, 5), suggestedNewDate: false };
		}
		
		// If we just created a slot, suggest next time with break
		if (lastCreatedTime && lastCreatedDate === targetDate) {
			const lastTime = new Date(`2000-01-01T${lastCreatedTime}:00`);
			const suggestedStart = new Date(lastTime.getTime() + durationMs + breakTime);
			
			// If suggested time is after 8 PM, suggest next day instead
			if (suggestedStart.getHours() >= 20) {
				const tomorrow = new Date(targetDateObj);
				tomorrow.setDate(tomorrow.getDate() + 1);
				const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
				// Start fresh on new day
				const nextDayTime = findNextAvailableTime(tomorrowDateStr, preferredDuration, null);
				return { ...nextDayTime, suggestedNewDate: true };
			}
			
			// Use the suggested time if it doesn't conflict
			const suggestedTimeStr = suggestedStart.toTimeString().slice(0, 5);
			const hasConflict = existingSlots.some((slot: any) => {
				const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
				if (slotDate !== targetDate) return false;
				
				const slotStart = new Date(slot.startTime);
				const slotEnd = new Date(slot.endTime);
				const checkStart = new Date(`${targetDate}T${suggestedTimeStr}:00`);
				const checkEnd = new Date(checkStart.getTime() + durationMs);
				
				return checkStart < slotEnd && checkEnd > slotStart;
			});
			
			if (!hasConflict) {
				const end = new Date(suggestedStart.getTime() + durationMs);
				return { 
					startTime: suggestedTimeStr, 
					endTime: end.toTimeString().slice(0, 5),
					suggestedNewDate: false
				};
			}
		}
		
		// For today, start from next hour rounded up
		let defaultStart = '10:00';
		if (isToday) {
			const now = new Date();
			const nextHour = new Date(now);
			nextHour.setHours(now.getHours() + 1, 0, 0, 0);
			if (nextHour.getHours() < 22) { // Don't go past 10 PM
				defaultStart = nextHour.toTimeString().slice(0, 5);
			}
		}
		
		if (!existingSlots.length) {
			// No existing slots, use smart defaults
			const start = new Date(`2000-01-01T${defaultStart}:00`);
			const end = new Date(start.getTime() + durationMs);
			return { startTime: defaultStart, endTime: end.toTimeString().slice(0, 5), suggestedNewDate: false };
		}
		
		// Get existing slots for this date, sorted by start time
		const sameDaySlots = existingSlots
			.filter((slot: any) => {
				const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
				return slotDate === targetDate;
			})
			.map((slot: any) => ({
				start: new Date(slot.startTime),
				end: new Date(slot.endTime)
			}))
			.sort((a: {start: Date}, b: {start: Date}) => a.start.getTime() - b.start.getTime());
		
		if (sameDaySlots.length === 0) {
			// No slots on this date, use smart defaults
			const start = new Date(`2000-01-01T${defaultStart}:00`);
			const end = new Date(start.getTime() + durationMs);
			return { 
				startTime: defaultStart, 
				endTime: end.toTimeString().slice(0, 5),
				suggestedNewDate: false
			};
		}
		
		// Try to find a gap between slots or after all slots
		const baseDate = `${targetDate}T`;
		
		// Start with smart time based on whether it's today
		let candidateStart = new Date(`${baseDate}${defaultStart}:00`);
		
		// If today, ensure we start from current time
		if (isToday) {
			const now = new Date();
			const todayCandidate = new Date(`${baseDate}${now.toTimeString().slice(0, 5)}:00`);
			if (todayCandidate > candidateStart) {
				candidateStart = todayCandidate;
				// Round up to next 30 minutes
				const minutes = candidateStart.getMinutes();
				if (minutes > 0 && minutes < 30) {
					candidateStart.setMinutes(30);
				} else if (minutes > 30) {
					candidateStart.setHours(candidateStart.getHours() + 1, 0, 0, 0);
				}
			}
		}
		
		// Check each potential time slot
		for (let attempt = 0; attempt < 48; attempt++) { // 48 = 24 hours * 2 (30-min intervals)
			const candidateEnd = new Date(candidateStart.getTime() + durationMs);
			
			// Check if this time conflicts with any existing slot
			const hasConflict = sameDaySlots.some((slot: {start: Date, end: Date}) => 
				candidateStart < slot.end && candidateEnd > slot.start
			);
			
			if (!hasConflict) {
				// Found a free slot!
				return {
					startTime: candidateStart.toTimeString().slice(0, 5),
					endTime: candidateEnd.toTimeString().slice(0, 5),
					suggestedNewDate: false
				};
			}
			
			// Move to next 30-minute interval
			candidateStart = new Date(candidateStart.getTime() + 30 * 60000);
			
			// Don't go past 10 PM
			if (candidateStart.getHours() >= 22) break;
		}
		
		// Fallback: use the time after the last slot
		const lastSlot = sameDaySlots[sameDaySlots.length - 1];
		const fallbackStart = new Date(lastSlot.end.getTime() + 30 * 60000); // 30 min buffer
		const fallbackEnd = new Date(fallbackStart.getTime() + durationMs);
		
		return {
			startTime: fallbackStart.toTimeString().slice(0, 5),
			endTime: fallbackEnd.toTimeString().slice(0, 5),
			suggestedNewDate: false
		};
	}

	function checkConflicts() {
		const newStart = new Date(`${formData.date}T${formData.startTime}:00`);
		const newEnd = new Date(`${formData.date}T${formData.endTime}:00`);
		
		conflicts = existingSlots.filter((slot: any) => {
			const slotStart = new Date(slot.startTime);
			const slotEnd = new Date(slot.endTime);
			
			// Check if times overlap
			return (newStart < slotEnd && newEnd > slotStart);
		});
	}

	// Real-time field validation
	function validateField(fieldName: string) {
		touchedFields.add(fieldName);
		
		// Remove any existing errors for this field
		validationErrors = validationErrors.filter(error => error.field !== fieldName);
		
		// Validate specific field
		let fieldError: ValidationError | null = null;
		
		switch (fieldName) {
			case 'date':
				if (!formData.date) {
					fieldError = { field: 'date', message: 'Date is required' };
				} else if (!isEditMode) {
					// Check if date is in the past (only for create mode)
					const selectedDate = new Date(formData.date);
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					if (selectedDate < today) {
						fieldError = { field: 'date', message: 'Cannot create slots in the past' };
					}
				}
				break;
			case 'startTime':
				if (!formData.startTime) {
					fieldError = { field: 'startTime', message: 'Start time is required' };
				} else if (!isEditMode && formData.date) {
					// Check if time is in the past for today's date
					const selectedDate = new Date(formData.date);
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					selectedDate.setHours(0, 0, 0, 0);
					
					if (selectedDate.getTime() === today.getTime()) {
						// It's today, check if time is in the past
						const now = new Date();
						const selectedTime = new Date(`${formData.date}T${formData.startTime}:00`);
						if (selectedTime < now) {
							fieldError = { field: 'startTime', message: 'Cannot create slots in the past' };
						}
					}
				}
				break;
			case 'endTime':
				if (!formData.endTime) {
					fieldError = { field: 'endTime', message: 'End time is required' };
				} else if (formData.startTime && formData.endTime <= formData.startTime) {
					fieldError = { field: 'endTime', message: 'End time must be after start time' };
				}
				break;
			case 'capacity':
				const minCapacity = isEditMode && currentSlot?.bookedSpots ? currentSlot.bookedSpots : 1;
				if (!formData.capacity || formData.capacity < minCapacity) {
					fieldError = { field: 'capacity', message: `Capacity must be at least ${minCapacity}${isEditMode && currentSlot?.bookedSpots ? ' (current bookings)' : ''}` };
				} else if (formData.capacity > 500) {
					fieldError = { field: 'capacity', message: 'Capacity cannot exceed 500' };
				}
				break;
		}
		
		if (fieldError) {
			validationErrors = [...validationErrors, fieldError];
		}
	}

	function getEndTimeFromDuration() {
		if (!tour?.duration || !formData.startTime) return;
		
		const start = new Date(`2000-01-01T${formData.startTime}:00`);
		const end = new Date(start.getTime() + tour.duration * 60000);
		formData.endTime = end.toTimeString().slice(0, 5);
		validateField('endTime');
	}

	function copyFromExisting() {
		if (existingSlots.length === 0) return;
		
		// Copy from the most recent slot
		const recent = existingSlots[0];
		const recentStart = new Date(recent.startTime);
		const recentEnd = new Date(recent.endTime);
		
		formData.startTime = recentStart.toTimeString().slice(0, 5);
		formData.endTime = recentEnd.toTimeString().slice(0, 5);
		
		// Validate after copying
		validateField('startTime');
		validateField('endTime');
	}

	// Helper functions for recurring slots
	function getRecurringPreview() {
		if (!formData.recurring || !formData.date || !formData.startTime) return [];
		
		const slots = [];
		let currentDate = new Date(`${formData.date}T${formData.startTime}:00`);
		const endDate = formData.recurringEnd ? new Date(formData.recurringEnd) : null;
		let count = 0;
		
		// If using end date, allow up to 365 slots (but limit preview to 20)
		// If using count, use the specified count (but limit preview to 10)
		const maxCount = endDate 
			? Math.min(365, 20) // End date mode: allow many but limit preview
			: Math.min(formData.recurringCount || 1, 10); // Count mode: use specified count
		
		while (count < maxCount && (!endDate || currentDate <= endDate)) {
			slots.push({
				date: currentDate.toISOString().split('T')[0],
				startTime: currentDate.toTimeString().slice(0, 5)
			});
			
			// Increment date based on recurring type
			switch (formData.recurringType) {
				case 'daily':
					currentDate.setDate(currentDate.getDate() + 1);
					break;
				case 'weekly':
					currentDate.setDate(currentDate.getDate() + 7);
					break;
				case 'monthly':
					currentDate.setMonth(currentDate.getMonth() + 1);
					break;
			}
			
			count++;
		}
		
		return slots;
	}

	function getRecurringText() {
		if (!formData.recurring) return '';
		
		const pattern = formData.recurringType;
		const endDate = formData.recurringEnd;
		const count = formData.recurringCount;
		
		if (endDate) {
			return `${pattern} until ${formatDate(endDate)}`;
		} else if (count && count > 1) {
			return `${pattern} for ${count} occurrences`;
		}
		
		return pattern;
	}

	async function handleSubmit() {
		if (isSubmitting) return;
		
		// Mark all required fields as touched
		touchedFields.add('date');
		touchedFields.add('startTime');
		touchedFields.add('endTime');
		touchedFields.add('capacity');
		
		// Validate all fields
		validateField('date');
		validateField('startTime');
		validateField('endTime');
		validateField('capacity');
		
		// Check for conflicts
		if (conflicts.length > 0) {
			error = 'Please resolve time conflicts before saving';
			return;
		}
		
		// Check if there are validation errors
		if (validationErrors.length > 0) {
			error = 'Please correct the errors below';
			return;
		}
		
		// Validate time logic
		const start = new Date(`${formData.date}T${formData.startTime}:00`);
		const end = new Date(`${formData.date}T${formData.endTime}:00`);
		
		if (end <= start) {
			error = 'End time must be after start time';
			return;
		}
		
		isSubmitting = true;
		error = null;
		
		try {
			const url = isEditMode 
				? `/api/tours/${tourId}/schedule/${slotId}`
				: `/api/tours/${tourId}/schedule`;
			
			const response = await fetch(url, {
				method: isEditMode ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					startTime: start.toISOString(),
					endTime: end.toISOString(),
					status: formData.availability,
					recurringEnd: formData.recurringEnd ? new Date(formData.recurringEnd).toISOString() : null
				})
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} time slot`);
			}
			
			// Invalidate the schedule query so it refreshes immediately
			await queryClient.invalidateQueries({ queryKey: queryKeys.tourSchedule(tourId) });
			
			// Invalidate tours list since slot changes affect upcomingSlots count
			await queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
			await queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
			
			// Invalidate public booking page cache since availability changed
			if (tour?.qrCode) {
				invalidatePublicTourData(queryClient, tour.qrCode);
			}
			
			// Handle success
			if (!isEditMode) {
				// Store the date and time for "Add Another" functionality
				lastCreatedDate = formData.date;
				lastCreatedStartTime = formData.startTime;
				justCreatedSlot = true;
				
				// Don't close the form immediately in modal mode
				if (mode !== 'modal') {
					onSuccess?.();
				}
			} else {
				// For edit mode, always close
				onSuccess?.();
			}
			
		} catch (err) {
			error = err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} time slot`;
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDelete() {
		if (isDeleting || !isEditMode) return;
		
		isDeleting = true;
		error = null;
		
		try {
			const response = await fetch(`/api/tours/${tourId}/schedule/${slotId}`, {
				method: 'DELETE'
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to delete time slot');
			}
			
			// Invalidate the schedule query so it refreshes immediately
			await queryClient.invalidateQueries({ queryKey: queryKeys.tourSchedule(tourId) });
			
			// Invalidate tours list since slot deletion affects upcomingSlots count
			await queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
			await queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
			
			// Invalidate public booking page cache since availability changed
			if (tour?.qrCode) {
				invalidatePublicTourData(queryClient, tour.qrCode);
			}
			
			// Call success callback
			if (onSuccess) {
				onSuccess();
			}
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete time slot';
		} finally {
			isDeleting = false;
			showDeleteConfirm = false;
		}
	}

	function handleCancel() {
		if (onCancel) {
			onCancel();
		}
	}

	function handleAddAnother() {
		// Set flag to prevent conflict checking during transition
		isAddingAnother = true;
		
		// Clear conflicts immediately to prevent flashing
		conflicts = [];
		
		// Reset form but keep the date
		const savedDate = formData.date;
		
		// Find smart default time for the same date, considering the last created slot
		const smartTime = findNextAvailableTime(savedDate, customDuration, lastCreatedStartTime);
		
		// Use the suggested date, which might be the next day if it was late evening
		const newDate = smartTime.suggestedNewDate ? 
			(() => {
				const tomorrow = new Date(savedDate);
				tomorrow.setDate(tomorrow.getDate() + 1);
				return tomorrow.toISOString().split('T')[0];
			})() : savedDate;
		
		formData = {
			date: newDate,
			startTime: smartTime.startTime,
			endTime: smartTime.endTime,
			capacity: tour?.capacity || 10,
			availability: 'available',
			notes: '',
			// Recurring options
			recurring: false,
			recurringType: 'weekly',
			recurringEnd: '',
			recurringCount: 1
		};
		
		// Clear states
		justCreatedSlot = false;
		error = null;
		validationErrors = [];
		touchedFields.clear();
		showAdvanced = false;
		
		// Reset the flag after a short delay to allow form to update
		setTimeout(() => {
			isAddingAnother = false;
		}, 100);
	}
	
	function resetDuration() {
		customDuration = null;
		if (formData.startTime && tour?.duration) {
			const start = new Date(`2000-01-01T${formData.startTime}:00`);
			const end = new Date(start.getTime() + tour.duration * 60000);
			formData.endTime = end.toTimeString().slice(0, 5);
			validateField('endTime');
		}
	}

	// Calculate duration in minutes
	let duration = $derived(() => {
		if (!formData.startTime || !formData.endTime) return 0;
		const start = new Date(`2000-01-01T${formData.startTime}:00`);
		const end = new Date(`2000-01-01T${formData.endTime}:00`);
		return Math.max(0, (end.getTime() - start.getTime()) / 60000);
	});

	// Check if slot has bookings
	let hasBookings = $derived(isEditMode && currentSlot?.bookedSpots > 0);

	// Combine all errors
	let allErrors = $derived([...validationErrors]);

	// Compact mode styling
	let containerClass = $derived(
		mode === 'inline' ? 'bg-white dark:bg-gray-900 rounded-xl border' : 
		mode === 'modal' ? '' : 
		'rounded-xl'
	);


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
			
			{#if error}
				<div class="mb-6 rounded-lg p-4 border" style="background: var(--color-danger-50); border-color: var(--color-danger-200);">
					<div class="flex gap-3">
						<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-danger-600);" />
						<div class="flex-1">
							<p class="text-sm font-medium" style="color: var(--color-danger-900);">{error}</p>
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

			{#if conflicts.length > 0 && !justCreatedSlot}
				<div class="mb-6 rounded-xl p-4" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
					<div class="flex gap-3">
						<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
						<div>
							<p class="font-medium" style="color: var(--color-warning-900);">Time Conflict Detected</p>
							<p class="text-sm mt-1" style="color: var(--color-warning-700);">
								This time slot overlaps with {conflicts.length} existing slot{conflicts.length === 1 ? '' : 's'}:
							</p>
							<ul class="text-sm mt-2 space-y-1" style="color: var(--color-warning-700);">
								{#each conflicts as conflict}
									<li>• {formatDate(conflict.startTime)} at {formatTime(conflict.startTime)} - {formatTime(conflict.endTime)}</li>
								{/each}
							</ul>
						</div>
					</div>
				</div>
			{/if}

			<!-- Mobile: Stacked layout -->
			<div class="md:hidden space-y-6">
				<!-- Date Selection -->
				<div>
					<label class="form-label">Select Date</label>
					<MiniMonthCalendar
						slotsMap={slotsMap()}
						selectedDate={formData.date}
						onDateClick={(date) => {
							formData.date = date;
							validateField('date');
						}}
						class="w-full"
					/>
					{#if getFieldError(allErrors, 'date')}
						<p class="form-error mt-2">{getFieldError(allErrors, 'date')}</p>
					{/if}
					{#if allSlots.length > 0}
						<p class="text-xs mt-2" style="color: var(--text-tertiary);">
							Gray = past • Blue = upcoming
						</p>
					{/if}
				</div>
				
				<!-- Time Selection -->
				<div>
					<label class="form-label">Time Selection</label>
					<div class="grid grid-cols-2 gap-3">
						<TimePicker
							bind:value={formData.startTime}
							label="Start time"
							placeholder="Select start time"
							use24hour={true}
							onchange={() => {
								validateField('startTime');
								getEndTimeFromDuration();
							}}
							error={hasFieldError(allErrors, 'startTime')}
						/>
						<div>
							<TimePicker
								bind:value={formData.endTime}
								label="End time"
								placeholder="Select end time"
								use24hour={true}
								onchange={() => validateField('endTime')}
								error={hasFieldError(allErrors, 'endTime')}
							/>
							{#if tour.duration && formData.startTime}
								<button
									type="button"
									onclick={getEndTimeFromDuration}
									class="mt-2 w-full px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
									style="border-color: var(--border-primary); color: var(--text-secondary);"
									title="Set end time based on tour duration"
								>
									Auto ({formatDuration(tour.duration)})
								</button>
							{/if}
						</div>
					</div>
					
					{#if getFieldError(allErrors, 'startTime')}
						<p class="form-error mt-2">{getFieldError(allErrors, 'startTime')}</p>
					{/if}
					{#if getFieldError(allErrors, 'endTime')}
						<p class="form-error mt-2">{getFieldError(allErrors, 'endTime')}</p>
					{/if}
				</div>

				<!-- Capacity & Duration -->
				<div class="space-y-4">
					<!-- Compact info row -->
					<div class="flex items-center justify-between p-3 rounded-lg text-sm" style="background: var(--bg-secondary);">
						<div class="flex items-center gap-4">
							<div>
								<span style="color: var(--text-secondary);">Duration:</span>
								<span class="font-medium ml-1" style="color: var(--text-primary);">{duration() > 0 ? formatDuration(duration()) : '--'}</span>
							</div>
							{#if tour.duration && duration() !== tour.duration && duration() > 0}
								<button
									type="button"
									onclick={() => {
										getEndTimeFromDuration();
										validateField('endTime');
									}}
									class="text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
								>
									Reset
								</button>
							{/if}
						</div>
					</div>

					<!-- Capacity & Availability -->
					<div class="flex gap-4">
						<div class="w-40">
							<NumberInput
								id="capacity"
								name="capacity"
								label="Capacity"
								bind:value={formData.capacity}
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
								onblur={() => validateField('capacity')}
							/>
						</div>
						
						{#if isEditMode}
							<div class="w-40">
								<label for="availability" class="form-label">Availability</label>
								<select id="availability" bind:value={formData.availability} class="form-select w-full size-small">
									<option value="available">Available</option>
									<option value="cancelled">Cancelled</option>
								</select>
							</div>
						{/if}
					</div>
				</div>

				{#if tour.capacity && formData.capacity !== tour.capacity}
					<div class="text-sm p-2 rounded" style="background: var(--bg-secondary); color: var(--text-secondary);">
						Tour default: {tour.capacity} guests
						<button
							type="button"
							onclick={() => {
								formData.capacity = tour.capacity;
								validateField('capacity');
							}}
							class="ml-2 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
						>
							Use default
						</button>
					</div>
				{/if}

				{#if isEditMode && hasBookings}
					<p class="text-xs" style="color: var(--text-tertiary);">
						{currentSlot.bookedSpots} already booked • {formData.availability === 'cancelled' ? 'Cancelling will affect existing bookings' : 'Customers can book remaining spots'}
					</p>
				{:else if isEditMode}
					<p class="text-xs" style="color: var(--text-tertiary);">
						{formData.availability === 'available' ? 'Customers can book this time slot' : 'This time slot will not be visible to customers'}
					</p>
				{:else}
					<p class="text-xs" style="color: var(--text-tertiary);">
						Customers will be able to book this time slot once created
					</p>
				{/if}
			</div>

			<!-- Recurring Options (Mobile) - Only for create mode -->
			{#if !isEditMode}
				<div class="space-y-4 md:hidden">
					<button
						type="button"
						onclick={() => showAdvanced = !showAdvanced}
						class="flex items-center justify-between w-full p-3 text-left rounded-lg border transition-all duration-200 hover:bg-gray-50"
						style="border-color: var(--border-primary);"
					>
						<div class="flex items-center gap-2">
							<Repeat class="h-4 w-4" style="color: var(--text-secondary);" />
							<span class="font-medium" style="color: var(--text-primary);">Recurring Options</span>
						</div>
						{#if showAdvanced}
							<ChevronUp class="h-4 w-4" style="color: var(--text-secondary);" />
						{:else}
							<ChevronDown class="h-4 w-4" style="color: var(--text-secondary);" />
						{/if}
					</button>

					{#if showAdvanced}
						<div class="space-y-4 p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
								<!-- Pattern Selection -->
								<div>
									<label class="form-label">Repeat pattern</label>
									<select bind:value={formData.recurringType} class="form-select w-full">
										<option value="daily">Daily</option>
										<option value="weekly">Weekly</option>
										<option value="monthly">Monthly</option>
									</select>
								</div>

								<!-- End Condition -->
								<div class="space-y-3">
									<label class="form-label">Stop after</label>
									<div class="space-y-2">
										<div class="flex items-center gap-2">
											<input
												type="radio"
												id="end-count-mobile"
												name="end-type-mobile"
												value="count"
												checked={!formData.recurringEnd}
												onchange={() => formData.recurringEnd = ''}
												class="form-radio"
											/>
											<label for="end-count-mobile" class="text-sm" style="color: var(--text-primary);">Number of slots</label>
										</div>
										{#if !formData.recurringEnd}
											<NumberInput
												id="recurring-count-mobile"
												label=""
												bind:value={formData.recurringCount}
												min={1}
												max={52}
												step={1}
												placeholder="5"
												size="small"
												integerOnly={true}
											/>
										{/if}
									</div>
									
									<div class="space-y-2">
										<div class="flex items-center gap-2">
											<input
												type="radio"
												id="end-date-mobile"
												name="end-type-mobile"
												value="date"
												checked={!!formData.recurringEnd}
												onchange={() => { formData.recurringEnd = formData.date; formData.recurringCount = 0; }}
												class="form-radio"
											/>
											<label for="end-date-mobile" class="text-sm" style="color: var(--text-primary);">End date</label>
										</div>
										{#if formData.recurringEnd}
											<DatePicker
												bind:value={formData.recurringEnd}
												minDate={formData.date}
												placeholder="Select end date"
												onchange={() => {}}
											/>
										{/if}
									</div>
								</div>

								<!-- Preview -->
								{#if getRecurringPreview().length > 0}
									<div class="mt-4">
										<label class="form-label">Preview ({getRecurringPreview().length} slots)</label>
										<div class="max-h-32 overflow-y-auto p-2 rounded" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
											{#each getRecurringPreview() as slot, index}
												<div class="text-xs py-1" style="color: var(--text-secondary);">
													{index + 1}. {formatDate(slot.date)} at {slot.startTime}
												</div>
											{/each}
											{#if formData.recurringEnd && getRecurringPreview().length >= 10}
												<div class="text-xs py-1 italic" style="color: var(--text-tertiary);">...and more</div>
											{/if}
										</div>
									</div>
								{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Desktop: Optimized layout -->
		<div class="hidden md:block">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<!-- Date Selection -->
				<div class="lg:col-span-1">
					<label class="form-label">Select Date</label>
					<MiniMonthCalendar
						slotsMap={slotsMap()}
						selectedDate={formData.date}
						minDate={isEditMode ? undefined : new Date().toISOString().split('T')[0]}
						onDateClick={(date) => {
							formData.date = date;
							validateField('date');
						}}
					/>
					{#if getFieldError(allErrors, 'date')}
						<p class="form-error mt-2">{getFieldError(allErrors, 'date')}</p>
					{/if}
					{#if allSlots.length > 0}
						<p class="text-xs mt-2" style="color: var(--text-tertiary);">
							Gray dots = past slots • Blue dots = upcoming slots
						</p>
					{/if}
				</div>
				
				<!-- Time & Settings -->
				<div class="lg:col-span-2 space-y-4">
					<!-- Time & Configuration Grid -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<TimePicker
								bind:value={formData.startTime}
								label="Start time"
								placeholder="Select start time"
								use24hour={true}
								onchange={() => {
									validateField('startTime');
								}}
								error={hasFieldError(allErrors, 'startTime')}
							/>
						</div>
						<div>
							<TimePicker
								bind:value={formData.endTime}
								label="End time"
								placeholder="Select end time"
								use24hour={true}
								onchange={() => validateField('endTime')}
								error={hasFieldError(allErrors, 'endTime')}
							/>
						</div>
					</div>
					
					<!-- Capacity & Settings -->
					<div class="grid grid-cols-2 gap-4">
						<div class="w-full">
							<NumberInput
								id="capacity"
								name="capacity"
								label="Capacity"
								bind:value={formData.capacity}
								min={isEditMode && currentSlot?.bookedSpots ? currentSlot.bookedSpots : 1}
								max={500}
								step={1}
								placeholder="10"
								incrementLabel="Increase capacity"
								decrementLabel="Decrease capacity"
								error={getFieldError(allErrors, 'capacity')}
								hasError={hasFieldError(allErrors, 'capacity')}
								integerOnly={true}
								onblur={() => validateField('capacity')}
								class="w-full"
							/>
						</div>
						{#if isEditMode}
							<div class="w-full">
								<label for="availability" class="form-label">Availability</label>
								<select id="availability" bind:value={formData.availability} class="form-select w-full">
									<option value="available">Available</option>
									<option value="cancelled">Cancelled</option>
								</select>
							</div>
						{:else}
							<div class="w-full">
								<label class="form-label">Duration</label>
								<div class="w-full px-3 py-2 rounded-lg border text-sm flex items-center justify-between" 
									style="border-color: var(--border-primary); background: var(--bg-secondary);">
									<div>
										<span class="font-medium" style="color: var(--text-primary);">
											{duration() > 0 ? formatDuration(duration()) : 'Not set'}
										</span>
										{#if tour.duration && duration() !== tour.duration}
											<span class="ml-2 text-xs" style="color: var(--text-tertiary);">
												(default: {formatDuration(tour.duration)})
											</span>
										{/if}
									</div>
									{#if customDuration && tour.duration}
										<button
											type="button"
											onclick={resetDuration}
											class="text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
											style="color: var(--color-primary-600);"
										>
											Reset
										</button>
									{/if}
								</div>
							</div>
						{/if}
					</div>

					<!-- Validation & Warnings -->
					{#if (tour.capacity && formData.capacity !== tour.capacity) || (isEditMode && hasBookings)}
					<div class="flex gap-2">
						{#if tour.capacity && formData.capacity !== tour.capacity}
							<div class="text-sm p-2 rounded flex-1" style="background: var(--bg-secondary); color: var(--text-secondary);">
								Tour default: {tour.capacity} guests
								<button
									type="button"
									onclick={() => {
										formData.capacity = tour.capacity;
										validateField('capacity');
									}}
									class="ml-2 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
								>
									Use default
								</button>
							</div>
						{/if}
						{#if isEditMode && hasBookings}
							<div class="text-sm p-2 rounded flex-1" style="background: var(--color-warning-50); color: var(--color-warning-700);">
								{currentSlot.bookedSpots} already booked
							</div>
						{/if}
					</div>
					{/if}

					<!-- Validation Errors -->
					{#if getFieldError(allErrors, 'startTime')}
						<p class="form-error">{getFieldError(allErrors, 'startTime')}</p>
					{/if}
					{#if getFieldError(allErrors, 'endTime')}
						<p class="form-error">{getFieldError(allErrors, 'endTime')}</p>
					{/if}

					{#if isEditMode}
						<div class="text-sm" style="color: var(--text-secondary);">
							<strong>Current:</strong> {formatDate(currentSlot.startTime)} at {formatTime(currentSlot.startTime)} - {formatTime(currentSlot.endTime)}
						</div>
					{/if}

					<!-- Recurring Options (Desktop) - Only for create mode -->
					{#if !isEditMode}
						<div class="mt-4">
							<button
								type="button"
								onclick={() => showAdvanced = !showAdvanced}
								class="flex items-center justify-between w-full p-3 text-left rounded-lg border transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
								style="border-color: var(--border-primary);"
							>
								<div class="flex items-center gap-2">
									<Repeat class="h-4 w-4" style="color: var(--text-secondary);" />
									<span class="text-sm font-medium" style="color: var(--text-primary);">
										Create recurring slots
									</span>
								</div>
								{#if showAdvanced}
									<ChevronUp class="h-4 w-4" style="color: var(--text-secondary);" />
								{:else}
									<ChevronDown class="h-4 w-4" style="color: var(--text-secondary);" />
								{/if}
							</button>

							{#if showAdvanced}
								<div class="mt-3 p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
									<div class="grid grid-cols-2 gap-4">
										<!-- Pattern & Count -->
										<div>
											<label class="form-label">Pattern</label>
											<select bind:value={formData.recurringType} class="form-select w-full">
												<option value="daily">Daily</option>
												<option value="weekly">Weekly</option>
												<option value="monthly">Monthly</option>
											</select>
										</div>
										
										<div>
											{#if !formData.recurringEnd}
												<label class="form-label">How many?</label>
												<NumberInput
													id="recurring-count"
													label=""
													bind:value={formData.recurringCount}
													min={2}
													max={52}
													step={1}
													placeholder="5"
													integerOnly={true}
												/>
											{:else}
												<label class="form-label">Until date</label>
												<DatePicker
													bind:value={formData.recurringEnd}
													minDate={formData.date}
													placeholder="End date"
													onchange={() => {}}
												/>
											{/if}
										</div>
									</div>
									
									<!-- Toggle between count/date -->
									<div class="mt-3 flex items-center gap-4 text-sm">
										<label class="flex items-center gap-2 cursor-pointer">
											<input
												type="radio"
												name="recurring-mode"
												checked={!formData.recurringEnd}
												onchange={() => formData.recurringEnd = ''}
												class="form-radio"
											/>
											<span style="color: var(--text-secondary);">Count</span>
										</label>
										<label class="flex items-center gap-2 cursor-pointer">
											<input
												type="radio"
												name="recurring-mode"
												checked={!!formData.recurringEnd}
												onchange={() => { formData.recurringEnd = formData.date; formData.recurringCount = 2; }}
												class="form-radio"
											/>
											<span style="color: var(--text-secondary);">Until date</span>
										</label>
									</div>
									
									<!-- Preview -->
									{#if getRecurringPreview().length > 0}
										<div class="mt-4">
											<div class="text-sm font-medium mb-2" style="color: var(--text-primary);">
												{getRecurringPreview().length} slots will be created
											</div>
											<div class="max-h-32 overflow-y-auto p-2 rounded bg-gray-50 dark:bg-gray-900/50 text-xs space-y-1">
												{#each getRecurringPreview().slice(0, 5) as slot}
													<div class="flex justify-between" style="color: var(--text-secondary);">
														<span>{formatDate(slot.date)}</span>
														<span>{slot.startTime} - {formData.endTime}</span>
													</div>
												{/each}
												{#if getRecurringPreview().length > 5}
													<div class="text-center pt-1" style="color: var(--text-tertiary);">
														...and {getRecurringPreview().length - 5} more
													</div>
												{/if}
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		{#if !(justCreatedSlot && mode === 'modal')}
		<div class="mt-6 flex gap-3 {mode === 'inline' ? 'justify-end' : 'justify-between'}">
			{#if mode !== 'inline' || existingSlots.length > 0}
				<div class="flex gap-2">
					{#if existingSlots.length > 0 && mode !== 'inline' && !isEditMode}
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
							onclick={() => showDeleteConfirm = true}
							disabled={isDeleting}
							class="button-danger button--gap"
						>
							{#if isDeleting}
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
					onclick={handleCancel}
					disabled={isSubmitting}
					class="button-secondary"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleSubmit}
					disabled={isSubmitting || conflicts.length > 0}
					class="button-primary button--gap"
				>
					{#if isSubmitting}
						<Loader2 class="w-4 h-4 animate-spin" />
						{isEditMode ? 'Saving...' : (formData.recurring ? 'Creating slots...' : 'Creating...')}
					{:else}
						<CheckCircle class="w-4 h-4" />
						{isEditMode ? 'Save Changes' : (showAdvanced && getRecurringPreview().length > 1 ? `Create ${getRecurringPreview().length} slots` : 'Create Slot')}
					{/if}
				</button>
			</div>
		</div>
		{/if}

		<!-- Success Banner - Positioned after action buttons for better UX flow -->
		{#if justCreatedSlot && mode === 'modal'}
			<div class="mt-4 rounded-xl p-4" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
				<div class="flex gap-3">
					<CheckCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" />
					<div class="flex-1">
						<p class="font-medium" style="color: var(--color-success-900);">Time slot created successfully!</p>
						<p class="text-sm mt-1" style="color: var(--color-success-700);">
							Slot for {formatDate(lastCreatedDate)} has been added to your schedule.
						</p>
						<div class="flex gap-3 mt-3">
							<button
								onclick={handleAddAnother}
								class="button-primary button--small button--gap"
							>
								<Plus class="h-4 w-4" />
								Add Another Slot
							</button>
							<button
								onclick={() => {
									justCreatedSlot = false;
									onSuccess?.();
								}}
								class="button-secondary button--small"
							>
								Done
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<ConfirmationModal
		bind:isOpen={showDeleteConfirm}
		title="Delete Time Slot"
		message={hasBookings 
			? `This slot has ${currentSlot.bookedSpots} active booking${currentSlot.bookedSpots === 1 ? '' : 's'}. Deleting will cancel all bookings. Consider notifying customers first.`
			: 'Are you sure you want to delete this time slot? This action cannot be undone.'}
		confirmText="Delete Slot"
		cancelText="Cancel"
		variant="danger"
		icon={Trash2}
		onConfirm={handleDelete}
		onCancel={() => showDeleteConfirm = false}
	/>
{/if}
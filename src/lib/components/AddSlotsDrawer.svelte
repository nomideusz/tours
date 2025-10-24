<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { formatDuration, getImageUrl } from '$lib/utils/tour-helpers-client.js';
	import Drawer from '$lib/components/Drawer.svelte';
	import MiniMonthCalendar from '$lib/components/MiniMonthCalendar.svelte';
	import NativeDatePicker from '$lib/components/NativeDatePicker.svelte';
	import NativeTimePicker from '$lib/components/NativeTimePicker.svelte';
	import TimePicker from '$lib/components/TimePicker.svelte';
	import { slide } from 'svelte/transition';
	import { browser } from '$app/environment';
	
	// Icons
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Repeat from 'lucide-svelte/icons/repeat';
	import Plus from 'lucide-svelte/icons/plus';
	import Minus from 'lucide-svelte/icons/minus';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Info from 'lucide-svelte/icons/info';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Search from 'lucide-svelte/icons/search';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import CircleDot from 'lucide-svelte/icons/circle-dot';

	interface Props {
		isOpen: boolean;
		tourId?: string; // Optional - if not provided, show tour selection
		initialDate?: string;
		onClose: () => void;
		onSuccess?: () => void;
	}

	let {
		isOpen = $bindable(false),
		tourId: initialTourId,
		initialDate,
		onClose,
		onSuccess
	}: Props = $props();

	const queryClient = useQueryClient();

	// Firefox detection - use TimePicker for Firefox, NativeTimePicker for others
	const isFirefox = $derived(browser && navigator.userAgent.toLowerCase().includes('firefox'));

	// Step management - only show tour selection if no tourId provided
	let currentStep = $state<1 | 2>(1);
	let selectedTourId = $state<string>('');
	let searchQuery = $state('');
	
	// Determine active tourId (either from props or user selection)
	const activeTourId = $derived(initialTourId || selectedTourId);
	const needsTourSelection = $derived(!initialTourId);
	const showTourSelection = $derived(needsTourSelection && currentStep === 1);

	// Fetch all user tours for selection
	const toursQuery = $derived(createQuery({
		queryKey: queryKeys.userTours,
		queryFn: queryFunctions.fetchUserTours,
		staleTime: 5 * 60 * 1000,
		enabled: isOpen && needsTourSelection
	}));

	const tours = $derived(($toursQuery.data as any[]) || []);

	// Filter tours for selection
	let filteredTours = $derived.by(() => {
		let filtered = tours.filter(tour => {
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				return (
					tour.name.toLowerCase().includes(query) ||
					tour.location?.toLowerCase().includes(query)
				);
			}
			return true;
		});
		
		filtered.sort((a, b) => {
			if (a.status === 'active' && b.status !== 'active') return -1;
			if (a.status !== 'active' && b.status === 'active') return 1;
			return a.name.localeCompare(b.name);
		});
		
		return filtered;
	});

	// Fetch tour data - use $derived to make queries reactive to props
	const tourQuery = $derived(createQuery({
		queryKey: activeTourId ? queryKeys.tourDetails(activeTourId) : ['tourDetails', 'none'],
		queryFn: () => queryFunctions.fetchTourDetails(activeTourId),
		staleTime: 5 * 60 * 1000,
		enabled: isOpen && !!activeTourId && (!needsTourSelection || currentStep === 2)
	}));

	const tour = $derived($tourQuery.data?.tour || null);

	// Fetch existing schedule to check for conflicts
	const scheduleQuery = $derived(createQuery({
		queryKey: activeTourId ? queryKeys.tourSchedule(activeTourId) : ['tourSchedule', 'none'],
		queryFn: () => queryFunctions.fetchTourSchedule(activeTourId),
		staleTime: 30 * 1000,
		enabled: isOpen && !!activeTourId && (!needsTourSelection || currentStep === 2)
	}));

	const existingSlots = $derived($scheduleQuery.data?.timeSlots || []);

	// Form state - with smart defaults
	let selectedDate = $state('');
	let startTime = $state('10:00');
	let endTime = $state('12:00'); // Now editable instead of calculated
	let additionalDays = $state(0); // For multi-day tours beyond 24 hours
	
	// Track tour ID to detect when tour changes
	let lastTourId = $state<string | null>(null);
	
	// Track if user has manually changed values
	let userChangedEndTime = $state(false);
	let userChangedCapacity = $state(false);
	let userChangedMinCapacity = $state(false);
	
	// Initialize with derived values from tour, or defaults
	let capacity = $state(10);
	let minCapacity = $state(1);
	
	// Recurring options
	let recurring = $state(false);
	let recurringType = $state<'daily' | 'weekly' | 'monthly'>('weekly');
	let recurringEndDate = $state('');
	
	// State
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let showSuccess = $state(false);
	let successMessage = $state<string>('');
	let formContainerRef = $state<HTMLFormElement>();
	
	// UI state
	let showCapacitySettings = $state(false);

	// Initialize date when drawer opens
	$effect(() => {
		if (isOpen) {
			selectedDate = initialDate || new Date().toISOString().split('T')[0];
			// Reset form state
			error = null;
			userChangedEndTime = false;
			userChangedCapacity = false;
			userChangedMinCapacity = false;
			recurring = false;
			recurringEndDate = '';
			showCapacitySettings = false;
			additionalDays = 0;
			// Reset selection state
			currentStep = needsTourSelection ? 1 : 2;
			selectedTourId = initialTourId || '';
			searchQuery = '';
		}
	});

	// Calculate duration in minutes based on start and end time + additional days
	let calculatedDuration = $derived.by(() => {
		const [startHours, startMinutes] = startTime.split(':').map(Number);
		const [endHours, endMinutes] = endTime.split(':').map(Number);
		
		const startTotalMinutes = startHours * 60 + startMinutes;
		const endTotalMinutes = endHours * 60 + endMinutes;
		
		// Calculate base duration for the time difference
		let baseDuration = 0;
		if (endTotalMinutes <= startTotalMinutes && additionalDays === 0) {
			// End time is before start time, assume next day
			baseDuration = (24 * 60 - startTotalMinutes) + endTotalMinutes;
		} else {
			// Normal same-day duration
			baseDuration = endTotalMinutes - startTotalMinutes;
		}
		
		// Add additional days (24 hours per day)
		return baseDuration + (additionalDays * 24 * 60);
	});
	
	// Calculate end date for multi-day tours
	let endDateCalculation = $derived.by(() => {
		const [startHours, startMinutes] = startTime.split(':').map(Number);
		const [endHours, endMinutes] = endTime.split(':').map(Number);
		
		const startTotalMinutes = startHours * 60 + startMinutes;
		const endTotalMinutes = endHours * 60 + endMinutes;
		
		// Calculate how many days to add
		let daysToAdd = additionalDays;
		if (endTotalMinutes <= startTotalMinutes && additionalDays === 0) {
			// End time is before start time, it's next day
			daysToAdd = 1;
		}
		
		if (daysToAdd > 0) {
			// Create date in local time to avoid timezone shift
			const [year, month, day] = selectedDate.split('-').map(Number);
			const endDateObj = new Date(year, month - 1, day);
			endDateObj.setDate(endDateObj.getDate() + daysToAdd);
			const y = endDateObj.getFullYear();
			const m = String(endDateObj.getMonth() + 1).padStart(2, '0');
			const d = String(endDateObj.getDate()).padStart(2, '0');
			return `${y}-${m}-${d}`;
		}
		
		// Same day
		return selectedDate;
	});

	// Calculate existing slots map (for blue dots)
	let existingSlotsMap = $derived.by(() => {
		const map = new Map<string, number>();
		
		// Add existing slots to map
		existingSlots.forEach((slot: any) => {
			const start = new Date(slot.startTime);
			const end = new Date(slot.endTime);
			
			start.setHours(0, 0, 0, 0);
			end.setHours(0, 0, 0, 0);
			
			const current = new Date(start);
			while (current <= end) {
				const dateStr = current.toISOString().split('T')[0];
				map.set(dateStr, (map.get(dateStr) || 0) + 1);
				current.setDate(current.getDate() + 1);
			}
		});
		
		return map;
	});

	// Calculate preview dates (for yellow dots) - dates where new slots will be added
	let previewDatesSet = $derived.by(() => {
		const set = new Set<string>();
		
		// Add preview range (for multi-day tours)
		if (selectedDate && endDateCalculation) {
			// Parse date strings directly to avoid timezone issues
			const [startYear, startMonth, startDay] = selectedDate.split('-').map(Number);
			const [endYear, endMonth, endDay] = endDateCalculation.split('-').map(Number);
			
			const start = new Date(startYear, startMonth - 1, startDay);
			const end = new Date(endYear, endMonth - 1, endDay);
			
			const current = new Date(start);
			while (current <= end) {
				const year = current.getFullYear();
				const month = String(current.getMonth() + 1).padStart(2, '0');
				const day = String(current.getDate()).padStart(2, '0');
				const dateStr = `${year}-${month}-${day}`;
				set.add(dateStr);
				current.setDate(current.getDate() + 1);
			}
		}
		
		// Add recurring preview dates
		if (recurring && slotsPreview.length > 1) {
			slotsPreview.forEach((slot: any) => {
				set.add(slot.date);
			});
		}
		
		return set;
	});

	// Set default recurring end date (4 weeks from selected date)
	$effect(() => {
		if (recurring && !recurringEndDate) {
			// Create date in local time to avoid timezone shift
			const [year, month, day] = selectedDate.split('-').map(Number);
			const start = new Date(year, month - 1, day);
			start.setDate(start.getDate() + 28); // Default 4 weeks
			const y = start.getFullYear();
			const m = String(start.getMonth() + 1).padStart(2, '0');
			const d = String(start.getDate()).padStart(2, '0');
			recurringEndDate = `${y}-${m}-${d}`;
		}
	});

	// Calculate preview of slots
	let slotsPreview = $derived.by(() => {
		if (!recurring) return [{ date: selectedDate, startTime, endTime }];
		
		const slots = [];
		// Create dates in local time to avoid timezone shift
		const [startYear, startMonth, startDay] = selectedDate.split('-').map(Number);
		const [endYear, endMonth, endDay] = recurringEndDate.split('-').map(Number);
		const start = new Date(startYear, startMonth - 1, startDay);
		const end = new Date(endYear, endMonth - 1, endDay);
		const current = new Date(start);
		
		while (current <= end) {
			// Format date in local time
			const y = current.getFullYear();
			const m = String(current.getMonth() + 1).padStart(2, '0');
			const d = String(current.getDate()).padStart(2, '0');
			slots.push({
				date: `${y}-${m}-${d}`,
				startTime,
				endTime
			});
			
			switch (recurringType) {
				case 'daily':
					current.setDate(current.getDate() + 1);
					break;
				case 'weekly':
					current.setDate(current.getDate() + 7);
					break;
				case 'monthly':
					current.setMonth(current.getMonth() + 1);
					break;
			}
		}
		
		return slots;
	});

	// Generate consistent color for tour based on ID and name
	function getTourCalendarColor(tourId: string | undefined, tourName: string | undefined): string {
		if (!tourId || !tourName) {
			return '#3B82F6';
		}
		
		let hash = 0;
		const str = tourId + tourName;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) - hash) + str.charCodeAt(i);
			hash = hash & hash;
		}
		
		const hue = Math.abs(hash) % 360;
		const saturation = 65 + (Math.abs(hash >> 8) % 20);
		const lightness = 45 + (Math.abs(hash >> 16) % 15);
		
		const h = hue / 360;
		const s = saturation / 100;
		const l = lightness / 100;
		
		let r, g, b;
		if (s === 0) {
			r = g = b = l;
		} else {
			const hue2rgb = (p: number, q: number, t: number) => {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1/6) return p + (q - p) * 6 * t;
				if (t < 1/2) return q;
				if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
				return p;
			};
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		}
		
		const toHex = (x: number) => {
			const hex = Math.round(x * 255).toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		};
		
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}

	// Handle tour selection
	function selectTour(tourId: string) {
		selectedTourId = tourId;
		currentStep = 2;
	}

	// Handle back to tour selection
	function goBackToTourSelection() {
		currentStep = 1;
		error = null;
	}

	// Tour color for header styling
	const tourColor = $derived(tour ? getTourCalendarColor(tour.id, tour.name) : null);

	// Submit handler
	async function handleSubmit() {
		if (!tour) return;
		
		isSubmitting = true;
		error = null;
		
		try {
			// Create dates in local timezone and format with timezone offset
			const [startYear, startMonth, startDay] = selectedDate.split('-').map(Number);
			const [startHour, startMinute] = startTime.split(':').map(Number);
			const startDate = new Date(startYear, startMonth - 1, startDay, startHour, startMinute, 0);
			
			const [endYear, endMonth, endDay] = endDateCalculation.split('-').map(Number);
			const [endHour, endMinute] = endTime.split(':').map(Number);
			const endDate = new Date(endYear, endMonth - 1, endDay, endHour, endMinute, 0);
			
			// Format dates preserving local timezone (ISO 8601 with timezone offset)
			const formatWithTimezone = (date: Date) => {
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				const hours = String(date.getHours()).padStart(2, '0');
				const minutes = String(date.getMinutes()).padStart(2, '0');
				const seconds = String(date.getSeconds()).padStart(2, '0');
				
				// Get timezone offset in format +HH:MM or -HH:MM
				const offsetMinutes = date.getTimezoneOffset();
				const offsetSign = offsetMinutes <= 0 ? '+' : '-';
				const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
				const offsetMins = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
				
				return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMins}`;
			};
			
			const payload = {
				startTime: formatWithTimezone(startDate),
				endTime: formatWithTimezone(endDate),
				capacity,
				minCapacity,
				status: 'available',
				notes: '',
				recurring,
				recurringType: recurring ? recurringType : undefined,
				recurringEnd: recurring ? recurringEndDate : undefined
			};
			
			const response = await fetch(`/api/tours/${activeTourId}/schedule`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			
			if (response.ok) {
				const data = await response.json();
				const slotsCreated = data.slotsCreated || 1;
				
				// Show success message
				successMessage = recurring 
					? `Successfully created ${slotsCreated} recurring time slot${slotsCreated !== 1 ? 's' : ''}!`
					: `Time slot${slotsCreated !== 1 ? 's' : ''} created successfully!`;
				showSuccess = true;
				error = null;
				
				// Invalidate schedule
				await queryClient.invalidateQueries({
					queryKey: queryKeys.tourSchedule(activeTourId)
				});
				
				// Call success callback
				onSuccess?.();
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to create time slots';
				
				// Scroll to top to show error on mobile
				if (formContainerRef) {
					formContainerRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}
		} catch (err) {
			console.error('Error creating time slots:', err);
			error = 'Failed to create time slots. Please try again.';
			
			// Scroll to top to show error on mobile
			if (formContainerRef) {
				formContainerRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		} finally {
			isSubmitting = false;
		}
	}

	// Function to reset form after success
	function resetFormForNewSlots() {
		showSuccess = false;
		successMessage = '';
		error = null;
		selectedDate = initialDate || new Date().toISOString().split('T')[0];
		startTime = '10:00';
		endTime = '12:00';
		additionalDays = 0;
		recurring = false;
		recurringType = 'weekly';
		recurringEndDate = '';
		userChangedEndTime = false;
		userChangedCapacity = false;
		userChangedMinCapacity = false;
	}

	// Function to handle closing the drawer
	function handleClose() {
		resetFormForNewSlots();
		isOpen = false;
		onClose();
	}

	// Initialize values when tour loads (only once per tour)
	$effect(() => {
		if (tour && tour.id !== lastTourId) {
			// Only update if user hasn't manually changed
			if (!userChangedEndTime) {
				// Set end time and additional days based on tour duration
				const tourDuration = tour.duration || 120;
				const [startHours, startMinutes] = startTime.split(':').map(Number);
				const totalMinutes = startHours * 60 + startMinutes + tourDuration;
				
				// Calculate additional days for multi-day tours
				const totalHours = Math.floor(totalMinutes / 60);
				additionalDays = Math.floor(totalHours / 24);
				
				// Calculate end time within the final day
				const endHours = totalHours % 24;
				const endMinutes = totalMinutes % 60;
				
				endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
			}
			if (!userChangedCapacity) {
				capacity = tour.maxCapacity || tour.capacity || 10;
			}
			if (!userChangedMinCapacity) {
				minCapacity = tour.minCapacity || 1;
			}
			
			// Mark this tour as initialized
			lastTourId = tour.id;
		}
	});
	
	// Function to reset end time to tour's default duration
	function resetToDefaultDuration() {
		if (!tour) return;
		
		const tourDuration = tour.duration || 120;
		const [startHours, startMinutes] = startTime.split(':').map(Number);
		const totalMinutes = startHours * 60 + startMinutes + tourDuration;
		
		// Calculate additional days for multi-day tours
		const totalHours = Math.floor(totalMinutes / 60);
		additionalDays = Math.floor(totalHours / 24);
		
		// Calculate end time within the final day
		const endHours = totalHours % 24;
		const endMinutes = totalMinutes % 60;
		
		endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
		userChangedEndTime = false;
	}

	// Auto-calculate end time when start time changes (unless user manually changed end time)
	$effect(() => {
		if (tour && !userChangedEndTime && startTime) {
			const tourDuration = tour.duration || 120;
			const [startHours, startMinutes] = startTime.split(':').map(Number);
			const totalMinutes = startHours * 60 + startMinutes + tourDuration;
			
			// Calculate additional days for multi-day tours
			const totalHours = Math.floor(totalMinutes / 60);
			additionalDays = Math.floor(totalHours / 24);
			
			// Calculate end time within the final day
			const endHours = totalHours % 24;
			const endMinutes = totalMinutes % 60;
			
			endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
		}
	});
	
	// Format duration with days when applicable
	function formatDurationWithDays(minutes: number): string {
		const days = Math.floor(minutes / 1440);
		const hours = Math.floor((minutes % 1440) / 60);
		const mins = minutes % 60;
		
		if (days > 0) {
			if (hours === 0 && mins === 0) {
				return `${days} ${days === 1 ? 'day' : 'days'}`;
			} else if (mins === 0) {
				return `${days}d ${hours}h`;
			} else {
				return `${days}d ${hours}h ${mins}m`;
			}
		}
		
		return formatDuration(minutes);
	}
</script>

<Drawer
	bind:isOpen
	onClose={onClose}
	class="add-slots-drawer"
>
	{#snippet titleSlot()}
		{#if showTourSelection}
			<h2 class="drawer-custom-title">Select Tour</h2>
		{:else if tour}
			<div class="drawer-title-with-dot">
				{#if tourColor}
					<div class="drawer-title-dot" style="background-color: {tourColor};"></div>
				{/if}
				<h2 class="drawer-custom-title">{tour.name}</h2>
				{#if needsTourSelection}
					<button 
						type="button"
						onclick={goBackToTourSelection}
						class="drawer-change-btn"
					>
						<ArrowLeft class="h-3.5 w-3.5" />
						Change
					</button>
				{/if}
			</div>
		{:else}
			<h2 class="drawer-custom-title">Add Time Slots</h2>
		{/if}
	{/snippet}

	<!-- Step 1: Tour Selection (only if no tourId provided) -->
	{#if showTourSelection}
		<div class="booking-step active">
			<div class="step-number">1</div>
			<div class="ml-4">
				<h3 class="font-medium mb-3" style="color: var(--text-primary);">Select Tour</h3>
				<!-- Search -->
				<div class="mb-4">
					<div class="relative">
						<Search class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style="color: var(--text-tertiary);" />
						<input
							type="search"
							bind:value={searchQuery}
							placeholder="Search tours..."
							class="form-input pl-12 pr-4 py-3 w-full"
							style="font-size: 1rem;"
						/>
					</div>
				</div>

				{#if $toursQuery.isLoading}
					<div class="flex items-center justify-center py-12">
						<Loader2 class="h-8 w-8 animate-spin" style="color: var(--text-tertiary);" />
					</div>
				{:else if filteredTours.length === 0}
					<div class="text-center py-12">
						<p class="text-lg" style="color: var(--text-secondary);">
							{searchQuery ? 'No tours found matching your search' : 'No tours available'}
						</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						{#each filteredTours as tourItem (tourItem.id)}
							{@const tourItemColor = getTourCalendarColor(tourItem.id, tourItem.name)}
							<button
								onclick={() => selectTour(tourItem.id)}
								class="tour-card"
								type="button"
							>
								<div class="tour-color-bar" style="background-color: {tourItemColor};"></div>
								<div class="tour-image-wrapper">
									{#if tourItem.images && tourItem.images[0]}
										<img 
											src={getImageUrl(tourItem, tourItem.images[0])} 
											alt={tourItem.name} 
											class="tour-image"
											loading="lazy"
										/>
									{:else}
										<div class="tour-image-placeholder">
											<MapPin class="h-10 w-10" style="color: var(--text-tertiary);" />
										</div>
									{/if}
									<span class="status-badge {tourItem.status === 'active' ? 'active' : 'draft'}">
										<CircleDot class="h-3.5 w-3.5" />
										{tourItem.status === 'active' ? 'Active' : 'Draft'}
									</span>
								</div>
								
								<div class="tour-info">
									<h3 class="tour-name">{tourItem.name}</h3>
									<div class="tour-meta">
										<div class="meta-item">
											<MapPin class="h-4 w-4" />
											<span>{tourItem.location || 'Location not set'}</span>
										</div>
										<div class="meta-item">
											<Clock class="h-4 w-4" />
											<span>{formatDuration(tourItem.duration)}</span>
										</div>
									</div>
								</div>
								
								<ArrowRight class="h-6 w-6 flex-shrink-0" style="color: var(--text-tertiary);" />
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Step 2: Configure Time Slots -->
		{#if $tourQuery.isLoading}
			<div class="flex items-center justify-center py-12">
				<Loader2 class="h-8 w-8 animate-spin" style="color: var(--text-tertiary);" />
			</div>
		{:else if tour}
		{#if showSuccess}
			<!-- Success State -->
			<div class="success-screen">
				<div class="success-icon">
					<CheckCircle class="h-16 w-16" style="color: var(--color-success-600);" />
				</div>
				<h3 class="success-title">{successMessage}</h3>
				<p class="success-description">Your time slots have been added to the calendar and are now available for booking.</p>
				
				<div class="success-actions">
					<button
						type="button"
						onclick={resetFormForNewSlots}
						class="button-secondary flex-1"
					>
						Add More Slots
					</button>
					<button
						type="button"
						onclick={handleClose}
						class="button-primary flex-1"
					>
						Done
					</button>
				</div>
			</div>
		{:else}
		<form bind:this={formContainerRef} onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
			{#if error}
				<div class="error-banner">
					<p>{error}</p>
				</div>
			{/if}

			<!-- Main Form Section -->
			<div class="form-section">
				<div class="space-y-5">
							<!-- Calendar & Time Side by Side -->
							<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<!-- Calendar -->
								<div>
									<div class="text-xs font-medium mb-1.5" style="color: var(--text-secondary);">Select Date</div>
									<MiniMonthCalendar
										selectedDate={selectedDate}
										slotsMap={existingSlotsMap}
										previewDates={previewDatesSet}
										onDateClick={(date) => selectedDate = date}
										initialMonth={selectedDate}
									/>
								</div>

								<!-- Time & Duration -->
								<div class="space-y-3">
									<!-- Time Pickers -->
									<div class="grid grid-cols-2 gap-3">
										<!-- Start Time -->
										<div>
											<div class="text-xs font-medium mb-1.5" style="color: var(--text-secondary);">
												Start Time
												<span style="color: var(--color-error);" class="ml-1">*</span>
											</div>
											{#if isFirefox}
												<TimePicker
													bind:value={startTime}
													onchange={() => {}}
													required
												/>
											{:else}
												<NativeTimePicker
													bind:value={startTime}
													required
												/>
											{/if}
										</div>
										
										<!-- End Time (Now Editable) -->
										<div>
											<div class="text-xs font-medium mb-1.5" style="color: var(--text-secondary);">
												End Time
												<span style="color: var(--color-error);" class="ml-1">*</span>
											</div>
											{#if isFirefox}
												<TimePicker
													bind:value={endTime}
													onchange={() => userChangedEndTime = true}
													required
												/>
											{:else}
												<NativeTimePicker
													bind:value={endTime}
													onchange={() => userChangedEndTime = true}
													required
												/>
											{/if}
											{#if endDateCalculation !== selectedDate}
												<div class="text-xs mt-1" style="color: var(--text-secondary);">
													{(() => {
														const [startY, startM, startD] = selectedDate.split('-').map(Number);
														const [endY, endM, endD] = endDateCalculation.split('-').map(Number);
														const startDate = new Date(startY, startM - 1, startD);
														const endDate = new Date(endY, endM - 1, endD);
														const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
														
														if (daysDiff === 1) {
															return 'Next day';
														} else {
															return `${daysDiff} days later • ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
														}
													})()}
												</div>
											{/if}
										</div>
									</div>

									<!-- Duration & Additional Days - Inline -->
									<div>
										<div class="flex items-center justify-between mb-1.5">
											<div class="text-xs font-medium" style="color: var(--text-secondary);">
												Duration {#if additionalDays > 0 || calculatedDuration >= 1440}<span style="color: var(--text-tertiary);">& Days</span>{/if}
											</div>
											{#if tour && calculatedDuration !== tour.duration}
												<button
													type="button"
													onclick={resetToDefaultDuration}
													class="text-xs underline"
													style="color: var(--color-primary-600);"
												>
													Reset to {formatDurationWithDays(tour.duration)}
												</button>
											{/if}
										</div>
										
										<div class="duration-multiday-grid">
											<!-- Duration Display -->
											<div class="duration-display-compact">
												<Clock class="h-4 w-4 flex-shrink-0" style="color: var(--text-tertiary);" />
												<span class="text-base font-semibold whitespace-nowrap" style="color: var(--text-primary);">
													{formatDurationWithDays(calculatedDuration)}
												</span>
											</div>
											
											<!-- Additional Days Control (if needed) -->
											{#if additionalDays > 0 || calculatedDuration >= 1440}
												<div class="multiday-controls">
													<button 
														type="button" 
														onclick={() => { additionalDays = Math.max(0, additionalDays - 1); userChangedEndTime = true; }} 
														class="multiday-btn"
														disabled={additionalDays <= 0}
													>
														<Minus class="h-4 w-4" />
													</button>
													<div class="multiday-value">
														<span class="font-semibold" style="color: var(--text-primary);">
															{additionalDays}
														</span>
														<span class="text-xs ml-1" style="color: var(--text-tertiary);">
															{additionalDays === 1 ? 'day' : 'days'}
														</span>
													</div>
													<button 
														type="button" 
														onclick={() => { additionalDays = Math.min(30, additionalDays + 1); userChangedEndTime = true; }} 
														class="multiday-btn"
													>
														<Plus class="h-4 w-4" />
													</button>
												</div>
											{/if}
										</div>
									</div>

									<!-- Schedule Preview -->
									<div class="schedule-preview">
										<div class="text-xs font-medium mb-2" style="color: var(--text-secondary);">Schedule Preview</div>
										<div class="space-y-2">
											<!-- Date -->
											<div class="preview-row">
												<Calendar class="h-4 w-4" style="color: var(--text-tertiary);" />
												<div class="text-sm">
													<div style="color: var(--text-primary); font-weight: 500;">
														{(() => {
															const [y, m, d] = selectedDate.split('-').map(Number);
															return new Date(y, m - 1, d).toLocaleDateString('en-US', { 
																weekday: 'long', 
																month: 'long', 
																day: 'numeric',
																year: 'numeric'
															});
														})()}
													</div>
												</div>
											</div>
											
											<!-- Time -->
											<div class="preview-row">
												<Clock class="h-4 w-4" style="color: var(--text-tertiary);" />
												<div class="text-sm" style="color: var(--text-primary);">
													{startTime} - {endTime}
													{#if endDateCalculation !== selectedDate}
														<div class="text-xs" style="color: var(--text-secondary);">
															Ends {(() => {
																const [y, m, d] = endDateCalculation.split('-').map(Number);
																return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
															})()}
															• Multi-day tour
														</div>
													{/if}
												</div>
											</div>
											
											<!-- Capacity -->
											<div class="preview-row">
												<Users class="h-4 w-4" style="color: var(--text-tertiary);" />
												<div class="text-sm" style="color: var(--text-primary);">
													{capacity} spot{capacity !== 1 ? 's' : ''} available
													{#if minCapacity > 1}
														<span class="text-xs" style="color: var(--text-secondary);"> • Min {minCapacity} required</span>
													{/if}
												</div>
											</div>
											
											<!-- Recurring Info -->
											{#if recurring}
												<div class="preview-row">
													<Repeat class="h-4 w-4" style="color: var(--text-tertiary);" />
													<div class="text-sm" style="color: var(--text-primary);">
														{slotsPreview.length} slot{slotsPreview.length !== 1 ? 's' : ''}
														<span class="text-xs" style="color: var(--text-secondary);">
															• Every {recurringType === 'daily' ? 'day' : recurringType === 'weekly' ? 'week' : 'month'}
														</span>
													</div>
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>

					<!-- Recurring Settings (Expandable) -->
					<div class="recurring-section">
						<button
							type="button"
							onclick={() => recurring = !recurring}
							class="capacity-toggle"
						>
							<Repeat class="h-5 w-5" />
							<div class="flex-1 text-left">
								<div class="font-medium" style="color: var(--text-primary);">
									Recurring Slots
								</div>
								<div class="text-xs" style="color: var(--text-secondary);">
									{#if recurring && recurringEndDate}
										{recurringType.charAt(0).toUpperCase() + recurringType.slice(1)} until {(() => {
											const [y, m, d] = recurringEndDate.split('-').map(Number);
											return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
										})()} • {slotsPreview.length} slot{slotsPreview.length !== 1 ? 's' : ''}
									{:else if recurring}
										{recurringType.charAt(0).toUpperCase() + recurringType.slice(1)} • Select end date
									{:else}
										Single slot only
									{/if}
								</div>
							</div>
							<span class="text-xs" style="color: var(--color-primary-600);">
								{recurring ? 'Remove' : 'Add'}
							</span>
						</button>

					{#if recurring}
						<div class="capacity-controls" transition:slide={{ duration: 300 }}>
							<!-- Frequency and Date Grid -->
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<!-- Frequency Selection -->
									<div>
										<div class="text-xs font-medium mb-1.5 block" style="color: var(--text-secondary);">Frequency</div>
										<div class="grid grid-cols-3 gap-2">
											<button
												type="button"
												onclick={() => recurringType = 'daily'}
												class="recurring-type-btn {recurringType === 'daily' ? 'active' : ''}"
											>
												Daily
											</button>
											<button
												type="button"
												onclick={() => recurringType = 'weekly'}
												class="recurring-type-btn {recurringType === 'weekly' ? 'active' : ''}"
											>
												Weekly
											</button>
											<button
												type="button"
												onclick={() => recurringType = 'monthly'}
												class="recurring-type-btn {recurringType === 'monthly' ? 'active' : ''}"
											>
												Monthly
											</button>
										</div>
									</div>

									<!-- End Date -->
									<div>
										<div class="text-xs font-medium mb-1.5" style="color: var(--text-secondary);">
											Repeat Until
											<span style="color: var(--color-error);" class="ml-1">*</span>
										</div>
										<NativeDatePicker
											bind:value={recurringEndDate}
											min={selectedDate}
											placeholder="Select end date"
											required={true}
										/>
									</div>
								</div>
								
								<!-- Slots Count Preview -->
								{#if slotsPreview.length > 1}
									<div class="rounded-lg p-2.5 mt-3" style="background: var(--color-info-50); border: 1px solid var(--color-info-200);">
										<div class="flex items-center gap-2 text-sm font-medium" style="color: var(--color-info-900);">
											<Calendar class="h-4 w-4" />
											{slotsPreview.length} time slot{slotsPreview.length !== 1 ? 's' : ''} will be created
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Capacity Settings (Expandable) -->
					<div class="capacity-section">
						<button
							type="button"
							onclick={() => showCapacitySettings = !showCapacitySettings}
							class="capacity-toggle"
						>
							<Users class="h-5 w-5" />
							<div class="flex-1 text-left">
								<div class="font-medium" style="color: var(--text-primary);">
									Capacity Settings
								</div>
								<div class="text-xs" style="color: var(--text-secondary);">
									{capacity} available spot{capacity !== 1 ? 's' : ''}
									{#if minCapacity > 1}
										• Minimum {minCapacity} required
									{/if}
								</div>
							</div>
							<span class="text-xs" style="color: var(--color-primary-600);">
								{showCapacitySettings ? 'Hide' : 'Change'}
							</span>
						</button>

					{#if showCapacitySettings}
						<div class="capacity-controls" transition:slide={{ duration: 300 }}>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<!-- Minimum Required -->
									<div>
										<label for="slot-min-capacity" class="text-xs font-medium mb-1.5 block" style="color: var(--text-secondary);">
											Minimum Required <span style="color: var(--text-tertiary);">(optional)</span>
										</label>
										<div class="capacity-input-group">
											<button 
												type="button" 
												onclick={() => { minCapacity = Math.max(1, minCapacity - 1); userChangedMinCapacity = true; }} 
												class="capacity-btn"
												disabled={minCapacity <= 1}
											>
												<Minus class="h-4 w-4" />
											</button>
											<input
												id="slot-min-capacity"
												type="number"
												bind:value={minCapacity}
												oninput={() => userChangedMinCapacity = true}
												onfocus={(e) => e.currentTarget.select()}
												min="1"
												max={capacity}
												class="capacity-number-input text-center font-semibold"
											/>
											<button 
												type="button" 
												onclick={() => { minCapacity = Math.min(capacity, minCapacity + 1); userChangedMinCapacity = true; }} 
												class="capacity-btn"
												disabled={minCapacity >= capacity}
											>
												<Plus class="h-4 w-4" />
											</button>
										</div>
									</div>

									<!-- Available Spots -->
									<div>
										<label for="slot-capacity" class="text-xs font-medium mb-1.5 block" style="color: var(--text-secondary);">
											Available Spots
										</label>
										<div class="capacity-input-group">
											<button 
												type="button" 
												onclick={() => { capacity = Math.max(1, capacity - 1); userChangedCapacity = true; }} 
												class="capacity-btn"
											>
												<Minus class="h-4 w-4" />
											</button>
											<input
												id="slot-capacity"
												type="number"
												bind:value={capacity}
												oninput={() => userChangedCapacity = true}
												onfocus={(e) => e.currentTarget.select()}
												min="1"
												max={tour?.maxCapacity || 100}
												class="capacity-number-input text-center font-semibold"
											/>
											<button 
												type="button" 
												onclick={() => { capacity = Math.min(tour?.maxCapacity || 100, capacity + 1); userChangedCapacity = true; }} 
												class="capacity-btn"
											>
												<Plus class="h-4 w-4" />
											</button>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Submit Buttons -->
			<div class="flex flex-col sm:flex-row gap-3 pt-2">
				<button
					type="button"
					onclick={handleClose}
					class="button-secondary flex-1"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isSubmitting}
					class="button-primary flex-1 flex items-center justify-center gap-2"
				>
					{#if isSubmitting}
						<Loader2 class="h-5 w-5 animate-spin" />
						Creating...
					{:else}
						<CheckCircle class="h-5 w-5" />
						Create {slotsPreview.length} Slot{slotsPreview.length > 1 ? 's' : ''}
					{/if}
				</button>
			</div>
		</form>
		{/if}
		{:else}
			<div class="text-center py-12">
				<p style="color: var(--text-secondary);">Tour not found</p>
			</div>
		{/if}
	{/if}
</Drawer>

<style>
	/* Success Screen */
	.success-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1.5rem;
		text-align: center;
		animation: slideIn 0.3s ease;
	}
	
	.success-icon {
		margin-bottom: 1.5rem;
		animation: scaleIn 0.4s ease-out;
	}
	
	.success-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.75rem 0;
	}
	
	.success-description {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		margin: 0 0 2rem 0;
		max-width: 28rem;
	}
	
	.success-actions {
		display: flex;
		gap: 0.75rem;
		width: 100%;
		max-width: 24rem;
	}
	
	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	
	.error-banner {
		padding: 1rem;
		background: var(--color-danger-50);
		border: 1px solid var(--color-danger-200);
		border-radius: 0.5rem;
		color: var(--color-danger-600);
		position: sticky;
		top: 0;
		z-index: 10;
		margin: -1rem -1rem 1rem -1rem;
	}

	.error-banner p {
		margin: 0;
		font-size: 0.875rem;
	}
	
	/* Mobile banner positioning */
	@media (max-width: 768px) {
		.error-banner {
			margin: 0 0 1rem 0;
			border-radius: 0.5rem;
		}
		
		.success-screen {
			padding: 2rem 1rem;
		}
		
		.success-actions {
			flex-direction: column;
		}
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

	/* Form Section */
	.form-section {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	/* Override calendar max-width to fill container */
	.form-section :global(.calendar-container--mini) {
		max-width: 100%;
		width: 100%;
	}

	/* Recurring Type Buttons */
	.recurring-type-btn {
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-secondary);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.15s;
		text-align: center;
		height: 2.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.recurring-type-btn:hover {
		border-color: var(--color-primary-300);
	}

	.recurring-type-btn.active {
		background: var(--color-primary-500);
		border-color: var(--color-primary-500);
		color: white;
	}

	/* Mobile-specific improvements */
	@media (max-width: 768px) {
		.multiday-btn {
			height: 3rem;
			width: 3rem;
		}
		
		/* Fix grid columns on mobile to ensure equal width */
		.grid.grid-cols-2 {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 0.75rem;
		}
		
		.grid.grid-cols-2 > * {
			min-width: 0;
			max-width: 100%;
		}
	}

	/* Schedule Preview */
	.schedule-preview {
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
		border: 1px solid var(--border-primary);
	}

	.preview-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	/* Recurring & Capacity Sections */
	.recurring-section,
	.capacity-section {
		border-top: 1px solid var(--border-primary);
		padding-top: 1rem;
	}

	.capacity-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
	}

	.capacity-toggle:hover {
		border-color: var(--color-primary-300);
		background: var(--color-primary-50);
	}

	.capacity-controls {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
		border: 1px solid var(--border-primary);
	}
	
	/* Capacity Input Group - Matches duration/days style */
	.capacity-input-group {
		display: flex;
		align-items: stretch;
		gap: 0.5rem;
		height: 2.75rem;
	}
	
	.capacity-number-input {
		width: 100%;
		max-width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0.75rem;
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		cursor: text;
		transition: all 0.15s;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		box-sizing: border-box;
		height: 2.75rem;
		flex: 1;
		min-width: 0;
	}
	
	.capacity-number-input:hover {
		border-color: var(--color-primary-300);
		background: var(--color-primary-50);
	}
	
	.capacity-number-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
	
	/* Hide number input spinners */
	.capacity-number-input::-webkit-inner-spin-button,
	.capacity-number-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	
	.capacity-number-input[type="number"] {
		appearance: textfield;
		-moz-appearance: textfield;
	}
	
	.capacity-btn {
		height: 2.75rem;
		width: 2.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
	}
	
	.capacity-btn:hover:not(:disabled) {
		border-color: var(--color-primary-300);
		background: var(--color-primary-50);
	}
	
	.capacity-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Mobile */
	@media (max-width: 768px) {
		.form-section {
			padding: 1rem;
		}

		.capacity-toggle {
			padding: 0.75rem;
		}

		.capacity-controls {
			padding: 0.75rem;
		}
		
		.recurring-type-btn {
			padding: 0.625rem 0.75rem;
			height: 3rem;
		}
		
		.capacity-input-group {
			gap: 0.375rem;
			height: 3rem;
		}
		
		.capacity-number-input {
			padding: 0.625rem 0.875rem;
			height: 3rem;
			font-size: 1rem;
		}
		
		.capacity-btn {
			height: 3rem;
			width: 3rem;
		}
	}

	/* Desktop: Reduce modal width for better UX */
	@media (min-width: 768px) {
		:global(.add-slots-drawer) {
			max-width: 56rem !important; /* 896px (4xl) instead of 6xl */
		}
	}
	
	/* Duration & Multi-Day Grid Container */
	.duration-multiday-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		align-items: stretch;
	}
	
	/* Duration Display - Compact */
	.duration-display-compact {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		height: 2.75rem;
		min-width: 0;
		overflow: hidden;
	}
	
	.duration-display-compact span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.multiday-controls {
		display: flex;
		align-items: stretch;
		gap: 0.5rem;
		height: 2.75rem;
	}
	
	.multiday-value {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0.75rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		height: 2.75rem;
		flex: 1;
		min-width: 6rem;
		max-width: 6rem;
		overflow: hidden;
	}
	
	.multiday-value span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.multiday-btn {
		height: 2.75rem;
		width: 2.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
	}
	
	.multiday-btn:hover:not(:disabled) {
		border-color: var(--color-primary-300);
		background: var(--color-primary-50);
	}
	
	.multiday-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	
	@media (max-width: 768px) {
		.duration-display-compact {
			padding: 0.625rem 0.875rem;
			height: 3rem;
		}
		
		.multiday-controls {
			gap: 0.375rem;
			height: 3rem;
		}
		
		.multiday-value {
			padding: 0.625rem 0.875rem;
			height: 3rem;
			min-width: 7rem;
			max-width: 7rem;
		}
	}
	
	/* Stack vertically on very narrow screens (iPhone SE, etc.) */
	@media (max-width: 400px) {
		.duration-multiday-grid {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
		
		.multiday-value {
			min-width: 0;
			max-width: none;
			flex: 1;
		}
	}

	/* Tour Selection Styles */
	.booking-step {
		padding: 1.5rem;
		border-radius: 0.75rem;
		background: var(--bg-primary);
		border: 2px solid var(--color-primary-500);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
		position: relative;
		transition: all 0.2s ease;
	}
	
	.step-number {
		position: absolute;
		top: 1.5rem;
		left: -0.75rem;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--color-primary-600);
		color: white;
		border: 2px solid var(--color-primary-600);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.875rem;
		z-index: 10;
	}

	.drawer-custom-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.4;
	}

	.drawer-title-with-dot {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		width: 100%;
	}

	.drawer-title-dot {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.drawer-change-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s;
		flex-shrink: 0;
		margin-left: auto;
	}

	.drawer-change-btn:hover {
		color: var(--color-primary-600);
		border-color: var(--color-primary-300);
		background: var(--color-primary-50);
	}

	.tour-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		padding-left: 0.75rem;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		width: 100%;
		position: relative;
		overflow: hidden;
	}

	.tour-card:hover {
		border-color: var(--color-primary-300);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.tour-color-bar {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		border-radius: 0.75rem 0 0 0.75rem;
	}

	.tour-image-wrapper {
		position: relative;
		width: 4.5rem;
		height: 4.5rem;
		flex-shrink: 0;
		border-radius: 0.5rem;
		overflow: hidden;
		background: var(--bg-secondary);
	}

	.tour-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.tour-image-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-secondary);
	}

	.status-badge {
		position: absolute;
		bottom: 0.25rem;
		left: 0.25rem;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		font-size: 0.625rem;
		font-weight: 600;
		border-radius: 9999px;
	}

	.status-badge.active {
		background: var(--color-success-100);
		color: var(--color-success-700);
		border: 1px solid var(--color-success-200);
	}

	.status-badge.draft {
		background: var(--bg-secondary);
		color: var(--text-secondary);
		border: 1px solid var(--border-primary);
	}

	.tour-info {
		flex: 1;
		min-width: 0;
	}

	.tour-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
		line-height: 1.25;
	}

	.tour-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.meta-item :global(svg) {
		flex-shrink: 0;
	}

	/* Mobile tour selection styles */
	@media (max-width: 768px) {
		.booking-step {
			padding: 1rem;
			margin-bottom: 0.75rem;
		}

		.step-number {
			left: -0.5rem;
			width: 1.75rem;
			height: 1.75rem;
			font-size: 0.75rem;
			top: 1rem;
		}

		.drawer-custom-title {
			font-size: 1rem;
		}

		.drawer-title-dot {
			width: 0.625rem;
			height: 0.625rem;
		}

		.drawer-change-btn {
			padding: 0.25rem 0.5rem;
			font-size: 0.6875rem;
		}

		.tour-card {
			padding: 0.75rem;
			padding-left: 0.5rem;
		}

		.tour-image-wrapper {
			width: 3.5rem;
			height: 3.5rem;
		}

		.tour-name {
			font-size: 0.875rem;
		}

		.meta-item {
			font-size: 0.75rem;
		}
	}
</style>


<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { formatDuration, getImageUrl } from '$lib/utils/tour-helpers-client.js';
	import Drawer from '$lib/components/Drawer.svelte';
	import DurationInput from '$lib/components/DurationInput.svelte';
	import MiniMonthCalendar from '$lib/components/MiniMonthCalendar.svelte';
	import { slide } from 'svelte/transition';
	
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
		initialDate?: string;
		onClose: () => void;
		onSuccess?: () => void;
	}

	let {
		isOpen = $bindable(false),
		initialDate,
		onClose,
		onSuccess
	}: Props = $props();

	const queryClient = useQueryClient();

	// Step management
	let currentStep = $state<1 | 2>(1);
	let selectedTourId = $state<string>('');
	
	// Search state for tour selection
	let searchQuery = $state('');

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

	// Fetch user tours for step 1
	const toursQuery = $derived(createQuery({
		queryKey: queryKeys.userTours,
		queryFn: queryFunctions.fetchUserTours,
		staleTime: 5 * 60 * 1000,
		enabled: isOpen && currentStep === 1
	}));

	const tours = $derived(($toursQuery.data as any[]) || []);

	// Filter tours
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
		
		// Active tours first
		filtered.sort((a, b) => {
			if (a.status === 'active' && b.status !== 'active') return -1;
			if (a.status !== 'active' && b.status === 'active') return 1;
			return a.name.localeCompare(b.name);
		});
		
		return filtered;
	});

	// Fetch tour data for step 2
	const tourQuery = $derived(createQuery({
		queryKey: selectedTourId ? queryKeys.tourDetails(selectedTourId) : ['tourDetails', 'none'],
		queryFn: () => queryFunctions.fetchTourDetails(selectedTourId),
		staleTime: 5 * 60 * 1000,
		enabled: isOpen && currentStep === 2 && !!selectedTourId
	}));

	const tour = $derived($tourQuery.data?.tour || null);

	// Fetch existing schedule to check for conflicts
	const scheduleQuery = $derived(createQuery({
		queryKey: selectedTourId ? queryKeys.tourSchedule(selectedTourId) : ['tourSchedule', 'none'],
		queryFn: () => queryFunctions.fetchTourSchedule(selectedTourId),
		staleTime: 30 * 1000,
		enabled: isOpen && currentStep === 2 && !!selectedTourId
	}));

	const existingSlots = $derived($scheduleQuery.data?.timeSlots || []);

	// Form state - with smart defaults
	let selectedDate = $state('');
	let startTime = $state('10:00');
	
	// Track tour ID to detect when tour changes
	let lastTourId = $state<string | null>(null);
	
	// Track if user has manually changed values
	let userChangedDuration = $state(false);
	let userChangedCapacity = $state(false);
	let userChangedMinCapacity = $state(false);
	
	// Initialize with derived values from tour, or defaults
	let duration = $state(120);
	let capacity = $state(10);
	let minCapacity = $state(1);
	
	// Recurring options
	let recurring = $state(false);
	let recurringType = $state<'daily' | 'weekly' | 'monthly'>('weekly');
	let recurringEndDate = $state('');
	
	// State
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	
	// UI state
	let showCapacitySettings = $state(false);
	
	// Hidden time input ref for triggering browser picker
	let timeInputRef = $state<HTMLInputElement | null>(null);
	let dateInputRef = $state<HTMLInputElement | null>(null);

	// Initialize date when drawer opens
	$effect(() => {
		if (isOpen) {
			selectedDate = initialDate || new Date().toISOString().split('T')[0];
			// Reset form state
			error = null;
			successMessage = null;
			userChangedDuration = false;
			userChangedCapacity = false;
			userChangedMinCapacity = false;
			recurring = false;
			recurringEndDate = '';
			showCapacitySettings = false;
			currentStep = 1;
			selectedTourId = '';
			searchQuery = '';
		}
	});

	// Calculate end time based on start time and duration
	let endTimeCalculation = $derived.by(() => {
		const [hours, minutes] = startTime.split(':').map(Number);
		const totalMinutes = hours * 60 + minutes + duration;
		
		const endHours = Math.floor(totalMinutes / 60);
		const endMinutes = totalMinutes % 60;
		
		let endDate = '';
		let endTime = '';
		
		if (endHours >= 24) {
			// Multi-day slot
			const daysToAdd = Math.floor(endHours / 24);
			const endDateObj = new Date(selectedDate);
			endDateObj.setDate(endDateObj.getDate() + daysToAdd);
			endDate = endDateObj.toISOString().split('T')[0];
			endTime = `${String(endHours % 24).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
		} else {
			// Same day
			endDate = selectedDate;
			endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
		}
		
		return { endDate, endTime };
	});

	// Calculate existing slots map (for blue dots)
	let existingSlotsMap = $derived.by(() => {
		const map = new Map<string, number>();
		
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

	// Calculate preview dates (for yellow dots)
	let previewDatesSet = $derived.by(() => {
		const set = new Set<string>();
		
		if (selectedDate && endTimeCalculation.endDate) {
			const [startYear, startMonth, startDay] = selectedDate.split('-').map(Number);
			const [endYear, endMonth, endDay] = endTimeCalculation.endDate.split('-').map(Number);
			
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
			const start = new Date(selectedDate);
			start.setDate(start.getDate() + 28);
			recurringEndDate = start.toISOString().split('T')[0];
		}
	});

	// Calculate preview of slots
	let slotsPreview = $derived.by(() => {
		if (!recurring) return [{ date: selectedDate, startTime, endTime: endTimeCalculation.endTime }];
		
		const slots = [];
		const start = new Date(selectedDate);
		const end = new Date(recurringEndDate);
		const current = new Date(start);
		
		while (current <= end) {
			slots.push({
				date: current.toISOString().split('T')[0],
				startTime,
				endTime: endTimeCalculation.endTime
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

	// Check for conflicts with existing slots
	let conflictInfo = $derived.by(() => {
		const conflicts: any[] = [];
		
		slotsPreview.forEach(preview => {
			const previewStart = new Date(`${preview.date}T${preview.startTime}:00`);
			const previewEnd = new Date(`${endTimeCalculation.endDate}T${preview.endTime}:00`);
			
			existingSlots.forEach((slot: any) => {
				const slotStart = new Date(slot.startTime);
				const slotEnd = new Date(slot.endTime);
				
				if (previewStart < slotEnd && previewEnd > slotStart) {
					conflicts.push({
						date: preview.date,
						existingSlot: slot
					});
				}
			});
		});
		
		return {
			hasConflicts: conflicts.length > 0,
			conflictCount: conflicts.length,
			totalSlots: slotsPreview.length
		};
	});

	// Submit handler
	async function handleSubmit() {
		if (!tour) return;
		
		isSubmitting = true;
		error = null;
		
		try {
			const { endDate, endTime } = endTimeCalculation;
			
			const payload = {
				startTime: `${selectedDate}T${startTime}:00`,
				endTime: `${endDate}T${endTime}:00`,
				capacity,
				minCapacity,
				status: 'available',
				notes: '',
				recurring,
				recurringType: recurring ? recurringType : undefined,
				recurringEnd: recurring ? recurringEndDate : undefined
			};
			
			const response = await fetch(`/api/tours/${selectedTourId}/schedule`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			
			if (response.ok) {
				await queryClient.invalidateQueries({
					queryKey: queryKeys.tourSchedule(selectedTourId)
				});
				
				// Show success message
				const slotCount = slotsPreview.length;
				successMessage = `Successfully created ${slotCount} time slot${slotCount > 1 ? 's' : ''}!`;
				error = null;
				
				onSuccess?.();
				
				// Close drawer after brief delay
				setTimeout(() => {
					isOpen = false;
					onClose();
				}, 1500);
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to create time slots';
			}
		} catch (err) {
			console.error('Error creating time slots:', err);
			error = 'Failed to create time slots. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	// Initialize values when tour loads
	$effect(() => {
		if (tour && tour.id !== lastTourId) {
			if (!userChangedDuration) {
				duration = tour.duration || 120;
			}
			if (!userChangedCapacity) {
				capacity = tour.maxCapacity || tour.capacity || 10;
			}
			if (!userChangedMinCapacity) {
				minCapacity = tour.minCapacity || 1;
			}
			
			lastTourId = tour.id;
		}
	});

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
</script>

<Drawer
	bind:isOpen
	onClose={onClose}
	class="add-slots-flow"
>
	{#snippet titleSlot()}
		{#if currentStep === 1}
			<h2 class="drawer-custom-title">Select Tour</h2>
		{:else if currentStep === 2 && tour}
			<div class="drawer-title-with-dot">
				{#if tourColor}
					<div class="drawer-title-dot" style="background-color: {tourColor};"></div>
				{/if}
				<h2 class="drawer-custom-title">{tour.name}</h2>
				<button 
					type="button"
					onclick={goBackToTourSelection}
					class="drawer-change-btn"
				>
					<ArrowLeft class="h-3.5 w-3.5" />
					Change
				</button>
			</div>
		{/if}
	{/snippet}

	<!-- Step 1: Tour Selection -->
	{#if currentStep === 1}
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
						{@const tourColor = getTourCalendarColor(tourItem.id, tourItem.name)}
						<button
							onclick={() => selectTour(tourItem.id)}
							class="tour-card"
							type="button"
						>
							<div class="tour-color-bar" style="background-color: {tourColor};"></div>
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
	{:else if currentStep === 2}
		<!-- Step 2: Configure Time Slots -->
		{#if $tourQuery.isLoading}
			<div class="flex items-center justify-center py-12">
				<Loader2 class="h-8 w-8 animate-spin" style="color: var(--text-tertiary);" />
			</div>
		{:else if tour}
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
				{#if successMessage}
					<div class="success-banner">
						<CheckCircle class="h-5 w-5" />
						<p>{successMessage}</p>
					</div>
				{/if}

				{#if error}
					<div class="error-banner">
						<p>{error}</p>
					</div>
				{/if}

				<div class="form-section">
					<div class="space-y-5">
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
									<div>
										<div class="text-xs font-medium mb-1.5" style="color: var(--text-secondary);">Start Time</div>
										<button
											type="button"
											onclick={() => timeInputRef?.showPicker?.()}
											class="time-picker-button"
										>
											<Clock class="h-5 w-5" style="color: var(--text-primary);" />
											<span class="time-display">{startTime}</span>
										</button>
										<input
											bind:this={timeInputRef}
											type="time"
											bind:value={startTime}
											class="hidden-time-input"
										/>
									</div>
									
									<div>
										<div class="text-xs font-medium mb-1.5" style="color: var(--text-secondary);">End Time</div>
										<div class="time-picker-button time-picker-readonly">
											<Clock class="h-5 w-5" style="color: var(--text-tertiary);" />
											<span class="time-display">{endTimeCalculation.endTime}</span>
										</div>
										{#if endTimeCalculation.endDate !== selectedDate}
											<div class="text-xs mt-1" style="color: var(--text-secondary);">
												{(() => {
													const [startY, startM, startD] = selectedDate.split('-').map(Number);
													const [endY, endM, endD] = endTimeCalculation.endDate.split('-').map(Number);
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

								<!-- Duration -->
								<div>
									<div class="flex items-center justify-between mb-1.5">
										<div class="text-xs font-medium" style="color: var(--text-secondary);">Duration</div>
										{#if tour && duration !== tour.duration}
											<button
												type="button"
												onclick={() => { duration = tour.duration; userChangedDuration = false; }}
												class="text-xs underline"
												style="color: var(--color-primary-600);"
											>
												Reset
											</button>
										{/if}
									</div>
									<DurationInput
										bind:value={duration}
										error={false}
										onblur={() => {
											if (tour && duration !== tour.duration) {
												userChangedDuration = true;
											}
										}}
									/>
								</div>

								<!-- Schedule Preview -->
								<div class="schedule-preview">
									<div class="text-xs font-medium mb-2" style="color: var(--text-secondary);">Schedule Preview</div>
									<div class="space-y-2">
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
										
										<div class="preview-row">
											<Clock class="h-4 w-4" style="color: var(--text-tertiary);" />
											<div class="text-sm" style="color: var(--text-primary);">
												{startTime} - {endTimeCalculation.endTime}
												{#if endTimeCalculation.endDate !== selectedDate}
													<div class="text-xs" style="color: var(--text-secondary);">
														Ends {(() => {
															const [y, m, d] = endTimeCalculation.endDate.split('-').map(Number);
															return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
														})()}
														• Multi-day tour
													</div>
												{/if}
											</div>
										</div>
										
										<div class="preview-row">
											<Users class="h-4 w-4" style="color: var(--text-tertiary);" />
											<div class="text-sm" style="color: var(--text-primary);">
												{capacity} spot{capacity !== 1 ? 's' : ''} available
												{#if minCapacity > 1}
													<span class="text-xs" style="color: var(--text-secondary);"> • Min {minCapacity} required</span>
												{/if}
											</div>
										</div>
										
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

						<!-- Recurring Settings -->
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
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

										<div>
											<div class="text-xs font-medium mb-1.5" style="color: var(--text-secondary);">
												Repeat Until
											</div>
											<button
												type="button"
												onclick={() => dateInputRef?.showPicker?.()}
												class="date-picker-button"
											>
												<Calendar class="h-4 w-4" style="color: var(--text-primary);" />
												<span class="date-display">
													{#if recurringEndDate}
														{(() => {
															const [y, m, d] = recurringEndDate.split('-').map(Number);
															return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
														})()}
													{:else}
														Select date
													{/if}
												</span>
											</button>
											<input
												bind:this={dateInputRef}
												id="recurring-end-date"
												type="date"
												bind:value={recurringEndDate}
												min={selectedDate}
												class="hidden-time-input"
												required
											/>
										</div>
									</div>
									
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

						<!-- Capacity Settings -->
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
										<div>
											<label for="slot-min-capacity" class="text-xs font-medium mb-1.5 block" style="color: var(--text-secondary);">
												Minimum Required <span style="color: var(--text-tertiary);">(optional)</span>
											</label>
											<div class="flex items-center gap-2">
												<button 
													type="button" 
													onclick={() => { minCapacity = Math.max(1, minCapacity - 1); userChangedMinCapacity = true; }} 
													class="adjust-btn-compact"
													disabled={minCapacity <= 1}
												>
													<Minus class="h-4 w-4" />
												</button>
												<input
													id="slot-min-capacity"
													type="number"
													bind:value={minCapacity}
													oninput={() => userChangedMinCapacity = true}
													min="1"
													max={capacity}
													class="form-input text-center font-semibold flex-1"
												/>
												<button 
													type="button" 
													onclick={() => { minCapacity = Math.min(capacity, minCapacity + 1); userChangedMinCapacity = true; }} 
													class="adjust-btn-compact"
													disabled={minCapacity >= capacity}
												>
													<Plus class="h-4 w-4" />
												</button>
											</div>
										</div>

										<div>
											<label for="slot-capacity" class="text-xs font-medium mb-1.5 block" style="color: var(--text-secondary);">
												Available Spots
											</label>
											<div class="flex items-center gap-2">
												<button 
													type="button" 
													onclick={() => { capacity = Math.max(1, capacity - 1); userChangedCapacity = true; }} 
													class="adjust-btn-compact"
												>
													<Minus class="h-4 w-4" />
												</button>
												<input
													id="slot-capacity"
													type="number"
													bind:value={capacity}
													oninput={() => userChangedCapacity = true}
													min="1"
													max={tour?.maxCapacity || 100}
													class="form-input text-center font-semibold flex-1"
												/>
												<button 
													type="button" 
													onclick={() => { capacity = Math.min(tour?.maxCapacity || 100, capacity + 1); userChangedCapacity = true; }} 
													class="adjust-btn-compact"
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

				<!-- Overlap Warning -->
				{#if conflictInfo.hasConflicts}
					<div class="overlap-warning">
						<Info class="h-4 w-4 flex-shrink-0" />
						<div class="flex-1">
							<div class="font-medium text-sm" style="color: var(--color-warning-900);">
								{conflictInfo.conflictCount} slot{conflictInfo.conflictCount !== 1 ? 's' : ''} overlap{conflictInfo.conflictCount === 1 ? 's' : ''} with existing time slots
							</div>
							<div class="text-xs mt-0.5" style="color: var(--color-warning-700);">
								This is allowed if you're running multiple groups simultaneously
							</div>
						</div>
					</div>
				{/if}

				<!-- Submit Buttons -->
				<div class="flex flex-col sm:flex-row gap-3 pt-2">
					<button
						type="button"
						onclick={() => { isOpen = false; onClose(); }}
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
		{:else}
			<div class="text-center py-12">
				<p style="color: var(--text-secondary);">Tour not found</p>
			</div>
		{/if}
	{/if}
</Drawer>

<style>
	/* Booking Step Pattern (matching booking flow) */
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

	/* Custom drawer title styles */
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

	/* Tour cards in selection */
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

	/* Form styles */
	.success-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-success-50);
		border: 1px solid var(--color-success-200);
		border-radius: 0.5rem;
		color: var(--color-success-700);
	}

	.success-banner p {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.error-banner {
		padding: 1rem;
		background: var(--color-danger-50);
		border: 1px solid var(--color-danger-200);
		border-radius: 0.5rem;
		color: var(--color-danger-600);
	}

	.error-banner p {
		margin: 0;
		font-size: 0.875rem;
	}

	.overlap-warning {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-warning-50);
		border: 1px solid var(--color-warning-200);
		border-radius: 0.5rem;
	}

	.form-section {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.form-section :global(.calendar-container--mini) {
		max-width: 100%;
		width: 100%;
	}

	.recurring-type-btn {
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.15s;
		text-align: center;
	}

	.recurring-type-btn:hover {
		border-color: var(--color-primary-300);
	}

	.recurring-type-btn.active {
		background: var(--color-primary-500);
		border-color: var(--color-primary-500);
		color: white;
	}

	.date-picker-button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		cursor: pointer;
		transition: all 0.15s;
	}

	.date-picker-button:hover {
		border-color: var(--color-primary-300);
		background: var(--color-primary-50);
	}

	.date-display {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.adjust-btn-compact {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.adjust-btn-compact:hover:not(:disabled) {
		border-color: var(--color-primary-500);
		background: var(--color-primary-50);
	}

	.adjust-btn-compact:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.time-picker-button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		cursor: pointer;
		transition: all 0.15s;
	}

	.time-picker-button:hover {
		border-color: var(--color-primary-300);
		background: var(--color-primary-50);
	}

	.time-picker-readonly {
		cursor: default;
		background: var(--bg-secondary);
		opacity: 0.8;
	}

	.time-picker-readonly:hover {
		border-color: var(--border-primary);
		background: var(--bg-secondary);
	}

	.time-display {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.hidden-time-input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
		width: 0;
		height: 0;
	}

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

	/* Mobile optimizations */
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

		.form-section {
			padding: 1rem;
		}

		.time-display {
			font-size: 1.125rem;
		}

		.capacity-toggle {
			padding: 0.75rem;
		}

		.capacity-controls {
			padding: 0.75rem;
		}
	}

	/* Desktop: Match AddSlotsDrawer width (56rem / 4xl) */
	@media (min-width: 768px) {
		:global(.add-slots-flow) {
			max-width: 56rem !important;
		}
	}
</style>


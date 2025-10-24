<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';
	import Drawer from '$lib/components/Drawer.svelte';
	import MiniMonthCalendar from '$lib/components/MiniMonthCalendar.svelte';
	import NativeDatePicker from '$lib/components/NativeDatePicker.svelte';
	import NativeTimePicker from '$lib/components/NativeTimePicker.svelte';
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

	interface Props {
		isOpen: boolean;
		tourId: string;
		initialDate?: string;
		onClose: () => void;
		onSuccess?: () => void;
	}

	let {
		isOpen = $bindable(false),
		tourId,
		initialDate,
		onClose,
		onSuccess
	}: Props = $props();

	const queryClient = useQueryClient();

	// Fetch tour data - use $derived to make queries reactive to props
	const tourQuery = $derived(createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 5 * 60 * 1000,
		enabled: isOpen && !!tourId
	}));

	const tour = $derived($tourQuery.data?.tour || null);

	// Fetch existing schedule to check for conflicts
	const scheduleQuery = $derived(createQuery({
		queryKey: queryKeys.tourSchedule(tourId),
		queryFn: () => queryFunctions.fetchTourSchedule(tourId),
		staleTime: 30 * 1000,
		enabled: isOpen && !!tourId
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
			const endDateObj = new Date(selectedDate);
			endDateObj.setDate(endDateObj.getDate() + daysToAdd);
			return endDateObj.toISOString().split('T')[0];
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
			const start = new Date(selectedDate);
			start.setDate(start.getDate() + 28); // Default 4 weeks
			recurringEndDate = start.toISOString().split('T')[0];
		}
	});

	// Calculate preview of slots
	let slotsPreview = $derived.by(() => {
		if (!recurring) return [{ date: selectedDate, startTime, endTime }];
		
		const slots = [];
		const start = new Date(selectedDate);
		const end = new Date(recurringEndDate);
		const current = new Date(start);
		
		while (current <= end) {
			slots.push({
				date: current.toISOString().split('T')[0],
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

	// Check for conflicts with existing slots (soft warning, doesn't block)
	let conflictInfo = $derived.by(() => {
		const conflicts: any[] = [];
		
		slotsPreview.forEach(preview => {
			const previewStart = new Date(`${preview.date}T${preview.startTime}:00`);
			const previewEnd = new Date(`${endDateCalculation}T${preview.endTime}:00`);
			
			existingSlots.forEach((slot: any) => {
				const slotStart = new Date(slot.startTime);
				const slotEnd = new Date(slot.endTime);
				
				// Check for overlap
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
			
			const response = await fetch(`/api/tours/${tourId}/schedule`, {
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
					queryKey: queryKeys.tourSchedule(tourId)
				});
				
				// Call success callback
				onSuccess?.();
				
				// Close drawer after showing success briefly
				setTimeout(() => {
					showSuccess = false;
					isOpen = false;
					onClose();
				}, 1500);
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
	title="Add Time Slots"
	subtitle={tour?.name || ''}
	onClose={onClose}
	class="add-slots-drawer"
>
	{#if $tourQuery.isLoading}
		<div class="flex items-center justify-center py-12">
			<Loader2 class="h-8 w-8 animate-spin" style="color: var(--text-tertiary);" />
		</div>
	{:else if tour}
		<form bind:this={formContainerRef} onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
			{#if showSuccess}
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
											<NativeTimePicker
												bind:value={startTime}
												label="Start Time"
												required
											/>
										</div>
										
										<!-- End Time (Now Editable) -->
										<div>
											<NativeTimePicker
												bind:value={endTime}
												label="End Time"
												onchange={() => userChangedEndTime = true}
												required
											/>
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
										<NativeDatePicker
											bind:value={recurringEndDate}
											label="Repeat Until"
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
</Drawer>

<style>
	.success-banner {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 1rem;
		background: var(--color-success-50);
		border: 1px solid var(--color-success-200);
		border-radius: 0.5rem;
		color: var(--color-success-700);
		font-weight: 500;
		position: sticky;
		top: 0;
		z-index: 10;
		margin: -1rem -1rem 1rem -1rem;
		animation: slideIn 0.3s ease;
	}
	
	.success-banner :global(svg) {
		flex-shrink: 0;
		color: var(--color-success-600);
	}
	
	.success-banner p {
		margin: 0;
		font-size: 0.875rem;
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
		.success-banner,
		.error-banner {
			margin: 0 0 1rem 0;
			border-radius: 0.5rem;
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

	/* Overlap Warning */
	.overlap-warning {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-warning-50);
		border: 1px solid var(--color-warning-200);
		border-radius: 0.5rem;
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
		padding: 0.75rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.15s;
		text-align: center;
		min-height: 2.75rem;
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
			padding: 1rem 0.75rem;
			min-height: 3rem;
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
</style>


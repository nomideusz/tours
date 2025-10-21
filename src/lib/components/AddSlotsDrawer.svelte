<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';
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
	let formContainerRef = $state<HTMLFormElement>();
	
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
			userChangedDuration = false;
			userChangedCapacity = false;
			userChangedMinCapacity = false;
			recurring = false;
			recurringEndDate = '';
			showCapacitySettings = false;
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
		if (selectedDate && endTimeCalculation.endDate) {
			// Parse date strings directly to avoid timezone issues
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

	// Check for conflicts with existing slots (soft warning, doesn't block)
	let conflictInfo = $derived.by(() => {
		const conflicts: any[] = [];
		
		slotsPreview.forEach(preview => {
			const previewStart = new Date(`${preview.date}T${preview.startTime}:00`);
			const previewEnd = new Date(`${endTimeCalculation.endDate}T${preview.endTime}:00`);
			
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
			
			const response = await fetch(`/api/tours/${tourId}/schedule`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			
			if (response.ok) {
				// Invalidate schedule
				await queryClient.invalidateQueries({
					queryKey: queryKeys.tourSchedule(tourId)
				});
				
				// Call success callback
				onSuccess?.();
				
				// Close drawer
				isOpen = false;
				onClose();
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
			if (!userChangedDuration) {
				duration = tour.duration || 120;
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
											<div class="text-xs font-medium mb-1.5" style="color: var(--text-secondary);">Start Time</div>
											<div class="input-wrapper">
												<Clock class="h-5 w-5 input-icon" style="color: var(--text-primary);" />
												<input
													bind:this={timeInputRef}
													type="time"
													bind:value={startTime}
													class="time-picker-input"
													required
												/>
											</div>
										</div>
										
										<!-- End Time (Read-only) -->
										<div>
											<div class="text-xs font-medium mb-1.5" style="color: var(--text-secondary);">End Time</div>
											<div class="input-wrapper">
												<Clock class="h-5 w-5 input-icon" style="color: var(--text-primary);" />
												<input
													type="text"
													value={endTimeCalculation.endTime}
													readonly
													class="time-picker-input time-picker-readonly"
												/>
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
										</div>
										<div class="input-wrapper">
											<Calendar class="h-4 w-4 input-icon" style="color: var(--text-primary);" />
											<input
												bind:this={dateInputRef}
												id="recurring-end-date"
												type="date"
												bind:value={recurringEndDate}
												min={selectedDate}
												class="date-picker-input"
												required
											/>
										</div>
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

									<!-- Available Spots -->
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
</Drawer>

<style>
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
	
	/* Mobile error banner positioning */
	@media (max-width: 768px) {
		.error-banner {
			margin: 0 0 1rem 0;
			border-radius: 0.5rem;
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

	/* Date Picker Button (compact, matches recurring buttons) */
	/* Compact Number Controls */
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


	/* Readonly input styling */
	.time-picker-input.time-picker-readonly {
		cursor: default;
		background: var(--bg-secondary);
		opacity: 0.9;
		font-weight: 600;
	}

	.time-picker-input.time-picker-readonly:hover {
		border-color: var(--border-primary);
		background: var(--bg-secondary);
	}
	
	.time-picker-input.time-picker-readonly:focus {
		box-shadow: none;
		border-color: var(--border-primary);
	}

	/* Input wrapper with icon */
	.input-wrapper {
		position: relative;
		width: 100%;
	}
	
	.input-wrapper :global(.input-icon) {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		z-index: 1;
	}
	
	/* Time and date picker inputs styled as buttons */
	.time-picker-input,
	.date-picker-input {
		width: 100%;
		display: block;
		padding: 0.75rem 1rem 0.75rem 3rem;
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		cursor: pointer;
		transition: all 0.15s;
		font-family: var(--font-mono, monospace);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		/* Keep native functionality, don't use appearance: none */
		position: relative;
		z-index: 0;
	}
	
	.time-picker-input:hover,
	.date-picker-input:hover {
		border-color: var(--color-primary-300);
		background: var(--color-primary-50);
	}
	
	.time-picker-input:focus,
	.date-picker-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
	
	/* Hide browser's default calendar and clock picker icons but keep them functional */
	.time-picker-input::-webkit-calendar-picker-indicator,
	.date-picker-input::-webkit-calendar-picker-indicator {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
		z-index: 2;
	}
	
	/* For Firefox */
	.time-picker-input::-moz-calendar-picker-indicator,
	.date-picker-input::-moz-calendar-picker-indicator {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}
	
	/* Mobile-specific improvements */
	@media (max-width: 768px) {
		.time-picker-input,
		.date-picker-input {
			font-size: 1rem;
			padding: 1rem 1rem 1rem 3rem;
			min-height: 3rem;
		}
		
		.input-wrapper :global(.input-icon) {
			left: 1rem;
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
	}

	/* Desktop: Reduce modal width for better UX */
	@media (min-width: 768px) {
		:global(.add-slots-drawer) {
			max-width: 56rem !important; /* 896px (4xl) instead of 6xl */
		}
	}
</style>


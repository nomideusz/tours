<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toursApi, timeSlotsApi } from '$lib/pocketbase.js';
	import type { Tour, TimeSlot } from '$lib/types.js';
	import { validateTimeSlotForm, getFieldError, hasFieldError, type ValidationError } from '$lib/validation.js';

	let tour = $state<Tour | null>(null);
	let timeSlots = $state<TimeSlot[]>([]);
	let allTimeSlots = $state<TimeSlot[]>([]);
	let showAllTours = $state(false);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let showAddModal = $state(false);
	let currentMonth = $state(new Date());
	let isEditMode = $state(false);
	let editingSlotId = $state<string | null>(null);
	
	// Validation state
	let validationErrors = $state<ValidationError[]>([]);
	let hasValidated = $state(false);

	let tourId = $derived($page.params.id);

	// Reactive validation - validate on form data changes after first validation attempt
	$effect(() => {
		if (hasValidated) {
			const validation = validateTimeSlotForm(newSlotForm, tour?.capacity);
			validationErrors = validation.errors;
		}
	});

	// Form data for new time slot
	let newSlotForm = $state({
		startDate: '',
		startTime: '',
		endTime: '',
		availableSpots: 10,
		isRecurring: false,
		recurringPattern: 'weekly' as 'daily' | 'weekly' | 'monthly',
		recurringEnd: ''
	});

	onMount(async () => {
		if (tourId) {
			// Load tour first, then time slots sequentially to avoid auto-cancellation
			await loadTour();
			await loadTimeSlots();
			// Load all time slots after a small delay to prevent auto-cancellation
			setTimeout(() => loadAllTimeSlots(), 100);
		}
	});

	async function loadTour() {
		try {
			tour = await toursApi.getById(tourId);
			if (tour) {
				newSlotForm.availableSpots = tour.capacity;
			}
		} catch (err) {
			error = 'Failed to load tour details.';
			console.error('Error loading tour:', err);
		}
	}

	async function loadTimeSlots() {
		try {
			isLoading = true;
			error = null;
			timeSlots = await timeSlotsApi.getByTour(tourId);
		} catch (err) {
			// Handle auto-cancellation gracefully
			if (err instanceof Error && err.message.includes('autocancelled')) {
				console.log('Request was auto-cancelled, retrying...');
				// Retry after a short delay
				setTimeout(() => loadTimeSlots(), 200);
				return;
			}
			error = 'Failed to load time slots.';
			console.error('Error loading time slots:', err);
		} finally {
			isLoading = false;
		}
	}

	async function loadAllTimeSlots() {
		try {
			// Load all time slots from all tours
			allTimeSlots = await timeSlotsApi.getAll();
		} catch (err) {
			// Handle auto-cancellation gracefully for this optional feature
			if (err instanceof Error && err.message.includes('autocancelled')) {
				console.log('All time slots request was auto-cancelled, retrying...');
				// Retry after a longer delay since this is optional
				setTimeout(() => loadAllTimeSlots(), 500);
				return;
			}
			console.error('Error loading all time slots:', err);
			// Don't show error for this optional feature
		}
	}

	async function createTimeSlot() {
		hasValidated = true;
		
		// Run client-side validation
		const validation = validateTimeSlotForm(newSlotForm, tour?.capacity);
		validationErrors = validation.errors;
		
		// If validation fails, scroll to first error and return
		if (!validation.isValid) {
			const firstErrorField = validation.errors[0]?.field;
			if (firstErrorField) {
				const element = document.getElementById(firstErrorField);
				element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				element?.focus();
			}
			return;
		}

		try {
			isSubmitting = true;
			error = null;

			const startDateTime = new Date(`${newSlotForm.startDate}T${newSlotForm.startTime}`);
			const endDateTime = new Date(`${newSlotForm.startDate}T${newSlotForm.endTime}`);

			const timeSlotData = {
				tour: tourId,
				startTime: startDateTime.toISOString(),
				endTime: endDateTime.toISOString(),
				availableSpots: newSlotForm.availableSpots,
				bookedSpots: 0,
				status: 'available' as const,
				isRecurring: newSlotForm.isRecurring,
				recurringPattern: newSlotForm.isRecurring ? newSlotForm.recurringPattern : undefined,
				recurringEnd: newSlotForm.isRecurring && newSlotForm.recurringEnd ? 
					new Date(newSlotForm.recurringEnd).toISOString() : undefined
			};

			if (isEditMode && editingSlotId) {
				// Update existing time slot
				await timeSlotsApi.update(editingSlotId, timeSlotData);
			} else {
				// Create new time slot
				await timeSlotsApi.create(timeSlotData);
			}
			
			await loadTimeSlots();
			// Reload all time slots after a delay to avoid conflicts
			setTimeout(() => loadAllTimeSlots(), 300);
			
			// Reset form and edit mode
			newSlotForm = {
				startDate: '',
				startTime: '',
				endTime: '',
				availableSpots: tour?.capacity || 10,
				isRecurring: false,
				recurringPattern: 'weekly',
				recurringEnd: ''
			};
			
			// Reset validation state
			hasValidated = false;
			validationErrors = [];
			
			isEditMode = false;
			editingSlotId = null;
			showAddModal = false;
		} catch (err) {
			error = isEditMode ? 'Failed to update time slot. Please try again.' : 'Failed to create time slot. Please try again.';
			console.error('Error with time slot operation:', err);
		} finally {
			isSubmitting = false;
		}
	}

	async function deleteTimeSlot(slotId: string) {
		if (!confirm('Are you sure you want to delete this time slot?')) {
			return;
		}

		try {
			await timeSlotsApi.delete(slotId);
			await loadTimeSlots();
			// Reload all time slots after a delay to avoid conflicts
			setTimeout(() => loadAllTimeSlots(), 300);
		} catch (err) {
			error = 'Failed to delete time slot.';
			console.error('Error deleting time slot:', err);
		}
	}

	function formatDateTime(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status: TimeSlot['status']): string {
		switch (status) {
			case 'available':
				return 'bg-green-100 text-green-800';
			case 'full':
				return 'bg-yellow-100 text-yellow-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getTourColor(slot: TimeSlot): string {
		// If showing all tours, use different colors for different tours
		if (showAllTours && slot.tour !== tourId) {
			// Generate consistent color based on tour ID
			const colors = [
				'bg-blue-100 text-blue-800',
				'bg-purple-100 text-purple-800',
				'bg-pink-100 text-pink-800',
				'bg-indigo-100 text-indigo-800',
				'bg-cyan-100 text-cyan-800'
			];
			const hash = slot.tour.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
			return colors[hash % colors.length];
		}
		// Use status color for current tour
		return getStatusColor(slot.status);
	}

	// Calendar functionality
	function getDaysInMonth(date: Date): number {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	}

	function getFirstDayOfMonth(date: Date): number {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	}

	function previousMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
	}

	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
	}

	function getSlotsForDate(date: Date): TimeSlot[] {
		const dateStr = date.toDateString();
		const results: TimeSlot[] = [];
		
		// Choose which time slots to use based on toggle
		const slotsToCheck = showAllTours ? allTimeSlots : timeSlots;
		
		slotsToCheck.forEach(slot => {
			const slotDate = new Date(slot.startTime);
			
			// Add non-recurring slots if they match the date
			if (!slot.isRecurring && slotDate.toDateString() === dateStr) {
				results.push(slot);
				return;
			}
			
			// Handle recurring slots
			if (slot.isRecurring) {
				const originalDate = new Date(slot.startTime);
				const endDate = slot.recurringEnd ? new Date(slot.recurringEnd) : null;
				
				// Check if the date falls within the recurring pattern
				if (endDate && date > endDate) return;
				if (date < originalDate) return;
				
				let shouldInclude = false;
				
				switch (slot.recurringPattern) {
					case 'daily':
						shouldInclude = true;
						break;
					case 'weekly':
						shouldInclude = originalDate.getDay() === date.getDay();
						break;
					case 'monthly':
						shouldInclude = originalDate.getDate() === date.getDate();
						break;
				}
				
				if (shouldInclude) {
					// Create a virtual time slot for this date
					const virtualSlot: TimeSlot = {
						...slot,
						startTime: new Date(
							date.getFullYear(),
							date.getMonth(),
							date.getDate(),
							originalDate.getHours(),
							originalDate.getMinutes()
						).toISOString(),
						endTime: new Date(
							date.getFullYear(),
							date.getMonth(),
							date.getDate(),
							new Date(slot.endTime).getHours(),
							new Date(slot.endTime).getMinutes()
						).toISOString()
					};
					results.push(virtualSlot);
				}
			}
		});
		
		return results;
	}

	// Generate calendar grid
	let calendarGrid = $derived.by(() => {
		const daysInMonth = getDaysInMonth(currentMonth);
		const firstDay = getFirstDayOfMonth(currentMonth);
		const days: (null | { date: Date; slots: TimeSlot[] })[] = [];

		// Add empty cells for days before the first day of the month
		for (let i = 0; i < firstDay; i++) {
			days.push(null);
		}

		// Add days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
			const slots = getSlotsForDate(date);
			days.push({ date, slots });
		}

		return days;
	});

	// Group time slots by date for list view
	let groupedSlots = $derived.by(() => {
		const grouped = new Map<string, TimeSlot[]>();
		
		// Get current date range for list view (next 30 days)
		const today = new Date();
		const endDate = new Date();
		endDate.setDate(today.getDate() + 30);
		
		// Generate all time slots including recurring instances
		const currentDate = new Date(today);
		while (currentDate <= endDate) {
			const slotsForDate = getSlotsForDate(new Date(currentDate));
			if (slotsForDate.length > 0) {
				const dateStr = currentDate.toDateString();
				grouped.set(dateStr, slotsForDate);
			}
			currentDate.setDate(currentDate.getDate() + 1);
		}

		// Sort each group by time
		grouped.forEach(slots => {
			slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
		});

		// Convert to array and sort by date
		return Array.from(grouped.entries()).sort(([a], [b]) => 
			new Date(a).getTime() - new Date(b).getTime()
		);
	});

	let viewMode = $state<'calendar' | 'list'>('calendar');
	let selectedSlot = $state<TimeSlot | null>(null);
	let showSlotModal = $state(false);

	function openSlotDetails(slot: TimeSlot) {
		selectedSlot = slot;
		showSlotModal = true;
	}

	function closeSlotDetails() {
		selectedSlot = null;
		showSlotModal = false;
	}

	function openEditSlot(slot: TimeSlot) {
		// Populate form with existing slot data
		const startDate = new Date(slot.startTime);
		const endDate = new Date(slot.endTime);
		
		newSlotForm = {
			startDate: startDate.toISOString().split('T')[0],
			startTime: startDate.toTimeString().slice(0, 5),
			endTime: endDate.toTimeString().slice(0, 5),
			availableSpots: slot.availableSpots,
			isRecurring: slot.isRecurring,
			recurringPattern: slot.recurringPattern || 'weekly',
			recurringEnd: slot.recurringEnd ? new Date(slot.recurringEnd).toISOString().split('T')[0] : ''
		};
		
		isEditMode = true;
		editingSlotId = slot.id;
		showAddModal = true;
		closeSlotDetails();
	}

	function cancelEdit() {
		isEditMode = false;
		editingSlotId = null;
		// Reset form
		newSlotForm = {
			startDate: '',
			startTime: '',
			endTime: '',
			availableSpots: tour?.capacity || 10,
			isRecurring: false,
			recurringPattern: 'weekly',
			recurringEnd: ''
		};
		// Reset validation state
		hasValidated = false;
		validationErrors = [];
		showAddModal = false;
	}
</script>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-8">
		<button 
			onclick={() => goto(`/tours/${tourId}`)}
			class="button--secondary button--small"
			aria-label="Go back to tour details"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
		<div class="flex-1">
			<h1 class="text-3xl font-bold text-gray-900">
				{tour ? `${tour.name} - Schedule` : 'Tour Schedule'}
			</h1>
			<p class="text-gray-600 mt-1">Manage your tour availability and time slots</p>
		</div>
							<button
						onclick={() => {
							isEditMode = false;
							editingSlotId = null;
							hasValidated = false;
							validationErrors = [];
							showAddModal = true;
						}}
						class="button-primary button--gap"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						Add Time Slot
					</button>
	</div>

	{#if error}
		<div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
			<div class="flex">
				<div class="text-red-600">
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-red-800 font-medium">Error</p>
					<p class="text-red-700 text-sm">{error}</p>
				</div>
					</div>
	</div>
{/if}

<!-- Time Slot Details Modal -->
{#if showSlotModal && selectedSlot}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-semibold text-gray-900">Time Slot Details</h2>
					<button
						onclick={closeSlotDetails}
						class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
						aria-label="Close modal"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="space-y-4">
					<!-- Date and Time -->
					<div class="bg-gray-50 rounded-lg p-4">
						<h3 class="font-medium text-gray-900 mb-2">Schedule</h3>
						<div class="text-sm text-gray-600">
							<div class="flex items-center gap-2 mb-1">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h6a2 2 0 012 2v4m1 0h-9m9 0v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h4" />
								</svg>
								{formatDateTime(selectedSlot.startTime)} - {new Date(selectedSlot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
							</div>
							{#if selectedSlot.isRecurring}
								<div class="flex items-center gap-2 text-blue-600">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
									</svg>
									Recurring {selectedSlot.recurringPattern}
									{#if selectedSlot.recurringEnd}
										until {new Date(selectedSlot.recurringEnd).toLocaleDateString('en-US')}
									{/if}
								</div>
							{/if}
						</div>
					</div>

					<!-- Availability -->
					<div class="bg-gray-50 rounded-lg p-4">
						<h3 class="font-medium text-gray-900 mb-2">Availability</h3>
						<div class="flex items-center justify-between">
							<div class="text-sm text-gray-600">
								<div class="mb-1">Booked: {selectedSlot.bookedSpots} / {selectedSlot.availableSpots}</div>
								<div class="text-xs">
									{selectedSlot.availableSpots - selectedSlot.bookedSpots} spots remaining
								</div>
							</div>
							<div class="flex items-center">
								<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getStatusColor(selectedSlot.status)}">
									{selectedSlot.status.charAt(0).toUpperCase() + selectedSlot.status.slice(1)}
								</span>
							</div>
						</div>
						
						<!-- Progress Bar -->
						<div class="mt-3">
							<div class="bg-gray-200 rounded-full h-2">
								<div 
									class="h-2 rounded-full transition-all duration-300 {selectedSlot.status === 'full' ? 'bg-yellow-500' : selectedSlot.status === 'cancelled' ? 'bg-red-500' : 'bg-green-500'}"
									style="width: {(selectedSlot.bookedSpots / selectedSlot.availableSpots) * 100}%"
								></div>
							</div>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex justify-between items-center pt-4 border-t">
						<div class="text-xs text-gray-500">
							Created: {new Date(selectedSlot.created).toLocaleDateString('en-US')}
						</div>
						<div class="flex gap-2">
							<button
								onclick={() => selectedSlot && openEditSlot(selectedSlot)}
								class="button-secondary button--small"
							>
								Edit
							</button>
							<button
								onclick={() => {
									if (selectedSlot && confirm('Are you sure you want to delete this time slot?')) {
										deleteTimeSlot(selectedSlot.id);
										closeSlotDetails();
									}
								}}
								class="button--small px-3 py-1.5 text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="flex items-center gap-2 text-gray-600">
				<div class="form-spinner"></div>
				Loading schedule...
			</div>
		</div>
	{:else}
		<!-- View Toggle and Options -->
		<div class="mb-6 flex flex-col sm:flex-row items-center justify-center gap-4">
			<div class="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
				<button
					onclick={() => viewMode = 'calendar'}
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
				>
					Calendar View
				</button>
				<button
					onclick={() => viewMode = 'list'}
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
				>
					List View
				</button>
			</div>
			
			<!-- Show All Tours Toggle -->
			<div class="flex flex-col items-center gap-1">
				<label class="flex items-center cursor-pointer">
					<input
						type="checkbox"
						bind:checked={showAllTours}
						class="form-checkbox"
					/>
					<span class="ml-2 text-sm text-gray-700">Show all tours</span>
				</label>
				<!-- Reserve space for help text to prevent layout jumps -->
				<div class="h-4 flex items-center">
					<div class="text-xs text-gray-500 transition-opacity duration-200 {showAllTours ? 'opacity-100' : 'opacity-0'}">
						Other tours shown in different colors
					</div>
				</div>
			</div>
		</div>

		{#if viewMode === 'calendar'}
			<!-- Calendar View -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<!-- Calendar Header -->
				<div class="flex items-center justify-between mb-6">
					<button
						onclick={previousMonth}
						class="button--secondary button--small"
						aria-label="Previous month"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					
					<h2 class="text-xl font-semibold text-gray-900">
						{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
					</h2>
					
					<button
						onclick={nextMonth}
						class="button--secondary button--small"
						aria-label="Next month"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</div>

				<!-- Calendar Grid -->
				<div class="grid grid-cols-7 gap-1 mb-4">
					<!-- Day headers -->
					{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
						<div class="p-2 text-center text-sm font-medium text-gray-500 border-b">
							{day}
						</div>
					{/each}
					
					<!-- Calendar days -->
					{#each calendarGrid as cell}
						<div class="min-h-[120px] p-2 border border-gray-100 hover:bg-gray-50 transition-colors">
							{#if cell}
								<div class="text-sm font-medium text-gray-900 mb-2">
									{cell.date.getDate()}
								</div>
								{#if cell.slots.length > 0}
									<div class="space-y-1">
										{#each cell.slots.slice(0, 3) as slot}
											<button
												onclick={() => openSlotDetails(slot)}
												class="w-full text-left text-xs px-2 py-1.5 rounded {getTourColor(slot)} hover:opacity-80 transition-opacity cursor-pointer"
												title="Click to view details"
											>
												<div class="font-medium">
													{new Date(slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
												</div>
												<div class="text-xs opacity-90">
													{#if showAllTours && slot.tour !== tourId}
														{(slot as any).expand?.tour?.name || 'Other Tour'}
													{:else}
														{slot.bookedSpots}/{slot.availableSpots} spots
														{#if slot.isRecurring}
															<span class="inline-block w-1 h-1 rounded-full bg-current ml-1" title="Recurring event"></span>
														{/if}
													{/if}
												</div>
											</button>
										{/each}
										{#if cell.slots.length > 3}
											<button
												onclick={() => {
													// Show all slots for this date in a modal or expand view
													selectedSlot = cell.slots[0];
													showSlotModal = true;
												}}
												class="w-full text-xs text-gray-600 hover:text-gray-800 px-2 py-1 text-center"
											>
												+{cell.slots.length - 3} more events
											</button>
										{/if}
									</div>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<!-- List View -->
			<div class="space-y-6">
				{#if groupedSlots.length === 0}
					<div class="text-center py-12">
						<svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h6a2 2 0 012 2v4m1 0h-9m9 0v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h4" />
						</svg>
						<h3 class="text-lg font-semibold text-gray-900 mb-2">No time slots scheduled</h3>
						<p class="text-gray-600 mb-4">Create your first time slot to start receiving bookings</p>
						<button
							onclick={() => {
								isEditMode = false;
								editingSlotId = null;
								hasValidated = false;
								validationErrors = [];
								showAddModal = true;
							}}
							class="button-primary button--gap"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							Add First Time Slot
						</button>
					</div>
				{:else}
					{#each groupedSlots as [date, slots]}
						<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
							<h3 class="text-lg font-semibold text-gray-900 mb-4">
								{new Date(date).toLocaleDateString('en-US', { 
									weekday: 'long', 
									month: 'long', 
									day: 'numeric', 
									year: 'numeric' 
								})}
							</h3>
							
							<div class="space-y-3">
								{#each slots as slot}
									<div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
										<!-- Clickable time slot info -->
										<button
											onclick={() => openSlotDetails(slot)}
											class="flex items-center space-x-4 flex-1 text-left"
											title="Click to view details"
										>
											<div class="text-sm">
												<div class="font-medium text-gray-900">
													{formatDateTime(slot.startTime)} - {new Date(slot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
												</div>
												<div class="text-gray-500">
													{#if showAllTours && slot.tour !== tourId}
														{(slot as any).expand?.tour?.name || 'Other Tour'} • 
													{/if}
													{slot.bookedSpots}/{slot.availableSpots} booked
													{#if slot.isRecurring}
														• Recurring {slot.recurringPattern}
													{/if}
												</div>
											</div>
										</button>
										
										<div class="flex items-center space-x-3">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getTourColor(slot)}">
												{slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
											</span>
											
											{#if slot.tour === tourId}
												<button
													onclick={() => deleteTimeSlot(slot.id)}
													class="p-1 text-red-600 hover:text-red-800 transition-colors"
													title="Delete time slot"
													aria-label="Delete time slot"
												>
													<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
												</button>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	{/if}
</div>

<!-- Add Time Slot Modal -->
{#if showAddModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6">
				<div class="flex items-center justify-between mb-6">
					<div>
						<h2 class="text-xl font-semibold text-gray-900">
							{isEditMode ? 'Edit Time Slot' : 'Add Time Slot'}
						</h2>
						{#if tour}
							<p class="text-sm text-gray-600 mt-1">for "{tour.name}"</p>
						{/if}
					</div>
					<button
						onclick={() => showAddModal = false}
						class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
						aria-label="Close modal"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<form onsubmit={(e) => { e.preventDefault(); createTimeSlot(); }} class="space-y-4">
					<div>
						<label for="startDate" class="form-label">
							Date *
						</label>
						<input
							type="date"
							id="startDate"
							bind:value={newSlotForm.startDate}
							required
							min={new Date().toISOString().split('T')[0]}
							class="form-input {hasFieldError(validationErrors, 'startDate') ? 'error' : ''}"
						/>
						{#if getFieldError(validationErrors, 'startDate')}
							<p class="form-error">{getFieldError(validationErrors, 'startDate')}</p>
						{/if}
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="startTime" class="form-label">
								Start Time *
							</label>
							<input
								type="time"
								id="startTime"
								bind:value={newSlotForm.startTime}
								required
								class="form-input {hasFieldError(validationErrors, 'startTime') ? 'error' : ''}"
							/>
							{#if getFieldError(validationErrors, 'startTime')}
								<p class="form-error">{getFieldError(validationErrors, 'startTime')}</p>
							{/if}
						</div>

						<div>
							<label for="endTime" class="form-label">
								End Time *
							</label>
							<input
								type="time"
								id="endTime"
								bind:value={newSlotForm.endTime}
								required
								class="form-input {hasFieldError(validationErrors, 'endTime') ? 'error' : ''}"
							/>
							{#if getFieldError(validationErrors, 'endTime')}
								<p class="form-error">{getFieldError(validationErrors, 'endTime')}</p>
							{/if}
						</div>
					</div>

					<div>
						<label for="availableSpots" class="form-label">
							Available Spots *
						</label>
						<input
							type="number"
							id="availableSpots"
							bind:value={newSlotForm.availableSpots}
							min="1"
							max={tour?.capacity || 50}
							class="form-input {hasFieldError(validationErrors, 'availableSpots') ? 'error' : ''}"
						/>
						{#if getFieldError(validationErrors, 'availableSpots')}
							<p class="form-error">{getFieldError(validationErrors, 'availableSpots')}</p>
						{:else}
							<p class="text-xs text-gray-500 mt-1">Maximum: {tour?.capacity || 50} (tour capacity)</p>
						{/if}
					</div>

					<div>
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={newSlotForm.isRecurring}
								class="form-checkbox"
							/>
							<span class="ml-2 text-sm font-medium text-gray-700">Recurring schedule</span>
						</label>
					</div>

					{#if newSlotForm.isRecurring}
						<div class="space-y-4 pl-6 border-l-2" style="border-color: var(--color-primary-200);">
							<div>
								<label for="recurringPattern" class="form-label">
									Repeat
								</label>
								<select
									id="recurringPattern"
									bind:value={newSlotForm.recurringPattern}
									class="form-select {hasFieldError(validationErrors, 'recurringPattern') ? 'error' : ''}"
								>
									<option value="daily">Daily</option>
									<option value="weekly">Weekly</option>
									<option value="monthly">Monthly</option>
								</select>
								{#if getFieldError(validationErrors, 'recurringPattern')}
									<p class="form-error">{getFieldError(validationErrors, 'recurringPattern')}</p>
								{/if}
							</div>

							<div>
								<label for="recurringEnd" class="form-label">
									End Date
								</label>
								<input
									type="date"
									id="recurringEnd"
									bind:value={newSlotForm.recurringEnd}
									min={newSlotForm.startDate}
									class="form-input {hasFieldError(validationErrors, 'recurringEnd') ? 'error' : ''}"
								/>
								{#if getFieldError(validationErrors, 'recurringEnd')}
									<p class="form-error">{getFieldError(validationErrors, 'recurringEnd')}</p>
								{:else}
									<p class="text-xs text-gray-500 mt-1">Leave empty for no end date</p>
								{/if}
							</div>
						</div>
					{/if}

					<div class="flex justify-end space-x-3 pt-4">
						<button
							type="button"
							onclick={() => isEditMode ? cancelEdit() : (showAddModal = false)}
							disabled={isSubmitting}
							class="button-secondary"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							class="button-primary"
						>
							{#if isSubmitting}
								<div class="flex items-center gap-2">
									<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									{isEditMode ? 'Updating...' : 'Creating...'}
								</div>
							{:else}
								{isEditMode ? 'Update Time Slot' : 'Create Time Slot'}
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if} 
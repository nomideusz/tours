<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toursApi, timeSlotsApi } from '$lib/pocketbase.js';
	import type { Tour, TimeSlot } from '$lib/types.js';

	let tour = $state<Tour | null>(null);
	let timeSlots = $state<TimeSlot[]>([]);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let showAddModal = $state(false);
	let currentMonth = $state(new Date());

	let tourId = $derived($page.params.id);

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
			await Promise.all([loadTour(), loadTimeSlots()]);
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
			error = 'Failed to load time slots.';
			console.error('Error loading time slots:', err);
		} finally {
			isLoading = false;
		}
	}

	async function createTimeSlot() {
		if (!newSlotForm.startDate || !newSlotForm.startTime || !newSlotForm.endTime) {
			error = 'Please fill in all required fields.';
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

			await timeSlotsApi.create(timeSlotData);
			await loadTimeSlots();
			
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
			
			showAddModal = false;
		} catch (err) {
			error = 'Failed to create time slot. Please try again.';
			console.error('Error creating time slot:', err);
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
		return timeSlots.filter(slot => {
			const slotDate = new Date(slot.startTime);
			return slotDate.toDateString() === dateStr;
		});
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
		
		timeSlots.forEach(slot => {
			const date = new Date(slot.startTime).toDateString();
			if (!grouped.has(date)) {
				grouped.set(date, []);
			}
			grouped.get(date)!.push(slot);
		});

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
</script>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-8">
		<button 
			onclick={() => goto(`/tours/${tourId}`)}
			class="button--secondary button--small"
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
			onclick={() => showAddModal = true}
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

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="flex items-center gap-2 text-gray-600">
				<div class="form-spinner"></div>
				Loading schedule...
			</div>
		</div>
	{:else}
		<!-- View Toggle -->
		<div class="mb-6 flex justify-center">
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
		</div>

		{#if viewMode === 'calendar'}
			<!-- Calendar View -->
			<div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
				<!-- Calendar Header -->
				<div class="flex items-center justify-between mb-6">
					<button
						onclick={previousMonth}
						class="button--secondary button--small"
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
						<div class="min-h-[100px] p-1 border border-gray-100">
							{#if cell}
								<div class="text-sm font-medium text-gray-900 mb-1">
									{cell.date.getDate()}
								</div>
								{#if cell.slots.length > 0}
									<div class="space-y-1">
										{#each cell.slots.slice(0, 2) as slot}
											<div class="text-xs px-2 py-1 rounded {getStatusColor(slot.status)} truncate">
												{new Date(slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
											</div>
										{/each}
										{#if cell.slots.length > 2}
											<div class="text-xs text-gray-500 px-2">
												+{cell.slots.length - 2} more
											</div>
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
							onclick={() => showAddModal = true}
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
									<div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
										<div class="flex items-center space-x-4">
											<div class="text-sm">
												<div class="font-medium text-gray-900">
													{formatDateTime(slot.startTime)} - {new Date(slot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
												</div>
												<div class="text-gray-500">
													{slot.bookedSpots}/{slot.availableSpots} booked
													{#if slot.isRecurring}
														• Recurring {slot.recurringPattern}
													{/if}
												</div>
											</div>
										</div>
										
										<div class="flex items-center space-x-3">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(slot.status)}">
												{slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
											</span>
											
											<button
												onclick={() => deleteTimeSlot(slot.id)}
												class="p-1 text-red-600 hover:text-red-800 transition-colors"
												title="Delete time slot"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</button>
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
					<h2 class="text-xl font-semibold text-gray-900">Add Time Slot</h2>
					<button
						onclick={() => showAddModal = false}
						class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
							class="form-input"
						/>
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
								class="form-input"
							/>
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
								class="form-input"
							/>
						</div>
					</div>

					<div>
						<label for="availableSpots" class="form-label">
							Available Spots
						</label>
						<input
							type="number"
							id="availableSpots"
							bind:value={newSlotForm.availableSpots}
							min="1"
							max={tour?.capacity || 50}
							class="form-input"
						/>
						<p class="text-xs text-gray-500 mt-1">Maximum: {tour?.capacity || 50} (tour capacity)</p>
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
									class="form-select"
								>
									<option value="daily">Daily</option>
									<option value="weekly">Weekly</option>
									<option value="monthly">Monthly</option>
								</select>
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
									class="form-input"
								/>
								<p class="text-xs text-gray-500 mt-1">Leave empty for no end date</p>
							</div>
						</div>
					{/if}

					<div class="flex justify-end space-x-3 pt-4">
						<button
							type="button"
							onclick={() => showAddModal = false}
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
									Creating...
								</div>
							{:else}
								Create Time Slot
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if} 
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toursApi, timeSlotsApi, pb } from '$lib/pocketbase.js';
	import type { Tour, TimeSlot } from '$lib/types.js';
	import { validateTimeSlotForm, getFieldError, hasFieldError, type ValidationError } from '$lib/validation.js';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Plus from 'lucide-svelte/icons/plus';
	import Calendar from 'lucide-svelte/icons/calendar';
	import List from 'lucide-svelte/icons/list';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import X from 'lucide-svelte/icons/x';
	import Edit from 'lucide-svelte/icons/edit';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import CalendarDays from 'lucide-svelte/icons/calendar-days';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Eye from 'lucide-svelte/icons/eye';

	let tour = $state<Tour | null>(null);
	let timeSlots = $state<TimeSlot[]>([]);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let showAddModal = $state(false);
	let currentMonth = $state(new Date());
	let isEditMode = $state(false);
	let editingSlotId = $state<string | null>(null);
	let viewMode = $state<'calendar' | 'list'>('calendar');
	let selectedDate = $state<Date | null>(null);
	
	// Validation state
	let validationErrors = $state<ValidationError[]>([]);
	let hasValidated = $state(false);

	let tourId = $derived($page.params.id);

	// Stats
	let totalSlots = $derived(timeSlots.length);
	let upcomingSlots = $derived(timeSlots.filter(slot => new Date(slot.startTime) > new Date()).length);
	let totalCapacity = $derived(timeSlots.reduce((sum, slot) => sum + slot.availableSpots, 0));
	let bookedSpots = $derived(timeSlots.reduce((sum, slot) => sum + (slot.bookedSpots || 0), 0));

	// Reactive validation
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

	// Quick time slots
	const quickTimeSlots = [
		{ label: 'Morning', time: '09:00' },
		{ label: 'Late Morning', time: '11:00' },
		{ label: 'Afternoon', time: '14:00' },
		{ label: 'Late Afternoon', time: '16:00' },
		{ label: 'Evening', time: '18:00' }
	];

	// Common durations for quick selection
	const commonDurations = [
		{ label: '30 min', minutes: 30 },
		{ label: '1 hour', minutes: 60 },
		{ label: '1.5 hours', minutes: 90 },
		{ label: '2 hours', minutes: 120 },
		{ label: '3 hours', minutes: 180 },
		{ label: '4 hours', minutes: 240 }
	];

	onMount(async () => {
		if (tourId) {
			await loadTour();
			await loadTimeSlots();
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
		hasValidated = true;
		
		const validation = validateTimeSlotForm(newSlotForm, tour?.capacity);
		validationErrors = validation.errors;
		
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

			// Debug logging
			console.log('Creating time slot for tour ID:', tourId);
			console.log('Current tour object:', tour);
			console.log('Current user auth:', pb?.authStore?.record?.id);

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

			console.log('Time slot data being sent:', timeSlotData);

			if (isEditMode && editingSlotId) {
				await timeSlotsApi.update(editingSlotId, timeSlotData);
			} else {
				await timeSlotsApi.create(timeSlotData);
			}
			
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
			
			hasValidated = false;
			validationErrors = [];
			isEditMode = false;
			editingSlotId = null;
			showAddModal = false;
		} catch (err) {
			console.error('Error with time slot operation:', err);
			
			// Extract more specific error information
			let errorMessage = isEditMode ? 'Failed to update time slot.' : 'Failed to create time slot.';
			
			if (err && typeof err === 'object') {
				const errorObj = err as any;
				if (errorObj.response?.message) {
					errorMessage += ` ${errorObj.response.message}`;
				} else if (errorObj.message) {
					errorMessage += ` ${errorObj.message}`;
				}
				
				// Check for permission issues
				if (errorObj.status === 400 && errorObj.response?.message?.includes('create rule failure')) {
					errorMessage = `Permission denied: The tour (${tourId}) doesn't belong to your account, or doesn't exist.`;
				}
			}
			
			error = errorMessage;
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

	function formatTime(dateString: string): string {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status: TimeSlot['status']): string {
		switch (status) {
			case 'available':
				return 'bg-green-50 text-green-700 border-green-200';
			case 'full':
				return 'bg-yellow-50 text-yellow-700 border-yellow-200';
			case 'cancelled':
				return 'bg-red-50 text-red-700 border-red-200';
			default:
				return 'bg-gray-50 text-gray-700 border-gray-200';
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
		}).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
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
			const dateStr = new Date(slot.startTime).toDateString();
			if (!grouped.has(dateStr)) {
				grouped.set(dateStr, []);
			}
			grouped.get(dateStr)!.push(slot);
		});

		// Sort each group by time
		grouped.forEach(slots => {
			slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
		});

		// Convert to array and sort by date
		return Array.from(grouped.entries())
			.sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
			.filter(([dateStr]) => new Date(dateStr) >= new Date(new Date().toDateString()));
	});

	function openAddModal(date?: Date) {
		if (date) {
			selectedDate = date;
			newSlotForm.startDate = date.toISOString().split('T')[0];
		} else {
			// Default to tomorrow if no date selected
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			newSlotForm.startDate = tomorrow.toISOString().split('T')[0];
		}
		
		// Set smart defaults
		if (!newSlotForm.startTime) {
			newSlotForm.startTime = '09:00'; // Default to 9 AM
		}
		
		// Auto-calculate end time based on tour duration if not set
		if (!newSlotForm.endTime && tour && newSlotForm.startTime) {
			newSlotForm.endTime = calculateEndTime(newSlotForm.startTime, tour.duration);
		}
		
		// Set available spots to tour capacity
		if (tour) {
			newSlotForm.availableSpots = tour.capacity;
		}
		
		showAddModal = true;
	}

	function openEditSlot(slot: TimeSlot) {
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
	}

	function cancelEdit() {
		isEditMode = false;
		editingSlotId = null;
		selectedDate = null;
		newSlotForm = {
			startDate: '',
			startTime: '',
			endTime: '',
			availableSpots: tour?.capacity || 10,
			isRecurring: false,
			recurringPattern: 'weekly',
			recurringEnd: ''
		};
		hasValidated = false;
		validationErrors = [];
		showAddModal = false;
	}

	function isToday(date: Date): boolean {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	}

	function isPast(date: Date): boolean {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return date < today;
	}

	// Helper function to calculate end time
	function calculateEndTime(startTime: string, durationMinutes: number): string {
		const [hours, minutes] = startTime.split(':').map(Number);
		const startDate = new Date();
		startDate.setHours(hours, minutes, 0, 0);
		startDate.setMinutes(startDate.getMinutes() + durationMinutes);
		
		const endHours = startDate.getHours().toString().padStart(2, '0');
		const endMinutes = startDate.getMinutes().toString().padStart(2, '0');
		return `${endHours}:${endMinutes}`;
	}

	// Auto-update end time when start time changes
	function handleStartTimeChange() {
		if (tour && newSlotForm.startTime) {
			newSlotForm.endTime = calculateEndTime(newSlotForm.startTime, tour.duration);
		}
	}

	// Quick time selection
	function selectQuickTime(time: string) {
		newSlotForm.startTime = time;
		handleStartTimeChange();
	}

	// Set custom duration
	function setDuration(minutes: number) {
		if (newSlotForm.startTime) {
			newSlotForm.endTime = calculateEndTime(newSlotForm.startTime, minutes);
		}
	}

	// Get next 7 days for quick date selection
	function getNextSevenDays(): { date: Date; label: string }[] {
		const days = [];
		const today = new Date();
		
		for (let i = 1; i <= 7; i++) {
			const date = new Date(today);
			date.setDate(today.getDate() + i);
			
			let label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
			if (i === 1) label = `Tomorrow (${label})`;
			
			days.push({ date, label });
		}
		
		return days;
	}

	// Quick date selection
	function selectQuickDate(date: Date) {
		newSlotForm.startDate = date.toISOString().split('T')[0];
	}

	// Check if time slot conflicts with existing slots
	function hasConflict(): boolean {
		if (!newSlotForm.startDate || !newSlotForm.startTime || !newSlotForm.endTime) return false;
		
		const newStart = new Date(`${newSlotForm.startDate}T${newSlotForm.startTime}`);
		const newEnd = new Date(`${newSlotForm.startDate}T${newSlotForm.endTime}`);
		
		return timeSlots.some(slot => {
			// Skip if editing the same slot
			if (isEditMode && slot.id === editingSlotId) return false;
			
			const existingStart = new Date(slot.startTime);
			const existingEnd = new Date(slot.endTime);
			
			// Check if dates are the same
			if (existingStart.toDateString() !== newStart.toDateString()) return false;
			
			// Check for overlap
			return (newStart < existingEnd && newEnd > existingStart);
		});
	}
</script>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div class="flex items-center gap-4">
				<button 
					onclick={() => goto(`/tours/${tourId}`)}
					class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
					aria-label="Back to tour"
				>
					<ArrowLeft class="h-5 w-5 text-gray-600" />
				</button>
				<div>
					<nav class="flex items-center gap-2 text-sm text-gray-600 mb-2">
						<a href="/tours" class="hover:text-primary-600">Tours</a>
						<ChevronRight class="h-3 w-3" />
						<a href="/tours/{tourId}" class="hover:text-primary-600">{tour?.name || 'Tour'}</a>
						<ChevronRight class="h-3 w-3" />
						<span>Schedule</span>
					</nav>
					<h1 class="text-3xl font-bold text-gray-900">Schedule Management</h1>
					<p class="mt-1 text-gray-600">Set up availability for your tour</p>
				</div>
			</div>
			<button
				onclick={() => openAddModal()}
				class="button-primary button--gap"
			>
				<Plus class="h-5 w-5" />
				Add Time Slot
			</button>
		</div>
	</div>

	{#if error}
		<div class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
			<div class="flex gap-3">
				<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
				<div>
					<p class="font-medium text-red-800">Error</p>
					<p class="text-sm text-red-700 mt-1">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Quick Stats -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<div class="flex items-center justify-between mb-1">
				<span class="text-sm text-gray-600">Total Slots</span>
				<CalendarDays class="h-4 w-4 text-gray-400" />
			</div>
			<p class="text-2xl font-bold text-gray-900">{totalSlots}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<div class="flex items-center justify-between mb-1">
				<span class="text-sm text-gray-600">Upcoming</span>
				<TrendingUp class="h-4 w-4 text-green-500" />
			</div>
			<p class="text-2xl font-bold text-gray-900">{upcomingSlots}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<div class="flex items-center justify-between mb-1">
				<span class="text-sm text-gray-600">Total Capacity</span>
				<Users class="h-4 w-4 text-gray-400" />
			</div>
			<p class="text-2xl font-bold text-gray-900">{totalCapacity}</p>
		</div>
		<div class="bg-white rounded-xl border border-gray-200 p-4">
			<div class="flex items-center justify-between mb-1">
				<span class="text-sm text-gray-600">Booked</span>
				<UserCheck class="h-4 w-4 text-blue-500" />
			</div>
			<p class="text-2xl font-bold text-gray-900">{bookedSpots}</p>
		</div>
	</div>

	<!-- View Toggle -->
	<div class="bg-white rounded-xl border border-gray-200 p-1 inline-flex mb-6">
		<button
			onclick={() => viewMode = 'calendar'}
			class="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors {viewMode === 'calendar' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'}"
		>
			<Calendar class="h-4 w-4" />
			Calendar
		</button>
		<button
			onclick={() => viewMode = 'list'}
			class="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors {viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'}"
		>
			<List class="h-4 w-4" />
			List
		</button>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="flex items-center gap-2 text-gray-600">
				<div class="form-spinner"></div>
				Loading schedule...
			</div>
		</div>
	{:else if viewMode === 'calendar'}
		<!-- Calendar View -->
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<!-- Calendar Header -->
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-lg font-semibold text-gray-900">
					{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
				</h2>
				<div class="flex items-center gap-2">
					<button
						onclick={previousMonth}
						class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
					>
						<ChevronLeft class="h-5 w-5 text-gray-600" />
					</button>
					<button
						onclick={() => currentMonth = new Date()}
						class="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
					>
						Today
					</button>
					<button
						onclick={nextMonth}
						class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
					>
						<ChevronRight class="h-5 w-5 text-gray-600" />
					</button>
				</div>
			</div>

			<!-- Day Headers -->
			<div class="grid grid-cols-7 gap-1 mb-2">
				{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
					<div class="text-center text-sm font-medium text-gray-700 py-2">
						{day}
					</div>
				{/each}
			</div>

			<!-- Calendar Grid -->
			<div class="grid grid-cols-7 gap-1">
				{#each calendarGrid as cell}
					{#if cell}
						<div
							class="min-h-[100px] p-2 border rounded-lg transition-colors cursor-pointer
								{isToday(cell.date) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}
								{isPast(cell.date) ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}"
							onclick={() => !isPast(cell.date) && openAddModal(cell.date)}
						>
							<div class="text-sm font-medium mb-1 {isPast(cell.date) ? 'text-gray-400' : 'text-gray-900'}">
								{cell.date.getDate()}
							</div>
							{#if cell.slots.length > 0}
								<div class="space-y-1">
									{#each cell.slots.slice(0, 3) as slot}
										<button
											onclick={(e) => {
												e.stopPropagation();
												openEditSlot(slot);
											}}
											class="w-full text-left px-2 py-1 rounded text-xs {getStatusColor(slot.status)} hover:opacity-80 transition-opacity"
										>
											{formatTime(slot.startTime)}
											<span class="font-medium ml-1">{slot.availableSpots} left</span>
										</button>
									{/each}
									{#if cell.slots.length > 3}
										<div class="text-xs text-gray-500 text-center">
											+{cell.slots.length - 3} more
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{:else}
						<div></div>
					{/if}
				{/each}
			</div>
		</div>
	{:else}
		<!-- List View -->
		{#if groupedSlots.length === 0}
			<div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
				<div class="max-w-md mx-auto">
					<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<Calendar class="h-8 w-8 text-gray-400" />
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">No upcoming time slots</h3>
					<p class="text-gray-600 mb-6">Add time slots to make your tour bookable</p>
					<button
						onclick={() => openAddModal()}
						class="button-primary button--gap"
					>
						<Plus class="h-4 w-4" />
						Add Your First Time Slot
					</button>
				</div>
			</div>
		{:else}
			<div class="space-y-6">
				{#each groupedSlots as [dateStr, slots]}
					<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
						<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
							<h3 class="font-semibold text-gray-900">
								{new Date(dateStr).toLocaleDateString('en-US', { 
									weekday: 'long', 
									month: 'long', 
									day: 'numeric',
									year: 'numeric'
								})}
							</h3>
						</div>
						<div class="divide-y divide-gray-200">
							{#each slots as slot}
								<div class="p-6 hover:bg-gray-50 transition-colors">
									<div class="flex items-center justify-between">
										<div class="flex-1">
											<div class="flex items-center gap-3 mb-2">
												<span class="text-lg font-medium text-gray-900">
													{formatTime(slot.startTime)} - {formatTime(slot.endTime)}
												</span>
												<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium {getStatusColor(slot.status)}">
													{slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
												</span>
											</div>
											<div class="flex items-center gap-4 text-sm text-gray-600">
												<span class="flex items-center gap-1">
													<Users class="h-4 w-4" />
													{slot.bookedSpots || 0} booked, {slot.availableSpots} available
												</span>
												{#if slot.isRecurring}
													<span class="flex items-center gap-1">
														<Clock class="h-4 w-4" />
														Recurring {slot.recurringPattern}
													</span>
												{/if}
											</div>
										</div>
										<div class="flex items-center gap-2">
											<button
												onclick={() => openEditSlot(slot)}
												class="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
												title="Edit time slot"
											>
												<Edit class="h-5 w-5" />
											</button>
											<button
												onclick={() => deleteTimeSlot(slot.id)}
												class="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100"
												title="Delete time slot"
											>
												<Trash2 class="h-5 w-5" />
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<!-- Add/Edit Time Slot Modal -->
{#if showAddModal}
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
			<div class="p-6 border-b border-gray-200 flex-shrink-0">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-xl font-semibold text-gray-900">
							{isEditMode ? 'Edit Time Slot' : 'Add Time Slot'}
						</h2>
						{#if tour}
							<p class="text-sm text-gray-600 mt-1">
								Default duration: {Math.floor(tour.duration / 60)}h {tour.duration % 60}m
							</p>
						{/if}
					</div>
					<button
						onclick={cancelEdit}
						class="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
					>
						<X class="h-5 w-5" />
					</button>
				</div>
			</div>
			
			<form onsubmit={createTimeSlot} class="p-6 space-y-6 overflow-y-auto flex-grow">
				<!-- Date Selection -->
				<div>
					<label for="startDate" class="form-label">
						Select Date <span class="text-red-500">*</span>
					</label>
					
					<!-- Quick date buttons -->
					<div class="flex flex-wrap gap-2 mb-3">
						{#each getNextSevenDays() as day}
							<button
								type="button"
								onclick={() => selectQuickDate(day.date)}
								class="{
									newSlotForm.startDate === day.date.toISOString().split('T')[0]
										? 'button-primary'
										: 'button-secondary'
								} button--small"
							>
								{day.label}
							</button>
						{/each}
					</div>
					
					<!-- Date input -->
					<input
						id="startDate"
						type="date"
						bind:value={newSlotForm.startDate}
						min={new Date().toISOString().split('T')[0]}
						class="form-input w-full {hasFieldError(validationErrors, 'startDate') ? 'error' : ''}"
						required
					/>
					{#if hasFieldError(validationErrors, 'startDate')}
						<p class="form-error">{getFieldError(validationErrors, 'startDate')}</p>
					{/if}
				</div>

				<!-- Time Selection -->
				<div>
					<label for="startTime" class="form-label">
						Select Time <span class="text-red-500">*</span>
					</label>
					
					<!-- Quick time buttons -->
					<div class="flex flex-wrap gap-2 mb-3">
						{#each quickTimeSlots as slot}
							<button
								type="button"
								onclick={() => selectQuickTime(slot.time)}
								class="{
									newSlotForm.startTime === slot.time
										? 'button-primary'
										: 'button-secondary'
								} button--small"
							>
								{slot.label} ({slot.time})
							</button>
						{/each}
					</div>
					
					<!-- Time inputs -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="startTime" class="form-label">
								Start Time
							</label>
							<input
								id="startTime"
								type="time"
								bind:value={newSlotForm.startTime}
								oninput={handleStartTimeChange}
								class="form-input w-full {hasFieldError(validationErrors, 'startTime') ? 'error' : ''}"
								required
							/>
							{#if hasFieldError(validationErrors, 'startTime')}
								<p class="form-error">{getFieldError(validationErrors, 'startTime')}</p>
							{/if}
						</div>
						<div>
							<label for="endTime" class="form-label">
								End Time {tour && newSlotForm.startTime && calculateEndTime(newSlotForm.startTime, tour.duration) === newSlotForm.endTime ? '(auto-calculated)' : ''}
							</label>
							<input
								id="endTime"
								type="time"
								bind:value={newSlotForm.endTime}
								class="form-input w-full {hasFieldError(validationErrors, 'endTime') ? 'error' : ''}"
								required
							/>
							{#if hasFieldError(validationErrors, 'endTime')}
								<p class="form-error">{getFieldError(validationErrors, 'endTime')}</p>
							{/if}
						</div>
					</div>
					
					<!-- Duration override buttons -->
					<div class="mt-3">
						<p class="text-xs text-gray-500 mb-2">Override duration:</p>
						<div class="flex flex-wrap gap-2">
							{#each commonDurations as duration}
								<button
									type="button"
									onclick={() => setDuration(duration.minutes)}
									class="button-secondary button--small"
								>
									{duration.label}
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Conflict Warning -->
				{#if hasConflict()}
					<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
						<div class="flex gap-2">
							<AlertCircle class="h-5 w-5 text-yellow-600 flex-shrink-0" />
							<div>
								<p class="text-sm font-medium text-yellow-800">Time Conflict Detected</p>
								<p class="text-xs text-yellow-700 mt-1">
									This time slot overlaps with an existing slot. Please choose a different time.
								</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Preview -->
				{#if newSlotForm.startDate && newSlotForm.startTime && newSlotForm.endTime}
					<div class="bg-gray-50 rounded-lg p-4">
						<h4 class="text-sm font-medium text-gray-700 mb-2">Preview</h4>
						<div class="text-sm text-gray-600 space-y-1">
							<p>
								<span class="font-medium">Date:</span> {new Date(newSlotForm.startDate).toLocaleDateString('en-US', { 
									weekday: 'long', 
									month: 'long', 
									day: 'numeric',
									year: 'numeric'
								})}
							</p>
							<p>
								<span class="font-medium">Time:</span> {newSlotForm.startTime} - {newSlotForm.endTime}
								{#if tour}
									{@const duration = (new Date(`2000-01-01T${newSlotForm.endTime}`).getTime() - new Date(`2000-01-01T${newSlotForm.startTime}`).getTime()) / 60000}
									<span class="text-xs text-gray-500">({Math.floor(duration / 60)}h {duration % 60}m)</span>
								{/if}
							</p>
							<p>
								<span class="font-medium">Capacity:</span> {newSlotForm.availableSpots} spots
							</p>
						</div>
					</div>
				{/if}

				<!-- Available Spots with Quick Selection -->
				<div>
					<label for="availableSpots" class="form-label">
						Available Spots <span class="text-red-500">*</span>
					</label>
					
					<!-- Quick capacity buttons -->
					{#if tour}
						<div class="flex flex-wrap items-center gap-2 mb-3">
							<button
								type="button"
								onclick={() => newSlotForm.availableSpots = Math.floor((tour?.capacity || 10) * 0.5)}
								class="button-secondary button--small"
							>
								50% ({Math.floor((tour?.capacity || 10) * 0.5)})
							</button>
							<button
								type="button"
								onclick={() => newSlotForm.availableSpots = Math.floor((tour?.capacity || 10) * 0.75)}
								class="button-secondary button--small"
							>
								75% ({Math.floor((tour?.capacity || 10) * 0.75)})
							</button>
							<button
								type="button"
								onclick={() => newSlotForm.availableSpots = tour?.capacity || 10}
								class="button-secondary button--small"
							>
								Full ({tour?.capacity || 10})
							</button>
							<span class="text-xs text-gray-500">or enter custom:</span>
						</div>
					{/if}
					
					<div class="flex items-center gap-3">
						<input
							id="availableSpots"
							type="number"
							bind:value={newSlotForm.availableSpots}
							min="1"
							max={tour?.capacity || 100}
							class="form-input w-24 {hasFieldError(validationErrors, 'availableSpots') ? 'error' : ''}"
							required
						/>
						<div class="flex-1">
							<input
								type="range"
								bind:value={newSlotForm.availableSpots}
								min="1"
								max={tour?.capacity || 100}
								class="w-full"
							/>
						</div>
						<span class="text-sm text-gray-600">/ {tour?.capacity || 100}</span>
					</div>
					
					{#if hasFieldError(validationErrors, 'availableSpots')}
						<p class="form-error">{getFieldError(validationErrors, 'availableSpots')}</p>
					{/if}
				</div>

				<!-- Recurring Options with Better UI -->
				<div class="bg-gray-50 rounded-lg p-4">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={newSlotForm.isRecurring}
							class="form-checkbox"
						/>
						<span class="text-sm font-medium text-gray-700">Create recurring time slots</span>
					</label>
					
					{#if newSlotForm.isRecurring}
						<div class="mt-4 space-y-4 pl-6 border-l-2 border-primary-200">
							<div class="grid grid-cols-3 gap-2">
								<button
									type="button"
									onclick={() => newSlotForm.recurringPattern = 'daily'}
									class="{
										newSlotForm.recurringPattern === 'daily'
											? 'button-primary'
											: 'button-secondary'
									} button--small"
								>
									Daily
								</button>
								<button
									type="button"
									onclick={() => newSlotForm.recurringPattern = 'weekly'}
									class="{
										newSlotForm.recurringPattern === 'weekly'
											? 'button-primary'
											: 'button-secondary'
									} button--small"
								>
									Weekly
								</button>
								<button
									type="button"
									onclick={() => newSlotForm.recurringPattern = 'monthly'}
									class="{
										newSlotForm.recurringPattern === 'monthly'
											? 'button-primary'
											: 'button-secondary'
									} button--small"
								>
									Monthly
								</button>
							</div>

							<div>
								<label for="recurringEnd" class="form-label">
									Repeat until (optional)
								</label>
								<input
									id="recurringEnd"
									type="date"
									bind:value={newSlotForm.recurringEnd}
									min={newSlotForm.startDate}
									class="form-input w-full"
								/>
								<p class="form-help">
									{#if newSlotForm.recurringEnd}
										Will create {newSlotForm.recurringPattern} slots until {new Date(newSlotForm.recurringEnd).toLocaleDateString()}
									{:else}
										Leave empty to continue indefinitely
									{/if}
								</p>
							</div>
						</div>
					{/if}
				</div>

				<!-- Actions -->
				<div class="flex justify-end gap-3 pt-4">
					<button
						type="button"
						onclick={cancelEdit}
						class="button-secondary"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSubmitting || hasConflict()}
						class="button-primary button--gap {hasConflict() ? 'opacity-50 cursor-not-allowed' : ''}"
					>
						{#if isSubmitting}
							<div class="form-spinner"></div>
							{isEditMode ? 'Updating...' : 'Creating...'}
						{:else}
							{isEditMode ? 'Update Time Slot' : 'Create Time Slot'}
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

 
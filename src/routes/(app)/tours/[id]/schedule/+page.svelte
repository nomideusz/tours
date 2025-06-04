<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toursApi, timeSlotsApi, pb } from '$lib/pocketbase.js';
	import type { Tour, TimeSlot } from '$lib/types.js';
	import { validateTimeSlotForm, getFieldError, hasFieldError, type ValidationError } from '$lib/validation.js';
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
	import QrCode from 'lucide-svelte/icons/qr-code';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import TourHeader from '$lib/components/TourHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import TimePicker from '$lib/components/TimePicker.svelte';

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
	let successMessage = $state<string | null>(null);
	let showPublishConfirmation = $state(false);
	let showDraftAlert = $state(true);
	let showActiveAlert = $state(true);
	
	// Check if this is a new tour (from URL params)
	let isNewTour = $derived($page.url.searchParams.get('new') === 'true');
	let showWelcome = $state(false);
	
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

	// Auto-update end time when start time changes
	$effect(() => {
		if (tour && newSlotForm.startTime && !isEditMode) {
			newSlotForm.endTime = calculateEndTime(newSlotForm.startTime, tour.duration);
		}
	});

	// Auto-hide success message
	$effect(() => {
		if (successMessage) {
			const timer = setTimeout(() => {
				successMessage = null;
			}, 5000); // Hide after 5 seconds
			
			return () => clearTimeout(timer);
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
			
			// If it's a new tour and no time slots exist, show welcome guidance
			if (isNewTour) {
				showWelcome = true;
				// Remove the 'new' parameter from URL after a moment
				setTimeout(() => {
					const url = new URL(window.location.href);
					url.searchParams.delete('new');
					window.history.replaceState({}, '', url.toString());
				}, 1000);
			}
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

	async function publishTour() {
		if (!tour) return;

		try {
			isSubmitting = true;
			error = null;

			// Update tour status to active
			const updatedTour = await toursApi.update(tourId, {
				status: 'active'
			});

			// Update local tour state
			tour = updatedTour;

			// Hide welcome alert since tour is now published
			showWelcome = false;

			// Show success message
			successMessage = 'Tour published successfully! It\'s now visible to customers.';
			showPublishConfirmation = false;
		} catch (err) {
			error = 'Failed to publish tour. Please try again.';
			console.error('Error publishing tour:', err);
		} finally {
			isSubmitting = false;
		}
	}

	function openPublishConfirmation() {
		showPublishConfirmation = true;
	}

	async function createRecurringTimeSlots(baseSlotData: any) {
		const startDate = new Date(baseSlotData.startTime);
		const endDate = new Date(baseSlotData.endTime);
		const recurringEnd = newSlotForm.recurringEnd ? new Date(newSlotForm.recurringEnd) : null;
		
		// Calculate slot duration in minutes
		const slotDuration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
		
		// Set appropriate limits based on pattern
		const patternLimits = {
			daily: 365,    // 1 year of daily slots
			weekly: 52,    // 1 year of weekly slots  
			monthly: 24    // 2 years of monthly slots
		};
		const maxSlots = patternLimits[newSlotForm.recurringPattern] || 52;
		
		const slotsToCreate = [];
		let currentDate = new Date(startDate);
		let count = 0;
		
		while (count < maxSlots) {
			// Check if we've reached the end date
			if (recurringEnd && currentDate > recurringEnd) {
				break;
			}
			
			// Create time slot for current date
			const slotStart = new Date(currentDate);
			const slotEnd = new Date(currentDate.getTime() + (slotDuration * 60 * 1000));
			
			const slotData = {
				...baseSlotData,
				startTime: slotStart.toISOString(),
				endTime: slotEnd.toISOString(),
				// Don't include recurring data in individual slots
				isRecurring: false,
				recurringPattern: undefined,
				recurringEnd: undefined
			};
			
			slotsToCreate.push(slotData);
			
			// Calculate next occurrence
			switch (newSlotForm.recurringPattern) {
				case 'daily':
					currentDate.setDate(currentDate.getDate() + 1);
					break;
				case 'weekly':
					currentDate.setDate(currentDate.getDate() + 7);
					break;
				case 'monthly':
					currentDate.setMonth(currentDate.getMonth() + 1);
					break;
				default:
					// Fallback to weekly
					currentDate.setDate(currentDate.getDate() + 7);
			}
			
			count++;
		}
		
		// Create all slots
		console.log(`Creating ${slotsToCreate.length} recurring time slots...`);
		for (const slotData of slotsToCreate) {
			try {
				await timeSlotsApi.create(slotData);
			} catch (err) {
				console.error('Error creating recurring slot:', err);
				// Continue with other slots even if one fails
			}
		}
		
		console.log(`Successfully created ${slotsToCreate.length} recurring time slots`);
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
				// Create single or multiple time slots based on recurring settings
				if (newSlotForm.isRecurring) {
					await createRecurringTimeSlots(timeSlotData);
				} else {
					await timeSlotsApi.create(timeSlotData);
				}
			}
			
			await loadTimeSlots();
			
			// Show success message
			if (isEditMode) {
				successMessage = 'Time slot updated successfully!';
			} else if (newSlotForm.isRecurring) {
				successMessage = 'Recurring time slots created successfully!';
			} else {
				successMessage = 'Time slot created successfully!';
			}
			
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
		// Use date components for more reliable comparison
		const targetYear = date.getFullYear();
		const targetMonth = date.getMonth();
		const targetDay = date.getDate();
		
		return timeSlots.filter(slot => {
			const slotDate = new Date(slot.startTime);
			return slotDate.getFullYear() === targetYear && 
			       slotDate.getMonth() === targetMonth && 
			       slotDate.getDate() === targetDay;
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
			// Ensure the date is at noon to avoid timezone issues
			date.setHours(12, 0, 0, 0);
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
			newSlotForm.startDate = formatDateForInput(date);
		} else {
			// Default to today if no date selected
			const today = new Date();
			newSlotForm.startDate = formatDateForInput(today);
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
			startDate: formatDateForInput(startDate),
			startTime: startDate.toTimeString().slice(0, 5),
			endTime: endDate.toTimeString().slice(0, 5),
			availableSpots: slot.availableSpots,
			isRecurring: slot.isRecurring,
			recurringPattern: slot.recurringPattern || 'weekly',
			recurringEnd: slot.recurringEnd ? formatDateForInput(new Date(slot.recurringEnd)) : ''
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

	// Helper function to format date for input (avoiding timezone issues)
	function formatDateForInput(date: Date): string {
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
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
		
		// Add today first
		days.push({ 
			date: new Date(today), 
			label: `Today (${today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})` 
		});
		
		// Add next 6 days
		for (let i = 1; i <= 6; i++) {
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
		newSlotForm.startDate = formatDateForInput(date);
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
	<PageHeader 
		title="Schedule Management"
		subtitle="Set up availability and time slots for your tour"
		backUrl="/tours/{tourId}"
		breadcrumbs={[
			{ label: 'Tours', href: '/tours' },
			{ label: tour?.name || 'Tour', href: `/tours/${tourId}` },
			{ label: 'Schedule' }
		]}
	>
		<!-- Tour Status & Name Indicator -->
		{#if tour}
			<TourHeader 
				{tour} 
				countInfo={tour.status === 'active' && totalSlots > 0 ? {
					icon: Calendar,
					label: `${totalSlots} time slot${totalSlots !== 1 ? 's' : ''}`
				} : undefined}
			/>
		{/if}

		<div class="flex items-center gap-3">
			<!-- View Toggle - Mobile First -->
			<div class="bg-white rounded-lg border border-gray-200 p-1 flex">
				<button
					onclick={() => viewMode = 'calendar'}
					class="px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors text-sm {viewMode === 'calendar' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}"
				>
					<Calendar class="h-4 w-4" />
					<span class="hidden sm:inline">Calendar</span>
				</button>
				<button
					onclick={() => viewMode = 'list'}
					class="px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors text-sm {viewMode === 'list' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}"
				>
					<List class="h-4 w-4" />
					<span class="hidden sm:inline">List</span>
				</button>
			</div>
			
			<button
				onclick={() => openAddModal()}
				class="button-primary button--gap"
			>
				<Plus class="h-5 w-5" />
				<span class="hidden sm:inline">Add Time Slot</span>
				<span class="sm:hidden">Add</span>
			</button>
		</div>
	</PageHeader>

	<!-- Welcome Section for New Tours - Professional Design -->
	{#if showWelcome && timeSlots.length === 0 && tour?.status === 'draft'}
		<div class="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
			<div class="flex flex-col sm:flex-row items-start gap-4">
				<div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
					<div class="text-2xl">🎉</div>
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="text-xl font-bold text-green-900 mb-3">🎉 Tour Created Successfully!</h3>
					<p class="text-green-800 mb-4 leading-relaxed">
						Great! Your tour "<strong class="text-emerald-600">{tour?.name}</strong>" is ready. 
						Now let's add some time slots so customers can book your amazing experience.
					</p>
					
					<!-- Progress Steps - Simplified -->
					<div class="bg-white/80 rounded-xl p-4 mb-4 border border-green-100">
						<div class="flex items-center gap-4 text-sm">
							<div class="flex items-center gap-2">
								<div class="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">1</div>
								<span class="font-medium text-gray-900">Add time slots</span>
							</div>
							<ChevronRight class="h-4 w-4 text-gray-400" />
							<div class="flex items-center gap-2">
								<div class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-semibold text-xs">2</div>
								<span class="text-gray-600">Publish tour</span>
							</div>
							<ChevronRight class="h-4 w-4 text-gray-400" />
							<div class="flex items-center gap-2">
								<div class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-semibold text-xs">3</div>
								<span class="text-gray-600">Share QR code</span>
							</div>
						</div>
					</div>
					
					<!-- QR Code Info - Inline -->
					<div class="bg-white/60 rounded-lg p-3 mb-4 border border-green-100">
						<div class="flex gap-3">
							<QrCode class="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
							<div class="text-sm">
								<p class="font-medium text-green-800">QR Code Created Automatically!</p>
								<p class="text-green-700">We've created your first QR code. You can create more QR codes for different marketing channels later.</p>
							</div>
						</div>
					</div>
					
					<!-- Actions -->
					<div class="flex flex-col sm:flex-row gap-3">
						<button
							onclick={() => {
								showWelcome = false;
								openAddModal();
							}}
							class="button-primary button--gap"
						>
							<Plus class="h-5 w-5" />
							Add Your First Time Slot
						</button>
						<button
							onclick={() => goto(`/tours/${tourId}`)}
							class="button-secondary"
						>
							I'll do this later
						</button>
					</div>
				</div>
				
				<button
					onclick={() => showWelcome = false}
					class="flex-shrink-0 p-2 text-green-400 hover:text-green-600 transition-colors rounded-lg hover:bg-white/50"
				>
					<X class="h-5 w-5" />
				</button>
			</div>
		</div>
	{/if}

	<!-- Success Message -->
	{#if successMessage}
		<div class="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
			<div class="flex gap-3">
				<div class="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
					<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
					</svg>
				</div>
				<div class="flex-1">
					<p class="font-medium text-green-800">{successMessage}</p>
				</div>
				<button
					onclick={() => successMessage = null}
					class="text-green-400 hover:text-green-600 transition-colors"
				>
					<X class="h-4 w-4" />
				</button>
			</div>
		</div>
	{/if}

	<!-- Draft Status Alert - Moved to top for prominence -->
	{#if tour?.status === 'draft' && showDraftAlert}
		<div class="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
			<div class="flex flex-col sm:flex-row items-start gap-4">
				<div class="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
					<AlertCircle class="h-6 w-6 text-white" />
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="text-xl font-bold text-amber-900 mb-3">⚠️ Tour is in Draft Mode</h3>
					<p class="text-amber-800 mb-4 leading-relaxed">
						Your tour is currently in draft status. Time slots will be saved but <strong>won't be visible to customers</strong> until you publish your tour.
					</p>
					<div class="flex flex-col sm:flex-row gap-3">
						<button
							onclick={openPublishConfirmation}
							disabled={isSubmitting}
							class="button-primary button--gap"
						>
							{#if isSubmitting}
								<div class="form-spinner"></div>
								Publishing...
							{:else}
								<TrendingUp class="h-5 w-5" />
								Publish Tour Now
							{/if}
						</button>
						<a href="/tours/{tourId}" class="button-secondary button--gap">
							<Eye class="h-4 w-4" />
							Preview Tour
						</a>
					</div>
				</div>
				
				<button
					onclick={() => showDraftAlert = false}
					class="flex-shrink-0 p-2 text-amber-400 hover:text-amber-600 transition-colors rounded-lg hover:bg-white/50"
				>
					<X class="h-5 w-5" />
				</button>
			</div>
		</div>
	{/if}

	<!-- Active Tour Status Alert - Moved to top for prominence -->
	{#if tour?.status === 'active' && totalSlots === 0 && showActiveAlert}
		<div class="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
			<div class="flex flex-col sm:flex-row items-start gap-4">
				<div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
					<Calendar class="h-6 w-6 text-white" />
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="text-xl font-bold text-blue-900 mb-3">🎉 Tour is Live! Add Time Slots to Accept Bookings</h3>
					<p class="text-blue-800 mb-4 leading-relaxed">
						Excellent! Your tour is <strong>published and visible to customers</strong>. The final step is adding time slots so customers can book your amazing experience.
					</p>
					
					<!-- Quick info about what's ready -->
					<div class="bg-white/60 rounded-lg p-3 mb-4 border border-blue-100">
						<div class="flex gap-3">
							<QrCode class="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
							<div class="text-sm">
								<p class="font-medium text-blue-800">Ready to share:</p>
								<p class="text-blue-700">Your QR codes are active and will redirect customers to the live booking page once you add time slots.</p>
							</div>
						</div>
					</div>
					
					<div class="flex flex-col sm:flex-row gap-3">
						<button
							onclick={() => openAddModal()}
							class="button-primary button--gap"
						>
							<Plus class="h-5 w-5" />
							Add Time Slots Now
						</button>
						<a href="/tours/{tourId}" class="button-secondary button--gap">
							<Eye class="h-4 w-4" />
							View Tour Details
						</a>
						<a href="/tours/{tourId}/qr" class="button-secondary button--gap">
							<QrCode class="h-4 w-4" />
							Share QR Codes
						</a>
					</div>
				</div>
				
				<button
					onclick={() => showActiveAlert = false}
					class="flex-shrink-0 p-2 text-blue-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-white/50"
				>
					<X class="h-5 w-5" />
				</button>
			</div>
		</div>
	{/if}

	{#if error}
		<div class="mb-8 bg-red-50 border border-red-200 rounded-xl p-4">
			<div class="flex gap-3">
				<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
				<div>
					<p class="font-medium text-red-800">Error</p>
					<p class="text-sm text-red-700 mt-1">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Stats Grid - Improved Responsive Design -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
		<StatsCard
			title="Total Slots"
			value={totalSlots}
			subtitle="time slots created"
			icon={CalendarDays}
		/>

		<StatsCard
			title="Upcoming"
			value={upcomingSlots}
			subtitle="future slots"
			icon={TrendingUp}
			trend={upcomingSlots > 0 ? { value: "Available", positive: true } : undefined}
		/>

		<StatsCard
			title="Total Capacity"
			value={totalCapacity}
			subtitle="spots available"
			icon={Users}
		/>

		<StatsCard
			title="Booked"
			value={bookedSpots}
			subtitle="{totalCapacity > 0 ? Math.round((bookedSpots / totalCapacity) * 100) : 0}% full"
			icon={UserCheck}
			trend={bookedSpots > 0 ? { value: `${bookedSpots} bookings`, positive: true } : undefined}
		/>
	</div>

	{#if isLoading}
		<div class="bg-white rounded-xl border border-gray-200 p-8">
			<LoadingSpinner size="large" text="Loading schedule..." centered />
		</div>
	{:else if viewMode === 'calendar'}
		<!-- Calendar View - Enhanced -->
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			<!-- Calendar Header -->
			<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-900">
						{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
					</h2>
					<div class="flex items-center gap-1">
						<button
							onclick={previousMonth}
							class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
							title="Previous month"
						>
							<ChevronLeft class="h-5 w-5 text-gray-600" />
						</button>
						<button
							onclick={() => currentMonth = new Date()}
							class="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
						>
							Today
						</button>
						<button
							onclick={nextMonth}
							class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
							title="Next month"
						>
							<ChevronRight class="h-5 w-5 text-gray-600" />
						</button>
					</div>
				</div>
			</div>

			<div class="p-6">
				<!-- Day Headers -->
				<div class="grid grid-cols-7 gap-1 mb-4">
					{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day, i}
						<div class="text-center text-sm font-semibold text-gray-700 py-3 {i === 0 || i === 6 ? 'text-gray-500' : ''}">
							<span class="hidden sm:inline">{day}</span>
							<span class="sm:hidden">{day.charAt(0)}</span>
						</div>
					{/each}
				</div>

				<!-- Calendar Grid -->
				<div class="grid grid-cols-7 gap-1">
					{#each calendarGrid as cell}
						{#if cell}
							<div
								class="h-[80px] sm:h-[100px] lg:h-[120px] p-2 border-2 rounded-xl transition-all cursor-pointer group relative
									{isToday(cell.date) ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm' : 'border-gray-200'}
									{isPast(cell.date) ? 'bg-gray-50 opacity-60' : 'bg-white hover:border-blue-200 hover:shadow-md'}"
								role="button"
								tabindex={isPast(cell.date) ? -1 : 0}
								onclick={() => !isPast(cell.date) && openAddModal(cell.date)}
								onkeydown={(e) => e.key === 'Enter' && !isPast(cell.date) && openAddModal(cell.date)}
							>
								<!-- Date header - absolute positioned -->
								<div class="absolute top-2 left-2 right-2 flex items-center justify-between">
									<div class="text-sm font-bold {isPast(cell.date) ? 'text-gray-400' : isToday(cell.date) ? 'text-blue-600' : 'text-gray-900'}">
										{cell.date.getDate()}
									</div>
									{#if !isPast(cell.date)}
										<div class="opacity-0 group-hover:opacity-100 transition-opacity">
											<Plus class="h-3 w-3 text-gray-400" />
										</div>
									{/if}
								</div>
								
								<!-- Content area - absolute positioned below header -->
								<div class="absolute top-7 left-2 right-2 bottom-1 overflow-hidden">
									{#if cell.slots.length > 0}
										<div class="space-y-0.5">
											{#each cell.slots.slice(0, cell.slots.length > 2 ? 1 : 2) as slot}
												<button
													onclick={(e) => {
														e.stopPropagation();
														openEditSlot(slot);
													}}
													class="w-full text-left px-2 py-0.5 rounded-lg text-xs {getStatusColor(slot.status)} hover:scale-105 transition-transform font-medium"
												>
													<div class="truncate">
														{formatTime(slot.startTime)}
													</div>
													<div class="text-xs opacity-75">
														{slot.availableSpots} spots
													</div>
												</button>
											{/each}
											{#if cell.slots.length > 2}
												<div class="text-xs text-gray-500 text-center font-medium py-0.5">
													+{cell.slots.length - 1} more
												</div>
											{:else if cell.slots.length === 2}
												<!-- Show second slot only if there are exactly 2 slots -->
												<button
													onclick={(e) => {
														e.stopPropagation();
														openEditSlot(cell.slots[1]);
													}}
													class="w-full text-left px-2 py-0.5 rounded-lg text-xs {getStatusColor(cell.slots[1].status)} hover:scale-105 transition-transform font-medium"
												>
													<div class="truncate">
														{formatTime(cell.slots[1].startTime)}
													</div>
													<div class="text-xs opacity-75">
														{cell.slots[1].availableSpots} spots
													</div>
												</button>
											{/if}
										</div>
									{:else if !isPast(cell.date)}
										<div class="flex items-center justify-center" style="height: calc(100% - 1rem);">
											<div class="text-xs text-gray-400 text-center opacity-0 group-hover:opacity-100 transition-opacity">
												Click to add
											</div>
										</div>
									{/if}
								</div>
							</div>
						{:else}
							<div class="min-h-[80px] sm:min-h-[100px] lg:min-h-[120px]"></div>
						{/if}
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<!-- List View - Enhanced -->
		{#if groupedSlots.length === 0}
			<div class="bg-white rounded-xl border border-gray-200 p-12">
				<EmptyState
					icon={Calendar}
					title="No upcoming time slots"
					description="Add time slots to make your tour bookable by customers"
					actionText="Add Your First Time Slot"
					onAction={() => openAddModal()}
				/>
			</div>
		{:else}
			<div class="space-y-4">
				{#each groupedSlots as [dateStr, slots]}
					<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
						<div class="px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
							<div class="flex items-center justify-between">
								<div>
									<h3 class="font-bold text-gray-900 text-lg">
										{new Date(dateStr).toLocaleDateString('en-US', { 
											weekday: 'long', 
											month: 'long', 
											day: 'numeric'
										})}
									</h3>
									<p class="text-sm text-gray-600 mt-1">
										{slots.length} time slot{slots.length !== 1 ? 's' : ''} • 
										{slots.reduce((sum, slot) => sum + slot.availableSpots, 0)} total spots
									</p>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-sm text-gray-500">
										{new Date(dateStr).toLocaleDateString('en-US', { 
											year: 'numeric'
										})}
									</span>
									<button
										onclick={() => openAddModal(new Date(dateStr))}
										class="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-white"
										title="Add time slot for this date"
									>
										<Plus class="h-4 w-4" />
									</button>
								</div>
							</div>
						</div>
						
						<div class="divide-y divide-gray-100">
							{#each slots as slot}
								<div class="p-4 sm:p-6 hover:bg-gray-50 transition-colors group">
									<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
										<div class="flex-1 min-w-0">
											<div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
												<div class="flex items-center gap-3">
													<div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
														<Clock class="h-6 w-6 text-blue-600" />
													</div>
													<div>
														<div class="text-lg font-bold text-gray-900">
															{formatTime(slot.startTime)} - {formatTime(slot.endTime)}
														</div>
														<div class="text-sm text-gray-600">
															{Math.floor((new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 60000)} minutes
														</div>
													</div>
												</div>
												
												<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getStatusColor(slot.status)} self-start sm:self-auto">
													{slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
												</span>
											</div>
											
											<div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
												<div class="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
													<Users class="h-4 w-4" />
													<span class="font-medium">{slot.bookedSpots || 0} booked</span>
													<span class="text-gray-400">of {slot.availableSpots}</span>
												</div>
												
												{#if slot.isRecurring}
													<div class="flex items-center gap-2 bg-blue-100 text-blue-700 rounded-lg px-3 py-1.5">
														<Clock class="h-4 w-4" />
														<span class="font-medium">Recurring {slot.recurringPattern}</span>
													</div>
												{/if}
												
												<div class="flex items-center gap-2 text-gray-500">
													<CalendarDays class="h-4 w-4" />
													<span>
														{Math.round(((slot.bookedSpots || 0) / slot.availableSpots) * 100)}% full
													</span>
												</div>
											</div>
										</div>
										
										<div class="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
											<button
												onclick={() => openEditSlot(slot)}
												class="p-3 text-gray-400 hover:text-blue-600 transition-colors rounded-xl hover:bg-blue-50"
												title="Edit time slot"
											>
												<Edit class="h-5 w-5" />
											</button>
											<button
												onclick={() => deleteTimeSlot(slot.id)}
												class="p-3 text-gray-400 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50"
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
		<div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
			<div class="p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
							{#if isEditMode}
								<Edit class="h-5 w-5 text-white" />
							{:else}
								<Plus class="h-5 w-5 text-white" />
							{/if}
						</div>
						<div>
							<h2 class="text-xl font-semibold text-gray-900">
								{isEditMode ? 'Edit Time Slot' : 'Add Time Slot'}
							</h2>
							{#if tour}
								<p class="text-sm text-gray-600 mt-1">
									Default duration: {Math.floor(tour.duration / 60)}h {tour.duration % 60}m • Capacity: {tour.capacity} people
								</p>
							{/if}
						</div>
					</div>
					<button
						onclick={cancelEdit}
						class="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
					>
						<X class="h-5 w-5" />
					</button>
				</div>
			</div>
			
			<form onsubmit={createTimeSlot} class="overflow-y-auto flex-grow">
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
					<!-- Left Column: Date & Time Selection -->
					<div class="space-y-6">
												<!-- Date Selection -->
						<div class="bg-gray-50 rounded-xl p-6">
							<!-- Quick date buttons -->
							<div class="mb-4">
								<p class="text-sm font-medium text-gray-700 mb-2">📅 Quick Date Selection</p>
								<div class="grid grid-cols-2 gap-2">
									{#each getNextSevenDays() as day}
										<button
											type="button"
											onclick={() => selectQuickDate(day.date)}
											class="{
												newSlotForm.startDate === formatDateForInput(day.date)
													? 'bg-blue-600 text-white border-blue-600'
													: 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
											} px-3 py-2 rounded-lg border transition-all text-sm font-medium"
										>
											{day.label}
										</button>
									{/each}
								</div>
							</div>
							
							<!-- Custom Date Picker -->
							<DatePicker
								label="Select Date"
								required={true}
								bind:value={newSlotForm.startDate}
								minDate={formatDateForInput(new Date())}
								error={hasFieldError(validationErrors, 'startDate')}
							/>
							
							{#if hasFieldError(validationErrors, 'startDate')}
								<p class="form-error mt-2">{getFieldError(validationErrors, 'startDate')}</p>
							{/if}
						</div>

						<!-- Time Selection -->
						<div class="bg-gray-50 rounded-xl p-6">
							<!-- Custom Time Pickers -->
							<div class="grid grid-cols-2 gap-4 mb-4">
								<div>
									<TimePicker
										label="Start Time"
										required={true}
										bind:value={newSlotForm.startTime}
										error={hasFieldError(validationErrors, 'startTime')}
									/>
									<!-- Reserved space for alignment -->
									<div class="h-5 mt-1"></div>
								</div>
								
								<div>
									<TimePicker
										label="End Time"
										required={true}
										bind:value={newSlotForm.endTime}
										error={hasFieldError(validationErrors, 'endTime')}
									/>
									<!-- Reserved space with conditional content -->
									<div class="h-5 flex items-start">
										{#if tour && newSlotForm.startTime && calculateEndTime(newSlotForm.startTime, tour.duration) === newSlotForm.endTime}
											<p class="text-xs text-green-600 flex items-center gap-1 mt-1">
												<span class="w-1 h-1 bg-green-500 rounded-full"></span>
												Auto-calculated from tour duration
											</p>
										{/if}
									</div>
								</div>
							</div>
							
							{#if hasFieldError(validationErrors, 'startTime')}
								<p class="form-error mb-2">{getFieldError(validationErrors, 'startTime')}</p>
							{/if}
							{#if hasFieldError(validationErrors, 'endTime')}
								<p class="form-error mb-2">{getFieldError(validationErrors, 'endTime')}</p>
							{/if}
							
							<!-- Duration override buttons -->
							<div>
								<p class="text-sm font-medium text-gray-700 mb-2">Quick Duration:</p>
								<div class="grid grid-cols-3 gap-2">
									{#each commonDurations as duration}
										<button
											type="button"
											onclick={() => setDuration(duration.minutes)}
											class="px-2 py-1 text-xs bg-white text-gray-600 border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-all"
										>
											{duration.label}
										</button>
									{/each}
								</div>
							</div>
						</div>
					</div>

					<!-- Right Column: Capacity & Settings -->
					<div class="space-y-6">
						<!-- Preview Card -->
						<div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-100 h-[320px] flex flex-col">
							<div class="flex items-center gap-2 mb-4 flex-shrink-0">
								<div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
									<Eye class="h-4 w-4 text-white" />
								</div>
								<h4 class="text-lg font-semibold text-gray-900">Preview</h4>
							</div>
							
							<div class="flex-1 flex flex-col">
								{#if newSlotForm.startDate && newSlotForm.startTime && newSlotForm.endTime}
									<div class="space-y-3 flex-1">
										<div class="flex items-center gap-3">
											<Calendar class="h-5 w-5 text-blue-600 flex-shrink-0" />
											<div class="min-w-0">
												<p class="font-medium text-gray-900 truncate">
													{new Date(newSlotForm.startDate).toLocaleDateString('en-US', { 
														weekday: 'long', 
														month: 'long', 
														day: 'numeric',
														year: 'numeric'
													})}
												</p>
												<p class="text-sm text-gray-600">
													{new Date(newSlotForm.startDate).toLocaleDateString('en-US', { 
														month: 'short', 
														day: 'numeric'
													})}
												</p>
											</div>
										</div>
										
										<div class="flex items-center gap-3">
											<Clock class="h-5 w-5 text-blue-600 flex-shrink-0" />
											<div class="min-w-0">
												<p class="font-medium text-gray-900">
													{newSlotForm.startTime} - {newSlotForm.endTime}
												</p>
												{#if tour}
													{@const duration = (new Date(`2000-01-01T${newSlotForm.endTime}`).getTime() - new Date(`2000-01-01T${newSlotForm.startTime}`).getTime()) / 60000}
													<p class="text-sm text-gray-600">
														{Math.floor(duration / 60)}h {duration % 60}m duration
													</p>
												{/if}
											</div>
										</div>
										
										<div class="flex items-center gap-3">
											<Users class="h-5 w-5 text-blue-600 flex-shrink-0" />
											<div class="min-w-0">
												<p class="font-medium text-gray-900">
													{newSlotForm.availableSpots} spots available
												</p>
												<p class="text-sm text-gray-600">
													{tour ? `${Math.round((newSlotForm.availableSpots / tour.capacity) * 100)}% of capacity` : ''}
												</p>
											</div>
										</div>
									</div>
									
									<!-- Fixed space for conflict warning -->
									<div class="h-16 mt-3 flex-shrink-0">
										{#if hasConflict()}
											<div class="bg-red-50 border border-red-200 rounded-lg p-3 h-full flex items-start">
												<div class="flex gap-2 w-full">
													<AlertCircle class="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
													<div class="min-w-0 flex-1">
														<p class="text-sm font-medium text-red-800">Time Conflict!</p>
														<p class="text-xs text-red-700 mt-1">
															This overlaps with an existing slot.
														</p>
													</div>
												</div>
											</div>
										{/if}
									</div>
								{:else}
									<div class="flex-1 flex items-center justify-center text-gray-500">
										<div class="text-center">
											<Calendar class="h-8 w-8 mx-auto mb-2 opacity-50" />
											<p class="text-sm">Fill in date and time to see preview</p>
										</div>
									</div>
								{/if}
							</div>
						</div>

						<!-- Capacity Selection -->
						<div class="bg-gray-50 rounded-xl p-4">
							<label class="form-label mb-4 block">
								👥 Available Spots <span class="text-red-500">*</span>
							</label>
							
							<!-- Quick capacity buttons -->
							{#if tour}
								<div class="grid grid-cols-3 gap-2 mb-4">
									<button
										type="button"
										onclick={() => newSlotForm.availableSpots = Math.floor((tour?.capacity || 10) * 0.5)}
										class="{
											newSlotForm.availableSpots === Math.floor((tour?.capacity || 10) * 0.5)
												? 'bg-blue-600 text-white border-blue-600'
												: 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
										} px-3 py-2 rounded-lg border transition-all text-sm font-medium"
									>
										<div class="font-medium">50%</div>
										<div class="text-xs opacity-75">{Math.floor((tour?.capacity || 10) * 0.5)} spots</div>
									</button>
									<button
										type="button"
										onclick={() => newSlotForm.availableSpots = Math.floor((tour?.capacity || 10) * 0.75)}
										class="{
											newSlotForm.availableSpots === Math.floor((tour?.capacity || 10) * 0.75)
												? 'bg-blue-600 text-white border-blue-600'
												: 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
										} px-3 py-2 rounded-lg border transition-all text-sm font-medium"
									>
										<div class="font-medium">75%</div>
										<div class="text-xs opacity-75">{Math.floor((tour?.capacity || 10) * 0.75)} spots</div>
									</button>
									<button
										type="button"
										onclick={() => newSlotForm.availableSpots = tour?.capacity || 10}
										class="{
											newSlotForm.availableSpots === (tour?.capacity || 10)
												? 'bg-blue-600 text-white border-blue-600'
												: 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
										} px-3 py-2 rounded-lg border transition-all text-sm font-medium"
									>
										<div class="font-medium">Full</div>
										<div class="text-xs opacity-75">{tour?.capacity || 10} spots</div>
									</button>
								</div>
							{/if}
							
							<!-- Custom capacity input with slider -->
							<div class="space-y-3">
								<div class="flex items-center gap-3">
									<Users class="h-5 w-5 text-gray-400" />
									<input
										id="availableSpots"
										type="number"
										bind:value={newSlotForm.availableSpots}
										min="1"
										max={tour?.capacity || 100}
										class="form-input w-20 text-center {hasFieldError(validationErrors, 'availableSpots') ? 'error' : ''}"
										required
									/>
									<span class="text-sm text-gray-600">of {tour?.capacity || 100} spots</span>
								</div>
								
								<!-- Visual capacity slider -->
								<div class="space-y-2">
									<input
										type="range"
										bind:value={newSlotForm.availableSpots}
										min="1"
										max={tour?.capacity || 100}
										class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
										style="background: linear-gradient(to right, #3b82f6 0%, #3b82f6 {(newSlotForm.availableSpots / (tour?.capacity || 100)) * 100}%, #e5e7eb {(newSlotForm.availableSpots / (tour?.capacity || 100)) * 100}%, #e5e7eb 100%)"
									/>
									<div class="flex justify-between text-xs text-gray-500">
										<span>1</span>
										<span class="font-medium text-blue-600">{newSlotForm.availableSpots}</span>
										<span>{tour?.capacity || 100}</span>
									</div>
								</div>
								
								{#if hasFieldError(validationErrors, 'availableSpots')}
									<p class="form-error">{getFieldError(validationErrors, 'availableSpots')}</p>
								{/if}
							</div>
						</div>

						<!-- Recurring Options -->
						<div class="bg-gray-50 rounded-xl p-4 h-[240px] flex flex-col">
							<label class="flex items-center gap-3 cursor-pointer mb-4 flex-shrink-0">
								<input
									type="checkbox"
									bind:checked={newSlotForm.isRecurring}
									class="form-checkbox"
								/>
								<div>
									<span class="text-sm font-medium text-gray-700">🔄 Create recurring time slots</span>
									<p class="text-xs text-gray-500 mt-1">Generate multiple slots automatically</p>
								</div>
							</label>
							
							<!-- Fixed space for recurring options -->
							<div class="flex-1 flex flex-col">
								{#if newSlotForm.isRecurring}
									<div class="space-y-4 pl-6 border-l-2 border-blue-200 flex-1">
										<!-- Pattern Selection -->
										<div>
											<p class="text-sm font-medium text-gray-700 mb-2">Repeat pattern:</p>
											<div class="grid grid-cols-3 gap-2">
												<button
													type="button"
													onclick={() => newSlotForm.recurringPattern = 'daily'}
													class="{
														newSlotForm.recurringPattern === 'daily'
															? 'bg-blue-600 text-white border-blue-600'
															: 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
													} px-3 py-2 rounded-lg border transition-all text-sm font-medium"
												>
													Daily
												</button>
												<button
													type="button"
													onclick={() => newSlotForm.recurringPattern = 'weekly'}
													class="{
														newSlotForm.recurringPattern === 'weekly'
															? 'bg-blue-600 text-white border-blue-600'
															: 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
													} px-3 py-2 rounded-lg border transition-all text-sm font-medium"
												>
													Weekly
												</button>
												<button
													type="button"
													onclick={() => newSlotForm.recurringPattern = 'monthly'}
													class="{
														newSlotForm.recurringPattern === 'monthly'
															? 'bg-blue-600 text-white border-blue-600'
															: 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
													} px-3 py-2 rounded-lg border transition-all text-sm font-medium"
												>
													Monthly
												</button>
											</div>
										</div>

										<!-- End Date -->
										<div>
											<label for="recurringEnd" class="text-sm font-medium text-gray-700 mb-2 block">
												Repeat until (optional)
											</label>
											<div class="relative">
												<Calendar class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
												<input
													id="recurringEnd"
													type="date"
													bind:value={newSlotForm.recurringEnd}
													min={newSlotForm.startDate}
													class="form-input pl-10 w-full"
												/>
											</div>
																					<p class="text-xs text-gray-500 mt-1">
											{#if newSlotForm.recurringEnd}
												Will create {newSlotForm.recurringPattern} slots until {new Date(newSlotForm.recurringEnd).toLocaleDateString()}
											{:else}
												{#if newSlotForm.recurringPattern === 'daily'}
													Leave empty to create 365 daily slots (1 year)
												{:else if newSlotForm.recurringPattern === 'weekly'}
													Leave empty to create 52 weekly slots (1 year)
												{:else if newSlotForm.recurringPattern === 'monthly'}
													Leave empty to create 24 monthly slots (2 years)
												{:else}
													Leave empty to create up to 1 year of slots
												{/if}
											{/if}
										</p>
										</div>
									</div>
								{:else}
									<div class="flex-1 flex items-center justify-center text-gray-500">
										<div class="text-center">
											<Clock class="h-8 w-8 mx-auto mb-2 opacity-50" />
											<p class="text-sm">Enable to configure recurring options</p>
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="px-6 pb-6 border-t border-gray-200 bg-gray-50">
					<div class="flex justify-between items-center pt-6">
						<button
							type="button"
							onclick={cancelEdit}
							class="button-secondary"
						>
							Cancel
						</button>
						<div class="flex items-center gap-3">
							{#if hasConflict()}
								<div class="flex items-center gap-2 text-red-600 text-sm">
									<AlertCircle class="h-4 w-4" />
									<span>Time conflict</span>
								</div>
							{/if}
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
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Publish Confirmation Modal -->
{#if showPublishConfirmation}
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
			<!-- Header -->
			<div class="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-200">
				<div class="flex items-center gap-4">
					<div class="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
						<TrendingUp class="h-7 w-7 text-white" />
					</div>
					<div>
						<h2 class="text-2xl font-bold text-gray-900 mb-1">Publish Your Tour</h2>
						<p class="text-green-700">Make "{tour?.name || 'your tour'}" live for customers</p>
					</div>
				</div>
			</div>
			
			<!-- Content -->
			<div class="p-6">
				<div class="space-y-6">
					<!-- What happens section -->
					<div>
						<h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<span class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">✓</span>
							What happens when you publish:
						</h3>
						<div class="space-y-3 ml-8">
							<div class="flex items-center gap-3 text-gray-700">
								<div class="w-2 h-2 bg-green-500 rounded-full"></div>
								<span>Tour becomes <strong>visible to customers</strong></span>
							</div>
							<div class="flex items-center gap-3 text-gray-700">
								<div class="w-2 h-2 bg-green-500 rounded-full"></div>
								<span>Time slots are <strong>available for booking</strong></span>
							</div>
							<div class="flex items-center gap-3 text-gray-700">
								<div class="w-2 h-2 bg-green-500 rounded-full"></div>
								<span>QR codes will redirect to <strong>live booking page</strong></span>
							</div>
							<div class="flex items-center gap-3 text-gray-700">
								<div class="w-2 h-2 bg-green-500 rounded-full"></div>
								<span>You'll start receiving <strong>real bookings</strong></span>
							</div>
						</div>
					</div>

					<!-- Current status -->
					<div class="bg-gray-50 rounded-xl p-4">
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p class="text-gray-600 mb-1">Time Slots:</p>
								<p class="font-semibold text-gray-900">{totalSlots} created</p>
							</div>
							<div>
								<p class="text-gray-600 mb-1">Capacity:</p>
								<p class="font-semibold text-gray-900">{totalCapacity} spots available</p>
							</div>
						</div>
					</div>

					<!-- Ready check -->
					{#if totalSlots === 0}
						<div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
							<div class="flex gap-3">
								<AlertCircle class="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
								<div>
									<p class="font-medium text-amber-800">No time slots yet</p>
									<p class="text-sm text-amber-700 mt-1">Consider adding time slots before publishing so customers can book immediately.</p>
								</div>
							</div>
						</div>
					{:else}
						<div class="bg-green-50 border border-green-200 rounded-xl p-4">
							<div class="flex gap-3">
								<div class="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
									<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
									</svg>
								</div>
								<div>
									<p class="font-medium text-green-800">Ready to publish!</p>
									<p class="text-sm text-green-700 mt-1">Your tour has time slots and is ready for customers.</p>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Actions -->
			<div class="px-6 pb-6 border-t border-gray-200 bg-gray-50">
				<div class="flex justify-between items-center pt-4">
					<button
						onclick={() => showPublishConfirmation = false}
						class="button-secondary"
						disabled={isSubmitting}
					>
						Cancel
					</button>
					<button
						onclick={publishTour}
						disabled={isSubmitting}
						class="button-primary button--gap"
					>
						{#if isSubmitting}
							<div class="form-spinner"></div>
							Publishing...
						{:else}
							<TrendingUp class="h-5 w-5" />
							Publish Tour Now
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
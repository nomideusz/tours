<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { updateTimeSlotMutation, deleteTimeSlotMutation } from '$lib/queries/mutations.js';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import { onMount, onDestroy } from 'svelte';
	import '$lib/styles/timeline.css';
	
	// Icons
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Eye from 'lucide-svelte/icons/eye';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import Play from 'lucide-svelte/icons/play';
	import Pause from 'lucide-svelte/icons/pause';
	import Edit3 from 'lucide-svelte/icons/edit-3';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Info from 'lucide-svelte/icons/info';
	import Plus from 'lucide-svelte/icons/plus';
	
	// Types
	export interface TimeSlot {
		id: string;
		tourId: string;
		tourName: string;
		startTime: string;
		endTime: string;
		capacity: number;
		bookedSpots: number;
		availableSpots: number;
		totalRevenue: number;
		isToday: boolean;
		isPast: boolean;
		isFull: boolean;
		utilizationRate: number;
		status?: 'available' | 'cancelled';
	}
	
	// Component props
	let {
		view = $bindable('week'), 
		currentDate = $bindable(new Date()),
		compact = false,
		onSlotClick = undefined,
		onViewChange = undefined,
		tourId = undefined,
		hideHeader = false,
		hideHeaderText = false,
		hideViewToggle = false,
		hideStats = false,
		defaultView = 'week',
		onQuickAdd = undefined,
		tour = undefined
	}: {
		view?: 'day' | 'week' | 'month';
		currentDate?: Date;
		compact?: boolean;
		onSlotClick?: (slot: TimeSlot) => void;
		onViewChange?: (view: 'day' | 'week' | 'month') => void;
		tourId?: string;
		hideHeader?: boolean;
		hideHeaderText?: boolean;
		hideViewToggle?: boolean;
		hideStats?: boolean;
		defaultView?: 'day' | 'week' | 'month';
		onQuickAdd?: (date: Date) => void;
		tour?: any; // Tour data for accessing duration
	} = $props();
	
	// Initialize view from defaultView if not already set
	$effect(() => {
		if (!view && defaultView) {
			view = defaultView;
		}
	});
	

	
	// Debug component mounting
	onMount(() => {
		console.log('🗓️ TourTimeline: Component mounted', { view, currentDate, compact, browser });
		console.log('🗓️ TourTimeline: Initial query state', { enabled: browser });
	});
	
	// Debug query state changes
	$effect(() => {
		console.log('🗓️ TourTimeline: Query state changed', {
			isLoading: $timelineQuery.isLoading,
			isError: $timelineQuery.isError,
			error: $timelineQuery.error,
			data: $timelineQuery.data,
			status: $timelineQuery.status,
			enabled: browser,
			view,
			dateString
		});
	});
	
	// Create stable date string for query key and API call consistency
	// Use local date to avoid timezone shifts
	let dateString = $derived(
		`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
	);
	
	// Query for timeline data - make reactive to date and view changes
	let timelineQuery = $derived(createQuery({
		queryKey: tourId 
			? queryKeys.tourSchedule(tourId)
			: queryKeys.allTimeSlots(view, dateString),
		queryFn: async () => {
			console.log('🔍 Timeline: Fetching data for', { view, dateString, currentDate: currentDate.toISOString(), tourId });
			try {
				// If tourId is provided, fetch tour-specific schedule
				if (tourId) {
					const result = await queryFunctions.fetchTourSchedule(tourId);
					// Transform the data to match the expected format
					return {
						timeSlots: result.timeSlots || [],
						stats: result.stats || {}
					};
				} else {
					// Otherwise fetch all time slots
					const result = await queryFunctions.fetchAllTimeSlots(view, dateString);
					console.log('✅ Timeline: Data received:', result);
					return result;
				}
			} catch (error) {
				console.error('❌ Timeline: Fetch failed:', error);
				throw error;
			}
		},
		staleTime: 0, // Always consider data potentially stale for immediate updates
		gcTime: 2 * 60 * 1000, // 2 minutes garbage collection
		refetchOnWindowFocus: 'always', // Always refetch on window focus for immediate updates
		refetchOnMount: 'always', // Always refetch on mount for immediate updates
		enabled: browser,
		retry: 1, // Reduce retries
		retryDelay: 1000, // 1 second retry delay
	}));
	
	// Derived data
	let timeSlots = $derived($timelineQuery.data?.timeSlots || []);
	let stats = $derived.by(() => {
		if (!processedTimeSlots.length) {
			return {
				totalSlots: 0,
				totalBookings: 0,
				averageUtilization: 0
			};
		}

		const totalBookings = processedTimeSlots.reduce((sum: number, slot: TimeSlot) => sum + (slot.bookedSpots || 0), 0);
		const averageUtilization = processedTimeSlots.length > 0 
			? processedTimeSlots.reduce((sum: number, slot: TimeSlot) => sum + slot.utilizationRate, 0) / processedTimeSlots.length
			: 0;

		return {
			totalSlots: processedTimeSlots.length,
			totalBookings,
			averageUtilization
		};
	});
	let isLoading = $derived($timelineQuery.isLoading);
	let error = $derived($timelineQuery.error);
	
	// Process timeSlots to ensure utilizationRate is calculated
	let processedTimeSlots = $derived.by(() => {
		return timeSlots.map((slot: TimeSlot) => ({
			...slot,
			// Calculate utilizationRate if missing (tour-schedule API doesn't include it)
			utilizationRate: slot.utilizationRate !== undefined 
				? slot.utilizationRate 
				: slot.capacity > 0 ? (slot.bookedSpots / slot.capacity) * 100 : 0
		}));
	});
	
	// Group slots by date for display - filter by current view period for tour-specific views
	let slotsByDate = $derived.by(() => {
		const groups = new Map<string, TimeSlot[]>();
		
		// Filter slots based on current view and date for tour-specific views
		let filteredSlots = processedTimeSlots;
		
		if (tourId && (view === 'day' || view === 'week')) {
			// For tour-specific day/week views, filter by current period
			filteredSlots = processedTimeSlots.filter((slot: TimeSlot) => {
				const slotDate = new Date(slot.startTime);
				
				if (view === 'day') {
					// Show only slots for the current day - use UTC date comparison to avoid timezone issues
					const slotDateUTC = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
					const currentDateUTC = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
					return slotDateUTC.getTime() === currentDateUTC.getTime();
				} else if (view === 'week') {
					// Show only slots for the current week
					const weekStart = new Date(currentDate);
					const dayOfWeek = weekStart.getDay();
					const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as start
					weekStart.setDate(weekStart.getDate() + diff);
					weekStart.setHours(0, 0, 0, 0);
					
					const weekEnd = new Date(weekStart);
					weekEnd.setDate(weekEnd.getDate() + 6);
					weekEnd.setHours(23, 59, 59, 999);
					
					return slotDate >= weekStart && slotDate <= weekEnd;
				}
				
				return true;
			});
		}
		
		filteredSlots.forEach((slot: TimeSlot) => {
			const date = new Date(slot.startTime);
			// Use local date components to create consistent date key regardless of timezone
			const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
			const dateKey = localDate.toDateString();
			
			if (!groups.has(dateKey)) {
				groups.set(dateKey, []);
			}
			groups.get(dateKey)!.push(slot);
		});
		
		// Sort dates
		return Array.from(groups.entries())
			.sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
	});
	
	// Navigation functions
	function navigateDate(direction: 'prev' | 'next') {
		const newDate = new Date(currentDate);
		
		switch (view) {
			case 'day':
				newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
				break;
			case 'week':
				newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
				break;
			case 'month':
				newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
				break;
		}
		
		currentDate = newDate;
	}
	
	function goToToday() {
		currentDate = new Date();
	}
	
	// Format date range display
	function getDateRangeDisplay(): string {
		// Use the actual currentDate instead of relying on query data for display
		const baseDate = new Date(currentDate);
		
		if (view === 'day') {
			return baseDate.toLocaleDateString('en-US', { 
				weekday: 'long', 
				month: 'long', 
				day: 'numeric', 
				year: 'numeric' 
			});
		} else if (view === 'week') {
			// Calculate week start (Monday) and end (Sunday)
			const startOfWeek = new Date(baseDate);
			const dayOfWeek = startOfWeek.getDay();
			const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
			startOfWeek.setDate(startOfWeek.getDate() + diff);
			
			const endOfWeek = new Date(startOfWeek);
			endOfWeek.setDate(endOfWeek.getDate() + 6);
			
			const startStr = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
			const endStr = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
			return `${startStr} - ${endStr}`;
		} else {
			return baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
		}
	}
	
	// Get slot status styling
	function getSlotStatusClass(slot: TimeSlot): string {
		if (slot.isPast) return 'past-slot';
		if (slot.isFull) return 'full-slot';
		if (slot.utilizationRate >= 80) return 'nearly-full-slot';
		if (slot.bookedSpots > 0) return 'has-bookings-slot';
		return '';
	}
	
	function getUtilizationColor(rate: number): string {
		if (rate >= 90) return 'var(--color-danger-500)';
		if (rate >= 70) return 'var(--color-warning-500)';
		if (rate >= 30) return 'var(--color-success-500)';
		return 'var(--text-tertiary)';
	}
	
	// Get slot color based on bookings and utilization
	function getSlotColor(slot: TimeSlot): string {
		if (slot.status === 'cancelled') return 'var(--color-error-400)';
		if (slot.isFull || slot.utilizationRate >= 90) return 'var(--color-danger-500)';
		if (slot.utilizationRate >= 70) return 'var(--color-warning-500)';
		if (slot.utilizationRate >= 30) return 'var(--color-success-500)';
		if (slot.bookedSpots > 0) return 'var(--color-primary-500)'; // Blue for slots with bookings
		return 'var(--text-tertiary)'; // Grey for empty slots
	}
	
	// Handle slot click
	function handleSlotClick(slot: TimeSlot) {
		if (onSlotClick) {
			onSlotClick(slot);
		} else {
			// Default: navigate to tour details
			// On mobile, go directly to schedule tab
			if (browser && window.innerWidth < 768) {
				goto(`/tours/${slot.tourId}?tab=schedule`);
			} else {
				goto(`/tours/${slot.tourId}`);
			}
		}
	}
	
	// Handle day click in calendar view
	function handleDayClick(date: Date, slots: TimeSlot[]) {
		if (slots.length === 0) {
			// Empty day - start quick add if in tour view, or call onQuickAdd callback
			if (tourId) {
				startQuickAdd(date);
			} else if (onQuickAdd) {
				onQuickAdd(date);
			}
			return;
		}
		
		// If only one slot, navigate directly to it
		if (slots.length === 1) {
			handleSlotClick(slots[0]);
		} else {
			// Multiple slots - switch to week view and navigate to that date
			// Week view makes more sense for navigation (left/right = prev/next week)
			view = 'week';
			currentDate = date;
			onViewChange?.('week');
		}
	}
	
	// Additional helper functions for calendar view
	function getCalendarDay(index: number): Date | null {
		const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
		const firstDayOfWeek = firstDay.getDay() || 7; // Convert Sunday (0) to 7
		const startOffset = firstDayOfWeek - 1; // Monday is 1
		
		const dayNumber = index - startOffset + 1;
		if (dayNumber < 1) {
			// Previous month
			const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
			return new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() + dayNumber);
		} else {
			const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
			if (dayNumber > daysInMonth) {
				// Next month
				return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, dayNumber - daysInMonth);
			} else {
				// Current month
				return new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
			}
		}
	}
	
	function getDaySlots(date: Date): TimeSlot[] {
		// Use processedTimeSlots to ensure utilizationRate is calculated
		return processedTimeSlots.filter((slot: TimeSlot) => {
			const slotDate = new Date(slot.startTime);
			// Compare using local date components to avoid timezone issues
			const slotDateLocal = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
			const targetDateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
			return slotDateLocal.getTime() === targetDateLocal.getTime();
		});
	}
	
	// Get query client for prefetching
	const queryClient = useQueryClient();
	
	// Quick edit state
	let editingSlot = $state<string | null>(null);
	let editCapacity = $state<number>(0);
	let isSubmittingEdit = $state(false);
	let recentlyUpdated = $state<{[key: string]: string}>({});
	let isDeleting = $state(false);
	let slotToDelete = $state<TimeSlot | null>(null);
	
	// Initialize mutations for tour-specific edits
	const updateMutation = tourId ? updateTimeSlotMutation(tourId, '') : null;
	
	// Helper to show inline feedback
	function showInlineSuccess(slotId: string, message: string) {
		recentlyUpdated = { ...recentlyUpdated, [slotId]: message };
		
		// Auto-clear after 2 seconds
		setTimeout(() => {
			recentlyUpdated = Object.fromEntries(
				Object.entries(recentlyUpdated).filter(([id]) => id !== slotId)
			);
		}, 2000);
	}
	
	// Quick edit functions
	function startEditCapacity(slot: TimeSlot) {
		editingSlot = slot.id;
		editCapacity = slot.capacity;
	}
	
	function cancelEdit() {
		editingSlot = null;
		editCapacity = 0;
	}
	
	async function saveCapacity(slot: TimeSlot) {
		if (!tourId || isSubmittingEdit) return;
		
		// Validation
		if (editCapacity < slot.bookedSpots) {
			alert(`Capacity cannot be less than ${slot.bookedSpots} (already booked spots)`);
			return;
		}
		
		if (editCapacity < 1 || editCapacity > 100) {
			alert('Capacity must be between 1 and 100');
			return;
		}
		
		isSubmittingEdit = true;
		
		try {
			const response = await fetch(`/api/tours/${tourId}/schedule/${slot.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					startTime: slot.startTime,
					endTime: slot.endTime,
					capacity: editCapacity,
					status: slot.status || 'available'
				})
			});
			
			if (!response.ok) throw new Error('Failed to update capacity');
			
			// Invalidate queries to refresh data immediately
			await queryClient.invalidateQueries({ 
				queryKey: queryKeys.tourSchedule(tourId),
				exact: true,
				refetchType: 'all'
			});
			
			cancelEdit();
			showInlineSuccess(slot.id, 'Updated');
		} catch (error) {
			console.error('Failed to update slot capacity:', error);
			alert('Failed to update capacity. Please try again.');
		} finally {
			isSubmittingEdit = false;
		}
	}
	
	async function toggleSlotStatus(slot: TimeSlot) {
		if (!tourId || isSubmittingEdit) return;
		
		const newStatus = slot.status === 'cancelled' ? 'available' : 'cancelled';
		
		// Warn if cancelling a slot with bookings
		if (newStatus === 'cancelled' && slot.bookedSpots > 0) {
			const confirmed = confirm(
				`This slot has ${slot.bookedSpots} booking(s). Cancelling will send cancellation emails to all customers. Continue?`
			);
			if (!confirmed) return;
		}
		
		isSubmittingEdit = true;
		
		try {
			const response = await fetch(`/api/tours/${tourId}/schedule/${slot.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					startTime: slot.startTime,
					endTime: slot.endTime,
					capacity: slot.capacity,
					status: newStatus
				})
			});
			
			if (!response.ok) throw new Error('Failed to update status');
			
			// Invalidate queries to refresh data immediately
			await queryClient.invalidateQueries({ 
				queryKey: queryKeys.tourSchedule(tourId),
				exact: true,
				refetchType: 'all'
			});
			
			showInlineSuccess(slot.id, newStatus === 'cancelled' ? 'Cancelled' : 'Reactivated');
		} catch (error) {
			console.error('Failed to update slot status:', error);
			alert('Failed to update status. Please try again.');
		} finally {
			isSubmittingEdit = false;
		}
	}
	
	function confirmDeleteSlot(slot: TimeSlot) {
		slotToDelete = slot;
	}
	
	async function deleteSlot() {
		if (!slotToDelete || !tourId || isDeleting) return;
		
		isDeleting = true;
		
		try {
			const response = await fetch(`/api/tours/${tourId}/schedule/${slotToDelete.id}`, {
				method: 'DELETE'
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete time slot');
			}
			
			// Invalidate queries to refresh data immediately
			await queryClient.invalidateQueries({ 
				queryKey: queryKeys.tourSchedule(tourId),
				exact: true,
				refetchType: 'all'
			});
			
			showInlineSuccess(slotToDelete.id, 'Deleted');
			slotToDelete = null;
		} catch (error) {
			console.error('Failed to delete slot:', error);
			alert('Failed to delete slot. Please try again.');
		} finally {
			isDeleting = false;
		}
	}
	
	function cancelDelete() {
		slotToDelete = null;
	}
	
	// Prefetch adjacent dates when view changes
	$effect(() => {
		if (!browser || isLoading || tourId) return; // Skip prefetching for tour-specific views
		
		// Prefetch adjacent periods for smoother navigation
		const prefetchDates: Date[] = [];
		
		if (view === 'day') {
			// Prefetch yesterday and tomorrow
			const yesterday = new Date(currentDate);
			yesterday.setDate(yesterday.getDate() - 1);
			prefetchDates.push(yesterday);
			
			const tomorrow = new Date(currentDate);
			tomorrow.setDate(tomorrow.getDate() + 1);
			prefetchDates.push(tomorrow);
		} else if (view === 'week') {
			// Prefetch previous and next week
			const prevWeek = new Date(currentDate);
			prevWeek.setDate(prevWeek.getDate() - 7);
			prefetchDates.push(prevWeek);
			
			const nextWeek = new Date(currentDate);
			nextWeek.setDate(nextWeek.getDate() + 7);
			prefetchDates.push(nextWeek);
		} else if (view === 'month') {
			// Prefetch previous and next month
			const prevMonth = new Date(currentDate);
			prevMonth.setMonth(prevMonth.getMonth() - 1);
			prefetchDates.push(prevMonth);
			
			const nextMonth = new Date(currentDate);
			nextMonth.setMonth(nextMonth.getMonth() + 1);
			prefetchDates.push(nextMonth);
		}
		
		// Prefetch adjacent dates
		prefetchDates.forEach(date => {
			queryClient.prefetchQuery({
				queryKey: queryKeys.allTimeSlots(view, date.toISOString()),
				queryFn: () => queryFunctions.fetchAllTimeSlots(view, date.toISOString()),
				staleTime: 5 * 60 * 1000, // 5 minutes
			});
		});
	});
	
	// Generate color for tour based on tour ID/name
	function getTourColor(tourId: string, tourName: string): string {
		// Use a hash function to generate consistent colors
		let hash = 0;
		const str = tourId + tourName;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) - hash) + str.charCodeAt(i);
			hash = hash & hash; // Convert to 32-bit integer
		}
		
		// Generate HSL color with good saturation and lightness
		const hue = Math.abs(hash) % 360;
		const saturation = 65 + (Math.abs(hash >> 8) % 20); // 65-85%
		const lightness = 45 + (Math.abs(hash >> 16) % 15); // 45-60%
		
		return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	}
	
	// Check if date is in the past
	function isPastDate(date: Date): boolean {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		date.setHours(0, 0, 0, 0);
		return date < today;
	}
	
	// State for calendar hover
	let hoveredDay: number | null = $state(null);
	let popoverPosition = $state({ x: 0, y: 0 });
	let popoverTimeout: ReturnType<typeof setTimeout> | null = null;
	let popoverAlignment = $state<'left' | 'center' | 'right'>('center');
	let popoverVerticalPosition = $state<'below' | 'above'>('below');
	
	// Helper to show popover with delay
	function showPopover(index: number, event: MouseEvent) {
		// Clear any existing timeout
		if (popoverTimeout) {
			clearTimeout(popoverTimeout);
			popoverTimeout = null;
		}
		
		const rect = (event.target as HTMLElement).getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const popoverWidth = 320; // max-width of popover
		const popoverEstimatedHeight = 400; // estimated max height
		
		// Calculate horizontal position and alignment
		let x = rect.left + rect.width / 2;
		let alignment: 'left' | 'center' | 'right' = 'center';
		
		// Check if popover would go off right edge
		if (x + popoverWidth / 2 > viewportWidth - 20) {
			// Align to right edge of day
			x = rect.right;
			alignment = 'right';
		} 
		// Check if popover would go off left edge
		else if (x - popoverWidth / 2 < 20) {
			// Align to left edge of day
			x = rect.left;
			alignment = 'left';
		}
		
		// Calculate vertical position
		let y = rect.bottom + 8;
		let verticalPosition: 'below' | 'above' = 'below';
		
		// Check if popover would go off bottom edge
		if (y + popoverEstimatedHeight > viewportHeight - 20) {
			// Show above the day instead
			y = rect.top - 8;
			verticalPosition = 'above';
		}
		
		hoveredDay = index;
		popoverPosition = { x, y };
		popoverAlignment = alignment;
		popoverVerticalPosition = verticalPosition;
	}
	
	// Helper to hide popover with delay
	function hidePopover() {
		// Add a small delay before hiding to allow mouse to move to popover
		popoverTimeout = setTimeout(() => {
			hoveredDay = null;
		}, 100);
	}
	
	// Clear timeout on unmount
	onDestroy(() => {
		if (popoverTimeout) {
			clearTimeout(popoverTimeout);
		}
	});
	
	// Quick add state
	let showQuickAdd = $state<string | null>(null); // Date string for the day being edited
	let quickSlot = $state({
		date: '',
		startTime: '10:00',
		endTime: '11:00'
	});
	let isCreatingQuickSlot = $state(false);
	let quickAddErrors = $state<string[]>([]);
	
	// Quick add functions
	function startQuickAdd(date: Date) {
		// Don't allow quick add if not in tour-specific view
		if (!tourId) {
			console.log('Quick add only available in tour-specific view');
			return;
		}
		
		const dateStr = date.toDateString();
		
		// Set default times based on existing slots on this day
		const existingSlots = getDaySlots(date);
		let defaultStart = '10:00';
		let defaultEnd = '11:00';
		
		if (existingSlots.length > 0) {
			// Find the next available hour after the last slot
			const lastSlot = existingSlots[existingSlots.length - 1];
			const lastEndTime = new Date(lastSlot.endTime);
			const nextHour = lastEndTime.getHours();
			const nextMinute = lastEndTime.getMinutes();
			
			// Start at the end of the last slot (or next quarter hour)
			const startTime = new Date(lastEndTime);
			if (nextMinute > 0) {
				// Round up to next quarter hour
				const minutesToAdd = 15 - (nextMinute % 15);
				startTime.setMinutes(nextMinute + minutesToAdd);
			}
			
			defaultStart = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
		}
		
		// Calculate end time based on tour duration
		const tourDuration = tour?.duration || 60; // Default to 60 minutes if no tour data
		const startTime = new Date(`2000-01-01T${defaultStart}`);
		const endTime = new Date(startTime.getTime() + (tourDuration * 60 * 1000)); // Add duration in milliseconds
		
		defaultEnd = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
		
		quickSlot = {
			date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`, // Local YYYY-MM-DD format
			startTime: defaultStart,
			endTime: defaultEnd
		};
		
		showQuickAdd = dateStr;
		quickAddErrors = [];
	}
	
	function cancelQuickAdd() {
		showQuickAdd = null;
		quickAddErrors = [];
	}
	
	function validateQuickSlot(): string[] {
		const errors: string[] = [];
		
		// Validate times
		if (quickSlot.startTime >= quickSlot.endTime) {
			errors.push('End time must be after start time');
		}
		
		// Check minimum duration (15 minutes)
		const start = new Date(`2000-01-01T${quickSlot.startTime}`);
		const end = new Date(`2000-01-01T${quickSlot.endTime}`);
		const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
		
		if (duration < 15) {
			errors.push('Minimum duration is 15 minutes');
		}
		
		if (duration > 480) { // 8 hours
			errors.push('Maximum duration is 8 hours');
		}
		
		// Check for overlaps with existing slots
		const selectedDate = new Date(quickSlot.date);
		const existingSlots = getDaySlots(selectedDate);
		
		const quickStart = new Date(`${quickSlot.date}T${quickSlot.startTime}`);
		const quickEnd = new Date(`${quickSlot.date}T${quickSlot.endTime}`);
		
		for (const slot of existingSlots) {
			const slotStart = new Date(slot.startTime);
			const slotEnd = new Date(slot.endTime);
			
			// Check for overlap
			if ((quickStart < slotEnd && quickEnd > slotStart)) {
				errors.push(`Time conflicts with existing slot: ${formatSlotTimeRange(slot.startTime, slot.endTime)}`);
				break;
			}
		}
		
		return errors;
	}
	
	async function saveQuickSlot() {
		if (!tourId || isCreatingQuickSlot) return;
		
		// Validate
		const errors = validateQuickSlot();
		if (errors.length > 0) {
			quickAddErrors = errors;
			return;
		}
		
		isCreatingQuickSlot = true;
		quickAddErrors = [];
		
		try {
			// Create the time slot
			const startDateTime = new Date(`${quickSlot.date}T${quickSlot.startTime}`);
			const endDateTime = new Date(`${quickSlot.date}T${quickSlot.endTime}`);
			
			const response = await fetch(`/api/tours/${tourId}/schedule`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					startTime: startDateTime.toISOString(),
					endTime: endDateTime.toISOString(),
					capacity: 10, // Default capacity, user can edit it afterward
					status: 'available'
				})
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to create time slot');
			}
			
			// Invalidate queries to refresh data immediately
			await queryClient.invalidateQueries({ 
				queryKey: queryKeys.tourSchedule(tourId),
				exact: true,
				refetchType: 'all'
			});
			
			// Close quick add form
			showQuickAdd = null;
			
			// Show success feedback
			const slotId = `quick-${Date.now()}`;
			showInlineSuccess(slotId, 'Slot created');
			
		} catch (error) {
			console.error('Failed to create quick slot:', error);
			quickAddErrors = [error instanceof Error ? error.message : 'Failed to create time slot'];
		} finally {
			isCreatingQuickSlot = false;
		}
	}
	
	function openAdvancedAdd(date: Date) {
		cancelQuickAdd();
		if (onQuickAdd) {
			onQuickAdd(date);
		}
	}
</script>

<div class="tour-timeline {compact ? 'compact' : ''}">
	<!-- Header -->
	{#if !hideHeader}
		<div class="timeline-header">
			{#if !hideHeaderText}
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
					<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
						<!-- Title with mobile view toggle -->
						<div class="flex items-center justify-between w-full">
							<h3 class="text-base sm:text-lg font-semibold" style="color: var(--text-primary);">
								{tourId ? 'Tour Schedule' : 'All Tours Schedule'}
							</h3>
							
							<!-- Mobile compact view toggle -->
							{#if !hideViewToggle}
								<div class="sm:hidden">
									<div class="mobile-view-toggle">
										<button
											onclick={(e) => { e.preventDefault(); e.stopPropagation(); view = 'month'; onViewChange?.('month'); }}
											class="mobile-view-btn {view === 'month' ? 'active' : ''}"
											type="button"
										>
											Month
										</button>
										<button
											onclick={(e) => { e.preventDefault(); e.stopPropagation(); view = 'week'; onViewChange?.('week'); }}
											class="mobile-view-btn {view === 'week' ? 'active' : ''}"
											type="button"
										>
											Week
										</button>
										<button
											onclick={(e) => { e.preventDefault(); e.stopPropagation(); view = 'day'; onViewChange?.('day'); }}
											class="mobile-view-btn {view === 'day' ? 'active' : ''}"
											type="button"
										>
											Day
										</button>
									</div>
								</div>
							{/if}
						</div>
					</div>
					
					<!-- Desktop view toggle -->
					{#if !hideViewToggle}
						<div class="hidden sm:flex items-center gap-2">
							<div class="view-toggle">
								<button
									onclick={() => { view = 'month'; onViewChange?.('month'); }}
									class="view-button {view === 'month' ? 'active' : ''}"
								>
									Month
								</button>
								<button
									onclick={() => { view = 'week'; onViewChange?.('week'); }}
									class="view-button {view === 'week' ? 'active' : ''}"
								>
									Week
								</button>
								<button
									onclick={() => { view = 'day'; onViewChange?.('day'); }}
									class="view-button {view === 'day' ? 'active' : ''}"
								>
									Day
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}
			
			<!-- Date Navigation - Always show unless hideHeader is true -->
			<div class="date-navigation {hideHeaderText ? 'standalone-navigation' : ''}">
				<button
					onclick={() => navigateDate('prev')}
					class="nav-button"
					aria-label="Previous {view}"
				>
					<ChevronLeft class="h-4 w-4" />
				</button>
				
				<div class="date-display">
					<span class="text-sm sm:text-base">{getDateRangeDisplay()}</span>
					{#if currentDate.toDateString() !== new Date().toDateString()}
						<button
							onclick={goToToday}
							class="today-button"
						>
							Today
						</button>
					{/if}
				</div>
				
				<button
					onclick={() => navigateDate('next')}
					class="nav-button"
					aria-label="Next {view}"
				>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
			
			<!-- View Toggle in standalone navigation (when header text is hidden) -->
			{#if hideHeaderText && !hideViewToggle}
				<div class="standalone-view-toggle">
					<!-- Mobile view toggle -->
					<div class="sm:hidden">
						<div class="mobile-view-toggle">
							<button
								onclick={(e) => { e.preventDefault(); e.stopPropagation(); view = 'month'; onViewChange?.('month'); }}
								class="mobile-view-btn {view === 'month' ? 'active' : ''}"
								type="button"
							>
								Month
							</button>
							<button
								onclick={(e) => { e.preventDefault(); e.stopPropagation(); view = 'week'; onViewChange?.('week'); }}
								class="mobile-view-btn {view === 'week' ? 'active' : ''}"
								type="button"
							>
								Week
							</button>
							<button
								onclick={(e) => { e.preventDefault(); e.stopPropagation(); view = 'day'; onViewChange?.('day'); }}
								class="mobile-view-btn {view === 'day' ? 'active' : ''}"
								type="button"
							>
								Day
							</button>
						</div>
					</div>
					
					<!-- Desktop view toggle -->
					<div class="hidden sm:flex items-center justify-center">
						<div class="view-toggle">
							<button
								onclick={() => { view = 'month'; onViewChange?.('month'); }}
								class="view-button {view === 'month' ? 'active' : ''}"
							>
								Month
							</button>
							<button
								onclick={() => { view = 'week'; onViewChange?.('week'); }}
								class="view-button {view === 'week' ? 'active' : ''}"
							>
								Week
							</button>
							<button
								onclick={() => { view = 'day'; onViewChange?.('day'); }}
								class="view-button {view === 'day' ? 'active' : ''}"
							>
								Day
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
	
	<!-- Content -->
	<div class="timeline-content" class:loading={isLoading}>

		
		{#if isLoading}
			<div class="loading-state">
				<div class="loading-placeholder">
					<!-- Maintain height based on view type -->
					{#if view === 'month'}
						<!-- Show calendar skeleton -->
						<div class="calendar-skeleton">
							<div class="calendar-grid">
								{#each Array(7) as _}
									<div class="weekday-skeleton"></div>
								{/each}
								{#each Array(35) as _}
									<div class="day-skeleton"></div>
								{/each}
							</div>
						</div>
					{:else}
						<!-- Show list skeleton -->
						<div class="list-skeleton">
							{#each Array(3) as _}
								<div class="slot-skeleton"></div>
							{/each}
						</div>
					{/if}
				</div>
				<div class="loading-overlay">
					<div class="animate-spin h-8 w-8 rounded-full border-2" 
						style="border-color: var(--border-secondary); border-top-color: var(--text-secondary);">
					</div>
					<p class="text-sm mt-4" style="color: var(--text-secondary);">Loading timeline...</p>
				</div>
			</div>
		{:else if error}
			<div class="error-state">
				<AlertCircle class="h-8 w-8 mb-2" style="color: var(--color-error);" />
				<p style="color: var(--text-primary);">Failed to load timeline</p>
				<p class="text-sm mt-1" style="color: var(--text-secondary);">Please try again</p>
			</div>
		{:else if (view === 'day' || view === 'week') && slotsByDate.length === 0}
			<div class="empty-state">
				<Calendar class="h-12 w-12 mb-3" style="color: var(--text-tertiary);" />
				<p class="text-lg mb-1" style="color: var(--text-primary);">
					{#if view === 'day'}
						No tours on this day
					{:else}
						No tours this week
					{/if}
				</p>

			</div>
		{:else if view === 'day' || view === 'week'}
			<!-- List View for Day/Week -->
			<div class="timeline-list">
				{#each slotsByDate as [dateKey, slots]}
					<div class="date-group">
						<h4 class="date-header">
							{new Date(dateKey).toLocaleDateString('en-US', { 
								weekday: 'long', 
								month: 'short', 
								day: 'numeric' 
							})}
						</h4>
						
						<div class="slots-list">
							{#each slots as slot}
								{#if editingSlot === slot.id}
									<!-- Div when editing to allow buttons to work -->
									<div class="slot-item {getSlotStatusClass(slot)} {slot.status === 'cancelled' ? 'cancelled-slot' : ''} editing">
										<div class="slot-time">
											<Clock class="h-4 w-4" />
											<span>{formatSlotTimeRange(slot.startTime, slot.endTime)}</span>
										</div>
										
										<div class="slot-info">
											<h5 class="tour-name">{slot.tourName}</h5>
											<div class="slot-details">
												<div class="detail-item">
													<Users class="h-3 w-3" />
													<div class="capacity-edit">
														<input
															type="number"
															bind:value={editCapacity}
															min={slot.bookedSpots}
															max="100"
															class="capacity-input"
														/>
														<Tooltip text="Save changes">
															<button
																onclick={() => saveCapacity(slot)}
																class="save-btn"
																disabled={isSubmittingEdit}
															>
																{#if isSubmittingEdit}
																	<div class="animate-spin h-3 w-3 rounded-full border border-current border-t-transparent"></div>
																{:else}
																	<Check class="h-3 w-3" />
																{/if}
															</button>
														</Tooltip>
														<Tooltip text="Cancel editing">
															<button
																onclick={cancelEdit}
																class="cancel-btn"
															>
																<X class="h-3 w-3" />
															</button>
														</Tooltip>
													</div>
												</div>
												{#if slot.totalRevenue > 0}
													<div class="detail-item">
														<span>{$globalCurrencyFormatter(slot.totalRevenue)}</span>
													</div>
												{/if}
												<div class="utilization-bar">
													<div 
														class="utilization-fill"
														style="width: {slot.utilizationRate}%; background-color: {getUtilizationColor(slot.utilizationRate)};"
													></div>
												</div>
											</div>
										</div>
										
										<div class="slot-actions">
											{#if recentlyUpdated[slot.id]}
												<span class="success-badge">
													<Check class="h-3 w-3" />
													{recentlyUpdated[slot.id]}
												</span>
											{:else}
												{#if slot.isToday && !slot.isPast}
													<span class="today-badge">Today</span>
												{/if}
												{#if slot.isFull}
													<span class="full-badge">Full</span>
												{/if}
												{#if slot.status === 'cancelled'}
													<span class="cancelled-badge">Cancelled</span>
												{/if}
											{/if}
										</div>
									</div>
								{:else}
									<!-- Button when not editing -->
									<button
										onclick={() => handleSlotClick(slot)}
										class="slot-item {getSlotStatusClass(slot)} {slot.status === 'cancelled' ? 'cancelled-slot' : ''}"
									>
										{#if !tourId}
											<div 
												class="tour-color-indicator"
												style="background-color: {getTourColor(slot.tourId, slot.tourName)}"
											></div>
										{/if}
										<div class="slot-time">
											<Clock class="h-4 w-4" />
											<span>{formatSlotTimeRange(slot.startTime, slot.endTime)}</span>
										</div>
										
										<div class="slot-info">
											<h5 class="tour-name">{slot.tourName}</h5>
											<div class="slot-details">
												<div class="detail-item">
													<Users class="h-3 w-3" />
													<span>{slot.bookedSpots}/{slot.capacity}</span>
												</div>
												{#if slot.totalRevenue > 0}
													<div class="detail-item">
														<span>{$globalCurrencyFormatter(slot.totalRevenue)}</span>
													</div>
												{/if}
												<div class="utilization-bar">
													<div 
														class="utilization-fill"
														style="width: {slot.utilizationRate}%; background-color: {getUtilizationColor(slot.utilizationRate)};"
													></div>
												</div>
											</div>
										</div>
										
										<div class="slot-actions">
											{#if recentlyUpdated[slot.id]}
												<span class="success-badge">
													<Check class="h-3 w-3" />
													{recentlyUpdated[slot.id]}
												</span>
											{:else}
												{#if slot.isToday && !slot.isPast}
													<span class="today-badge">Today</span>
												{/if}
												{#if slot.isFull}
													<span class="full-badge">Full</span>
												{/if}
												{#if slot.status === 'cancelled'}
													<span class="cancelled-badge">Cancelled</span>
												{/if}
												
												<!-- Quick edit actions (only show for tour-specific view) -->
												{#if tourId}
													<div class="quick-actions" role="group" aria-label="Quick actions">
														<!-- Delete slot - only show if no bookings -->
														{#if slot.bookedSpots === 0}
															<Tooltip text="Delete time slot">
																<button
																	onclick={(e) => { e.stopPropagation(); confirmDeleteSlot(slot); }}
																	class="quick-action-btn delete-btn"
																	disabled={isSubmittingEdit || isDeleting}
																>
																	{#if isDeleting && slotToDelete?.id === slot.id}
																		<div class="animate-spin h-3 w-3 rounded-full border border-current border-t-transparent"></div>
																	{:else}
																		<Trash2 class="h-3 w-3" />
																	{/if}
																</button>
															</Tooltip>
														{/if}
														
														<!-- Status toggle -->
														<Tooltip text={slot.status === 'cancelled' ? 'Reactivate slot' : 'Cancel slot'}>
															<button
																onclick={(e) => { e.stopPropagation(); toggleSlotStatus(slot); }}
																class="quick-action-btn status-btn"
																disabled={isSubmittingEdit}
															>
																{#if isSubmittingEdit}
																	<div class="animate-spin h-3 w-3 rounded-full border border-current border-t-transparent"></div>
																{:else if slot.status === 'cancelled'}
																	<Play class="h-3 w-3" />
																{:else}
																	<Pause class="h-3 w-3" />
																{/if}
															</button>
														</Tooltip>
														
														<!-- Capacity edit -->
														{#if slot.status !== 'cancelled'}
															<Tooltip text="Edit capacity">
																<button
																	onclick={(e) => { e.stopPropagation(); startEditCapacity(slot); }}
																	class="quick-action-btn capacity-btn"
																>
																	<Edit3 class="h-3 w-3" />
																</button>
															</Tooltip>
														{/if}
													</div>
												{/if}
												
																				<!-- Show navigation indicator in dashboard view (all tours) -->
												{#if !tourId}
									<div class="navigation-indicator">
										<ChevronRight class="h-3 w-3" style="color: var(--text-tertiary);" />
									</div>
												{/if}
											{/if}
										</div>
									</button>
								{/if}
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Calendar View for Month -->
			<div class="calendar-view">

				
				<div class="calendar-grid">
					<!-- Weekday headers -->
					{#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as day}
						<div class="weekday-header">{day}</div>
					{/each}
					
					<!-- Calendar days -->
					{#each Array(42) as _, i}
						{@const dayDate = getCalendarDay(i)}
						{@const daySlots = dayDate ? getDaySlots(dayDate) : []}
						{@const isToday = dayDate?.toDateString() === new Date().toDateString()}
						{@const isCurrentMonth = dayDate?.getMonth() === currentDate.getMonth()}
						{@const isPast = dayDate ? isPastDate(new Date(dayDate)) : false}
						{@const isWeekend = dayDate ? (dayDate.getDay() === 0 || dayDate.getDay() === 6) : false}
						
						<div 
							class="calendar-day"
							class:other-month={dayDate && !isCurrentMonth}
							class:today={isToday}
							class:has-slots={daySlots.length > 0}
							class:past-day={isPast}
							class:weekend={isWeekend}
							class:quick-add-active={showQuickAdd === dayDate?.toDateString()}
							onclick={daySlots.length > 0 && !isPast ? () => dayDate && handleDayClick(dayDate, daySlots) : 
									(daySlots.length === 0 && !isPast && (tourId || onQuickAdd) ? () => dayDate && handleDayClick(dayDate, daySlots) : undefined)}
							onkeydown={(e) => {
								if ((e.key === 'Enter' || e.key === ' ') && dayDate && !isPast) {
									e.preventDefault();
									if (daySlots.length > 0 || tourId || onQuickAdd) {
										handleDayClick(dayDate, daySlots);
									}
								}
							}}
							onmouseenter={(e) => {
								// Only show popover on desktop (not mobile)
								if (dayDate && daySlots.length > 0 && window.innerWidth >= 640) {
									showPopover(i, e);
								}
							}}
							onmouseleave={() => {
								if (window.innerWidth >= 640) {
									hidePopover();
								}
							}}
							role={daySlots.length > 0 || ((tourId || onQuickAdd) && !isPast) ? "button" : "gridcell"}
							{...(daySlots.length > 0 || ((tourId || onQuickAdd) && !isPast) ? { tabindex: 0 } : {})}
							aria-label={dayDate && daySlots.length > 0 ? `${dayDate.toLocaleDateString()} - ${daySlots.length} tour slots` : 
									   dayDate && (tourId || onQuickAdd) && !isPast ? `${dayDate.toLocaleDateString()} - Click to add time slot` :
									   dayDate?.getDate().toString()}
						>
							{#if dayDate}
								<div class="day-number">{dayDate.getDate()}</div>
								
																{#if showQuickAdd === dayDate.toDateString()}
									{@const isRightEdge = i % 7 === 6}
									{@const isLeftEdge = i % 7 === 0}
									{@const tooltipPosition = isRightEdge ? 'top-left' : isLeftEdge ? 'top-right' : 'top'}
									<!-- Quick Add Form -->
									<form class="quick-add-form" onsubmit={(e) => { e.preventDefault(); saveQuickSlot(); }}>
										<div class="quick-add-inputs">
											<Tooltip text="Start time (click clock to pick)" position={tooltipPosition}>
												<input
													type="time"
													bind:value={quickSlot.startTime}
													class="time-input"
													step="900"
													style="position: relative;"
												/>
											</Tooltip>
											<span class="time-separator">-</span>
											<Tooltip text="End time (click clock to pick)" position={tooltipPosition}>
												<input
													type="time"
													bind:value={quickSlot.endTime}
													class="time-input"
													step="900"
													style="position: relative;"
												/>
											</Tooltip>
										</div>
										
										{#if quickAddErrors.length > 0}
											<div class="quick-add-errors">
												{#each quickAddErrors as error}
													<div class="error-text">{error}</div>
												{/each}
											</div>
										{/if}
										
										<div class="quick-add-actions">
											<Tooltip text="Save time slot" position={tooltipPosition}>
												<button
													type="button"
													onclick={(e) => { e.stopPropagation(); saveQuickSlot(); }}
													class="quick-add-btn save"
													disabled={isCreatingQuickSlot}
												>
													{#if isCreatingQuickSlot}
														<div class="spinner-sm"></div>
													{:else}
														<Check class="h-3 w-3" />
													{/if}
												</button>
											</Tooltip>
											<Tooltip text="Advanced options" position={tooltipPosition}>
												<button
													type="button"
													onclick={(e) => { e.stopPropagation(); openAdvancedAdd(dayDate); }}
													class="quick-add-btn advanced"
												>
													<Plus class="h-3 w-3" />
												</button>
											</Tooltip>
											<Tooltip text="Cancel" position={tooltipPosition}>
												<button
													type="button"
													onclick={(e) => { e.stopPropagation(); cancelQuickAdd(); }}
													class="quick-add-btn cancel"
												>
													<X class="h-3 w-3" />
												</button>
											</Tooltip>
										</div>
									</form>
								{:else if daySlots.length > 0}
									<div class="day-slots">
										{#if tourId}
											<!-- Single tour - show colored dots based on bookings and utilization -->
											<div class="tour-dots">
												{#each daySlots.slice(0, 3) as slot}
													<div 
														class="tour-dot"
														style="background-color: {getSlotColor(slot)}"
													></div>
												{/each}
												{#if daySlots.length > 3}
													<span class="more-tours">+{daySlots.length - 3}</span>
												{/if}
											</div>
										{:else}
											<!-- Multiple tours - show color dots -->
											<div class="tour-dots">
												{#each daySlots.slice(0, 3) as slot}
													<div 
														class="tour-dot"
														style="background-color: {getTourColor(slot.tourId, slot.tourName)}"
													></div>
												{/each}
												{#if daySlots.length > 3}
													<span class="more-tours">+{daySlots.length - 3}</span>
												{/if}
											</div>
										{/if}
									</div>
								{:else if tourId && !isPast}
									<!-- Empty day with quick add hint -->
									<div class="empty-day-hint">
										<Plus class="h-3 w-3" style="color: var(--text-tertiary);" />
									</div>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
				
				<!-- Hover popover - moved outside calendar grid -->
				{#if hoveredDay !== null}
					{@const dayDate = getCalendarDay(hoveredDay)}
					{@const daySlots = dayDate ? getDaySlots(dayDate) : []}
					{#if dayDate && daySlots.length > 0}
						<div 
							class="day-popover hidden sm:block {popoverAlignment} {popoverVerticalPosition}"
							role="tooltip"
							style="
								position: fixed;
								{popoverAlignment === 'center' ? `left: ${popoverPosition.x}px;` : 
								 popoverAlignment === 'left' ? `left: ${popoverPosition.x}px;` : 
								 `right: ${window.innerWidth - popoverPosition.x}px;`}
								{popoverVerticalPosition === 'below' ? `top: ${popoverPosition.y}px;` : `bottom: ${window.innerHeight - popoverPosition.y}px;`}
								{popoverAlignment === 'center' ? 'transform: translateX(-50%);' : ''}
							"
							onmouseenter={() => {
								// Clear hide timeout when mouse enters popover
								if (popoverTimeout) {
									clearTimeout(popoverTimeout);
									popoverTimeout = null;
								}
							}}
							onmouseleave={() => {
								hidePopover();
							}}
						>
							<div class="popover-header">
								{dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
							</div>
							<div class="popover-content">
								{#each daySlots as slot}
									<div class="popover-slot">
										<div class="popover-slot-header">
											<div 
												class="popover-tour-dot"
												style="background-color: {tourId ? getSlotColor(slot) : getTourColor(slot.tourId, slot.tourName)}"
											></div>
											<span class="popover-tour-name">{slot.tourName}</span>
										</div>
										<div class="popover-slot-info">
											<span class="popover-time">
												<Clock class="h-3 w-3" />
												{formatSlotTimeRange(slot.startTime, slot.endTime)}
											</span>
											<span class="popover-capacity">
												<Users class="h-3 w-3" />
												{slot.bookedSpots}/{slot.capacity}
											</span>
										</div>
										{#if slot.isFull}
											<span class="popover-full">FULL</span>
										{:else if slot.status === 'cancelled'}
											<span class="popover-cancelled">CANCELLED</span>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if slotToDelete}
	<div class="modal-overlay" onclick={cancelDelete} onkeydown={(e) => e.key === 'Escape' && cancelDelete()} role="presentation" tabindex="-1">
		<div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-labelledby="delete-modal-title" tabindex="-1">
			<div class="modal-header">
				<h3 class="modal-title" id="delete-modal-title">Delete Time Slot</h3>
				<button onclick={cancelDelete} class="modal-close">
					<X class="h-4 w-4" />
				</button>
			</div>
			
			<div class="modal-body">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style="background: var(--color-error-100);">
						<Trash2 class="h-5 w-5" style="color: var(--color-error-600);" />
					</div>
					<div class="flex-1">
						<p class="font-medium mb-2" style="color: var(--text-primary);">
							Are you sure you want to delete this time slot?
						</p>
						<div class="mb-3 p-3 rounded-lg" style="background: var(--bg-secondary);">
							<div class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);">
								<Clock class="h-4 w-4" />
								<span>{formatSlotTimeRange(slotToDelete.startTime, slotToDelete.endTime)}</span>
							</div>
							<div class="flex items-center gap-2 text-sm mt-1" style="color: var(--text-secondary);">
								<Users class="h-4 w-4" />
								<span>Capacity: {slotToDelete.capacity}</span>
							</div>
						</div>
						<p class="text-sm" style="color: var(--text-secondary);">
							This action cannot be undone. The time slot will be permanently deleted.
						</p>
					</div>
				</div>
			</div>
			
			<div class="modal-footer">
				<button onclick={cancelDelete} class="button-secondary">
					Cancel
				</button>
				<button 
					onclick={deleteSlot}
					class="button-danger"
					disabled={isDeleting}
				>
					{#if isDeleting}
						<div class="animate-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent mr-2"></div>
						Deleting...
					{:else}
						Delete Slot
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Delete confirmation modal styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}
	
	.modal-content {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 12px;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}
	
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: between;
		padding: 1.5rem 1.5rem 0 1.5rem;
		border-bottom: 1px solid var(--border-primary);
		padding-bottom: 1rem;
	}
	
	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		flex: 1;
	}
	
	.modal-close {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		transition: all 0.2s ease;
	}
	
	.modal-close:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}
	
	.modal-body {
		padding: 1.5rem;
	}
	
	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 0 1.5rem 1.5rem 1.5rem;
	}
	
	/* Quick action button styles for delete */
	:global(.quick-action-btn.delete-btn) {
		color: var(--color-error-600) !important;
	}
	
	:global(.quick-action-btn.delete-btn:hover) {
		background: var(--color-error-100) !important;
		color: var(--color-error-700) !important;
	}

	/* Quick Add Styles */
	.calendar-day.quick-add-active {
		background: var(--color-primary-50);
		border-color: var(--color-primary-300);
		box-shadow: 0 0 0 2px var(--color-primary-200);
	}
	
	.empty-day-hint {
		position: absolute;
		bottom: 2px;
		right: 2px;
		opacity: 0;
		transition: opacity 0.2s ease;
	}
	
	.calendar-day:hover .empty-day-hint {
		opacity: 0.6;
	}
	
	.calendar-day[role="button"] {
		cursor: pointer;
	}
	
	.calendar-day[role="button"]:hover:not(.has-slots) {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
	}
	
	.quick-add-form {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--bg-primary) !important;
		border: 2px solid var(--color-primary-400) !important;
		border-radius: 4px;
		padding: 3px;
		z-index: 15;
		display: flex;
		flex-direction: column;
		gap: 2px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(4px);
		min-width: 90px;
		min-height: 60px;
	}
	
	.quick-add-inputs {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 3px;
		font-size: 10px;
		flex: 1;
	}
	
	/* High specificity selectors to override everything */
	.quick-add-form input[type="time"].time-input,
	input[type="time"].time-input.time-input {
		position: relative !important;
		flex: 1 !important;
		padding: 2px 16px 2px 3px !important;
		border: 1px solid var(--border-primary) !important;
		border-radius: 3px !important;
		font-size: 9px !important;
		background: var(--bg-primary) !important;
		background-color: var(--bg-primary) !important;
		color: var(--text-primary) !important;
		min-width: 45px !important;
		width: auto !important;
		max-width: 55px !important;
		font-family: var(--font-mono, monospace) !important;
		font-weight: 400 !important;
		line-height: 1.2 !important;
		box-sizing: border-box !important;
		text-align: left !important;
		cursor: text !important;
		height: 18px !important;
		margin: 0 !important;
	}
	
	.time-input:focus {
		outline: none;
		border-color: var(--color-primary-400);
		box-shadow: 0 0 0 1px var(--color-primary-200);
	}
	
	.time-separator {
		color: var(--text-secondary) !important;
		font-size: 9px;
		flex-shrink: 0;
		font-weight: 600;
		user-select: none;
		margin: 0 1px;
	}
	
	.quick-add-actions {
		display: flex;
		gap: 2px;
		justify-content: center;
		flex-shrink: 0;
	}
	
	.quick-add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border: 1px solid var(--border-primary) !important;
		border-radius: 3px;
		background: var(--bg-primary) !important;
		color: var(--text-primary) !important;
		cursor: pointer;
		transition: all 0.15s ease;
		padding: 0;
		font-family: inherit;
		font-size: 0;
		flex-shrink: 0;
	}
	
	.quick-add-btn:hover {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
	}
	
	.quick-add-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.quick-add-btn.save {
		background: var(--color-success-100);
		border-color: var(--color-success-300);
		color: var(--color-success-700);
	}
	
	.quick-add-btn.save:hover:not(:disabled) {
		background: var(--color-success-200);
		border-color: var(--color-success-400);
	}
	
	.quick-add-btn.advanced {
		background: var(--color-primary-100);
		border-color: var(--color-primary-300);
		color: var(--color-primary-700);
	}
	
	.quick-add-btn.advanced:hover {
		background: var(--color-primary-200);
		border-color: var(--color-primary-400);
	}
	
	.quick-add-btn.cancel {
		background: var(--color-error-100);
		border-color: var(--color-error-300);
		color: var(--color-error-700);
	}
	
	.quick-add-btn.cancel:hover {
		background: var(--color-error-200);
		border-color: var(--color-error-400);
	}
	
	.quick-add-errors {
		font-size: 8px;
		color: var(--color-error-600);
		background: var(--color-error-50);
		border: 1px solid var(--color-error-200);
		border-radius: 3px;
		padding: 2px 4px;
		margin: 2px 0;
	}
	
	.error-text {
		line-height: 1.2;
		margin: 1px 0;
	}
	
	.spinner-sm {
		width: 12px;
		height: 12px;
		border: 1px solid var(--border-secondary);
		border-top: 1px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	/* Clock icon styling with proper visibility */
	input[type="time"].time-input::-webkit-calendar-picker-indicator {
		display: block !important;
		opacity: 1 !important;
		cursor: pointer !important;
		width: 7px !important;
		height: 7px !important;
		background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>') !important;
		background-repeat: no-repeat !important;
		background-position: center !important;
		background-size: contain !important;
		-webkit-appearance: none !important;
		position: absolute !important;
		right: 3px !important;
		top: 50% !important;
		transform: translateY(-50%) !important;
	}
	
	/* Other webkit controls */
	input[type="time"].time-input::-webkit-inner-spin-button,
	input[type="time"].time-input::-webkit-outer-spin-button,
	input[type="time"].time-input::-webkit-clear-button {
		-webkit-appearance: auto !important;
		display: block !important;
		opacity: 1 !important;
		cursor: pointer !important;
	}
	
	/* Style datetime editing parts with high specificity */
	.quick-add-form input[type="time"].time-input::-webkit-datetime-edit,
	.quick-add-form input[type="time"].time-input::-webkit-datetime-edit-fields-wrapper,
	.quick-add-form input[type="time"].time-input::-webkit-datetime-edit-text,
	.quick-add-form input[type="time"].time-input::-webkit-datetime-edit-hour-field,
	.quick-add-form input[type="time"].time-input::-webkit-datetime-edit-minute-field,
	input[type="time"].time-input.time-input::-webkit-datetime-edit,
	input[type="time"].time-input.time-input::-webkit-datetime-edit-fields-wrapper,
	input[type="time"].time-input.time-input::-webkit-datetime-edit-text,
	input[type="time"].time-input.time-input::-webkit-datetime-edit-hour-field,
	input[type="time"].time-input.time-input::-webkit-datetime-edit-minute-field {
		color: var(--text-primary) !important;
		background: transparent !important;
		padding: 0 !important;
		margin: 0 !important;
		font-family: var(--font-mono, monospace) !important;
		font-size: 10px !important;
	}

	/* Mobile responsive adjustments */
	@media (max-width: 640px) {
		
		/* Mobile quick add form - compact but usable */
		.quick-add-form {
			position: fixed !important;
			top: 50% !important;
			left: 50% !important;
			right: auto !important;
			bottom: auto !important;
			transform: translate(-50%, -50%) !important;
			width: 240px !important;
			height: auto !important;
			padding: 14px !important;
			gap: 10px !important;
			border-radius: 10px !important;
			box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4) !important;
			z-index: 1000 !important;
			backdrop-filter: blur(8px);
		}
		
		.quick-add-inputs {
			font-size: 14px !important;
			gap: 8px !important;
			align-items: center;
			justify-content: center;
		}
		
		.quick-add-form input[type="time"].time-input,
		input[type="time"].time-input.time-input {
			position: relative !important;
			padding: 8px 20px 8px 6px !important;
			font-size: 14px !important;
			min-width: 80px !important;
			width: 80px !important;
			max-width: 80px !important;
			height: 32px !important;
			border-radius: 6px !important;
			line-height: 1.3 !important;
			border-width: 1px !important;
			text-align: left !important;
		}
		
		/* Appropriately sized clock icon for mobile */
		input[type="time"].time-input::-webkit-calendar-picker-indicator {
			width: 12px !important;
			height: 12px !important;
			background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>') !important;
			right: 4px !important;
		}
		
		/* Dark mode mobile clock icon */
		[data-theme="dark"] input[type="time"].time-input::-webkit-calendar-picker-indicator {
			background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%23aaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>') !important;
		}
		
		/* Mobile time text styling - appropriately sized */
		.quick-add-form input[type="time"].time-input::-webkit-datetime-edit,
		.quick-add-form input[type="time"].time-input::-webkit-datetime-edit-fields-wrapper,
		.quick-add-form input[type="time"].time-input::-webkit-datetime-edit-text,
		.quick-add-form input[type="time"].time-input::-webkit-datetime-edit-hour-field,
		.quick-add-form input[type="time"].time-input::-webkit-datetime-edit-minute-field {
			font-size: 14px !important;
			font-family: var(--font-mono, monospace) !important;
			color: var(--text-primary) !important;
		}
		
		.time-separator {
			font-size: 16px !important;
			font-weight: 600 !important;
			margin: 0 2px !important;
		}
		
		.quick-add-btn {
			width: 32px !important;
			height: 32px !important;
			border-radius: 6px !important;
			min-width: 32px !important;
			border-width: 1px !important;
		}
		
		.quick-add-actions {
			gap: 6px !important;
			justify-content: center;
			margin-top: 4px;
		}
		
		.quick-add-errors {
			font-size: 12px !important;
			padding: 6px !important;
			line-height: 1.3;
			border-radius: 6px !important;
		}
		
		/* Mobile backdrop overlay */
		.calendar-day.quick-add-active::before {
			content: '';
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.5);
			z-index: 999;
		}
		

	}
	
	/* Mobile view toggle styles */
	.mobile-view-toggle {
		display: flex;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		padding: 0.125rem;
		gap: 0.125rem;
	}
	
	.mobile-view-btn {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: all 0.15s ease;
		user-select: none;
	}
	
	.mobile-view-btn:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}
	
	.mobile-view-btn.active {
		background: var(--color-primary-500);
		color: white;
		font-weight: 600;
	}
	
	/* Dark mode */
	[data-theme="dark"] .mobile-view-toggle {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
	}
	
	[data-theme="dark"] .mobile-view-btn {
		color: var(--text-secondary);
	}
	
	[data-theme="dark"] .mobile-view-btn:hover {
		background: var(--bg-quaternary);
		color: var(--text-primary);
	}
	
	[data-theme="dark"] .mobile-view-btn.active {
		background: var(--color-primary-600);
		color: white;
	}

	/* Dark mode specific fixes */
	[data-theme="dark"] .time-input {
		background: var(--bg-primary) !important;
		color: var(--text-primary) !important;
		border-color: var(--border-primary) !important;
	}
	
	[data-theme="dark"] .time-input:focus {
		border-color: var(--color-primary-500) !important;
		box-shadow: 0 0 0 2px var(--color-primary-200) !important;
	}
	
	/* Dark mode clock icon */
	[data-theme="dark"] input[type="time"].time-input::-webkit-calendar-picker-indicator {
		background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="%23aaa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>') !important;
	}
	
	/* Hide popover on mobile devices */
	@media (max-width: 639px) {
		.day-popover {
			display: none !important;
		}
	}
	
	[data-theme="dark"] .quick-add-form {
		background: var(--bg-primary) !important;
		border-color: var(--color-primary-400) !important;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
	}
	
	[data-theme="dark"] .time-separator {
		color: var(--text-secondary) !important;
	}
	
	[data-theme="dark"] .quick-add-errors {
		color: var(--color-error-300) !important;
		background: var(--color-error-900) !important;
		border-color: var(--color-error-600) !important;
	}
</style> 
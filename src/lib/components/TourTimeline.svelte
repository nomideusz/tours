<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { updateTimeSlotMutation } from '$lib/queries/mutations.js';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import { onMount } from 'svelte';
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
	import MapPin from 'lucide-svelte/icons/map-pin';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import QrCode from 'lucide-svelte/icons/qr-code';
	
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
		defaultView = 'week'
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
	let dateString = $derived(currentDate.toISOString());
	
	// Query for timeline data - make reactive to date and view changes
	let timelineQuery = $derived(createQuery({
		queryKey: tourId 
			? ['tour-schedule', tourId]
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
		refetchOnWindowFocus: true, // Enable window focus refetching for live updates
		refetchOnMount: 'always', // Always refetch on mount
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
					// Show only slots for the current day
					return slotDate.toDateString() === currentDate.toDateString();
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
			const dateKey = date.toDateString();
			
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
	
	// Handle slot click
	function handleSlotClick(slot: TimeSlot) {
		if (onSlotClick) {
			onSlotClick(slot);
		} else {
			// Default: navigate to tour details
			goto(`/tours/${slot.tourId}`);
		}
	}
	
	// Handle day click in calendar view
	function handleDayClick(date: Date, slots: TimeSlot[]) {
		if (slots.length === 0) return;
		
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
		const dateStr = date.toDateString();
		// Use processedTimeSlots to ensure utilizationRate is calculated
		return processedTimeSlots.filter((slot: TimeSlot) => new Date(slot.startTime).toDateString() === dateStr);
	}
	
	function getDayColor(slots: TimeSlot[]): string {
		if (slots.length === 0) return 'transparent';
		const avgUtilization = slots.reduce((sum, s) => sum + s.utilizationRate, 0) / slots.length;
		return getUtilizationColor(avgUtilization);
	}
	
	// Get query client for prefetching
	const queryClient = useQueryClient();
	
	// Quick edit state
	let editingSlot = $state<string | null>(null);
	let editCapacity = $state<number>(0);
	let isSubmittingEdit = $state(false);
	let recentlyUpdated = $state<{[key: string]: string}>({});
	
	// Initialize update mutation for tour-specific edits
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
			
			// Invalidate queries to refresh data
			await queryClient.invalidateQueries({ queryKey: ['tour-schedule', tourId] });
			
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
			
			// Invalidate queries to refresh data
			await queryClient.invalidateQueries({ queryKey: ['tour-schedule', tourId] });
			
			showInlineSuccess(slot.id, newStatus === 'cancelled' ? 'Cancelled' : 'Reactivated');
		} catch (error) {
			console.error('Failed to update slot status:', error);
			alert('Failed to update status. Please try again.');
		} finally {
			isSubmittingEdit = false;
		}
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
</script>

<div class="tour-timeline {compact ? 'compact' : ''}">
	<!-- Header -->
	{#if !hideHeader}
		<div class="timeline-header">
			{#if !hideHeaderText}
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
					<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
						<h3 class="text-base sm:text-lg font-semibold" style="color: var(--text-primary);">
							{tourId ? 'Tour Schedule' : 'All Tours Schedule'}
						</h3>
						{#if !isLoading && !hideStats && stats.totalSlots > 0}
							<div class="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm" style="color: var(--text-secondary);">
								<span>{stats.totalSlots} slots</span>
								<span class="hidden sm:inline">•</span>
								<span class="hidden sm:inline">{stats.totalBookings} bookings</span>
								<span>•</span>
								<span>{Math.round(stats.averageUtilization)}% avg</span>
							</div>
						{/if}
					</div>
					
					<!-- View Toggle -->
					{#if !hideViewToggle}
						<div class="flex items-center gap-2">
							<div class="view-toggle">
								<button
									onclick={() => { view = 'day'; onViewChange?.('day'); }}
									class="view-button {view === 'day' ? 'active' : ''}"
								>
									<span class="hidden sm:inline">Day</span>
									<span class="sm:hidden">D</span>
								</button>
								<button
									onclick={() => { view = 'week'; onViewChange?.('week'); }}
									class="view-button {view === 'week' ? 'active' : ''}"
								>
									<span class="hidden sm:inline">Week</span>
									<span class="sm:hidden">W</span>
								</button>
								<button
									onclick={() => { view = 'month'; onViewChange?.('month'); }}
									class="view-button {view === 'month' ? 'active' : ''}"
								>
									<span class="hidden sm:inline">Month</span>
									<span class="sm:hidden">M</span>
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}
			
			<!-- Date Navigation - Always show unless hideHeader is true -->
			<div class="date-navigation {hideHeaderText ? 'standalone-navigation' : ''}">
				<!-- Back to month button for compact mode when not in month view -->
				{#if compact && hideViewToggle && view !== 'month'}
					<button
						onclick={() => { view = 'month'; onViewChange?.('month'); }}
						class="back-to-month-button"
						aria-label="Back to month view"
						title="Back to month view"
					>
						<Calendar class="h-3 w-3" />
					</button>
				{/if}
				
				<button
					onclick={() => navigateDate('prev')}
					class="nav-button"
					aria-label="Previous {view}"
				>
					<ChevronLeft class="h-4 w-4" />
				</button>
				
				<div class="date-display">
					<span class="text-sm sm:text-base">{getDateRangeDisplay()}</span>
					{#if compact && hideViewToggle && view !== 'month'}
						<span class="view-indicator">{view}</span>
					{/if}
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
		{:else if timeSlots.length === 0}
			<div class="empty-state">
				<Calendar class="h-12 w-12 mb-3" style="color: var(--text-tertiary);" />
				<p class="text-lg mb-1" style="color: var(--text-primary);">No tours scheduled</p>
				<p class="text-sm" style="color: var(--text-secondary);">
					{#if tourId}
						No time slots scheduled for this tour
					{:else}
						Start by creating your first tour
					{/if}
				</p>
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
				<p class="text-sm" style="color: var(--text-secondary);">
					{#if tourId}
						{view === 'day' ? 'No time slots scheduled for this day' : 'No time slots scheduled this week'}
					{:else}
						{view === 'day' ? 'No tours scheduled for this day' : 'No tours scheduled this week'}
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
							<span class="slot-count">({slots.length} slots)</span>
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
													<div class="quick-actions" onclick={(e) => e.stopPropagation()}>
														<!-- Status toggle -->
														<Tooltip text={slot.status === 'cancelled' ? 'Reactivate slot' : 'Cancel slot'}>
															<button
																onclick={() => toggleSlotStatus(slot)}
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
																	onclick={() => startEditCapacity(slot)}
																	class="quick-action-btn capacity-btn"
																>
																	<Edit3 class="h-3 w-3" />
																</button>
															</Tooltip>
														{/if}
													</div>
												{/if}
												
												<!-- Only show eye icon in dashboard view (all tours), not in tour-specific view -->
												{#if !tourId}
													<Eye class="h-4 w-4" style="color: var(--text-tertiary);" />
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
						
						<div 
							class="calendar-day"
							class:other-month={dayDate && !isCurrentMonth}
							class:today={isToday}
							class:has-slots={daySlots.length > 0}
							onclick={() => dayDate && handleDayClick(dayDate, daySlots)}
							onkeydown={(e) => {
								if ((e.key === 'Enter' || e.key === ' ') && dayDate && daySlots.length > 0) {
									e.preventDefault();
									handleDayClick(dayDate, daySlots);
								}
							}}
							role={daySlots.length > 0 ? "button" : undefined}
							tabindex={daySlots.length > 0 ? 0 : undefined}
							aria-label={dayDate && daySlots.length > 0 ? `${dayDate.toLocaleDateString()} - ${daySlots.length} tour slots` : undefined}
							title={daySlots.length > 0 ? (daySlots.length === 1 ? 'Click to view tour details' : `Click to view ${daySlots.length} tour slots`) : undefined}
						>
							{#if dayDate}
								<div class="day-number">{dayDate.getDate()}</div>
								{#if daySlots.length > 0}
									<div class="day-slots">
										<div class="slot-indicator" style="background-color: {getDayColor(daySlots)}"></div>
										<span class="slot-count">{daySlots.length}</span>
									</div>
									{#if daySlots.length === 1}
										<div class="single-slot-preview">
											{formatSlotTimeRange(daySlots[0].startTime, daySlots[0].endTime)}
										</div>
									{/if}
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div> 
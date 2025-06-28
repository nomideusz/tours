<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	// Types
	interface TimeSlot {
		id: string;
		tourId: string;
		tourName: string;
		tourImage?: string | null;
		startTime: string;
		endTime: string;
		capacity: number;
		bookedSpots: number;
		available: number;
		utilizationRate: number;
		status: string;
		isPast: boolean;
		isToday: boolean;
		isFull: boolean;
		totalBookings: number;
		confirmedBookings: number;
		totalParticipants: number;
		totalRevenue: number;
	}
	
	// Icons
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Eye from 'lucide-svelte/icons/eye';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	
	interface Props {
		view?: 'day' | 'week' | 'month';
		onViewChange?: (view: 'day' | 'week' | 'month') => void;
		onSlotClick?: (slot: any) => void;
		compact?: boolean;
	}
	
	let { 
		view = $bindable('week'),
		onViewChange,
		onSlotClick,
		compact = false
	}: Props = $props();
	
	let currentDate = $state(new Date());
	
	// Create stable date string for query key to prevent infinite loops
	let dateString = $derived(
		`${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`
	);
	
	// Query for timeline data - use stable date string
	let timelineQuery = $derived(
		createQuery({
			queryKey: queryKeys.allTimeSlots(view, dateString),
			queryFn: () => queryFunctions.fetchAllTimeSlots(view, currentDate.toISOString()),
			staleTime: 2 * 60 * 1000, // 2 minutes stale time
			gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
			refetchOnWindowFocus: false, // Disable aggressive window focus refetching
			enabled: browser
		})
	);
	
	// Derived data
	let timeSlots = $derived($timelineQuery.data?.timeSlots || []);
	let stats = $derived($timelineQuery.data?.stats || {});
	let isLoading = $derived($timelineQuery.isLoading);
	let error = $derived($timelineQuery.error);
	
	// Group slots by date for display
	let slotsByDate = $derived.by(() => {
		const groups = new Map<string, TimeSlot[]>();
		
		timeSlots.forEach((slot: TimeSlot) => {
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
		const start = new Date($timelineQuery.data?.dateRange?.start || currentDate);
		const end = new Date($timelineQuery.data?.dateRange?.end || currentDate);
		
		if (view === 'day') {
			return start.toLocaleDateString('en-US', { 
				weekday: 'long', 
				month: 'long', 
				day: 'numeric', 
				year: 'numeric' 
			});
		} else if (view === 'week') {
			const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
			const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
			return `${startStr} - ${endStr}`;
		} else {
			return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
		return timeSlots.filter((slot: TimeSlot) => new Date(slot.startTime).toDateString() === dateStr);
	}
	
	function getDayColor(slots: TimeSlot[]): string {
		if (slots.length === 0) return 'transparent';
		const avgUtilization = slots.reduce((sum, s) => sum + s.utilizationRate, 0) / slots.length;
		return getUtilizationColor(avgUtilization);
	}
</script>

<div class="tour-timeline {compact ? 'compact' : ''}">
	<!-- Header -->
	<div class="timeline-header">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
			<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
				<h3 class="text-base sm:text-lg font-semibold" style="color: var(--text-primary);">
					All Tours Schedule
				</h3>
				{#if !isLoading && stats.totalSlots > 0}
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
		</div>
		
		<!-- Date Navigation -->
		<div class="date-navigation">
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
	</div>
	
	<!-- Content -->
	<div class="timeline-content">
		{#if isLoading}
			<div class="loading-state">
				<div class="animate-spin h-8 w-8 rounded-full border-2" 
					style="border-color: var(--border-secondary); border-top-color: var(--text-secondary);">
				</div>
				<p class="text-sm mt-4" style="color: var(--text-secondary);">Loading timeline...</p>
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
					{view === 'day' ? 'No tours scheduled for this day' :
					 view === 'week' ? 'No tours scheduled this week' :
					 'No tours scheduled this month'}
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
								<button
									onclick={() => handleSlotClick(slot)}
									class="slot-item {getSlotStatusClass(slot)}"
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
										{#if slot.isToday && !slot.isPast}
											<span class="today-badge">Today</span>
										{/if}
										{#if slot.isFull}
											<span class="full-badge">Full</span>
										{/if}
										<Eye class="h-4 w-4" style="color: var(--text-tertiary);" />
									</div>
								</button>
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
						>
							{#if dayDate}
								<div class="day-number">{dayDate.getDate()}</div>
								{#if daySlots.length > 0}
									<div class="day-slots">
										<div class="slot-indicator" style="background-color: {getDayColor(daySlots)}"></div>
										<span class="slot-count">{daySlots.length}</span>
									</div>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.tour-timeline {
		background: var(--bg-primary);
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
		overflow: hidden;
	}
	
	.tour-timeline.compact {
		border: none;
		background: transparent;
		padding: 0;
	}
	
	.timeline-header {
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-primary);
	}
	
	.compact .timeline-header {
		padding: 0 0 1rem 0;
		border: none;
	}
	
	.view-toggle {
		display: flex;
		gap: 0.25rem;
		padding: 0.25rem;
		background: var(--bg-secondary);
		border-radius: 0.5rem;
	}
	
	.view-button {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s;
		min-width: 2rem;
	}
	
	.view-button:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}
	
	.view-button.active {
		color: var(--text-primary);
		background: var(--bg-primary);
		box-shadow: var(--shadow-sm);
	}
	
	.date-navigation {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}
	
	.nav-button {
		padding: 0.5rem;
		border-radius: 0.5rem;
		background: transparent;
		border: 1px solid var(--border-primary);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.15s;
	}
	
	.nav-button:hover {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
	}
	
	.date-display {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.today-button {
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-primary-600);
		background: var(--color-primary-50);
		border: 1px solid var(--color-primary-200);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	
	.today-button:hover {
		background: var(--color-primary-100);
		border-color: var(--color-primary-300);
	}
	
	.timeline-content {
		min-height: 20rem;
		position: relative;
	}
	
	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}
	
	/* List View Styles */
	.timeline-list {
		padding: 1.5rem;
	}
	
	.compact .timeline-list {
		padding: 0;
	}
	
	.date-group {
		margin-bottom: 2rem;
	}
	
	.date-group:last-child {
		margin-bottom: 0;
	}
	
	.date-header {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.slot-count {
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--text-tertiary);
	}
	
	.slots-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.slot-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s;
		width: 100%;
		text-align: left;
	}
	
	.slot-item:hover:not(.past-slot) {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}
	
	.slot-item.past-slot {
		opacity: 0.5;
		cursor: default;
		background: var(--bg-tertiary);
	}
	
	.slot-item.past-slot:hover {
		transform: none;
		box-shadow: none;
	}
	
	.slot-item.full-slot {
		border-color: var(--color-danger-200);
		background: var(--color-danger-50);
	}
	
	.slot-item.nearly-full-slot {
		border-color: var(--color-warning-200);
		background: var(--color-warning-50);
	}
	
	.slot-item.has-bookings-slot {
		border-color: var(--color-success-200);
		background: var(--color-success-50);
	}
	
	.slot-time {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		min-width: 8rem;
	}
	
	.slot-info {
		flex: 1;
		min-width: 0;
	}
	
	.tour-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.slot-details {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	
	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	
	.utilization-bar {
		width: 4rem;
		height: 0.25rem;
		background: var(--bg-tertiary);
		border-radius: 0.125rem;
		overflow: hidden;
	}
	
	.utilization-fill {
		height: 100%;
		transition: width 0.3s ease;
	}
	
	.slot-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.today-badge,
	.full-badge {
		padding: 0.125rem 0.5rem;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-radius: 0.25rem;
	}
	
	.today-badge {
		color: var(--color-primary-700);
		background: var(--color-primary-100);
		border: 1px solid var(--color-primary-200);
	}
	
	.full-badge {
		color: var(--color-danger-700);
		background: var(--color-danger-100);
		border: 1px solid var(--color-danger-200);
	}
	
	/* Calendar View Styles */
	.calendar-view {
		padding: 1.5rem;
	}
	
	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1px;
		background: var(--border-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		overflow: hidden;
	}
	
	.weekday-header {
		padding: 0.75rem 0.5rem;
		background: var(--bg-secondary);
		font-size: 0.75rem;
		font-weight: 600;
		text-align: center;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.calendar-day {
		background: var(--bg-primary);
		padding: 0.5rem;
		min-height: 4rem;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.calendar-day.other-month {
		background: var(--bg-secondary);
		opacity: 0.5;
	}
	
	.calendar-day.today {
		background: var(--color-primary-50);
	}
	
	.calendar-day.has-slots {
		cursor: pointer;
	}
	
	.calendar-day.has-slots:hover {
		background: var(--bg-tertiary);
	}
	
	.day-number {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.day-slots {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.625rem;
		color: var(--text-secondary);
		margin-top: auto;
	}
	
	.slot-indicator {
		width: 0.375rem;
		height: 0.375rem;
		border-radius: 50%;
	}
	
	/* Mobile Styles */
	@media (max-width: 640px) {
		.timeline-header {
			padding: 1rem;
		}
		
		.view-button {
			padding: 0.375rem 0.5rem;
			font-size: 0.75rem;
			min-width: 1.75rem;
		}
		
		.date-navigation {
			gap: 0.5rem;
		}
		
		.nav-button {
			padding: 0.375rem;
		}
		
		.date-header {
			font-size: 0.75rem;
		}
		
		.slot-time {
			min-width: auto;
			font-size: 0.75rem;
		}
		
		.tour-name {
			font-size: 0.75rem;
		}
		
		.slot-details {
			font-size: 0.625rem;
		}
		
		.calendar-view {
			padding: 0.75rem;
		}
		
		.weekday-header {
			font-size: 0.625rem;
			padding: 0.5rem 0.25rem;
		}
		
		.calendar-day {
			min-height: 3rem;
			padding: 0.25rem;
		}
		
		.day-number {
			font-size: 0.75rem;
		}
	}
</style> 
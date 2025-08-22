<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import type { TimeSlot } from '$lib/types.js';
	import { formatSlotTimeRange, getSlotAvailabilityText, isSlotFull } from '$lib/utils/time-slot-client.js';
	import { formatTourOwnerCurrency } from '$lib/utils/currency.js';

	interface Props {
		timeSlots: TimeSlot[];
		selectedSlot?: TimeSlot | null;
		onSlotSelect?: (slot: TimeSlot | null) => void;
		tour?: any;
		tourOwner?: any;
		class?: string;
	}

	let { 
		timeSlots = [],
		selectedSlot = null,
		onSlotSelect,
		tour,
		tourOwner,
		class: className = ''
	}: Props = $props();

	let currentMonth = $state(new Date());
	let hoveredDate = $state<string | null>(null);
	let selectedDate = $state<string | null>(null);
	
	// Process time slots by date
	let slotsByDate = $derived.by(() => {
		const now = new Date();
		const slotsMap = new Map<string, TimeSlot[]>();
		
		timeSlots
			.filter(slot => new Date(slot.startTime) > now && !isSlotFull(slot))
			.forEach(slot => {
				const dateKey = slot.startTime.split('T')[0];
				if (!slotsMap.has(dateKey)) {
					slotsMap.set(dateKey, []);
				}
				slotsMap.get(dateKey)!.push(slot);
			});
		
		// Sort slots by start time for each date
		slotsMap.forEach(slots => {
			slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
		});
		
		return slotsMap;
	});

	// Helper functions
	function getDaysInMonth(date: Date): number {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	}

	function getFirstDayOfMonth(date: Date): number {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	}

	function formatDateString(year: number, month: number, day: number): string {
		const m = (month + 1).toString().padStart(2, '0');
		const d = day.toString().padStart(2, '0');
		return `${year}-${m}-${d}`;
	}

	function previousMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
		// Keep selections when navigating months - users might want to compare dates
	}

	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
		// Keep selections when navigating months - users might want to compare dates
	}

	function goToToday() {
		const today = new Date();
		currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		// Keep selections when jumping to today - it's just navigation
	}

	function isToday(day: number): boolean {
		const today = new Date();
		return currentMonth.getFullYear() === today.getFullYear() &&
			currentMonth.getMonth() === today.getMonth() &&
			day === today.getDate();
	}

	function isPast(day: number): boolean {
		const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
		date.setHours(23, 59, 59, 999); // End of day
		const today = new Date();
		return date < today;
	}

	function getDateSlots(day: number): TimeSlot[] {
		const dateStr = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
		return slotsByDate.get(dateStr) || [];
	}

	function hasSlots(day: number): boolean {
		return getDateSlots(day).length > 0;
	}

	function handleSlotSelect(slot: TimeSlot) {
		selectedSlot = slot;
		onSlotSelect?.(slot);
	}

	function handleDateHover(day: number | null) {
		if (day === null) {
			hoveredDate = null;
		} else {
			hoveredDate = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
		}
	}

	function handleDateClick(day: number) {
		const dateStr = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
		if (selectedDate === dateStr) {
			// If clicking the same date, deselect it
			selectedDate = null;
			// Clear selected slot when deselecting date
			selectedSlot = null;
			onSlotSelect?.(null);
		} else {
			// Select the new date and clear any previously selected slot
			selectedDate = dateStr;
			selectedSlot = null;
			onSlotSelect?.(null);
		}
	}

	// Generate calendar grid
	let calendarGrid = $derived.by(() => {
		const daysInMonth = getDaysInMonth(currentMonth);
		const firstDay = getFirstDayOfMonth(currentMonth);
		const days: (null | number)[] = [];

		// Add empty cells for days before the first day of the month
		for (let i = 0; i < firstDay; i++) {
			days.push(null);
		}

		// Add days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			days.push(day);
		}

		// Add empty cells at the end to complete the grid
		const totalCells = Math.ceil(days.length / 7) * 7;
		while (days.length < totalCells) {
			days.push(null);
		}

		return days;
	});

	// Get slots for active date (selected or hovered), but only if the date is in current month view
	let activeDate = $derived.by(() => {
		// Only show slots if the selected/hovered date is in the current month
		const candidateDate = selectedDate || hoveredDate;
		if (!candidateDate) return null;
		
		// Check if the candidate date belongs to the current month being viewed
		const candidateMonth = new Date(candidateDate + 'T00:00:00');
		const currentMonthYear = currentMonth.getFullYear();
		const currentMonthMonth = currentMonth.getMonth();
		
		if (candidateMonth.getFullYear() === currentMonthYear && 
			candidateMonth.getMonth() === currentMonthMonth) {
			return candidateDate;
		}
		
		return null;
	});
	
	let activeSlots = $derived.by(() => {
		if (!activeDate) return [] as TimeSlot[];
		return slotsByDate.get(activeDate) || [] as TimeSlot[];
	});
</script>

<div class="booking-calendar {className}">
	<!-- Calendar Header -->
	<div class="calendar-header">
		<div class="calendar-nav">
			<button
				type="button"
				onclick={previousMonth}
				class="nav-button"
				aria-label="Previous month"
			>
				<ChevronLeft class="nav-icon" />
			</button>
			
			<div class="month-display">
				<Calendar class="calendar-icon" />
				<h3 class="month-title">
					{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
				</h3>
				<button
					type="button"
					onclick={goToToday}
					class="today-button"
				>
					Today
				</button>
			</div>
			
			<button
				type="button"
				onclick={nextMonth}
				class="nav-button"
				aria-label="Next month"
			>
				<ChevronRight class="nav-icon" />
			</button>
		</div>
		
		<p class="calendar-hint">
			Click on a date with available time slots to see booking options
		</p>
	</div>

	<div class="calendar-content">
		<!-- Calendar -->
		<div class="calendar-section">
			{#if selectedDate && selectedSlot && !activeDate}
				<div class="selection-indicator rounded-lg p-3 mb-4" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
					<div class="flex items-center gap-2">
						<div class="w-6 h-6 rounded-full flex items-center justify-center" style="background: var(--color-primary-100);">
							<Calendar class="w-3 h-3" style="color: var(--color-primary-600);" />
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-xs font-medium" style="color: var(--color-primary-800);">
								You have selected: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
							</p>
							<p class="text-xs" style="color: var(--color-primary-600);">
								{formatSlotTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
							</p>
						</div>
					</div>
				</div>
			{/if}
			<!-- Day headers -->
			<div class="day-headers">
				{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
					<div class="day-header">{day}</div>
				{/each}
			</div>

			<!-- Calendar grid -->
			<div class="calendar-grid">
				{#each calendarGrid as day}
					{#if day}
						{@const slots = getDateSlots(day)}
						{@const hasAvailableSlots = hasSlots(day)}
						{@const isDisabled = isPast(day) || !hasAvailableSlots}
						{@const dateStr = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day)}
						<button
							type="button"
							onclick={() => !isDisabled && handleDateClick(day)}
							onmouseenter={() => handleDateHover(day)}
							onmouseleave={() => handleDateHover(null)}
							disabled={isDisabled}
							class="day-button"
							class:day-button--today={isToday(day)}
							class:day-button--has-slots={hasAvailableSlots}
							class:day-button--selected={selectedDate === dateStr}
							class:day-button--hovered={hoveredDate === dateStr && selectedDate !== dateStr}
							class:day-button--past={isPast(day)}
							class:day-button--disabled={isDisabled}
							title="{hasAvailableSlots ? `${slots.length} available time slot${slots.length === 1 ? '' : 's'}` : isPast(day) ? 'Past date' : 'No available slots'}"
						>
							<span class="day-number">{day}</span>
							{#if hasAvailableSlots}
								<div class="slot-indicators">
									{#if slots.length === 1}
										<span class="slot-dot"></span>
									{:else if slots.length === 2}
										<span class="slot-dot"></span>
										<span class="slot-dot"></span>
									{:else}
										<span class="slot-dot slot-dot--multiple">+</span>
									{/if}
								</div>
							{/if}
						</button>
					{:else}
						<div class="day-button day-button--empty"></div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Time slots for active date (selected or hovered) -->
		{#if activeSlots.length > 0}
			<div class="slots-section">
				<div class="slots-header">
					<div class="slots-header-main">
						<div class="slots-header-icon">
							<Clock class="w-4 h-4" />
						</div>
						<div class="slots-header-content">
							<h4 class="slots-header-title">Available Times</h4>
							<p class="slots-header-date">{new Date(activeDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
						</div>
					</div>
					{#if selectedDate}
						<span class="selected-indicator">Selected</span>
					{/if}
				</div>
				
				<div class="slots-list">
					{#each activeSlots as slot (slot.id)}
						<button
							type="button"
							onclick={() => handleSlotSelect(slot)}
							class="slot-button"
							class:slot-button--selected={selectedSlot?.id === slot.id}
						>
							<div class="slot-time">
								<Clock class="w-4 h-4" />
								<span class="time-range">{formatSlotTimeRange(slot.startTime, slot.endTime)}</span>
							</div>
							
							<div class="slot-details">
								<div class="availability">
									<Users class="w-4 h-4" />
									<span>{getSlotAvailabilityText(slot)}</span>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</div>
		{:else if activeDate}
			<div class="slots-section">
				<div class="slots-header">
					<div class="slots-header-main">
						<div class="slots-header-icon">
							<Clock class="w-4 h-4" />
						</div>
						<div class="slots-header-content">
							<h4 class="slots-header-title">No Available Times</h4>
							<p class="slots-header-date">{new Date(activeDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
						</div>
					</div>
				</div>
				<p class="no-slots-message">No time slots available for this date.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.booking-calendar {
		width: 100%;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		overflow: hidden;
	}

	/* Calendar Header */
	.calendar-header {
		padding: 1rem;
		border-bottom: 1px solid var(--border-primary);
		background: var(--bg-secondary);
	}

	.calendar-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.nav-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		color: var(--text-secondary);
		border-radius: 0.5rem;
		transition: all 0.15s ease;
		border: none;
		background: transparent;
		cursor: pointer;
	}

	.nav-button:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.nav-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.month-display {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.calendar-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--text-primary);
	}

	.month-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.today-button {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-primary-600);
		background: transparent;
		border: none;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.today-button:hover {
		background: var(--color-primary-50);
	}

	.calendar-hint {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-align: center;
		margin: 0;
	}

	/* Calendar Content */
	.calendar-content {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0;
	}

	@media (min-width: 768px) {
		.calendar-content {
			grid-template-columns: 1fr 1fr;
		}
	}

	.calendar-section {
		padding: 1rem;
	}

	/* Day headers */
	.day-headers {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1px;
		margin-bottom: 1rem;
	}

	.day-header {
		text-align: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		padding: 0.5rem 0;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	/* Calendar grid */
	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1px;
		background: var(--border-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.day-button {
		position: relative;
		aspect-ratio: 1;
		min-height: 3rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		background: var(--bg-primary);
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.5rem;
	}

	.day-button:hover:not(.day-button--disabled):not(.day-button--empty) {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.day-button--today {
		background: var(--color-primary-100);
		color: var(--color-primary-800);
		font-weight: 600;
	}

	.day-button--today:hover {
		background: var(--color-primary-200);
	}

	.day-button--has-slots {
		background: var(--bg-secondary);
		color: var(--text-primary);
		font-weight: 500;
	}

	.day-button--has-slots:hover {
		background: var(--color-primary-50);
		color: var(--color-primary-700);
		transform: scale(1.02);
	}

	.day-button--hovered {
		background: var(--color-primary-100) !important;
		color: var(--color-primary-800) !important;
		transform: scale(1.02);
		z-index: 1;
	}

	.day-button--selected {
		background: var(--color-primary-600) !important;
		color: white !important;
		font-weight: 600;
		z-index: 2;
		box-shadow: inset 0 0 0 2px var(--color-primary-700);
		transform: scale(1.02);
	}

	.day-button--selected:hover {
		background: var(--color-primary-700) !important;
		box-shadow: inset 0 0 0 2px var(--color-primary-800);
	}

	.day-button--disabled {
		cursor: not-allowed;
		opacity: 0.4;
	}

	.day-button--empty {
		cursor: default;
		background: var(--bg-secondary);
	}

	.day-number {
		font-size: 0.875rem;
		font-weight: inherit;
	}

	/* Slot indicators */
	.slot-indicators {
		display: flex;
		gap: 0.125rem;
		align-items: center;
		justify-content: center;
	}

	.slot-dot {
		width: 0.25rem;
		height: 0.25rem;
		border-radius: 50%;
		background: var(--color-primary-500);
	}

	.slot-dot--multiple {
		width: auto;
		height: auto;
		border-radius: 0.25rem;
		background: var(--color-primary-600);
		color: white;
		font-size: 0.625rem;
		font-weight: 600;
		padding: 0.125rem 0.25rem;
		line-height: 1;
	}

	/* Slots section */
	.slots-section {
		padding: 1rem;
		border-left: 1px solid var(--border-primary);
		background: var(--bg-secondary);
		max-height: 400px;
		overflow-y: auto;
		min-width: 0;
	}

	@media (max-width: 767px) {
		.slots-section {
			border-left: none;
			border-top: 1px solid var(--border-primary);
		}
	}

	.slots-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 1rem;
		color: var(--text-primary);
	}

	.slots-header-main {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.slots-header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.375rem;
		background: var(--color-primary-50);
		color: var(--color-primary-600);
		flex-shrink: 0;
	}

	:global([data-theme="dark"]) .slots-header-icon {
		background: var(--color-primary-900);
		color: var(--color-primary-400);
	}

	.slots-header-content {
		flex: 1;
		min-width: 0;
	}

	.slots-header-title {
		margin: 0 0 0.125rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.slots-header-date {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--text-secondary);
		line-height: 1.2;
		word-break: break-word;
		hyphens: auto;
	}

	.selected-indicator {
		font-size: 0.6875rem;
		font-weight: 500;
		color: var(--color-primary-600);
		background: var(--color-primary-100);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid var(--color-primary-300);
		align-self: flex-start;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.slots-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.slot-button {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
	}

	.slot-button:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
		transform: translateY(-1px);
	}

	.slot-button--selected {
		background: var(--color-primary-50);
		border-color: var(--color-primary-300);
		color: var(--color-primary-800);
	}

	.slot-time {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.time-range {
		font-size: 0.875rem;
	}

	.slot-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.availability {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.no-slots-message {
		color: var(--text-secondary);
		font-size: 0.875rem;
		text-align: center;
		padding: 2rem 1rem;
		margin: 0;
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.calendar-header {
			padding: 0.75rem;
		}

		.month-title {
			font-size: 1rem;
		}

		.calendar-section {
			padding: 0.75rem;
		}

		.day-button {
			min-height: 2.5rem;
			font-size: 0.75rem;
		}

		.slots-section {
			padding: 0.75rem;
		}

		.slots-header {
			margin-bottom: 1rem;
		}

		.slots-header-main {
			gap: 0.5rem;
		}

		.slots-header-icon {
			width: 2rem;
			height: 2rem;
		}

		.slots-header-icon :global(svg) {
			width: 1rem !important;
			height: 1rem !important;
		}

		.slots-header-title {
			font-size: 0.875rem;
		}

		.slots-header-date {
			font-size: 0.75rem;
		}

		.selected-indicator {
			font-size: 0.6875rem;
			padding: 0.125rem 0.375rem;
		}

		.slot-button {
			padding: 0.5rem;
		}

		.slot-details {
			font-size: 0.6875rem;
		}
	}
</style>

<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import type { TimeSlot } from '$lib/types.js';
	import { formatDate } from '$lib/utils/date-helpers.js';

	interface Props {
		selectedDate?: Date;
		onSelectDate?: (date: Date) => void;
		slots?: TimeSlot[];
		currentMonth?: Date;
		onMonthChange?: (month: Date) => void;
	}

	let { selectedDate = $bindable(new Date()), onSelectDate, slots = [], currentMonth = $bindable(new Date()), onMonthChange }: Props = $props();

	// Helper functions
	function getMonthName(date: Date): string {
		return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}

	function getDaysInMonth(date: Date): number {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	}

	function getFirstDayOfMonth(date: Date): number {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	}

	function formatDateKey(date: Date): string {
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function changeMonth(direction: 'prev' | 'next') {
		const newMonth = new Date(currentMonth);
		if (direction === 'prev') {
			newMonth.setMonth(newMonth.getMonth() - 1);
		} else {
			newMonth.setMonth(newMonth.getMonth() + 1);
		}
		currentMonth = newMonth;
		onMonthChange?.(newMonth);
	}

	function isToday(date: Date): boolean {
		const today = new Date();
		return date.getFullYear() === today.getFullYear() &&
			date.getMonth() === today.getMonth() &&
			date.getDate() === today.getDate();
	}

	function isSameDay(date1: Date, date2: Date): boolean {
		return date1.getFullYear() === date2.getFullYear() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getDate() === date2.getDate();
	}

	function isSameMonth(date1: Date, date2: Date): boolean {
		return date1.getFullYear() === date2.getFullYear() &&
			date1.getMonth() === date2.getMonth();
	}

	// Generate calendar days
	const calendarDays = $derived.by(() => {
		const days: (Date | null)[] = [];
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		const daysInMonth = getDaysInMonth(currentMonth);
		const firstDay = getFirstDayOfMonth(currentMonth);
		
		// Convert to Monday start (0=Sunday -> 6, 1=Monday -> 0, etc.)
		const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
		
		// Add empty cells for days before the first day of the month
		for (let i = 0; i < adjustedFirstDay; i++) {
			days.push(null);
		}
		
		// Add days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			days.push(new Date(year, month, day));
		}
		
		// Add empty cells at the end to always have 6 rows (42 cells total)
		while (days.length < 42) {
			days.push(null);
		}
		
		return days;
	});

	// Group slots by date for quick lookup
	const slotsByDate = $derived(slots.reduce((acc, slot) => {
		// Parse the slot date properly
		const slotDate = new Date(slot.startTime);
		const dateKey = formatDateKey(slotDate);
		if (!acc[dateKey]) acc[dateKey] = [];
		acc[dateKey].push(slot);
		return acc;
	}, {} as Record<string, TimeSlot[]>));

	function handleDateClick(date: Date) {
		selectedDate = date;
		onSelectDate?.(date);
	}

	function getDateSlots(date: Date): TimeSlot[] {
		const dateKey = formatDateKey(date);
		return slotsByDate[dateKey] || [];
	}

	function getSlotIndicatorColor(slots: TimeSlot[]): string {
		if (slots.length === 0) return '';
		
		// Check if any slots have bookings
		const hasBookings = slots.some(slot => slot.bookedSpots > 0);
		const allFull = slots.every(slot => slot.availableSpots === 0 || slot.status === 'full');
		const hasCancelled = slots.some(slot => slot.status === 'cancelled');
		
		if (allFull) return 'var(--color-danger-500)';
		if (hasBookings) return 'var(--color-success-500)';
		if (hasCancelled) return 'var(--text-tertiary)';
		return 'var(--color-primary-500)';
	}
</script>

<div class="schedule-calendar">
	<!-- Calendar Header -->
	<div class="calendar-header">
		<button
			type="button"
			onclick={() => changeMonth('prev')}
			class="calendar-nav-button"
			aria-label="Previous month"
		>
			<ChevronLeft class="w-5 h-5" />
		</button>
		
		<h3 class="calendar-title">
			{getMonthName(currentMonth)}
		</h3>
		
		<button
			type="button"
			onclick={() => changeMonth('next')}
			class="calendar-nav-button"
			aria-label="Next month"
		>
			<ChevronRight class="w-5 h-5" />
		</button>
	</div>

	<!-- Calendar Grid -->
	<div class="calendar-grid">
		<!-- Weekday Headers -->
		{#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as day, i}
			<div class="calendar-weekday">
				<span class="weekday-full">{day}</span>
				<span class="weekday-short">{day[0]}</span>
			</div>
		{/each}

		<!-- Calendar Days -->
		{#each calendarDays as date}
			{#if date}
				{@const dateSlots = getDateSlots(date)}
				{@const isSelected = selectedDate && isSameDay(date, selectedDate)}
				{@const isCurrentMonth = isSameMonth(date, currentMonth)}
				{@const indicatorColor = getSlotIndicatorColor(dateSlots)}
				
				<button
					type="button"
					onclick={() => handleDateClick(date)}
					class="calendar-day"
					class:selected={isSelected}
					class:today={isToday(date)}
					class:other-month={!isCurrentMonth}
					class:has-slots={dateSlots.length > 0}
					aria-label={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
				>
					<span class="day-number">{date.getDate()}</span>
					
					{#if dateSlots.length > 0}
						<div class="slot-indicators">
							<div class="slot-dot" style="background-color: {indicatorColor}"></div>
							<span class="slot-count">{dateSlots.length}</span>
						</div>
					{/if}
				</button>
			{:else}
				<div class="calendar-day calendar-day--empty"></div>
			{/if}
		{/each}
	</div>

	<!-- Calendar Legend -->
	<div class="calendar-legend">
		<div class="legend-item">
			<div class="legend-dot" style="background: var(--color-primary-500)"></div>
			<span>Available</span>
		</div>
		<div class="legend-item">
			<div class="legend-dot" style="background: var(--color-success-500)"></div>
			<span>Has bookings</span>
		</div>
		<div class="legend-item">
			<div class="legend-dot" style="background: var(--color-danger-500)"></div>
			<span>Fully booked</span>
		</div>
	</div>
</div>

<style>
	.schedule-calendar {
		background: var(--bg-primary);
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
		padding: 1.5rem;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-primary);
	}

	.calendar-nav-button {
		padding: 0.5rem;
		border-radius: 0.5rem;
		background: transparent;
		border: 1px solid var(--border-primary);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.calendar-nav-button:hover {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
	}

	.calendar-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.25rem;
		flex: 1;
	}

	.calendar-weekday {
		padding: 0.75rem 0.5rem;
		text-align: center;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border-primary);
	}

	.weekday-short {
		display: none;
	}

	@media (max-width: 640px) {
		.weekday-full {
			display: none;
		}
		.weekday-short {
			display: block;
		}
	}

	.calendar-day {
		padding: 0.5rem;
		background: var(--bg-primary);
		border: 1px solid transparent;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		position: relative;
		min-height: 3.5rem;
		width: 100%;
	}

	.calendar-day--empty {
		cursor: default;
		background: transparent;
	}

	.calendar-day:hover:not(.other-month):not(.calendar-day--empty) {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
	}

	.calendar-day.selected {
		background: var(--color-primary-50);
		border-color: var(--color-primary-500);
		color: var(--color-primary-700);
	}

	.calendar-day.today {
		background: var(--bg-tertiary);
		font-weight: 600;
	}

	.calendar-day.today.selected {
		background: var(--color-primary-100);
	}

	.calendar-day.other-month {
		opacity: 0.3;
		cursor: default;
	}

	.calendar-day.other-month:hover {
		background: var(--bg-primary);
		border-color: transparent;
	}

	.day-number {
		font-size: 0.875rem;
		line-height: 1;
		color: var(--text-primary);
	}

	.calendar-day.selected .day-number {
		color: var(--color-primary-700);
	}

	.slot-indicators {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.125rem;
	}

	.slot-dot {
		width: 0.375rem;
		height: 0.375rem;
		border-radius: 50%;
	}

	.slot-count {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.calendar-day.selected .slot-count {
		color: var(--color-primary-700);
	}

	.calendar-legend {
		display: flex;
		gap: 1.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-primary);
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.schedule-calendar {
			padding: 0.75rem;
		}

		.calendar-grid {
			gap: 0.125rem;
		}

		.calendar-weekday {
			padding: 0.5rem 0.25rem;
			font-size: 0.75rem;
		}

		.calendar-day {
			min-height: 2.75rem;
			padding: 0.25rem;
			font-size: 0.75rem;
			border-radius: 0.375rem;
		}

		.day-number {
			font-size: 0.75rem;
		}

		.slot-indicators {
			gap: 0.125rem;
		}

		.slot-dot {
			width: 0.25rem;
			height: 0.25rem;
		}

		.slot-count {
			font-size: 0.625rem;
		}

		.calendar-legend {
			gap: 0.75rem;
			flex-wrap: wrap;
			font-size: 0.625rem;
			margin-top: 0.75rem;
			padding-top: 0.75rem;
		}

		.legend-dot {
			width: 0.375rem;
			height: 0.375rem;
		}

		.calendar-title {
			font-size: 1rem;
		}

		.calendar-nav-button {
			padding: 0.375rem;
		}

		.calendar-nav-button svg {
			width: 1rem;
			height: 1rem;
		}
	}
</style> 
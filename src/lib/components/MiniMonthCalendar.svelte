<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Calendar from 'lucide-svelte/icons/calendar';

	interface Props {
		slotsMap?: Map<string, number>; // date string (YYYY-MM-DD) -> slot count
		selectedDate?: string | null;
		onDateClick?: (date: string) => void;
		minDate?: string | null; // minimum selectable date (YYYY-MM-DD)
		showSlots?: boolean; // whether to show slot indicators
		size?: 'mini' | 'medium' | 'large';
		class?: string;
	}

	let { 
		slotsMap = new Map(),
		selectedDate = null,
		onDateClick,
		minDate = null,
		showSlots = true,
		size = 'mini',
		class: className = ''
	}: Props = $props();

	let currentMonth = $state(new Date());
	
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
	}

	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
	}

	function goToToday() {
		const today = new Date();
		currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
	}

	function isToday(day: number): boolean {
		const today = new Date();
		return currentMonth.getFullYear() === today.getFullYear() &&
			currentMonth.getMonth() === today.getMonth() &&
			day === today.getDate();
	}

	function isPast(day: number): boolean {
		const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
		date.setHours(0, 0, 0, 0);
		
		// If minDate is provided, use it instead of today
		if (minDate) {
			const min = new Date(minDate);
			min.setHours(0, 0, 0, 0);
			return date < min;
		}
		
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return date < today;
	}

	function isSelected(day: number): boolean {
		if (!selectedDate) return false;
		const dateStr = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
		return dateStr === selectedDate;
	}

	function getSlotCount(day: number): number {
		const dateStr = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
		return slotsMap.get(dateStr) || 0;
	}

	function hasSlots(day: number): boolean {
		return getSlotCount(day) > 0;
	}

	function handleDateClick(day: number) {
		// Don't allow clicking on past dates without slots (if slots are enabled)
		if (showSlots && isPast(day) && !hasSlots(day)) return;
		// Don't allow clicking on past dates (if no slots functionality)
		if (!showSlots && isPast(day)) return;
		
		const dateStr = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
		onDateClick?.(dateStr);
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

		// Add empty cells at the end to always have 6 rows (42 cells total)
		const totalCells = 42; // 6 rows × 7 days
		while (days.length < totalCells) {
			days.push(null);
		}

		return days;
	});

	// Calculate total slots for the month
	let monthlySlotCount = $derived.by(() => {
		if (!showSlots) return 0;
		let total = 0;
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		const daysInMonth = getDaysInMonth(currentMonth);
		
		for (let day = 1; day <= daysInMonth; day++) {
			total += getSlotCount(day);
		}
		
		return total;
	});
</script>

<div class="calendar-container calendar-container--{size} {className}">
	<!-- Header -->
	<div class="calendar-header">
		<div class="calendar-nav">
			<button
				type="button"
				onclick={previousMonth}
				class="nav-button"
			>
				<ChevronLeft class="nav-icon" />
			</button>
			
			<div class="month-display">
				<Calendar class="calendar-icon" />
				<h4 class="month-title">
				{currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
			</h4>
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
			>
				<ChevronRight class="nav-icon" />
			</button>
		</div>
		
		{#if showSlots}
			<p class="month-summary">
		{#if monthlySlotCount > 0}
				{monthlySlotCount} slot{monthlySlotCount === 1 ? '' : 's'} this month
				{:else}
					&nbsp;
				{/if}
			</p>
		{/if}
	</div>

	<!-- Day headers -->
	<div class="day-headers">
		{#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as day}
			<div class="day-header">
				{day}
			</div>
		{/each}
	</div>

	<!-- Calendar grid -->
	<div class="calendar-grid">
		{#each calendarGrid as day}
			{#if day}
				{@const slotCount = getSlotCount(day)}
				{@const hasSlot = hasSlots(day)}
				{@const isDisabled = showSlots ? (isPast(day) && !hasSlot) : isPast(day)}
				<button
					type="button"
					onclick={() => handleDateClick(day)}
					disabled={isDisabled}
					class="day-button"
					class:day-button--today={isToday(day)}
					class:day-button--selected={isSelected(day)}
					class:day-button--has-slots={showSlots && hasSlot}
					class:day-button--past={isPast(day)}
					class:day-button--disabled={isDisabled}
					title="{showSlots && hasSlot ? `${slotCount} slot${slotCount === 1 ? '' : 's'}${isPast(day) ? ' (past)' : ''}` : isPast(day) ? 'Past date' : isToday(day) ? 'Today' : 'Select date'}"
				>
					{day}
					{#if showSlots && hasSlot}
						<div class="slot-indicators" class:slot-indicators--past={isPast(day)}>
							{#if slotCount === 1}
								<span class="slot-dot"></span>
							{:else if slotCount === 2}
								<span class="slot-dot"></span>
								<span class="slot-dot"></span>
							{:else}
								<span class="slot-dot slot-dot--multiple"></span>
								<span class="slot-dot slot-dot--multiple"></span>
								<span class="slot-dot slot-dot--multiple"></span>
							{/if}
						</div>
					{/if}
				</button>
			{:else}
				<div class="day-button day-button--empty"></div>
			{/if}
		{/each}
	</div>
	
	<!-- Legend -->
	{#if showSlots}
		<div class="calendar-legend">
			<div class="legend-item">
				<span class="legend-dot legend-dot--upcoming"></span>
				<span class="legend-label">Upcoming</span>
			</div>
			<div class="legend-item">
				<span class="legend-dot legend-dot--past"></span>
				<span class="legend-label">Past</span>
		</div>
			<div class="legend-item">
				<span class="legend-today">T</span>
				<span class="legend-label">Today</span>
		</div>
		</div>
	{/if}
</div>

<style>
	.calendar-container {
		width: 100%;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.calendar-container--mini {
		max-width: 320px;
	}

	.calendar-container--medium {
		max-width: 420px;
	}

	.calendar-container--large {
		max-width: 520px;
	}

	/* Header */
	.calendar-header {
		padding: 0.75rem;
		border-bottom: 1px solid var(--border-primary);
	}

	.calendar-container--medium .calendar-header,
	.calendar-container--large .calendar-header {
		padding: 1rem;
	}

	.calendar-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.calendar-container--medium .calendar-nav,
	.calendar-container--large .calendar-nav {
		margin-bottom: 0.75rem;
	}

	.nav-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		color: var(--text-secondary);
		border-radius: 0.375rem;
		transition: all 0.15s ease;
		border: none;
		background: transparent;
		cursor: pointer;
	}

	.calendar-container--medium .nav-button,
	.calendar-container--large .nav-button {
		width: 2.5rem;
		height: 2.5rem;
	}

	.nav-button:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.nav-icon {
		width: 1rem;
		height: 1rem;
	}

	.calendar-container--medium .nav-icon,
	.calendar-container--large .nav-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.month-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.calendar-container--medium .month-display,
	.calendar-container--large .month-display {
		gap: 0.75rem;
	}

	.calendar-icon {
		width: 1rem;
		height: 1rem;
		color: var(--text-primary);
	}

	.calendar-container--medium .calendar-icon,
	.calendar-container--large .calendar-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.month-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin: 0;
	}

	.calendar-container--medium .month-title {
		font-size: 1rem;
	}

	.calendar-container--large .month-title {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.today-button {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-primary-600);
		background: transparent;
		border: none;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.calendar-container--medium .today-button,
	.calendar-container--large .today-button {
		font-size: 0.875rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
	}

	.today-button:hover {
		background: var(--color-primary-50);
	}

	.month-summary {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-align: center;
		margin: 0;
	}

	.calendar-container--medium .month-summary,
	.calendar-container--large .month-summary {
		font-size: 0.875rem;
	}

	/* Day headers */
	.day-headers {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.125rem;
		padding: 0 0.75rem;
		margin-bottom: 0.5rem;
	}

	.calendar-container--medium .day-headers,
	.calendar-container--large .day-headers {
		padding: 0 1rem;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
	}

	.day-header {
		text-align: center;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-tertiary);
		padding: 0.5rem 0;
	}

	.calendar-container--medium .day-header,
	.calendar-container--large .day-header {
		font-size: 0.875rem;
		font-weight: 600;
		padding: 0.75rem 0;
	}

	/* Calendar grid */
	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-template-rows: repeat(6, 2rem);
		gap: 0.125rem;
		padding: 0.25rem 0.75rem 0.75rem;
		height: 13rem; /* 6 rows × 2rem + 5 gaps × 0.125rem + 0.25rem top padding */
	}

	.calendar-container--medium .calendar-grid {
		grid-template-rows: repeat(6, 2.5rem);
		gap: 0.25rem;
		padding: 0.5rem 1rem 1rem;
		height: 17rem; /* 6 rows × 2.5rem + 5 gaps × 0.25rem + 0.5rem top padding */
	}

	.calendar-container--large .calendar-grid {
		grid-template-rows: repeat(6, 3rem);
		gap: 0.25rem;
		padding: 0.5rem 1rem 1rem;
		height: 20rem; /* 6 rows × 3rem + 5 gaps × 0.25rem + 0.5rem top padding */
	}

	.day-button {
		position: relative;
		width: 2rem;
		height: 2rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
		background: transparent;
		border: 2px solid transparent;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.calendar-container--medium .day-button {
		width: 2.5rem;
		height: 2.5rem;
		font-size: 0.875rem;
		border-radius: 0.5rem;
	}

	.calendar-container--large .day-button {
		width: 3rem;
		height: 3rem;
		font-size: 1rem;
		font-weight: 500;
		border-radius: 0.5rem;
	}

	.day-button:hover:not(.day-button--disabled):not(.day-button--empty) {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.day-button--today {
		background: var(--color-primary-100);
		color: var(--color-primary-800);
		font-weight: 600;
		border: 2px solid var(--color-primary-300);
	}

	.day-button--today:hover {
		background: var(--color-primary-200);
		border-color: var(--color-primary-400);
	}

	.day-button--selected {
		background: var(--color-primary-600);
		color: white;
		font-weight: 600;
		border: 2px solid var(--color-primary-700);
		box-shadow: 0 0 0 2px var(--color-primary-200);
	}

	.day-button--selected:hover {
		background: var(--color-primary-700);
		border-color: var(--color-primary-800);
	}

	/* Selected takes priority over today */
	.day-button--selected.day-button--today {
		background: var(--color-primary-600);
		color: white;
		border-color: var(--color-primary-700);
	}

	.day-button--has-slots:not(.day-button--past) {
		background: var(--bg-tertiary);
		color: var(--text-primary);
		font-weight: 500;
	}

	.day-button--past.day-button--has-slots {
		background: var(--bg-secondary);
		color: var(--text-tertiary);
	}

	.day-button--disabled {
		cursor: not-allowed;
		opacity: 0.4;
	}

	.day-button--empty {
		cursor: default;
	}

	/* Slot indicators */
	.slot-indicators {
		position: absolute;
		bottom: 0.125rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 0.125rem;
	}

	.calendar-container--medium .slot-indicators,
	.calendar-container--large .slot-indicators {
		bottom: 0.25rem;
		gap: 0.1875rem;
	}

	.slot-indicators--past {
		opacity: 0.4;
	}

	.slot-dot {
		width: 0.25rem;
		height: 0.25rem;
		border-radius: 50%;
		background: var(--color-primary-500);
	}

	.slot-dot--multiple {
		background: var(--color-primary-600);
	}

	.slot-indicators--past .slot-dot {
		background: var(--text-tertiary);
	}

	/* Legend */
	.calendar-legend {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 0.75rem;
		border-top: 1px solid var(--border-primary);
		font-size: 0.75rem;
	}

	.calendar-container--medium .calendar-legend,
	.calendar-container--large .calendar-legend {
		padding: 1rem;
		gap: 1.5rem;
		font-size: 0.875rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.calendar-container--medium .legend-item,
	.calendar-container--large .legend-item {
		gap: 0.5rem;
	}

	.legend-dot {
		width: 0.25rem;
		height: 0.25rem;
		border-radius: 50%;
	}

	.calendar-container--medium .legend-dot,
	.calendar-container--large .legend-dot {
		width: 0.375rem;
		height: 0.375rem;
	}

	.legend-dot--upcoming {
		background: var(--color-primary-500);
	}

	.legend-dot--past {
		background: var(--text-tertiary);
	}

	.legend-today {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 0.125rem;
		background: var(--color-primary-50);
		color: var(--color-primary-700);
		font-size: 0.625rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.calendar-container--medium .legend-today,
	.calendar-container--large .legend-today {
		width: 1rem;
		height: 1rem;
		font-size: 0.75rem;
		border-radius: 0.25rem;
	}

	.legend-label {
		color: var(--text-tertiary);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.calendar-container {
			max-width: 100%;
		}
		
		/* Reset all sizes to mobile-friendly on small screens */
		.calendar-header {
			padding: 1rem 0.75rem !important;
		}
		
		.calendar-nav {
			margin-bottom: 0.75rem !important;
		}
		
		.nav-button {
			width: 2rem !important;
			height: 2rem !important;
		}
		
		.nav-icon {
			width: 1rem !important;
			height: 1rem !important;
		}
		
		.month-display {
			gap: 0.5rem !important;
		}
		
		.calendar-icon {
			width: 1rem !important;
			height: 1rem !important;
		}
		
		.month-title {
			font-size: 0.875rem !important;
			font-weight: 500 !important;
		}
		
		.today-button {
			font-size: 0.75rem !important;
			padding: 0.25rem 0.5rem !important;
		}
		
		.month-summary {
			font-size: 0.75rem !important;
			margin-top: 0.25rem !important;
		}
		
		.day-headers {
			padding: 0 0.75rem !important;
			gap: 0.125rem !important;
			margin-bottom: 0.75rem !important;
		}
		
		.day-header {
			font-size: 0.75rem !important;
			font-weight: 500 !important;
			padding: 0.75rem 0 !important;
		}
		
		.calendar-grid {
			grid-template-rows: repeat(6, 2.75rem) !important;
			height: 18rem !important; /* 6 rows × 2.75rem + 5 gaps × 0.125rem + 0.5rem top padding */
			padding: 0.5rem 0.75rem 0.75rem !important;
			gap: 0.125rem !important;
		}
		
		.day-button {
			width: 2.25rem !important;
			height: 2.75rem !important;
			font-size: 0.75rem !important;
			font-weight: 400 !important;
		}
		
		.slot-indicators {
			bottom: 0.125rem !important;
			gap: 0.1rem !important;
		}
		
		.slot-dot {
			width: 0.2rem !important;
			height: 0.2rem !important;
		}
		
		.calendar-legend {
			padding: 0.75rem !important;
			gap: 1rem !important;
			font-size: 0.75rem !important;
		}
		
		.legend-item {
			gap: 0.375rem !important;
		}
		
		.legend-dot {
			width: 0.25rem !important;
			height: 0.25rem !important;
		}
		
		.legend-today {
			width: 0.75rem !important;
			height: 0.75rem !important;
			font-size: 0.625rem !important;
		}
	}
</style> 
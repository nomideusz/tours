<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Calendar from 'lucide-svelte/icons/calendar';

	interface Props {
		slotsMap: Map<string, number>; // date string (YYYY-MM-DD) -> slot count
		selectedDate?: string | null;
		onDateClick?: (date: string) => void;
		minDate?: string | null; // minimum selectable date (YYYY-MM-DD)
		class?: string;
	}

	let { 
		slotsMap, 
		selectedDate = null,
		onDateClick,
		minDate = null,
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

	function isPastWithSlots(day: number): boolean {
		return isPast(day) && hasSlots(day);
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
		// Don't allow clicking on past dates without slots
		if (isPast(day) && !hasSlots(day)) return;
		
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

		return days;
	});

	// Calculate total slots for the month
	let monthlySlotCount = $derived.by(() => {
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

<div class="mini-month-calendar rounded-xl {className}" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
	<!-- Header -->
	<div class="p-3 pb-2">
		<div class="flex items-center justify-between mb-2">
			<button
				type="button"
				onclick={previousMonth}
				class="p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
				style="color: var(--text-secondary);"
			>
				<ChevronLeft class="h-3.5 w-3.5" />
			</button>
			
			<h4 class="text-sm font-medium flex items-center gap-1.5" style="color: var(--text-primary);">
				<Calendar class="h-3.5 w-3.5" />
				{currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
			</h4>
			
			<button
				type="button"
				onclick={nextMonth}
				class="p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
				style="color: var(--text-secondary);"
			>
				<ChevronRight class="h-3.5 w-3.5" />
			</button>
		</div>
		
		{#if monthlySlotCount > 0}
			<p class="text-xs text-center" style="color: var(--text-tertiary);">
				{monthlySlotCount} slot{monthlySlotCount === 1 ? '' : 's'} this month
			</p>
		{/if}
	</div>

	<!-- Day headers -->
	<div class="grid grid-cols-7 gap-0.5 px-3 mb-1">
		{#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as day}
			<div class="text-center text-xs font-medium py-1" style="color: var(--text-tertiary);">
				{day}
			</div>
		{/each}
	</div>

	<!-- Calendar grid -->
	<div class="grid grid-cols-7 gap-0.5 px-3 pb-3">
		{#each calendarGrid as day}
			{#if day}
				{@const slotCount = getSlotCount(day)}
				{@const hasSlot = slotCount > 0}
				<button
					type="button"
					onclick={() => handleDateClick(day)}
					disabled={isPast(day) && !hasSlot}
					class="relative h-7 w-7 text-xs rounded transition-all 
						{isSelected(day) ? 'ring-1 ring-blue-500' : ''}
						{isPast(day) && !hasSlot ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:ring-1 hover:ring-blue-400'}"
					style="{isToday(day) 
						? 'background: var(--color-primary-50); color: var(--color-primary-700); font-weight: 500;' 
						: hasSlot
							? isPast(day) 
								? 'background: var(--bg-secondary); color: var(--text-tertiary);'
								: 'background: var(--bg-tertiary); color: var(--text-primary); font-weight: 500;'
							: 'color: var(--text-secondary);'
					}"
					title="{hasSlot ? `${slotCount} slot${slotCount === 1 ? '' : 's'}${isPast(day) ? ' (past)' : ''}` : isPast(day) ? 'Past date' : 'Add slots'}"
				>
					{day}
					{#if hasSlot}
						<span class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5 {isPast(day) ? 'opacity-40' : ''}">
							{#if slotCount === 1}
								<span class="w-1 h-1 rounded-full {isPast(day) ? 'bg-gray-400' : 'bg-blue-500'}"></span>
							{:else if slotCount === 2}
								<span class="w-1 h-1 rounded-full {isPast(day) ? 'bg-gray-400' : 'bg-blue-500'}"></span>
								<span class="w-1 h-1 rounded-full {isPast(day) ? 'bg-gray-400' : 'bg-blue-500'}"></span>
							{:else}
								<span class="w-1 h-1 rounded-full {isPast(day) ? 'bg-gray-500' : 'bg-blue-600'}"></span>
								<span class="w-1 h-1 rounded-full {isPast(day) ? 'bg-gray-500' : 'bg-blue-600'}"></span>
								<span class="w-1 h-1 rounded-full {isPast(day) ? 'bg-gray-500' : 'bg-blue-600'}"></span>
							{/if}
						</span>
					{/if}
				</button>
			{:else}
				<div class="h-7 w-7"></div>
			{/if}
		{/each}
	</div>
	
	<!-- Legend -->
	<div class="px-3 pb-3 pt-2 border-t flex items-center justify-center gap-3 text-xs" style="border-color: var(--border-primary);">
		<div class="flex items-center gap-1.5">
			<span class="w-1 h-1 rounded-full bg-blue-500"></span>
			<span style="color: var(--text-tertiary);">Upcoming</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="w-1 h-1 rounded-full bg-gray-400"></span>
			<span style="color: var(--text-tertiary);">Past</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 rounded text-xs flex items-center justify-center font-medium" 
				style="background: var(--color-primary-50); color: var(--color-primary-700);">
				T
			</span>
			<span style="color: var(--text-tertiary);">Today</span>
		</div>
	</div>
</div>

<style>
	.mini-month-calendar {
		width: 100%;
	}
	
	/* Only apply max-width in specific contexts */
	.mini-month-calendar:not(.w-full) {
		max-width: 280px;
	}
</style> 
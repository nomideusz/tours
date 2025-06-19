<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';

	let {
		value = $bindable(''),
		minDate = '',
		onchange
	} = $props();

	let currentMonth = $state(new Date());
	let selectedDate = $state<Date | null>(value ? new Date(value) : null);

	// Update selectedDate when value prop changes
	$effect(() => {
		selectedDate = value ? new Date(value) : null;
	});

	// Helper functions
	function formatDateForInput(date: Date): string {
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

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

	function selectDate(day: number) {
		const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
		selectedDate = date;
		value = formatDateForInput(date);
		onchange?.(value);
	}

	function isToday(day: number): boolean {
		const today = new Date();
		const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
		return date.toDateString() === today.toDateString();
	}

	function isSelected(day: number): boolean {
		if (!selectedDate) return false;
		const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
		return date.toDateString() === selectedDate.toDateString();
	}

	function isPastDate(day: number): boolean {
		if (!minDate) return false;
		const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
		const min = new Date(minDate);
		
		// Compare only the date part, not time
		date.setHours(0, 0, 0, 0);
		min.setHours(0, 0, 0, 0);
		
		return date < min;
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

	function goToToday() {
		const today = new Date();
		currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		if (!minDate || today >= new Date(minDate)) {
			selectedDate = today;
			value = formatDateForInput(today);
			onchange?.(value);
		}
	}
</script>

<div class="inline-calendar rounded-xl p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
	<!-- Calendar header -->
	<div class="flex items-center justify-between mb-4">
		<button
			type="button"
			onclick={previousMonth}
			class="p-2 rounded-lg transition-colors hover:bg-gray-100"
			style="color: var(--text-secondary);"
		>
			<ChevronLeft class="h-4 w-4" />
		</button>
		
		<div class="flex items-center gap-2">
			<h3 class="text-base font-semibold" style="color: var(--text-primary);">
				{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
			</h3>
			<button
				type="button"
				onclick={goToToday}
				class="px-2 py-1 text-xs font-medium rounded transition-colors"
				style="color: var(--color-primary-600);"
				onmouseenter={(e) => e.currentTarget.style.background = 'var(--color-primary-50)'}
				onmouseleave={(e) => e.currentTarget.style.background = 'transparent'}
			>
				Today
			</button>
		</div>
		
		<button
			type="button"
			onclick={nextMonth}
			class="p-2 rounded-lg transition-colors hover:bg-gray-100"
			style="color: var(--text-secondary);"
		>
			<ChevronRight class="h-4 w-4" />
		</button>
	</div>

	<!-- Day headers -->
	<div class="grid grid-cols-7 gap-1 mb-2">
		{#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as day}
			<div class="text-center text-xs font-medium py-2" style="color: var(--text-tertiary);">
				{day}
			</div>
		{/each}
	</div>

	<!-- Calendar grid -->
	<div class="grid grid-cols-7 gap-1">
		{#each calendarGrid as day}
			{#if day}
				<button
					type="button"
					onclick={() => selectDate(day)}
					disabled={isPastDate(day)}
					class="relative h-8 w-8 sm:h-10 sm:w-10 text-sm rounded-lg transition-all"
					style="{isSelected(day) 
						? 'background: var(--color-primary-600); color: white; font-weight: 500;' 
						: isToday(day) 
							? 'background: var(--color-primary-50); color: var(--color-primary-700); font-weight: 500; border: 1px solid var(--color-primary-200);' 
							: isPastDate(day)
								? 'color: var(--text-tertiary); cursor: not-allowed; opacity: 0.5;'
								: 'color: var(--text-primary);'
					}"
					onmouseenter={!isPastDate(day) ? (e) => {
						if (isSelected(day)) {
							e.currentTarget.style.background = 'var(--color-primary-700)';
						} else if (isToday(day)) {
							e.currentTarget.style.background = 'var(--color-primary-100)';
						} else {
							e.currentTarget.style.background = 'var(--bg-tertiary)';
						}
					} : null}
					onmouseleave={!isPastDate(day) ? (e) => {
						if (isSelected(day)) {
							e.currentTarget.style.background = 'var(--color-primary-600)';
						} else if (isToday(day)) {
							e.currentTarget.style.background = 'var(--color-primary-50)';
						} else {
							e.currentTarget.style.background = 'transparent';
						}
					} : null}
				>
					{day}
				</button>
			{:else}
				<div class="h-8 w-8 sm:h-10 sm:w-10"></div>
			{/if}
		{/each}
	</div>

	{#if selectedDate}
		<div class="mt-4 pt-4 border-t text-sm" style="border-color: var(--border-primary); color: var(--text-secondary);">
			Selected: <strong style="color: var(--text-primary);">{selectedDate.toLocaleDateString('en-US', { 
				weekday: 'short', 
				month: 'short', 
				day: 'numeric', 
				year: 'numeric' 
			})}</strong>
		</div>
	{/if}
</div>

<style>
	.inline-calendar {
		max-width: 24rem;
		width: 100%;
	}
	
	@media (max-width: 640px) {
		.inline-calendar {
			max-width: 100%;
		}
	}
</style> 
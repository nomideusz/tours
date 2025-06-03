<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Calendar from 'lucide-svelte/icons/calendar';
	import X from 'lucide-svelte/icons/x';

	let {
		value = $bindable(''),
		placeholder = 'Select date',
		disabled = false,
		error = false,
		minDate = '',
		label = '',
		required = false
	} = $props();

	const dispatch = createEventDispatcher();

	let isOpen = $state(false);
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
		dispatch('change', value);
		isOpen = false;
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
		return date < min;
	}

	function isCurrentMonth(day: number): boolean {
		return day >= 1 && day <= getDaysInMonth(currentMonth);
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
		currentMonth = new Date();
		const today = new Date();
		selectedDate = today;
		value = formatDateForInput(today);
		dispatch('change', value);
		isOpen = false;
	}

	function clearDate() {
		selectedDate = null;
		value = '';
		dispatch('change', '');
	}

	// Close calendar when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (!event.target || !(event.target as Element).closest('.date-picker-container')) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="date-picker-container relative">
	{#if label}
		<label class="form-label mb-2 block">
			{label}
			{#if required}<span class="text-red-500 ml-1">*</span>{/if}
		</label>
	{/if}

	<!-- Input field -->
	<div class="relative">
		<button
			type="button"
			onclick={() => !disabled && (isOpen = !isOpen)}
			class="form-input pl-10 pr-10 w-full text-left {error ? 'error' : ''} {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'}"
			{disabled}
		>
			<Calendar class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
			
			<span class={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
				{selectedDate 
					? selectedDate.toLocaleDateString('en-US', { 
						weekday: 'short', 
						month: 'short', 
						day: 'numeric', 
						year: 'numeric' 
					})
					: placeholder
				}
			</span>

			{#if selectedDate && !disabled}
				<button
					type="button"
					onclick={(e) => {
						e.stopPropagation();
						clearDate();
					}}
					class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
				>
					<X class="h-3 w-3" />
				</button>
			{/if}
		</button>
	</div>

	<!-- Calendar dropdown -->
	{#if isOpen}
		<div class="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4">
			<!-- Calendar header -->
			<div class="flex items-center justify-between mb-4">
				<button
					type="button"
					onclick={previousMonth}
					class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
				>
					<ChevronLeft class="h-4 w-4 text-gray-600" />
				</button>
				
				<div class="flex items-center gap-2">
					<h3 class="text-lg font-semibold text-gray-900">
						{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
					</h3>
					<button
						type="button"
						onclick={goToToday}
						class="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
					>
						Today
					</button>
				</div>
				
				<button
					type="button"
					onclick={nextMonth}
					class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
				>
					<ChevronRight class="h-4 w-4 text-gray-600" />
				</button>
			</div>

			<!-- Day headers -->
			<div class="grid grid-cols-7 gap-1 mb-2">
				{#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as day}
					<div class="text-center text-xs font-medium text-gray-500 py-2">
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
							onclick={() => !isPastDate(day) && selectDate(day)}
							disabled={isPastDate(day)}
							class="
								relative h-8 w-8 text-sm rounded-lg transition-all
								{isSelected(day) 
									? 'bg-blue-600 text-white font-medium' 
									: isToday(day) 
										? 'bg-blue-50 text-blue-700 font-medium border border-blue-200' 
										: isPastDate(day)
											? 'text-gray-300 cursor-not-allowed'
											: 'text-gray-700 hover:bg-gray-100'
								}
							"
						>
							{day}
						</button>
					{:else}
						<div class="h-8 w-8"></div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.date-picker-container {
		/* Ensure proper z-index stacking */
	}
</style> 
<script lang="ts">
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
		required = false,
		onchange
	} = $props();

	// Generate unique ID for this DatePicker instance
	const instanceId = `datepicker-${Math.random().toString(36).substr(2, 9)}`;
	
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
		onchange?.(value);
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
		onchange?.(value);
		isOpen = false;
	}

	function clearDate() {
		selectedDate = null;
		value = '';
		onchange?.('');
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
		<label for={instanceId} class="form-label">
			{label}
			{#if required}<span style="color: var(--color-error);" class="ml-1">*</span>{/if}
		</label>
	{/if}

	<!-- Input field -->
	<div class="relative">
		<div
			role="button"
			tabindex={disabled ? -1 : 0}
			id={instanceId}
			onclick={() => !disabled && (isOpen = !isOpen)}
			onkeydown={(e) => !disabled && (e.key === 'Enter' || e.key === ' ') && (isOpen = !isOpen)}
			class="form-input w-full text-left {error ? 'error' : ''}"
			style="{disabled 
				? 'opacity: 0.5; cursor: not-allowed;' 
				: 'cursor: pointer;'
			} padding-left: 2.5rem; padding-right: 2.5rem;"
		>
			<Calendar 
				class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
				style="color: var(--text-tertiary);" 
			/>
			
			<span style="color: {selectedDate ? 'var(--text-primary)' : 'var(--text-secondary)'};">
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
					class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors"
					style="color: var(--text-tertiary);"
					onmouseenter={(e) => {
						e.currentTarget.style.color = 'var(--text-secondary)';
						e.currentTarget.style.background = 'var(--bg-tertiary)';
					}}
					onmouseleave={(e) => {
						e.currentTarget.style.color = 'var(--text-tertiary)';
						e.currentTarget.style.background = 'transparent';
					}}
				>
					<X class="h-3 w-3" />
				</button>
			{/if}
		</div>
	</div>

	<!-- Calendar dropdown -->
	{#if isOpen}
		<div 
			class="absolute top-full left-0 mt-1 w-80 rounded-lg shadow-lg border p-4 z-50"
			style="background: var(--bg-primary); border-color: var(--border-primary);"
		>
			<!-- Calendar header -->
			<div class="flex items-center justify-between mb-4">
				<button
					type="button"
					onclick={previousMonth}
					class="p-2 rounded-lg transition-colors"
					style="color: var(--text-secondary);"
					onmouseenter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
					onmouseleave={(e) => e.currentTarget.style.background = 'transparent'}
				>
					<ChevronLeft class="h-4 w-4" />
				</button>
				
				<div class="flex items-center gap-2">
					<h3 class="text-lg font-semibold" style="color: var(--text-primary);">
						{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
					</h3>
					<button
						type="button"
						onclick={goToToday}
						class="px-2 py-1 text-xs font-medium transition-colors"
						style="color: var(--color-primary-600);"
						onmouseenter={(e) => e.currentTarget.style.color = 'var(--color-primary-700)'}
						onmouseleave={(e) => e.currentTarget.style.color = 'var(--color-primary-600)'}
					>
						Today
					</button>
				</div>
				
				<button
					type="button"
					onclick={nextMonth}
					class="p-2 rounded-lg transition-colors"
					style="color: var(--text-secondary);"
					onmouseenter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
					onmouseleave={(e) => e.currentTarget.style.background = 'transparent'}
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
							onclick={() => !isPastDate(day) && selectDate(day)}
							disabled={isPastDate(day)}
							class="relative h-8 w-8 text-sm rounded-lg transition-all"
							style="{isSelected(day) 
								? 'background: var(--color-primary-600); color: white; font-weight: 500;' 
								: isToday(day) 
									? 'background: var(--color-primary-50); color: var(--color-primary-700); font-weight: 500; border: 1px solid var(--color-primary-200);' 
									: isPastDate(day)
										? 'color: var(--text-tertiary); cursor: not-allowed;'
										: 'color: var(--text-primary);'
							}"
							onmouseenter={!isSelected(day) && !isPastDate(day) ? (e) => {
								if (!isToday(day)) {
									e.currentTarget.style.background = 'var(--bg-secondary)';
								}
							} : null}
							onmouseleave={!isSelected(day) && !isPastDate(day) ? (e) => {
								if (!isToday(day)) {
									e.currentTarget.style.background = 'transparent';
								}
							} : null}
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
<script lang="ts">
	import MiniMonthCalendar from '$lib/components/MiniMonthCalendar.svelte';
	import { getFieldError, type ValidationError } from '$lib/validation.js';
	
	interface Props {
		date: string;
		slotsMap: Map<string, number>;
		errors: ValidationError[];
		isEditMode?: boolean;
		onDateChange: (date: string) => void;
		isMobile?: boolean;
	}
	
	let { 
		date = $bindable(),
		slotsMap,
		errors,
		isEditMode = false,
		onDateChange,
		isMobile = false
	}: Props = $props();
	
	let error = $derived(getFieldError(errors, 'date'));
	let hasSlots = $derived(slotsMap.size > 0);
</script>

<div class="{isMobile ? '' : 'lg:col-span-1'}">
	<div class="form-label">Select Date</div>
	<MiniMonthCalendar
		slotsMap={slotsMap}
		selectedDate={date}
		minDate={isEditMode ? undefined : new Date().toISOString().split('T')[0]}
		onDateClick={onDateChange}
	/>
	{#if error}
		<p class="form-error mt-2">{error}</p>
	{/if}
	{#if hasSlots}
		<p class="text-xs mt-2" style="color: var(--text-tertiary);">
			{isMobile ? 'Gray = past • Blue = upcoming' : 'Gray dots = past slots • Blue dots = upcoming slots'}
		</p>
	{/if}
</div> 
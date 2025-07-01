<script lang="ts">
	import TimePicker from '$lib/components/TimePicker.svelte';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';
	import { getFieldError, hasFieldError, type ValidationError } from '$lib/validation.js';
	
	interface Props {
		startTime: string;
		endTime: string;
		tourDuration?: number;
		errors: ValidationError[];
		isEditMode?: boolean;
		currentSlotTime?: { start: string; end: string };
		onStartTimeChange: () => void;
		onEndTimeChange: () => void;
		onAutoSetEndTime: () => void;
		isMobile?: boolean;
	}
	
	let { 
		startTime = $bindable(),
		endTime = $bindable(),
		tourDuration,
		errors,
		isEditMode = false,
		currentSlotTime,
		onStartTimeChange,
		onEndTimeChange,
		onAutoSetEndTime,
		isMobile = false
	}: Props = $props();
	
	let startTimeError = $derived(getFieldError(errors, 'startTime'));
	let endTimeError = $derived(getFieldError(errors, 'endTime'));
	let hasStartTimeError = $derived(hasFieldError(errors, 'startTime'));
	let hasEndTimeError = $derived(hasFieldError(errors, 'endTime'));
</script>

{#if isMobile}
	<!-- Mobile layout -->
	<div>
		<div class="form-label">Time Selection</div>
		<div class="grid grid-cols-2 gap-3">
			<TimePicker
				bind:value={startTime}
				label="Start time"
				placeholder="Select start time"
				use24hour={true}
				onchange={onStartTimeChange}
				error={hasStartTimeError}
			/>
			<div>
				<TimePicker
					bind:value={endTime}
					label="End time"
					placeholder="Select end time"
					use24hour={true}
					onchange={onEndTimeChange}
					error={hasEndTimeError}
				/>
				{#if tourDuration && startTime}
					<button
						type="button"
						onclick={onAutoSetEndTime}
						class="mt-2 w-full px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
						style="border-color: var(--border-primary); color: var(--text-secondary);"
						title="Set end time based on tour duration"
					>
						Auto ({formatDuration(tourDuration)})
					</button>
				{/if}
			</div>
		</div>
		
		{#if startTimeError}
			<p class="form-error mt-2">{startTimeError}</p>
		{/if}
		{#if endTimeError}
			<p class="form-error mt-2">{endTimeError}</p>
		{/if}
	</div>
{:else}
	<!-- Desktop layout -->
	<div class="grid grid-cols-2 gap-4">
		<div>
			<TimePicker
				bind:value={startTime}
				label="Start time"
				placeholder="Select start time"
				use24hour={true}
				onchange={onStartTimeChange}
				error={hasStartTimeError}
			/>
		</div>
		<div>
			<TimePicker
				bind:value={endTime}
				label="End time"
				placeholder="Select end time"
				use24hour={true}
				onchange={onEndTimeChange}
				error={hasEndTimeError}
			/>
		</div>
	</div>
	
	{#if startTimeError}
		<p class="form-error">{startTimeError}</p>
	{/if}
	{#if endTimeError}
		<p class="form-error">{endTimeError}</p>
	{/if}
	
	{#if isEditMode && currentSlotTime}
		<div class="text-sm" style="color: var(--text-secondary);">
			<strong>Current:</strong> {currentSlotTime.start} - {currentSlotTime.end}
		</div>
	{/if}
{/if} 
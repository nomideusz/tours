<script lang="ts">
	import Clock from 'lucide-svelte/icons/clock';
	
	interface Props {
		startTime: string;
		endTime: string;
		label?: string;
		required?: boolean;
		disabled?: boolean;
		error?: boolean;
		defaultDuration?: number; // in minutes
		onStartTimeChange?: (startTime: string) => void;
		onEndTimeChange?: (endTime: string) => void;
		resetManualFlag?: boolean;
	}
	
	let {
		startTime = $bindable(),
		endTime = $bindable(),
		label = 'Time',
		required = false,
		disabled = false,
		error = false,
		defaultDuration = 120, // 2 hours default
		onStartTimeChange,
		onEndTimeChange,
		resetManualFlag = false
	}: Props = $props();
	
	// Add minutes to time string
	function addMinutesToTime(timeString: string, minutes: number): string {
		const [hour, minute] = timeString.split(':').map(Number);
		const totalMinutes = hour * 60 + minute + minutes;
		
		// Allow hours to go beyond 24 for next day
		const newHour = Math.floor(totalMinutes / 60);
		const newMinute = totalMinutes % 60;
		
		// If it goes to next day, wrap around to 24-hour format
		const displayHour = newHour % 24;
		
		return `${displayHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
	}
	
	// Calculate duration from times
	let duration = $derived.by(() => {
		if (!startTime || !endTime) return 0;
		
		const [startHour, startMinute] = startTime.split(':').map(Number);
		const [endHour, endMinute] = endTime.split(':').map(Number);
		
		const startMinutes = startHour * 60 + startMinute;
		let endMinutes = endHour * 60 + endMinute;
		
		// If end time is before start time, it spans midnight
		if (endMinutes <= startMinutes) {
			endMinutes += 24 * 60; // Add 24 hours
		}
		
		return endMinutes - startMinutes;
	});
	
	// Format duration for display
	let durationLabel = $derived.by(() => {
		if (duration <= 0) return '--';
		
		const hours = Math.floor(duration / 60);
		const minutes = duration % 60;
		
		if (hours === 0) return `${minutes}m`;
		if (minutes === 0) return `${hours}h`;
		return `${hours}h ${minutes}m`;
	});
	
	// Track if user has manually changed end time
	let endTimeManuallySet = $state(false);
	
	// Handle start time change
	function handleStartTimeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newStartTime = target.value;
		
		if (newStartTime) {
			startTime = newStartTime;
			
			// Auto-calculate end time unless user has manually set it
			if (!endTimeManuallySet) {
				endTime = addMinutesToTime(newStartTime, defaultDuration);
				onEndTimeChange?.(endTime);
			}
			
			onStartTimeChange?.(newStartTime);
		}
	}
	
	// Handle end time change
	function handleEndTimeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		endTime = target.value;
		endTimeManuallySet = true;
		onEndTimeChange?.(target.value);
	}
	
	// Reset manual flag when component gets new props
	$effect(() => {
		// If both times change from outside, reset the manual flag
		if (!startTime && !endTime) {
			endTimeManuallySet = false;
		}
		// Also reset if explicitly requested
		if (resetManualFlag) {
			endTimeManuallySet = false;
		}
	});
</script>

<div class="time-range">
	{#if label}
		<label class="form-label block mb-2">
			{label}
			{#if required}<span class="text-red-500 ml-1">*</span>{/if}
		</label>
	{/if}
	
	<div class="flex items-center gap-3">
		<!-- Start Time -->
		<div class="flex-1">
			<input
				type="time"
				bind:value={startTime}
				oninput={handleStartTimeChange}
				placeholder="Start"
				class="form-input w-full"
				class:error
				class:disabled
				{disabled}
				{required}
			/>
		</div>
		
		<!-- Separator -->
		<div class="text-sm" style="color: var(--text-tertiary);">
			to
		</div>
		
		<!-- End Time -->
		<div class="flex-1">
			<input
				type="time"
				bind:value={endTime}
				oninput={handleEndTimeChange}
				placeholder="End"
				class="form-input w-full"
				class:error
				class:disabled
				{disabled}
			/>
		</div>
	</div>
	
	<!-- Duration Display -->
	{#if startTime || endTime}
		<div class="mt-2 flex items-center gap-2 text-sm" style="color: var(--text-secondary);">
			<div class="flex items-center gap-2">
				<Clock class="w-4 h-4" />
				<span>Duration: <strong>{durationLabel}</strong></span>
				{#if endTime && startTime && endTime <= startTime}
					<span class="text-xs" style="color: var(--color-danger-600);">(spans midnight)</span>
				{/if}
			</div>
			{#if defaultDuration && duration > 0 && duration !== defaultDuration}
				<span class="separator">•</span>
				<button
					type="button"
					onclick={() => {
						endTime = addMinutesToTime(startTime, defaultDuration);
						endTimeManuallySet = false;
						onEndTimeChange?.(endTime);
					}}
					class="reset-button"
				>
					Reset to {Math.floor(defaultDuration / 60)}h{defaultDuration % 60 ? ` ${defaultDuration % 60}m` : ''}
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.error {
		border-color: var(--color-danger-300) !important;
	}
	
	/* Ensure time inputs work well on mobile */
	input[type="time"] {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
	}
	
	input[type="time"]::-webkit-calendar-picker-indicator {
		cursor: pointer;
	}
	
	/* Better focus states */
	input[type="time"]:focus {
		border-color: var(--color-primary-300);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
		outline: none;
	}
	
	.reset-button {
		background: transparent;
		border: none;
		color: var(--color-primary-600);
		font-size: 0.75rem;
		cursor: pointer;
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast) ease;
		white-space: nowrap;
	}
	
	.reset-button:hover {
		color: var(--color-primary-700);
		background: var(--bg-secondary);
	}
	
	.separator {
		color: var(--text-tertiary);
		font-size: 0.875rem;
	}
</style> 
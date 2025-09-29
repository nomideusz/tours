<script lang="ts">
	import Clock from 'lucide-svelte/icons/clock';
	import Calendar from 'lucide-svelte/icons/calendar';
	import DatePicker from '$lib/components/DatePicker.svelte';
	
	interface Props {
		startDate: string;
		startTime: string;
		endDate: string;
		endTime: string;
		label?: string;
		required?: boolean;
		disabled?: boolean;
		error?: boolean;
		defaultDuration?: number; // in minutes
		tourDuration?: number; // tour's default duration
		onStartTimeChange?: (startTime: string) => void;
		onEndTimeChange?: (endTime: string) => void;
		onEndDateChange?: (endDate: string) => void;
	}
	
	let {
		startDate = $bindable(),
		startTime = $bindable(),
		endDate = $bindable(),
		endTime = $bindable(),
		label = 'Time Slot',
		required = false,
		disabled = false,
		error = false,
		defaultDuration,
		tourDuration,
		onStartTimeChange,
		onEndTimeChange,
		onEndDateChange
	}: Props = $props();
	
	// Calculate duration between start and end
	let duration = $derived.by(() => {
		if (!startDate || !startTime || !endDate || !endTime) return 0;
		
		const start = new Date(`${startDate}T${startTime}:00`);
		const end = new Date(`${endDate}T${endTime}:00`);
		
		return Math.floor((end.getTime() - start.getTime()) / 60000); // minutes
	});
	
	// Format duration for display
	let durationLabel = $derived.by(() => {
		if (duration <= 0) return '--';
		
		const days = Math.floor(duration / 1440);
		const hours = Math.floor((duration % 1440) / 60);
		const minutes = duration % 60;
		
		let parts = [];
		if (days > 0) parts.push(`${days}d`);
		if (hours > 0) parts.push(`${hours}h`);
		if (minutes > 0) parts.push(`${minutes}m`);
		
		return parts.join(' ');
	});
	
	// Check if duration matches tour duration
	let isDefaultDuration = $derived(tourDuration && duration === tourDuration);
	
	// Update end date/time when start changes
	function updateEndFromStart() {
		if (!startDate || !startTime || !tourDuration) return;
		
		const start = new Date(`${startDate}T${startTime}:00`);
		const end = new Date(start.getTime() + tourDuration * 60000);
		
		endDate = end.toISOString().split('T')[0];
		endTime = end.toTimeString().slice(0, 5);
		
		onEndDateChange?.(endDate);
		onEndTimeChange?.(endTime);
	}
	
	// Auto-update end date when start date changes
	let previousStartDate = $state(startDate);
	let isInitialized = $state(false);
	
	$effect(() => {
		// Initial setup - when component first gets valid data
		if (!isInitialized && startDate && startTime && tourDuration && !endDate) {
			isInitialized = true;
			updateEndFromStart();
		}
		
		// Handle subsequent start date changes
		if (startDate && startDate !== previousStartDate) {
			previousStartDate = startDate;
			// When start date changes, recalculate end date based on tour duration
			if (startTime && tourDuration) {
				updateEndFromStart();
			}
		}
	});
	
	// Handle time input changes
	function handleStartTimeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		startTime = target.value;
		onStartTimeChange?.(startTime);
		
		// Auto-update end time to maintain duration
		if (!disabled && tourDuration) {
			updateEndFromStart();
		}
	}
	
	function handleEndTimeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		endTime = target.value;
		onEndTimeChange?.(endTime);
	}
</script>

<div class="multi-day-time-range" class:disabled class:error>
	{#if label}
		<div class="form-label block mb-3">
			{label}
			{#if required}<span class="text-red-500 ml-1">*</span>{/if}
		</div>
	{/if}
	
	<!-- Start Date/Time -->
	<div class="datetime-group">
		<h4 class="group-label">
			<Calendar class="w-4 h-4" />
			Start
		</h4>
		<div class="datetime-inputs">
			<div class="date-field">
				<DatePicker
					bind:value={startDate}
					label=""
					placeholder="Select date"
					minDate={new Date().toISOString().split('T')[0]}
					{disabled}
					onchange={() => {
						if (tourDuration) updateEndFromStart();
					}}
				/>
			</div>
			<div class="time-field">
				<input
					type="time"
					bind:value={startTime}
					oninput={handleStartTimeChange}
					{disabled}
					class="time-input"
					step="300"
				/>
			</div>
		</div>
	</div>
	
	<!-- Duration Display -->
	<div class="duration-display">
		<Clock class="w-4 h-4" />
		<span class="duration-text">{durationLabel}</span>
		{#if !isDefaultDuration && tourDuration}
			<span class="duration-warning">
				(Tour default: {Math.floor(tourDuration / 60)}h{tourDuration % 60 ? ` ${tourDuration % 60}m` : ''})
			</span>
		{/if}
	</div>
	
	<!-- End Date/Time -->
	<div class="datetime-group">
		<h4 class="group-label">
			<Calendar class="w-4 h-4" />
			End
		</h4>
		<div class="datetime-inputs">
			<div class="date-field">
				<DatePicker
					bind:value={endDate}
					label=""
					placeholder="Select date"
					minDate={startDate}
					{disabled}
					onchange={() => onEndDateChange?.(endDate)}
				/>
			</div>
			<div class="time-field">
				<input
					type="time"
					bind:value={endTime}
					oninput={handleEndTimeChange}
					{disabled}
					class="time-input"
					step="300"
				/>
			</div>
		</div>
	</div>
	
	<!-- Reset button -->
	{#if tourDuration && duration > 0 && duration !== tourDuration && !disabled}
		<div class="reset-container">
			<button
				type="button"
				onclick={updateEndFromStart}
				class="reset-button"
			>
				Reset to tour duration ({Math.floor(tourDuration / 60)}h{tourDuration % 60 ? ` ${tourDuration % 60}m` : ''})
			</button>
		</div>
	{/if}
</div>

<style>
	.multi-day-time-range {
		width: 100%;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
	}
	
	.datetime-group {
		margin-bottom: 1.5rem;
	}
	
	.datetime-group:last-child {
		margin-bottom: 0;
	}
	
	.group-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.datetime-inputs {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.75rem;
		align-items: center;
	}
	
	.date-field {
		flex: 1;
	}
	
	.time-field {
		width: 120px;
	}
	
	.time-input {
		width: 100%;
		padding: 0.75rem 1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: 0.875rem;
		transition: all var(--transition-fast) ease;
		cursor: pointer;
	}
	
	.time-input:hover:not(:disabled) {
		border-color: var(--border-secondary);
	}
	
	.time-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
	
	.duration-display {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		margin: 1.5rem -1.5rem;
		background: var(--bg-primary);
		border-top: 1px solid var(--border-primary);
		border-bottom: 1px solid var(--border-primary);
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	.duration-text {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 1rem;
	}
	
	.duration-warning {
		font-size: 0.75rem;
		color: var(--color-warning-600);
		background: var(--color-warning-50);
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-sm);
	}
	
	.reset-container {
		display: flex;
		justify-content: center;
		margin-top: 1rem;
	}
	
	.reset-button {
		background: transparent;
		border: 1px solid var(--border-secondary);
		color: var(--color-primary-600);
		font-size: 0.75rem;
		cursor: pointer;
		padding: 0.5rem 1rem;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast) ease;
		white-space: nowrap;
	}
	
	.reset-button:hover {
		color: var(--color-primary-700);
		background: var(--bg-secondary);
		border-color: var(--color-primary-200);
	}
	
	/* Disabled state */
	.disabled {
		opacity: 0.6;
		pointer-events: none;
	}
	
	/* Error state */
	.error {
		border-color: var(--color-danger-300);
		background: var(--color-danger-50);
	}
	
	.error .time-input {
		border-color: var(--color-danger-300);
	}
	
	.error .time-input:focus {
		border-color: var(--color-danger-500);
		box-shadow: 0 0 0 3px var(--color-danger-100);
	}
	
	/* Mobile optimizations */
	@media (max-width: 640px) {
		.multi-day-time-range {
			padding: 1rem;
		}
		
		.datetime-inputs {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
		
		.time-field {
			width: 100%;
		}
		
		.duration-display {
			margin: 1rem -1rem;
			padding: 0.75rem;
		}
	}
</style>

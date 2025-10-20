<script lang="ts">
	import Clock from 'lucide-svelte/icons/clock';
	
	interface Props {
		value: number; // Total minutes
		error?: boolean;
		onblur?: () => void;
	}
	
	let { value = $bindable(0), error = false, onblur }: Props = $props();
	
	// Internal state for the inputs
	let days = $state(0);
	let hours = $state(0);
	let minutes = $state(0);
	
	// Track if we're updating from internal changes
	let updatingFromInput = $state(false);
	
	// Update days/hours/minutes when value changes externally
	$effect(() => {
		if (!updatingFromInput) {
			const newDays = Math.floor(value / 1440);
			const newHours = Math.floor((value % 1440) / 60);
			const newMinutes = value % 60;
			
			days = newDays;
			hours = newHours;
			minutes = newMinutes;
		}
	});
	
	// Update total when inputs change
	function updateTotal() {
		updatingFromInput = true;
		const totalMinutes = (days || 0) * 1440 + (hours || 0) * 60 + (minutes || 0);
		value = totalMinutes;
		setTimeout(() => updatingFromInput = false, 0);
	}
	
	function handleDaysChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const val = parseInt(input.value) || 0;
		days = Math.max(0, Math.min(30, val)); // Max 30 days
		updateTotal();
	}
	
	function handleHoursChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const val = parseInt(input.value) || 0;
		hours = Math.max(0, Math.min(23, val)); // Max 23 hours
		updateTotal();
	}
	
	function handleMinutesChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const val = parseInt(input.value) || 0;
		minutes = Math.max(0, Math.min(59, val)); // Max 59 minutes
		updateTotal();
	}
</script>

<div class="duration-input-container">
	<div class="duration-inputs">
		<!-- Days Input -->
		<div class="duration-field">
			<input
				type="number"
				min="0"
				max="30"
				step="1"
				value={days}
				oninput={handleDaysChange}
				onblur={onblur}
				placeholder="0"
				class="form-input duration-input {error ? 'error' : ''}"
			/>
			<span class="duration-label">days</span>
		</div>
		
		<!-- Separator -->
		<span class="duration-separator">:</span>
		
		<!-- Hours Input -->
		<div class="duration-field">
			<input
				type="number"
				min="0"
				max="23"
				step="1"
				value={hours}
				oninput={handleHoursChange}
				onblur={onblur}
				placeholder="0"
				class="form-input duration-input {error ? 'error' : ''}"
			/>
			<span class="duration-label">hours</span>
		</div>
		
		<!-- Separator -->
		<span class="duration-separator">:</span>
		
		<!-- Minutes Input -->
		<div class="duration-field">
			<input
				type="number"
				min="0"
				max="59"
				step="5"
				value={minutes}
				oninput={handleMinutesChange}
				onblur={onblur}
				placeholder="0"
				class="form-input duration-input {error ? 'error' : ''}"
			/>
			<span class="duration-label">minutes</span>
		</div>
	</div>
</div>

<style>
	.duration-input-container {
		display: flex;
		flex-direction: column;
	}
	
	.duration-inputs {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}
	
	.duration-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}
	
	.duration-input {
		text-align: center;
		font-weight: 500;
		font-size: 1.125rem;
		padding: 0.625rem 0.5rem;
	}
	
	.duration-label {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-align: center;
		text-transform: uppercase;
		letter-spacing: 0.025em;
		font-weight: 500;
	}
	
	.duration-separator {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-secondary);
		/* Align to center of input field (not including label) */
		margin-top: 0.625rem;
		line-height: 1;
	}
	
	/* Remove spinner arrows from number inputs */
	.duration-input::-webkit-outer-spin-button,
	.duration-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
	}
	
	.duration-input[type=number] {
		-moz-appearance: textfield;
		appearance: textfield;
	}
</style>


<script lang="ts">
	import Clock from 'lucide-svelte/icons/clock';
	
	let {
		value = $bindable(''),
		label = '',
		placeholder = 'Select time',
		min = '',
		max = '',
		step = '',
		required = false,
		disabled = false,
		error = false,
		class: className = '',
		id = `time-${Math.random().toString(36).substr(2, 9)}`,
		onchange = undefined
	}: {
		value?: string;
		label?: string;
		placeholder?: string;
		min?: string;
		max?: string;
		step?: string;
		required?: boolean;
		disabled?: boolean;
		error?: boolean;
		class?: string;
		id?: string;
		onchange?: (value: string) => void;
	} = $props();
	
	let timeInputRef = $state<HTMLInputElement | undefined>(undefined);
	
	// Format time for display
	function formatTimeDisplay(timeStr: string): string {
		if (!timeStr) return placeholder;
		
		// Parse the time string (HH:mm format)
		const [hours, minutes] = timeStr.split(':').map(Number);
		
		// Format in 24-hour format
		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
	}
	
	function handleChange() {
		onchange?.(value);
	}
	
	// Try to open picker programmatically for better desktop experience
	function handleClick() {
		if (!timeInputRef) return;
		
		// Try showPicker() for desktop browsers
		if (typeof timeInputRef.showPicker === 'function') {
			try {
				timeInputRef.showPicker();
			} catch (e) {
				// Fallback to default behavior
			}
		}
		// For iOS and browsers without showPicker, the native click will work
	}
</script>

<div class="native-time-picker {className}">
	{#if label}
		<label for={id} class="form-label">
			{label}
			{#if required}
				<span style="color: var(--color-error);" class="ml-1">*</span>
			{/if}
		</label>
	{/if}
	
	<!-- Use label wrapper for iOS compatibility -->
	<label class="picker-label-wrapper">
		<!-- Visual button layer -->
		<div class="time-picker-button {error ? 'error' : ''} {disabled ? 'disabled' : ''}">
			<Clock class="h-4 w-4" style="color: var(--text-primary);" />
			<span class="time-display" style="color: {value ? 'var(--text-primary)' : 'var(--text-secondary)'};">
				{formatTimeDisplay(value)}
			</span>
		</div>
		
		<!-- Actual input - overlays the button -->
		<input
			bind:this={timeInputRef}
			{id}
			type="time"
			bind:value={value}
			{min}
			{max}
			{step}
			{required}
			{disabled}
			class="overlay-input"
			onclick={handleClick}
			onchange={handleChange}
		/>
	</label>
</div>

<style>
	.native-time-picker {
		width: 100%;
	}
	
	.picker-label-wrapper {
		position: relative;
		display: block;
		width: 100%;
		cursor: pointer;
	}
	
	.time-picker-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		text-align: left;
		pointer-events: none;
		position: relative;
		z-index: 0;
		height: 2.75rem;
	}
	
	.time-picker-button.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.time-picker-button.error {
		border-color: var(--color-error);
	}
	
	.time-display {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	/* Overlay input - covers the entire button */
	.overlay-input {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
		z-index: 1;
	}
	
	/* Hover effect via input */
	.picker-label-wrapper:has(.overlay-input:not(:disabled):hover) .time-picker-button:not(.disabled) {
		border-color: var(--color-primary-300);
	}
	
	/* Focus effect via input */
	.picker-label-wrapper:has(.overlay-input:focus) .time-picker-button {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
	
	/* Disabled state */
	.picker-label-wrapper:has(.overlay-input:disabled) {
		cursor: not-allowed;
	}
</style>


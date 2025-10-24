<script lang="ts">
	import Calendar from 'lucide-svelte/icons/calendar';
	
	let {
		value = $bindable(''),
		label = '',
		placeholder = 'Select date',
		min = '',
		max = '',
		required = false,
		disabled = false,
		error = false,
		class: className = '',
		id = `date-${Math.random().toString(36).substr(2, 9)}`,
		onchange = undefined
	}: {
		value?: string;
		label?: string;
		placeholder?: string;
		min?: string;
		max?: string;
		required?: boolean;
		disabled?: boolean;
		error?: boolean;
		class?: string;
		id?: string;
		onchange?: (value: string) => void;
	} = $props();
	
	let dateInputRef = $state<HTMLInputElement | undefined>(undefined);
	
	// Format date for display
	function formatDateDisplay(dateStr: string): string {
		if (!dateStr) return placeholder;
		const [y, m, d] = dateStr.split('-').map(Number);
		const date = new Date(y, m - 1, d);
		return date.toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			year: 'numeric' 
		});
	}
	
	function handleChange() {
		onchange?.(value);
	}
	
	// Try to open picker programmatically for better desktop experience
	function handleClick() {
		if (!dateInputRef) return;
		
		// Try showPicker() for desktop browsers
		if (typeof dateInputRef.showPicker === 'function') {
			try {
				dateInputRef.showPicker();
			} catch (e) {
				// Fallback to default behavior
			}
		}
		// For iOS and browsers without showPicker, the native click will work
	}
</script>

<div class="native-date-picker {className}">
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
		<div class="date-picker-button {error ? 'error' : ''} {disabled ? 'disabled' : ''}">
			<Calendar class="h-4 w-4" style="color: var(--text-primary);" />
			<span class="date-display" style="color: {value ? 'var(--text-primary)' : 'var(--text-secondary)'};">
				{formatDateDisplay(value)}
			</span>
		</div>
		
		<!-- Actual input - overlays the button -->
		<input
			bind:this={dateInputRef}
			{id}
			type="date"
			bind:value={value}
			{min}
			{max}
			{required}
			{disabled}
			class="overlay-input"
			onclick={handleClick}
			onchange={handleChange}
		/>
	</label>
</div>

<style>
	.native-date-picker {
		width: 100%;
	}
	
	.picker-label-wrapper {
		position: relative;
		display: block;
		width: 100%;
		cursor: pointer;
	}
	
	.date-picker-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.625rem 1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		text-align: left;
		pointer-events: none;
		position: relative;
		z-index: 0;
	}
	
	.date-picker-button.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.date-picker-button.error {
		border-color: var(--color-error);
	}
	
	.date-display {
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
	.picker-label-wrapper:has(.overlay-input:not(:disabled):hover) .date-picker-button:not(.disabled) {
		border-color: var(--color-primary-300);
		background: var(--bg-secondary);
	}
	
	/* Focus effect via input */
	.picker-label-wrapper:has(.overlay-input:focus) .date-picker-button {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
	
	/* Disabled state */
	.picker-label-wrapper:has(.overlay-input:disabled) {
		cursor: not-allowed;
	}
</style>


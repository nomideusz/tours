<script lang="ts">
	import Clock from 'lucide-svelte/icons/clock';
	import { browser } from '$app/environment';
	
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
	
	// Detect if showPicker is supported (not in Firefox)
	// Start with null to indicate we haven't checked yet
	let supportsShowPicker = $state<boolean | null>(null);
	
	$effect(() => {
		if (browser && timeInputRef && supportsShowPicker === null) {
			supportsShowPicker = typeof timeInputRef.showPicker === 'function';
		}
	});
	
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
	
	function openPicker() {
		if (!timeInputRef || !supportsShowPicker) return;
		
		try {
			timeInputRef.showPicker();
		} catch (e) {
			console.error('Failed to open picker:', e);
		}
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
	
	<div class="picker-wrapper">
		<!-- Button for browsers with showPicker support - only show if confirmed -->
		{#if supportsShowPicker === true}
			<button
				type="button"
				onclick={openPicker}
				class="time-picker-button {error ? 'error' : ''}"
				disabled={disabled}
			>
				<Clock class="h-4 w-4" style="color: var(--text-primary);" />
				<span class="time-display" style="color: {value ? 'var(--text-primary)' : 'var(--text-secondary)'};">
					{formatTimeDisplay(value)}
				</span>
			</button>
			
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
				class="hidden-time-input"
				onchange={handleChange}
			/>
		{:else}
			<!-- Native input for Firefox and during detection -->
			<div class="native-input-wrapper">
				<Clock class="input-icon" style="color: var(--text-primary);" />
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
					class="native-input {error ? 'error' : ''}"
					onchange={handleChange}
				/>
			</div>
		{/if}
	</div>
</div>

<style>
	.native-time-picker {
		width: 100%;
	}
	
	.picker-wrapper {
		position: relative;
		width: 100%;
	}
	
	/* Button style for browsers with showPicker support */
	.time-picker-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.625rem 1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		text-align: left;
	}
	
	.time-picker-button:hover:not(:disabled) {
		border-color: var(--color-primary-300);
		background: var(--bg-secondary);
	}
	
	.time-picker-button:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
	
	.time-picker-button:disabled {
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
	
	.hidden-time-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
		opacity: 0;
	}
	
	/* Native input style for Firefox */
	.native-input-wrapper {
		position: relative;
		width: 100%;
	}
	
	.input-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		z-index: 1;
	}
	
	.native-input {
		width: 100%;
		padding: 0.625rem 1rem 0.625rem 3rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		color: var(--text-primary);
		font-family: inherit;
	}
	
	.native-input:hover:not(:disabled) {
		border-color: var(--color-primary-300);
		background: var(--bg-secondary);
	}
	
	.native-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
	
	.native-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.native-input.error {
		border-color: var(--color-error);
	}
</style>


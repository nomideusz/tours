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
	
	<button
		type="button"
		onclick={() => dateInputRef?.showPicker?.()}
		class="date-picker-button {error ? 'error' : ''}"
		disabled={disabled}
	>
		<Calendar class="h-4 w-4" style="color: var(--text-primary);" />
		<span class="date-display" style="color: {value ? 'var(--text-primary)' : 'var(--text-secondary)'};">
			{formatDateDisplay(value)}
		</span>
	</button>
	
	<input
		bind:this={dateInputRef}
		{id}
		type="date"
		bind:value={value}
		{min}
		{max}
		{required}
		{disabled}
		class="hidden-time-input"
		onchange={handleChange}
	/>
</div>

<style>
	.native-date-picker {
		width: 100%;
		position: relative;
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
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		text-align: left;
	}
	
	.date-picker-button:hover:not(:disabled) {
		border-color: var(--color-primary-300);
		background: var(--bg-secondary);
	}
	
	.date-picker-button:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
	
	.date-picker-button:disabled {
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
	}
</style>


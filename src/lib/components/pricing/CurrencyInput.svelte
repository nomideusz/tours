<script lang="ts">
	interface Props {
		value: number | null;
		currencySymbol?: string;
		placeholder?: string;
		min?: number;
		max?: number;
		step?: number;
		required?: boolean;
		id?: string;
		name?: string;
		class?: string;
		ariaLabel?: string;
		onInput?: (value: number | null) => void;
	}

	let {
		value = $bindable(),
		currencySymbol = '$',
		placeholder = '0.00',
		min = 0,
		max,
		step = 0.01,
		required = false,
		id,
		name,
		class: className = '',
		ariaLabel,
		onInput
	}: Props = $props();

	let isFocused = $state(false);
	let inputValue = $state(value?.toString() || '');
	
	// Format price for display
	function formatCurrency(val: number | null): string {
		if (val === null || val === undefined || isNaN(val)) return '';
		return val.toFixed(2);
	}
	
	// Handle focus - show raw number and select all
	function handleFocus(e: FocusEvent) {
		isFocused = true;
		inputValue = value?.toString() || '';
		// Select all text for easy replacement
		setTimeout(() => {
			(e.target as HTMLInputElement)?.select();
		}, 0);
	}
	
	// Handle blur - format and validate
	function handleBlur() {
		isFocused = false;
		const numValue = parseFloat(inputValue);
		
		if (inputValue === '' || isNaN(numValue)) {
			value = null;
			inputValue = '';
		} else {
			// Clamp to min/max if provided
			let clampedValue = numValue;
			if (min !== undefined && numValue < min) clampedValue = min;
			if (max !== undefined && numValue > max) clampedValue = max;
			
			value = clampedValue;
			inputValue = formatCurrency(clampedValue);
		}
	}
	
	// Handle input changes
	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		inputValue = target.value;
		
		// Update value in real-time if valid
		const numValue = parseFloat(inputValue);
		if (!isNaN(numValue)) {
			value = numValue;
			onInput?.(numValue);
		} else if (inputValue === '') {
			value = null;
			onInput?.(null);
		}
	}
	
	// Sync external value changes
	$effect(() => {
		if (!isFocused) {
			inputValue = value !== null ? formatCurrency(value) : '';
		}
	});
</script>

<div class="currency-input-wrapper">
	<span class="currency-symbol">{currencySymbol}</span>
	<input
		type={isFocused ? 'number' : 'text'}
		{id}
		{name}
		{min}
		{max}
		{step}
		{required}
		value={inputValue}
		{placeholder}
		aria-label={ariaLabel}
		class="currency-input {className}"
		onfocus={handleFocus}
		onblur={handleBlur}
		oninput={handleInput}
	/>
</div>

<style>
	.currency-input-wrapper {
		position: relative;
		display: inline-flex;
		align-items: center;
		width: 100%;
	}
	
	.currency-symbol {
		position: absolute;
		left: 0.75rem;
		color: var(--text-secondary);
		font-weight: 500;
		pointer-events: none;
		z-index: 1;
	}
	
	.currency-input {
		width: 100%;
		padding: 0.5rem 0.5rem 0.5rem 2rem;
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-weight: 500;
		transition: all 0.15s ease;
	}
	
	.currency-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}
	
	/* Hide number input spinners for cleaner look */
	.currency-input[type="number"]::-webkit-inner-spin-button,
	.currency-input[type="number"]::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	
	.currency-input[type="number"] {
		-moz-appearance: textfield;
		appearance: textfield;
	}
	
	/* Error state */
	.currency-input.error {
		border-color: var(--color-danger-500);
	}
	
	.currency-input.error:focus {
		box-shadow: 0 0 0 3px var(--color-danger-100);
	}
	
	/* Responsive */
	@media (max-width: 640px) {
		.currency-input {
			padding: 0.375rem 0.375rem 0.375rem 1.75rem;
		}
		
		.currency-symbol {
			left: 0.5rem;
			font-size: 0.875rem;
		}
	}
</style>

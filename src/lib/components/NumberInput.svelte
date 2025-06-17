<script lang="ts">
	interface Props {
		id: string;
		name?: string;
		label: string;
		value: number;
		min?: number;
		max?: number;
		step?: number;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		incrementLabel?: string;
		decrementLabel?: string;
		error?: string | null;
		hasError?: boolean;
		integerOnly?: boolean;
		decimalPlaces?: number;
		onblur?: (event: FocusEvent) => void;
		size?: 'small' | 'default' | 'large';
	}

	let {
		id,
		name,
		label,
		value = $bindable(),
		min = 0,
		max,
		step = 1,
		placeholder = "0",
		required = false,
		disabled = false,
		incrementLabel = "Increase value",
		decrementLabel = "Decrease value",
		error = null,
		hasError = false,
		integerOnly = false,
		decimalPlaces,
		onblur,
		size = 'default'
	}: Props = $props();

	// Track if user is actively interacting for better UX feedback
	let isInteracting = $state(false);
	let inputElement: HTMLInputElement | undefined = $state();

	function increment() {
		if (disabled) return;
		
		isInteracting = true;
		const newValue = value + step;
		const clampedValue = max !== undefined ? Math.min(max, Math.max(min, newValue)) : Math.max(min, newValue);
		
		// Round to step precision to avoid floating point issues
		let roundedValue = Math.round(clampedValue / step) * step;
		
		if (integerOnly) {
			roundedValue = Math.round(roundedValue);
		} else if (decimalPlaces !== undefined) {
			roundedValue = Math.round(roundedValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
		}
		
		value = roundedValue;
		
		// Brief visual feedback
		setTimeout(() => { isInteracting = false; }, 150);
		
		// Keep focus on input for better UX
		if (inputElement) {
			inputElement.focus();
		}
	}

	function decrement() {
		if (disabled) return;
		
		isInteracting = true;
		const newValue = Math.max(min, value - step);
		
		// Round to step precision to avoid floating point issues
		let roundedValue = Math.round(newValue / step) * step;
		
		if (integerOnly) {
			roundedValue = Math.round(roundedValue);
		} else if (decimalPlaces !== undefined) {
			roundedValue = Math.round(roundedValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
		}
		
		value = roundedValue;
		
		// Brief visual feedback
		setTimeout(() => { isInteracting = false; }, 150);
		
		// Keep focus on input for better UX
		if (inputElement) {
			inputElement.focus();
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		let inputValue = parseFloat(target.value);
		
		if (isNaN(inputValue)) {
			inputValue = min;
		}
		
		// Apply constraints
		if (max !== undefined) {
			inputValue = Math.min(max, inputValue);
		}
		inputValue = Math.max(min, inputValue);
		
		// Round based on requirements
		if (integerOnly) {
			inputValue = Math.round(inputValue);
		} else if (decimalPlaces !== undefined) {
			inputValue = Math.round(inputValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
		}
		
		value = inputValue;
		target.value = inputValue.toString();
	}

	// Size-based classes
	const sizeClasses = {
		small: 'number-input--small',
		default: 'number-input--default', 
		large: 'number-input--large'
	};
</script>

<div class="number-input-wrapper">
	<label for={id} class="form-label">
		{label}
		{#if required}<span class="text-red-500 ml-1">*</span>{/if}
	</label>
	
	<div class="number-input {sizeClasses[size]} {hasError ? 'number-input--error' : ''} {disabled ? 'number-input--disabled' : ''}">
		<!-- Decrement Button -->
		<button
			type="button"
			onclick={decrement}
			disabled={disabled || value <= min}
			class="number-input__button number-input__button--decrement"
			aria-label={decrementLabel}
			tabindex="-1"
		>
			<svg class="number-input__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />
			</svg>
		</button>

		<!-- Input Field -->
		<input
			bind:this={inputElement}
			type="number"
			{id}
			{name}
			bind:value
			{min}
			max={max}
			step={integerOnly ? "1" : step.toString()}
			{placeholder}
			{disabled}
			oninput={handleInput}
			onblur={onblur}
			class="number-input__field"
			autocomplete="off"
		/>

		<!-- Increment Button -->
		<button
			type="button"
			onclick={increment}
			disabled={disabled || (max !== undefined && value >= max)}
			class="number-input__button number-input__button--increment"
			aria-label={incrementLabel}
			tabindex="-1"
		>
			<svg class="number-input__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6" />
			</svg>
		</button>
	</div>

	{#if error}
		<p class="form-error">{error}</p>
	{/if}
</div>

<style>
	.number-input-wrapper {
		width: 100%;
	}

	.number-input {
		display: flex;
		align-items: stretch;
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		transition: all 0.2s ease;
		overflow: hidden;
	}

	.number-input:focus-within {
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}

	.number-input--error {
		border-color: var(--color-danger-500);
	}

	.number-input--error:focus-within {
		border-color: var(--color-danger-500);
		box-shadow: 0 0 0 3px var(--color-danger-100);
	}

	.number-input--disabled {
		background: var(--bg-disabled);
		opacity: 0.6;
		cursor: not-allowed;
	}

	.number-input__field {
		flex: 1;
		border: none;
		background: transparent;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		line-height: 1.25rem;
		color: var(--text-primary);
		text-align: center;
		outline: none;
		min-width: 0;
		-moz-appearance: textfield; /* Firefox */
	}

	/* Hide browser default arrows/spinners */
	.number-input__field::-webkit-outer-spin-button,
	.number-input__field::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.number-input__field::placeholder {
		color: var(--text-placeholder);
	}

	.number-input__field:disabled {
		cursor: not-allowed;
		background: transparent;
	}

	.number-input__button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-secondary);
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
		outline: none;
		flex-shrink: 0;
		touch-action: manipulation;
		-webkit-touch-callout: none;
		user-select: none;
	}

	.number-input__button:hover:not(:disabled) {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.number-input__button:active:not(:disabled) {
		background: var(--color-primary-100);
		color: var(--color-primary-700);
		transform: scale(0.95);
	}

	.number-input__button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		background: var(--bg-disabled);
	}

	.number-input__button:focus-visible {
		outline: 2px solid var(--color-primary-500);
		outline-offset: -2px;
	}

	.number-input__icon {
		width: 1rem;
		height: 1rem;
		stroke-width: 2.5;
	}

	/* Size Variants */
	.number-input--small .number-input__field {
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
	}

	.number-input--small .number-input__button {
		width: 2.5rem;
		min-height: 2.5rem;
	}

	.number-input--small .number-input__icon {
		width: 0.875rem;
		height: 0.875rem;
	}

	.number-input--default .number-input__field {
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
	}

	.number-input--default .number-input__button {
		width: 3rem;
		min-height: 3rem;
	}

	.number-input--large .number-input__field {
		padding: 1rem 1.25rem;
		font-size: 1rem;
	}

	.number-input--large .number-input__button {
		width: 3.5rem;
		min-height: 3.5rem;
	}

	.number-input--large .number-input__icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	/* Mobile Optimizations */
	@media (max-width: 768px) {
		.number-input__button {
			/* Larger touch targets on mobile */
			min-width: 3.5rem;
			min-height: 3.5rem;
		}

		.number-input--small .number-input__button {
			min-width: 3rem;
			min-height: 3rem;
		}

		.number-input--large .number-input__button {
			min-width: 4rem;
			min-height: 4rem;
		}

		.number-input__field {
			font-size: 1rem; /* Prevent zoom on iOS */
			padding: 1rem;
		}

		.number-input--small .number-input__field {
			font-size: 0.9375rem;
			padding: 0.75rem;
		}

		/* Better visual feedback on mobile */
		.number-input__button:active:not(:disabled) {
			transform: scale(0.92);
			background: var(--color-primary-200);
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.number-input {
			border-width: 2px;
		}
		
		.number-input__button {
			border-left: 1px solid var(--border-primary);
			border-right: 1px solid var(--border-primary);
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.number-input,
		.number-input__button {
			transition: none;
		}
		
		.number-input__button:active:not(:disabled) {
			transform: none;
		}
	}
</style> 
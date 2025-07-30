<script lang="ts">
	import Pencil from 'lucide-svelte/icons/pencil';
	
	interface Props {
		value: number;
		label?: string;
		min?: number;
		max?: number;
		inputMax?: number;
		step?: number;
		required?: boolean;
		disabled?: boolean;
		error?: boolean;
		defaultValue?: number;
		onChange?: (value: number) => void;
		showMarkers?: boolean;
		currency?: string;
		currencySymbol?: string;
	}
	
	let {
		value = $bindable(),
		label = 'Price',
		min = 0.5,
		max = 500,
		inputMax = 5000,
		step = 0.5,
		required = false,
		disabled = false,
		error = false,
		defaultValue,
		onChange,
		showMarkers = true,
		currency = 'EUR',
		currencySymbol = '€'
	}: Props = $props();
	
	// Track state
	let dragging = $state(false);
	let sliderRef = $state<HTMLDivElement>();
	let svgRef = $state<SVGSVGElement>();
	let isMobile = $state(false);
	let isEditing = $state(false);
	let editValue = $state('');
	let editInputRef = $state<HTMLInputElement>();
	
	// Circular slider constants
	const RADIUS = 80;
	const STROKE_WIDTH = 12;
	const CENTER = 125;
	const START_ANGLE = -135;
	const END_ANGLE = 135;
	
	// Non-linear scale for better precision at lower prices
	function valueToNormalized(val: number): number {
		// Clamp value to slider range for display purposes
		const clampedVal = Math.min(Math.max(val, min), max);
		
		// Use logarithmic scale for better distribution
		// This gives more precision to lower prices
		const logMin = Math.log(min + 1);
		const logMax = Math.log(max + 1);
		const logVal = Math.log(clampedVal + 1);
		return (logVal - logMin) / (logMax - logMin);
	}
	
	function normalizedToValue(normalized: number): number {
		// Inverse of valueToNormalized
		const logMin = Math.log(min + 1);
		const logMax = Math.log(max + 1);
		const logVal = logMin + normalized * (logMax - logMin);
		return Math.exp(logVal) - 1;
	}
	
	// Get dynamic step based on current value
	function getDynamicStep(val: number): number {
		if (val < 10) return 0.5;
		if (val < 50) return 1;
		if (val < 100) return 5;
		if (val < 200) return 10;
		return 25;
	}
	
	// Convert value to slider position (0-100) for linear slider
	let sliderPosition = $derived(valueToNormalized(value) * 100);
	
	// Convert value to angle for circular slider
	let currentAngle = $derived((() => {
		const normalized = valueToNormalized(value);
		return START_ANGLE + normalized * (END_ANGLE - START_ANGLE);
	})());
	
	// Calculate thumb position
	let thumbX = $derived(CENTER + RADIUS * Math.cos(currentAngle * Math.PI / 180));
	let thumbY = $derived(CENTER + RADIUS * Math.sin(currentAngle * Math.PI / 180));
	
	// Calculate arc path
	let arcPath = $derived((() => {
		const startRad = START_ANGLE * Math.PI / 180;
		const endRad = currentAngle * Math.PI / 180;
		
		const x1 = CENTER + RADIUS * Math.cos(startRad);
		const y1 = CENTER + RADIUS * Math.sin(startRad);
		const x2 = CENTER + RADIUS * Math.cos(endRad);
		const y2 = CENTER + RADIUS * Math.sin(endRad);
		
		const largeArc = Math.abs(currentAngle - START_ANGLE) > 180 ? 1 : 0;
		
		return `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`;
	})());
	
	// Check if mobile
	$effect(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth <= 640;
		};
		
		checkMobile();
		window.addEventListener('resize', checkMobile);
		
		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});
	
	// Handle circular slider interaction
	function handleCircularInteraction(event: MouseEvent | TouchEvent) {
		if (disabled || !svgRef) return;
		
		const rect = svgRef.getBoundingClientRect();
		let clientX: number, clientY: number;
		
		if ('touches' in event) {
			clientX = event.touches[0].clientX;
			clientY = event.touches[0].clientY;
		} else {
			clientX = event.clientX;
			clientY = event.clientY;
		}
		
		// Convert to SVG coordinates
		const x = clientX - rect.left;
		const y = clientY - rect.top;
		
		// Calculate angle from center
		const dx = x - CENTER;
		const dy = y - CENTER;
		let angle = Math.atan2(dy, dx) * 180 / Math.PI;
		
		// Constrain to valid range
		if (angle < START_ANGLE && angle > -180) {
			angle = START_ANGLE;
		} else if (angle > END_ANGLE || angle < -180) {
			angle = END_ANGLE;
		}
		
		// Convert angle to value
		const normalized = (angle - START_ANGLE) / (END_ANGLE - START_ANGLE);
		const newValue = normalizedToValue(normalized);
		
		// Apply dynamic step
		const dynamicStep = getDynamicStep(newValue);
		const stepped = Math.round(newValue / dynamicStep) * dynamicStep;
		const clamped = Math.max(min, Math.min(max, stepped));
		
		if (clamped !== value) {
			value = clamped;
			onChange?.(clamped);
		}
	}
	
	// Linear slider functions
	function getPositionFromEvent(event: MouseEvent | TouchEvent): number {
		if (!sliderRef) return 0;
		
		const rect = sliderRef.getBoundingClientRect();
		const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
		const x = clientX - rect.left;
		const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
		
		return percentage;
	}
	
	function updateValueFromPosition(position: number) {
		const rawValue = normalizedToValue(position / 100);
		const dynamicStep = getDynamicStep(rawValue);
		const steppedValue = Math.round(rawValue / dynamicStep) * dynamicStep;
		const clampedValue = Math.max(min, Math.min(max, steppedValue));
		
		if (clampedValue !== value) {
			value = clampedValue;
			onChange?.(clampedValue);
		}
	}
	
	function handleThumbDown(event: MouseEvent | TouchEvent) {
		if (disabled) return;
		event.preventDefault();
		dragging = true;
	}
	
	function handleMove(event: MouseEvent | TouchEvent) {
		if (!dragging || disabled) return;
		event.preventDefault();
		
		const position = getPositionFromEvent(event);
		updateValueFromPosition(position);
	}
	
	function handleUp() {
		dragging = false;
	}
	
	function handleTrackClick(event: MouseEvent | TouchEvent) {
		if (disabled || dragging) return;
		
		const position = getPositionFromEvent(event);
		updateValueFromPosition(position);
	}
	
	function handleKeyDown(event: KeyboardEvent) {
		if (disabled) return;
		
		const currentStep = getDynamicStep(value);
		
		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowDown':
				event.preventDefault();
				value = Math.max(min, value - currentStep);
				onChange?.(value);
				break;
			case 'ArrowRight':
			case 'ArrowUp':
				event.preventDefault();
				value = Math.min(max, value + currentStep);
				onChange?.(value);
				break;
			case 'Home':
				event.preventDefault();
				value = min;
				onChange?.(value);
				break;
			case 'End':
				event.preventDefault();
				value = max;
				onChange?.(value);
				break;
		}
	}
	
	// Add global listeners when dragging
	$effect(() => {
		if (dragging) {
			const handleGlobalMove = (e: MouseEvent | TouchEvent) => handleMove(e);
			const handleGlobalUp = () => handleUp();
			
			window.addEventListener('mousemove', handleGlobalMove);
			window.addEventListener('mouseup', handleGlobalUp);
			window.addEventListener('touchmove', handleGlobalMove, { passive: false });
			window.addEventListener('touchend', handleGlobalUp);
			
			return () => {
				window.removeEventListener('mousemove', handleGlobalMove);
				window.removeEventListener('mouseup', handleGlobalUp);
				window.removeEventListener('touchmove', handleGlobalMove);
				window.removeEventListener('touchend', handleGlobalUp);
			};
		}
	});
	
	// Generate markers
	let markers = $derived.by(() => {
		if (!showMarkers) return [];
		
		const range = max - min;
		const markerValues: number[] = [];
		
		// Smart marker generation based on range
		if (range <= 50) {
			const interval = range <= 25 ? 10 : 20;
			for (let i = Math.ceil(min / interval) * interval; i <= max; i += interval) {
				if (i >= min) markerValues.push(i);
			}
		} else if (range <= 200) {
			for (let i = Math.ceil(min / 50) * 50; i <= max; i += 50) {
				if (i >= min) markerValues.push(i);
			}
		} else {
			for (let i = Math.ceil(min / 100) * 100; i <= max; i += 100) {
				if (i >= min) markerValues.push(i);
			}
		}
		
		return markerValues.map(val => ({
			value: val,
			position: valueToNormalized(val) * 100
		}));
	});
	
	// Format price
	function formatPrice(price: number): string {
		const decimalPlaces = step >= 1 ? 0 : 2;
		return price.toFixed(decimalPlaces);
	}
	
	// Handle manual input
	function startEditing() {
		if (disabled) return;
		isEditing = true;
		editValue = formatPrice(value);
		
		// Focus input after DOM update with longer delay for mobile
		setTimeout(() => {
			if (editInputRef) {
				editInputRef.focus();
				editInputRef.select();
			}
		}, 100);
	}
	
	function handleEditSubmit() {
		// Clean the input value - keep only numbers and decimal point
		const cleanValue = editValue.replace(/[^0-9.]/g, '');
		const parsed = parseFloat(cleanValue);
		
		if (!isNaN(parsed)) {
			const clamped = Math.max(min, Math.min(inputMax, parsed));
			value = clamped;
			onChange?.(clamped);
		}
		
		isEditing = false;
	}
	
	function handleEditKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleEditSubmit();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			isEditing = false;
		}
	}
</script>

<div class="price-slider" class:disabled class:error class:mobile={isMobile} class:editing={isEditing}>
	{#if label}
		<div class="form-label block mb-2 sm:mb-3 flex items-center justify-between">
			<span>
				{label}
				{#if required}<span class="text-red-500 ml-1">*</span>{/if}
			</span>
			<div class="reset-button-container">
				{#if defaultValue && value !== defaultValue && !disabled}
					<button
						type="button"
						onclick={() => {
							value = defaultValue;
							onChange?.(defaultValue);
						}}
						class="reset-button-top"
					>
						Reset
					</button>
				{:else}
					<div class="reset-button-spacer"></div>
				{/if}
			</div>
		</div>
	{/if}
	
	<!-- Linear slider -->
	<!-- {#if isMobile}
		Circular slider temporarily hidden
	{:else} -->
		<div class="value-display">
			<div class="value-main">
				{#if isEditing}
					<input
						bind:this={editInputRef}
						bind:value={editValue}
						type="text"
						inputmode="decimal"
						pattern="[0-9]*[.]?[0-9]*"
						min={min}
						max={inputMax}
						step="any"
						class="value-edit-input"
						onblur={handleEditSubmit}
						onkeydown={handleEditKeyDown}
						oninput={(e) => {
							const target = e.target as HTMLInputElement;
							// Replace comma with period globally
							const newValue = target.value.replace(/,/g, '.');
							if (newValue !== target.value) {
								target.value = newValue;
								editValue = newValue;
							}
						}}
					/>
				{:else}
					<div 
						class="value-number"
						onclick={startEditing}
						role="button"
						tabindex={disabled ? -1 : 0}
						onkeydown={(e) => { if (e.key === 'Enter') startEditing(); }}
					>
						{currencySymbol}{formatPrice(value)}
						{#if !disabled}
							<Pencil class="edit-icon" />
						{/if}
					</div>
				{/if}
			</div>
		</div>
		
		<div 
			class="slider-container"
			bind:this={sliderRef}
			onmousedown={handleTrackClick}
			ontouchstart={handleTrackClick}
			onkeydown={handleKeyDown}
			role="slider"
			aria-label={label}
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value}
			aria-valuetext="{currencySymbol}{formatPrice(value)}"
			tabindex={disabled ? -1 : 0}
		>
			<div class="slider-track">
				<div 
					class="slider-fill"
					style="width: {sliderPosition}%"
				></div>
				
				{#if showMarkers && markers.length > 0}
					<div class="markers">
						{#each markers as marker}
							<div class="marker" style="left: {marker.position}%">
								<div class="marker-dot"></div>
								<span class="marker-text">{currencySymbol}{formatPrice(marker.value)}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			
			<button
				type="button"
				class="slider-thumb"
				style="left: calc(0.75rem + ({sliderPosition} / 100) * (100% - 1.5rem))"
				onmousedown={handleThumbDown}
				ontouchstart={handleThumbDown}
				aria-label="{label}: {currencySymbol}{formatPrice(value)}"
				tabindex={disabled ? -1 : 0}
				{disabled}
			>
				<span class="thumb-value">{currencySymbol}{formatPrice(value)}</span>
			</button>
		</div>
	<!-- {/if} -->
	
	<!-- Above slider range message -->
	{#if value > max}
		<div class="value-note">
			Above slider range - click price to edit
		</div>
	{/if}
</div>

<style>
	.price-slider {
		width: 100%;
	}
	
	/* Circular slider styles */
	.circular-container {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1rem;
		margin: 0 auto;
		width: 320px;
		height: 320px;
		position: relative;
	}

	.circular-edit-button {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: transparent;
		border: none;
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
		padding: 1rem;
		z-index: 15;
		-webkit-tap-highlight-color: transparent;
		outline: none;
		text-align: center;
		min-width: 100px;
		transition: color 0.2s ease;
	}

	.circular-edit-button:focus {
		outline: none;
	}

	.circular-edit-button:active {
		color: var(--color-primary-600);
	}

	.circular-edit-button-hint {
		font-size: 0.65rem;
		color: var(--text-tertiary);
		margin-top: 0.25rem;
		font-weight: 400;
	}

	@media (min-width: 641px) {
		.circular-edit-button-hint {
			opacity: 0;
			transition: opacity 0.2s ease;
		}
		
		.circular-edit-button:hover .circular-edit-button-hint {
			opacity: 1;
		}
	}
	
	.circular-container svg {
		-webkit-tap-highlight-color: transparent;
		touch-action: none;
		outline: none;
	}

	.circular-container svg:focus {
		outline: none;
	}
	
	.circular-container svg.editing {
		pointer-events: none;
		opacity: 0.8;
	}
	
	.circular-container svg.editing foreignObject {
		pointer-events: all;
	}
	
	.circular-value {
		font-size: 2rem;
		font-weight: 700;
		fill: var(--text-primary);
		font-variant-numeric: tabular-nums;
		pointer-events: none;
	}
	
	.circular-value-group {
		transition: opacity 0.2s ease;
		pointer-events: all;
		position: relative;
		z-index: 10;
	}
	
	.circular-value-group:hover .circular-value {
		fill: var(--color-primary-600);
	}
	
	.circular-edit-hint {
		font-size: 0.65rem;
		fill: var(--text-tertiary);
		opacity: 0;
		transition: opacity 0.2s ease;
		pointer-events: none;
	}
	
	.circular-value-group:hover .circular-edit-hint {
		opacity: 1;
	}
	
	.circular-edit-input {
		width: 100%;
		height: 100%;
		background: var(--bg-primary);
		border: 2px solid var(--color-primary-500);
		border-radius: var(--radius-sm);
		text-align: center;
		font-size: 2rem;
		font-weight: 700 !important;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		padding: 2px;
		box-sizing: border-box;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		z-index: 100;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
	}

	/* Hide number input arrows/spinners for circular input */
	.circular-edit-input::-webkit-outer-spin-button,
	.circular-edit-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
	}

	/* Normalize circular input styling */
	.circular-edit-input {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		outline: none;
		border-collapse: separate;
		border-spacing: 0;
	}

	.circular-edit-input:focus {
		outline: none;
		border-color: var(--color-primary-600);
	}
	
	.circular-marker {
		font-size: 0.75rem;
		fill: var(--text-tertiary);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		pointer-events: none;
	}
	
	.thumb-outer {
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
		transition: all 0.2s ease;
	}
	
	/* Linear slider styles (desktop) */
	.value-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 1.5rem;
		gap: 0.5rem;
	}
	
	.value-main {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}
	
	.value-number {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: color 0.2s ease;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		border: 2px solid transparent;
		user-select: none;
		box-sizing: border-box;
		line-height: 1;
		height: calc(2rem + 0.5rem + 4px);
	}
	
	.price-slider:not(.disabled) .value-number:hover {
		color: var(--color-primary-600);
		background: var(--bg-secondary);
	}
	
	.value-number:focus-visible {
		outline: 2px solid var(--color-primary-500);
		outline-offset: 2px;
	}
	
	:global(.edit-icon) {
		width: 0.875rem;
		height: 0.875rem;
		opacity: 0.5;
		transition: opacity 0.2s ease;
	}

	.value-number:hover :global(.edit-icon) {
		opacity: 1;
	}

	.value-note {
		font-size: 0.75rem;
		color: var(--color-warning-600);
		font-weight: 500;
		text-align: center;
		margin-top: 1rem;
		opacity: 0.8;
		padding: 0.5rem;
		background: var(--color-warning-50);
		border: 1px solid var(--color-warning-200);
		border-radius: var(--radius-sm);
	}
	
	.value-edit-input {
		font-size: 2rem;
		font-weight: 700 !important;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		background: var(--bg-primary);
		border: 2px solid var(--color-primary-500);
		border-radius: var(--radius-sm);
		padding: 0.25rem 0.5rem;
		text-align: center;
		min-width: 140px;
		max-width: 180px;
		box-sizing: border-box;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: calc(2rem + 0.5rem + 4px);
	}

	/* Hide number input arrows/spinners */
	.value-edit-input::-webkit-outer-spin-button,
	.value-edit-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
	}

	/* Normalize input styling */
	.value-edit-input {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		outline: none;
		border-collapse: separate;
		border-spacing: 0;
	}

	/* Remove any potential spinner for text inputs with decimal pattern */
	.value-edit-input[inputmode="decimal"] {
		-webkit-appearance: textfield;
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.value-edit-input:focus {
		outline: none;
		border-color: var(--color-primary-600);
		background: var(--bg-secondary);
	}
	
	.slider-container {
		position: relative;
		height: 4rem;
		padding: 1.5rem 0.75rem;
		cursor: pointer;
	}
	
	.slider-container:focus {
		outline: none;
	}
	
	.slider-container:focus-visible {
		outline: 2px solid var(--color-primary-500);
		outline-offset: 2px;
		border-radius: var(--radius-md);
	}
	
	.slider-track {
		position: absolute;
		top: 50%;
		left: 0.75rem;
		right: 0.75rem;
		height: 0.5rem;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		transform: translateY(-50%);
	}
	
	.slider-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: var(--color-primary-500);
		border-radius: var(--radius-full);
		transition: all 0.2s ease;
	}
	
	.markers {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 0.5rem;
	}
	
	.marker {
		position: absolute;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}
	
	.marker-dot {
		width: 0.25rem;
		height: 0.25rem;
		background: var(--border-secondary);
		border-radius: 50%;
	}
	
	.marker-text {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
		text-align: center;
		min-width: fit-content;
		font-weight: 500;
	}
	
	.marker:nth-child(odd) .marker-text {
		transform: translateY(-0.25rem);
	}
	
	.marker:nth-child(even) .marker-text {
		transform: translateY(0.25rem);
	}
	
	.slider-thumb {
		position: absolute;
		top: 50%;
		width: 2rem;
		height: 2rem;
		background: var(--bg-primary);
		border: 3px solid var(--color-primary-500);
		border-radius: var(--radius-full);
		transform: translate(-50%, -50%);
		cursor: grab;
		transition: all 0.2s ease;
		z-index: 10;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 0.125rem;
	}
	
	.slider-thumb:hover:not(:disabled) {
		width: 2.25rem;
		height: 2.25rem;
		border-width: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	
	.slider-thumb:active:not(:disabled) {
		cursor: grabbing;
		transform: translate(-50%, -50%) scale(0.95);
	}
	
	.slider-thumb:focus {
		outline: none;
	}
	
	.slider-thumb:focus-visible {
		outline: 2px solid var(--color-primary-500);
		outline-offset: 2px;
	}

	.thumb-value {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-primary);
		background: var(--bg-primary);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		white-space: nowrap;
		opacity: 0;
		transition: opacity 0.2s ease;
		pointer-events: none;
		border: 1px solid var(--border-secondary);
		font-variant-numeric: tabular-nums;
	}
	
	.slider-thumb:hover .thumb-value,
	.slider-thumb:active .thumb-value,
	.slider-thumb:focus .thumb-value {
		opacity: 1;
	}
	
	.reset-button-container {
		height: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}
	
	.reset-button-top {
		background: transparent;
		border: 1px solid var(--border-secondary);
		color: var(--color-primary-600);
		font-size: 0.75rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast) ease;
		white-space: nowrap;
		font-weight: 500;
		height: 1.75rem;
		display: flex;
		align-items: center;
	}
	
	.reset-button-top:hover {
		color: var(--color-primary-700);
		background: var(--bg-secondary);
		border-color: var(--color-primary-200);
	}
	
	.reset-button-spacer {
		height: 1.75rem;
		width: 1px;
		opacity: 0;
	}
	
	/* Disabled state */
	.disabled {
		opacity: 0.6;
		pointer-events: none;
	}
	
	.disabled .slider-container {
		cursor: not-allowed;
	}
	
	.disabled .slider-thumb {
		cursor: not-allowed;
	}
	
	/* Error state */
	.error .slider-track {
		background: var(--color-danger-100);
	}
	
	.error .slider-fill {
		background: var(--color-danger-500);
	}
	
	.error .slider-thumb {
		border-color: var(--color-danger-500);
	}
	
	.error .value-number {
		color: var(--color-danger-600);
	}
	
	.error .circular-value {
		fill: var(--color-danger-600);
	}
	
	/* Editing state */
	.price-slider.editing .slider-track {
		opacity: 0.5;
		pointer-events: none;
	}

	.price-slider.editing .slider-thumb {
		pointer-events: none;
	}
	
	/* Dark mode adjustments */
	@media (prefers-color-scheme: dark) {
		.slider-thumb {
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		}
		
		.slider-thumb:hover:not(:disabled) {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		}
		
		.thumb-value {
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		}
		
		.thumb-outer {
			filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
		}
	}
</style> 
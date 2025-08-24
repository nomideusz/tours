<script lang="ts">
	import Users from 'lucide-svelte/icons/users';
	import '../styles/sliders.css';
	
	interface Props {
		value: number;
		label?: string;
		min?: number;
		max?: number;
		step?: number;
		required?: boolean;
		disabled?: boolean;
		error?: boolean;
		defaultValue?: number;
		onChange?: (value: number) => void;
		showMarkers?: boolean;
		unit?: string;
	}
	
	let {
		value = $bindable(),
		label = '',
		min = 1,
		max = 50,
		step = 1,
		required = false,
		disabled = false,
		error = false,
		defaultValue,
		onChange,
		showMarkers = true,
		unit = 'guests'
	}: Props = $props();
	
	// Slider max is limited to 60, but input can go higher
	const sliderMax = Math.min(max, 60);
	
	// Track which thumb is being dragged
	let dragging = $state(false);
	let sliderRef: HTMLDivElement;
	
	// Convert value to slider position (0-100), clamped to slider max
	let sliderPosition = $derived.by(() => {
		const clampedValue = Math.min(value, sliderMax);
		return ((clampedValue - min) / (sliderMax - min)) * 100;
	});
	
	// Get position from mouse/touch event
	function getPositionFromEvent(event: MouseEvent | TouchEvent): number {
		if (!sliderRef) return 0;
		
		const rect = sliderRef.getBoundingClientRect();
		const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
		const x = clientX - rect.left;
		const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
		
		return percentage;
	}
	
	// Update value from slider position (limited to slider max)
	function updateValueFromPosition(position: number) {
		const rawValue = min + (position / 100) * (sliderMax - min);
		const steppedValue = Math.round(rawValue / step) * step;
		const clampedValue = Math.max(min, Math.min(sliderMax, steppedValue));
		
		if (clampedValue !== value) {
			value = clampedValue;
			onChange?.(clampedValue);
		}
	}
	
	// Handle mouse/touch down on thumb
	function handleThumbDown(event: MouseEvent | TouchEvent) {
		if (disabled) return;
		event.preventDefault();
		dragging = true;
	}
	
	// Handle mouse/touch move
	function handleMove(event: MouseEvent | TouchEvent) {
		if (!dragging || disabled) return;
		event.preventDefault();
		
		const position = getPositionFromEvent(event);
		updateValueFromPosition(position);
	}
	
	// Handle mouse/touch up
	function handleUp() {
		dragging = false;
	}
	
	// Handle track click
	function handleTrackClick(event: MouseEvent) {
		if (disabled || dragging) return;
		
		const position = getPositionFromEvent(event);
		updateValueFromPosition(position);
	}
	
	// Handle keyboard input
	function handleKeyDown(event: KeyboardEvent) {
		if (disabled) return;
		
		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowDown':
				event.preventDefault();
				value = Math.max(min, value - step);
				onChange?.(value);
				break;
			case 'ArrowRight':
			case 'ArrowUp':
				event.preventDefault();
				value = Math.min(sliderMax, value + step);
				onChange?.(value);
				break;
			case 'Home':
				event.preventDefault();
				value = min;
				onChange?.(value);
				break;
			case 'End':
				event.preventDefault();
				value = sliderMax;
				onChange?.(value);
				break;
			case 'PageUp':
				event.preventDefault();
				value = Math.min(sliderMax, value + step * 10);
				onChange?.(value);
				break;
			case 'PageDown':
				event.preventDefault();
				value = Math.max(min, value - step * 10);
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
	
	// Generate marker values (based on slider max, not input max)
	let markers = $derived.by(() => {
		if (!showMarkers) return [];
		
		const range = sliderMax - min;
		const markerValues: number[] = [];
		
		// For tour group sizes, show practical intervals
		if (range <= 30) {
			// Small ranges: every 5
			for (let i = min; i <= sliderMax; i += 5) {
				markerValues.push(i);
			}
		} else if (range <= 60) {
			// Medium ranges: every 10
			for (let i = min; i <= sliderMax; i += 10) {
				markerValues.push(i);
			}
		} else {
			// Larger ranges: every 20
			for (let i = min; i <= sliderMax; i += 20) {
				markerValues.push(i);
			}
		}
		
		return markerValues.map(val => ({
			value: val,
			position: ((val - min) / (sliderMax - min)) * 100
		}));
	});
	
	// Format display value
	function formatValue(val: number): string {
		return val.toLocaleString();
	}
	

</script>

<div class="slider-base capacity-slider" class:disabled class:error>
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
					<!-- Reserve space to prevent layout jump -->
					<div class="reset-button-spacer"></div>
				{/if}
			</div>
		</div>
	{/if}
	
	<!-- Editable value display -->
	<div class="value-display">
		<div class="value-main">
			<input
				type="number"
				bind:value={value}
				{min}
				{max}
				{step}
				{disabled}
				class="value-input {value > sliderMax ? 'above-slider-max' : ''}"
				onchange={() => {
					// Clamp value to bounds
					value = Math.max(min, Math.min(max, value || min));
					onChange?.(value);
				}}
				onblur={() => {
					// Ensure valid value on blur
					if (!value || value < min) value = min;
					if (value > max) value = max;
				}}
			/>
			<div class="value-unit">{unit}</div>
		</div>
	</div>
	
	<!-- Slider -->
	<div 
		class="slider-container"
		bind:this={sliderRef}
		onmousedown={handleTrackClick}
		onkeydown={handleKeyDown}
		role="slider"
		aria-label={label}
		aria-valuemin={min}
		aria-valuemax={sliderMax}
		aria-valuenow={Math.min(value, sliderMax)}
		aria-valuetext="{formatValue(Math.min(value, sliderMax))} {unit}"
		tabindex={disabled ? -1 : 0}
	>
		<!-- Track -->
		<div class="slider-track">
			<!-- Filled portion -->
			<div 
				class="slider-fill"
				style="width: {sliderPosition}%"
			></div>
			
			<!-- Markers -->
			{#if showMarkers && markers.length > 0}
				<div class="markers">
					{#each markers as marker}
						<div class="marker" style="left: {marker.position}%">
							<div class="marker-dot"></div>
							<span class="marker-text">{marker.value}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
		
		<!-- Thumb -->
		<button
			type="button"
			class="slider-thumb"
			style="left: {sliderPosition}%"
			data-value="{formatValue(value)}"
			onmousedown={handleThumbDown}
			ontouchstart={handleThumbDown}
			aria-label="{label}: {formatValue(value)} {unit}"
			tabindex={disabled ? -1 : 0}
			{disabled}
		>
			<Users class="thumb-icon" />
			<span class="thumb-value">{formatValue(value)}</span>
		</button>
	</div>
	

</div>

<style>
	/* Capacity-specific styles */
	
	/* Hide value display on mobile */
	@media (max-width: 640px) {
		.value-display {
			display: none;
		}
	}
	
	.value-main {
		align-items: baseline;
		gap: 0.5rem;
	}
	
	.value-input {
		background: transparent;
		border: none;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		text-align: center;
		width: 4rem;
		padding: 0.25rem;
		border-radius: 0.375rem;
		transition: all 0.2s ease;
	}

	.value-input:hover {
		background: var(--bg-secondary);
	}

	.value-input:focus {
		outline: none;
		background: var(--bg-secondary);
		border: 1px solid var(--color-primary);
	}

	.value-input:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Highlight when value exceeds slider max */
	.value-input.above-slider-max {
		background: var(--color-info-50);
		border: 1px solid var(--color-info-200);
	}

	.value-input.above-slider-max:focus {
		border-color: var(--color-info-500);
	}
	
	.value-unit {
		font-size: 1rem;
		color: var(--text-secondary);
		font-weight: 500;
	}
	
	:global(.thumb-icon) {
		width: 0.75rem;
		height: 0.75rem;
		color: var(--color-primary-600);
	}
	
	.error :global(.thumb-icon) {
		color: var(--color-danger-600);
	}
	
	/* Mobile thumb icon size */
	@media (max-width: 640px) {
		:global(.thumb-icon) {
			width: 1rem;
			height: 1rem;
		}
	}
</style> 
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
		<div
			class="slider-thumb"
			style="left: {sliderPosition}%"
			data-value="{formatValue(value)}"
		>
			<!-- Editable value above thumb -->
			<input
				type="number"
				bind:value={value}
				{min}
				{max}
				{step}
				{disabled}
				class="thumb-value-input {value > sliderMax ? 'above-slider-max' : ''}"
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
				onclick={(e) => e.stopPropagation()}
				onmousedown={(e) => e.stopPropagation()}
				ontouchstart={(e) => e.stopPropagation()}
				aria-label="{label}: {formatValue(value)} {unit}"
			/>
			<!-- Icon in the center of thumb -->
			<Users class="thumb-icon" />
			<!-- Invisible draggable area -->
			<div
				class="thumb-drag-area"
				onmousedown={handleThumbDown}
				ontouchstart={handleThumbDown}
				tabindex={disabled ? -1 : 0}
				role="slider"
				aria-label="{label}: {formatValue(value)} {unit}"
				aria-valuemin={min}
				aria-valuemax={sliderMax}
				aria-valuenow={Math.min(value, sliderMax)}
				aria-valuetext="{formatValue(Math.min(value, sliderMax))} {unit}"
			></div>
		</div>
	</div>
	

</div>

<style>
	/* Capacity-specific styles */
	
	/* Editable thumb value input positioned above thumb */
	.thumb-value-input {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 0.5rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-primary);
		text-align: center;
		width: 2.5rem;
		padding: 0.25rem 0.125rem;
		border-radius: 0.375rem;
		transition: all 0.2s ease;
		z-index: 10;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.thumb-value-input:hover {
		border-color: var(--color-primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.thumb-value-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-50), 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.thumb-value-input:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Highlight when value exceeds slider max */
	.thumb-value-input.above-slider-max {
		background: var(--color-info-50);
		border-color: var(--color-info-300);
		color: var(--color-info-700);
	}

	.thumb-value-input.above-slider-max:focus {
		border-color: var(--color-info-500);
		box-shadow: 0 0 0 3px var(--color-info-50), 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	/* Invisible drag area that covers the thumb */
	.thumb-drag-area {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		cursor: grab;
		z-index: 1;
	}

	.thumb-drag-area:active {
		cursor: grabbing;
	}

	.thumb-drag-area:disabled {
		cursor: not-allowed;
	}

	/* Override slider thumb styles for editable input */
	:global(.capacity-slider .slider-thumb) {
		position: relative;
		cursor: default;
		flex-direction: column;
		gap: 0.125rem;
	}

	:global(.capacity-slider .slider-thumb:hover) {
		cursor: default;
	}

	/* Hide the old thumb value tooltip */
	:global(.capacity-slider .thumb-value) {
		display: none;
	}

	/* Mobile: hide the ::after content since we have the input */
	@media (max-width: 640px) {
		:global(.capacity-slider .slider-thumb::after) {
			display: none;
		}
		
		.thumb-value-input {
			font-size: 0.875rem;
			width: 3rem;
			padding: 0.375rem 0.25rem;
			margin-bottom: 0.75rem;
		}
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
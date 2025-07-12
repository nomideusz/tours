<script lang="ts">
	import Clock from 'lucide-svelte/icons/clock';
	
	interface Props {
		value: number; // duration in minutes
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
	}
	
	let {
		value = $bindable(),
		label = 'Tour Duration',
		min = 15,
		max = 480, // 8 hours
		step = 15,
		required = false,
		disabled = false,
		error = false,
		defaultValue,
		onChange,
		showMarkers = true
	}: Props = $props();
	
	// Track which thumb is being dragged
	let dragging = $state(false);
	let sliderRef: HTMLDivElement;
	
	// Convert value to slider position (0-100)
	let sliderPosition = $derived(((value - min) / (max - min)) * 100);
	
	// Get position from mouse/touch event
	function getPositionFromEvent(event: MouseEvent | TouchEvent): number {
		if (!sliderRef) return 0;
		
		const rect = sliderRef.getBoundingClientRect();
		const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
		const x = clientX - rect.left;
		const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
		
		return percentage;
	}
	
	// Update value from slider position
	function updateValueFromPosition(position: number) {
		const rawValue = min + (position / 100) * (max - min);
		const steppedValue = Math.round(rawValue / step) * step;
		const clampedValue = Math.max(min, Math.min(max, steppedValue));
		
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
				value = Math.min(max, value + step);
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
			case 'PageUp':
				event.preventDefault();
				value = Math.min(max, value + step * 4);
				onChange?.(value);
				break;
			case 'PageDown':
				event.preventDefault();
				value = Math.max(min, value - step * 4);
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
	
	// Generate marker values for common durations
	let markers = $derived.by(() => {
		if (!showMarkers) return [];
		
		const range = max - min;
		let markerValues: number[] = [];
		
		// Smarter marker generation to prevent overlap
		if (range <= 120) {
			// Small ranges (up to 2 hours): every 30 minutes
			markerValues = [30, 60, 90, 120].filter(duration => duration >= min && duration <= max);
		} else if (range <= 240) {
			// Medium ranges (up to 4 hours): every hour
			markerValues = [60, 120, 180, 240].filter(duration => duration >= min && duration <= max);
		} else if (range <= 360) {
			// Larger ranges (up to 6 hours): every 1.5 hours
			markerValues = [60, 150, 240, 330].filter(duration => duration >= min && duration <= max);
		} else {
			// Very large ranges: every 2 hours
			markerValues = [120, 240, 360, 480].filter(duration => duration >= min && duration <= max);
		}
		
		// Ensure minimum spacing between markers (at least 15% of slider width)
		const filteredMarkers: number[] = [];
		markerValues.forEach((value, index) => {
			if (index === 0) {
				filteredMarkers.push(value);
			} else {
				const prevPosition = ((markerValues[index - 1] - min) / range) * 100;
				const currentPosition = ((value - min) / range) * 100;
				
				// Only add marker if it's at least 15% away from the previous one
				if (currentPosition - prevPosition >= 15) {
					filteredMarkers.push(value);
				}
			}
		});
		
		return filteredMarkers.map(val => ({
			value: val,
			position: ((val - min) / (max - min)) * 100
		}));
	});
	
	// Format duration for display
	function formatDuration(minutes: number): { hours: number; mins: number; display: string } {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		
		if (hours === 0) {
			return { hours: 0, mins, display: `${mins}min` };
		} else if (mins === 0) {
			return { hours, mins: 0, display: `${hours}h` };
		} else {
			return { hours, mins, display: `${hours}h ${mins}min` };
		}
	}
	
	// Get duration category for display
	function getDurationCategory(minutes: number): string {
		if (minutes <= 30) return 'Quick Tour';
		if (minutes <= 60) return 'Short Tour';
		if (minutes <= 120) return 'Standard Tour';
		if (minutes <= 180) return 'Extended Tour';
		if (minutes <= 240) return 'Half Day';
		if (minutes <= 360) return 'Long Tour';
		return 'Full Day';
	}
	
	let durationInfo = $derived(formatDuration(value));
</script>

<div class="duration-slider" class:disabled class:error>
	{#if label}
		<div class="form-label block mb-3">
			{label}
			{#if required}<span class="text-red-500 ml-1">*</span>{/if}
		</div>
	{/if}
	
	<!-- Value display -->
	<div class="value-display">
		<div class="value-main">
			<div class="value-number">{durationInfo.display}</div>
		</div>
		<div class="value-category">{getDurationCategory(value)}</div>
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
		aria-valuemax={max}
		aria-valuenow={value}
		aria-valuetext="{durationInfo.display}"
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
							<span class="marker-text">{formatDuration(marker.value).display}</span>
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
			onmousedown={handleThumbDown}
			ontouchstart={handleThumbDown}
			aria-label="{label}: {durationInfo.display}"
			tabindex={disabled ? -1 : 0}
			{disabled}
		>
			<Clock class="thumb-icon" />
			<span class="thumb-value">{durationInfo.display}</span>
		</button>
	</div>
	
	<!-- Reset button container with reserved space -->
	<div class="reset-container">
		{#if defaultValue && value !== defaultValue && !disabled}
			<button
				type="button"
				onclick={() => {
					value = defaultValue;
					onChange?.(defaultValue);
				}}
				class="reset-button"
			>
				Reset to {formatDuration(defaultValue).display}
			</button>
		{:else}
			<!-- Reserve space to prevent layout jump -->
			<div class="reset-button-spacer"></div>
		{/if}
	</div>
</div>

<style>
	.duration-slider {
		width: 100%;
	}
	
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
	}
	
	.value-category {
		font-size: 0.875rem;
		color: var(--text-secondary);
		background: var(--bg-secondary);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full);
		border: 1px solid var(--border-secondary);
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
	
	/* Prevent marker overlap */
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
	
	.thumb-icon {
		width: 0.75rem;
		height: 0.75rem;
		color: var(--color-primary-600);
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
	
	.reset-container {
		display: flex;
		justify-content: center;
		margin-top: 1rem;
	}
	
	.reset-button {
		background: transparent;
		border: 1px solid var(--border-secondary);
		color: var(--color-primary-600);
		font-size: 0.75rem;
		cursor: pointer;
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast) ease;
		white-space: nowrap;
	}
	
	.reset-button:hover {
		color: var(--color-primary-700);
		background: var(--bg-secondary);
		border-color: var(--color-primary-200);
	}
	
	.reset-button-spacer {
		height: 2.125rem; /* Same height as reset button (padding + line-height) */
		width: 100%;
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
	
	.error .thumb-icon {
		color: var(--color-danger-600);
	}
	
	.error .value-number {
		color: var(--color-danger-600);
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
	}
	
	/* Mobile optimizations */
	@media (max-width: 640px) {
		.value-number {
			font-size: 1.75rem;
		}
		
		.slider-container {
			height: 5rem;
			padding: 2rem 0.5rem;
		}
		
		.slider-thumb {
			width: 2.5rem;
			height: 2.5rem;
		}
		
		.slider-thumb:hover:not(:disabled) {
			width: 2.5rem;
			height: 2.5rem;
		}
		
		.thumb-icon {
			width: 1rem;
			height: 1rem;
		}
		
		.thumb-value {
			opacity: 1;
			font-size: 0.625rem;
		}
		
		.markers {
			margin-top: 1rem;
		}
		
		.marker-text {
			font-size: 0.5rem;
			font-weight: 600;
		}
		
		/* Stagger markers more on mobile to prevent overlap */
		.marker:nth-child(odd) .marker-text {
			transform: translateY(-0.5rem);
		}
		
		.marker:nth-child(even) .marker-text {
			transform: translateY(0.5rem);
		}
		
		/* Hide every third marker on very small screens */
		@media (max-width: 480px) {
			.marker:nth-child(3n) {
				display: none;
			}
		}
	}
</style> 
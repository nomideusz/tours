<script lang="ts">
	import Pencil from 'lucide-svelte/icons/pencil';
	
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
	
	// Convert value to slider position (0-100) for linear slider
	let sliderPosition = $derived(((value - min) / (max - min)) * 100);
	
	// Convert value to angle for circular slider
	let currentAngle = $derived((() => {
		const normalized = (value - min) / (max - min);
		return START_ANGLE + normalized * (END_ANGLE - START_ANGLE);
	})());
	
	// Calculate thumb position for circular slider
	let thumbX = $derived(CENTER + RADIUS * Math.cos(currentAngle * Math.PI / 180));
	let thumbY = $derived(CENTER + RADIUS * Math.sin(currentAngle * Math.PI / 180));
	
	// Calculate arc path for circular slider
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
		const newValue = min + normalized * (max - min);
		
		// Apply step
		const stepped = Math.round(newValue / step) * step;
		const clamped = Math.max(min, Math.min(max, stepped));
		
		if (clamped !== value) {
			value = clamped;
			onChange?.(clamped);
		}
	}
	
	// Get position from mouse/touch event for linear slider
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
	function handleTrackClick(event: MouseEvent | TouchEvent) {
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
		markerValues = filteredMarkers;
		
		return markerValues.map(val => ({
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
	
	// Handle manual input
	function startEditing() {
		if (disabled) return;
		isEditing = true;
		editValue = value.toString();
		
		// Focus input after DOM update
		setTimeout(() => {
			if (editInputRef) {
				editInputRef.focus();
				editInputRef.select();
			}
		}, 100);
	}
	
	function handleEditSubmit() {
		const parsed = parseInt(editValue);
		
		if (!isNaN(parsed)) {
			const stepped = Math.round(parsed / step) * step;
			const clamped = Math.max(min, Math.min(max, stepped));
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
	
	let durationInfo = $derived(formatDuration(value));
</script>

<div class="duration-slider" class:disabled class:error class:mobile={isMobile} class:editing={isEditing}>
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
						type="number"
						inputmode="numeric"
						min={min}
						max={max}
						step={step}
						class="value-edit-input"
						onblur={handleEditSubmit}
						onkeydown={handleEditKeyDown}
					/>
				{:else}
					<div 
						class="value-number"
						onclick={startEditing}
						role="button"
						tabindex={disabled ? -1 : 0}
						onkeydown={(e) => { if (e.key === 'Enter') startEditing(); }}
					>
						{durationInfo.display}
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
			aria-valuetext="{durationInfo.display}"
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
								<span class="marker-text">{formatDuration(marker.value).display}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			
			<button
				type="button"
				class="slider-thumb"
				style="left: calc(0.75rem + ({sliderPosition} / 100) * (100% - 1.5rem))"
				data-value="{durationInfo.display}"
				onmousedown={handleThumbDown}
				ontouchstart={handleThumbDown}
				aria-label="{label}: {durationInfo.display}"
				tabindex={disabled ? -1 : 0}
				{disabled}
			>
				<span class="thumb-value">{durationInfo.display}</span>
			</button>
		</div>
	<!-- {/if} -->
</div>

<style>
	.duration-slider {
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
	
	.circular-edit-input {
		width: 100%;
		height: 100%;
		background: var(--bg-primary);
		border: 2px solid var(--color-primary-500);
		border-radius: var(--radius-sm);
		text-align: center;
		font-size: 1.5rem;
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

	.circular-edit-input::-webkit-outer-spin-button,
	.circular-edit-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
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
	
	.duration-slider:not(.disabled) .value-number:hover {
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
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
	}

	.value-edit-input::-webkit-outer-spin-button,
	.value-edit-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
	}

	.value-edit-input:focus {
		outline: none;
		border-color: var(--color-primary-600);
		background: var(--bg-secondary);
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
		height: 1.75rem; /* Fixed height to prevent layout shifts */
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
		height: 1.75rem; /* Match container height */
		display: flex;
		align-items: center;
	}
	
	.reset-button-top:hover {
		color: var(--color-primary-700);
		background: var(--bg-secondary);
		border-color: var(--color-primary-200);
	}
	
	.reset-button-spacer {
		height: 1.75rem; /* Same height as reset button */
		width: 1px; /* Minimal width, just to reserve space */
		opacity: 0; /* Invisible but still takes space */
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
	
	/* Editing state */
	.duration-slider.editing .slider-track {
		opacity: 0.5;
		pointer-events: none;
	}

	.duration-slider.editing .slider-thumb {
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
	
	/* Mobile optimizations */
	@media (max-width: 640px) {
		.slider-container {
			height: 4.25rem;
			padding: 1rem 0.5rem 3.25rem 0.5rem;
			margin-bottom: 0;
		}
		
		.slider-thumb {
			width: 2.5rem;
			height: 2.5rem;
		}
		
		.slider-thumb:hover:not(:disabled) {
			width: 2.5rem;
			height: 2.5rem;
		}
		

		
		/* Hide the hover value above thumb on mobile */
		.thumb-value {
			display: none;
		}
		
		/* Add value below thumb on mobile */
		.slider-thumb::after {
			content: attr(data-value);
			position: absolute;
			top: 100%;
			left: 50%;
			transform: translateX(-50%);
			margin-top: 0.5rem;
			margin-bottom: 0.75rem;
			font-size: 0.875rem;
			font-weight: 700;
			color: var(--text-primary);
			white-space: nowrap;
			pointer-events: none;
		}
		
		/* Hide markers completely on mobile */
		.markers {
			display: none;
		}
	}
</style> 
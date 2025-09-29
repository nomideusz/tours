<script lang="ts">
	import Pencil from 'lucide-svelte/icons/pencil';
	import '../styles/sliders.css';
	
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
		max = 2880, // 48 hours
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
	
	// Non-linear scaling for better UX - gives more space to common durations
	function valueToPosition(minutes: number): number {
		// Break the range into segments for better distribution
		if (minutes <= 480) { // 0-8 hours: 70% of slider
			return ((minutes - min) / (480 - min)) * 70;
		} else if (minutes <= 1440) { // 8-24 hours: 20% of slider
			return 70 + ((minutes - 480) / (1440 - 480)) * 20;
		} else { // 24-48 hours: 10% of slider
			return 90 + ((minutes - 1440) / (max - 1440)) * 10;
		}
	}
	
	function positionToValue(position: number): number {
		// Reverse the non-linear scaling
		if (position <= 70) { // 0-8 hours range
			return min + (position / 70) * (480 - min);
		} else if (position <= 90) { // 8-24 hours range
			return 480 + ((position - 70) / 20) * (1440 - 480);
		} else { // 24-48 hours range
			return 1440 + ((position - 90) / 10) * (max - 1440);
		}
	}
	
	// Convert value to slider position (0-100) for linear slider
	let sliderPosition = $derived(valueToPosition(value));
	
	// Convert value to angle for circular slider
	let currentAngle = $derived((() => {
		const normalized = valueToPosition(value) / 100;
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
		
		// Convert angle to value using non-linear scaling
		const normalized = (angle - START_ANGLE) / (END_ANGLE - START_ANGLE);
		const position = normalized * 100;
		const newValue = positionToValue(position);
		
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
	
	// Update value from slider position using non-linear scaling
	function updateValueFromPosition(position: number) {
		const rawValue = positionToValue(position);
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
		} else if (range <= 720) {
			// Large ranges (up to 12 hours): every 2-3 hours
			markerValues = [120, 240, 360, 480, 600, 720].filter(duration => duration >= min && duration <= max);
		} else if (range <= 1440) {
			// Very large ranges (up to 24 hours): every 4-6 hours
			markerValues = [240, 480, 720, 960, 1200, 1440].filter(duration => duration >= min && duration <= max);
		} else {
			// Extreme ranges (up to 48 hours): every 6-12 hours
			markerValues = [360, 720, 1080, 1440, 2160, 2880].filter(duration => duration >= min && duration <= max);
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
			position: valueToPosition(val)
		}));
	});
	
	// Format duration for display
	function formatDuration(minutes: number): { hours: number; mins: number; display: string } {
		const days = Math.floor(minutes / 1440);
		const hours = Math.floor((minutes % 1440) / 60);
		const mins = minutes % 60;
		
		if (days > 0) {
			// Show days for multi-day tours
			if (hours === 0 && mins === 0) {
				return { hours: days * 24, mins: 0, display: `${days}d` };
			} else if (mins === 0) {
				return { hours: days * 24 + hours, mins: 0, display: `${days}d ${hours}h` };
			} else {
				return { hours: days * 24 + hours, mins, display: `${days}d ${hours}h ${mins}min` };
			}
		} else if (hours === 0) {
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

<div class="slider-base duration-slider" class:disabled class:error class:mobile={isMobile} class:editing={isEditing}>
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
	/* Duration-specific styles - no additional styles needed for linear slider */
</style> 
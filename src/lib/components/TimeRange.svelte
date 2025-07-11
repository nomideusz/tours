<script lang="ts">
	import Clock from 'lucide-svelte/icons/clock';
	
	interface Props {
		startTime: string;
		endTime: string;
		label?: string;
		required?: boolean;
		disabled?: boolean;
		error?: boolean;
		defaultDuration?: number; // in minutes
		onStartTimeChange?: (startTime: string) => void;
		onEndTimeChange?: (endTime: string) => void;
		resetManualFlag?: boolean;
		min?: string; // minimum time (default "00:00")
		max?: string; // maximum time (default "24:00")
		step?: number; // step in minutes (default 15)
	}
	
	let {
		startTime = $bindable(),
		endTime = $bindable(),
		label = 'Time',
		required = false,
		disabled = false,
		error = false,
		defaultDuration = 120, // 2 hours default
		onStartTimeChange,
		onEndTimeChange,
		resetManualFlag = false,
		min = "00:00",
		max = "24:00",
		step = 15
	}: Props = $props();
	
	// Convert time string to minutes
	function timeToMinutes(timeString: string): number {
		if (!timeString) return 0;
		
		// Handle 24:00 special case
		if (timeString === "24:00") {
			return 24 * 60;
		}
		
		const [hour, minute] = timeString.split(':').map(Number);
		return hour * 60 + minute;
	}
	
	// Convert minutes to time string
	function minutesToTime(minutes: number): string {
		// Handle 24:00 case
		if (minutes === 24 * 60) {
			return "24:00";
		}
		
		const hour = Math.floor(minutes / 60) % 24;
		const minute = minutes % 60;
		return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
	}
	
	// Calculate slider range
	const minMinutes = timeToMinutes(min);
	const maxMinutes = max === "24:00" ? 24 * 60 : timeToMinutes(max);
	const totalMinutes = maxMinutes - minMinutes;
	
	// Convert times to slider values (0-100)
	let startValue = $derived((timeToMinutes(startTime) - minMinutes) / totalMinutes * 100);
	let endValue = $derived.by(() => {
		// Handle 24:00 specially
		if (endTime === "24:00") {
			return 100;
		}
		
		let endMin = timeToMinutes(endTime);
		const startMin = timeToMinutes(startTime);
		
		// Calculate the actual position on the slider
		const position = (endMin - minMinutes) / totalMinutes * 100;
		
		// If end time is before start time, it spans midnight
		// For midnight spanning, the end thumb should stay at its actual position
		if (endMin < startMin && max === "24:00") {
			return position;
		}
		
		return position;
	});
	
	// Calculate the visual range width for the slider
	let rangeWidth = $derived.by(() => {
		const startMin = timeToMinutes(startTime);
		const endMin = timeToMinutes(endTime);
		
		// If end time is 24:00, show range from start to end
		if (endTime === "24:00") {
			return 100 - startValue;
		}
		
		// If end time is before start time, it spans midnight
		if (endMin < startMin && max === "24:00") {
			// Show the range from start to end of day
			return 100 - startValue;
		}
		
		return endValue - startValue;
	});
	
	// Calculate the visual range position
	let rangeLeft = $derived(startValue);
	
	// Track which thumb is being dragged
	let draggingThumb: 'start' | 'end' | null = $state(null);
	let sliderRef: HTMLDivElement;
	
	// Calculate duration
	let duration = $derived.by(() => {
		if (!startTime || !endTime) return 0;
		
		const startMin = timeToMinutes(startTime);
		let endMin = timeToMinutes(endTime);
		
		// If end time is before start time, it spans midnight
		if (endMin <= startMin) {
			endMin += 24 * 60;
		}
		
		return endMin - startMin;
	});
	
	// Format duration for display
	let durationLabel = $derived.by(() => {
		if (duration <= 0) return '--';
		
		const hours = Math.floor(duration / 60);
		const minutes = duration % 60;
		
		if (hours === 0) return `${minutes}m`;
		if (minutes === 0) return `${hours}h`;
		return `${hours}h ${minutes}m`;
	});
	
	// Track if user has manually changed end time
	let endTimeManuallySet = $state(false);
	
	// Get position from mouse/touch event
	function getPositionFromEvent(event: MouseEvent | TouchEvent): number {
		if (!sliderRef) return 0;
		
		const rect = sliderRef.getBoundingClientRect();
		const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
		const x = clientX - rect.left;
		const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
		
		return percentage;
	}
	
	// Update time from slider position
	function updateTimeFromPosition(position: number, isStart: boolean) {
		let minutes = Math.round((position / 100 * totalMinutes + minMinutes) / step) * step;
		
		// Handle 24:00 case for end time
		if (!isStart && position >= 98 && max === "24:00") {
			// If we're at the far right of the slider, treat it as 24:00
			minutes = 24 * 60;
		}
		
		const time = minutesToTime(minutes);
		
		if (isStart) {
			// Don't allow start time to be 24:00
			if (minutes >= 24 * 60) {
				minutes = 24 * 60 - step;
			}
			
			startTime = minutesToTime(minutes);
			onStartTimeChange?.(startTime);
			
			// Auto-adjust end time to maintain default duration (unless manually set)
			if (!endTimeManuallySet) {
				endTime = minutesToTime(minutes + defaultDuration);
				onEndTimeChange?.(endTime);
			}
		} else {
			endTime = time;
			endTimeManuallySet = true;
			onEndTimeChange?.(time);
			
			// Ensure end is after start
			const startMin = timeToMinutes(startTime);
			const endMin = timeToMinutes(endTime);
			
			// If end is before start and we're not at midnight, adjust start
			if (startMin >= endMin && endMin !== 0 && endTime !== "24:00") {
				startTime = minutesToTime(Math.max(minMinutes, endMin - defaultDuration));
				onStartTimeChange?.(startTime);
			}
		}
	}
	
	// Handle mouse/touch down on thumb
	function handleThumbDown(event: MouseEvent | TouchEvent, thumb: 'start' | 'end') {
		if (disabled) return;
		event.preventDefault();
		draggingThumb = thumb;
	}
	
	// Handle mouse/touch move
	function handleMove(event: MouseEvent | TouchEvent) {
		if (!draggingThumb || disabled) return;
		event.preventDefault();
		
		const position = getPositionFromEvent(event);
		updateTimeFromPosition(position, draggingThumb === 'start');
	}
	
	// Handle mouse/touch up
	function handleUp() {
		draggingThumb = null;
	}
	
	// Handle track click
	function handleTrackClick(event: MouseEvent | TouchEvent) {
		if (disabled || draggingThumb) return;
		
		const position = getPositionFromEvent(event);
		const clickMinutes = position / 100 * totalMinutes + minMinutes;
		const startMinutes = timeToMinutes(startTime);
		const endMinutes = timeToMinutes(endTime);
		
		// Determine which thumb to move based on proximity
		const startDistance = Math.abs(clickMinutes - startMinutes);
		const endDistance = Math.abs(clickMinutes - endMinutes);
		
		updateTimeFromPosition(position, startDistance < endDistance);
	}
	
	// Reset manual flag when component gets new props
	$effect(() => {
		if (!startTime && !endTime) {
			endTimeManuallySet = false;
		}
		if (resetManualFlag) {
			endTimeManuallySet = false;
		}
	});
	
	// Add global listeners when dragging
	$effect(() => {
		if (draggingThumb) {
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
	
	// Format time for display
	function formatTimeDisplay(time: string): string {
		if (!time) return '--:--';
		return time === "24:00" ? "00:00" : time;
	}
</script>

<div class="time-range-slider" class:disabled class:error>
	{#if label}
		<div class="form-label block mb-3">
			{label}
			{#if required}<span class="text-red-500 ml-1">*</span>{/if}
		</div>
	{/if}
	
	<!-- Time display -->
	<div class="time-display">
		<div class="time-value start">
			<span class="time-label">Start</span>
			<span class="time-text">{formatTimeDisplay(startTime)}</span>
		</div>
		<div class="duration-display">
			<Clock class="w-4 h-4" />
			<span>{durationLabel}</span>
			{#if endTime && startTime && timeToMinutes(endTime) <= timeToMinutes(startTime) && endTime !== "24:00"}
				<span class="midnight-indicator">+1 day</span>
			{/if}
		</div>
		<div class="time-value end">
			<span class="time-label">End</span>
			<span class="time-text">{formatTimeDisplay(endTime)}</span>
		</div>
	</div>
	
	<!-- Slider -->
	<div 
		class="slider-container"
		bind:this={sliderRef}
		onmousedown={handleTrackClick}
		ontouchstart={(e) => {
			// Handle touch on track (not thumbs)
			const target = e.target as HTMLElement;
			if (target === sliderRef || target?.classList?.contains('slider-track') || target?.classList?.contains('slider-range')) {
				handleTrackClick(e);
			}
		}}
		onkeydown={(e) => {
			if (disabled) return;
			
			// Handle keyboard navigation
			if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
				e.preventDefault();
				const increment = e.key === 'ArrowRight' ? step : -step;
				const newStartMinutes = timeToMinutes(startTime) + increment;
				const newStartTime = minutesToTime(Math.max(minMinutes, Math.min(maxMinutes - defaultDuration, newStartMinutes)));
				startTime = newStartTime;
				onStartTimeChange?.(newStartTime);
				
				if (!endTimeManuallySet) {
					endTime = minutesToTime(timeToMinutes(newStartTime) + defaultDuration);
					onEndTimeChange?.(endTime);
				}
			}
		}}
		role="slider"
		aria-label="Time range selector"
		aria-valuemin={minMinutes}
		aria-valuemax={maxMinutes}
		aria-valuenow={timeToMinutes(startTime)}
		tabindex={disabled ? -1 : 0}
	>
		<!-- Track -->
		<div class="slider-track">
			<!-- Selected range -->
			<div 
				class="slider-range"
				class:spans-midnight={endTime && startTime && timeToMinutes(endTime) <= timeToMinutes(startTime) && endTime !== "24:00"}
				style="left: {rangeLeft}%; width: {rangeWidth}%"
			></div>
			
			<!-- Midnight continuation indicator -->
			{#if endTime && startTime && timeToMinutes(endTime) <= timeToMinutes(startTime) && endTime !== "24:00"}
				<div 
					class="midnight-continuation"
					style="left: 0; width: {endValue}%"
				></div>
			{/if}
			
			<!-- Time markers -->
			<div class="time-markers">
				{#each Array(9) as _, i}
					{@const hour = i * 3}
					{@const position = (hour * 60 - minMinutes) / totalMinutes * 100}
					{#if position >= 0 && position <= 100}
						<div class="time-marker" class:midnight-marker={hour === 0 || hour === 24} style="left: {position}%">
							<span class="marker-text">{hour === 24 ? '00' : hour.toString().padStart(2, '0')}:00</span>
						</div>
					{/if}
				{/each}
			</div>
		</div>
		
		<!-- Thumbs -->
		<button
			type="button"
			class="slider-thumb start"
			style="left: {startValue}%"
			onmousedown={(e) => handleThumbDown(e, 'start')}
			ontouchstart={(e) => handleThumbDown(e, 'start')}
			aria-label="Start time"
			tabindex={disabled ? -1 : 0}
			{disabled}
		>
			<span class="thumb-time">{formatTimeDisplay(startTime)}</span>
		</button>
		
		<button
			type="button"
			class="slider-thumb end"
			style="left: {endValue}%"
			onmousedown={(e) => handleThumbDown(e, 'end')}
			ontouchstart={(e) => handleThumbDown(e, 'end')}
			aria-label="End time"
			tabindex={disabled ? -1 : 0}
			{disabled}
		>
			<span class="thumb-time">{formatTimeDisplay(endTime)}</span>
		</button>
	</div>
	
	<!-- Reset button -->
	{#if defaultDuration && duration > 0 && duration !== defaultDuration && !disabled}
		<div class="reset-container">
			<button
				type="button"
				onclick={() => {
					const newEndMinutes = timeToMinutes(startTime) + defaultDuration;
					endTime = minutesToTime(newEndMinutes);
					endTimeManuallySet = false;
					onEndTimeChange?.(endTime);
				}}
				class="reset-button"
			>
				Reset to {Math.floor(defaultDuration / 60)}h{defaultDuration % 60 ? ` ${defaultDuration % 60}m` : ''}
			</button>
		</div>
	{/if}
</div>

<style>
	.time-range-slider {
		width: 100%;
	}
	
	.time-display {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding: 0 0.5rem;
	}
	
	.time-value {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}
	
	.time-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.time-text {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}
	
	.duration-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	.duration-display svg {
		color: var(--text-secondary);
	}
	
	.midnight-indicator {
		font-size: 0.75rem;
		color: var(--color-primary-600);
		background: var(--color-primary-50);
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-sm);
	}
	
	.slider-container {
		position: relative;
		height: 4rem;
		padding: 1.5rem 0.75rem;
		cursor: pointer;
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
	
	.slider-range {
		position: absolute;
		top: 0;
		height: 100%;
		background: var(--color-primary-200);
		border-radius: var(--radius-full);
		transition: all 0.2s ease;
	}
	
	.slider-range.spans-midnight {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
		background: linear-gradient(90deg, var(--color-primary-200) 0%, var(--color-primary-300) 100%);
	}
	
	.midnight-continuation {
		position: absolute;
		top: 0;
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary-300) 0%, var(--color-primary-200) 100%);
		border-radius: var(--radius-full);
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		transition: all 0.2s ease;
		opacity: 0.8;
	}
	
	.time-markers {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 0.5rem;
	}
	
	.time-marker {
		position: absolute;
		transform: translateX(-50%);
	}
	
	.marker-text {
		font-size: 0.625rem;
		color: var(--text-tertiary);
		white-space: nowrap;
	}
	
	.midnight-marker .marker-text {
		color: var(--color-primary-600);
		font-weight: 600;
	}
	
	.slider-thumb {
		position: absolute;
		top: 50%;
		width: 1.5rem;
		height: 1.5rem;
		background: var(--bg-primary);
		border: 3px solid var(--color-primary-500);
		border-radius: var(--radius-full);
		transform: translate(-50%, -50%);
		cursor: grab;
		transition: all 0.2s ease;
		z-index: 10;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		touch-action: none;
		-webkit-tap-highlight-color: transparent;
	}
	
	/* Increase touch target on mobile */
	.slider-thumb::before {
		content: '';
		position: absolute;
		top: -10px;
		left: -10px;
		right: -10px;
		bottom: -10px;
		border-radius: var(--radius-full);
	}
	
	.slider-thumb:hover:not(:disabled) {
		width: 1.75rem;
		height: 1.75rem;
		border-width: 4px;
	}
	
	.slider-thumb:active:not(:disabled) {
		cursor: grabbing;
		transform: translate(-50%, -50%) scale(0.95);
	}
	
	.slider-thumb.start {
		z-index: 11;
	}
	
	.thumb-time {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-primary);
		background: var(--bg-primary);
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-sm);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		white-space: nowrap;
		opacity: 0;
		transition: opacity 0.2s ease;
		pointer-events: none;
	}
	
	.slider-thumb:hover .thumb-time,
	.slider-thumb:active .thumb-time {
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
	
	.error .slider-range {
		background: var(--color-danger-300);
	}
	
	.error .slider-thumb {
		border-color: var(--color-danger-500);
	}
	
	/* Dark mode adjustments */
	@media (prefers-color-scheme: dark) {
		.midnight-indicator {
			background: var(--color-primary-900);
			color: var(--color-primary-300);
		}
		
		.slider-thumb {
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		}
		
		.thumb-time {
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
		}
	}
	
	/* Mobile optimizations */
	@media (max-width: 640px) {
		.time-display {
			padding: 0;
		}
		
		.time-text {
			font-size: 1.125rem;
		}
		
		.slider-container {
			height: 6rem;
			padding: 2rem 0.5rem 2.5rem;
		}
		
		.slider-thumb {
			width: 2.5rem;
			height: 2.5rem;
			border-width: 4px;
		}
		
		.slider-thumb:hover:not(:disabled) {
			width: 2.5rem;
			height: 2.5rem;
		}
		
		.slider-thumb:active:not(:disabled) {
			transform: translate(-50%, -50%) scale(0.9);
		}
		
		.thumb-time {
			opacity: 1;
			font-size: 0.625rem;
		}
		
		.time-markers {
			margin-top: 0.75rem;
		}
		
		/* Only show key time markers on mobile */
		.time-marker:nth-child(odd) {
			display: none;
		}
		
		.marker-text {
			font-size: 0.5rem;
		}
	}
</style> 
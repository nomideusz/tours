<script lang="ts">
	import Clock from 'lucide-svelte/icons/clock';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import X from 'lucide-svelte/icons/x';
	import { openTimePickerId } from '$lib/stores/timePicker.js';

	let {
		value = $bindable(''),
		placeholder = 'Select time',
		disabled = false,
		error = false,
		label = '',
		required = false,
		use24hour = true,
		onchange
	} = $props();

	// Generate unique ID for this TimePicker instance
	const instanceId = `timepicker-${Math.random().toString(36).substr(2, 9)}`;
	
	let isOpen = $state(false);
	let selectedHour = $state(9);  // Default to 9 AM
	let selectedMinute = $state(0); // Default to :00
	let selectedPeriod = $state<'AM' | 'PM'>('AM');

	// Subscribe to global open state
	$effect(() => {
		const unsubscribe = openTimePickerId.subscribe(openId => {
			if (openId !== instanceId) {
				isOpen = false;
			}
		});
		return unsubscribe;
	});

	// Parse initial value
	$effect(() => {
		if (value) {
			const [time, period] = value.includes(' ') ? value.split(' ') : [value, ''];
			const [hourStr, minuteStr] = time.split(':');
			let hour = parseInt(hourStr);
			const minute = parseInt(minuteStr);

			if (use24hour) {
				selectedHour = hour;
				selectedMinute = minute;
			} else {
				if (hour === 0) {
					selectedHour = 12;
					selectedPeriod = 'AM';
				} else if (hour === 12) {
					selectedHour = 12;
					selectedPeriod = 'PM';
				} else if (hour > 12) {
					selectedHour = hour - 12;
					selectedPeriod = 'PM';
				} else {
					selectedHour = hour;
					selectedPeriod = 'AM';
				}
				selectedMinute = minute;
			}
		}
	});

	// Common time presets
	const quickTimes = [
		{ label: '09:00', hour: 9, minute: 0 },
		{ label: '11:00', hour: 11, minute: 0 },
		{ label: '14:00', hour: 14, minute: 0 },
		{ label: '16:00', hour: 16, minute: 0 },
		{ label: '18:00', hour: 18, minute: 0 }
	];

	// Generate hours array
	let hours = $derived(use24hour ? 
		Array.from({ length: 24 }, (_, i) => i) : 
		Array.from({ length: 12 }, (_, i) => i + 1)
	);

	// Generate minutes array (every 15 minutes)
	let minutes = $derived(Array.from({ length: 4 }, (_, i) => i * 15));

	function formatTime(): string {
		if (use24hour) {
			return `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
		} else {
			const displayHour = selectedHour === 0 ? 12 : selectedHour;
			return `${displayHour}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`;
		}
	}

	function selectTime() {
		value = formatTime();
		onchange?.(value);
		isOpen = false;
		openTimePickerId.set(null);
	}

	function selectQuickTime(hour: number, minute: number) {
		if (use24hour) {
			selectedHour = hour;
		} else {
			if (hour === 0) {
				selectedHour = 12;
				selectedPeriod = 'AM';
			} else if (hour === 12) {
				selectedHour = 12;
				selectedPeriod = 'PM';
			} else if (hour > 12) {
				selectedHour = hour - 12;
				selectedPeriod = 'PM';
			} else {
				selectedHour = hour;
				selectedPeriod = 'AM';
			}
		}
		selectedMinute = minute;
		selectTime();
	}

	function adjustHour(delta: number) {
		if (use24hour) {
			selectedHour = Math.max(0, Math.min(23, selectedHour + delta));
		} else {
			let newHour = selectedHour + delta;
			if (newHour > 12) newHour = 1;
			if (newHour < 1) newHour = 12;
			selectedHour = newHour;
		}
	}

	function adjustMinute(delta: number) {
		let newMinute = selectedMinute + delta;
		if (newMinute >= 60) newMinute = 0;
		if (newMinute < 0) newMinute = 45;
		selectedMinute = newMinute;
	}

	function clearTime() {
		value = '';
		onchange?.('');
	}

	function displayTime(): string {
		if (!value) return placeholder;
		if (use24hour) {
			return value;
		}
		// Convert 24h format to 12h format for display
		const [hourStr, minuteStr] = value.split(':');
		let hour = parseInt(hourStr);
		const minute = parseInt(minuteStr);
		const period = hour >= 12 ? 'PM' : 'AM';
		hour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
		return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
	}

	// Close picker when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (!event.target || !(event.target as Element).closest('.time-picker-container')) {
			isOpen = false;
			openTimePickerId.set(null);
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="time-picker-container relative">
	{#if label}
		<label for={instanceId} class="form-label">
			{label}
			{#if required}<span style="color: var(--color-error);" class="ml-1">*</span>{/if}
		</label>
	{/if}

	<!-- Input field -->
	<div class="relative">
		<div
			role="button"
			tabindex={disabled ? -1 : 0}
			id={instanceId}
			onclick={() => {
				if (!disabled) {
					if (isOpen) {
						isOpen = false;
						openTimePickerId.set(null);
					} else {
						isOpen = true;
						openTimePickerId.set(instanceId);
					}
				}
			}}
			onkeydown={(e) => !disabled && (e.key === 'Enter' || e.key === ' ') && (isOpen = !isOpen)}
			class="form-input w-full text-left {error ? 'error' : ''}"
			style="{disabled 
				? 'opacity: 0.5; cursor: not-allowed;' 
				: 'cursor: pointer;'
			} padding-left: 2.5rem; padding-right: {value ? '2.5rem' : '1.5rem'};"
		>
			<Clock 
				class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
				style="color: var(--text-tertiary);" 
			/>
			
			<span style="color: {value ? 'var(--text-primary)' : 'var(--text-secondary)'};">
				{displayTime()}
			</span>

			{#if value && !disabled}
				<button
					type="button"
					onclick={(e) => {
						e.stopPropagation();
						clearTime();
					}}
					class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors"
					style="color: var(--text-tertiary);"
					onmouseenter={(e) => {
						e.currentTarget.style.color = 'var(--text-secondary)';
						e.currentTarget.style.background = 'var(--bg-tertiary)';
					}}
					onmouseleave={(e) => {
						e.currentTarget.style.color = 'var(--text-tertiary)';
						e.currentTarget.style.background = 'transparent';
					}}
				>
					<X class="h-3 w-3" />
				</button>
			{/if}
		</div>
	</div>

	<!-- Time picker dropdown -->
	{#if isOpen}
		<div 
			class="absolute top-full left-0 mt-1 w-full min-w-80 max-w-sm max-h-96 overflow-y-auto rounded-lg shadow-lg border p-4 z-50"
			style="background: var(--bg-primary); border-color: var(--border-primary);"
		>
			<!-- Quick time presets -->
			<div class="mb-3">
				<p class="text-sm font-medium mb-2" style="color: var(--text-primary);">Quick Select</p>
				<div class="grid grid-cols-5 gap-1">
					{#each quickTimes as preset}
						<button
							type="button"
							onclick={() => selectQuickTime(preset.hour, preset.minute)}
							class="px-2 py-2 text-xs rounded border transition-all text-center font-medium"
							style="background: var(--bg-secondary); color: var(--text-primary); border-color: var(--border-primary);"
							onmouseenter={(e) => {
								e.currentTarget.style.background = 'var(--color-primary-50)';
								e.currentTarget.style.color = 'var(--color-primary-700)';
								e.currentTarget.style.borderColor = 'var(--color-primary-300)';
							}}
							onmouseleave={(e) => {
								e.currentTarget.style.background = 'var(--bg-secondary)';
								e.currentTarget.style.color = 'var(--text-primary)';
								e.currentTarget.style.borderColor = 'var(--border-primary)';
							}}
						>
							{preset.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Time selection -->
			<div class="border-t pt-3" style="border-color: var(--border-primary);">
				<p class="text-sm font-medium mb-2" style="color: var(--text-primary);">Custom Time</p>
				
				<div class="flex items-center justify-center gap-3">
					<!-- Hours -->
					<div class="flex flex-col items-center">
						<button
							type="button"
							onclick={() => adjustHour(1)}
							class="p-1 transition-colors"
							style="color: var(--text-tertiary);"
							onmouseenter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
							onmouseleave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
						>
							<ChevronUp class="h-3 w-3" />
						</button>
						
						<div 
							class="w-12 h-8 flex items-center justify-center rounded border my-1"
							style="background: var(--bg-secondary); border-color: var(--border-primary);"
						>
							<span class="text-sm font-mono font-medium" style="color: var(--text-primary);">
								{use24hour ? selectedHour.toString().padStart(2, '0') : selectedHour}
							</span>
						</div>
						
						<button
							type="button"
							onclick={() => adjustHour(-1)}
							class="p-1 transition-colors"
							style="color: var(--text-tertiary);"
							onmouseenter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
							onmouseleave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
						>
							<ChevronDown class="h-3 w-3" />
						</button>
						
						<span class="text-xs" style="color: var(--text-tertiary);">Hour</span>
					</div>

					<!-- Separator -->
					<div class="text-lg font-bold mb-4" style="color: var(--text-tertiary);">:</div>

					<!-- Minutes -->
					<div class="flex flex-col items-center">
						<button
							type="button"
							onclick={() => adjustMinute(15)}
							class="p-1 transition-colors"
							style="color: var(--text-tertiary);"
							onmouseenter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
							onmouseleave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
						>
							<ChevronUp class="h-3 w-3" />
						</button>
						
						<div 
							class="w-12 h-8 flex items-center justify-center rounded border my-1"
							style="background: var(--bg-secondary); border-color: var(--border-primary);"
						>
							<span class="text-sm font-mono font-medium" style="color: var(--text-primary);">
								{selectedMinute.toString().padStart(2, '0')}
							</span>
						</div>
						
						<button
							type="button"
							onclick={() => adjustMinute(-15)}
							class="p-1 transition-colors"
							style="color: var(--text-tertiary);"
							onmouseenter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
							onmouseleave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
						>
							<ChevronDown class="h-3 w-3" />
						</button>
						
						<span class="text-xs" style="color: var(--text-tertiary);">Min</span>
					</div>

					<!-- AM/PM for 12-hour format -->
					{#if !use24hour}
						<div class="flex flex-col items-center">
							<div class="flex flex-col gap-1">
								<button
									type="button"
									onclick={() => selectedPeriod = 'AM'}
									class="px-2 py-1 text-xs rounded transition-colors"
									style="{selectedPeriod === 'AM' 
										? 'background: var(--color-primary-600); color: white;' 
										: 'background: var(--bg-secondary); color: var(--text-primary);'
									}"
									onmouseenter={selectedPeriod !== 'AM' ? (e) => {
										e.currentTarget.style.background = 'var(--bg-tertiary)';
									} : null}
									onmouseleave={selectedPeriod !== 'AM' ? (e) => {
										e.currentTarget.style.background = 'var(--bg-secondary)';
									} : null}
								>
									AM
								</button>
								<button
									type="button"
									onclick={() => selectedPeriod = 'PM'}
									class="px-2 py-1 text-xs rounded transition-colors"
									style="{selectedPeriod === 'PM' 
										? 'background: var(--color-primary-600); color: white;' 
										: 'background: var(--bg-secondary); color: var(--text-primary);'
									}"
									onmouseenter={selectedPeriod !== 'PM' ? (e) => {
										e.currentTarget.style.background = 'var(--bg-tertiary)';
									} : null}
									onmouseleave={selectedPeriod !== 'PM' ? (e) => {
										e.currentTarget.style.background = 'var(--bg-secondary)';
									} : null}
								>
									PM
								</button>
							</div>
							
							<span class="text-xs" style="color: var(--text-tertiary);">Period</span>
						</div>
					{/if}
				</div>

				<!-- Action buttons -->
				<div class="flex justify-between items-center mt-3 pt-3 border-t" style="border-color: var(--border-primary);">
					<div class="text-sm" style="color: var(--text-secondary);">
						<span class="font-medium">{formatTime()}</span>
					</div>
					
					<button
						type="button"
						onclick={selectTime}
						class="button-primary button--small"
					>
						Select
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>


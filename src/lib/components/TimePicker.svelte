<script lang="ts">
	import { createEventDispatcher } from 'svelte';
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
		use24hour = true
	} = $props();

	const dispatch = createEventDispatcher();

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
		{ label: '9AM', hour: 9, minute: 0 },
		{ label: '11AM', hour: 11, minute: 0 },
		{ label: '2PM', hour: 14, minute: 0 },
		{ label: '4PM', hour: 16, minute: 0 },
		{ label: '6PM', hour: 18, minute: 0 }
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
		dispatch('change', value);
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
		dispatch('change', '');
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
		<label class="form-label mb-2 block">
			{label}
			{#if required}<span class="text-red-500 ml-1">*</span>{/if}
		</label>
	{/if}

	<!-- Input field -->
	<div class="relative">
		<button
			type="button"
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
			class="form-input pl-10 pr-10 w-full text-left {error ? 'error' : ''} {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'}"
			{disabled}
		>
			<Clock class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
			
			<span class={value ? 'text-gray-900' : 'text-gray-500'}>
				{displayTime()}
			</span>

			{#if value && !disabled}
				<button
					type="button"
					onclick={(e) => {
						e.stopPropagation();
						clearTime();
					}}
					class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
				>
					<X class="h-3 w-3" />
				</button>
			{/if}
		</button>
	</div>

	<!-- Time picker dropdown -->
	{#if isOpen}
		<div class="absolute top-full left-0 mt-1 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4">
			<!-- Quick time presets -->
			<div class="mb-3">
				<p class="text-sm font-medium text-gray-700 mb-2">Quick Select</p>
				<div class="grid grid-cols-5 gap-1">
					{#each quickTimes as preset}
						<button
							type="button"
							onclick={() => selectQuickTime(preset.hour, preset.minute)}
							class="px-2 py-2 text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded border border-gray-200 hover:border-blue-300 transition-all text-center font-medium"
						>
							{preset.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Time selection -->
			<div class="border-t border-gray-200 pt-3">
				<p class="text-sm font-medium text-gray-700 mb-2">Custom Time</p>
				
				<div class="flex items-center justify-center gap-3">
					<!-- Hours -->
					<div class="flex flex-col items-center">
						<button
							type="button"
							onclick={() => adjustHour(1)}
							class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
						>
							<ChevronUp class="h-3 w-3" />
						</button>
						
						<div class="w-12 h-8 flex items-center justify-center bg-gray-50 rounded border border-gray-200 my-1">
							<span class="text-sm font-mono font-medium">
								{use24hour ? selectedHour.toString().padStart(2, '0') : selectedHour}
							</span>
						</div>
						
						<button
							type="button"
							onclick={() => adjustHour(-1)}
							class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
						>
							<ChevronDown class="h-3 w-3" />
						</button>
						
						<span class="text-xs text-gray-500">Hour</span>
					</div>

					<!-- Separator -->
					<div class="text-lg font-bold text-gray-400 mb-4">:</div>

					<!-- Minutes -->
					<div class="flex flex-col items-center">
						<button
							type="button"
							onclick={() => adjustMinute(15)}
							class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
						>
							<ChevronUp class="h-3 w-3" />
						</button>
						
						<div class="w-12 h-8 flex items-center justify-center bg-gray-50 rounded border border-gray-200 my-1">
							<span class="text-sm font-mono font-medium">
								{selectedMinute.toString().padStart(2, '0')}
							</span>
						</div>
						
						<button
							type="button"
							onclick={() => adjustMinute(-15)}
							class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
						>
							<ChevronDown class="h-3 w-3" />
						</button>
						
						<span class="text-xs text-gray-500">Min</span>
					</div>

					<!-- AM/PM for 12-hour format -->
					{#if !use24hour}
						<div class="flex flex-col items-center">
							<div class="flex flex-col gap-1">
								<button
									type="button"
									onclick={() => selectedPeriod = 'AM'}
									class="px-2 py-1 text-xs rounded {selectedPeriod === 'AM' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors"
								>
									AM
								</button>
								<button
									type="button"
									onclick={() => selectedPeriod = 'PM'}
									class="px-2 py-1 text-xs rounded {selectedPeriod === 'PM' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors"
								>
									PM
								</button>
							</div>
							
							<span class="text-xs text-gray-500">Period</span>
						</div>
					{/if}
				</div>

				<!-- Action buttons -->
				<div class="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
					<div class="text-sm text-gray-600">
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

<style>
	.time-picker-container {
		/* Ensure proper z-index stacking */
	}
</style> 
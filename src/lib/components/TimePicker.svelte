<script lang="ts">
	import Clock from 'lucide-svelte/icons/clock';
	import ChevronUp from 'lucide-svelte/icons/chevron-up';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';

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

	let selectedHour = $state(9);
	let selectedMinute = $state(0);
	let hourInput = $state('');
	let minuteInput = $state('');
	let editingHour = $state(false);
	let editingMinute = $state(false);

	// Parse initial value
	$effect(() => {
		if (value) {
			const [hourStr, minuteStr] = value.split(':');
			selectedHour = parseInt(hourStr) || 9;
			selectedMinute = parseInt(minuteStr) || 0;
		}
	});

	function formatTime(): string {
		return `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
	}

	function updateValue() {
		value = formatTime();
		onchange?.(value);
	}

	function adjustHour(delta: number) {
		const newHour = selectedHour + delta;
		if (newHour >= 24) {
			selectedHour = 0;
		} else if (newHour < 0) {
			selectedHour = 23;
		} else {
			selectedHour = newHour;
		}
		updateValue();
	}

	function adjustMinute(delta: number) {
		const newMinute = selectedMinute + delta;
		if (newMinute >= 60) {
			selectedMinute = 0;
		} else if (newMinute < 0) {
			selectedMinute = 45;
		} else {
			selectedMinute = newMinute;
		}
		updateValue();
	}

	function startEditingHour() {
		editingHour = true;
		hourInput = selectedHour.toString();
	}

	function finishEditingHour() {
		editingHour = false;
		const hour = parseInt(hourInput);
		if (!isNaN(hour) && hour >= 0 && hour <= 23) {
			selectedHour = hour;
			updateValue();
		}
		hourInput = '';
	}

	function startEditingMinute() {
		editingMinute = true;
		minuteInput = selectedMinute.toString();
	}

	function finishEditingMinute() {
		editingMinute = false;
		const minute = parseInt(minuteInput);
		if (!isNaN(minute) && minute >= 0 && minute <= 59) {
			selectedMinute = minute;
			updateValue();
		}
		minuteInput = '';
	}
</script>

<div class="time-picker">
	{#if label}
		<label class="form-label">
			{label}
			{#if required}<span style="color: var(--color-error);" class="ml-1">*</span>{/if}
		</label>
	{/if}

	<div class="time-picker-container rounded-lg p-3" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); {disabled ? 'opacity: 0.5; pointer-events: none;' : ''}">
		<div class="flex items-center justify-center gap-3">
			<!-- Hours -->
			<div class="flex flex-col items-center">
				<button
					type="button"
					onclick={() => adjustHour(1)}
					class="p-1 rounded transition-colors hover:bg-gray-100"
					style="color: var(--text-secondary);"
				>
					<ChevronUp class="h-3 w-3" />
				</button>
				
				<div 
					class="w-12 h-10 flex items-center justify-center rounded border my-1 cursor-pointer transition-colors hover:bg-gray-50"
					style="background: var(--bg-primary); border-color: var(--border-primary);"
					onclick={() => !editingHour && startEditingHour()}
				>
					{#if editingHour}
						<input
							type="text"
							bind:value={hourInput}
							onblur={finishEditingHour}
							onkeydown={(e) => {
								if (e.key === 'Enter') finishEditingHour();
								if (e.key === 'Escape') { editingHour = false; hourInput = ''; }
							}}
							class="w-full h-full text-center font-mono font-semibold bg-transparent border-none outline-none"
							style="color: var(--text-primary);"
							autofocus
						/>
					{:else}
						<span class="font-mono font-semibold" style="color: var(--text-primary);">
							{selectedHour.toString().padStart(2, '0')}
						</span>
					{/if}
				</div>
				
				<button
					type="button"
					onclick={() => adjustHour(-1)}
					class="p-1 rounded transition-colors hover:bg-gray-100"
					style="color: var(--text-secondary);"
				>
					<ChevronDown class="h-3 w-3" />
				</button>
				
				<span class="text-xs mt-1" style="color: var(--text-tertiary);">Hr</span>
			</div>

			<!-- Separator -->
			<div class="text-xl font-bold mb-4" style="color: var(--text-tertiary);">:</div>

			<!-- Minutes -->
			<div class="flex flex-col items-center">
				<button
					type="button"
					onclick={() => adjustMinute(15)}
					class="p-1 rounded transition-colors hover:bg-gray-100"
					style="color: var(--text-secondary);"
				>
					<ChevronUp class="h-3 w-3" />
				</button>
				
				<div 
					class="w-12 h-10 flex items-center justify-center rounded border my-1 cursor-pointer transition-colors hover:bg-gray-50"
					style="background: var(--bg-primary); border-color: var(--border-primary);"
					onclick={() => !editingMinute && startEditingMinute()}
				>
					{#if editingMinute}
						<input
							type="text"
							bind:value={minuteInput}
							onblur={finishEditingMinute}
							onkeydown={(e) => {
								if (e.key === 'Enter') finishEditingMinute();
								if (e.key === 'Escape') { editingMinute = false; minuteInput = ''; }
							}}
							class="w-full h-full text-center font-mono font-semibold bg-transparent border-none outline-none"
							style="color: var(--text-primary);"
							autofocus
						/>
					{:else}
						<span class="font-mono font-semibold" style="color: var(--text-primary);">
							{selectedMinute.toString().padStart(2, '0')}
						</span>
					{/if}
				</div>
				
				<button
					type="button"
					onclick={() => adjustMinute(-15)}
					class="p-1 rounded transition-colors hover:bg-gray-100"
					style="color: var(--text-secondary);"
				>
					<ChevronDown class="h-3 w-3" />
				</button>
				
				<span class="text-xs mt-1" style="color: var(--text-tertiary);">Min</span>
			</div>
		</div>
	</div>
</div>

<style>
	.time-picker-container {
		max-width: 12rem;
		width: 100%;
	}
	
	@media (max-width: 640px) {
		.time-picker-container {
			max-width: 100%;
		}
	}
</style>


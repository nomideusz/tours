<script lang="ts">
	interface Props {
		id: string;
		label: string;
		value: number;
		min?: number;
		step?: number;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		incrementLabel?: string;
		decrementLabel?: string;
		error?: string | null;
		hasError?: boolean;
	}

	let {
		id,
		label,
		value = $bindable(),
		min = 0,
		step = 1,
		placeholder = "0",
		required = false,
		disabled = false,
		incrementLabel = "Increase value",
		decrementLabel = "Decrease value",
		error = null,
		hasError = false
	}: Props = $props();

	function increment() {
		value = Math.max(min, value + step);
	}

	function decrement() {
		value = Math.max(min, value - step);
	}
</script>

<div>
	<label for={id} class="form-label">
		{label}
		{#if required}*{/if}
	</label>
	<div class="relative">
		<input
			type="number"
			{id}
			bind:value
			{min}
			step={step.toString()}
			{placeholder}
			{disabled}
			class="form-input pr-16 {hasError ? 'error' : ''}"
		/>
		{#if error}
			<p class="form-error">{error}</p>
		{/if}
		<div class="absolute inset-y-0 right-0 flex flex-col">
			<button
				type="button"
				onclick={increment}
				{disabled}
				class="flex-1 px-3 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border border-gray-300 border-b-0 rounded-tr-md disabled:opacity-50 disabled:cursor-not-allowed"
				aria-label={incrementLabel}
			>
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
				</svg>
			</button>
			<button
				type="button"
				onclick={decrement}
				{disabled}
				class="flex-1 px-3 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border border-gray-300 rounded-br-md disabled:opacity-50 disabled:cursor-not-allowed"
				aria-label={decrementLabel}
			>
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
		</div>
	</div>
</div> 
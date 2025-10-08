<script lang="ts">
	interface Props {
		minAge?: number;
		maxAge?: number;
		onUpdate: (minAge?: number, maxAge?: number) => void;
		label?: string;
		disabled?: boolean;
		error?: string;
	}

	let { minAge = $bindable(), maxAge = $bindable(), onUpdate, label = "Age Range", disabled = false, error }: Props = $props();

	// Common age presets
	const presets = [
		{ label: "All Ages", min: undefined, max: undefined },
		{ label: "Adult", min: 18, max: undefined },
		{ label: "Senior", min: 65, max: undefined },
		{ label: "Youth", min: 13, max: 17 },
		{ label: "Child", min: 3, max: 12 },
		{ label: "Infant", min: 0, max: 2 }
	];

	function applyPreset(preset: typeof presets[0]) {
		minAge = preset.min;
		maxAge = preset.max;
		onUpdate(minAge, maxAge);
	}

	function handleMinChange(value: number | undefined) {
		minAge = value;
		// Ensure max is not less than min
		if (maxAge !== undefined && minAge !== undefined && maxAge < minAge) {
			maxAge = minAge;
		}
		onUpdate(minAge, maxAge);
	}

	function handleMaxChange(value: number | undefined) {
		maxAge = value;
		// Ensure min is not greater than max
		if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
			minAge = maxAge;
		}
		onUpdate(minAge, maxAge);
	}

	let showPresets = $state(false);
</script>

<div class="age-range-selector">
	<div class="age-range-header">
		<span class="age-range-label">{label}</span>
		<button
			type="button"
			onclick={() => showPresets = !showPresets}
			class="preset-toggle"
			{disabled}
			title="Show age presets"
		>
			{#if minAge !== undefined || maxAge !== undefined}
				{minAge ?? 0}{maxAge !== undefined ? `-${maxAge}` : '+'} years
			{:else}
				All ages
			{/if}
			<svg class="chevron" class:rotated={showPresets} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M6 9l6 6 6-6"/>
			</svg>
		</button>
	</div>

	{#if showPresets}
		<div class="preset-buttons">
			{#each presets as preset}
				<button
					type="button"
					onclick={() => {
						applyPreset(preset);
						showPresets = false;
					}}
					class="preset-btn"
					class:active={minAge === preset.min && maxAge === preset.max}
					{disabled}
				>
					{preset.label}
				</button>
			{/each}
		</div>
	{/if}

	<div class="age-inputs">
		<div class="age-input-group">
			<label for="min-age-{label}" class="age-input-label">Min</label>
			<input
				id="min-age-{label}"
				type="number"
				min="0"
				max="120"
				placeholder="0"
				value={minAge}
				oninput={(e) => {
					const val = e.currentTarget.value;
					handleMinChange(val === '' ? undefined : parseInt(val));
				}}
				class="age-input"
				class:error={!!error}
				{disabled}
			/>
			<span class="age-unit">years</span>
		</div>

		<span class="age-separator">to</span>

		<div class="age-input-group">
			<label for="max-age-{label}" class="age-input-label">Max</label>
			<input
				id="max-age-{label}"
				type="number"
				min="0"
				max="120"
				placeholder="∞"
				value={maxAge}
				oninput={(e) => {
					const val = e.currentTarget.value;
					handleMaxChange(val === '' ? undefined : parseInt(val));
				}}
				class="age-input"
				class:error={!!error}
				{disabled}
			/>
			<span class="age-unit">years</span>
		</div>
	</div>

	{#if error}
		<div class="error-message">{error}</div>
	{/if}
</div>

<style>
	.age-range-selector {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.age-range-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.age-range-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.preset-toggle {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.preset-toggle:not(:disabled):hover {
		background: var(--bg-secondary);
		border-color: var(--border-primary);
		color: var(--text-primary);
	}

	.preset-toggle:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.chevron {
		transition: transform 0.2s ease;
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	.preset-buttons {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.375rem;
		padding: 0.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		margin-top: -0.25rem;
	}

	.preset-btn {
		padding: 0.375rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.25rem;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.preset-btn:not(:disabled):hover {
		background: var(--color-primary-50);
		border-color: var(--color-primary-300);
		color: var(--color-primary-700);
	}

	.preset-btn.active {
		background: var(--color-primary-100);
		border-color: var(--color-primary-400);
		color: var(--color-primary-700);
		font-weight: 600;
	}

	.preset-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.age-inputs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.age-input-group {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex: 1;
	}

	.age-input-label {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		min-width: 2rem;
	}

	.age-input {
		width: 100%;
		max-width: 4rem;
		padding: 0.375rem 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		text-align: center;
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		color: var(--text-primary);
		transition: all 0.15s ease;
	}

	.age-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}

	.age-input.error {
		border-color: var(--color-error-500);
	}

	.age-input.error:focus {
		box-shadow: 0 0 0 3px var(--color-error-100);
	}

	.age-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: var(--bg-secondary);
	}

	/* Hide number spinners */
	.age-input::-webkit-inner-spin-button,
	.age-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		appearance: none;
		margin: 0;
	}

	.age-input[type="number"] {
		-moz-appearance: textfield;
		appearance: textfield;
	}

	.age-unit {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		white-space: nowrap;
	}

	.age-separator {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		padding: 0 0.25rem;
	}

	.error-message {
		font-size: 0.75rem;
		color: var(--color-error-600);
		margin-top: 0.25rem;
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.preset-buttons {
			grid-template-columns: repeat(2, 1fr);
		}

		.age-inputs {
			flex-direction: column;
			align-items: stretch;
		}

		.age-separator {
			display: none;
		}

		.age-input {
			max-width: none;
		}
	}
</style>

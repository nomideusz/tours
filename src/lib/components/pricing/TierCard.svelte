<script lang="ts">
	import type { GroupPricingTier } from '$lib/types.js';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import CurrencyInput from './CurrencyInput.svelte';

	interface Props {
		tier: GroupPricingTier;
		index: number;
		currencySymbol: string;
		onRemove: () => void;
		onUpdate: (updatedTier: GroupPricingTier) => void;
	}

	let { tier = $bindable(), index, currencySymbol, onRemove, onUpdate }: Props = $props();

	// Calculate price per person (average)
	let avgPricePerPerson = $derived(() => {
		if (tier.minParticipants && tier.maxParticipants && tier.price && tier.price > 0) {
			const avgParticipants = (tier.minParticipants + tier.maxParticipants) / 2;
			return tier.price / avgParticipants;
		}
		return null;
	});

	// Trigger update when tier changes
	function handleUpdate() {
		onUpdate(tier);
	}
</script>

<div class="tier-row">
	<!-- Label (optional) -->
	<input
		type="text"
		placeholder="Label"
		bind:value={tier.label}
		oninput={handleUpdate}
		class="tier-label"
		aria-label="Tier label"
	/>
	
	<!-- Participants range -->
	<div class="tier-range">
		<input
			type="number"
			min="1"
			max="200"
			bind:value={tier.minParticipants}
			oninput={handleUpdate}
			placeholder="1"
			class="range-input"
			aria-label="Minimum participants"
		/>
		<span class="range-sep">-</span>
		<input
			type="number"
			min={tier.minParticipants || 1}
			max="200"
			bind:value={tier.maxParticipants}
			oninput={handleUpdate}
			placeholder="10"
			class="range-input"
			aria-label="Maximum participants"
		/>
		<span class="range-label">people</span>
	</div>
	
	<!-- Price -->
	<div class="tier-price">
		<span class="price-for">for</span>
		<div class="price-input-wrapper">
			<CurrencyInput
				bind:value={tier.price}
				{currencySymbol}
				step={0.5}
				placeholder="0"
				ariaLabel="Tier price"
				onInput={handleUpdate}
				class="price-field"
			/>
		</div>
	</div>
	
	<!-- Avg per person indicator -->
	{#if avgPricePerPerson()}
		<span class="avg-price">~{currencySymbol}{avgPricePerPerson()?.toFixed(0)}/pp</span>
	{/if}
	
	<!-- Remove Button -->
	<button
		type="button"
		onclick={onRemove}
		class="remove-btn"
		aria-label="Remove tier {index + 1}"
	>
		<Trash2 class="w-4 h-4" />
	</button>
</div>

<style>
	.tier-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		transition: all 0.15s ease;
		flex-wrap: wrap;
	}
	
	.tier-row:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.tier-label {
		width: 7rem;
		font-size: 0.875rem;
		font-weight: 500;
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		flex-shrink: 0;
	}
	
	.tier-label:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 2px var(--color-primary-100);
	}
	
	.tier-label::placeholder {
		color: var(--text-tertiary);
		font-weight: 400;
	}
	
	.tier-range {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}
	
	.range-input {
		width: 3.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		text-align: center;
	}
	
	.range-input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 2px var(--color-primary-100);
	}
	
	.range-sep {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		font-weight: 500;
	}
	
	.range-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		white-space: nowrap;
	}
	
	.tier-price {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}
	
	.price-for {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}
	
	.price-input-wrapper {
		width: 5.5rem;
	}
	
	:global(.price-field) {
		width: 100%;
		font-size: 0.875rem;
		font-weight: 600;
		text-align: right;
		padding: 0.375rem 0.5rem;
	}
	
	.avg-price {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-weight: 500;
		white-space: nowrap;
		margin-left: auto;
	}
	
	.remove-btn {
		padding: 0.375rem;
		color: var(--color-error-600);
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}
	
	.remove-btn:hover {
		background: var(--color-error-50);
		color: var(--color-error-700);
	}
	
	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.tier-row {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}
		
		.tier-label {
			width: 100%;
		}
		
		.tier-range {
			justify-content: center;
		}
		
		.tier-price {
			justify-content: space-between;
		}
		
		.price-input-wrapper {
			width: 7rem;
		}
		
		.avg-price {
			margin-left: 0;
			text-align: center;
		}
		
		.remove-btn {
			align-self: center;
		}
	}
	
	@media (max-width: 640px) {
		.range-label {
			font-size: 0.7rem;
		}
		
		.price-for {
			display: none;
		}
	}
</style>
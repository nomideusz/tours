<script lang="ts">
	import type { GroupPricingTier } from '$lib/types.js';
	import Users from 'lucide-svelte/icons/users';
	import CheckCircle from 'lucide-svelte/icons/check-circle';

	interface Props {
		tiers: GroupPricingTier[];
		selectedTier: GroupPricingTier | null;
		availableSpots: number;
		currencySymbol: string;
		onTierSelect: (tier: GroupPricingTier) => void;
	}

	let { 
		tiers,
		selectedTier = $bindable(null),
		availableSpots,
		currencySymbol,
		onTierSelect
	}: Props = $props();

	// Filter tiers that fit within available spots
	let applicableTiers = $derived(
		tiers.filter(tier => tier.minParticipants <= availableSpots)
	);

	function handleTierClick(tier: GroupPricingTier) {
		// Only allow selection if tier fits in available spots
		if (tier.minParticipants <= availableSpots) {
			selectedTier = tier;
			onTierSelect(tier);
		}
	}

	function formatParticipantRange(tier: GroupPricingTier): string {
		if (tier.minParticipants === tier.maxParticipants) {
			return `${tier.minParticipants} ${tier.minParticipants === 1 ? 'person' : 'people'}`;
		}
		return `${tier.minParticipants}-${tier.maxParticipants} people`;
	}

	function getPricePerPerson(tier: GroupPricingTier): number {
		const avgGroupSize = (tier.minParticipants + tier.maxParticipants) / 2;
		return tier.price / avgGroupSize;
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<div class="form-label">Select Group Size</div>
		<span class="text-sm" style="color: var(--text-tertiary);">
			{availableSpots} spot{availableSpots === 1 ? '' : 's'} available
		</span>
	</div>

	{#if applicableTiers.length === 0}
		<div class="p-4 rounded-lg text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<p class="text-sm" style="color: var(--text-secondary);">
				No tier options available for {availableSpots} spot{availableSpots === 1 ? '' : 's'}
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-3">
			{#each applicableTiers as tier}
				{@const isSelected = selectedTier?.minParticipants === tier.minParticipants && selectedTier?.maxParticipants === tier.maxParticipants}
				{@const isDisabled = tier.minParticipants > availableSpots}
				<button
					type="button"
					class="tier-selector-card {isSelected ? 'selected' : ''} {isDisabled ? 'disabled' : ''}"
					onclick={() => handleTierClick(tier)}
					disabled={isDisabled}
				>
					<div class="flex items-start justify-between gap-4">
						<div class="flex items-start gap-3 flex-1">
							<div class="tier-icon {isSelected ? 'selected' : ''}">
								{#if isSelected}
									<CheckCircle class="w-5 h-5" />
								{:else}
									<Users class="w-5 h-5" />
								{/if}
							</div>
							<div class="flex-1 text-left">
								<div class="tier-name">
									{tier.label || formatParticipantRange(tier)}
								</div>
								<div class="tier-details">
									{formatParticipantRange(tier)}
									<span class="mx-2">•</span>
									~{currencySymbol}{getPricePerPerson(tier).toFixed(0)}/person
								</div>
							</div>
						</div>
						<div class="tier-price">
							{currencySymbol}{tier.price.toFixed(2)}
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}

	{#if selectedTier}
		<input type="hidden" name="selectedTier" value={JSON.stringify(selectedTier)} />
	{/if}
</div>

<style>
	.tier-selector-card {
		padding: 1rem;
		border-radius: 0.75rem;
		border: 2px solid var(--border-primary);
		background: var(--bg-primary);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.tier-selector-card:hover:not(.disabled) {
		border-color: var(--color-accent-500);
		background: var(--bg-secondary);
	}

	.tier-selector-card.selected {
		border-color: var(--color-accent-600);
		background: var(--color-accent-50);
	}

	.tier-selector-card.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.tier-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.5rem;
		background: var(--bg-secondary);
		color: var(--text-secondary);
		flex-shrink: 0;
		transition: all 0.2s ease;
	}

	.tier-icon.selected {
		background: var(--color-accent-100);
		color: var(--color-accent-700);
	}

	.tier-name {
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.tier-details {
		font-size: 0.8125rem;
		color: var(--text-secondary);
	}

	.tier-price {
		font-weight: 700;
		font-size: 1.125rem;
		color: var(--text-primary);
		white-space: nowrap;
	}

	.tier-selector-card.selected .tier-price {
		color: var(--color-accent-800);
	}
</style>

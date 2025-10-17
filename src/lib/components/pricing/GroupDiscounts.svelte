<script lang="ts">
	import type { GroupDiscountTier } from '$lib/types.js';
	import GroupDiscountTierCard from './GroupDiscountTierCard.svelte';
	import Plus from 'lucide-svelte/icons/plus';
	import Tag from 'lucide-svelte/icons/tag';
	
	interface Props {
		tiers: GroupDiscountTier[];
		enabled: boolean;
		currencySymbol: string;
		basePrice: number;
		maxCapacity: number;
		onUpdate: (tiers: GroupDiscountTier[], enabled: boolean) => void;
	}
	
	let { 
		tiers = $bindable([]),
		enabled = $bindable(false),
		currencySymbol,
		basePrice,
		maxCapacity,
		onUpdate
	}: Props = $props();
	
	// Generate unique ID
	function generateId(): string {
		return `tier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
	
	// Add a new discount tier with intelligent defaults
	function addTier() {
		// Don't allow adding if we can't add more
		if (!canAddMore()) return;
		
		let minParticipants = 2; // Start with 2 for first tier
		let maxParticipants = maxCapacity;
		
		if (tiers.length > 0) {
			// Split existing last tier's range
			const lastTier = tiers[tiers.length - 1];
			const range = lastTier.maxParticipants - lastTier.minParticipants + 1;
			
			// Don't split if there's not enough room (need at least 2 people)
			if (range < 2) return;
			
			const splitPoint = lastTier.minParticipants + Math.floor(range / 2);
			
			// Validate split point creates valid ranges
			if (splitPoint - 1 < lastTier.minParticipants || splitPoint > maxCapacity) {
				return; // Invalid split
			}
			
			// Update last tier to end at split point - 1
			tiers[tiers.length - 1] = {
				...lastTier,
				maxParticipants: splitPoint - 1
			};
			
			// New tier starts at split point
			minParticipants = splitPoint;
			maxParticipants = maxCapacity;
			
			// Validate new tier has valid range
			if (minParticipants > maxParticipants) {
				// Revert the last tier change
				tiers[tiers.length - 1] = lastTier;
				return;
			}
		}
		
		// Calculate suggested discount based on tier position
		const suggestedDiscount = Math.min((tiers.length + 1) * 10, 50); // 10%, 20%, 30%... up to 50%
		
		const newTier: GroupDiscountTier = {
			id: generateId(),
			minParticipants,
			maxParticipants,
			discountType: 'percentage',
			discountValue: suggestedDiscount,
			label: ''
		};
		
		tiers = [...tiers, newTier];
		enabled = true; // Enable when adding first tier
		onUpdate(tiers, enabled);
	}
	
	// Remove a tier
	function removeTier(index: number) {
		const removedTier = tiers[index];
		tiers = tiers.filter((_, i) => i !== index);
		
		// If removing a middle tier, extend the next tier to cover the gap
		if (index < tiers.length && tiers.length > 0) {
			tiers[index] = {
				...tiers[index],
				minParticipants: removedTier.minParticipants
			};
		}
		
		// Ensure last tier goes to maxCapacity
		if (tiers.length > 0) {
			tiers[tiers.length - 1] = {
				...tiers[tiers.length - 1],
				maxParticipants: maxCapacity
			};
		}
		
		// Disable if no tiers left
		if (tiers.length === 0) {
			enabled = false;
		}
		
		onUpdate(tiers, enabled);
	}
	
	// Update a tier with strict validation
	function updateTier(index: number, updatedTier: GroupDiscountTier) {
		// STRICT ENFORCEMENT: Tiers must be continuous and non-overlapping
		
		// First tier: min must be at least 2
		if (index === 0) {
			updatedTier.minParticipants = Math.max(2, updatedTier.minParticipants);
		} else {
			// Non-first tiers: min MUST equal previous tier's max + 1 (NO GAPS, NO OVERLAPS)
			const prevMax = tiers[index - 1].maxParticipants;
			updatedTier.minParticipants = prevMax + 1;
		}
		
		// Max must be at least min
		if (updatedTier.maxParticipants < updatedTier.minParticipants) {
			updatedTier.maxParticipants = updatedTier.minParticipants;
		}
		
		// Last tier always goes to maxCapacity
		if (index === tiers.length - 1) {
			updatedTier.maxParticipants = maxCapacity;
		}
		
		// If not last tier, ensure max leaves room for ALL subsequent tiers (at least 1 person each)
		if (index < tiers.length - 1) {
			const tiersAfter = tiers.length - index - 1; // How many tiers come after this one
			const maxPossible = maxCapacity - tiersAfter; // Leave at least 1 person for each tier after
			if (updatedTier.maxParticipants > maxPossible) {
				updatedTier.maxParticipants = maxPossible;
			}
		}
		
		// Apply the validated tier
		tiers[index] = updatedTier;
		
		// CASCADE: Enforce continuous ranges for ALL subsequent tiers
		for (let i = index + 1; i < tiers.length; i++) {
			// Calculate the new min (MUST start immediately after previous tier)
			const newMin = tiers[i - 1].maxParticipants + 1;
			
			// Check if this tier has a valid range left
			if (newMin > maxCapacity) {
				// This tier has no valid range - remove it and all tiers after
				tiers = tiers.slice(0, i);
				break;
			}
			
			// Validate and update max
			let newMax = tiers[i].maxParticipants;
			
			if (i === tiers.length - 1) {
				// Last tier always ends at maxCapacity
				newMax = maxCapacity;
			} else {
				// Ensure max is at least min and leaves room for remaining tiers
				const tiersRemaining = tiers.length - i - 1;
				const maxPossibleForThisTier = maxCapacity - tiersRemaining;
				
				if (newMax < newMin) {
					newMax = newMin;
				}
				
				// Don't let this tier consume all remaining space
				if (newMax > maxPossibleForThisTier) {
					newMax = maxPossibleForThisTier;
				}
			}
			
			// Create new tier object for proper reactivity
			tiers[i] = {
				...tiers[i],
				minParticipants: newMin,
				maxParticipants: newMax
			};
		}
		
		// Force reactivity update
		tiers = [...tiers];
		onUpdate(tiers, enabled);
	}
	
	// Cleanup invalid tiers on mount and when tiers change
	$effect(() => {
		if (tiers.length === 0) return;
		
		let hasInvalidTiers = false;
		const validTiers = tiers.filter(tier => {
			// Remove tiers where min > max (invalid)
			if (tier.minParticipants > tier.maxParticipants) {
				hasInvalidTiers = true;
				return false;
			}
			return true;
		});
		
		if (hasInvalidTiers) {
			tiers = validTiers;
			onUpdate(tiers, enabled);
		}
	});
	
	// Check if can add more tiers (need at least 2-person range to split)
	let canAddMore = $derived(() => {
		if (tiers.length === 0) return true;
		if (tiers.length >= 5) return false; // Max 5 tiers for simplicity
		
		// Check if there's room for another tier
		// We need the last tier to be splittable (at least 2 people)
		const lastTier = tiers[tiers.length - 1];
		
		// Check for invalid tier
		if (lastTier.minParticipants > lastTier.maxParticipants) return false;
		
		// Last tier must end at maxCapacity
		if (lastTier.maxParticipants !== maxCapacity) return false;
		
		// Calculate the range of the last tier
		const range = lastTier.maxParticipants - lastTier.minParticipants + 1;
		
		// Need at least 2 people to split (1 for existing tier, 1 for new tier)
		return range >= 2;
	});
	
</script>

<div class="group-discounts-section">
	<!-- Discount tiers list -->
	{#if tiers.length > 0}
		<div class="tiers-list">
			{#each tiers as tier, index (tier.id)}
				<GroupDiscountTierCard
					{tier}
					{index}
					{currencySymbol}
					{basePrice}
					{maxCapacity}
					isLastTier={index === tiers.length - 1}
					onRemove={() => removeTier(index)}
					onUpdate={(updated) => updateTier(index, updated)}
				/>
			{/each}
		</div>
	{/if}
	
	<!-- Quick add section -->
	<div class="quick-add-section">
		<div class="quick-add-header">
			<div class="header-with-icon">
				<Tag class="add-icon" />
				<span class="add-label">Group discounts</span>
			</div>
			<button
				type="button"
				onclick={() => {
					enabled = true;
					addTier();
				}}
				disabled={tiers.length > 0 && !canAddMore()}
				class="quick-add-btn"
				title={tiers.length > 0 && !canAddMore() ? 'No room to add more tiers' : 'Add another discount tier'}
			>
				<Plus class="w-4 h-4" />
				<span>Add discount tier</span>
			</button>
		</div>
	</div>
</div>

<style>
	.group-discounts-section {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	/* Quick add section - matching Add extra items design */
	.quick-add-section {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		transition: all 0.2s ease;
	}
	
	.quick-add-section:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.quick-add-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}
	
	.header-with-icon {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	:global(.add-icon) {
		width: 1.125rem;
		height: 1.125rem;
		color: var(--text-secondary);
		flex-shrink: 0;
	}
	
	.add-label {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.quick-add-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}
	
	.quick-add-btn:hover:not(:disabled) {
		background: var(--color-primary-50);
		border-color: var(--color-primary-400);
		color: var(--color-primary-700);
		transform: translateY(-1px);
	}
	
	.quick-add-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		color: var(--text-tertiary);
		background: var(--bg-secondary);
	}
	
	.tiers-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	/* Animation for new items */
	.tiers-list > :global(*) {
		animation: fadeSlideIn 0.3s ease-out;
	}
	
	@keyframes fadeSlideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.quick-add-header {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}
		
		.header-with-icon {
			justify-content: center;
		}
		
		.quick-add-btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>
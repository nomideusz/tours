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
		let minParticipants = 2; // Start with 2 for first tier
		let maxParticipants = maxCapacity;
		
		if (tiers.length > 0) {
			// Split existing last tier's range
			const lastTier = tiers[tiers.length - 1];
			const range = lastTier.maxParticipants - lastTier.minParticipants + 1;
			const splitPoint = lastTier.minParticipants + Math.floor(range / 2);
			
			// Update last tier to end at split point
			tiers[tiers.length - 1] = {
				...lastTier,
				maxParticipants: splitPoint - 1
			};
			
			// New tier starts at split point
			minParticipants = splitPoint;
			maxParticipants = maxCapacity;
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
		// Validate that min is not less than 2 for first tier, or previous tier's max + 1
		if (index === 0) {
			updatedTier.minParticipants = Math.max(2, updatedTier.minParticipants);
		} else if (index > 0) {
			const prevMax = tiers[index - 1].maxParticipants;
			updatedTier.minParticipants = Math.max(prevMax + 1, updatedTier.minParticipants);
		}
		
		// Validate that max is at least min
		if (updatedTier.maxParticipants < updatedTier.minParticipants) {
			updatedTier.maxParticipants = updatedTier.minParticipants;
		}
		
		// Last tier always goes to maxCapacity
		if (index === tiers.length - 1) {
			updatedTier.maxParticipants = maxCapacity;
		}
		
		// If not last tier, max can't exceed what leaves room for next tier
		if (index < tiers.length - 1) {
			const nextMin = tiers[index + 1].minParticipants;
			if (updatedTier.maxParticipants >= nextMin) {
				updatedTier.maxParticipants = nextMin - 1;
			}
		}
		
		tiers[index] = updatedTier;
		
		// Cascade changes: enforce continuous ranges for all subsequent tiers
		for (let i = index + 1; i < tiers.length; i++) {
			// Next tier must start immediately after previous tier
			tiers[i].minParticipants = tiers[i - 1].maxParticipants + 1;
			
			// Ensure max is valid
			if (i === tiers.length - 1) {
				// Last tier always goes to maxCapacity
				tiers[i].maxParticipants = maxCapacity;
			} else {
				// Ensure max is at least min
				if (tiers[i].maxParticipants < tiers[i].minParticipants) {
					tiers[i].maxParticipants = tiers[i].minParticipants;
				}
			}
		}
		
		onUpdate(tiers, enabled);
	}
	
	// Check if can add more tiers (need at least 2-person range to split)
	let canAddMore = $derived(() => {
		if (tiers.length === 0) return true;
		if (tiers.length >= 5) return false; // Max 5 tiers for simplicity
		const lastTier = tiers[tiers.length - 1];
		const range = lastTier.maxParticipants - lastTier.minParticipants + 1;
		return range >= 2; // Need at least 2 people to split
	});
	
</script>

<div class="group-discounts-section">
	<!-- Discount tiers list -->
	{#if tiers.length > 0}
		<div class="tiers-list">
			{#each tiers as tier, index (tier.id)}
				<GroupDiscountTierCard
					bind:tier={tiers[index]}
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
				class="quick-add-btn"
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
	
	.quick-add-btn:hover {
		background: var(--color-primary-50);
		border-color: var(--color-primary-400);
		color: var(--color-primary-700);
		transform: translateY(-1px);
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
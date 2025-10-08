<script lang="ts">
	import type { ParticipantCategory, GroupDiscountTier, OptionalAddon, PricingModel } from '$lib/types.js';
	import Receipt from 'lucide-svelte/icons/receipt';
	
	interface Props {
		pricingModel: PricingModel;
		categories?: ParticipantCategory[];
		privateTourPrice?: number;
		groupDiscounts?: { tiers: GroupDiscountTier[]; enabled: boolean };
		addons?: OptionalAddon[];
		currencySymbol: string;
		maxCapacity: number;
		minCapacity: number;
	}
	
	let {
		pricingModel,
		categories = [],
		privateTourPrice = 0,
		groupDiscounts,
		addons = [],
		currencySymbol,
		maxCapacity,
		minCapacity
	}: Props = $props();
	
	// Get base price (adult price for per-person, or flat rate for private)
	let basePrice = $derived(() => {
		if (pricingModel === 'group_tiers') {
			return privateTourPrice || 0;
		}
		if (!categories || categories.length === 0) return 0;
		const adult = categories.find(c => c.id === 'adult' || c.label.toLowerCase().includes('adult'));
		return adult?.price || 0;
	});
	
	// Check if we have anything to show
	let hasContent = $derived(
		(pricingModel === 'participant_categories' && categories.length > 0 && basePrice() > 0) ||
		(pricingModel === 'group_tiers' && basePrice() > 0)
	);
	
	// Calculate example total for private tours
	let privateTourExampleTotal = $derived(() => {
		if (pricingModel !== 'group_tiers' || basePrice() === 0) return null;
		const addonsTotal = addons.filter(a => a.required).reduce((sum, a) => sum + a.price, 0);
		return basePrice() + addonsTotal;
	});
</script>

{#if hasContent}
	<div class="pricing-summary">
		<div class="summary-header">
			<Receipt class="summary-icon" />
			<h3 class="summary-title">Pricing summary</h3>
		</div>
		
		{#if pricingModel === 'group_tiers'}
			<!-- Private Tour Summary -->
			<div class="summary-section">
				<h4 class="section-label">Tour price</h4>
				<div class="private-tour-pricing">
					<div class="flat-rate-row">
						<span class="rate-label">Flat rate per tour</span>
						<span class="rate-price">{currencySymbol}{basePrice().toFixed(2)}</span>
					</div>
					{#if basePrice() > 0}
						<div class="per-person-indicator">
							<span class="pp-range">
								{currencySymbol}{(basePrice() / maxCapacity).toFixed(2)}/pp ({maxCapacity} people)
								– 
								{currencySymbol}{(basePrice() / minCapacity).toFixed(2)}/pp ({minCapacity} {minCapacity === 1 ? 'person' : 'people'})
							</span>
						</div>
					{/if}
				</div>
			</div>
			
			{#if privateTourExampleTotal() && privateTourExampleTotal() !== basePrice()}
				<div class="summary-section">
					<h4 class="section-label">With required add-ons</h4>
					<div class="total-row">
						<span class="total-label">Total per booking</span>
						<span class="total-price">{currencySymbol}{privateTourExampleTotal()?.toFixed(2)}</span>
					</div>
				</div>
			{/if}
		{:else}
			<!-- Category Prices -->
			{#if categories.length > 0}
				<div class="summary-section">
					<h4 class="section-label">Base prices</h4>
					<div class="price-list">
						{#each categories as category}
							<div class="price-row">
								<span class="item-name">{category.label}</span>
								<span class="item-price">{currencySymbol}{category.price.toFixed(2)}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
		
		<!-- Group Discounts (only for per-person pricing) -->
		{#if pricingModel === 'participant_categories' && groupDiscounts?.enabled && groupDiscounts.tiers.length > 0}
			<div class="summary-section">
				<h4 class="section-label">Group discounts</h4>
				<div class="discount-list">
					<!-- Base price for single person -->
					<div class="discount-tier">
						<span class="tier-range">1 person</span>
						<span class="tier-price">{currencySymbol}{basePrice().toFixed(2)}</span>
					</div>
					
					{#each groupDiscounts.tiers as tier, idx}
						{@const isLast = idx === groupDiscounts.tiers.length - 1}
						{@const discountedPrice = tier.discountType === 'percentage' 
							? basePrice() * (1 - tier.discountValue / 100)
							: tier.discountValue}
						{@const savingsPercent = Math.round((1 - discountedPrice / basePrice()) * 100)}
						
						<div class="discount-tier highlighted">
							<span class="tier-range">
								{tier.minParticipants}{isLast ? '+' : `-${tier.maxParticipants}`} people
							</span>
							<div class="tier-pricing">
								<span class="tier-price">{currencySymbol}{discountedPrice.toFixed(2)}/pp</span>
								<span class="savings-badge">-{savingsPercent}%</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		
		<!-- Add-ons -->
		{#if addons && addons.length > 0}
			<div class="summary-section">
				<h4 class="section-label">Available add-ons</h4>
				<div class="addon-list">
					{#each addons as addon}
						<div class="addon-item">
							<span class="addon-name">
								{addon.name}
								{#if addon.required}
									<span class="required-badge">Required</span>
								{/if}
							</span>
							<span class="addon-price">+{currencySymbol}{addon.price.toFixed(2)}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.pricing-summary {
		margin-top: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		transition: all 0.2s ease;
	}
	
	.pricing-summary:hover {
		border-color: var(--border-secondary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	.summary-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-primary);
	}
	
	:global(.summary-icon) {
		width: 1.125rem;
		height: 1.125rem;
		color: var(--text-secondary);
	}
	
	.summary-title {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.summary-section {
		margin-bottom: 1.25rem;
	}
	
	.summary-section:last-child {
		margin-bottom: 0;
	}
	
	.section-label {
		margin: 0 0 0.5rem 0;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.price-list,
	.discount-list,
	.addon-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	
	.price-row,
	.discount-tier,
	.addon-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: var(--bg-primary);
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}
	
	.discount-tier.highlighted {
		background: var(--color-success-50);
		border: 1px solid var(--color-success-200);
	}
	
	.item-name,
	.tier-range,
	.addon-name {
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.item-price,
	.tier-price {
		font-weight: 600;
		font-family: monospace;
		color: var(--text-primary);
	}
	
	.tier-pricing {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.discount-tier.highlighted .tier-price {
		color: var(--color-success-700);
	}
	
	.savings-badge {
		padding: 0.125rem 0.375rem;
		background: var(--color-success-600);
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 0.25rem;
	}
	
	.addon-price {
		font-weight: 600;
		color: var(--color-primary-600);
		font-family: monospace;
	}
	
	.required-badge {
		margin-left: 0.5rem;
		padding: 0.125rem 0.375rem;
		background: var(--color-warning-100);
		color: var(--color-warning-700);
		font-size: 0.625rem;
		font-weight: 600;
		border-radius: 0.25rem;
		text-transform: uppercase;
	}
	
	/* Private Tour Pricing Display */
	.private-tour-pricing {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.flat-rate-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: var(--bg-primary);
		border-radius: 0.375rem;
		border: 1px solid var(--border-primary);
	}
	
	.rate-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.rate-price {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--text-primary);
		font-family: monospace;
	}
	
	.per-person-indicator {
		padding: 0.5rem 0.75rem;
		background: var(--bg-primary);
		border-radius: 0.375rem;
		text-align: center;
	}
	
	.pp-range {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-family: monospace;
	}
	
	.total-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: var(--color-primary-50);
		border: 1px solid var(--color-primary-200);
		border-radius: 0.375rem;
	}
	
	.total-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.total-price {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-primary-700);
		font-family: monospace;
	}
	
	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.pricing-summary {
			padding: 0.75rem;
		}
		
		.price-row,
		.discount-tier,
		.addon-item {
			padding: 0.375rem 0.5rem;
			font-size: 0.8125rem;
		}
		
		.tier-pricing {
			flex-direction: column;
			align-items: flex-end;
			gap: 0.25rem;
		}
	}
</style>
<script lang="ts">
	import type { Tour, GroupPricingTier, OptionalAddon } from '$lib/types.js';
	import { calculateBookingPrice, STRIPE_FEES } from '$lib/utils/pricing-calculations.js';
	import { getCategoryDisplayLabel } from '$lib/utils/category-age-ranges.js';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Plus from 'lucide-svelte/icons/plus';
	import Equal from 'lucide-svelte/icons/equal';
	import Tag from 'lucide-svelte/icons/tag';

	interface Props {
		tour: Tour;
		participants: number;
		participantCounts?: Record<string, number>;
		adultParticipants?: number;
		childParticipants?: number;
		selectedTier?: GroupPricingTier | null;
		selectedAddonIds: string[];
		currencySymbol: string;
		currency?: string;
		isPrivateTour?: boolean;
	}

	let { 
		tour,
		participants,
		participantCounts = {},
		adultParticipants,
		childParticipants,
		selectedTier,
		selectedAddonIds = [],
		currencySymbol,
		currency = 'EUR',
		isPrivateTour = false
	}: Props = $props();

	// Calculate participant breakdown from counts
	let participantBreakdown = $derived(() => {
		if (!participantCounts || Object.keys(participantCounts).length === 0) {
			return null;
		}
		
		const categories = tour.participantCategories?.categories || [];
		return Object.entries(participantCounts)
			.filter(([_, count]) => count > 0)
			.map(([catId, count]) => {
				const category = categories.find(c => c.id === catId);
				return {
					id: catId,
					label: category ? getCategoryDisplayLabel(category, categories) : 'Unknown',
					count,
					price: category?.price || 0,
					countsTowardCapacity: category?.countsTowardCapacity !== false
				};
			});
	});
	
	// Calculate price breakdown with Stripe fees for regulatory compliance
	let priceCalculation = $derived(() => {
		// For private tour with flat rate
		if (isPrivateTour && tour.privateTour) {
			const addonsTotal = selectedAddonIds.length > 0 && tour.optionalAddons?.addons
				? tour.optionalAddons.addons
					.filter((addon: any) => selectedAddonIds.includes(addon.id))
					.reduce((sum: number, addon: any) => sum + addon.price, 0)
				: 0;
			
			const subtotal = tour.privateTour.flatPrice + addonsTotal;
			
			// Calculate Stripe fee using actual currency
			const fees = STRIPE_FEES[currency as keyof typeof STRIPE_FEES] || STRIPE_FEES.DEFAULT;
			const stripeFee = subtotal * (fees.percentage / 100) + fees.fixed;
			const guidePaysStripeFee = tour.guidePaysStripeFee || false;
			
			return {
				basePrice: tour.privateTour.flatPrice,
				discountedBase: tour.privateTour.flatPrice,
				addonsTotal,
				groupDiscount: 0,
				subtotal,
				stripeFee,
				totalAmount: guidePaysStripeFee ? subtotal : subtotal + stripeFee,
				guideReceives: guidePaysStripeFee ? subtotal - stripeFee : subtotal,
				guidePaysStripeFee,
				categoryBreakdown: null,
				selectedTier: null,
				errors: []
			};
		}
		
		// Use calculateBookingPrice with actual currency from tour owner
		return calculateBookingPrice(
			tour,
			participants,
			selectedAddonIds,
			adultParticipants,
			childParticipants,
			participantCounts,
			currency
		);
	});

	// Get selected addons details
	let selectedAddons = $derived(() => {
		if (!tour.optionalAddons?.addons) return [];
		return (tour.optionalAddons.addons || []).filter(addon => 
			selectedAddonIds.includes(addon.id)
		);
	});

	// Format price
	function formatPrice(amount: number): string {
		return `${currencySymbol}${amount.toFixed(2)}`;
	}
</script>

<div class="price-breakdown">
	<div class="breakdown-header">
		<DollarSign class="w-4 h-4" />
		<span>Price Summary</span>
	</div>

	<div class="breakdown-content">
		<!-- Private Tour (Flat Rate) -->
		{#if isPrivateTour && tour.privateTour}
			<div class="breakdown-item private">
				<div class="item-label">
					<span class="font-semibold">Private Tour (Flat Rate)</span>
					<span class="price-note">{participants} participant{participants === 1 ? '' : 's'}</span>
				</div>
				<div class="item-value">
					{formatPrice(tour.privateTour.flatPrice)}
				</div>
			</div>
		{:else if priceCalculation().categoryBreakdown}
			<!-- Category Breakdown (New System) -->
			{@const breakdown = priceCalculation().categoryBreakdown || {}}
			{#each Object.entries(breakdown) as [catId, cat]}
				<div class="breakdown-item category">
					<div class="item-label">
						<span>{cat.count} {cat.label}{cat.count === 1 ? '' : 's'}</span>
						{#if cat.discountedPrice < cat.originalPrice}
							<span class="original-price">@ {formatPrice(cat.originalPrice)}</span>
							<span class="discounted-price">→ {formatPrice(cat.discountedPrice)}</span>
						{:else}
							<span class="price-per">@ {formatPrice(cat.originalPrice)}</span>
						{/if}
					</div>
					<div class="item-value">
						{formatPrice(cat.subtotal)}
					</div>
				</div>
			{/each}
			
			<!-- Group Discount Badge -->
			{#if priceCalculation().groupDiscount > 0}
				<div class="discount-banner">
					<Tag class="w-4 h-4" />
					<div class="flex-1">
						<span class="discount-label">Group Discount ({participants} {participants === 1 ? 'person' : 'people'})</span>
					</div>
					<span class="discount-value">-{formatPrice(priceCalculation().groupDiscount)}</span>
				</div>
			{/if}
		{:else if participantBreakdown() && (participantBreakdown() || []).length > 0}
			<!-- Participant Breakdown (when no discount applied) -->
			{#each (participantBreakdown() || []) as cat}
				<div class="breakdown-item category">
					<div class="item-label">
						<span>{cat.count} {cat.label}{cat.count === 1 ? '' : 's'}</span>
						<span class="price-per">@ {formatPrice(cat.price)}</span>
					</div>
					<div class="item-value">
						{formatPrice(cat.price * cat.count)}
					</div>
				</div>
			{/each}
		{:else}
			<!-- Fallback for other pricing models -->
			<div class="breakdown-item">
				<div class="item-label">
					{#if tour.pricingModel === 'group_tiers'}
						{@const tier = priceCalculation().selectedTier}
						{#if tier}
							<span>
								{tier.label || `Group of ${participants}`}
							</span>
						{:else}
							<span>Base price</span>
						{/if}
					{:else}
						<span>{participants} × {formatPrice(parseFloat(tour.price))}</span>
					{/if}
				</div>
				<div class="item-value">
					{formatPrice(priceCalculation().discountedBase)}
				</div>
			</div>
		{/if}

		<!-- Add-ons Section -->
		{#if selectedAddons().length > 0}
			<div class="breakdown-divider">
				<Plus class="w-3 h-3" style="color: var(--text-tertiary);" />
			</div>
			
			{#each selectedAddons() as addon}
				<div class="breakdown-item addon">
					<div class="item-label">
						{#if addon.icon}
							<span class="addon-icon">{addon.icon}</span>
						{/if}
						{addon.name}
					</div>
					<div class="item-value">
						{formatPrice(addon.price)}
					</div>
				</div>
			{/each}
		{/if}

		<!-- Stripe Processing Fee (Regulatory Compliance) -->
		{#if priceCalculation().stripeFee && priceCalculation().stripeFee > 0}
			<div class="breakdown-divider">
				<Plus class="w-3 h-3" style="color: var(--text-tertiary);" />
			</div>
			
			<div class="breakdown-item processing-fee">
				<div class="item-label">
					<span>Payment Processing Fee</span>
					{#if priceCalculation().guidePaysStripeFee}
						<span class="fee-note">(Included by tour guide)</span>
					{:else}
						<span class="fee-note">(Stripe payment processing)</span>
					{/if}
				</div>
				<div class="item-value">
					{#if priceCalculation().guidePaysStripeFee}
						<span class="included-fee">Included</span>
					{:else}
						{formatPrice(priceCalculation().stripeFee)}
					{/if}
				</div>
			</div>
		{/if}

		<!-- Total Section -->
		<div class="breakdown-divider total">
			<Equal class="w-3 h-3" style="color: var(--text-tertiary);" />
		</div>
		
		<div class="breakdown-item total">
			<div class="item-label">
				<span>Total Amount</span>
				<span class="all-in-note">All fees included - no surprises!</span>
			</div>
			<div class="item-value">
				{formatPrice(priceCalculation().totalAmount)}
			</div>
		</div>

		<!-- Error messages -->
		{#if priceCalculation().errors && (priceCalculation().errors || []).length > 0}
			<div class="breakdown-errors">
				{#each (priceCalculation().errors || []) as error}
					<p class="error-message">{error}</p>
				{/each}
			</div>
		{/if}
	</div>

</div>

<style>
	.price-breakdown {
		border-radius: 0.75rem;
		border: 2px solid var(--border-primary);
		background: var(--bg-primary);
		overflow: hidden;
	}

	.breakdown-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-primary);
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--text-primary);
	}

	.breakdown-content {
		padding: 1rem;
	}

	.breakdown-item {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: 1rem;
		padding: 0.5rem 0;
	}

	.breakdown-item.total {
		padding-top: 0.75rem;
	}

	.breakdown-item.addon {
		padding: 0.375rem 0;
	}
	
	.breakdown-item.private {
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--border-primary);
	}

	.item-label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		flex: 1;
	}
	
	.price-per,
	.price-note {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}
	
	.original-price {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-decoration: line-through;
	}
	
	.discounted-price {
		font-size: 0.75rem;
		color: var(--color-success-600);
		font-weight: 500;
	}
	
	.discount-banner {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.625rem;
		margin: 0.5rem 0;
		background: var(--color-success-50);
		border: 1px solid var(--color-success-200);
		border-radius: 0.5rem;
	}
	
	.discount-banner :global(svg) {
		color: var(--color-success-600);
		flex-shrink: 0;
	}
	
	.discount-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-success-700);
	}
	
	.discount-value {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--color-success-700);
		white-space: nowrap;
	}

	.breakdown-item.total .item-label {
		font-weight: 700;
		font-size: 1rem;
		color: var(--text-primary);
	}

	.item-value {
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--text-primary);
		white-space: nowrap;
	}

	.breakdown-item.total .item-value {
		font-weight: 800;
		font-size: 1.25rem;
		color: var(--color-primary-700);
	}

	.breakdown-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0;
		margin: 0.25rem 0;
	}

	.breakdown-divider.total {
		border-top: 1px solid var(--border-primary);
		margin-top: 0.5rem;
		padding-top: 0.75rem;
	}

	.addon-icon {
		font-size: 0.875rem;
		margin-right: 0.375rem;
	}
	
	.breakdown-item.processing-fee .item-label {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	
	.fee-note {
		font-size: 0.6875rem;
		color: var(--text-tertiary);
		font-weight: 400;
	}
	
	.included-fee {
		color: var(--color-success-600);
		font-weight: 600;
		font-size: 0.8125rem;
	}
	
	.all-in-note {
		font-size: 0.6875rem;
		color: var(--color-success-600);
		font-weight: 500;
		margin-top: 0.125rem;
	}

	.breakdown-errors {
		margin-top: 1rem;
		padding: 0.75rem;
		background: var(--color-error-50);
		border: 1px solid var(--color-error-200);
		border-radius: 0.5rem;
	}

	.error-message {
		font-size: 0.8125rem;
		color: var(--color-error-700);
		margin: 0;
	}

	.error-message + .error-message {
		margin-top: 0.25rem;
	}
</style>

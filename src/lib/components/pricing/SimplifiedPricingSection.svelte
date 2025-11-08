<!--
Simplified Pricing Section with Progressive Disclosure
Simple, compact initial view with expandable advanced options
-->

<script lang="ts">
	import type { PricingModel, ParticipantCategory, GroupPricingTier, GroupDiscountTier, OptionalAddon } from '$lib/types.js';
	import { userCurrency, SUPPORTED_CURRENCIES } from '$lib/stores/currency.js';
	import PricingModelSelector from './PricingModelSelector.svelte';
	import SimpleParticipantCategories from './SimpleParticipantCategories.svelte';
	import PrivateTour from './PrivateTour.svelte';
	import GroupDiscounts from './GroupDiscounts.svelte';
	import OptionalAddons from './OptionalAddons.svelte';
	import StripeFeeSelector from './StripeFeeSelector.svelte';
	import UnifiedPricingSummary from './UnifiedPricingSummary.svelte';
	import '$lib/styles/pricing.css';
	
	interface Props {
		// Form data
		pricingModel: PricingModel;
		participantCategories?: { categories: ParticipantCategory[]; minCapacity?: number; maxCapacity?: number; };
		privateTour?: { flatPrice: number; minCapacity?: number; maxCapacity?: number; };
		groupDiscounts?: { tiers: GroupDiscountTier[]; enabled: boolean };
		optionalAddons?: { addons: OptionalAddon[] };
		guidePaysStripeFee?: boolean;
		countInfantsTowardCapacity?: boolean;
		
		// Tour details (legacy)
		duration: number;
		capacity: number;
		
		// State
		pricingTouched: boolean;
		allErrors?: any[];
		
		// Callbacks
		onModelChange: (model: PricingModel) => void;
		onParticipantCategoriesUpdate: (categories: ParticipantCategory[]) => void;
		onPrivateTourUpdate?: (flatPrice: number) => void;
		onGroupDiscountsUpdate: (tiers: GroupDiscountTier[], enabled: boolean) => void;
		onAddonsUpdate: (addons: OptionalAddon[]) => void;
		onPriceUpdate: (price: number) => void;
		onStripeFeeUpdate: (guidePaysStripeFee: boolean) => void;
		onValidate: (field: string) => void;
		getFieldError: (errors: any[], field: string) => string | null;
	}
	
	let {
		pricingModel = $bindable('participant_categories'),
		participantCategories = $bindable(),
		privateTour = $bindable(),
		groupDiscounts = $bindable(),
		optionalAddons = $bindable(),
		guidePaysStripeFee = $bindable(),
		countInfantsTowardCapacity = $bindable(false),
		duration,
		capacity,
		pricingTouched = $bindable(false),
		allErrors = [],
		onModelChange,
		onParticipantCategoriesUpdate,
		onPrivateTourUpdate,
		onGroupDiscountsUpdate,
		onAddonsUpdate,
		onPriceUpdate,
		onStripeFeeUpdate,
		onValidate,
		getFieldError
	}: Props = $props();
	
	// Ensure guidePaysStripeFee has a default value
	$effect(() => {
		if (guidePaysStripeFee === undefined) {
			guidePaysStripeFee = false;
		}
	});
	
	// Ensure groupDiscounts is initialized
	$effect(() => {
		if (!groupDiscounts) {
			groupDiscounts = { tiers: [], enabled: false };
		}
	});
	
	// Ensure participantCategories has capacity defaults
	$effect(() => {
		if (participantCategories && participantCategories.minCapacity === undefined) {
			participantCategories.minCapacity = 1;
		}
		if (participantCategories && participantCategories.maxCapacity === undefined) {
			participantCategories.maxCapacity = 20;
		}
	});
	
	// Ensure privateTour is initialized with capacity defaults (for demo page)
	$effect(() => {
		if (!privateTour) {
			privateTour = { flatPrice: 0, minCapacity: 4, maxCapacity: 12 };
		} else {
			if (privateTour.minCapacity === undefined) {
				privateTour.minCapacity = 4;
			}
			if (privateTour.maxCapacity === undefined) {
				privateTour.maxCapacity = 12;
			}
		}
	});
	
	
	// Currency
	let currencySymbol = $derived(SUPPORTED_CURRENCIES[$userCurrency]?.symbol || '€');
	
	// Get current price for display
	let currentPrice = $derived.by(() => {
		if (pricingModel === 'participant_categories' && participantCategories) {
			const adult = participantCategories.categories.find(c => 
				c.id === 'adult' || c.label.toLowerCase().includes('adult')
			);
			return adult?.price || 0;
		} else if (privateTour) {
			return privateTour.flatPrice || 0;
		}
		return 0;
	});
</script>

<div class="pricing-section">
	<!-- Header -->
	<div class="section-header">
		<h2>Pricing</h2>
	</div>
	
	<!-- Pricing Model Selection -->
	<PricingModelSelector
		bind:selectedModel={pricingModel}
		onModelChange={onModelChange}
	/>
	
	<!-- Main Pricing Configuration -->
	<div class="pricing-config">
		{#if pricingModel === 'participant_categories' && participantCategories}
			<!-- Per Person Pricing with Categories -->
			<SimpleParticipantCategories
				bind:categories={participantCategories.categories}
				{currencySymbol}
				bind:minCapacity={participantCategories.minCapacity}
				bind:maxCapacity={participantCategories.maxCapacity}
				bind:countInfantsTowardCapacity
				{allErrors}
				onUpdate={(categories) => {
					onParticipantCategoriesUpdate(categories);
					pricingTouched = true;
				}}
				onValidate={onValidate}
				getFieldError={getFieldError}
			/>
			
			<!-- Group Discounts (only for per-person pricing with configured prices) -->
			{#if groupDiscounts && currentPrice > 0 && participantCategories && participantCategories.categories.some(c => c.price > 0)}
				<div class="section-spacing">
					<GroupDiscounts
						bind:tiers={groupDiscounts.tiers}
						bind:enabled={groupDiscounts.enabled}
						{currencySymbol}
						basePrice={currentPrice}
						maxCapacity={participantCategories.maxCapacity || 20}
						onUpdate={(tiers, enabled) => {
							onGroupDiscountsUpdate(tiers, enabled);
							pricingTouched = true;
						}}
					/>
				</div>
			{/if}
		{:else if pricingModel === 'private_tour' && privateTour}
			<!-- Private Tour Flat Rate -->
			<PrivateTour
				bind:flatPrice={privateTour.flatPrice}
				bind:minCapacity={privateTour.minCapacity!}
				bind:maxCapacity={privateTour.maxCapacity!}
				{currencySymbol}
				onUpdate={(flatPrice) => {
					if (onPrivateTourUpdate) {
						onPrivateTourUpdate(flatPrice);
					}
					pricingTouched = true;
				}}
			/>
		{/if}
		
		<!-- Add-ons (show for both pricing models after pricing is configured) -->
		{#if optionalAddons && currentPrice > 0 && ((pricingModel === 'participant_categories' && participantCategories?.categories.some(c => c.price > 0)) || (pricingModel === 'private_tour' && privateTour?.flatPrice > 0))}
			<div class="section-spacing">
				<OptionalAddons
					bind:addons={optionalAddons.addons}
					{currencySymbol}
					onUpdate={onAddonsUpdate}
				/>
			</div>
		{/if}

		<!-- Stripe Fee Selector (Regulatory Compliance: FTC, California SB 478, UK, EU) -->
		{#if currentPrice > 0 && ((pricingModel === 'participant_categories' && participantCategories?.categories.some(c => c.price > 0)) || (pricingModel === 'private_tour' && privateTour?.flatPrice > 0))}
			<div class="section-spacing">
				<StripeFeeSelector
					bind:guidePaysStripeFee
					basePrice={currentPrice}
					currency={$userCurrency}
					{currencySymbol}
					onUpdate={(pays) => {
						onStripeFeeUpdate(pays);
						pricingTouched = true;
					}}
				/>
			</div>
		{/if}
		
		<!-- Field Errors -->
		{#if getFieldError(allErrors, pricingModel === 'participant_categories' ? 'participantCategories' : 'privateTour')}
			<div class="error-message">
				{getFieldError(allErrors, pricingModel === 'participant_categories' ? 'participantCategories' : 'privateTour')}
			</div>
		{/if}
	</div>
	
	<!-- Unified Pricing Summary at the end -->
	<UnifiedPricingSummary
		{pricingModel}
		categories={participantCategories?.categories}
		privateTourPrice={privateTour?.flatPrice}
		groupDiscounts={groupDiscounts}
		addons={optionalAddons?.addons}
		{currencySymbol}
		{guidePaysStripeFee}
		currency={$userCurrency}
		minCapacity={pricingModel === 'private_tour' ? (privateTour?.minCapacity || 4) : (participantCategories?.minCapacity || 1)}
		maxCapacity={pricingModel === 'private_tour' ? (privateTour?.maxCapacity || 12) : (participantCategories?.maxCapacity || 20)}
	/>
</div>

<style>
	.pricing-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.section-header {
		padding-bottom: 1rem;
		margin-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-secondary);
	}
	
	.section-header h2 {
		margin: 0;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	@media (max-width: 640px) {
		.section-header {
			text-align: center;
			border-bottom: none;
			padding-bottom: 0.5rem;
			margin-bottom: 0.5rem;
		}
		
		/* Center pricing model selector */
		:global(.pricing-model-selector) {
			justify-content: center;
		}
		
		:global(.model-options) {
			justify-content: center;
		}
	}
	
	.pricing-config {
		padding: 0.5rem 0;
	}
	
	.section-spacing {
		margin-top: 1.25rem;
	}
	
	.error-message {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: var(--color-error-50);
		border: 1px solid var(--color-error-200);
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		color: var(--color-error-700);
	}
	
	/* Mobile - no specific overrides needed */
</style>

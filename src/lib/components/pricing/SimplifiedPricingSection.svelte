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
	import UnifiedPricingSummary from './UnifiedPricingSummary.svelte';
	import '$lib/styles/pricing.css';
	
	interface Props {
		// Form data
		pricingModel: PricingModel;
		participantCategories?: { categories: ParticipantCategory[] };
		privateTour?: { flatPrice: number };
		groupDiscounts?: { tiers: GroupDiscountTier[]; enabled: boolean };
		optionalAddons?: { addons: OptionalAddon[] };
		guidePaysStripeFee?: boolean;
		minCapacity?: number;
		maxCapacity?: number;
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
		onPrivateTourUpdate: (flatPrice: number) => void;
		onGroupDiscountsUpdate: (tiers: GroupDiscountTier[], enabled: boolean) => void;
		onAddonsUpdate: (addons: OptionalAddon[]) => void;
		onPriceUpdate: (price: number) => void;
		onStripeFeeUpdate: (guidePaysStripeFee: boolean) => void;
		onCapacityUpdate: (minCapacity: number, maxCapacity: number) => void;
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
		minCapacity = $bindable(1),
		maxCapacity = $bindable(20),
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
		onCapacityUpdate,
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
	
	// Ensure privateTour is initialized
	$effect(() => {
		if (!privateTour) {
			privateTour = { flatPrice: 0 };
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
		} else if (pricingModel === 'group_tiers' && privateTour) {
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
			<SimpleParticipantCategories
				bind:categories={participantCategories.categories}
				{currencySymbol}
				bind:minCapacity
				bind:maxCapacity
				bind:countInfantsTowardCapacity
				{allErrors}
				onUpdate={(categories) => {
					onParticipantCategoriesUpdate(categories);
					pricingTouched = true;
				}}
				onCapacityUpdate={onCapacityUpdate}
				onValidate={onValidate}
				getFieldError={getFieldError}
			/>
			
			{#if groupDiscounts && currentPrice > 0}
				<GroupDiscounts
					bind:tiers={groupDiscounts.tiers}
					bind:enabled={groupDiscounts.enabled}
					{currencySymbol}
					basePrice={currentPrice}
					{maxCapacity}
					onUpdate={(tiers, enabled) => {
						onGroupDiscountsUpdate(tiers, enabled);
						pricingTouched = true;
					}}
				/>
			{/if}
		{:else if pricingModel === 'group_tiers' && privateTour}
			<PrivateTour
				bind:flatPrice={privateTour.flatPrice}
				bind:minCapacity
				bind:maxCapacity
				{currencySymbol}
				onUpdate={(flatPrice) => {
					onPrivateTourUpdate(flatPrice);
					pricingTouched = true;
				}}
				onCapacityUpdate={onCapacityUpdate}
			/>
		{/if}
		
		<!-- Add-ons (show for both pricing models) -->
		{#if optionalAddons}
			<OptionalAddons
				bind:addons={optionalAddons.addons}
				{currencySymbol}
				onUpdate={onAddonsUpdate}
			/>
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
		{minCapacity}
		{maxCapacity}
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
	
	.pricing-config {
		padding: 0.5rem 0;
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

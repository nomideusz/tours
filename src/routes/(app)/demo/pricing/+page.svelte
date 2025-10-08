<script lang="ts">
	import { userCurrency, SUPPORTED_CURRENCIES } from '$lib/stores/currency.js';
	import SimplifiedPricingSection from '$lib/components/pricing/SimplifiedPricingSection.svelte';
	import FeaturePreview from '$lib/components/FeaturePreview.svelte';
	import PageContainer from '$lib/components/PageContainer.svelte';
	import type { PricingModel, ParticipantCategory, GroupDiscountTier, OptionalAddon } from '$lib/types.js';
	// Currency
	let currencySymbol = $derived(SUPPORTED_CURRENCIES[$userCurrency]?.symbol || '€');
	
	// Form data for the demo - start with a simple default
	let formData = $state({
		pricingModel: 'participant_categories' as PricingModel,
		participantCategories: { 
			categories: [
				{ id: 'adult', label: 'Adult', price: 50, sortOrder: 0 }
			] as ParticipantCategory[] 
		},
		privateTour: { flatPrice: 100 },
		groupDiscounts: { tiers: [] as GroupDiscountTier[], enabled: false },
		optionalAddons: { addons: [] as OptionalAddon[] },
		guidePaysStripeFee: false,
		minCapacity: 1,
		maxCapacity: 20,
		countInfantsTowardCapacity: false,
		duration: 180,
		capacity: 20
	});
	
	// Handle feedback
	function handleFeatureFeedback(feedback: any) {
		console.log('Pricing demo feedback:', feedback);
	}
</script>

<svelte:head>
	<title>Pricing Demo - Zaur</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<PageContainer>
<div class="demo-container">
	<div class="demo-header">
		<h1>Test Pricing Setup</h1>
		<p class="subtitle">Try setting up pricing for a tour and tell us what you think</p>
	</div>
	
	<!-- Feature Preview Component -->
	<FeaturePreview
		featureId="pricing-section"
		featureName="Pricing Section"
		version="v1"
		description="Switch between Per Person and Private Tour pricing. Try all the features and let us know what works best for your tours."
		onFeedback={handleFeatureFeedback}
	/>
	
	<!-- Demo Form Container -->
	<div class="demo-form">
		<div class="form-container">
			<SimplifiedPricingSection
				bind:pricingModel={formData.pricingModel}
				bind:participantCategories={formData.participantCategories}
				bind:privateTour={formData.privateTour}
				bind:groupDiscounts={formData.groupDiscounts}
				bind:optionalAddons={formData.optionalAddons}
				bind:guidePaysStripeFee={formData.guidePaysStripeFee}
				bind:minCapacity={formData.minCapacity}
				bind:maxCapacity={formData.maxCapacity}
				bind:countInfantsTowardCapacity={formData.countInfantsTowardCapacity}
				duration={formData.duration}
				capacity={formData.capacity}
				pricingTouched={true}
				allErrors={[]}
				onModelChange={(model) => {
					formData.pricingModel = model;
				}}
				onParticipantCategoriesUpdate={(categories) => {
					formData.participantCategories.categories = categories;
				}}
				onPrivateTourUpdate={(flatPrice) => {
					formData.privateTour.flatPrice = flatPrice;
				}}
				onGroupDiscountsUpdate={(tiers, enabled) => {
					formData.groupDiscounts.tiers = tiers;
					formData.groupDiscounts.enabled = enabled;
				}}
				onAddonsUpdate={(addons) => {
					formData.optionalAddons.addons = addons;
				}}
				onPriceUpdate={(price) => {
					// Update base price
				}}
				onStripeFeeUpdate={(guidePays) => {
					formData.guidePaysStripeFee = guidePays;
				}}
				onCapacityUpdate={(min, max) => {
					formData.minCapacity = min;
					formData.maxCapacity = max;
					formData.capacity = max;
				}}
				onValidate={() => {}}
				getFieldError={() => null}
			/>
		</div>
	</div>
	
	<!-- Quick Testing Guide -->
	<div class="testing-tips">
		<h3>What to try</h3>
		<ul>
			<li>Switch between "Per Person" and "Private Tour" pricing</li>
			<li>Add categories, test group discounts, explore add-ons</li>
			<li>Would this work for your tours? Tell us in the feedback above</li>
		</ul>
	</div>
</div>
</PageContainer>

<style>
	.demo-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0;
	}
	
	.demo-header {
		margin-bottom: 2rem;
	}
	
	.demo-header h1 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.375rem 0;
	}
	
	.subtitle {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		margin: 0;
	}
	
	
	.demo-form {
		margin-bottom: 3rem;
	}
	
	.form-container {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}
	
	.testing-tips {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.25rem;
	}
	
	.testing-tips h3 {
		margin: 0 0 0.75rem 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.testing-tips ul {
		margin: 0;
		padding-left: 1.25rem;
	}
	
	.testing-tips li {
		margin-bottom: 0.5rem;
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	.testing-tips li:last-child {
		margin-bottom: 0;
	}
	
	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.demo-container {
			padding: 1rem 0.5rem;
		}
		
		.demo-header h1 {
			font-size: 1.25rem;
		}
		
		.form-container {
			padding: 1rem;
		}
		
		.testing-tips {
			padding: 1rem;
		}
	}
</style>
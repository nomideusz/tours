<script lang="ts">
	import { userCurrency, SUPPORTED_CURRENCIES } from '$lib/stores/currency.js';
	import SimplifiedPricingSection from '$lib/components/pricing/SimplifiedPricingSection.svelte';
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
			] as ParticipantCategory[],
			minCapacity: 1,
			maxCapacity: 20
		},
		privateTour: { 
			flatPrice: 100,
			minCapacity: 4,
			maxCapacity: 12
		},
		groupDiscounts: { tiers: [] as GroupDiscountTier[], enabled: false },
		optionalAddons: { addons: [] as OptionalAddon[] },
		guidePaysStripeFee: false,
		countInfantsTowardCapacity: false,
		duration: 180,
		capacity: 20
	});
</script>

<svelte:head>
	<title>Pricing Demo - Zaur</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<PageContainer>
<div class="demo-container">
	<div class="demo-header">
		<h1>Test Pricing Setup</h1>
		<p class="subtitle">Switch between Per Person and Private Tour pricing. Try all the features and use the feedback button to share your thoughts.</p>
	</div>
	
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
				onValidate={() => {}}
				getFieldError={() => null}
			/>
		</div>
	</div>
	
	<!-- Feedback Reminder -->
	<div class="feedback-reminder">
		<p>💬 Share your thoughts using the <strong>Feedback</strong> button in the bottom right corner</p>
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
	
	.feedback-reminder {
		text-align: center;
		padding: 1.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		margin-top: 2rem;
	}
	
	.feedback-reminder p {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--text-secondary);
	}
	
	.feedback-reminder strong {
		color: var(--color-primary-600);
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
	}
</style>
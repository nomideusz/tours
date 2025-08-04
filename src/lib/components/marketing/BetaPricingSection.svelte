<script lang="ts">
	import { goto } from '$app/navigation';
	import Check from 'lucide-svelte/icons/check';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import { PRICING_PLANS, type PricingPlan } from '$lib/utils/pricing-config.js';
	
	let isYearly = $state(true);
	
	// Calculate pricing for display
	function getPlanPricing(plan: PricingPlan, yearly: boolean) {
		const interval = yearly ? 'yearly' : 'monthly';
		const billingPeriod = yearly ? '/month billed annually' : '/month';
		
		// Get base price from plan
		const basePrice = plan.basePrice[interval];
		
		// Calculate beta member pricing (30% off base price)
		const betaPrice = Math.round(basePrice * 0.7 * 100) / 100;
		
		return {
			regular: basePrice,
			beta: betaPrice,
			period: billingPeriod,
			savings: Math.round((basePrice - betaPrice) * 12) // Annual savings
		};
	}
	
	// Format price for display
	function formatPrice(price: number): string {
		if (price === 0) return '0';
		if (price % 1 === 0) return price.toString();
		return price.toFixed(2);
	}
	
	function handleApplyNow() {
		goto('/beta/apply');
	}
</script>

<div class="text-center mb-12">
	<div class="beta-badge-inline mb-6">
		<Sparkles class="w-4 h-4" />
		<span>Future Pricing (Free During Beta)</span>
	</div>
	<h2 class="marketing-heading marketing-heading-lg mb-4">
		Simple, Transparent Pricing
	</h2>
	<p class="text-lg max-w-2xl mx-auto text-secondary">
		No booking commissions, ever. Choose a plan that fits your business. 
		Beta members lock in 30% off these prices for life + exclusive features.
	</p>
</div>

<!-- Pricing Toggle -->
<div class="flex justify-center mb-16">
	<div class="pricing-toggle">
		<button 
			class="button-toggle {!isYearly ? 'active' : ''}"
			onclick={() => isYearly = false}
		>
			Monthly
		</button>
		<button 
			class="button-toggle {isYearly ? 'active' : ''}"
			onclick={() => isYearly = true}
		>
			Annual (Save 20%)
		</button>
	</div>
</div>

<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8 pricing-grid">
	{#each PRICING_PLANS as plan}
		{@const pricing = getPlanPricing(plan, isYearly)}
		{@const includedFeatures = plan.features.filter(f => f.included)}
		<div class="card card--elevated pricing-card {plan.popular ? 'pricing-card--beta-popular' : ''}">
			
			{#if plan.popular}
				<div class="beta-recommended">
					<span>Most Popular</span>
				</div>
			{/if}
			
			<h3 class="pricing-plan-name">{plan.name}</h3>
			
			<!-- Beta Pricing Display -->
			<div class="beta-pricing-display">
				<div class="price-during-beta">
					<span class="price-label">During Beta:</span>
					<span class="price-free">FREE</span>
				</div>
				
				<div class="price-after-launch">
					<span class="price-label">After Launch:</span>
					<div class="price-comparison">
						{#if plan.id !== 'free'}
							<span class="price-regular">€{formatPrice(pricing.regular)}</span>
							<span class="price-beta">€{formatPrice(pricing.beta)}</span>
							<span class="price-period">{pricing.period}</span>
						{:else}
							<span class="price-beta">FREE</span>
							<span class="price-period">forever</span>
						{/if}
					</div>
					{#if plan.id !== 'free'}
						<div class="beta-discount-badge">
							30% off + exclusive features
						</div>
					{/if}
				</div>
			</div>
			
			<p class="pricing-description">{plan.description}</p>
			
			<!-- Key Features -->
			<div class="pricing-features">
				<h4 class="features-header">Key Features:</h4>
				<ul class="features-list">
					{#each includedFeatures.slice(0, 6) as feature}
						<li class="feature-item">
							<Check class="w-4 h-4 text-success" />
							<span>{feature.text}</span>
							{#if feature.comingSoon}
								<span class="coming-soon-badge">Soon</span>
							{/if}
						</li>
					{/each}
					{#if includedFeatures.length > 6}
						<li class="feature-item more-features">
							<span>+ {includedFeatures.length - 6} more features</span>
						</li>
					{/if}
				</ul>
			</div>
			
			<!-- Plan Limits -->
			<div class="plan-limits">
				<div class="limit-item">
					<span class="limit-label">Tours:</span>
					<span class="limit-value">{plan.tourLimit === null ? 'Unlimited' : plan.tourLimit}</span>
				</div>
				<div class="limit-item">
					<span class="limit-label">Bookings:</span>
					<span class="limit-value">{plan.monthlyBookingLimit === null ? 'Unlimited' : plan.monthlyBookingLimit + '/mo'}</span>
				</div>
			</div>
		</div>
	{/each}
</div>

<!-- Exclusive Beta Benefits -->
<div class="card card--gradient exclusive-benefits-card">
	<div class="card-header card-header--center">
		<h3 class="card-title">Exclusive Beta Member Benefits</h3>
		<p class="card-description">Forever perks for our founding tour guides</p>
	</div>
	<div class="card-grid card-grid--3">
		<div class="card-item card-item--pattern card-item--center">
			<div class="card-item-header card-item-header--center">
				<Sparkles class="card-item-icon" />
				<h4 class="card-item-title">Priority Features</h4>
			</div>
			<p class="card-item-description">First access to new features and integrations before general release</p>
		</div>
		<div class="card-item card-item--pattern card-item--center">
			<div class="card-item-header card-item-header--center">
				<FlaskConical class="card-item-icon" />
				<h4 class="card-item-title">Beta Member Badge</h4>
			</div>
			<p class="card-item-description">Special founder status displayed on your public tour pages</p>
		</div>
		<div class="card-item card-item--pattern card-item--center">
			<div class="card-item-header card-item-header--center">
				<Check class="card-item-icon" />
				<h4 class="card-item-title">Premium Support</h4>
			</div>
			<p class="card-item-description">Dedicated support channel and direct access to our development team</p>
		</div>
	</div>
</div>

<style>
	/* Card system handles beta notice styling automatically */
	
	/* Beta Badge */
	.beta-badge-inline {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 1rem;
		background: var(--bg-secondary);
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
	}
	
	/* Pricing Toggle */
	.pricing-toggle {
		display: inline-flex;
		background: var(--bg-secondary);
		padding: 0.25rem;
		border-radius: 0.75rem;
		border: 1px solid var(--border-color);
	}
	
	.button-toggle {
		padding: 0.625rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.button-toggle.active {
		background: var(--bg-primary);
		color: var(--text-primary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	/* Pricing Grid - Add space for badges */
	.pricing-grid {
		margin-top: 1rem; /* Space for "Most Popular" badges that extend above cards */
	}
	
	/* Pricing Cards - Enhanced with card system */
	.pricing-card {
		/* Base styling handled by card system */
		position: relative;
		overflow: visible; /* Override card system to allow badges to extend above */
	}
	
	.pricing-card--beta-popular {
		border-color: var(--primary);
		box-shadow: 0 0 0 1px var(--primary);
	}
	
	.beta-recommended {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--primary);
		color: white;
		padding: 0.25rem 1rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
		z-index: 10;
	}
	
	.pricing-plan-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
	}
	
	/* Beta Pricing Display */
	.beta-pricing-display {
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--border-color);
	}
	
	.price-during-beta {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	
	.price-label {
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}
	
	.price-free {
		font-size: 2rem;
		font-weight: 700;
		color: var(--success);
	}
	
	.price-after-launch {
		margin-top: 1rem;
	}
	
	.price-comparison {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}
	
	.price-regular {
		font-size: 1.25rem;
		color: var(--text-tertiary);
		text-decoration: line-through;
		opacity: 0.6;
	}
	
	.price-beta {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	
	.price-period {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.beta-discount-badge {
		display: inline-block;
		margin-top: 0.5rem;
		padding: 0.25rem 0.75rem;
		background: var(--success-light);
		color: var(--success);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
	}
	
	/* Description */
	.pricing-description {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
		line-height: 1.5;
	}
	
	/* Features */
	.pricing-features {
		margin-bottom: 1.5rem;
	}
	
	.features-header {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
	}
	
	.features-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.feature-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.more-features {
		color: var(--text-tertiary);
		font-style: italic;
		margin-left: 1.5rem;
	}
	
	.coming-soon-badge {
		display: inline-block;
		padding: 0.125rem 0.375rem;
		background: var(--bg-tertiary);
		color: var(--text-tertiary);
		border-radius: 0.25rem;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-left: 0.25rem;
	}
	
	/* Plan Limits */
	.plan-limits {
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
		display: flex;
		gap: 1.5rem;
	}
	
	.limit-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.limit-label {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.limit-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	/* Exclusive Benefits Card */
	.exclusive-benefits-card {
		margin-top: 3rem;
		margin-bottom: 2rem;
		max-width: 1000px;
		margin-left: auto;
		margin-right: auto;
	}
	
	/* Beta CTA Card Customizations */
	.beta-cta-card {
		margin-top: 2rem;
		/* Other styling handled by card-action system */
	}
	
	/* Mobile Styles */
	@media (max-width: 768px) {
		
		.pricing-plan-name {
			font-size: 1.25rem;
		}
		
		.price-free {
			font-size: 1.5rem;
		}
		
		.price-beta {
			font-size: 1.25rem;
		}
		
		.plan-limits {
			flex-direction: column;
			gap: 1rem;
		}
	}
	
	/* Dark mode - card system handles most styling automatically */
	
	:global(.dark) .pricing-toggle {
		background: var(--bg-primary);
	}
	
	:global(.dark) .button-toggle.active {
		background: var(--bg-secondary);
	}
</style>
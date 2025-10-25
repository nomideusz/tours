<script lang="ts">
	import { goto } from '$app/navigation';
	import Check from 'lucide-svelte/icons/check';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import { PRICING_PLANS, type PricingPlan } from '$lib/utils/pricing-config.js';
	import BetaBadge from '$lib/components/BetaBadge.svelte';
	
	let isYearly = $state(true);
	
	// Calculate pricing for display
	function getPlanPricing(plan: PricingPlan, yearly: boolean) {
		const interval = yearly ? 'yearly' : 'monthly';
		const billingPeriod = yearly ? '/month billed annually' : '/month';
		
		// Get base price from plan
		const basePrice = plan.basePrice[interval];
		
		return {
			regular: basePrice,
			period: billingPeriod
		};
	}
	
	// Format price for display
	function formatPrice(price: number): string {
		if (price === 0) return '0';
		if (price % 1 === 0) return price.toString();
		return price.toFixed(2);
	}
	
	function handleJoinWaitlist() {
		goto('/early-access');
	}
</script>

<!-- Simple Header -->
<div class="section-header">
	<BetaBadge text="Beta 2 - Limited Spots" icon={Sparkles} variant="large" class="mb-6" />
	<h2 class="section-title">
		Beta 2 Final Spots
	</h2>
	<p class="section-subtitle">
		6 months free + 20% off forever. Limited to 100 guides only.
	</p>
	<p class="beta-2-urgency">
		<strong>Last chance before public launch.</strong> After Beta 2 closes, everyone pays full price.
	</p>
</div>

<!-- Pricing Toggle -->
<div class="pricing-toggle-container">
	<div class="pricing-toggle">
		<button 
			class="toggle-button {!isYearly ? 'active' : ''}"
			onclick={() => isYearly = false}
		>
			Monthly
		</button>
		<button 
			class="toggle-button {isYearly ? 'active' : ''}"
			onclick={() => isYearly = true}
		>
			Annual <span class="save-badge">Save 20%</span>
		</button>
	</div>
</div>

<!-- Simplified Pricing Cards -->
<div class="pricing-container">
	<div class="pricing-grid">
		{#each PRICING_PLANS.filter(p => p.id !== 'agency' && p.id !== 'free') as plan}
			{@const pricing = getPlanPricing(plan, isYearly)}
			{@const keyFeatures = plan.features.filter(f => f.included).slice(0, 4)}
			<div class="pricing-card {plan.popular ? 'pricing-card--popular' : ''}">
				
				{#if plan.popular}
					<div class="popular-badge">Most Popular</div>
				{/if}
				
				<div class="plan-header">
					<h3 class="plan-name">{plan.name}</h3>
					<p class="plan-description">{plan.description}</p>
				</div>
				
				<!-- Beta 2 Pricing Display -->
				<div class="pricing-display">
					<div class="price-strikethrough">
						<span>€{formatPrice(pricing.regular)}</span>
					</div>
					<div class="price-main">
						<span class="price-value">€{formatPrice(Math.round(pricing.regular * 0.8 * 100) / 100)}<span class="price-period">/mo</span></span>
					</div>
					<div class="price-note beta-2-badge">
						6 months FREE + 20% off forever
					</div>
				</div>
				
				<!-- Key Features - Simplified -->
				<ul class="feature-list">
					{#each keyFeatures as feature}
						<li class="feature-item">
							<Check class="w-4 h-4" />
							<span>{feature.text}</span>
						</li>
					{/each}
				</ul>
				
				<!-- Simple Limits -->
				<div class="plan-footer">
					<span class="limit-text">
						{plan.tourLimit === null ? 'Unlimited' : plan.tourLimit} tours • 
						{plan.monthlyBookingLimit === null ? 'Unlimited' : plan.monthlyBookingLimit} bookings/mo
					</span>
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Beta 2 CTA -->
<div class="cta-section">
	<div class="cta-content">
		<h3 class="cta-title">
			Limited Spots Available
		</h3>
		<p class="cta-description">
			<strong>Only 100 spots remaining</strong> for Beta 2. Lock in 20% lifetime discount before public launch.
		</p>
		<div class="cta-actions">
			<button onclick={handleJoinWaitlist} class="button-primary button--large button--gap">
				Claim Your Beta 2 Spot
				<ArrowRight class="w-4 h-4" />
			</button>
		</div>
		<p class="cta-note">
			✓ No credit card required  ✓ Cancel anytime during trial  ✓ Full access to all features
		</p>
	</div>
</div>

<style>
	/* Section Header */
	.section-header {
		text-align: center;
		margin-bottom: 3rem;
		max-width: 48rem;
		margin-left: auto;
		margin-right: auto;
	}
	
	.section-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.2;
		margin-bottom: 1rem;
	}
	
	.section-subtitle {
		font-size: 1.125rem;
		color: var(--text-secondary);
		max-width: 42rem;
		margin: 0 auto;
	}
	
	.beta-2-urgency {
		font-size: 0.9375rem;
		color: var(--text-primary);
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		display: inline-block;
	}
	
	/* Pricing Toggle */
	.pricing-toggle-container {
		display: flex;
		justify-content: center;
		margin-bottom: 3rem;
	}
	
	.pricing-toggle {
		display: inline-flex;
		background: var(--bg-secondary);
		padding: 0.25rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-primary);
	}
	
	.toggle-button {
		padding: 0.625rem 1.25rem;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.toggle-button.active {
		background: var(--bg-primary);
		color: var(--text-primary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	.save-badge {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
		background: var(--primary);
		color: white;
		border-radius: var(--radius-sm);
		font-weight: 600;
	}
	
	/* Pricing Container */
	.pricing-container {
		max-width: 72rem;
		margin: 0 auto;
	}
	
	/* Pricing Grid - Centered for 2 plans (Beta 2: no Free tier) */
	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
		margin-bottom: 3rem;
		max-width: 700px;
		margin-left: auto;
		margin-right: auto;
	}
	
	@media (max-width: 1024px) {
		.pricing-grid {
			grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
			max-width: none;
		}
	}
	
	/* Pricing Cards */
	.pricing-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		position: relative;
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
	}
	
	.pricing-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
	}
	
	.pricing-card--popular {
		border-color: var(--primary);
		box-shadow: 0 0 0 2px var(--primary);
	}
	
	.popular-badge {
		position: absolute;
		top: -10px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--primary);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full);
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}
	
	/* Plan Header */
	.plan-header {
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-secondary);
	}
	
	.plan-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.plan-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}
	
	/* Pricing Display */
	.pricing-display {
		margin-bottom: 1.5rem;
		text-align: center;
	}
	
	.price-strikethrough {
		margin-bottom: 0.25rem;
	}
	
	.price-strikethrough span {
		font-size: 1rem;
		color: var(--text-tertiary);
		text-decoration: line-through;
	}
	
	.price-main {
		margin-bottom: 0.5rem;
	}
	
	.price-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	
	.price-period {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 400;
	}
	
	.price-note {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}
	
	.beta-2-badge {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--primary);
		background: var(--bg-secondary);
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-full);
		display: inline-block;
		margin-top: 0.25rem;
	}
	
	/* Feature List */
	.feature-list {
		list-style: none;
		padding: 0;
		margin: 0 0 1.5rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		flex-grow: 1;
	}
	
	.feature-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.3;
	}
	
	.feature-item :global(svg) {
		color: var(--primary);
		flex-shrink: 0;
		margin-top: 1px;
	}
	
	/* Plan Footer */
	.plan-footer {
		padding-top: 1rem;
		border-top: 1px solid var(--border-secondary);
		margin-top: auto;
	}
	
	.limit-text {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	/* CTA Section */
	.cta-section {
		margin-top: 3rem;
		text-align: center;
	}
	
	.cta-content {
		max-width: 36rem;
		margin: 0 auto;
	}
	
	.cta-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}
	
	.cta-description {
		font-size: 1rem;
		color: var(--text-secondary);
		margin-bottom: 2rem;
		line-height: 1.6;
	}
	
	.cta-actions {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
	}
	
	.cta-note {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		margin-top: 1rem;
	}
	
	/* Mobile responsive - Mobile First! */
	@media (max-width: 640px) {
		/* Header adjustments */
		.section-header {
			margin-bottom: 2rem;
		}
		
		.section-title {
			font-size: 1.75rem;
			line-height: 1.15;
			margin-bottom: 0.75rem;
		}
		
		.section-subtitle {
			font-size: 0.9375rem;
			line-height: 1.5;
		}
		
		/* Toggle adjustments */
		.pricing-toggle-container {
			margin-bottom: 2rem;
		}
		
		.toggle-button {
			padding: 0.5rem 0.875rem;
			font-size: 0.8125rem;
		}
		
		.save-badge {
			font-size: 0.625rem;
		}
		
		/* Grid on mobile - single column */
		.pricing-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
			margin-bottom: 2rem;
		}
		
		/* Card adjustments */
		.pricing-card {
			padding: 1.25rem;
		}
		
		.plan-name {
			font-size: 1.125rem;
		}
		
		.plan-description {
			font-size: 0.8125rem;
		}
		
		.price-value {
			font-size: 1.25rem;
		}
		
		.price-period {
			font-size: 0.75rem;
		}
		
		.feature-item {
			font-size: 0.8125rem;
		}
		
		.limit-text {
			font-size: 0.625rem;
		}
		
		/* CTA adjustments */
		.cta-title {
			font-size: 1.25rem;
		}
		
		.cta-description {
			font-size: 0.875rem;
			margin-bottom: 1.5rem;
		}
		
		/* Full-width button on mobile */
		.cta-actions button {
			width: 100%;
			padding: 1rem;
			font-size: 1rem;
		}
		
		.cta-note {
			font-size: 0.75rem;
		}
	}
	
	/* Very small phones */
	@media (max-width: 360px) {
		.section-title {
			font-size: 1.5rem;
		}
		
		.plan-name {
			font-size: 1rem;
		}
		
		.price-value {
			font-size: 1.125rem;
		}
	}
	
	/* Tablet - 2 column */
	@media (min-width: 768px) and (max-width: 1023px) {
		.pricing-grid {
			grid-template-columns: repeat(2, 1fr);
			max-width: 600px;
		}
	}
</style>
<script lang="ts">
	import { goto } from '$app/navigation';
	import Check from 'lucide-svelte/icons/check';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import { PRICING_PLANS, type PricingPlan, BETA_2_PRICES } from '$lib/utils/pricing-config.js';
	import BetaBadge from '$lib/components/BetaBadge.svelte';
	
	let isYearly = $state(false);
	
	// Calculate pricing for display
	function getPlanPricing(plan: PricingPlan, yearly: boolean) {
		const interval = yearly ? 'yearly' : 'monthly';
		const billingPeriod = yearly ? '/month billed annually' : '/month';
		
		// Get base price from plan
		const basePrice = plan.basePrice[interval];
		
		// Get Beta 2 discounted price (exact values, not calculated)
		const beta2Price = BETA_2_PRICES[plan.id as 'starter_pro' | 'professional']?.[interval] || basePrice * 0.8;
		
		return {
			regular: basePrice,
			discounted: beta2Price,
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
		goto('/beta-2/apply');
	}
</script>

<div class="pricing-section">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-16 py-8 sm:py-20">
		
		<!-- Section Divider -->
		<hr class="section-divider" aria-hidden="true" />
		
		<!-- Section Header -->
<div class="section-header">
	<h2 class="section-title">
		Beta 2 Pricing
	</h2>
	<p class="section-subtitle">
		4 months free trial + 20% off forever. Last 100 spots before public launch.
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
			Annual
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
						<span class="price-value">€{formatPrice(pricing.discounted)}<span class="price-period">/{isYearly ? 'yr' : 'mo'}</span></span>
					</div>
					<div class="price-note beta-2-badge">
						4 months FREE trial + 20% OFF forever
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
		<div class="cta-actions">
			<button onclick={handleJoinWaitlist} class="button-primary button-large button-gap">
				Claim Your Beta 2 Spot
				<ArrowRight class="w-4 h-4" />
			</button>
		</div>
		<p class="cta-note">
			No credit card required • Cancel anytime • Full access to all features
		</p>
			</div>
		</div>
		
	</div>
</div>

<style>
	/* Section Background - Clean & Professional */
	.pricing-section {
		background: linear-gradient(
			180deg,
			var(--bg-primary) 0%,
			var(--bg-secondary) 100%
		);
		position: relative;
		overflow: hidden;
	}
	
	/* Section Divider */
	.section-divider {
		border: none;
		max-width: 14rem;
		height: 8px;
		background: transparent;
		margin: 0 auto 4rem;
		position: relative;
		display: flex;
		align-items: center;
		overflow: visible;
	}
	
	.section-divider::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--border-secondary) 50%,
			transparent 100%
		);
	}
	
	.section-divider::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 8px;
		height: 8px;
		background: var(--primary);
		border-radius: 50%;
		opacity: 0.6;
		z-index: 1;
		box-shadow: 0 0 0 2px var(--bg-primary);
	}
	
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
		font-weight: 800;
		color: var(--text-primary);
		line-height: 1.2;
		margin-bottom: 1rem;
		letter-spacing: -0.025em;
	}
	
	.section-subtitle {
		font-size: 1.125rem;
		color: var(--text-secondary);
		max-width: 42rem;
		margin: 0 auto;
		line-height: 1.6;
		letter-spacing: -0.01em;
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
		border: 2px solid var(--border-primary);
		box-shadow: var(--shadow-xs);
	}
	
	.toggle-button {
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all var(--transition-base);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.toggle-button.active {
		background: var(--bg-primary);
		color: var(--text-primary);
		box-shadow: var(--shadow-sm);
		font-weight: 700;
	}
	
	.toggle-button:hover:not(.active) {
		color: var(--text-primary);
		background: rgba(var(--primary-rgb), 0.04);
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
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: var(--radius-xl);
		padding: 2rem;
		position: relative;
		transition: all var(--transition-slow);
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow-sm);
	}
	
	.pricing-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}
	
	.pricing-card--popular {
		border-color: var(--color-accent-600);
		box-shadow: 0 0 0 2px var(--color-accent-600), var(--shadow-md);
		background: var(--bg-primary);
	}
	
	.pricing-card--popular:hover {
		box-shadow: 0 0 0 2px var(--color-accent-600), var(--shadow-xl);
		border-color: var(--color-accent-600);
	}
	
	.popular-badge {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-accent-600);
		color: white;
		padding: 0.375rem 1rem;
		border-radius: 9999px;
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		white-space: nowrap;
		box-shadow: 0 2px 8px rgba(var(--color-accent-600-rgb), 0.3);
		transition: all var(--transition-base);
	}
	
	.popular-badge:hover {
		transform: translateX(-50%) translateY(-1px);
		box-shadow: 0 4px 12px rgba(var(--color-accent-600-rgb), 0.4);
	}
	
	/* Plan Header */
	.plan-header {
		margin-bottom: 1.75rem;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--border-secondary);
	}
	
	.plan-name {
		font-size: 1.375rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.625rem;
		letter-spacing: -0.01em;
	}
	
	.plan-description {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		line-height: 1.5;
		letter-spacing: -0.01em;
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
		font-size: 2.25rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}
	
	.price-period {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 500;
	}
	
	.price-note {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}
	
	.beta-2-badge {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--color-accent-700);
		background: var(--color-accent-50);
		padding: 0.5rem 0.875rem;
		border-radius: 9999px;
		display: inline-block;
		margin-top: 0.5rem;
		border: 1px solid var(--color-accent-200);
		box-shadow: 0 1px 3px rgba(var(--color-accent-600-rgb), 0.1);
		letter-spacing: 0.01em;
	}
	
	/* Feature List */
	.feature-list {
		list-style: none;
		padding: 0;
		margin: 0 0 1.75rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex-grow: 1;
	}
	
	.feature-item {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		font-size: 0.9375rem;
		color: var(--text-secondary);
		line-height: 1.5;
		font-weight: 500;
	}
	
	.feature-item :global(svg) {
		color: var(--color-accent-600);
		flex-shrink: 0;
		margin-top: 2px;
		width: 1.125rem;
		height: 1.125rem;
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
		margin-top: 4rem;
		text-align: center;
	}
	
	.cta-content {
		max-width: 40rem;
		margin: 0 auto;
	}
	
	.cta-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
		letter-spacing: -0.02em;
	}
	
	.cta-description {
		font-size: 1.0625rem;
		color: var(--text-secondary);
		margin-bottom: 2rem;
		line-height: 1.6;
		letter-spacing: -0.01em;
	}
	
	.cta-actions {
		display: flex;
		justify-content: center;
		margin-bottom: 1.25rem;
	}
	
	.cta-note {
		font-size: 0.9375rem;
		color: var(--text-tertiary);
		margin-top: 1.25rem;
		line-height: 1.5;
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
<script lang="ts">
	import { goto } from '$app/navigation';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Crown from 'lucide-svelte/icons/crown';
	import { PRICING_PLANS, calculatePlanPricing, type PricingPlan } from '$lib/utils/pricing-config.js';
	
	let isYearly = $state(false);
	
	// Calculate pricing with early access discount using unified function
	function getPlanPricing(plan: PricingPlan, yearly: boolean) {
		const interval = yearly ? 'yearly' : 'monthly';
		const billingPeriod = yearly ? '/month billed annually' : '/month';
		
		// Use unified pricing calculation (no user context = early access pricing)
		const pricing = calculatePlanPricing(plan.id, interval);
		
		return {
			original: pricing.original,
			earlyAccess: pricing.final,
			period: billingPeriod,
			savings: pricing.savings
		};
	}
	
	// Format price for display (show .50 but not .00)
	function formatPrice(price: number): string {
		if (price === 0) return '0';
		if (price % 1 === 0) return price.toString();
		return price.toFixed(2);
	}
	
	function handlePlanSelect(plan: PricingPlan) {
		goto(plan.ctaLink);
	}
</script>

<!-- Professional Early Access Notice -->
<div class="mb-12">
	<div class="info-alert max-w-4xl mx-auto">
		<div class="flex items-start gap-3">
			<AlertCircle class="w-5 h-5 mt-0.5 flex-shrink-0 text-teal" />
			<div class="flex-1">
				<h3 class="font-semibold mb-1 text-primary">Early Access Program</h3>
				<p class="text-sm text-secondary">
					Founding members receive special pricing that remains locked in permanently. Features marked as "Soon" are in development and will be released progressively.
				</p>
			</div>
		</div>
	</div>
</div>

<div class="text-center mb-12">
	<div class="professional-badge mb-6">
		<Crown class="w-4 h-4" />
		<span>Founding Member Pricing</span>
	</div>
	<h2 class="marketing-heading marketing-heading-lg mb-4">
		Transparent Subscription Pricing
	</h2>
	<p class="text-lg max-w-2xl mx-auto text-secondary">
		No booking commissions or hidden fees. Choose a plan that fits your business needs. Keep 100% of your tour revenue.
	</p>
</div>

<!-- Professional Toggle -->
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
			Annual (2 months free)
		</button>
	</div>
</div>

<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
	{#each PRICING_PLANS.filter(p => !p.hidden) as plan}
		{@const pricing = getPlanPricing(plan, isYearly)}
		<div class="pricing-card {plan.popular ? 'pricing-card--popular' : ''}" 
			 role="button"
			 tabindex="0"
			 onclick={() => handlePlanSelect(plan)}
			 onkeydown={(e) => e.key === 'Enter' && handlePlanSelect(plan)}>
		
		{#if plan.popular}
			<div class="popular-badge">
				<Crown class="w-3 h-3" />
				<span>Recommended</span>
			</div>
		{/if}
		
		<div class="plan-header">
			<h3 class="plan-name">{plan.name}</h3>
			
			<div class="plan-pricing">
				{#if plan.id !== 'free' && pricing.savings > 0}
					<span class="original-price">€{formatPrice(pricing.original)}</span>
					<span class="current-price">€{formatPrice(pricing.earlyAccess)}</span>
				{:else}
					<span class="current-price">€{formatPrice(pricing.earlyAccess)}</span>
				{/if}
				{#if plan.id !== 'free'}
					<span class="billing-period">{pricing.period}</span>
				{/if}
			</div>
			
			<div class="plan-badge-container">
				{#if plan.id !== 'free' && pricing.savings > 0}
					<span class="founding-member-badge">
						Founding Member Price
					</span>
				{/if}
			</div>
			
			<p class="plan-description">{plan.description}</p>
		</div>
		
		<ul class="feature-list">
			{#each plan.features as feature}
				<li class="feature-item">
					{#if feature.included}
						<Check class="feature-icon feature-icon--included" strokeWidth={2} />
						<div class="feature-content">
							<div class="feature-text-wrapper">
								<span class="feature-text">
									{feature.text}
								</span>
								{#if feature.comingSoon}
									<span class="coming-soon-badge">
										Soon
									</span>
								{/if}
							</div>
						</div>
					{:else}
						<X class="feature-icon feature-icon--excluded" strokeWidth={2} />
						<span class="feature-text feature-text--excluded">{feature.text}</span>
					{/if}
				</li>
			{/each}
		</ul>
		
		<button onclick={(e) => { e.stopPropagation(); handlePlanSelect(plan); }} 
				class="plan-cta {plan.popular ? 'plan-cta--primary' : 'plan-cta--outline'}">
			{plan.ctaText}
		</button>
	</div>
	{/each}
</div>

<!-- Professional No Commission Notice -->
<div class="mt-16">
	<div class="no-commission-card max-w-4xl mx-auto text-center">
		<p class="no-commission-title">
			Discovery + No Commission Model
		</p>
		<p class="no-commission-description">
			The first platform offering tour discovery AND no booking fees. Get found by customers through our discovery platform, then keep 100% of revenue.
			<span class="font-semibold">Zero commissions. Maximum exposure.</span>
		</p>
	</div>
</div>

<style>
	/* Professional badge */
	.professional-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--bg-primary);
		border: 2px solid var(--color-primary-500);
		color: var(--text-primary);
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		font-weight: 600;
		font-size: 0.875rem;
		box-shadow: var(--shadow-sm);
	}

	/* Professional Alert Styling */
	.info-alert {
		background: var(--bg-primary);
		border: 2px solid var(--border-primary); /* Updated to 2px */
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		box-shadow: var(--shadow-md);
	}

	/* Pricing Toggle */
	.pricing-toggle {
		background: var(--bg-primary);
		border: 2px dashed var(--border-secondary);
		border-radius: var(--radius-lg);
		padding: 0.5rem;
		display: inline-flex;
		gap: 0.25rem;
		box-shadow: var(--shadow-sm);
	}




	/* Pricing Cards - Fixed badge positioning */
	.pricing-card {
		background: var(--bg-primary);
		border: 2px solid var(--border-primary); /* Updated to 2px */
		border-radius: var(--radius-lg);
		padding: 2rem;
		display: flex;
		flex-direction: column;
		position: relative;
		cursor: pointer;
		transition: all var(--transition-base) ease;
		box-shadow: var(--shadow-sm);
		overflow: visible;
		margin-top: 1rem; /* Space for badge */
	}

	/* Coral accent line on hover */
	.pricing-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-primary-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.pricing-card:hover::before {
		transform: scaleX(1);
	}

	.pricing-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}

	.pricing-card--popular {
		border-color: var(--color-primary-400);
		background: var(--bg-secondary);
		box-shadow: var(--shadow-md);
	}

	.pricing-card--popular:hover {
		box-shadow: var(--shadow-xl);
	}

	/* Popular Badge - Fixed positioning */
	.popular-badge {
		position: absolute;
		top: -0.75rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--color-primary-500);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 600;
		box-shadow: var(--shadow-md);
		display: flex;
		align-items: center;
		gap: 0.25rem;
		z-index: 10;
		white-space: nowrap;
	}

	/* Plan Header */
	.plan-header {
		margin-bottom: 1.5rem;
	}

	.plan-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.plan-pricing {
		margin-bottom: 0.75rem;
	}

	.original-price {
		font-size: 1.125rem;
		text-decoration: line-through;
		color: var(--text-tertiary);
	}

	.current-price {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-left: 0.5rem;
	}

	.billing-period {
		font-size: 0.875rem;
		color: var(--text-secondary);
		display: block;
		margin-top: 0.25rem;
	}

	.plan-badge-container {
		height: 1.5rem;
		margin-bottom: 1rem;
	}

	.founding-member-badge {
		background: var(--color-secondary-100);
		border: 1px solid var(--color-secondary-300);
		color: var(--color-secondary-800);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.plan-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	/* Feature List */
	.feature-list {
		list-style: none;
		margin: 0;
		padding: 0;
		margin-bottom: 2rem;
		flex-grow: 1;
	}

	.feature-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.feature-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.feature-icon--included {
		color: var(--color-success-600);
	}

	.feature-icon--excluded {
		color: var(--text-tertiary);
	}

	.feature-content {
		flex-grow: 1;
		min-width: 0;
	}

	.feature-text-wrapper {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.feature-text {
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.feature-text--excluded {
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}

	.coming-soon-badge {
		background: var(--color-success-100);
		border: 1px solid var(--color-success-300);
		color: var(--color-success-700);
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-md);
		font-size: 0.625rem;
		font-weight: 500;
		line-height: 1;
		flex-shrink: 0;
	}

	/* Plan CTA Buttons - New button style */
	.plan-cta {
		width: 100%;
		padding: 0.75rem 1.5rem;
		border-radius: 0.75rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
		text-align: center;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		text-decoration: none;
		white-space: nowrap;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	.plan-cta--primary {
		background: #FFB3B3; /* Light coral background */
		color: #2D2D2D; /* Dark text */
		border: 2px solid #2D2D2D; /* Dark border */
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.plan-cta--primary:hover {
		background: #FF9999; /* More saturated on hover */
		border-color: #1A1A1A; /* Darker border */
		color: #1A1A1A;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.plan-cta--outline {
		background: transparent;
		color: var(--text-primary);
		border: 2px solid var(--text-primary);
	}

	.plan-cta--outline:hover {
		background: var(--bg-secondary);
		border-color: var(--text-primary);
		color: var(--text-primary);
	}
	
	/* Dark mode adjustments */
	[data-theme="dark"] .plan-cta--primary {
		background: #CC9999; /* Muted coral for dark mode */
		border-color: #1A1A1A;
		color: #1A1A1A;
	}
	
	[data-theme="dark"] .plan-cta--primary:hover {
		background: #BB8888;
		border-color: #000000;
		color: #000000;
	}
	
	[data-theme="dark"] .plan-cta--outline {
		border-color: #A0A0A0;
		color: var(--text-primary);
		background: transparent;
	}
	
	[data-theme="dark"] .plan-cta--outline:hover {
		background: #2A2A2A;
		border-color: #B0B0B0;
	}

	/* No Commission Card */
	.no-commission-card {
		background: var(--bg-primary);
		border: 2px solid var(--border-primary); /* Updated to 2px */
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		box-shadow: var(--shadow-md);
		position: relative;
		overflow: hidden;
	}

	/* Coral accent line on hover */
	.no-commission-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-primary-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.no-commission-card:hover::before {
		transform: scaleX(1);
	}

	.no-commission-title {
		font-weight: 700;
		font-size: 1.125rem;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.no-commission-description {
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.pricing-card {
			padding: 1.5rem;
		}

		.current-price {
			font-size: 1.75rem;
		}

		.plan-name {
			font-size: 1.125rem;
		}

		.current-price {
			font-size: 1.5rem;
		}

		.billing-period {
			font-size: 0.8125rem;
		}

		.feature-text {
			font-size: 0.8125rem;
		}

		.plan-cta {
			padding: 0.75rem 1.25rem;
			font-size: 0.8125rem;
		}
	}

	@media (max-width: 480px) {
		.pricing-card {
			margin-top: 0.75rem;
		}

		.plan-name {
			font-size: 1rem;
		}

		.current-price {
			font-size: 1.375rem;
		}

		.no-commission-card {
			padding: 1.25rem;
		}

		.no-commission-title {
			font-size: 1rem;
		}

		.no-commission-description {
			font-size: 0.875rem;
		}
	}
</style> 
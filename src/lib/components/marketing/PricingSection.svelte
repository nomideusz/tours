<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import { PRICING_PLANS, calculateEarlyAccessPrice, type PricingPlan } from '$lib/utils/pricing-config.js';
	
	let isYearly = $state(true);
	
	// Calculate pricing with early access discount
	function getPlanPricing(plan: PricingPlan, yearly: boolean) {
		const basePrice = yearly ? plan.basePrice.yearly : plan.basePrice.monthly;
		const originalPrice = basePrice;
		const earlyAccessPrice = plan.id === 'free' ? 0 : calculateEarlyAccessPrice(basePrice);
		const billingPeriod = yearly ? '/month billed annually' : '/month';
		
		return {
			original: originalPrice,
			earlyAccess: earlyAccessPrice,
			period: billingPeriod,
			savings: originalPrice - earlyAccessPrice
		};
	}
</script>

<!-- Pricing -->
<section id="pricing" class="py-20" style="background: var(--bg-primary);">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<!-- Early Access Notice -->
		<div class="max-w-3xl mx-auto mb-12">
			<div class="rounded-lg p-4 border" style="background: var(--color-warning-50); border-color: var(--color-warning-200);">
				<div class="flex items-start gap-3">
					<AlertCircle class="w-5 h-5 mt-0.5 flex-shrink-0" style="color: var(--color-warning-600);" />
					<div class="flex-1">
						<h3 class="font-semibold mb-1">🚀 Early Access - 50% OFF Limited Time</h3>
						<p class="text-sm">
							Join now and lock in these special rates forever! Get 50% off regular pricing during early access. Features marked as "Soon" will be rolled out progressively over the coming months.
						</p>
					</div>
				</div>
			</div>
		</div>
		
		<div class="text-center mb-12">
			<h2 class="text-3xl md:text-4xl font-bold mb-4" style="color: var(--text-primary);">
				Simple, Transparent Pricing
			</h2>
			<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
				No booking fees, no commissions. Keep 100% of your revenue with our simple monthly subscription.
			</p>
		</div>
		
		<!-- Toggle -->
		<div class="flex justify-center mb-12">
			<div class="p-1 rounded-lg inline-flex" style="background: var(--bg-secondary);">
				<button 
					class="px-4 py-2 rounded-md font-medium transition-all duration-200 cursor-pointer {!isYearly ? 'shadow-sm' : ''}"
					style="{!isYearly ? 'background: var(--bg-primary); color: var(--text-primary);' : 'background: transparent; color: var(--text-secondary);'}"
					onclick={() => isYearly = false}
				>
					Monthly
				</button>
				<button 
					class="px-4 py-2 rounded-md font-medium transition-all duration-200 cursor-pointer {isYearly ? 'shadow-sm' : ''}"
					style="{isYearly ? 'background: var(--bg-primary); color: var(--text-primary);' : 'background: transparent; color: var(--text-secondary);'}"
					onclick={() => isYearly = true}
				>
					Annual (Save 20%)
				</button>
			</div>
		</div>
		
		<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
			{#each PRICING_PLANS as plan}
				{@const pricing = getPlanPricing(plan, isYearly)}
				<div class="relative rounded-lg p-6 flex flex-col {plan.popular ? 'border-2' : ''}" 
					 style="background: var(--bg-primary); border-color: {plan.popular ? 'var(--color-primary-500)' : 'var(--border-primary)'};{!plan.popular ? ' border: 1px solid var(--border-primary);' : ''}">
					
					{#if plan.popular}
						<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
							<span class="px-3 py-1 rounded-full text-xs font-medium" style="background: var(--color-primary-600); color: white;">Most Popular</span>
						</div>
					{/if}
					
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">{plan.name}</h3>
					
					<div class="mb-1">
						{#if plan.id !== 'free' && pricing.savings > 0}
							<span class="text-lg line-through" style="color: var(--text-tertiary);">€{pricing.original}</span>
							<span class="text-3xl font-bold ml-1" style="color: var(--text-primary);">€{pricing.earlyAccess}</span>
						{:else}
							<span class="text-3xl font-bold" style="color: var(--text-primary);">€{pricing.earlyAccess}</span>
						{/if}
						{#if plan.id !== 'free'}
							<span class="text-sm" style="color: var(--text-secondary);">{pricing.period}</span>
						{/if}
					</div>
					
					<div class="mb-2 h-4">
						{#if plan.id !== 'free' && pricing.savings > 0}
							<span class="text-xs font-medium px-2 py-1 rounded-full" style="background: var(--color-success-100); color: var(--color-success-700);">
								50% OFF Early Access
							</span>
						{/if}
					</div>
					
					<p class="mb-6 text-sm" style="color: var(--text-secondary);">{plan.description}</p>
					
					<ul class="space-y-2 mb-6 flex-grow">
						{#each plan.features as feature}
							<li class="flex items-start gap-2">
								{#if feature.included}
									<Check class="w-4 h-4 {plan.popular ? 'icon-primary' : 'icon-secondary'} mt-0.5 flex-shrink-0" strokeWidth={2} />
									<div class="flex-1 min-w-0">
										<div class="flex items-baseline gap-1.5 flex-wrap">
											<span class="text-sm" style="color: var(--text-primary);">
												{feature.text}
											</span>
											{#if feature.comingSoon}
												<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0" 
													style="background: var(--color-primary-100); color: var(--color-primary-700); border: 1px solid var(--color-primary-300); font-size: 0.625rem; line-height: 1;">
													Soon
												</span>
											{/if}
										</div>
									</div>
								{:else}
									<X class="w-4 h-4 icon-danger mt-0.5 flex-shrink-0" strokeWidth={2} />
									<span class="text-sm" style="color: var(--text-secondary);">{feature.text}</span>
								{/if}
							</li>
						{/each}
					</ul>
					
					<a href={plan.ctaLink} class="{plan.popular ? 'button-primary' : 'button-secondary'} button--full-width text-center">
						{plan.ctaText}
					</a>
				</div>
			{/each}
		</div>
		
		<div class="mt-12 text-center">
			<div class="rounded-lg p-4 border max-w-2xl mx-auto" style="background: var(--color-success-50); border-color: var(--color-success-200);">
				<p class="font-semibold text-lg mb-2" style="color: var(--color-success-800);">
					💰 Keep 100% of Your Booking Revenue
				</p>
				<p style="color: var(--color-success-700);">
					Unlike competitors who take 3-8% commission per booking, we charge a simple monthly fee. 
					<span class="font-semibold">No booking fees, no commissions, ever!</span>
				</p>
			</div>
		</div>
	</div>
</section> 
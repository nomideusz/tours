<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { currentUser } from '$lib/stores/auth.js';
	import type { SubscriptionPlan, BillingInterval } from '$lib/stripe-subscriptions.server.js';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Calendar from 'lucide-svelte/icons/calendar';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Crown from 'lucide-svelte/icons/crown';
	import Gift from 'lucide-svelte/icons/gift';
	import type { PageData } from './$types.js';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import { PRICING_PLANS, type PricingPlan, isFeatureImplemented } from '$lib/utils/pricing-config.js';
	
	let { data }: { data: PageData } = $props();
	
	let loading = $state(false);
	let error = $state<string | null>(null);
	let isYearly = $state(true);
	let showCancelModal = $state(false);
	
	// Convert shared pricing config to subscription format
	const SUBSCRIPTION_PLANS = Object.fromEntries(
		PRICING_PLANS.map(plan => [
			plan.id,
			{
				name: plan.name,
				monthlyBookingLimit: plan.monthlyBookingLimit,
				tourLimit: plan.tourLimit
			}
		])
	);
	
	// Get current user subscription info
	let user = $derived($currentUser);
	let currentPlan = $derived((user?.subscriptionPlan || 'free') as 'free' | 'starter_pro' | 'professional' | 'agency');
	let subscriptionStatus = $derived(user?.subscriptionStatus);
	let cancelAtPeriodEnd = $derived(user?.subscriptionCancelAtPeriodEnd);
	let currentPeriodEnd = $derived(user?.subscriptionCurrentPeriodEnd);
	
	// Get plan pricing safely
	function getPlanPricing(planId: string) {
		return PRICING_PLANS.find(plan => plan.id === planId)?.basePrice;
	}
	
	// Check if user has promo benefits
	let hasPromoDiscount = $derived(user && (
		(user.subscriptionFreeUntil && new Date(user.subscriptionFreeUntil) > new Date()) ||
		(user.subscriptionDiscountPercentage && user.subscriptionDiscountPercentage > 0)
	));
	
	let isInFreePeriod = $derived(user && user.subscriptionFreeUntil && new Date(user.subscriptionFreeUntil) > new Date());
	let discountPercentage = $derived(user?.subscriptionDiscountPercentage || 0);
	let isLifetimeDiscount = $derived(user?.isLifetimeDiscount || false);
	
	// Calculate prices with promo code discounts
	function calculatePrice(basePlan: 'starter_pro' | 'professional' | 'agency', interval: 'monthly' | 'yearly'): { original: number; final: number; savings: number } {
		const planPricing = getPlanPricing(basePlan);
		
		if (!planPricing) {
			console.error(`No pricing found for plan: ${basePlan}`);
			return { original: 0, final: 0, savings: 0 };
		}
		
		const originalPrice = planPricing[interval];
		
		// If user is in free period (from promo code), show as free
		if (isInFreePeriod) {
			return { original: originalPrice, final: 0, savings: originalPrice };
		}
		
		// Apply promo code discount if user has one
		if (discountPercentage > 0) {
			const discount = Math.round((originalPrice * discountPercentage) / 100);
			return { 
				original: originalPrice, 
				final: originalPrice - discount, 
				savings: discount
			};
		}
		
		// No discounts - show regular pricing
		return { original: originalPrice, final: originalPrice, savings: 0 };
	}
	
	// Calculate prices - updated pricing with promo consideration
	let starterProPricing = $derived(calculatePrice('starter_pro', isYearly ? 'yearly' : 'monthly'));
	let proPricing = $derived(calculatePrice('professional', isYearly ? 'yearly' : 'monthly'));
	let agencyPricing = $derived(calculatePrice('agency', isYearly ? 'yearly' : 'monthly'));
	
	let billingPeriod = $derived(isYearly ? '/month billed annually' : '/month');
	
	// Format promo benefit text
	function getPromoBenefitText(): string {
		if (isInFreePeriod && user?.subscriptionFreeUntil) {
			const freeUntil = new Date(user.subscriptionFreeUntil);
			const monthsLeft = Math.round((freeUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));
			const freeText = `Free access: ${monthsLeft} month${monthsLeft > 1 ? 's' : ''} remaining`;
			
			// If user also has a lifetime discount for after free period
			if (discountPercentage > 0 && isLifetimeDiscount) {
				return `${freeText}, then ${discountPercentage}% lifetime discount`;
			}
			
			return freeText;
		}
		
		if (discountPercentage > 0) {
			return `${discountPercentage}% ${isLifetimeDiscount ? 'lifetime' : 'temporary'} discount active`;
		}
		
		return '';
	}
	
	// Check if user has any promo benefits
	let hasActivePromoCode = $derived(user?.promoCodeUsed && (isInFreePeriod || discountPercentage > 0));
	
	// Refresh data on mount to ensure we have the latest subscription info
	onMount(async () => {
		// Invalidate all data to force a fresh load
		await invalidateAll();
	});
	
	async function upgradeSubscription(planId: SubscriptionPlan, billingInterval: BillingInterval) {
		if (!user?.id) return;
		
		loading = true;
		error = null;
		
		try {
			const response = await fetch('/api/subscriptions/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user.id,
					planId,
					billingInterval
				})
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error || 'Failed to create checkout session');
			}
			
			// Redirect to Stripe Checkout
			window.location.href = data.url;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}
	
	async function manageSubscription() {
		if (!user?.id) return;
		
		loading = true;
		error = null;
		
		try {
			const response = await fetch('/api/subscriptions/portal', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: user.id })
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error || 'Failed to create portal session');
			}
			
			// Redirect to Stripe Customer Portal
			window.location.href = data.url;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}
	
	async function cancelSubscription() {
		if (!user?.id) return;
		
		showCancelModal = true;
	}
	
	async function confirmCancelSubscription() {
		if (!user?.id) return;
		
		loading = true;
		error = null;
		
		try {
			const response = await fetch('/api/subscriptions/cancel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user.id,
					action: 'cancel'
				})
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error || 'Failed to cancel subscription');
			}
			
			// Refresh page to show updated status
			await invalidateAll();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}
	
	async function reactivateSubscription() {
		if (!user?.id) return;
		
		loading = true;
		error = null;
		
		try {
			const response = await fetch('/api/subscriptions/cancel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user.id,
					action: 'reactivate'
				})
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error || 'Failed to reactivate subscription');
			}
			
			// Refresh page to show updated status
			await invalidateAll();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}
	
	function formatDate(dateString: string | null) {
		if (!dateString) return '';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

{#snippet featureItem(feature: import('$lib/utils/pricing-config.js').PricingFeature, colorClass: string = '')}
	{@const isImplemented = isFeatureImplemented(feature.text)}
	<li class="flex items-start gap-1.5 sm:gap-2">
		{#if feature.included}
			<Check class="w-3.5 h-3.5 sm:w-4 sm:h-4 {colorClass} mt-0.5 flex-shrink-0" strokeWidth={2} />
			<span class="text-xs sm:text-sm flex-1" style="color: var(--text-primary);">
				{feature.text}
				{#if feature.comingSoon && !isImplemented}
					<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ml-1 sm:ml-2" 
						style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-primary); font-size: 0.65rem;">
						Soon
					</span>
				{/if}
			</span>
		{:else}
			<X class="w-3.5 h-3.5 sm:w-4 sm:h-4 icon-danger mt-0.5 flex-shrink-0" strokeWidth={2} />
			<span class="text-xs sm:text-sm" style="color: var(--text-secondary);">{feature.text}</span>
		{/if}
	</li>
{/snippet}

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-8">
	<!-- Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Header -->
		<MobilePageHeader
			title="Subscription"
			secondaryInfo={SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.name || 'Free Starter'}
			quickActions={[
				...(currentPlan !== 'free' && !cancelAtPeriodEnd ? [{
					label: 'Billing',
					icon: CreditCard,
					onclick: manageSubscription,
					variant: 'secondary' as const,
					disabled: loading
				}] : [])
			]}
			infoItems={[
				{
					icon: Crown,
					label: 'Plan',
					value: SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.name || 'Free'
				},
				{
					icon: Calendar,
					label: 'Bookings',
					value: `${user?.monthlyBookingsUsed || 0}/${SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.monthlyBookingLimit || '∞'}`
				},
				{
					icon: Gift,
					label: 'Tours',
					value: `${data.usage?.tours?.used || 0}/${data.usage?.tours?.limit !== null ? data.usage.tours.limit : '∞'}`
				},
				{
					icon: CreditCard,
					label: cancelAtPeriodEnd ? 'Cancels' : 'Renews',
					value: currentPeriodEnd && currentPlan !== 'free' ? new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'
				}
			]}
		/>
		
		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title="Subscription Management"
				subtitle="Manage your Zaur subscription and billing"
			/>
		</div>
	</div>

	{#if error}
		<div class="rounded-lg p-3 sm:p-4 mb-4 border alert-error">
			<div class="flex items-start gap-2 sm:gap-3">
				<AlertCircle class="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
				<div class="flex-1">
					<h3 class="font-semibold mb-0.5">Something went wrong</h3>
					<p>{error}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Early Access Notice -->
	<div class="alert-info mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg">
		<div class="flex items-start gap-2 sm:gap-3">
			<AlertCircle class="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
			<div class="flex-1">
				<h3 class="font-semibold mb-0.5 sm:mb-1">Early Access - Limited Time Features</h3>
				<p>
					Zaur is in early access. Join now and shape the future of tour management! 
					Some features are being actively developed and will be rolled out progressively.
					Check our social media for special promo codes with exclusive discounts.
				</p>
			</div>
		</div>
	</div>

	<!-- Promo Code Benefits -->
	{#if hasActivePromoCode}
		<div class="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border alert-success">
			<div class="flex items-start gap-2 sm:gap-3">
				<Gift class="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
				<div class="flex-1">
					<h3 class="alert-heading">Promo Code Benefits Active!</h3>
					<p class="alert-body">
						{getPromoBenefitText()}
						{#if user?.promoCodeUsed}
							<span class="font-medium"> • Code: {user.promoCodeUsed}</span>
						{/if}
					</p>
					{#if isInFreePeriod && user?.subscriptionFreeUntil}
						<p class="alert-body text-xs mt-1 opacity-90">
							Free period ends on {formatDate(user.subscriptionFreeUntil)}
							{#if discountPercentage > 0 && isLifetimeDiscount}
								• After that, {discountPercentage}% lifetime discount applies to all payments
							{/if}
						</p>
					{:else if discountPercentage > 0 && isLifetimeDiscount}
						<p class="alert-body text-xs mt-1 opacity-90">
							This discount applies to all future payments
						</p>
					{/if}
				</div>
			</div>
		</div>
	{:else if currentPlan === 'free'}
		<!-- Promo Code CTA for users without codes -->
		<div class="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border" style="background: var(--bg-secondary); border-color: var(--border-primary);">
			<div class="flex items-start gap-2 sm:gap-3">
				<Gift class="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" style="color: var(--color-primary-600);" />
				<div class="flex-1">
					<h3 class="font-semibold mb-0.5 sm:mb-1" style="color: var(--text-primary);">Have a Promo Code?</h3>
					<p class="text-sm" style="color: var(--text-secondary);">
						Follow us on social media for exclusive discount codes and special offers. 
						Promo codes can provide free months, lifetime discounts, and more!
					</p>
				</div>
			</div>
		</div>
	{/if}

	<div class="mb-6 sm:mb-8 rounded-xl p-4 sm:p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
			<div>
				<div class="flex items-center gap-2 mb-2">
					<Crown class="w-4 h-4 sm:w-5 sm:h-5" style="color: var(--color-primary-600);" />
					<h2 class="text-lg sm:text-xl font-semibold" style="color: var(--text-primary);">Current Plan</h2>
				</div>
				<div class="space-y-1">
					<p class="text-base sm:text-lg font-bold" style="color: var(--text-primary);">
						{SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.name || 'Free Starter'}
					</p>
					{#if subscriptionStatus && subscriptionStatus !== 'active'}
						<p class="text-xs sm:text-sm font-medium" style="color: var(--color-warning-600);">
							Status: {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
						</p>
					{/if}
					{#if cancelAtPeriodEnd && currentPeriodEnd}
						<p class="text-xs sm:text-sm" style="color: var(--color-warning-600);">
							Cancels on {formatDate(currentPeriodEnd)}
						</p>
					{:else if currentPeriodEnd && currentPlan !== 'free'}
						<p class="text-xs sm:text-sm" style="color: var(--text-secondary);">
							Renews on {formatDate(currentPeriodEnd)}
						</p>
					{/if}
				</div>
			</div>
			
			<div class="flex gap-2 flex-wrap">
				{#if currentPlan !== 'free'}
					{#if cancelAtPeriodEnd}
						<button
							onclick={reactivateSubscription}
							disabled={loading}
							class="button-success"
						>
							Reactivate
						</button>
					{:else}
						<button
							onclick={manageSubscription}
							disabled={loading}
							class="button-secondary"
						>
							<CreditCard class="w-4 h-4 inline mr-2" />
							Manage Billing
						</button>
						<button
							onclick={cancelSubscription}
							disabled={loading}
							class="button-secondary button--danger-text"
						>
							Cancel Subscription
						</button>
					{/if}
				{/if}
			</div>
		</div>
		
		{#if user}
			<div class="mt-4 pt-4 border-t" style="border-color: var(--border-primary);">
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
					<div>
						<p style="color: var(--text-secondary);">Monthly Bookings</p>
						<p class="font-medium text-sm sm:text-base" style="color: var(--text-primary);">
							{user.monthlyBookingsUsed || 0}
							{#if SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.monthlyBookingLimit}
								/ {SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.monthlyBookingLimit}
							{:else}
								/ Unlimited
							{/if}
						</p>
					</div>
					<div>
						<p style="color: var(--text-secondary);">Tours Created</p>
						<p class="font-medium text-sm sm:text-base" style="color: var(--text-primary);">
							{data.usage?.tours?.used || 0}
							{#if data.usage?.tours?.limit !== null}
								/ {data.usage.tours.limit}
							{:else}
								/ Unlimited
							{/if}
						</p>
					</div>
					<div>
						<p style="color: var(--text-secondary);">Next Reset</p>
						<p class="font-medium text-sm sm:text-base" style="color: var(--text-primary);">
							{user.monthlyBookingsResetAt ? formatDate(user.monthlyBookingsResetAt) : 'Next month'}
						</p>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Upgrade Options -->
	{#if currentPlan !== 'agency'}
		<div class="mb-6 sm:mb-8">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
				<h2 class="text-lg sm:text-xl font-semibold" style="color: var(--text-primary);">Upgrade Your Plan</h2>
				
				<!-- Toggle -->
				<div class="p-0.5 sm:p-1 rounded-lg inline-flex self-start sm:self-auto" style="background: var(--bg-secondary);">
					<button 
						class="px-2 py-0.5 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer {!isYearly ? 'shadow-sm' : ''}"
						style="{!isYearly ? 'background: var(--bg-primary); color: var(--text-primary);' : 'background: transparent; color: var(--text-secondary);'}"
						onclick={() => isYearly = false}
					>
						Monthly
					</button>
					<button 
						class="px-2 py-0.5 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer {isYearly ? 'shadow-sm' : ''}"
						style="{isYearly ? 'background: var(--bg-primary); color: var(--text-primary);' : 'background: transparent; color: var(--text-secondary);'}"
						onclick={() => isYearly = true}
					>
						Annual <span class="hidden sm:inline">(Save 20%)</span><span class="sm:hidden">-20%</span>
					</button>
				</div>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
				{#each PRICING_PLANS as plan}
					{@const pricing = plan.id === 'free' ? { original: 0, final: 0, savings: 0 } : calculatePrice(plan.id as 'starter_pro' | 'professional' | 'agency', isYearly ? 'yearly' : 'monthly')}
					{@const isPopular = plan.popular}
					{@const isCurrent = currentPlan === plan.id}
					{@const isFreePlan = plan.id === 'free'}
					
					<div class="relative rounded-lg p-4 sm:p-6 flex flex-col h-full {isPopular ? 'border-2 shadow-lg' : 'border'} {isFreePlan ? 'opacity-75' : ''}" 
						 style="background: var(--bg-primary); border-color: {isPopular ? 'var(--color-primary-500)' : 'var(--border-primary)'};{!isPopular ? ' border: 1px solid var(--border-primary);' : ''}">
					
						{#if isPopular}
							<div class="absolute -top-2.5 left-1/2 transform -translate-x-1/2">
								<span class="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium" style="background: var(--color-primary-600); color: white;">Most Popular</span>
							</div>
						{/if}
						
						<h3 class="text-lg sm:text-xl font-semibold mb-2" style="color: var(--text-primary);">{plan.name}</h3>
						
						<div class="mb-1">
							{#if !isFreePlan && pricing.savings > 0}
								<!-- User has promo discount applied -->
								<div class="text-center">
									<span class="text-sm line-through" style="color: var(--text-tertiary);">€{pricing.original}</span>
									<span class="text-xl sm:text-2xl font-bold block" style="color: var(--text-primary);">€{pricing.final}</span>
									<span class="text-xs sm:text-sm" style="color: var(--text-secondary);">/month{isYearly ? ' billed annually' : ''}</span>
								</div>
							{:else}
								<!-- Regular pricing -->
								<div class="text-center">
									<span class="text-xl sm:text-2xl font-bold" style="color: var(--text-primary);">€{isFreePlan ? 0 : pricing.final}</span>
									<span class="text-xs sm:text-sm" style="color: var(--text-secondary);">/month{isFreePlan ? '' : isYearly ? ' billed annually' : ''}</span>
								</div>
							{/if}
						</div>
						
						<div class="mb-3 sm:mb-4 h-4 sm:h-5 text-center">
							{#if !isFreePlan && pricing.savings > 0}
								<span class="text-xs font-medium px-2 py-0.5 rounded" style="background: var(--color-success-100); color: var(--color-success-700);">
									{isInFreePeriod ? 'FREE during trial' : `${discountPercentage}% OFF - Save €${pricing.savings}`}
								</span>
							{:else if !isFreePlan && isYearly}
								{@const planPricing = getPlanPricing(plan.id)}
								{@const yearlySavings = planPricing ? (planPricing.monthly * 12) - (planPricing.yearly * 12) : 0}
								<span class="text-xs font-medium" style="color: var(--color-success-600);">
									Save €{yearlySavings}/year with annual billing
								</span>
							{:else if !isFreePlan}
								<span class="text-xs" style="color: var(--text-tertiary);">
									Regular pricing
								</span>
							{/if}
						</div>
						
						<ul class="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6 flex-grow">
							{#each plan.features as feature}
								{@render featureItem(feature, isPopular ? 'icon-primary' : 'icon-secondary')}
							{/each}
						</ul>
						
						{#if isCurrent}
							<button
								disabled
								class="w-full py-2 rounded-md font-medium cursor-not-allowed"
								style="background: var(--bg-tertiary); color: var(--text-tertiary); opacity: 0.6;"
							>
								Current Plan
							</button>
						{:else if isFreePlan}
							<!-- Free plan - no action needed in upgrade section -->
						{:else if plan.id === 'agency'}
							<button
								onclick={() => upgradeSubscription(plan.id, isYearly ? 'yearly' : 'monthly')}
								disabled={loading}
								class="button-primary button--full-width"
							>
								{loading ? 'Processing...' : `Upgrade to ${plan.name}`}
							</button>
						{:else}
							<button
								onclick={() => upgradeSubscription(plan.id, isYearly ? 'yearly' : 'monthly')}
								disabled={loading}
								class="button-primary button--full-width"
							>
								{loading ? 'Processing...' : `Upgrade to ${plan.name}`}
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<!-- Cancel Subscription Modal -->
<ConfirmationModal
	bind:isOpen={showCancelModal}
	title="Cancel Subscription?"
	message="Your subscription will remain active until the end of your current billing period. You can reactivate anytime before then."
	confirmText="Yes, Cancel Subscription"
	cancelText="Keep Subscription"
	variant="danger"
	icon={AlertCircle}
	onConfirm={confirmCancelSubscription}
/> 
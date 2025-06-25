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
	
	let { data }: { data: PageData } = $props();
	
	let loading = $state(false);
	let error = $state<string | null>(null);
	let isYearly = $state(false);
	
	// Client-side subscription plans data - updated with new pricing structure
	const SUBSCRIPTION_PLANS = {
		free: {
			name: 'Free Starter',
			monthlyBookingLimit: 3,
			tourLimit: 1
		},
		starter_pro: {
			name: 'Solo Guide', 
			monthlyBookingLimit: 60,
			tourLimit: 5
		},
		professional: {
			name: 'Professional',
			monthlyBookingLimit: null, // unlimited
			tourLimit: null // unlimited
		},
		agency: {
			name: 'Agency',
			monthlyBookingLimit: null, // unlimited
			tourLimit: null // unlimited
		}
	};
	
	// Get current user subscription info
	let user = $derived($currentUser);
	let currentPlan = $derived((user?.subscriptionPlan || 'free') as 'free' | 'starter_pro' | 'professional' | 'agency');
	let subscriptionStatus = $derived(user?.subscriptionStatus);
	let cancelAtPeriodEnd = $derived(user?.subscriptionCancelAtPeriodEnd);
	let currentPeriodEnd = $derived(user?.subscriptionCurrentPeriodEnd);
	
	// Base prices
	const BASE_PRICES = {
		starter_pro: { monthly: 16, yearly: 13 },
		professional: { monthly: 35, yearly: 29 },
		agency: { monthly: 89, yearly: 74 }
	};
	
	// Check if user has promo benefits
	let hasPromoDiscount = $derived(user && (
		(user.subscriptionFreeUntil && new Date(user.subscriptionFreeUntil) > new Date()) ||
		(user.subscriptionDiscountPercentage > 0)
	));
	
	let isInFreePeriod = $derived(user && user.subscriptionFreeUntil && new Date(user.subscriptionFreeUntil) > new Date());
	let discountPercentage = $derived(user?.subscriptionDiscountPercentage || 0);
	let isLifetimeDiscount = $derived(user?.isLifetimeDiscount || false);
	
	// Calculate prices with discounts
	function calculatePrice(basePlan: 'starter_pro' | 'professional' | 'agency', interval: 'monthly' | 'yearly'): { original: number; final: number; savings: number } {
		const basePrice = BASE_PRICES[basePlan][interval];
		
		if (isInFreePeriod) {
			return { original: basePrice, final: 0, savings: basePrice };
		}
		
		if (discountPercentage > 0) {
			const discount = (basePrice * discountPercentage) / 100;
			return { 
				original: basePrice, 
				final: Math.round(basePrice - discount), 
				savings: Math.round(discount)
			};
		}
		
		return { original: basePrice, final: basePrice, savings: 0 };
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
			return `Free trial: ${monthsLeft} month${monthsLeft > 1 ? 's' : ''} remaining`;
		}
		
		if (discountPercentage > 0) {
			return `${discountPercentage}% ${isLifetimeDiscount ? 'lifetime' : ''} discount`;
		}
		
		return '';
	}
	
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
		if (!user?.id || !confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.')) return;
		
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
	
	// Features that are already implemented
	const implementedFeatures = [
		'bookings/month',
		'tour types',
		'Basic QR codes',
		'Email notifications',
		'Zaur branding visible',
		'Remove Zaur branding',
		'Email support',
		'Unlimited bookings',
		'Unlimited tour types',
		'Priority support'
	];
	
	function isFeatureImplemented(featureText: string): boolean {
		return implementedFeatures.some(f => featureText.toLowerCase().includes(f.toLowerCase()));
	}
</script>

{#snippet featureItem(text: string, icon: 'check' | 'x' = 'check', colorClass: string = '')}
	{@const isImplemented = isFeatureImplemented(text)}
	<li class="flex items-start gap-2">
		{#if icon === 'check'}
			<Check class="w-4 h-4 {colorClass} mt-0.5 flex-shrink-0" strokeWidth={2} />
		{:else}
			<X class="w-4 h-4 {colorClass} mt-0.5 flex-shrink-0" strokeWidth={2} />
		{/if}
		<span class="text-sm flex-1" style="color: var(--text-primary);">
			{text}
			{#if !isImplemented && icon === 'check'}
				<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-2" 
					style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-primary);">
					Coming Soon
				</span>
			{/if}
		</span>
	</li>
{/snippet}

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<div class="mb-8">
		<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Subscription Management</h1>
		<p style="color: var(--text-secondary);">Manage your Zaur subscription and billing</p>
	</div>

	{#if error}
		<div class="alert-error rounded-lg p-3 mb-4">
			<h3 class="font-medium">Error</h3>
			<p class="text-sm">{error}</p>
		</div>
	{/if}

	<!-- Early Access Notice -->
	<div class="alert-warning mb-6 p-4 rounded-lg">
		<div class="flex items-start gap-3">
			<AlertCircle class="w-5 h-5 mt-0.5 flex-shrink-0" style="color: var(--color-warning-600);" />
			<div class="flex-1">
				<h3 class="font-semibold mb-1">Early Access - Limited Time Pricing</h3>
				<p class="text-sm">
					Zaur is in early access. Join now at discounted rates and shape the future of tour management! 
					Some features are being actively developed and will be rolled out progressively.
				</p>
			</div>
		</div>
	</div>

	<!-- Promo Discount Banner -->
	{#if hasPromoDiscount}
		<div class="mb-6 p-4 rounded-lg border" style="background: var(--color-success-50); border-color: var(--color-success-200);">
			<div class="flex items-start gap-3">
				<Gift class="w-5 h-5 mt-0.5 flex-shrink-0" style="color: var(--color-success-600);" />
				<div class="flex-1">
					<h3 class="font-semibold mb-1" style="color: var(--color-success-900);">Special Offer Active!</h3>
					<p class="text-sm" style="color: var(--color-success-800);">
						{getPromoBenefitText()}
						{#if user?.promoCodeUsed}
							<span class="font-medium"> • Code: {user.promoCodeUsed}</span>
						{/if}
					</p>
					{#if isInFreePeriod && user?.subscriptionFreeUntil}
						<p class="text-xs mt-1" style="color: var(--color-success-700);">
							Free period ends on {formatDate(user.subscriptionFreeUntil)}
						</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<div class="mb-8 rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="flex items-start justify-between">
			<div>
				<div class="flex items-center gap-2 mb-2">
					<Crown class="w-5 h-5" style="color: var(--color-primary-600);" />
					<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Current Plan</h2>
				</div>
				<div class="space-y-1">
					<p class="text-2xl font-bold" style="color: var(--text-primary);">
						{SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.name || 'Free Starter'}
					</p>
					{#if subscriptionStatus && subscriptionStatus !== 'active'}
						<p class="text-sm font-medium" style="color: var(--color-warning-600);">
							Status: {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
						</p>
					{/if}
					{#if cancelAtPeriodEnd && currentPeriodEnd}
						<p class="text-sm" style="color: var(--color-warning-600);">
							Cancels on {formatDate(currentPeriodEnd)}
						</p>
					{:else if currentPeriodEnd && currentPlan !== 'free'}
						<p class="text-sm" style="color: var(--text-secondary);">
							Renews on {formatDate(currentPeriodEnd)}
						</p>
					{/if}
				</div>
			</div>
			
			<div class="flex gap-2">
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
							class="px-4 py-2 border rounded-md font-medium transition-colors disabled:opacity-50"
							style="border-color: var(--border-primary); color: var(--text-primary); background: var(--bg-primary);"
							onmouseenter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
							onmouseleave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
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
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
					<div>
						<p style="color: var(--text-secondary);">Monthly Bookings Used</p>
						<p class="font-medium" style="color: var(--text-primary);">
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
						<p class="font-medium" style="color: var(--text-primary);">
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
						<p class="font-medium" style="color: var(--text-primary);">
							{user.monthlyBookingsResetAt ? formatDate(user.monthlyBookingsResetAt) : 'Next month'}
						</p>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Upgrade Options -->
	{#if currentPlan !== 'agency'}
		<div class="mb-8">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Upgrade Your Plan</h2>
				
				<!-- Toggle -->
				<div class="p-1 rounded-lg inline-flex" style="background: var(--bg-secondary);">
					<button 
						class="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer {!isYearly ? 'shadow-sm' : ''}"
						style="{!isYearly ? 'background: var(--bg-primary); color: var(--text-primary);' : 'background: transparent; color: var(--text-secondary);'}"
						onclick={() => isYearly = false}
					>
						Monthly
					</button>
					<button 
						class="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer {isYearly ? 'shadow-sm' : ''}"
						style="{isYearly ? 'background: var(--bg-primary); color: var(--text-primary);' : 'background: transparent; color: var(--text-secondary);'}"
						onclick={() => isYearly = true}
					>
						Annual (Save 20%)
					</button>
				</div>
			</div>
			
			<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
				<!-- Free Starter (always show for reference) -->
				<div class="relative rounded-lg border p-6 flex flex-col h-full opacity-75" style="border-color: var(--border-primary); background: var(--bg-primary);">
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Free Starter</h3>
					<div class="mb-1">
						<span class="text-3xl font-bold" style="color: var(--text-primary);">€0</span>
						<span class="text-sm" style="color: var(--text-secondary);">/month</span>
					</div>
					<div class="mb-4 h-4"></div>
					
					<ul class="space-y-2 mb-6 flex-grow">
						{@render featureItem('3 bookings/month', 'check', 'icon-secondary')}
						{@render featureItem('1 tour type', 'check', 'icon-secondary')}
						{@render featureItem('Basic QR codes', 'check', 'icon-secondary')}
						{@render featureItem('Email notifications', 'check', 'icon-secondary')}
						{@render featureItem('Zaur branding visible', 'x', 'icon-danger')}
						{@render featureItem('No SMS notifications', 'x', 'icon-danger')}
						{@render featureItem('No analytics', 'x', 'icon-danger')}
					</ul>
					
					{#if currentPlan === 'free'}
						<button
							disabled
							class="w-full py-2 rounded-md font-medium cursor-not-allowed"
							style="background: var(--bg-tertiary); color: var(--text-tertiary); opacity: 0.6;"
						>
							Current Plan
						</button>
					{/if}
				</div>
				
				<!-- Solo Guide -->
				<div class="relative rounded-lg border-2 p-6 shadow-lg flex flex-col h-full" style="background: var(--bg-primary); border-color: var(--color-primary-500);">
					<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
						<span class="px-3 py-1 rounded-full text-xs font-medium" style="background: var(--color-primary-600); color: white;">Most Popular</span>
					</div>
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Solo Guide</h3>
					<div class="mb-1">
						{#if starterProPricing.savings > 0}
							<span class="text-lg line-through" style="color: var(--text-tertiary);">€{starterProPricing.original}</span>
							<span class="text-3xl font-bold ml-1" style="color: var(--text-primary);">€{starterProPricing.final}</span>
						{:else}
							<span class="text-3xl font-bold" style="color: var(--text-primary);">€{starterProPricing.final}</span>
						{/if}
						<span class="text-sm" style="color: var(--text-secondary);">{billingPeriod}</span>
					</div>
					<div class="mb-4 h-4">
						{#if starterProPricing.savings > 0}
							<span class="text-xs font-medium" style="color: var(--color-success-600);">
								{isInFreePeriod ? 'Free during trial period' : `Save €${starterProPricing.savings}/month with promo`}
							</span>
						{:else if isYearly}
							<span class="text-xs font-medium" style="color: var(--color-success-600);">
							Save €36/year
						</span>
						{/if}
					</div>
					
					<ul class="space-y-2 mb-6 flex-grow">
						{@render featureItem('60 bookings/month')}
						{@render featureItem('5 tour types')}
						{@render featureItem('Remove Zaur branding')}
						{@render featureItem('Custom logo & colors')}
						{@render featureItem('SMS notifications')}
						{@render featureItem('Basic analytics')}
						{@render featureItem('QR code customization')}
						{@render featureItem('Review collection prompts')}
						{@render featureItem('Email support')}
					</ul>
					
					<button
						onclick={() => upgradeSubscription('starter_pro', isYearly ? 'yearly' : 'monthly')}
						disabled={loading || currentPlan === 'starter_pro'}
						class="button-primary button--full-width"
					>
						{loading ? 'Processing...' : currentPlan === 'starter_pro' ? 'Current Plan' : 'Upgrade to Solo Guide'}
					</button>
				</div>
				
				<!-- Professional -->
				<div class="relative rounded-lg border p-6 flex flex-col h-full" style="border-color: var(--border-primary); background: var(--bg-primary);">
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Professional</h3>
					<div class="mb-1">
						{#if proPricing.savings > 0}
							<span class="text-lg line-through" style="color: var(--text-tertiary);">€{proPricing.original}</span>
							<span class="text-3xl font-bold ml-1" style="color: var(--text-primary);">€{proPricing.final}</span>
						{:else}
							<span class="text-3xl font-bold" style="color: var(--text-primary);">€{proPricing.final}</span>
						{/if}
						<span class="text-sm" style="color: var(--text-secondary);">{billingPeriod}</span>
					</div>
					<div class="mb-4 h-4">
						{#if proPricing.savings > 0}
							<span class="text-xs font-medium" style="color: var(--color-success-600);">
								{isInFreePeriod ? 'Free during trial period' : `Save €${proPricing.savings}/month with promo`}
							</span>
						{:else if isYearly}
							<span class="text-xs font-medium" style="color: var(--color-success-600);">
							Save €72/year
						</span>
						{/if}
					</div>
					
					<ul class="space-y-2 mb-6 flex-grow">
						{@render featureItem('Unlimited bookings')}
						{@render featureItem('Unlimited tour types')}
						{@render featureItem('Advanced analytics & insights')}
						{@render featureItem('WhatsApp notifications')}
						{@render featureItem('Calendar sync (Google/Outlook)')}
						{@render featureItem('Customer database export')}
						{@render featureItem('Review automation')}
						{@render featureItem('Multi-language booking pages')}
						{@render featureItem('Weather integration')}
						{@render featureItem('Cancellation management')}
						{@render featureItem('Priority support (24h response)')}
					</ul>
					
					<button
						onclick={() => upgradeSubscription('professional', isYearly ? 'yearly' : 'monthly')}
						disabled={loading || currentPlan === 'professional'}
						class="button-primary button--full-width"
					>
						{loading ? 'Processing...' : currentPlan === 'professional' ? 'Current Plan' : 'Upgrade to Professional'}
					</button>
				</div>
				
				<!-- Agency -->
				<div class="relative rounded-lg border p-6 flex flex-col h-full" style="border-color: var(--border-primary); background: var(--bg-primary);">
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Agency</h3>
					<div class="mb-1">
						{#if agencyPricing.savings > 0}
							<span class="text-lg line-through" style="color: var(--text-tertiary);">€{agencyPricing.original}</span>
							<span class="text-3xl font-bold ml-1" style="color: var(--text-primary);">€{agencyPricing.final}</span>
						{:else}
							<span class="text-3xl font-bold" style="color: var(--text-primary);">€{agencyPricing.final}</span>
						{/if}
						<span class="text-sm" style="color: var(--text-secondary);">{billingPeriod}</span>
					</div>
					<div class="mb-4 h-4">
						{#if agencyPricing.savings > 0}
							<span class="text-xs font-medium" style="color: var(--color-success-600);">
								{isInFreePeriod ? 'Free during trial period' : `Save €${agencyPricing.savings}/month with promo`}
							</span>
						{:else if isYearly}
							<span class="text-xs font-medium" style="color: var(--color-success-600);">
							Save €180/year
						</span>
						{/if}
					</div>
					
					<ul class="space-y-2 mb-6 flex-grow">
						{@render featureItem('Everything in Professional', 'check', 'icon-primary')}
						{@render featureItem('Up to 10 tour guides', 'check', 'icon-primary')}
						{@render featureItem('Team management dashboard', 'check', 'icon-primary')}
						{@render featureItem('Revenue sharing tools', 'check', 'icon-primary')}
						{@render featureItem('White-label options', 'check', 'icon-primary')}
						{@render featureItem('Custom domain (agency.zaur.app)', 'check', 'icon-primary')}
						{@render featureItem('Advanced reporting (ROI, conversion rates)', 'check', 'icon-primary')}
						{@render featureItem('API access', 'check', 'icon-primary')}
						{@render featureItem('Dedicated account manager', 'check', 'icon-primary')}
						{@render featureItem('Multi-location management', 'check', 'icon-primary')}
					</ul>
					
					<button
						onclick={() => upgradeSubscription('agency', isYearly ? 'yearly' : 'monthly')}
						disabled={loading || (user?.subscriptionPlan === 'agency')}
						class="button-primary button--full-width"
					>
						{loading ? 'Processing...' : (user?.subscriptionPlan === 'agency') ? 'Current Plan' : 'Upgrade to Agency'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div> 
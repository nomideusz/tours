<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { currentUser } from '$lib/stores/auth.js';
	import { auth } from '$lib/stores/auth.js';
	import type { SubscriptionPlan, BillingInterval } from '$lib/stripe-subscriptions.server.js';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Calendar from 'lucide-svelte/icons/calendar';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Crown from 'lucide-svelte/icons/crown';
	import Gift from 'lucide-svelte/icons/gift';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Activity from 'lucide-svelte/icons/activity';
	import type { PageData } from './$types.js';
	import ConfirmationModal from '$lib/components/modals/ConfirmationModal.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/layout/MobilePageHeader.svelte';
	import PromoCodeInput from '$lib/components/form/inputs/PromoCodeInput.svelte';
	import { PRICING_PLANS, type PricingPlan, isFeatureImplemented, calculatePlanPricing, type UserPricingContext } from '$lib/utils/pricing-config.js';
	
	let { data }: { data: PageData } = $props();
	
	let loading = $state(false);
	let error = $state<string | null>(null);
	let isYearly = $state(false);
	let showCancelModal = $state(false);
	let loadingPlanId = $state<string | null>(null); // Track which specific plan is loading
	
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
		const plan = PRICING_PLANS.find(plan => plan.id === planId);
		if (!plan) return null;
		
		// Return pricing structure
		// Note: yearly is the ANNUAL TOTAL (€250, €490), not monthly equivalent
		return {
			monthly: plan.basePrice.monthly,
			yearly: plan.basePrice.yearly
		};
	}
	
	// Check if user has promo benefits
	let hasPromoDiscount = $derived(user && (
		(user.subscriptionFreeUntil && new Date(user.subscriptionFreeUntil) > new Date()) ||
		(user.subscriptionDiscountPercentage && user.subscriptionDiscountPercentage > 0)
	));
	
	let isInFreePeriod = $derived(user && user.subscriptionFreeUntil && new Date(user.subscriptionFreeUntil) > new Date());
	let discountPercentage = $derived(user?.subscriptionDiscountPercentage || 0);
	let isLifetimeDiscount = $derived(user?.isLifetimeDiscount || false);
	
	// Get user context for pricing calculations
	let userPricingContext = $derived<UserPricingContext | undefined>(user ? {
		betaGroup: user.betaGroup,
		subscriptionFreeUntil: user.subscriptionFreeUntil,
		subscriptionDiscountPercentage: user.subscriptionDiscountPercentage,
		isLifetimeDiscount: user.isLifetimeDiscount,
		promoCodeUsed: user.promoCodeUsed
	} : undefined);
	
	// Calculate prices using unified function
	let starterProPricing = $derived(calculatePlanPricing('starter_pro', isYearly ? 'yearly' : 'monthly', userPricingContext));
	let proPricing = $derived(calculatePlanPricing('professional', isYearly ? 'yearly' : 'monthly', userPricingContext));
	
	let billingPeriod = $derived(isYearly ? '/month billed annually' : '/month');
	
	// Format price for display (show .50 but not .00)
	function formatPrice(price: number): string {
		if (price === 0) return '0';
		if (price % 1 === 0) return price.toString();
		return price.toFixed(2);
	}
	
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
	
	// Define plan hierarchy for upgrade logic
	// free = Free Starter (0)
	// starter_pro = Essential (1)
	// professional = Premium (2)
	const PLAN_HIERARCHY: Record<string, number> = {
		'free': 0,
		'starter_pro': 1,  // Essential
		'professional': 2   // Premium
	};
	
	function isUpgrade(targetPlan: string): boolean {
		const currentRank = PLAN_HIERARCHY[currentPlan] || 0;
		const targetRank = PLAN_HIERARCHY[targetPlan] || 0;
		return targetRank > currentRank;
	}
	
	// Refresh data on mount to ensure we have the latest subscription info
	onMount(async () => {
		// Invalidate all data to force a fresh load
		await invalidateAll();
	});
	
	async function upgradeSubscription(planId: SubscriptionPlan, billingInterval: BillingInterval) {
		if (!user?.id) return;
		
		loading = true;
		loadingPlanId = planId; // Track which plan is loading
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
			
			// Validate URL before redirecting
			if (!data.url) {
				throw new Error('No checkout URL received from server');
			}
			
			// Redirect to Stripe Checkout
			window.location.href = data.url;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			loading = false; // Reset loading state on error
			loadingPlanId = null;
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
			
			// Validate URL before redirecting
			if (!data.url) {
				throw new Error('No portal URL received from server');
			}
			
			// Redirect to Stripe Customer Portal
			window.location.href = data.url;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			loading = false; // Reset loading state on error
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
		showCancelModal = false; // Close modal before processing
		
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
			loading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			loading = false; // Reset loading state on error
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
			loading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			loading = false; // Reset loading state on error
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
	
	async function handlePromoCodeApplied(event: CustomEvent) {
		// Refresh the page to show updated promo code benefits
		await invalidateAll();
		
		// Also update the auth store with fresh user data
		try {
			const response = await fetch('/api/profile');
			if (response.ok) {
				const updatedUser = await response.json();
				auth.updateUser(updatedUser);
			}
		} catch (error) {
			console.error('Failed to refresh user data:', error);
		}
	}
	
	function handlePromoCodeError(event: CustomEvent) {
		error = event.detail.message;
	}
</script>

{#snippet featureItem(feature: import('$lib/utils/pricing-config.js').PricingFeature, colorClass: string = '')}
	{@const isImplemented = isFeatureImplemented(feature.text)}
	<li class="flex items-start gap-2">
		{#if feature.included}
			<Check class="w-4 h-4 {colorClass} mt-0.5 flex-shrink-0" />
			<span class="text-sm flex-1" style="color: var(--text-secondary);">
				{feature.text}
				{#if feature.comingSoon && !isImplemented}
					<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ml-2" 
						style="background: var(--bg-secondary); color: var(--text-tertiary); font-size: 0.65rem;">
						Coming Soon
					</span>
				{/if}
			</span>
		{:else}
			<X class="w-4 h-4 icon-danger mt-0.5 flex-shrink-0" />
			<span class="text-sm" style="color: var(--text-tertiary);">{feature.text}</span>
		{/if}
	</li>
{/snippet}

<div class="min-h-screen" style="background: var(--bg-primary);">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
		<!-- Header -->
		<div class="mb-8 sm:mb-12">
			<!-- Mobile Header -->
			<MobilePageHeader
				title="Subscription"
				secondaryInfo={SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.name || 'Trial Period'}
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
						value: SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.name || 'Trial'
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
			<div class="hidden sm:block text-center">
				<h1 class="text-3xl lg:text-4xl font-semibold mb-2" style="color: var(--text-primary);">
					Subscription Management
				</h1>
				<p class="text-base" style="color: var(--text-secondary); max-width: 600px; margin: 0 auto;">
					Manage your subscription and billing
				</p>
			</div>
		</div>

		{#if error}
			<div class="rounded-lg p-4 sm:p-5 mb-6 border" style="background: var(--bg-secondary); border-color: var(--color-error-500);">
				<div class="flex items-start gap-3">
					<AlertCircle class="w-5 h-5 flex-shrink-0" style="color: var(--color-error-600);" />
					<div class="flex-1">
						<h3 class="font-semibold mb-1 text-sm" style="color: var(--text-primary);">Error</h3>
						<p class="text-sm" style="color: var(--text-secondary);">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Beta 2 Special Notice -->
		{#if user?.betaGroup === 'beta_2'}
			<div class="mb-6 sm:mb-8 p-4 sm:p-5 rounded-lg border" style="background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--bg-secondary) 100%); border-color: var(--color-primary-500);">
				<div class="flex items-start gap-3">
					<Crown class="w-5 h-5 flex-shrink-0" style="color: var(--color-primary-600);" />
					<div class="flex-1">
						<h3 class="font-semibold mb-2 text-sm sm:text-base" style="color: var(--text-primary);">🎉 Beta 2 Member Benefits</h3>
						<div class="space-y-2 text-sm" style="color: var(--text-secondary);">
							<p class="flex items-center gap-2">
								<Check class="w-4 h-4 flex-shrink-0" style="color: var(--color-success-600);" />
								<span><strong>4 months free trial</strong> — Full Premium access, no credit card required</span>
							</p>
							<p class="flex items-center gap-2">
								<Check class="w-4 h-4 flex-shrink-0" style="color: var(--color-success-600);" />
								<span><strong>20% lifetime discount</strong> — €20/month (Essential) or €39/month (Premium) forever</span>
							</p>
							<p class="flex items-center gap-2">
								<Check class="w-4 h-4 flex-shrink-0" style="color: var(--color-success-600);" />
								<span><strong>Premium features unlocked</strong> — Use unlimited bookings, WhatsApp notifications, and more during trial</span>
							</p>
							{#if user?.subscriptionFreeUntil}
								<p class="flex items-center gap-2 mt-3 pt-3 border-t" style="border-color: var(--border-secondary);">
									<Calendar class="w-4 h-4 flex-shrink-0" style="color: var(--color-info-600);" />
									<span>Free trial ends: <strong>{formatDate(user.subscriptionFreeUntil)}</strong></span>
								</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{:else if user?.betaGroup === 'beta_1'}
			<div class="mb-6 sm:mb-8 p-4 sm:p-5 rounded-lg border" style="background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--bg-secondary) 100%); border-color: var(--color-primary-500);">
				<div class="flex items-start gap-3">
					<Crown class="w-5 h-5 flex-shrink-0" style="color: var(--color-primary-600);" />
					<div class="flex-1">
						<h3 class="font-semibold mb-2 text-sm sm:text-base" style="color: var(--text-primary);">🌟 Beta 1 Founding Member Benefits</h3>
						<div class="space-y-2 text-sm" style="color: var(--text-secondary);">
							<p class="flex items-center gap-2">
								<Check class="w-4 h-4 flex-shrink-0" style="color: var(--color-success-600);" />
								<span><strong>12 months free trial</strong> — Full Premium access</span>
							</p>
							<p class="flex items-center gap-2">
								<Check class="w-4 h-4 flex-shrink-0" style="color: var(--color-success-600);" />
								<span><strong>30% lifetime discount</strong> — €11.20/month (Essential) or €24.50/month (Premium) forever</span>
							</p>
							<p class="flex items-center gap-2">
								<Check class="w-4 h-4 flex-shrink-0" style="color: var(--color-success-600);" />
								<span><strong>Premium features unlocked</strong> — All features available during trial</span>
							</p>
							{#if user?.subscriptionFreeUntil}
								<p class="flex items-center gap-2 mt-3 pt-3 border-t" style="border-color: var(--border-secondary);">
									<Calendar class="w-4 h-4 flex-shrink-0" style="color: var(--color-info-600);" />
									<span>Free trial ends: <strong>{formatDate(user.subscriptionFreeUntil)}</strong></span>
								</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Early Access Notice -->
			<div class="mb-6 sm:mb-8 p-4 sm:p-5 rounded-lg border" style="background: var(--bg-secondary); border-color: var(--border-primary);">
				<div class="flex items-start gap-3">
					<AlertCircle class="w-5 h-5 flex-shrink-0" style="color: var(--color-primary-600);" />
					<div class="flex-1">
						<h3 class="font-semibold mb-1 text-sm sm:text-base" style="color: var(--text-primary);">Early Access</h3>
						<p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
							Zaur is in early access. Some features are being actively developed and will be rolled out progressively.
							Check our social media for special promo codes with exclusive discounts.
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Trial Period Info (for users in trial without promo code) -->
		{#if isInFreePeriod && !hasActivePromoCode && user?.subscriptionFreeUntil && subscriptionStatus === 'trialing'}
			<div class="mb-6 sm:mb-8 p-4 sm:p-5 rounded-lg border" style="background: var(--bg-secondary); border-color: var(--border-primary);">
				<div class="flex items-start gap-3">
					<Calendar class="w-5 h-5 flex-shrink-0" style="color: var(--color-info-600);" />
					<div class="flex-1">
						<h3 class="font-semibold mb-1 text-sm sm:text-base" style="color: var(--text-primary);">Trial Period Active</h3>
						<p class="text-sm mb-2" style="color: var(--text-secondary);">
							You're currently in a free trial period.
						</p>
						<p class="text-xs sm:text-sm" style="color: var(--text-tertiary);">
							Trial ends on {formatDate(user.subscriptionFreeUntil)} • After that, you'll be charged automatically
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Promo Code Benefits -->
		{#if hasActivePromoCode}
			<div class="mb-6 sm:mb-8 p-4 sm:p-5 rounded-lg border" style="background: var(--bg-secondary); border-color: var(--color-success-500);">
				<div class="flex items-start gap-3">
					<Gift class="w-5 h-5 flex-shrink-0" style="color: var(--color-success-600);" />
					<div class="flex-1">
						<h3 class="font-semibold mb-1 text-sm sm:text-base" style="color: var(--text-primary);">Promo Code Benefits Active</h3>
						<p class="text-sm mb-2" style="color: var(--text-secondary);">
							{getPromoBenefitText()}
							{#if user?.promoCodeUsed}
								<span class="font-medium ml-1"> Code: {user.promoCodeUsed}</span>
							{/if}
						</p>
						{#if isInFreePeriod && user?.subscriptionFreeUntil}
							<p class="text-xs sm:text-sm" style="color: var(--text-tertiary);">
								Free period ends on {formatDate(user.subscriptionFreeUntil)}
								{#if discountPercentage > 0 && isLifetimeDiscount}
									• After that, {discountPercentage}% lifetime discount applies to all payments
								{/if}
							</p>
						{:else if discountPercentage > 0 && isLifetimeDiscount}
							<p class="text-xs sm:text-sm" style="color: var(--text-tertiary);">
								This discount applies to all future payments
							</p>
						{/if}
					</div>
				</div>
			</div>
		{:else if currentPlan === 'free'}
			<!-- Promo Code Input for users without codes -->
			<div class="mb-6 sm:mb-8 p-4 sm:p-5 rounded-lg border" style="background: var(--bg-secondary); border-color: var(--border-primary);">
				<div class="flex items-start gap-3">
					<Gift class="w-5 h-5 flex-shrink-0" style="color: var(--color-primary-600);" />
					<div class="flex-1">
						<h3 class="font-semibold mb-1 text-sm sm:text-base" style="color: var(--text-primary);">Have a Promo Code?</h3>
						<p class="text-sm mb-4" style="color: var(--text-secondary);">
							Promo codes can provide free months, lifetime discounts, and more.
						</p>
						
						<PromoCodeInput 
							class="mb-3"
							on:applied={handlePromoCodeApplied}
							on:error={handlePromoCodeError}
						/>
						
						<p class="text-xs" style="color: var(--text-tertiary);">
							Follow us on social media for exclusive discount codes and special offers.
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Current Plan Card -->
		<div class="mb-8 sm:mb-12 rounded-lg p-5 sm:p-6 border" style="background: var(--bg-primary); border-color: var(--border-primary);">
			<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
				<div class="flex-1">
					<div class="flex items-center gap-3 mb-3">
						<Crown class="w-5 h-5" style="color: var(--color-primary-600);" />
						<div>
							<h2 class="text-xs sm:text-sm font-medium mb-0.5" style="color: var(--text-secondary);">Current Plan</h2>
							<p class="text-lg sm:text-xl font-semibold" style="color: var(--text-primary);">
								{SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.name || 'Trial Period'}
							</p>
						</div>
					</div>
					<div class="text-xs sm:text-sm" style="color: var(--text-secondary);">
						{#if subscriptionStatus === 'trialing' && isInFreePeriod && user?.subscriptionFreeUntil}
							<span>Trial Period • Ends {formatDate(user.subscriptionFreeUntil)}</span>
						{:else if subscriptionStatus && subscriptionStatus !== 'active'}
							<span>Status: {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}</span>
						{/if}
						{#if cancelAtPeriodEnd && currentPeriodEnd}
							<span>Cancels on {formatDate(currentPeriodEnd)}</span>
						{:else if currentPeriodEnd && currentPlan !== 'free' && subscriptionStatus !== 'trialing'}
							<span>Renews on {formatDate(currentPeriodEnd)}</span>
						{/if}
					</div>
				</div>
				
				<div class="flex flex-col sm:flex-row gap-2">
					{#if currentPlan !== 'free'}
						{#if cancelAtPeriodEnd}
							<button
								onclick={reactivateSubscription}
								disabled={loading}
								class="button-success"
							>
								{#if loading}
									<Loader2 class="w-4 h-4 animate-spin inline mr-2" />
									Processing...
								{:else}
									Reactivate
								{/if}
							</button>
						{:else}
							<button
								onclick={manageSubscription}
								disabled={loading}
								class="button-secondary"
							>
								{#if loading}
									<Loader2 class="w-4 h-4 animate-spin inline mr-2" />
									Loading...
								{:else}
									<CreditCard class="w-4 h-4 inline mr-2" />
									Manage Billing
								{/if}
							</button>
							<button
								onclick={cancelSubscription}
								disabled={loading}
								class="button-secondary button-danger-text"
							>
								Cancel
							</button>
						{/if}
					{/if}
				</div>
			</div>
			
			{#if user}
				<div class="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t" style="border-color: var(--border-primary);">
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div>
							<p class="text-xs font-medium mb-1" style="color: var(--text-secondary);">Monthly Bookings</p>
							<p class="text-lg font-semibold" style="color: var(--text-primary);">
								{user.monthlyBookingsUsed || 0}
								<span class="text-sm font-normal" style="color: var(--text-secondary);">
									{#if SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.monthlyBookingLimit}
										/ {SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.monthlyBookingLimit}
									{:else}
										/ Unlimited
									{/if}
								</span>
							</p>
						</div>
						<div>
							<p class="text-xs font-medium mb-1" style="color: var(--text-secondary);">Tours Created</p>
							<p class="text-lg font-semibold" style="color: var(--text-primary);">
								{data.usage?.tours?.used || 0}
								<span class="text-sm font-normal" style="color: var(--text-secondary);">
									{#if data.usage?.tours?.limit !== null}
										/ {data.usage.tours.limit}
									{:else}
										/ Unlimited
									{/if}
								</span>
							</p>
						</div>
						<div>
							<p class="text-xs font-medium mb-1" style="color: var(--text-secondary);">Next Reset</p>
							<p class="text-sm font-medium" style="color: var(--text-primary);">
								{user.monthlyBookingsResetAt ? formatDate(user.monthlyBookingsResetAt) : 'Next month'}
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Personal Discount Banner (if applicable) -->
		{#if hasPromoDiscount && !isInFreePeriod && discountPercentage > 0}
			<div class="mb-6 sm:mb-8 p-4 sm:p-5 rounded-lg border" style="background: var(--bg-secondary); border-color: var(--color-primary-500);">
				<div class="text-center">
					<h3 class="text-base sm:text-lg font-semibold mb-1" style="color: var(--text-primary);">
						Your Discount: {discountPercentage}% OFF
					</h3>
					<p class="text-sm" style="color: var(--text-secondary);">
						{#if isLifetimeDiscount}
							This lifetime discount is applied to all prices below
						{:else}
							This discount is applied to the prices below
						{/if}
					</p>
					{#if user?.promoCodeUsed}
						<p class="text-xs mt-2" style="color: var(--text-tertiary);">
							Promo code: {user.promoCodeUsed}
						</p>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Available Plans / Upgrade Options -->
		<div class="mb-8 sm:mb-10">
			<div class="text-center mb-6 sm:mb-8">
				<h2 class="text-xl sm:text-2xl font-semibold mb-2" style="color: var(--text-primary);">
					{#if currentPlan === 'professional'}
						Available Plans
					{:else if currentPlan === 'starter_pro'}
						Upgrade Options
					{:else}
						Choose a Plan
					{/if}
				</h2>
				<p class="text-sm mb-5" style="color: var(--text-secondary); max-width: 500px; margin-left: auto; margin-right: auto;">
					{#if hasPromoDiscount && discountPercentage > 0}
						Your {discountPercentage}% {isLifetimeDiscount ? 'lifetime' : ''} discount is applied to all prices
					{:else}
						Select the plan that fits your business needs
					{/if}
				</p>
				
				<!-- Billing Toggle -->
				<div class="inline-flex p-1 rounded-lg border" style="background: var(--bg-secondary); border-color: var(--border-primary);">
					<button 
						class="px-4 py-2 sm:px-5 sm:py-2.5 rounded-md text-sm font-medium transition-all duration-200 {!isYearly ? 'shadow-sm' : ''}"
						style="{!isYearly ? 'background: var(--bg-primary); color: var(--text-primary);' : 'background: transparent; color: var(--text-secondary);'}"
						onclick={() => isYearly = false}
					>
						Monthly
					</button>
					<button 
						class="px-4 py-2 sm:px-5 sm:py-2.5 rounded-md text-sm font-medium transition-all duration-200 {isYearly ? 'shadow-sm' : ''}"
						style="{isYearly ? 'background: var(--bg-primary); color: var(--text-primary);' : 'background: transparent; color: var(--text-secondary);'}"
						onclick={() => isYearly = true}
					>
						Annual
					</button>
				</div>
			</div>
			
			<!-- Pricing Cards Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
				{#each PRICING_PLANS as plan}
					{@const pricing = calculatePlanPricing(plan.id, isYearly ? 'yearly' : 'monthly', userPricingContext)}
					{@const isPopular = plan.popular}
					{@const isCurrent = currentPlan === plan.id}
					
					<div class="relative rounded-lg p-5 sm:p-6 flex flex-col h-full transition-all duration-200 {isPopular ? 'border-2' : 'border'}" 
						 style="background: var(--bg-primary); border-color: {isPopular ? 'var(--color-primary-500)' : 'var(--border-primary)'};">
					
						{#if isPopular}
							<div class="absolute -top-2.5 left-1/2 transform -translate-x-1/2">
								<span class="px-3 py-1 rounded-full text-xs font-semibold" style="background: var(--primary); color: white;">
									Most Popular
								</span>
							</div>
						{/if}
						
						{#if isCurrent}
							<div class="absolute -top-2.5 right-4">
								<span class="px-3 py-1 rounded-full text-xs font-semibold" style="background: var(--color-success-600); color: white;">
									Current
								</span>
							</div>
						{/if}
						
						<div class="mb-4 pb-4 border-b" style="border-color: var(--border-secondary);">
							<h3 class="text-lg sm:text-xl font-semibold" style="color: var(--text-primary);">{plan.name}</h3>
							<p class="text-sm mt-1" style="color: var(--text-secondary);">{plan.description}</p>
						</div>
						
						<div class="mb-4 text-center">
							{#if pricing.discountPercentage && pricing.discountPercentage > 0}
								<!-- User has discount applied -->
								<div class="mb-1">
									<span class="text-sm line-through" style="color: var(--text-tertiary);">€{formatPrice(pricing.original)}</span>
								</div>
								<div class="mb-1">
									<span class="text-3xl sm:text-4xl font-bold" style="color: var(--text-primary);">€{formatPrice(pricing.final)}</span>
									<span class="text-sm" style="color: var(--text-secondary);">/{isYearly ? 'year' : 'month'}</span>
								</div>
								<div class="text-xs font-medium px-2 py-1 rounded inline-block" style="background: var(--bg-secondary); color: var(--primary);">
									Save €{formatPrice(pricing.savings)} with {pricing.discountPercentage}% discount
								</div>
							{:else}
								<!-- Regular pricing (no discount) -->
								<div class="mb-1">
									<span class="text-3xl sm:text-4xl font-bold" style="color: var(--text-primary);">€{formatPrice(pricing.final)}</span>
									<span class="text-sm" style="color: var(--text-secondary);">/{isYearly ? 'year' : 'month'}</span>
								</div>
							{/if}
						</div>
						
						<div class="mb-4 min-h-[28px] flex items-center justify-center text-xs" style="color: var(--text-tertiary);">
							{#if pricing.discountPercentage && pricing.discountPercentage > 0 && pricing.isInFreePeriod}
								<span>Free during trial, then discounted price applies</span>
							{:else if pricing.discountPercentage && pricing.discountPercentage > 0 && pricing.isLifetimeDiscount}
								<span>Lifetime discount applied</span>
							{:else if pricing.discountPercentage && pricing.discountPercentage > 0}
								<span>Special discount applied</span>
							{:else if isYearly}
								{@const monthlyPricing = calculatePlanPricing(plan.id, 'monthly', userPricingContext)}
								{@const monthlySavings = monthlyPricing.final * 2}
								<span>Save €{formatPrice(monthlySavings)} with annual billing</span>
							{/if}
						</div>
						
						<ul class="space-y-2 mb-6 flex-grow">
							{#each plan.features.slice(0, 6) as feature}
								{@render featureItem(feature, isPopular ? 'icon-primary' : 'icon-secondary')}
							{/each}
						</ul>
						
						<div class="pt-4 border-t" style="border-color: var(--border-secondary);">
							<p class="text-xs text-center mb-3" style="color: var(--text-tertiary);">
								{plan.tourLimit === null ? 'Unlimited' : plan.tourLimit} tours • 
								{plan.monthlyBookingLimit === null ? 'Unlimited' : plan.monthlyBookingLimit} bookings/month
							</p>
							
							{#if isCurrent}
								<button
									disabled
									class="button-secondary button--full-width cursor-not-allowed opacity-60"
								>
									Current Plan
								</button>
							{:else if !isUpgrade(plan.id)}
								<button
									disabled
									class="button-secondary button--full-width cursor-not-allowed opacity-50"
								>
									Contact Support
								</button>
							{:else}
								{@const isThisPlanLoading = loadingPlanId === plan.id}
								<button
									onclick={() => upgradeSubscription(plan.id, isYearly ? 'yearly' : 'monthly')}
									disabled={loading}
									class="{isPopular ? 'button-primary' : 'button-secondary'} button--full-width"
								>
									{#if isThisPlanLoading}
										<Loader2 class="w-4 h-4 animate-spin inline mr-2" />
										Processing...
									{:else}
										Upgrade to {plan.name}
									{/if}
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
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
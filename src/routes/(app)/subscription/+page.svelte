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
	
	// Calculate prices - updated pricing
	let starterProPrice = $derived(isYearly ? 13 : 16); // €13/month when billed annually (19% off €16)
	let proPrice = $derived(isYearly ? 29 : 35); // €29/month when billed annually (17% off €35)
	let agencyPrice = $derived(isYearly ? 74 : 89); // €74/month when billed annually (17% off €89)
	let billingPeriod = $derived(isYearly ? '/month billed annually' : '/month');
	
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
</script>

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

	<!-- Current Plan Status -->
	<div class="mb-8 bg-white rounded-xl border border-gray-200 p-6">
		<div class="flex items-start justify-between">
			<div>
				<div class="flex items-center gap-2 mb-2">
					<Crown class="w-5 h-5 text-blue-600" />
					<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Current Plan</h2>
				</div>
				<div class="space-y-1">
					<p class="text-2xl font-bold" style="color: var(--text-primary);">
						{SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.name || 'Free Starter'}
					</p>
					{#if subscriptionStatus && subscriptionStatus !== 'active'}
						<p class="text-sm text-orange-600 font-medium">
							Status: {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
						</p>
					{/if}
					{#if cancelAtPeriodEnd && currentPeriodEnd}
						<p class="text-sm text-orange-600">
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
							class="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
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
							class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md font-medium transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
					{/if}
				{/if}
			</div>
		</div>
		
		{#if user}
			<div class="mt-4 pt-4 border-t border-gray-200">
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
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">3 bookings/month</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">1 tour type</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Basic QR codes</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Email notifications</span>
						</li>
						<li class="flex items-start gap-2">
							<X class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-secondary);">Zaur branding visible</span>
						</li>
						<li class="flex items-start gap-2">
							<X class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-secondary);">No SMS notifications</span>
						</li>
						<li class="flex items-start gap-2">
							<X class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-secondary);">No analytics</span>
						</li>
					</ul>
					
					{#if currentPlan === 'free'}
						<button
							disabled
							class="w-full py-2 bg-gray-300 text-gray-500 rounded-md font-medium cursor-not-allowed"
						>
							Current Plan
						</button>
					{/if}
				</div>
				
				<!-- Solo Guide -->
				<div class="relative rounded-lg border-2 border-blue-500 p-6 shadow-lg flex flex-col h-full" style="background: var(--bg-primary);">
					<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
						<span class="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">Most Popular</span>
					</div>
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Solo Guide</h3>
					<div class="mb-1">
						<span class="text-3xl font-bold" style="color: var(--text-primary);">€{starterProPrice}</span>
						<span class="text-sm" style="color: var(--text-secondary);">{billingPeriod}</span>
					</div>
					<div class="mb-4 h-4">
						<span class="text-xs text-green-600 font-medium transition-opacity duration-200 {isYearly ? 'opacity-100' : 'opacity-0'}">
							Save €36/year
						</span>
					</div>
					
					<ul class="space-y-2 mb-6 flex-grow">
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">60 bookings/month</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">5 tour types</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Remove Zaur branding</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Custom logo & colors</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">SMS notifications</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Basic analytics</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">QR code customization</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Review collection prompts</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Email support</span>
						</li>
					</ul>
					
					<button
						onclick={() => upgradeSubscription('starter_pro', isYearly ? 'yearly' : 'monthly')}
						disabled={loading || currentPlan === 'starter_pro'}
						class="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
					>
						{loading ? 'Processing...' : currentPlan === 'starter_pro' ? 'Current Plan' : 'Upgrade to Solo Guide'}
					</button>
				</div>
				
				<!-- Professional -->
				<div class="relative rounded-lg border p-6 flex flex-col h-full" style="border-color: var(--border-primary); background: var(--bg-primary);">
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Professional</h3>
					<div class="mb-1">
						<span class="text-3xl font-bold" style="color: var(--text-primary);">€{proPrice}</span>
						<span class="text-sm" style="color: var(--text-secondary);">{billingPeriod}</span>
					</div>
					<div class="mb-4 h-4">
						<span class="text-xs text-green-600 font-medium transition-opacity duration-200 {isYearly ? 'opacity-100' : 'opacity-0'}">
							Save €72/year
						</span>
					</div>
					
					<ul class="space-y-2 mb-6 flex-grow">
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Unlimited bookings</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Unlimited tour types</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Advanced analytics & insights</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">WhatsApp notifications</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Calendar sync (Google/Outlook)</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Customer database export</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Review automation</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Multi-language booking pages</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Weather integration</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Cancellation management</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Priority support (24h response)</span>
						</li>
					</ul>
					
					<button
						onclick={() => upgradeSubscription('professional', isYearly ? 'yearly' : 'monthly')}
						disabled={loading || currentPlan === 'professional'}
						class="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
					>
						{loading ? 'Processing...' : currentPlan === 'professional' ? 'Current Plan' : 'Upgrade to Professional'}
					</button>
				</div>
				
				<!-- Agency -->
				<div class="relative rounded-lg border p-6 flex flex-col h-full" style="border-color: var(--border-primary); background: var(--bg-primary);">
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Agency</h3>
					<div class="mb-1">
						<span class="text-3xl font-bold" style="color: var(--text-primary);">€{agencyPrice}</span>
						<span class="text-sm" style="color: var(--text-secondary);">{billingPeriod}</span>
					</div>
					<div class="mb-4 h-4">
						<span class="text-xs text-green-600 font-medium transition-opacity duration-200 {isYearly ? 'opacity-100' : 'opacity-0'}">
							Save €180/year
						</span>
					</div>
					
					<ul class="space-y-2 mb-6 flex-grow">
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Everything in Professional</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Up to 10 tour guides</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Team management dashboard</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Revenue sharing tools</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">White-label options</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Custom domain (agency.zaur.app)</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Advanced reporting (ROI, conversion rates)</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">API access</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Dedicated account manager</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-sm" style="color: var(--text-primary);">Multi-location management</span>
						</li>
					</ul>
					
					<button
						onclick={() => upgradeSubscription('agency', isYearly ? 'yearly' : 'monthly')}
						disabled={loading || (user?.subscriptionPlan === 'agency')}
						class="w-full py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
					>
						{loading ? 'Processing...' : (user?.subscriptionPlan === 'agency') ? 'Current Plan' : 'Upgrade to Agency'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div> 
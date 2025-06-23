<script lang="ts">
	import { onMount } from 'svelte';
	import { currentUser } from '$lib/stores/auth.js';
	import type { SubscriptionPlan, BillingInterval } from '$lib/stripe-subscriptions.server.js';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Calendar from 'lucide-svelte/icons/calendar';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Crown from 'lucide-svelte/icons/crown';
	
	let loading = $state(false);
	let error = $state<string | null>(null);
	let isYearly = $state(false);
	
	// Client-side subscription plans data - updated with new limits
	const SUBSCRIPTION_PLANS = {
		free: {
			name: 'Free Starter',
			monthlyBookingLimit: 5,
			tourLimit: 1
		},
		starter_pro: {
			name: 'Solo Guide', 
			monthlyBookingLimit: 25,
			tourLimit: 3
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
	
	// Calculate prices - updated prices
	let starterProPrice = $derived(isYearly ? 16 : 19); // €16/month when billed annually (16% off €19)
	let proPrice = $derived(isYearly ? 33 : 39); // €33/month when billed annually (15% off €39)
	let agencyPrice = $derived(isYearly ? 83 : 99); // €83/month when billed annually (16% off €99)
	let billingPeriod = $derived(isYearly ? '/month billed annually' : '/month');
	
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
			window.location.reload();
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
			window.location.reload();
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
		<h1 class="text-2xl font-bold text-gray-900 mb-2">Subscription Management</h1>
		<p class="text-gray-600">Manage your Zaur subscription and billing</p>
	</div>

	{#if error}
		<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
			<AlertCircle class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
			<div>
				<h3 class="font-medium text-red-800">Error</h3>
				<p class="text-red-700 text-sm">{error}</p>
			</div>
		</div>
	{/if}

	<!-- Current Plan Status -->
	<div class="mb-8 bg-white rounded-xl border border-gray-200 p-6">
		<div class="flex items-start justify-between">
			<div>
				<div class="flex items-center gap-2 mb-2">
					<Crown class="w-5 h-5 text-blue-600" />
					<h2 class="text-lg font-semibold text-gray-900">Current Plan</h2>
				</div>
				<div class="space-y-1">
					<p class="text-2xl font-bold text-gray-900">
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
						<p class="text-sm text-gray-600">
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
							class="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
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
						<p class="text-gray-600">Monthly Bookings Used</p>
						<p class="font-medium">
							{user.monthlyBookingsUsed || 0}
							{#if SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.monthlyBookingLimit}
								/ {SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.monthlyBookingLimit}
							{:else}
								/ Unlimited
							{/if}
						</p>
					</div>
					<div>
						<p class="text-gray-600">Tours Created</p>
						<p class="font-medium">
							<!-- This would need to be fetched from the database -->
							- / {SUBSCRIPTION_PLANS[currentPlan as SubscriptionPlan]?.tourLimit || 'Unlimited'}
						</p>
					</div>
					<div>
						<p class="text-gray-600">Next Reset</p>
						<p class="font-medium">
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
				<h2 class="text-xl font-semibold text-gray-900">Upgrade Your Plan</h2>
				
				<!-- Toggle -->
				<div class="bg-gray-100 p-1 rounded-lg inline-flex">
					<button 
						class="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer {!isYearly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'}"
						onclick={() => isYearly = false}
					>
						Monthly
					</button>
					<button 
						class="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer {isYearly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'}"
						onclick={() => isYearly = true}
					>
						Annual (Save 20%)
					</button>
				</div>
			</div>
			
			<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#if currentPlan === 'free'}
					<!-- Solo Guide -->
					<div class="relative rounded-lg border border-gray-200 p-6 bg-white">
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Solo Guide</h3>
						<div class="mb-1">
							<span class="text-3xl font-bold text-gray-900">€{starterProPrice}</span>
							<span class="text-gray-600 text-sm">{billingPeriod}</span>
						</div>
						<div class="mb-4 h-4">
							<span class="text-xs text-green-600 font-medium transition-opacity duration-200 {isYearly ? 'opacity-100' : 'opacity-0'}">
								Save €36/year
							</span>
						</div>
						
						<ul class="space-y-2 mb-6">
							<li class="flex items-start gap-2">
								<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
								<span class="text-gray-700 text-sm">25 bookings/month</span>
							</li>
							<li class="flex items-start gap-2">
								<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
								<span class="text-gray-700 text-sm">3 tour types</span>
							</li>
							<li class="flex items-start gap-2">
								<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
								<span class="text-gray-700 text-sm">Custom branding (logo, colors)</span>
							</li>
							<li class="flex items-start gap-2">
								<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
								<span class="text-gray-700 text-sm">SMS notifications</span>
							</li>
							<li class="flex items-start gap-2">
								<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
								<span class="text-gray-700 text-sm">QR code customization</span>
							</li>
							<li class="flex items-start gap-2">
								<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
								<span class="text-gray-700 text-sm">Basic analytics</span>
							</li>
							<li class="flex items-start gap-2">
								<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
								<span class="text-gray-700 text-sm">Email support</span>
							</li>
						</ul>
						
						<button
							onclick={() => upgradeSubscription('starter_pro', isYearly ? 'yearly' : 'monthly')}
							disabled={loading}
							class="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
						>
							{loading ? 'Processing...' : 'Upgrade to Solo Guide'}
						</button>
					</div>
				{/if}
				
				<!-- Professional -->
				<div class="relative rounded-lg border-2 border-blue-500 p-6 bg-white shadow-lg">
					<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
						<span class="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">Most Popular</span>
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Professional</h3>
					<div class="mb-1">
						<span class="text-3xl font-bold text-gray-900">€{proPrice}</span>
						<span class="text-gray-600 text-sm">{billingPeriod}</span>
					</div>
					<div class="mb-4 h-4">
						<span class="text-xs text-green-600 font-medium transition-opacity duration-200 {isYearly ? 'opacity-100' : 'opacity-0'}">
							Save €72/year
						</span>
					</div>
					
					<ul class="space-y-2 mb-6">
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Unlimited bookings</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Unlimited tour types</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Advanced analytics & reporting</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">WhatsApp notifications</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Customer database export</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Review collection automation</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Priority support (24h response)</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Google Calendar integration</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Multi-language booking pages</span>
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
				<div class="relative rounded-lg border border-gray-200 p-6 bg-white">
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Agency</h3>
					<div class="mb-1">
						<span class="text-3xl font-bold text-gray-900">€{agencyPrice}</span>
						<span class="text-gray-600 text-sm">{billingPeriod}</span>
					</div>
					<div class="mb-4 h-4">
						<span class="text-xs text-green-600 font-medium transition-opacity duration-200 {isYearly ? 'opacity-100' : 'opacity-0'}">
							Save €192/year
						</span>
					</div>
					
					<ul class="space-y-2 mb-6">
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Everything in Professional</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Up to 10 tour guides</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Team management dashboard</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Revenue sharing tools</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">API access for custom integrations</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">White-label options</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Custom domain (agency.zaur.app)</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Dedicated account manager</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
							<span class="text-gray-700 text-sm">Advanced reporting (ROI, conversion rates)</span>
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
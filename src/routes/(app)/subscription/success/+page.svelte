<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { browser } from '$app/environment';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	
	let loading = $state(true);
	let error = $state<string | null>(null);
	let sessionId = $state<string | null>(null);
	let subscriptionDetails = $state<any>(null);
	let retryCount = $state(0);
	const maxRetries = 5;
	const retryDelay = 2000; // 2 seconds
	
	async function verifySubscription(sessionId: string): Promise<boolean> {
		try {
			const response = await fetch('/api/subscriptions/verify-session', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ sessionId })
			});
			
			if (!response.ok) {
				const data = await response.json();
				// If subscription not found yet, might need to retry
				if (response.status === 400 && retryCount < maxRetries) {
					return false;
				}
				throw new Error(data.error || 'Failed to verify subscription');
			}
			
			subscriptionDetails = await response.json();
			return true;
		} catch (err) {
			if (retryCount < maxRetries) {
				return false;
			}
			throw err;
		}
	}
	
	onMount(async () => {
		if (!browser) return;
		
		sessionId = $page.url.searchParams.get('session_id');
		
		if (!sessionId) {
			error = 'No session ID provided';
			loading = false;
			return;
		}
		
		// Try to verify subscription with retries
		try {
			let verified = false;
			
			while (!verified && retryCount < maxRetries) {
				verified = await verifySubscription(sessionId);
				
				if (!verified) {
					retryCount++;
					// Wait before retrying
					await new Promise(resolve => setTimeout(resolve, retryDelay));
				}
			}
			
			if (!verified) {
				throw new Error('Subscription verification timed out. Please check your subscription page.');
			}
			
			// Force refresh of all data including user session
			await invalidateAll();
			
			loading = false;
		} catch (err) {
			console.error('Error verifying subscription:', err);
			error = err instanceof Error ? err.message : 'Failed to verify subscription';
			loading = false;
		}
	});
	
	async function goToDashboard() {
		// Invalidate all data to ensure fresh load
		await invalidateAll();
		goto('/dashboard');
	}
	
	async function goToSubscription() {
		// Invalidate all data to ensure fresh load
		await invalidateAll();
		goto('/subscription');
	}
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<div class="max-w-md mx-auto">
		{#if loading}
			<div class="text-center">
				<Loader2 class="h-12 w-12 animate-spin mx-auto mb-4" style="color: var(--color-primary-600);" />
				<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Processing your subscription...</h1>
				<p style="color: var(--text-secondary);">
					Please wait while we set up your account.
					{#if retryCount > 0}
						<br />
						<span class="text-sm">Verifying payment... (attempt {retryCount}/{maxRetries})</span>
					{/if}
				</p>
			</div>
		{:else if error}
			<div class="text-center">
				<div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style="background: var(--color-error-100);">
					<AlertCircle class="w-6 h-6" style="color: var(--color-error-600);" />
				</div>
				<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Something went wrong</h1>
				<p class="mb-6" style="color: var(--text-secondary);">{error}</p>
				<button
					onclick={goToSubscription}
					class="button-secondary"
				>
					Back to Subscription
				</button>
			</div>
		{:else}
			<div class="text-center">
				<div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style="background: var(--color-success-100);">
					<CheckCircle class="w-8 h-8" style="color: var(--color-success-600);" />
				</div>
				
				<h1 class="text-3xl font-bold mb-4" style="color: var(--text-primary);">Subscription Activated!</h1>
				<p class="text-lg mb-8" style="color: var(--text-secondary);">
					Your subscription has been set up successfully. 
				</p>
				
				{#if subscriptionDetails?.planName}
					<div class="mb-8 p-6 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
						<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Your new plan</h3>
						<p class="text-2xl font-bold mb-2" style="color: var(--color-primary-600);">{subscriptionDetails.planName}</p>
						<p class="text-sm" style="color: var(--text-secondary);">
							{subscriptionDetails.interval === 'year' ? 'Billed annually' : 'Billed monthly'}
						</p>
					</div>
				{/if}
				
				<div class="space-y-3">
					<button
						onclick={goToDashboard}
						class="button-primary button--full-width button-gap"
					>
						Go to Dashboard
						<ArrowRight class="w-4 h-4" />
					</button>
					
					<button
						onclick={goToSubscription}
						class="button-secondary button--full-width"
					>
						View Subscription Details
					</button>
				</div>
			</div>
		{/if}
	</div>
</div> 
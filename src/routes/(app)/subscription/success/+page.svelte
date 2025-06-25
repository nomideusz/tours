<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	
	let loading = $state(true);
	let error = $state<string | null>(null);
	let sessionId = $state<string | null>(null);
	
	onMount(() => {
		sessionId = $page.url.searchParams.get('session_id');
		
		if (!sessionId) {
			error = 'No session ID provided';
			loading = false;
			return;
		}
		
		// Give Stripe webhook time to process
		setTimeout(() => {
			loading = false;
		}, 2000);
	});
	
	function goToDashboard() {
		goto('/dashboard');
	}
	
	function goToSubscription() {
		goto('/subscription');
	}
</script>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<div class="max-w-md mx-auto">
		{#if loading}
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
				<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Processing your subscription...</h1>
				<p style="color: var(--text-secondary);">Please wait while we set up your account.</p>
			</div>
		{:else if error}
			<div class="text-center">
				<div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</div>
				<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Something went wrong</h1>
				<p class="mb-6" style="color: var(--text-secondary);">{error}</p>
				<button
					onclick={goToSubscription}
					class="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
				>
					Back to Subscription
				</button>
			</div>
		{:else}
			<div class="text-center">
				<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
					<CheckCircle class="w-8 h-8 text-green-600" />
				</div>
				
				<h1 class="text-3xl font-bold mb-4" style="color: var(--text-primary);">Welcome to Zaur!</h1>
				<p class="text-lg mb-8" style="color: var(--text-secondary);">
					Your subscription has been activated successfully. You can now enjoy all the features of your new plan.
				</p>
				
				<div class="space-y-4">
					<button
						onclick={goToDashboard}
						class="w-full px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
					>
						Go to Dashboard
						<ArrowRight class="w-4 h-4" />
					</button>
					
					<button
						onclick={goToSubscription}
						class="w-full px-6 py-3 border rounded-md font-medium transition-colors"
						style="border-color: var(--border-primary); color: var(--text-primary); background: var(--bg-primary);"
						onmouseenter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
						onmouseleave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
					>
						Manage Subscription
					</button>
				</div>
				
				<div class="mt-8 p-4 bg-blue-50 rounded-lg">
					<h3 class="font-medium text-blue-900 mb-2">What's next?</h3>
					<ul class="text-sm text-blue-800 space-y-1 text-left">
						<li>• Create your first tour</li>
						<li>• Set up your QR codes</li>
						<li>• Start accepting bookings</li>
						<li>• Explore advanced features</li>
					</ul>
				</div>
			</div>
		{/if}
	</div>
</div> 
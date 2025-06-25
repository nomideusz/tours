<script lang="ts">
	import { currentUser } from '$lib/stores/auth.js';
	import PromoStatusBanner from '$lib/components/PromoStatusBanner.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	
	// Get current user from store
	let user = $derived($currentUser);
	
	// Also fetch fresh profile data
	const profileQuery = createQuery({
		queryKey: queryKeys.profile,
		queryFn: queryFunctions.fetchProfile,
		staleTime: 0,
		refetchInterval: 2000 // Refresh every 2 seconds for testing
	});
	
	let profileData = $derived($profileQuery.data);
</script>

<div class="max-w-screen-2xl mx-auto px-6 py-8">
	<h1 class="text-2xl font-bold mb-8">Promo Status Debug Page</h1>
	
	<div class="space-y-6">
		<!-- Auth Store Data -->
		<div class="rounded-lg border p-6" style="background: var(--bg-primary); border-color: var(--border-primary);">
			<h2 class="text-lg font-semibold mb-4">Auth Store Data (from layout)</h2>
			{#if user}
				<div class="space-y-2 text-sm">
					<p><strong>Email:</strong> {user.email}</p>
					<p><strong>Plan:</strong> {user.subscriptionPlan || 'not set'}</p>
					<p><strong>Promo Code:</strong> {user.promoCodeUsed || 'none'}</p>
					<p><strong>Discount %:</strong> {user.subscriptionDiscountPercentage ?? 'not set'}</p>
					<p><strong>Free Until:</strong> {user.subscriptionFreeUntil || 'not set'}</p>
					<p><strong>Lifetime Discount:</strong> {user.isLifetimeDiscount ? 'Yes' : 'No'}</p>
					<p><strong>Early Access:</strong> {user.earlyAccessMember ? 'Yes' : 'No'}</p>
				</div>
			{:else}
				<p>No user data in auth store</p>
			{/if}
		</div>
		
		<!-- Profile API Data -->
		<div class="rounded-lg border p-6" style="background: var(--bg-primary); border-color: var(--border-primary);">
			<h2 class="text-lg font-semibold mb-4">Profile API Data (fresh fetch)</h2>
			{#if $profileQuery.isLoading}
				<p>Loading...</p>
			{:else if profileData}
				<div class="space-y-2 text-sm">
					<p><strong>Email:</strong> {profileData.email}</p>
					<p><strong>Plan:</strong> {profileData.subscriptionPlan || 'not set'}</p>
					<p><strong>Promo Code:</strong> {profileData.promoCodeUsed || 'none'}</p>
					<p><strong>Discount %:</strong> {profileData.subscriptionDiscountPercentage ?? 'not set'}</p>
					<p><strong>Free Until:</strong> {profileData.subscriptionFreeUntil || 'not set'}</p>
					<p><strong>Lifetime Discount:</strong> {profileData.isLifetimeDiscount ? 'Yes' : 'No'}</p>
					<p><strong>Early Access:</strong> {profileData.earlyAccessMember ? 'Yes' : 'No'}</p>
				</div>
			{:else}
				<p>No profile data</p>
			{/if}
		</div>
		
		<!-- Banner Test -->
		<div class="rounded-lg border p-6" style="background: var(--bg-primary); border-color: var(--border-primary);">
			<h2 class="text-lg font-semibold mb-4">Banner Variants</h2>
			<div class="space-y-4">
				<div>
					<p class="text-sm mb-2">Compact:</p>
					<PromoStatusBanner variant="compact" />
				</div>
				<div>
					<p class="text-sm mb-2">Default:</p>
					<PromoStatusBanner />
				</div>
				<div>
					<p class="text-sm mb-2">Detailed:</p>
					<PromoStatusBanner variant="detailed" />
				</div>
			</div>
		</div>
		
		<!-- Conditions Check -->
		<div class="rounded-lg border p-6" style="background: var(--bg-primary); border-color: var(--border-primary);">
			<h2 class="text-lg font-semibold mb-4">Banner Display Conditions</h2>
			{#if user}
				<div class="space-y-2 text-sm">
					<p>
						<strong>Has promo code:</strong> 
						<span class="{user.promoCodeUsed ? 'text-green-600' : 'text-red-600'}">
							{user.promoCodeUsed ? '✓ Yes' : '✗ No'}
						</span>
					</p>
					<p>
						<strong>Has discount > 0:</strong> 
						<span class="{(user.subscriptionDiscountPercentage ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}">
							{(user.subscriptionDiscountPercentage ?? 0) > 0 ? '✓ Yes' : '✗ No'}
						</span>
					</p>
					<p>
						<strong>Has free period:</strong> 
						<span class="{user.subscriptionFreeUntil && new Date(user.subscriptionFreeUntil) > new Date() ? 'text-green-600' : 'text-red-600'}">
							{user.subscriptionFreeUntil && new Date(user.subscriptionFreeUntil) > new Date() ? '✓ Yes' : '✗ No'}
						</span>
					</p>
					<p class="mt-4 font-semibold">
						<strong>Should show banner:</strong> 
						<span class="{(user.promoCodeUsed || (user.subscriptionDiscountPercentage ?? 0) > 0 || (user.subscriptionFreeUntil && new Date(user.subscriptionFreeUntil) > new Date())) ? 'text-green-600' : 'text-red-600'}">
							{(user.promoCodeUsed || (user.subscriptionDiscountPercentage ?? 0) > 0 || (user.subscriptionFreeUntil && new Date(user.subscriptionFreeUntil) > new Date())) ? '✓ YES' : '✗ NO'}
						</span>
					</p>
				</div>
			{:else}
				<p>No user data</p>
			{/if}
		</div>
	</div>
</div> 
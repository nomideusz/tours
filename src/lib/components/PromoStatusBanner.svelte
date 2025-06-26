<script lang="ts">
	import { currentUser } from '$lib/stores/auth.js';
	import Gift from 'lucide-svelte/icons/gift';
	import Calendar from 'lucide-svelte/icons/calendar';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Crown from 'lucide-svelte/icons/crown';
	import X from 'lucide-svelte/icons/x';

	// Props
	let {
		variant = 'default', // 'default' | 'compact' | 'detailed'
		showDismiss = false,
		onDismiss = () => {}
	} = $props<{
		variant?: 'default' | 'compact' | 'detailed';
		showDismiss?: boolean;
		onDismiss?: () => void;
	}>();

	// Get current user
	let user = $derived($currentUser);

	// Check if user has any promo benefits
	let hasPromoBenefits = $derived(
		user && (
			(user.subscriptionFreeUntil && new Date(user.subscriptionFreeUntil) > new Date()) ||
			(user.subscriptionDiscountPercentage && user.subscriptionDiscountPercentage > 0)
		)
	);

	// Calculate promo details
	let isInFreeTrial = $derived(
		user && user.subscriptionFreeUntil && new Date(user.subscriptionFreeUntil) > new Date()
	);

	let freeTrialDaysLeft = $derived(
		isInFreeTrial && user?.subscriptionFreeUntil
			? Math.ceil((new Date(user.subscriptionFreeUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
			: 0
	);

	let discountPercentage = $derived(user?.subscriptionDiscountPercentage || 0);
	let isLifetimeDiscount = $derived(user?.isLifetimeDiscount || false);
	let isEarlyAccess = $derived(user?.earlyAccessMember || false);
	let promoCode = $derived(user?.promoCodeUsed || '');

	// Format benefit text
	let benefitText = $derived(
		[
			isInFreeTrial ? `Free trial: ${freeTrialDaysLeft} day${freeTrialDaysLeft !== 1 ? 's' : ''} remaining` : '',
			discountPercentage === 100 ? 'Free forever' :
			discountPercentage > 0 ? `${discountPercentage}% ${isLifetimeDiscount ? 'lifetime' : ''} discount` : ''
		].filter(Boolean).join(' • ')
	);



	// Get color scheme based on benefit type - using alert classes for proper dark mode support
	let colorScheme = $derived(
		discountPercentage === 100 ? {
			className: 'alert-info',
			iconColor: 'var(--color-purple-600)'
		} : isEarlyAccess ? {
			className: 'alert-primary', 
			iconColor: 'var(--color-primary-600)'
		} : {
			className: 'alert-success',
			iconColor: 'var(--color-success-600)'
		}
	);
</script>

{#if hasPromoBenefits}
	{#if variant === 'compact'}
		<!-- Compact variant for headers/small spaces -->
		<div class="{colorScheme.className} inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs">
			<span class="alert-icon-wrapper">
				{#if discountPercentage === 100}
					<Crown size={14} />
				{:else if isEarlyAccess}
					<TrendingUp size={14} />
				{:else if isInFreeTrial}
					<Calendar size={14} />
				{:else}
					<Gift size={14} />
				{/if}
			</span>
			<span>{benefitText}</span>
		</div>
	{:else if variant === 'detailed'}
		<!-- Detailed variant for profile/subscription pages -->
		<div class="{colorScheme.className} rounded-lg p-3 sm:p-4">
			<div class="flex items-start gap-2.5 sm:gap-3">
				<div class="alert-icon-wrapper p-1.5 sm:p-2 rounded-lg flex-shrink-0">
					{#if discountPercentage === 100}
						<Crown class="h-5 w-5 sm:h-6 sm:w-6" />
					{:else if isEarlyAccess}
						<TrendingUp class="h-5 w-5 sm:h-6 sm:w-6" />
					{:else if isInFreeTrial}
						<Calendar class="h-5 w-5 sm:h-6 sm:w-6" />
					{:else}
						<Gift class="h-5 w-5 sm:h-6 sm:w-6" />
					{/if}
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="alert-heading">
						{#if isEarlyAccess}
							Early Access Member
						{:else if discountPercentage === 100}
							Partner Benefits Active
						{:else}
							Promotional Offer Active
						{/if}
					</h3>
					<p class="alert-body mb-1.5 sm:mb-2">
						{benefitText}
					</p>
					{#if promoCode}
						<p class="alert-body text-xs opacity-90">
							Promo code: <span class="font-mono font-medium">{promoCode}</span>
						</p>
					{/if}
					{#if isInFreeTrial && freeTrialDaysLeft <= 7}
						<p class="text-xs mt-2 font-medium" style="color: var(--color-warning-600);">
							⚠️ Your free trial expires soon. Subscribe to continue using all features.
						</p>
					{/if}
				</div>
				{#if showDismiss}
					<button 
						onclick={onDismiss}
						class="p-1 -mr-1 -mt-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
						aria-label="Dismiss">
						<X class="h-4 w-4 opacity-60" />
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Default variant for dashboard/general use -->
		<div class="{colorScheme.className} rounded-lg p-2.5 sm:p-3">
			<div class="flex items-center gap-2 sm:gap-3">
				<span class="alert-icon-wrapper">
					{#if discountPercentage === 100}
						<Crown class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
					{:else if isEarlyAccess}
						<TrendingUp class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
					{:else if isInFreeTrial}
						<Calendar class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
					{:else}
						<Gift class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
					{/if}
				</span>
				<div class="flex-1 min-w-0">
					<p class="text-xs sm:text-sm font-medium">
						<span class="block sm:inline">{benefitText}</span>
						{#if promoCode}
							<span class="font-normal opacity-90">
								<span class="hidden sm:inline"> • </span>
								<span class="block sm:inline text-xs">Code: {promoCode}</span>
							</span>
						{/if}
					</p>
				</div>
				{#if showDismiss}
					<button 
						onclick={onDismiss}
						class="p-1 -mr-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
						aria-label="Dismiss">
						<X class="h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-60" />
					</button>
				{/if}
			</div>
		</div>
	{/if}
{/if} 
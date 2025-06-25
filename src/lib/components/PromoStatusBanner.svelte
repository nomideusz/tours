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



	// Get color scheme based on benefit type
	let colorScheme = $derived(
		discountPercentage === 100 ? {
			bg: 'var(--color-purple-50)',
			border: 'var(--color-purple-200)',
			icon: 'var(--color-purple-600)',
			text: 'var(--color-purple-900)',
			secondary: 'var(--color-purple-800)'
		} : isEarlyAccess ? {
			bg: 'var(--color-primary-50)',
			border: 'var(--color-primary-200)',
			icon: 'var(--color-primary-600)',
			text: 'var(--color-primary-900)',
			secondary: 'var(--color-primary-800)'
		} : {
			bg: 'var(--color-success-50)',
			border: 'var(--color-success-200)',
			icon: 'var(--color-success-600)',
			text: 'var(--color-success-900)',
			secondary: 'var(--color-success-800)'
		}
	);
</script>

{#if hasPromoBenefits}
	{#if variant === 'compact'}
		<!-- Compact variant for headers/small spaces -->
		<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm" 
			style="background: {colorScheme.bg}; border-color: {colorScheme.border};">
							{#if discountPercentage === 100}
					<Crown size={14} style="color: {colorScheme.icon};" />
				{:else if isEarlyAccess}
					<TrendingUp size={14} style="color: {colorScheme.icon};" />
				{:else if isInFreeTrial}
					<Calendar size={14} style="color: {colorScheme.icon};" />
				{:else}
					<Gift size={14} style="color: {colorScheme.icon};" />
				{/if}
			<span style="color: {colorScheme.text};">{benefitText}</span>
		</div>
	{:else if variant === 'detailed'}
		<!-- Detailed variant for profile/subscription pages -->
		<div class="rounded-lg border p-3 sm:p-4" style="background: {colorScheme.bg}; border-color: {colorScheme.border};">
			<div class="flex items-start gap-2.5 sm:gap-3">
				<div class="p-1.5 sm:p-2 rounded-lg flex-shrink-0" style="background: {colorScheme.icon}20;">
					{#if discountPercentage === 100}
						<Crown class="h-5 w-5 sm:h-6 sm:w-6" style="color: {colorScheme.icon};" />
					{:else if isEarlyAccess}
						<TrendingUp class="h-5 w-5 sm:h-6 sm:w-6" style="color: {colorScheme.icon};" />
					{:else if isInFreeTrial}
						<Calendar class="h-5 w-5 sm:h-6 sm:w-6" style="color: {colorScheme.icon};" />
					{:else}
						<Gift class="h-5 w-5 sm:h-6 sm:w-6" style="color: {colorScheme.icon};" />
					{/if}
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="text-sm sm:text-base font-semibold mb-1" style="color: {colorScheme.text};">
						{#if isEarlyAccess}
							Early Access Member
						{:else if discountPercentage === 100}
							Partner Benefits Active
						{:else}
							Promotional Offer Active
						{/if}
					</h3>
					<p class="text-xs sm:text-sm mb-1.5 sm:mb-2" style="color: {colorScheme.secondary};">
						{benefitText}
					</p>
					{#if promoCode}
						<p class="text-xs" style="color: {colorScheme.secondary};">
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
						class="p-1 -mr-1 -mt-1 rounded hover:bg-white/20 transition-colors flex-shrink-0"
						aria-label="Dismiss">
						<X class="h-4 w-4" style="color: {colorScheme.secondary};" />
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Default variant for dashboard/general use -->
		<div class="rounded-lg border p-2.5 sm:p-3" style="background: {colorScheme.bg}; border-color: {colorScheme.border};">
			<div class="flex items-center gap-2 sm:gap-3">
				{#if discountPercentage === 100}
					<Crown class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style="color: {colorScheme.icon};" />
				{:else if isEarlyAccess}
					<TrendingUp class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style="color: {colorScheme.icon};" />
				{:else if isInFreeTrial}
					<Calendar class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style="color: {colorScheme.icon};" />
				{:else}
					<Gift class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style="color: {colorScheme.icon};" />
				{/if}
				<div class="flex-1 min-w-0">
					<p class="text-xs sm:text-sm font-medium" style="color: {colorScheme.text};">
						<span class="block sm:inline">{benefitText}</span>
						{#if promoCode}
							<span class="font-normal" style="color: {colorScheme.secondary};">
								<span class="hidden sm:inline"> • </span>
								<span class="block sm:inline text-xs">Code: {promoCode}</span>
							</span>
						{/if}
					</p>
				</div>
				{#if showDismiss}
					<button 
						onclick={onDismiss}
						class="p-1 -mr-1 rounded hover:bg-white/20 transition-colors flex-shrink-0"
						aria-label="Dismiss">
						<X class="h-3.5 w-3.5 sm:h-4 sm:w-4" style="color: {colorScheme.secondary};" />
					</button>
				{/if}
			</div>
		</div>
	{/if}
{/if} 
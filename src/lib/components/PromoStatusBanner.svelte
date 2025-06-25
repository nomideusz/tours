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

	// Get icon based on benefit type
	let BenefitIcon = $derived(
		discountPercentage === 100 ? Crown :
		isEarlyAccess ? TrendingUp :
		isInFreeTrial ? Calendar :
		Gift
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
			<BenefitIcon size={14} style="color: {colorScheme.icon};" />
			<span style="color: {colorScheme.text};">{benefitText}</span>
		</div>
	{:else if variant === 'detailed'}
		<!-- Detailed variant for profile/subscription pages -->
		<div class="rounded-lg border p-4" style="background: {colorScheme.bg}; border-color: {colorScheme.border};">
			<div class="flex items-start gap-3">
				<div class="p-2 rounded-lg" style="background: {colorScheme.icon}20;">
					<BenefitIcon size={20} style="color: {colorScheme.icon};" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold mb-1" style="color: {colorScheme.text};">
						{#if isEarlyAccess}
							Early Access Member
						{:else if discountPercentage === 100}
							Partner Benefits Active
						{:else}
							Promotional Offer Active
						{/if}
					</h3>
					<p class="text-sm mb-2" style="color: {colorScheme.secondary};">
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
						class="p-1 rounded hover:bg-white/20 transition-colors"
						aria-label="Dismiss">
						<X size={16} style="color: {colorScheme.secondary};" />
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Default variant for dashboard/general use -->
		<div class="rounded-lg border p-3" style="background: {colorScheme.bg}; border-color: {colorScheme.border};">
			<div class="flex items-center gap-3">
				<BenefitIcon size={16} style="color: {colorScheme.icon};" />
				<div class="flex-1">
					<p class="text-sm font-medium" style="color: {colorScheme.text};">
						{benefitText}
						{#if promoCode}
							<span class="font-normal" style="color: {colorScheme.secondary};"> • Code: {promoCode}</span>
						{/if}
					</p>
				</div>
				{#if showDismiss}
					<button 
						onclick={onDismiss}
						class="p-1 rounded hover:bg-white/20 transition-colors"
						aria-label="Dismiss">
						<X size={14} style="color: {colorScheme.secondary};" />
					</button>
				{/if}
			</div>
		</div>
	{/if}
{/if} 
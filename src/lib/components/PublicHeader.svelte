<script lang="ts">
	import { page } from '$app/stores';
	import { tourOwnerStore } from '$lib/stores/tourOwner.js';
	import { auth } from '$lib/stores/auth.js';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';

	// Simple logo/brand
	const isAuthPage = $derived($page.route.id?.includes('/auth/'));
	const isBookingPage = $derived($page.route.id?.includes('/book/'));
	const isProfilePage = $derived($page.route.id?.includes('/[username]'));
	const isTicketPage = $derived($page.route.id?.includes('/ticket/'));
	
	// Check if user is authenticated
	const isAuthenticated = $derived($auth.isAuthenticated);
	
	// Get tour owner info if on profile/booking pages
	const tourOwner = $derived($tourOwnerStore);
	
	// Show back button on certain pages
	const showBackButton = $derived(isBookingPage || isTicketPage);
</script>

<header class="sticky top-0 z-50 transition-colors" style="background: var(--bg-primary); border-bottom: 1px solid var(--border-primary);">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-14">
			<!-- Logo/Brand with contextual info -->
			<div class="flex items-center gap-3">
				{#if showBackButton && tourOwner}
					<button 
						onclick={() => history.back()} 
						class="p-1.5 rounded-lg transition-colors back-button"
						aria-label="Go back"
					>
						<ChevronLeft class="w-5 h-5" style="color: var(--text-secondary);" />
					</button>
				{/if}
				
				<a href="/" class="text-lg font-normal logo-serif transition-colors" style="color: var(--text-primary);">
					zaur.app
				</a>
				
				{#if tourOwner && (isProfilePage || isBookingPage)}
					<span class="text-sm hidden sm:inline" style="color: var(--text-tertiary);">
						• {tourOwner.name}
					</span>
				{/if}
			</div>

			<!-- Navigation based on page type and auth status -->
			<div class="flex items-center gap-3">
				<!-- Theme Toggle - Less prominent on public pages -->
				<div class="opacity-60 hover:opacity-100 transition-opacity">
					<ThemeToggle tooltipPosition="bottom" />
				</div>
				
				
				{#if isAuthPage}
					<!-- Auth page navigation -->
					{#if $page.route.id?.includes('/login')}
						<span class="text-sm" style="color: var(--text-secondary);">Don't have an account?</span>
						<a href="/auth/register" class="text-sm font-medium transition-colors hover-primary">
							Sign up
						</a>
					{:else if $page.route.id?.includes('/register')}
						<span class="text-sm" style="color: var(--text-secondary);">Already have an account?</span>
						<a href="/auth/login" class="text-sm font-medium transition-colors hover-primary">
							Sign in
						</a>
					{:else}
						<a href="/auth/login" class="text-sm font-medium transition-colors hover-primary">
							Sign in
						</a>
					{/if}
				{:else}
					<!-- Public pages - no sign in links, only show dashboard if already authenticated -->
					{#if isAuthenticated}
						<a href="/dashboard" class="text-sm font-medium transition-colors hover-primary">
							Dashboard
						</a>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</header>

<style lang="postcss">
	@reference "tailwindcss";
	
	.logo-serif {
		font-family: Georgia, 'Times New Roman', serif;
		font-weight: 400;
		letter-spacing: -0.025em;
	}
	
	.logo-serif:hover {
		color: var(--text-secondary);
	}
	
	.hover-primary {
		color: var(--color-primary-600);
	}
	
	.hover-primary:hover {
		color: var(--color-primary-700);
	}
	
	.back-button:hover {
		background: var(--bg-secondary);
	}
</style> 
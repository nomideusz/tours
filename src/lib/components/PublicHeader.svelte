<script lang="ts">
	import { page } from '$app/stores';
	import { tourOwnerStore } from '$lib/stores/tourOwner.js';
	import { auth } from '$lib/stores/auth.js';

	// Simple logo/brand
	const isAuthPage = $derived($page.route.id?.includes('/auth/'));
	const isBookingPage = $derived($page.route.id?.includes('/book/'));
	const isProfilePage = $derived($page.route.id?.includes('/[username]'));
	const isTicketPage = $derived($page.route.id?.includes('/ticket/'));
	
	// Check if user is authenticated
	const isAuthenticated = $derived($auth.isAuthenticated);
</script>

<header class="bg-white border-b border-gray-200 sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<!-- Logo/Brand -->
			<div class="flex items-center">
				<a href="/" class="text-xl font-normal text-gray-900 logo-serif hover:text-gray-700 transition-colors">
					zaur.app
				</a>
			</div>

			<!-- Navigation based on page type and auth status -->
			<div class="flex items-center gap-4">
				{#if isAuthPage}
					<!-- Auth page navigation -->
					{#if $page.route.id?.includes('/login')}
						<span class="text-sm text-gray-600">Don't have an account?</span>
						<a href="/auth/register" class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
							Sign up
						</a>
					{:else if $page.route.id?.includes('/register')}
						<span class="text-sm text-gray-600">Already have an account?</span>
						<a href="/auth/login" class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
							Sign in
						</a>
					{:else}
						<a href="/auth/login" class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
							Sign in
						</a>
					{/if}
				{:else if isBookingPage || isProfilePage || isTicketPage}
					<!-- Booking/Profile/Ticket page navigation - minimal -->
					{#if isAuthenticated}
						<a href="/dashboard" class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
							Dashboard
						</a>
					{:else}
						<div class="text-sm text-gray-600">
							<!-- Minimal header for customer-facing pages -->
						</div>
					{/if}
				{:else}
					<!-- Default navigation -->
					{#if isAuthenticated}
						<a href="/dashboard" class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
							Dashboard
						</a>
					{:else}
						<a href="/auth/login" class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
							Sign in
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
</style> 
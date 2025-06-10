<script lang="ts">
	import { page } from '$app/stores';
	import { tourOwnerStore } from '$lib/stores/tourOwner.js';

	// Simple logo/brand
	const isAuthPage = $derived($page.route.id?.includes('/auth/'));
	const isBookingPage = $derived($page.route.id?.includes('/book/'));
	const isProfilePage = $derived($page.route.id?.includes('/[username]'));
</script>

<header class="bg-white border-b border-gray-200 sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<!-- Logo/Brand -->
			<div class="flex items-center">
				{#if $tourOwnerStore?.username}
					<a href="/{$tourOwnerStore.username}" class="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
						<svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
							<path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586l-2 2V6H5v12h5.586l2 2H4a1 1 0 01-1-1V4z"/>
							<path d="M21 8.414l-6.586 6.586a2 2 0 01-2.828 0L9 12.414 6.586 14.828a1 1 0 01-1.414-1.414l3-3a2 2 0 012.828 0L13.586 13 19 7.586V10a1 1 0 102 0V6a1 1 0 00-1-1h-4a1 1 0 100 2h2.586z"/>
						</svg>
						<span>{$tourOwnerStore.username}</span>
					</a>
				{:else}
					<a href="/" class="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
						<svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
							<path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586l-2 2V6H5v12h5.586l2 2H4a1 1 0 01-1-1V4z"/>
							<path d="M21 8.414l-6.586 6.586a2 2 0 01-2.828 0L9 12.414 6.586 14.828a1 1 0 01-1.414-1.414l3-3a2 2 0 012.828 0L13.586 13 19 7.586V10a1 1 0 102 0V6a1 1 0 00-1-1h-4a1 1 0 100 2h2.586z"/>
						</svg>
						<span>Zaur</span>
					</a>
				{/if}
			</div>

			<!-- Navigation based on page type -->
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
				{:else if isBookingPage || isProfilePage}
					<!-- Booking/Profile page navigation -->
					<div class="text-sm text-gray-600">
						Powered by <a href="/" class="font-medium text-blue-600 hover:text-blue-800 transition-colors">Zaur</a>
					</div>
				{:else}
					<!-- Default navigation -->
					<a href="/auth/login" class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
						Sign in
					</a>
				{/if}
			</div>
		</div>
	</div>
</header>

<style lang="postcss">
	@reference "tailwindcss";
</style> 
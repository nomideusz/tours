<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Icons
	import Home from 'lucide-svelte/icons/home';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Search from 'lucide-svelte/icons/search';

	let mounted = false;

	onMount(() => {
		mounted = true;
	});

	function goBack() {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			goto('/');
		}
	}

	function goHome() {
		if (isAuthenticated) {
			goto('/dashboard');
		} else {
			goto('/');
		}
	}

	// Check if user is authenticated (simple check for common auth patterns)
	$: isAuthenticated = $page.url.pathname.startsWith('/(app)') || 
		$page.url.pathname.startsWith('/dashboard') || 
		$page.url.pathname.startsWith('/tours') || 
		$page.url.pathname.startsWith('/bookings');
</script>

<svelte:head>
	<title>Page Not Found - Zaur</title>
	<meta name="description" content="The page you're looking for doesn't exist." />
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-md w-full">
		<div class="text-center">
			<!-- Error Code -->
			<div class="mb-4">
				<span class="text-6xl font-bold text-blue-600">404</span>
			</div>

			<!-- Error Message -->
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Page not found</h1>
			<p class="text-gray-600 mb-8">
				Sorry, we couldn't find the page you're looking for.
			</p>

			<!-- Requested URL Display (if not sensitive) -->
			{#if mounted}
				<div class="bg-gray-100 rounded-lg p-3 mb-6 text-sm text-gray-700">
					<Search class="inline h-4 w-4 mr-2" />
					<span class="font-mono">{$page.url.pathname}</span>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="space-y-3">
				{#if mounted}
					<button
						onclick={goBack}
						class="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
					>
						<ArrowLeft class="h-4 w-4" />
						Go Back
					</button>
				{/if}

				<button
					onclick={goHome}
					class="w-full flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
				>
					<Home class="h-4 w-4" />
					{isAuthenticated ? 'Go to Dashboard' : 'Go to Home'}
				</button>
			</div>

			<!-- Helpful Links -->
			<div class="mt-8 pt-6 border-t border-gray-200">
				<p class="text-sm text-gray-500 mb-4">Or try one of these:</p>
				<div class="space-y-2 text-sm">
					{#if isAuthenticated}
						<a href="/dashboard" class="block text-blue-600 hover:text-blue-700">Dashboard</a>
						<a href="/tours" class="block text-blue-600 hover:text-blue-700">My Tours</a>
						<a href="/bookings" class="block text-blue-600 hover:text-blue-700">Bookings</a>
					{:else}
						<a href="/?view=home" class="block text-blue-600 hover:text-blue-700">Home</a>
						<a href="/auth/login" class="block text-blue-600 hover:text-blue-700">Login</a>
						<a href="/auth/register" class="block text-blue-600 hover:text-blue-700">Sign Up</a>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style>

 
<script lang="ts">
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { onMount } from 'svelte';
	
	let { children } = $props();
	
	// Create a separate query client for embed pages
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 5 * 60 * 1000, // 5 minutes
				gcTime: 10 * 60 * 1000,   // 10 minutes
				retry: 1,
				refetchOnWindowFocus: false
			}
		}
	});
	
	// Prevent parent page scrolling when embedded and apply theme
	onMount(() => {
		if (typeof window !== 'undefined' && window.parent !== window) {
			document.body.style.overflow = 'hidden';
		}
		
		// Theme detection logic
		const urlParams = new URLSearchParams(window.location.search);
		const themeParam = urlParams.get('theme');
		
		let theme = 'light'; // Always default to light for widgets
		if (themeParam === 'dark') {
			theme = 'dark';
		} else if (themeParam === 'auto') {
			// Only auto-detect if explicitly requested
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			theme = prefersDark ? 'dark' : 'light';
		}
		// If themeParam is 'light' or null/undefined, always use light mode

		// Only apply dark theme attribute if theme is actually dark
		if (theme === 'dark') {
			document.documentElement.setAttribute('data-theme', 'dark');
		} else {
			// Remove any existing theme attribute to ensure light mode
			document.documentElement.removeAttribute('data-theme');
		}
	});
</script>

<QueryClientProvider client={queryClient}>
	<main class="embed-layout">
		{@render children()}
	</main>
</QueryClientProvider>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		height: 100%;
		font-family: var(--font-sans);
		background: var(--bg-primary);
		color: var(--text-primary);
	}
	
	.embed-layout {
		width: 100%;
		height: 100vh;
		overflow: hidden;
		background: var(--bg-primary);
	}
	
	/* Reset some global styles for embed */
	:global(*) {
		box-sizing: border-box;
	}
	
	:global(button) {
		font-family: inherit;
	}
</style> 
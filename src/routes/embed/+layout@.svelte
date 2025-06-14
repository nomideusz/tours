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
	
	// Prevent parent page scrolling when embedded
	onMount(() => {
		if (typeof window !== 'undefined' && window.parent !== window) {
			document.body.style.overflow = 'hidden';
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
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: white;
	}
	
	.embed-layout {
		width: 100%;
		height: 100vh;
		overflow: hidden;
	}
	
	/* Reset some global styles for embed */
	:global(*) {
		box-sizing: border-box;
	}
	
	:global(button) {
		font-family: inherit;
	}
</style> 
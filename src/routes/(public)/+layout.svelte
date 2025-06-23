<script lang="ts">
	import { language, t } from '$lib/i18n.js';
	import { languageContext, languageStore } from '$lib/context.js';
	import { auth } from '$lib/stores/auth.js';
	import PublicHeader from '$lib/components/PublicHeader.svelte';
	import PublicFooter from '$lib/components/PublicFooter.svelte';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { themeStore } from '$lib/stores/theme.js';
	import { onMount } from 'svelte';

	let { children, data } = $props<{ data?: any }>();

	// Set language context from the store
	languageContext.set(languageStore);

	// Initialize auth store with server data (may be null for public routes)
	$effect(() => {
		if (data) {
			auth.initialize(data);
		}
	});
	
	// Initialize theme
	onMount(() => {
		const cleanup = themeStore.init();
		return cleanup;
	});
</script>

<!-- TanStack Query Provider for Public -->
<QueryClientProvider client={data.queryClient}>
	<!-- Public Layout: Minimal header + main + footer -->
	<div class="min-h-screen flex flex-col">
		<PublicHeader />
		
		<main class="flex-1">
			{@render children()}
		</main>
		
		<PublicFooter />
	</div>
</QueryClientProvider>

<style lang="postcss">
	@reference "tailwindcss";
</style> 
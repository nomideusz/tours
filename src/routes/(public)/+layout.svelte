<script lang="ts">
	import { language, t } from '$lib/i18n.js';
	import { languageContext, languageStore } from '$lib/context.js';
	import { afterNavigate } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children, data } = $props<{ data?: any }>();

	// Set language context from the store
	languageContext.set(languageStore);

	// Header reference for closing mobile menu
	let headerRef: Header;

	// Close mobile menu on navigation
	afterNavigate(() => {
		if (headerRef) {
			headerRef.closeMobileMenu();
		}
	});
</script>

<!-- Header Component -->
<Header 
	bind:this={headerRef}
	isAuthenticated={data?.isAuthenticated || false}
	currentUser={data?.user || null}
/>

<!-- Main content -->
<main class="main pt-20">
	{@render children()}
</main>

<!-- Modern footer -->
<Footer />

<style lang="postcss">
	@reference "tailwindcss";
	
	.main {
		min-height: calc(100vh - 80px);
		flex: 1;
		width: 100%;
		max-width: 100%;
	}

	/* Ensure sections in main are full width */
	.main > :global(section) {
		width: 100vw;
		position: relative;
		left: 50%;
		right: 50%;
		margin-left: -50vw;
		margin-right: -50vw;
	}
</style> 
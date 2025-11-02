<script lang="ts">
	import '../app.css';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { language, t } from '$lib/i18n.js';
	import { languageContext, languageStore } from '$lib/context.js';
	import { navigationContext, navigationStore } from '$lib/context.js';
	import PaletteSwitcher from '$lib/components/dev/PaletteSwitcher.svelte';

	let { children, data } = $props<{ data?: any }>();

	// Set language context from the store
	languageContext.set(languageStore);

	// Loading state management for global navigation
	let navigationState = $state({
		pathname: '',
		isNavigating: false,
		shouldShowLoader: false
	});

	let loadingTimer: ReturnType<typeof setTimeout> | null = null;
	let isInitialLoad = true;

	beforeNavigate(({ from, to, type }) => {
		if (isInitialLoad) {
			isInitialLoad = false;
			return;
		}

		const isFullNavigation = from && to && from.url.pathname !== to.url.pathname;

		if (isFullNavigation) {
			navigationState.isNavigating = true;

			loadingTimer = setTimeout(() => {
				navigationState.shouldShowLoader = true;
			}, 400);
		}
	});

	afterNavigate(({ to, from }) => {
		if (loadingTimer) {
			clearTimeout(loadingTimer);
			loadingTimer = null;
		}

		if (to?.url) {
			navigationState.pathname = to.url.pathname;
			navigationState.isNavigating = false;
			navigationState.shouldShowLoader = false;
		}
	});

	onMount(() => {
		// Set initial navigation state
		if (typeof window !== 'undefined') {
			navigationState.pathname = window.location.pathname;
		}
	});
</script>

<!-- Minimal root layout - just provides basic HTML structure -->
{@render children()}

<!-- Global loading indicator -->
{#if navigationState.shouldShowLoader}
	<div class="fixed top-0 right-0 left-0 z-50 h-1" style="background: var(--color-primary-100);">
		<div class="loading-bar h-full" style="background: var(--color-primary-600);"></div>
	</div>
{/if}

<!-- Dev Tool: Palette Switcher -->
<!-- <PaletteSwitcher /> -->

<style lang="postcss">
	@reference "tailwindcss";
	
	:global(html) {
		background-color: var(--bg-primary);
		scroll-behavior: smooth;
		height: auto !important;
		overflow-y: auto !important;
		scrollbar-gutter: stable;
	}

	:global(body) {
		overflow-x: hidden;
		overflow-y: auto !important;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	/* Loading bar animation */
	.loading-bar {
		animation: loading 1s ease-in-out infinite;
	}

	@keyframes loading {
		0% {
			width: 0;
			opacity: 1;
		}
		50% {
			width: 70%;
			opacity: 1;
		}
		100% {
			width: 100%;
			opacity: 0;
		}
	}

	/* Theme-aware scrollbar styling */
	:global(html) {
		scrollbar-width: thin;
		scrollbar-color: var(--border-secondary) var(--bg-secondary);
	}

	:global(html::-webkit-scrollbar) {
		width: 12px;
	}

	:global(html::-webkit-scrollbar-track) {
		background: var(--bg-secondary);
	}

	:global(html::-webkit-scrollbar-thumb) {
		background-color: var(--border-secondary);
		border-radius: 6px;
		border: 2px solid var(--bg-secondary);
	}

	:global(html::-webkit-scrollbar-thumb:hover) {
		background-color: var(--text-tertiary);
	}
</style>

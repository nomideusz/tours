<script lang="ts">
	import '../app.css';
	import { navigationContext, navigationStore } from '$lib/context.js';
	import { auth } from '$lib/stores/auth.js';
	import { IsMounted } from 'runed';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children, data } = $props<{ data?: any }>();

	// Initialize auth store with server data
	$effect(() => {
		if (data) {
			auth.initialize(data);
		}
	});

	// Use IsMounted from Runed
	const isMounted = new IsMounted();

	// Set up navigation context
	navigationContext.set(navigationStore);

	// Track navigation changes with loading state
	let loadingTimer: ReturnType<typeof setTimeout> | null = null;
	let isInitialLoad = true;

	beforeNavigate(({ from, to, type }) => {
		if (isInitialLoad) {
			isInitialLoad = false;
			return;
		}

		const isFullNavigation = from && to && from.url.pathname !== to.url.pathname;

		if (isFullNavigation) {
			navigationStore.update((state) => ({ ...state, isNavigating: true }));

			loadingTimer = setTimeout(() => {
				navigationStore.update((state) => ({ ...state, shouldShowLoader: true }));
			}, 400);
		}
	});

	afterNavigate(({ to, from }) => {
		if (loadingTimer) {
			clearTimeout(loadingTimer);
			loadingTimer = null;
		}

		if (to?.url) {
			navigationStore.set({
				pathname: to.url.pathname,
				isNavigating: false,
				shouldShowLoader: false
			});
		}
	});
</script>

<!-- Main content -->
{@render children()}

<!-- Loading indicator -->
{#if $navigationStore.shouldShowLoader}
	<div class="fixed top-0 right-0 left-0 z-50 h-1 bg-blue-100">
		<div class="loading-bar h-full bg-blue-600"></div>
	</div>
{/if}

<style lang="postcss">
	@reference "tailwindcss";
	:global(html) {
		background-color: theme(--color-gray-100);
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

	/* Simplified scrollbar styling */
	:global(html) {
		scrollbar-width: thin;
		scrollbar-color: #cbd5e0 #f7fafc;
	}

	:global(html::-webkit-scrollbar) {
		width: 12px;
	}

	:global(html::-webkit-scrollbar-track) {
		background: #f7fafc;
	}

	:global(html::-webkit-scrollbar-thumb) {
		background-color: #cbd5e0;
		border-radius: 6px;
		border: 2px solid #f7fafc;
	}

	:global(html::-webkit-scrollbar-thumb:hover) {
		background-color: #a0aec0;
	}
</style>

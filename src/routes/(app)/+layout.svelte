<script lang="ts">
	import '../../app.css';
	import { language, t } from '$lib/i18n.js';
	import { initialUserValue, setupAuthListener } from '$lib/pocketbase.js';
	import { onDestroy, onMount } from 'svelte';
	import {
		languageContext,
		switchLanguage,
		languageStore,
		navigationContext,
		navigationStore
	} from '$lib/context.js';
	import { authFSM, updateAuthState, authContext, authStore } from '$lib/auth.js';
	import { IsMounted } from 'runed';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	interface LayoutData {
		user: any;
		isAuthenticated: boolean;
		isAdmin: boolean;
	}

	let { children, data } = $props<{ data: LayoutData }>();

	// Use IsMounted from Runed
	const isMounted = new IsMounted();

	// Initialize auth store with initial values
	authStore.set({
		isAuthenticated: !!data.user,
		user: data.user || null,
		state: data.user ? 'loggedIn' : 'loggedOut'
	});

	// Initialize context with the store
	authContext.set(authStore);

	// Create a state for the current user
	let currentUser = $state(initialUserValue || data.user || null);

	// Create an explicitly typed variable for clarity in comparisons
	type AuthState = 'loggedOut' | 'loggedIn' | 'loading' | 'loggingIn' | 'loggingOut';

	// Track auth state
	let authState = $state<AuthState>(authFSM.current);

	// Header reference for closing mobile menu
	let headerRef: Header;

	// Update currentUser with data from server
	$effect(() => {
		if (data.user) {
			currentUser = data.user;
			updateAuthState(data.user);
		}
	});

	// Watch for auth state changes
	$effect(() => {
		authState = authFSM.current;

		// Force update to ensure UI reflects current auth state
		if (data.isAuthenticated && authState !== 'loggedIn') {
			updateAuthState({ exists: true, forceAuth: true });
		}

		// Update auth store whenever auth state or user changes
		authStore.update(() => ({
			isAuthenticated: data.isAuthenticated || authState === 'loggedIn',
			user: currentUser,
			state: authState
		}));
	});

	// Set component as mounted and sync auth state
	onMount(() => {
		if (data.user) {
			currentUser = data.user;
		}

		if (data.isAuthenticated) {
			if (authFSM.current !== 'loggedIn') {
				if (authFSM.current === 'loggingIn') {
					authFSM.send('finishTransition');
				} else {
					updateAuthState({ exists: true, forceAuth: true });
				}
			}
		} else if (data.isAuthenticated === false) {
			if (authFSM.current !== 'loggedOut' && authFSM.current !== 'loggingOut') {
				authFSM.send('logout');
			}
		}
	});

	// Set up auth listener to update currentUser
	const cleanup = setupAuthListener((user) => {
		console.log('Auth listener triggered with user:', user ? 'User present' : 'No user');
		currentUser = user;
		updateAuthState(user);
		
		// Force update auth store when user changes (important for OAuth2)
		authStore.update(() => ({
			isAuthenticated: !!user,
			user: user,
			state: user ? 'loggedIn' : 'loggedOut'
		}));
	});

	// Clean up listener on component destruction
	onDestroy(cleanup);

	// Set language context from the store
	languageContext.set(languageStore);

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

	afterNavigate(({ to }) => {
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
			// Close mobile menu on navigation if header ref exists
			if (headerRef) {
				headerRef.closeMobileMenu();
			}
		}
	});
</script>

<!-- Header Component -->
<Header 
	bind:this={headerRef}
	isAuthenticated={data.isAuthenticated}
	currentUser={currentUser}
/>

<!-- Main content -->
<main class="main pt-20">
	{@render children()}
</main>

<!-- Modern footer -->
<Footer />

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

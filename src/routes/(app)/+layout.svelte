<script lang="ts">
	import { language, t } from '$lib/i18n.js';
	import {
		initialUserValue,
		setupAuthListener,
		currentUser as currentUserStore,
		reloadAuthFromCookies
	} from '$lib/pocketbase.js';
	import { onDestroy, onMount } from 'svelte';
	import {
		languageContext,
		languageStore,
		navigationContext,
		navigationStore
	} from '$lib/context.js';
	import { authFSM, updateAuthState, authContext, authStore } from '$lib/auth.js';
	import { IsMounted } from 'runed';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/stores';

	// Icons
	import Menu from 'lucide-svelte/icons/menu';
	import X from 'lucide-svelte/icons/x';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import User from 'lucide-svelte/icons/user';
	import Settings from 'lucide-svelte/icons/settings';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import Shield from 'lucide-svelte/icons/shield';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Loader2 from 'lucide-svelte/icons/loader-2';

	interface LayoutData {
		user?: any;
		isAuthenticated?: boolean;
		isAdmin?: boolean;
	}

	let { children, data } = $props<{ data: LayoutData }>();

	// Use IsMounted from Runed
	const isMounted = new IsMounted();

	// Initialize auth store with initial values (handle undefined data gracefully)
	authStore.set({
		isAuthenticated: !!data?.user,
		user: data?.user || null,
		state: data?.user ? 'loggedIn' : 'loggedOut'
	});

	// Initialize context with the store
	authContext.set(authStore);

	// Create a state for the current user - sync with the currentUser store
	let currentUser = $state(initialUserValue || data?.user || null);

	// Keep local currentUser in sync with the store
	$effect(() => {
		const unsubscribe = currentUserStore.subscribe((user) => {
			currentUser = user;
		});
		return unsubscribe;
	});

	// Create an explicitly typed variable for clarity in comparisons
	type AuthState = 'loggedOut' | 'loggedIn' | 'loading' | 'loggingIn' | 'loggingOut';

	// Track auth state
	let authState = $state<AuthState>(authFSM.current);

	// Sidebar state
	let sidebarOpen = $state(false);
	let isLoggingOut = $state(false);

	// Update currentUser with data from server
	$effect(() => {
		if (data?.user) {
			currentUser = data.user;
			updateAuthState(data.user);
		}
	});

	// Watch for auth state changes
	$effect(() => {
		authState = authFSM.current;

		// Force update to ensure UI reflects current auth state
		if (data?.isAuthenticated && authState !== 'loggedIn') {
			updateAuthState({ exists: true, forceAuth: true });
		}

		// Update auth store whenever auth state or user changes
		authStore.update(() => ({
			isAuthenticated: data?.isAuthenticated || authState === 'loggedIn',
			user: currentUser,
			state: authState
		}));
	});

	// Set component as mounted and sync auth state
	onMount(() => {
		if (data?.user) {
			currentUser = data.user;
		}

		if (data?.isAuthenticated) {
			if (authFSM.current !== 'loggedIn') {
				if (authFSM.current === 'loggingIn') {
					authFSM.send('finishTransition');
				} else {
					updateAuthState({ exists: true, forceAuth: true });
				}
			}
		} else if (data?.isAuthenticated === false) {
			if (authFSM.current !== 'loggedOut' && authFSM.current !== 'loggingOut') {
				authFSM.send('logout');
			}
		}
	});

	// Set up auth listener
	let cleanup = () => {};
	let authListenerSetup = false;

	$effect(() => {
		if (!authListenerSetup) {
			authListenerSetup = true;
			cleanup = setupAuthListener((user) => {
				console.log('Auth listener callback (deprecated):', user ? 'User present' : 'No user');
			});
		}
	});

	// Clean up listener on component destruction
	onDestroy(cleanup);

	// Set language context from the store
	languageContext.set(languageStore);

	// Set up navigation context
	navigationContext.set(navigationStore);

	// Close sidebar on navigation
	afterNavigate(({ to, from }) => {
		sidebarOpen = false;

		// Reload auth state from cookies after navigation
		const isFromLogin = from?.url?.pathname?.includes('/auth/login');

		if (isFromLogin) {
			console.log('Reloading auth after login navigation...');
			setTimeout(() => {
				reloadAuthFromCookies();
			}, 100);
		}
	});

	// Navigation items
	const navigationItems = [
		{
			name: 'Dashboard',
			href: '/dashboard',
			icon: BarChart3,
			current: false
		},
		{
			name: 'Tours',
			href: '/tours',
			icon: MapPin,
			current: false
		},
		{
			name: 'Bookings',
			href: '/bookings',
			icon: Calendar,
			current: false
		},
		{
			name: 'QR Scanner',
			href: '/checkin-scanner',
			icon: QrCode,
			current: false
		}
	];

	// Update current navigation based on current page
	$effect(() => {
		if (typeof window !== 'undefined') {
			const currentPath = window.location.pathname;
			navigationItems.forEach((item) => {
				item.current = currentPath.startsWith(item.href);
			});
		}
	});

	async function handleLogout(event: Event) {
		event.preventDefault();

		if (isLoggingOut) return;

		isLoggingOut = true;
		authFSM.send('logout');

		try {
			// Use a form submission instead of fetch to allow server redirect
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = '/auth/logout';
			document.body.appendChild(form);
			form.submit();
		} catch (error) {
			console.error('Error during logout:', error);
			isLoggingOut = false;
		}
	}

	function closeSidebar() {
		sidebarOpen = false;
	}
</script>

<svelte:head>
	<!-- Umami Analytics for App Pages - Production Only -->
	{#if !import.meta.env.DEV}
		<script
			defer
			src="https://umami.zaur.app/script.js"
			data-website-id="92ff6091-acae-433b-813b-561a4f524314"
		></script>
	{/if}
</svelte:head>

<div class="flex h-screen bg-gray-50">
	<!-- Sidebar -->
	<div class="hidden lg:flex lg:flex-shrink-0">
		<div class="flex w-64 flex-col">
			<div
				class="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5 pb-4"
			>
				<!-- Logo -->
				<div class="flex flex-shrink-0 items-center px-4">
					<h1 class="text-xl font-bold text-gray-900">Zaur Dashboard</h1>
				</div>

				<!-- Navigation -->
				<nav class="mt-8 flex-1 space-y-1 px-2">
					{#each navigationItems as item}
						<a
							href={item.href}
							class="group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors {item.current
								? 'bg-blue-100 text-blue-900'
								: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
						>
							<item.icon
								class="mr-3 h-5 w-5 {item.current
									? 'text-blue-500'
									: 'text-gray-400 group-hover:text-gray-500'}"
							/>
							{item.name}
						</a>
					{/each}
				</nav>

				<!-- User section -->
				<div class="flex flex-shrink-0 border-t border-gray-200 p-4">
					<div class="flex w-full items-center">
						<div class="flex-shrink-0">
							<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
								<User class="h-4 w-4 text-white" />
							</div>
						</div>
						<div class="ml-3 min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-900">
								{currentUser?.username || currentUser?.name || currentUser?.email || 'User'}
							</p>
							<div class="mt-1 flex items-center gap-2">
								<a
									href="/profile"
									class="text-xs text-gray-500 transition-colors hover:text-gray-700"
								>
									Profile
								</a>
								{#if data?.isAdmin}
									<span class="text-xs text-gray-300">•</span>
									<a
										href="/admin"
										class="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-gray-700"
									>
										<Shield class="h-3 w-3" />
										Admin
									</a>
								{/if}
							</div>
						</div>
						<button
							onclick={handleLogout}
							disabled={isLoggingOut}
							class="ml-2 rounded p-1 transition-colors hover:bg-gray-100 disabled:opacity-50"
							title="Logout"
						>
							{#if isLoggingOut}
								<Loader2 class="h-4 w-4 animate-spin text-gray-500" />
							{:else}
								<LogOut class="h-4 w-4 text-gray-500" />
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Mobile sidebar overlay -->
	{#if sidebarOpen}
		<div class="fixed inset-0 z-40 flex lg:hidden">
			<div class="bg-opacity-75 fixed inset-0 bg-gray-600" onclick={closeSidebar}></div>
			<div class="relative flex w-full max-w-xs flex-1 flex-col bg-white">
				<div class="absolute top-0 right-0 -mr-12 pt-2">
					<button
						onclick={closeSidebar}
						class="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset"
					>
						<X class="h-6 w-6 text-white" />
					</button>
				</div>

				<div class="h-0 flex-1 overflow-y-auto pt-5 pb-4">
					<!-- Mobile logo -->
					<div class="flex flex-shrink-0 items-center px-4">
						<h1 class="text-xl font-bold text-gray-900">Zaur Dashboard</h1>
					</div>

					<!-- Mobile navigation -->
					<nav class="mt-8 space-y-1 px-2">
						{#each navigationItems as item}
							<a
								href={item.href}
								onclick={closeSidebar}
								class="group flex items-center rounded-md px-2 py-2 text-base font-medium transition-colors {item.current
									? 'bg-blue-100 text-blue-900'
									: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
							>
								<item.icon
									class="mr-4 h-6 w-6 {item.current
										? 'text-blue-500'
										: 'text-gray-400 group-hover:text-gray-500'}"
								/>
								{item.name}
							</a>
						{/each}
					</nav>
				</div>

				<!-- Mobile user section -->
				<div class="flex flex-shrink-0 border-t border-gray-200 p-4">
					<div class="flex w-full items-center">
						<div class="flex-shrink-0">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
								<User class="h-5 w-5 text-white" />
							</div>
						</div>
						<div class="ml-3 min-w-0 flex-1">
							<p class="truncate text-base font-medium text-gray-900">
								{currentUser?.username || currentUser?.name || currentUser?.email || 'User'}
							</p>
							<div class="mt-1 flex items-center gap-2">
								<a
									href="/profile"
									onclick={closeSidebar}
									class="text-sm text-gray-500 transition-colors hover:text-gray-700"
								>
									Profile
								</a>
								{#if data?.isAdmin}
									<span class="text-sm text-gray-300">•</span>
									<a
										href="/admin"
										onclick={closeSidebar}
										class="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
									>
										<Shield class="h-4 w-4" />
										Admin
									</a>
								{/if}
							</div>
						</div>
						<button
							onclick={handleLogout}
							disabled={isLoggingOut}
							class="ml-2 rounded p-2 transition-colors hover:bg-gray-100 disabled:opacity-50"
							title="Logout"
						>
							{#if isLoggingOut}
								<Loader2 class="h-5 w-5 animate-spin text-gray-500" />
							{:else}
								<LogOut class="h-5 w-5 text-gray-500" />
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main content -->
	<div class="flex w-0 flex-1 flex-col overflow-hidden">
		<!-- Top bar for mobile -->
		<div class="lg:hidden">
			<div class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
				<button
					onclick={() => (sidebarOpen = true)}
					class="rounded-md p-2 transition-colors hover:bg-gray-100"
				>
					<Menu class="h-6 w-6 text-gray-600" />
				</button>
				<h1 class="text-lg font-semibold text-gray-900">Zaur Dashboard</h1>
				<div class="w-10"></div>
				<!-- Spacer for centering -->
			</div>
		</div>

		<!-- Page content -->
		<main class="relative z-0 flex-1 overflow-y-auto focus:outline-none">
			{@render children()}
		</main>
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style>

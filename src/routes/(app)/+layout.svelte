<script lang="ts">
	import { language, t } from '$lib/i18n.js';
	import { initialUserValue, setupAuthListener, currentUser as currentUserStore, reloadAuthFromCookies } from '$lib/pocketbase.js';
	import { onDestroy, onMount } from 'svelte';
	import { languageContext, languageStore, navigationContext, navigationStore } from '$lib/context.js';
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
		isAuthenticated: !!(data?.user),
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
			navigationItems.forEach(item => {
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

<div class="flex h-screen bg-gray-50">
	<!-- Sidebar -->
	<div class="hidden lg:flex lg:flex-shrink-0">
		<div class="flex flex-col w-64">
			<div class="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
				<!-- Logo -->
				<div class="flex items-center flex-shrink-0 px-4">
					<h1 class="text-xl font-bold text-gray-900">Zaur Dashboard</h1>
				</div>

				<!-- Navigation -->
				<nav class="mt-8 flex-1 px-2 space-y-1">
					{#each navigationItems as item}
						<a
							href={item.href}
							class="group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors {item.current 
								? 'bg-blue-100 text-blue-900' 
								: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
						>
							<svelte:component 
								this={item.icon} 
								class="mr-3 h-5 w-5 {item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}" 
							/>
							{item.name}
						</a>
					{/each}
				</nav>

				<!-- User section -->
				<div class="flex-shrink-0 flex border-t border-gray-200 p-4">
					<div class="flex items-center w-full">
						<div class="flex-shrink-0">
							<div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
								<User class="h-4 w-4 text-white" />
							</div>
						</div>
						<div class="ml-3 flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-900 truncate">
								{currentUser?.username || currentUser?.name || currentUser?.email || 'User'}
							</p>
							<div class="flex items-center gap-2 mt-1">
								<a href="/profile" class="text-xs text-gray-500 hover:text-gray-700 transition-colors">
									Profile
								</a>
								{#if data?.isAdmin}
									<span class="text-xs text-gray-300">•</span>
									<a href="/admin" class="text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1">
										<Shield class="h-3 w-3" />
										Admin
									</a>
								{/if}
							</div>
						</div>
						<button
							onclick={handleLogout}
							disabled={isLoggingOut}
							class="ml-2 p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
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
		<div class="fixed inset-0 flex z-40 lg:hidden">
			<div class="fixed inset-0 bg-gray-600 bg-opacity-75" onclick={closeSidebar}></div>
			<div class="relative flex-1 flex flex-col max-w-xs w-full bg-white">
				<div class="absolute top-0 right-0 -mr-12 pt-2">
					<button
						onclick={closeSidebar}
						class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
					>
						<X class="h-6 w-6 text-white" />
					</button>
				</div>
				
				<div class="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
					<!-- Mobile logo -->
					<div class="flex items-center flex-shrink-0 px-4">
						<h1 class="text-xl font-bold text-gray-900">Zaur Dashboard</h1>
					</div>

					<!-- Mobile navigation -->
					<nav class="mt-8 px-2 space-y-1">
						{#each navigationItems as item}
							<a
								href={item.href}
								onclick={closeSidebar}
								class="group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors {item.current 
									? 'bg-blue-100 text-blue-900' 
									: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
							>
								<svelte:component 
									this={item.icon} 
									class="mr-4 h-6 w-6 {item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}" 
								/>
								{item.name}
							</a>
						{/each}
					</nav>
				</div>

				<!-- Mobile user section -->
				<div class="flex-shrink-0 flex border-t border-gray-200 p-4">
					<div class="flex items-center w-full">
						<div class="flex-shrink-0">
							<div class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
								<User class="h-5 w-5 text-white" />
							</div>
						</div>
						<div class="ml-3 flex-1 min-w-0">
							<p class="text-base font-medium text-gray-900 truncate">
								{currentUser?.username || currentUser?.name || currentUser?.email || 'User'}
							</p>
							<div class="flex items-center gap-2 mt-1">
								<a href="/profile" onclick={closeSidebar} class="text-sm text-gray-500 hover:text-gray-700 transition-colors">
									Profile
								</a>
								{#if data?.isAdmin}
									<span class="text-sm text-gray-300">•</span>
									<a href="/admin" onclick={closeSidebar} class="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1">
										<Shield class="h-4 w-4" />
										Admin
									</a>
								{/if}
							</div>
						</div>
						<button
							onclick={handleLogout}
							disabled={isLoggingOut}
							class="ml-2 p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
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
	<div class="flex flex-col w-0 flex-1 overflow-hidden">
		<!-- Top bar for mobile -->
		<div class="lg:hidden">
			<div class="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2">
				<button
					onclick={() => sidebarOpen = true}
					class="p-2 rounded-md hover:bg-gray-100 transition-colors"
				>
					<Menu class="h-6 w-6 text-gray-600" />
				</button>
				<h1 class="text-lg font-semibold text-gray-900">Zaur Dashboard</h1>
				<div class="w-10"></div> <!-- Spacer for centering -->
			</div>
		</div>

		<!-- Page content -->
		<main class="flex-1 relative z-0 overflow-y-auto focus:outline-none">
			{@render children()}
		</main>
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style> 
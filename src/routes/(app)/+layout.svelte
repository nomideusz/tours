<script lang="ts">
	import { language, t } from '$lib/i18n.js';
	import { isAuthenticated, currentUser, isAdmin } from '$lib/stores/auth.js';
	import { logout } from '$lib/auth/client.js';
	import {
		languageContext,
		languageStore,
		navigationContext,
		navigationStore
	} from '$lib/context.js';
	import { afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { auth } from '$lib/stores/auth.js';
	import { setUserCurrencyFromServer } from '$lib/stores/currency.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import AppFooter from '$lib/components/AppFooter.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import NotificationInitializer from '$lib/components/NotificationInitializer.svelte';
	import { themeStore } from '$lib/stores/theme.js';
	import { onMount } from 'svelte';

	// Icons
	import Home from 'lucide-svelte/icons/home';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import User from 'lucide-svelte/icons/user';
	import Shield from 'lucide-svelte/icons/shield';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Settings from 'lucide-svelte/icons/settings';

	let { children, data } = $props<{ data?: any }>();

	// Track the current user ID to detect user changes
	let previousUserId = $state<string | null>(null);

	// Initialize auth store with server data
	$effect(() => {
		if (data) {
			// Check if user changed
			const currentUserId = data.user?.id || null;
			const userChanged = previousUserId !== null && previousUserId !== currentUserId;
			
			if (userChanged && data.queryClient) {
				// User changed - clear all cached data
				console.log('User changed, clearing query cache');
				data.queryClient.clear();
				data.queryClient.invalidateQueries();
			}
			
			previousUserId = currentUserId;
			
			auth.initialize(data);
			// Initialize user currency if available
			if (data.user?.currency) {
				setUserCurrencyFromServer(data.user.currency);
			}
		}
	});

	// Reactive values from auth stores
	let currentUserData = $derived($currentUser);
	let userIsAdmin = $derived($isAdmin);

	// Sidebar state (desktop only now)
	let sidebarOpen = $state(false);
	let isLoggingOut = $state(false);
	
	// Current pathname for navigation
	let currentPath = $state(browser ? window.location.pathname : '/dashboard');

	// App title for header - always "Dashboard"
	const pageTitle = 'zaur.app';

	// Set language context from the store
	languageContext.set(languageStore);

	// Set up navigation context
	navigationContext.set(navigationStore);

	// Close sidebar on navigation and update current path
	afterNavigate(() => {
		sidebarOpen = false;
		if (browser) {
			currentPath = window.location.pathname;
		}
	});

	// Navigation items for desktop sidebar
	const baseNavigationItems = $derived([
		{
			name: 'Dashboard',
			href: '/dashboard',
			icon: Home
		},
		{
			name: 'Tours Management',
			href: '/tours',
			icon: MapPin
		},
		{
			name: 'All Bookings',
			href: '/bookings',
			icon: Calendar
		},
		{
			name: 'QR Scanner',
			href: '/checkin-scanner',
			icon: QrCode
		},
		{
			name: 'Subscription',
			href: '/dashboard/subscription',
			icon: Settings
		}
	]);

	// Mobile bottom navigation items (prioritized for tour guides)
	const mobileNavItems = $derived([
		{
			name: 'Dashboard',
			href: '/dashboard',
			icon: Home,
			active: currentPath === '/dashboard'
		},
		{
			name: 'Scanner',
			href: '/checkin-scanner',
			icon: QrCode,
			active: currentPath === '/checkin-scanner'
		},
		{
			name: 'Bookings',
			href: '/bookings',
			icon: Calendar,
			active: currentPath.startsWith('/bookings')
		},
		{
			name: 'Tours',
			href: '/tours',
			icon: MapPin,
			active: currentPath.startsWith('/tours')
		},
		{
			name: 'Profile',
			href: '/profile',
			icon: User,
			active: currentPath === '/profile'
		}
	]);

	// Create reactive navigation items with current state for desktop
	const navigationItems = $derived(
		baseNavigationItems.map(item => ({
			...item,
			current: currentPath === item.href || 
			         (currentPath.startsWith(item.href) && item.href !== '/dashboard')
		}))
	);

	// Real-time notifications will be initialized after QueryClientProvider is ready

	async function handleLogout(event: Event) {
		event.preventDefault();

		if (isLoggingOut) return;

		isLoggingOut = true;

		try {
			await logout('/auth/login', data.queryClient);
		} catch (error) {
			console.error('Error during logout:', error);
		} finally {
			isLoggingOut = false;
		}
	}

	// Theme communication with embedded widgets
	onMount(() => {
		let currentTheme: 'light' | 'dark' = 'light';
		
		// Subscribe to theme changes and notify embedded widgets
		const unsubscribe = themeStore.subscribe(theme => {
			const effectiveTheme = themeStore.getEffective(theme);
			currentTheme = effectiveTheme;
			
			// Notify all embedded widgets about theme change
			const iframes = document.querySelectorAll('iframe[src*="/embed/"]');
			iframes.forEach(iframe => {
				const iframeWindow = (iframe as HTMLIFrameElement).contentWindow;
				if (iframeWindow) {
					try {
						iframeWindow.postMessage({
							type: 'theme-change',
							theme: effectiveTheme
						}, '*');
					} catch (e) {
						// Ignore cross-origin errors
					}
				}
			});
		});
		
		// Listen for theme requests from embedded widgets
		const handleMessage = (event: MessageEvent) => {
			if (event.data.type === 'request-theme') {
				// Send current theme to requesting widget
				try {
					(event.source as Window)?.postMessage({
						type: 'theme-change',
						theme: currentTheme
					}, '*');
				} catch (e) {
					// Ignore cross-origin errors
				}
			}
		};
		
		window.addEventListener('message', handleMessage);
		
		return () => {
			unsubscribe();
			window.removeEventListener('message', handleMessage);
		};
	});

</script>

<!-- TanStack Query Provider for App -->
<QueryClientProvider client={data.queryClient}>
	<!-- Initialize notifications within QueryClient context -->
	<NotificationInitializer />
	
	<!-- App Layout: Header + Sidebar + Main + Footer -->
	<div class="min-h-screen flex flex-col overflow-x-hidden" style="background: var(--bg-secondary);">
		<!-- App Header - Fixed at top -->
		<div class="fixed top-0 left-0 right-0 z-40">
			<AppHeader 
				{pageTitle}
				user={currentUserData}
				sidebarOpen={false}
				onSidebarToggle={() => {}} 
				onLogout={() => handleLogout(new Event('click'))}
				showSidebarToggle={false}
			/>
		</div>

	<!-- Main content area with sidebar -->
	<div class="flex flex-1 min-w-0 pt-16">
		<!-- Desktop Sidebar - Fixed position -->
		<div class="hidden lg:block">
			<div class="fixed left-0 w-64 flex flex-col" style="top: 4rem; height: calc(100vh - 4rem);">
				<div
					class="flex flex-col h-full pt-5"
					style="border-right: 1px solid var(--border-primary); background: var(--bg-primary);"
				>
					<!-- Navigation - Scrollable area -->
					<nav class="flex-1 overflow-y-auto space-y-1 px-2 mt-5 min-h-0">
						{#each navigationItems as item}
							<a
								href={item.href}
								class="group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors min-w-0"
								style={item.current
									? 'background: var(--color-primary-100); color: var(--color-primary-900);'
									: 'color: var(--text-secondary);'}
								onmouseenter={(e) => e.currentTarget.style.background = item.current ? 'var(--color-primary-100)' : 'var(--bg-tertiary)'}
								onmouseleave={(e) => e.currentTarget.style.background = item.current ? 'var(--color-primary-100)' : 'transparent'}
							>
								<item.icon
									class="mr-3 h-5 w-5 flex-shrink-0"
									style={item.current
										? 'color: var(--color-primary-500);'
										: 'color: var(--text-tertiary);'}
								/>
								<span class="truncate">{item.name}</span>
							</a>
						{/each}
					</nav>

					<!-- User section - Sticky at bottom -->
					<div class="flex-shrink-0 border-t p-4" style="border-color: var(--border-primary);">
						<div class="flex w-full items-center justify-between min-w-0">
							<div class="flex items-center gap-2 min-w-0 flex-1">
								<Tooltip text="Edit Profile Settings" position="top-right">
									<a
										href="/profile"
										title=""
										class="flex items-center gap-1 text-xs transition-colors hover:text-blue-600 flex-shrink-0"
										style="color: var(--text-secondary);"
									>
										<Settings class="h-3 w-3" />
										<span class="hidden xl:inline">Settings</span>
									</a>
								</Tooltip>
								{#if userIsAdmin}
									<span style="color: var(--text-tertiary);" class="hidden xl:inline">•</span>
									<Tooltip text="Admin Panel" position="top">
										<a
											href="/admin"
											title=""
											class="flex items-center gap-1 text-xs transition-colors hover:text-blue-600 flex-shrink-0"
											style="color: var(--text-secondary);"
										>
											<Shield class="h-3 w-3" />
											<span class="hidden xl:inline">Admin</span>
										</a>
									</Tooltip>
								{/if}
							</div>
							<Tooltip text="Sign out" position="top">
								<button
									onclick={handleLogout}
									disabled={isLoggingOut}
									class="rounded p-1 transition-colors hover:bg-gray-100 disabled:opacity-50 flex-shrink-0"
									style="color: var(--text-secondary);"
								>
									{#if isLoggingOut}
										<Loader2 class="h-4 w-4 animate-spin" />
									{:else}
										<LogOut class="h-4 w-4" />
									{/if}
								</button>
							</Tooltip>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Main content -->
		<div class="flex w-0 flex-1 flex-col overflow-hidden min-w-0 lg:pl-64">
			<!-- Page content with bottom padding on mobile for bottom nav -->
			<main class="relative z-0 flex-1 overflow-y-auto overflow-x-hidden focus:outline-none pb-20 lg:pb-0">
				{@render children()}
			</main>
		</div>
	</div>

	<!-- Mobile Bottom Navigation -->
	<div class="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t overflow-x-hidden" style="background: var(--bg-primary); border-color: var(--border-primary);">
		<nav class="flex min-w-0">
			{#each mobileNavItems as item}
				<a
					href={item.href}
					class="flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors min-w-0"
					style={item.active 
						? 'color: var(--color-primary-600);' 
						: 'color: var(--text-tertiary);'}
				>
					<item.icon 
						class="h-6 w-6 mb-1 flex-shrink-0" 
						style={item.active 
							? 'color: var(--color-primary-600);' 
							: 'color: var(--text-tertiary);'}
					/>
					<span class="truncate text-center w-full">{item.name}</span>
				</a>
			{/each}
		</nav>
	</div>

	<!-- App Footer - Hide on mobile since we have bottom nav -->
	<div class="hidden lg:block lg:pl-64">
		<AppFooter />
	</div>
	</div>
	<SvelteQueryDevtools />
</QueryClientProvider>
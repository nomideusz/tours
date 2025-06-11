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
	import AppHeader from '$lib/components/AppHeader.svelte';
	import AppFooter from '$lib/components/AppFooter.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';

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

	// Initialize auth store with server data
	$effect(() => {
		if (data) {
			auth.initialize(data);
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

	async function handleLogout(event: Event) {
		event.preventDefault();

		if (isLoggingOut) return;

		isLoggingOut = true;

		try {
			await logout('/auth/login');
		} catch (error) {
			console.error('Error during logout:', error);
		} finally {
			isLoggingOut = false;
		}
	}

</script>

<!-- App Layout: Header + Sidebar + Main + Footer -->
<div class="min-h-screen flex flex-col overflow-x-hidden" style="background: var(--bg-secondary);">
	<!-- App Header - Hide hamburger menu on mobile since we're using bottom nav -->
	<AppHeader 
		{pageTitle}
		user={currentUserData}
		sidebarOpen={false}
		onSidebarToggle={() => {}} 
		onLogout={() => handleLogout(new Event('click'))}
		showSidebarToggle={false}
	/>

	<!-- Main content area with sidebar -->
	<div class="flex flex-1 min-w-0">
		<!-- Desktop Sidebar -->
		<div class="hidden lg:flex lg:flex-shrink-0">
			<div class="flex w-64 flex-col">
				<div
					class="flex flex-grow flex-col overflow-y-auto overflow-x-hidden pt-5 pb-4"
					style="border-right: 1px solid var(--border-primary); background: var(--bg-primary);"
				>
					<!-- Navigation -->
					<nav class="mt-5 flex-1 space-y-1 px-2">
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

					<!-- User section -->
					<div class="flex flex-shrink-0 border-t p-4" style="border-color: var(--border-primary);">
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
		<div class="flex w-0 flex-1 flex-col overflow-hidden min-w-0">
			<!-- Page content with bottom padding on mobile for bottom nav -->
			<main class="relative z-0 flex-1 overflow-y-auto overflow-x-hidden focus:outline-none pb-20 lg:pb-0">
				{@render children()}
			</main>
		</div>
	</div>

	<!-- Mobile Bottom Navigation -->
	<div class="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t overflow-x-hidden" style="background: var(--bg-primary); border-color: var(--border-primary);">
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
	<div class="hidden lg:block">
		<AppFooter />
	</div>
</div>
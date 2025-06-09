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
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import AppFooter from '$lib/components/AppFooter.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';

	// Icons
	import Menu from 'lucide-svelte/icons/menu';
	import X from 'lucide-svelte/icons/x';
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
	let userIsAuthenticated = $derived($isAuthenticated);
	let currentUserData = $derived($currentUser);
	let userIsAdmin = $derived($isAdmin);

	// Sidebar state
	let sidebarOpen = $state(false);
	let isLoggingOut = $state(false);

	// App title for header - always "Dashboard"
	const pageTitle = 'Dashboard';

	// Set language context from the store
	languageContext.set(languageStore);

	// Set up navigation context
	navigationContext.set(navigationStore);

	// Close sidebar on navigation
	afterNavigate(() => {
		sidebarOpen = false;
	});

	// Navigation items
	const baseNavigationItems = $derived([
		{
			name: 'Operations Center',
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

	// Create reactive navigation items with current state
	const navigationItems = $derived(
		baseNavigationItems.map(item => ({
			...item,
			current: $page.url.pathname === item.href || 
			         ($page.url.pathname.startsWith(item.href) && item.href !== '/dashboard')
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

	function closeSidebar() {
		sidebarOpen = false;
	}
</script>

<!-- App Layout: Header + Sidebar + Main + Footer -->
<div class="min-h-screen flex flex-col" style="background: var(--bg-secondary);">
	<!-- App Header -->
	<AppHeader 
		{pageTitle}
		user={currentUserData}
		{sidebarOpen}
		onSidebarToggle={() => sidebarOpen = !sidebarOpen}
		onLogout={() => handleLogout(new Event('click'))}
	/>

	<!-- Main content area with sidebar -->
	<div class="flex flex-1">
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
								class="group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors"
								style="{item.current
									? 'background: var(--color-primary-100); color: var(--color-primary-900);'
									: 'color: var(--text-secondary);'}"
								onmouseenter={(e) => e.currentTarget.style.background = item.current ? 'var(--color-primary-100)' : 'var(--bg-tertiary)'}
								onmouseleave={(e) => e.currentTarget.style.background = item.current ? 'var(--color-primary-100)' : 'transparent'}
							>
								<item.icon
									class="mr-3 h-5 w-5"
									style={item.current
										? 'color: var(--color-primary-500);'
										: 'color: var(--text-tertiary);'}
								/>
								{item.name}
							</a>
						{/each}
					</nav>

					<!-- User section -->
					<div class="flex flex-shrink-0 border-t p-4" style="border-color: var(--border-primary);">
											<div class="flex w-full items-center justify-between">
						<div class="flex items-center gap-2 min-w-0">
							<Tooltip text="Edit Profile Settings" position="top-right">
								<a
									href="/profile"
									title=""
									class="flex items-center gap-1 text-xs transition-colors hover:text-blue-600"
									style="color: var(--text-secondary);"
								>
									<Settings class="h-3 w-3" />
									Settings
								</a>
							</Tooltip>
							{#if userIsAdmin}
								<span style="color: var(--text-tertiary);">•</span>
								<Tooltip text="Admin Panel" position="top">
									<a
										href="/admin"
										title=""
										class="flex items-center gap-1 text-xs transition-colors hover:text-blue-600"
										style="color: var(--text-secondary);"
									>
										<Shield class="h-3 w-3" />
										Admin
									</a>
								</Tooltip>
							{/if}
						</div>
						<Tooltip text="Sign out" position="top">
							<button
								onclick={handleLogout}
								disabled={isLoggingOut}
								class="rounded p-1 transition-colors hover:bg-gray-100 disabled:opacity-50"
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
		<div class="flex w-0 flex-1 flex-col overflow-hidden">
			<!-- Page content -->
			<main class="relative z-0 flex-1 overflow-y-auto focus:outline-none">
				{@render children()}
			</main>
		</div>
	</div>

	<!-- Mobile sidebar overlay -->
	{#if sidebarOpen}
		<div class="fixed inset-0 z-40 flex lg:hidden">
			<div 
				role="button" 
				tabindex="-1"
				class="bg-opacity-75 fixed inset-0 bg-gray-600" 
				onclick={closeSidebar}
				onkeydown={(e) => e.key === 'Escape' && closeSidebar()}
			></div>
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
					<!-- Mobile navigation -->
					<nav class="space-y-1 px-2">
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
					<div class="flex w-full items-center justify-between">
						<div class="flex items-center gap-3">
							<Tooltip text="Edit Profile Settings" position="top">
								<a
									href="/profile"
									title=""
									onclick={closeSidebar}
									class="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
								>
									<Settings class="h-4 w-4" />
									Settings
								</a>
							</Tooltip>
							{#if userIsAdmin}
								<Tooltip text="Admin Panel" position="top">
									<a
										href="/admin"
										title=""
										onclick={closeSidebar}
										class="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
									>
										<Shield class="h-4 w-4" />
										Admin
									</a>
								</Tooltip>
							{/if}
						</div>
						<Tooltip text="Sign out" position="top">
							<button
								onclick={handleLogout}
								disabled={isLoggingOut}
								class="rounded p-2 transition-colors hover:bg-gray-100 disabled:opacity-50"
							>
								{#if isLoggingOut}
									<Loader2 class="h-5 w-5 animate-spin text-gray-500" />
								{:else}
									<LogOut class="h-5 w-5 text-gray-500" />
								{/if}
							</button>
						</Tooltip>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- App Footer -->
	<AppFooter />
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style>

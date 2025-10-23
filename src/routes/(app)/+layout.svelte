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
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { auth } from '$lib/stores/auth.js';
	import { setUserCurrencyFromServer } from '$lib/stores/currency.js';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import AppFooter from '$lib/components/AppFooter.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import InstallPWAPrompt from '$lib/components/InstallPWAPrompt.svelte';
	import FeedbackWidget from '$lib/components/FeedbackWidget.svelte';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import NotificationInitializer from '$lib/components/NotificationInitializer.svelte';
	import BetaWelcomeModal from '$lib/components/BetaWelcomeModal.svelte';
	import { themeStore } from '$lib/stores/theme.js';
	import { onMount, onDestroy } from 'svelte';
	import { unreadCount, unreadBookingCount } from '$lib/stores/notifications.js';

	// Icons
	import Home from 'lucide-svelte/icons/home';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import User from 'lucide-svelte/icons/user';
	import Users from 'lucide-svelte/icons/users';
	import Shield from 'lucide-svelte/icons/shield';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Settings from 'lucide-svelte/icons/settings';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import MoreVertical from 'lucide-svelte/icons/more-vertical';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import X from 'lucide-svelte/icons/x';

	// Type definitions
	interface NavigationItem {
		name: string;
		href: string;
		icon: any;
		description: string;
		showOnMobile?: boolean;
		badge?: number | null;
		current?: boolean;
	}

	interface NavigationSection {
		name: string;
		items: NavigationItem[];
	}

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
	
	// Beta welcome modal state
	let showBetaWelcome = $state(false);
	
	// Current pathname for navigation
	let currentPath = $state(browser ? window.location.pathname : '/calendar');

	// Set language context from the store
	languageContext.set(languageStore);

	// Set up navigation context
	navigationContext.set(navigationStore);

	// Mobile menu state
	let mobileMenuOpen = $state(false);
	
	// Avatar loading state
	let avatarLoadError = $state(false);

	// Close sidebar on navigation and update current path
	afterNavigate(() => {
		sidebarOpen = false;
		mobileMenuOpen = false;
		if (browser) {
			currentPath = window.location.pathname;
		}
	});

	// Reset avatar error state when user data changes
	$effect(() => {
		if (currentUserData?.avatar) {
			avatarLoadError = false;
		}
	});

	// Navigation sections for better organization
	const navigationSections = $derived([
		{
			name: 'Main',
			items: [
				{
				name: 'Calendar',
				href: '/calendar',
				icon: Home,
				description: 'Tour schedule & bookings',
					showOnMobile: true,
					badge: null as number | null
				}
			]
		},
		{
			name: 'Tour Management',
			items: [
				{
					name: 'My Tours',
					href: '/tours',
					icon: MapPin,
					description: 'Manage your tours',
					showOnMobile: true,
					badge: null as number | null
				},
			{
				name: 'Bookings',
				href: '/bookings',
				icon: Calendar,
				description: 'View all bookings',
				showOnMobile: true,
				badge: $unreadBookingCount > 0 ? $unreadBookingCount : null
			},
			{
				name: 'Transfers',
				href: '/transfers',
				icon: DollarSign,
				description: 'Payment transfers',
				showOnMobile: false,
				badge: null as number | null
			},
			{
				name: 'Check-in Scanner',
				href: '/checkin-scanner',
				icon: QrCode,
				description: 'Scan QR tickets',
				showOnMobile: true,
				badge: null as number | null
			}
			]
		},
		{
			name: 'Business',
			items: [
				{
					name: 'Marketing',
					href: '/marketing',
					icon: Sparkles,
					description: 'Create promotional materials',
					showOnMobile: true,
					badge: null as number | null
				},
				{
					name: 'Customers',
					href: '/customers',
					icon: Users,
					description: 'Manage customer contacts',
					showOnMobile: true,
					badge: null as number | null
				},
				{
					name: 'Analytics',
					href: '/analytics',
					icon: TrendingUp,
					description: 'Performance insights',
					showOnMobile: true,
					badge: null as number | null
				},
				{
					name: 'Subscription',
					href: '/subscription',
					icon: CreditCard,
					description: 'Manage your plan',
					showOnMobile: true,
					badge: null as number | null
				}
			]
		},
		{
			name: 'Beta Testing',
			items: [
				{
					name: 'Feature Demos',
					href: '/demo',
					icon: FlaskConical,
					description: 'Test new features & give feedback',
					showOnMobile: true,
					badge: null as number | null
				}
			]
		}
	]);

	// Mobile bottom navigation items (prioritized for tour guides)
	const mobileNavItems = $derived.by(() => {
		// Check if we're viewing tour-specific bookings
		const isTourBookings = currentPath === '/bookings' && $page.url.searchParams.has('tour');
		
		return [
			{
				name: 'Home',
				href: '/calendar',
				icon: Home,
				active: currentPath === '/calendar'
			},
			{
				name: 'Bookings',
				href: '/bookings',
				icon: Calendar,
				active: currentPath === '/bookings' && !isTourBookings,
				badge: $unreadBookingCount > 0 ? $unreadBookingCount : null
			},
			{
				name: 'Scanner',
				href: '/checkin-scanner',
				icon: QrCode,
				active: currentPath === '/checkin-scanner'
			},
			{
				name: 'Tours',
				href: '/tours',
				icon: MapPin,
				active: currentPath.startsWith('/tours') || isTourBookings
			},
			{
				name: 'More',
				href: '#',
				icon: MoreVertical,
				active: false,
				isMenu: true
			}
		];
	});

	// All navigation items for mobile menu (Profile moved to user section)
	const mobileMenuItems = $derived([
		{
			name: 'Transfers',
			href: '/transfers',
			icon: DollarSign,
			description: 'Payment transfers'
		},
		{
			name: 'Marketing',
			href: '/marketing',
			icon: Sparkles,
			description: 'Create promotional materials'
		},
		{
			name: 'Customers',
			href: '/customers',
			icon: Users,
			description: 'Manage customer contacts'
		},
		{
			name: 'Analytics',
			href: '/analytics',
			icon: TrendingUp,
			description: 'View performance'
		},
		{
			name: 'Subscription',
			href: '/subscription',
			icon: CreditCard,
			description: 'Manage your plan'
		},
		{
			name: 'Feature Demos',
			href: '/demo',
			icon: FlaskConical,
			description: 'Test new features'
		},
		...(userIsAdmin ? [{
			name: 'Admin',
			href: '/admin',
			icon: Shield,
			description: 'Admin panel'
		}] : [])
	]);

	// Create reactive navigation items with current state for desktop
	const navigationItems = $derived(
		navigationSections.map(section => ({
			...section,
			items: section.items.map(item => {
				// Check if we're viewing tour-specific bookings
				const isTourBookings = currentPath === '/bookings' && $page.url.searchParams.has('tour');
				
				let current = false;
				
				if (item.href === '/tours' && isTourBookings) {
					// When viewing tour-specific bookings, highlight "My Tours" instead
					current = true;
				} else if (item.href === '/bookings' && isTourBookings) {
					// Don't highlight "Bookings" when viewing tour-specific bookings
					current = false;
				} else {
					// Normal navigation highlighting logic
					current = currentPath === item.href || 
					         (currentPath.startsWith(item.href) && item.href !== '/calendar');
				}
				
				return {
					...item,
					current
				};
			})
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
		
		// Check if user is a beta tester and show welcome modal
		// Beta testers have early_access_member flag set to true in database (camelCase in JS)
		if (currentUserData && 'earlyAccessMember' in currentUserData && (currentUserData as any).earlyAccessMember) {
			const hasSeenWelcome = localStorage.getItem('beta_welcome_seen');
			if (!hasSeenWelcome) {
				// Small delay for better UX after login
				setTimeout(() => {
					showBetaWelcome = true;
				}, 800);
			}
		}
		
		// Clean up resources on page unload/refresh
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			console.log('🧹 Page unloading - cleaning up resources...');
			
			// Force cleanup of any notification connections - only dispatch once
			window.dispatchEvent(new Event('force-cleanup'));
			
			// Cancel all queries if queryClient exists
			if (data.queryClient) {
				data.queryClient.cancelQueries();
			}
		};
		
		window.addEventListener('beforeunload', handleBeforeUnload);
		
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
			window.removeEventListener('beforeunload', handleBeforeUnload);
			unsubscribe();
			window.removeEventListener('message', handleMessage);
		};
	});

	function toggleMobileMenu(event: Event) {
		event.preventDefault();
		mobileMenuOpen = !mobileMenuOpen;
	}
	
	function handleCloseBetaWelcome() {
		showBetaWelcome = false;
		if (browser) {
			localStorage.setItem('beta_welcome_seen', 'true');
		}
	}

	// Close mobile menu when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const menu = document.getElementById('mobile-menu');
		const trigger = document.getElementById('mobile-menu-trigger');
		
		if (menu && trigger && !menu.contains(target) && !trigger.contains(target)) {
			mobileMenuOpen = false;
		}
	}

	$effect(() => {
		if (browser && mobileMenuOpen) {
			document.addEventListener('click', handleClickOutside);
			
			// Prevent body scroll when menu is open (mobile-friendly approach)
			const scrollY = window.scrollY;
			const body = document.body;
			const originalPosition = body.style.position;
			const originalTop = body.style.top;
			const originalWidth = body.style.width;
			const originalOverflow = body.style.overflow;
			
			body.style.position = 'fixed';
			body.style.top = `-${scrollY}px`;
			body.style.width = '100%';
			body.style.overflow = 'hidden';
			
			return () => {
				document.removeEventListener('click', handleClickOutside);
				
				// Restore scroll position
				body.style.position = originalPosition;
				body.style.top = originalTop;
				body.style.width = originalWidth;
				body.style.overflow = originalOverflow;
				window.scrollTo(0, scrollY);
			};
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		// QueryClient will be cleaned up by the provider
		console.log('🧹 App layout: Cleaning up...');
		
		// Clear any remaining intervals or connections
		if (browser) {
			// Force cleanup of any lingering connections
			window.dispatchEvent(new Event('force-cleanup'));
		}
	});

</script>

<!-- TanStack Query Provider for App -->
<QueryClientProvider client={data.queryClient}>
	<!-- Initialize notifications within QueryClient context -->
	<NotificationInitializer />
	
	<!-- Beta Welcome Modal -->
	{#if showBetaWelcome}
		<BetaWelcomeModal on:close={handleCloseBetaWelcome} />
	{/if}
	
	<!-- App Layout: Header + Sidebar + Main + Footer -->
	<div class="min-h-screen flex flex-col overflow-x-hidden">
		<!-- App Header -->
		<AppHeader 
			user={currentUserData}
		/>

		<!-- Main content area with sidebar -->
		<div class="flex flex-1 min-w-0 pt-16 overflow-x-hidden"> <!-- Standard padding for AppHeader -->
			<!-- Desktop Sidebar - Fixed position -->
			<div class="hidden lg:block">
				<div class="professional-sidebar">
					<div class="sidebar-container">
						<!-- Navigation - Scrollable area -->
						<nav class="sidebar-nav">
							{#each navigationItems as section}
								<div class="nav-section">
									<h3 class="nav-section-header">
										{section.name}
									</h3>
									<div class="nav-section-items">
										{#each section.items as item}
											<a
												href={item.href}
												class="nav-link {item.current ? 'nav-link--active' : ''}"
											>
												<div class="nav-link-content">
													<item.icon class="nav-link-icon" />
													<span class="nav-link-text">{item.name}</span>
												</div>
												{#if item.badge}
													<span class="nav-badge">
														{item.badge}
													</span>
												{/if}
											</a>
										{/each}
									</div>
								</div>
							{/each}
						</nav>

						<!-- User section - Sticky at bottom -->
						<div class="sidebar-user">
							{#if currentUserData}
								<div class="user-profile">
									<a href="/profile" class="user-profile-link">
																			<div class="user-avatar">
										{#if currentUserData.avatar && !avatarLoadError}
											<img 
												src={currentUserData.avatar} 
												alt={currentUserData.name || 'User'} 
												class="avatar-image"
												onerror={() => avatarLoadError = true}
											/>
										{:else}
											<div class="avatar-fallback">
												<User class="h-4 w-4" />
											</div>
										{/if}
									</div>
										<div class="user-info">
											<p class="user-name">{currentUserData.name || 'Profile'}</p>
											<p class="user-email">{currentUserData.email}</p>
										</div>
										<Settings class="user-settings-icon" />
									</a>
									
									<div class="user-actions">
										{#if userIsAdmin}
											<a href="/admin" class="user-action-button">
												<Shield class="h-3.5 w-3.5" />
												<span>Admin</span>
											</a>
										{/if}
										<button
											onclick={handleLogout}
											disabled={isLoggingOut}
											class="user-action-button user-action-button--logout"
										>
											{#if isLoggingOut}
												<Loader2 class="h-3.5 w-3.5 animate-spin" />
											{:else}
												<LogOut class="h-3.5 w-3.5" />
											{/if}
											<span>Sign out</span>
										</button>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Main content -->
			<div class="flex w-0 flex-1 flex-col overflow-hidden min-w-0 lg:pl-72">
				<!-- Page content with bottom padding on mobile for bottom nav -->
				<main class="main-content relative flex-1 overflow-y-auto overflow-x-hidden focus:outline-none app-texture-overlay pt-6 lg:pt-0">
					{@render children()}
				</main>
				
				<!-- App Footer - Desktop only -->
				<div class="hidden lg:block">
					<AppFooter />
				</div>
			</div>
		</div>

		<!-- Feedback Widget for Beta Users -->
		<FeedbackWidget />

		<!-- PWA Install Prompt -->
		<InstallPWAPrompt />

		<!-- Mobile Bottom Navigation -->
		<div class="mobile-bottom-nav lg:hidden border-t overflow-x-hidden" style="background: var(--bg-primary); border-color: var(--border-primary);">
			<nav class="flex min-w-0">
				{#each mobileNavItems as item}
					{#if item.isMenu}
						<button
							id="mobile-menu-trigger"
							onclick={toggleMobileMenu}
							class="nav-link flex-1 flex flex-col items-center justify-center py-2 px-0.5 font-medium transition-colors min-w-0 relative"
							style="color: var(--text-tertiary); font-size: 10px;"
						>
							<div class="relative">
								<item.icon 
									class="h-5 w-5 mb-0.5 flex-shrink-0" 
									style="color: var(--text-tertiary);"
								/>
							</div>
							<span class="truncate text-center w-full max-w-full px-0.5">{item.name}</span>
						</button>
					{:else}
						<a
							href={item.href}
							class="nav-link flex-1 flex flex-col items-center justify-center py-2 px-0.5 font-medium transition-colors min-w-0 relative"
							style="{item.active 
								? 'color: var(--color-primary-600);' 
								: 'color: var(--text-tertiary);'} text-decoration: none; font-size: 10px;"
						>
							<div class="relative">
								<item.icon 
									class="h-5 w-5 mb-0.5 flex-shrink-0" 
									style={item.active 
										? 'color: var(--color-primary-600);' 
										: 'color: var(--text-tertiary);'}
								/>
								{#if item.badge}
									<span class="nav-badge-mobile">
										{item.badge}
									</span>
								{/if}
							</div>
							<span class="truncate text-center w-full max-w-full px-0.5">{item.name}</span>
						</a>
					{/if}
				{/each}
			</nav>
		</div>
		
		<!-- Mobile Menu Dropdown -->
		{#if mobileMenuOpen}
			<div 
				class="lg:hidden fixed inset-0 z-50 mobile-menu-backdrop" 
				style="background: rgba(0, 0, 0, 0.5);"
				onclick={() => mobileMenuOpen = false}
			>
				<div 
					class="fixed bottom-0 left-0 right-0 z-50 mobile-menu-panel" 
					id="mobile-menu"
					onclick={(e) => e.stopPropagation()}
				>
					<div class="rounded-t-xl shadow-lg mobile-menu-container" style="background: var(--bg-primary); border-top: 1px solid var(--border-primary);">
						<!-- Menu Header -->
						<div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: var(--border-primary);">
							<h3 class="text-base font-semibold" style="color: var(--text-primary);">Menu</h3>
							<button
								onclick={() => mobileMenuOpen = false}
								class="p-1 rounded-md transition-colors"
								style="color: var(--text-tertiary);"
								onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
								onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
							>
								<X class="h-5 w-5" />
							</button>
						</div>
						
						<!-- Menu Items -->
						<div class="mobile-menu-items">
							{#each mobileMenuItems as item}
								<a
									href={item.href}
									class="flex items-center gap-3 px-4 py-3 transition-colors"
									style="color: var(--text-secondary); text-decoration: none;"
									onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
									onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
								>
									<item.icon class="h-5 w-5 flex-shrink-0" style="color: var(--text-tertiary);" />
									<div class="flex-1">
										<p class="text-sm font-medium">{item.name}</p>
										<p class="text-xs" style="color: var(--text-tertiary);">{item.description}</p>
									</div>
								</a>
							{/each}
							
							<!-- User Info -->
							{#if currentUserData}
								<div class="border-t mt-2 pt-2" style="border-color: var(--border-primary);">
									<!-- Profile Link with User Info -->
									<a
										href="/profile"
										class="flex items-center gap-3 px-4 py-3 transition-colors"
										style="color: var(--text-secondary); text-decoration: none;"
										onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
										onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
									>
										<div class="flex-shrink-0">
											{#if currentUserData.avatar && !avatarLoadError}
												<img 
													src={currentUserData.avatar} 
													alt={currentUserData.name || 'User'} 
													class="h-10 w-10 rounded-full object-cover"
													onerror={() => avatarLoadError = true}
												/>
											{:else}
												<div class="h-10 w-10 rounded-full flex items-center justify-center" style="background: var(--bg-tertiary); color: var(--text-secondary);">
													<User class="h-5 w-5" />
												</div>
											{/if}
										</div>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium truncate" style="color: var(--text-primary);">{currentUserData.name || 'User'}</p>
											<p class="text-xs truncate" style="color: var(--text-tertiary);">{currentUserData.email}</p>
										</div>
										<Settings class="h-5 w-5 flex-shrink-0" style="color: var(--text-tertiary);" />
									</a>
									
									<!-- Sign Out -->
									<button
										onclick={handleLogout}
										disabled={isLoggingOut}
										class="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all disabled:opacity-50"
										style="color: var(--text-secondary);"
										onmouseenter={(e) => {
											e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
											e.currentTarget.style.color = 'rgb(239, 68, 68)';
										}}
										onmouseleave={(e) => {
											e.currentTarget.style.backgroundColor = 'transparent';
											e.currentTarget.style.color = 'var(--text-secondary)';
										}}
									>
										{#if isLoggingOut}
											<Loader2 class="h-4 w-4 animate-spin" />
										{:else}
											<LogOut class="h-4 w-4" />
										{/if}
										<span>Sign out</span>
									</button>
								</div>
							{/if}
						</div>
						
						<!-- Safe area padding for devices with home indicator -->
						<div class="h-safe-area-inset-bottom"></div>
					</div>
				</div>
			</div>
		{/if}
	</div>
	<SvelteQueryDevtools />
</QueryClientProvider>

<style>
	/* Safe area padding for devices with home indicator */
	.h-safe-area-inset-bottom {
		height: env(safe-area-inset-bottom, 0);
	}
	
	/* Main content padding for bottom navigation */
	.main-content {
		padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0));
	}
	
	@media (min-width: 1024px) {
		.main-content {
			padding-bottom: 0;
		}
	}
	
	/* Mobile Bottom Navigation - iOS Safari safe positioning */
	.mobile-bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 40;
		padding-bottom: env(safe-area-inset-bottom, 0);
		/* Prevent any gaps on iOS Safari */
		transform: translateZ(0);
		-webkit-transform: translateZ(0);
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		/* Additional iOS Safari fixes */
		will-change: transform;
		-webkit-perspective: 1000;
		perspective: 1000;
	}
	
	/* Ensure the nav stays at the bottom even when iOS Safari UI changes */
	@supports (padding-bottom: env(safe-area-inset-bottom)) {
		.mobile-bottom-nav {
			padding-bottom: env(safe-area-inset-bottom, 0);
		}
	}
	
	/* Mobile menu animation */
	.mobile-menu-backdrop {
		animation: fadeIn 0.2s ease-out;
		position: fixed;
		overflow: hidden;
		touch-action: none;
		overscroll-behavior: none;
		-webkit-overflow-scrolling: auto;
	}
	
	.mobile-menu-panel {
		animation: slideUp 0.2s ease-out;
		touch-action: pan-y;
		overscroll-behavior: contain;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	@keyframes slideUp {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
	}
	
	/* Mobile menu container - limit height and enable scrolling */
	.mobile-menu-container {
		display: flex;
		flex-direction: column;
		max-height: 80vh;
		overflow: hidden;
	}
	
	.mobile-menu-items {
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior: contain;
	}
	
	/* Scrollbar styling for mobile menu */
	.mobile-menu-items::-webkit-scrollbar {
		width: 4px;
	}
	
	.mobile-menu-items::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.mobile-menu-items::-webkit-scrollbar-thumb {
		background: var(--border-primary);
		border-radius: 2px;
	}
	
	/* Remove underlines from all navigation links */
	.nav-link,
	#mobile-menu a,
	nav a {
		text-decoration: none !important;
	}
	
	.nav-link:hover,
	.nav-link:active,
	.nav-link:visited,
	.nav-link:focus,
	#mobile-menu a:hover,
	#mobile-menu a:active,
	#mobile-menu a:visited,
	#mobile-menu a:focus,
	nav a:hover,
	nav a:active,
	nav a:visited,
	nav a:focus {
		text-decoration: none !important;
	}

	/* Professional Sidebar */
	.professional-sidebar {
		position: fixed;
		left: 0;
		top: 5rem;
		width: 18rem;
		height: calc(100vh - 5rem);
		z-index: 30;
		background: var(--bg-primary);
		border-right: 1px solid var(--border-primary);
		box-shadow: var(--shadow-xs);
		transition: all var(--transition-base) ease;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.sidebar-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding-top: 1.5rem;
	}

	/* Navigation */
	.sidebar-nav {
		flex: 1;
		overflow-y: auto;
		padding: 0 1.5rem;
		min-height: 0;
		scrollbar-width: thin;
		scrollbar-color: var(--border-primary) transparent;
	}

	.sidebar-nav::-webkit-scrollbar {
		width: 6px;
	}

	.sidebar-nav::-webkit-scrollbar-track {
		background: transparent;
	}

	.sidebar-nav::-webkit-scrollbar-thumb {
		background: var(--border-primary);
		border-radius: 3px;
	}

	.sidebar-nav::-webkit-scrollbar-thumb:hover {
		background: var(--border-secondary);
	}

	.nav-section {
		margin-bottom: 2rem;
	}

	.nav-section-header {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
		padding: 0 0.75rem;
	}

	.nav-section-items {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	/* Navigation Links */
	.nav-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: var(--text-secondary);
		text-decoration: none;
		transition: all var(--transition-base) ease;
		padding: 0.625rem 0.75rem;
		border-radius: var(--radius-md);
		border: 1.5px solid transparent;
		position: relative;
		min-width: 0;
		font-weight: 500;
		font-size: 0.875rem;
	}

	.nav-link:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
		border-color: var(--border-primary);
	}

	.nav-link--active {
		background: var(--color-primary-50);
		color: var(--primary);
		border: 1.5px solid var(--color-primary-200);
		font-weight: 600;
	}

	.nav-link--active:hover {
		background: var(--color-primary-100);
		border-color: var(--color-primary-300);
	}

	/* Dark mode adjustments for sidebar nav links */
	[data-theme="dark"] .nav-link--active {
		background: rgba(255, 89, 89, 0.1);
		color: var(--color-primary-500);
		border-color: rgba(255, 89, 89, 0.2);
	}

	[data-theme="dark"] .nav-link--active:hover {
		background: rgba(255, 89, 89, 0.15);
		border-color: rgba(255, 89, 89, 0.3);
	}

	[data-theme="dark"] .nav-link:hover {
		background: var(--bg-secondary);
		border-color: var(--border-primary);
	}

	.nav-link-content {
		display: flex;
		align-items: center;
		min-width: 0;
		flex: 1;
		gap: 0.75rem;
	}

	.nav-link-icon {
		width: 1.125rem;
		height: 1.125rem;
		flex-shrink: 0;
		color: inherit;
		transition: color var(--transition-base) ease;
		opacity: 0.8;
	}

	.nav-link:hover .nav-link-icon {
		opacity: 1;
	}
	
	.nav-link--active .nav-link-icon {
		color: inherit;
		opacity: 1;
	}

	.nav-link-text {
		font-size: inherit;
		font-weight: inherit;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nav-badge {
		background: var(--color-danger-600);
		color: white;
		font-size: 0.625rem;
		font-weight: 600;
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-full);
		min-width: 1.125rem;
		height: 1.125rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	
	/* Mobile bottom nav badge */
	.nav-badge-mobile {
		background: var(--color-danger-600);
		color: white;
		font-size: 0.625rem;
		font-weight: 600;
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-full);
		min-width: 1.125rem;
		height: 1.125rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		position: absolute;
		top: -4px;
		right: -4px;
	}

	/* User Section */
	.sidebar-user {
		flex-shrink: 0;
		border-top: 1px solid var(--border-primary);
		padding: 1.25rem 1.5rem;
		background: var(--bg-secondary);
	}

	.user-profile {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.user-profile-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: var(--radius-md);
		border: 1.5px solid var(--border-primary);
		text-decoration: none;
		color: var(--text-secondary);
		transition: all var(--transition-base) ease;
		background: var(--bg-primary);
	}

	.user-profile-link:hover {
		background: var(--bg-primary);
		border-color: var(--border-secondary);
		color: var(--text-primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}

	/* Dark mode adjustments for user profile */
	[data-theme="dark"] .user-profile-link:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
	}

	.user-avatar {
		flex-shrink: 0;
		position: relative;
	}

	.avatar-image {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		object-fit: cover;
	}

	.avatar-fallback {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-tertiary);
		color: var(--text-secondary);
	}

	.user-info {
		min-width: 0;
		flex: 1;
	}

	.user-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-email {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-settings-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		color: var(--text-tertiary);
		transition: color var(--transition-base) ease;
	}

	.user-profile-link:hover .user-settings-icon {
		color: var(--text-secondary);
	}

	.user-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.user-action-button {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		line-height: 1.5;
		color: var(--text-secondary);
		background: transparent;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		text-decoration: none;
		cursor: pointer;
		transition: all var(--transition-base) ease;
		white-space: nowrap;
		user-select: none;
	}

	.user-action-button:hover:not(:disabled) {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border-color: var(--border-secondary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-xs);
	}

	.user-action-button:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: none;
	}

	/* Dark mode adjustments for user action buttons */
	[data-theme="dark"] .user-action-button:hover:not(:disabled) {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
	}

	.user-action-button--logout {
		color: var(--danger);
		border-color: transparent;
	}

	.user-action-button--logout:hover:not(:disabled) {
		background: rgba(244, 63, 94, 0.1);
		border-color: rgba(244, 63, 94, 0.2);
		color: var(--danger);
		transform: translateY(-1px);
	}

	/* Dark mode adjustments for logout button */
	[data-theme="dark"] .user-action-button--logout:hover:not(:disabled) {
		background: rgba(251, 113, 133, 0.1);
		border-color: rgba(251, 113, 133, 0.2);
		color: var(--color-danger-600);
	}

	.user-action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	/* Dark Mode Support */
	[data-theme="dark"] .professional-sidebar {
		background: var(--bg-primary);
		border-color: var(--border-primary);
	}
	
	[data-theme="dark"] .sidebar-user {
		background: var(--bg-secondary);
		border-color: var(--border-primary);
	}

	/* Responsive adjustments */
	@media (max-width: 1024px) {
		.professional-sidebar {
			display: none;
		}
	}
</style>
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
	import { onMount, onDestroy } from 'svelte';
	import { unreadCount, unreadBookingCount } from '$lib/stores/notifications.js';

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
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import MoreVertical from 'lucide-svelte/icons/more-vertical';
	import X from 'lucide-svelte/icons/x';

	// Type definitions
	interface NavigationItem {
		name: string;
		href: string;
		icon: any;
		description: string;
		showOnMobile?: boolean;
		badge?: number | null;
		shortcut?: string | null;
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
	
	// Current pathname for navigation
	let currentPath = $state(browser ? window.location.pathname : '/dashboard');

	// Set language context from the store
	languageContext.set(languageStore);

	// Set up navigation context
	navigationContext.set(navigationStore);

	// Mobile menu state
	let mobileMenuOpen = $state(false);

	// Close sidebar on navigation and update current path
	afterNavigate(() => {
		sidebarOpen = false;
		mobileMenuOpen = false;
		if (browser) {
			currentPath = window.location.pathname;
		}
	});

	// Navigation sections for better organization with keyboard shortcuts
	const navigationSections = $derived([
		{
			name: 'Main',
			items: [
				{
					name: 'Dashboard',
					href: '/dashboard',
					icon: Home,
					description: 'Operations center',
					showOnMobile: true,
					badge: null as number | null,
					shortcut: 'd'
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
					badge: null as number | null,
					shortcut: 't'
				},
				{
					name: 'Bookings',
					href: '/bookings',
					icon: Calendar,
					description: 'View all bookings',
					showOnMobile: true,
					badge: $unreadBookingCount > 0 ? $unreadBookingCount : null,
					shortcut: 'b'
				},
				{
					name: 'Check-in Scanner',
					href: '/checkin-scanner',
					icon: QrCode,
					description: 'Scan QR tickets',
					showOnMobile: true,
					badge: null as number | null,
					shortcut: 's'
				}
			]
		},
		{
			name: 'Business',
			items: [
				{
					name: 'Analytics',
					href: '/analytics',
					icon: TrendingUp,
					description: 'Performance insights',
					showOnMobile: true,
					badge: null as number | null,
					shortcut: 'a'
				},
				{
					name: 'Subscription',
					href: '/subscription',
					icon: CreditCard,
					description: 'Manage your plan',
					showOnMobile: true,
					badge: null as number | null,
					shortcut: null
				}
			]
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
			name: 'Bookings',
			href: '/bookings',
			icon: Calendar,
			active: currentPath === '/bookings',
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
			active: currentPath.startsWith('/tours')
		},
		{
			name: 'More',
			href: '#',
			icon: MoreVertical,
			active: false,
			isMenu: true
		}
	]);

	// All navigation items for mobile menu
	const mobileMenuItems = $derived([
		{
			name: 'Profile',
			href: '/profile',
			icon: User,
			description: 'Edit your profile'
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
			items: section.items.map(item => ({
				...item,
				current: currentPath === item.href || 
				         (currentPath.startsWith(item.href) && item.href !== '/dashboard')
			}))
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
		
		// Clean up resources on page unload/refresh
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			console.log('🧹 Page unloading - cleaning up resources...');
			
			// Force cleanup of any notification connections - multiple cleanup calls
			window.dispatchEvent(new Event('force-cleanup'));
			
			// Cancel all queries if queryClient exists
			if (data.queryClient) {
				data.queryClient.cancelQueries();
			}
			
			// Additional cleanup for notification system
			setTimeout(() => {
				window.dispatchEvent(new Event('force-cleanup'));
			}, 0);
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
		
		// Add keyboard shortcuts
		const handleKeyPress = (event: KeyboardEvent) => {
			// Only activate shortcuts when not typing in an input
			if (event.target instanceof HTMLInputElement || 
			    event.target instanceof HTMLTextAreaElement ||
			    event.target instanceof HTMLSelectElement) {
				return;
			}

			// Check for Ctrl/Cmd key
			if (!event.ctrlKey && !event.metaKey) {
				return;
			}

			// Find matching navigation item
			for (const section of navigationSections) {
				for (const item of section.items) {
					if (item.shortcut && event.key === item.shortcut) {
						event.preventDefault();
						goto(item.href);
						break;
					}
				}
			}
		};

		window.addEventListener('keydown', handleKeyPress);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			unsubscribe();
			window.removeEventListener('message', handleMessage);
			window.removeEventListener('keydown', handleKeyPress);
		};
	});

	function toggleMobileMenu(event: Event) {
		event.preventDefault();
		mobileMenuOpen = !mobileMenuOpen;
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
			return () => {
				document.removeEventListener('click', handleClickOutside);
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
			window.dispatchEvent(new Event('beforeunload'));
		}
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
				user={currentUserData}
			/>
		</div>

		<!-- Main content area with sidebar -->
		<div class="flex flex-1 min-w-0 pt-16 overflow-x-hidden">
			<!-- Desktop Sidebar - Fixed position -->
			<div class="hidden lg:block">
				<div class="fixed left-0 w-56 flex flex-col overflow-hidden" style="top: 4rem; height: calc(100vh - 4rem); z-index: 30;">
					<div
						class="flex flex-col h-full pt-5"
						style="border-right: 1px solid var(--border-primary); background: var(--bg-primary);"
					>
						<!-- Navigation - Scrollable area -->
						<nav class="flex-1 overflow-y-auto px-3 min-h-0">
							{#each navigationItems as section}
								<div class="mb-6">
									<h3 class="nav-section-header">
										{section.name}
									</h3>
									<div class="space-y-1">
										{#each section.items as item}
											{@const shouldShow = item.showOnMobile !== false}
											{#if shouldShow}
												<a
													href={item.href}
													class="nav-link group flex items-center justify-between rounded-md px-2 py-2 text-sm font-medium transition-colors min-w-0"
													style={item.current
														? 'background: var(--color-primary-100); color: var(--color-primary-900);'
														: 'color: var(--text-secondary);'}
													onmouseenter={(e) => e.currentTarget.style.background = item.current ? 'var(--color-primary-100)' : 'var(--bg-tertiary)'}
													onmouseleave={(e) => e.currentTarget.style.background = item.current ? 'var(--color-primary-100)' : 'transparent'}
												>
													<div class="flex items-center min-w-0 flex-1">
														{#if item.current}
															<item.icon
																class="mr-3 h-5 w-5 flex-shrink-0 nav-icon-active"
															/>
														{:else}
															<item.icon
																class="mr-3 h-5 w-5 flex-shrink-0"
																style="color: var(--text-tertiary);"
															/>
														{/if}
														<span class="truncate">
															{item.name}
															{#if item.shortcut}
																<span class="ml-1 text-xs" style="color: var(--text-tertiary); opacity: 0.7;">
																	⌘{item.shortcut.toUpperCase()}
																</span>
															{/if}
														</span>
													</div>
													{#if item.badge}
														<span class="nav-badge">
															{item.badge}
														</span>
													{/if}
												</a>
											{/if}
										{/each}
									</div>
								</div>
							{/each}
						</nav>

						<!-- User section - Sticky at bottom -->
						<div class="flex-shrink-0 border-t px-3 py-3" style="border-color: var(--border-primary);">
							{#if currentUserData}
								<div class="px-2">
									<a 
										href="/profile"
										class="flex items-center gap-3 rounded-md px-2 py-2 transition-colors block"
										style="color: var(--text-secondary); text-decoration: none;"
										onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
										onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
									>
										<div class="flex-shrink-0">
											{#if currentUserData.avatar}
												<img 
													src={currentUserData.avatar} 
													alt={currentUserData.name || 'User'} 
													class="h-7 w-7 rounded-full object-cover"
													onerror={(e) => {
														const img = e.currentTarget as HTMLImageElement;
														img.style.display = 'none';
														const fallback = img.nextElementSibling as HTMLElement | null;
														if (fallback) {
															fallback.classList.remove('hidden');
														}
													}}
												/>
												<div class="hidden h-7 w-7 rounded-full flex items-center justify-center" style="background: var(--bg-tertiary); color: var(--text-secondary);">
													<User class="h-4 w-4" />
												</div>
											{:else}
												<div class="h-7 w-7 rounded-full flex items-center justify-center" style="background: var(--bg-tertiary); color: var(--text-secondary);">
													<User class="h-4 w-4" />
												</div>
											{/if}
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-sm font-medium truncate">{currentUserData.name || 'Profile'}</p>
											<p class="text-xs truncate" style="color: var(--text-tertiary);">{currentUserData.email}</p>
										</div>
										<Settings class="h-4 w-4 flex-shrink-0" style="color: var(--text-tertiary);" />
									</a>
									
									<div class="mt-2 flex items-center gap-1">
										{#if userIsAdmin}
											<a
												href="/admin"
												class="flex-1 flex items-center justify-center gap-1 rounded py-1.5 text-xs font-medium transition-colors"
												style="color: var(--text-secondary); background: var(--bg-tertiary); text-decoration: none;"
												onmouseenter={(e) => {
													e.currentTarget.style.backgroundColor = 'var(--bg-quaternary)';
												}}
												onmouseleave={(e) => {
													e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
												}}
											>
												<Shield class="h-3.5 w-3.5" />
												<span>Admin</span>
											</a>
										{/if}
										<button
											onclick={handleLogout}
											disabled={isLoggingOut}
											class="flex-1 flex items-center justify-center gap-1 rounded py-1.5 text-xs font-medium transition-all disabled:opacity-50"
											style="color: var(--text-secondary); background: var(--bg-tertiary);"
											onmouseenter={(e) => {
												// Use semi-transparent red background with solid red text
												e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; // Red with 10% opacity
												e.currentTarget.style.color = 'rgb(239, 68, 68)'; // Solid red
											}}
											onmouseleave={(e) => {
												e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
												e.currentTarget.style.color = 'var(--text-secondary)';
											}}
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
			<div class="flex w-0 flex-1 flex-col overflow-hidden min-w-0 lg:pl-56">
				<!-- Page content with bottom padding on mobile for bottom nav -->
				<main class="relative flex-1 overflow-y-auto overflow-x-hidden focus:outline-none pb-20 lg:pb-0">
					{@render children()}
				</main>
				
				<!-- App Footer - Desktop only -->
				<div class="hidden lg:block">
					<AppFooter />
				</div>
			</div>
		</div>

		<!-- Mobile Bottom Navigation -->
		<div class="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t overflow-x-hidden" style="background: var(--bg-primary); border-color: var(--border-primary); padding-bottom: env(safe-area-inset-bottom, 0);">
			<nav class="flex min-w-0">
				{#each mobileNavItems as item}
					{#if item.isMenu}
						<button
							id="mobile-menu-trigger"
							onclick={toggleMobileMenu}
							class="nav-link flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors min-w-0 relative"
							style="color: var(--text-tertiary);"
						>
							<div class="relative">
								<item.icon 
									class="h-6 w-6 mb-1 flex-shrink-0" 
									style="color: var(--text-tertiary);"
								/>
							</div>
							<span class="truncate text-center w-full">{item.name}</span>
						</button>
					{:else}
						<a
							href={item.href}
							class="nav-link flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors min-w-0 relative"
							style="{item.active 
								? 'color: var(--color-primary-600);' 
								: 'color: var(--text-tertiary);'} text-decoration: none;"
						>
							<div class="relative">
								<item.icon 
									class="h-6 w-6 mb-1 flex-shrink-0" 
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
							<span class="truncate text-center w-full">{item.name}</span>
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
					<div class="rounded-t-xl shadow-lg" style="background: var(--bg-primary); border-top: 1px solid var(--border-primary);">
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
						<div class="py-2">
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
									<div class="px-4 py-3">
										<div class="flex items-center gap-3">
											<div class="flex-shrink-0">
												{#if currentUserData.avatar}
													<img 
														src={currentUserData.avatar} 
														alt={currentUserData.name || 'User'} 
														class="h-10 w-10 rounded-full object-cover"
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
										</div>
									</div>
									
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
	
	/* Mobile menu animation */
	.mobile-menu-backdrop {
		animation: fadeIn 0.2s ease-out;
	}
	
	.mobile-menu-panel {
		animation: slideUp 0.2s ease-out;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	@keyframes slideUp {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
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
</style>
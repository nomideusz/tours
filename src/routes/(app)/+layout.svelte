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
	import { isKeyboardVisible } from '$lib/stores/keyboard.js';

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
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';

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
	let sidebarCollapsed = $state(false);
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
	let mobileMenuHeight = $state('75vh'); // Default height, will be calculated dynamically
	
	// Avatar loading state
	let avatarLoadError = $state(false);
	
	// Auto-hide navigation on scroll
	let navHidden = $state(false);
	let lastScrollY = $state(0);
	let scrollDirection = $state<'up' | 'down'>('up');
	let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
	let isMobileDevice = $state(false);
	
	// Touch tracking for iOS
	let touchStartY = 0;
	let touchEndY = 0;

	// Close sidebar on navigation and update current path
	afterNavigate(() => {
		sidebarOpen = false;
		mobileMenuOpen = false;
		if (browser) {
			currentPath = window.location.pathname;
			
			// Reset touch state for iOS
			touchAccumulator = 0;
			lastTouchY = 0;
			
			// Scroll to top on navigation (mobile fix)
			// Use both window and the main content element
			window.scrollTo(0, 0);
			
			// Also scroll the main content element to top
			const mainContent = document.querySelector('.main-content');
			if (mainContent) {
				mainContent.scrollTop = 0;
			}
			
			// For iOS Safari - also scroll document.body
			document.body.scrollTop = 0;
			document.documentElement.scrollTop = 0;
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

	// Handle scroll events for auto-hide navigation (non-iOS)
	function handleScroll(event?: Event) {
		if (!browser || $isKeyboardVisible || !isMobileDevice || mobileMenuOpen) return; // Only on mobile, and not when menu is open
		
		// Get scroll position
		const scrollElement = document.scrollingElement || document.documentElement || document.body;
		const currentScrollY = scrollElement.scrollTop || window.pageYOffset || 0;
		const scrollDelta = currentScrollY - lastScrollY;
		
		// Ignore small scroll movements
		if (Math.abs(scrollDelta) < 5) return;
		
		// Determine scroll direction
		if (currentScrollY > lastScrollY) {
			// Scrolling down
			scrollDirection = 'down';
			navHidden = true;
			// Also close mobile menu if open
			if (mobileMenuOpen) {
				mobileMenuOpen = false;
			}
		} else if (currentScrollY < lastScrollY) {
			// Scrolling up
			scrollDirection = 'up';
			navHidden = false;
		}
		
		lastScrollY = currentScrollY;
		
		// Clear any existing timeout
		if (scrollTimeout) clearTimeout(scrollTimeout);
		
		// Show navigation after scrolling stops
		scrollTimeout = setTimeout(() => {
			navHidden = false;
		}, 1500);
	}
	
	// iOS touch handlers for navigation auto-hide
	let lastTouchY = 0;
	let touchAccumulator = 0;
	
	function handleTouchStart(event: TouchEvent) {
		if (!isMobileDevice || $isKeyboardVisible || mobileMenuOpen) return;
		touchStartY = event.touches[0].clientY;
		lastTouchY = touchStartY;
		touchAccumulator = 0;
	}
	
	function handleTouchMove(event: TouchEvent) {
		if (!isMobileDevice || $isKeyboardVisible || mobileMenuOpen) return;
		
		const currentTouchY = event.touches[0].clientY;
		const touchDelta = lastTouchY - currentTouchY;
		
		// Accumulate touch movement
		touchAccumulator += touchDelta;
		
		// Check if we've moved enough to trigger
		if (Math.abs(touchAccumulator) > 20) {
			if (touchAccumulator > 0) {
				// Scrolling down - hide nav
				navHidden = true;
				// Also close mobile menu if open
				if (mobileMenuOpen) {
					mobileMenuOpen = false;
				}
			} else if (touchAccumulator < 0) {
				// Scrolling up - show nav
				navHidden = false;
			}
			
			// Reset accumulator
			touchAccumulator = 0;
			
			// Clear timeout and set new one
			if (scrollTimeout) clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(() => {
				navHidden = false;
			}, 1500);
		}
		
		lastTouchY = currentTouchY;
	}
	
	// Theme communication with embedded widgets
	onMount(() => {
		let currentTheme: 'light' | 'dark' = 'light';
		
		// Check if mobile device (consistent with other layouts)
		isMobileDevice = window.innerWidth <= 639;
		
		// Load sidebar collapsed state from localStorage
		const savedSidebarState = localStorage.getItem('sidebar_collapsed');
		if (savedSidebarState === 'true') {
			sidebarCollapsed = true;
		}
		
		// Calculate initial menu height
		calculateMenuHeight();
		
		// Listen for resize to update mobile state and menu height
		const handleResize = () => {
			isMobileDevice = window.innerWidth <= 639;
			// Reset nav state on resize
			if (!isMobileDevice) {
				navHidden = false;
			}
			// Recalculate menu height on resize
			calculateMenuHeight();
		};
		window.addEventListener('resize', handleResize);
		
		
		// Set up listeners for mobile navigation auto-hide
		// Always add listeners - we check isMobileDevice inside the handlers
		if (browser) {
			// Touch events work best on all mobile devices
			document.addEventListener('touchstart', handleTouchStart, { passive: true });
			document.addEventListener('touchmove', handleTouchMove, { passive: true });
			
			// Also add scroll listeners as fallback
			window.addEventListener('scroll', handleScroll, { passive: true });
			document.addEventListener('scroll', handleScroll, { passive: true });
			document.body.addEventListener('scroll', handleScroll, { passive: true });
			
			const mainContent = document.querySelector('.main-content');
			if (mainContent) {
				mainContent.addEventListener('scroll', handleScroll, { passive: true });
			}
		}
		
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
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('scroll', handleScroll);
			document.removeEventListener('scroll', handleScroll);
			document.body.removeEventListener('scroll', handleScroll);
			document.removeEventListener('touchstart', handleTouchStart);
			document.removeEventListener('touchmove', handleTouchMove);
			const mainContent = document.querySelector('.main-content');
			if (mainContent) {
				mainContent.removeEventListener('scroll', handleScroll);
			}
			if (scrollTimeout) clearTimeout(scrollTimeout);
			unsubscribe();
			window.removeEventListener('message', handleMessage);
		};
	});

	function toggleMobileMenu(event: Event) {
		event.preventDefault();
		
		// Calculate optimal menu height when opening
		if (!mobileMenuOpen && browser) {
			calculateMenuHeight();
		}
		
		mobileMenuOpen = !mobileMenuOpen;
	}
	
	function calculateMenuHeight() {
		if (!browser) return;
		
		const vh = window.innerHeight;
		const bottomNavHeight = 56; // Approximate height of bottom nav
		const safeAreaBottom = parseInt(getComputedStyle(document.documentElement)
			.getPropertyValue('--sai-bottom') || '0');
		
		// Use 80% of viewport height minus bottom nav and safe area
		// This gives more space while still feeling like a drawer
		const calculatedHeight = vh * 0.85 - bottomNavHeight - safeAreaBottom;
		
		// Set minimum and maximum heights
		const minHeight = 400; // Minimum height in pixels
		const maxHeight = vh * 0.9; // Maximum 90% of viewport
		
		const finalHeight = Math.min(Math.max(calculatedHeight, minHeight), maxHeight);
		mobileMenuHeight = `${finalHeight}px`;
	}
	
	function toggleSidebarCollapse() {
		sidebarCollapsed = !sidebarCollapsed;
		// Save preference to localStorage
		if (browser) {
			localStorage.setItem('sidebar_collapsed', sidebarCollapsed.toString());
		}
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
			
			// Prevent body scroll when menu is open - simplified without iOS hacks
			document.body.style.overflow = 'hidden';
			
			return () => {
				document.removeEventListener('click', handleClickOutside);
				
				// Restore scroll
				document.body.style.overflow = '';
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
	<div class="min-h-screen flex flex-col overflow-x-hidden glass-enhanced-bg">
		<!-- App Header -->
		<AppHeader 
			user={currentUserData}
			hidden={navHidden}
		/>

		<!-- Main content area with sidebar -->
		<div class="flex flex-1 min-w-0 pt-16 md:pt-20 overflow-x-hidden"> <!-- Smaller padding on mobile -->
			<!-- Desktop Sidebar - Fixed position -->
			<div class="hidden lg:block">
				<div class="professional-sidebar" class:sidebar-collapsed={sidebarCollapsed}>
					<!-- Collapse Toggle Button -->
					<button 
						onclick={toggleSidebarCollapse}
						class="sidebar-toggle"
						aria-label="{sidebarCollapsed ? 'Expand' : 'Collapse'} sidebar"
					>
						{#if sidebarCollapsed}
							<ChevronRight class="h-4 w-4" />
						{:else}
							<ChevronLeft class="h-4 w-4" />
						{/if}
					</button>
					
					<div class="sidebar-container">
						<!-- Navigation - Scrollable area -->
						<nav class="sidebar-nav">
							{#each navigationItems as section}
								<div class="nav-section">
									{#if !sidebarCollapsed}
										<h3 class="nav-section-header">
											{section.name}
										</h3>
									{/if}
									<div class="nav-section-items">
										{#each section.items as item}
											<a
												href={item.href}
												class="nav-link {item.current ? 'nav-link--active' : ''}"
												title={sidebarCollapsed ? item.name : undefined}
											>
												<div class="nav-link-content">
													<item.icon class="nav-link-icon" />
													{#if !sidebarCollapsed}
														<span class="nav-link-text">{item.name}</span>
													{/if}
												</div>
												{#if item.badge}
													<span class="nav-badge" class:nav-badge--collapsed={sidebarCollapsed}>
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
									<a 
										href="/profile" 
										class="user-profile-link"
										title={sidebarCollapsed ? `${currentUserData.name || 'Profile'} - ${currentUserData.email}` : undefined}
									>
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
										{#if !sidebarCollapsed}
											<div class="user-info">
												<p class="user-name">{currentUserData.name || 'Profile'}</p>
												<p class="user-email">{currentUserData.email}</p>
											</div>
											<Settings class="user-settings-icon" />
										{/if}
									</a>
									
									{#if !sidebarCollapsed}
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
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Main content -->
			<div class="flex w-0 flex-1 flex-col overflow-hidden min-w-0 {sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}">
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
		<FeedbackWidget navHidden={navHidden} />

		<!-- PWA Install Prompt -->
		<InstallPWAPrompt navHidden={navHidden} />

		<!-- Mobile Bottom Navigation -->
		<div class="mobile-bottom-nav lg:hidden border-t" 
			class:keyboard-hidden={$isKeyboardVisible} 
			class:nav-hidden={navHidden}
			style="border-color: var(--border-primary);">
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
				role="button"
				tabindex="-1"
				class="lg:hidden fixed inset-0 z-50 mobile-menu-backdrop" 
				style="background: rgba(0, 0, 0, 0.5);"
				onclick={() => mobileMenuOpen = false}
				onkeydown={(e) => e.key === 'Escape' && (mobileMenuOpen = false)}
			>
				<div 
					role="dialog"
					tabindex="-1"
					aria-modal="true"
					aria-label="Mobile menu"
					class="fixed bottom-0 left-0 right-0 z-50 mobile-menu-panel" 
					id="mobile-menu"
					onclick={(e) => e.stopPropagation()}
					onkeydown={(e) => e.stopPropagation()}
				>
					<div class="rounded-t-xl shadow-lg mobile-menu-container" style="background: var(--bg-primary); border-top: 1px solid var(--border-primary); max-height: {mobileMenuHeight};">
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
						<div class="h-safe-area-inset-bottom" style="background: var(--bg-primary);"></div>
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
		/* Increased padding to prevent bottom nav from cutting content */
		padding-bottom: calc(6rem + env(safe-area-inset-bottom, 0));
		/* Ensure content doesn't get stuck behind nav */
		min-height: 100vh;
		/* iOS Safari scroll fix */
		-webkit-overflow-scrolling: touch;
		/* Ensure content has solid background */
		background: var(--bg-primary);
		/* Allow main content to scroll properly */
		height: 100%;
	}
	
		/* iOS specific main content adjustments */
		@supports (-webkit-touch-callout: none) {
			.main-content {
			/* Add extra padding to ensure content stays above iOS UI and bottom nav */
			padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0) + 1.5rem);
				/* Keep overflow-y for scrolling */
				position: relative;
			}
			
		}
	
	@media (min-width: 1024px) {
		.main-content {
			padding-bottom: 0;
			min-height: auto;
		}
	}
	
	/* Mobile Bottom Navigation - iOS Safari safe positioning */
	.mobile-bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 40;
		/* Glassmorphism background */
		background: rgba(var(--bg-primary-rgb, 255, 255, 255), 0.7);
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
		box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.1);
		/* iOS Safari viewport fixes */
		transform: translate3d(0, 0, 0);
		-webkit-transform: translate3d(0, 0, 0);
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		/* Smooth transitions */
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out;
	}
	
	/* Ensure the nav content has proper padding */
	.mobile-bottom-nav nav {
		position: relative;
		z-index: 1;
		background: var(--bg-primary);
		padding-bottom: env(safe-area-inset-bottom, 0);
	}
	
		/* iOS Safari specific fixes */
		@supports (-webkit-touch-callout: none) {
			.mobile-bottom-nav {
				/* Ensure bottom is always at viewport bottom */
				bottom: 0 !important;
				/* Prevent iOS bounce effect from affecting position */
				transform: translate3d(0, 0, 0);
				-webkit-transform: translate3d(0, 0, 0);
				/* Force opaque background for iOS - use explicit colors */
				background-color: var(--bg-primary) !important;
				/* Additional layer to ensure opacity */
				background-image: linear-gradient(to bottom, var(--bg-primary), var(--bg-primary));
			}
			
		}
	
	/* Hide bottom nav when mobile keyboard is visible */
	.mobile-bottom-nav.keyboard-hidden {
		transform: translate3d(0, 100%, 0);
		-webkit-transform: translate3d(0, 100%, 0);
		opacity: 0;
		pointer-events: none;
	}
	
	/* Hide bottom nav when scrolling down */
	.mobile-bottom-nav.nav-hidden {
		transform: translate3d(0, 100%, 0);
		-webkit-transform: translate3d(0, 100%, 0);
		pointer-events: none;
	}
	
	/* Glass-enhanced background for better glassmorphism */
	.glass-enhanced-bg {
		background: var(--bg-primary);
		background-image: 
			radial-gradient(ellipse at 10% 10%, rgba(var(--color-primary-500-rgb, 250, 107, 93), 0.05) 0%, transparent 50%),
			radial-gradient(ellipse at 90% 90%, rgba(var(--color-accent-500-rgb, 14, 165, 233), 0.04) 0%, transparent 50%),
			linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
	}
	
	/* Enhanced glassmorphism for mobile nav when re-appearing */
	@media (max-width: 639px) {
		.mobile-bottom-nav {
			transition: all 0.3s ease-out;
		}
		
		.mobile-bottom-nav:not(.nav-hidden) {
			background: rgba(var(--bg-primary-rgb, 255, 255, 255), 0.7) !important;
			backdrop-filter: blur(20px) saturate(180%) !important;
			-webkit-backdrop-filter: blur(20px) saturate(180%) !important;
			box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.1) !important;
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
		/* Height is now dynamically calculated via inline style */
		/* Fallback height if JavaScript hasn't run yet */
		max-height: 75vh;
		overflow: hidden;
	}
	
	.mobile-menu-items {
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior: contain;
		/* Add padding at bottom to ensure last items are visible */
		padding-bottom: 1rem;
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
		overflow: visible; /* Allow toggle button to be visible */
	}
	
	/* Collapsed Sidebar Styles */
	.professional-sidebar.sidebar-collapsed {
		width: 5rem;
	}
	
	/* Sidebar Toggle Button */
	.sidebar-toggle {
		position: absolute;
		top: 1rem;
		right: -0.75rem;
		z-index: 50;
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-full);
		cursor: pointer;
		transition: all var(--transition-base) ease;
		box-shadow: var(--shadow-sm);
		color: var(--text-secondary);
	}
	
	.sidebar-toggle:hover {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
		color: var(--text-primary);
		transform: scale(1.1);
		box-shadow: var(--shadow-md);
	}
	
	/* Dark mode toggle button */
	:global([data-theme="dark"]) .sidebar-toggle {
		background: var(--bg-primary);
		border-color: var(--border-primary);
		box-shadow: var(--shadow-sm);
	}
	
	:global([data-theme="dark"]) .sidebar-toggle:hover {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
	}

	.sidebar-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding-top: 1.5rem;
		overflow: hidden; /* Keep content inside */
	}
	
	/* Collapsed sidebar adjustments */
	.sidebar-collapsed .sidebar-container {
		padding-top: 3rem; /* Space for toggle button */
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
	:global([data-theme="dark"]) .nav-link--active {
		background: rgba(255, 89, 89, 0.1);
		color: var(--color-primary-500);
		border-color: rgba(255, 89, 89, 0.2);
	}

	:global([data-theme="dark"]) .nav-link--active:hover {
		background: rgba(255, 89, 89, 0.15);
		border-color: rgba(255, 89, 89, 0.3);
	}

	:global([data-theme="dark"]) .nav-link:hover {
		background: var(--bg-secondary);
		border-color: var(--border-primary);
	}

	/* Collapsed sidebar nav adjustments */
	.sidebar-collapsed .nav-section {
		margin-bottom: 1rem;
	}
	
	.sidebar-collapsed .nav-link {
		justify-content: center;
		padding: 0.75rem;
	}
	
	.sidebar-collapsed .nav-link-content {
		justify-content: center;
	}

	.nav-link-content {
		display: flex;
		align-items: center;
		min-width: 0;
		flex: 1;
		gap: 0.75rem;
	}

	:global(.nav-link-icon) {
		width: 1.125rem;
		height: 1.125rem;
		flex-shrink: 0;
		color: inherit;
		transition: color var(--transition-base) ease;
		opacity: 0.8;
	}

	.nav-link:hover :global(.nav-link-icon) {
		opacity: 1;
	}
	
	.nav-link--active :global(.nav-link-icon) {
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
	
	/* Collapsed sidebar badge position */
	.nav-badge--collapsed {
		position: absolute;
		top: 0.375rem;
		right: 0.375rem;
		padding: 0.125rem;
		min-width: 1rem;
		height: 1rem;
		font-size: 0.5rem;
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
	
	/* Collapsed sidebar user section */
	.sidebar-collapsed .sidebar-user {
		padding: 0.75rem;
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
	
	/* Collapsed sidebar user profile link */
	.sidebar-collapsed .user-profile-link {
		justify-content: center;
		padding: 0.5rem;
	}

	.user-profile-link:hover {
		background: var(--bg-primary);
		border-color: var(--border-secondary);
		color: var(--text-primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}

	/* Dark mode adjustments for user profile */
	:global([data-theme="dark"]) .user-profile-link:hover {
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

	:global(.user-settings-icon) {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		color: var(--text-tertiary);
		transition: color var(--transition-base) ease;
	}

	.user-profile-link:hover :global(.user-settings-icon) {
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
	:global([data-theme="dark"]) .user-action-button:hover:not(:disabled) {
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
	:global([data-theme="dark"]) .user-action-button--logout:hover:not(:disabled) {
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
	:global([data-theme="dark"]) .professional-sidebar {
		background: var(--bg-primary);
		border-color: var(--border-primary);
	}
	
	:global([data-theme="dark"]) .sidebar-user {
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
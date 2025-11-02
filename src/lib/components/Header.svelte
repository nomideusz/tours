<script lang="ts">
	import { language, t } from '$lib/i18n.js';
	import { logout } from '$lib/auth/client.js';
	import { IsMounted } from 'runed';
	import { onMount } from 'svelte';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import Search from 'lucide-svelte/icons/search';
	import Calculator from 'lucide-svelte/icons/calculator';
	import Smartphone from 'lucide-svelte/icons/smartphone';
	import PromoStatusBanner from '$lib/components/PromoStatusBanner.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import BetaBadge from '$lib/components/BetaBadge.svelte';

	interface HeaderProps {
		isAuthenticated: boolean;
		currentUser: any;
		hidden?: boolean;
	}

	let { isAuthenticated, currentUser, hidden = false }: HeaderProps = $props();

	// Use IsMounted from Runed
	const isMounted = new IsMounted();

	// Mobile menu state
	let mobileMenuOpen = $state(false);

	// Handle body scroll lock when mobile menu is open - simple approach without iOS hacks
	$effect(() => {
		if (mobileMenuOpen) {
			// Lock body scroll - simplified without position fixed
			document.body.style.overflow = 'hidden';
		} else {
			// Restore body scroll
			document.body.style.overflow = '';
		}
	});

	// Cleanup on component destroy
	onMount(() => {
		// Handle escape key to close mobile menu
		function handleEscapeKey(event: KeyboardEvent) {
			if (event.key === 'Escape' && mobileMenuOpen) {
				mobileMenuOpen = false;
			}
		}

		document.addEventListener('keydown', handleEscapeKey);

		return () => {
			// Clean up event listener and restore body scroll
			document.removeEventListener('keydown', handleEscapeKey);
			document.body.style.overflow = '';
		};
	});

	// Logout loading state
	let isLoggingOut = $state(false);

	// Handle logout with loading state
	async function handleLogout(event: Event) {
		event.preventDefault();
		isLoggingOut = true;
		
		try {
			await logout('/auth/login');
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			isLoggingOut = false;
		}
	}

	// Close mobile menu when navigation occurs
	export function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	// Close mobile menu when clicking on links
	function handleMobileLinkClick() {
		mobileMenuOpen = false;
	}

	// Handle navigation links with smooth scrolling
	function handleNavClick(event: MouseEvent, href: string) {
		event.preventDefault();
		event.stopPropagation();
		
		// Check if it's an anchor link (contains #)
		if (href.includes('#')) {
			// Extract the hash part (everything after #)
			const hashIndex = href.indexOf('#');
			const targetId = href.substring(hashIndex + 1);
			
			// Try to scroll to the element first
			const target = document.getElementById(targetId);
			if (target) {
				// Close mobile menu if open and wait for body scroll to be restored
				mobileMenuOpen = false;
				
				// Wait for the body scroll lock to be removed before scrolling
				setTimeout(() => {
					// Element exists on current page, scroll with offset for fixed header
					// Header height is 3.5rem (56px) on mobile, 4.5rem (72px) on tablet, 5rem (80px) on desktop
					const headerOffset = window.innerWidth < 640 ? 56 : window.innerWidth < 1024 ? 72 : 80;
					const elementPosition = target.getBoundingClientRect().top;
					const offsetPosition = elementPosition + window.scrollY - headerOffset;
					
					window.scrollTo({
						top: offsetPosition,
						behavior: 'smooth'
					});
				}, 100);
			} else {
				// Element doesn't exist, navigate to the page
				mobileMenuOpen = false;
				window.location.href = href;
			}
		} else {
			// Not an anchor link, just navigate
			mobileMenuOpen = false;
			window.location.href = href;
		}
	}

	// Set up smooth scrolling for any existing anchor links on mount
	onMount(() => {
		// Only set up if we're on the main page
		if (window.location.pathname === '/') {
			document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach((element) => {
				const anchor = element as HTMLAnchorElement;
				// Skip if this is one of our navigation links (already handled)
				if (anchor.closest('header')) return;
				
				anchor.addEventListener('click', function (e: Event) {
					e.preventDefault();
					const href = anchor.getAttribute('href');
					if (href) {
						// Handle both #section and /#section formats
						const targetId = href.startsWith('/#') ? href.substring(2) : href.substring(1);
						const target = document.getElementById(targetId);
						if (target) {
							target.scrollIntoView({
								behavior: 'smooth',
								block: 'start'
							});
						}
					}
				});
			});
		}
	});
</script>

<!-- Professional Header -->
<header class="site-header" class:header-hidden={hidden}>
	<div class="site-header-container">
		<div class="site-header-content">
		<!-- Logo and branding -->
		<div class="site-header-brand">
			<Logo 
				variant="modern" 
				href={isAuthenticated ? '/?view=home' : '/'} 
				size="xl"
			/>
			<!-- Beta Badge -->
			<BetaBadge text="Beta" icon={FlaskConical} variant="small" class="header-beta-badge" />
		</div>

		<!-- Desktop Navigation -->
		<nav class="nav-desktop">
			<a href="/explore" class="nav-link">
				<Search class="w-4 h-4" />
				<span>Explore Tours</span>
			</a>
			<a href={isAuthenticated ? '/?view=home#how-it-works' : '/#how-it-works'} onclick={(e) => handleNavClick(e, isAuthenticated ? '/?view=home#how-it-works' : '/#how-it-works')} class="nav-link">
				<MapPin class="w-4 h-4" />
				<span>How it Works</span>
			</a>
			<a href={isAuthenticated ? '/?view=home#pricing' : '/#pricing'} onclick={(e) => handleNavClick(e, isAuthenticated ? '/?view=home#pricing' : '/#pricing')} class="nav-link">
				<DollarSign class="w-4 h-4" />
				<span>Pricing</span>
			</a>
			<a href="/blog" class="nav-link">
				<BookOpen class="w-4 h-4" />
				<span>Blog</span>
			</a>
		</nav>

			<!-- Right Side Actions -->
			<div class="header-actions">
				<!-- Auth section -->
				{#if !isMounted.current}
					<div class="loading-text">{t('auth.loading', $language)}</div>
				{:else if isAuthenticated}
					<div class="auth-section">
						<a href="/dashboard" class="dashboard-link">
							Dashboard
						</a>
						<span class="separator">•</span>
						<span class="user-info">
							{currentUser?.name || currentUser?.email || 'User'}
						</span>
						{#if currentUser && (currentUser.promoCodeUsed || currentUser.subscriptionDiscountPercentage > 0 || (currentUser.subscriptionFreeUntil && new Date(currentUser.subscriptionFreeUntil) > new Date()))}
							<span class="separator separator--hidden">•</span>
							<div class="promo-banner">
								<PromoStatusBanner variant="compact" />
							</div>
						{/if}
						<span class="separator">•</span>
						<button
							onclick={handleLogout}
							disabled={isLoggingOut}
							class="logout-button"
						>
							{#if isLoggingOut}
								<Loader2 class="h-3 w-3 animate-spin" />
							{/if}
							{t('auth.logout', $language)}
						</button>
					</div>
				{:else}
					<div class="guest-section">
						<a href="/auth/login" class="login-link">
							{t('auth.login', $language)}
						</a>
				<button 
					class="guest-cta-button"
					onclick={() => window.location.href = '/beta-2/apply'}
				>
					<span class="guest-cta-text-mobile">Join Beta 2</span>
					<span class="guest-cta-text-desktop">Apply for Beta 2</span>
				</button>
					</div>
				{/if}

				<!-- Mobile Menu Button -->
				<button
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="mobile-toggle"
					aria-label="Toggle mobile menu"
				>
					{#if mobileMenuOpen}
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					{:else}
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
						</svg>
					{/if}
				</button>
			</div>
		</div>
	</div>
</header>

<!-- Mobile Menu Backdrop -->
{#if mobileMenuOpen}
	<div 
		role="button" 
		tabindex="-1"
		class="mobile-backdrop" 
		onclick={() => (mobileMenuOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (mobileMenuOpen = false)}
	></div>
{/if}

<!-- Mobile Menu -->
{#if mobileMenuOpen}
	<div class="mobile-menu">
		<div class="mobile-menu-content">
		<!-- Navigation Links -->
		<div class="mobile-nav">
			<a href="/explore" onclick={handleMobileLinkClick} class="mobile-nav-link">
				<Search class="w-4 h-4" />
				<span>Explore Tours</span>
			</a>
			<a href={isAuthenticated ? '/?view=home#calculator' : '/#calculator'} onclick={(e) => handleNavClick(e, isAuthenticated ? '/?view=home#calculator' : '/#calculator')} class="mobile-nav-link">
				<Calculator class="w-4 h-4" />
				<span>Calculator</span>
			</a>
			<a href={isAuthenticated ? '/?view=home#booking-demo' : '/#booking-demo'} onclick={(e) => handleNavClick(e, isAuthenticated ? '/?view=home#booking-demo' : '/#booking-demo')} class="mobile-nav-link">
				<Smartphone class="w-4 h-4" />
				<span>Demo</span>
			</a>
			<a href={isAuthenticated ? '/?view=home#how-it-works' : '/#how-it-works'} onclick={(e) => handleNavClick(e, isAuthenticated ? '/?view=home#how-it-works' : '/#how-it-works')} class="mobile-nav-link">
				<MapPin class="w-4 h-4" />
				<span>How it Works</span>
			</a>
			<a href={isAuthenticated ? '/?view=home#pricing' : '/#pricing'} onclick={(e) => handleNavClick(e, isAuthenticated ? '/?view=home#pricing' : '/#pricing')} class="mobile-nav-link">
				<DollarSign class="w-4 h-4" />
				<span>Pricing</span>
			</a>
			<a href={isAuthenticated ? '/?view=home#timeline' : '/#timeline'} onclick={(e) => handleNavClick(e, isAuthenticated ? '/?view=home#timeline' : '/#timeline')} class="mobile-nav-link">
				<Calendar class="w-4 h-4" />
				<span>Roadmap</span>
			</a>
			<a href={isAuthenticated ? '/?view=home#faq' : '/#faq'} onclick={(e) => handleNavClick(e, isAuthenticated ? '/?view=home#faq' : '/#faq')} class="mobile-nav-link">
				<HelpCircle class="w-4 h-4" />
				<span>FAQ</span>
			</a>
			<a href="/blog" onclick={handleMobileLinkClick} class="mobile-nav-link">
				<BookOpen class="w-4 h-4" />
				<span>Blog</span>
			</a>
		</div>

			<!-- Mobile Auth Section - Only show for authenticated users -->
			{#if isMounted.current && isAuthenticated}
				<div class="mobile-auth">
					<div class="mobile-auth-authenticated">
						<a href="/dashboard" onclick={handleMobileLinkClick} class="mobile-dashboard-link">
							My Dashboard
						</a>
						<div class="mobile-user-info">
							Signed in as {currentUser?.name || currentUser?.email || 'User'}
						</div>
						<button
							onclick={handleLogout}
							disabled={isLoggingOut}
							class="mobile-logout-button"
						>
							{#if isLoggingOut}
								<Loader2 class="h-3 w-3 animate-spin" />
							{/if}
							{t('auth.logout', $language)}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Site Header - compact and minimal */
	.site-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		background: var(--bg-primary);
		border-bottom: 1px solid var(--border-primary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		transition: all var(--transition-base);
	}

	.site-header-container {
		max-width: 1600px;
		margin: 0 auto;
		padding: 0 1rem;
		position: relative;
		z-index: 2;
	}

	@media (min-width: 640px) {
		.site-header-container {
			padding: 0 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.site-header-container {
			padding: 0 3rem;
		}
	}

	.site-header-content {
		display: flex;
		height: 3.5rem;
		align-items: center;
		justify-content: space-between;
	}

	@media (min-width: 640px) {
		.site-header-content {
			height: 4.5rem;
			padding: 0 3.25rem;
		}
	}

	@media (min-width: 1024px) {
		.site-header-content {
			height: 5rem;
		}
	}

	/* Brand */
	.site-header-brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		height: 100%;
	}

	@media (min-width: 640px) {
		.site-header-brand {
			gap: 1rem;
		}
	}

	/* Beta Badge positioning */
	:global(.header-beta-badge) {
		opacity: 0.9;
		transition: opacity var(--transition-base) ease;
	}

	:global(.header-beta-badge:hover) {
		opacity: 1;
	}

	/* Desktop Navigation */
	.nav-desktop {
		display: none;
		align-items: center;
		gap: 2rem;
	}

	@media (min-width: 1024px) {
		.nav-desktop {
			display: flex;
		}
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
		font-size: 0.9375rem;
		letter-spacing: -0.01em;
		color: var(--text-secondary);
		text-decoration: none !important;
		transition: all var(--transition-base);
		padding: 0.625rem 1rem;
		border-radius: var(--radius-md);
		border: 1.5px solid transparent;
		position: relative;
	}

	.nav-link:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
		border-color: var(--border-primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-xs);
	}

	/* Remove underline */
	.nav-link::after,
	.nav-link::before {
		display: none !important;
	}

	/* Header Actions */
	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	@media (min-width: 640px) {
		.header-actions {
			gap: 0.75rem;
		}
	}

	@media (min-width: 1024px) {
		.header-actions {
			gap: 1rem;
		}
	}

	/* Loading Text */
	.loading-text {
		display: none;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	@media (min-width: 768px) {
		.loading-text {
			display: block;
		}
	}

	/* Auth Section */
	.auth-section {
		display: none;
		align-items: center;
		gap: 0.75rem;
	}

	@media (min-width: 768px) {
		.auth-section {
			display: flex;
		}
	}

	.dashboard-link {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color var(--transition-base) ease;
	}

	.dashboard-link:hover {
		color: var(--text-primary);
	}

	.separator {
		color: var(--text-tertiary);
		font-weight: 300;
	}

	.separator--hidden {
		display: none;
	}

	@media (min-width: 640px) {
		.separator--hidden {
			display: inline;
		}
	}

	.user-info {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.promo-banner {
		display: none;
	}

	@media (min-width: 640px) {
		.promo-banner {
			display: block;
		}
	}

	.logout-button {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: color var(--transition-base) ease;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0;
	}

	.logout-button:hover {
		color: var(--text-primary);
	}

	.logout-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Guest Section - Always visible on mobile */
	.guest-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	@media (min-width: 768px) {
		.guest-section {
			gap: 0.75rem;
		}
	}

	.login-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-secondary);
		text-decoration: none !important;
		transition: all var(--transition-base) ease;
		padding: 0.4rem 0.75rem;
		border-radius: var(--radius-md);
		border: 1.5px solid var(--border-primary);
		background: var(--bg-secondary);
		white-space: nowrap;
		letter-spacing: -0.01em;
		line-height: 1.4;
		box-sizing: border-box;
	}

	.login-link:hover {
		color: var(--text-primary);
		border-color: var(--border-secondary);
		background: var(--bg-tertiary);
		text-decoration: none !important;
	}

	/* Remove any potential underlines */
	.login-link::before,
	.login-link::after {
		display: none !important;
	}

	@media (min-width: 640px) {
		.login-link {
			font-size: 0.8rem;
			padding: 0.5rem 0.875rem;
		}
	}

	@media (min-width: 768px) {
		.login-link {
			font-size: 0.875rem;
			padding: 0.5rem 1rem;
		}
	}

	/* Guest CTA Button - Responsive sizing */
	.guest-cta-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		padding: 0.4rem 0.75rem;
		font-weight: 700;
		white-space: nowrap;
		letter-spacing: -0.01em;
		line-height: 1.4;
		box-sizing: border-box;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-base);
		text-decoration: none;
		text-align: center;
		user-select: none;
		background: var(--color-primary-700);
		color: #ffffff;
		border: 1.5px solid var(--color-primary-700);
		-webkit-tap-highlight-color: transparent;
		box-shadow: var(--shadow-sm), var(--shadow-primary);
	}

	.guest-cta-button:hover:not(:disabled) {
		background: var(--color-primary-800);
		border-color: var(--color-primary-800);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md), 0 4px 12px -2px rgba(250, 107, 93, 0.4);
	}

	.guest-cta-button:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.guest-cta-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (min-width: 640px) {
		.guest-cta-button {
			font-size: 0.8rem;
			padding: 0.5rem 0.875rem;
		}
	}

	@media (min-width: 768px) {
		.guest-cta-button {
			font-size: 0.875rem;
			padding: 0.5rem 1rem;
		}
	}

	/* Responsive button text */
	.guest-cta-text-mobile {
		display: inline;
	}

	.guest-cta-text-desktop {
		display: none;
	}

	@media (min-width: 768px) {
		.guest-cta-text-mobile {
			display: none;
		}

		.guest-cta-text-desktop {
			display: inline;
		}
	}

	/* Mobile Toggle */
	.mobile-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: var(--radius-md);
		transition: all var(--transition-base) ease;
	}

	.mobile-toggle:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.mobile-toggle svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	@media (min-width: 640px) {
		.mobile-toggle {
			padding: 0.5rem;
		}

		.mobile-toggle svg {
			width: 1.5rem;
			height: 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.mobile-toggle {
			display: none;
		}
	}

	/* Mobile Menu */
	.mobile-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 98;
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.mobile-menu {
		position: fixed;
		top: 3.5rem;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--bg-primary);
		z-index: 99;
		border-top: 1px solid var(--border-primary);
		box-shadow: var(--shadow-lg);
		overflow-y: auto;
		transform: translateY(0);
		transition: transform var(--transition-base) ease;
		animation: slideIn 0.3s ease-out;
	}

	@media (min-width: 640px) {
		.mobile-menu {
			top: 4.5rem;
		}
	}

	@media (min-width: 1024px) {
		.mobile-menu {
			top: 5rem;
		}
	}

	@keyframes slideIn {
		from {
			transform: translateY(-100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.mobile-menu-content {
		padding: 2rem 1.5rem;
		max-width: 600px;
		margin: 0 auto;
	}

	/* Mobile Navigation */
	.mobile-nav {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	.mobile-nav-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-weight: 600;
		font-size: 1rem;
		color: var(--text-secondary);
		text-decoration: none;
		transition: all var(--transition-base) ease;
		padding: 1rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-primary);
		position: relative;
		overflow: hidden;
	}

	/* Subtle accent on hover */
	.mobile-nav-link::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--primary);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}

	.mobile-nav-link:hover::before {
		transform: scaleX(1);
	}

	.mobile-nav-link:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
	}

	/* Ensure clicks on mobile nav links pass through from child elements */
	.mobile-nav-link > *,
	.mobile-nav-link svg,
	.mobile-nav-link span {
		pointer-events: none;
	}

	/* Mobile Auth */
	.mobile-auth {
		border-top: 1px solid var(--border-primary);
		padding-top: 2rem;
	}



	.mobile-auth-authenticated {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.mobile-dashboard-link {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		text-decoration: none;
		padding: 1rem;
		border-radius: var(--radius-lg);
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		text-align: center;
		transition: all var(--transition-base) ease;
	}

	.mobile-dashboard-link:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
	}

	/* Ensure clicks on mobile dashboard link pass through from child elements */
	.mobile-dashboard-link > *,
	.mobile-dashboard-link svg,
	.mobile-dashboard-link span {
		pointer-events: none;
	}

	.mobile-user-info {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-align: center;
		padding: 0.5rem;
	}

	.mobile-logout-button {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-secondary);
		background: transparent;
		border: 1px solid var(--border-primary);
		cursor: pointer;
		transition: all var(--transition-base) ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		border-radius: var(--radius-lg);
	}

	.mobile-logout-button:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
	}

	.mobile-logout-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Ensure clicks on mobile logout button pass through from child elements */
	.mobile-logout-button > *,
	.mobile-logout-button svg,
	.mobile-logout-button span {
		pointer-events: none;
	}

	/* Dark Mode Support */
	/* Header background now uses theme-aware CSS variables automatically */

	/* Dark mode navigation */
	[data-theme="dark"] .nav-link {
		color: var(--text-secondary);
	}

	[data-theme="dark"] .nav-link:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	[data-theme="dark"] .nav-link::before {
		background: var(--primary);
	}

	/* Dark mode auth section */
	[data-theme="dark"] .loading-text,
	[data-theme="dark"] .user-info {
		color: var(--text-secondary);
	}

	[data-theme="dark"] .dashboard-link,
	[data-theme="dark"] .login-link {
		color: var(--text-secondary);
		border-color: var(--border-primary);
		background: var(--bg-secondary);
	}

	[data-theme="dark"] .dashboard-link:hover,
	[data-theme="dark"] .login-link:hover {
		color: var(--text-primary);
	}

	[data-theme="dark"] .login-link:hover {
		border-color: var(--border-secondary);
		background: var(--bg-tertiary);
	}

	/* Force dark mode styles with maximum specificity */
	:global([data-theme="dark"]) .guest-section .guest-cta-button,
	:global(html[data-theme="dark"]) .guest-section .guest-cta-button,
	:global([data-theme="dark"]) button.guest-cta-button {
		background: var(--color-primary-600) !important;
		border-color: var(--color-primary-600) !important;
		color: rgb(11, 13, 16) !important;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(255, 107, 85, 0.3) !important;
		text-shadow: none !important;
	}

	:global([data-theme="dark"]) .guest-section .guest-cta-button:hover:not(:disabled),
	:global(html[data-theme="dark"]) .guest-section .guest-cta-button:hover:not(:disabled),
	:global([data-theme="dark"]) button.guest-cta-button:hover:not(:disabled) {
		background: var(--color-primary-700) !important;
		border-color: var(--color-primary-700) !important;
		color: rgb(11, 13, 16) !important;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(255, 138, 115, 0.4) !important;
		text-shadow: none !important;
	}

	:global([data-theme="dark"]) .guest-section .guest-cta-button:active:not(:disabled),
	:global(html[data-theme="dark"]) .guest-section .guest-cta-button:active:not(:disabled),
	:global([data-theme="dark"]) button.guest-cta-button:active:not(:disabled) {
		background: var(--color-primary-500) !important;
		border-color: var(--color-primary-500) !important;
		color: rgb(11, 13, 16) !important;
		text-shadow: none !important;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3) !important;
	}

	[data-theme="dark"] .separator {
		color: var(--text-tertiary);
	}

	[data-theme="dark"] .logout-button {
		color: var(--text-secondary);
	}

	[data-theme="dark"] .logout-button:hover {
		color: var(--text-primary);
	}

	/* Dark mode mobile toggle */
	[data-theme="dark"] .mobile-toggle {
		color: var(--text-secondary);
	}

	[data-theme="dark"] .mobile-toggle:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	/* Dark mode mobile menu */
	[data-theme="dark"] .mobile-backdrop {
		background: rgba(0, 0, 0, 0.7);
	}

	[data-theme="dark"] .mobile-menu {
		background: var(--bg-primary);
		border-top-color: var(--border-primary);
	}

	[data-theme="dark"] .mobile-nav-link {
		color: var(--text-secondary);
		border-color: var(--border-primary);
	}

	[data-theme="dark"] .mobile-nav-link:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
	}

	[data-theme="dark"] .mobile-nav-link::before {
		background: var(--primary);
	}

	/* Dark mode mobile auth */
	[data-theme="dark"] .mobile-auth {
		border-top-color: var(--border-primary);
	}

	[data-theme="dark"] .mobile-user-info {
		color: var(--text-secondary);
	}

	[data-theme="dark"] .mobile-dashboard-link {
		color: var(--text-primary);
		background: var(--bg-secondary);
		border-color: var(--border-primary);
	}

	[data-theme="dark"] .mobile-dashboard-link:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
	}

	[data-theme="dark"] .mobile-logout-button {
		color: var(--text-secondary);
		border-color: var(--border-primary);
	}

	[data-theme="dark"] .mobile-logout-button:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		:global(.header-beta-badge) {
			display: none; /* Hide beta badge on small mobile to save space */
		}
	}

	@media (max-width: 480px) {
		.site-header-container {
			padding: 0 1rem;
		}

		.mobile-menu-content {
			padding: 1.5rem 1rem;
		}
	}
</style>

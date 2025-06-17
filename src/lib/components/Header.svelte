<script lang="ts">
	import { language, t } from '$lib/i18n.js';
	import { switchLanguage } from '$lib/context.js';
	import { logout } from '$lib/auth/client.js';
	import { IsMounted } from 'runed';
	import { onMount } from 'svelte';
	import Loader2 from 'lucide-svelte/icons/loader-2';

	interface HeaderProps {
		isAuthenticated: boolean;
		currentUser: any;
	}

	let { isAuthenticated, currentUser }: HeaderProps = $props();

	// Use IsMounted from Runed
	const isMounted = new IsMounted();

	// Mobile menu state
	let mobileMenuOpen = $state(false);

	// Logout loading state
	let isLoggingOut = $state(false);

	// Language switcher functions
	function switchToEnglish(event: MouseEvent) {
		event.preventDefault();
		switchLanguage('en');
	}

	function switchToPolish(event: MouseEvent) {
		event.preventDefault();
		switchLanguage('pl');
	}

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
		// Close mobile menu if open
		mobileMenuOpen = false;
		
		// Check if it's an anchor link (starts with # or /#)
		if (href.startsWith('#') || href.startsWith('/#')) {
			event.preventDefault();
			
			// Handle both #section and /#section formats
			const targetId = href.startsWith('/#') ? href.substring(2) : href.substring(1);
			const target = document.getElementById(targetId);
			
			if (target) {
				// If we're not on the main page, navigate there first
				if (window.location.pathname !== '/') {
					// Fix URL construction - href already includes the /# part
					window.location.href = href.startsWith('/#') ? href : '/' + href;
					return;
				}
				
				// We're on the main page, smooth scroll
				target.scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});
			} else if (window.location.pathname !== '/') {
				// Target doesn't exist and we're not on main page, navigate to main page
				window.location.href = href.startsWith('/#') ? href : '/' + href;
			}
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

<!-- Modern header with improved navigation -->
<header class="header-sticky">
	<div class="mx-auto max-w-screen-2xl px-6 sm:px-8 lg:px-12">
		<div class="flex h-20 items-center justify-between">
			<!-- Logo and branding -->
			<div class="flex items-center">
				<a href={isAuthenticated ? '/?view=home' : '/'} class="text-2xl font-normal text-gray-900 logo-serif hover:text-gray-700 transition-colors">
					zaur.app
				</a>
			</div>

			<!-- Desktop navigation -->
			<nav class="hidden items-center gap-8 lg:flex">
				<a href={isAuthenticated ? '/?view=home#features' : '/#features'} onclick={(e) => handleNavClick(e, isAuthenticated ? '/?view=home#features' : '/#features')} class="font-medium text-gray-600 transition-colors hover:text-gray-900"
					>Features</a
				>
				<a
					href={isAuthenticated ? '/?view=home#how-it-works' : '/#how-it-works'}
					onclick={(e) => handleNavClick(e, isAuthenticated ? '/?view=home#how-it-works' : '/#how-it-works')}
					class="font-medium text-gray-600 transition-colors hover:text-gray-900">How it Works</a
				>
				<a href={isAuthenticated ? '/?view=home#pricing' : '/#pricing'} onclick={(e) => handleNavClick(e, isAuthenticated ? '/?view=home#pricing' : '/#pricing')} class="font-medium text-gray-600 transition-colors hover:text-gray-900"
					>Pricing</a
				>
			</nav>

			<!-- Right side actions -->
			<div class="flex items-center gap-4">
				<!-- Auth section -->
				{#if !isMounted.current}
					<div class="hidden text-sm text-gray-500 md:block">{t('auth.loading', $language)}</div>
				{:else if isAuthenticated}
					<div class="hidden items-center gap-3 md:flex">
						<a 
							href="/dashboard" 
							class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
						>
							Dashboard
						</a>
						<span class="text-gray-300">•</span>
						<span class="text-sm text-gray-600">
							{currentUser?.name || currentUser?.email || 'User'}
						</span>
						<span class="text-gray-300">•</span>
						<button
							onclick={handleLogout}
							disabled={isLoggingOut}
							class="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 leading-none p-0 border-0 bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
						>
							{#if isLoggingOut}
								<Loader2 class="h-3 w-3 animate-spin" />
							{/if}
							{t('auth.logout', $language)}
						</button>
					</div>
				{:else}
					<div class="hidden items-center gap-3 md:flex">
						<a 
							href="/auth/login" 
							class="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
						>
							{t('auth.login', $language)}
						</a>
						<a
							href="/auth/register"
							class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
						>
							Start for Free
						</a>
					</div>
				{/if}

				<!-- Language switcher - Hidden for now -->
				<!-- <div class="hidden items-center gap-1 border-l border-gray-200 pl-4 md:flex">
					<button
						class="rounded px-2 py-1 text-sm font-medium transition-colors {$language === 'en'
							? 'bg-gray-100 text-gray-900'
							: 'text-gray-600 hover:text-gray-900'}"
						onclick={switchToEnglish}
					>
						EN
					</button>
					<button
						class="rounded px-2 py-1 text-sm font-medium transition-colors {$language === 'pl'
							? 'bg-gray-100 text-gray-900'
							: 'text-gray-600 hover:text-gray-900'}"
						onclick={switchToPolish}
					>
						PL
					</button>
				</div> -->

				<!-- Mobile menu button -->
				<button
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
					aria-label="Toggle mobile menu"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if mobileMenuOpen}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						{:else}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							></path>
						{/if}
					</svg>
				</button>
			</div>
		</div>
	</div>
</header>

<!-- Mobile menu backdrop -->
{#if mobileMenuOpen}
	<div 
		role="button" 
		tabindex="-1"
		class="fixed inset-0 top-20 bg-black/20 lg:hidden z-[60]" 
		onclick={() => (mobileMenuOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (mobileMenuOpen = false)}
	></div>
{/if}

<!-- Mobile menu -->
{#if mobileMenuOpen}
	<div class="fixed top-20 left-0 w-screen bg-white border-t border-gray-200 shadow-xl lg:hidden z-[70]">
		<div class="flex flex-col px-6 py-6 sm:px-8">
			<!-- Navigation links -->
			<div class="flex flex-col space-y-1 pb-4">
				<a href={isAuthenticated ? '/?view=home#features' : '/#features'} onclick={(e) => handleNavClick(e, isAuthenticated ? '/?view=home#features' : '/#features')} class="block py-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
					>Features</a
				>
				<a href={isAuthenticated ? '/?view=home#how-it-works' : '/#how-it-works'} onclick={(e) => handleNavClick(e, isAuthenticated ? '/?view=home#how-it-works' : '/#how-it-works')} class="block py-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
					>How it Works</a
				>
				<a href={isAuthenticated ? '/?view=home#pricing' : '/#pricing'} onclick={(e) => handleNavClick(e, isAuthenticated ? '/?view=home#pricing' : '/#pricing')} class="block py-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
					>Pricing</a
				>
			</div>

			<!-- Auth section -->
			<div class="flex flex-col border-t border-gray-200 pt-4 pb-4">
				{#if !isMounted.current}
					<div class="py-3 text-sm text-gray-500">{t('auth.loading', $language)}</div>
				{:else if isAuthenticated}
					<div class="flex flex-col space-y-1">
						<a 
							href="/dashboard" 
							onclick={handleMobileLinkClick} 
							class="block py-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
						>
							My Dashboard
						</a>
						<div class="py-3 text-sm text-gray-500">
							Signed in as {currentUser?.name || currentUser?.email || 'User'}
						</div>
						<button
							onclick={handleLogout}
							disabled={isLoggingOut}
							class="flex w-full items-center gap-2 py-3 text-left text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if isLoggingOut}
								<Loader2 class="h-3 w-3 animate-spin" />
							{/if}
							{t('auth.logout', $language)}
						</button>
					</div>
				{:else}
					<div class="flex flex-col space-y-3">
						<a href="/auth/login" onclick={handleMobileLinkClick} class="block py-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
							{t('auth.login', $language)}
						</a>
						<a
							href="/auth/register"
							onclick={handleMobileLinkClick}
							class="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
						>
							Start for Free
						</a>
					</div>
				{/if}
			</div>

			<!-- Mobile language switcher - Hidden for now -->
			<!-- <div class="flex flex-row gap-2 border-t border-gray-200 pt-4">
				<button
					class="rounded px-3 py-2 text-sm font-medium transition-colors {$language === 'en'
						? 'bg-gray-100 text-gray-900'
						: 'text-gray-600 hover:text-gray-900'}"
					onclick={switchToEnglish}
				>
					English
				</button>
				<button
					class="rounded px-3 py-2 text-sm font-medium transition-colors {$language === 'pl'
						? 'bg-gray-100 text-gray-900'
						: 'text-gray-600 hover:text-gray-900'}"
					onclick={switchToPolish}
				>
					Polski
				</button>
			</div> -->
		</div>
	</div>
{/if}

<style lang="postcss">
	@reference "tailwindcss";
	
	.logo-serif {
		font-family: Georgia, 'Times New Roman', serif;
		font-weight: 400;
		letter-spacing: -0.025em;
	}
	
	.header-sticky {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 50;
		background: white;
		border-bottom: 1px solid #e5e7eb;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	/* Ensure the header container has proper spacing */
	.header-sticky > div {
		@apply mx-auto max-w-screen-2xl px-6 sm:px-8 lg:px-12;
	}

	.header-sticky > div > div {
		@apply flex h-20 items-center justify-between;
	}
</style>

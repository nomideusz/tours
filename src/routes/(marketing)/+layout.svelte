<script lang="ts">
	import { auth } from '$lib/stores/auth.js';
	import { isAuthenticated, currentUser } from '$lib/stores/auth.js';
	import { themeStore } from '$lib/stores/theme.js';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { children, data } = $props<{ data?: any }>();

	// Initialize auth store with server data - only once
	let authInitialized = $state(false);
	$effect(() => {
		if (data && !authInitialized) {
			auth.initialize(data);
			authInitialized = true;
		}
	});

	// Use auth stores for reactive auth state
	let userIsAuthenticated = $derived($isAuthenticated);
	let currentUserData = $derived($currentUser);

	// Header reference for closing mobile menu
	let headerRef: Header;

	// Initialize theme store
	let themeCleanup: (() => void) | undefined;
	onMount(() => {
		themeCleanup = themeStore.init();
		
		return () => {
			themeCleanup?.();
		};
	});

	// Close mobile menu on navigation
	afterNavigate(() => {
		if (headerRef) {
			headerRef.closeMobileMenu();
		}
	});

	// Get SEO data from server or provide defaults
	const seo = $derived(data?.seo || {
		title: 'Zaur - More Bookings, Less Hassle for Independent Tour Guides',
		description: 'The simplest booking system with QR codes, instant reservations, and secure payments. No commission fees, ever.',
		canonical: $page.url.href,
		keywords: 'QR booking, tour guides, instant booking, tourism, travel, independent tour guides, booking system, no commission'
	});
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{seo.title}</title>
	<meta name="title" content={seo.title} />
	<meta name="description" content={seo.description} />
	<meta name="keywords" content={seo.keywords} />
	<meta name="author" content="Zaur" />
	<meta name="robots" content="index, follow" />
	<meta name="language" content="English" />
	
	<!-- Canonical URL -->
	<link rel="canonical" href={seo.canonical} />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={seo.openGraph?.type || 'website'} />
	<meta property="og:url" content={seo.openGraph?.url || seo.canonical} />
	<meta property="og:title" content={seo.openGraph?.title || seo.title} />
	<meta property="og:description" content={seo.openGraph?.description || seo.description} />
	<meta property="og:image" content={seo.openGraph?.image} />
	<meta property="og:site_name" content={seo.openGraph?.site_name || 'Zaur'} />
	<meta property="og:locale" content="en_US" />
	
	<!-- Twitter -->
	<meta property="twitter:card" content={seo.twitter?.card || 'summary_large_image'} />
	<meta property="twitter:url" content={seo.openGraph?.url || seo.canonical} />
	<meta property="twitter:title" content={seo.twitter?.title || seo.title} />
	<meta property="twitter:description" content={seo.twitter?.description || seo.description} />
	<meta property="twitter:image" content={seo.twitter?.image || seo.openGraph?.image} />
	
	<!-- Additional SEO -->
	<meta name="theme-color" content="#2480ec" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content="Zaur" />
	
	<!-- Structured Data for Organization -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "Organization",
		"name": "Zaur",
		"url": "https://zaur.app",
		"logo": "https://zaur.app/images/logo.png",
		"description": "The simplest booking system with QR codes for independent tour guides. More bookings, less hassle.",
		"sameAs": [
			"https://twitter.com/zaur_app",
			"https://linkedin.com/company/zaur"
		],
		"contactPoint": {
			"@type": "ContactPoint",
			"contactType": "customer service",
			"url": "https://zaur.app/contact"
		}
	}
	</script>`}
	
	<!-- Umami Analytics - Production Only -->
	{#if !import.meta.env.DEV}
		<script defer src="https://umami.zaur.app/script.js" data-website-id="92ff6091-acae-433b-813b-561a4f524314"></script>
	{/if}
</svelte:head>

<!-- Clean Marketing Layout -->
<div class="min-h-screen flex flex-col subtle-retro-section">
	<Header 
		bind:this={headerRef}
		isAuthenticated={userIsAuthenticated}
		currentUser={currentUserData}
	/>

	<main class="flex-1 pt-20 relative z-10">
		{@render children()}
	</main>

	<!-- Floating Theme Toggle -->
	<div class="floating-theme-toggle">
		<ThemeToggle tooltipPosition="top" />
	</div>

	<Footer />
</div>

<style lang="postcss">
	/* Ensure consistent background and text colors */
	:global(body) {
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}

	/* Clean text utilities */
	:global(.text-secondary) {
		color: var(--text-secondary);
	}

	/* Clean marketing headings */
	:global(.marketing-heading) {
		font-weight: 700;
		line-height: 1.2;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	:global(.marketing-heading-xl) {
		font-size: 2.5rem;
	}

	:global(.marketing-heading-lg) {
		font-size: 2rem;
	}

	:global(.marketing-heading-md) {
		font-size: 1.5rem;
	}

	@media (min-width: 768px) {
		:global(.marketing-heading-xl) {
			font-size: 3.5rem;
		}

		:global(.marketing-heading-lg) {
			font-size: 2.5rem;
		}

		:global(.marketing-heading-md) {
			font-size: 1.875rem;
		}
	}

	/* Clean button cursor behavior */
	:global(.marketing-button *),
	:global(.marketing-button svg),
	:global(.marketing-button span),
	:global(button *),
	:global(button svg),
	:global(button span) {
		pointer-events: none;
		cursor: inherit;
	}
	
	:global(button) {
		cursor: pointer;
	}

	/* Floating Theme Toggle */
	.floating-theme-toggle {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 1000;
		pointer-events: auto;
		opacity: 1;
		visibility: visible;
	}

	/* Ensure it's visible on mobile too */
	@media (max-width: 768px) {
		.floating-theme-toggle {
			bottom: 1rem;
			right: 1rem;
		}
	}
</style> 
<script lang="ts">
	import { auth } from '$lib/stores/auth.js';
	import { isAuthenticated, currentUser } from '$lib/stores/auth.js';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children, data } = $props<{ data?: any }>();

	// Initialize auth store with server data
	$effect(() => {
		if (data) {
			auth.initialize(data);
		}
	});

	// Use auth stores for reactive auth state
	let userIsAuthenticated = $derived($isAuthenticated);
	let currentUserData = $derived($currentUser);

	// Header reference for closing mobile menu
	let headerRef: Header;

	// Close mobile menu on navigation
	afterNavigate(() => {
		if (headerRef) {
			headerRef.closeMobileMenu();
		}
	});

	// Get SEO data from server or provide defaults
	const seo = $derived(data?.seo || {
		title: 'Zaur - QR Booking for Tour Guides',
		description: 'Professional QR code booking system for tour guides. Let tourists book and pay instantly — no apps, no friction.',
		canonical: $page.url.href,
		keywords: 'QR booking, tour guides, instant booking, tourism, travel'
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
		"description": "Professional QR code booking system for tour guides",
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

<!-- Marketing Layout: Header + Main + Footer -->
<div class="min-h-screen flex flex-col" style="background: var(--bg-primary);">
	<Header 
		bind:this={headerRef}
		isAuthenticated={userIsAuthenticated}
		currentUser={currentUserData}
	/>

	<main class="flex-1 pt-20">
		{@render children()}
	</main>

	<Footer />
</div>

<style lang="postcss">
	/* Ensure consistent background and text colors */
	:global(body) {
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}

	/* Marketing page specific styles */
	:global(.marketing-section) {
		padding: 4rem 0;
		border-bottom: 1px solid var(--border-primary);
	}

	@media (max-width: 768px) {
		:global(.marketing-section) {
			padding: 2.5rem 0;
		}
	}

	/* Consistent container styling */
	:global(.marketing-container) {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	@media (min-width: 640px) {
		:global(.marketing-container) {
			padding: 0 2rem;
		}
	}

	@media (min-width: 1024px) {
		:global(.marketing-container) {
			padding: 0 3rem;
		}
	}

	/* Typography improvements */
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

	/* Card styling consistent with app */
	:global(.marketing-card) {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
		transition: all 0.2s ease-in-out;
	}

	:global(.marketing-card:hover) {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		border-color: var(--border-secondary);
	}

	/* Button improvements */
	:global(.marketing-button) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		transition: all 0.2s ease-in-out;
		cursor: pointer;
		border: 1px solid transparent;
		text-decoration: none;
	}

	:global(.marketing-button-primary) {
		background: var(--color-primary-600);
		color: white;
	}

	:global(.marketing-button-primary:hover) {
		background: var(--color-primary-700);
	}

	:global(.marketing-button-secondary) {
		background: var(--bg-primary);
		color: var(--text-primary);
		border-color: var(--border-primary);
	}

	:global(.marketing-button-secondary:hover) {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
	}

	/* Grid improvements */
	:global(.marketing-grid) {
		display: grid;
		gap: 1.5rem;
	}

	:global(.marketing-grid-2) {
		grid-template-columns: repeat(1, 1fr);
	}

	:global(.marketing-grid-3) {
		grid-template-columns: repeat(1, 1fr);
	}

	@media (min-width: 768px) {
		:global(.marketing-grid-2) {
			grid-template-columns: repeat(2, 1fr);
		}

		:global(.marketing-grid-3) {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* Text improvements */
	:global(.marketing-text-primary) {
		color: var(--text-primary);
	}

	:global(.marketing-text-secondary) {
		color: var(--text-secondary);
	}

	:global(.marketing-text-muted) {
		color: var(--text-tertiary);
	}

	/* Alert styles consistent with app */
	:global(.marketing-alert) {
		padding: 1rem;
		border-radius: 0.5rem;
		border: 1px solid;
		margin-bottom: 1rem;
	}

	:global(.marketing-alert-info) {
		background: var(--color-info-50);
		border-color: var(--color-info-200);
		color: var(--color-info-800);
	}

	:global(.marketing-alert-warning) {
		background: var(--color-warning-50);
		border-color: var(--color-warning-200);
		color: var(--color-warning-800);
	}

	:global(.marketing-alert-success) {
		background: var(--color-success-50);
		border-color: var(--color-success-200);
		color: var(--color-success-800);
	}
</style> 
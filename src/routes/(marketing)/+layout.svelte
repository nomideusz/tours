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
	<meta name="theme-color" content="#3B82F6" />
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
<Header 
	bind:this={headerRef}
	isAuthenticated={userIsAuthenticated}
	currentUser={currentUserData}
/>

<main class="main pt-20">
	{@render children()}
</main>

<Footer />

<style lang="postcss">
	@reference "tailwindcss";
	
	.main {
		min-height: calc(100vh - 80px);
		flex: 1;
		width: 100%;
		max-width: 100%;
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}

	/* Ensure sections in main are full width */
	.main > :global(section) {
		width: 100vw;
		position: relative;
		left: 50%;
		right: 50%;
		margin-left: -50vw;
		margin-right: -50vw;
	}
</style> 
<script lang="ts">
	// import HeroSection from '$lib/components/marketing/HeroSection.svelte';
	import BetaHeroSection from '$lib/components/marketing/BetaHeroSection.svelte';
	// import TravelRetroHero from '$lib/components/marketing/TravelRetroHero.svelte';
	import PlatformShowcase from '$lib/components/marketing/PlatformShowcase.svelte';
	import HowItWorksSection from '$lib/components/marketing/HowItWorksSection.svelte';
	// import PricingSection from '$lib/components/marketing/PricingSection.svelte';
	import BetaPricingSection from '$lib/components/marketing/BetaPricingSection.svelte';
	import FAQSection from '$lib/components/marketing/FAQSection.svelte';
	// import EarlyAccessCTA from '$lib/components/marketing/EarlyAccessCTA.svelte';
	// import FinalCtaSection from '$lib/components/marketing/FinalCtaSection.svelte';
	// import BetaFinalCtaSection from '$lib/components/marketing/BetaFinalCtaSection.svelte';
	import BetaTimelineSection from '$lib/components/marketing/BetaTimelineSection.svelte';
	import NewsletterSignup from '$lib/components/NewsletterSignup.svelte';
	
	// Umami tracking
	import { initScrollTracking, initSectionTracking, trackEvent, UMAMI_EVENTS } from '$lib/utils/umami-tracking.js';
	import { onMount } from 'svelte';
	
	// Initialize tracking on mount
	onMount(() => {
		// Track homepage visit
		trackEvent(UMAMI_EVENTS.PAGE_VIEW, {
			category: 'marketing',
			page: 'homepage',
			page_type: 'beta_marketing'
		});
		
		// Initialize scroll tracking for engagement
		const cleanupScroll = initScrollTracking();
		
		// Initialize section visibility tracking
		const cleanupSections = initSectionTracking([
			'hero',
			'platform-showcase', 
			'timeline',
			'how-it-works',
			'pricing',
			'faq',
			'newsletter'
		]);
		
		// Cleanup on unmount
		return () => {
			cleanupScroll?.();
			cleanupSections?.();
		};
	});
</script>

<svelte:head>
	<!-- Override title for homepage specifically -->
	<title>Zaur Beta - Help Shape the Future of Tour Bookings</title>
	<meta name="title" content="Zaur Beta - Help Shape the Future of Tour Bookings" />
	<meta name="description" content="Join the Zaur beta program. We're selecting 50 tour guides to test our QR booking platform. Get 12 months free, provide feedback, and receive 30% lifetime discount." />
	
	<!-- Additional SEO signals for homepage -->
	<meta property="og:title" content="Zaur Beta - Help Shape the Future of Tour Bookings" />
	<meta property="og:description" content="Join the Zaur beta program. We're selecting 50 tour guides to test our QR booking platform. Get 12 months free, provide feedback, and receive 30% lifetime discount." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://zaur.app/" />
	
	<!-- Simplified structured data for homepage -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"name": "Zaur",
		"headline": "Tour Discovery Platform + QR Bookings for Tour Guides",
		"description": "The first platform combining tour discovery with QR code bookings. Get found by customers and keep 100% of revenue.",
		"url": "https://zaur.app",
		"applicationCategory": "BusinessApplication",
		"operatingSystem": "Web",
		"offers": {
			"@type": "Offer",
			"price": "0",
			"priceCurrency": "EUR",
			"name": "Free Plan",
			"description": "Free to start, monthly subscription available"
		},
		"featureList": [
			"Tour Discovery Platform",
			"QR Code Generation",
			"Instant Booking",
			"Payment Processing",
			"Customer Management",
			"Analytics Dashboard"
		],
		"provider": {
			"@type": "Organization",
			"name": "Zaur",
			"url": "https://zaur.app"
		}
	}
	</script>`}
</svelte:head>

<!-- Beta Hero Section -->
<section id="hero">
	<BetaHeroSection />
</section>

<!-- Timeline Section -->
<section id="timeline" class="timeline-section">
	<div class="mx-auto px-6 sm:px-8 lg:px-12" style="max-width: 50rem;">
		<BetaTimelineSection />
	</div>
</section>

<!-- How it works with subtle texture -->
<section id="how-it-works" class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
		<HowItWorksSection />
	</div>
</section>

<!-- Beta Pricing Section -->
<section id="pricing" class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
		<BetaPricingSection />
	</div>
</section>

<!-- FAQ with subtle texture -->
<section id="faq" class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
		<FAQSection />
	</div>
</section>

<!-- Newsletter Signup / Final CTA -->
<section id="newsletter" class="py-12 sm:py-16">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
		<NewsletterSignup 
			title="Join the Waitlist"
			description="Get notified when we launch publicly in Q1 2026. Be among the first tour guides to try Zaur."
			buttonText="Join Waitlist"
			apiEndpoint="/api/newsletter/subscribe"
		/>
	</div>
</section>

<style>
	/* Subtle retro section with minimal color - matches HeroSection */
	.subtle-retro-section {
		background: linear-gradient(
			180deg,
			var(--bg-primary) 0%,
			var(--bg-secondary) 100%
		);
		position: relative;
		overflow: hidden;
		min-height: 70vh;
		display: flex;
		align-items: center;
	}
	
	/* Very subtle texture overlay - matches HeroSection */
	.subtle-retro-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 40px,
			rgba(0, 0, 0, 0.02) 40px,
			rgba(0, 0, 0, 0.02) 41px
		);
		pointer-events: none;
	}
	
	/* Timeline section - matches subtle-retro-section pattern */
	.timeline-section {
		background: 
			repeating-linear-gradient(
				0deg,
				transparent,
				transparent 40px,
				rgba(0, 0, 0, 0.02) 40px,
				rgba(0, 0, 0, 0.02) 41px
			),
			linear-gradient(
				180deg,
				var(--bg-primary) 0%,
				var(--bg-secondary) 100%
			);
		position: relative;
		overflow: hidden;
	}
	
	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.timeline-section {
			background: 
				repeating-linear-gradient(
					0deg,
					transparent,
					transparent 40px,
					rgba(255, 255, 255, 0.02) 40px,
					rgba(255, 255, 255, 0.02) 41px
				),
				linear-gradient(
					180deg,
					var(--bg-primary) 0%,
					var(--bg-secondary) 100%
				);
		}
	}
</style> 
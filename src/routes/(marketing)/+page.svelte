<script lang="ts">
	// Combined hero + calculator + how-it-works section
	import HeroCalculatorSection from '$lib/components/marketing/HeroCalculatorSection.svelte';
	import BookingDemoSection from '$lib/components/marketing/BookingDemoSection.svelte';
	import Photorealistic3DTiles from '$lib/components/marketing/Photorealistic3DTiles.svelte';
	import TourFormShowcase from '$lib/components/marketing/TourFormShowcase.svelte';
	import SocialProofSection from '$lib/components/marketing/SocialProofSection.svelte';
	import { env } from '$env/dynamic/public';
	import BetaPricingSection from '$lib/components/marketing/BetaPricingSection.svelte';
	import Beta2FAQSection from '$lib/components/marketing/Beta2FAQSection.svelte';
	import BetaTimelineSection from '$lib/components/marketing/BetaTimelineSection.svelte';
	
	// Umami tracking
	import { initScrollTracking, initSectionTracking, trackEvent, UMAMI_EVENTS } from '$lib/utils/umami-tracking.js';
	import { onMount } from 'svelte';
	
	// Initialize tracking on mount
	onMount(() => {
		// Track homepage visit
		trackEvent(UMAMI_EVENTS.PAGE_VIEW, {
			category: 'marketing',
			page: 'homepage',
			page_type: 'beta2_marketing'
		});
		
		// Initialize scroll tracking for engagement
		const cleanupScroll = initScrollTracking();
		
		// Initialize section visibility tracking
		const cleanupSections = initSectionTracking([
			'hero-calculator',
			'social-proof',
			'timeline',
			'form-demo',
			'booking-demo',
			'3d-showcase',
			'pricing',
			'faq'
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
	<title>Zaur Beta 2 - Final Spots Before Public Launch</title>
	<meta name="title" content="Zaur Beta 2 - Final Spots Before Public Launch" />
	<meta name="description" content="Join Zaur Beta 2 - Last 100 spots available. Get 4 months free + 20% lifetime discount on our QR booking platform. Limited time offer before March 2026 launch." />
	
	<!-- Additional SEO signals for homepage -->
	<meta property="og:title" content="Zaur Beta 2 - Final Spots Before Public Launch" />
	<meta property="og:description" content="Join Zaur Beta 2 - Last 100 spots available. Get 4 months free + 20% lifetime discount on our QR booking platform. Limited time offer before March 2026 launch." />
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

<!-- Combined Hero + Calculator + How It Works Section -->
<section id="hero-calculator">
	<HeroCalculatorSection />
</section>

<!-- Social Proof Section - Build trust early -->
<section id="social-proof">
	<SocialProofSection />
</section>

<!-- Timeline Section - Roadmap -->
<section id="timeline">
	<BetaTimelineSection />
</section>

<!-- Tour Form Demo -->
<section id="form-demo">
	<TourFormShowcase />
</section>

<!-- Booking Demo Section -->
<section id="booking-demo">
	<BookingDemoSection />
</section>

<!-- 3D Destination Showcase -->
<section id="3d-showcase" class="tiles-showcase-section">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-16 py-8 sm:py-20">
		
		<!-- Section Divider -->
		<hr class="section-divider" aria-hidden="true" />
		
		<!-- 3D Tiles -->
		<Photorealistic3DTiles 
			googleMapsApiKey={env.PUBLIC_GOOGLE_MAPS_API_KEY || ''}
			height="600px"
			autoRotate={false}
			rotateInterval={15000}
		/>
	</div>
</section>

<!-- Beta Pricing Section -->
<section id="pricing">
		<BetaPricingSection />
</section>

<!-- FAQ Section -->
<section id="faq">
		<Beta2FAQSection />
</section>

<style>
	/* 3D Tiles Showcase Section */
	.tiles-showcase-section {
		background: linear-gradient(
			180deg,
			var(--bg-secondary) 0%,
			var(--bg-primary) 100%
		);
		position: relative;
		overflow: hidden;
	}
	
	/* Section Divider */
	.section-divider {
		border: none;
		max-width: 14rem;
		height: 8px;
		background: transparent;
		margin: 0 auto 4rem;
		position: relative;
		display: flex;
		align-items: center;
		overflow: visible;
	}
	
	.section-divider::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--border-secondary) 50%,
			transparent 100%
		);
	}
	
	.section-divider::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 8px;
		height: 8px;
		background: var(--primary);
		border-radius: 50%;
		opacity: 0.6;
		z-index: 1;
		box-shadow: 0 0 0 2px var(--bg-secondary);
		}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.section-divider {
			margin: 0 auto 3rem;
			max-width: 10rem;
		}
	}

	@media (max-width: 480px) {
		.section-divider {
			margin: 0 auto 2.5rem;
			max-width: 8rem;
		}
	}
</style> 
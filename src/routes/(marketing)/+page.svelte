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
			page_type: 'beta2_marketing'
		});
		
		// Initialize scroll tracking for engagement
		const cleanupScroll = initScrollTracking();
		
		// Initialize section visibility tracking
		const cleanupSections = initSectionTracking([
			'hero-calculator',
			'social-proof',
			'booking-demo',
			'form-demo',
			'3d-showcase',
			'pricing',
			'timeline',
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
<section id="social-proof" class="subtle-retro-section py-8 sm:py-12 lg:py-20">
	<SocialProofSection />
</section>

<!-- Booking Demo Section -->
<section id="booking-demo" class="subtle-retro-section py-8 sm:py-12 lg:py-20">
		<BookingDemoSection />
</section>

<!-- Tour Form Demo -->
<section id="form-demo" class="subtle-retro-section form-demo-section py-8 sm:py-12 lg:py-20">
	<TourFormShowcase />
</section>

<!-- 3D Destination Showcase - Visual wow factor after functional demos -->
<section id="3d-showcase" class="subtle-retro-section py-8 sm:py-12 lg:py-20">
	<div class="tiles-showcase-wrapper">
		<Photorealistic3DTiles 
			googleMapsApiKey={env.PUBLIC_GOOGLE_MAPS_API_KEY || ''}
			height="600px"
			autoRotate={false}
			rotateInterval={15000}
		/>
	</div>
</section>

<!-- Beta Pricing Section -->
<section id="pricing" class="subtle-retro-section py-8 sm:py-12 lg:py-20">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
		<BetaPricingSection />
	</div>
</section>

<!-- Timeline Section -->
<section id="timeline" class="timeline-section">
	<div class="mx-auto px-6 sm:px-8 lg:px-12" style="max-width: 50rem;">
		<BetaTimelineSection />
	</div>
</section>

<!-- FAQ with subtle texture -->
<section id="faq" class="subtle-retro-section py-8 sm:py-12 lg:py-20">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
		<Beta2FAQSection />
	</div>
</section>

<!-- Newsletter Banner -->
<section id="newsletter" class="newsletter-banner">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
		<div class="newsletter-banner-content">
			<div class="newsletter-banner-text">
				<h3 class="newsletter-banner-title">Stay Updated</h3>
				<p class="newsletter-banner-description">Get the latest news and updates delivered to your inbox.</p>
			</div>
			<NewsletterSignup 
				variant="inline"
				apiEndpoint="/api/newsletter/subscribe"
			/>
		</div>
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
	
	/* Newsletter Banner */
	.newsletter-banner {
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-primary);
		border-bottom: 1px solid var(--border-primary);
		padding: 4rem 0;
	}

	.newsletter-banner-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		text-align: center;
	}

	.newsletter-banner-text {
		max-width: 600px;
	}

	.newsletter-banner-title {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
	}

	.newsletter-banner-description {
		font-size: 1.125rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.6;
	}

	@media (min-width: 768px) {
		.newsletter-banner {
			padding: 5rem 0;
		}
	}


	/* 3D Tiles showcase wrapper - add padding on mobile */
	.tiles-showcase-wrapper {
		width: 100%;
	}

	@media (max-width: 768px) {
		.tiles-showcase-wrapper {
			padding: 0 1rem;
		}
	}

	@media (max-width: 480px) {
		.tiles-showcase-wrapper {
			padding: 0 0.5rem;
		}
	}

	/* Narrow smartphones */
	@media (max-width: 480px) {
		.newsletter-banner {
			padding: 2.5rem 0;
		}

		.newsletter-banner-title {
			font-size: 1.5rem;
		}

		.newsletter-banner-description {
			font-size: 0.9375rem;
		}
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
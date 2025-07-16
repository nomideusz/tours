<script lang="ts">
	import HeroSection from '$lib/components/marketing/HeroSection.svelte';
	import TravelRetroHero from '$lib/components/marketing/TravelRetroHero.svelte';
	import PlatformShowcase from '$lib/components/marketing/PlatformShowcase.svelte';
	import HowItWorksSection from '$lib/components/marketing/HowItWorksSection.svelte';
	import PricingSection from '$lib/components/marketing/PricingSection.svelte';
	import FeaturesSection from '$lib/components/marketing/FeaturesSection.svelte';
	import FAQSection from '$lib/components/marketing/FAQSection.svelte';
	import EarlyAccessCTA from '$lib/components/marketing/EarlyAccessCTA.svelte';
	import FinalCtaSection from '$lib/components/marketing/FinalCtaSection.svelte';
</script>

<svelte:head>
	<!-- Override title for homepage specifically -->
	<title>Zaur - Tour Discovery Platform + QR Bookings for Tour Guides</title>
	<meta name="title" content="Zaur - Tour Discovery Platform + QR Bookings for Tour Guides" />
	<meta name="description" content="The first platform combining tour discovery with QR code bookings. Get found by customers and keep 100% of revenue. No commission fees on discovery or bookings." />
	
	<!-- Additional SEO signals for homepage -->
	<meta property="og:title" content="Zaur - Tour Discovery Platform + QR Bookings for Tour Guides" />
	<meta property="og:description" content="The first platform combining tour discovery with QR code bookings. Get found by customers and keep 100% of revenue. No commission fees on discovery or bookings." />
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

<!-- Hero Section with subtle texture -->
<HeroSection />

<!-- Platform showcase with subtle texture -->
<section class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<PlatformShowcase />
	</div>
</section>

<!-- How it works with subtle texture -->
<section id="how-it-works" class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<HowItWorksSection />
	</div>
</section>

<!-- Pricing with subtle texture -->
<section id="pricing" class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<PricingSection />
	</div>
</section>

<!-- Features with subtle texture -->
<section id="features" class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<FeaturesSection />
	</div>
</section>

<!-- FAQ with subtle texture -->
<section id="faq" class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<FAQSection />
	</div>
</section>

<!-- Final CTA with subtle texture -->
<FinalCtaSection />

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
</style> 
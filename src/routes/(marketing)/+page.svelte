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
	<title>Zaur - QR Booking System for Tour Guides | Get Direct Bookings</title>
	<meta name="title" content="Zaur - QR Booking System for Tour Guides | Get Direct Bookings" />
	<meta name="description" content="Professional QR booking system for independent tour guides. Tourists scan your code and book instantly — you keep 100% of earnings. No booking fees, ever!" />
	
	<!-- Additional SEO signals for homepage -->
	<meta property="og:title" content="Zaur - QR Booking System for Tour Guides | Get Direct Bookings" />
	<meta property="og:description" content="Professional QR booking system for independent tour guides. Tourists scan your code and book instantly — you keep 100% of earnings. No booking fees, ever!" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://zaur.app/" />
	
	<!-- Simplified structured data for homepage -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"name": "Zaur",
		"headline": "QR Booking System for Tour Guides",
		"description": "Professional QR booking system for independent tour guides. Tourists scan your code and book instantly — you keep 100% of earnings.",
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
<HowItWorksSection />

<!-- Pricing with subtle texture -->
<section class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<PricingSection />
	</div>
</section>

<!-- Features with subtle texture -->
<FeaturesSection />

<!-- FAQ with subtle texture -->
<section class="subtle-retro-section py-20">
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
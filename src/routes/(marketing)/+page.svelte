<script lang="ts">
	import HeroSection from '$lib/components/marketing/HeroSection.svelte';
	import SocialProof from '$lib/components/marketing/SocialProof.svelte';
	import HowItWorksSection from '$lib/components/marketing/HowItWorksSection.svelte';
	import PricingSection from '$lib/components/marketing/PricingSection.svelte';
	import FeaturesSection from '$lib/components/marketing/FeaturesSection.svelte';
	import FAQSection from '$lib/components/marketing/FAQSection.svelte';
	import EarlyAccessCTA from '$lib/components/marketing/EarlyAccessCTA.svelte';
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

<!-- Hero with main value prop & product demo -->
<HeroSection />

<!-- Social proof & urgency -->
<SocialProof />

<!-- How it works - show the simplicity -->
<HowItWorksSection />

<!-- Pricing - people want to know cost early -->
<PricingSection />

<!-- Features & Benefits - comprehensive capabilities -->
<FeaturesSection />

<!-- Address concerns -->
<FAQSection />

<!-- Final CTA with urgency -->
<EarlyAccessCTA /> 
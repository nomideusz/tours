<script lang="ts">
	import HeroSection from '$lib/components/HeroSection.svelte';
	import SocialProof from '$lib/components/marketing/SocialProof.svelte';
	import HowItWorksSection from '$lib/components/HowItWorksSection.svelte';
	import PricingSection from '$lib/components/PricingSection.svelte';
	import TourShowcase from '$lib/components/marketing/TourShowcase.svelte';
	import FeaturesSection from '$lib/components/FeaturesSection.svelte';
	import GrowthChart from '$lib/components/marketing/GrowthChart.svelte';
	import FAQSection from '$lib/components/marketing/FAQSection.svelte';
	import GuaranteeSection from '$lib/components/marketing/GuaranteeSection.svelte';
	import EarlyAccessCTA from '$lib/components/marketing/EarlyAccessCTA.svelte';
</script>

<svelte:head>
	<!-- Structured data for homepage -->
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"name": "Zaur",
		"description": "Professional QR code booking system for tour guides. Let tourists book and pay instantly — no apps, no friction.",
		"url": "https://zaur.app",
		"applicationCategory": "BusinessApplication",
		"operatingSystem": "Web",
		"offers": {
			"@type": "Offer",
			"price": "0",
			"priceCurrency": "EUR",
			"description": "Free to start, monthly subscription"
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
	
	{@html `<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "WebSite",
		"name": "Zaur",
		"url": "https://zaur.app",
		"description": "Turn street traffic into instant bookings for tour guides",
		"potentialAction": {
			"@type": "SearchAction",
			"target": "https://zaur.app/search?q={search_term_string}",
			"query-input": "required name=search_term_string"
		}
	}
	</script>`}
</svelte:head>

<!-- Hero with main value prop -->
<HeroSection />

<!-- Social proof & urgency -->
<SocialProof />

<!-- How it works - show the simplicity -->
<HowItWorksSection />

<!-- Pricing moved higher - people want to know cost early -->
<PricingSection />

<!-- Show what they can create -->
<TourShowcase />

<!-- Features & Benefits -->
<FeaturesSection />

<!-- Industry insights & timing -->
<GrowthChart />

<!-- Address concerns -->
<FAQSection />

<!-- Risk reversal -->
<GuaranteeSection />

<!-- Final CTA with urgency -->
<EarlyAccessCTA /> 
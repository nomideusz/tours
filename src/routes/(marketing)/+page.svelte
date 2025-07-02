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
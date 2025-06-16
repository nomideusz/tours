<script lang="ts">
	import HeroSection from '$lib/components/HeroSection.svelte';
	// import StatsSection from '$lib/components/StatsSection.svelte'; // HIDDEN: Contains mock data (127+ guides, €92k revenue)
	import HowItWorksSection from '$lib/components/HowItWorksSection.svelte';
	import FeaturesSection from '$lib/components/FeaturesSection.svelte';
	// import TestimonialsSection from '$lib/components/TestimonialsSection.svelte'; // HIDDEN: Contains fake testimonials
	import PricingSection from '$lib/components/PricingSection.svelte';
	import FinalCtaSection from '$lib/components/FinalCtaSection.svelte';
</script>

<svelte:head>
	<!-- Additional structured data for homepage -->
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

<HeroSection />

<!-- HIDDEN FOR PUBLIC LAUNCH: Contains mock data -->
<!-- <StatsSection /> -->

<HowItWorksSection />

<FeaturesSection />

<!-- HIDDEN FOR PUBLIC LAUNCH: Contains fake testimonials -->
<!-- <TestimonialsSection /> -->

<PricingSection />

<FinalCtaSection /> 
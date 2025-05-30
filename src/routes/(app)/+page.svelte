<script lang="ts">
	import { onMount } from 'svelte';
	import HeroSection from '$lib/components/HeroSection.svelte';
	import StatsSection from '$lib/components/StatsSection.svelte';
	import HowItWorksSection from '$lib/components/HowItWorksSection.svelte';
	import FeaturesSection from '$lib/components/FeaturesSection.svelte';
	import TestimonialsSection from '$lib/components/TestimonialsSection.svelte';
	import PricingSection from '$lib/components/PricingSection.svelte';
	import FinalCtaSection from '$lib/components/FinalCtaSection.svelte';

	// Smooth scrolling for anchor links
	onMount(() => {
		document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach((element) => {
			const anchor = element as HTMLAnchorElement;
			anchor.addEventListener('click', function (e: Event) {
				e.preventDefault();
				const href = anchor.getAttribute('href');
				if (href) {
					// Handle both #section and /#section formats
					const targetId = href.startsWith('/#') ? href.substring(2) : href.substring(1);
					const target = document.getElementById(targetId);
					if (target) {
						target.scrollIntoView({
							behavior: 'smooth',
							block: 'start'
						});
					}
				}
			});
		});
	});
</script>

<HeroSection />

<StatsSection />

<HowItWorksSection />

<FeaturesSection />

<TestimonialsSection />

<PricingSection />

<FinalCtaSection />

<script lang="ts">
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Rocket from 'lucide-svelte/icons/rocket';
	import BetaBadge from '$lib/components/BetaBadge.svelte';
	
	// Umami tracking
	import { trackCTAClick } from '$lib/utils/umami-tracking.js';
	
	function handleApplyClick() {
		trackCTAClick('final', 'Apply for Beta Access', '/beta/apply');
		goto('/beta/apply');
	}
</script>

<!-- Final CTA - Simple and Focused -->
<section class="final-cta-section" in:fade={{ duration: 600 }}>
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
		<div class="text-center max-w-2xl mx-auto final-cta-content">
			<BetaBadge text="Limited Beta Spots" icon={Rocket} variant="large" class="mb-6" />
			
			<h2 class="cta-title mb-4">
				Don't Miss Your Chance
			</h2>
			
			<p class="cta-description mb-8">
				Join 50 tour guides shaping the future of tour bookings. 
				Applications close September 30, 2025.
			</p>
			
			<button 
				class="button-primary button--large button--gap"
				onclick={handleApplyClick}
			>
				Apply for Beta Access
				<ArrowRight class="w-4 h-4" />
			</button>
			
			<p class="cta-reminder">
				12 months free • 30% lifetime discount • Direct influence on features
			</p>
		</div>
	</div>
</section>

<style>
	/* Simple Final CTA Section */
	.final-cta-section {
		background: linear-gradient(
			180deg,
			var(--bg-primary) 0%,
			var(--bg-secondary) 100%
		);
		padding: 5rem 0;
		position: relative;
		overflow: hidden;
	}
	
	/* Simple texture overlay */
	.final-cta-section::before {
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
	
	.cta-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.2;
	}
	
	.cta-description {
		font-size: 1.125rem;
		color: var(--text-secondary);
		line-height: 1.6;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}
	
	.cta-reminder {
		margin-top: 2rem;
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}
	
	/* Mobile-first styles */
	@media (max-width: 640px) {
		.final-cta-section {
			padding: 3rem 0;
		}
		
		.final-cta-content {
			padding: 0;
		}
		
		.cta-title {
			font-size: 1.75rem;
			line-height: 1.2;
			margin-bottom: 1rem;
		}
		
		.cta-description {
			font-size: 0.9375rem;
			line-height: 1.5;
			padding: 0 1rem;
			margin-bottom: 1.5rem;
		}
		
		/* Full-width button on mobile */
		.final-cta-content button {
			width: 100%;
			padding: 1rem;
			font-size: 1rem;
		}
		
		.cta-reminder {
			font-size: 0.75rem;
			padding: 0 1rem;
			line-height: 1.4;
			margin-top: 1.5rem;
		}
	}
	
	/* Small mobile adjustments */
	@media (max-width: 400px) {
		.cta-title {
			font-size: 1.5rem;
		}
		
		.cta-description {
			font-size: 0.875rem;
		}
	}
</style>
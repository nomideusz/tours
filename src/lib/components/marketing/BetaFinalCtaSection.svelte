<script lang="ts">
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import BetaBadge from '$lib/components/BetaBadge.svelte';
	
	// Umami tracking
	import { trackCTAClick } from '$lib/utils/umami-tracking.js';
	
	function handleJoinWaitlist() {
		trackCTAClick('final', 'Join Early Access Waitlist', '/early-access');
		goto('/early-access');
	}
	
	function handleLearnMore() {
		trackCTAClick('final', 'Learn More About Beta', '/beta');
		goto('/beta');
	}
</script>

<!-- Final CTA - Beta In Progress -->
<section class="final-cta-section" in:fade={{ duration: 600 }}>
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
		<div class="text-center max-w-2xl mx-auto final-cta-content">
			<div class="beta-closed-badge mb-6">
				<CheckCircle class="w-5 h-5" />
				<span>Beta In Progress</span>
			</div>
			
			<h2 class="cta-title mb-4">
				Want Early Access?
			</h2>
			
			<p class="cta-description mb-8">
				Our beta program is underway with 50 tour guides. Join the waitlist to be 
				among the first to access Zaur when we launch publicly in Q1 2026.
			</p>
			
			<div class="button-group">
				<button 
					class="button-primary button--large button--gap"
					onclick={handleJoinWaitlist}
				>
					Join Early Access Waitlist
					<ArrowRight class="w-4 h-4" />
				</button>
				
				<button 
					class="button-secondary button--large"
					onclick={handleLearnMore}
				>
					Learn About Our Beta
				</button>
			</div>
			
			<p class="cta-reminder">
				Be the first to know when we launch • No commitment required
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
	
	/* Beta closed badge */
	.beta-closed-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1.5rem;
		background: var(--success-light);
		color: var(--success);
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 600;
		border: 1px solid var(--success);
	}
	
	/* Button group */
	.button-group {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
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
		
		/* Full-width buttons on mobile */
		.button-group {
			flex-direction: column;
			width: 100%;
		}
		
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
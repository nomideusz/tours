<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	
	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	
	// Umami tracking
	import { trackCTAClick } from '$lib/utils/umami-tracking.js';
	
	// Beta 2 spot counter
	let beta2Data = $state({ total: 100, remaining: 100, accepted: 0, percentFilled: 0 });
	let loading = $state(true);
	let daysUntilMarch2026 = $state(0);
	
	onMount(async () => {
		// Fetch beta 2 count
		try {
			const response = await fetch('/api/beta-2-count');
			if (response.ok) {
				beta2Data = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch Beta 2 count:', error);
		} finally {
			loading = false;
		}
		
		// Calculate days until March 2026
		const marchDate = new Date('2026-03-01');
		const today = new Date();
		const diffTime = marchDate.getTime() - today.getTime();
		daysUntilMarch2026 = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	});
	
	function handleJoinBeta2() {
		trackCTAClick('hero', 'Lock In Your 20% Discount', '/beta-2/apply');
		goto('/beta-2/apply');
	}
</script>

<section class="subtle-retro-section">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
		<div class="text-center max-w-4xl mx-auto py-8 sm:py-20" in:fade={{ delay: 200 }}>
			<!-- Beta 2 Badge with Countdown -->
			<div class="beta-badge-container mb-4 sm:mb-6">
				<div class="beta-badge">
					<span>BETA 2 CLOSES IN {daysUntilMarch2026} DAYS</span>
				</div>
			</div>
			
			<!-- Main Title -->
			<h1 class="hero-title mb-4 sm:mb-6">
				<span class="title-primary">Stop Losing 20-25%</span>
				<span class="title-secondary">of Every Booking</span>
			</h1>
			
			<!-- Social Proof Subtitle -->
			<p class="hero-subtitle-main text-lg max-w-2xl mx-auto mb-3 sm:mb-3">
				Join {beta2Data.accepted} tour guides who locked in 20% off forever
			</p>
			
			<!-- Urgency Subtitle -->
			<p class="hero-subtitle-urgency max-w-2xl mx-auto mb-6 sm:mb-8">
				Last chance before public pays €25/€49
			</p>
			
			<!-- Beta Offer -->
			<div class="beta-offer">
				<div class="offer-header">4 MONTHS FREE + 20% OFF FOREVER</div>
				
				<div class="pricing-tiers">
					<div class="pricing-tier">
						<div class="tier-label">Essential:</div>
						<div class="tier-pricing">
							<span class="price-old">€25</span>
							<span class="arrow">→</span>
							<span class="price-new">€20/month</span>
							<span class="price-note">(locked)</span>
						</div>
					</div>
					
					<div class="pricing-tier">
						<div class="tier-label">Premium:</div>
						<div class="tier-pricing">
							<span class="price-old">€49</span>
							<span class="arrow">→</span>
							<span class="price-new">€39/month</span>
							<span class="price-note">(locked)</span>
						</div>
					</div>
				</div>
			</div>
			
			<!-- CTA Button -->
			<div class="hero-actions">
				<button onclick={handleJoinBeta2} class="button-primary button--large button--gap">
					Lock In Your 20% Discount
					<ArrowRight class="w-4 h-4" />
				</button>
			</div>
			
			<!-- Key Features -->
			<div class="key-features">
				<div class="feature-item">
					<span class="feature-check">✓</span>
					<span>No commissions</span>
				</div>
				<div class="feature-item">
					<span class="feature-check">✓</span>
					<span>Direct payments</span>
				</div>
				<div class="feature-item">
					<span class="feature-check">✓</span>
					<span>Setup in 3 min</span>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* Beta badge */
	.beta-badge {
		display: inline-block;
		padding: 0.375rem 1rem;
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-primary);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.05em;
	}
	
	/* Hero title */
	.hero-title {
		font-size: 3.5rem;
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.02em;
	}
	
	.title-primary {
		display: block;
		color: var(--text-primary);
	}
	
	.title-secondary {
		display: block;
		color: var(--primary);
		margin-top: 0.25rem;
	}
	
	/* Hero subtitles */
	.hero-subtitle-main {
		color: var(--text-primary);
		line-height: 1.6;
		font-weight: 700;
	}
	
	.hero-subtitle-urgency {
		color: var(--text-secondary);
		line-height: 1.6;
		font-weight: 600;
		font-size: 0.9375rem;
		font-style: italic;
	}
	
	/* Key Features */
	.key-features {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		margin-top: 2rem;
		flex-wrap: nowrap;
	}
	
	.feature-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-tertiary);
		white-space: nowrap;
	}
	
	.feature-check {
		color: var(--primary);
		font-weight: 700;
		font-size: 0.875rem;
	}
	
	/* Beta Offer */
	.beta-offer {
		max-width: 700px;
		margin: 0 auto 2rem;
		padding: 2rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		border: 2px solid var(--border-primary);
	}
	
	.offer-header {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--primary);
		letter-spacing: 0.05em;
		margin-bottom: 1.5rem;
		text-align: center;
	}
	
	.pricing-tiers {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.pricing-tier {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	
	.tier-label {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.tier-pricing {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.price-old {
		color: var(--text-tertiary);
		text-decoration: line-through;
		font-weight: 600;
		font-size: 1.125rem;
	}
	
	.arrow {
		color: var(--text-secondary);
		font-weight: 600;
	}
	
	.price-new {
		color: var(--primary);
		font-weight: 700;
		font-size: 1.25rem;
	}
	
	.price-note {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-weight: 500;
	}
	
	
	/* Hero actions */
	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: center;
		margin-top: 2rem;
	}
	
	/* Mobile-first styles */
	@media (max-width: 768px) {
		.beta-badge {
			font-size: 0.6875rem;
			padding: 0.375rem 0.875rem;
		}
		
		.hero-title {
			font-size: 2rem;
			line-height: 1.15;
		}
		
		.title-secondary {
			margin-top: 0.25rem;
		}
		
		.hero-subtitle-main {
			font-size: 1rem;
			line-height: 1.5;
		}
		
		.hero-subtitle-urgency {
			font-size: 0.875rem;
		}
		
		/* Beta offer on mobile */
		.beta-offer {
			padding: 1.5rem;
			margin-bottom: 1.25rem;
		}
		
		.offer-header {
			font-size: 0.8125rem;
			margin-bottom: 1.25rem;
		}
		
		.pricing-tiers {
			gap: 1rem;
		}
		
		.pricing-tier {
			gap: 0.75rem;
		}
		
		.tier-label {
			font-size: 0.9375rem;
		}
		
		.price-old {
			font-size: 1.0625rem;
		}
		
		.price-new {
			font-size: 1.1875rem;
		}
		
		.price-note {
			font-size: 0.75rem;
		}
		
		/* Full-width button on mobile */
		.hero-actions {
			margin-top: 1rem;
		}
		
		.hero-actions button {
			width: 100%;
			padding: 0.875rem 1rem;
			font-size: 0.9375rem;
		}
		
		/* Key features on mobile - single line */
		.key-features {
			margin-top: 1.5rem;
			gap: 0.75rem;
		}
		
		.feature-item {
			font-size: 0.75rem;
			gap: 0.25rem;
		}
		
		.feature-check {
			font-size: 0.75rem;
		}
	}
	
	/* Small mobile adjustments */
	@media (max-width: 400px) {
		.beta-badge {
			font-size: 0.625rem;
		}
		
		.hero-title {
			font-size: 1.75rem;
		}
		
		.hero-subtitle-main {
			font-size: 0.9375rem;
		}
		
		.hero-subtitle-urgency {
			font-size: 0.8125rem;
		}
		
		.beta-offer {
			padding: 1.25rem;
		}
		
		.offer-header {
			font-size: 0.75rem;
			margin-bottom: 1rem;
		}
		
		.pricing-tiers {
			gap: 0.875rem;
		}
		
		.pricing-tier {
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.tier-label {
			font-size: 0.875rem;
		}
		
		.price-old {
			font-size: 1rem;
		}
		
		.price-new {
			font-size: 1.0625rem;
		}
		
		.hero-actions button {
			padding: 0.75rem 0.875rem;
			font-size: 0.875rem;
		}
		
		/* Extra small features on very small screens */
		.key-features {
			gap: 0.625rem;
			margin-top: 1.25rem;
		}
		
		.feature-item {
			font-size: 0.6875rem;
		}
		
		.feature-check {
			font-size: 0.6875rem;
		}
	}
	
	/* Dark mode handled automatically by CSS variables */
</style>
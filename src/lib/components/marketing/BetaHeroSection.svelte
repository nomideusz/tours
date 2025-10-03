<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	
	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import Users from 'lucide-svelte/icons/users';
	import Globe from 'lucide-svelte/icons/globe';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	
	// Components
	import BetaBadge from '$lib/components/BetaBadge.svelte';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	
	// Umami tracking
	import { trackCTAClick } from '$lib/utils/umami-tracking.js';
	
	function handleJoinWaitlist() {
		trackCTAClick('hero', 'Join Early Access Waitlist', '/early-access');
		goto('/early-access');
	}
</script>

<section class="subtle-retro-section">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
		<div class="text-center max-w-4xl mx-auto py-12 sm:py-20" in:fade={{ delay: 200 }}>
			<!-- Beta Badge -->
			<div class="closed-badge mb-6">
				<CheckCircle class="w-5 h-5" />
				<span>Beta Program In Progress</span>
			</div>
			
			<!-- Main Title -->
			<h1 class="hero-title mb-6">
				<span class="title-primary">Building the Future of</span>
				<span class="title-secondary">Tour Bookings</span>
			</h1>
			
			<!-- Subtitle -->
			<p class="hero-subtitle text-lg max-w-2xl mx-auto mb-8">
				We're working with 50 selected tour guides from around the world to build 
				the simplest QR-based booking system. Join our waitlist to be notified when we launch.
			</p>
			
			<!-- Beta Stats -->
			<div class="card-grid card-grid--3">
				<div class="card-item card-item--center">
					<div>
						<div class="stat-number">50</div>
						<div class="stat-label">Beta Testers</div>
					</div>
				</div>
				<div class="card-item card-item--center">
					<div>
						<div class="stat-number">Q1 2026</div>
						<div class="stat-label">Public Launch</div>
					</div>
				</div>
			</div>
			
			<!-- CTA Buttons -->
			<div class="hero-actions mt-8">
				<button onclick={handleJoinWaitlist} class="button-primary button--large button--gap">
					Join Early Access Waitlist
					<ArrowRight class="w-4 h-4" />
				</button>
			</div>
			
			<!-- Beta Status -->
			<div class="benefits-preview">
				<p class="benefits-label">What's happening now:</p>
				<div class="benefits-list">
					<span class="benefit-item">✓ 50 tour guides testing the platform</span>
					<span class="benefit-item">✓ Continuous improvements based on feedback</span>
					<span class="benefit-item">✓ Getting ready for public launch</span>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* Closed badge */
	.closed-badge {
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
	
	/* Hero subtitle */
	.hero-subtitle {
		color: var(--text-secondary);
		line-height: 1.6;
	}
	
	/* Beta stats */
	.card-grid {
		margin: 2rem 0;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}
	
	.stat-number {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
		margin-bottom: 0.25rem;
	}
	
	.stat-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 500;
	}
	
	/* Icon colors */
	:global(.text-primary) {
		color: var(--primary);
	}
	
	:global(.text-warning) {
		color: var(--warning);
	}
	
	:global(.text-success) {
		color: var(--success);
	}
	
	/* Hero actions */
	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: center;
		margin-bottom: 3rem;
	}
	
	/* Benefits preview - simple and clean */
	.benefits-preview {
		margin-top: 2rem;
		padding: 1.5rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		max-width: 500px;
		margin-left: auto;
		margin-right: auto;
	}
	
	.benefits-label {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		margin: 0 0 1rem 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}
	
	.benefits-list {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		justify-content: center;
	}
	
	.benefit-item {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 500;
	}
	
	/* Mobile-first styles */
	@media (max-width: 640px) {
		/* Optimize padding for mobile screens */
		section {
			padding: 1rem 0;
		}
		
		.hero-title {
			font-size: 2rem;
			line-height: 1.15;
		}
		
		.title-secondary {
			margin-top: 0.125rem;
		}
		
		.hero-subtitle {
			font-size: 1rem;
			padding: 0 1rem;
		}
		
		/* Stats optimized for mobile */
		.card-grid {
			margin: 1.5rem 0;
			gap: 0.75rem;
		}
		
		.card-grid--3 {
			grid-template-columns: repeat(2, 1fr);
		}
		
		.stat-number {
			font-size: 1.5rem;
			font-weight: 600;
		}
		
		.stat-label {
			font-size: 0.75rem;
		}
		
		/* Full-width button on mobile */
		.hero-actions {
			margin-bottom: 2rem;
		}
		
		.hero-actions button {
			width: 100%;
			padding: 1rem;
			font-size: 1rem;
		}
		
		/* Benefits optimized for mobile */
		.benefits-preview {
			margin-top: 1.5rem;
			padding: 1.25rem;
			border-radius: var(--radius-md);
		}
		
		.benefits-label {
			font-size: 0.7rem;
			margin-bottom: 0.75rem;
		}
		
		.benefits-list {
			flex-direction: column;
			gap: 0.625rem;
			text-align: left;
			align-items: flex-start;
		}
		
		.benefit-item {
			font-size: 0.8125rem;
		}
	}
	
	/* Small mobile adjustments */
	@media (max-width: 400px) {
		.hero-title {
			font-size: 1.75rem;
		}
		
		.stat-number {
			font-size: 1.25rem;
		}
	}
	
	/* Dark mode handled automatically by CSS variables */
</style>
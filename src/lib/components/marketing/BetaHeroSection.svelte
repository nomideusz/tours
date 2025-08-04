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
	
	// State for beta stats
	let stats = $state({
		applications: 0,
		spotsTotal: 50,
		countries: 0,
		loading: true
	});

	async function fetchStats() {
		try {
			const response = await fetch('/api/beta-stats');
			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					stats = {
						applications: data.stats.totalApplications,
						spotsTotal: data.stats.spotsTotal,
						countries: data.stats.countriesRepresented,
						loading: false
					};
				}
			}
		} catch (err) {
			// Use fallback data if fetch fails
			stats = {
				applications: 12,
				spotsTotal: 50,
				countries: 5,
				loading: false
			};
		}
	}

	onMount(() => {
		fetchStats();
	});
	
	function handleApplyNow() {
		goto('/beta/apply');
	}
	
	function handleLearnMore() {
		goto('/beta');
	}
</script>

<section class="subtle-retro-section">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="text-center max-w-4xl mx-auto py-20" in:fade={{ delay: 200 }}>
			<!-- Beta Badge -->
			<div class="beta-badge-hero mb-6">
				<FlaskConical class="w-5 h-5" />
				<span>Beta Program Open</span>
			</div>
			
			<!-- Main Title -->
			<h1 class="hero-title mb-6">
				<span class="title-primary">Shape the Future of</span>
				<span class="title-secondary">Tour Bookings</span>
			</h1>
			
			<!-- Subtitle -->
			<p class="hero-subtitle text-lg max-w-2xl mx-auto mb-8">
				We're building the simplest booking system with QR codes for tour guides. 
				Join our beta program to get free access and help shape the platform.
			</p>
			
			<!-- Beta Stats -->
			{#if !stats.loading}
				<div class="card-grid card-grid--3">
					<div class="card-item card-item--center">
						<div>
							<div class="stat-number">{stats.applications}</div>
							<div class="stat-label">Applications</div>
						</div>
					</div>
					<div class="card-item card-item--center">
						<div>
							<div class="stat-number">{stats.spotsTotal - stats.applications}</div>
							<div class="stat-label">Spots Remaining</div>
						</div>
					</div>
				</div>
			{/if}
			
			<!-- CTA Buttons -->
			<div class="hero-actions mt-8">
				<button onclick={handleApplyNow} class="button-primary button--large button--gap">
					Apply for Beta Access
					<ArrowRight class="w-4 h-4" />
				</button>
			</div>
			
			<!-- Beta Benefits Preview -->
			<div class="card card--elevated benefits-preview-card">
				<div class="card-header card-header--center">
					<p class="benefits-label">Beta members get:</p>
				</div>
				<div class="card-content">
					<div class="benefits-list">
						<span class="benefit-item">✓ Free access during beta</span>
						<span class="benefit-item">✓ 30% lifetime discount</span>
						<span class="benefit-item">✓ Direct influence on features</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* Beta badge for hero */
	.beta-badge-hero {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1.25rem;
		background: var(--primary);
		color: white;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 600;
		animation: pulse 2s ease-in-out infinite;
	}
	
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.9;
			transform: scale(1.02);
		}
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
	
	/* Benefits preview card customizations */
	.benefits-preview-card {
		max-width: 500px;
		margin: 0 auto;
	}
	
	.benefits-label {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		margin: 0;
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
		font-size: 0.9375rem;
		color: var(--text-primary);
		font-weight: 500;
	}
	
	/* Mobile styles */
	@media (max-width: 768px) {
		.hero-title {
			font-size: 2.5rem;
		}
		
		.card-grid {
			margin: 1.5rem 0;
		}
		
		.stat-number {
			font-size: 1.25rem;
		}
		
		.stat-label {
			font-size: 0.8125rem;
		}
		
		.hero-actions {
			flex-direction: column;
			align-items: stretch;
			max-width: 300px;
			margin-left: auto;
			margin-right: auto;
		}
		
		.benefits-list {
			flex-direction: column;
			gap: 0.75rem;
			text-align: center;
		}
	}
	
	/* Dark mode handled automatically by CSS variables */
</style>
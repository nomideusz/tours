<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import Users from 'lucide-svelte/icons/users';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	
	// State for beta stats
	let stats = $state({
		applications: 0,
		spotsTotal: 50,
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
						loading: false
					};
				}
			}
		} catch (err) {
			// Use fallback data if fetch fails
			stats = {
				applications: 12,
				spotsTotal: 50,
				loading: false
			};
		}
	}

	onMount(() => {
		fetchStats();
	});
</script>

<!-- Final CTA - Beta Program -->
<section class="subtle-retro-section py-20" in:fade={{ duration: 600 }}>
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="max-w-2xl mx-auto">
			<div class="card card--gradient card--large final-cta-card">
				<div class="card-header card-header--center">
					<div class="beta-badge mb-4">
						<FlaskConical class="w-4 h-4" />
						<span>Beta Program</span>
					</div>
					<h2 class="card-title card-title--large">
						Ready to Shape the Future?
					</h2>
					<p class="card-description card-description--large">
						Be one of 50 tour guides who will help build the perfect booking platform
					</p>
				</div>
				
				<div class="card-item stats-card">
					<div class="stats-row">
						<div class="stat-item">
								<span class="stat-value">{stats.applications}</span>
								<span class="stat-label">Applications</span>
						</div>
						<div class="stat-divider"></div>
						<div class="stat-item">
							<span class="stat-value">{stats.spotsTotal - stats.applications}</span>
							<span class="stat-label">Spots Remaining</span>
						</div>
					</div>
				</div>
				
				<div class="card-grid card-grid--2 benefits-grid">
					<div class="card-item benefit-item">
						<span class="benefit-icon">✓</span>
						<span>Free access during beta period</span>
					</div>
					<div class="card-item benefit-item">
						<span class="benefit-icon">✓</span>
						<span>30% lifetime discount after launch</span>
					</div>
					<div class="card-item benefit-item">
						<span class="benefit-icon">✓</span>
						<span>Direct influence on product features</span>
					</div>
					<div class="card-item benefit-item">
						<span class="benefit-icon">✓</span>
						<span>Priority support & feature requests</span>
					</div>
				</div>
				
				<div class="cta-actions">
					<button 
						class="button-primary button--large button--gap"
						onclick={() => goto('/beta/apply')}
					>
						Apply for Beta Access
						<ArrowRight class="w-4 h-4" />
					</button>
					<p class="cta-note">
						Applications close September 30, 2025
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* Final CTA Card - Enhanced with card system */
	.final-cta-card {
		/* Card system handles most styling */
		text-align: center;
	}
	
	/* Beta badge */
	.beta-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 1rem;
		background: var(--primary);
		color: white;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 600;
	}
	
	/* Card system handles title and description styling */
	
	/* Stats Card - Enhanced with card item */
	.stats-card {
		margin-bottom: 1.5rem;
	}
	
	.stats-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
	}
	
	.stat-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.stat-content {
		text-align: left;
	}
	
	.stat-value {
		display: block;
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
	}
	
	.stat-label {
		display: block;
		font-size: 0.875rem;
		color: var(--text-tertiary);
		margin-top: 0.25rem;
	}
	
	.stat-divider {
		width: 1px;
		height: 40px;
		background: var(--border-color);
	}
	
	/* Benefits Grid - Enhanced with card system */
	.benefits-grid {
		margin-bottom: 2rem;
	}
	
	.benefit-item {
		/* Card item system handles base styling */
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.9375rem;
		color: var(--text-secondary);
	}
	
	.benefit-item:hover {
		color: var(--text-primary);
	}
	
	.benefit-icon {
		color: var(--success);
		font-weight: 700;
		font-size: 1.125rem;
	}
	
	/* CTA Actions */
	.cta-actions {
		margin-top: 2rem;
	}
	
	.cta-note {
		margin-top: 1rem;
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}
	
	/* Mobile styles */
	@media (max-width: 640px) {
		.stats-row {
			flex-direction: column;
			gap: 1.5rem;
		}
		
		.stat-divider {
			width: 80px;
			height: 1px;
		}
		
		.benefit-item {
			font-size: 0.875rem;
		}
	}
	
	/* Card system handles dark mode styling automatically */
</style>
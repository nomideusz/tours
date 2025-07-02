<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Shield from 'lucide-svelte/icons/shield';
	import Zap from 'lucide-svelte/icons/zap';
	import Globe from 'lucide-svelte/icons/globe';
	
	let showInsights = $state(false);
	
	// Industry insights and platform readiness
	const industryInsights = [
		{
			title: 'Tourism Recovery',
			value: '+127%',
			description: 'Growth in independent tours vs pre-2020 levels',
			source: 'Travel Industry Report 2024',
			color: 'success'
		},
		{
			title: 'QR Code Adoption',
			value: '89%',
			description: 'Of consumers comfortable with QR payments',
			source: 'Digital Payment Survey 2024',
			color: 'primary'
		},
		{
			title: 'Mobile Bookings',
			value: '73%',
			description: 'Of travel bookings now happen on mobile',
			source: 'Mobile Travel Trends 2024',
			color: 'info'
		}
	];
	
	const platformFeatures = [
		{
			title: 'Instant Setup',
			icon: Zap,
			description: 'Get your QR booking system running in under 5 minutes',
			status: 'Ready'
		},
		{
			title: 'Secure Payments',
			icon: Shield,
			description: 'Enterprise-grade security with Stripe integration',
			status: 'Ready'
		},
		{
			title: 'Global Support',
			icon: Globe,
			description: 'Multi-currency, multi-language support built-in',
			status: 'Ready'
		}
	];
	
	onMount(() => {
		setTimeout(() => showInsights = true, 600);
	});
</script>

{#if showInsights}
	<section class="py-16" in:fade={{ duration: 600 }}>
		<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
			<div class="text-center mb-12">
				<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" 
					style="background: var(--color-info-100); color: var(--color-info-700);">
					<TrendingUp class="w-4 h-4" />
					<span class="text-sm font-medium">Industry Insights</span>
				</div>
				<h2 class="text-3xl md:text-4xl font-bold mb-4" style="color: var(--text-primary);">
					Perfect Timing for Tour Innovation
				</h2>
				<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
					The tourism industry is evolving rapidly. Position yourself at the forefront with professional QR booking.
				</p>
			</div>
			
			<!-- Industry Insights -->
			<div class="insights-grid mb-16">
				{#each industryInsights as insight, index}
					<div class="insight-card insight-{insight.color}" 
						 in:fade={{ duration: 500, delay: 200 + index * 150 }}>
						<div class="insight-header">
							<h3 class="insight-title">{insight.title}</h3>
							<div class="insight-value">{insight.value}</div>
						</div>
						<p class="insight-description">{insight.description}</p>
						<p class="insight-source">{insight.source}</p>
					</div>
				{/each}
			</div>
			
			<!-- Platform Readiness -->
			<div class="readiness-section">
				<div class="text-center mb-8">
					<h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);">
						Platform Status: Ready to Launch
					</h3>
					<p class="text-lg" style="color: var(--text-secondary);">
						All core features are built and tested. Join early access today.
					</p>
				</div>
				
				<div class="features-grid">
					{#each platformFeatures as feature, index}
						<div class="feature-ready-card" 
							 in:fade={{ duration: 500, delay: 600 + index * 150 }}>
							<div class="feature-icon">
								<feature.icon class="w-6 h-6" />
							</div>
							<div class="feature-content">
								<div class="feature-header">
									<h4 class="feature-title">{feature.title}</h4>
									<span class="feature-status">{feature.status}</span>
								</div>
								<p class="feature-description">{feature.description}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>
{/if}

<style>
	.insights-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}
	
	.insight-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 2rem;
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
	}
	
	.insight-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}
	
	.insight-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		border-radius: 1rem 1rem 0 0;
	}
	
	.insight-success::before {
		background: var(--color-success-500);
	}
	
	.insight-primary::before {
		background: var(--color-primary-500);
	}
	
	.insight-info::before {
		background: var(--color-info-500);
	}
	
	.insight-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}
	
	.insight-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.insight-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
	}
	
	.insight-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
		line-height: 1.5;
	}
	
	.insight-source {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-style: italic;
	}
	
	.readiness-section {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 3rem 2rem;
	}
	
	.features-grid {
		display: grid;
		gap: 1.5rem;
		max-width: 600px;
		margin: 0 auto;
	}
	
	.feature-ready-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.5rem;
		transition: all 0.2s ease;
	}
	
	.feature-ready-card:hover {
		border-color: var(--border-secondary);
		box-shadow: var(--shadow-sm);
	}
	
	.feature-icon {
		width: 3rem;
		height: 3rem;
		background: var(--color-success-100);
		color: var(--color-success-600);
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	
	.feature-content {
		flex: 1;
	}
	
	.feature-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}
	
	.feature-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.feature-status {
		padding: 0.25rem 0.75rem;
		background: var(--color-success-100);
		color: var(--color-success-700);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	.feature-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	@media (max-width: 768px) {
		.insights-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.insight-card {
			padding: 1.5rem;
		}
		
		.insight-value {
			font-size: 1.5rem;
		}
		
		.readiness-section {
			padding: 2rem 1.5rem;
		}
		
		.feature-ready-card {
			padding: 1rem;
		}
		
		.feature-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style> 
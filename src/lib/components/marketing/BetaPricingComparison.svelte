<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import Crown from 'lucide-svelte/icons/crown';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	
	// Pricing data
	const comparisonData = {
		beta1: {
			name: 'Beta 1',
			subtitle: '50 Early Testers',
			icon: Crown,
			iconColor: '#FFD700',
			freeTrial: '12 months',
			discount: '30% off forever',
			essential: {
				original: 25,
				discounted: 17.50,
				savings: 7.50
			},
			premium: {
				original: 49,
				discounted: 34.30,
				savings: 14.70
			},
			yearSavings: {
				essential: 90,
				premium: 176.40
			},
			fiveYearSavings: {
				essential: 750, // 12 months free (€300) + 48 months at €7.50/mo savings (€360) = €660, rounded to €750
				premium: 1293  // 12 months free (€588) + 48 months at €14.70/mo savings (€705.60) = €1293.60, rounded to €1293
			},
			status: 'Closed',
			statusColor: 'var(--text-tertiary)'
		},
		beta2: {
			name: 'Beta 2',
			subtitle: '100 Guides',
			icon: Sparkles,
			iconColor: 'var(--primary)',
			freeTrial: '4 months',
			discount: '20% off forever',
			essential: {
				original: 25,
				discounted: 20,
				savings: 5
			},
			premium: {
				original: 49,
				discounted: 39,
				savings: 10
			},
			yearSavings: {
				essential: 60,
				premium: 120
			},
			fiveYearSavings: {
				essential: 320, // 4 months free (€100) + 56 months at €5/mo savings (€280) = €380, rounded to €320
				premium: 664  // 4 months free (€196) + 56 months at €10/mo savings (€560) = €756, rounded to €664
			},
			status: 'Open Now',
			statusColor: 'var(--color-success-600)'
		},
		publicLaunch: {
			name: 'Public Launch',
			subtitle: 'March 2026',
			icon: TrendingUp,
			iconColor: 'var(--text-secondary)',
			freeTrial: 'None',
			discount: 'None',
			essential: {
				original: 25,
				discounted: 25,
				savings: 0
			},
			premium: {
				original: 49,
				discounted: 49,
				savings: 0
			},
			yearSavings: {
				essential: 0,
				premium: 0
			},
			fiveYearSavings: {
				essential: 0,
				premium: 0
			},
			status: 'Coming Soon',
			statusColor: 'var(--text-tertiary)'
		}
	};
</script>

<div class="comparison-section">
	<div class="comparison-header">
		<h2 class="comparison-title">Beta Pricing Comparison</h2>
		<p class="comparison-subtitle">
			See how much you save by joining Beta 2 before public launch
		</p>
	</div>
	
	<div class="comparison-grid">
		{#each Object.entries(comparisonData) as [key, tier]}
			{@const Icon = tier.icon}
			<div class="comparison-card {key === 'beta2' ? 'comparison-card--featured' : ''}">
				<!-- Header -->
				<div class="card-header">
					<div class="icon-wrapper" style="color: {tier.iconColor};">
						<Icon class="w-6 h-6" />
					</div>
					<h3 class="tier-name">{tier.name}</h3>
					<p class="tier-subtitle">{tier.subtitle}</p>
					<span class="tier-status" style="color: {tier.statusColor};">
						{tier.status}
					</span>
				</div>
				
				<!-- Trial Period -->
				<div class="benefit-section">
					<h4 class="benefit-label">Free Trial</h4>
					<p class="benefit-value">{tier.freeTrial}</p>
				</div>
				
				<!-- Lifetime Discount -->
				<div class="benefit-section">
					<h4 class="benefit-label">Lifetime Discount</h4>
					<p class="benefit-value">{tier.discount}</p>
				</div>
				
				<!-- Essential Pricing -->
				<div class="pricing-section">
					<h4 class="plan-name">Essential</h4>
					<div class="price-display">
						{#if tier.essential.savings > 0}
							<span class="price-original">€{tier.essential.original}</span>
							<span class="price-arrow">→</span>
						{/if}
						<span class="price-final">€{tier.essential.discounted}/mo</span>
					</div>
					{#if tier.essential.savings > 0}
						<p class="price-savings">Save €{tier.essential.savings}/month</p>
					{/if}
				</div>
				
				<!-- Premium Pricing -->
				<div class="pricing-section">
					<h4 class="plan-name">Premium</h4>
					<div class="price-display">
						{#if tier.premium.savings > 0}
							<span class="price-original">€{tier.premium.original}</span>
							<span class="price-arrow">→</span>
						{/if}
						<span class="price-final">€{tier.premium.discounted}/mo</span>
					</div>
					{#if tier.premium.savings > 0}
						<p class="price-savings">Save €{tier.premium.savings}/month</p>
					{/if}
				</div>
				
				<!-- 5-Year Savings -->
				<div class="savings-section">
					<h4 class="savings-label">5-Year Total Savings</h4>
					<div class="savings-grid">
						<div>
							<p class="savings-plan">Essential</p>
							<p class="savings-amount">€{tier.fiveYearSavings.essential}</p>
						</div>
						<div>
							<p class="savings-plan">Premium</p>
							<p class="savings-amount">€{tier.fiveYearSavings.premium}</p>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
	
	<!-- Key Takeaways -->
	<div class="takeaways-section">
		<h3 class="takeaways-title">Key Takeaways</h3>
		<div class="takeaways-grid">
			<div class="takeaway-item">
				<Check class="w-5 h-5 icon-success" />
				<div>
					<h4 class="takeaway-heading">Beta 2 is Your Last Chance</h4>
					<p class="takeaway-text">
						After Beta 2 closes, everyone pays full price. Lock in 20% lifetime discount now.
					</p>
				</div>
			</div>
			<div class="takeaway-item">
				<Check class="w-5 h-5 icon-success" />
				<div>
					<h4 class="takeaway-heading">Significant Long-Term Savings</h4>
					<p class="takeaway-text">
						Beta 2 members save €420-€764 over 5 years compared to public launch pricing.
					</p>
				</div>
			</div>
			<div class="takeaway-item">
				<Check class="w-5 h-5 icon-success" />
				<div>
					<h4 class="takeaway-heading">No Commitment During Trial</h4>
					<p class="takeaway-text">
						4 months completely free. No credit card required. Cancel anytime.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.comparison-section {
		max-width: 80rem;
		margin: 3rem auto;
		padding: 0 1rem;
	}
	
	.comparison-header {
		text-align: center;
		margin-bottom: 3rem;
	}
	
	.comparison-title {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}
	
	.comparison-subtitle {
		font-size: 1.125rem;
		color: var(--text-secondary);
	}
	
	/* Grid */
	.comparison-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		margin-bottom: 3rem;
	}
	
	@media (max-width: 1024px) {
		.comparison-grid {
			grid-template-columns: 1fr;
			max-width: 600px;
			margin-left: auto;
			margin-right: auto;
		}
	}
	
	/* Cards */
	.comparison-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		transition: all 0.3s ease;
	}
	
	.comparison-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
	}
	
	.comparison-card--featured {
		border: 2px solid var(--primary);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		position: relative;
	}
	
	.comparison-card--featured::before {
		content: 'BEST VALUE';
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--primary);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full);
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.05em;
	}
	
	/* Card Header */
	.card-header {
		text-align: center;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--border-secondary);
		margin-bottom: 1.5rem;
	}
	
	.icon-wrapper {
		width: 3rem;
		height: 3rem;
		margin: 0 auto 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-secondary);
		border-radius: var(--radius-full);
	}
	
	.tier-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.tier-subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
	}
	
	.tier-status {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	/* Benefit Sections */
	.benefit-section {
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-secondary);
	}
	
	.benefit-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-tertiary);
		margin-bottom: 0.25rem;
	}
	
	.benefit-value {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	/* Pricing Sections */
	.pricing-section {
		margin-bottom: 1.5rem;
	}
	
	.plan-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
	}
	
	.price-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}
	
	.price-original {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		text-decoration: line-through;
	}
	
	.price-arrow {
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}
	
	.price-final {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	
	.price-savings {
		font-size: 0.75rem;
		color: var(--color-success-600);
		font-weight: 500;
	}
	
	/* Savings Section */
	.savings-section {
		background: var(--bg-secondary);
		padding: 1rem;
		border-radius: var(--radius-md);
		margin-top: 1.5rem;
	}
	
	.savings-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-tertiary);
		margin-bottom: 0.75rem;
		text-align: center;
	}
	
	.savings-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}
	
	.savings-plan {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-bottom: 0.25rem;
	}
	
	.savings-amount {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-success-600);
	}
	
	/* Takeaways Section */
	.takeaways-section {
		background: var(--bg-secondary);
		padding: 2rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-primary);
	}
	
	.takeaways-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		text-align: center;
	}
	
	.takeaways-grid {
		display: grid;
		gap: 1.5rem;
	}
	
	.takeaway-item {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}
	
	.takeaway-heading {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.takeaway-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	/* Mobile Responsive */
	@media (max-width: 640px) {
		.comparison-title {
			font-size: 1.5rem;
		}
		
		.comparison-subtitle {
			font-size: 0.9375rem;
		}
		
		.comparison-card {
			padding: 1.25rem;
		}
		
		.tier-name {
			font-size: 1.25rem;
		}
		
		.takeaways-section {
			padding: 1.5rem;
		}
		
		.takeaway-item {
			gap: 0.75rem;
		}
	}
</style>


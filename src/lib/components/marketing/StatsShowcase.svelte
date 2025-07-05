<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Users from 'lucide-svelte/icons/users';
	import Star from 'lucide-svelte/icons/star';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	
	let showStats = $state(false);
	let statsAnimated = $state(false);
	
	// Platform capabilities and early access info instead of fake metrics
	const platformStats = [
		{
			title: 'Setup Time',
			value: '< 5 min',
			icon: DollarSign,
			trend: { value: 'Instant', positive: true },
			subtitle: 'from signup to first QR code',
			color: 'green'
		},
		{
			title: 'Early Access',
			value: 'Open',
			icon: Users,
			trend: { value: 'Limited', positive: true },
			subtitle: 'accepting beta testers',
			color: 'blue'
		},
		{
			title: 'Platform Fee',
			value: '0%',
			icon: Star,
			trend: { value: 'Forever', positive: true },
			subtitle: 'keep 100% of bookings',
			color: 'yellow'
		},
		{
			title: 'Industry Avg',
			value: '12-18%',
			icon: TrendingUp,
			trend: { value: 'vs 25%+', positive: true },
			subtitle: 'QR conversion potential',
			color: 'purple'
		}
	];
	
	onMount(() => {
		setTimeout(() => showStats = true, 200);
		setTimeout(() => statsAnimated = true, 600);
	});
</script>

{#if showStats}
	<section class="py-16" in:fade={{ duration: 600 }}>
		<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
			<div class="text-center mb-12">
				<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" 
					style="background: var(--color-success-100); color: var(--color-success-700);">
					<TrendingUp class="w-4 h-4" />
					<span class="text-sm font-medium">Early Access Launch</span>
				</div>
				<h2 class="text-3xl md:text-4xl font-bold mb-4" style="color: var(--text-primary);">
					Built for Tour Guide Success
				</h2>
				<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
					Join our early access program and be among the first to experience professional QR booking
				</p>
			</div>
			
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each platformStats as stat, index}
					<div class="marketing-stat-card" 
						 style="animation-delay: {index * 150}ms"
						 class:animate-stat={statsAnimated}>
						<div class="stat-icon-wrapper stat-icon-{stat.color}">
							<stat.icon class="w-6 h-6" />
						</div>
						<div class="stat-content">
							<div class="stat-value">{stat.value}</div>
							<div class="stat-title">{stat.title}</div>
							<div class="stat-trend positive">
								{stat.trend.value} {stat.subtitle}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>
{/if}

<style>
	.marketing-stat-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 2rem;
		text-align: center;
		transition: all 0.3s ease;
		transform: translateY(20px);
		opacity: 0;
		position: relative;
		overflow: hidden;
	}
	
	.marketing-stat-card.animate-stat {
		transform: translateY(0);
		opacity: 1;
	}
	
	.marketing-stat-card:hover {
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}
	
	.marketing-stat-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, 
			var(--color-primary-400) 0%, 
			var(--color-primary-500) 50%, 
			var(--color-primary-400) 100%);
		transform: translateX(-100%);
		animation: shimmer 3s infinite;
	}
	
	@keyframes shimmer {
		to { transform: translateX(100%); }
	}
	
	.stat-icon-wrapper {
		width: 4rem;
		height: 4rem;
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.5rem;
	}
	
	.stat-icon-green { background: var(--color-success-100); color: var(--color-success-600); }
	.stat-icon-blue { background: var(--color-primary-100); color: var(--color-primary-600); }
	.stat-icon-yellow { background: var(--color-warning-100); color: var(--color-warning-600); }
	.stat-icon-purple { background: var(--color-purple-100); color: var(--color-purple-600); }
	
	.stat-value {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
		margin-bottom: 0.5rem;
	}
	
	.stat-title {
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-secondary);
		margin-bottom: 0.75rem;
	}
	
	.stat-trend {
		font-size: 0.875rem;
		font-weight: 500;
	}
	
	.stat-trend.positive {
		color: var(--color-success-600);
	}
	
	@media (max-width: 640px) {
		.marketing-stat-card {
			padding: 1.5rem;
		}
		
		.stat-value {
			font-size: 2rem;
		}
		
		.stat-icon-wrapper {
			width: 3rem;
			height: 3rem;
		}
	}
</style> 
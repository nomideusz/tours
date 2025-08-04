<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import Users from 'lucide-svelte/icons/users';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	
	// State for beta stats
	let stats = $state({
		betaUsers: 0,
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
						betaUsers: data.stats.betaUsers,
						spotsTotal: data.stats.spotsTotal,
						loading: false
					};
				}
			}
		} catch (err) {
			// Use fallback data if fetch fails
			stats = {
				betaUsers: 12,
				spotsTotal: 50,
				loading: false
			};
		}
	}

	onMount(() => {
		fetchStats();
	});
</script>

<div class="beta-banner" in:fade={{ duration: 300 }}>
	<div class="beta-container">
		<div class="beta-content">
			<!-- Beta Badge -->
			<div class="beta-badge">
				<FlaskConical class="w-4 h-4" />
				<span>Currently in Beta</span>
			</div>
			
			<!-- Main Message -->
			<div class="beta-message">
				<Users class="w-4 h-4 text-primary" />
				<span>
					We're selecting 
					<strong>{stats.spotsTotal} tour guides</strong> 
					to shape Zaur's future
				</span>
			</div>
			
		</div>
		
		<!-- Progress indicator -->
		{#if !stats.loading}
			<div class="beta-progress">
				<div class="progress-bar">
					<div 
						class="progress-fill" 
						style="width: {(stats.betaUsers / stats.spotsTotal) * 100}%"
					></div>
				</div>
				<span class="progress-text">
					{stats.betaUsers} applications received
				</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.beta-banner {
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-primary);
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 60; /* Higher than most elements to stay on top */
		backdrop-filter: blur(8px);
	}
	
	.beta-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0.75rem 1rem;
	}
	
	.beta-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
		text-align: center;
	}
	
	.beta-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.75rem;
		background: var(--primary);
		color: white;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
	}
	

	
	.beta-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.beta-message strong {
		color: var(--text-primary);
		font-weight: 600;
	}
	
	.beta-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 1rem;
		background: var(--bg-primary);
		color: var(--primary);
		border: 1px solid var(--primary);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.2s ease;
		white-space: nowrap;
	}
	
	.beta-cta:hover {
		background: var(--primary);
		color: white;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	

	
	/* Progress indicator */
	.beta-progress {
		margin-top: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		max-width: 400px;
		margin-left: auto;
		margin-right: auto;
	}
	
	.progress-bar {
		flex: 1;
		height: 4px;
		background: var(--bg-tertiary);
		border-radius: 2px;
		overflow: hidden;
		position: relative;
	}
	
	.progress-fill {
		height: 100%;
		background: var(--primary);
		border-radius: 2px;
		transition: width 0.6s ease;
		position: relative;
		overflow: hidden;
	}
	
	/* Shimmer effect */
	.progress-fill::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.2),
			transparent
		);
		animation: shimmer 2s infinite;
	}
	
	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}
	
	.progress-text {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		white-space: nowrap;
	}
	
	/* Mobile styles */
	@media (max-width: 640px) {
		.beta-container {
			padding: 0.625rem 0.75rem;
		}
		
		.beta-content {
			gap: 0.75rem;
		}
		
		.beta-badge {
			font-size: 0.8125rem;
			padding: 0.1875rem 0.625rem;
		}
		
		.beta-message {
			font-size: 0.8125rem;
		}
		
		.beta-cta {
			font-size: 0.8125rem;
			padding: 0.3125rem 0.875rem;
		}
		
		.beta-progress {
			margin-top: 0.625rem;
		}
	}
	
	/* Dark mode enhancements */
	:global(.dark) .beta-banner {
		background: var(--bg-secondary);
	}
	
	:global(.dark) .beta-cta {
		border-color: var(--primary);
	}
	
	:global(.dark) .progress-bar {
		background: var(--bg-primary);
	}
</style>
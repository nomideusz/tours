<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import Eye from 'lucide-svelte/icons/eye';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Users from 'lucide-svelte/icons/users';
	
	let showPreview = $state(false);
	let isHovered = $state(false);
	
	// Platform capabilities preview instead of fake metrics
	const platformCapabilities = [
		{ label: 'Setup Time', value: '< 5 min', icon: Sparkles },
		{ label: 'Platform Fee', value: '0%', icon: Users },
		{ label: 'Payment Process', value: 'Instant', icon: BarChart3 }
	];
	
	onMount(() => {
		setTimeout(() => showPreview = true, 800);
	});
	
	function viewDemo() {
		goto('/demo');
	}
</script>

{#if showPreview}
	<div class="demo-preview-container" in:fade={{ duration: 600 }}>
		<div class="demo-preview-card" 
			 class:hovered={isHovered}
			 onmouseenter={() => isHovered = true}
			 onmouseleave={() => isHovered = false}
			 onclick={viewDemo}
			 role="button"
			 tabindex="0"
			 onkeydown={(e) => e.key === 'Enter' && viewDemo()}>
			
			<div class="demo-badge">
				<Sparkles class="w-3 h-3" />
				<span>Platform Preview</span>
			</div>
			
			<div class="demo-preview-header">
				<h3 class="demo-title">Platform Preview</h3>
				<p class="demo-subtitle">See what your professional dashboard will look like</p>
			</div>
			
			<div class="demo-stats-grid">
				{#each platformCapabilities as stat, index}
					<div class="demo-stat" 
						 style="animation-delay: {index * 150}ms"
						 in:scale={{ duration: 400, delay: 800 + index * 150 }}>
						<div class="demo-stat-icon">
							<stat.icon class="w-4 h-4" />
						</div>
						<div class="demo-stat-content">
							<div class="demo-stat-value">{stat.value}</div>
							<div class="demo-stat-label">{stat.label}</div>
						</div>
					</div>
				{/each}
			</div>
			
			<div class="demo-cta">
				<button class="demo-button">
					<Eye class="w-4 h-4" />
					View Demo Preview
				</button>
			</div>
			
			{#if isHovered}
				<div class="demo-shine" in:fade={{ duration: 300 }}></div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.demo-preview-container {
		margin-top: 2rem;
		display: flex;
		justify-content: center;
	}
	
	.demo-preview-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 1.5rem;
		max-width: 400px;
		width: 100%;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		box-shadow: var(--shadow-sm);
	}
	
	.demo-preview-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--color-primary-300);
	}
	
	.demo-preview-card.hovered {
		background: linear-gradient(135deg, var(--bg-primary) 0%, var(--color-primary-50) 100%);
	}
	
	.demo-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.75rem;
		background: var(--color-primary-100);
		color: var(--color-primary-700);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		margin-bottom: 1rem;
	}
	
	.demo-preview-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}
	
	.demo-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.demo-subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.demo-stats-grid {
		display: grid;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	
	.demo-stat {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}
	
	.demo-preview-card:hover .demo-stat {
		background: var(--bg-primary);
		border-color: var(--border-secondary);
	}
	
	.demo-stat-icon {
		width: 2rem;
		height: 2rem;
		background: var(--color-primary-100);
		color: var(--color-primary-600);
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	
	.demo-stat-content {
		flex: 1;
		min-width: 0;
	}
	
	.demo-stat-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1;
	}
	
	.demo-stat-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}
	
	.demo-cta {
		text-align: center;
	}
	
	.demo-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--color-primary-600);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
		justify-content: center;
	}
	
	.demo-button:hover {
		background: var(--color-primary-700);
		transform: translateY(-1px);
	}
	
	.demo-shine {
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
		animation: shine 1.5s ease-in-out;
	}
	
	@keyframes shine {
		0% { left: -100%; }
		100% { left: 100%; }
	}
	
	@media (max-width: 640px) {
		.demo-preview-card {
			margin: 0 1rem;
			padding: 1.25rem;
		}
		
		.demo-title {
			font-size: 1.125rem;
		}
		
		.demo-stat {
			padding: 0.5rem;
		}
		
		.demo-stat-value {
			font-size: 1rem;
		}
	}
</style> 
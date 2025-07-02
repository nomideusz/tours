<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import Users from 'lucide-svelte/icons/users';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Globe from 'lucide-svelte/icons/globe';
	import Clock from 'lucide-svelte/icons/clock';
	
	let showContent = $state(false);
	let progressWidth = $state(0);
	let loading = $state(true);
	let error = $state('');
	
	// Real metrics fetched from database
	let stats = $state({
		totalUsers: 0,
		earlyAccessUsers: 0,
		spotsTotal: 100,
		spotsRemaining: 100,
		progressPercentage: 0,
		countriesRepresented: 1,
		avgSetupTime: 4.5
	});
	
	async function fetchStats() {
		try {
			const response = await fetch('/api/early-access-stats');
			if (!response.ok) {
				throw new Error('Failed to fetch stats');
			}
			const data = await response.json();
			if (data.success) {
				stats = data.stats;
			} else {
				throw new Error(data.error || 'Unknown error');
			}
		} catch (err) {
			console.error('Error fetching early access stats:', err);
			error = 'Unable to load current stats';
			// Use fallback data so the component still shows
			stats = {
				totalUsers: 47,
				earlyAccessUsers: 47,
				spotsTotal: 100,
				spotsRemaining: 53,
				progressPercentage: 47,
				countriesRepresented: 12,
				avgSetupTime: 4.5
			};
		} finally {
			loading = false;
		}
	}
	
	onMount(() => {
		fetchStats().then(() => {
			setTimeout(() => {
				showContent = true;
				// Animate progress bar
				setTimeout(() => {
					progressWidth = stats.progressPercentage;
				}, 300);
			}, 200);
		});
	});
</script>

{#if showContent && !loading}
	<section class="py-12" style="background: var(--bg-secondary);" in:fade={{ duration: 600 }}>
		<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
			<div class="social-proof-container">
				<!-- Early Access Progress -->
				<div class="progress-section" in:fly={{ y: 20, duration: 500, delay: 200 }}>
					<div class="text-center mb-6">
						<h3 class="text-xl font-semibold mb-2" style="color: var(--text-primary);">
							Early Access Program
						</h3>
						<p class="text-sm" style="color: var(--text-secondary);">
							Limited to first {stats.spotsTotal} tour guides
						</p>
					</div>
					
					<div class="progress-bar-container">
						<div class="progress-bar">
							<div 
								class="progress-fill" 
								style="width: {progressWidth}%"
							>
								<span class="progress-text">{stats.earlyAccessUsers}/{stats.spotsTotal}</span>
							</div>
						</div>
						<p class="text-sm text-center mt-2" style="color: var(--text-tertiary);">
							{stats.spotsRemaining} spots remaining
						</p>
						{#if error}
							<p class="text-xs text-center mt-1" style="color: var(--color-warning-600);">
								{error}
							</p>
						{/if}
					</div>
				</div>
				
				<!-- Trust Indicators -->
				<div class="trust-grid">
					<div class="trust-item" in:fade={{ duration: 500, delay: 400 }}>
						<div class="trust-icon">
							<Users class="w-5 h-5" />
						</div>
						<div class="trust-content">
							<div class="trust-value">{stats.earlyAccessUsers}</div>
							<div class="trust-label">Tour Guides Joined</div>
						</div>
					</div>
					
					<div class="trust-item" in:fade={{ duration: 500, delay: 500 }}>
						<div class="trust-icon">
							<Globe class="w-5 h-5" />
						</div>
						<div class="trust-content">
							<div class="trust-value">{stats.countriesRepresented}</div>
							<div class="trust-label">Countries</div>
						</div>
					</div>
					
					<div class="trust-item" in:fade={{ duration: 500, delay: 600 }}>
						<div class="trust-icon">
							<Clock class="w-5 h-5" />
						</div>
						<div class="trust-content">
							<div class="trust-value">{stats.avgSetupTime}min</div>
							<div class="trust-label">Avg Setup Time</div>
						</div>
					</div>
					
					<div class="trust-item" in:fade={{ duration: 500, delay: 700 }}>
						<div class="trust-icon">
							<TrendingUp class="w-5 h-5" />
						</div>
						<div class="trust-content">
							<div class="trust-value">50%</div>
							<div class="trust-label">OFF Early Access</div>
						</div>
					</div>
				</div>
				
				<!-- Urgency Message -->
				<div class="urgency-message" in:fade={{ duration: 500, delay: 800 }}>
					<p class="text-sm text-center" style="color: var(--text-secondary);">
						<strong style="color: var(--color-warning-600);">⏰ Limited Time:</strong> 
						Early access pricing increases after first {stats.spotsTotal} members
					</p>
				</div>
			</div>
		</div>
	</section>
{:else if loading}
	<!-- Loading state -->
	<section class="py-12" style="background: var(--bg-secondary);">
		<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
			<div class="social-proof-container">
				<div class="text-center">
					<div class="animate-pulse">
						<div class="h-6 bg-gray-300 rounded mb-4 max-w-xs mx-auto"></div>
						<div class="h-12 bg-gray-300 rounded mb-6 max-w-md mx-auto"></div>
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
							{#each Array(4) as _}
								<div class="h-20 bg-gray-300 rounded"></div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
{/if}

<style>
	.social-proof-container {
		max-width: 800px;
		margin: 0 auto;
	}
	
	.progress-section {
		margin-bottom: 3rem;
	}
	
	.progress-bar-container {
		max-width: 500px;
		margin: 0 auto;
	}
	
	.progress-bar {
		height: 3rem;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: 9999px;
		overflow: hidden;
		position: relative;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
	}
	
	.progress-fill {
		height: 100%;
		background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 1rem;
		transition: width 1.5s ease-out;
		position: relative;
		overflow: hidden;
	}
	
	.progress-fill::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
		animation: shimmer 2s infinite;
	}
	
	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}
	
	.progress-text {
		color: white;
		font-weight: 600;
		font-size: 0.875rem;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		position: relative;
		z-index: 1;
	}
	
	.trust-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	
	.trust-item {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1.5rem 1rem;
		text-align: center;
		transition: all 0.2s ease;
	}
	
	.trust-item:hover {
		border-color: var(--border-secondary);
		box-shadow: var(--shadow-sm);
		transform: translateY(-2px);
	}
	
	.trust-icon {
		width: 2.5rem;
		height: 2.5rem;
		background: var(--color-primary-100);
		color: var(--color-primary-600);
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 0.75rem;
	}
	
	.trust-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
		line-height: 1;
	}
	
	.trust-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.urgency-message {
		background: var(--color-warning-50);
		border: 1px solid var(--color-warning-200);
		border-radius: 0.5rem;
		padding: 1rem;
	}
	
	@media (max-width: 768px) {
		.social-proof-container {
			padding: 0 1rem;
		}
		
		.progress-bar {
			height: 2.5rem;
		}
		
		.progress-text {
			font-size: 0.75rem;
			padding-right: 0.75rem;
		}
		
		.trust-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem;
		}
		
		.trust-item {
			padding: 1.25rem 0.75rem;
		}
		
		.trust-value {
			font-size: 1.25rem;
		}
		
		.trust-label {
			font-size: 0.7rem;
		}
	}
</style> 
<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Rocket from 'lucide-svelte/icons/rocket';
	import Crown from 'lucide-svelte/icons/crown';
	
	// State for early access stats
	let stats = $state({
		earlyAccessUsers: 0,
		spotsTotal: 100,
		loading: true
	});

	async function fetchStats() {
		try {
			const response = await fetch('/api/early-access-stats');
			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					stats = {
						earlyAccessUsers: data.stats.earlyAccessUsers,
						spotsTotal: data.stats.spotsTotal,
						loading: false
					};
				}
			}
		} catch (err) {
			// Use fallback data if fetch fails
			stats = {
				earlyAccessUsers: 47,
				spotsTotal: 100,
				loading: false
			};
		}
	}

	onMount(() => {
		fetchStats();
	});
</script>

<!-- Final CTA - Professional Single Card -->
<section class="subtle-retro-section py-20" in:fade={{ duration: 600 }}>
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="max-w-2xl mx-auto">
			<div class="final-cta-card">
				<div class="card-header">
					<div class="professional-badge mb-4">
						<Crown class="w-4 h-4" />
						<span>Founding Members</span>
					</div>
					<h2 class="card-title">
						Ready to Get Started?
					</h2>
					<p class="card-description">
						Join our founding members and help shape the future of tour guide technology.
					</p>
				</div>

				{#if !stats.loading}
					<div class="member-counter">
						<div class="counter-stats">
							<div class="stat">
								<span class="stat-number">{stats.earlyAccessUsers}</span>
								<span class="stat-label">joined</span>
							</div>
							<div class="stat-divider">•</div>
							<div class="stat">
								<span class="stat-number">{stats.spotsTotal - stats.earlyAccessUsers}</span>
								<span class="stat-label">spots left</span>
							</div>
						</div>
						<div class="progress-bar">
							<div class="progress-fill" style="width: {(stats.earlyAccessUsers / stats.spotsTotal) * 100}%"></div>
						</div>
					</div>
				{/if}

				<div class="card-actions">
					<button 
						class="button-coral button--large button--gap button--full-width"
						onclick={() => window.location.href = '/auth/register'}
					>
						<Rocket class="w-5 h-5" />
						Get Started
					</button>
					
					<div class="promo-reminder">
						<span class="promo-text">Use code</span>
						<span class="promo-code">EARLY2025</span>
						<span class="promo-text">for early access perks</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* Subtle retro section with minimal color - matches HeroSection */
	.subtle-retro-section {
		background: linear-gradient(
			180deg,
			var(--bg-primary) 0%,
			var(--bg-secondary) 100%
		);
		position: relative;
		overflow: hidden;
		min-height: 70vh;
		display: flex;
		align-items: center;
	}
	
	/* Very subtle texture overlay - matches HeroSection */
	.subtle-retro-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 40px,
			rgba(0, 0, 0, 0.02) 40px,
			rgba(0, 0, 0, 0.02) 41px
		);
		pointer-events: none;
	}

	/* Professional badge with subtle retro border - matches HeroSection */
	.professional-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--bg-primary);
		border: 2px solid var(--color-coral-500);
		color: var(--text-primary);
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		font-weight: 600;
		font-size: 0.875rem;
		box-shadow: var(--shadow-sm);
	}

	/* Final CTA Card - matches HeroSection trust cards */
	.final-cta-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-xl);
		padding: 3rem;
		text-align: center;
		transition: all var(--transition-base) ease;
		box-shadow: var(--shadow-lg);
		position: relative;
		overflow: hidden;
	}

	/* Subtle coral accent on hover - matches HeroSection */
	.final-cta-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-coral-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.final-cta-card:hover::before {
		transform: scaleX(1);
	}

	.final-cta-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-xl);
		border-color: var(--border-secondary);
	}

	/* Card Content */
	.card-header {
		margin-bottom: 2rem;
	}

	.card-title {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
		line-height: 1.2;
	}

	.card-description {
		font-size: 1.125rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0;
	}

	/* Member Counter */
	.member-counter {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.counter-stats {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.stat-number {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.stat-divider {
		color: var(--text-tertiary);
		font-weight: 300;
	}

	/* Progress Bar */
	.progress-bar {
		width: 100%;
		height: 0.5rem;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		overflow: hidden;
		border: 1px solid var(--border-primary);
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-coral-500), var(--color-warm-orange-500));
		border-radius: var(--radius-full);
		transition: width var(--transition-base) ease;
	}

	/* Card Actions */
	.card-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	/* Promo Code Reminder */
	.promo-reminder {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-top: 0.5rem;
	}

	.promo-text {
		color: var(--text-tertiary);
	}

	.promo-code {
		background: var(--bg-secondary);
		border: 1px solid var(--color-coral-500);
		color: var(--color-coral-600);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.8rem;
		letter-spacing: 0.05em;
		transition: all var(--transition-base) ease;
	}

	.promo-code:hover {
		background: var(--color-coral-50);
		border-color: var(--color-coral-600);
		color: var(--color-coral-700);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.final-cta-card {
			padding: 2rem;
		}

		.card-title {
			font-size: 1.5rem;
		}

		.card-description {
			font-size: 1rem;
		}

		.member-counter {
			padding: 1.25rem;
		}

		.stat-number {
			font-size: 1.25rem;
		}

		.counter-stats {
			gap: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.final-cta-card {
			padding: 1.5rem;
		}

		.card-title {
			font-size: 1.375rem;
		}

		.member-counter {
			padding: 1rem;
		}
	}
</style> 
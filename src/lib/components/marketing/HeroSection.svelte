<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	
	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	
	let showCopied = $state(false);
	
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
	
	function copyPromoCode() {
		navigator.clipboard.writeText('EARLY2025');
		showCopied = true;
		setTimeout(() => showCopied = false, 2000);
	}
	
	function handleGetStarted() {
		goto('/auth/register');
	}
</script>

<section class="subtle-retro-section">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="text-center max-w-4xl mx-auto py-20" in:fade={{ delay: 200 }}>
			<div class="professional-badge mb-6">
				<span>Available Now</span>
			</div>
			
			<h1 class="hero-title mb-6">
				<span class="title-primary">QR Bookings</span>
				<span class="title-secondary">+ Tour Discovery</span>
			</h1>
			
			<p class="hero-subtitle text-lg max-w-2xl mx-auto mb-8">
				The simplest booking system with QR codes, instant reservations, and tour discovery. No commission fees, ever.
			</p>
			
			<div class="hero-actions max-w-md mx-auto mb-8">
				<div class="promo-card mb-4">
					<div class="promo-header">
						<span class="promo-label">Early Access Code</span>
						<span class="promo-badge">Founding Member</span>
					</div>
					<button 
						class="promo-button"
						onclick={copyPromoCode}
						aria-label="Copy promo code EARLY2025"
					>
						<span class="promo-code">EARLY2025</span>
						<Copy class="w-5 h-5" />
					</button>
					<p class="promo-discount-text">Lifetime 50% discount on all plans</p>
					{#if showCopied}
						<p class="copy-feedback" in:fade={{ duration: 200 }}>
							Code copied to clipboard
						</p>
					{/if}
				</div>
				
				<div class="action-button-container">
					<button onclick={handleGetStarted} class="button-primary button--large button--gap button--full-width">
						Get Started
						<ArrowRight class="w-4 h-4" />
					</button>
				</div>
			</div>
			
			<!-- Social proof with subtle early access counter -->
			<div class="text-center mb-12">
				{#if !stats.loading}
					<div class="early-access-counter mb-3">
						<span class="counter-text">{stats.earlyAccessUsers} founding members joined</span>
						<span class="counter-divider">•</span>
						<span class="counter-text">{stats.spotsTotal - stats.earlyAccessUsers} spots remaining</span>
					</div>
				{/if}
				<p class="social-text">Join tour guides building with Zaur</p>
			</div>
			
			<!-- Trust indicators with subtle retro touch -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
				<div class="trust-card">
					<div class="trust-value">5 min</div>
					<div class="trust-label">Setup Time</div>
				</div>
				<div class="trust-card">
					<div class="trust-value">0%</div>
					<div class="trust-label">Commission</div>
				</div>
				<div class="trust-card">
					<div class="trust-value">Stripe</div>
					<div class="trust-label">Secure Payments</div>
				</div>
				<div class="trust-card">
					<div class="trust-value">40+</div>
					<div class="trust-label">Countries</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* Subtle retro section with minimal color */
	.subtle-retro-section {
		background: linear-gradient(
			180deg,
			var(--bg-primary) 0%,
			var(--bg-secondary) 100%
		);
		position: relative;
		overflow: hidden;
		min-height: 90vh;
		display: flex;
		align-items: center;
	}
	
	/* Very subtle texture overlay */
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
	
	/* Clean typography with subtle retro touches */
	.hero-title {
		font-size: 2.5rem;
		font-weight: 700;
		line-height: 1.1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.title-primary {
		color: var(--text-primary);
	}
	
	.title-secondary {
		color: var(--text-secondary);
		font-weight: 500;
	}
	
	.hero-subtitle {
		color: var(--text-secondary);
		font-weight: 500;
	}
	
	@media (min-width: 768px) {
		.hero-title {
			font-size: 3.5rem;
		}
	}
	
	/* Professional badge with subtle retro border */
	.professional-badge {
		display: inline-block;
		background: var(--bg-primary);
		border: 2px solid var(--color-coral-500);
		color: var(--text-primary);
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		font-weight: 600;
		font-size: 0.875rem;
		box-shadow: var(--shadow-sm);
	}
	
	/* Clean promo card */
	.promo-card {
		background: var(--bg-primary);
		border: 2px solid var(--border-primary); /* Updated to 2px */
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		box-shadow: var(--shadow-md);
	}
	
	.promo-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}
	
	.promo-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.promo-badge {
		background: var(--color-coral-500);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	.promo-button {
		width: 100%;
		background: var(--bg-secondary);
		border: 2px dashed var(--border-secondary);
		border-radius: var(--radius-lg);
		padding: 1rem;
		cursor: pointer;
		transition: all var(--transition-base) ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}
	
	.promo-button:hover {
		background: var(--bg-tertiary);
		border-color: var(--color-coral-500);
	}
	
	.promo-code {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: 0.1em;
	}
	
	.copy-feedback {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-align: center;
		margin-top: 0.5rem;
	}
	
	.promo-discount-text {
		font-size: 0.875rem;
		color: var(--text-primary);
		text-align: center;
		margin-top: 0.75rem;
		font-weight: 500;
	}
	
	/* Subtle early access counter */
	.early-access-counter {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		font-size: 0.8rem;
		color: var(--text-secondary);
		font-weight: 500;
		margin-bottom: 0.75rem;
	}
	
	.counter-text {
		color: var(--text-secondary);
	}
	
	.counter-divider {
		color: var(--text-tertiary);
		font-weight: 300;
	}
	
	/* Social proof text */
	.social-text {
		color: var(--text-secondary);
		font-weight: 500;
		font-size: 0.875rem;
	}
	
	/* Trust cards with subtle retro styling */
	.trust-card {
		text-align: center;
		padding: 1.5rem 1rem;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary); /* Updated to 2px */
		border-radius: var(--radius-lg);
		transition: all var(--transition-base) ease;
		box-shadow: var(--shadow-sm);
		position: relative;
		overflow: hidden;
	}
	
	/* Subtle accent line on hover */
	.trust-card::before {
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
	
	.trust-card:hover::before {
		transform: scaleX(1);
	}
	
	.trust-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}
	
	.trust-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
		line-height: 1;
	}
	
	.trust-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		line-height: 1;
		font-weight: 500;
	}
	
	/* Responsive adjustments */
	@media (max-width: 640px) {
		.subtle-retro-section {
			min-height: 80vh;
		}
		
		.hero-title {
			font-size: 2rem;
		}
		
		.trust-card {
			padding: 1rem 0.75rem;
		}
		
		.trust-value {
			font-size: 1rem;
		}
		
		.trust-label {
			font-size: 0.6875rem;
		}
		
		.promo-code {
			font-size: 1rem;
		}
		
		.early-access-counter {
			flex-direction: column;
			gap: 0.25rem;
			font-size: 0.75rem;
		}
		
		.counter-divider {
			display: none;
		}
	}
</style>

	
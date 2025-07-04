<script lang="ts">
	import { fade } from 'svelte/transition';
	
	// Components
	import PlatformShowcase from './PlatformShowcase.svelte';
	
	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	
	let showCopied = $state(false);
	
	function copyPromoCode() {
		navigator.clipboard.writeText('EARLY2025');
		showCopied = true;
		setTimeout(() => showCopied = false, 2000);
	}
</script>

<section class="py-12 pb-20" style="border-bottom: none;">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="text-center max-w-4xl mx-auto" in:fade={{ delay: 200 }}>
			<div class="hero-badge">
				<span class="badge-text">Available Now</span>
			</div>
			
			<h1 class="hero-title">
				<span class="title-primary">Professional QR Booking</span>
				<span class="title-secondary">for Tour Guides</span>
			</h1>
			
			<p class="hero-subtitle">
				Transform your tours with instant QR code bookings. Professional booking system with real-time availability, secure payments, and no commission fees.
			</p>
			
			<div class="hero-actions">
				<div class="promo-code-container">
					<div class="promo-header">
						<span class="promo-label">Early Access Code</span>
						<span class="promo-badge">Founding Member</span>
					</div>
					<button 
						class="promo-code-button"
						onclick={copyPromoCode}
						aria-label="Copy promo code EARLY2025"
					>
						<span class="promo-code">EARLY2025</span>
						<svg class="w-5 h-5 copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
						</svg>
					</button>
					{#if showCopied}
						<p class="copy-feedback" in:fade={{ duration: 200 }}>
							Code copied to clipboard
						</p>
					{/if}
				</div>
				
				<div class="action-button-container">
					<a href="/auth/register" class="cta-button">
						Get Started
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
						</svg>
					</a>
				</div>
			</div>
			
			<!-- Professional social proof -->
			<div class="flex flex-col items-center justify-center gap-3 text-sm" style="color: var(--text-tertiary);">
				<span class="text-center">Use code EARLY2025 for founding member pricing</span>
				<span class="text-center" style="color: var(--text-tertiary);">Join tour guides building with Zaur</span>
			</div>
			
			<!-- Professional trust indicators -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 max-w-3xl mx-auto">
				<div class="trust-indicator">
					<div class="trust-value">5 min</div>
					<div class="trust-label">Setup Time</div>
				</div>
				<div class="trust-indicator">
					<div class="trust-value">0%</div>
					<div class="trust-label">Commission</div>
				</div>
				<div class="trust-indicator">
					<div class="trust-value">Stripe</div>
					<div class="trust-label">Secure Payments</div>
				</div>
				<div class="trust-indicator">
					<div class="trust-value">40+</div>
					<div class="trust-label">Countries</div>
				</div>
			</div>
		</div>

		<!-- Platform Showcase -->
		<PlatformShowcase />
	</div>
</section>

<style>
	/* Hero Section Styles */
	.hero-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.5rem;
	}
	
	.badge-text {
		padding: 0.5rem 1rem;
		background: var(--color-primary-100);
		color: var(--color-primary-700);
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
	}
	
	.hero-title {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		line-height: 1.1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.title-primary {
		color: var(--color-primary-600);
	}
	
	.title-secondary {
		color: var(--text-primary);
	}
	
	@media (min-width: 768px) {
		.hero-title {
			font-size: 3.5rem;
		}
	}
	
	@media (min-width: 1024px) {
		.hero-title {
			font-size: 4rem;
		}
	}
	
	.hero-subtitle {
		font-size: 1.125rem;
		margin-bottom: 2rem;
		color: var(--text-secondary);
		line-height: 1.6;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}
	
	.hero-actions {
		max-width: 480px;
		margin: 0 auto 2rem;
	}
	
	/* Trust indicators */
	.trust-indicator {
		text-align: center;
		padding: 1rem 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}
	
	.trust-indicator:hover {
		border-color: var(--color-primary-300);
		box-shadow: var(--shadow-sm);
		transform: translateY(-1px);
	}
	
	.trust-value {
		font-size: 1.125rem;
		font-weight: 700;
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
	}
	
	@media (max-width: 640px) {
		.trust-indicator {
			padding: 0.75rem 0.5rem;
		}
		
		.trust-value {
			font-size: 1rem;
		}
		
		.trust-label {
			font-size: 0.6875rem;
		}
	}
	
	/* Promo Code Styles */
	.promo-code-container {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 1.5rem;
		margin-bottom: 1rem;
		box-shadow: var(--shadow-sm);
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
		color: var(--text-secondary);
	}
	
	.promo-badge {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.25rem 0.75rem;
		background: var(--color-warning-100);
		color: var(--color-warning-700);
		border-radius: 9999px;
	}
	
	.promo-code-button {
		width: 100%;
		background: var(--bg-secondary);
		border: 2px dashed var(--color-primary-300);
		border-radius: 0.75rem;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}
	
	.promo-code-button:hover {
		background: var(--color-primary-50);
		border-color: var(--color-primary-500);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}
	
	.promo-code {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: 0.1em;
	}
	
	.copy-icon {
		color: var(--text-tertiary);
		transition: color 0.2s ease;
	}
	
	.promo-code-button:hover .copy-icon {
		color: var(--color-primary-600);
	}
	
	.copy-feedback {
		font-size: 0.875rem;
		color: var(--color-success-600);
		text-align: center;
		margin-top: 0.5rem;
	}
	
	.action-button-container {
		margin-top: 1rem;
	}
	
	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 2rem;
		background: var(--color-primary-600);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 1rem;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
	}
	
	.cta-button:hover {
		background: var(--color-primary-700);
		transform: translateY(-1px);
		box-shadow: 0 6px 8px rgba(37, 99, 235, 0.3);
	}
	
	@media (max-width: 768px) {
		.promo-code-container {
			padding: 1rem;
		}
		
		.promo-code {
			font-size: 1rem;
		}
		
		.cta-button {
			padding: 0.75rem 1.5rem;
			font-size: 0.9rem;
		}
	}

</style>

	
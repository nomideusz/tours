<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import Rocket from 'lucide-svelte/icons/rocket';
	import Users from 'lucide-svelte/icons/users';
	import Zap from 'lucide-svelte/icons/zap';
	import Star from 'lucide-svelte/icons/star';
	import Copy from 'lucide-svelte/icons/copy';
	
	// State for copy feedback
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

	async function copyPromoCode() {
		try {
			await navigator.clipboard.writeText('EARLY2025');
			showCopied = true;
			setTimeout(() => {
				showCopied = false;
			}, 2000);
		} catch (err) {
			// Fallback for older browsers
			console.log('Fallback: Copy EARLY2025');
		}
	}
</script>

<section class="py-20" style="background: var(--bg-secondary);" in:fade={{ duration: 600 }}>
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<!-- Header Section -->
		<div class="text-center mb-12">
			<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" 
				style="background: var(--color-primary-100); color: var(--color-primary-700);">
				<Rocket class="w-4 h-4" />
				<span class="text-sm font-medium">Early Access Program</span>
			</div>
			<h2 class="text-3xl md:text-4xl font-bold mb-4" style="color: var(--text-primary);">
				Join the Founding Members
			</h2>
			<p class="text-lg md:text-xl max-w-3xl mx-auto" style="color: var(--text-secondary);">
				Use code <strong>EARLY2025</strong> to access founding member benefits and help shape the future of tour guide technology.
			</p>
		</div>
		
		<!-- Professional Early Access Counter -->
		{#if !stats.loading}
			<div class="counter-section mb-16">
				<div class="counter-card">
					<div class="counter-content">
						<span class="counter-number">{stats.earlyAccessUsers}</span>
						<span class="counter-label">founding members joined</span>
						<div class="spots-info">
							<span class="spots-remaining">{stats.spotsTotal - stats.earlyAccessUsers} spots remaining</span>
							<span class="spots-total">out of {stats.spotsTotal} total</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Benefits Grid -->
		<div class="benefits-section mb-20">
			<div class="benefits-grid">
				<div class="benefit-card">
					<div class="benefit-icon">
						<Star class="w-6 h-6" />
					</div>
					<div class="benefit-content">
						<h4 class="benefit-title">Founding Member Benefits</h4>
						<p class="benefit-description">Permanent special pricing and exclusive access to new features</p>
					</div>
				</div>
				
				<div class="benefit-card">
					<div class="benefit-icon">
						<Users class="w-6 h-6" />
					</div>
					<div class="benefit-content">
						<h4 class="benefit-title">Product Development Input</h4>
						<p class="benefit-description">Direct communication with founders and influence over feature development</p>
					</div>
				</div>
				
				<div class="benefit-card">
					<div class="benefit-icon">
						<Zap class="w-6 h-6" />
					</div>
					<div class="benefit-content">
						<h4 class="benefit-title">Priority Support</h4>
						<p class="benefit-description">Dedicated assistance and faster response times from our team</p>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Action Section -->
		<div class="action-section">
			<div class="action-content">
				<!-- Promo Code Section -->
				<div class="promo-section">
					<h3 class="promo-title">Get Started</h3>
					<div class="promo-code-display">
						<span class="promo-label">Access Code:</span>
						<button 
							class="promo-code-button" 
							onclick={copyPromoCode}
							title="Click to copy"
						>
							<span class="code-text">EARLY2025</span>
							<Copy class="w-4 h-4 copy-icon" />
						</button>
					</div>
					{#if showCopied}
						<p class="copy-feedback" in:fade={{ duration: 200 }}>
							Code copied to clipboard
						</p>
					{/if}
				</div>
				
				<!-- CTA Button -->
				<div class="cta-section">
					<a href="/auth/register" class="cta-button">
						<Rocket class="w-5 h-5" />
						Join Early Access
					</a>
					<p class="cta-note">
						Early access includes founding member benefits and permanent pricing protection.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* Header Section */
	.text-center h2 {
		line-height: 1.2;
	}
	
	/* Professional Counter Section */
	.counter-section {
		display: flex;
		justify-content: center;
	}
	
	.counter-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 2rem 3rem;
		box-shadow: var(--shadow-sm);
		transition: all 0.2s ease;
	}
	
	.counter-card:hover {
		box-shadow: var(--shadow-md);
		border-color: var(--border-secondary);
	}
	
	.counter-content {
		text-align: center;
	}
	
	.counter-number {
		display: block;
		font-size: 3rem;
		font-weight: 700;
		color: var(--color-primary-600);
		line-height: 1;
		margin-bottom: 0.5rem;
	}
	
	.counter-label {
		font-size: 1rem;
		color: var(--text-secondary);
		font-weight: 500;
	}
	
	.spots-info {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-primary);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.spots-remaining {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary-600);
	}
	
	.spots-total {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-weight: 400;
	}
	
	/* Benefits Section */
	.benefits-section {
		max-width: 1200px;
		margin: 0 auto;
	}
	
	.benefits-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 2rem;
	}
	
	.benefit-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 2rem;
		transition: all 0.2s ease;
		box-shadow: var(--shadow-sm);
	}
	
	.benefit-card:hover {
		border-color: var(--border-secondary);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}
	
	.benefit-icon {
		width: 3.5rem;
		height: 3.5rem;
		background: var(--color-primary-100);
		color: var(--color-primary-600);
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.5rem;
	}
	
	.benefit-content {
		text-align: left;
	}
	
	.benefit-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		line-height: 1.3;
	}
	
	.benefit-description {
		font-size: 1rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}
	
	/* Action Section */
	.action-section {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1.5rem;
		padding: 3rem 2rem;
		max-width: 800px;
		margin: 4rem auto 0;
		box-shadow: var(--shadow-sm);
	}
	
	.action-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		align-items: center;
	}
	
	/* Promo Code Section */
	.promo-section {
		text-align: left;
	}
	
	.promo-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
	}
	
	.promo-code-display {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	
	.promo-label {
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-secondary);
		min-width: fit-content;
	}
	
	.promo-code-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: var(--color-primary-50);
		border: 1px solid var(--color-primary-200);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		flex: 1;
	}
	
	.promo-code-button:hover {
		background: var(--color-primary-100);
		border-color: var(--color-primary-300);
		transform: scale(1.02);
	}
	
	.code-text {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-primary-700);
		letter-spacing: 0.05em;
		flex: 1;
	}
	
	.copy-icon {
		color: var(--color-primary-600);
		transition: transform 0.2s ease;
	}
	
	.promo-code-button:hover .copy-icon {
		transform: scale(1.1);
	}
	
	.copy-feedback {
		font-size: 0.875rem;
		color: var(--color-success-600);
		margin-top: 0.5rem;
	}
	
	/* CTA Section */
	.cta-section {
		text-align: center;
	}
	
	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		background: var(--color-primary-600);
		color: white;
		border: 1px solid var(--color-primary-600);
		border-radius: 0.75rem;
		font-weight: 600;
		font-size: 1rem;
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
		margin-bottom: 1rem;
	}
	
	.cta-button:hover {
		background: var(--color-primary-700);
		border-color: var(--color-primary-700);
		transform: translateY(-1px);
		box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);
	}
	
	.cta-note {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		line-height: 1.5;
		max-width: 300px;
		margin: 0 auto;
	}
	
	/* Responsive Design */
	@media (max-width: 768px) {
		.benefits-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.benefit-card {
			padding: 1.5rem;
		}
		
		.benefit-icon {
			width: 3rem;
			height: 3rem;
			margin-bottom: 1rem;
		}
		
		.benefit-title {
			font-size: 1.125rem;
		}
		
		.benefit-description {
			font-size: 0.9rem;
		}
		
		.action-section {
			padding: 2rem 1.5rem;
		}
		
		.action-content {
			grid-template-columns: 1fr;
			gap: 2rem;
			text-align: center;
		}
		
		.promo-section {
			text-align: center;
		}
		
		.promo-code-display {
			flex-direction: column;
			gap: 0.75rem;
		}
		
		.promo-code-button {
			justify-content: center;
		}
		
		.counter-card {
			padding: 1.5rem 2rem;
		}
		
		.counter-number {
			font-size: 2.5rem;
		}
	}
	
	@media (max-width: 480px) {
		.action-section {
			padding: 1.5rem 1rem;
			border-radius: 1rem;
		}
		
		.benefit-card {
			padding: 1.25rem;
		}
		
		.cta-button {
			width: 100%;
			padding: 0.875rem 1.5rem;
		}
		
		.counter-card {
			padding: 1.25rem 1.5rem;
		}
		
		.counter-number {
			font-size: 2rem;
		}
		
		.counter-label {
			font-size: 0.9rem;
		}
	}
</style> 
<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import Rocket from 'lucide-svelte/icons/rocket';
	import Users from 'lucide-svelte/icons/users';
	import Zap from 'lucide-svelte/icons/zap';
	import Star from 'lucide-svelte/icons/star';
	import Copy from 'lucide-svelte/icons/copy';
	import Crown from 'lucide-svelte/icons/crown';
	
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

<section class="subtle-retro-section py-20" in:fade={{ duration: 600 }}>
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<!-- Header Section -->
		<div class="text-center mb-12">
			<div class="professional-badge mb-6">
				<Crown class="w-4 h-4" />
				<span>Founding Members</span>
			</div>
			<h2 class="marketing-heading marketing-heading-lg mb-4">
				Join the Founding Members
			</h2>
			<p class="text-lg md:text-xl max-w-3xl mx-auto text-secondary">
				Use code <strong class="code-highlight">EARLY2025</strong> to access founding member benefits and help shape the future of tour guide technology.
			</p>
		</div>
		
		<!-- Counter Section -->
		{#if !stats.loading}
			<div class="counter-section mb-16">
				<div class="counter-card">
					<div class="counter-content">
						<div class="counter-badge">
							<Crown class="w-5 h-5" />
							<span>Founding Members</span>
						</div>
						<span class="counter-number">{stats.earlyAccessUsers}</span>
						<span class="counter-label">members joined</span>
						<div class="spots-info">
							<span class="spots-remaining">{stats.spotsTotal - stats.earlyAccessUsers} spots remaining</span>
							<span class="spots-total">out of {stats.spotsTotal} founding positions</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Benefits Grid -->
		<div class="benefits-section mb-20">
			<div class="benefits-grid">
				<div class="benefit-card">
					<div class="benefit-icon benefit-icon--coral">
						<Star class="w-6 h-6 text-white" />
					</div>
					<div class="benefit-content">
						<h4 class="benefit-title">Founding Member Benefits</h4>
						<p class="benefit-description">Permanent special pricing and exclusive access to new features</p>
					</div>
				</div>
				
				<div class="benefit-card">
					<div class="benefit-icon benefit-icon--orange">
						<Users class="w-6 h-6 text-white" />
					</div>
					<div class="benefit-content">
						<h4 class="benefit-title">Product Development Input</h4>
						<p class="benefit-description">Direct communication with founders and influence over feature development</p>
					</div>
				</div>
				
				<div class="benefit-card">
					<div class="benefit-icon benefit-icon--teal">
						<Zap class="w-6 h-6 text-white" />
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
					<div class="promo-badge mb-4">
						<span>Access Code</span>
					</div>
					<h3 class="promo-title">Get Started</h3>
					<div class="promo-code-display">
						<span class="promo-label">Early Access Code:</span>
						<button 
							class="promo-code-button" 
							onclick={copyPromoCode}
							title="Click to copy"
						>
							<span class="code-text">EARLY2025</span>
							<div class="copy-icon-container">
								<Copy class="w-4 h-4" />
							</div>
						</button>
					</div>
					{#if showCopied}
						<p class="copy-feedback" in:fade={{ duration: 200 }}>
							✓ Code copied to clipboard
						</p>
					{/if}
				</div>
				
				<!-- CTA Button -->
				<div class="cta-section">
					<button 
						class="button-primary button-large button-gap"
						onclick={() => window.location.href = '/auth/register'}
					>
						<Rocket class="w-5 h-5" />
						Join Early Access
					</button>
					<p class="cta-note">
						Early access includes founding member benefits and permanent pricing protection.
					</p>
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
		border: 2px solid var(--color-primary-500);
		color: var(--text-primary);
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		font-weight: 600;
		font-size: 0.875rem;
		box-shadow: var(--shadow-sm);
	}

	/* Code highlight - matches HeroSection promo styling */
	.code-highlight {
		color: var(--text-primary);
		background: var(--color-primary-100);
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-md);
		font-weight: 700;
		border: 1px solid var(--color-primary-300);
		box-shadow: var(--shadow-sm);
	}
	
	/* Counter Section */
	.counter-section {
		display: flex;
		justify-content: center;
	}
	
	/* Counter Card - matches HeroSection promo card */
	.counter-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 2.5rem 3.5rem;
		box-shadow: var(--shadow-md);
		transition: all var(--transition-base) ease;
		position: relative;
		overflow: hidden;
	}

	/* Subtle accent line on hover - matches HeroSection */
	.counter-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-primary-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.counter-card:hover::before {
		transform: scaleX(1);
	}
	
	.counter-card:hover {
		box-shadow: var(--shadow-lg);
		transform: translateY(-2px);
		border-color: var(--border-secondary);
	}
	
	.counter-content {
		text-align: center;
	}

	.counter-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-primary-500);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 1rem;
		box-shadow: var(--shadow-md);
	}
	
	.counter-number {
		display: block;
		font-size: 3.5rem;
		font-weight: 800;
		color: var(--text-primary);
		line-height: 1;
		margin-bottom: 0.5rem;
	}
	
	.counter-label {
		font-size: 1.125rem;
		color: var(--text-secondary);
		font-weight: 600;
		display: block;
		margin-bottom: 1.5rem;
	}
	
	.spots-info {
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-primary);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.spots-remaining {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-primary-600);
	}
	
	.spots-total {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 500;
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
	
	/* Benefit Cards - matches HeroSection trust cards */
	.benefit-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 2rem;
		transition: all var(--transition-base) ease;
		box-shadow: var(--shadow-sm);
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Subtle accent line on hover - matches HeroSection */
	.benefit-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-primary-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.benefit-card:hover::before {
		transform: scaleX(1);
	}
	
	.benefit-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}
	
	.benefit-icon {
		width: 4rem;
		height: 4rem;
		border-radius: var(--radius-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--shadow-md);
	}

	.benefit-icon--coral {
		background: var(--color-primary-500);
	}

	.benefit-icon--orange {
		background: var(--color-secondary-500);
	}

	.benefit-icon--teal {
		background: var(--color-success-500);
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
		margin: 0;
	}
	
	/* Action Section - matches HeroSection promo card */
	.action-section {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 3rem 2.5rem;
		max-width: 900px;
		margin: 4rem auto 0;
		box-shadow: var(--shadow-md);
		position: relative;
		overflow: hidden;
	}

	/* Subtle accent line on hover - matches HeroSection */
	.action-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--color-primary-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.action-section:hover::before {
		transform: scaleX(1);
	}
	
	.action-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		align-items: center;
	}
	
	/* Promo Section */
	.promo-section {
		text-align: left;
	}

	.promo-badge {
		background: var(--color-success-100);
		border: 1px solid var(--color-success-300);
		color: var(--color-success-700);
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 600;
		display: inline-block;
	}
	
	.promo-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
	}
	
	.promo-code-display {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	
	.promo-label {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	
	/* Promo Code Button - matches HeroSection promo button */
	.promo-code-button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		background: var(--bg-secondary);
		border: 2px dashed var(--border-secondary);
		border-radius: var(--radius-lg);
		padding: 1rem 1.25rem;
		cursor: pointer;
		transition: all var(--transition-base) ease;
		width: 100%;
	}
	
	.promo-code-button:hover {
		background: var(--bg-tertiary);
		border-color: var(--color-primary-500);
	}
	
	.code-text {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: 0.1em;
	}

	.copy-icon-container {
		background: var(--color-primary-100);
		border-radius: var(--radius-md);
		padding: 0.5rem;
		color: var(--color-primary-600);
	}

	.copy-feedback {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-align: center;
		margin-top: 0.5rem;
	}

	/* CTA Section */
	.cta-section {
		text-align: center;
	}

	.cta-note {
		margin-top: 1rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.counter-card {
			padding: 2rem 1.5rem;
		}

		.counter-number {
			font-size: 2.5rem;
		}

		.benefits-grid {
			grid-template-columns: 1fr;
		}

		.benefit-card {
			padding: 1.5rem;
		}

		.action-content {
			grid-template-columns: 1fr;
			gap: 2rem;
			text-align: center;
		}

		.promo-section {
			text-align: center;
		}

		.action-section {
			padding: 2rem 1.5rem;
		}
	}

	@media (max-width: 480px) {
		.counter-card {
			padding: 1.5rem 1rem;
		}

		.promo-title {
			font-size: 1.5rem;
		}
	}
</style> 
<script lang="ts">
	import { fade } from 'svelte/transition';
	import Rocket from 'lucide-svelte/icons/rocket';
	import Users from 'lucide-svelte/icons/users';
	import Zap from 'lucide-svelte/icons/zap';
	import Star from 'lucide-svelte/icons/star';
	import Copy from 'lucide-svelte/icons/copy';
	
	// State for copy feedback
	let showCopied = $state(false);

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

<section class="py-20" style="background: var(--bg-primary);" in:fade={{ duration: 600 }}>
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="cta-card">
			<div class="text-center mb-8">
				<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" 
					style="background: var(--color-primary-100); color: var(--color-primary-700);">
					<Rocket class="w-4 h-4" />
					<span class="text-sm font-medium">Early Access Available</span>
				</div>
				<h2 class="text-3xl font-bold mb-4" style="color: var(--text-primary);">
					Ready to Transform Your Tour Business?
				</h2>
				<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
					Use code <strong>EARLY2025</strong> to unlock founding member benefits and start building your tour empire today.
				</p>
			</div>
			
			<div class="benefits-grid mb-12">
				<div class="benefit-item">
					<div class="benefit-icon">
						<Star class="w-5 h-5" />
					</div>
					<div class="benefit-content">
						<h4 class="benefit-title">Founding Member Status</h4>
						<p class="benefit-description">Lock in special pricing forever</p>
					</div>
				</div>
				
				<div class="benefit-item">
					<div class="benefit-icon">
						<Users class="w-5 h-5" />
					</div>
					<div class="benefit-content">
						<h4 class="benefit-title">Direct Founder Access</h4>
						<p class="benefit-description">Shape product development with your feedback</p>
					</div>
				</div>
				
				<div class="benefit-item">
					<div class="benefit-icon">
						<Zap class="w-5 h-5" />
					</div>
					<div class="benefit-content">
						<h4 class="benefit-title">Priority Support</h4>
						<p class="benefit-description">Get help when you need it most</p>
					</div>
				</div>
			</div>
			
			<!-- Promo Code Section -->
			<div class="promo-section mb-8">
				<div class="promo-code-display">
					<span class="promo-label-small">Early Access Code:</span>
					<button 
						class="promo-code-small" 
						onclick={copyPromoCode}
						title="Click to copy"
					>
						<span class="code-text">EARLY2025</span>
						<Copy class="w-4 h-4 copy-icon-small" />
					</button>
				</div>
				{#if showCopied}
					<p class="copy-feedback-small" in:fade={{ duration: 200 }}>
						✓ Code copied to clipboard
					</p>
				{/if}
			</div>
			
			<div class="cta-actions">
				<a href="/auth/register" class="cta-button primary">
					<Rocket class="w-5 h-5" />
					Get Started Free
				</a>
			</div>
			
			<p class="cta-note">
				<strong>Limited Time:</strong> Founding member benefits available for first 100 users only.
			</p>
		</div>
	</div>
</section>

<style>
	.cta-card {
		background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
		border: 1px solid var(--border-primary);
		border-radius: 1.5rem;
		padding: 3rem 2rem;
		text-align: center;
		position: relative;
		overflow: hidden;
		box-shadow: var(--shadow-sm);
		transition: all 0.3s ease;
	}
	
	.cta-card:hover {
		box-shadow: var(--shadow-md);
		border-color: var(--border-secondary);
	}
	
	.cta-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, var(--color-primary-400), var(--color-success-400), var(--color-warning-400));
		border-radius: 1.5rem 1.5rem 0 0;
	}
	
	.benefits-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		max-width: 800px;
		margin: 0 auto;
	}
	
	.benefit-item {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		text-align: left;
		padding: 1.5rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		transition: all 0.2s ease;
		box-shadow: var(--shadow-sm);
	}
	
	.benefit-item:hover {
		border-color: var(--border-secondary);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}
	
	.benefit-icon {
		width: 3rem;
		height: 3rem;
		background: var(--color-primary-100);
		color: var(--color-primary-600);
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 0.25rem;
	}
	
	.benefit-content {
		flex: 1;
		min-width: 0;
	}
	
	.benefit-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
		line-height: 1.3;
	}
	
	.benefit-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	
	.cta-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		align-items: center;
		margin-top: 2rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}
	
	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
		min-width: 160px;
		justify-content: center;
		white-space: nowrap;
	}
	
	.cta-button.primary {
		background: var(--color-primary-600);
		color: white;
		border: 1px solid var(--color-primary-600);
		box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
	}
	
	.cta-button.primary:hover {
		background: var(--color-primary-700);
		border-color: var(--color-primary-700);
		transform: translateY(-1px);
		box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);
	}
	
	.cta-button.secondary {
		background: var(--bg-primary);
		color: var(--text-primary);
		border: 1px solid var(--border-primary);
	}
	
	.cta-button.secondary:hover {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}
	
	.cta-note {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		max-width: 500px;
		margin: 0 auto;
		line-height: 1.5;
	}
	
	/* Mobile and tablet responsive styles */
	@media (max-width: 1024px) {
		.benefits-grid {
			grid-template-columns: repeat(3, 1fr);
			gap: 1.25rem;
			max-width: 700px;
		}
	}
	
	@media (max-width: 900px) {
		.benefits-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
			max-width: 400px;
		}
	}
	
	@media (max-width: 768px) {
		.cta-card {
			padding: 2.5rem 1.5rem;
			border-radius: 1rem;
		}
		
		.benefits-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
			max-width: none;
		}
		
		.benefit-item {
			padding: 1.25rem;
			gap: 0.75rem;
		}
		
		.benefit-icon {
			width: 2.5rem;
			height: 2.5rem;
		}
		
		.benefit-title {
			font-size: 1rem;
		}
		
		.benefit-description {
			font-size: 0.8rem;
		}
		
		.cta-actions {
			gap: 0.75rem;
		}
		
		.cta-button {
			padding: 0.875rem 1.5rem;
			font-size: 0.8rem;
			min-width: 140px;
		}
	}
	
	@media (max-width: 480px) {
		.cta-card {
			padding: 2rem 1rem;
			margin: 0 -0.5rem;
		}
		
		.cta-actions {
			flex-direction: column;
			gap: 0.75rem;
		}
		
		.cta-button {
			width: 100%;
			min-width: unset;
			padding: 1rem;
		}
		
		.benefit-item {
			padding: 1rem;
		}
		
		.benefit-icon {
			width: 2.25rem;
			height: 2.25rem;
		}
		
		.cta-note {
			font-size: 0.8rem;
			padding: 0 0.5rem;
		}
	}
	
	/* Enhanced mobile layout for very small screens */
	@media (max-width: 375px) {
		.cta-card {
			padding: 1.5rem 0.75rem;
		}
		
		h2 {
			font-size: 1.5rem !important;
			line-height: 1.3;
		}
		
		.benefit-title {
			font-size: 0.95rem;
		}
		
		.benefit-description {
			font-size: 0.75rem;
		}
	}
	
	/* Promo Code Section Styles */
	.promo-section {
		text-align: center;
		padding-top: 2rem;
		border-top: 1px solid var(--border-primary);
		margin-top: 1rem;
	}
	
	.promo-code-display {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 0.75rem 1rem;
		margin: 0 auto;
	}
	
	.promo-label-small {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}
	
	.promo-code-small {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-primary-50);
		border: 1px solid var(--color-primary-200);
		border-radius: 0.375rem;
		padding: 0.5rem 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.promo-code-small:hover {
		background: var(--color-primary-100);
		border-color: var(--color-primary-300);
		transform: scale(1.02);
	}
	
	.code-text {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-primary-700);
		letter-spacing: 0.05em;
	}
	
	.copy-icon-small {
		color: var(--color-primary-600);
		transition: transform 0.2s ease;
	}
	
	.promo-code-small:hover .copy-icon-small {
		transform: scale(1.1);
	}
	
	.copy-feedback-small {
		font-size: 0.75rem;
		color: var(--color-success-600);
		margin-top: 0.5rem;
	}
	
	@media (max-width: 768px) {
		.promo-section {
			padding-top: 1.5rem;
		}
		
		.promo-code-display {
			flex-direction: column;
			gap: 0.5rem;
			padding: 1rem;
		}
		
		.promo-label-small {
			font-size: 0.8rem;
		}
		
		.code-text {
			font-size: 0.8rem;
		}
	}
</style> 
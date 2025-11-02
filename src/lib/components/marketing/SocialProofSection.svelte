<script lang="ts">
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
</script>

<div class="social-proof-section">
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-16 py-8 sm:py-20">
		
		<!-- Section Divider -->
		<hr class="section-divider" aria-hidden="true" />
		
		<!-- Beta Tester Callout -->
		<div class="beta-callout">
			<div class="beta-callout-content">
				<div class="beta-callout-icon">
					<Sparkles class="w-12 h-12" />
				</div>
				<h3 class="beta-callout-title">Join Our Growing Community</h3>
				<p class="beta-callout-text">
					We're working with 50 tour guides across 17 countries to build the perfect booking platform.<br />
					<strong>Be part of Beta 2 and help shape the future of tour bookings.</strong>
				</p>
				<div class="beta-callout-features">
					<div class="feature-item">
						<CheckCircle class="w-5 h-5" />
						<span>0% Commission Forever</span>
					</div>
					<div class="feature-item">
						<CheckCircle class="w-5 h-5" />
						<span>Direct Customer Relationships</span>
					</div>
					<div class="feature-item">
						<CheckCircle class="w-5 h-5" />
						<span>QR Code Instant Bookings</span>
					</div>
				</div>
			</div>
		</div>
		
	</div>
</div>

<style>
	/* Section Background - Clean & Professional */
	.social-proof-section {
		background: linear-gradient(
			180deg,
			var(--bg-secondary) 0%,
			var(--bg-primary) 100%
		);
		position: relative;
		overflow: hidden;
	}
	
	/* Section Divider */
	.section-divider {
		border: none;
		max-width: 14rem;
		height: 8px;
		background: transparent;
		margin: 0 auto 4rem;
		position: relative;
		display: flex;
		align-items: center;
		overflow: visible;
	}
	
	.section-divider::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--border-secondary) 50%,
			transparent 100%
		);
	}
	
	.section-divider::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 8px;
		height: 8px;
		background: var(--primary);
		border-radius: 50%;
		opacity: 0.6;
		z-index: 1;
		box-shadow: 0 0 0 2px var(--bg-secondary);
	}
	
	/* Beta Callout */
	.beta-callout {
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: var(--radius-xl);
		padding: 3rem 2rem;
		text-align: center;
		box-shadow: var(--shadow-md);
		transition: box-shadow var(--transition-slow);
		position: relative;
		overflow: hidden;
	}
	
	.beta-callout::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.04), transparent);
		border-radius: var(--radius-xl);
		opacity: 1;
		pointer-events: none;
	}

	.beta-callout:hover {
		box-shadow: var(--shadow-lg);
	}

	.beta-callout-content {
		max-width: 800px;
		margin: 0 auto;
		position: relative;
		z-index: 1;
	}

	.beta-callout-icon {
		display: inline-flex;
		margin-bottom: 1.5rem;
		opacity: 0.9;
	}
	
	.beta-callout-icon :global(svg) {
		color: var(--color-accent-600);
	}

	.beta-callout-title {
		font-size: 2rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		letter-spacing: -0.025em;
		line-height: 1.2;
	}

	.beta-callout-text {
		font-size: 1.125rem;
		line-height: 1.7;
		color: var(--text-secondary);
		margin-bottom: 2rem;
		letter-spacing: -0.01em;
	}

	.beta-callout-text strong {
		color: var(--primary);
		font-weight: 600;
	}

	.beta-callout-features {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: center;
		align-items: center;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
		padding: 0.75rem 1.25rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 9999px;
		box-shadow: var(--shadow-xs);
		transition: all var(--transition-base);
		letter-spacing: -0.01em;
	}

	.feature-item:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
		border-color: var(--color-accent-600);
	}
	
	.feature-item :global(svg) {
		color: var(--color-accent-600);
		flex-shrink: 0;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.section-divider {
			margin: 0 auto 3rem;
			max-width: 10rem;
		}

		.beta-callout {
			padding: 2.5rem 1.5rem;
			border-radius: var(--radius-lg);
		}

		.beta-callout-title {
			font-size: 1.625rem;
		}

		.beta-callout-text {
			font-size: 1rem;
			margin-bottom: 1.75rem;
		}

		.beta-callout-features {
			flex-direction: column;
			gap: 0.875rem;
		}

		.feature-item {
			width: 100%;
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		.section-divider {
			margin: 0 auto 2.5rem;
			max-width: 8rem;
		}

		.beta-callout {
			padding: 2rem 1.25rem;
			border-radius: var(--radius-md);
		}
		
		.beta-callout-icon :global(svg) {
			width: 2.5rem;
			height: 2.5rem;
		}

		.beta-callout-title {
			font-size: 1.375rem;
			margin-bottom: 1rem;
		}

		.beta-callout-text {
			font-size: 0.9375rem;
			margin-bottom: 1.5rem;
			line-height: 1.6;
		}

		.beta-callout-features {
			gap: 0.75rem;
		}

		.feature-item {
			font-size: 0.875rem;
			padding: 0.625rem 1rem;
		}

		.feature-item :global(svg) {
			width: 1rem;
			height: 1rem;
		}
	}
</style>


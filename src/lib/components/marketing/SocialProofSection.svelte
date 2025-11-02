<script lang="ts">
	import Users from 'lucide-svelte/icons/users';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Star from 'lucide-svelte/icons/star';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
</script>

<div class="social-proof-section">
	<div class="text-center mb-12">
		<h2 class="text-3xl sm:text-4xl font-bold mb-4" style="color: var(--text-primary);">
			Trusted by Tour Guides Worldwide
		</h2>
		<p class="text-lg" style="color: var(--text-secondary);">
			Join tour professionals already using Zaur to grow their business
		</p>
	</div>

	<!-- Stats Grid -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon">
				<Users class="w-8 h-8" style="color: var(--color-primary-600);" />
			</div>
			<div class="stat-number">50</div>
			<div class="stat-label">Beta Testers</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">
				<MapPin class="w-8 h-8" style="color: var(--color-success-600);" />
			</div>
			<div class="stat-number">17</div>
			<div class="stat-label">Countries</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">
				<TrendingUp class="w-8 h-8" style="color: var(--color-accent-600);" />
			</div>
			<div class="stat-number">3+</div>
			<div class="stat-label">Tours Created</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">
				<Star class="w-8 h-8" style="color: var(--color-warning-500);" />
			</div>
			<div class="stat-number">Beta 2</div>
			<div class="stat-label">Active Now</div>
		</div>
	</div>

	<!-- Beta Tester Callout - More honest than fake testimonials -->
	<div class="beta-callout">
		<div class="beta-callout-content">
			<div class="beta-callout-icon">
				<Sparkles class="w-12 h-12" style="color: var(--color-primary-600);" />
			</div>
			<h3 class="beta-callout-title">Join Our Growing Community</h3>
			<p class="beta-callout-text">
				We're working with 50 tour guides across 17 countries to build the perfect booking platform. 
				<strong>Be part of Beta 2 and help shape the future of tour bookings.</strong>
			</p>
			<div class="beta-callout-features">
				<div class="feature-item">
					<CheckCircle class="w-5 h-5" style="color: var(--color-success-600);" />
					<span>0% Commission Forever</span>
				</div>
				<div class="feature-item">
					<CheckCircle class="w-5 h-5" style="color: var(--color-success-600);" />
					<span>Direct Customer Relationships</span>
				</div>
				<div class="feature-item">
					<CheckCircle class="w-5 h-5" style="color: var(--color-success-600);" />
					<span>QR Code Instant Bookings</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.social-proof-section {
		width: 100%;
		max-width: 1536px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	@media (min-width: 640px) {
		.social-proof-section {
			padding: 0 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.social-proof-section {
			padding: 0 4rem;
		}
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 2rem;
		margin-bottom: 4rem;
	}

	.stat-card {
		text-align: center;
		padding: 3rem 2rem;
		background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
		border: 2px solid var(--border-primary);
		border-radius: 1.5rem;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.stat-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, var(--color-primary-500), var(--color-accent-500));
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.stat-card:hover {
		transform: translateY(-8px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
		border-color: var(--color-primary-400);
	}

	.stat-card:hover::before {
		opacity: 1;
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 5rem;
		height: 5rem;
		margin: 0 auto 1.5rem;
		background: var(--gradient-subtle-primary);
		border-radius: 50%;
		border: 2px solid var(--color-primary-200);
	}

	.stat-number {
		font-size: 3rem;
		font-weight: 800;
		background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: 0.75rem;
		line-height: 1;
	}

	.stat-label {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Beta Callout */
	.beta-callout {
		background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-accent-50) 100%);
		border: 2px solid var(--color-primary-300);
		border-radius: 2rem;
		padding: 4rem 3rem;
		text-align: center;
		margin-top: 2rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
	}

	.beta-callout-content {
		max-width: 800px;
		margin: 0 auto;
	}

	.beta-callout-icon {
		display: inline-flex;
		margin-bottom: 1.5rem;
		animation: pulse 2s ease infinite;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	.beta-callout-title {
		font-size: 2.5rem;
		font-weight: 800;
		background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-600));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
	}

	.beta-callout-text {
		font-size: 1.25rem;
		line-height: 1.7;
		color: var(--text-secondary);
		margin-bottom: 2.5rem;
		max-width: 900px;
		margin-left: auto;
		margin-right: auto;
	}

	.beta-callout-text strong {
		color: var(--color-primary-600);
		font-weight: 600;
	}

	.beta-callout-features {
		display: flex;
		flex-wrap: wrap;
		gap: 2rem;
		justify-content: center;
		align-items: center;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1.0625rem;
		font-weight: 600;
		color: var(--text-primary);
		padding: 0.75rem 1.5rem;
		background: white;
		border-radius: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		transition: all 0.2s ease;
	}

	.feature-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	}

	/* Mobile Responsiveness */
	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem;
		}

		.stat-card {
			padding: 2rem 1rem;
		}

		.stat-icon {
			width: 4rem;
			height: 4rem;
		}

		.stat-number {
			font-size: 2.25rem;
		}

		.beta-callout {
			padding: 2.5rem 1.5rem;
		}

		.beta-callout-title {
			font-size: 1.75rem;
		}

		.beta-callout-text {
			font-size: 1.0625rem;
		}

		.beta-callout-features {
			flex-direction: column;
			gap: 1rem;
		}

		.feature-item {
			width: 100%;
			justify-content: center;
		}
	}

	/* Narrow smartphones */
	@media (max-width: 480px) {
		.social-proof-section {
			padding: 0 0.75rem;
		}

		.stats-grid {
			gap: 0.75rem;
		}

		.stat-card {
			padding: 1.5rem 1rem;
			border-radius: 1rem;
		}

		.stat-icon {
			width: 3.5rem;
			height: 3.5rem;
			margin-bottom: 1rem;
		}

		.stat-icon :global(svg) {
			width: 1.75rem;
			height: 1.75rem;
		}

		.stat-number {
			font-size: 2rem;
		}

		.stat-label {
			font-size: 0.8125rem;
		}

		.beta-callout {
			padding: 2rem 1.25rem;
			border-radius: 1.5rem;
		}

		.beta-callout-title {
			font-size: 1.5rem;
		}

		.beta-callout-text {
			font-size: 0.9375rem;
			margin-bottom: 1.5rem;
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

	/* Dark mode adjustments */
	:root[data-theme='dark'] .stat-card {
		background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
	}

	:root[data-theme='dark'] .beta-callout {
		background: linear-gradient(135deg, rgba(var(--color-primary-500-rgb), 0.1) 0%, rgba(var(--color-accent-500-rgb), 0.1) 100%);
	}

	:root[data-theme='dark'] .feature-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
	}
</style>


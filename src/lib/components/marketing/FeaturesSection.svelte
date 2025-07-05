<script lang="ts">
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Calendar from 'lucide-svelte/icons/calendar';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Phone from 'lucide-svelte/icons/phone';
	import Smartphone from 'lucide-svelte/icons/smartphone';
	import Shield from 'lucide-svelte/icons/shield';
	import Zap from 'lucide-svelte/icons/zap';
	import Download from 'lucide-svelte/icons/download';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Compass from 'lucide-svelte/icons/compass';
	import Heart from 'lucide-svelte/icons/heart';
</script>

<!-- Professional Features Section -->
<section id="features" class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="text-center mb-16">
			<div class="professional-badge mb-6">
				<Compass class="w-4 h-4" />
				<span>Professional Tools</span>
			</div>
			<h2 class="marketing-heading marketing-heading-lg mb-4">
				Everything You Need to Succeed
			</h2>
			<p class="text-lg max-w-2xl mx-auto text-secondary">
				Built specifically for tour guides, with zero risk and all the features that matter for your business.
			</p>
		</div>
		
		<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
			<!-- Revenue Feature -->
			<div class="professional-feature-card">
				<div class="professional-icon professional-icon--coral">
					<DollarSign class="w-6 h-6" strokeWidth={2} />
				</div>
				<div class="feature-content">
					<h3 class="feature-title">Keep 100% of Revenue</h3>
					<p class="feature-description">
						No commission fees, just a simple monthly subscription. Get paid directly to your bank account.
					</p>
				</div>
			</div>

			<!-- Setup Feature -->
			<div class="professional-feature-card">
				<div class="professional-icon professional-icon--orange">
					<Zap class="w-6 h-6" strokeWidth={2} />
				</div>
				<div class="feature-content">
					<h3 class="feature-title">5-Minute Setup</h3>
					<p class="feature-description">
						Create your first tour and start accepting bookings in under 5 minutes. No technical skills needed.
					</p>
				</div>
			</div>

			<!-- Scheduling Feature -->
			<div class="professional-feature-card">
				<div class="professional-icon professional-icon--teal">
					<Calendar class="w-6 h-6" strokeWidth={2} />
				</div>
				<div class="feature-content">
					<h3 class="feature-title">Smart Scheduling</h3>
					<p class="feature-description">
						Manage availability, prevent double bookings, and set recurring schedules effortlessly.
					</p>
				</div>
			</div>

			<!-- Security Feature -->
			<div class="professional-feature-card">
				<div class="professional-icon professional-icon--navy">
					<CreditCard class="w-6 h-6" strokeWidth={2} />
				</div>
				<div class="feature-content">
					<h3 class="feature-title">Secure Payments</h3>
					<p class="feature-description">
						Enterprise-grade security with Stripe. Instant payouts, no chargebacks, full PCI compliance.
					</p>
				</div>
			</div>

			<!-- Analytics Feature -->
			<div class="professional-feature-card">
				<div class="professional-icon professional-icon--coral">
					<BarChart3 class="w-6 h-6" strokeWidth={2} />
				</div>
				<div class="feature-content">
					<h3 class="feature-title">Business Analytics</h3>
					<p class="feature-description">
						Track conversion rates, understand booking patterns, and optimize your tours for growth.
					</p>
				</div>
			</div>

			<!-- Data Feature -->
			<div class="professional-feature-card">
				<div class="professional-icon professional-icon--teal">
					<Download class="w-6 h-6" strokeWidth={2} />
				</div>
				<div class="feature-content">
					<h3 class="feature-title">Keep Your Data</h3>
					<p class="feature-description">
						Export your customer data anytime. Cancel without losing your business information or contacts.
					</p>
				</div>
			</div>
		</div>

		<!-- Trust & Guarantee Section -->
		<div class="mt-20">
			<div class="text-center mb-12">
				<div class="professional-badge mb-6">
					<Heart class="w-4 h-4" />
					<span>Your Success Guaranteed</span>
				</div>
				<h3 class="marketing-heading marketing-heading-md mb-4">
					Zero Risk. 100% Satisfaction.
				</h3>
				<p class="text-lg max-w-2xl mx-auto text-secondary">
					We're so confident you'll love Zaur, we guarantee your success.
				</p>
			</div>

			<div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
				<div class="trust-card">
					<div class="trust-icon trust-icon--coral">
						<span class="trust-icon-text">FREE</span>
					</div>
					<h4 class="trust-title">Free Forever Plan</h4>
					<p class="trust-description">
						Start with our Free plan. No credit card required, no hidden fees.
					</p>
				</div>

				<div class="trust-card">
					<div class="trust-icon trust-icon--orange">
						<span class="trust-icon-text">24/7</span>
					</div>
					<h4 class="trust-title">Cancel Anytime</h4>
					<p class="trust-description">
						No contracts, no commitments. Cancel with one click whenever you want.
					</p>
				</div>

				<div class="trust-card">
					<div class="trust-icon trust-icon--navy">
						<span class="trust-icon-text">100%</span>
					</div>
					<h4 class="trust-title">Satisfaction Promise</h4>
					<p class="trust-description">
						Not happy? We'll work with you until you are, or help you migrate elsewhere.
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
		border: 2px solid var(--color-coral-500);
		color: var(--text-primary);
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		font-weight: 600;
		font-size: 0.875rem;
		box-shadow: var(--shadow-sm);
	}

	/* Professional Feature Cards - matches HeroSection trust cards */
	.professional-feature-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		transition: all var(--transition-base) ease;
		box-shadow: var(--shadow-sm);
		position: relative;
		overflow: hidden;
	}

	/* Subtle accent line on hover - matches HeroSection */
	.professional-feature-card::before {
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
	
	.professional-feature-card:hover::before {
		transform: scaleX(1);
	}

	.professional-feature-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}

	/* Professional Icons */
	.professional-icon {
		width: 4rem;
		height: 4rem;
		border-radius: var(--radius-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		box-shadow: var(--shadow-md);
	}

	.professional-icon--coral {
		background: var(--color-coral-500);
	}

	.professional-icon--orange {
		background: var(--color-warm-orange-500);
	}

	.professional-icon--teal {
		background: var(--color-pro-teal-500);
	}

	.professional-icon--navy {
		background: var(--color-deep-navy-900);
	}

	/* Feature Content */
	.feature-content {
		flex: 1;
	}

	.feature-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		line-height: 1.3;
	}

	.feature-description {
		font-size: 1rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	/* Trust Cards - matches HeroSection trust cards */
	.trust-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 2rem;
		text-align: center;
		transition: all var(--transition-base) ease;
		box-shadow: var(--shadow-sm);
		position: relative;
		overflow: hidden;
	}

	/* Subtle accent line on hover - matches HeroSection */
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

	/* Trust Icons */
	.trust-icon {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.5rem;
		color: white;
		box-shadow: var(--shadow-md);
	}

	.trust-icon--coral {
		background: var(--color-coral-500);
	}

	.trust-icon--orange {
		background: var(--color-warm-orange-500);
	}

	.trust-icon--navy {
		background: var(--color-deep-navy-900);
	}

	.trust-icon-text {
		font-size: 0.75rem;
		font-weight: 700;
		text-align: center;
		line-height: 1;
	}

	/* Trust Content */
	.trust-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
	}

	.trust-description {
		font-size: 1rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.trust-card {
			padding: 1.5rem;
		}

		.trust-icon {
			width: 3.5rem;
			height: 3.5rem;
			margin-bottom: 1rem;
		}

		.trust-icon-text {
			font-size: 0.6875rem;
		}

		.trust-title {
			font-size: 1rem;
		}

		.trust-description {
			font-size: 0.875rem;
		}

		.feature-title {
			font-size: 1.125rem;
		}

		.feature-description {
			font-size: 0.875rem;
		}

		.professional-feature-card {
			padding: 1.5rem;
		}
	}
</style> 
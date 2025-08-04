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
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
</script>

<!-- Professional Features Section -->
<div class="text-center mb-16">
	<div class="professional-badge mb-6">
		<Compass class="w-4 h-4" />
		<span>Discovery + Bookings</span>
	</div>
	<h2 class="marketing-heading marketing-heading-lg mb-4">
		Get Found. Get Booked.
	</h2>
	<p class="text-lg max-w-2xl mx-auto text-secondary">
		The first platform that helps customers discover your tours AND book instantly. No commission fees on either.
	</p>
</div>

<div class="features-grid">
	<!-- Revenue Feature -->
	<div class="card card--elevated feature-card">
		<div class="professional-icon professional-icon--primary">
			<DollarSign class="w-6 h-6" strokeWidth={2} />
		</div>
		<div class="feature-content">
			<h3 class="card-title card-title--small">Keep 100% of Revenue</h3>
			<p class="card-description">
				No commission fees, just a simple monthly subscription. Get paid directly to your bank account.
			</p>
		</div>
	</div>

	<!-- Discovery Feature -->
	<div class="card card--elevated feature-card">
		<div class="professional-icon professional-icon--primary">
			<Compass class="w-6 h-6" strokeWidth={2} />
		</div>
		<div class="feature-content">
			<h3 class="card-title card-title--small">Built-in Tour Discovery</h3>
			<p class="card-description">
				Customers find your tours through our discovery platform. Get organic bookings without marketing costs.
			</p>
		</div>
	</div>

	<!-- Setup Feature -->
	<div class="card card--elevated feature-card">
		<div class="professional-icon professional-icon--warning">
			<Zap class="w-6 h-6" strokeWidth={2} />
		</div>
		<div class="feature-content">
			<h3 class="card-title card-title--small">5-Minute Setup</h3>
			<p class="card-description">
				Create your first tour and start accepting bookings in under 5 minutes. No technical skills needed.
			</p>
		</div>
	</div>

	<!-- Scheduling Feature -->
	<div class="card card--elevated feature-card">
		<div class="professional-icon professional-icon--success">
			<Calendar class="w-6 h-6" strokeWidth={2} />
		</div>
		<div class="feature-content">
			<h3 class="card-title card-title--small">Smart Scheduling</h3>
			<p class="card-description">
				Manage availability, prevent double bookings, and set recurring schedules effortlessly.
			</p>
		</div>
	</div>

	<!-- Security Feature -->
	<div class="card card--elevated feature-card">
		<div class="professional-icon professional-icon--secondary">
			<CreditCard class="w-6 h-6" strokeWidth={2} />
		</div>
		<div class="feature-content">
			<h3 class="card-title card-title--small">Secure Payments</h3>
			<p class="card-description">
				Enterprise-grade security with Stripe. Instant payouts, no chargebacks, full PCI compliance.
			</p>
		</div>
	</div>

	<!-- Analytics Feature -->
	<div class="card card--elevated feature-card">
		<div class="professional-icon professional-icon--primary">
			<BarChart3 class="w-6 h-6" strokeWidth={2} />
		</div>
		<div class="feature-content">
			<h3 class="card-title card-title--small">Business Analytics</h3>
			<p class="card-description">
				Track conversion rates, understand booking patterns, and optimize your tours for growth.
			</p>
		</div>
	</div>

	<!-- Data Feature -->
	<div class="card card--elevated feature-card">
		<div class="professional-icon professional-icon--success">
			<Download class="w-6 h-6" strokeWidth={2} />
		</div>
		<div class="feature-content">
			<h3 class="card-title card-title--small">Keep Your Data</h3>
			<p class="card-description">
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

	<div class="card-grid card-grid--3 trust-grid max-w-4xl mx-auto">
		<div class="card card--elevated trust-card">
			<div class="trust-icon trust-icon--primary">
				<span class="trust-icon-text">FREE</span>
			</div>
			<h4 class="card-title card-title--small">Free Forever Plan</h4>
			<p class="card-description">
				Start with our Free plan. No credit card required, no hidden fees.
			</p>
		</div>

		<div class="card card--elevated trust-card">
			<div class="trust-icon trust-icon--warning">
				<span class="trust-icon-text">24/7</span>
			</div>
			<h4 class="card-title card-title--small">Cancel Anytime</h4>
			<p class="card-description">
				No contracts, no commitments. Cancel with one click whenever you want.
			</p>
		</div>

		<div class="card card--elevated trust-card">
			<div class="trust-icon trust-icon--secondary">
				<span class="trust-icon-text">100%</span>
			</div>
			<h4 class="card-title card-title--small">Satisfaction Promise</h4>
			<p class="card-description">
				Not happy? We'll work with you until you are, or help you migrate elsewhere.
			</p>
		</div>
	</div>
</div>

<!-- Beta Program Disclaimer -->
<div class="mt-16">
	<div class="card card--primary beta-disclaimer-card max-w-3xl mx-auto">
		<div class="card-header card-header--center">
			<div class="flex items-center justify-center gap-2 mb-4">
				<FlaskConical class="w-5 h-5" />
				<span class="font-semibold">Beta Program Notice</span>
			</div>
			<p class="card-description card-description--small">
				<strong>Currently in Beta:</strong> Features shown are available to beta members. 
				Some advanced features may be refined based on feedback from our beta community. 
				<a href="/beta/apply" class="text-primary underline font-medium">Apply for beta access</a> 
				to help shape these features and receive 30% lifetime discount.
			</p>
		</div>
	</div>
</div>

<style>
	/* Professional badge with subtle retro border - matches HeroSection */
	.professional-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--bg-primary);
		border: 2px solid var(--primary);
		color: var(--text-primary);
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		font-weight: 600;
		font-size: 0.875rem;
		box-shadow: var(--shadow-sm);
	}

	/* Clean responsive grid layout for 7 cards */
	.features-grid {
		display: grid;
		gap: 2rem;
		grid-template-columns: 1fr;
	}

	/* Tablet and Desktop: 2 columns gives balanced 4+3 layout */
	@media (min-width: 768px) {
		.features-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	/* Large Desktop: 3 columns with better spacing */
	@media (min-width: 1280px) {
		.features-grid {
			grid-template-columns: repeat(3, 1fr);
			max-width: 1200px;
			margin: 0 auto;
		}
		
		/* Center the last card by spanning it and using auto margins */
		.features-grid .feature-card:nth-child(7) {
			grid-column: 2 / 3;
		}
	}

	/* Feature cards - Enhanced with card system */
	.feature-card {
		/* Card system handles base styling */
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Professional Icons */
	.professional-icon {
		width: 4rem;
		height: 4rem;
		border-radius: var(--radius-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white !important;
		box-shadow: var(--shadow-md);
	}

	.professional-icon--primary {
		background: var(--primary) !important;
		color: white !important;
	}

	.professional-icon--warning {
		background: var(--warning) !important;
		color: white !important;
	}

	.professional-icon--success {
		background: var(--success) !important;
		color: white !important;
	}

	.professional-icon--secondary {
		background: var(--secondary) !important;
		color: white !important;
	}

	/* Feature Content */
	.feature-content {
		flex: 1;
	}

	/* Trust cards - Enhanced with card system */
	.trust-card {
		/* Card system handles base styling */
		text-align: center;
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

	.trust-icon--primary {
		background: var(--primary) !important;
		color: white !important;
	}

	.trust-icon--warning {
		background: var(--warning) !important;
		color: white !important;
	}

	.trust-icon--secondary {
		background: var(--secondary) !important;
		color: white !important;
	}

	.trust-icon-text {
		font-size: 0.75rem;
		font-weight: 700;
		text-align: center;
		line-height: 1;
	}

	/* Card system handles beta disclaimer styling automatically */

	/* Responsive Design - Card system handles most styling */
	@media (max-width: 768px) {
		.trust-icon {
			width: 3.5rem;
			height: 3.5rem;
			margin-bottom: 1rem;
		}

		.trust-icon-text {
			font-size: 0.6875rem;
		}
	}

	/* Badge uses proper CSS variables that adapt to dark mode automatically */
</style> 
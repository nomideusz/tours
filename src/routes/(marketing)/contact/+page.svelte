<script lang="ts">
	import Mail from 'lucide-svelte/icons/mail';
	import MessageCircle from 'lucide-svelte/icons/message-circle';
	import Clock from 'lucide-svelte/icons/clock';
	import Globe from 'lucide-svelte/icons/globe';
	import Rocket from 'lucide-svelte/icons/rocket';
	import Crown from 'lucide-svelte/icons/crown';
	import Headphones from 'lucide-svelte/icons/headphones';
</script>

<svelte:head>
	<title>Contact Us - Zaur</title>
	<meta name="description" content="Get in touch with Zaur - Support for tour guides using our QR booking system. Email support, early access inquiries, and help getting started." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<!-- Professional Header -->
		<div class="text-center mb-16">
			<div class="professional-badge mb-6">
				<Mail class="w-4 h-4" />
				<span>Get in Touch</span>
			</div>
			<h1 class="marketing-heading marketing-heading-xl mb-6">Contact Us</h1>
			<p class="text-lg max-w-2xl mx-auto text-secondary">
				Have questions about Zaur? Need help getting started? 
				We're here to help tour guides succeed.
			</p>
		</div>

		<!-- Early Access Notice -->
		<div class="max-w-4xl mx-auto mb-16">
			<div class="professional-card">
				<div class="flex items-start gap-4">
					<div class="professional-icon professional-icon--coral">
						<Rocket class="w-6 h-6" strokeWidth={2} />
					</div>
					<div class="flex-1">
						<div class="professional-badge-small mb-3">
							<Crown class="w-3 h-3" />
							<span>Early Access</span>
						</div>
						<h3 class="text-xl font-semibold text-primary mb-3">Join Our Early Access Program</h3>
						<p class="text-secondary mb-4">
							We're accepting a limited number of tour guides for our early access program. Use code <span class="font-bold">EARLY2025</span> to get a lifetime 50% discount.
						</p>
						<button onclick={() => {
							window.location.href = '/auth/register';
						}} class="button-primary button--small button--gap">
							Get Early Access
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Contact Methods -->
		<div class="grid md:grid-cols-2 gap-8 mb-16">
			<!-- Email Support -->
			<div class="professional-card">
				<div class="flex items-center gap-4 mb-6">
					<div class="professional-icon professional-icon--teal">
						<Mail class="w-8 h-8" strokeWidth={2} />
					</div>
					<div>
						<h3 class="text-xl font-semibold text-primary">Email Support</h3>
						<p class="text-sm text-secondary">Get help via email</p>
					</div>
				</div>
				<p class="mb-6 text-secondary">
					For general inquiries, technical support, or questions about getting started with Zaur. 
					We typically respond within 24 hours.
				</p>
				<button onclick={() => {
					window.location.href = 'mailto:support@zaur.app';
				}} class="button-secondary button--gap button--full-width">
					<span>support@zaur.app</span>
				</button>
			</div>

			<!-- Early Access -->
			<div class="professional-card">
				<div class="flex items-center gap-4 mb-6">
					<div class="professional-icon professional-icon--coral">
						<Rocket class="w-8 h-8" strokeWidth={2} />
					</div>
					<div>
						<h3 class="text-xl font-semibold text-primary">Early Access</h3>
						<p class="text-sm text-secondary">Join our beta program</p>
					</div>
				</div>
				<p class="mb-6 text-secondary">
					Interested in being among the first tour guides to use Zaur? 
					Get priority access and help shape the product.
				</p>
				<button onclick={() => {
					window.location.href = '/auth/register';
				}} class="button-primary button--gap button--full-width">
					Get Early Access
				</button>
			</div>
		</div>

		<!-- Contact Information -->
		<div class="professional-card mb-16">
			<h2 class="text-2xl font-semibold text-primary text-center mb-12">Contact Information</h2>
			<div class="grid md:grid-cols-3 gap-8">
				<!-- Response Time -->
				<div class="text-center">
					<div class="professional-icon professional-icon--teal mx-auto mb-6">
						<Clock class="w-8 h-8" strokeWidth={2} />
					</div>
					<h4 class="text-lg font-semibold text-primary mb-3">Response Time</h4>
					<p class="text-secondary">
						We typically respond to all inquiries within 24 hours 
						during business days.
					</p>
				</div>

				<!-- Business Hours -->
				<div class="text-center">
					<div class="professional-icon professional-icon--orange mx-auto mb-6">
						<Headphones class="w-8 h-8" strokeWidth={2} />
					</div>
					<h4 class="text-lg font-semibold text-primary mb-3">Business Hours</h4>
					<p class="text-secondary">
						Monday - Friday<br>
						9:00 AM - 6:00 PM CET<br>
						<span class="text-coral-600 font-medium">Central European Time</span>
					</p>
				</div>

				<!-- Location -->
				<div class="text-center">
					<div class="professional-icon professional-icon--navy mx-auto mb-6">
						<Globe class="w-8 h-8" strokeWidth={2} />
					</div>
					<h4 class="text-lg font-semibold text-primary mb-3">Location</h4>
					<p class="text-secondary">
						Based in Europe<br>
						Serving tour guides<br>
						<span class="text-coral-600 font-medium">worldwide</span>
					</p>
				</div>
			</div>
		</div>

		<!-- FAQ Section -->
		<div class="mb-16">
			<h2 class="text-2xl font-semibold text-primary text-center mb-12">Frequently Asked Questions</h2>
			<div class="space-y-6 max-w-4xl mx-auto">
				<div class="professional-card">
					<h3 class="text-lg font-semibold text-primary mb-3">How do I get started with Zaur?</h3>
					<p class="text-secondary">
						Simply sign up for early access, and we'll guide you through setting up your first 
						tour and QR code. The process takes less than 5 minutes to complete.
					</p>
				</div>

				<div class="professional-card">
					<h3 class="text-lg font-semibold text-primary mb-3">What's included in early access?</h3>
					<p class="text-secondary">
						Early access members get special pricing forever, priority support, direct access 
						to our team, and the ability to influence product development. New features are 
						released progressively.
					</p>
				</div>

				<div class="professional-card">
					<h3 class="text-lg font-semibold text-primary mb-3">Do I need technical skills?</h3>
					<p class="text-secondary">
						Not at all! Zaur is designed for tour guides, not technical experts. Everything is 
						intuitive and straightforward. If you can use WhatsApp, you can use Zaur.
					</p>
				</div>

				<div class="professional-card">
					<h3 class="text-lg font-semibold text-primary mb-3">How do payments work?</h3>
					<p class="text-secondary">
						We use Stripe for secure payment processing. You keep 100% of your tour revenue - 
						we only charge a simple monthly subscription fee, no commissions on bookings.
					</p>
				</div>
			</div>
		</div>

		<!-- Final CTA -->
		<div class="text-center">
			<div class="professional-card max-w-2xl mx-auto">
				<h3 class="text-2xl font-semibold text-primary mb-4">Ready to Get Started?</h3>
				<p class="text-lg mb-6 text-secondary">
					Join our early access program and be among the first tour guides to 
					experience the future of booking management.
				</p>
				<button onclick={() => {
					window.location.href = '/auth/register';
				}} class="button-primary button--gap">
					Get Early Access
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	/* Subtle retro section with minimal color - matches marketing pages */
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

	/* Professional badge */
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

	.professional-badge-small {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: var(--color-coral-100);
		border: 1px solid var(--color-coral-300);
		color: var(--color-coral-800);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full);
		font-weight: 500;
		font-size: 0.75rem;
	}

	/* Professional cards */
	.professional-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 2rem;
		transition: all var(--transition-base) ease;
		box-shadow: var(--shadow-sm);
		position: relative;
		overflow: hidden;
	}
	
	/* Subtle accent line on hover */
	.professional-card::before {
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
	
	.professional-card:hover::before {
		transform: scaleX(1);
	}

	.professional-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-secondary);
	}

	/* Professional icons */
	.professional-icon {
		width: 4rem;
		height: 4rem;
		border-radius: var(--radius-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		box-shadow: var(--shadow-md);
		flex-shrink: 0;
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
		background: var(--color-deep-navy-500);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.professional-card {
			padding: 1.5rem;
		}

		.professional-icon {
			width: 3rem;
			height: 3rem;
		}
	}
</style> 
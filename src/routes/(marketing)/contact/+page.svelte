<script lang="ts">
	import Mail from 'lucide-svelte/icons/mail';
	import MessageCircle from 'lucide-svelte/icons/message-circle';
	import Clock from 'lucide-svelte/icons/clock';
	import Globe from 'lucide-svelte/icons/globe';
	import Rocket from 'lucide-svelte/icons/rocket';
	import Crown from 'lucide-svelte/icons/crown';
	import Headphones from 'lucide-svelte/icons/headphones';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
</script>

<svelte:head>
	<title>Contact Us - Zaur</title>
	<meta name="description" content="Get in touch with Zaur - Support for tour guides using our QR booking system. Email support, beta program inquiries, and help getting started." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<!-- Header -->
		<div class="text-center mb-16">
			<div class="card-item card-item--center mb-6 max-w-xs mx-auto">
				<Mail class="w-4 h-4 text-primary" />
				<span class="font-medium">Get in Touch</span>
			</div>
			<h1 class="marketing-heading marketing-heading-xl mb-6">Contact Us</h1>
			<p class="text-lg max-w-2xl mx-auto text-secondary">
				Have questions about Zaur? Need help getting started? 
				We're here to help tour guides succeed.
			</p>
		</div>

		<!-- Beta Program Notice -->
		<div class="max-w-4xl mx-auto mb-16">
			<div class="card card--primary">
				<div class="card-header">
					<div class="flex items-center gap-3 mb-4">
						<FlaskConical class="w-6 h-6" />
						<div class="card-item card-item--center">
							<span class="text-sm font-medium">Beta Program</span>
						</div>
					</div>
					<h3 class="card-title card-title--large">Join Our Beta Program</h3>
					<p class="card-description card-description--large mb-4">
						We're selecting 50 tour guides to help shape the future of Zaur. Get free access during beta and a 30% lifetime discount after launch.
					</p>
				</div>
				<div class="card-content">
					<button onclick={() => {
						window.location.href = '/beta/apply';
					}} class="button-secondary button--gap">
						Apply for Beta Access
					</button>
				</div>
			</div>
		</div>

		<!-- Contact Methods -->
		<div class="card-grid card-grid--2 mb-16">
			<!-- Email Support -->
			<div class="card card--elevated">
				<div class="card-header">
					<div class="flex items-center gap-4 mb-4">
						<div class="contact-icon contact-icon--success">
							<Mail class="w-6 h-6" strokeWidth={2} />
						</div>
						<div>
							<h3 class="card-title">Email Support</h3>
							<p class="text-sm text-secondary">Get help via email</p>
						</div>
					</div>
				</div>
				<div class="card-content">
					<p class="card-description mb-6">
						For general inquiries, technical support, or questions about getting started with Zaur. 
						We typically respond within 24 hours.
					</p>
					<button onclick={() => {
						window.location.href = 'mailto:support@zaur.app';
					}} class="button-secondary button--gap button--full-width">
						<span>support@zaur.app</span>
					</button>
				</div>
			</div>

			<!-- Beta Program -->
			<div class="card card--elevated">
				<div class="card-header">
					<div class="flex items-center gap-4 mb-4">
						<div class="contact-icon contact-icon--primary">
							<FlaskConical class="w-6 h-6" strokeWidth={2} />
						</div>
						<div>
							<h3 class="card-title">Beta Program</h3>
							<p class="text-sm text-secondary">Join our exclusive beta</p>
						</div>
					</div>
				</div>
				<div class="card-content">
					<p class="card-description mb-6">
						Interested in being among the first 50 tour guides to use Zaur? 
						Get free access and help shape the product.
					</p>
					<button onclick={() => {
						window.location.href = '/beta/apply';
					}} class="button-primary button--gap button--full-width">
						Apply for Beta Access
					</button>
				</div>
			</div>
		</div>

		<!-- Contact Information -->
		<div class="card card--elevated mb-16">
			<div class="card-header card-header--center">
				<h2 class="card-title card-title--large mb-8">Contact Information</h2>
			</div>
			<div class="card-grid card-grid--3">
				<!-- Response Time -->
				<div class="card-item card-item--center">
					<div class="contact-icon contact-icon--success mb-4">
						<Clock class="w-6 h-6" strokeWidth={2} />
					</div>
					<h4 class="text-lg font-semibold text-primary mb-3">Response Time</h4>
					<p class="text-secondary text-center">
						We typically respond to all inquiries within 24 hours 
						during business days.
					</p>
				</div>

				<!-- Business Hours -->
				<div class="card-item card-item--center">
					<div class="contact-icon contact-icon--warning mb-4">
						<Headphones class="w-6 h-6" strokeWidth={2} />
					</div>
					<h4 class="text-lg font-semibold text-primary mb-3">Business Hours</h4>
					<p class="text-secondary text-center">
						Monday - Friday<br>
						9:00 AM - 6:00 PM CET<br>
						<span class="text-primary font-medium">Central European Time</span>
					</p>
				</div>

				<!-- Location -->
				<div class="card-item card-item--center">
					<div class="contact-icon contact-icon--secondary mb-4">
						<Globe class="w-6 h-6" strokeWidth={2} />
					</div>
					<h4 class="text-lg font-semibold text-primary mb-3">Location</h4>
					<p class="text-secondary text-center">
						Based in Europe<br>
						Serving tour guides<br>
						<span class="text-primary font-medium">worldwide</span>
					</p>
				</div>
			</div>
		</div>

		<!-- FAQ Section -->
		<div class="mb-16">
			<h2 class="text-2xl font-semibold text-primary text-center mb-12">Frequently Asked Questions</h2>
			<div class="card-grid card-grid--1 max-w-4xl mx-auto">
				<div class="card card--elevated">
					<div class="card-header">
						<h3 class="card-title">How do I get started with Zaur?</h3>
					</div>
					<div class="card-content">
						<p class="card-description">
							Apply for our beta program, and if selected, we'll guide you through setting up your first 
							tour and QR code. The process takes less than 5 minutes to complete.
						</p>
					</div>
				</div>

				<div class="card card--elevated">
					<div class="card-header">
						<h3 class="card-title">What's included in the beta program?</h3>
					</div>
					<div class="card-content">
						<p class="card-description">
							Beta members get free access during beta, 30% lifetime discount after launch, priority support, 
							direct access to our team, and the ability to influence product development.
						</p>
					</div>
				</div>

				<div class="card card--elevated">
					<div class="card-header">
						<h3 class="card-title">Do I need technical skills?</h3>
					</div>
					<div class="card-content">
						<p class="card-description">
							Not at all! Zaur is designed for tour guides, not technical experts. Everything is 
							intuitive and straightforward. If you can use WhatsApp, you can use Zaur.
						</p>
					</div>
				</div>

				<div class="card card--elevated">
					<div class="card-header">
						<h3 class="card-title">How do payments work?</h3>
					</div>
					<div class="card-content">
						<p class="card-description">
							We use Stripe for secure payment processing. You keep 100% of your tour revenue - 
							we only charge a simple monthly subscription fee, no commissions on bookings.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Final CTA -->
		<div class="text-center">
			<div class="card card--gradient max-w-2xl mx-auto">
				<div class="card-header card-header--center">
					<h3 class="card-title card-title--large text-white mb-4">Ready to Get Started?</h3>
					<p class="card-description card-description--large text-white/90 mb-6">
						Apply for our beta program and be among the first 50 tour guides to 
						help shape the future of booking management.
					</p>
				</div>
				<div class="card-content">
					<button onclick={() => {
						window.location.href = '/beta/apply';
					}} class="bg-white text-primary font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2">
						Apply for Beta Access
					</button>
				</div>
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

	/* Contact icons */
	.contact-icon {
		width: 3rem;
		height: 3rem;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		box-shadow: var(--shadow-md);
		flex-shrink: 0;
	}

	.contact-icon--primary {
		background: var(--primary);
	}

	.contact-icon--success {
		background: var(--success);
	}

	.contact-icon--warning {
		background: var(--warning);
	}

	.contact-icon--secondary {
		background: var(--secondary);
	}

	/* Text color utilities */
	:global(.text-primary) {
		color: var(--primary);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.contact-icon {
			width: 2.5rem;
			height: 2.5rem;
		}
	}
</style> 
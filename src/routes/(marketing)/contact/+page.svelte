<script lang="ts">
	import Mail from 'lucide-svelte/icons/mail';
	import MessageCircle from 'lucide-svelte/icons/message-circle';
	import Clock from 'lucide-svelte/icons/clock';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Rocket from 'lucide-svelte/icons/rocket';
</script>

<svelte:head>
	<title>Contact Us - Zaur</title>
	<meta name="description" content="Get in touch with Zaur - Support for tour guides using our QR booking system." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-4xl font-bold mb-4" style="color: var(--text-primary);">Get in Touch</h1>
			<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
				Have questions about Zaur? Need help getting started? We're here to help tour guides succeed.
			</p>
		</div>

		<!-- Early Access Notice -->
		<div class="alert-info mb-12 p-4 rounded-lg">
			<div class="flex items-start gap-3">
				<Rocket class="w-5 h-5 mt-0.5 flex-shrink-0" style="color: var(--color-info-600);" />
				<div class="flex-1">
					<p class="text-sm">
						<strong>Currently in Early Access:</strong> We're accepting a limited number of tour guides 
						for our early access program. Contact us to learn more about special pricing and benefits.
					</p>
				</div>
			</div>
		</div>

		<!-- Contact Methods -->
		<div class="grid md:grid-cols-2 gap-8 mb-12">
			<!-- Email Support -->
			<div class="rounded-lg p-8 shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center gap-3 mb-4">
					<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: var(--color-primary-50);">
						<Mail class="w-6 h-6" style="color: var(--color-primary-600);" />
					</div>
					<div>
						<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Email Support</h3>
						<p class="text-sm" style="color: var(--text-secondary);">Get help via email</p>
					</div>
				</div>
				<p class="mb-4" style="color: var(--text-primary);">
					For general inquiries, technical support, or questions about getting started with Zaur.
				</p>
				<a 
					href="mailto:support@zaur.app" 
					class="inline-flex items-center gap-2 font-medium"
					style="color: var(--color-primary-600);"
				>
					<Mail class="w-4 h-4" />
					support@zaur.app
				</a>
			</div>

			<!-- Early Access -->
			<div class="rounded-lg p-8 shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center gap-3 mb-4">
					<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: var(--color-success-50);">
						<MessageCircle class="w-6 h-6" style="color: var(--color-success-600);" />
					</div>
					<div>
						<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Early Access</h3>
						<p class="text-sm" style="color: var(--text-secondary);">Join our beta program</p>
					</div>
				</div>
				<p class="mb-4" style="color: var(--text-primary);">
					Interested in being among the first tour guides to use Zaur? Get priority access and help shape the product.
				</p>
				<a 
					href="/auth/register" 
					class="inline-flex items-center gap-2 font-medium"
					style="color: var(--color-success-600);"
				>
					<MessageCircle class="w-4 h-4" />
					Request Early Access
				</a>
			</div>
		</div>

		<!-- Contact Information -->
		<div class="rounded-lg p-8" style="background: var(--bg-secondary);">
			<div class="grid md:grid-cols-3 gap-8">
				<!-- Response Time -->
				<div class="text-center">
					<div class="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style="background: var(--color-primary-100);">
						<Clock class="w-6 h-6" style="color: var(--color-primary-600);" />
					</div>
					<h4 class="font-semibold mb-2" style="color: var(--text-primary);">Response Time</h4>
					<p class="text-sm" style="color: var(--text-secondary);">
						We typically respond to all inquiries within 24 hours during business days.
					</p>
				</div>

				<!-- Business Hours -->
				<div class="text-center">
					<div class="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style="background: var(--color-success-100);">
						<MessageCircle class="w-6 h-6" style="color: var(--color-success-600);" />
					</div>
					<h4 class="font-semibold mb-2" style="color: var(--text-primary);">Business Hours</h4>
					<p class="text-sm" style="color: var(--text-secondary);">
						Monday - Friday<br>
						9:00 AM - 6:00 PM CET
					</p>
				</div>

				<!-- Location -->
				<div class="text-center">
					<div class="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style="background: var(--color-info-100);">
						<MapPin class="w-6 h-6" style="color: var(--color-info-600);" />
					</div>
					<h4 class="font-semibold mb-2" style="color: var(--text-primary);">Location</h4>
					<p class="text-sm" style="color: var(--text-secondary);">
						Based in Europe<br>
						Serving tour guides worldwide
					</p>
				</div>
			</div>
		</div>

		<!-- FAQ Section -->
		<div class="mt-12">
			<h2 class="text-2xl font-semibold mb-8 text-center" style="color: var(--text-primary);">Frequently Asked Questions</h2>
			<div class="space-y-6">
				<div class="rounded-lg p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="font-semibold mb-2" style="color: var(--text-primary);">How do I get started with Zaur?</h3>
					<p style="color: var(--text-secondary);">
						Simply sign up for early access, and we'll guide you through the process of creating your first tour and QR code. 
						It takes less than 5 minutes to get started.
					</p>
				</div>

				<div class="rounded-lg p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="font-semibold mb-2" style="color: var(--text-primary);">What's included in Early Access?</h3>
					<p style="color: var(--text-secondary);">
						Early access members get special pricing locked in forever, priority support, direct access to founders, 
						and the ability to shape our product roadmap. Some features are still being developed and will be 
						rolled out progressively.
					</p>
				</div>

				<div class="rounded-lg p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="font-semibold mb-2" style="color: var(--text-primary);">Do I need technical skills to use Zaur?</h3>
					<p style="color: var(--text-secondary);">
						Not at all! Zaur is designed for tour guides, not tech experts. Everything is simple and intuitive. 
						If you can use WhatsApp, you can use Zaur.
					</p>
				</div>

				<div class="rounded-lg p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="font-semibold mb-2" style="color: var(--text-primary);">What payment processing do you use?</h3>
					<p style="color: var(--text-secondary);">
						We use Stripe for secure payment processing. You keep 100% of your booking revenue - we only charge 
						a simple monthly subscription fee, no commissions on bookings.
					</p>
				</div>
			</div>
		</div>

		<!-- CTA -->
		<div class="mt-12 text-center">
			<div class="rounded-lg p-8" style="background: var(--color-primary-50);">
				<h3 class="text-xl font-semibold mb-4" style="color: var(--text-primary);">Ready to Transform Your Tour Business?</h3>
				<p class="mb-6" style="color: var(--text-primary);">
					Join the early access program and be among the first tour guides to use Zaur.
				</p>
				<a href="/auth/register" class="button-primary">
					Get Early Access
				</a>
			</div>
		</div>
	</div>
</div> 
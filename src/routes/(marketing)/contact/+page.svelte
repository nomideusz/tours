<script lang="ts">
	import Mail from 'lucide-svelte/icons/mail';
	import MessageCircle from 'lucide-svelte/icons/message-circle';
	import Clock from 'lucide-svelte/icons/clock';
	import MapPin from 'lucide-svelte/icons/map-pin';
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
			<h1 class="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				Have questions about Zaur? Need help getting started? We're here to help tour guides succeed.
			</p>
		</div>

		<!-- Contact Methods -->
		<div class="grid md:grid-cols-2 gap-8 mb-12">
			<!-- Email Support -->
			<div class="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
				<div class="flex items-center gap-3 mb-4">
					<div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
						<Mail class="w-6 h-6 text-blue-600" />
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900">Email Support</h3>
						<p class="text-sm text-gray-600">Get help via email</p>
					</div>
				</div>
				<p class="text-gray-700 mb-4">
					For general inquiries, technical support, or questions about getting started with Zaur.
				</p>
				<a 
					href="mailto:support@zaur.app" 
					class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
				>
					<Mail class="w-4 h-4" />
					support@zaur.app
				</a>
			</div>

			<!-- Early Access -->
			<div class="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
				<div class="flex items-center gap-3 mb-4">
					<div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
						<MessageCircle class="w-6 h-6 text-green-600" />
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900">Early Access</h3>
						<p class="text-sm text-gray-600">Join our beta program</p>
					</div>
				</div>
				<p class="text-gray-700 mb-4">
					Interested in being among the first tour guides to use Zaur? Get priority access and help shape the product.
				</p>
				<a 
					href="/auth/register" 
					class="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
				>
					<MessageCircle class="w-4 h-4" />
					Request Early Access
				</a>
			</div>
		</div>

		<!-- Contact Information -->
		<div class="bg-gray-50 rounded-lg p-8">
			<div class="grid md:grid-cols-3 gap-8">
				<!-- Response Time -->
				<div class="text-center">
					<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
						<Clock class="w-6 h-6 text-blue-600" />
					</div>
					<h4 class="font-semibold text-gray-900 mb-2">Response Time</h4>
					<p class="text-sm text-gray-600">
						We typically respond to all inquiries within 24 hours during business days.
					</p>
				</div>

				<!-- Business Hours -->
				<div class="text-center">
					<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
						<MessageCircle class="w-6 h-6 text-green-600" />
					</div>
					<h4 class="font-semibold text-gray-900 mb-2">Business Hours</h4>
					<p class="text-sm text-gray-600">
						Monday - Friday<br>
						9:00 AM - 6:00 PM CET
					</p>
				</div>

				<!-- Location -->
				<div class="text-center">
					<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
						<MapPin class="w-6 h-6 text-purple-600" />
					</div>
					<h4 class="font-semibold text-gray-900 mb-2">Location</h4>
					<p class="text-sm text-gray-600">
						Based in Europe<br>
						Serving tour guides worldwide
					</p>
				</div>
			</div>
		</div>

		<!-- FAQ Section -->
		<div class="mt-12">
			<h2 class="text-2xl font-semibold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
			<div class="space-y-6">
				<div class="bg-white border border-gray-200 rounded-lg p-6">
					<h3 class="font-semibold text-gray-900 mb-2">How do I get started with Zaur?</h3>
					<p class="text-gray-700">
						Simply sign up for early access, and we'll guide you through the process of creating your first tour and QR code. 
						It takes less than 5 minutes to get started.
					</p>
				</div>

				<div class="bg-white border border-gray-200 rounded-lg p-6">
					<h3 class="font-semibold text-gray-900 mb-2">Is Zaur really free to start?</h3>
					<p class="text-gray-700">
						Yes! We don't charge setup fees or monthly subscriptions. You only pay a small fee when you receive bookings. 
						No bookings, no charges.
					</p>
				</div>

				<div class="bg-white border border-gray-200 rounded-lg p-6">
					<h3 class="font-semibold text-gray-900 mb-2">Do I need technical skills to use Zaur?</h3>
					<p class="text-gray-700">
						Not at all! Zaur is designed for tour guides, not tech experts. Everything is simple and intuitive. 
						If you can use WhatsApp, you can use Zaur.
					</p>
				</div>

				<div class="bg-white border border-gray-200 rounded-lg p-6">
					<h3 class="font-semibold text-gray-900 mb-2">What if I need help setting up?</h3>
					<p class="text-gray-700">
						We provide personal onboarding for all new tour guides. Our team will help you set up your first tour 
						and answer any questions you have.
					</p>
				</div>
			</div>
		</div>

		<!-- CTA -->
		<div class="mt-12 text-center">
			<div class="bg-blue-50 rounded-lg p-8">
				<h3 class="text-xl font-semibold text-gray-900 mb-4">Ready to Transform Your Tour Business?</h3>
				<p class="text-gray-700 mb-6">
					Join the early access program and be among the first tour guides to use Zaur.
				</p>
				<a 
					href="/auth/register" 
					class="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
				>
					Get Early Access
				</a>
			</div>
		</div>
	</div>
</div> 
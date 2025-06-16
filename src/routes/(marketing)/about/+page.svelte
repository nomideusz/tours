<script lang="ts">
	import Users from 'lucide-svelte/icons/users';
	import Heart from 'lucide-svelte/icons/heart';
	import Zap from 'lucide-svelte/icons/zap';
	import Globe from 'lucide-svelte/icons/globe';
</script>

<svelte:head>
	<title>About Us - Zaur</title>
	<meta name="description" content="Learn about Zaur - The simplest booking system for independent tour guides. Our mission, values, and commitment to helping tour guides succeed." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-16">
			<h1 class="text-4xl font-bold text-gray-900 mb-4">About Zaur</h1>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				We're building the simplest booking system for independent tour guides. 
				More bookings, less hassle.
			</p>
		</div>

		<!-- Mission -->
		<div class="bg-blue-50 rounded-lg p-8 mb-12">
			<div class="text-center">
				<div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
					<Heart class="w-8 h-8 text-blue-600" />
				</div>
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
				<p class="text-lg text-gray-700 max-w-3xl mx-auto">
					Every tour guide deserves to focus on what they love most: sharing amazing experiences with travelers. 
					We handle the boring stuff so you can focus on the fun stuff.
				</p>
			</div>
		</div>

		<!-- The Problem -->
		<div class="mb-12">
			<h2 class="text-2xl font-semibold text-gray-900 mb-8 text-center">The Problem We're Solving</h2>
			<div class="grid md:grid-cols-2 gap-8">
				<div class="bg-white border border-gray-200 rounded-lg p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-3">Before Zaur</h3>
					<ul class="space-y-2 text-gray-700">
						<li>• WhatsApp chaos for bookings</li>
						<li>• Paper forms and cash payments</li>
						<li>• Lost bookings and double bookings</li>
						<li>• Hours spent on administrative tasks</li>
						<li>• No professional online presence</li>
					</ul>
				</div>
				<div class="bg-green-50 border border-green-200 rounded-lg p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-3">With Zaur</h3>
					<ul class="space-y-2 text-gray-700">
						<li>• Professional QR code booking system</li>
						<li>• Instant online payments via Stripe</li>
						<li>• Automated booking management</li>
						<li>• Real-time notifications and updates</li>
						<li>• Focus on guiding, not admin work</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Values -->
		<div class="mb-12">
			<h2 class="text-2xl font-semibold text-gray-900 mb-8 text-center">What We Believe</h2>
			<div class="grid md:grid-cols-3 gap-8">
				<div class="text-center">
					<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
						<Zap class="w-6 h-6 text-blue-600" />
					</div>
					<h3 class="font-semibold text-gray-900 mb-3">Simple by Design</h3>
					<p class="text-gray-700 text-sm">
						Technology should make your life easier, not more complicated. 
						Every feature is designed with simplicity in mind.
					</p>
				</div>

				<div class="text-center">
					<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
						<Users class="w-6 h-6 text-green-600" />
					</div>
					<h3 class="font-semibold text-gray-900 mb-3">Tour Guides First</h3>
					<p class="text-gray-700 text-sm">
						We're built specifically for independent tour guides. 
						Every decision prioritizes your success and convenience.
					</p>
				</div>

				<div class="text-center">
					<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
						<Globe class="w-6 h-6 text-purple-600" />
					</div>
					<h3 class="font-semibold text-gray-900 mb-3">Fair & Transparent</h3>
					<p class="text-gray-700 text-sm">
						Simple monthly subscription, no booking commissions. 
						Keep 100% of your booking revenue. Transparent pricing, no surprises.
					</p>
				</div>
			</div>
		</div>

		<!-- Early Access -->
		<div class="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-8 mb-12">
			<div class="text-center">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">🚀 Early Access Program</h2>
				<p class="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
					We're currently in early access, working closely with a select group of tour guides 
					to perfect the platform before our public launch.
				</p>
				<div class="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
					<div class="bg-white rounded-lg p-4 shadow-sm">
						<h4 class="font-semibold text-gray-900 mb-2">✨ What You Get</h4>
						<ul class="text-sm text-gray-700 space-y-1">
							<li>• Priority access to new features</li>
							<li>• Direct input on product development</li>
							<li>• Personal onboarding and support</li>
							<li>• Exclusive early adopter benefits</li>
						</ul>
					</div>
					<div class="bg-white rounded-lg p-4 shadow-sm">
						<h4 class="font-semibold text-gray-900 mb-2">🎯 What We Need</h4>
						<ul class="text-sm text-gray-700 space-y-1">
							<li>• Feedback on features and usability</li>
							<li>• Real-world testing with your tours</li>
							<li>• Help us understand your daily workflow</li>
							<li>• Spread the word to fellow guides</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<!-- Contact -->
		<div class="text-center">
			<h2 class="text-2xl font-semibold text-gray-900 mb-4">Ready to Join Us?</h2>
			<p class="text-gray-700 mb-8 max-w-2xl mx-auto">
				Be among the first tour guides to transform their booking process. 
				Join our early access program and help shape the future of tour guide technology.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a 
					href="/auth/register" 
					class="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
				>
					Get Early Access
				</a>
				<a 
					href="/contact" 
					class="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
				>
					Contact Us
				</a>
			</div>
		</div>
	</div>
</div> 
<script lang="ts">
	import Users from 'lucide-svelte/icons/users';
	import Heart from 'lucide-svelte/icons/heart';
	import Zap from 'lucide-svelte/icons/zap';
	import Globe from 'lucide-svelte/icons/globe';
	import Rocket from 'lucide-svelte/icons/rocket';
	import Shield from 'lucide-svelte/icons/shield';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
</script>

<svelte:head>
	<title>About Us - Zaur</title>
	<meta name="description" content="Learn about Zaur - The simplest booking system for independent tour guides. Our mission, values, and commitment to helping tour guides succeed." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="marketing-section" style="padding-top: 2rem;">
	<div class="marketing-container">
		<!-- Header -->
		<div class="text-center mb-16">
			<h1 class="marketing-heading marketing-heading-xl mb-4">About Zaur</h1>
			<p class="text-lg max-w-2xl mx-auto marketing-text-secondary">
				We're building the simplest booking system for independent tour guides. 
				More bookings, less hassle.
			</p>
		</div>

		<!-- Early Access Badge -->
		<div class="max-w-3xl mx-auto mb-16">
			<div class="marketing-alert marketing-alert-warning">
				<div class="flex items-start gap-3">
					<Rocket class="w-6 h-6 mt-0.5 flex-shrink-0" style="color: var(--color-warning-600);" />
					<div class="flex-1">
						<h3 class="font-semibold mb-2 text-lg">🚀 Currently in Early Access</h3>
						<p class="mb-3">
							Zaur is in active development with a select group of tour guides helping shape the platform. 
							Join now to lock in special early access pricing and be part of our founding community.
						</p>
						<a href="/auth/register" class="marketing-button marketing-button-primary">
							Join Early Access Program
						</a>
					</div>
				</div>
			</div>
		</div>

		<!-- Mission -->
		<div class="marketing-card mb-12" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
			<div class="text-center">
				<div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style="background: var(--color-primary-100);">
					<Heart class="w-8 h-8" style="color: var(--color-primary-600);" />
				</div>
				<h2 class="marketing-heading marketing-heading-lg mb-4">Our Mission</h2>
				<p class="text-lg max-w-3xl mx-auto marketing-text-primary">
					Every tour guide deserves to focus on what they love most: sharing amazing experiences with travelers. 
					We handle the boring stuff so you can focus on the fun stuff.
				</p>
			</div>
		</div>

		<!-- The Problem -->
		<div class="mb-12">
			<h2 class="marketing-heading marketing-heading-lg mb-8 text-center">The Problem We're Solving</h2>
			<div class="marketing-grid marketing-grid-2 gap-8">
				<div class="marketing-card">
					<h3 class="text-lg font-semibold mb-3 marketing-text-primary">Before Zaur</h3>
					<ul class="space-y-2 marketing-text-primary">
						<li>• WhatsApp chaos for bookings</li>
						<li>• Paper forms and cash payments</li>
						<li>• Lost bookings and double bookings</li>
						<li>• Hours spent on administrative tasks</li>
						<li>• No professional online presence</li>
					</ul>
				</div>
				<div class="marketing-card" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
					<h3 class="text-lg font-semibold mb-3 marketing-text-primary">With Zaur</h3>
					<ul class="space-y-2 marketing-text-primary">
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
			<h2 class="marketing-heading marketing-heading-lg mb-8 text-center">What We Believe</h2>
			<div class="marketing-grid marketing-grid-3 gap-8">
				<div class="text-center">
					<div class="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style="background: var(--color-primary-100);">
						<Zap class="w-6 h-6" style="color: var(--color-primary-600);" />
					</div>
					<h3 class="font-semibold mb-3 marketing-text-primary">Simple by Design</h3>
					<p class="text-sm marketing-text-secondary">
						Technology should make your life easier, not more complicated. 
						Every feature is designed with simplicity in mind.
					</p>
				</div>

				<div class="text-center">
					<div class="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style="background: var(--color-success-100);">
						<Users class="w-6 h-6" style="color: var(--color-success-600);" />
					</div>
					<h3 class="font-semibold mb-3 marketing-text-primary">Tour Guides First</h3>
					<p class="text-sm marketing-text-secondary">
						We're built specifically for independent tour guides. 
						Every decision prioritizes your success and convenience.
					</p>
				</div>

				<div class="text-center">
					<div class="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style="background: var(--color-info-100);">
						<Shield class="w-6 h-6" style="color: var(--color-info-600);" />
					</div>
					<h3 class="font-semibold mb-3 marketing-text-primary">Fair & Transparent</h3>
					<p class="text-sm marketing-text-secondary">
						Simple monthly subscription, no booking commissions. 
						Keep 100% of your booking revenue. Transparent pricing, no surprises.
					</p>
				</div>
			</div>
		</div>

		<!-- Early Access Details -->
		<div class="marketing-card mb-12" style="background: linear-gradient(135deg, var(--color-primary-50), var(--color-success-50));">
			<div class="text-center">
				<h2 class="marketing-heading marketing-heading-lg mb-4">🚀 Early Access Program</h2>
				<p class="text-lg mb-6 max-w-2xl mx-auto marketing-text-primary">
					We're currently in early access, working closely with a select group of tour guides 
					to perfect the platform before our public launch.
				</p>
				<div class="marketing-grid marketing-grid-2 gap-6 max-w-2xl mx-auto">
					<div class="marketing-card shadow-sm">
						<h4 class="font-semibold mb-2 marketing-text-primary">✨ What You Get</h4>
						<ul class="text-sm space-y-1 marketing-text-secondary">
							<li>• Early access pricing locked forever</li>
							<li>• Priority feature requests</li>
							<li>• Direct line to founders</li>
							<li>• Shape the product roadmap</li>
							<li>• Exclusive community access</li>
						</ul>
					</div>
					<div class="marketing-card shadow-sm">
						<h4 class="font-semibold mb-2 marketing-text-primary">🎯 What We Need</h4>
						<ul class="text-sm space-y-1 marketing-text-secondary">
							<li>• Your honest feedback</li>
							<li>• Real-world testing</li>
							<li>• Understanding your workflow</li>
							<li>• Patience with new features</li>
							<li>• Spread the word</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<!-- Contact -->
		<div class="text-center">
			<h2 class="marketing-heading marketing-heading-lg mb-4">Ready to Join Us?</h2>
			<p class="mb-8 max-w-2xl mx-auto marketing-text-secondary">
				Be among the first tour guides to transform their booking process. 
				Join our early access program and help shape the future of tour guide technology.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a href="/auth/register" class="marketing-button marketing-button-primary">
					Get Early Access
				</a>
				<a href="/contact" class="marketing-button marketing-button-secondary">
					Contact Us
				</a>
			</div>
		</div>
	</div>
</div> 
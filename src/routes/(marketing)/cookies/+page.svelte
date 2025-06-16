<script lang="ts">
	// Cookie Policy page
</script>

<svelte:head>
	<title>Cookie Policy - Zaur</title>
	<meta name="description" content="Cookie Policy for Zaur - How we use cookies to improve your experience." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-4xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
		<p class="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

		<div class="prose prose-lg max-w-none">
			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">What Are Cookies?</h2>
				<p class="text-gray-700 mb-4">
					Cookies are small text files that are stored on your device when you visit our website. 
					They help us provide you with a better experience by remembering your preferences and analyzing how you use our service.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">How We Use Cookies</h2>
				<p class="text-gray-700 mb-4">We use cookies for the following purposes:</p>
				
				<h3 class="text-xl font-semibold text-gray-900 mb-3">Essential Cookies</h3>
				<p class="text-gray-700 mb-4">These cookies are necessary for the website to function properly. They include:</p>
				<ul class="list-disc list-inside text-gray-700 space-y-2 mb-4">
					<li><strong>Authentication:</strong> Keep you logged in to your account</li>
					<li><strong>Security:</strong> Protect against cross-site request forgery</li>
					<li><strong>Preferences:</strong> Remember your language and theme settings</li>
				</ul>

				<h3 class="text-xl font-semibold text-gray-900 mb-3">Analytics Cookies</h3>
				<p class="text-gray-700 mb-4">These cookies help us understand how visitors use our website:</p>
				<ul class="list-disc list-inside text-gray-700 space-y-2 mb-4">
					<li><strong>Umami Analytics:</strong> Privacy-focused website analytics</li>
					<li><strong>Performance Monitoring:</strong> Track page load times and errors</li>
					<li><strong>Feature Usage:</strong> Understand which features are most popular</li>
				</ul>

				<h3 class="text-xl font-semibold text-gray-900 mb-3">Functional Cookies</h3>
				<p class="text-gray-700 mb-4">These cookies enhance your experience:</p>
				<ul class="list-disc list-inside text-gray-700 space-y-2">
					<li><strong>User Interface:</strong> Remember your dashboard layout preferences</li>
					<li><strong>Tour Settings:</strong> Save your default tour configurations</li>
					<li><strong>Booking History:</strong> Track your recent activities for quick access</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Cookie Categories</h2>
				<div class="bg-gray-50 p-6 rounded-lg">
					<div class="grid md:grid-cols-2 gap-6">
						<div>
							<h4 class="font-semibold text-gray-900 mb-2">Session Cookies</h4>
							<p class="text-sm text-gray-700">Temporary cookies that expire when you close your browser</p>
						</div>
						<div>
							<h4 class="font-semibold text-gray-900 mb-2">Persistent Cookies</h4>
							<p class="text-sm text-gray-700">Cookies that remain on your device for a set period</p>
						</div>
						<div>
							<h4 class="font-semibold text-gray-900 mb-2">First-Party Cookies</h4>
							<p class="text-sm text-gray-700">Cookies set directly by Zaur</p>
						</div>
						<div>
							<h4 class="font-semibold text-gray-900 mb-2">Third-Party Cookies</h4>
							<p class="text-sm text-gray-700">Cookies set by our trusted partners (analytics, payments)</p>
						</div>
					</div>
				</div>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Managing Your Cookie Preferences</h2>
				<p class="text-gray-700 mb-4">You have several options for managing cookies:</p>
				
				<h3 class="text-xl font-semibold text-gray-900 mb-3">Browser Settings</h3>
				<p class="text-gray-700 mb-4">Most browsers allow you to:</p>
				<ul class="list-disc list-inside text-gray-700 space-y-2 mb-4">
					<li>View and delete cookies</li>
					<li>Block cookies from specific websites</li>
					<li>Block third-party cookies</li>
					<li>Clear all cookies when you close the browser</li>
				</ul>

				<h3 class="text-xl font-semibold text-gray-900 mb-3">Browser-Specific Instructions</h3>
				<div class="grid md:grid-cols-2 gap-4 mb-4">
					<div class="bg-gray-50 p-4 rounded-lg">
						<h4 class="font-semibold text-gray-900 mb-2">Chrome</h4>
						<p class="text-sm text-gray-700">Settings → Privacy and Security → Cookies and other site data</p>
					</div>
					<div class="bg-gray-50 p-4 rounded-lg">
						<h4 class="font-semibold text-gray-900 mb-2">Firefox</h4>
						<p class="text-sm text-gray-700">Options → Privacy & Security → Cookies and Site Data</p>
					</div>
					<div class="bg-gray-50 p-4 rounded-lg">
						<h4 class="font-semibold text-gray-900 mb-2">Safari</h4>
						<p class="text-sm text-gray-700">Preferences → Privacy → Manage Website Data</p>
					</div>
					<div class="bg-gray-50 p-4 rounded-lg">
						<h4 class="font-semibold text-gray-900 mb-2">Edge</h4>
						<p class="text-sm text-gray-700">Settings → Cookies and site permissions → Cookies and site data</p>
					</div>
				</div>

				<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
					<p class="text-amber-800 text-sm">
						<strong>Note:</strong> Disabling essential cookies may affect the functionality of our website. 
						Some features may not work properly if you block all cookies.
					</p>
				</div>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
				<p class="text-gray-700 mb-4">We use the following third-party services that may set cookies:</p>
				
				<div class="space-y-4">
					<div class="border border-gray-200 rounded-lg p-4">
						<h4 class="font-semibold text-gray-900 mb-2">Umami Analytics</h4>
						<p class="text-sm text-gray-700 mb-2">Privacy-focused website analytics</p>
						<p class="text-xs text-gray-600">Purpose: Track website usage and performance</p>
						<p class="text-xs text-gray-600">Data retention: 24 months</p>
					</div>
					
					<div class="border border-gray-200 rounded-lg p-4">
						<h4 class="font-semibold text-gray-900 mb-2">Stripe</h4>
						<p class="text-sm text-gray-700 mb-2">Payment processing</p>
						<p class="text-xs text-gray-600">Purpose: Secure payment transactions</p>
						<p class="text-xs text-gray-600">Privacy Policy: <a href="https://stripe.com/privacy" target="_blank" class="text-blue-600 hover:text-blue-500">https://stripe.com/privacy</a></p>
					</div>
				</div>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Cookie Retention</h2>
				<p class="text-gray-700 mb-4">Different cookies have different retention periods:</p>
				<ul class="list-disc list-inside text-gray-700 space-y-2">
					<li><strong>Session cookies:</strong> Deleted when you close your browser</li>
					<li><strong>Authentication cookies:</strong> 30 days or until you log out</li>
					<li><strong>Preference cookies:</strong> 1 year</li>
					<li><strong>Analytics cookies:</strong> 2 years</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
				<p class="text-gray-700 mb-4">
					We may update this Cookie Policy from time to time to reflect changes in our practices or applicable laws. 
					We will notify you of any significant changes by posting the updated policy on our website.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
				<p class="text-gray-700 mb-4">
					If you have questions about our use of cookies, please contact us:
				</p>
				<div class="bg-gray-50 p-4 rounded-lg">
					<p class="text-gray-700">
						<strong>Email:</strong> privacy@zaur.app<br>
						<strong>Website:</strong> <a href="https://zaur.app" class="text-blue-600 hover:text-blue-500">https://zaur.app</a>
					</p>
				</div>
			</section>
		</div>
	</div>
</div> 
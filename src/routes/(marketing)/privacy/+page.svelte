<script lang="ts">
	import { consentStore } from '$lib/stores/consent.js';
	
	let consent = $state<'pending' | 'accepted' | 'rejected'>('pending');
	
	$effect(() => {
		const unsubscribe = consentStore.subscribe(value => {
			consent = value;
		});
		return () => unsubscribe();
	});
	
	function handleAccept() {
		consentStore.accept();
	}
	
	function handleReject() {
		consentStore.reject();
	}
	
	function handleReset() {
		consentStore.reset();
	}
</script>

<svelte:head>
	<title>Privacy Policy - Zaur</title>
	<meta name="description" content="Zaur's privacy policy and data handling practices" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="marketing-heading marketing-heading-xl mb-4">Privacy Policy</h1>
			<p class="text-lg text-secondary">
				Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
			</p>
		</div>

		<!-- Cookie Consent Management -->
		<div class="mb-12 p-6 rounded-xl border" style="background: var(--bg-secondary); border-color: var(--border-primary);">
			<h2 class="text-xl font-semibold mb-3" style="color: var(--text-primary);">Cookie Preferences</h2>
			<p class="text-sm mb-4" style="color: var(--text-secondary);">
				Current status: <strong style="color: var(--text-primary);">
					{#if consent === 'accepted'}
						Analytics enabled
					{:else if consent === 'rejected'}
						Analytics disabled
					{:else}
						Not set
					{/if}
				</strong>
			</p>
			<div class="flex gap-2 flex-wrap">
				{#if consent !== 'accepted'}
					<button class="button-primary button--small" onclick={handleAccept} type="button">
						Accept Analytics
					</button>
				{/if}
				{#if consent !== 'rejected'}
					<button class="button-secondary button--small" onclick={handleReject} type="button">
						Reject Analytics
					</button>
				{/if}
				{#if consent !== 'pending'}
					<button class="button-text button--small" onclick={handleReset} type="button">
						Reset Preferences
					</button>
				{/if}
			</div>
		</div>

		<!-- Content -->
		<div class="prose prose-lg" style="color: var(--text-secondary);">
			<section class="mb-8">
				<h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Overview</h2>
				<p class="mb-4">
					Zaur ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our tour booking platform.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Cookies & Tracking</h2>
				
				<h3 class="text-xl font-semibold mb-3" style="color: var(--text-primary);">Strictly Necessary Cookies</h3>
				<p class="mb-4">
					We use essential cookies that are required for the platform to function:
				</p>
				<ul class="list-disc pl-6 mb-4 space-y-2">
					<li><strong>Authentication cookies:</strong> To keep you logged in</li>
					<li><strong>Stripe cookies:</strong> For secure payment processing and fraud prevention (only loaded for logged-in tour guides and during booking checkout)</li>
					<li><strong>Session cookies:</strong> To maintain your preferences during your visit</li>
				</ul>
				<p class="mb-4">
					These cookies are essential for the service to work and do not require consent under GDPR as they are strictly necessary for the functionality you request.
				</p>

				<h3 class="text-xl font-semibold mb-3 mt-6" style="color: var(--text-primary);">Optional Analytics</h3>
				<p class="mb-4">
					We use <strong>Umami Analytics</strong>, a privacy-focused analytics service that:
				</p>
				<ul class="list-disc pl-6 mb-4 space-y-2">
					<li>Does not use cookies for tracking</li>
					<li>Does not collect personal data</li>
					<li>Does not track you across websites</li>
					<li>Complies with GDPR, CCPA, and PECR</li>
					<li>Uses anonymized data only</li>
				</ul>
				<p class="mb-4">
					Umami helps us understand how visitors use our website (page views, general navigation patterns) without collecting any personally identifiable information. All data is anonymized and aggregated.
				</p>
				<p class="mb-4">
					<strong>You can manage your analytics preferences at any time using the controls above.</strong> Analytics are optional and only load with your consent.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Information We Collect</h2>
				<h3 class="text-xl font-semibold mb-3" style="color: var(--text-primary);">Account Information</h3>
				<p class="mb-4">
					When you create an account as a tour guide, we collect:
				</p>
				<ul class="list-disc pl-6 mb-4 space-y-2">
					<li>Name and email address</li>
					<li>Business name and description</li>
					<li>Phone number and location</li>
					<li>Payment information (processed securely by Stripe)</li>
				</ul>

				<h3 class="text-xl font-semibold mb-3 mt-6" style="color: var(--text-primary);">Booking Information</h3>
				<p class="mb-4">
					When customers book tours, we collect:
				</p>
				<ul class="list-disc pl-6 mb-4 space-y-2">
					<li>Customer name, email, and phone number</li>
					<li>Booking details (tour, date, participants)</li>
					<li>Payment information (processed by Stripe)</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">How We Use Your Information</h2>
				<p class="mb-4">We use your information to:</p>
				<ul class="list-disc pl-6 mb-4 space-y-2">
					<li>Provide and maintain our booking platform</li>
					<li>Process bookings and payments</li>
					<li>Send booking confirmations and reminders</li>
					<li>Provide customer support</li>
					<li>Improve our services through anonymized analytics</li>
					<li>Comply with legal obligations</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Data Sharing</h2>
				<p class="mb-4">
					We do not sell your personal information. We share data only with:
				</p>
				<ul class="list-disc pl-6 mb-4 space-y-2">
					<li><strong>Stripe:</strong> For payment processing and fraud prevention. Stripe may use cookies for security purposes. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe's Privacy Policy</a> for details.</li>
					<li><strong>Email service providers:</strong> For transactional emails (booking confirmations, reminders)</li>
					<li><strong>Legal authorities:</strong> When required by law</li>
				</ul>
				<p class="mb-4">
					All third-party services are carefully selected for their security and privacy practices.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Your Rights</h2>
				<p class="mb-4">
					Under GDPR and other privacy laws, you have the right to:
				</p>
				<ul class="list-disc pl-6 mb-4 space-y-2">
					<li>Access your personal data</li>
					<li>Correct inaccurate data</li>
					<li>Request deletion of your data</li>
					<li>Object to data processing</li>
					<li>Data portability</li>
					<li>Withdraw consent at any time</li>
				</ul>
				<p class="mb-4">
					To exercise these rights, please contact us at privacy@zaur.app
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Data Security</h2>
				<p class="mb-4">
					We implement appropriate technical and organizational measures to protect your data, including:
				</p>
				<ul class="list-disc pl-6 mb-4 space-y-2">
					<li>Encrypted connections (SSL/TLS)</li>
					<li>Secure password storage</li>
					<li>Regular security updates</li>
					<li>Access controls and authentication</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">Contact Us</h2>
				<p class="mb-4">
					If you have questions about this Privacy Policy or our data practices, please contact us:
				</p>
				<ul class="list-none mb-4 space-y-2">
					<li><strong>Email:</strong> privacy@zaur.app</li>
					<li><strong>Website:</strong> <a href="https://zaur.app" class="text-primary">https://zaur.app</a></li>
				</ul>
			</section>
		</div>
	</div>
</div>

<style>
	.prose a {
		color: var(--color-primary-600);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	
	.prose a:hover {
		color: var(--color-primary-700);
	}
</style>

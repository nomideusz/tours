<script lang="ts">
	// Privacy Policy page
</script>

<svelte:head>
	<title>Privacy Policy - Zaur</title>
	<meta name="description" content="Privacy Policy for Zaur - How we collect, use, and protect your personal data." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
		<p class="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

		<div class="prose prose-lg max-w-none">
			<section class="mb-8">
				<h2 class="text-2xl font-semibold mb-4" style="color: var(--text-primary);">1. Introduction</h2>
				<p class="mb-4" style="color: var(--text-primary);">
					At Zaur, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains 
					how we collect, use, store, and protect your information when you use our QR booking service for tour guides.
				</p>
				<p class="mb-4" style="color: var(--text-primary);">
					This policy applies to all users of Zaur, including tour guides who subscribe to our service and tourists who book tours 
					through our platform.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">2. Data Controller</h2>
				<p class="text-gray-700 mb-4">
					Zaur is the data controller for the personal data we collect and process. You can contact us at:
				</p>
				<div class="bg-gray-50 p-4 rounded-lg mb-4">
					<p class="text-gray-700">
						<strong>Email:</strong> privacy@zaur.app<br>
						<!-- <strong>Address:</strong> [Your Company Address]<br> -->
						<strong>Website:</strong> <a href="https://zaur.app" class="text-blue-600 hover:text-blue-500">https://zaur.app</a>
					</p>
				</div>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">3. Information We Collect</h2>
				
				<h3 class="text-xl font-semibold mb-3" style="color: var(--text-primary);">3.1 Information You Provide</h3>
				<ul class="list-disc list-inside space-y-2 mb-4" style="color: var(--text-primary);">
					<li><strong>Account Information:</strong> Email address, name, username, password, business name, location</li>
					<li><strong>Profile Information:</strong> Phone number, website, business description, profile photos</li>
					<li><strong>Tour Information:</strong> Tour descriptions, pricing, schedules, meeting points, images</li>
					<li><strong>Subscription Information:</strong> Subscription plan, payment method for monthly/annual fees</li>
					<li><strong>Payment Processing:</strong> Stripe Connect account details for receiving customer payments</li>
					<li><strong>Communication:</strong> Messages, support requests, feedback</li>
				</ul>

				<h3 class="text-xl font-semibold text-gray-900 mb-3">3.2 Booking Information</h3>
				<ul class="list-disc list-inside text-gray-700 space-y-2 mb-4">
					<li><strong>Tourist Information:</strong> Name, email, phone number, special requirements</li>
					<li><strong>Booking Details:</strong> Tour selections, dates, participant counts, payment status</li>
					<li><strong>QR Code Data:</strong> Scan locations, times, device information</li>
				</ul>

				<h3 class="text-xl font-semibold text-gray-900 mb-3">3.3 Automatic Information</h3>
				<ul class="list-disc list-inside text-gray-700 space-y-2">
					<li><strong>Technical Data:</strong> IP address, browser type, device information, operating system</li>
					<li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns</li>
					<li><strong>Location Data:</strong> Approximate location when using location-based features</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">4. How We Use Your Information</h2>
				<p class="text-gray-700 mb-4">We use your personal data for the following purposes:</p>
				
				<h3 class="text-xl font-semibold text-gray-900 mb-3">4.1 Service Provision</h3>
				<ul class="list-disc list-inside text-gray-700 space-y-2 mb-4">
					<li>Creating and managing your account</li>
					<li>Processing tour bookings and payments</li>
					<li>Facilitating communication between guides and tourists</li>
					<li>Generating and managing QR codes</li>
					<li>Providing customer support</li>
				</ul>

				<h3 class="text-xl font-semibold text-gray-900 mb-3">4.2 Business Operations</h3>
				<ul class="list-disc list-inside text-gray-700 space-y-2 mb-4">
					<li>Improving our services and user experience</li>
					<li>Preventing fraud and ensuring security</li>
					<li>Complying with legal obligations</li>
					<li>Analyzing usage patterns and performance</li>
				</ul>

				<h3 class="text-xl font-semibold text-gray-900 mb-3">4.3 Marketing (with consent)</h3>
				<ul class="list-disc list-inside text-gray-700 space-y-2">
					<li>Sending promotional emails and updates</li>
					<li>Personalizing content and recommendations</li>
					<li>Conducting surveys and research</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">5. Legal Basis for Processing</h2>
				<p class="text-gray-700 mb-4">Under GDPR, we process your personal data based on:</p>
				<ul class="list-disc list-inside text-gray-700 space-y-2">
					<li><strong>Contract Performance:</strong> To provide our services and fulfill bookings</li>
					<li><strong>Legitimate Interests:</strong> To improve our services, prevent fraud, and ensure security</li>
					<li><strong>Consent:</strong> For marketing communications and optional features</li>
					<li><strong>Legal Compliance:</strong> To meet regulatory requirements</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">6. Data Sharing and Disclosure</h2>
				<p class="text-gray-700 mb-4">We may share your information with:</p>
				
				<h3 class="text-xl font-semibold text-gray-900 mb-3">6.1 Service Providers</h3>
				<ul class="list-disc list-inside text-gray-700 space-y-2 mb-4">
					<li>Payment processors (Stripe, PayPal) for secure payment handling</li>
					<li>Email service providers for communications</li>
					<li>Cloud hosting providers for data storage</li>
					<li>Analytics providers for service improvement</li>
				</ul>

				<h3 class="text-xl font-semibold text-gray-900 mb-3">6.2 Between Users</h3>
				<ul class="list-disc list-inside text-gray-700 space-y-2 mb-4">
					<li>Tourist contact information with tour guides for booked tours</li>
					<li>Guide contact information with tourists for confirmed bookings</li>
				</ul>

				<h3 class="text-xl font-semibold text-gray-900 mb-3">6.3 Legal Requirements</h3>
				<p class="text-gray-700 mb-4">
					We may disclose your information if required by law, court order, or to protect our rights and safety.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">7. Data Security</h2>
				<p class="text-gray-700 mb-4">We implement appropriate security measures to protect your data:</p>
				<ul class="list-disc list-inside text-gray-700 space-y-2">
					<li>Encryption of data in transit and at rest</li>
					<li>Regular security audits and updates</li>
					<li>Access controls and authentication</li>
					<li>Secure payment processing</li>
					<li>Regular data backups</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
				<p class="text-gray-700 mb-4">We retain your personal data for as long as necessary to:</p>
				<ul class="list-disc list-inside text-gray-700 space-y-2">
					<li>Provide our services to you</li>
					<li>Comply with legal obligations</li>
					<li>Resolve disputes and enforce agreements</li>
					<li>Improve our services (in anonymized form)</li>
				</ul>
				<p class="text-gray-700 mt-4">
					Account data is typically retained for 3 years after account closure. 
					Booking data is retained for 7 years for tax and legal compliance.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">9. Your Rights Under GDPR</h2>
				<p class="text-gray-700 mb-4">As a data subject, you have the right to:</p>
				<ul class="list-disc list-inside text-gray-700 space-y-2">
					<li><strong>Access:</strong> Request a copy of your personal data</li>
					<li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
					<li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
					<li><strong>Portability:</strong> Receive your data in a portable format</li>
					<li><strong>Restriction:</strong> Limit how we process your data</li>
					<li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
					<li><strong>Withdraw Consent:</strong> Withdraw consent for marketing communications</li>
				</ul>
				<p class="text-gray-700 mt-4">
					To exercise these rights, contact us at privacy@zaur.app. We will respond within 30 days.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
				<p class="text-gray-700 mb-4">
					Your data may be transferred to and processed in countries outside the European Economic Area (EEA). 
					We ensure appropriate safeguards are in place, including:
				</p>
				<ul class="list-disc list-inside text-gray-700 space-y-2">
					<li>Standard Contractual Clauses approved by the European Commission</li>
					<li>Adequacy decisions for certain countries</li>
					<li>Certification schemes and codes of conduct</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">11. Cookies and Tracking</h2>
				<p class="text-gray-700 mb-4">We use cookies and similar technologies to:</p>
				<ul class="list-disc list-inside text-gray-700 space-y-2">
					<li>Keep you logged in</li>
					<li>Remember your preferences</li>
					<li>Analyze website usage</li>
					<li>Improve user experience</li>
				</ul>
				<p class="text-gray-700 mt-4">
					You can control cookies through your browser settings. Disabling cookies may affect functionality.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">12. Children's Privacy</h2>
				<p class="text-gray-700 mb-4">
					Our services are not intended for children under 16. We do not knowingly collect personal data from children. 
					If we become aware of such collection, we will delete the data immediately.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">13. Changes to This Policy</h2>
				<p class="text-gray-700 mb-4">
					We may update this Privacy Policy from time to time. We will notify you of significant changes via email 
					or through our service. Your continued use constitutes acceptance of the updated policy.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">14. Contact Us</h2>
				<p class="text-gray-700 mb-4">
					If you have questions about this Privacy Policy or our data practices, please contact us:
				</p>
				<div class="bg-gray-50 p-4 rounded-lg">
					<p class="text-gray-700">
						<strong>Data Protection Officer:</strong> privacy@zaur.app<br>
						<strong>General Inquiries:</strong> support@zaur.app<br>
						<strong>Website:</strong> <a href="https://zaur.app" class="text-blue-600 hover:text-blue-500">https://zaur.app</a>
					</p>
				</div>
				<p class="text-gray-700 mt-4">
					You also have the right to lodge a complaint with your local data protection authority if you believe 
					we have not handled your data properly.
				</p>
			</section>
		</div>
	</div>
</div> 
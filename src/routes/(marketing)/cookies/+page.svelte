<script lang="ts">
	import Cookie from 'lucide-svelte/icons/cookie';
	import Shield from 'lucide-svelte/icons/shield';
	import Settings from 'lucide-svelte/icons/settings';
	import Globe from 'lucide-svelte/icons/globe';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
</script>

<svelte:head>
	<title>Cookie Policy - Zaur</title>
	<meta name="description" content="Cookie Policy for Zaur - How we use cookies to improve your browsing experience and website functionality." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="max-w-4xl mx-auto">
			<!-- Professional Header -->
			<div class="text-center mb-16">
				<div class="professional-badge mb-6">
					<Cookie class="w-4 h-4" />
					<span>Cookie Policy</span>
				</div>
				<h1 class="marketing-heading marketing-heading-xl mb-6">Cookie Policy</h1>
				<p class="text-lg text-secondary mb-8">
					Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
				</p>
			</div>

			<div class="space-y-8">
				<!-- What Are Cookies -->
				<div class="professional-card">
					<h2 class="section-heading">What Are Cookies?</h2>
					<p class="section-text">
						Cookies are small text files that are stored on your device when you visit our website. 
						They help us provide you with a better experience by remembering your preferences and analyzing how you use our service.
					</p>
				</div>

				<!-- How We Use Cookies -->
				<div class="professional-card">
					<h2 class="section-heading">How We Use Cookies</h2>
					<p class="section-text mb-6">We use cookies for the following purposes:</p>
					
					<!-- Essential Cookies -->
					<div class="cookie-category mb-8">
						<div class="flex items-center gap-3 mb-4">
							<div class="professional-icon-small professional-icon--coral">
								<Shield class="w-4 h-4" />
							</div>
							<h3 class="subsection-heading">Essential Cookies</h3>
						</div>
						<p class="section-text mb-4">These cookies are necessary for the website to function properly. They include:</p>
						<ul class="cookie-list">
							<li><strong>Authentication:</strong> Keep you logged in to your account</li>
							<li><strong>Security:</strong> Protect against cross-site request forgery</li>
							<li><strong>Preferences:</strong> Remember your language and theme settings</li>
						</ul>
					</div>

					<!-- Analytics Cookies -->
					<div class="cookie-category mb-8">
						<div class="flex items-center gap-3 mb-4">
							<div class="professional-icon-small professional-icon--teal">
								<Globe class="w-4 h-4" />
							</div>
							<h3 class="subsection-heading">Analytics Cookies</h3>
						</div>
						<p class="section-text mb-4">These cookies help us understand how visitors use our website:</p>
						<ul class="cookie-list">
							<li><strong>Umami Analytics:</strong> Privacy-focused website analytics</li>
							<li><strong>Performance Monitoring:</strong> Track page load times and errors</li>
							<li><strong>Feature Usage:</strong> Understand which features are most popular</li>
						</ul>
					</div>

					<!-- Functional Cookies -->
					<div class="cookie-category">
						<div class="flex items-center gap-3 mb-4">
							<div class="professional-icon-small professional-icon--orange">
								<Settings class="w-4 h-4" />
							</div>
							<h3 class="subsection-heading">Functional Cookies</h3>
						</div>
						<p class="section-text mb-4">These cookies enhance your experience:</p>
						<ul class="cookie-list">
							<li><strong>User Interface:</strong> Remember your dashboard layout preferences</li>
							<li><strong>Tour Settings:</strong> Save your default tour configurations</li>
							<li><strong>Booking History:</strong> Track your recent activities for quick access</li>
						</ul>
					</div>
				</div>

				<!-- Cookie Categories -->
				<div class="professional-card">
					<h2 class="section-heading">Cookie Categories</h2>
					<div class="cookie-grid">
						<div class="cookie-grid-item">
							<h4 class="cookie-grid-title">Session Cookies</h4>
							<p class="cookie-grid-text">Temporary cookies that expire when you close your browser</p>
						</div>
						<div class="cookie-grid-item">
							<h4 class="cookie-grid-title">Persistent Cookies</h4>
							<p class="cookie-grid-text">Cookies that remain on your device for a set period</p>
						</div>
						<div class="cookie-grid-item">
							<h4 class="cookie-grid-title">First-Party Cookies</h4>
							<p class="cookie-grid-text">Cookies set directly by Zaur</p>
						</div>
						<div class="cookie-grid-item">
							<h4 class="cookie-grid-title">Third-Party Cookies</h4>
							<p class="cookie-grid-text">Cookies set by our trusted partners (analytics, payments)</p>
						</div>
					</div>
				</div>

				<!-- Managing Cookie Preferences -->
				<div class="professional-card">
					<h2 class="section-heading">Managing Your Cookie Preferences</h2>
					<p class="section-text mb-6">You have several options for managing cookies:</p>
					
					<div class="space-y-6">
						<div>
							<h3 class="subsection-heading mb-4">Browser Settings</h3>
							<p class="section-text mb-4">Most browsers allow you to:</p>
							<ul class="cookie-list">
								<li>View and delete cookies</li>
								<li>Block cookies from specific websites</li>
								<li>Block third-party cookies</li>
								<li>Clear all cookies when you close the browser</li>
							</ul>
						</div>

						<div>
							<h3 class="subsection-heading mb-4">Browser-Specific Instructions</h3>
							<div class="browser-grid">
								<div class="browser-item">
									<h4 class="browser-title">Chrome</h4>
									<p class="browser-text">Settings → Privacy and Security → Cookies and other site data</p>
								</div>
								<div class="browser-item">
									<h4 class="browser-title">Firefox</h4>
									<p class="browser-text">Options → Privacy & Security → Cookies and Site Data</p>
								</div>
								<div class="browser-item">
									<h4 class="browser-title">Safari</h4>
									<p class="browser-text">Preferences → Privacy → Manage Website Data</p>
								</div>
								<div class="browser-item">
									<h4 class="browser-title">Edge</h4>
									<p class="browser-text">Settings → Cookies and site permissions → Cookies and site data</p>
								</div>
							</div>
						</div>

						<div class="warning-card">
							<div class="flex items-start gap-3">
								<AlertTriangle class="w-5 h-5 text-secondary-600 flex-shrink-0 mt-0.5" />
								<div>
									<p class="warning-text">
										<strong>Note:</strong> Disabling essential cookies may affect the functionality of our website. 
										Some features may not work properly if you block all cookies.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Third-Party Services -->
				<div class="professional-card">
					<h2 class="section-heading">Third-Party Services</h2>
					<p class="section-text mb-6">We use the following third-party services that may set cookies:</p>
					
					<div class="space-y-4">
						<div class="service-item">
							<h4 class="service-title">Umami Analytics</h4>
							<p class="service-description">Privacy-focused website analytics</p>
							<div class="service-details">
								<p>Purpose: Track website usage and performance</p>
								<p>Data retention: 24 months</p>
							</div>
						</div>
						
						<div class="service-item">
							<h4 class="service-title">Stripe</h4>
							<p class="service-description">Payment processing</p>
							<div class="service-details">
								<p>Purpose: Secure payment transactions</p>
								<p>Privacy Policy: <a href="https://stripe.com/privacy" target="_blank" class="service-link">https://stripe.com/privacy</a></p>
							</div>
						</div>
					</div>
				</div>

				<!-- Cookie Retention -->
				<div class="professional-card">
					<h2 class="section-heading">Cookie Retention</h2>
					<p class="section-text mb-4">Different cookies have different retention periods:</p>
					<ul class="cookie-list">
						<li><strong>Session cookies:</strong> Deleted when you close your browser</li>
						<li><strong>Authentication cookies:</strong> 30 days or until you log out</li>
						<li><strong>Preference cookies:</strong> 1 year</li>
						<li><strong>Analytics cookies:</strong> 2 years</li>
					</ul>
				</div>

				<!-- Updates -->
				<div class="professional-card">
					<h2 class="section-heading">Updates to This Policy</h2>
					<p class="section-text">
						We may update this Cookie Policy from time to time to reflect changes in our practices or applicable laws. 
						We will notify you of any significant changes by posting the updated policy on our website.
					</p>
				</div>

				<!-- Contact -->
				<div class="professional-card">
					<h2 class="section-heading">Contact Us</h2>
					<p class="section-text mb-6">
						If you have questions about our use of cookies, please contact us:
					</p>
					<div class="contact-info">
						<p class="contact-text">
							<strong>Email:</strong> privacy@zaur.app<br>
							<strong>Website:</strong> <a href="https://zaur.app" class="service-link">https://zaur.app</a>
						</p>
					</div>
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
		border: 2px solid var(--color-primary-500);
		color: var(--text-primary);
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		font-weight: 600;
		font-size: 0.875rem;
		box-shadow: var(--shadow-sm);
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
		background: var(--color-primary-500);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}
	
	.professional-card:hover::before {
		transform: scaleX(1);
	}

	/* Typography */
	.section-heading {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.subsection-heading {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.section-text {
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	.section-text:last-child {
		margin-bottom: 0;
	}

	/* Cookie lists */
	.cookie-list {
		list-style: disc;
		list-style-position: inside;
		color: var(--text-secondary);
		line-height: 1.6;
		space-y: 0.5rem;
	}

	.cookie-list li {
		margin-bottom: 0.5rem;
	}

	/* Professional icons */
	.professional-icon-small {
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		box-shadow: var(--shadow-sm);
		flex-shrink: 0;
	}

	.professional-icon--coral {
		background: var(--color-primary-500);
	}

	.professional-icon--teal {
		background: var(--color-success-500);
	}

	.professional-icon--orange {
		background: var(--color-secondary-500);
	}

	/* Cookie grid */
	.cookie-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.cookie-grid-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		padding: 1.5rem;
	}

	.cookie-grid-title {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.cookie-grid-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	/* Browser grid */
	.browser-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.browser-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		padding: 1rem;
	}

	.browser-title {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.browser-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	/* Warning card */
	.warning-card {
		background: var(--color-secondary-50);
		border: 1px solid var(--color-secondary-200);
		border-radius: var(--radius-lg);
		padding: 1rem;
	}

	.warning-text {
		font-size: 0.875rem;
		color: var(--color-secondary-800);
	}

	/* Service items */
	.service-item {
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		background: var(--bg-secondary);
	}

	.service-title {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.service-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
	}

	.service-details {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		line-height: 1.5;
	}

	.service-details p {
		margin-bottom: 0.25rem;
	}

	.service-link {
		color: var(--color-primary-600);
		text-decoration: none;
		transition: color var(--transition-base) ease;
	}

	.service-link:hover {
		color: var(--color-primary-700);
		text-decoration: underline;
	}

	/* Contact info */
	.contact-info {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
	}

	.contact-text {
		color: var(--text-secondary);
		line-height: 1.6;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.professional-card {
			padding: 1.5rem;
		}

		.cookie-grid {
			grid-template-columns: 1fr;
		}

		.browser-grid {
			grid-template-columns: 1fr;
		}
	}
</style> 
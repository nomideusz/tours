<script lang="ts">
	import Shield from 'lucide-svelte/icons/shield';
	import Eye from 'lucide-svelte/icons/eye';
	import Lock from 'lucide-svelte/icons/lock';
	import Mail from 'lucide-svelte/icons/mail';
	import Database from 'lucide-svelte/icons/database';
	import Users from 'lucide-svelte/icons/users';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
</script>

<svelte:head>
	<title>Privacy Policy - Zaur</title>
	<meta name="description" content="Privacy Policy for Zaur - How we collect, use, and protect your personal data and information." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="max-w-4xl mx-auto">
			<!-- Professional Header -->
			<div class="text-center mb-16">
				<div class="professional-badge mb-6">
					<Shield class="w-4 h-4" />
					<span>Privacy Policy</span>
				</div>
				<h1 class="marketing-heading marketing-heading-xl mb-6">Privacy Policy</h1>
				<p class="text-lg text-secondary mb-8">
					Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
				</p>
			</div>

			<div class="space-y-8">
				<!-- Introduction -->
				<div class="professional-card">
					<h2 class="section-heading">Introduction</h2>
					<p class="section-text">
						At Zaur, we respect your privacy and are committed to protecting your personal data. 
						This Privacy Policy explains how we collect, use, and safeguard your information when you use our QR booking system for tour guides.
					</p>
					<p class="section-text">
						This policy applies to all users of our platform, including tour guides and their customers.
					</p>
				</div>

				<!-- Data Collection -->
				<div class="professional-card">
					<h2 class="section-heading">Information We Collect</h2>
					<p class="section-text mb-6">We collect different types of information depending on how you use our service:</p>
					
					<!-- Account Information -->
					<div class="data-category mb-8">
						<div class="flex items-center gap-3 mb-4">
							<div class="professional-icon-small professional-icon--coral">
								<Users class="w-4 h-4" />
							</div>
							<h3 class="subsection-heading">Account Information</h3>
						</div>
						<p class="section-text mb-4">When you create an account, we collect:</p>
						<ul class="data-list">
							<li><strong>Personal Details:</strong> Name, email address, phone number</li>
							<li><strong>Business Information:</strong> Business name, location, website</li>
							<li><strong>Profile Data:</strong> Profile picture, bio, tour descriptions</li>
							<li><strong>Payment Information:</strong> Stripe Connect account details (securely handled by Stripe)</li>
						</ul>
					</div>

					<!-- Booking Information -->
					<div class="data-category mb-8">
						<div class="flex items-center gap-3 mb-4">
							<div class="professional-icon-small professional-icon--teal">
								<Database class="w-4 h-4" />
							</div>
							<h3 class="subsection-heading">Booking Information</h3>
						</div>
						<p class="section-text mb-4">When bookings are made through our platform:</p>
						<ul class="data-list">
							<li><strong>Customer Details:</strong> Name, email, phone number</li>
							<li><strong>Booking Data:</strong> Tour dates, times, number of participants</li>
							<li><strong>Payment Information:</strong> Transaction details (processed securely by Stripe)</li>
							<li><strong>Communication:</strong> Messages between tour guides and customers</li>
						</ul>
					</div>

					<!-- Usage Data -->
					<div class="data-category">
						<div class="flex items-center gap-3 mb-4">
							<div class="professional-icon-small professional-icon--orange">
								<Eye class="w-4 h-4" />
							</div>
							<h3 class="subsection-heading">Usage Data</h3>
						</div>
						<p class="section-text mb-4">We automatically collect certain information about how you use our service:</p>
						<ul class="data-list">
							<li><strong>Device Information:</strong> IP address, browser type, device type</li>
							<li><strong>Usage Analytics:</strong> Page views, feature usage, time spent</li>
							<li><strong>QR Code Scans:</strong> Scan counts and conversion rates</li>
							<li><strong>Performance Data:</strong> Error logs, load times</li>
						</ul>
					</div>
				</div>

				<!-- How We Use Information -->
				<div class="professional-card">
					<h2 class="section-heading">How We Use Your Information</h2>
					<p class="section-text mb-6">We use your information for the following purposes:</p>
					
					<div class="purpose-grid">
						<div class="purpose-item">
							<div class="purpose-icon">
								<CheckCircle class="w-5 h-5 text-pro-teal-600" />
							</div>
							<div class="purpose-content">
								<h4 class="purpose-title">Provide Services</h4>
								<p class="purpose-text">Enable tour booking, payment processing, and communication between guides and customers</p>
							</div>
						</div>
						
						<div class="purpose-item">
							<div class="purpose-icon">
								<CheckCircle class="w-5 h-5 text-pro-teal-600" />
							</div>
							<div class="purpose-content">
								<h4 class="purpose-title">Account Management</h4>
								<p class="purpose-text">Create and maintain your account, authenticate users, and provide customer support</p>
							</div>
						</div>
						
						<div class="purpose-item">
							<div class="purpose-icon">
								<CheckCircle class="w-5 h-5 text-pro-teal-600" />
							</div>
							<div class="purpose-content">
								<h4 class="purpose-title">Service Improvement</h4>
								<p class="purpose-text">Analyze usage patterns to improve our platform and develop new features</p>
							</div>
						</div>
						
						<div class="purpose-item">
							<div class="purpose-icon">
								<CheckCircle class="w-5 h-5 text-pro-teal-600" />
							</div>
							<div class="purpose-content">
								<h4 class="purpose-title">Communication</h4>
								<p class="purpose-text">Send booking confirmations, updates, and important service notifications</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Data Sharing -->
				<div class="professional-card">
					<h2 class="section-heading">Data Sharing and Disclosure</h2>
					<p class="section-text mb-6">We share your information in the following limited circumstances:</p>
					
					<div class="sharing-category mb-6">
						<h3 class="subsection-heading mb-4">With Your Consent</h3>
						<p class="section-text">We share information when you specifically give us permission to do so, such as when you make a booking with a tour guide.</p>
					</div>
					
					<div class="sharing-category mb-6">
						<h3 class="subsection-heading mb-4">Service Providers</h3>
						<p class="section-text mb-4">We work with trusted third-party services:</p>
						<ul class="data-list">
							<li><strong>Stripe:</strong> Payment processing and financial services</li>
							<li><strong>Umami:</strong> Privacy-focused website analytics</li>
							<li><strong>Email Service:</strong> Transactional emails and notifications</li>
						</ul>
					</div>
					
					<div class="sharing-category mb-6">
						<h3 class="subsection-heading mb-4">Legal Requirements</h3>
						<p class="section-text">We may disclose information if required by law or to protect our rights and safety.</p>
					</div>
					
					<div class="privacy-commitment">
						<div class="flex items-start gap-3">
							<AlertTriangle class="w-5 h-5 text-coral-600 flex-shrink-0 mt-0.5" />
							<div>
								<p class="commitment-text">
									<strong>We Never:</strong> Sell your personal data to third parties, use your data for advertising purposes, or share your information without your consent (except as described above).
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Data Security -->
				<div class="professional-card">
					<h2 class="section-heading">Data Security</h2>
					<p class="section-text mb-6">We implement industry-standard security measures to protect your information:</p>
					
					<div class="security-grid">
						<div class="security-item">
							<div class="security-icon">
								<Lock class="w-5 h-5 text-deep-navy-600" />
							</div>
							<div class="security-content">
								<h4 class="security-title">Encryption</h4>
								<p class="security-text">All data is encrypted in transit and at rest using industry-standard protocols</p>
							</div>
						</div>
						
						<div class="security-item">
							<div class="security-icon">
								<Shield class="w-5 h-5 text-deep-navy-600" />
							</div>
							<div class="security-content">
								<h4 class="security-title">Access Control</h4>
								<p class="security-text">Strict access controls ensure only authorized personnel can access your data</p>
							</div>
						</div>
						
						<div class="security-item">
							<div class="security-icon">
								<Database class="w-5 h-5 text-deep-navy-600" />
							</div>
							<div class="security-content">
								<h4 class="security-title">Secure Infrastructure</h4>
								<p class="security-text">Our systems are hosted on secure cloud infrastructure with regular security updates</p>
							</div>
						</div>
						
						<div class="security-item">
							<div class="security-icon">
								<Eye class="w-5 h-5 text-deep-navy-600" />
							</div>
							<div class="security-content">
								<h4 class="security-title">Monitoring</h4>
								<p class="security-text">Continuous monitoring for security threats and suspicious activity</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Your Rights -->
				<div class="professional-card">
					<h2 class="section-heading">Your Rights</h2>
					<p class="section-text mb-6">You have the following rights regarding your personal data:</p>
					
					<div class="rights-list">
						<div class="right-item">
							<h4 class="right-title">Access</h4>
							<p class="right-text">Request a copy of the personal data we hold about you</p>
						</div>
						
						<div class="right-item">
							<h4 class="right-title">Correction</h4>
							<p class="right-text">Request correction of inaccurate or incomplete data</p>
						</div>
						
						<div class="right-item">
							<h4 class="right-title">Deletion</h4>
							<p class="right-text">Request deletion of your personal data (subject to certain limitations)</p>
						</div>
						
						<div class="right-item">
							<h4 class="right-title">Portability</h4>
							<p class="right-text">Request a copy of your data in a structured, machine-readable format</p>
						</div>
						
						<div class="right-item">
							<h4 class="right-title">Objection</h4>
							<p class="right-text">Object to certain processing of your personal data</p>
						</div>
						
						<div class="right-item">
							<h4 class="right-title">Restriction</h4>
							<p class="right-text">Request restriction of processing under certain circumstances</p>
						</div>
					</div>
					
					<p class="section-text mt-6">
						To exercise these rights, please contact us at privacy@zaur.app. We will respond to your request within 30 days.
					</p>
				</div>

				<!-- Data Retention -->
				<div class="professional-card">
					<h2 class="section-heading">Data Retention</h2>
					<p class="section-text mb-4">We retain your information for as long as necessary to provide our services:</p>
					<ul class="data-list">
						<li><strong>Account Data:</strong> Retained while your account is active</li>
						<li><strong>Booking Records:</strong> Retained for 7 years for tax and legal purposes</li>
						<li><strong>Analytics Data:</strong> Retained for 2 years in anonymized form</li>
						<li><strong>Marketing Data:</strong> Retained until you opt out</li>
					</ul>
				</div>

				<!-- International Transfers -->
				<div class="professional-card">
					<h2 class="section-heading">International Data Transfers</h2>
					<p class="section-text">
						Your data may be transferred to and processed in countries outside your home country. 
						We ensure appropriate safeguards are in place to protect your data in accordance with applicable data protection laws.
					</p>
				</div>

				<!-- Children's Privacy -->
				<div class="professional-card">
					<h2 class="section-heading">Children's Privacy</h2>
					<p class="section-text">
						Our service is not intended for children under 16. We do not knowingly collect personal information from children under 16. 
						If you believe we have collected information from a child under 16, please contact us immediately.
					</p>
				</div>

				<!-- Updates -->
				<div class="professional-card">
					<h2 class="section-heading">Updates to This Policy</h2>
					<p class="section-text">
						We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. 
						We will notify you of any significant changes by posting the updated policy on our website and, where required, by email.
					</p>
				</div>

				<!-- Contact -->
				<div class="professional-card">
					<h2 class="section-heading">Contact Us</h2>
					<p class="section-text mb-6">
						If you have questions about this Privacy Policy or our data practices, please contact us:
					</p>
					<div class="contact-info">
						<div class="contact-item">
							<div class="contact-icon">
								<Mail class="w-5 h-5 text-coral-600" />
							</div>
							<div class="contact-content">
								<p class="contact-text">
									<strong>Email:</strong> privacy@zaur.app
								</p>
							</div>
						</div>
						
						<div class="contact-item">
							<div class="contact-icon">
								<Shield class="w-5 h-5 text-coral-600" />
							</div>
							<div class="contact-content">
								<p class="contact-text">
									<strong>Data Protection Officer:</strong> dpo@zaur.app
								</p>
							</div>
						</div>
						
						<div class="contact-item">
							<div class="contact-icon">
								<Users class="w-5 h-5 text-coral-600" />
							</div>
							<div class="contact-content">
								<p class="contact-text">
									<strong>Website:</strong> <a href="https://zaur.app" class="service-link">https://zaur.app</a>
								</p>
							</div>
						</div>
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
		border: 2px solid var(--color-coral-500);
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
		background: var(--color-coral-500);
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

	/* Data lists */
	.data-list {
		list-style: disc;
		list-style-position: inside;
		color: var(--text-secondary);
		line-height: 1.6;
		space-y: 0.5rem;
	}

	.data-list li {
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
		background: var(--color-coral-500);
	}

	.professional-icon--teal {
		background: var(--color-pro-teal-500);
	}

	.professional-icon--orange {
		background: var(--color-warm-orange-500);
	}

	/* Purpose grid */
	.purpose-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.purpose-item {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
	}

	.purpose-icon {
		flex-shrink: 0;
		margin-top: 0.25rem;
	}

	.purpose-content {
		flex: 1;
	}

	.purpose-title {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.purpose-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	/* Security grid */
	.security-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.security-item {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
	}

	.security-icon {
		flex-shrink: 0;
		margin-top: 0.25rem;
	}

	.security-content {
		flex: 1;
	}

	.security-title {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.security-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	/* Rights list */
	.rights-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
	}

	.right-item {
		padding: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
	}

	.right-title {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.right-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	/* Privacy commitment */
	.privacy-commitment {
		background: var(--color-coral-50);
		border: 1px solid var(--color-coral-200);
		border-radius: var(--radius-lg);
		padding: 1rem;
		margin-top: 1.5rem;
	}

	.commitment-text {
		font-size: 0.875rem;
		color: var(--color-coral-800);
	}

	/* Contact info */
	.contact-info {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
	}

	.contact-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.contact-item:last-child {
		margin-bottom: 0;
	}

	.contact-icon {
		flex-shrink: 0;
	}

	.contact-content {
		flex: 1;
	}

	.contact-text {
		color: var(--text-secondary);
		line-height: 1.6;
	}

	.service-link {
		color: var(--color-coral-600);
		text-decoration: none;
		transition: color var(--transition-base) ease;
	}

	.service-link:hover {
		color: var(--color-coral-700);
		text-decoration: underline;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.professional-card {
			padding: 1.5rem;
		}

		.purpose-grid {
			grid-template-columns: 1fr;
		}

		.security-grid {
			grid-template-columns: 1fr;
		}

		.rights-list {
			grid-template-columns: 1fr;
		}
	}
</style> 
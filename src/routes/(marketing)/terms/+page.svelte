<script lang="ts">
	import FileText from 'lucide-svelte/icons/file-text';
	import Gavel from 'lucide-svelte/icons/gavel';
	import Shield from 'lucide-svelte/icons/shield';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Users from 'lucide-svelte/icons/users';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
</script>

<svelte:head>
	<title>Terms of Service - Zaur</title>
	<meta name="description" content="Terms of Service for Zaur - The legal terms and conditions for using our QR booking platform for tour guides." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="subtle-retro-section py-20">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="max-w-4xl mx-auto">
			<!-- Professional Header -->
			<div class="text-center mb-16">
				<div class="professional-badge mb-6">
					<FileText class="w-4 h-4" />
					<span>Terms of Service</span>
				</div>
				<h1 class="marketing-heading marketing-heading-xl mb-6">Terms of Service</h1>
				<p class="text-lg text-secondary mb-8">
					Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
				</p>
			</div>

			<div class="space-y-8">
				<!-- Introduction -->
				<div class="professional-card">
					<h2 class="section-heading">Agreement to Terms</h2>
					<p class="section-text">
						By accessing and using Zaur's QR booking platform, you agree to be bound by these Terms of Service. 
						If you do not agree to these terms, please do not use our service.
					</p>
					<p class="section-text">
						These terms apply to all users of our platform, including tour guides and their customers.
					</p>
				</div>

				<!-- Service Description -->
				<div class="professional-card">
					<h2 class="section-heading">Service Description</h2>
					<p class="section-text mb-6">Zaur provides a QR code-based booking platform that enables:</p>
					
					<div class="service-features">
						<div class="feature-item">
							<div class="feature-icon">
								<CheckCircle class="w-5 h-5 text-success-600" />
							</div>
							<div class="feature-content">
								<h4 class="feature-title">Tour Guide Tools</h4>
								<p class="feature-text">Dashboard for managing tours, schedules, and bookings</p>
							</div>
						</div>
						
						<div class="feature-item">
							<div class="feature-icon">
								<CheckCircle class="w-5 h-5 text-success-600" />
							</div>
							<div class="feature-content">
								<h4 class="feature-title">QR Code System</h4>
								<p class="feature-text">Generate and manage QR codes for tour bookings</p>
							</div>
						</div>
						
						<div class="feature-item">
							<div class="feature-icon">
								<CheckCircle class="w-5 h-5 text-success-600" />
							</div>
							<div class="feature-content">
								<h4 class="feature-title">Payment Processing</h4>
								<p class="feature-text">Secure payment handling through Stripe Connect</p>
							</div>
						</div>
						
						<div class="feature-item">
							<div class="feature-icon">
								<CheckCircle class="w-5 h-5 text-success-600" />
							</div>
							<div class="feature-content">
								<h4 class="feature-title">Customer Communication</h4>
								<p class="feature-text">Booking confirmations and customer notifications</p>
							</div>
						</div>
					</div>
				</div>

				<!-- User Accounts -->
				<div class="professional-card">
					<h2 class="section-heading">User Accounts</h2>
					<p class="section-text mb-6">To use our platform, you must create an account and agree to:</p>
					
					<div class="account-requirements">
						<div class="requirement-category mb-8">
							<div class="flex items-center gap-3 mb-4">
								<div class="professional-icon-small professional-icon--coral">
									<Users class="w-4 h-4" />
								</div>
								<h3 class="subsection-heading">Account Responsibilities</h3>
							</div>
							<ul class="requirements-list">
								<li>Provide accurate and complete information</li>
								<li>Keep your account credentials secure</li>
								<li>Notify us immediately of any unauthorized access</li>
								<li>Be responsible for all activities under your account</li>
								<li>Comply with all applicable laws and regulations</li>
							</ul>
						</div>
						
						<div class="requirement-category">
							<div class="flex items-center gap-3 mb-4">
								<div class="professional-icon-small professional-icon--orange">
									<Shield class="w-4 h-4" />
								</div>
								<h3 class="subsection-heading">Eligibility Requirements</h3>
							</div>
							<ul class="requirements-list">
								<li>Must be at least 18 years old</li>
								<li>Must have legal capacity to enter into agreements</li>
								<li>Must be authorized to conduct business in your jurisdiction</li>
								<li>Must comply with local tourism and business regulations</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Subscription and Billing -->
				<div class="professional-card">
					<h2 class="section-heading">Subscription and Billing</h2>
					<p class="section-text mb-6">Our platform operates on a subscription model:</p>
					
					<div class="billing-info">
						<div class="billing-section mb-6">
							<div class="flex items-center gap-3 mb-4">
								<div class="professional-icon-small professional-icon--teal">
									<CreditCard class="w-4 h-4" />
								</div>
								<h3 class="subsection-heading">Subscription Plans</h3>
							</div>
							<p class="section-text mb-4">We offer several subscription tiers:</p>
							<ul class="billing-list">
								<li><strong>Free Starter:</strong> €0/month - 3 bookings/month, 1 tour type</li>
								<li><strong>Essential:</strong> €25/month (€20.83/month annually) - 60 bookings/month, 5 tour types</li>
								<li><strong>Premium:</strong> €49/month (€40.83/month annually) - Unlimited bookings and tours</li>
								<li><strong>Agency:</strong> €115/month (€95/month annually) - Team management features</li>
							</ul>
						</div>
						
						<div class="billing-section">
							<h3 class="subsection-heading mb-4">Billing Terms</h3>
							<ul class="billing-list">
								<li>Subscriptions are available as monthly or annual plans</li>
								<li>Annual plans offer significant savings (approximately 15% discount)</li>
								<li>All subscriptions are billed in advance</li>
								<li>All fees are non-refundable unless required by law</li>
								<li>We may change pricing with 30 days' notice</li>
								<li>Failed payments may result in service suspension</li>
								<li>You can cancel your subscription at any time</li>
							</ul>
						</div>
					</div>
					
					<div class="pricing-commitment">
						<div class="flex items-start gap-3">
							<CheckCircle class="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
							<div>
								<p class="commitment-text">
									<strong>No Commission Fees:</strong> We never take a percentage of your bookings. You keep 100% of your tour revenue.
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Acceptable Use -->
				<div class="professional-card">
					<h2 class="section-heading">Acceptable Use</h2>
					<p class="section-text mb-6">When using our platform, you agree to:</p>
					
					<div class="use-policies">
						<div class="policy-section mb-8">
							<div class="flex items-center gap-3 mb-4">
								<div class="professional-icon-small professional-icon--teal">
									<CheckCircle class="w-4 h-4" />
								</div>
								<h3 class="subsection-heading">Permitted Uses</h3>
							</div>
							<ul class="policy-list">
								<li>Use the platform for legitimate tour guide business</li>
								<li>Provide accurate tour information and pricing</li>
								<li>Respond promptly to customer inquiries</li>
								<li>Deliver tours as advertised</li>
								<li>Respect customer privacy and data</li>
							</ul>
						</div>
						
						<div class="policy-section">
							<div class="flex items-center gap-3 mb-4">
								<div class="professional-icon-small professional-icon--coral">
									<XCircle class="w-4 h-4" />
								</div>
								<h3 class="subsection-heading">Prohibited Uses</h3>
							</div>
							<ul class="policy-list">
								<li>Violate any applicable laws or regulations</li>
								<li>Infringe on intellectual property rights</li>
								<li>Engage in fraudulent or deceptive practices</li>
								<li>Harass, abuse, or harm others</li>
								<li>Distribute malware or harmful content</li>
								<li>Attempt to breach security measures</li>
								<li>Use the platform for any illegal activities</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Payment Processing -->
				<div class="professional-card">
					<h2 class="section-heading">Payment Processing</h2>
					<p class="section-text mb-6">Payment processing is handled through Stripe Connect:</p>
					
					<div class="payment-terms">
						<div class="payment-section mb-6">
							<h3 class="subsection-heading mb-4">Tour Guide Payments</h3>
							<ul class="payment-list">
								<li>You must set up a Stripe Connect account</li>
								<li>Payments are processed directly to your account</li>
								<li>Stripe's terms and fees apply to all transactions</li>
								<li>You are responsible for tax compliance</li>
								<li>Refunds are handled according to your policies</li>
							</ul>
						</div>
						
						<div class="payment-section">
							<h3 class="subsection-heading mb-4">Customer Payments</h3>
							<ul class="payment-list">
								<li>All payments are processed securely by Stripe</li>
								<li>We do not store customer payment information</li>
								<li>Payment disputes are handled through Stripe</li>
								<li>Customers may be subject to additional fees</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Intellectual Property -->
				<div class="professional-card">
					<h2 class="section-heading">Intellectual Property</h2>
					<p class="section-text mb-6">Intellectual property rights are distributed as follows:</p>
					
					<div class="ip-sections">
						<div class="ip-section mb-6">
							<h3 class="subsection-heading mb-4">Our Rights</h3>
							<p class="section-text mb-4">Zaur owns all rights to:</p>
							<ul class="ip-list">
								<li>The Zaur platform and software</li>
								<li>Our trademarks, logos, and branding</li>
								<li>Platform documentation and materials</li>
								<li>System-generated QR codes and analytics</li>
							</ul>
						</div>
						
						<div class="ip-section">
							<h3 class="subsection-heading mb-4">Your Rights</h3>
							<p class="section-text mb-4">You retain all rights to:</p>
							<ul class="ip-list">
								<li>Your tour content and descriptions</li>
								<li>Your business name and branding</li>
								<li>Photos and media you upload</li>
								<li>Your customer data and communications</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Limitation of Liability -->
				<div class="professional-card">
					<h2 class="section-heading">Limitation of Liability</h2>
					<p class="section-text mb-6">To the maximum extent permitted by law:</p>
					
					<div class="liability-sections">
						<div class="liability-section mb-6">
							<h3 class="subsection-heading mb-4">Service Availability</h3>
							<p class="section-text">
								We strive to provide reliable service but cannot guarantee 100% uptime. 
								We are not liable for service interruptions or technical issues.
							</p>
						</div>
						
						<div class="liability-section mb-6">
							<h3 class="subsection-heading mb-4">Tour Operations</h3>
							<p class="section-text">
								You are solely responsible for your tour operations, customer safety, and compliance with local regulations. 
								We are not liable for any incidents during your tours.
							</p>
						</div>
						
						<div class="liability-section">
							<h3 class="subsection-heading mb-4">Financial Losses</h3>
							<p class="section-text">
								Our liability is limited to the amount you paid for our services in the preceding 12 months. 
								We are not liable for indirect, consequential, or punitive damages.
							</p>
						</div>
					</div>
					
					<div class="liability-warning">
						<div class="flex items-start gap-3">
							<AlertTriangle class="w-5 h-5 text-secondary-600 flex-shrink-0 mt-0.5" />
							<div>
								<p class="warning-text">
									<strong>Important:</strong> We strongly recommend tour guides obtain appropriate insurance coverage for their business operations.
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Termination -->
				<div class="professional-card">
					<h2 class="section-heading">Termination</h2>
					<p class="section-text mb-6">This agreement may be terminated:</p>
					
					<div class="termination-conditions">
						<div class="termination-section mb-6">
							<h3 class="subsection-heading mb-4">By You</h3>
							<ul class="termination-list">
								<li>Cancel your subscription at any time</li>
								<li>Delete your account through your dashboard</li>
								<li>Contact us to request account deletion</li>
							</ul>
						</div>
						
						<div class="termination-section mb-6">
							<h3 class="subsection-heading mb-4">By Us</h3>
							<ul class="termination-list">
								<li>Violation of these terms</li>
								<li>Fraudulent or illegal activity</li>
								<li>Non-payment of subscription fees</li>
								<li>Abuse of our platform or support team</li>
							</ul>
						</div>
						
						<div class="termination-section">
							<h3 class="subsection-heading mb-4">Effect of Termination</h3>
							<ul class="termination-list">
								<li>Access to your account will be suspended</li>
								<li>Your data may be deleted after 30 days</li>
								<li>Outstanding payments remain due</li>
								<li>Some provisions of these terms survive termination</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Governing Law -->
				<div class="professional-card">
					<h2 class="section-heading">Governing Law</h2>
					<p class="section-text">
						These terms are governed by and construed in accordance with the laws of the jurisdiction where Zaur is incorporated. 
						Any disputes will be resolved in the courts of that jurisdiction.
					</p>
				</div>

				<!-- Updates to Terms -->
				<div class="professional-card">
					<h2 class="section-heading">Updates to Terms</h2>
					<p class="section-text">
						We may update these Terms of Service from time to time. We will notify you of any material changes by posting the updated terms on our website and, where required, by email. 
						Your continued use of the service after such changes constitutes acceptance of the new terms.
					</p>
				</div>

				<!-- Contact Information -->
				<div class="professional-card">
					<h2 class="section-heading">Contact Information</h2>
					<p class="section-text mb-6">
						If you have questions about these Terms of Service, please contact us:
					</p>
					<div class="contact-info">
						<div class="contact-item">
							<div class="contact-icon">
								<Gavel class="w-5 h-5 text-primary-600" />
							</div>
							<div class="contact-content">
								<p class="contact-text">
									<strong>Legal:</strong> legal@zaur.app
								</p>
							</div>
						</div>
						
						<div class="contact-item">
							<div class="contact-icon">
								<Shield class="w-5 h-5 text-primary-600" />
							</div>
							<div class="contact-content">
								<p class="contact-text">
									<strong>Support:</strong> support@zaur.app
								</p>
							</div>
						</div>
						
						<div class="contact-item">
							<div class="contact-icon">
								<Users class="w-5 h-5 text-primary-600" />
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

	/* Service features */
	.service-features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.feature-item {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
	}

	.feature-icon {
		flex-shrink: 0;
		margin-top: 0.25rem;
	}

	.feature-content {
		flex: 1;
	}

	.feature-title {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.feature-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	/* Lists */
	.requirements-list,
	.billing-list,
	.policy-list,
	.payment-list,
	.ip-list,
	.termination-list {
		list-style: disc;
		list-style-position: inside;
		color: var(--text-secondary);
		line-height: 1.6;
		space-y: 0.5rem;
	}

	.requirements-list li,
	.billing-list li,
	.policy-list li,
	.payment-list li,
	.ip-list li,
	.termination-list li {
		margin-bottom: 0.5rem;
	}

	/* Commitment boxes */
	.pricing-commitment {
		background: var(--color-pro-teal-50);
		border: 1px solid var(--color-pro-teal-200);
		border-radius: var(--radius-lg);
		padding: 1rem;
		margin-top: 1.5rem;
	}

	.commitment-text {
		font-size: 0.875rem;
		color: var(--color-pro-teal-800);
	}

	.liability-warning {
		background: var(--color-secondary-50);
		border: 1px solid var(--color-secondary-200);
		border-radius: var(--radius-lg);
		padding: 1rem;
		margin-top: 1.5rem;
	}

	.warning-text {
		font-size: 0.875rem;
		color: var(--color-secondary-800);
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
		color: var(--color-primary-600);
		text-decoration: none;
		transition: color var(--transition-base) ease;
	}

	.service-link:hover {
		color: var(--color-primary-700);
		text-decoration: underline;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.professional-card {
			padding: 1.5rem;
		}

		.service-features {
			grid-template-columns: 1fr;
		}
	}
</style> 
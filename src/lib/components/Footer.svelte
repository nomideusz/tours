<script lang="ts">
	import Logo from './Logo.svelte';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import Shield from 'lucide-svelte/icons/shield';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Heart from 'lucide-svelte/icons/heart';
	import Mail from 'lucide-svelte/icons/mail';
	import LifeBuoy from 'lucide-svelte/icons/life-buoy';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import Calculator from 'lucide-svelte/icons/calculator';
	import Smartphone from 'lucide-svelte/icons/smartphone';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import NewsletterSignup from '$lib/components/NewsletterSignup.svelte';
	import { page } from '$app/stores';
	
	// Hide CTA card on the beta-2/apply page
	let showCTACard = $derived($page.url.pathname !== '/beta-2/apply');
	let isApplyPage = $derived($page.url.pathname === '/beta-2/apply');
</script>

<!-- Professional Footer -->
<footer class="professional-footer" class:apply-page-footer={isApplyPage}>
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-16 py-8 sm:py-20">
		
		<!-- Beta 2 CTA Card - Hidden on apply page -->
		{#if showCTACard}
			<div class="footer-cta-card">
				<div class="footer-cta-content">
					<div class="cta-badge">BETA 2 • LAST 100 SPOTS</div>
					<h3 class="footer-cta-title">Ready to Get Started?</h3>
					<p class="footer-cta-text">
						Lock in €20/month forever. 4 months free trial included.
					</p>
					<button onclick={() => window.location.href = '/beta-2/apply'} class="footer-cta-button">
						Apply for Beta 2
						<ArrowRight class="w-4 h-4" />
					</button>
				</div>
			</div>
		{/if}
		
		<!-- Footer Content -->
		<div class="footer-content">
			<!-- Brand Section -->
			<div class="footer-brand">
				<div class="footer-logo">
					<Logo 
						variant="modern" 
						size="xl" 
						href="/" 
						class="justify-start p-0"
					/>
				</div>
				<p class="footer-description">
					The simplest booking system for independent tour guides. Keep 100% of your revenue.
				</p>
				<!-- Trust Badges -->
				<div class="trust-badges">
					<div class="trust-badge">
						<FlaskConical class="w-4 h-4" />
						<span>Beta 2 Active</span>
					</div>
					<div class="trust-badge">
						<CreditCard class="w-4 h-4" />
						<span>Stripe Secured</span>
					</div>
					<div class="trust-badge">
						<Shield class="w-4 h-4" />
						<span>SSL Protected</span>
					</div>
				</div>
			</div>

		<!-- Links Grid -->
		<div class="footer-section">
			<h3 class="footer-heading">Product</h3>
			<ul class="footer-links">
				<li>
					<a href="/#calculator" class="footer-link">
						<Calculator class="w-4 h-4" />
						<span>Calculator</span>
					</a>
				</li>
				<li>
					<a href="/#booking-demo" class="footer-link">
						<Smartphone class="w-4 h-4" />
						<span>Demo</span>
					</a>
				</li>
				<li>
					<a href="/#how-it-works" class="footer-link">
						<MapPin class="w-4 h-4" />
						<span>How it Works</span>
					</a>
				</li>
				<li>
					<a href="/#pricing" class="footer-link">
						<DollarSign class="w-4 h-4" />
						<span>Pricing</span>
					</a>
				</li>
				<li>
					<a href="/#timeline" class="footer-link">
						<Calendar class="w-4 h-4" />
						<span>Roadmap</span>
					</a>
				</li>
				<li>
					<a href="/#faq" class="footer-link">
						<HelpCircle class="w-4 h-4" />
						<span>FAQ</span>
					</a>
				</li>
				<li>
					<a href="/blog" class="footer-link">
						<BookOpen class="w-4 h-4" />
						<span>Blog</span>
					</a>
				</li>
			</ul>
		</div>

			<div class="footer-section footer-stacked">
				<!-- Company & Support Side by Side -->
				<div class="footer-subsections-grid">
					<div class="footer-subsection">
				<h3 class="footer-heading">Company</h3>
				<ul class="footer-links">
					<li>
						<a href="/about" class="footer-link">
							<Heart class="w-4 h-4" />
							<span>About Us</span>
						</a>
					</li>
					<li>
						<a href="/contact" class="footer-link">
							<Mail class="w-4 h-4" />
							<span>Contact</span>
						</a>
					</li>
				</ul>
			</div>

					<div class="footer-subsection">
				<h3 class="footer-heading">Support</h3>
				<ul class="footer-links">
					<li>
						<a href="/contact" class="footer-link">
							<LifeBuoy class="w-4 h-4" />
							<span>Help Center</span>
						</a>
					</li>
				<li>
					<button 
						class="footer-link footer-button"
						onclick={() => window.location.href = '/beta-2/apply'}
					>
						<FlaskConical class="w-4 h-4" />
						<span>Apply for Beta 2</span>
					</button>
				</li>
				</ul>
					</div>
				</div>
				
				<!-- Newsletter Below -->
				<div class="footer-subsection footer-newsletter-subsection">
					<h3 class="footer-heading">Stay Updated</h3>
					<NewsletterSignup 
						variant="inline"
						apiEndpoint="/api/newsletter/subscribe"
					/>
				</div>
			</div>
		</div>

		<!-- Bottom Section -->
		<div class="footer-bottom">
			<div class="footer-bottom-content">
				<div class="footer-copyright">
					© 2025 Zaur. All rights reserved.
				</div>
				<div class="footer-legal">
					<a href="/privacy" class="footer-legal-link">Privacy Policy</a>
					<a href="/terms" class="footer-legal-link">Terms of Service</a>
					<a href="/cookies" class="footer-legal-link">Cookie Policy</a>
				</div>
			</div>
		</div>
	</div>
</footer>

<style>
	/* Professional Footer */
	.professional-footer {
		background: linear-gradient(
			180deg,
			var(--bg-secondary) 0%,
			var(--bg-primary) 100%
		);
		position: relative;
		overflow: hidden;
	}

	/* Visual separator on apply page */
	.apply-page-footer {
		border-top: 2px solid var(--border-primary);
		margin-top: 0;
		padding-top: 3rem;
		background: linear-gradient(
			180deg,
			var(--bg-secondary) 0%,
			var(--bg-primary) 100%
		);
	}
	
	.apply-page-footer > div {
		padding-top: 0;
	}
	
	/* Footer CTA Card */
	.footer-cta-card {
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: var(--radius-xl);
		padding: 3rem 2rem;
		margin-bottom: 4rem;
		text-align: center;
		box-shadow: var(--shadow-md);
		transition: box-shadow var(--transition-slow);
		position: relative;
		overflow: hidden;
	}

	.footer-cta-card::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.04), transparent);
		border-radius: var(--radius-xl);
		opacity: 1;
		pointer-events: none;
	}

	.footer-cta-card:hover {
		box-shadow: var(--shadow-lg);
	}
	
	.footer-cta-content {
		position: relative;
		z-index: 1;
	}

	.cta-badge {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: var(--color-accent-600);
		color: white;
		border-radius: 9999px;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		margin-bottom: 1.25rem;
		box-shadow: 0 2px 8px rgba(var(--color-accent-600-rgb), 0.3);
	}
	
	.footer-cta-title {
		font-size: 1.875rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1rem;
		letter-spacing: -0.025em;
		line-height: 1.2;
	}
	
	.footer-cta-text {
		font-size: 1.0625rem;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
		letter-spacing: -0.01em;
	}
	
	.footer-cta-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 2rem;
		background: var(--color-primary-700);
		color: white;
		border: 1.5px solid var(--color-primary-700);
		border-radius: var(--radius-lg);
		font-size: 1rem;
		font-weight: 700;
		text-decoration: none;
		transition: all var(--transition-slow);
		box-shadow: var(--shadow-sm), var(--shadow-primary);
		letter-spacing: -0.01em;
		text-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.3),
			0 1px 1px rgba(0, 0, 0, 0.2);
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		position: relative;
	}
	
	.footer-cta-button:hover {
		background: var(--color-primary-800);
		border-color: var(--color-primary-800);
		color: white;
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg), 0 6px 20px -4px rgba(250, 107, 93, 0.5);
		text-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.4),
			0 1px 1px rgba(0, 0, 0, 0.25);
	}
	
	.footer-cta-button:active {
		transform: translateY(0);
		box-shadow: 
			inset 0 2px 4px rgba(0, 0, 0, 0.2),
			var(--shadow-sm), 
			var(--shadow-primary);
	}
	
	.footer-cta-button:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	
	/* Dark mode improvements for footer CTA button */
	:root[data-theme='dark'] .footer-cta-button {
		background: var(--color-primary-500);
		border-color: var(--color-primary-500);
		color: white;
		box-shadow: var(--shadow-md), 0 4px 16px rgba(var(--color-primary-500-rgb), 0.4);
	}
	
	:root[data-theme='dark'] .footer-cta-button:hover {
		background: var(--color-primary-400);
		border-color: var(--color-primary-400);
		box-shadow: var(--shadow-lg), 0 6px 24px rgba(var(--color-primary-500-rgb), 0.5);
	}
	
	:root[data-theme='dark'] .footer-cta-button:active {
		background: var(--color-primary-500);
		border-color: var(--color-primary-500);
	}

	/* Footer Content Grid */
	.footer-content {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2.5rem;
		margin-bottom: 3rem;
	}

	@media (min-width: 768px) {
		.footer-content {
			grid-template-columns: repeat(2, 1fr);
			gap: 2rem;
		}
	}
	
	@media (min-width: 1024px) {
		.footer-content {
			grid-template-columns: 1fr 0.8fr 1.4fr;
			gap: 2.5rem;
		}
	}

	/* Footer Brand */
	.footer-brand {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.footer-brand {
			grid-column: span 1;
		}
	}

	.footer-logo {
		margin-bottom: 1rem;
	}

	.footer-description {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0;
		letter-spacing: -0.01em;
	}

	/* Trust Badges */
	.trust-badges {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.625rem;
		margin-top: 1.25rem;
	}

	.trust-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 9999px;
		padding: 0.625rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary);
		transition: all var(--transition-base);
		letter-spacing: -0.01em;
		text-align: center;
		white-space: nowrap;
	}

	.trust-badge:hover {
		border-color: var(--color-accent-600);
		color: var(--text-primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-xs);
	}
	
	.trust-badge :global(svg) {
		color: var(--color-accent-600);
		flex-shrink: 0;
	}

	/* Footer Sections */
	.footer-section {
		display: flex;
		flex-direction: column;
	}
	
	/* Stacked Column - Company, Support, Newsletter */
	.footer-stacked {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}
	
	.footer-subsections-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}
	
	.footer-subsection {
		display: flex;
		flex-direction: column;
	}
	
	.footer-newsletter-subsection {
		margin-top: 0;
		text-align: left;
		align-items: flex-start;
	}
	
	.footer-newsletter-subsection :global(.newsletter-signup-inline) {
		width: 100%;
		max-width: 100%;
	}
	
	.footer-newsletter-subsection :global(.newsletter-inline-form) {
		margin: 0;
		max-width: 100%;
		justify-content: flex-start;
		align-items: flex-start;
	}
	
	.footer-newsletter-subsection :global(.inline-message) {
		margin-left: 0;
		margin-right: auto;
	}
	
	/* Dark mode improvements for inline button in footer */
	:root[data-theme='dark'] .footer-newsletter-subsection :global(.inline-button) {
		background: var(--color-primary-500);
		border-color: var(--color-primary-500);
		color: white;
		box-shadow: 0 2px 8px rgba(var(--color-primary-500-rgb), 0.4);
	}
	
	:root[data-theme='dark'] .footer-newsletter-subsection :global(.inline-button:hover:not(:disabled)) {
		background: var(--color-primary-400);
		border-color: var(--color-primary-400);
		box-shadow: 0 4px 16px rgba(var(--color-primary-500-rgb), 0.5);
	}
	
	/* Mobile: Stack newsletter form vertically */
	@media (max-width: 768px) {
		.footer-newsletter-subsection :global(.newsletter-inline-form) {
			flex-direction: column;
			gap: 0.75rem;
			width: 100%;
		}
		
		.footer-newsletter-subsection :global(.inline-input) {
			width: 100%;
			padding: 1rem 1.25rem;
			font-size: 1rem;
		}
		
		.footer-newsletter-subsection :global(.inline-button) {
			width: 100%;
			min-width: unset;
			padding: 1rem 1.5rem;
			justify-content: center;
		}
	}
	
	@media (max-width: 480px) {
		.footer-newsletter-subsection :global(.inline-input) {
			padding: 0.875rem 1rem;
			font-size: 0.9375rem;
			border-radius: var(--radius-md);
		}
		
		.footer-newsletter-subsection :global(.inline-button) {
			padding: 0.875rem 1.25rem;
			font-size: 0.9375rem;
			border-radius: var(--radius-md);
		}
		
		.footer-newsletter-subsection :global(.inline-message) {
			width: 100%;
			max-width: 100%;
			padding: 0.625rem 0.875rem;
			font-size: 0.8125rem;
		}
		
		.footer-newsletter-subsection .footer-heading {
			font-size: 0.75rem;
			margin-bottom: 0.875rem;
		}
	}

	.footer-heading {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1.25rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.9;
	}

	/* Footer Links */
	.footer-links {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.footer-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		transition: all var(--transition-base);
		padding: 0.375rem 0;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		width: auto;
		letter-spacing: -0.01em;
	}

	.footer-link:hover {
		color: var(--primary);
		transform: translateX(0.25rem);
	}
	
	.footer-link :global(svg) {
		color: var(--text-tertiary);
		transition: color var(--transition-base);
	}
	
	.footer-link:hover :global(svg) {
		color: var(--color-accent-600);
	}

	/* Special styling for footer button */
	.footer-button {
		color: var(--color-accent-600);
		font-weight: 600;
	}

	.footer-button:hover {
		color: var(--color-accent-700);
	}

	/* Footer Bottom */
	.footer-bottom {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border-secondary);
	}

	.footer-bottom-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.footer-bottom-content {
			flex-direction: row;
			gap: 1.5rem;
		}
	}

	.footer-copyright {
		font-size: 0.8125rem;
		color: var(--text-tertiary);
		font-weight: 500;
		letter-spacing: -0.01em;
	}

	/* Footer Legal Links */
	.footer-legal {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		justify-content: center;
	}

	@media (min-width: 768px) {
		.footer-legal {
			justify-content: flex-end;
		}
	}

	.footer-legal-link {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-tertiary);
		text-decoration: none;
		transition: color var(--transition-base);
		letter-spacing: -0.01em;
	}

	.footer-legal-link:hover {
		color: var(--primary);
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.footer-cta-card {
			padding: 2.5rem 1.5rem;
			margin-bottom: 3rem;
		}
		
		.footer-cta-title {
			font-size: 1.625rem;
	}

		.footer-cta-text {
			font-size: 0.9375rem;
	}

		.footer-content {
			gap: 2rem;
		}
		
		.footer-stacked {
			gap: 2rem;
		}

		.footer-subsections-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.footer-newsletter-subsection {
			margin-top: 1.5rem;
		}
		
		.footer-newsletter-subsection .footer-heading {
			margin-bottom: 1rem;
			font-size: 0.8125rem;
		}

		.footer-bottom {
			margin-top: 2.5rem;
			padding-top: 1.75rem;
		}

		.trust-badges {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
		
		.trust-badge {
			justify-content: flex-start;
			text-align: left;
		}
	}
	
	@media (max-width: 480px) {
		.footer-cta-card {
			padding: 2rem 1.25rem;
			border-radius: var(--radius-lg);
		}
		
		.cta-badge {
			font-size: 0.625rem;
			padding: 0.375rem 0.75rem;
		}
		
		.footer-cta-title {
			font-size: 1.5rem;
		}
		
		.footer-cta-text {
			font-size: 0.875rem;
		}
		
		.footer-cta-button {
			width: 100%;
			justify-content: center;
		}
		
		.footer-stacked {
			gap: 2rem;
		}

		.footer-bottom {
			margin-top: 2rem;
			padding-top: 1.5rem;
		}

		.footer-legal {
			gap: 1rem;
		}
	}
</style> 
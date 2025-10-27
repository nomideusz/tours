<script lang="ts">
	import Logo from './Logo.svelte';
	import BetaBadge from './BetaBadge.svelte';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import Shield from 'lucide-svelte/icons/shield';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Heart from 'lucide-svelte/icons/heart';
	import Mail from 'lucide-svelte/icons/mail';
	import LifeBuoy from 'lucide-svelte/icons/life-buoy';
	import Rocket from 'lucide-svelte/icons/rocket';
	import BookOpen from 'lucide-svelte/icons/book-open';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import Calculator from 'lucide-svelte/icons/calculator';
	import Smartphone from 'lucide-svelte/icons/smartphone';
</script>

<!-- Professional Footer -->
<footer class="professional-footer">
	<div class="professional-footer-container">
		<div class="professional-footer-content">
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
					Currently in Beta: Building the simplest booking system for independent tour guides. Join 50 selected guides shaping the future of tour booking.
				</p>
				<!-- Trust Badges -->
				<div class="trust-badges">
					<BetaBadge text="Beta Program" icon={FlaskConical} variant="small" class="footer-beta-badge" />
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

			<div class="footer-section">
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

			<div class="footer-section">
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
		background: var(--bg-primary);
		border-top: 1px solid var(--border-primary);
		position: relative;
		overflow: hidden;
	}

	/* Very subtle texture overlay - matches HeroSection */
	.professional-footer::before {
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

	.professional-footer-container {
		max-width: 1600px;
		margin: 0 auto;
		padding: 3rem 1.5rem;
		position: relative;
		z-index: 2;
	}

	@media (min-width: 640px) {
		.professional-footer-container {
			padding: 3rem 2rem;
		}
	}

	@media (min-width: 1024px) {
		.professional-footer-container {
			padding: 3rem;
		}
	}

	/* Footer Content Grid */
	.professional-footer-content {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
	}

	@media (min-width: 768px) {
		.professional-footer-content {
			grid-template-columns: repeat(4, 1fr);
			gap: 2rem;
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
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0;
	}

	/* Trust Badges */
	.trust-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.trust-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-full);
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		transition: all var(--transition-base) ease;
		position: relative;
		overflow: hidden;
	}

	/* Subtle primary accent on hover */
	.trust-badge::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--primary);
		transform: scaleX(0);
		transition: transform var(--transition-base) ease;
	}

	.trust-badge:hover::before {
		transform: scaleX(1);
	}

	.trust-badge:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
		color: var(--text-primary);
		transform: translateY(-1px);
	}

	/* Footer beta badge - ensure it aligns with other trust badges */
	:global(.footer-beta-badge) {
		display: inline-flex;
	}

	/* Footer Sections */
	.footer-section {
		display: flex;
		flex-direction: column;
	}

	.footer-heading {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
		position: relative;
	}

	/* Primary accent line under headings */
	.footer-heading::after {
		content: '';
		position: absolute;
		bottom: -0.5rem;
		left: 0;
		width: 2rem;
		height: 0.125rem;
		background: var(--primary);
		border-radius: 0.0625rem;
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
		transition: all var(--transition-base) ease;
		padding: 0.25rem 0;
		border-radius: var(--radius-md);
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		width: auto;
	}

	.footer-link:hover {
		color: var(--text-primary);
		transform: translateX(0.25rem);
	}

	/* Special styling for footer button */
	.footer-button {
		color: var(--primary);
		font-weight: 600;
	}

	.footer-button:hover {
		color: var(--primary);
		opacity: 0.8;
	}

	/* Footer Bottom */
	.footer-bottom {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border-primary);
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
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 500;
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
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color var(--transition-base) ease;
		position: relative;
	}

	.footer-legal-link:hover {
		color: var(--text-primary);
	}

	/* Primary accent underline on hover */
	.footer-legal-link::after {
		content: '';
		position: absolute;
		bottom: -0.125rem;
		left: 0;
		width: 0;
		height: 0.125rem;
		background: var(--primary);
		transition: width var(--transition-base) ease;
	}

	.footer-legal-link:hover::after {
		width: 100%;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.professional-footer-container {
			padding: 2rem 1rem;
		}

		.professional-footer-content {
			gap: 1.5rem;
		}

		.footer-bottom {
			margin-top: 2rem;
			padding-top: 1.5rem;
		}

		.trust-badges {
			justify-content: center;
		}

		.footer-legal {
			gap: 1rem;
		}
	}
</style> 
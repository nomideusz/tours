<!-- Professional Public Footer -->
<footer class="professional-footer">
	<div class="professional-footer-container">
		<div class="footer-content">
			<!-- Link to main platform -->
			<div class="footer-cta">
				<p class="footer-cta-text">
					Are you a tour guide? Create your own QR booking page
				</p>
				<a href="/auth/register" class="footer-cta-link">
					Get started on zaur.app
					<svg class="cta-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</a>
			</div>
			
			<!-- Copyright -->
			<p class="footer-copyright">
				© {new Date().getFullYear()} Zaur • QR Booking Platform for Tour Guides
			</p>
		</div>
	</div>
</footer>

<style>
	/* Professional Footer - matches marketing style */
	.professional-footer {
		background: var(--bg-primary);
		border-top: 1px solid var(--border-primary);
		position: relative;
		overflow: hidden;
		margin-top: auto;
	}

	/* Very subtle texture overlay - matches marketing footer */
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
		max-width: 1536px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
		position: relative;
		z-index: 2;
	}

	@media (min-width: 640px) {
		.professional-footer-container {
			padding: 2rem;
		}
	}

	@media (min-width: 1024px) {
		.professional-footer-container {
			padding: 2rem 3rem;
		}
	}

	.footer-content {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Footer CTA */
	.footer-cta {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.footer-cta-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
		margin-bottom: 0.5rem;
	}

	.footer-cta-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-coral-600);
		text-decoration: none;
		transition: all var(--transition-base) ease;
		position: relative;
		justify-content: center;
	}

	.footer-cta-link:hover {
		color: var(--color-coral-700);
		transform: translateY(-1px);
	}

	/* Coral accent underline on hover - matches marketing footer */
	.footer-cta-link::after {
		content: '';
		position: absolute;
		bottom: -0.125rem;
		left: 0;
		width: 0;
		height: 0.125rem;
		background: var(--color-coral-500);
		transition: width var(--transition-base) ease;
	}

	.footer-cta-link:hover::after {
		width: 100%;
	}

	.cta-arrow {
		width: 1rem;
		height: 1rem;
		transition: transform var(--transition-base) ease;
	}

	.footer-cta-link:hover .cta-arrow {
		transform: translateX(0.125rem);
	}

	/* Footer Copyright */
	.footer-copyright {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		margin: 0;
	}

	/* Dark Mode Support */
	[data-theme="dark"] .professional-footer::before {
		background-image: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 40px,
			rgba(255, 255, 255, 0.02) 40px,
			rgba(255, 255, 255, 0.02) 41px
		);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.professional-footer-container {
			padding: 1.5rem 1rem;
		}

		.footer-content {
			gap: 1rem;
		}
	}
</style> 
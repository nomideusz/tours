<!-- Minimal Public Footer -->
<footer class="professional-footer" id="public-footer">
	<div class="professional-footer-container">
		<div class="footer-content">
			<a href="/" class="powered-by">
				Powered by Zaur
			</a>
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
		z-index: 1; /* Lower than sticky footer (z-index: 9999) */
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
		padding: 1rem 1.5rem;
		position: relative;
		z-index: 2;
		text-align: center;
	}

	@media (min-width: 640px) {
		.professional-footer-container {
			padding: 1.25rem 2rem;
		}
	}

	@media (min-width: 1024px) {
		.professional-footer-container {
			padding: 1.5rem 3rem;
		}
	}

	.footer-content {
		display: inline-block; /* Prevent stretching */
	}

	/* Minimal Powered By Link */
	.powered-by {
		display: inline-block;
		font-size: 0.75rem;
		color: var(--text-tertiary);
		text-decoration: none !important;
		transition: all var(--transition-base) ease;
		opacity: 0.7;
	}
	
	/* Remove any global link underline styles */
	.powered-by::after {
		display: none !important;
	}

	.powered-by:hover {
		color: var(--text-secondary);
		opacity: 1;
		text-decoration: none !important;
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
			padding: 0.75rem 1rem; /* Normal padding */
		}
		
		/* Ensure footer is visible and doesn't overlap with sticky booking footer */
		.professional-footer {
			z-index: 1; /* Lower than sticky footer (9999) */
		}
		
		.powered-by {
			font-size: 0.6875rem;
		}
	}
	
	/* Hide footer on mobile when sticky booking bar is present */
	/* The page will add .has-sticky-footer class to body or container */
	@media (max-width: 640px) {
		:global(.has-sticky-footer) .professional-footer {
			display: none;
		}
	}
</style> 
<script lang="ts">
	let { class: className = "" } = $props<{ class?: string }>();

	// Current year for copyright
	const currentYear = new Date().getFullYear();
</script>

<!-- Minimal App Footer -->
<footer class="minimal-footer {className}">
	<div class="minimal-footer-container">
		<div class="minimal-footer-content">
			<!-- Left: Copyright -->
			<div class="footer-copyright">
				© {currentYear} Zaur. All rights reserved.
			</div>

			<!-- Right: Legal links -->
			<div class="footer-legal">
				<a href="/privacy" class="footer-legal-link">Privacy</a>
				<a href="/terms" class="footer-legal-link">Terms</a>
				<a href="/cookies" class="footer-legal-link">Cookies</a>
			</div>
		</div>
	</div>
</footer>

<style>
	/* Minimal Footer - clean and simple */
	.minimal-footer {
		background: var(--bg-primary);
		position: relative;
	}

	.minimal-footer-container {
		width: 100%;
		padding: 1rem 1.5rem;
		position: relative;
		z-index: 2;
	}

	@media (min-width: 640px) {
		.minimal-footer-container {
			padding: 1rem 2rem;
		}
	}

	@media (min-width: 1024px) {
		.minimal-footer-container {
			padding: 1rem 2rem;
		}
	}

	.minimal-footer-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	@media (min-width: 768px) {
		.minimal-footer-content {
			flex-direction: row;
			gap: 1rem;
		}
	}

	.footer-copyright {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-weight: 400;
	}

	/* Footer Legal Links */
	.footer-legal {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: center;
	}

	@media (min-width: 768px) {
		.footer-legal {
			justify-content: flex-end;
		}
	}

	.footer-legal-link {
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--text-tertiary);
		text-decoration: none;
		transition: color var(--transition-base) ease;
	}

	.footer-legal-link:hover {
		color: var(--text-secondary);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.minimal-footer-container {
			padding: 0.75rem 1rem;
		}

		.minimal-footer-content {
			gap: 0.5rem;
		}

		.footer-legal {
			gap: 0.75rem;
		}
	}
</style> 
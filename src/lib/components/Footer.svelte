<script lang="ts">
	import Logo from './Logo.svelte';
</script>

<!-- Modern footer -->
<footer style="background: var(--bg-primary); color: var(--text-primary); border-top: 1px solid var(--border-primary);">
	<div class="mx-auto max-w-screen-2xl px-6 py-12 sm:px-8 lg:px-12">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-4">
			<!-- Brand section -->
			<div class="md:col-span-1">
				<div class="mb-4">
					<Logo 
						variant="modern" 
						size="large" 
						href="/" 
						showIcon={true}
						class="justify-start p-0"
					/>
				</div>
				<p class="mb-4" style="color: var(--text-secondary);">
					The simplest booking system for independent tour guides. More bookings, less hassle.
				</p>
				<!-- Trust badges -->
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-2 text-sm" style="color: var(--text-tertiary);">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/>
						</svg>
						<span>Stripe Secured</span>
					</div>
					<div class="flex items-center gap-2 text-sm" style="color: var(--text-tertiary);">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
						</svg>
						<span>SSL Protected</span>
					</div>
				</div>
			</div>

			<!-- Links sections -->
			<div>
				<h3 class="mb-4 font-semibold">Product</h3>
				<ul class="space-y-2">
					<li>
						<a href="/#how-it-works" class="nav-link transition-colors footer-link"
							>How it Works</a
						>
					</li>
					<li>
						<a href="/#features" class="nav-link transition-colors footer-link"
							>Features</a
						>
					</li>
					<li>
						<a href="/#pricing" class="nav-link transition-colors footer-link"
							>Pricing</a
						>
					</li>
					<li>
						<a href="/#faq" class="nav-link transition-colors footer-link"
							>FAQ</a
						>
					</li>
				</ul>
			</div>

			<div>
				<h3 class="mb-4 font-semibold">Company</h3>
				<ul class="space-y-2">
					<li>
						<a href="/about" class="nav-link transition-colors footer-link">About Us</a>
					</li>
					<li>
						<a href="/contact" class="nav-link transition-colors footer-link">Contact</a>
					</li>
				</ul>
			</div>

			<div>
				<h3 class="mb-4 font-semibold">Support</h3>
				<ul class="space-y-2">
					<li>
						<a href="/contact" class="nav-link transition-colors footer-link"
							>Help Center</a
						>
					</li>
					<li>
						<a href="/auth/register" class="nav-link transition-colors footer-link"
							>Get Started</a
						>
					</li>
				</ul>
			</div>
		</div>

		<!-- Bottom section -->
		<div class="mt-12 pt-8" style="border-top: 1px solid var(--border-primary);">
			<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
				<div class="text-sm" style="color: var(--text-tertiary);">© 2025 Zaur. All rights reserved.</div>
				<div class="flex gap-6 text-sm">
					<a href="/privacy" class="nav-link transition-colors footer-link"
						>Privacy Policy</a
					>
					<a href="/terms" class="nav-link transition-colors footer-link"
						>Terms of Service</a
					>
					<a href="/cookies" class="nav-link transition-colors footer-link"
						>Cookie Policy</a
					>
				</div>
			</div>
		</div>
	</div>
</footer>

<style>
	.footer-link {
		color: var(--text-secondary);
	}
	
	.footer-link:hover {
		color: var(--text-primary);
	}
</style> 
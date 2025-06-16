<script lang="ts">
	import Scan from 'lucide-svelte/icons/scan';
</script>

<!-- Modern footer -->
<footer class="bg-gray-900 text-white">
	<div class="mx-auto max-w-screen-2xl px-6 py-12 sm:px-8 lg:px-12">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-4">
			<!-- Brand section -->
			<div class="md:col-span-1">
				<div class="mb-4 flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
						<Scan class="h-6 w-6 text-white" />
					</div>
					<span class="text-2xl font-bold">Zaur</span>
				</div>
				<p class="mb-4 text-gray-400">
					The simplest booking system for independent tour guides. More bookings, less hassle.
				</p>
				<!-- Trust badges -->
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-2 text-sm text-gray-400">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/>
						</svg>
						<span>Stripe Secured</span>
					</div>
					<div class="flex items-center gap-2 text-sm text-gray-400">
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
						<a href="/#features" class="text-gray-400 transition-colors hover:text-white"
							>Features</a
						>
					</li>
					<li>
						<a href="/#pricing" class="text-gray-400 transition-colors hover:text-white"
							>Pricing</a
						>
					</li>
					<li>
						<a href="/#how-it-works" class="text-gray-400 transition-colors hover:text-white"
							>How it Works</a
						>
					</li>
				</ul>
			</div>

			<div>
				<h3 class="mb-4 font-semibold">Company</h3>
				<ul class="space-y-2">
					<li>
						<a href="/about" class="text-gray-400 transition-colors hover:text-white">About Us</a>
					</li>
					<li>
						<a href="/contact" class="text-gray-400 transition-colors hover:text-white">Contact</a>
					</li>
				</ul>
			</div>

			<div>
				<h3 class="mb-4 font-semibold">Support</h3>
				<ul class="space-y-2">
					<li>
						<a href="/contact" class="text-gray-400 transition-colors hover:text-white"
							>Help Center</a
						>
					</li>
					<li>
						<a href="/auth/register" class="text-gray-400 transition-colors hover:text-white"
							>Early Access</a
						>
					</li>
				</ul>
			</div>
		</div>

		<!-- Bottom section -->
		<div class="mt-12 border-t border-gray-800 pt-8">
			<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
				<div class="text-sm text-gray-400">© 2025 Zaur. All rights reserved.</div>
				<div class="flex gap-6 text-sm">
					<a href="/privacy" class="text-gray-400 transition-colors hover:text-white"
						>Privacy Policy</a
					>
					<a href="/terms" class="text-gray-400 transition-colors hover:text-white"
						>Terms of Service</a
					>
					<a href="/cookies" class="text-gray-400 transition-colors hover:text-white"
						>Cookie Policy</a
					>
				</div>
			</div>
		</div>
	</div>
</footer> 
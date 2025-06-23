<footer class="mt-auto transition-colors" style="background: var(--bg-secondary); border-top: 1px solid var(--border-primary);">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="text-center space-y-4">
			<!-- Link to main platform -->
			<div>
				<p class="text-sm mb-2" style="color: var(--text-secondary);">
					Are you a tour guide? Create your own QR booking page
				</p>
				<a 
					href="/auth/register" 
					class="inline-flex items-center gap-2 text-sm font-medium transition-colors hover-primary"
				>
					Get started on zaur.app
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</a>
			</div>
			
			<!-- Copyright -->
			<p class="text-xs" style="color: var(--text-tertiary);">
				© {new Date().getFullYear()} Zaur • QR Booking Platform for Tour Guides
			</p>
		</div>
	</div>
</footer>

<style lang="postcss">
	@reference "tailwindcss";
</style> 
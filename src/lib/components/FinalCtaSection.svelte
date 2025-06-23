<script lang="ts">
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Play from 'lucide-svelte/icons/play';
	import Check from 'lucide-svelte/icons/check';
</script>

<!-- Final CTA - Professional Design -->
<section class="py-20 cta-section">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
		<h2 class="text-3xl md:text-4xl font-bold mb-6" style="color: white;">
			Ready to Be Among the First?
		</h2>
		<p class="text-lg mb-8 max-w-2xl mx-auto" style="color: rgba(255, 255, 255, 0.8);">
			We're launching Zaur with a select group of tour guides. 
			Join the early access program and help shape the future of tour booking.
		</p>
		
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a href="/auth/register" class="inline-flex items-center justify-center px-8 py-4 font-medium rounded-md transition-colors cta-button-primary">
				Get Early Access
				<ArrowRight class="w-5 h-5 ml-2" strokeWidth={2} />
			</a>
			<a href="/contact" class="inline-flex items-center justify-center px-8 py-4 border font-medium rounded-md transition-colors cta-button-secondary">
				Learn More
				<ArrowRight class="w-5 h-5 ml-2" strokeWidth={2} />
			</a>
		</div>
		
		<div class="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm" style="color: rgba(255, 255, 255, 0.6);">
			<span class="flex items-center gap-2">
				<Check class="w-4 h-4" strokeWidth={2} />
				No commitment required
			</span>
			<span class="flex items-center gap-2">
				<Check class="w-4 h-4" strokeWidth={2} />
				Early access perks
			</span>
			<span class="flex items-center gap-2">
				<Check class="w-4 h-4" strokeWidth={2} />
				Shape the product
			</span>
		</div>
	</div>
</section>

<style>
	/* CTA section with primary brand color background */
	.cta-section {
		background: var(--color-primary-900);
		position: relative;
		overflow: hidden;
	}
	
	/* Subtle gradient overlay for depth */
	.cta-section::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at top, rgba(59, 130, 246, 0.15), transparent 70%);
		pointer-events: none;
	}
	
	/* Primary button styling */
	.cta-button-primary {
		background: white;
		color: var(--color-primary-900);
	}
	
	.cta-button-primary:hover {
		background: var(--color-gray-100);
		transform: translateY(-1px);
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
	}
	
	/* Secondary button styling */
	.cta-button-secondary {
		background: transparent;
		color: white;
		border-color: rgba(255, 255, 255, 0.3);
	}
	
	.cta-button-secondary:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.5);
		transform: translateY(-1px);
	}
	
	/* Dark mode adjustments */
	[data-theme="dark"] .cta-section {
		background: var(--color-primary-800);
	}
</style> 
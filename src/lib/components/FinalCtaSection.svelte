<script lang="ts">
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Play from 'lucide-svelte/icons/play';
	import Check from 'lucide-svelte/icons/check';
</script>

<!-- Final CTA - Professional Design -->
<section class="py-20 bg-gray-900 text-white">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
		<h2 class="text-3xl md:text-4xl font-bold mb-6">
			Ready to Be Among the First?
		</h2>
		<p class="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
			We're launching Zaur with a select group of tour guides. 
			Join the early access program and help shape the future of tour booking.
		</p>
		
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a href="/auth/register" class="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors">
				Get Early Access
				<ArrowRight class="w-5 h-5 ml-2" strokeWidth={2} />
			</a>
			<a href="/contact" class="inline-flex items-center justify-center px-8 py-4 border border-gray-600 text-gray-300 font-medium rounded-md hover:bg-gray-800 hover:border-gray-500 transition-colors">
				Learn More
				<ArrowRight class="w-5 h-5 ml-2" strokeWidth={2} />
			</a>
		</div>
		
		<div class="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
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
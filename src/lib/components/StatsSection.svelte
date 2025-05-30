<script lang="ts">
	import { onMount } from 'svelte';

	// Stats for social proof
	let stats = $state({
		guides: 0,
		bookings: 0,
		revenue: 0
	});
	
	// Animate stats on mount
	onMount(() => {
		// Animate numbers
		const animateValue = (obj: any, key: string, end: number, duration: number) => {
			const start = 0;
			const range = end - start;
			const startTime = performance.now();
			
			const step = (currentTime: number) => {
				const elapsed = currentTime - startTime;
				const progress = Math.min(elapsed / duration, 1);
				
				obj[key] = Math.floor(progress * range + start);
				
				if (progress < 1) {
					requestAnimationFrame(step);
				}
			};
			
			requestAnimationFrame(step);
		};
		
		// Start animations after a short delay
		setTimeout(() => {
			animateValue(stats, 'guides', 127, 1500);
			animateValue(stats, 'bookings', 3842, 1800);
			animateValue(stats, 'revenue', 92500, 2000);
		}, 500);
	});
</script>

<!-- Professional Stats Section -->
<section class="py-16 bg-gray-50 border-y border-gray-200">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
	  <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
		<div class="text-center">
		  <div class="text-3xl font-bold text-gray-900">{stats.guides}+</div>
		  <div class="text-sm text-gray-600 mt-1">Active Guides</div>
		</div>
		<div class="text-center">
		  <div class="text-3xl font-bold text-gray-900">{stats.bookings.toLocaleString()}</div>
		  <div class="text-sm text-gray-600 mt-1">Tours Booked</div>
		</div>
		<div class="text-center">
		  <div class="text-3xl font-bold text-gray-900">€{(stats.revenue/1000).toFixed(0)}k</div>
		  <div class="text-sm text-gray-600 mt-1">Revenue Processed</div>
		</div>
		<div class="text-center">
		  <div class="text-3xl font-bold text-gray-900">4.9</div>
		  <div class="text-sm text-gray-600 mt-1">Average Rating</div>
		</div>
	  </div>
	</div>
</section> 
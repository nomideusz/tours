<script lang="ts">
	// Testimonials section - no special logic needed for now
</script>

<!-- Testimonials -->
<section id="testimonials" class="py-20 bg-gray-50">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="text-center mb-12">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Tour Guides Love Zaur
			</h2>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				Don't just take our word for it. Here's what real tour guides say about Zaur.
			</p>
		</div>
		
		<div class="grid md:grid-cols-3 gap-8 mt-16">
			<!-- Testimonial 1 -->
			<div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
				<div class="flex gap-1 mb-4">
					{#each Array(5) as _}
						<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
						</svg>
					{/each}
				</div>
				<p class="text-gray-700 mb-4">
					"I was skeptical at first, but Zaur transformed my business. I went from 5-10 bookings per week to 30+. The QR codes work like magic!"
				</p>
				<div class="flex items-center gap-3">
					<img 
						src="https://i.pravatar.cc/40?img=25" 
						alt="Maria Gonzalez" 
						class="w-10 h-10 rounded-full"
					/>
					<div>
						<div class="font-semibold text-gray-900">Maria Gonzalez</div>
						<div class="text-sm text-gray-600">Barcelona Walking Tours</div>
					</div>
				</div>
			</div>
			
			<!-- Testimonial 2 -->
			<div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
				<div class="flex gap-1 mb-4">
					{#each Array(5) as _}
						<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
						</svg>
					{/each}
				</div>
				<p class="text-gray-700 mb-4">
					"Finally, a booking system that doesn't take huge commissions! I save hundreds of euros each month compared to other platforms."
				</p>
				<div class="flex items-center gap-3">
					<img 
						src="https://i.pravatar.cc/40?img=15" 
						alt="John Murphy" 
						class="w-10 h-10 rounded-full"
					/>
					<div>
						<div class="font-semibold text-gray-900">John Murphy</div>
						<div class="text-sm text-gray-600">Dublin Historical Tours</div>
					</div>
				</div>
			</div>
			
			<!-- Testimonial 3 -->
			<div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
				<div class="flex gap-1 mb-4">
					{#each Array(5) as _}
						<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
						</svg>
					{/each}
				</div>
				<p class="text-gray-700 mb-4">
					"The instant booking feature is a game-changer. Tourists love how easy it is, and I love getting paid immediately. Highly recommend!"
				</p>
				<div class="flex items-center gap-3">
					<img 
						src="https://i.pravatar.cc/40?img=35" 
						alt="Sophie Dubois" 
						class="w-10 h-10 rounded-full"
					/>
					<div>
						<div class="font-semibold text-gray-900">Sophie Dubois</div>
						<div class="text-sm text-gray-600">Paris Food Tours</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section> 
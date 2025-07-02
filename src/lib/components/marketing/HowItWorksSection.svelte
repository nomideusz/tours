<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Euro from 'lucide-svelte/icons/euro';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import QrCode from 'lucide-svelte/icons/qr-code';
</script>

<!-- How it works - Visual Process -->
<section id="how-it-works" class="py-20 bg-gray-50">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="text-center mb-16">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Start Getting Bookings in Minutes
			</h2>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				No technical skills needed. If you can use WhatsApp, you can use Zaur.
			</p>
		</div>
		
		<div class="grid md:grid-cols-3 gap-8">
			<!-- Step 1 -->
			<div class="relative">
				<div class="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
					<div class="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
						<span class="text-2xl font-bold text-blue-600">1</span>
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-4 text-center">Create Your Tour</h3>
					<p class="text-gray-600 mb-6 text-center flex-grow">
						Add your tour details, set your price, and choose when you're available. Takes 2 minutes.
					</p>
					<div class="bg-gray-50 rounded-xl p-5 border border-gray-100">
						<div class="space-y-3 text-sm">
							<div class="flex justify-between items-center">
								<span class="text-gray-700 font-medium">Walking Tour of Old Town</span>
								<span class="font-bold text-blue-600">€25</span>
							</div>
							<div class="text-gray-500 text-xs">Duration: 2 hours</div>
							<div class="flex gap-2 mt-3">
								<span class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">10:00 AM</span>
								<span class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">2:00 PM</span>
								<span class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">5:00 PM</span>
							</div>
						</div>
					</div>
				</div>
				<!-- Arrow -->
				<div class="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
					<div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200">
						<ChevronRight class="w-4 h-4 text-blue-600" strokeWidth={2.5} />
					</div>
				</div>
			</div>
			
			<!-- Step 2 -->
			<div class="relative">
				<div class="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
					<div class="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
						<span class="text-2xl font-bold text-blue-600">2</span>
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-4 text-center">Get Your QR Code</h3>
					<p class="text-gray-600 mb-6 text-center flex-grow">
						Download your unique QR code. Print it on flyers, business cards, or display it anywhere.
					</p>
					<div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 flex justify-center border border-blue-100">
						<div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
							<QrCode class="w-20 h-20 text-blue-600" strokeWidth={1.5} />
						</div>
					</div>
				</div>
				<!-- Arrow -->
				<div class="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
					<div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200">
						<ChevronRight class="w-4 h-4 text-blue-600" strokeWidth={2.5} />
					</div>
				</div>
			</div>
			
			<!-- Step 3 -->
			<div class="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
				<div class="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mb-6 mx-auto">
					<Check class="w-8 h-8 text-green-600" strokeWidth={2.5} />
				</div>
				<h3 class="text-xl font-semibold text-gray-900 mb-4 text-center">Get Instant Bookings</h3>
				<p class="text-gray-600 mb-6 text-center flex-grow">
					Tourists scan your code, pick a time, pay securely, and you get a notification. That's it!
				</p>
				<div class="bg-green-50 border border-green-200 rounded-xl p-5">
					<div class="flex items-start gap-4">
						<div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
							<Euro class="w-6 h-6 text-white" strokeWidth={2} />
						</div>
						<div class="text-sm">
							<div class="font-semibold text-gray-900 text-base">New booking received!</div>
							<div class="text-gray-600 mt-1">Sarah booked Walking Tour • +€25</div>
							<div class="text-green-600 text-xs mt-1 font-medium">Just now</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Bottom CTA -->
		<div class="text-center mt-16">
			<p class="text-gray-600 mb-6">Ready to get started?</p>
			<a href="/auth/register" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
				Create Your First Tour
				<ArrowRight class="w-4 h-4 ml-2" strokeWidth={2} />
			</a>
		</div>
	</div>
</section> 
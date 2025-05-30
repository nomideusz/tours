<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	
	let isYearly = $state(false);
	
	// Calculate prices
	let proPrice = $derived(isYearly ? 15 : 19); // €15/month when billed annually (20% off €19)
	let agencyPrice = $derived(isYearly ? 39 : 49); // €39/month when billed annually (20% off €49)
	let billingPeriod = $derived(isYearly ? '/month billed annually' : '/month');
</script>

<!-- Pricing -->
<section id="pricing" class="py-20 bg-white">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<div class="text-center mb-12">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Simple, Transparent Pricing
			</h2>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				No booking fees, no hidden costs. Just pick a plan and start growing your business.
			</p>
		</div>
		
		<!-- Toggle -->
		<div class="flex justify-center mb-12">
			<div class="bg-gray-100 p-1 rounded-lg inline-flex">
				<button 
					class="px-4 py-2 rounded-md font-medium transition-all duration-200 cursor-pointer {!isYearly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'}"
					onclick={() => isYearly = false}
				>
					Monthly
				</button>
				<button 
					class="px-4 py-2 rounded-md font-medium transition-all duration-200 cursor-pointer {isYearly ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'}"
					onclick={() => isYearly = true}
				>
					Annual (Save 20%)
				</button>
			</div>
		</div>
		
		<div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
			<!-- Starter -->
			<div class="relative rounded-lg border border-gray-200 p-8 bg-white flex flex-col">
				<h3 class="text-xl font-semibold text-gray-900 mb-2">Starter</h3>
				<div class="mb-1">
					<span class="text-4xl font-bold text-gray-900">Free</span>
				</div>
				<p class="text-gray-600 mb-6">Perfect for trying out Zaur</p>
				
				<ul class="space-y-3 mb-8 flex-grow">
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">Up to 5 bookings/month</span>
					</li>
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">1 tour type</span>
					</li>
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">Basic QR codes</span>
					</li>
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">Email support</span>
					</li>
				</ul>
				
				<button class="w-full py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
					Start Free
				</button>
			</div>
			
			<!-- Pro (Popular) - Professional styling -->
			<div class="relative rounded-lg border border-gray-300 p-8 bg-white shadow-lg scale-105 flex flex-col">
				<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
					<span class="bg-gray-900 text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">Professional</h3>
				<div class="mb-1">
					<span class="text-4xl font-bold text-gray-900">€{proPrice}</span>
					<span class="text-gray-600">{billingPeriod}</span>
				</div>
				<div class="mb-2 h-5">
					<span class="text-sm text-green-600 font-medium transition-opacity duration-200 {isYearly ? 'opacity-100' : 'opacity-0'}">
						Save €48/year
					</span>
				</div>
				<p class="text-gray-600 mb-6">Everything you need to grow</p>
				
				<ul class="space-y-3 mb-8 flex-grow">
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">Unlimited bookings</span>
					</li>
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">Unlimited tour types</span>
					</li>
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">Custom QR code branding</span>
					</li>
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">SMS notifications</span>
					</li>
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">Advanced analytics</span>
					</li>
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">Priority support</span>
					</li>
				</ul>
				
				<button class="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors cursor-pointer">
					Start Free Trial
				</button>
			</div>
			
			<!-- Agency -->
			<div class="relative rounded-lg border border-gray-200 p-8 bg-white flex flex-col">
				<h3 class="text-xl font-semibold text-gray-900 mb-2">Agency</h3>
				<div class="mb-1">
					<span class="text-4xl font-bold text-gray-900">€{agencyPrice}</span>
					<span class="text-gray-600">{billingPeriod}</span>
				</div>
				<div class="mb-2 h-5">
					<span class="text-sm text-green-600 font-medium transition-opacity duration-200 {isYearly ? 'opacity-100' : 'opacity-0'}">
						Save €120/year
					</span>
				</div>
				<p class="text-gray-600 mb-6">For tour companies</p>
				
				<ul class="space-y-3 mb-8 flex-grow">
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">Everything in Pro</span>
					</li>
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">Up to 5 tour guides</span>
					</li>
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">Team management</span>
					</li>
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">API access</span>
					</li>
					<li class="flex items-start gap-3">
						<Check class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700">White-label options</span>
					</li>
				</ul>
				
				<button class="w-full py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
					Contact Sales
				</button>
			</div>
		</div>
		
		<div class="mt-12 text-center">
			<p class="text-gray-600">
				<span class="font-semibold">💰 No booking fees!</span> Unlike competitors, we never take a percentage of your bookings.
			</p>
		</div>
	</div>
</section> 
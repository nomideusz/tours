<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	
	let isYearly = $state(false);
	
	// Calculate prices
	let starterProPrice = $derived(isYearly ? 10 : 12); // €10/month when billed annually (17% off €12)
	let proPrice = $derived(isYearly ? 24 : 29); // €24/month when billed annually (17% off €29)
	let agencyPrice = $derived(isYearly ? 65 : 79); // €65/month when billed annually (18% off €79)
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
		
		<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
			<!-- Free Starter -->
			<div class="relative rounded-lg border border-gray-200 p-6 bg-white flex flex-col">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Free Starter</h3>
				<div class="mb-1">
					<span class="text-3xl font-bold text-gray-900">Free</span>
				</div>
				<p class="text-gray-600 mb-6 text-sm">Perfect for trying out Zaur</p>
				
				<ul class="space-y-2 mb-6 flex-grow">
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">2 bookings/month</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">1 tour type</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">Basic QR codes</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">Email support</span>
					</li>
				</ul>
				
				<a href="/auth/register" class="w-full py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-sm text-center block">
					Start Free
				</a>
			</div>

			<!-- Starter Pro -->
			<div class="relative rounded-lg border border-gray-200 p-6 bg-white flex flex-col">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Starter Pro</h3>
				<div class="mb-1">
					<span class="text-3xl font-bold text-gray-900">€{starterProPrice}</span>
					<span class="text-gray-600 text-sm">{billingPeriod}</span>
				</div>
				<div class="mb-2 h-4">
					<span class="text-xs text-green-600 font-medium transition-opacity duration-200 {isYearly ? 'opacity-100' : 'opacity-0'}">
						Save €24/year
					</span>
				</div>
				<p class="text-gray-600 mb-6 text-sm">Great for getting started</p>
				
				<ul class="space-y-2 mb-6 flex-grow">
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">15 bookings/month</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">3 tour types</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">Custom branding</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">SMS notifications</span>
					</li>
				</ul>
				
				<a href="/auth/register" class="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors cursor-pointer text-sm text-center block">
					Start for Free
				</a>
			</div>
			
			<!-- Professional (Most Popular) -->
			<div class="relative rounded-lg border-2 border-blue-500 p-6 bg-white shadow-lg flex flex-col">
				<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
					<span class="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">Most Popular</span>
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Professional</h3>
				<div class="mb-1">
					<span class="text-3xl font-bold text-gray-900">€{proPrice}</span>
					<span class="text-gray-600 text-sm">{billingPeriod}</span>
				</div>
				<div class="mb-2 h-4">
					<span class="text-xs text-green-600 font-medium transition-opacity duration-200 {isYearly ? 'opacity-100' : 'opacity-0'}">
						Save €60/year
					</span>
				</div>
				<p class="text-gray-600 mb-6 text-sm">Everything you need to grow</p>
				
				<ul class="space-y-2 mb-6 flex-grow">
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">Unlimited bookings</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">Unlimited tour types</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">Advanced analytics</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">Priority support</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">API access</span>
					</li>
				</ul>
				
				<a href="/auth/register" class="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors cursor-pointer text-sm text-center block">
					Start for Free
				</a>
			</div>
			
			<!-- Agency -->
			<div class="relative rounded-lg border border-gray-200 p-6 bg-white flex flex-col">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Agency</h3>
				<div class="mb-1">
					<span class="text-3xl font-bold text-gray-900">€{agencyPrice}</span>
					<span class="text-gray-600 text-sm">{billingPeriod}</span>
				</div>
				<div class="mb-2 h-4">
					<span class="text-xs text-green-600 font-medium transition-opacity duration-200 {isYearly ? 'opacity-100' : 'opacity-0'}">
						Save €168/year
					</span>
				</div>
				<p class="text-gray-600 mb-6 text-sm">For tour companies</p>
				
				<ul class="space-y-2 mb-6 flex-grow">
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">Everything in Pro</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">Up to 10 tour guides</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">Team management</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">White-label options</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-gray-700 text-sm">Dedicated support</span>
					</li>
				</ul>
				
				<a href="/contact" class="w-full py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-sm text-center block">
					Contact Sales
				</a>
			</div>
		</div>
		
		<div class="mt-12 text-center">
			<div class="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
				<p class="text-green-800 font-semibold text-lg mb-2">
					💰 Keep 100% of Your Revenue
				</p>
				<p class="text-green-700">
					Unlike competitors who take 3-8% commission per booking, we charge a simple monthly fee. 
					<span class="font-semibold">No booking fees, ever!</span>
				</p>
			</div>
		</div>
	</div>
</section> 
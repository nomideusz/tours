<script lang="ts">
	import AllInPricingDisplay from '$lib/components/pricing/AllInPricingDisplay.svelte';
	import CostCalculator from '$lib/components/pricing/CostCalculator.svelte';
	import PricingValidationMessages from '$lib/components/pricing/PricingValidationMessages.svelte';
	import { userCurrency, SUPPORTED_CURRENCIES } from '$lib/stores/currency.js';
	import PageContainer from '$lib/components/PageContainer.svelte';
	
	// Demo state
	let demoPrice = $state(45);
	let demoDuration = $state(180); // 3 hours
	let demoCapacity = $state(12);
	
	// Get currency info
	let currencySymbol = $derived(SUPPORTED_CURRENCIES[$userCurrency]?.symbol || '€');
	
	// Demo participant categories
	let demoCategories = $state([
		{ label: 'Adult', price: 45 },
		{ label: 'Child', price: 25 },
		{ label: 'Student', price: 36 }
	]);
</script>

<PageContainer>
<div class="max-w-4xl mx-auto space-y-8">
	<div class="text-center mb-8">
		<h1 class="text-3xl font-bold mb-2">Pricing Compliance Demo</h1>
		<p class="text-gray-600">All-in pricing with Stripe Express fees</p>
	</div>
	
	<!-- Demo Controls -->
	<div class="bg-gray-50 rounded-lg p-6 space-y-4">
		<h2 class="text-lg font-semibold mb-4">Demo Controls</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<label>
				<span class="block text-sm font-medium mb-1">Base Price</span>
				<input 
					type="number" 
					bind:value={demoPrice} 
					min="0" 
					step="5"
					class="w-full px-3 py-2 border rounded-md"
				/>
			</label>
			<label>
				<span class="block text-sm font-medium mb-1">Duration (minutes)</span>
				<input 
					type="number" 
					bind:value={demoDuration} 
					min="30" 
					step="30"
					class="w-full px-3 py-2 border rounded-md"
				/>
			</label>
			<label>
				<span class="block text-sm font-medium mb-1">Capacity</span>
				<input 
					type="number" 
					bind:value={demoCapacity} 
					min="1" 
					max="50"
					class="w-full px-3 py-2 border rounded-md"
				/>
			</label>
		</div>
	</div>
	
	<!-- Component Demonstrations -->
	<div class="space-y-8">
		<!-- All-In Pricing Display -->
		<section>
			<h3 class="text-xl font-semibold mb-4">1. All-In Pricing Display</h3>
			<p class="text-gray-600 mb-4">Shows transparent pricing with Stripe fees - compliant with FTC, California SB 478, UK, and EU regulations.</p>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<h4 class="font-medium mb-2">Full Display</h4>
					<AllInPricingDisplay
						basePrice={demoPrice}
						currencySymbol={currencySymbol}
						currency={$userCurrency}
						showBreakdown={true}
						compact={false}
					/>
				</div>
				<div>
					<h4 class="font-medium mb-2">Compact Display</h4>
					<AllInPricingDisplay
						basePrice={demoPrice}
						currencySymbol={currencySymbol}
						currency={$userCurrency}
						showBreakdown={false}
						compact={true}
					/>
				</div>
			</div>
		</section>
		
		<!-- Cost Calculator -->
		<section>
			<h3 class="text-xl font-semibold mb-4">2. Cost Calculator</h3>
			<p class="text-gray-600 mb-4">Helps tour guides understand their true costs and suggests fair pricing to prevent underpricing.</p>
			
			<CostCalculator
				duration={demoDuration}
				capacity={demoCapacity}
				currency={$userCurrency}
				currencySymbol={currencySymbol}
				onSuggestedPrice={(price) => {
					demoPrice = price;
					alert(`Suggested price applied: ${currencySymbol}${price}`);
				}}
			/>
		</section>
		
		<!-- Pricing Validation Messages -->
		<section>
			<h3 class="text-xl font-semibold mb-4">3. Pricing Validation Messages</h3>
			<p class="text-gray-600 mb-4">Shows warnings, errors, and suggestions based on pricing best practices.</p>
			
			<div class="space-y-4">
				<div>
					<h4 class="font-medium mb-2">With current price: {currencySymbol}{demoPrice}</h4>
					<PricingValidationMessages
						basePrice={demoPrice}
						currency={$userCurrency}
						duration={demoDuration}
						participantCategories={demoCategories}
						showSuccessMessages={true}
					/>
				</div>
				
				<div class="mt-6">
					<h4 class="font-medium mb-2">Try these prices to see different messages:</h4>
					<div class="flex flex-wrap gap-2">
						<button 
							onclick={() => demoPrice = 5}
							class="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
						>
							Too Low ({currencySymbol}5)
						</button>
						<button 
							onclick={() => demoPrice = 15}
							class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md text-sm hover:bg-yellow-200"
						>
							Below Minimum ({currencySymbol}15)
						</button>
						<button 
							onclick={() => demoPrice = 45}
							class="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200"
						>
							Good Price ({currencySymbol}45)
						</button>
						<button 
							onclick={() => demoPrice = 0}
							class="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
						>
							Free Tour ({currencySymbol}0)
						</button>
					</div>
				</div>
			</div>
		</section>
		
		<!-- Key Features -->
		<section class="bg-blue-50 rounded-lg p-6">
			<h3 class="text-xl font-semibold mb-4">✨ Key Features</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<h4 class="font-medium mb-2">Legal Compliance</h4>
					<ul class="text-sm text-gray-700 space-y-1">
						<li>✓ FTC all-in pricing (May 2025)</li>
						<li>✓ California SB 478 (Already in effect)</li>
						<li>✓ UK regulations (April 2025)</li>
						<li>✓ EU transparency requirements</li>
					</ul>
				</div>
				<div>
					<h4 class="font-medium mb-2">Guide Benefits</h4>
					<ul class="text-sm text-gray-700 space-y-1">
						<li>✓ Zero platform fees from Zaur</li>
						<li>✓ Only Stripe Express fees (~1.5-2.9%)</li>
						<li>✓ Cost calculator prevents underpricing</li>
						<li>✓ Industry best practices built-in</li>
					</ul>
				</div>
			</div>
		</section>
	</div>
</div>
</PageContainer>

<style>
	/* Use existing app styles */
</style>
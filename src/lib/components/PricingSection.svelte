<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	
	let isYearly = $state(false);
	
	// Calculate prices - matching subscription page
	let starterProPrice = $derived(isYearly ? 13 : 16); // €13/month when billed annually (19% off €16)
	let proPrice = $derived(isYearly ? 29 : 35); // €29/month when billed annually (17% off €35)
	let agencyPrice = $derived(isYearly ? 74 : 89); // €74/month when billed annually (17% off €89)
	let billingPeriod = $derived(isYearly ? '/month billed annually' : '/month');
</script>

<!-- Pricing -->
<section id="pricing" class="py-20" style="background: var(--bg-primary);">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<!-- Early Access Notice -->
		<div class="max-w-3xl mx-auto mb-12">
			<div class="alert-warning p-4 rounded-lg">
				<div class="flex items-start gap-3">
					<AlertCircle class="w-5 h-5 mt-0.5 flex-shrink-0" style="color: var(--color-warning-600);" />
					<div class="flex-1">
						<h3 class="font-semibold mb-1">🚀 Early Access Pricing - Limited Time</h3>
						<p class="text-sm">
							Join now and lock in these special rates forever! Features marked as "Coming Soon" will be rolled out progressively over the coming months.
						</p>
					</div>
				</div>
			</div>
		</div>
		
		<div class="text-center mb-12">
			<h2 class="text-3xl md:text-4xl font-bold mb-4" style="color: var(--text-primary);">
				Simple, Transparent Pricing
			</h2>
			<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
				No booking fees, no commissions. Keep 100% of your revenue with our simple monthly subscription.
			</p>
		</div>
		
		<!-- Toggle -->
		<div class="flex justify-center mb-12">
			<div class="p-1 rounded-lg inline-flex" style="background: var(--bg-secondary);">
				<button 
					class="px-4 py-2 rounded-md font-medium transition-all duration-200 cursor-pointer {!isYearly ? 'shadow-sm' : ''}"
					style="{!isYearly ? 'background: var(--bg-primary); color: var(--text-primary);' : 'background: transparent; color: var(--text-secondary);'}"
					onclick={() => isYearly = false}
				>
					Monthly
				</button>
				<button 
					class="px-4 py-2 rounded-md font-medium transition-all duration-200 cursor-pointer {isYearly ? 'shadow-sm' : ''}"
					style="{isYearly ? 'background: var(--bg-primary); color: var(--text-primary);' : 'background: transparent; color: var(--text-secondary);'}"
					onclick={() => isYearly = true}
				>
					Annual (Save 20%)
				</button>
			</div>
		</div>
		
		<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
			<!-- Free Starter -->
			<div class="relative rounded-lg p-6 flex flex-col" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Free Starter</h3>
				<div class="mb-1">
					<span class="text-3xl font-bold" style="color: var(--text-primary);">€0</span>
				</div>
				<p class="mb-6 text-sm" style="color: var(--text-secondary);">Perfect for trying out Zaur</p>
				
				<ul class="space-y-2 mb-6 flex-grow">
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-secondary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm" style="color: var(--text-primary);">3 bookings/month</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-secondary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm" style="color: var(--text-primary);">1 tour type</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-secondary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm" style="color: var(--text-primary);">Basic QR codes</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-secondary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm" style="color: var(--text-primary);">Email notifications</span>
					</li>
					<li class="flex items-start gap-2">
						<X class="w-4 h-4 icon-danger mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm" style="color: var(--text-secondary);">Zaur branding visible</span>
					</li>
					<li class="flex items-start gap-2">
						<X class="w-4 h-4 icon-danger mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm" style="color: var(--text-secondary);">No SMS notifications</span>
					</li>
					<li class="flex items-start gap-2">
						<X class="w-4 h-4 icon-danger mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm" style="color: var(--text-secondary);">No analytics</span>
					</li>
				</ul>
				
				<a href="/auth/register" class="button-secondary button--full-width text-center">
					Start Free
				</a>
			</div>

			<!-- Solo Guide -->
			<div class="relative rounded-lg p-6 flex flex-col border-2" style="background: var(--bg-primary); border-color: var(--color-primary-500);">
				<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
					<span class="px-3 py-1 rounded-full text-xs font-medium" style="background: var(--color-primary-600); color: white;">Most Popular</span>
				</div>
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Solo Guide</h3>
				<div class="mb-1">
					<span class="text-3xl font-bold" style="color: var(--text-primary);">€{starterProPrice}</span>
					<span class="text-sm" style="color: var(--text-secondary);">{billingPeriod}</span>
				</div>
				<div class="mb-2 h-4">
					<span class="text-xs font-medium transition-opacity duration-200 {isYearly ? 'opacity-100' : 'opacity-0'}" style="color: var(--color-success-600);">
						Save €36/year
					</span>
				</div>
				<p class="mb-6 text-sm" style="color: var(--text-secondary);">Perfect for independent guides</p>
				
				<ul class="space-y-2 mb-6 flex-grow">
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm flex-1" style="color: var(--text-primary);">60 bookings/month</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm flex-1" style="color: var(--text-primary);">5 tour types</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm flex-1" style="color: var(--text-primary);">Remove Zaur branding</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm flex-1" style="color: var(--text-primary);">
							Custom logo & colors
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-2" 
								style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-primary);">
								Coming Soon
							</span>
						</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm flex-1" style="color: var(--text-primary);">
							SMS notifications
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-2" 
								style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-primary);">
								Coming Soon
							</span>
						</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm flex-1" style="color: var(--text-primary);">Email support</span>
					</li>
				</ul>
				
				<a href="/auth/register" class="button-primary button--full-width text-center">
					Get Early Access
				</a>
			</div>
			
			<!-- Professional -->
			<div class="relative rounded-lg p-6 flex flex-col" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Professional</h3>
				<div class="mb-1">
					<span class="text-3xl font-bold" style="color: var(--text-primary);">€{proPrice}</span>
					<span class="text-sm" style="color: var(--text-secondary);">{billingPeriod}</span>
				</div>
				<div class="mb-2 h-4">
					<span class="text-xs font-medium transition-opacity duration-200 {isYearly ? 'opacity-100' : 'opacity-0'}" style="color: var(--color-success-600);">
						Save €72/year
					</span>
				</div>
				<p class="mb-6 text-sm" style="color: var(--text-secondary);">Scale your tour business</p>
				
				<ul class="space-y-2 mb-6 flex-grow">
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm" style="color: var(--text-primary);">Unlimited bookings</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm" style="color: var(--text-primary);">Unlimited tour types</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm flex-1" style="color: var(--text-primary);">
							WhatsApp notifications
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-2" 
								style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-primary);">
								Coming Soon
							</span>
						</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm flex-1" style="color: var(--text-primary);">
							Calendar sync
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-2" 
								style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-primary);">
								Coming Soon
							</span>
						</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm" style="color: var(--text-primary);">Priority support</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm" style="color: var(--text-primary);">Plus all Solo Guide features</span>
					</li>
				</ul>
				
				<a href="/auth/register" class="button-primary button--full-width text-center">
					Get Early Access
				</a>
			</div>
			
			<!-- Agency -->
			<div class="relative rounded-lg p-6 flex flex-col" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Agency</h3>
				<div class="mb-1">
					<span class="text-3xl font-bold" style="color: var(--text-primary);">€{agencyPrice}</span>
					<span class="text-sm" style="color: var(--text-secondary);">{billingPeriod}</span>
				</div>
				<div class="mb-2 h-4">
					<span class="text-xs font-medium transition-opacity duration-200 {isYearly ? 'opacity-100' : 'opacity-0'}" style="color: var(--color-success-600);">
						Save €180/year
					</span>
				</div>
				<p class="mb-6 text-sm" style="color: var(--text-secondary);">For tour companies</p>
				
				<ul class="space-y-2 mb-6 flex-grow">
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm" style="color: var(--text-primary);">Everything in Professional</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm flex-1" style="color: var(--text-primary);">
							Up to 10 tour guides
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-2" 
								style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-primary);">
								Coming Soon
							</span>
						</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm flex-1" style="color: var(--text-primary);">
							API access
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-2" 
								style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-primary);">
								Coming Soon
							</span>
						</span>
					</li>
					<li class="flex items-start gap-2">
						<Check class="w-4 h-4 icon-primary mt-0.5 flex-shrink-0" strokeWidth={2} />
						<span class="text-sm" style="color: var(--text-primary);">Dedicated account manager</span>
					</li>
				</ul>
				
				<a href="/contact" class="button-secondary button--full-width text-center">
					Contact Sales
				</a>
			</div>
		</div>
		
		<div class="mt-12 text-center">
			<div class="p-6 rounded-lg max-w-2xl mx-auto" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
				<p class="font-semibold text-lg mb-2" style="color: var(--color-success-800);">
					💰 Keep 100% of Your Booking Revenue
				</p>
				<p style="color: var(--color-success-700);">
					Unlike competitors who take 3-8% commission per booking, we charge a simple monthly fee. 
					<span class="font-semibold">No booking fees, no commissions, ever!</span>
				</p>
			</div>
		</div>
	</div>
</section> 
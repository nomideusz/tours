<script lang="ts">
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Calendar from 'lucide-svelte/icons/calendar';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Phone from 'lucide-svelte/icons/phone';
	import Smartphone from 'lucide-svelte/icons/smartphone';
	import Shield from 'lucide-svelte/icons/shield';
</script>

<!-- Professional Feature Section -->
<section id="features" class="py-20" style="background: var(--bg-primary);">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
	  <div class="text-center mb-16">
		<h2 class="text-3xl md:text-4xl font-bold mb-4" style="color: var(--text-primary);">
		  Everything You Need to Succeed
		</h2>
		<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
		  Built specifically for tour guides, with features that actually matter for your business.
		</p>
	  </div>
	  
	  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
		<!-- Feature Card 1 -->
		<div class="group rounded-lg p-6 hover:shadow-md transition-all duration-200" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		  <div class="flex items-start">
			<div class="flex-shrink-0">
			  <div class="w-10 h-10 rounded-md flex items-center justify-center" style="background: var(--color-primary-50);">
				<DollarSign class="w-5 h-5" style="color: var(--color-primary-600);" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Keep 100% of Revenue</h3>
			  <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
				No commission fees, just a simple monthly subscription. Get paid directly to your bank account.
			  </p>
			</div>
		  </div>
		</div>
  
		<!-- Feature Card 2 -->
		<div class="group rounded-lg p-6 hover:shadow-md transition-all duration-200" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		  <div class="flex items-start">
			<div class="flex-shrink-0">
			  <div class="w-10 h-10 rounded-md flex items-center justify-center" style="background: var(--color-primary-50);">
				<Calendar class="w-5 h-5" style="color: var(--color-primary-600);" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Smart Scheduling</h3>
			  <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
				Manage availability, prevent double bookings, and set recurring schedules effortlessly.
			  </p>
			</div>
		  </div>
		</div>
  
		<!-- Feature Card 3 -->
		<div class="group rounded-lg p-6 hover:shadow-md transition-all duration-200" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		  <div class="flex items-start">
			<div class="flex-shrink-0">
			  <div class="w-10 h-10 rounded-md flex items-center justify-center" style="background: var(--color-primary-50);">
				<BarChart3 class="w-5 h-5" style="color: var(--color-primary-600);" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Business Analytics</h3>
			  <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
				Track conversion rates, understand booking patterns, and optimize your tours for growth.
			  </p>
			</div>
		  </div>
		</div>
  
		<!-- Feature Card 4 -->
		<div class="group rounded-lg p-6 hover:shadow-md transition-all duration-200" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		  <div class="flex items-start">
			<div class="flex-shrink-0">
			  <div class="w-10 h-10 rounded-md flex items-center justify-center" style="background: var(--color-primary-50);">
				<Phone class="w-5 h-5" style="color: var(--color-primary-600);" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Automated Communications</h3>
			  <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
				Send booking confirmations, QR tickets, and reminders automatically to save time.
			  </p>
			</div>
		  </div>
		</div>
  
		<!-- Feature Card 5 -->
		<div class="group rounded-lg p-6 hover:shadow-md transition-all duration-200" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		  <div class="flex items-start">
			<div class="flex-shrink-0">
			  <div class="w-10 h-10 rounded-md flex items-center justify-center" style="background: var(--color-primary-50);">
				<Smartphone class="w-5 h-5" style="color: var(--color-primary-600);" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Mobile First Design</h3>
			  <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
				Manage your business on the go with our mobile-optimized platform that works everywhere.
			  </p>
			</div>
		  </div>
		</div>
  
		<!-- Feature Card 6 -->
		<div class="group rounded-lg p-6 hover:shadow-md transition-all duration-200" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		  <div class="flex items-start">
			<div class="flex-shrink-0">
			  <div class="w-10 h-10 rounded-md flex items-center justify-center" style="background: var(--color-primary-50);">
				<Shield class="w-5 h-5" style="color: var(--color-primary-600);" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Secure & Compliant</h3>
			  <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
				PCI compliant payment processing with Stripe and GDPR-ready data handling for peace of mind.
			  </p>
			</div>
		  </div>
		</div>
	  </div>
  
	  <!-- Additional trust element -->
	  <div class="mt-16 text-center">
		<p class="mb-6" style="color: var(--text-secondary);">Perfect for tour guides worldwide</p>
		<div class="flex flex-wrap justify-center items-center gap-8">
		  <span class="font-medium" style="color: var(--text-tertiary);">🇪🇺 Europe</span>
		  <span style="color: var(--text-tertiary);">•</span>
		  <span class="font-medium" style="color: var(--text-tertiary);">🇺🇸 Americas</span>
		  <span style="color: var(--text-tertiary);">•</span>
		  <span class="font-medium" style="color: var(--text-tertiary);">🌏 Asia Pacific</span>
		</div>
	  </div>
	</div>
</section> 
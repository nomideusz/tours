<script lang="ts">
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Calendar from 'lucide-svelte/icons/calendar';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Phone from 'lucide-svelte/icons/phone';
	import Smartphone from 'lucide-svelte/icons/smartphone';
	import Shield from 'lucide-svelte/icons/shield';
</script>

<!-- Professional Feature Section -->
<section id="features" class="py-20 bg-white">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
	  <div class="text-center mb-16">
		<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
		  Everything You Need to Succeed
		</h2>
		<p class="text-lg text-gray-600 max-w-2xl mx-auto">
		  Built specifically for tour guides, with features that actually matter for your business.
		</p>
	  </div>
	  
	  <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
		<!-- Feature Card 1 -->
		<div class="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
		  <div class="flex items-start">
			<div class="flex-shrink-0">
			  <div class="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
				<DollarSign class="w-5 h-5 text-blue-600" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold text-gray-900 mb-2">Instant Payments</h3>
			  <p class="text-gray-600 text-sm leading-relaxed">
				Get paid immediately when tourists book. Direct deposits to your bank account with transparent fees.
			  </p>
			</div>
		  </div>
		</div>
  
		<!-- Feature Card 2 -->
		<div class="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
		  <div class="flex items-start">
			<div class="flex-shrink-0">
			  <div class="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
				<Calendar class="w-5 h-5 text-blue-600" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
			  <p class="text-gray-600 text-sm leading-relaxed">
				Manage availability, prevent double bookings, and sync with your personal calendar seamlessly.
			  </p>
			</div>
		  </div>
		</div>
  
		<!-- Feature Card 3 -->
		<div class="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
		  <div class="flex items-start">
			<div class="flex-shrink-0">
			  <div class="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
				<BarChart3 class="w-5 h-5 text-blue-600" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold text-gray-900 mb-2">Business Analytics</h3>
			  <p class="text-gray-600 text-sm leading-relaxed">
				Track performance, understand booking patterns, and optimize your tours for maximum revenue.
			  </p>
			</div>
		  </div>
		</div>
  
		<!-- Feature Card 4 -->
		<div class="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
		  <div class="flex items-start">
			<div class="flex-shrink-0">
			  <div class="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
				<Phone class="w-5 h-5 text-blue-600" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold text-gray-900 mb-2">Automated Communications</h3>
			  <p class="text-gray-600 text-sm leading-relaxed">
				Send booking confirmations, reminders, and follow-ups automatically in multiple languages.
			  </p>
			</div>
		  </div>
		</div>
  
		<!-- Feature Card 5 -->
		<div class="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
		  <div class="flex items-start">
			<div class="flex-shrink-0">
			  <div class="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
				<Smartphone class="w-5 h-5 text-blue-600" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold text-gray-900 mb-2">Mobile First Design</h3>
			  <p class="text-gray-600 text-sm leading-relaxed">
				Manage your business on the go with our mobile-optimized platform that works everywhere.
			  </p>
			</div>
		  </div>
		</div>
  
		<!-- Feature Card 6 -->
		<div class="group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
		  <div class="flex items-start">
			<div class="flex-shrink-0">
			  <div class="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
				<Shield class="w-5 h-5 text-blue-600" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold text-gray-900 mb-2">Secure & Compliant</h3>
			  <p class="text-gray-600 text-sm leading-relaxed">
				PCI compliant payment processing and GDPR-ready data handling for peace of mind.
			  </p>
			</div>
		  </div>
		</div>
	  </div>
  
	  <!-- Additional trust element -->
	  <div class="mt-16 text-center">
		<p class="text-gray-600 mb-6">Perfect for tour guides in</p>
		<div class="flex flex-wrap justify-center items-center gap-8">
		  <span class="text-gray-400 font-medium">Any European City</span>
		  <span class="text-gray-400">•</span>
		  <span class="text-gray-400 font-medium">All Tour Types</span>
		  <span class="text-gray-400">•</span>
		  <span class="text-gray-400 font-medium">Any Group Size</span>
		</div>
	  </div>
	</div>
</section> 
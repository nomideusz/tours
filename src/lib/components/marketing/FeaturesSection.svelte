<script lang="ts">
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Calendar from 'lucide-svelte/icons/calendar';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Phone from 'lucide-svelte/icons/phone';
	import Smartphone from 'lucide-svelte/icons/smartphone';
	import Shield from 'lucide-svelte/icons/shield';
	import Zap from 'lucide-svelte/icons/zap';
	import Download from 'lucide-svelte/icons/download';
	import CreditCard from 'lucide-svelte/icons/credit-card';
</script>

<!-- Professional Feature Section -->
<section id="features" class="py-20" style="background: var(--bg-primary);">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
	  <div class="text-center mb-16">
		<h2 class="text-3xl md:text-4xl font-bold mb-4" style="color: var(--text-primary);">
		  Everything You Need to Succeed
		</h2>
		<p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
		  Built specifically for tour guides, with zero risk and all the features that matter for your business.
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
				<Zap class="w-5 h-5" style="color: var(--color-primary-600);" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">5-Minute Setup</h3>
			  <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
				Create your first tour and start accepting bookings in under 5 minutes. No technical skills needed.
			  </p>
			</div>
		  </div>
		</div>

		<!-- Feature Card 3 -->
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

		<!-- Feature Card 4 -->
		<div class="group rounded-lg p-6 hover:shadow-md transition-all duration-200" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		  <div class="flex items-start">
			<div class="flex-shrink-0">
			  <div class="w-10 h-10 rounded-md flex items-center justify-center" style="background: var(--color-primary-50);">
				<CreditCard class="w-5 h-5" style="color: var(--color-primary-600);" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Secure Payments</h3>
			  <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
				Enterprise-grade security with Stripe. Instant payouts, no chargebacks, full PCI compliance.
			  </p>
			</div>
		  </div>
		</div>

		<!-- Feature Card 5 -->
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

		<!-- Feature Card 6 -->
		<div class="group rounded-lg p-6 hover:shadow-md transition-all duration-200" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		  <div class="flex items-start">
			<div class="flex-shrink-0">
			  <div class="w-10 h-10 rounded-md flex items-center justify-center" style="background: var(--color-primary-50);">
				<Download class="w-5 h-5" style="color: var(--color-primary-600);" strokeWidth={2} />
			  </div>
			</div>
			<div class="ml-4">
			  <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Keep Your Data</h3>
			  <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
				Export your customer data anytime. Cancel without losing your business information or contacts.
			  </p>
			</div>
		  </div>
		</div>
	  </div>

	  <!-- Trust & Guarantee Section -->
	  <div class="mt-16">
		<div class="text-center mb-8">
		  <h3 class="text-2xl font-bold mb-4" style="color: var(--text-primary);">
			Zero Risk. 100% Satisfaction.
		  </h3>
		  <p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary);">
			We're so confident you'll love Zaur, we guarantee your success.
		  </p>
		</div>

		<div class="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
		  <div class="text-center p-6 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<div class="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--color-success-100);">
			  <span class="text-2xl">🆓</span>
			</div>
			<h4 class="font-semibold mb-2" style="color: var(--text-primary);">Free Forever Plan</h4>
			<p class="text-sm" style="color: var(--text-secondary);">
			  Start with our Free plan. No credit card required, no hidden fees.
			</p>
		  </div>

		  <div class="text-center p-6 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<div class="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--color-success-100);">
			  <span class="text-2xl">✂️</span>
			</div>
			<h4 class="font-semibold mb-2" style="color: var(--text-primary);">Cancel Anytime</h4>
			<p class="text-sm" style="color: var(--text-secondary);">
			  No contracts, no commitments. Cancel with one click whenever you want.
			</p>
		  </div>

		  <div class="text-center p-6 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<div class="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--color-success-100);">
			  <span class="text-2xl">💯</span>
			</div>
			<h4 class="font-semibold mb-2" style="color: var(--text-primary);">100% Satisfaction</h4>
			<p class="text-sm" style="color: var(--text-secondary);">
			  Not happy? We'll work with you until you are, or help you migrate elsewhere.
			</p>
		  </div>
		</div>
	  </div>

	  <!-- Global support -->
	  <div class="mt-12 text-center">
		<p class="mb-4" style="color: var(--text-secondary);">Trusted by tour guides worldwide</p>
		<div class="flex flex-wrap justify-center items-center gap-6">
		  <span class="font-medium" style="color: var(--text-tertiary);">🇪🇺 Europe</span>
		  <span style="color: var(--text-tertiary);">•</span>
		  <span class="font-medium" style="color: var(--text-tertiary);">🇺🇸 Americas</span>
		  <span style="color: var(--text-tertiary);">•</span>
		  <span class="font-medium" style="color: var(--text-tertiary);">🌏 Asia Pacific</span>
		  <span style="color: var(--text-tertiary);">•</span>
		  <span class="font-medium" style="color: var(--text-tertiary);">🌍 40+ Countries</span>
		</div>
	  </div>
	</div>
</section> 
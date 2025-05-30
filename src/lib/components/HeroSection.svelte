<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	// Form state
	let emailInput = $state('');
	let isSubmitting = $state(false);
	let showThankYou = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	async function handleEarlyAccess(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		errorMessage = '';
		showThankYou = false;
		successMessage = '';
		
		try {
			const response = await fetch('/api/early-access', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email: emailInput })
			});
			
			const result = await response.json();
			
			if (result.success) {
				// Show thank you message with API response
				showThankYou = true;
				successMessage = result.message;
				emailInput = '';
				
				// Reset after 7 seconds (slightly longer to read the message)
				setTimeout(() => {
					showThankYou = false;
					successMessage = '';
				}, 7000);
			} else {
				// Handle error
				console.error('Subscription failed:', result.error);
				errorMessage = result.error;
			}
		} catch (error) {
			console.error('Network error:', error);
			errorMessage = 'An error occurred. Please try again later.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<!-- Professional Hero Section -->
<section class="relative bg-white pt-8 pb-20">
	<!-- Subtle pattern background -->
	<div class="absolute inset-0">
	  <svg class="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
		<defs>
		  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
			<path d="M 60 0 L 0 0 0 60" fill="none" stroke="#f3f4f6" stroke-width="1"/>
		  </pattern>
		</defs>
		<rect width="100%" height="100%" fill="url(#grid)" />
	  </svg>
	</div>
  
	<div class="relative max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
	  <!-- Trust indicators - more subtle -->
	  <div class="text-center mb-8" in:fade={{ delay: 100 }}>
		<div class="inline-flex items-center gap-6 text-sm text-gray-500">
		  <span class="flex items-center gap-2">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			No credit card required
		  </span>
		  <span>•</span>
		  <span class="flex items-center gap-2">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			Setup in 5 minutes
		  </span>
		</div>
	  </div>
	  
	  <!-- Main hero content - cleaner typography -->
	  <div class="text-center max-w-4xl mx-auto" in:fly={{ y: 20, duration: 600, delay: 200 }}>
		<h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
		  Turn Street Traffic into
		  <span class="text-blue-600">Instant Bookings</span>
		</h1>
		<p class="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
		  Professional QR code booking system for tour guides. 
		  Let tourists book and pay instantly — no apps, no friction.
		</p>
		
		<!-- Simplified form -->
		<form onsubmit={handleEarlyAccess} class="max-w-md mx-auto mb-8">
		  <div class="flex gap-3">
			<input
			  type="email"
			  bind:value={emailInput}
			  placeholder="Enter your email"
			  required
			  disabled={isSubmitting}
			  class="flex-1 px-5 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
			/>
			<button
			  type="submit"
			  disabled={isSubmitting || !emailInput}
			  class="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
			>
			  {isSubmitting ? 'Joining...' : 'Get Started'}
			</button>
		  </div>
		  {#if showThankYou}
			<p class="mt-3 text-green-600 text-sm" in:fade>
			  ✓ {successMessage || 'Thank you! Check your email for next steps.'}
			</p>
		  {/if}
		  {#if errorMessage}
			<p class="mt-3 text-red-600 text-sm" in:fade>
			  {errorMessage}
			</p>
		  {/if}
		</form>
		
		<!-- Social proof - more professional -->
		<div class="flex items-center justify-center gap-2 text-sm text-gray-600">
		  <div class="flex -space-x-2">
			{#each Array(4) as _, i}
			  <img 
				src="https://i.pravatar.cc/32?img={i + 10}" 
				alt="User" 
				class="w-8 h-8 rounded-full border-2 border-white bg-gray-200"
			  />
			{/each}
		  </div>
		  <span class="ml-3">Trusted by 500+ tour guides worldwide</span>
		</div>
	  </div>
  
	  <!-- Product demo -->
	  <div class="mt-16 relative">
		<div class="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
		<img 
		  src="https://picsum.photos/1600/800?random=4" 
		  alt="Zaur Dashboard" 
		  class="w-full rounded-lg shadow-2xl border border-gray-200"
		/>
	  </div>
	</div>
</section> 
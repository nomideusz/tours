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
				showThankYou = true;
				successMessage = result.message;
				emailInput = '';
				
				// Reset after 7 seconds
				setTimeout(() => {
					showThankYou = false;
					successMessage = '';
				}, 7000);
			} else {
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

<!-- Hero Section -->
<section class="marketing-section" style="border-bottom: none; padding-top: 3rem; padding-bottom: 5rem;">
	<div class="marketing-container">
		<!-- Trust indicators -->
		<div class="text-center mb-8" in:fade={{ delay: 100 }}>
			<div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm marketing-text-muted">
				<span class="flex items-center gap-2">
					<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					No credit card required
				</span>
				<span class="hidden sm:inline">•</span>
				<span class="flex items-center gap-2">
					<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Setup in 5 minutes
				</span>
			</div>
		</div>
		
		<!-- Main hero content -->
		<div class="text-center max-w-4xl mx-auto" in:fly={{ y: 20, duration: 600, delay: 200 }}>
			<h1 class="marketing-heading marketing-heading-xl mb-6 tracking-tight">
				Skip Platform Fees.
				<span class="block sm:inline" style="color: var(--color-primary-600);">Get Direct Bookings.</span>
			</h1>
			<p class="text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed marketing-text-secondary">
				Professional QR booking system for independent tour guides. Tourists scan your code and book instantly — you keep 100% of earnings.
			</p>
			
			<!-- CTA Form -->
			<div class="max-w-md mx-auto mb-8">
				<form onsubmit={handleEarlyAccess}>
					<div class="flex flex-col sm:flex-row gap-3">
						<input
							type="email"
							bind:value={emailInput}
							placeholder="Enter your email"
							required
							disabled={isSubmitting}
							class="flex-1 px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 w-full"
							style="border-color: var(--border-primary); background: var(--bg-primary); color: var(--text-primary);"
						/>
						<button
							type="submit"
							disabled={isSubmitting || !emailInput}
							class="marketing-button marketing-button-primary px-6 py-3 whitespace-nowrap w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? 'Joining...' : 'Get Early Access'}
						</button>
					</div>
					{#if showThankYou}
						<p class="mt-3 text-sm" style="color: var(--color-success-600);" in:fade>
							✓ {successMessage || 'Thank you! Check your email for next steps.'}
						</p>
					{/if}
					{#if errorMessage}
						<p class="mt-3 text-sm" style="color: var(--color-danger-600);" in:fade>
							{errorMessage}
						</p>
					{/if}
				</form>
			</div>
			
			<!-- Social proof -->
			<div class="flex flex-col items-center justify-center gap-3 text-sm marketing-text-muted">
				<span class="text-center">🚀 Join the waitlist for early access</span>
				<span class="text-center marketing-text-muted">Be among the first tour guides to try Zaur</span>
			</div>
		</div>

		<!-- Product demo -->
		<div class="mt-16 relative">
			<div class="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent pointer-events-none"></div>
			<div class="marketing-card border-none shadow-2xl overflow-hidden">
				<img 
					src="https://picsum.photos/1600/800?random=4" 
					alt="Zaur Dashboard Preview" 
					class="w-full rounded-lg"
				/>
			</div>
		</div>
	</div>
</section>

 
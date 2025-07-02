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
<section class="py-12 pb-20" style="border-bottom: none;">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
		<!-- Trust indicators -->
		<div class="text-center mb-8" in:fade={{ delay: 100 }}>
			<div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm" style="color: var(--text-tertiary);">
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
			<h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight" style="color: var(--text-primary);">
				Skip Platform Fees.
				<span class="block sm:inline" style="color: var(--color-primary-600);">Get Direct Bookings.</span>
			</h1>
			<p class="text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed" style="color: var(--text-secondary);">
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
							class="px-6 py-3 whitespace-nowrap w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
			<div class="flex flex-col items-center justify-center gap-3 text-sm" style="color: var(--text-tertiary);">
				<span class="text-center">🚀 Join the waitlist for early access</span>
				<span class="text-center" style="color: var(--text-tertiary);">Be among the first tour guides to try Zaur</span>
			</div>
			
			<!-- Trust indicators grid -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 max-w-3xl mx-auto">
				<div class="trust-indicator">
					<div class="trust-icon">⚡</div>
					<div class="trust-value">&lt; 5 min</div>
					<div class="trust-label">Setup Time</div>
				</div>
				<div class="trust-indicator">
					<div class="trust-icon">💸</div>
					<div class="trust-value">0%</div>
					<div class="trust-label">Platform Fee</div>
				</div>
				<div class="trust-indicator">
					<div class="trust-icon">🔒</div>
					<div class="trust-value">Stripe</div>
					<div class="trust-label">Secure Payments</div>
				</div>
				<div class="trust-indicator">
					<div class="trust-icon">🌍</div>
					<div class="trust-value">40+</div>
					<div class="trust-label">Countries</div>
				</div>
			</div>
		</div>

		<!-- Product demo -->
		<div class="mt-16 relative">
			<div class="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent pointer-events-none"></div>
			<div class="rounded-xl border shadow-2xl overflow-hidden" style="border-color: var(--border-primary);">
				<div class="booking-interface-preview">
					<!-- Mobile Device Frame -->
					<div class="device-frame">
						<div class="device-header">
							<div class="flex items-center justify-between p-3">
								<div class="flex items-center gap-2">
									<div class="w-6 h-6 rounded-md flex items-center justify-center" style="background: var(--color-primary-100);">
										<svg class="w-4 h-4" style="color: var(--color-primary-600);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
										</svg>
									</div>
									<span class="text-sm font-medium" style="color: var(--text-primary);">zaur.app</span>
								</div>
								<div class="text-xs" style="color: var(--text-secondary);">Tourist View</div>
							</div>
						</div>
						
						<!-- Booking Interface Content -->
						<div class="booking-content" style="background: var(--bg-secondary);">
							<div class="p-6">
								<!-- Tour Header -->
								<div class="text-center mb-6">
									<h3 class="text-xl font-bold mb-2" style="color: var(--text-primary);">Historic Walking Tour</h3>
									<p class="text-sm" style="color: var(--text-secondary);">with Maria • Barcelona</p>
									<div class="flex items-center justify-center gap-2 mt-2">
										<div class="flex items-center gap-1">
											<svg class="w-4 h-4" style="color: var(--color-warning-500);" fill="currentColor" viewBox="0 0 20 20">
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
											</svg>
											<span class="text-sm font-medium">4.9</span>
										</div>
										<span class="text-sm" style="color: var(--text-secondary);">•</span>
										<span class="text-sm" style="color: var(--text-secondary);">2 hours</span>
									</div>
								</div>
								
								<!-- Pricing Options -->
								<div class="space-y-3 mb-6">
									<div class="pricing-option selected">
										<div class="flex items-center justify-between">
											<div>
												<div class="font-medium" style="color: var(--text-primary);">Standard Tour</div>
												<div class="text-sm" style="color: var(--text-secondary);">English & Spanish</div>
											</div>
											<div class="text-lg font-bold" style="color: var(--color-primary-600);">€25</div>
										</div>
									</div>
									<div class="pricing-option">
										<div class="flex items-center justify-between">
											<div>
												<div class="font-medium" style="color: var(--text-primary);">Private Group</div>
												<div class="text-sm" style="color: var(--text-secondary);">Up to 8 people</div>
											</div>
											<div class="text-lg font-bold" style="color: var(--text-primary);">€150</div>
										</div>
									</div>
								</div>
								
								<!-- Time Slots -->
								<div class="mb-6">
									<h4 class="text-sm font-medium mb-3" style="color: var(--text-primary);">Available Today</h4>
									<div class="grid grid-cols-3 gap-2">
										<button class="time-slot selected">10:00</button>
										<button class="time-slot">14:00</button>
										<button class="time-slot">16:30</button>
									</div>
								</div>
								
								<!-- Book Button -->
								<button class="book-button">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
									</svg>
									Book Instantly - €25
								</button>
								
								<!-- Trust Indicators -->
								<div class="flex items-center justify-center gap-4 mt-4 text-xs" style="color: var(--text-tertiary);">
									<span>✓ Instant confirmation</span>
									<span>✓ Secure payment</span>
									<span>✓ Free cancellation</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.booking-interface-preview {
		max-width: 400px;
		margin: 0 auto;
		background: var(--bg-primary);
		border-radius: 1.5rem;
		overflow: hidden;
		box-shadow: var(--shadow-2xl);
		border: 1px solid var(--border-primary);
	}
	
	.device-frame {
		background: var(--bg-primary);
	}
	
	.device-header {
		border-bottom: 1px solid var(--border-primary);
		background: var(--bg-primary);
	}
	
	.booking-content {
		min-height: 400px;
	}
	
	.pricing-option {
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.pricing-option:hover {
		border-color: var(--color-primary-300);
		box-shadow: var(--shadow-sm);
	}
	
	.pricing-option.selected {
		border-color: var(--color-primary-500);
		background: var(--color-primary-50);
		box-shadow: 0 0 0 1px var(--color-primary-200);
	}
	
	.time-slot {
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: 0.5rem;
		padding: 0.75rem;
		font-weight: 500;
		font-size: 0.875rem;
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.time-slot:hover {
		border-color: var(--color-primary-300);
		background: var(--color-primary-50);
	}
	
	.time-slot.selected {
		background: var(--color-primary-600);
		border-color: var(--color-primary-600);
		color: white;
	}
	
	.book-button {
		width: 100%;
		background: var(--color-primary-600);
		color: white;
		border: none;
		border-radius: 0.75rem;
		padding: 1rem;
		font-weight: 600;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
	}
	
	.book-button:hover {
		background: var(--color-primary-700);
		box-shadow: 0 6px 8px rgba(37, 99, 235, 0.3);
		transform: translateY(-1px);
	}
	
	@media (max-width: 768px) {
		.booking-interface-preview {
			max-width: 350px;
			margin: 0 auto;
		}
		
		.booking-content .p-6 {
			padding: 1.5rem;
		}
		
		.pricing-option {
			padding: 0.75rem;
		}
		
		.time-slot {
			padding: 0.625rem;
			font-size: 0.8rem;
		}
		
		.book-button {
			padding: 0.875rem;
			font-size: 0.9rem;
		}
	}
	
	/* Trust indicators */
	.trust-indicator {
		text-align: center;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}
	
	.trust-indicator:hover {
		border-color: var(--color-primary-300);
		box-shadow: var(--shadow-sm);
		transform: translateY(-1px);
	}
	
	.trust-icon {
		font-size: 1.5rem;
		margin-bottom: 0.25rem;
		line-height: 1;
	}
	
	.trust-value {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
		line-height: 1;
	}
	
	.trust-label {
		font-size: 0.625rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		line-height: 1;
	}
	
	@media (max-width: 640px) {
		.trust-indicator {
			padding: 0.5rem;
		}
		
		.trust-icon {
			font-size: 1.25rem;
		}
		
		.trust-value {
			font-size: 0.875rem;
		}
		
		.trust-label {
			font-size: 0.5625rem;
		}
	}
</style>

 
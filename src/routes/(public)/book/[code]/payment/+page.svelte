<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';
	import { stripePublicKey } from '$lib/stripe.js';
	import { tourOwnerStore } from '$lib/stores/tourOwner.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { formatTourOwnerCurrency } from '$lib/utils/currency.js';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Shield from 'lucide-svelte/icons/shield';
	import Lock from 'lucide-svelte/icons/lock';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	
	let { data }: { data: PageData } = $props();
	
	// Set tour owner in store for header to use
	$effect(() => {
		if (data.tourOwner?.username && data.tourOwner?.name) {
			tourOwnerStore.set({
				username: data.tourOwner.username,
				name: data.tourOwner.name
			});
		}
		
		// Clean up when component is destroyed
		return () => {
			tourOwnerStore.set(null);
		};
	});
	
	let stripe: Stripe | null = $state(null);
	let elements: StripeElements | null = $state(null);
	let paymentElement: any = $state(null);
	let processing = $state(false);
	let error = $state<string | null>(null);
	let paymentSucceeded = $state(false);
	let mounted = $state(false);
	let isInitializing = $state(true);
	let clientSecret = $state<string>('');
	
	// Detect dark mode for Stripe Elements
	function isDarkMode() {
		return document.documentElement.getAttribute('data-theme') === 'dark';
	}
	
	// Get theme-aware Stripe appearance
	function getStripeAppearance() {
		const darkMode = isDarkMode();
		
		return {
			theme: (darkMode ? 'night' : 'stripe') as 'night' | 'stripe',
			variables: {
				colorPrimary: darkMode ? '#3b9ef7' : '#2480ec',
				colorBackground: darkMode ? '#161b22' : '#ffffff',
				colorText: darkMode ? '#f0f6fc' : '#111827',
				colorDanger: darkMode ? '#f87171' : '#ef4444',
				fontFamily: 'Inter, system-ui, sans-serif',
				borderRadius: '8px',
				spacingUnit: '4px',
			},
			rules: {
				'.Label': {
					fontWeight: '500',
					fontSize: '14px',
					marginBottom: '8px',
					color: darkMode ? '#c9d1d9' : '#374151',
				},
				'.Input': {
					borderColor: darkMode ? '#30363d' : '#e5e7eb',
					backgroundColor: darkMode ? '#21262d' : '#ffffff',
					color: darkMode ? '#f0f6fc' : '#111827',
					boxShadow: 'none',
					fontSize: '16px',
					padding: '12px',
				},
				'.Input:focus': {
					borderColor: darkMode ? '#3b9ef7' : '#2480ec',
					boxShadow: darkMode 
						? '0 0 0 3px rgba(59, 158, 247, 0.3)'
						: '0 0 0 3px rgba(36, 128, 236, 0.1)',
				},
				'.Error': {
					fontSize: '13px',
					marginTop: '6px',
					color: darkMode ? '#f87171' : '#ef4444',
				},
				'.Tab': {
					borderColor: darkMode ? '#30363d' : '#e5e7eb',
					backgroundColor: darkMode ? '#0d1117' : '#ffffff',
				},
				'.Tab--selected': {
					borderColor: darkMode ? '#3b9ef7' : '#2480ec',
					backgroundColor: darkMode ? '#161b22' : '#ffffff',
				},
				'.TabLabel': {
					color: darkMode ? '#c9d1d9' : '#6b7280',
				},
				'.TabLabel--selected': {
					color: darkMode ? '#f0f6fc' : '#111827',
				},
			},
		};
	}
	
	onMount(() => {
		let observer: MutationObserver;
		
		const initializePayment = async () => {
			// Initialize Stripe
			if (!stripePublicKey) {
				error = 'Payment system not configured. Please contact support.';
				isInitializing = false;
				return;
			}
			
			stripe = await loadStripe(stripePublicKey);
			if (!stripe) {
				error = 'Failed to load payment system';
				isInitializing = false;
				return;
			}
			
			// Create payment intent with automatic routing
			try {
				let response = await fetch('/api/payments', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						bookingId: data.booking.id,
						amount: parseFloat(data.booking.totalAmount),
						currency: data.tourOwner.currency?.toLowerCase() || 'eur',
					}),
				});
				
				// Handle redirect to platform payment for cross-border countries
				if (!response.ok) {
					const errorData = await response.json();
					
					// Check if we need to redirect to platform payment collection
					if (errorData.error === 'REDIRECT_TO_PLATFORM_PAYMENT' && errorData.redirectEndpoint) {
						console.log('Tour guide requires platform payment collection, redirecting...');
						
						// Retry with platform payment endpoint
						response = await fetch(errorData.redirectEndpoint, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								bookingId: data.booking.id,
								amount: parseFloat(data.booking.totalAmount),
								currency: data.tourOwner.currency?.toLowerCase() || 'eur',
							}),
						});
						
						if (!response.ok) {
							const platformErrorData = await response.json();
							throw new Error(platformErrorData.error || 'Failed to create platform payment');
						}
					} else {
						throw new Error(errorData.error || 'Failed to create payment intent');
					}
				}
				
				const paymentResponse = await response.json();
				const { clientSecret: paymentClientSecret } = paymentResponse;
				
				// Save clientSecret for later use
				clientSecret = paymentClientSecret;
				
				console.log('Initializing Stripe Elements for platform payment (Separate Charges + Transfers)');
				console.log('Amount:', data.booking.totalAmount, 'Currency:', data.tourOwner.currency);
				
				// Initialize Stripe Elements with platform account
				// With Separate Charges, all payments go through platform account
				const elementsOptions: any = {
					clientSecret: paymentClientSecret,
					appearance: getStripeAppearance()
				};
				
				elements = stripe.elements(elementsOptions);
				
				// Create payment element with all payment methods enabled
				paymentElement = elements.create('payment', {
					layout: 'accordion',
					fields: {
						billingDetails: {
							address: 'auto'
						}
					}
				});
				
				// Mount the payment element
				mounted = true;
				isInitializing = false;
				await new Promise(resolve => setTimeout(resolve, 0)); // Wait for DOM update
				
				const container = document.getElementById('payment-element');
				if (container) {
					paymentElement.mount(container);
					console.log('✅ Payment element mounted successfully');
				} else {
					throw new Error('Payment element container not found');
				}
			} catch (err) {
				console.error('Payment initialization error:', err);
				error = 'Failed to initialize payment. Please try again.';
				isInitializing = false;
			}
			
			// Listen for theme changes and update Stripe appearance
			observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
						if (elements) {
							elements.update({ appearance: getStripeAppearance() });
						}
					}
				});
			});
			
			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['data-theme']
			});
		};
		
		initializePayment();
		
		return () => {
			observer?.disconnect();
		};
	});
	
	async function handleSubmit() {
		if (!stripe || !elements) return;
		
		// Clear all previous states
		processing = true;
		error = null;
		paymentSucceeded = false;
		
		try {
			// Confirm payment with proper redirect handling
			const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
				elements,
				confirmParams: {
					return_url: `${window.location.origin}/book/${(data.qrCode as any).code}/success?booking=${(data.booking as any).id}`,
					payment_method_data: {
						billing_details: {
							name: data.booking.customerName,
							email: data.booking.customerEmail,
							phone: data.booking.customerPhone || undefined
						}
					}
				},
				redirect: 'if_required' // This allows handling payments without redirect when possible
			});
			
			if (stripeError) {
				console.log('❌ Payment failed:', stripeError.message);
				error = stripeError.message || 'Payment failed. Please try again.';
				processing = false;
				paymentSucceeded = false;
			} else if (paymentIntent && paymentIntent.status === 'succeeded') {
				// Payment succeeded - show success state immediately
				console.log('✅ Payment successful, navigating to success page');
				paymentSucceeded = true;
				error = null; // Explicitly clear any previous errors
				processing = false; // Stop processing spinner
				
				// Navigate to success page with a small delay to show success feedback
				setTimeout(async () => {
					try {
						await goto(`/book/${(data.qrCode as any).code}/success?booking=${(data.booking as any).id}`);
					} catch (navError) {
						console.error('Navigation error:', navError);
						// If navigation fails, still show success but allow manual retry
						error = 'Payment successful! If page doesn\'t redirect, please refresh.';
					}
				}, 1000);
			}
			// If payment requires redirect, Stripe will handle it automatically
			// In this case, processing stays true until redirect happens
		} catch (err: any) {
			console.error('Payment error:', err);
			error = err?.message || 'An unexpected error occurred. Please try again.';
			processing = false;
			paymentSucceeded = false;
		}
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>Payment - {data.booking.expand?.tour?.name || 'Tour Booking'}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
</svelte:head>

<div class="min-h-screen" style="background: var(--bg-secondary);">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
		<div class="max-w-4xl mx-auto">
			<!-- Back button -->
			<a
				href="/book/{(data.qrCode as any).code}"
				class="inline-flex items-center text-sm mb-6 transition-colors hover:underline" 
				style="color: var(--text-secondary);"
			>
				<ChevronLeft class="w-4 h-4 mr-1" />
				Back to booking
			</a>
			
			<div class="grid gap-6 lg:grid-cols-3">
				<!-- Booking Summary - Left Side -->
				<div class="lg:col-span-1">
					<div class="rounded-xl shadow-sm lg:sticky lg:top-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b" style="border-color: var(--border-primary);">
							<h2 class="font-semibold" style="color: var(--text-primary);">Order Summary</h2>
						</div>
						
						<div class="p-4 space-y-4">
							<!-- Tour Info -->
							<div>
								<h3 class="font-medium text-lg mb-1" style="color: var(--text-primary);">
									{data.booking.expand?.tour?.name}
								</h3>
								{#if data.booking.expand?.tour?.location}
									<p class="text-sm flex items-center gap-1" style="color: var(--text-secondary);">
										<MapPin class="w-4 h-4" />
										{data.booking.expand?.tour?.location}
									</p>
								{/if}
							</div>
							
							<!-- Date & Time -->
							<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
								<div class="flex items-start gap-3">
									<Calendar class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--color-primary-600);" />
									<div class="flex-1">
										<p class="text-sm font-medium" style="color: var(--text-primary);">
											{data.booking.expand?.timeSlot?.startTime ? formatDate(data.booking.expand.timeSlot.startTime) : 'Date TBD'}
										</p>
										<p class="text-sm" style="color: var(--text-secondary);">
											{data.booking.expand?.timeSlot?.startTime && data.booking.expand?.timeSlot?.endTime ? 
												formatSlotTimeRange(data.booking.expand.timeSlot.startTime, data.booking.expand.timeSlot.endTime) : 
												'Time TBD'}
										</p>
									</div>
								</div>
							</div>
							
							<!-- Participants -->
							<div class="flex items-center justify-between">
								<span class="text-sm flex items-center gap-2" style="color: var(--text-secondary);">
									<Users class="w-4 h-4" />
									Participants
								</span>
								<span class="font-medium" style="color: var(--text-primary);">
									{data.booking.participants} {data.booking.participants === 1 ? 'person' : 'people'}
								</span>
							</div>
							
							<!-- Booking Reference -->
							<div class="flex items-center justify-between">
								<span class="text-sm" style="color: var(--text-secondary);">Reference</span>
								<span class="font-mono text-sm font-medium" style="color: var(--text-primary);">
									{data.booking.bookingReference}
								</span>
							</div>
							
							<!-- Total -->
							<div class="pt-4 border-t" style="border-color: var(--border-primary);">
								<div class="flex items-center justify-between">
									<span class="text-lg font-semibold" style="color: var(--text-primary);">Total</span>
									<span class="text-xl font-bold" style="color: var(--color-primary-600);">
										{formatTourOwnerCurrency(data.booking.totalAmount, data.tourOwner?.currency)}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Payment Form - Right Side -->
				<div class="lg:col-span-2">
					<div class="rounded-xl shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<!-- Header -->
						<div class="p-4 sm:p-6 border-b" style="border-color: var(--border-primary);">
							<div class="flex items-center gap-3">
								<div class="icon-wrapper-primary w-12 h-12">
									<CreditCard class="w-6 h-6" />
								</div>
								<div>
									<h1 class="text-xl sm:text-2xl font-bold" style="color: var(--text-primary);">Complete Payment</h1>
									<p class="text-sm" style="color: var(--text-secondary);">
										Secure payment powered by Stripe
									</p>
								</div>
							</div>
						</div>
						
						<!-- Payment Content -->
						<div class="p-4 sm:p-6">
							{#if paymentSucceeded}
								<div class="alert-success mb-6">
									<CheckCircle class="w-5 h-5 flex-shrink-0 mt-0.5" />
									<div class="flex-1">
										<p class="font-medium">Payment Successful!</p>
										<p class="text-sm mt-1">Redirecting to confirmation page...</p>
									</div>
								</div>
							{:else if error}
								<div class="alert-error mb-6">
									<AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" />
									<div class="flex-1">
										<p class="font-medium">{error.includes('Payment successful') ? 'Payment Completed' : 'Payment Error'}</p>
										<p class="text-sm mt-1">{error}</p>
									</div>
								</div>
							{/if}
							
							{#if isInitializing}
								<div class="text-center py-12">
									<Loader2 class="w-12 h-12 animate-spin mx-auto mb-4 icon-primary" />
									<p class="text-lg font-medium" style="color: var(--text-primary);">Setting up secure payment...</p>
									<p class="text-sm mt-2" style="color: var(--text-secondary);">This may take a few seconds</p>
								</div>
							{:else if mounted}
								<form onsubmit={(e) => { 
									e.preventDefault(); 
									if (!paymentSucceeded && !processing) {
										handleSubmit(); 
									}
								}}>
									<!-- Payment Methods Info -->
									<div class="mb-6 p-4 rounded-lg info-box">
										<p class="text-sm font-medium mb-2" style="color: var(--text-primary);">Available payment methods</p>
										<p class="text-xs" style="color: var(--text-secondary);">
											The payment form below will show all available payment methods for your region.
										</p>
									</div>
									
									<!-- Payment Element -->
									<div class="mb-6" class:opacity-50={paymentSucceeded} class:pointer-events-none={paymentSucceeded}>
										<div id="payment-element">
											<!-- Stripe Payment Element will be mounted here -->
										</div>
									</div>
									
									<!-- Submit Button -->
									<button
										type="submit"
										disabled={processing || !stripe || paymentSucceeded}
										class="w-full {paymentSucceeded ? 'button-success' : 'button-primary'} button--large button--gap justify-center"
									>
										{#if paymentSucceeded}
											<CheckCircle class="w-5 h-5" />
											Payment Successful
										{:else if processing}
											<Loader2 class="w-5 h-5 animate-spin" />
											Processing payment...
										{:else}
											<Lock class="w-5 h-5" />
											Pay {formatTourOwnerCurrency(data.booking.totalAmount, data.tourOwner?.currency)}
										{/if}
									</button>
									
									<!-- Security Info -->
									<div class="mt-6 p-4 rounded-lg info-box">
										<div class="flex items-start gap-3">
											<Shield class="w-5 h-5 flex-shrink-0 mt-0.5 icon-success" />
											<div class="flex-1">
												<p class="text-sm font-medium mb-2" style="color: var(--text-primary);">Your payment is secure</p>
												<ul class="space-y-1">
													<li class="text-xs flex items-start gap-2" style="color: var(--text-secondary);">
														<CheckCircle class="w-3 h-3 flex-shrink-0 mt-0.5 icon-success" />
														<span>SSL encrypted connection</span>
													</li>
													<li class="text-xs flex items-start gap-2" style="color: var(--text-secondary);">
														<CheckCircle class="w-3 h-3 flex-shrink-0 mt-0.5 icon-success" />
														<span>PCI compliant payment processing</span>
													</li>
													<li class="text-xs flex items-start gap-2" style="color: var(--text-secondary);">
														<CheckCircle class="w-3 h-3 flex-shrink-0 mt-0.5 icon-success" />
														<span>We never store credit card details</span>
													</li>
													<li class="text-xs flex items-start gap-2" style="color: var(--text-secondary);">
														<CheckCircle class="w-3 h-3 flex-shrink-0 mt-0.5 icon-success" />
														<span>Payment goes directly to tour guide</span>
													</li>
												</ul>
											</div>
										</div>
									</div>
								</form>
							{:else}
								<div class="text-center py-12">
									<AlertCircle class="w-12 h-12 mx-auto mb-4 icon-danger" />
									<p class="text-lg font-medium mb-2" style="color: var(--text-primary);">Unable to load payment form</p>
									<p class="text-sm" style="color: var(--text-secondary);">Please refresh the page or contact support</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div> 
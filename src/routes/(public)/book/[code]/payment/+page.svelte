<script lang="ts">
	import { onMount } from 'svelte';
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
	let mounted = $state(false);
	let isInitializing = $state(true);
	let clientSecret = $state<string>('');
	let googlePayAvailable = $state(false);
	let applePayAvailable = $state(false);
	let paymentRequest: any = $state(null);
	
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
				colorPrimary: darkMode ? '#60a5fa' : '#3B82F6',
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
					borderColor: darkMode ? '#60a5fa' : '#3B82F6',
					boxShadow: darkMode 
						? '0 0 0 3px rgba(96, 165, 250, 0.3)'
						: '0 0 0 3px rgba(59, 130, 246, 0.1)',
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
					borderColor: darkMode ? '#60a5fa' : '#3B82F6',
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
			
			// Create payment intent
			try {
				const response = await fetch('/api/payments', {
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
					const errorData = await response.json();
					throw new Error(errorData.error || 'Failed to create payment intent');
				}
				
				const { clientSecret: paymentClientSecret, connectedAccountId } = await response.json();
				
				// Save clientSecret for later use
				clientSecret = paymentClientSecret;
				
				// Initialize Stripe Elements with connected account for direct charges
				const elementsOptions: any = {
					clientSecret: paymentClientSecret,
					appearance: getStripeAppearance(),
				};
				
				// For direct charges, Elements must be initialized with the connected account context
				if (connectedAccountId) {
					console.log('Initializing payment for direct charge to tour guide account:', connectedAccountId);
					// Create a new Stripe instance for the connected account
					const connectedStripe = await loadStripe(stripePublicKey, {
						stripeAccount: connectedAccountId
					});
					
					if (!connectedStripe) {
						throw new Error('Failed to initialize connected account payment');
					}
					
					// Use the connected account Stripe instance
					stripe = connectedStripe;
					elements = stripe.elements(elementsOptions);
				} else {
					// Fallback to platform account (shouldn't happen with new system)
					console.warn('No connected account ID - payment will go to platform');
					elements = stripe.elements(elementsOptions);
				}
				
				// Create payment element with all payment methods enabled
				paymentElement = (elements as any).create('payment', {
					layout: 'auto', // Let Stripe decide the best layout based on available payment methods
					paymentMethodTypes: 'auto', // Automatically show all payment methods available
					// Disable wallets in the element since we handle them separately
					wallets: {
						applePay: 'never',
						googlePay: 'never'
					},
					fields: {
						billingDetails: {
							address: {
								mode: 'billing',
								autocomplete: {
									mode: 'automatic'
								}
							}
						}
					}
				});
				
				// Mount the card payment element
				mounted = true;
				isInitializing = false;
				await new Promise(resolve => setTimeout(resolve, 0)); // Wait for DOM update
				
				const container = document.getElementById('payment-element');
				if (container) {
					paymentElement.mount(container);
					console.log('Payment element mounted successfully');
					console.log('Connected account ID:', connectedAccountId);
					console.log('Currency:', data.tourOwner.currency);
				}
				
				// Set up Payment Request for wallet payments (outside iframe to avoid sandbox issues)
				try {
					// Create Payment Request for the connected account
					const pr = stripe.paymentRequest({
						country: 'US', // This will be overridden by the connected account's country
						currency: data.tourOwner.currency?.toLowerCase() || 'eur',
						total: {
							label: data.booking.expand?.tour?.name || 'Tour Booking',
							amount: Math.round(parseFloat(data.booking.totalAmount) * 100),
						},
						requestPayerName: true,
						requestPayerEmail: true,
						requestPayerPhone: true,
					});
					
					// Check what payment methods are available
					const canMakePaymentResult = await pr.canMakePayment();
					console.log('Payment Request availability:', canMakePaymentResult);
					
					if (canMakePaymentResult) {
						paymentRequest = pr;
						
						// Check specific wallet availability
						if (canMakePaymentResult.applePay) {
							applePayAvailable = true;
							console.log('Apple Pay is available');
						}
						if (canMakePaymentResult.googlePay) {
							googlePayAvailable = true;
							console.log('Google Pay is available');
						}
						
						// Handle payment method selection
						pr.on('paymentmethod', async (ev: any) => {
							processing = true;
							error = null;
							
							try {
								if (!stripe) throw new Error('Stripe not initialized');
								
								// Confirm the payment
								const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
									clientSecret,
									{ payment_method: ev.paymentMethod.id }
								);
								
								if (confirmError) {
									ev.complete('fail');
									error = confirmError.message || 'Payment failed';
									processing = false;
								} else {
									ev.complete('success');
									// Check if payment succeeded
									if (paymentIntent?.status === 'succeeded') {
										window.location.href = `/book/${data.qrCode.code}/success?booking=${data.booking.id}`;
									} else if (paymentIntent?.status === 'requires_action') {
										// Handle 3DS
										const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
										if (actionError) {
											error = actionError.message || 'Payment authentication failed';
											processing = false;
										} else {
											window.location.href = `/book/${data.qrCode.code}/success?booking=${data.booking.id}`;
										}
									}
								}
							} catch (err: any) {
								ev.complete('fail');
								error = err?.message || 'Payment failed';
								processing = false;
							}
						});
					}
				} catch (err) {
					console.log('Payment Request setup failed:', err);
					// Continue without wallet payments
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
		
		processing = true;
		error = null;
		
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
				error = stripeError.message || 'Payment failed. Please try again.';
				processing = false;
			} else if (paymentIntent && paymentIntent.status === 'succeeded') {
				// Payment succeeded without redirect, go to success page
				window.location.href = `/book/${(data.qrCode as any).code}/success?booking=${(data.booking as any).id}`;
			}
			// If payment requires redirect, Stripe will handle it automatically
		} catch (err: any) {
			console.error('Payment error:', err);
			error = err?.message || 'An unexpected error occurred. Please try again.';
			processing = false;
		}
	}
	
	async function handleWalletPayment() {
		if (!paymentRequest || processing) return;
		
		try {
			// This will open the native payment sheet
			paymentRequest.show();
		} catch (err) {
			console.error('Wallet payment error:', err);
			error = 'Unable to process payment. Please try a different payment method.';
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
							{#if error}
								<div class="alert-error mb-6">
									<AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" />
									<div class="flex-1">
										<p class="font-medium">Payment Error</p>
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
								<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
									<!-- Payment Methods Info -->
									<div class="mb-6 p-4 rounded-lg info-box">
										<p class="text-sm font-medium mb-2" style="color: var(--text-primary);">Available payment methods</p>
										<p class="text-xs" style="color: var(--text-secondary);">
											Choose your preferred payment method below.
										</p>
									</div>
									
									<!-- Wallet Payment Buttons -->
									{#if googlePayAvailable || applePayAvailable}
										<div class="mb-4">
											{#if googlePayAvailable}
												<button
													type="button"
													onclick={handleWalletPayment}
													disabled={processing}
													class="w-full button--large justify-center mb-3"
													style="background: #fff; color: #3c4043; border: 1px solid #dadce0; font-weight: 500;"
												>
													{#if processing}
														<Loader2 class="w-5 h-5 animate-spin" />
														Processing...
													{:else}
														<svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
															<path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#4285F4"/>
														</svg>
														Google Pay
													{/if}
												</button>
											{/if}
											
											{#if applePayAvailable}
												<button
													type="button"
													onclick={handleWalletPayment}
													disabled={processing}
													class="w-full button--large justify-center mb-3"
													style="background: #000; color: #fff; border: 1px solid #000;"
												>
													{#if processing}
														<Loader2 class="w-5 h-5 animate-spin" />
														Processing...
													{:else}
														<svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
															<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
														</svg>
														Apple Pay
													{/if}
												</button>
											{/if}
										</div>
										
										<div class="relative mb-4">
											<div class="absolute inset-0 flex items-center">
												<div class="w-full border-t" style="border-color: var(--border-primary);"></div>
											</div>
											<div class="relative flex justify-center text-sm">
												<span class="px-2" style="background: var(--bg-primary); color: var(--text-secondary);">
													Or pay with card
												</span>
											</div>
										</div>
									{/if}
									
									<!-- Payment Element -->
									<div class="mb-6">
										<div id="payment-element">
											<!-- Stripe Payment Element will be mounted here -->
										</div>
									</div>
									
									<!-- Submit Button -->
									<button
										type="submit"
										disabled={processing || !stripe}
										class="w-full button-primary button--large justify-center"
									>
										{#if processing}
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
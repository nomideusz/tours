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
	let hasWalletSupport = $state(false);
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
				
				// Create payment element for card payments only
				paymentElement = (elements as any).create('payment', {
					layout: 'tabs',
					wallets: {
						// Disable wallets in payment element to avoid sandbox issues
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
				
				// Set up Payment Request Button for wallet payments (Apple Pay, Google Pay)
				// This avoids the iframe sandbox issues
				try {
					paymentRequest = stripe.paymentRequest({
						country: 'US', // Will be overridden by connected account's country
						currency: (data.tourOwner.currency?.toLowerCase() || 'eur') as any,
						total: {
							label: data.booking.expand?.tour?.name || 'Tour Booking',
							amount: Math.round(parseFloat(data.booking.totalAmount) * 100), // Convert to cents
						},
						requestPayerName: true,
						requestPayerEmail: true,
						requestPayerPhone: true,
					});
					
					// Check if Payment Request is available (Apple Pay/Google Pay)
					const canMakePayment = await paymentRequest.canMakePayment();
					hasWalletSupport = !!canMakePayment;
					
					if (canMakePayment) {
						console.log('Wallet payments available:', canMakePayment);
						
						// Create Payment Request Button
						const prButton = elements.create('paymentRequestButton', {
							paymentRequest,
							style: {
								paymentRequestButton: {
									type: 'default',
									theme: isDarkMode() ? 'dark' : 'light',
									height: '48px',
								},
							},
						});
						
						// Mount button after DOM updates
						setTimeout(() => {
							const prButtonElement = document.getElementById('payment-request-button');
							if (prButtonElement) {
								prButton.mount('#payment-request-button');
							}
						}, 100);
						
						// Handle payment request button click
						paymentRequest.on('paymentmethod', async (ev: any) => {
							console.log('Payment method selected:', ev.paymentMethod);
							
							// Confirm the payment intent with the payment method from the payment request
							try {
								processing = true;
								error = null;
								
								if (!stripe) {
									throw new Error('Stripe not initialized');
								}
								
								const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
									clientSecret,
									{
										payment_method: ev.paymentMethod.id,
									},
									{
										handleActions: false,
									}
								);
								
								if (confirmError) {
									// Report to the browser that the payment failed
									ev.complete('fail');
									error = confirmError.message || 'Payment failed. Please try again.';
									processing = false;
								} else {
									// Report to the browser that the payment was successful
									ev.complete('success');
									
									// Handle 3D Secure or redirect if needed
									if (paymentIntent && paymentIntent.status === 'requires_action') {
										const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
										if (actionError) {
											error = actionError.message || 'Payment authentication failed.';
											processing = false;
										} else {
											// Payment succeeded, redirect to success
											window.location.href = `/book/${(data.qrCode as any).code}/success?booking=${(data.booking as any).id}`;
										}
									} else if (paymentIntent && paymentIntent.status === 'succeeded') {
										// Payment succeeded, redirect to success
										window.location.href = `/book/${(data.qrCode as any).code}/success?booking=${(data.booking as any).id}`;
									}
								}
							} catch (err: any) {
								ev.complete('fail');
								error = err?.message || 'Payment failed. Please try again.';
								processing = false;
							}
						});
					}
				} catch (prError) {
					console.warn('Payment Request setup failed:', prError);
					// Continue without wallet support
					hasWalletSupport = false;
				}
				
				// Mount the card payment element
				mounted = true;
				isInitializing = false;
				await new Promise(resolve => setTimeout(resolve, 0)); // Wait for DOM update
				
				const container = document.getElementById('payment-element');
				if (container) {
					paymentElement.mount(container);
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
				// Check for specific Google Pay sandbox error
				if (stripeError.message?.includes('sandboxed') || stripeError.message?.includes('allow-top-navigation')) {
					error = 'Google Pay is not available for this payment. Please use a card instead.';
				} else {
					error = stripeError.message || 'Payment failed. Please try again.';
				}
				processing = false;
			} else if (paymentIntent && paymentIntent.status === 'succeeded') {
				// Payment succeeded without redirect, go to success page
				window.location.href = `/book/${(data.qrCode as any).code}/success?booking=${(data.booking as any).id}`;
			}
			// If payment requires redirect, Stripe will handle it automatically
		} catch (err: any) {
			console.error('Payment error:', err);
			// Handle any unexpected errors
			if (err?.message?.includes('sandboxed') || err?.message?.includes('allow-top-navigation')) {
				error = 'Google Pay is not available for this payment. Please use a card instead.';
			} else {
				error = err?.message || 'An unexpected error occurred. Please try again.';
			}
			processing = false;
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
										<p class="text-sm font-medium mb-2" style="color: var(--text-primary);">Accepted payment methods</p>
										<div class="flex items-center gap-3 flex-wrap">
											<span class="text-xs px-2 py-1 rounded" style="background: var(--bg-tertiary); color: var(--text-secondary);">
												Credit/Debit Cards
											</span>
											{#if hasWalletSupport}
												<span class="text-xs px-2 py-1 rounded" style="background: var(--bg-tertiary); color: var(--text-secondary);">
													Apple Pay
												</span>
												<span class="text-xs px-2 py-1 rounded" style="background: var(--bg-tertiary); color: var(--text-secondary);">
													Google Pay
												</span>
											{/if}
										</div>
									</div>
									
									<!-- Wallet Payment Section (Apple Pay / Google Pay) -->
									{#if hasWalletSupport}
										<div class="mb-6">
											<p class="text-sm font-medium mb-3" style="color: var(--text-primary);">
												Express checkout
											</p>
											<div id="payment-request-button" class="mb-4">
												<!-- Payment Request Button will be mounted here -->
											</div>
											<div class="relative">
												<div class="absolute inset-0 flex items-center">
													<div class="w-full border-t" style="border-color: var(--border-primary);"></div>
												</div>
												<div class="relative flex justify-center text-sm">
													<span class="px-2" style="background: var(--bg-primary); color: var(--text-secondary);">
														Or pay with card
													</span>
												</div>
											</div>
										</div>
									{/if}
									
									<!-- Card Payment Section -->
									<div class="mb-6">
										{#if hasWalletSupport}
											<p class="text-sm font-medium mb-3" style="color: var(--text-primary);">
												Card details
											</p>
										{/if}
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
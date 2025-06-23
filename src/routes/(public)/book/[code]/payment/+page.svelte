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
	
	onMount(async () => {
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
			
			const { clientSecret, connectedAccountId } = await response.json();
			
			// Initialize Stripe Elements with connected account for direct charges
			const elementsOptions: any = {
				clientSecret,
				appearance: {
					theme: 'stripe',
					variables: {
						colorPrimary: '#3B82F6',
						colorBackground: '#ffffff',
						colorText: '#111827',
						colorDanger: '#EF4444',
						fontFamily: 'Inter, system-ui, sans-serif',
						borderRadius: '8px',
						spacingUnit: '4px',
					},
					rules: {
						'.Label': {
							fontWeight: '500',
							fontSize: '14px',
							marginBottom: '8px',
						},
						'.Input': {
							borderColor: '#e5e7eb',
							boxShadow: 'none',
							fontSize: '16px',
							padding: '12px',
						},
						'.Input:focus': {
							borderColor: '#3B82F6',
							boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
						},
						'.Error': {
							fontSize: '13px',
							marginTop: '6px',
						},
					},
				},
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
			
			// Create and mount payment element
			paymentElement = elements.create('payment', {
				layout: 'tabs',
				paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
			});
			
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
	});
	
	async function handleSubmit() {
		if (!stripe || !elements) return;
		
		processing = true;
		error = null;
		
		// Confirm payment
		const { error: stripeError } = await stripe.confirmPayment({
			elements,
			confirmParams: {
				return_url: `${window.location.origin}/book/${(data.qrCode as any).code}/success?booking=${(data.booking as any).id}`,
			},
		});
		
		if (stripeError) {
			error = stripeError.message || 'Payment failed. Please try again.';
			processing = false;
		}
		// If successful, Stripe will redirect to the return_url
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
								<div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background: var(--color-primary-50);">
									<CreditCard class="w-6 h-6" style="color: var(--color-primary-600);" />
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
								<div class="mb-6 p-4 rounded-lg flex items-start gap-3" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
									<AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--color-danger-600);" />
									<div class="flex-1">
										<p class="font-medium" style="color: var(--color-danger-700);">Payment Error</p>
										<p class="text-sm mt-1" style="color: var(--color-danger-600);">{error}</p>
									</div>
								</div>
							{/if}
							
							{#if isInitializing}
								<div class="text-center py-12">
									<Loader2 class="w-12 h-12 animate-spin mx-auto mb-4" style="color: var(--color-primary-600);" />
									<p class="text-lg font-medium" style="color: var(--text-primary);">Setting up secure payment...</p>
									<p class="text-sm mt-2" style="color: var(--text-secondary);">This may take a few seconds</p>
								</div>
							{:else if mounted}
								<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
									<!-- Payment Methods Info -->
									<div class="mb-6 p-4 rounded-lg" style="background: var(--bg-secondary);">
										<p class="text-sm font-medium mb-2" style="color: var(--text-primary);">Accepted payment methods</p>
										<div class="flex items-center gap-3">
											<span class="text-xs px-2 py-1 rounded" style="background: var(--bg-tertiary); color: var(--text-secondary);">
												Credit/Debit Cards
											</span>
											<span class="text-xs px-2 py-1 rounded" style="background: var(--bg-tertiary); color: var(--text-secondary);">
												Apple Pay
											</span>
											<span class="text-xs px-2 py-1 rounded" style="background: var(--bg-tertiary); color: var(--text-secondary);">
												Google Pay
											</span>
										</div>
									</div>
									
									<!-- Stripe Payment Element -->
									<div id="payment-element" class="mb-6">
										<!-- Stripe Elements will be mounted here -->
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
									<div class="mt-6 p-4 rounded-lg" style="background: var(--bg-secondary);">
										<div class="flex items-start gap-3">
											<Shield class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" />
											<div class="flex-1">
												<p class="text-sm font-medium mb-2" style="color: var(--text-primary);">Your payment is secure</p>
												<ul class="space-y-1">
													<li class="text-xs flex items-start gap-2" style="color: var(--text-secondary);">
														<CheckCircle class="w-3 h-3 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" />
														<span>SSL encrypted connection</span>
													</li>
													<li class="text-xs flex items-start gap-2" style="color: var(--text-secondary);">
														<CheckCircle class="w-3 h-3 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" />
														<span>PCI compliant payment processing</span>
													</li>
													<li class="text-xs flex items-start gap-2" style="color: var(--text-secondary);">
														<CheckCircle class="w-3 h-3 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" />
														<span>We never store credit card details</span>
													</li>
													<li class="text-xs flex items-start gap-2" style="color: var(--text-secondary);">
														<CheckCircle class="w-3 h-3 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" />
														<span>Payment goes directly to tour guide</span>
													</li>
												</ul>
											</div>
										</div>
									</div>
								</form>
							{:else}
								<div class="text-center py-12">
									<AlertCircle class="w-12 h-12 mx-auto mb-4" style="color: var(--color-danger-600);" />
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
<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types.js';
	import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';
	import { stripePublicKey } from '$lib/stripe.js';
	import { tourOwnerStore } from '$lib/stores/tourOwner.js';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Shield from 'lucide-svelte/icons/shield';
	import Lock from 'lucide-svelte/icons/lock';
	
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
	
	onMount(async () => {
		// Initialize Stripe
		if (!stripePublicKey) {
			error = 'Payment system not configured. Please contact support.';
			return;
		}
		
		stripe = await loadStripe(stripePublicKey);
		if (!stripe) {
			error = 'Failed to load payment system';
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
					currency: 'eur',
				}),
			});
			
			if (!response.ok) {
				throw new Error('Failed to create payment intent');
			}
			
			const { clientSecret } = await response.json();
			
			// Initialize Stripe Elements
			elements = stripe.elements({
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
					},
				},
			});
			
			// Create and mount payment element
			paymentElement = elements.create('payment', {
				layout: 'tabs',
			});
			
			mounted = true;
			await new Promise(resolve => setTimeout(resolve, 0)); // Wait for DOM update
			
			const container = document.getElementById('payment-element');
			if (container) {
				paymentElement.mount(container);
			}
		} catch (err) {
			console.error('Payment initialization error:', err);
			error = 'Failed to initialize payment. Please try again.';
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
	
	function formatTime(dateString: string) {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});
	}
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<div class="max-w-2xl mx-auto">
		<!-- Back button -->
		<a
			href="/book/{(data.qrCode as any).code}"
			class="inline-flex items-center text-sm mb-6 hover:underline" 
			style="color: var(--text-secondary);"
		>
			<ChevronLeft class="w-4 h-4 mr-1" />
			Back to booking
		</a>
		
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
							<!-- Header -->
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h1 class="text-2xl font-bold" style="color: var(--text-primary);">Complete Your Payment</h1>
				<p class="mt-2 text-sm" style="color: var(--text-secondary);">
					Secure payment powered by Stripe
				</p>
			</div>
			
			<!-- Booking Summary -->
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h2 class="font-semibold mb-4" style="color: var(--text-primary);">Booking Summary</h2>
					
					<div class="space-y-3">
						<div>
							<p class="text-sm text-gray-600">Tour</p>
							<p class="font-medium">{data.booking.expand?.tour?.name}</p>
						</div>
						
						<div>
							<p class="text-sm text-gray-600">Date & Time</p>
							<p class="font-medium">
								{data.booking.expand?.timeSlot?.startTime ? formatDate(data.booking.expand.timeSlot.startTime) : 'Not scheduled'}
								<br />
								{data.booking.expand?.timeSlot?.startTime && data.booking.expand?.timeSlot?.endTime ? 
									`${formatTime(data.booking.expand.timeSlot.startTime)} - ${formatTime(data.booking.expand.timeSlot.endTime)}` : 
									'Time to be determined'}
							</p>
						</div>
						
						<div>
							<p class="text-sm text-gray-600">Participants</p>
							<p class="font-medium">{data.booking.participants} {data.booking.participants === 1 ? 'person' : 'people'}</p>
						</div>
						
						<div>
							<p class="text-sm text-gray-600">Booking Reference</p>
							<p class="font-mono font-medium">{data.booking.bookingReference}</p>
						</div>
						
						<div class="pt-3 border-t">
							<div class="flex justify-between items-center">
								<p class="text-lg font-semibold">Total Amount</p>
								<p class="text-lg font-semibold">€{data.booking.totalAmount}</p>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Payment Form -->
				<div class="p-4">
					{#if error}
						<div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
							<p class="text-sm text-red-600">{error}</p>
						</div>
					{/if}
					
					{#if mounted}
						<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
							<div id="payment-element" class="mb-6">
								<!-- Stripe Elements will be mounted here -->
							</div>
							
							<button
								type="submit"
								disabled={processing || !stripe}
								class="w-full button-primary button--gap justify-center py-3 text-base"
							>
								{#if processing}
									<div class="form-spinner"></div>
									Processing payment...
								{:else}
									<Lock class="w-5 h-5" />
									Pay €{data.booking.totalAmount}
								{/if}
							</button>
						</form>
					{:else}
						<div class="flex justify-center py-8">
							<div class="form-spinner"></div>
						</div>
					{/if}
					
					<!-- Security badges -->
					<div class="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
						<span class="flex items-center gap-1">
							<Shield class="w-4 h-4" />
							SSL Encrypted
						</span>
						<span class="flex items-center gap-1">
							<CreditCard class="w-4 h-4" />
							PCI Compliant
						</span>
					</div>
				</div>
			</div>
			
	</div>
</div> 
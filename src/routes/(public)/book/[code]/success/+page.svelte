<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types.js';
	import { generateTicketURL } from '$lib/ticket-qr.js';
	import { tourOwnerStore } from '$lib/stores/tourOwner.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import Check from 'lucide-svelte/icons/check';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Users from 'lucide-svelte/icons/users';
	import Mail from 'lucide-svelte/icons/mail';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Ticket from 'lucide-svelte/icons/ticket';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	
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
	
	let isPolling = $state(false);
	let pollCount = $state(0);
	let maxPollAttempts = 20; // Poll for up to 1 minute (20 attempts * 3 seconds)
	let booking = $state(data.booking);
	let isPaymentProcessing = $state(data.isPaymentProcessing);
	let pollError = $state<string | null>(null);
	
	onMount(() => {
		// If payment is still processing, start polling for status updates
		if (isPaymentProcessing) {
			startPolling();
		}
	});
	
	async function startPolling() {
		isPolling = true;
		pollError = null;
		
		const pollInterval = setInterval(async () => {
			try {
				pollCount++;
				
				// Fetch updated booking status
				const response = await fetch(`/api/bookings/${booking.id}/status`);
				if (response.ok) {
					const updatedBooking = await response.json();
					booking = updatedBooking;
					
					// Check if payment is now confirmed
					if (booking.status === 'confirmed' && booking.paymentStatus === 'paid') {
						isPaymentProcessing = false;
						isPolling = false;
						clearInterval(pollInterval);
						return;
					}
					
					// Check for payment failure
					if (booking.paymentStatus === 'failed') {
						isPaymentProcessing = false;
						isPolling = false;
						pollError = 'Payment failed. Please contact support.';
						clearInterval(pollInterval);
						return;
					}
				}
				
				// Stop polling after max attempts
				if (pollCount >= maxPollAttempts) {
					isPolling = false;
					pollError = 'Payment confirmation is taking longer than expected. Your booking should be confirmed within a few minutes.';
					clearInterval(pollInterval);
				}
			} catch (err) {
				console.error('Error polling booking status:', err);
				pollCount++;
				if (pollCount >= maxPollAttempts) {
					isPolling = false;
					pollError = 'Unable to verify payment status. Please check your email for confirmation.';
					clearInterval(pollInterval);
				}
			}
		}, 3000); // Poll every 3 seconds
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
	

	
	// Check if we have a ticket QR code available
	let hasTicket = $derived(booking.ticketQRCode && booking.status === 'confirmed' && booking.paymentStatus === 'paid');
	let ticketURL = $derived(hasTicket && booking.ticketQRCode ? generateTicketURL(booking.ticketQRCode) : '');
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<div class="max-w-2xl mx-auto">
		<!-- Success Message -->
		<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			{#if isPaymentProcessing || isPolling}
				<!-- Payment Processing State -->
				<div class="bg-blue-50 px-6 py-8 text-center">
					<div class="flex justify-center mb-4">
						<div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
							<Loader2 class="w-10 h-10 text-blue-600 animate-spin" />
						</div>
					</div>
					<h1 class="text-3xl font-bold text-blue-900 mb-2">Processing Payment...</h1>
					<p class="text-blue-700 mb-4">
						Your payment is being processed. This usually takes a few seconds.
					</p>
					{#if pollError}
						<div class="bg-blue-100 border border-blue-300 rounded-lg p-3 text-blue-800 text-sm">
							<AlertCircle class="w-4 h-4 inline mr-2" />
							{pollError}
						</div>
					{/if}
				</div>
			{:else if pollError && booking.paymentStatus === 'failed'}
				<!-- Payment Failed State -->
				<div class="bg-red-50 px-6 py-8 text-center">
					<div class="flex justify-center mb-4">
						<div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
							<AlertCircle class="w-10 h-10 text-red-600" />
						</div>
					</div>
					<h1 class="text-3xl font-bold text-red-900 mb-2">Payment Failed</h1>
					<p class="text-red-700">
						Unfortunately, your payment could not be processed. Please try again or contact support.
					</p>
				</div>
			{:else}
				<!-- Payment Confirmed State -->
				<div class="bg-green-50 px-6 py-8 text-center">
					<div class="flex justify-center mb-4">
						<div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
							<Check class="w-10 h-10 text-green-600" />
						</div>
					</div>
					<h1 class="text-3xl font-bold text-green-900 mb-2">Booking Confirmed!</h1>
					<p class="text-green-700 mb-4">
						Thank you for your booking. You'll receive a confirmation email shortly.
					</p>
					
					{#if hasTicket}
						<!-- Ticket QR Code Button -->
						<div class="mt-6">
							<a
								href={ticketURL}
								target="_blank"
								class="inline-flex items-center gap-3 px-6 py-3 bg-white text-green-800 border-2 border-green-200 rounded-xl font-semibold hover:bg-green-50 hover:border-green-300 transition-colors"
							>
								<Ticket class="w-6 h-6" />
								<span>View Your Ticket</span>
								<ExternalLink class="w-4 h-4" />
							</a>
							<p class="text-sm text-green-600 mt-2">
								Show this QR code to your guide on the day of the tour
							</p>
						</div>
					{/if}
				</div>
			{/if}
			
			<!-- Booking Details -->
			<div class="px-6 py-6">
				<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<p class="text-sm font-medium text-blue-900 mb-1">Booking Reference</p>
					<p class="text-2xl font-mono font-bold text-blue-800">{booking.bookingReference}</p>
					<p class="text-xs text-blue-600 mt-1">Keep this reference for your records</p>
				</div>
				
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Booking Details</h2>
				
				<div class="space-y-4">
					<div>
						<h3 class="font-medium text-gray-900 mb-2">{booking.expand?.tour?.name}</h3>
						{#if booking.expand?.tour?.description}
							<p class="text-sm text-gray-600">{booking.expand?.tour?.description}</p>
						{/if}
					</div>
					
					<div class="flex items-start gap-3">
						<Calendar class="w-5 h-5 text-gray-400 mt-0.5" />
						<div>
							<p class="font-medium text-gray-900">
								{booking.expand?.timeSlot?.startTime ? formatDate(booking.expand.timeSlot.startTime) : 'Date TBD'}
							</p>
							<p class="text-sm text-gray-600">
								{booking.expand?.timeSlot?.startTime && booking.expand?.timeSlot?.endTime 
									? formatSlotTimeRange(booking.expand.timeSlot.startTime, booking.expand.timeSlot.endTime)
									: 'Time TBD'
								}
							</p>
						</div>
					</div>
					
					{#if booking.expand?.tour?.location}
						<div class="flex items-start gap-3">
							<MapPin class="w-5 h-5 text-gray-400 mt-0.5" />
							<div>
								<p class="font-medium text-gray-900">Meeting Point</p>
								<p class="text-sm text-gray-600">{booking.expand?.tour?.location}</p>
							</div>
						</div>
					{/if}
					
					<div class="flex items-start gap-3">
						<Users class="w-5 h-5 text-gray-400 mt-0.5" />
						<div>
							<p class="font-medium text-gray-900">
								{booking.participants} {booking.participants === 1 ? 'participant' : 'participants'}
							</p>
							<p class="text-sm text-gray-600">€{booking.totalAmount} total</p>
						</div>
					</div>
					
					<div class="flex items-start gap-3">
						<Mail class="w-5 h-5 text-gray-400 mt-0.5" />
						<div>
							<p class="font-medium text-gray-900">Confirmation sent to</p>
							<p class="text-sm text-gray-600">{booking.customerEmail}</p>
						</div>
					</div>
				</div>
				
				<!-- Important Information -->
				{#if !isPaymentProcessing && !pollError}
					<div class="mt-8 p-4 bg-gray-50 rounded-lg">
						<h3 class="font-medium text-gray-900 mb-2">Important Information</h3>
						<ul class="text-sm text-gray-600 space-y-1">
							<li>• Please arrive 10 minutes before the tour starts</li>
							<li>• Bring comfortable walking shoes</li>
							<li>• Check the weather and dress appropriately</li>
							{#if hasTicket}
								<li>• <strong>Show your ticket QR code to your guide for check-in</strong></li>
							{/if}
							<li>• Contact your guide if you need to make changes</li>
						</ul>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Additional Actions -->
		{#if !isPaymentProcessing}
			<div class="mt-8 text-center space-y-4">
				{#if hasTicket}
					<div>
						<a 
							href={ticketURL}
							target="_blank"
							class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
						>
							<Ticket class="w-4 h-4" />
							Access your ticket anytime
						</a>
					</div>
				{/if}
				<div>
					<a 
						href="/" 
						class="text-sm text-gray-600 hover:text-gray-900"
					>
						← Book another tour
					</a>
				</div>
			</div>
		{/if}
	</div>
</div> 
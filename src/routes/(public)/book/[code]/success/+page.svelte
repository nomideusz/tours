<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types.js';
	import { generateTicketURL, generateCheckInURL, getDisplayReference } from '$lib/ticket-qr.js';
	import { tourOwnerStore } from '$lib/stores/tourOwner.js';
	import { createBookingStatusQuery } from '$lib/queries/public-queries.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { formatTourOwnerCurrency } from '$lib/utils/currency.js';
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
	import QrCode from 'lucide-svelte/icons/qr-code';
	
	let { data }: { data: PageData } = $props();
	
	// Use TanStack Query for real-time booking status updates
	let bookingQuery = $derived(data.bookingId ? createBookingStatusQuery(data.bookingId) : null);
	
	// Get data from TanStack Query
	let booking = $derived($bookingQuery?.data?.booking || null);
	let isPaymentProcessing = $derived($bookingQuery?.data?.isPaymentProcessing || false);
	let tourOwner = $derived($bookingQuery?.data?.tourOwner || null);
	let isLoading = $derived($bookingQuery?.isLoading || false);
	let queryError = $derived($bookingQuery?.error);
	
	// QR code element reference
	let qrCodeElement = $state<HTMLCanvasElement>();
	
	// Set tour owner in store for header to use
	$effect(() => {
		if (tourOwner?.username && tourOwner?.name) {
			tourOwnerStore.set({
				username: tourOwner.username,
				name: tourOwner.name
			});
		}
		
		// Clean up when component is destroyed
		return () => {
			tourOwnerStore.set(null);
		};
	});
	
	// Generate QR code when booking is confirmed and has ticket
	$effect(() => {
		if (booking?.ticketQRCode && booking.status === 'confirmed' && booking.paymentStatus === 'paid' && qrCodeElement) {
			// Generate QR code pointing to check-in URL for guides
			const checkInURL = generateCheckInURL(booking.ticketQRCode);
			
			import('qrcode').then(QRCode => {
				QRCode.default.toCanvas(qrCodeElement, checkInURL, {
					width: 200, // Smaller for mobile
					margin: 1,
					color: {
						dark: '#000000',
						light: '#FFFFFF'
					}
				});
			});
		}
	});
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
	
	// Check if we have a ticket QR code available
	let hasTicket = $derived(booking?.ticketQRCode && booking.status === 'confirmed' && booking.paymentStatus === 'paid');
	let ticketURL = $derived(hasTicket && booking?.ticketQRCode ? generateTicketURL(booking.ticketQRCode) : '');
</script>

<svelte:head>
	<title>Booking Confirmation - {booking?.expand?.tour?.name || 'Tour'}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<div class="max-w-2xl mx-auto">
		{#if !data.bookingId}
			<!-- No Booking ID -->
			<div class="flex items-center justify-center min-h-[400px]">
				<div class="text-center max-w-md mx-auto px-6">
					<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Booking Not Found</h1>
					<p class="mb-4" style="color: var(--text-secondary);">We couldn't find your booking information.</p>
				</div>
			</div>
		{:else if isLoading}
			<!-- Loading State -->
			<div class="flex items-center justify-center min-h-[400px]">
				<div class="text-center">
					<Loader2 class="w-12 h-12 animate-spin mx-auto mb-4" style="color: var(--color-primary-600);" />
					<p class="text-lg font-medium" style="color: var(--text-primary);">Loading booking status...</p>
					<p class="text-sm" style="color: var(--text-secondary);">Please wait while we check your payment status</p>
				</div>
			</div>
		{:else if queryError}
			<!-- Error State -->
			<div class="flex items-center justify-center min-h-[400px]">
				<div class="text-center max-w-md mx-auto px-6">
					<AlertCircle class="w-16 h-16 mx-auto mb-4" style="color: var(--color-danger-600);" />
					<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Unable to Load Booking</h1>
					<p class="mb-4" style="color: var(--text-secondary);">
						{queryError.message || 'There was an error loading your booking status. Please try again.'}
					</p>
					<button 
						onclick={() => $bookingQuery?.refetch()}
						class="button-primary"
					>
						Try Again
					</button>
				</div>
			</div>
		{:else if !booking}
			<!-- Booking Not Found -->
			<div class="flex items-center justify-center min-h-[400px]">
				<div class="text-center max-w-md mx-auto px-6">
					<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Booking Not Found</h1>
					<p class="mb-4" style="color: var(--text-secondary);">This booking could not be found or may be invalid.</p>
				</div>
			</div>
		{:else}
			<!-- Success Message -->
			<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				{#if isPaymentProcessing}
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
						<p class="text-sm text-blue-600">
							We're checking your payment status every few seconds. Please wait...
						</p>
					</div>
				{:else if booking.paymentStatus === 'failed'}
					<!-- Payment Failed State -->
					<div class="bg-red-50 px-6 py-8 text-center">
						<div class="flex justify-center mb-4">
							<div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
								<AlertCircle class="w-10 h-10 text-red-600" />
							</div>
						</div>
						<h1 class="text-3xl font-bold text-red-900 mb-2">Payment Failed</h1>
						<p class="text-red-700">
							Unfortunately, your payment could not be processed. Please try booking again or contact support.
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
							<!-- Ticket QR Code Display -->
							<div class="mt-6 space-y-4">
								<div class="bg-white rounded-xl p-4 border-2 border-green-200">
									<h3 class="text-sm font-semibold text-green-900 mb-3 text-center">Your Tour Ticket</h3>
									<div class="flex justify-center mb-3">
										<div class="bg-white rounded-lg p-3 shadow-sm" style="border: 1px solid #e5e7eb;">
											<canvas bind:this={qrCodeElement} class="block"></canvas>
										</div>
									</div>
									<p class="text-center text-sm text-gray-700 font-mono font-bold">
										{booking?.ticketQRCode ? getDisplayReference(booking.ticketQRCode) : ''}
									</p>
									<p class="text-center text-xs text-green-600 mt-2">
										Show this QR code to your guide for check-in
									</p>
								</div>
								
								<a
									href={ticketURL}
									target="_blank"
									class="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-medium text-sm justify-center w-full"
								>
									<Ticket class="w-4 h-4" />
									<span>Open Full Ticket</span>
									<ExternalLink class="w-3 h-3" />
								</a>
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
								<p class="text-sm text-gray-600">{formatTourOwnerCurrency(booking.totalAmount, tourOwner?.currency)} total</p>
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
					{#if !isPaymentProcessing && booking.paymentStatus !== 'failed'}
						<div class="mt-8 p-4 bg-gray-50 rounded-lg">
							<h3 class="font-medium text-gray-900 mb-2">Important Information</h3>
							<ul class="text-sm text-gray-600 space-y-1">
								<li>• Please arrive 10 minutes before the tour starts</li>
								<li>• Bring comfortable walking shoes</li>
								<li>• Check the weather and dress appropriately</li>
								{#if hasTicket}
									<li>• <strong>Show the QR code above to your guide for check-in</strong></li>
									<li>• Save or screenshot this page for easy access</li>
								{/if}
								<li>• Contact your guide if you need to make changes</li>
							</ul>
						</div>
					{/if}
				</div>
			</div>
			
			<!-- Additional Actions -->
			{#if !isPaymentProcessing}
				<div class="mt-8 text-center">
					<a 
						href="/" 
						class="text-sm text-gray-600 hover:text-gray-900"
					>
						← Book another tour
					</a>
				</div>
			{/if}
		{/if}
	</div>
</div> 
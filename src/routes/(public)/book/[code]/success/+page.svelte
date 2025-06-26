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
	import Download from 'lucide-svelte/icons/download';
	import Smartphone from 'lucide-svelte/icons/smartphone';
	import Info from 'lucide-svelte/icons/info';
	import XCircle from 'lucide-svelte/icons/x-circle';
	
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
	let qrCodeGenerated = $state(false);
	
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
		if (booking?.ticketQRCode && booking.status === 'confirmed' && booking.paymentStatus === 'paid' && qrCodeElement && !qrCodeGenerated) {
			// Generate QR code pointing to check-in URL for guides
			const checkInURL = generateCheckInURL(booking.ticketQRCode);
			
			import('qrcode').then(QRCode => {
				QRCode.default.toCanvas(qrCodeElement, checkInURL, {
					width: 240,
					margin: 2,
					color: {
						dark: '#000000',
						light: '#FFFFFF'
					},
					errorCorrectionLevel: 'H'
				});
				qrCodeGenerated = true;
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
	
	// Download QR code as image
	async function downloadQRCode() {
		if (!qrCodeElement) return;
		
		const canvas = qrCodeElement;
		const url = canvas.toDataURL('image/png');
		const a = document.createElement('a');
		a.href = url;
		a.download = `ticket-${booking?.bookingReference}.png`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
</script>

<svelte:head>
	<title>Booking {booking?.paymentStatus === 'paid' ? 'Confirmed' : 'Status'} - {booking?.expand?.tour?.name || 'Tour'}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
</svelte:head>

<div class="min-h-screen" style="background: var(--bg-secondary);">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
		{#if !data.bookingId}
			<!-- No Booking ID -->
			<div class="flex items-center justify-center min-h-[600px]">
				<div class="text-center max-w-md mx-auto px-6">
					<div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--bg-primary);">
						<AlertCircle class="w-10 h-10" style="color: var(--text-tertiary);" />
					</div>
					<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Booking Not Found</h1>
					<p class="mb-4" style="color: var(--text-secondary);">We couldn't find your booking information.</p>
				</div>
			</div>
		{:else if isLoading}
			<!-- Loading State -->
			<div class="flex items-center justify-center min-h-[600px]">
				<div class="text-center">
					<Loader2 class="w-12 h-12 animate-spin mx-auto mb-4" style="color: var(--color-primary-600);" />
					<p class="text-lg font-medium" style="color: var(--text-primary);">Loading booking status...</p>
					<p class="text-sm" style="color: var(--text-secondary);">Please wait while we check your payment status</p>
				</div>
			</div>
		{:else if queryError}
			<!-- Error State -->
			<div class="flex items-center justify-center min-h-[600px]">
				<div class="text-center max-w-md mx-auto px-6">
					<div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--color-danger-50);">
						<AlertCircle class="w-10 h-10" style="color: var(--color-danger-600);" />
					</div>
					<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Unable to Load Booking</h1>
					<p class="mb-6" style="color: var(--text-secondary);">
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
			<div class="flex items-center justify-center min-h-[600px]">
				<div class="text-center max-w-md mx-auto px-6">
					<div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--bg-primary);">
						<AlertCircle class="w-10 h-10" style="color: var(--text-tertiary);" />
					</div>
					<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Booking Not Found</h1>
					<p class="mb-4" style="color: var(--text-secondary);">This booking could not be found or may be invalid.</p>
				</div>
			</div>
		{:else}
			<div class="max-w-2xl mx-auto">
				{#if isPaymentProcessing}
					<!-- Payment Processing State -->
					<div class="rounded-xl overflow-hidden shadow-sm alert-info">
						<div class="p-8 sm:p-12 text-center">
							<div class="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-white">
								<Loader2 class="w-10 h-10 animate-spin" style="color: var(--color-info-600);" />
							</div>
							<h1 class="text-2xl sm:text-3xl font-bold mb-3">Processing Payment...</h1>
							<p class="text-lg mb-4">
								Your payment is being processed. This usually takes a few seconds.
							</p>
							<p class="text-sm">
								Please don't close this page. We're checking your payment status...
							</p>
						</div>
					</div>
				{:else if booking.paymentStatus === 'failed'}
					<!-- Payment Failed State -->
					<div class="rounded-xl overflow-hidden shadow-sm alert-error">
						<div class="p-8 sm:p-12 text-center">
							<div class="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-white">
								<XCircle class="w-10 h-10" style="color: var(--color-error-600);" />
							</div>
							<h1 class="text-2xl sm:text-3xl font-bold mb-3">Payment Failed</h1>
							<p class="text-lg mb-6">
								Unfortunately, your payment could not be processed.
							</p>
							<a 
								href="/book/{data.qrCode}"
								class="button-primary"
							>
								Try Booking Again
							</a>
						</div>
					</div>
				{:else}
					<!-- Payment Confirmed State -->
					<div class="space-y-6">
						<!-- Success Header -->
						<div class="rounded-xl overflow-hidden shadow-sm alert-success">
							<div class="p-8 sm:p-12 text-center">
								<div class="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-white">
									<Check class="w-10 h-10" style="color: var(--color-success-600);" />
								</div>
								<h1 class="text-2xl sm:text-3xl font-bold mb-3">Booking Confirmed!</h1>
								<p class="text-lg mb-2">
									Thank you for your booking
								</p>
								<p class="text-sm">
									A confirmation email has been sent to {booking.customerEmail}
								</p>
							</div>
							
							<!-- Booking Reference -->
							<div class="p-6 border-b" style="border-color: var(--border-primary); background: var(--bg-primary);">
								<div class="text-center">
									<p class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Booking Reference</p>
									<p class="text-2xl font-mono font-bold" style="color: var(--color-primary-600);">
										{booking.bookingReference}
									</p>
								</div>
							</div>
						</div>
						
						{#if hasTicket}
							<!-- QR Ticket Section -->
							<div class="rounded-xl overflow-hidden shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
								<div class="p-4 sm:p-6 border-b" style="border-color: var(--border-primary);">
									<div class="flex items-center gap-3">
										<div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: var(--color-primary-50);">
											<QrCode class="w-5 h-5" style="color: var(--color-primary-600);" />
										</div>
										<div>
											<h2 class="font-semibold" style="color: var(--text-primary);">Your Tour Ticket</h2>
											<p class="text-sm" style="color: var(--text-secondary);">Show this QR code at check-in</p>
										</div>
									</div>
								</div>
								
								<div class="p-6 sm:p-8">
									<!-- QR Code Display -->
									<div class="text-center mb-6">
										<div class="inline-block p-4 rounded-xl shadow-lg" style="background: white; border: 2px solid var(--border-primary);">
											<canvas bind:this={qrCodeElement} class="block"></canvas>
										</div>
										<p class="mt-4 text-sm font-mono font-bold" style="color: var(--text-primary);">
											{booking?.ticketQRCode ? getDisplayReference(booking.ticketQRCode) : ''}
										</p>
									</div>
									
									<!-- Action Buttons -->
									<div class="grid gap-3 sm:grid-cols-3">
										<button
											onclick={downloadQRCode}
											class="button--secondary button--gap justify-center"
										>
											<Download class="w-4 h-4" />
											Download QR
										</button>
										
										<a
											href={ticketURL}
											target="_blank"
											class="button--secondary button--gap justify-center"
										>
											<Ticket class="w-4 h-4" />
											View Ticket
											<ExternalLink class="w-3 h-3" />
										</a>
										
										<button
											onclick={() => navigator.share?.({ url: ticketURL, title: 'Tour Ticket' })}
											class="button--secondary button--gap justify-center"
											disabled={!navigator.share}
										>
											<Smartphone class="w-4 h-4" />
											Save to Phone
										</button>
									</div>
									
									<!-- Instructions -->
									<div class="mt-6 p-4 rounded-lg" style="background: var(--bg-secondary);">
										<p class="text-sm font-medium mb-2" style="color: var(--text-primary);">How to use your ticket:</p>
										<ol class="text-sm space-y-1" style="color: var(--text-secondary);">
											<li>1. Save this QR code to your phone or take a screenshot</li>
											<li>2. Show the QR code to your tour guide at check-in</li>
											<li>3. No need to print - digital tickets are accepted</li>
										</ol>
									</div>
								</div>
							</div>
						{/if}
						
						<!-- Booking Details -->
						<div class="rounded-xl overflow-hidden shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
							<div class="p-4 sm:p-6 border-b" style="border-color: var(--border-primary);">
								<h2 class="font-semibold" style="color: var(--text-primary);">Booking Details</h2>
							</div>
							
							<div class="p-4 sm:p-6 space-y-4">
								<!-- Tour Name -->
								<div>
									<h3 class="font-medium text-lg mb-2" style="color: var(--text-primary);">
										{booking.expand?.tour?.name}
									</h3>
									{#if booking.expand?.tour?.description}
										<p class="text-sm" style="color: var(--text-secondary);">
											{booking.expand?.tour?.description}
										</p>
									{/if}
								</div>
								
								<!-- Date & Time -->
								<div class="p-4 rounded-lg" style="background: var(--bg-secondary);">
									<div class="flex items-start gap-3">
										<Calendar class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--color-primary-600);" />
										<div class="flex-1">
											<p class="font-medium" style="color: var(--text-primary);">
												{booking.expand?.timeSlot?.startTime ? formatDate(booking.expand.timeSlot.startTime) : 'Date TBD'}
											</p>
											<p class="text-sm mt-1" style="color: var(--text-secondary);">
												{booking.expand?.timeSlot?.startTime && booking.expand?.timeSlot?.endTime 
													? formatSlotTimeRange(booking.expand.timeSlot.startTime, booking.expand.timeSlot.endTime)
													: 'Time TBD'
												}
											</p>
										</div>
									</div>
								</div>
								
								<!-- Meeting Point -->
								{#if booking.expand?.tour?.location}
									<div class="flex items-start gap-3">
										<MapPin class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--text-tertiary);" />
										<div class="flex-1">
											<p class="font-medium" style="color: var(--text-primary);">Meeting Point</p>
											<p class="text-sm mt-1" style="color: var(--text-secondary);">
												{booking.expand?.tour?.location}
											</p>
										</div>
									</div>
								{/if}
								
								<!-- Participants & Price -->
								<div class="flex items-start gap-3">
									<Users class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--text-tertiary);" />
									<div class="flex-1">
										<p class="font-medium" style="color: var(--text-primary);">
											{booking.participants} {booking.participants === 1 ? 'Participant' : 'Participants'}
										</p>
										<p class="text-sm mt-1" style="color: var(--text-secondary);">
											Total paid: {formatTourOwnerCurrency(booking.totalAmount, tourOwner?.currency)}
										</p>
									</div>
								</div>
								
								<!-- Contact Info -->
								<div class="flex items-start gap-3">
									<Mail class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--text-tertiary);" />
									<div class="flex-1">
										<p class="font-medium" style="color: var(--text-primary);">Confirmation Email</p>
										<p class="text-sm mt-1" style="color: var(--text-secondary);">
											{booking.customerEmail}
										</p>
									</div>
								</div>
							</div>
						</div>
						
						<!-- Important Information -->
						<div class="rounded-xl overflow-hidden shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
							<div class="p-4 sm:p-6">
								<div class="flex items-start gap-3">
									<Info class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--color-primary-600);" />
									<div class="flex-1">
										<h3 class="font-medium mb-3" style="color: var(--text-primary);">Important Information</h3>
										<ul class="text-sm space-y-2" style="color: var(--text-secondary);">
											<li class="flex items-start gap-2">
												<span class="text-xs mt-0.5">•</span>
												<span>Please arrive 10 minutes before the tour starts</span>
											</li>
											<li class="flex items-start gap-2">
												<span class="text-xs mt-0.5">•</span>
												<span>Bring comfortable walking shoes and weather-appropriate clothing</span>
											</li>
											{#if hasTicket}
												<li class="flex items-start gap-2">
													<span class="text-xs mt-0.5">•</span>
													<span><strong>Show your QR code ticket to the guide for check-in</strong></span>
												</li>
											{/if}
											<li class="flex items-start gap-2">
												<span class="text-xs mt-0.5">•</span>
												<span>For changes or cancellations, contact your tour guide directly</span>
											</li>
											{#if booking.specialRequests}
												<li class="flex items-start gap-2">
													<span class="text-xs mt-0.5">•</span>
													<span>Your special requests have been noted: "{booking.specialRequests}"</span>
												</li>
											{/if}
										</ul>
									</div>
								</div>
							</div>
						</div>
						
						<!-- Footer Actions -->
						<div class="text-center pb-8">
							<a 
								href="/" 
								class="text-sm transition-colors hover-link" 
								style="color: var(--text-secondary);"
							>
								← Back to homepage
							</a>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.hover-link:hover {
		color: var(--text-primary) !important;
	}
</style> 
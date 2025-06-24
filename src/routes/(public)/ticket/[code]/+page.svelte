<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types.js';
	import { generateCheckInURL, getDisplayReference } from '$lib/ticket-qr.js';
	import { createPublicTicketQuery } from '$lib/queries/public-queries.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { formatTourOwnerCurrency } from '$lib/utils/currency.js';
	import { formatParticipantDisplay } from '$lib/utils/participant-display.js';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Users from 'lucide-svelte/icons/users';
	import Euro from 'lucide-svelte/icons/euro';
	import Phone from 'lucide-svelte/icons/phone';
	import Mail from 'lucide-svelte/icons/mail';
	import User from 'lucide-svelte/icons/user';
	import Ticket from 'lucide-svelte/icons/ticket';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	
	let { data }: { data: PageData } = $props();
	
	// Use TanStack Query for real-time data
	let ticketQuery = $derived(createPublicTicketQuery(data.ticketCode));
	
	// Get data from TanStack Query
	let booking = $derived($ticketQuery.data?.booking || null);
	let tourOwner = $derived($ticketQuery.data?.tourOwner || null);
	let isLoading = $derived($ticketQuery.isLoading);
	let queryError = $derived($ticketQuery.error);
	
	let qrCodeElement = $state<HTMLCanvasElement>();
	
	// Function to generate QR code
	async function generateQRCode() {
		if (!booking || !qrCodeElement) return;
		
		try {
			const QRCode = await import('qrcode');
			const checkInURL = generateCheckInURL(data.ticketCode);
			
			// Check if dark mode is active
			const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
			
			await QRCode.default.toCanvas(qrCodeElement, checkInURL, {
				width: 200,
				margin: 1,
				color: {
					dark: isDarkMode ? '#ffffff' : '#000000',
					light: isDarkMode ? '#1a1a1a' : '#ffffff'
				}
			});
		} catch (error) {
			console.error('QR code generation failed:', error);
		}
	}
	
	// Generate QR code when booking is loaded or theme changes
	$effect(() => {
		if (booking && qrCodeElement) {
			generateQRCode();
			
			// Watch for theme changes
			const observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
						generateQRCode();
					}
				});
			});
			
			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['data-theme']
			});
			
			return () => {
				observer.disconnect();
			};
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
	
	function getStatusInfo(attendanceStatus: string) {
		switch (attendanceStatus) {
			case 'checked_in':
				return {
					icon: CheckCircle,
					text: 'Checked In',
					class: 'status-confirmed',
					iconClass: ''
				};
			case 'no_show':
				return {
					icon: AlertCircle,
					text: 'No Show',
					class: 'status-cancelled',
					iconClass: ''
				};
			default:
				return {
					icon: Clock,
					text: 'Not Arrived',
					class: 'status-pending',
					iconClass: ''
				};
		}
	}
	
	let statusInfo = $derived(getStatusInfo(booking?.attendanceStatus || 'not_arrived'));
</script>

<svelte:head>
	<title>Your Tour Ticket - {booking?.expand?.tour?.name || 'Loading...'}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<div class="max-w-lg mx-auto">
		{#if isLoading}
			<!-- Loading State -->
			<div class="flex items-center justify-center min-h-[400px]">
				<div class="text-center">
					<Loader2 class="w-12 h-12 animate-spin mx-auto mb-4" style="color: var(--color-primary-600);" />
					<p class="text-lg font-medium" style="color: var(--text-primary);">Loading ticket...</p>
					<p class="text-sm" style="color: var(--text-secondary);">Please wait while we fetch your ticket information</p>
				</div>
			</div>
		{:else if queryError}
			<!-- Error State -->
			<div class="flex items-center justify-center min-h-[400px]">
				<div class="text-center max-w-md mx-auto px-6">
					<AlertCircle class="w-16 h-16 mx-auto mb-4" style="color: var(--color-danger-600);" />
					<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Unable to Load Ticket</h1>
					<p class="mb-4" style="color: var(--text-secondary);">
						{queryError.message || 'There was an error loading your ticket. Please try again.'}
					</p>
					<button 
						onclick={() => $ticketQuery.refetch()}
						class="button-primary"
					>
						Try Again
					</button>
				</div>
			</div>
		{:else if !booking}
			<!-- Ticket Not Found -->
			<div class="flex items-center justify-center min-h-[400px]">
				<div class="text-center max-w-md mx-auto px-6">
					<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Ticket Not Found</h1>
					<p class="mb-4" style="color: var(--text-secondary);">This ticket could not be found or may be invalid.</p>
				</div>
			</div>
		{:else}
			<!-- Mobile-first ticket design -->
			<div style="background: var(--bg-primary);" class="shadow-xl rounded-xl overflow-hidden">
				<!-- Header -->
				<div class="px-4 sm:px-6 py-8 text-center ticket-header">
					<div class="flex justify-center mb-4">
						<div class="w-16 h-16 ticket-header-icon rounded-full flex items-center justify-center">
							<Ticket class="w-8 h-8" />
						</div>
					</div>
					<h1 class="text-2xl font-bold mb-2">Your Tour Ticket</h1>
					<p class="opacity-90">Show this QR code to your guide</p>
				</div>
				
				<!-- Ticket Status -->
				<div class="px-4 sm:px-6 py-4 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center justify-center gap-2">
						<span class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-full {statusInfo.class}">
							<statusInfo.icon class="w-4 h-4" />
							{statusInfo.text}
						</span>
					</div>
				</div>
				
				<!-- QR Code -->
				<div class="px-4 sm:px-6 py-8 text-center border-b" style="border-color: var(--border-primary);">
					<div class="max-w-[240px] mx-auto rounded-xl p-4 mb-4 qr-code-container">
						<div class="w-full flex justify-center">
							<canvas bind:this={qrCodeElement} class="block max-w-full"></canvas>
						</div>
					</div>
					<p class="text-sm mb-2" style="color: var(--text-secondary);">Ticket Code</p>
					<p class="text-xl font-mono font-bold" style="color: var(--text-primary);">{getDisplayReference(data.ticketCode)}</p>
				</div>
				
				<!-- Tour Details -->
				<div class="px-4 sm:px-6 py-6 space-y-4">
					<div>
						<h2 class="text-xl font-bold mb-1" style="color: var(--text-primary);">{booking.expand?.tour?.name}</h2>
						{#if booking.expand?.tour?.description}
							<p class="text-sm" style="color: var(--text-secondary);">{booking.expand?.tour?.description}</p>
						{/if}
					</div>
					
					<div class="grid gap-4">
						<div class="flex items-center gap-3">
							<Calendar class="w-5 h-5" style="color: var(--text-tertiary);" />
							<div>
								<p class="font-medium" style="color: var(--text-primary);">
									{booking.expand?.timeSlot?.startTime ? formatDate(booking.expand.timeSlot.startTime) : 'Date TBD'}
								</p>
								<p class="text-sm" style="color: var(--text-secondary);">
									{booking.expand?.timeSlot?.startTime && booking.expand?.timeSlot?.endTime ? 
										formatSlotTimeRange(booking.expand.timeSlot.startTime, booking.expand.timeSlot.endTime) : 
										'Time TBD'}
								</p>
							</div>
						</div>
						
						{#if booking.expand?.tour?.location}
							<div class="flex items-start gap-3">
								<MapPin class="w-5 h-5 mt-1" style="color: var(--text-tertiary);" />
								<div>
									<p class="font-medium" style="color: var(--text-primary);">Meeting Point</p>
									<p class="text-sm" style="color: var(--text-secondary);">{booking.expand?.tour?.location}</p>
								</div>
							</div>
						{/if}
						
						<div class="flex items-center gap-3">
							<Users class="w-5 h-5" style="color: var(--text-tertiary);" />
							<div>
								<p class="font-medium" style="color: var(--text-primary);">
									{formatParticipantDisplay(booking)}
								</p>
								<p class="text-sm" style="color: var(--text-secondary);">{formatTourOwnerCurrency(booking.totalAmount, tourOwner?.currency)} total</p>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Customer Details -->
				<div class="px-4 sm:px-6 py-6 border-t" style="background: var(--bg-secondary); border-color: var(--border-primary);">
					<h3 class="font-semibold mb-4" style="color: var(--text-primary);">Booking Details</h3>
					<div class="space-y-3 text-sm">
						<div class="flex items-center gap-3">
							<User class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span style="color: var(--text-primary);">{booking.customerName}</span>
						</div>
						<div class="flex items-center gap-3">
							<Mail class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span style="color: var(--text-primary);">{booking.customerEmail}</span>
						</div>
						{#if booking.customerPhone}
							<div class="flex items-center gap-3">
								<Phone class="w-4 h-4" style="color: var(--text-tertiary);" />
								<span style="color: var(--text-primary);">{booking.customerPhone}</span>
							</div>
						{/if}
						<div class="flex items-center gap-3">
							<Ticket class="w-4 h-4" style="color: var(--text-tertiary);" />
							<span style="color: var(--text-primary);">Ref: {booking.bookingReference}</span>
						</div>
					</div>
					
					{#if booking.specialRequests}
						<div class="mt-4 p-3 rounded-lg info-box">
							<p class="text-sm font-medium mb-1" style="color: var(--text-primary);">Special Requests:</p>
							<p class="text-sm" style="color: var(--text-secondary);">{booking.specialRequests}</p>
						</div>
					{/if}
				</div>
				
				<!-- Important Notes -->
				<div class="px-4 sm:px-6 py-6 border-t" style="border-color: var(--border-primary);">
					<h3 class="font-semibold mb-3" style="color: var(--text-primary);">Important Information</h3>
					<ul class="text-sm space-y-2" style="color: var(--text-secondary);">
						<li class="flex gap-2">
							<span style="color: var(--text-primary);">•</span>
							<span>Please arrive 10 minutes before the tour starts</span>
						</li>
						<li class="flex gap-2">
							<span style="color: var(--text-primary);">•</span>
							<span>Show this QR code to your guide for check-in</span>
						</li>
						<li class="flex gap-2">
							<span style="color: var(--text-primary);">•</span>
							<span>Bring comfortable walking shoes and weather-appropriate clothing</span>
						</li>
						<li class="flex gap-2">
							<span style="color: var(--text-primary);">•</span>
							<span>Contact your guide if you need to make any changes</span>
						</li>
					</ul>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Ticket header styling */
	.ticket-header {
		background: var(--color-primary-600);
		color: white;
	}
	
	[data-theme="dark"] .ticket-header {
		background: var(--color-primary-700);
	}
	
	.ticket-header-icon {
		background: rgba(255, 255, 255, 0.2);
	}
	
	[data-theme="dark"] .ticket-header-icon {
		background: rgba(255, 255, 255, 0.1);
	}
	
	/* QR Code container */
	.qr-code-container {
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
	}
	
	[data-theme="dark"] .qr-code-container {
		background: var(--bg-secondary);
	}
	
	/* Ensure canvas adapts to container */
	.qr-code-container canvas {
		border-radius: 0.25rem;
	}
</style> 
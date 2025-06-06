<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types.js';
	import { generateCheckInURL, getDisplayReference } from '$lib/ticket-qr.js';
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
	
	let { data }: { data: PageData } = $props();
	
	let qrCodeElement = $state<HTMLDivElement>();
	
	onMount(async () => {
		if (qrCodeElement) {
			generateQRCode();
		}
	});
	
	async function generateQRCode() {
		if (!qrCodeElement) return;
		
		try {
			// Generate QR code pointing to check-in URL for guides
			const checkInURL = generateCheckInURL(data.ticketCode);
			
			// Clear existing content
			qrCodeElement.innerHTML = '';
			
			// Use simple QR code API
			const img = document.createElement('img');
			img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkInURL)}`;
			img.alt = `Ticket QR Code`;
			img.className = 'w-full h-full object-contain';
			img.loading = 'lazy';
			qrCodeElement.appendChild(img);
		} catch (err) {
			console.error('Error generating QR code:', err);
		}
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
	
	function formatTime(dateString: string) {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
	
	function getStatusInfo(attendanceStatus: string) {
		switch (attendanceStatus) {
			case 'checked_in':
				return {
					icon: CheckCircle,
					text: 'Checked In',
					class: 'bg-green-50 text-green-700 border-green-200',
					iconClass: 'text-green-600'
				};
			case 'no_show':
				return {
					icon: AlertCircle,
					text: 'No Show',
					class: 'bg-red-50 text-red-700 border-red-200',
					iconClass: 'text-red-600'
				};
			default:
				return {
					icon: Clock,
					text: 'Not Arrived',
					class: 'bg-blue-50 text-blue-700 border-blue-200',
					iconClass: 'text-blue-600'
				};
		}
	}
	
	let statusInfo = $derived(getStatusInfo(data.booking.attendanceStatus || 'not_arrived'));
</script>

<svelte:head>
	<title>Your Tour Ticket - {data.booking.expand?.tour?.name}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-lg mx-auto">
		<!-- Mobile-first ticket design -->
		<div class="bg-white shadow-xl">
			<!-- Header -->
			<div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white text-center">
				<div class="flex justify-center mb-4">
					<div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
						<Ticket class="w-8 h-8" />
					</div>
				</div>
				<h1 class="text-2xl font-bold mb-2">Your Tour Ticket</h1>
				<p class="text-blue-100">Show this QR code to your guide</p>
			</div>
			
			<!-- Ticket Status -->
			<div class="px-6 py-4 border-b border-gray-200">
				<div class="flex items-center justify-center gap-2">
					<span class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-full border {statusInfo.class}">
						<statusInfo.icon class="w-4 h-4 {statusInfo.iconClass}" />
						{statusInfo.text}
					</span>
				</div>
			</div>
			
			<!-- QR Code -->
			<div class="px-6 py-8 text-center border-b border-gray-200">
				<div class="w-64 h-64 mx-auto bg-white border-2 border-gray-200 rounded-xl p-4 mb-4">
					<div bind:this={qrCodeElement} class="w-full h-full"></div>
				</div>
				<p class="text-sm text-gray-600 mb-2">Ticket Code</p>
				<p class="text-xl font-mono font-bold text-gray-900">{getDisplayReference(data.ticketCode)}</p>
			</div>
			
			<!-- Tour Details -->
			<div class="px-6 py-6 space-y-4">
				<div>
					<h2 class="text-xl font-bold text-gray-900 mb-1">{data.booking.expand?.tour?.name}</h2>
					{#if data.booking.expand?.tour?.description}
						<p class="text-sm text-gray-600">{data.booking.expand?.tour?.description}</p>
					{/if}
				</div>
				
				<div class="grid gap-4">
					<div class="flex items-center gap-3">
						<Calendar class="w-5 h-5 text-gray-400" />
						<div>
							<p class="font-medium text-gray-900">
								{data.booking.expand?.timeSlot?.startTime ? formatDate(data.booking.expand.timeSlot.startTime) : 'Date TBD'}
							</p>
							<p class="text-sm text-gray-600">
								{data.booking.expand?.timeSlot?.startTime && data.booking.expand?.timeSlot?.endTime ? 
									`${formatTime(data.booking.expand.timeSlot.startTime)} - ${formatTime(data.booking.expand.timeSlot.endTime)}` : 
									'Time TBD'}
							</p>
						</div>
					</div>
					
					{#if data.booking.expand?.tour?.location}
						<div class="flex items-start gap-3">
							<MapPin class="w-5 h-5 text-gray-400 mt-1" />
							<div>
								<p class="font-medium text-gray-900">Meeting Point</p>
								<p class="text-sm text-gray-600">{data.booking.expand?.tour?.location}</p>
							</div>
						</div>
					{/if}
					
					<div class="flex items-center gap-3">
						<Users class="w-5 h-5 text-gray-400" />
						<div>
							<p class="font-medium text-gray-900">
								{data.booking.participants} {data.booking.participants === 1 ? 'participant' : 'participants'}
							</p>
							<p class="text-sm text-gray-600">€{data.booking.totalAmount} total</p>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Customer Details -->
			<div class="px-6 py-6 bg-gray-50 border-t border-gray-200">
				<h3 class="font-semibold text-gray-900 mb-4">Booking Details</h3>
				<div class="space-y-3 text-sm">
					<div class="flex items-center gap-3">
						<User class="w-4 h-4 text-gray-400" />
						<span class="text-gray-900">{data.booking.customerName}</span>
					</div>
					<div class="flex items-center gap-3">
						<Mail class="w-4 h-4 text-gray-400" />
						<span class="text-gray-900">{data.booking.customerEmail}</span>
					</div>
					{#if data.booking.customerPhone}
						<div class="flex items-center gap-3">
							<Phone class="w-4 h-4 text-gray-400" />
							<span class="text-gray-900">{data.booking.customerPhone}</span>
						</div>
					{/if}
					<div class="flex items-center gap-3">
						<Ticket class="w-4 h-4 text-gray-400" />
						<span class="text-gray-900">Ref: {data.booking.bookingReference}</span>
					</div>
				</div>
				
				{#if data.booking.specialRequests}
					<div class="mt-4 p-3 bg-blue-50 rounded-lg">
						<p class="text-sm font-medium text-blue-900 mb-1">Special Requests:</p>
						<p class="text-sm text-blue-800">{data.booking.specialRequests}</p>
					</div>
				{/if}
			</div>
			
			<!-- Important Notes -->
			<div class="px-6 py-6 border-t border-gray-200">
				<h3 class="font-semibold text-gray-900 mb-3">Important Information</h3>
				<ul class="text-sm text-gray-600 space-y-2">
					<li class="flex gap-2">
						<span class="text-blue-600">•</span>
						<span>Please arrive 10 minutes before the tour starts</span>
					</li>
					<li class="flex gap-2">
						<span class="text-blue-600">•</span>
						<span>Show this QR code to your guide for check-in</span>
					</li>
					<li class="flex gap-2">
						<span class="text-blue-600">•</span>
						<span>Bring comfortable walking shoes and weather-appropriate clothing</span>
					</li>
					<li class="flex gap-2">
						<span class="text-blue-600">•</span>
						<span>Contact your guide if you need to make any changes</span>
					</li>
				</ul>
			</div>
		</div>
	</div>
</div> 
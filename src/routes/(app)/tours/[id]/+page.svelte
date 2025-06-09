<script lang="ts">
	import type { PageData } from './$types.js';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { formatCurrency, formatDate, formatTime, formatDateTime } from '$lib/utils/date-helpers.js';
	import { onMount } from 'svelte';

	export let data: PageData;

	$: tour = data.tour;
	$: tourStats = data.tourStats;
	$: upcomingSlots = data.upcomingSlots;
	$: recentBookings = data.recentBookings;

	// Calculate conversion rate
	$: conversionRate = tourStats.qrScans > 0 ? (tourStats.qrConversions / tourStats.qrScans * 100) : 0;

	// Status badge colors
	function getStatusColor(status: string) {
		switch (status) {
			case 'confirmed': return 'bg-green-100 text-green-800';
			case 'pending': return 'bg-yellow-100 text-yellow-800';
			case 'cancelled': return 'bg-red-100 text-red-800';
			case 'completed': return 'bg-blue-100 text-blue-800';
			case 'no_show': return 'bg-gray-100 text-gray-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getSlotStatusColor(status: string) {
		switch (status) {
			case 'active': return 'bg-green-100 text-green-800';
			case 'full': return 'bg-red-100 text-red-800';
			case 'cancelled': return 'bg-gray-100 text-gray-800';
			default: return 'bg-blue-100 text-blue-800';
		}
	}

	// Copy QR code to clipboard
	async function copyQRCode() {
		if (tour.qrCode) {
			try {
				const bookingUrl = `${window.location.origin}/book/${tour.qrCode}`;
				await navigator.clipboard.writeText(bookingUrl);
				// You could add a toast notification here
			} catch (err) {
				console.error('Failed to copy QR code:', err);
			}
		}
	}

	// Quick actions
	function editTour() {
		goto(`/tours/${tour.id}/edit`);
	}

	function manageTimes() {
		goto(`/tours/${tour.id}/schedule`);
	}

	function viewQR() {
		goto(`/tours/${tour.id}/qr`);
	}

	function viewBookings() {
		goto(`/bookings?tour=${tour.id}`);
	}
</script>

<svelte:head>
	<title>{tour.name} - Tour Details | Zaur</title>
	<meta name="description" content="Manage your {tour.name} tour - view statistics, bookings, and schedule." />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<!-- Header Section -->
	<div class="mb-8">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<div class="flex items-center gap-3 mb-2">
					<button 
						onclick={() => goto('/tours')}
						class="text-gray-500 hover:text-gray-700 transition-colors"
						aria-label="Back to tours"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<h1 class="text-3xl font-bold text-gray-900">{tour.name}</h1>
				</div>
				<p class="text-gray-600 max-w-2xl">{tour.description}</p>
			</div>
			
			<!-- Quick Actions -->
			<div class="flex flex-wrap gap-3">
				<button 
					onclick={editTour}
					class="button-secondary"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
					Edit Tour
				</button>
				<button 
					onclick={manageTimes}
					class="button-secondary"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Manage Times
				</button>
				<button 
					onclick={viewQR}
					class="button-primary"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
					</svg>
					QR Code
				</button>
			</div>
		</div>
	</div>

	<!-- Statistics Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		<!-- Total Revenue -->
		<div class="bg-white rounded-lg border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Total Revenue</p>
					<p class="text-2xl font-bold text-gray-900">{formatCurrency(tourStats.totalRevenue)}</p>
				</div>
				<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
					</svg>
				</div>
			</div>
		</div>

		<!-- Total Bookings -->
		<div class="bg-white rounded-lg border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Total Bookings</p>
					<p class="text-2xl font-bold text-gray-900">{tourStats.totalBookings}</p>
					<p class="text-xs text-gray-500 mt-1">{tourStats.confirmedBookings} confirmed</p>
				</div>
				<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
			</div>
		</div>

		<!-- Total Participants -->
		<div class="bg-white rounded-lg border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">Total Participants</p>
					<p class="text-2xl font-bold text-gray-900">{tourStats.totalParticipants}</p>
					<p class="text-xs text-gray-500 mt-1">Across all bookings</p>
				</div>
				<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
				</div>
			</div>
		</div>

		<!-- QR Performance -->
		<div class="bg-white rounded-lg border border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">QR Performance</p>
					<p class="text-2xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
					<p class="text-xs text-gray-500 mt-1">{tourStats.qrScans} scans, {tourStats.qrConversions} bookings</p>
				</div>
				<div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
					<svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
					</svg>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Tour Information -->
		<div class="lg:col-span-1">
			<div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Tour Information</h2>
				
				<div class="space-y-4">
					<div>
						<label class="text-sm font-medium text-gray-600">Price</label>
						<p class="text-lg font-semibold text-gray-900">{formatCurrency(tour.price)}</p>
					</div>
					
					<div>
						<label class="text-sm font-medium text-gray-600">Duration</label>
						<p class="text-gray-900">{tour.duration} minutes</p>
					</div>
					
					<div>
						<label class="text-sm font-medium text-gray-600">Max Group Size</label>
						<p class="text-gray-900">{tour.capacity} people</p>
					</div>
					
					<div>
						<label class="text-sm font-medium text-gray-600">Location</label>
						<p class="text-gray-900">{tour.location}</p>
					</div>
					
					{#if tour.qrCode}
					<div>
						<label class="text-sm font-medium text-gray-600">QR Code</label>
						<div class="flex items-center gap-2 mt-1">
							<code class="text-sm bg-gray-100 px-2 py-1 rounded">{tour.qrCode}</code>
							<button 
								onclick={copyQRCode}
								class="text-blue-600 hover:text-blue-700 transition-colors"
								title="Copy booking URL"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
								</svg>
							</button>
						</div>
					</div>
					{/if}
					
					<div>
						<label class="text-sm font-medium text-gray-600">Created</label>
						<p class="text-gray-900">{formatDate(tour.created)}</p>
					</div>
				</div>
			</div>

			<!-- Quick Stats -->
			<div class="bg-white rounded-lg border border-gray-200 p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
				
				<div class="space-y-3">
					<div class="flex justify-between">
						<span class="text-gray-600">Today's Bookings</span>
						<span class="font-medium">{tourStats.todayBookings}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">This Week</span>
						<span class="font-medium">{tourStats.weekBookings}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">This Month</span>
						<span class="font-medium">{tourStats.monthBookings}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Pending Bookings</span>
						<span class="font-medium text-yellow-600">{tourStats.pendingBookings}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Total Time Slots</span>
						<span class="font-medium">{tourStats.totalSlots}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Upcoming Slots</span>
						<span class="font-medium text-green-600">{tourStats.upcomingSlots}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Upcoming Time Slots & Recent Bookings -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Upcoming Time Slots -->
			<div class="bg-white rounded-lg border border-gray-200 p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-gray-900">Upcoming Time Slots</h2>
					<button 
						onclick={manageTimes}
						class="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
					>
						Manage All →
					</button>
				</div>
				
				{#if upcomingSlots.length > 0}
					<div class="space-y-3">
						{#each upcomingSlots as slot}
							<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
								<div>
									<p class="font-medium text-gray-900">
										{formatDate(slot.startTime)} at {formatTime(slot.startTime)}
									</p>
									<p class="text-sm text-gray-600">
										{slot.bookedSpots}/{slot.availableSpots} spots booked
									</p>
								</div>
								<div class="flex items-center gap-3">
									<span class="px-2 py-1 text-xs font-medium rounded-full {getSlotStatusColor(slot.status)}">
										{slot.status}
									</span>
									<div class="w-16 bg-gray-200 rounded-full h-2">
										<div 
											class="bg-blue-600 h-2 rounded-full transition-all duration-300"
											style="width: {(slot.bookedSpots / slot.availableSpots) * 100}%"
										></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8">
						<svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<p class="text-gray-600 mb-4">No upcoming time slots scheduled</p>
						<button 
							onclick={manageTimes}
							class="button-primary"
						>
							Add Time Slots
						</button>
					</div>
				{/if}
			</div>

			<!-- Recent Bookings -->
			<div class="bg-white rounded-lg border border-gray-200 p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-gray-900">Recent Bookings</h2>
					<button 
						onclick={viewBookings}
						class="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
					>
						View All →
					</button>
				</div>
				
				{#if recentBookings.length > 0}
					<div class="space-y-3">
						{#each recentBookings as booking}
							<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
								<div class="flex-1">
									<div class="flex items-center gap-3 mb-1">
										<p class="font-medium text-gray-900">{booking.customerName}</p>
										<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(booking.status)}">
											{booking.status}
										</span>
									</div>
									<p class="text-sm text-gray-600">{booking.customerEmail}</p>
									<p class="text-xs text-gray-500">
										{booking.participants} participant{booking.participants !== 1 ? 's' : ''} • 
										{formatCurrency(booking.totalAmount)} • 
										{formatDateTime(booking.createdAt)}
									</p>
								</div>
								<div class="text-right">
									<p class="text-sm font-medium text-gray-900">#{booking.bookingReference}</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8">
						<svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
						<p class="text-gray-600 mb-4">No bookings yet</p>
						<button 
							onclick={viewQR}
							class="button-primary"
						>
							Share QR Code
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div> 
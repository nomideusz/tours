<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types.js';
	import { pb } from '$lib/pocketbase.js';
	import { formatEuro } from '$lib/utils/currency.js';
	
	// Icons
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import User from 'lucide-svelte/icons/user';
	import Mail from 'lucide-svelte/icons/mail';
	import Phone from 'lucide-svelte/icons/phone';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Edit from 'lucide-svelte/icons/edit';
	import MessageCircle from 'lucide-svelte/icons/message-circle';
	import CreditCard from 'lucide-svelte/icons/credit-card';

	let { data }: { data: PageData } = $props();
	
	let booking = $state(data.booking);
	let payment = $state(data.payment);
	let isUpdating = $state(false);
	let error = $state<string | null>(null);
	let showStatusModal = $state(false);
	let newStatus = $state(booking.status);

	function formatDateTime(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatTime(dateString: string): string {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'confirmed':
				return 'bg-green-50 text-green-700 border-green-200';
			case 'pending':
				return 'bg-yellow-50 text-yellow-700 border-yellow-200';
			case 'cancelled':
				return 'bg-red-50 text-red-700 border-red-200';
			case 'completed':
				return 'bg-blue-50 text-blue-700 border-blue-200';
			default:
				return 'bg-gray-50 text-gray-700 border-gray-200';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'confirmed':
				return CheckCircle;
			case 'pending':
				return AlertCircle;
			case 'cancelled':
				return XCircle;
			case 'completed':
				return CheckCircle;
			default:
				return AlertCircle;
		}
	}

	async function updateBookingStatus() {
		if (newStatus === booking.status) {
			showStatusModal = false;
			return;
		}

		try {
			isUpdating = true;
			error = null;

			// Update the booking status
			const updatedBooking = await pb?.collection('bookings').update(booking.id, {
				status: newStatus
			});

			booking = { ...booking, status: newStatus };
			showStatusModal = false;
		} catch (err) {
			console.error('Error updating booking status:', err);
			error = 'Failed to update booking status';
		} finally {
			isUpdating = false;
		}
	}

	function openEmailClient() {
		const subject = encodeURIComponent(`Regarding your ${booking.expand?.tour?.name} booking`);
		const body = encodeURIComponent(`Hi ${booking.customerName},\n\nI wanted to reach out regarding your upcoming tour booking.\n\nTour: ${booking.expand?.tour?.name}\nDate: ${booking.expand?.timeSlot?.startTime ? formatDate(booking.expand.timeSlot.startTime) : 'TBD'}\nTime: ${booking.expand?.timeSlot?.startTime ? formatTime(booking.expand.timeSlot.startTime) : 'TBD'}\nParticipants: ${booking.participants}\n\nBest regards`);
		
		window.open(`mailto:${booking.customerEmail}?subject=${subject}&body=${body}`);
	}

	function getTourDateTime(): string {
		if (booking.expand?.timeSlot?.startTime) {
			return formatDateTime(booking.expand.timeSlot.startTime);
		}
		return 'Time slot not set';
	}

	function calculateTotal(): number {
		const basePrice = booking.expand?.tour?.price || 0;
		return basePrice * booking.participants;
	}

	function isPastBooking(): boolean {
		if (!booking.expand?.timeSlot?.startTime) {
			return false;
		}
		
		const bookingDateTime = new Date(booking.expand.timeSlot.startTime);
		return bookingDateTime < new Date();
	}

	function canChangeStatus(): boolean {
		// Can't change status for completed bookings in the past
		if (isPastBooking() && booking.status === 'completed') {
			return false;
		}
		return true;
	}
</script>

<svelte:head>
	<title>Booking Details - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center gap-4 mb-4">
			<button 
				onclick={() => goto('/bookings')}
				class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
				aria-label="Back to bookings"
			>
				<ArrowLeft class="h-5 w-5 text-gray-600" />
			</button>
			<div>
				<nav class="flex items-center gap-2 text-sm text-gray-600 mb-2">
					<a href="/dashboard" class="hover:text-primary-600">Dashboard</a>
					<ChevronRight class="h-3 w-3" />
					<a href="/bookings" class="hover:text-primary-600">Bookings</a>
					<ChevronRight class="h-3 w-3" />
					<span>#{booking.id.slice(-8)}</span>
				</nav>
				<h1 class="text-3xl font-bold text-gray-900">Booking Details</h1>
				<p class="mt-1 text-gray-600">Manage customer booking and communication</p>
			</div>
		</div>

		{#if error}
			<div class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
					<div>
						<p class="font-medium text-red-800">Error</p>
						<p class="text-sm text-red-700 mt-1">{error}</p>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Main Content -->
	<div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
		<!-- Booking Details -->
		<div class="xl:col-span-2 space-y-6">
			<!-- Booking Overview -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
					<div class="flex items-center justify-between">
						<h2 class="text-lg font-semibold text-gray-900">Booking Overview</h2>
						<div class="flex items-center gap-2">
							{#if booking.status === 'confirmed'}
								<CheckCircle class="h-5 w-5 text-gray-600" />
							{:else if booking.status === 'cancelled'}
								<XCircle class="h-5 w-5 text-gray-600" />
							{:else if booking.status === 'completed'}
								<CheckCircle class="h-5 w-5 text-gray-600" />
							{:else}
								<AlertCircle class="h-5 w-5 text-gray-600" />
							{/if}
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border {getStatusColor(booking.status)}">
								{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
							</span>
						</div>
					</div>
				</div>
				
				<div class="p-6 space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="space-y-3">
							<h3 class="text-sm font-medium text-gray-700 mb-3">Tour Information</h3>
							<div class="flex items-center gap-3">
								<MapPin class="h-5 w-5 text-gray-400" />
								<div>
									<p class="font-medium text-gray-900">{booking.expand?.tour?.name || 'Unknown Tour'}</p>
									<p class="text-sm text-gray-600">{booking.expand?.tour?.location || 'Location not set'}</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<Calendar class="h-5 w-5 text-gray-400" />
								<div>
									<p class="font-medium text-gray-900">{getTourDateTime()}</p>
									<p class="text-sm text-gray-600">
										{#if booking.expand?.timeSlot?.endTime}
											Duration: {formatTime(booking.expand.timeSlot.startTime)} - {formatTime(booking.expand.timeSlot.endTime)}
										{/if}
									</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<Users class="h-5 w-5 text-gray-400" />
								<div>
									<p class="font-medium text-gray-900">{booking.participants} {booking.participants === 1 ? 'participant' : 'participants'}</p>
									<p class="text-sm text-gray-600">Group size</p>
								</div>
							</div>
						</div>

						<div class="space-y-3">
							<h3 class="text-sm font-medium text-gray-700 mb-3">Booking Details</h3>
							<div class="flex items-center gap-3">
								<Calendar class="h-5 w-5 text-gray-400" />
								<div>
									<p class="font-medium text-gray-900">Booking #{booking.id.slice(-8)}</p>
									<p class="text-sm text-gray-600">Created {formatDateTime(booking.created)}</p>
								</div>
							</div>
							{#if booking.expand?.tour?.price}
								<div class="flex items-center gap-3">
									<DollarSign class="h-5 w-5 text-gray-400" />
									<div>
										<p class="font-medium text-gray-900">{formatEuro(calculateTotal())}</p>
										<p class="text-sm text-gray-600">{formatEuro(booking.expand.tour.price)} × {booking.participants} participants</p>
									</div>
								</div>
							{/if}
							{#if payment}
								<div class="flex items-center gap-3">
									<CreditCard class="h-5 w-5 text-gray-400" />
									<div>
										<p class="font-medium text-gray-900">Payment {payment.status}</p>
										<p class="text-sm text-gray-600">{payment.paymentMethod || 'Unknown method'}</p>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Special Requests -->
					{#if booking.specialRequests}
						<div class="border-t border-gray-200 pt-4">
							<h3 class="text-sm font-medium text-gray-700 mb-2">Special Requests</h3>
							<p class="text-gray-900 bg-gray-50 rounded-lg p-3">{booking.specialRequests}</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Customer Information -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
					<h2 class="text-lg font-semibold text-gray-900">Customer Information</h2>
				</div>
				
				<div class="p-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="space-y-3">
							<div class="flex items-center gap-3">
								<User class="h-5 w-5 text-gray-400" />
								<div>
									<p class="font-medium text-gray-900">{booking.customerName}</p>
									<p class="text-sm text-gray-600">Customer name</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<Mail class="h-5 w-5 text-gray-400" />
								<div>
									<p class="font-medium text-gray-900">{booking.customerEmail}</p>
									<p class="text-sm text-gray-600">Email address</p>
								</div>
							</div>
						</div>

						<div class="space-y-3">
							{#if booking.customerPhone}
								<div class="flex items-center gap-3">
									<Phone class="h-5 w-5 text-gray-400" />
									<div>
										<p class="font-medium text-gray-900">{booking.customerPhone}</p>
										<p class="text-sm text-gray-600">Phone number</p>
									</div>
								</div>
							{/if}
							<div class="flex items-center gap-3">
								<Calendar class="h-5 w-5 text-gray-400" />
								<div>
									<p class="font-medium text-gray-900">Customer since</p>
									<p class="text-sm text-gray-600">{formatDate(booking.created)}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Actions Sidebar -->
		<div class="space-y-6">
			<!-- Status Management -->
			<div class="bg-white rounded-xl border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Booking Status</h3>
				<div class="space-y-4">
					<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<span class="text-sm font-medium text-gray-700">Current Status</span>
						<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border {getStatusColor(booking.status)}">
							{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
						</span>
					</div>
					
					{#if canChangeStatus()}
						<button
							onclick={() => showStatusModal = true}
							class="w-full button-secondary button--gap button--small justify-center"
						>
							<Edit class="h-4 w-4" />
							Change Status
						</button>
					{:else}
						<p class="text-xs text-gray-500 text-center p-2">
							Status cannot be changed for completed past bookings
						</p>
					{/if}
				</div>
			</div>

			<!-- Communication -->
			<div class="bg-white rounded-xl border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Customer Communication</h3>
				<div class="space-y-3">
					<button
						onclick={openEmailClient}
						class="w-full button-primary button--gap button--small justify-center"
					>
						<Mail class="h-4 w-4" />
						Send Email
					</button>
					
					{#if booking.customerPhone}
						<a
							href="tel:{booking.customerPhone}"
							class="w-full button-secondary button--gap button--small justify-center inline-flex"
						>
							<Phone class="h-4 w-4" />
							Call Customer
						</a>
					{/if}

					<a
						href="sms:{booking.customerPhone || booking.customerEmail}"
						class="w-full button-secondary button--gap button--small justify-center inline-flex"
					>
						<MessageCircle class="h-4 w-4" />
						Send SMS
					</a>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="bg-white rounded-xl border border-gray-200 p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
				<div class="space-y-3">
					<button
						onclick={() => goto(`/tours/${booking.tour}`)}
						class="w-full button-secondary button--gap button--small justify-center"
					>
						<MapPin class="h-4 w-4" />
						View Tour Details
					</button>
					
					<button
						onclick={() => goto(`/tours/${booking.tour}/bookings`)}
						class="w-full button-secondary button--gap button--small justify-center"
					>
						<Users class="h-4 w-4" />
						All Tour Bookings
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Status Change Modal -->
{#if showStatusModal}
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
			<div class="p-6 border-b border-gray-200">
				<h2 class="text-xl font-semibold text-gray-900">Change Booking Status</h2>
				<p class="text-sm text-gray-600 mt-1">Update the status of this booking</p>
			</div>
			
			<div class="p-6 space-y-4">
				<div class="space-y-3">
					{#each ['pending', 'confirmed', 'completed', 'cancelled'] as status}
						<label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {newStatus === status ? 'border-primary-300 bg-primary-50' : 'border-gray-200'}">
							<input
								type="radio"
								bind:group={newStatus}
								value={status}
								class="form-radio"
							/>
							<div class="flex items-center gap-2">
								{#if status === 'confirmed'}
									<CheckCircle class="h-4 w-4 text-gray-600" />
								{:else if status === 'cancelled'}
									<XCircle class="h-4 w-4 text-gray-600" />
								{:else if status === 'completed'}
									<CheckCircle class="h-4 w-4 text-gray-600" />
								{:else}
									<AlertCircle class="h-4 w-4 text-gray-600" />
								{/if}
								<span class="font-medium text-gray-900 capitalize">{status}</span>
							</div>
						</label>
					{/each}
				</div>
			</div>
			
			<div class="p-6 border-t border-gray-200 flex justify-end gap-3">
				<button
					type="button"
					onclick={() => {
						showStatusModal = false;
						newStatus = booking.status;
					}}
					class="button-secondary"
				>
					Cancel
				</button>
				<button
					onclick={updateBookingStatus}
					disabled={isUpdating || newStatus === booking.status}
					class="button-primary button--gap {isUpdating ? 'opacity-50' : ''}"
				>
					{#if isUpdating}
						<div class="form-spinner"></div>
						Updating...
					{:else}
						Update Status
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style lang="postcss">
	@reference "tailwindcss";
</style> 
<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';
	import { formatEuro } from '$lib/utils/currency.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	
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
	let newStatus = $state('');

	function formatDateTime(dateString: string): string {
		try {
			if (!dateString) return 'Date not available';
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return 'Invalid date';
			
			return date.toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			console.warn('Error formatting date:', dateString, error);
			return 'Date not available';
		}
	}

	function formatDate(dateString: string): string {
		try {
			if (!dateString) return 'Date not available';
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return 'Invalid date';
			
			return date.toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch (error) {
			console.warn('Error formatting date:', dateString, error);
			return 'Date not available';
		}
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

	function openEmailClient() {
		const subject = encodeURIComponent(`Regarding your ${booking.expand?.tour?.name} booking`);
		const timeText = booking.expand?.timeSlot?.startTime && booking.expand?.timeSlot?.endTime 
			? formatSlotTimeRange(booking.expand.timeSlot.startTime, booking.expand.timeSlot.endTime)
			: 'TBD';
		const body = encodeURIComponent(`Hi ${booking.customerName},\n\nI wanted to reach out regarding your upcoming tour booking.\n\nTour: ${booking.expand?.tour?.name}\nDate: ${booking.expand?.timeSlot?.startTime ? formatDate(booking.expand.timeSlot.startTime) : 'TBD'}\nTime: ${timeText}\nParticipants: ${booking.participants}\n\nBest regards`);
		
		window.open(`mailto:${booking.customerEmail}?subject=${subject}&body=${body}`);
	}

	function getTourDateTime(): string {
		try {
			if (booking.expand?.timeSlot?.startTime) {
				return formatDateTime(booking.expand.timeSlot.startTime);
			}
			return 'Time slot not set';
		} catch (error) {
			console.warn('Error getting tour date time:', error);
			return 'Time slot not set';
		}
	}

	function calculateTotal(): number {
		try {
			const price = booking.expand?.tour?.price;
			if (!price) return 0;
			
			const basePrice = typeof price === 'string' ? parseFloat(price) : price;
			if (isNaN(basePrice)) return 0;
			
			const participants = booking.participants || 1;
			return basePrice * participants;
		} catch (error) {
			console.warn('Error calculating total:', error);
			return 0;
		}
	}

	function isPastBooking(): boolean {
		try {
			if (!booking.expand?.timeSlot?.startTime) {
				return false;
			}
			
			const bookingDateTime = new Date(booking.expand.timeSlot.startTime);
			if (isNaN(bookingDateTime.getTime())) {
				return false;
			}
			
			return bookingDateTime < new Date();
		} catch (error) {
			console.warn('Error checking if past booking:', error);
			return false;
		}
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
				class="p-2 rounded-lg transition-colors"
				style="hover:background: var(--bg-secondary);"
				aria-label="Back to bookings"
			>
				<ArrowLeft class="h-5 w-5" style="color: var(--text-secondary);" />
			</button>
			<div>
				<nav class="flex items-center gap-2 text-sm mb-2" style="color: var(--text-secondary);">
					<a href="/dashboard" class="hover:text-blue-600">Dashboard</a>
					<ChevronRight class="h-3 w-3" />
					<a href="/bookings" class="hover:text-blue-600">Bookings</a>
					<ChevronRight class="h-3 w-3" />
					<span>#{booking.id.slice(-8)}</span>
				</nav>
				<h1 class="text-3xl font-bold" style="color: var(--text-primary);">Booking Details</h1>
				<p class="mt-1" style="color: var(--text-secondary);">Manage customer booking and communication</p>
			</div>
		</div>

		{#if error}
			<div class="mb-6 rounded-xl p-4" style="background: var(--color-error-light); border: 1px solid #fecaca;">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-error);" />
					<div>
						<p class="font-medium" style="color: #991b1b;">Error</p>
						<p class="text-sm mt-1" style="color: #b91c1c;">{error}</p>
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
			<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="px-6 py-4" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
					<div class="flex items-center justify-between">
						<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Booking Overview</h2>
						<div class="flex items-center gap-2">
							{#if booking.status === 'confirmed'}
								<CheckCircle class="h-5 w-5" style="color: var(--text-secondary);" />
							{:else if booking.status === 'cancelled'}
								<XCircle class="h-5 w-5" style="color: var(--text-secondary);" />
							{:else if booking.status === 'completed'}
								<CheckCircle class="h-5 w-5" style="color: var(--text-secondary);" />
							{:else}
								<AlertCircle class="h-5 w-5" style="color: var(--text-secondary);" />
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
							<h3 class="text-sm font-medium mb-3" style="color: var(--text-secondary);">Tour Information</h3>
							<div class="flex items-center gap-3">
								<MapPin class="h-5 w-5" style="color: var(--text-tertiary);" />
								<div>
									<p class="font-medium" style="color: var(--text-primary);">{booking.expand?.tour?.name || 'Unknown Tour'}</p>
									<p class="text-sm" style="color: var(--text-secondary);">{booking.expand?.tour?.location || 'Location not set'}</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<Calendar class="h-5 w-5" style="color: var(--text-tertiary);" />
								<div>
									<p class="font-medium" style="color: var(--text-primary);">{getTourDateTime()}</p>
									<p class="text-sm" style="color: var(--text-secondary);">
										{#if booking.expand?.timeSlot?.startTime && booking.expand?.timeSlot?.endTime}
											Duration: {formatSlotTimeRange(booking.expand.timeSlot.startTime, booking.expand.timeSlot.endTime)}
										{/if}
									</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<Users class="h-5 w-5" style="color: var(--text-tertiary);" />
								<div>
									<p class="font-medium" style="color: var(--text-primary);">{booking.participants} {booking.participants === 1 ? 'participant' : 'participants'}</p>
									<p class="text-sm" style="color: var(--text-secondary);">Group size</p>
								</div>
							</div>
						</div>

						<div class="space-y-3">
							<h3 class="text-sm font-medium mb-3" style="color: var(--text-secondary);">Booking Details</h3>
							<div class="flex items-center gap-3">
								<Calendar class="h-5 w-5" style="color: var(--text-tertiary);" />
								<div>
									<p class="font-medium" style="color: var(--text-primary);">Booking #{booking.id.slice(-8)}</p>
									<p class="text-sm" style="color: var(--text-secondary);">Created {formatDateTime(booking.created)}</p>
								</div>
							</div>
							{#if booking.expand?.tour?.price}
								<div class="flex items-center gap-3">
									<DollarSign class="h-5 w-5" style="color: var(--text-tertiary);" />
									<div>
										<p class="font-medium" style="color: var(--text-primary);">{formatEuro(calculateTotal())}</p>
										<p class="text-sm" style="color: var(--text-secondary);">{formatEuro(booking.expand.tour.price)} × {booking.participants} participants</p>
									</div>
								</div>
							{/if}
							{#if payment}
								<div class="flex items-center gap-3">
									<CreditCard class="h-5 w-5" style="color: var(--text-tertiary);" />
									<div>
										<p class="font-medium" style="color: var(--text-primary);">Payment {payment.status}</p>
										<p class="text-sm" style="color: var(--text-secondary);">Payment via Stripe</p>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Special Requests -->
					{#if booking.specialRequests}
						<div class="pt-4" style="border-top: 1px solid var(--border-primary);">
							<h3 class="text-sm font-medium mb-2" style="color: var(--text-secondary);">Special Requests</h3>
							<p class="rounded-lg p-3" style="color: var(--text-primary); background: var(--bg-secondary);">{booking.specialRequests}</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Customer Information -->
			<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="px-6 py-4" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
					<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Customer Information</h2>
				</div>
				
				<div class="p-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="space-y-3">
							<div class="flex items-center gap-3">
								<User class="h-5 w-5" style="color: var(--text-tertiary);" />
								<div>
									<p class="font-medium" style="color: var(--text-primary);">{booking.customerName}</p>
									<p class="text-sm" style="color: var(--text-secondary);">Customer name</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<Mail class="h-5 w-5" style="color: var(--text-tertiary);" />
								<div>
									<p class="font-medium" style="color: var(--text-primary);">{booking.customerEmail}</p>
									<p class="text-sm" style="color: var(--text-secondary);">Email address</p>
								</div>
							</div>
						</div>

						<div class="space-y-3">
							{#if booking.customerPhone}
								<div class="flex items-center gap-3">
									<Phone class="h-5 w-5" style="color: var(--text-tertiary);" />
									<div>
										<p class="font-medium" style="color: var(--text-primary);">{booking.customerPhone}</p>
										<p class="text-sm" style="color: var(--text-secondary);">Phone number</p>
									</div>
								</div>
							{/if}
							<div class="flex items-center gap-3">
								<Calendar class="h-5 w-5" style="color: var(--text-tertiary);" />
								<div>
									<p class="font-medium" style="color: var(--text-primary);">Customer since</p>
									<p class="text-sm" style="color: var(--text-secondary);">{formatDate(booking.created)}</p>
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
			<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Booking Status</h3>
				<div class="space-y-4">
					<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-secondary);">
						<span class="text-sm font-medium" style="color: var(--text-secondary);">Current Status</span>
						<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border {getStatusColor(booking.status)}">
							{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
						</span>
					</div>
					
					{#if canChangeStatus()}
						<button
							onclick={() => {
								newStatus = booking.status;
								showStatusModal = true;
							}}
							class="w-full button-secondary button--gap button--small justify-center"
						>
							<Edit class="h-4 w-4" />
							Change Status
						</button>
					{:else}
						<p class="text-xs text-center p-2" style="color: var(--text-tertiary);">
							Status cannot be changed for completed past bookings
						</p>
					{/if}
				</div>
			</div>

			<!-- Communication -->
			<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Customer Communication</h3>
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
			<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Quick Actions</h3>
				<div class="space-y-3">
					<button
						onclick={() => goto(`/tours/${booking.expand?.tour?.id}`)}
						class="w-full button-secondary button--gap button--small justify-center"
					>
						<MapPin class="h-4 w-4" />
						View Tour Details
					</button>
					
					<button
						onclick={() => goto(`/tours/${booking.expand?.tour?.id}/bookings`)}
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
		<div class="rounded-xl shadow-2xl max-w-md w-full" style="background: var(--bg-primary);">
			<form
				method="POST"
				action="?/updateStatus"
				use:enhance={() => {
					isUpdating = true;
					error = null;
					
					return async ({ result, update }) => {
						isUpdating = false;
						
						if (result.type === 'success') {
							booking = { ...booking, status: newStatus as typeof booking.status };
							showStatusModal = false;
						} else if (result.type === 'failure' && result.data) {
							error = (result.data as any).error || 'Failed to update booking status';
						}
						
						await update();
					};
				}}
			>
				<div class="p-6" style="border-bottom: 1px solid var(--border-primary);">
					<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Change Booking Status</h2>
					<p class="text-sm mt-1" style="color: var(--text-secondary);">Update the status of this booking</p>
				</div>
				
				<div class="p-6 space-y-4">
					<div class="space-y-3">
						{#each ['pending', 'confirmed', 'completed', 'cancelled'] as status}
							<label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors {newStatus === status ? 'border-blue-300' : ''}" style="border-color: {newStatus === status ? 'var(--color-primary-300)' : 'var(--border-primary)'}; background: {newStatus === status ? 'var(--color-primary-50)' : 'var(--bg-primary)'}; hover:background: var(--bg-secondary);">
								<input
									type="radio"
									bind:group={newStatus}
									name="status"
									value={status}
									class="form-radio"
								/>
								<div class="flex items-center gap-2">
									{#if status === 'confirmed'}
										<CheckCircle class="h-4 w-4" style="color: var(--text-secondary);" />
									{:else if status === 'cancelled'}
										<XCircle class="h-4 w-4" style="color: var(--text-secondary);" />
									{:else if status === 'completed'}
										<CheckCircle class="h-4 w-4" style="color: var(--text-secondary);" />
									{:else}
										<AlertCircle class="h-4 w-4" style="color: var(--text-secondary);" />
									{/if}
									<span class="font-medium capitalize" style="color: var(--text-primary);">{status}</span>
								</div>
							</label>
						{/each}
					</div>
				</div>
				
				<div class="p-6 flex justify-end gap-3" style="border-top: 1px solid var(--border-primary);">
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
						type="submit"
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
			</form>
		</div>
	</div>
{/if}

<style lang="postcss">
	@reference "tailwindcss";
</style> 
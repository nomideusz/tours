<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	
	// Get data from load function
	let { data } = $props();
	import { formatEuro } from '$lib/utils/currency.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { formatDate, formatDateTime } from '$lib/utils/date-helpers.js';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	
	// Icons
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
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
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Loader2 from 'lucide-svelte/icons/loader-2';

	// Get booking ID from load function
	let bookingId = $derived(data.bookingId);
	
	// TanStack Query for booking data
	let bookingQuery = $derived(createQuery({
		queryKey: ['booking', bookingId],
		queryFn: async () => {
			const response = await fetch(`/api/bookings/${bookingId}`);
			if (!response.ok) throw new Error('Failed to fetch booking');
			return response.json();
		},
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000,    // 5 minutes
	}));
	
	// Derive data from query
	let booking = $derived($bookingQuery.data?.booking || null);
	let payment = $derived($bookingQuery.data?.payment || null);
	let isLoading = $derived($bookingQuery.isLoading);
	let isError = $derived($bookingQuery.isError);
	let isUpdating = $state(false);
	let error = $state<string | null>(null);
	let showStatusModal = $state(false);
	let newStatus = $state('');

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

	function openEmailClient() {
		if (!booking) return;
		const subject = encodeURIComponent(`Regarding your ${booking.expand?.tour?.name} booking`);
		const timeText = booking.expand?.timeSlot?.startTime && booking.expand?.timeSlot?.endTime 
			? formatSlotTimeRange(booking.expand.timeSlot.startTime, booking.expand.timeSlot.endTime)
			: 'TBD';
		const body = encodeURIComponent(`Hi ${booking.customerName},\n\nI wanted to reach out regarding your upcoming tour booking.\n\nTour: ${booking.expand?.tour?.name}\nDate: ${booking.expand?.timeSlot?.startTime ? formatDate(booking.expand.timeSlot.startTime) : 'TBD'}\nTime: ${timeText}\nParticipants: ${booking.participants}\n\nBest regards`);
		
		window.open(`mailto:${booking.customerEmail}?subject=${subject}&body=${body}`);
	}

	function getTourDateTime(): string {
		if (!booking) return 'Loading...';
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
		if (!booking) return 0;
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
		if (!booking) return false;
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
		if (!booking) return false;
		// Can't change status for completed bookings in the past
		if (isPastBooking() && booking.status === 'completed') {
			return false;
		}
		return true;
	}
</script>

<svelte:head>
	<title>{booking?.customerName || 'Loading'} - Booking Details | Zaur</title>
	<meta name="description" content="Manage booking details for {booking?.customerName || 'customer'}" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	{#if isLoading}
		<div class="p-8 text-center">
			<Loader2 class="w-8 h-8 mx-auto mb-2 animate-spin" style="color: var(--text-tertiary);" />
			<p class="text-sm" style="color: var(--text-secondary);">Loading booking details...</p>
		</div>
	{:else if isError || !booking}
		<div class="mb-6 rounded-xl p-4" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium" style="color: var(--color-danger-900);">Failed to load booking</p>
					<p class="text-sm mt-1" style="color: var(--color-danger-700);">Please try refreshing the page.</p>
				</div>
				<button onclick={() => goto('/bookings')} class="button-secondary button--small">
					Back to Bookings
				</button>
			</div>
		</div>
	{:else}
		<!-- Header -->
		<div class="mb-6 sm:mb-8">
			<!-- Mobile Header -->
			<MobilePageHeader
				title={booking.customerName}
				statusButton={{
					label: booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
					onclick: () => {
						if (canChangeStatus()) {
							newStatus = booking.status;
							showStatusModal = true;
						}
					},
					disabled: !canChangeStatus(),
					color: getStatusColor(booking.status),
					dotColor: getStatusColor(booking.status),
					tooltip: canChangeStatus() ? 'Click to change status' : 'Cannot change status for completed past bookings'
				}}
				secondaryInfo={`${booking.expand?.tour?.name || 'Unknown Tour'} • ${formatEuro(calculateTotal())}`}
				quickActions={[
					{
						label: 'Email',
						icon: Mail,
						onclick: openEmailClient,
						variant: 'primary'
					},
					{
						label: 'Tour',
						icon: MapPin,
						onclick: () => goto(`/tours/${booking.expand?.tour?.id}`),
						variant: 'secondary'
					}
				]}
				infoItems={[
					{
						icon: Calendar,
						label: 'Date',
						value: booking.expand?.timeSlot?.startTime ? formatDate(booking.expand.timeSlot.startTime) : 'TBD'
					},
					{
						icon: Clock,
						label: 'Time',
						value: booking.expand?.timeSlot?.startTime && booking.expand?.timeSlot?.endTime 
							? formatSlotTimeRange(booking.expand.timeSlot.startTime, booking.expand.timeSlot.endTime)
							: 'TBD'
					},
					{
						icon: Users,
						label: 'Guests',
						value: `${booking.participants}`
					},
					{
						icon: CreditCard,
						label: 'Payment',
						value: payment?.status || 'Pending'
					}
				]}
			/>
			
			<!-- Desktop Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title="Booking Details"
					subtitle={`${booking.customerName} • ${booking.expand?.tour?.name || 'Unknown Tour'}`}
					breadcrumbs={[
						{ label: 'Bookings', href: '/bookings' },
						{ label: `#${booking.id.slice(-8)}` }
					]}
				>
					<button onclick={() => goto('/bookings')} class="button-secondary button--gap">
						<ArrowLeft class="h-4 w-4" />
						Back to Bookings
					</button>
				</PageHeader>
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

		<!-- Main Content -->
		<div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
			<!-- Booking Details -->
			<div class="xl:col-span-2 space-y-6">
				<!-- Booking Overview -->
				<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="px-6 py-4" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
						<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Booking Overview</h2>
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
											<p class="text-sm" style="color: var(--text-secondary);">Via Stripe</p>
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
				<!-- Quick Actions - Mobile shown via MobilePageHeader -->
				<div class="hidden sm:block rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Quick Actions</h3>
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

						<button
							onclick={() => goto(`/tours/${booking.expand?.tour?.id}`)}
							class="w-full button-secondary button--gap button--small justify-center"
						>
							<MapPin class="h-4 w-4" />
							View Tour
						</button>
					</div>
				</div>

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
			</div>
		</div>
	{/if}
</div>

<!-- Status Change Modal -->
{#if showStatusModal && booking}
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
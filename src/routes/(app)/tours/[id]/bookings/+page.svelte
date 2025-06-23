<script lang="ts">

	import { goto } from '$app/navigation';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate, getStatusColor, getPaymentStatusColor } from '$lib/utils/date-helpers.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { formatParticipantDisplayCompact } from '$lib/utils/participant-display.js';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	
	// Icons
	import Calendar from 'lucide-svelte/icons/calendar';
	import Euro from 'lucide-svelte/icons/euro';
	import Users from 'lucide-svelte/icons/users';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Eye from 'lucide-svelte/icons/eye';
	import Clock from 'lucide-svelte/icons/clock';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import CircleDollarSign from 'lucide-svelte/icons/circle-dollar-sign';
	import ReceiptText from 'lucide-svelte/icons/receipt-text';
	
	// Get data from load function
	let { data } = $props();
	let tourId = $derived(data.tourId);
	
	// TanStack Query for tour-specific bookings
	const tourBookingsQuery = createQuery({
		queryKey: queryKeys.tourBookings(tourId),
		queryFn: () => queryFunctions.fetchTourBookings(tourId),
		staleTime: 30 * 1000, // 30 seconds - consistent with other tour queries
		gcTime: 2 * 60 * 1000, // 2 minutes
		refetchOnWindowFocus: true, // Refetch when user returns to tab
	});
	
	// State
	let statusFilter = $state<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
	let searchQuery = $state('');
	
	// Derive data from query
	let tourData = $derived($tourBookingsQuery.data || null);
	let tour = $derived(tourData?.tour || null);
	let tourBookings = $derived(tourData?.bookings || []);
	
	// Apply filters
	let filteredBookings = $derived(() => {
		let result = tourBookings;
		
		// Status filter
		if (statusFilter !== 'all') {
			result = result.filter((b: any) => b.status === statusFilter);
		}
		
		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter((b: any) => 
				b.customerName?.toLowerCase().includes(query) ||
				b.customerEmail?.toLowerCase().includes(query) ||
				b.bookingCode?.toLowerCase().includes(query)
			);
		}
		
		return result;
	});
	
	let bookings = $derived(filteredBookings());
	let isLoading = $derived($tourBookingsQuery.isLoading);
	let isError = $derived($tourBookingsQuery.isError);
	
	// Calculate stats from all tour bookings (not filtered)
	let stats = $derived(() => {
		const confirmed = tourBookings.filter((b: any) => b.status === 'confirmed');
		const completed = tourBookings.filter((b: any) => b.status === 'completed');
		const pending = tourBookings.filter((b: any) => b.status === 'pending');
		const cancelled = tourBookings.filter((b: any) => b.status === 'cancelled');
		const revenueBookings = tourBookings.filter((b: any) => b.status === 'confirmed' || b.status === 'completed');
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		const todayBookings = tourBookings.filter((b: any) => {
			const bookingDate = new Date(b.created);
			bookingDate.setHours(0, 0, 0, 0);
			return bookingDate.getTime() === today.getTime();
		});
		
		const upcomingBookings = tourBookings.filter((b: any) => {
			const bookingDate = new Date(b.effectiveDate);
			return bookingDate > new Date() && (b.status === 'confirmed' || b.status === 'pending');
		});
		
		return {
			total: tourBookings.length,
			confirmed: confirmed.length,
			completed: completed.length,
			pending: pending.length,
			cancelled: cancelled.length,
			todayCount: todayBookings.length,
			upcoming: upcomingBookings.length,
			revenue: revenueBookings.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0),
			participants: revenueBookings.reduce((sum: number, b: any) => sum + (Number(b.participants) || 0), 0)
		};
	});
	
	// Refresh function
	function handleRefresh() {
		$tourBookingsQuery.refetch();
	}

	// Get more user-friendly payment status label
	function getPaymentStatusLabel(status: string): string {
		switch (status) {
			case 'paid':
				return 'Paid';
			case 'pending':
				return 'Unpaid';
			case 'failed':
				return 'Failed';
			case 'refunded':
				return 'Refunded';
			default:
				return 'Unpaid';
		}
	}
	
	// Get booking status icon
	function getBookingStatusIcon(status: string): any {
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
	
	// Get payment status icon
	function getPaymentStatusIcon(status: string): any {
		switch (status) {
			case 'paid':
				return CircleDollarSign;
			case 'pending':
				return AlertTriangle;
			case 'failed':
				return XCircle;
			case 'refunded':
				return ReceiptText;
			default:
				return AlertTriangle;
		}
	}
</script>

<svelte:head>
	<title>{tour?.name} Bookings - Zaur</title>
	<meta name="description" content="Manage bookings for {tour?.name} tour" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Header -->
		<MobilePageHeader
			title="{tour?.name} Bookings"
			secondaryInfo="{stats().total} bookings"
			quickActions={[
				{
					label: 'Scanner',
					icon: QrCode,
					onclick: () => goto('/checkin-scanner'),
					variant: 'primary'
				},
				{
					label: 'Refresh',
					icon: RefreshCw,
					onclick: handleRefresh,
					variant: 'secondary',
					disabled: isLoading
				}
			]}
			infoItems={[
				{
					icon: AlertCircle,
					label: 'Pending',
					value: `${stats().pending}`
				},
				{
					icon: CheckCircle,
					label: 'Confirmed',
					value: `${stats().confirmed}`
				},
				{
					icon: Euro,
					label: 'Revenue',
					value: $globalCurrencyFormatter(stats().revenue)
				},
				{
					icon: Users,
					label: 'Guests',
					value: `${stats().participants}`
				}
			]}
		/>
		
		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title="{tour?.name} Bookings"
				subtitle="View and manage all bookings for this tour"
				breadcrumbs={[
					{ label: 'Tours', href: '/tours' },
					{ label: tour?.name || 'Tour', href: `/tours/${tourId}` },
					{ label: 'Bookings' }
				]}
			>
				<button onclick={() => goto(`/tours/${tourId}`)} class="button-secondary button--gap mr-3">
					<ArrowLeft class="h-4 w-4" />
					Back to Tour
				</button>
				<button
					onclick={handleRefresh}
					disabled={isLoading}
					class="button-secondary button--gap"
				>
					{#if isLoading}
						<Loader2 class="h-4 w-4 animate-spin" />
					{:else}
						<RefreshCw class="h-4 w-4" />
					{/if}
					Refresh
				</button>
			</PageHeader>
		</div>
	</div>
	
	<!-- Error State -->
	{#if isError}
		<div class="mb-6 rounded-xl p-4" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium" style="color: var(--color-danger-900);">Failed to load bookings</p>
					<p class="text-sm mt-1" style="color: var(--color-danger-700);">Please try refreshing the page.</p>
				</div>
				<button onclick={handleRefresh} class="button-secondary button--small">
					Try Again
				</button>
			</div>
		</div>
	{/if}
	
	<!-- Quick Stats - Enhanced Layout -->
	<div class="grid grid-cols-2 sm:hidden gap-3 mb-4">
		<div class="rounded-lg p-3" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<div class="flex items-center gap-2 mb-1">
				<Calendar class="h-4 w-4" style="color: var(--text-tertiary);" />
				<span class="text-xs" style="color: var(--text-tertiary);">Total</span>
			</div>
			<p class="text-lg font-bold" style="color: var(--text-primary);">{stats().total}</p>
		</div>
		<div class="rounded-lg p-3" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<div class="flex items-center gap-2 mb-1">
				<Euro class="h-4 w-4" style="color: var(--text-tertiary);" />
				<span class="text-xs" style="color: var(--text-tertiary);">Revenue</span>
			</div>
							<p class="text-lg font-bold" style="color: var(--text-primary);">{$globalCurrencyFormatter(stats().revenue)}</p>
		</div>
	</div>
	

	
	<!-- Filters and Search -->
	<div class="mb-4 space-y-3">
		<!-- Status Filter Tabs -->
		<div class="flex gap-1 p-1 rounded-lg overflow-x-auto" style="background: var(--bg-secondary);">
			<button
				onclick={() => statusFilter = 'all'}
				class="px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap {statusFilter === 'all' ? 'bg-white shadow-sm' : ''}"
				style="color: {statusFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)'};"
			>
				All ({stats().total})
			</button>
			<button
				onclick={() => statusFilter = 'confirmed'}
				class="px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap {statusFilter === 'confirmed' ? 'bg-white shadow-sm' : ''}"
				style="color: {statusFilter === 'confirmed' ? 'var(--text-primary)' : 'var(--text-secondary)'};"
			>
				Confirmed ({stats().confirmed})
			</button>
			<button
				onclick={() => statusFilter = 'pending'}
				class="px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap {statusFilter === 'pending' ? 'bg-white shadow-sm' : ''}"
				style="color: {statusFilter === 'pending' ? 'var(--text-primary)' : 'var(--text-secondary)'};"
			>
				Pending ({stats().pending})
			</button>
			<button
				onclick={() => statusFilter = 'cancelled'}
				class="px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap {statusFilter === 'cancelled' ? 'bg-white shadow-sm' : ''}"
				style="color: {statusFilter === 'cancelled' ? 'var(--text-primary)' : 'var(--text-secondary)'};"
			>
				Cancelled ({stats().cancelled})
			</button>
		</div>
		
		<!-- Search -->
		<div class="relative">
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search by name, email, or booking code..."
				class="form-input pl-10"
			/>
			<div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
				<svg class="h-4 w-4" style="color: var(--text-tertiary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
			</div>
		</div>
	</div>
	
	<!-- Bookings List -->
	<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold" style="color: var(--text-primary);">
					{searchQuery || statusFilter !== 'all' ? `Filtered Bookings (${bookings.length})` : 'Tour Bookings'}
				</h3>
				{#if bookings.length > 0}
					<span class="text-sm" style="color: var(--text-secondary);">
						{bookings.length} {bookings.length === 1 ? 'result' : 'results'}
					</span>
				{/if}
			</div>
		</div>
		
		<div class="divide-y" style="border-color: var(--border-primary);">
			{#if bookings.length > 0}
				{#each bookings as booking}
					{@const BookingIcon = getBookingStatusIcon(booking.status)}
					{@const PaymentIcon = getPaymentStatusIcon(booking.paymentStatus || 'pending')}
					<div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" role="button" tabindex="0" onclick={() => goto(`/bookings/${booking.id}`)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goto(`/bookings/${booking.id}`); } }}>
						<!-- Mobile Layout -->
						<div class="sm:hidden">
							<div class="flex items-start justify-between mb-2">
								<div class="flex-1 min-w-0">
									<h4 class="text-sm font-medium truncate" style="color: var(--text-primary);">
										{booking.customerName}
									</h4>
									<p class="text-xs mt-0.5" style="color: var(--text-secondary);">
										{formatDate(booking.effectiveDate)}
									</p>
								</div>
								<div class="ml-2 flex flex-col gap-1 items-end">
									<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border {getStatusColor(booking.status)}">
										<BookingIcon class="h-3 w-3" />
										<span class="capitalize">{booking.status}</span>
									</span>
									<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border {getPaymentStatusColor(booking.paymentStatus || 'pending')}">
										<PaymentIcon class="h-3 w-3" />
										{getPaymentStatusLabel(booking.paymentStatus || 'pending')}
									</span>
								</div>
							</div>
							
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3 text-xs" style="color: var(--text-tertiary);">
									<span class="flex items-center gap-1">
										<Clock class="h-3 w-3" />
										{#if booking.timeSlot?.startTime && booking.timeSlot?.endTime}
											{formatSlotTimeRange(booking.timeSlot.startTime, booking.timeSlot.endTime)}
										{:else}
											Time TBD
										{/if}
									</span>
									<span class="flex items-center gap-1">
										<Users class="h-3 w-3" />
										{formatParticipantDisplayCompact(booking)}
									</span>
								</div>
								<span class="text-sm font-medium" style="color: var(--text-primary);">
									{$globalCurrencyFormatter(booking.totalAmount)}
								</span>
							</div>
						</div>
						
						<!-- Desktop Layout -->
						<div class="hidden sm:flex items-center justify-between">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-3">
									<div>
										<h4 class="text-sm font-medium" style="color: var(--text-primary);">
											{booking.customerName}
										</h4>
										<div class="flex items-center gap-2 mt-1">
											<span class="text-xs" style="color: var(--text-secondary);">
												{formatDate(booking.effectiveDate)}
											</span>
											<span class="text-xs" style="color: var(--text-tertiary);">•</span>
											<span class="text-xs flex items-center gap-1" style="color: var(--text-secondary);">
												<Clock class="h-3 w-3" />
												{#if booking.timeSlot?.startTime && booking.timeSlot?.endTime}
													{formatSlotTimeRange(booking.timeSlot.startTime, booking.timeSlot.endTime)}
												{:else}
													Time TBD
												{/if}
											</span>
										</div>
									</div>
								</div>
							</div>
							
							<div class="flex items-center gap-6">
								<div class="text-right">
									<p class="text-sm font-medium" style="color: var(--text-primary);">
										{$globalCurrencyFormatter(booking.totalAmount)}
									</p>
									<p class="text-xs" style="color: var(--text-secondary);">
										{booking.participants} {booking.participants === 1 ? 'guest' : 'guests'}
									</p>
								</div>
								
								<div class="flex items-center gap-3">
									<div class="flex items-center gap-2">
										<span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border {getStatusColor(booking.status)}">
											<BookingIcon class="h-3.5 w-3.5" />
											<span class="capitalize font-medium">{booking.status}</span>
										</span>
										<span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border {getPaymentStatusColor(booking.paymentStatus || 'pending')}">
											<PaymentIcon class="h-3.5 w-3.5" />
											<span class="font-medium">{getPaymentStatusLabel(booking.paymentStatus || 'pending')}</span>
										</span>
									</div>
									
									<button
										onclick={(e) => {
											e.stopPropagation();
											goto(`/bookings/${booking.id}`);
										}}
										class="button-secondary button--small button--icon"
										title="View booking details"
									>
										<Eye class="h-4 w-4" />
									</button>
								</div>
							</div>
						</div>
					</div>
				{/each}
			{:else if !isLoading}
				<div class="p-8 text-center">
					<Calendar class="w-8 h-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No bookings yet</h3>
					<p class="text-sm mb-4" style="color: var(--text-secondary);">
						This tour doesn't have any bookings yet.
					</p>
					<button
						onclick={() => goto(`/tours/${tourId}`)}
						class="button-primary button--small"
					>
						View Tour Details
					</button>
				</div>
			{/if}
		</div>
		
		{#if isLoading}
			<div class="p-8 text-center">
				<Loader2 class="w-8 h-8 mx-auto mb-2 animate-spin" style="color: var(--text-tertiary);" />
				<p class="text-sm" style="color: var(--text-secondary);">Loading bookings...</p>
			</div>
		{/if}
	</div>
</div> 
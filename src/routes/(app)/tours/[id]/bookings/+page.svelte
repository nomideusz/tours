<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate, getStatusColor, getPaymentStatusColor } from '$lib/utils/date-helpers.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { formatParticipantDisplayCompact, formatParticipantDisplay } from '$lib/utils/participant-display.js';
	
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
	import Search from 'lucide-svelte/icons/search';
	import Filter from 'lucide-svelte/icons/filter';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import X from 'lucide-svelte/icons/x';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	
	// Get data from load function
	let { data } = $props();
	let tourId = $derived(data.tourId);
	
	// TanStack Query for tour bookings - remove auto-refresh to prevent timer accumulation
	const bookingsQuery = createQuery({
		get queryKey() { return queryKeys.tourBookings(tourId); },
		get queryFn() { return () => queryFunctions.fetchTourBookings(tourId); },
		staleTime: 30 * 1000,     // 30 seconds
		gcTime: 5 * 60 * 1000,    // 5 minutes
		// Removed refetchInterval to prevent timer accumulation
		// refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
		// refetchIntervalInBackground: true,
		get enabled() { return browser && !!tourId; },
	});
	
	// State
	let searchQuery = $state('');
	let selectedStatus = $state<string>('all');
	let selectedPaymentStatus = $state<string>('all');
	let showFilters = $state(false);
	
	// Derive data from query
	let tourData = $derived($bookingsQuery.data || null);
	let tour = $derived(tourData?.tour || null);
	let tourBookings = $derived(tourData?.bookings || []);
	
	// Apply filters
	let filteredBookings = $derived.by(() => {
		let result = tourBookings;
		
		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter((b: any) => 
				b.customerName?.toLowerCase().includes(query) ||
				b.customerEmail?.toLowerCase().includes(query) ||
				b.bookingCode?.toLowerCase().includes(query) ||
				b.id?.toLowerCase().includes(query)
			);
		}
		
		// Status filter
		if (selectedStatus !== 'all') {
			result = result.filter((b: any) => b.status === selectedStatus);
		}
		
		// Payment status filter
		if (selectedPaymentStatus !== 'all') {
			result = result.filter((b: any) => (b.paymentStatus || 'pending') === selectedPaymentStatus);
		}
		
		return result;
	});
	
	let bookings = $derived(filteredBookings);
	let isLoading = $derived($bookingsQuery.isLoading);
	let isError = $derived($bookingsQuery.isError);
	
	// Calculate stats from all tour bookings (not filtered)
	let stats = $derived.by(() => {
		const confirmed = tourBookings.filter((b: any) => b.status === 'confirmed');
		const completed = tourBookings.filter((b: any) => b.status === 'completed');
		const pending = tourBookings.filter((b: any) => b.status === 'pending');
		const cancelled = tourBookings.filter((b: any) => b.status === 'cancelled');
		
		const paid = tourBookings.filter((b: any) => b.paymentStatus === 'paid');
		const unpaid = tourBookings.filter((b: any) => (b.paymentStatus || 'pending') === 'pending');
		
		const revenueBookings = tourBookings.filter((b: any) => 
			(b.status === 'confirmed' || b.status === 'completed') && b.paymentStatus === 'paid'
		);
		
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
			paid: paid.length,
			unpaid: unpaid.length,
			todayCount: todayBookings.length,
			upcoming: upcomingBookings.length,
			revenue: revenueBookings.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0),
			participants: revenueBookings.reduce((sum: number, b: any) => sum + (Number(b.participants) || 0), 0)
		};
	});
	
	// Clear filters
	function clearFilters() {
		searchQuery = '';
		selectedStatus = 'all';
		selectedPaymentStatus = 'all';
		showFilters = false;
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
	
	// Check if filters are active
	let hasActiveFilters = $derived(searchQuery || selectedStatus !== 'all' || selectedPaymentStatus !== 'all');
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
			secondaryInfo="{stats.total} bookings"
			quickActions={[
				{
					label: 'Back',
					icon: ArrowLeft,
					onclick: () => goto(`/tours/${tourId}`),
					variant: 'secondary'
				},
				{
					label: 'Scanner',
					icon: QrCode,
					onclick: () => goto('/checkin-scanner'),
					variant: 'primary'
				}
			]}
			infoItems={[
				{
					icon: Calendar,
					label: 'Today',
					value: `${stats.todayCount} new`
				},
				{
					icon: CheckCircle,
					label: 'Confirmed',
					value: `${stats.confirmed}`
				},
				{
					icon: Euro,
					label: 'Revenue',
					value: $globalCurrencyFormatter(stats.revenue)
				},
				{
					icon: TrendingUp,
					label: 'Upcoming',
					value: `${stats.upcoming}`
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
					onclick={() => goto('/checkin-scanner')}
					class="button-primary button--gap"
				>
					<QrCode class="h-4 w-4" />
					QR Scanner
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
					<p class="text-sm mt-1" style="color: var(--color-danger-700);">Please check your connection and try again.</p>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Search and Filters -->
	<div class="mb-6 space-y-4">
		<div class="flex flex-col sm:flex-row gap-3">
			<!-- Search -->
			<div class="flex-1 relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by customer name, email, or booking code..."
					class="form-input pl-10 w-full"
				/>
			</div>
			
			<!-- Filter Button -->
			<button
				onclick={() => showFilters = !showFilters}
				class="button-secondary button--gap {hasActiveFilters ? 'ring-2' : ''}"
				style="{hasActiveFilters ? 'ring-color: var(--color-primary-500);' : ''}"
			>
				<Filter class="h-4 w-4" />
				Filters
				{#if hasActiveFilters}
					<span class="ml-1 px-1.5 py-0.5 text-xs rounded-full" style="background: var(--color-primary-500); color: white;">
						{(selectedStatus !== 'all' ? 1 : 0) + (selectedPaymentStatus !== 'all' ? 1 : 0)}
					</span>
				{/if}
				<ChevronDown class="h-4 w-4 ml-1 transition-transform {showFilters ? 'rotate-180' : ''}" />
			</button>
		</div>
		
		<!-- Filter Panel -->
		{#if showFilters}
			<div class="rounded-xl p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
				<div class="flex flex-col sm:flex-row gap-4">
					<!-- Status Filter -->
					<div class="flex-1">
						<label class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
							Booking Status
						</label>
						<select bind:value={selectedStatus} class="form-select w-full">
							<option value="all">All Statuses</option>
							<option value="pending">Pending ({stats.pending})</option>
							<option value="confirmed">Confirmed ({stats.confirmed})</option>
							<option value="completed">Completed ({stats.completed})</option>
							<option value="cancelled">Cancelled ({stats.cancelled})</option>
						</select>
					</div>
					
					<!-- Payment Status Filter -->
					<div class="flex-1">
						<label class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
							Payment Status
						</label>
						<select bind:value={selectedPaymentStatus} class="form-select w-full">
							<option value="all">All Payments</option>
							<option value="paid">Paid ({stats.paid})</option>
							<option value="pending">Unpaid ({stats.unpaid})</option>
							<option value="refunded">Refunded</option>
						</select>
					</div>
					
					<!-- Clear Filters -->
					{#if hasActiveFilters}
						<div class="flex items-end">
							<button
								onclick={clearFilters}
								class="button-secondary button--small button--gap"
							>
								<X class="h-4 w-4" />
								Clear All
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
	
	<!-- Bookings List -->
	<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold" style="color: var(--text-primary);">
					{hasActiveFilters ? 'Filtered Results' : 'Tour Bookings'}
				</h3>
				<span class="text-sm" style="color: var(--text-secondary);">
					{isLoading ? 'Loading...' : `${filteredBookings.length} ${filteredBookings.length === 1 ? 'booking' : 'bookings'}`}
				</span>
			</div>
		</div>
		
		<div class="divide-y" style="border-color: var(--border-primary);">
			{#if bookings.length > 0}
				{#each bookings as booking}
					{@const BookingIcon = getBookingStatusIcon(booking.status)}
					{@const PaymentIcon = getPaymentStatusIcon(booking.paymentStatus || 'pending')}
					<div class="p-4 transition-all duration-150 cursor-pointer group" 
						role="button" 
						tabindex="0" 
						onclick={() => goto(`/bookings/${booking.id}`)} 
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goto(`/bookings/${booking.id}`); } }}
						onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
						onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
						
						<!-- Mobile Layout -->
						<div class="sm:hidden">
							<div class="flex items-start justify-between mb-3">
								<div class="flex-1 min-w-0">
									<h4 class="font-medium truncate" style="color: var(--text-primary);">
										{booking.customerName}
									</h4>
									<p class="text-xs mt-0.5" style="color: var(--text-secondary);">
										#{booking.id.slice(-8)}
									</p>
								</div>
								<span class="text-sm font-semibold" style="color: var(--text-primary);">
									{$globalCurrencyFormatter(booking.totalAmount)}
								</span>
							</div>
							
							<div class="flex items-center gap-2 mb-3">
								<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border {getStatusColor(booking.status)}">
									<BookingIcon class="h-3 w-3" />
									<span class="capitalize">{booking.status}</span>
								</span>
								<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border {getPaymentStatusColor(booking.paymentStatus || 'pending')}">
									<PaymentIcon class="h-3 w-3" />
									{getPaymentStatusLabel(booking.paymentStatus || 'pending')}
								</span>
							</div>
							
							<div class="flex items-center gap-3 text-xs" style="color: var(--text-tertiary);">
								<span class="flex items-center gap-1">
									<Calendar class="h-3 w-3" />
									<span>
										Tour: {#if booking.expand?.timeSlot?.startTime}
											{formatDate(booking.expand.timeSlot.startTime)}
										{:else}
											<span style="opacity: 0.7;">Date TBD</span>
										{/if}
									</span>
								</span>
								<span class="flex items-center gap-1">
									<Clock class="h-3 w-3" />
									{#if booking.expand?.timeSlot?.startTime && booking.expand?.timeSlot?.endTime}
										{formatSlotTimeRange(booking.expand.timeSlot.startTime, booking.expand.timeSlot.endTime)}
									{:else}
										<span style="opacity: 0.7;">Time TBD</span>
									{/if}
								</span>
								<span class="flex items-center gap-1">
									<Users class="h-3 w-3" />
									{formatParticipantDisplayCompact(booking)}
								</span>
							</div>
							
							<!-- Booking date - mobile only -->
							<div class="mt-2 text-xs" style="color: var(--text-tertiary); opacity: 0.8;">
								Booked: {formatDate(booking.created)}
							</div>
						</div>
						
						<!-- Desktop Layout -->
						<div class="hidden sm:flex items-center justify-between">
							<div class="flex-1 min-w-0 pr-4">
								<div class="flex items-center gap-4">
									<!-- Customer Info -->
									<div class="min-w-0 flex-1">
										<h4 class="font-medium" style="color: var(--text-primary);">
											{booking.customerName}
										</h4>
										<div class="flex items-center gap-3 mt-1 text-xs" style="color: var(--text-tertiary);">
											<span class="flex items-center gap-1">
												<Calendar class="h-3 w-3" />
												<span>
													Tour: {#if booking.expand?.timeSlot?.startTime}
														{formatDate(booking.expand.timeSlot.startTime)}
													{:else}
														<span style="opacity: 0.7;">Date TBD</span>
													{/if}
												</span>
											</span>
											<span class="flex items-center gap-1">
												<Clock class="h-3 w-3" />
												{#if booking.expand?.timeSlot?.startTime && booking.expand?.timeSlot?.endTime}
													{formatSlotTimeRange(booking.expand.timeSlot.startTime, booking.expand.timeSlot.endTime)}
												{:else}
													<span style="opacity: 0.7;">Time TBD</span>
												{/if}
											</span>
											<span class="flex items-center gap-1">
												<Users class="h-3 w-3" />
												{formatParticipantDisplay(booking)}
											</span>
										</div>
									</div>
								</div>
							</div>
							
							<div class="flex items-center gap-6">
								<!-- Amount -->
								<div class="text-right">
									<p class="font-semibold" style="color: var(--text-primary);">
										{$globalCurrencyFormatter(booking.totalAmount)}
									</p>
									<p class="text-xs mt-0.5" style="color: var(--text-secondary);">
										#{booking.id.slice(-8)} • Booked: {formatDate(booking.created)}
									</p>
								</div>
								
								<!-- Status Badges -->
								<div class="flex items-center gap-2">
									<span class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border {getStatusColor(booking.status)}">
										<BookingIcon class="h-3.5 w-3.5" />
										<span class="capitalize font-medium">{booking.status}</span>
									</span>
									<span class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border {getPaymentStatusColor(booking.paymentStatus || 'pending')}">
										<PaymentIcon class="h-3.5 w-3.5" />
										<span class="font-medium">{getPaymentStatusLabel(booking.paymentStatus || 'pending')}</span>
									</span>
								</div>
								
								<!-- View Button -->
								<button
									onclick={(e) => {
										e.stopPropagation();
										goto(`/bookings/${booking.id}`);
									}}
									class="opacity-0 group-hover:opacity-100 transition-opacity button-secondary button--small button--icon"
									title="View booking details"
								>
									<Eye class="h-4 w-4" />
								</button>
							</div>
						</div>
					</div>
				{/each}
			{:else if !isLoading}
				<div class="p-8 text-center">
					{#if hasActiveFilters}
						<Filter class="w-8 h-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
						<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No bookings found</h3>
						<p class="text-sm" style="color: var(--text-secondary);">
							Try adjusting your filters or search query
						</p>
						<button
							onclick={clearFilters}
							class="button-secondary button--small mt-4"
						>
							Clear Filters
						</button>
					{:else}
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
					{/if}
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
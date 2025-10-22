<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
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
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Eye from 'lucide-svelte/icons/eye';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Clock from 'lucide-svelte/icons/clock';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import CircleDollarSign from 'lucide-svelte/icons/circle-dollar-sign';
	import ReceiptText from 'lucide-svelte/icons/receipt-text';
	import Search from 'lucide-svelte/icons/search';
	import Filter from 'lucide-svelte/icons/filter';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import X from 'lucide-svelte/icons/x';
	import Calendar2 from 'lucide-svelte/icons/calendar-days';
	

	// State
	let searchQuery = $state('');
	let selectedStatus = $state<string>('all');
	let selectedPaymentStatus = $state<string>('all');
	let dateRange = $state<string>('all');
	let showFilters = $state(false);
	let pageSize = $state(25);
	
	// Get tour filter from URL params
	let tourFilter = $derived($page.url.searchParams.get('tour'));
	let isFilteredByTour = $derived(!!tourFilter);
	
	// TanStack Query for bookings data - use different endpoints based on filtering
	let bookingsQuery = $derived(tourFilter ? 
		createQuery({
			queryKey: queryKeys.tourBookings(tourFilter),
			queryFn: () => queryFunctions.fetchTourBookings(tourFilter),
			staleTime: 2 * 60 * 1000, // 2 minutes
			gcTime: 10 * 60 * 1000,   // 10 minutes
			refetchOnWindowFocus: false,
		}) :
		createQuery({
			queryKey: queryKeys.recentBookings(1000), // Get all for filtering
			queryFn: () => queryFunctions.fetchRecentBookings(1000),
			staleTime: 2 * 60 * 1000, // 2 minutes - reduce excessive refetching
			gcTime: 10 * 60 * 1000,   // 10 minutes
			refetchOnWindowFocus: false, // Disable window focus refetching
			// Removed refetchInterval to prevent timer accumulation
		})
	);
	
	// Derive data from query
	let allBookings = $derived(tourFilter ? ($bookingsQuery.data?.bookings || []) : ($bookingsQuery.data || []));
	
	// Add debugging
	$effect(() => {
		if (tourFilter) {
			console.log('Tour filter:', tourFilter);
			console.log('Bookings query data:', $bookingsQuery.data);
			console.log('All bookings:', allBookings);
		}
	});
	let isLoading = $derived($bookingsQuery.isLoading);
	let isError = $derived($bookingsQuery.isError);
	
	// Apply filters to bookings
	let filteredBookings = $derived.by(() => {
		let result = allBookings;
		
		// Note: Tour filter is already handled by the query selection above
		// When tourFilter is present, we use queryKeys.tourBookings(tourFilter) which returns pre-filtered results
		
		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter((b: any) => 
				b.customerName?.toLowerCase().includes(query) ||
				b.customerEmail?.toLowerCase().includes(query) ||
				b.bookingCode?.toLowerCase().includes(query) ||
				b.id?.toLowerCase().includes(query) ||
				b.tour?.toLowerCase().includes(query)
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
		
		// Date range filter
		if (dateRange !== 'all') {
			const now = new Date();
			const filterDate = new Date();
			
			switch (dateRange) {
				case 'today':
					filterDate.setHours(0, 0, 0, 0);
					result = result.filter((b: any) => {
						const bookingDate = new Date(b.created);
						bookingDate.setHours(0, 0, 0, 0);
						return bookingDate >= filterDate;
					});
					break;
				case 'week':
					filterDate.setDate(now.getDate() - 7);
					result = result.filter((b: any) => new Date(b.created) >= filterDate);
					break;
				case 'month':
					filterDate.setMonth(now.getMonth() - 1);
					result = result.filter((b: any) => new Date(b.created) >= filterDate);
					break;
			}
		}
		
		return result;
	});
	
	// Paginated bookings for display
	let displayBookings = $derived(filteredBookings.slice(0, pageSize));
	let hasMore = $derived(filteredBookings.length > pageSize);
	
	// Calculate stats from filtered bookings
	let stats = $derived.by(() => {
		const bookings = filteredBookings;
		const confirmed = bookings.filter((b: any) => b.status === 'confirmed');
		const pending = bookings.filter((b: any) => b.status === 'pending');
		const cancelled = bookings.filter((b: any) => b.status === 'cancelled');
		const completed = bookings.filter((b: any) => b.status === 'completed');
		
		const paid = bookings.filter((b: any) => b.paymentStatus === 'paid');
		const unpaid = bookings.filter((b: any) => (b.paymentStatus || 'pending') === 'pending');
		
		const revenueBookings = bookings.filter((b: any) => 
			(b.status === 'confirmed' || b.status === 'completed') && b.paymentStatus === 'paid'
		);
		
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		const todayBookings = bookings.filter((b: any) => {
			const bookingDate = new Date(b.created);
			bookingDate.setHours(0, 0, 0, 0);
			return bookingDate.getTime() === today.getTime();
		});
		
		// Get yesterday's bookings for trend
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayBookings = bookings.filter((b: any) => {
			const bookingDate = new Date(b.created);
			bookingDate.setHours(0, 0, 0, 0);
			return bookingDate.getTime() === yesterday.getTime();
		});
		
		return {
			total: bookings.length,
			confirmed: confirmed.length,
			pending: pending.length,
			cancelled: cancelled.length,
			completed: completed.length,
			paid: paid.length,
			unpaid: unpaid.length,
			todayCount: todayBookings.length,
			yesterdayCount: yesterdayBookings.length,
			revenue: revenueBookings.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0),
			participants: revenueBookings.reduce((sum: number, b: any) => sum + (Number(b.participants) || 0), 0)
		};
	});
	

	
	// Check if filters are active
	let hasActiveFilters = $derived(searchQuery || selectedStatus !== 'all' || selectedPaymentStatus !== 'all' || dateRange !== 'all');
	
	// Get tour name from bookings query data
	let tourName = $derived.by(() => {
		if (!tourFilter) return null;
		
		// When filtering by tour, get name from tour bookings API response
		if (tourFilter && $bookingsQuery.data?.tour?.name) {
			return $bookingsQuery.data.tour.name;
		}
		
		// Fallback to bookings data if available
		if (filteredBookings.length > 0) {
			return filteredBookings[0]?.tour || filteredBookings[0]?.tourName || 'Unknown Tour';
		}
		
		// Loading state
		if (isLoading) return 'Loading...';
		
		// Unknown state
		return 'Unknown Tour';
	});
	
	// Primary action for mobile (right side of title)
	let primaryAction = $derived({
		label: stats.todayCount > 0 ? `Today: ${stats.todayCount}` : 'Today',
		icon: Calendar,
		onclick: () => {
			if (dateRange === 'today') {
				// If already filtering by today, clear filter
				dateRange = 'all';
			} else {
				// Filter to today's bookings
				dateRange = 'today';
				selectedStatus = 'all';
				selectedPaymentStatus = 'all';
			}
		},
		variant: dateRange === 'today' ? ('primary' as const) : ('secondary' as const)
	});

	// Quick actions for mobile (simplified)
	let quickActions = $derived([
		{
			label: 'Filters',
			icon: Filter,
			onclick: () => showFilters = !showFilters,
			variant: 'secondary' as const
		}
	]);
	
	// Load more bookings
	function loadMore() {
		pageSize += 25;
	}
	
	// Clear filters
	function clearFilters() {
		searchQuery = '';
		selectedStatus = 'all';
		selectedPaymentStatus = 'all';
		dateRange = 'all';
		showFilters = false;
		
		// If we're filtering by tour, don't clear that filter
		// Just refresh the page to maintain tour context
		if (tourFilter) {
			goto(`/bookings?tour=${tourFilter}`);
		}
	}
	
	// Handle search change
	function handleSearchChange(value: string) {
		searchQuery = value;
	}
	
	// Get more user-friendly payment status label
	function getPaymentStatusLabel(status: string, booking?: any): string {
		// If payment is pending, show "Awaiting Payment"
		if (status === 'pending') {
			return 'Awaiting Payment';
		}
		
		// If paid, check transfer status to show more detail
		if (status === 'paid' && booking) {
			if (booking.transferId) {
				return 'Transferred';
			} else if (booking.transferScheduledFor) {
				return 'Paid';
			}
			return 'Paid';
		}
		
		// Other statuses
		switch (status) {
			case 'paid':
				return 'Paid';
			case 'refunded':
				return 'Refunded';
			case 'failed':
				return 'Failed';
			default:
				return 'Awaiting Payment';
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
	<title>{isFilteredByTour ? `${tourName} Bookings` : 'Bookings'} - Zaur</title>
	<meta name="description" content={isFilteredByTour ? `Manage bookings for ${tourName} tour` : 'Manage all your tour bookings and customer reservations'} />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Compact Mobile Header -->
		<MobilePageHeader
			title={isFilteredByTour ? `${tourName} Bookings` : 'Bookings'}
			secondaryInfo={isLoading ? 'Loading...' : `${stats.total} total • ${$globalCurrencyFormatter(stats.revenue)} revenue`}
			{primaryAction}
			{quickActions}
			showSearchBar={true}
			searchValue={searchQuery}
			onSearchChange={handleSearchChange}
			searchPlaceholder="Search bookings, customers, tours..."
			showBackButton={isFilteredByTour}
			onBackClick={() => goto(`/tours/${tourFilter}`)}
		/>
		
		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title={isFilteredByTour ? `${tourName} Bookings` : 'Bookings'}
				subtitle={isFilteredByTour ? `View and manage all bookings for this tour` : `Manage all your tour bookings and customer reservations`}
				breadcrumbs={isFilteredByTour ? [
					{ label: 'Tours', href: '/tours' },
					{ label: tourName || 'Tour', href: `/tours/${tourFilter}` },
					{ label: 'Bookings' }
				] : undefined}
			>
				{#if isFilteredByTour}
					<button onclick={() => goto(`/tours/${tourFilter}`)} class="button-secondary button--gap mr-3">
						<ArrowLeft class="h-4 w-4" />
						Back to Tour
					</button>
				{/if}
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
	
	<!-- Search and Filters - Desktop Only -->
	<div class="hidden sm:block mb-6 space-y-4">
		<div class="flex flex-col sm:flex-row gap-3">
			<!-- Search -->
			<div class="flex-1 relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by customer name, email, or tour..."
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
						{(selectedStatus !== 'all' ? 1 : 0) + (selectedPaymentStatus !== 'all' ? 1 : 0) + (dateRange !== 'all' ? 1 : 0)}
					</span>
				{/if}
				<ChevronDown class="h-4 w-4 ml-1 transition-transform {showFilters ? 'rotate-180' : ''}" />
			</button>
		</div>
	</div>
	
	<!-- Filter Panel -->
	{#if showFilters}
		<div class="rounded-xl p-4 mb-6" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
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
						<option value="pending">Awaiting Payment ({stats.unpaid})</option>
						<option value="refunded">Refunded</option>
					</select>
				</div>
				
				<!-- Date Range Filter -->
				<div class="flex-1">
					<label class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
						Date Range
					</label>
					<select bind:value={dateRange} class="form-select w-full">
						<option value="all">All Time</option>
						<option value="today">Today ({stats.todayCount})</option>
						<option value="week">This Week</option>
						<option value="month">This Month</option>
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
	
	<!-- Bookings List -->
	<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold" style="color: var(--text-primary);">
					{hasActiveFilters ? 'Filtered Results' : (isFilteredByTour ? 'Tour Bookings' : 'All Bookings')}
				</h3>
				<span class="text-sm" style="color: var(--text-secondary);">
					{isLoading ? 'Loading...' : `${filteredBookings.length} ${filteredBookings.length === 1 ? 'booking' : 'bookings'}`}
				</span>
			</div>
		</div>
		
		<div class="divide-y" style="border-color: var(--border-primary);">
			{#if displayBookings.length > 0}
				{#each displayBookings as booking}
					{@const BookingIcon = getBookingStatusIcon(booking.status)}
					{@const PaymentIcon = getPaymentStatusIcon(booking.paymentStatus || 'pending')}
					<div class="p-4 transition-all duration-200 cursor-pointer group active:scale-[0.98]" 
						role="button" 
						tabindex="0" 
						onclick={() => goto(`/bookings/${booking.id}`)} 
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goto(`/bookings/${booking.id}`); } }}
						onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
						onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
						
						<!-- Enhanced Mobile Layout -->
						<div class="sm:hidden">
							<div class="flex items-start justify-between mb-3">
								<div class="flex-1 min-w-0">
									<h4 class="font-semibold text-base truncate" style="color: var(--text-primary);">
										{booking.customerName}
									</h4>
									<p class="text-sm font-medium mt-0.5" style="color: var(--color-primary-600);">
										{booking.tour || booking.tourName || 'Unknown Tour'}
									</p>
								</div>
								<div class="text-right">
									<span class="text-lg font-bold" style="color: var(--text-primary);">
										{$globalCurrencyFormatter(booking.totalAmount)}
									</span>
									<p class="text-xs mt-0.5" style="color: var(--text-tertiary);">
										#{booking.id.slice(-6)}
									</p>
								</div>
							</div>
							
							<!-- Single combined status badge -->
							{#if booking}
								{@const paymentStatus = booking.paymentStatus || 'pending'}
								{@const combinedLabel = 
									booking.status === 'cancelled' ? 'Cancelled' :
									paymentStatus === 'pending' ? 'Awaiting Payment' :
									booking.transferId ? 'Confirmed • Transferred' :
									booking.status === 'confirmed' ? 'Confirmed • Paid' :
									booking.status === 'completed' ? 'Completed' :
									booking.status
								}
								{@const badgeColor = 
									booking.status === 'cancelled' ? getStatusColor('cancelled') :
									paymentStatus === 'pending' ? getPaymentStatusColor('pending') :
									getStatusColor(booking.status)
								}
								
								<div class="mb-3">
									<span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-full border {badgeColor}">
										<BookingIcon class="h-3 w-3" />
										<span class="font-medium">{combinedLabel}</span>
									</span>
								</div>
							{/if}
							
							<!-- Tour details with better formatting -->
							<div class="grid grid-cols-2 gap-3 text-sm">
								<div class="flex items-center gap-2" style="color: var(--text-secondary);">
									<Calendar class="h-4 w-4 flex-shrink-0" />
									<span class="truncate">
										{#if booking.expand?.timeSlot?.startTime}
											{formatDate(booking.expand.timeSlot.startTime)}
										{:else}
											<span style="opacity: 0.7;">Date TBD</span>
										{/if}
									</span>
								</div>
								<div class="flex items-center gap-2" style="color: var(--text-secondary);">
									<Clock class="h-4 w-4 flex-shrink-0" />
									<span class="truncate">
										{#if booking.expand?.timeSlot?.startTime && booking.expand?.timeSlot?.endTime}
											{formatSlotTimeRange(booking.expand.timeSlot.startTime, booking.expand.timeSlot.endTime)}
										{:else}
											<span style="opacity: 0.7;">Time TBD</span>
										{/if}
									</span>
								</div>
								<div class="flex items-center gap-2" style="color: var(--text-secondary);">
									<Users class="h-4 w-4 flex-shrink-0" />
									<span class="truncate">{formatParticipantDisplayCompact(booking)}</span>
								</div>
								<div class="flex items-center gap-2" style="color: var(--text-secondary);">
									<Calendar2 class="h-4 w-4 flex-shrink-0" />
									<span class="truncate">{formatDate(booking.created)}</span>
								</div>
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
										<p class="text-sm mt-0.5" style="color: var(--color-primary-600);">
												{booking.tour || booking.tourName || 'Unknown Tour'}
										</p>
										<div class="flex items-center gap-3 mt-1.5 text-xs" style="color: var(--text-tertiary);">
											<span class="flex items-center gap-1">
												<Calendar class="h-3 w-3" />
												<span>
												{#if booking.expand?.timeSlot?.startTime}
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
										#{booking.id.slice(-8)} • Booked {formatDate(booking.created)}
									</p>
								</div>
								
								<!-- Single Combined Status Badge -->
								{#if booking}
									{@const paymentStatus = booking.paymentStatus || 'pending'}
									{@const combinedLabel = 
										booking.status === 'cancelled' ? 'Cancelled' :
										paymentStatus === 'pending' ? 'Awaiting Payment' :
										booking.transferId ? 'Confirmed • Transferred' :
										booking.status === 'confirmed' ? 'Confirmed • Paid' :
										booking.status === 'completed' ? 'Completed' :
										booking.status
									}
									{@const badgeColor = 
										booking.status === 'cancelled' ? getStatusColor('cancelled') :
										paymentStatus === 'pending' ? getPaymentStatusColor('pending') :
										getStatusColor(booking.status)
									}
									
									<span class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border {badgeColor}">
										<BookingIcon class="h-3.5 w-3.5" />
										<span class="font-medium">{combinedLabel}</span>
									</span>
								{/if}
									
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
						<Filter class="w-12 h-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
						<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No bookings found</h3>
						<p class="text-sm mb-4" style="color: var(--text-secondary);">
							Try adjusting your filters or search query
						</p>
						<button
							onclick={clearFilters}
							class="button-secondary button--small"
						>
							Clear Filters
						</button>
					{:else}
					<Calendar class="w-12 h-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
					<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No bookings yet</h3>
					<p class="text-sm mb-4" style="color: var(--text-secondary);">
						Start sharing your tours to get your first bookings!
					</p>
					<button
						onclick={() => goto('/tours')}
						class="button-primary button--small"
					>
						View Tours
					</button>
					{/if}
				</div>
			{/if}
		</div>
		
		{#if isLoading}
			<div class="p-8 text-center">
				<Loader2 class="w-12 h-12 mx-auto mb-4 animate-spin" style="color: var(--color-primary-500);" />
				<p class="text-sm font-medium" style="color: var(--text-secondary);">Loading bookings...</p>
			</div>
		{/if}
		
		<!-- Load More Button -->
		{#if hasMore && !isLoading}
			<div class="p-4 border-t" style="border-color: var(--border-primary);">
				<button
					onclick={loadMore}
					class="w-full button-secondary button--small transition-all duration-200 active:scale-95"
				>
					Show More ({filteredBookings.length - displayBookings.length} remaining)
				</button>
			</div>
		{/if}
	</div>
</div> 
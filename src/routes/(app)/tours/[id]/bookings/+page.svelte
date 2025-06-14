<script lang="ts">

	import { goto } from '$app/navigation';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate } from '$lib/utils/date-helpers.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	
	// Components
	import StatsCard from '$lib/components/StatsCard.svelte';
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
	
	// Get data from load function
	let { data } = $props();
	let tourId = $derived(data.tourId);
	
	// TanStack Query using the same working endpoint as dashboard
	const allBookingsQuery = createQuery({
		queryKey: queryKeys.recentBookings(100),
		queryFn: () => queryFunctions.fetchRecentBookings(100),
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000,    // 5 minutes
	});
	
	// State
	let statusFilter = $state<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
	let searchQuery = $state('');
	
	// Derive data from query and filter by tour ID
	let allBookings = $derived($allBookingsQuery.data || []);
	let tourBookings = $derived(allBookings.filter((b: any) => b.tourId === tourId || b.tour?.id === tourId));
	
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
	let tour = $derived(bookings.length > 0 || tourBookings.length > 0 ? { name: tourBookings[0]?.tour || tourBookings[0]?.tourName } : null);
	let isLoading = $derived($allBookingsQuery.isLoading);
	let isError = $derived($allBookingsQuery.isError);
	
	// Calculate stats from all tour bookings (not filtered)
	let stats = $derived(() => {
		const confirmed = tourBookings.filter((b: any) => b.status === 'confirmed');
		const pending = tourBookings.filter((b: any) => b.status === 'pending');
		const cancelled = tourBookings.filter((b: any) => b.status === 'cancelled');
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
			pending: pending.length,
			cancelled: cancelled.length,
			todayCount: todayBookings.length,
			upcoming: upcomingBookings.length,
			revenue: confirmed.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0),
			participants: confirmed.reduce((sum: number, b: any) => sum + (Number(b.participants) || 0), 0)
		};
	});
	
	// Refresh function
	function handleRefresh() {
		$allBookingsQuery.refetch();
	}
	
	// Get status color
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
	
	<!-- Desktop Stats -->
	<div class="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
		<StatsCard
			title="Total Bookings"
			value={stats().total}
			subtitle="{stats().confirmed} confirmed"
			icon={Calendar}
			variant="small"
		/>
		
		<StatsCard
			title="Pending Review"
			value={stats().pending}
			subtitle="need attention"
			icon={AlertCircle}
			trend={stats().pending > 0 ? { value: 'Action needed', positive: false } : undefined}
			variant="small"
		/>
		
		<StatsCard
			title="Tour Revenue"
			value={$globalCurrencyFormatter(stats().revenue)}
			subtitle="from this tour"
			icon={Euro}
			variant="small"
		/>
		
		<StatsCard
			title="Total Guests"
			value={stats().participants}
			subtitle="participants"
			icon={Users}
			variant="small"
		/>
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
								<span class="ml-2 px-2 py-1 text-xs rounded-full border {getStatusColor(booking.status)}">
									{booking.status}
								</span>
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
										{booking.participants}
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
									<span class="px-3 py-1 text-xs rounded-full border {getStatusColor(booking.status)}">
										{booking.status}
									</span>
									
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
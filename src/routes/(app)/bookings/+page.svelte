<script lang="ts">
	import { goto } from '$app/navigation';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate, getStatusColor, getPaymentStatusColor } from '$lib/utils/date-helpers.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { formatParticipantDisplayCompact, formatParticipantDisplay } from '$lib/utils/participant-display.js';
	
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
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Eye from 'lucide-svelte/icons/eye';
	import Clock from 'lucide-svelte/icons/clock';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	

	
	// State for pagination - show more bookings by default
	let pageSize = $state(50);
	
	// Separate query for ALL bookings (for stats calculation)
	let allBookingsQuery = $derived(createQuery({
		queryKey: queryKeys.recentBookings(1000), // Get a large number for stats
		queryFn: () => queryFunctions.fetchRecentBookings(1000),
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000,    // 5 minutes
	}));
	
	// TanStack Query for bookings data with pagination - reactive to page changes
	let bookingsQuery = $derived(createQuery({
		queryKey: queryKeys.recentBookings(pageSize),
		queryFn: () => queryFunctions.fetchRecentBookings(pageSize),
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000,    // 5 minutes
	}));
	
	// Derive data from queries
	let allBookings = $derived($allBookingsQuery.data || []); // For stats calculation
	let bookings = $derived($bookingsQuery.data || []); // For display
	let isLoading = $derived($bookingsQuery.isLoading);
	let isError = $derived($bookingsQuery.isError);
	let isStatsLoading = $derived($allBookingsQuery.isLoading);
	
	// Calculate stats from ALL bookings, not just the paginated ones
	let stats = $derived(() => {
		const confirmed = allBookings.filter((b: any) => b.status === 'confirmed');
		const completed = allBookings.filter((b: any) => b.status === 'completed');
		const pending = allBookings.filter((b: any) => b.status === 'pending');
		const revenueBookings = allBookings.filter((b: any) => b.status === 'confirmed' || b.status === 'completed');
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		const todayBookings = allBookings.filter((b: any) => {
			if (!b.created) return false;
			try {
				const bookingDate = new Date(b.created);
				if (isNaN(bookingDate.getTime())) return false;
				bookingDate.setHours(0, 0, 0, 0);
				return bookingDate.getTime() === today.getTime();
			} catch {
				return false;
			}
		});
		
		const upcomingBookings = allBookings.filter((b: any) => {
			if (!b.effectiveDate) return false;
			try {
				const bookingDate = new Date(b.effectiveDate);
				if (isNaN(bookingDate.getTime())) return false;
				return bookingDate > new Date() && (b.status === 'confirmed' || b.status === 'pending');
			} catch {
				return false;
			}
		});
		
		return {
			total: allBookings.length,
			confirmed: confirmed.length,
			completed: completed.length,
			pending: pending.length,
			todayCount: todayBookings.length,
			upcoming: upcomingBookings.length,
			revenue: revenueBookings.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0),
			participants: revenueBookings.reduce((sum: number, b: any) => sum + (Number(b.participants) || 0), 0)
		};
	});
	
	// Refresh function - refresh both queries
	function handleRefresh() {
		$bookingsQuery.refetch();
		$allBookingsQuery.refetch();
	}
	
	// Load more bookings - increase page size instead of page number
	function loadMore() {
		pageSize += 10; // Add 10 more bookings each time
	}
	
</script>

<svelte:head>
	<title>Bookings - Zaur</title>
	<meta name="description" content="Manage all your tour bookings and customer reservations" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Header -->
		<MobilePageHeader
			title="Bookings"
			secondaryInfo="{isStatsLoading ? 'Loading...' : `${stats().total} total`}"
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
					disabled: isLoading || isStatsLoading
				}
			]}
			infoItems={[
				{
					icon: Calendar,
					label: 'Today',
					value: isStatsLoading ? '...' : `${stats().todayCount} new`
				},
				{
					icon: AlertCircle,
					label: 'Pending',
					value: isStatsLoading ? '...' : `${stats().pending}`
				},
				{
					icon: Euro,
					label: 'Revenue',
					value: isStatsLoading ? '...' : $globalCurrencyFormatter(stats().revenue)
				},
				{
					icon: TrendingUp,
					label: 'Upcoming',
					value: isStatsLoading ? '...' : `${stats().upcoming}`
				}
			]}
		/>
		
		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title="Bookings"
				subtitle="Manage all your tour bookings and customer reservations"
			>
				<button
					onclick={handleRefresh}
					disabled={isLoading || isStatsLoading}
					class="button-secondary button--gap"
				>
					{#if isLoading || isStatsLoading}
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
	
	<!-- Quick Stats - Desktop Only -->
	<div class="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
		<StatsCard
			title="Total Bookings"
			value={isStatsLoading ? '...' : stats().total}
			subtitle={isStatsLoading ? 'Loading...' : `${stats().confirmed} confirmed`}
			icon={Calendar}
			variant="small"
		/>
		
		<StatsCard
			title="Pending Review"
			value={isStatsLoading ? '...' : stats().pending}
			subtitle={isStatsLoading ? 'Loading...' : "need attention"}
			icon={AlertCircle}
			trend={isStatsLoading ? undefined : (stats().pending > 0 ? { value: 'Action needed', positive: false } : undefined)}
			variant="small"
		/>
		
		<StatsCard
			title="Total Revenue"
			value={isStatsLoading ? '...' : $globalCurrencyFormatter(stats().revenue)}
			subtitle={isStatsLoading ? 'Loading...' : "confirmed bookings"}
			icon={Euro}
			variant="small"
		/>
		
		<StatsCard
			title="Total Guests"
			value={isStatsLoading ? '...' : stats().participants}
			subtitle={isStatsLoading ? 'Loading...' : "confirmed participants"}
			icon={Users}
			variant="small"
		/>
	</div>
	
	<!-- Bookings List -->
	<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold" style="color: var(--text-primary);">Recent Bookings</h3>
				<span class="text-sm" style="color: var(--text-secondary);">
					{isStatsLoading ? 'Loading...' : `${stats().total} total`}
				</span>
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
										{booking.tour || booking.tourName || 'Unknown Tour'}
									</p>
								</div>
								<div class="ml-2 flex flex-col gap-1">
									<span class="px-2 py-1 text-xs rounded-full border {getStatusColor(booking.status)}">
										{booking.status}
									</span>
									<span class="px-2 py-1 text-xs rounded-full border {getPaymentStatusColor(booking.paymentStatus || 'pending')}">
										💳 {booking.paymentStatus || 'pending'}
									</span>
								</div>
							</div>
							
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3 text-xs" style="color: var(--text-tertiary);">
									<span class="flex items-center gap-1">
										<Calendar class="h-3 w-3" />
										{#if booking.expand?.timeSlot?.startTime}
											{formatDate(booking.expand.timeSlot.startTime)}
										{:else}
											{formatDate(booking.created)}
										{/if}
									</span>
									<span class="flex items-center gap-1">
										<Clock class="h-3 w-3" />
										{#if booking.expand?.timeSlot?.startTime && booking.expand?.timeSlot?.endTime}
											{formatSlotTimeRange(booking.expand.timeSlot.startTime, booking.expand.timeSlot.endTime)}
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
												{booking.tour || booking.tourName || 'Unknown Tour'}
											</span>
											<span class="text-xs" style="color: var(--text-tertiary);">•</span>
											<span class="text-xs flex items-center gap-1" style="color: var(--text-secondary);">
												<Calendar class="h-3 w-3" />
												{#if booking.expand?.timeSlot?.startTime}
													{formatDate(booking.expand.timeSlot.startTime)}
												{:else}
													{formatDate(booking.created)}
												{/if}
											</span>
											<span class="text-xs" style="color: var(--text-tertiary);">•</span>
											<span class="text-xs flex items-center gap-1" style="color: var(--text-secondary);">
												<Clock class="h-3 w-3" />
												{#if booking.expand?.timeSlot?.startTime && booking.expand?.timeSlot?.endTime}
													{formatSlotTimeRange(booking.expand.timeSlot.startTime, booking.expand.timeSlot.endTime)}
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
										{formatParticipantDisplay(booking)}
									</p>
								</div>
								
								<div class="flex items-center gap-3">
									<div class="flex flex-col gap-1">
										<span class="px-3 py-1 text-xs rounded-full border {getStatusColor(booking.status)}">
											{booking.status}
										</span>
										<span class="px-3 py-1 text-xs rounded-full border {getPaymentStatusColor(booking.paymentStatus || 'pending')}">
											💳 {booking.paymentStatus || 'pending'}
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
					<p class="text-sm" style="color: var(--text-secondary);">
						Start sharing your tours to get your first bookings!
					</p>
				</div>
			{/if}
		</div>
		
		{#if isLoading}
			<div class="p-8 text-center">
				<Loader2 class="w-8 h-8 mx-auto mb-2 animate-spin" style="color: var(--text-tertiary);" />
				<p class="text-sm" style="color: var(--text-secondary);">Loading bookings...</p>
			</div>
		{/if}
		
		<!-- Load More Button -->
		{#if bookings.length === pageSize && bookings.length > 0 && pageSize < 100}
			<div class="p-4 border-t" style="border-color: var(--border-primary);">
				<button
					onclick={loadMore}
					disabled={isLoading}
					class="w-full button-secondary button--small"
				>
					{#if isLoading}
						<Loader2 class="h-4 w-4 animate-spin mr-2" />
						Loading...
					{:else}
						Load More Bookings
					{/if}
				</button>
			</div>
		{/if}
	</div>
</div> 
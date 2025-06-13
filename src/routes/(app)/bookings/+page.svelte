<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatEuro } from '$lib/utils/currency.js';
	import { formatDate, getStatusColor } from '$lib/utils/date-helpers.js';
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
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Eye from 'lucide-svelte/icons/eye';
	import Clock from 'lucide-svelte/icons/clock';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	

	
	// State for pagination
	let currentPage = $state(1);
	let pageSize = $state(20);
	
	// TanStack Query for bookings data with pagination
	const bookingsQuery = createQuery({
		queryKey: queryKeys.recentBookings(currentPage * pageSize),
		queryFn: () => queryFunctions.fetchRecentBookings(currentPage * pageSize),
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000,    // 5 minutes
	});
	
	// Derive data from query
	let bookings = $derived($bookingsQuery.data || []);
	let isLoading = $derived($bookingsQuery.isLoading);
	let isError = $derived($bookingsQuery.isError);
	
	// Calculate stats from bookings
	let stats = $derived(() => {
		const confirmed = bookings.filter((b: any) => b.status === 'confirmed');
		const pending = bookings.filter((b: any) => b.status === 'pending');
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		const todayBookings = bookings.filter((b: any) => {
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
		
		const upcomingBookings = bookings.filter((b: any) => {
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
			total: bookings.length,
			confirmed: confirmed.length,
			pending: pending.length,
			todayCount: todayBookings.length,
			upcoming: upcomingBookings.length,
			revenue: confirmed.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0),
			participants: confirmed.reduce((sum: number, b: any) => sum + (Number(b.participants) || 0), 0)
		};
	});
	
	// Refresh function
	function handleRefresh() {
		$bookingsQuery.refetch();
	}
	
	// Load more bookings
	function loadMore() {
		currentPage += 1;
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
			secondaryInfo="{stats().total} total"
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
					icon: Calendar,
					label: 'Today',
					value: `${stats().todayCount} new`
				},
				{
					icon: AlertCircle,
					label: 'Pending',
					value: `${stats().pending}`
				},
				{
					icon: Euro,
					label: 'Revenue',
					value: formatEuro(stats().revenue)
				},
				{
					icon: TrendingUp,
					label: 'Upcoming',
					value: `${stats().upcoming}`
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
	
	<!-- Quick Stats - Desktop Only -->
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
			title="Total Revenue"
			value={formatEuro(stats().revenue)}
			subtitle="confirmed bookings"
			icon={Euro}
			variant="small"
		/>
		
		<StatsCard
			title="Total Guests"
			value={stats().participants}
			subtitle="confirmed participants"
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
					{stats().total} total
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
								<span class="ml-2 px-2 py-1 text-xs rounded-full border {getStatusColor(booking.status)}">
									{booking.status}
								</span>
							</div>
							
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3 text-xs" style="color: var(--text-tertiary);">
									<span class="flex items-center gap-1">
										<Calendar class="h-3 w-3" />
										{formatDate(booking.effectiveDate)}
									</span>
									<span class="flex items-center gap-1">
										<Users class="h-3 w-3" />
										{booking.participants}
									</span>
								</div>
								<span class="text-sm font-medium" style="color: var(--text-primary);">
									{formatEuro(booking.totalAmount)}
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
										{formatEuro(booking.totalAmount)}
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
		{#if bookings.length >= currentPage * pageSize && bookings.length > 0}
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
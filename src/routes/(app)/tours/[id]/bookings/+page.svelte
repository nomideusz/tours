<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { formatEuro } from '$lib/utils/currency.js';
	import { formatDate } from '$lib/utils/date-helpers.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import type { PageData } from './$types.js';
	
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
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Eye from 'lucide-svelte/icons/eye';
	import Clock from 'lucide-svelte/icons/clock';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import QrCode from 'lucide-svelte/icons/qr-code';
	
	let { data }: { data: PageData } = $props();
	
	// Get tour ID from URL
	const tourId = $derived($page.params.id);
	
	// TanStack Query for tour-specific bookings
	const tourBookingsQuery = createQuery({
		queryKey: ['tourBookings', tourId],
		queryFn: async () => {
			const response = await fetch(`/api/tours/${tourId}/bookings`);
			if (!response.ok) throw new Error('Failed to fetch tour bookings');
			return response.json();
		},
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000,    // 5 minutes
	});
	
	// Derive data from query
	let bookings = $derived($tourBookingsQuery.data?.bookings || []);
	let tour = $derived($tourBookingsQuery.data?.tour || data.tour);
	let isLoading = $derived($tourBookingsQuery.isLoading);
	let isError = $derived($tourBookingsQuery.isError);
	
	// Calculate stats from bookings
	let stats = $derived(() => {
		const confirmed = bookings.filter((b: any) => b.status === 'confirmed');
		const pending = bookings.filter((b: any) => b.status === 'pending');
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		const todayBookings = bookings.filter((b: any) => {
			const bookingDate = new Date(b.created);
			bookingDate.setHours(0, 0, 0, 0);
			return bookingDate.getTime() === today.getTime();
		});
		
		const upcomingBookings = bookings.filter((b: any) => {
			const bookingDate = new Date(b.effectiveDate);
			return bookingDate > new Date() && (b.status === 'confirmed' || b.status === 'pending');
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
		$tourBookingsQuery.refetch();
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
					value: formatEuro(stats().revenue)
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
			title="Tour Revenue"
			value={formatEuro(stats().revenue)}
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
	
	<!-- Bookings List -->
	<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold" style="color: var(--text-primary);">Tour Bookings</h3>
				<span class="text-sm" style="color: var(--text-secondary);">
					{stats().total} total
				</span>
			</div>
		</div>
		
		<div class="divide-y" style="border-color: var(--border-primary);">
			{#if bookings.length > 0}
				{#each bookings as booking}
					<div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onclick={() => goto(`/bookings/${booking.id}`)}>
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
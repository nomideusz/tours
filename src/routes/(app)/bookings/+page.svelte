<script lang="ts">
	import { goto } from '$app/navigation';
	import BookingsList from '$lib/components/BookingsList.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import { formatEuro } from '$lib/utils/currency.js';
	
	// TanStack Query for API-only data fetching
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Euro from 'lucide-svelte/icons/euro';
	import Users from 'lucide-svelte/icons/users';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import Plus from 'lucide-svelte/icons/plus';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	
	// TanStack Query for bookings data
	const recentBookingsQuery = createQuery({
		queryKey: queryKeys.recentBookings(100), // Get more bookings for bookings page
		queryFn: () => queryFunctions.fetchRecentBookings(100),
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000,    // 5 minutes
	});

	// Derive stats from bookings data
	let bookings = $derived($recentBookingsQuery.data || []);
	let stats = $derived((() => {
		const confirmed = bookings.filter((b: any) => b.status === 'confirmed');
		const totalRevenue = confirmed.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0);
		const totalParticipants = confirmed.reduce((sum: number, b: any) => sum + (Number(b.participants) || 0), 0);
		const upcomingCount = bookings.filter((b: any) => {
			const date = new Date(b.effectiveDate);
			return date > new Date() && b.status === 'confirmed';
		}).length;

		return {
			totalBookings: bookings.length,
			confirmedBookings: confirmed.length,
			totalRevenue,
			totalParticipants,
			upcomingCount
		};
	})());

	// Loading states
	let isLoading = $derived($recentBookingsQuery.isLoading);
	let isError = $derived($recentBookingsQuery.isError);

	function handleRefresh() {
		$recentBookingsQuery.refetch();
	}
</script>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Mobile-First Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Compact Header -->
		<MobilePageHeader
			title="All Bookings"
			secondaryInfo="{stats.totalBookings} total bookings"
			quickActions={[
				{
					label: 'QR Scanner',
					icon: UserCheck,
					onclick: () => goto('/checkin-scanner'),
					variant: 'primary'
				},
				{
					label: 'New Tour',
					icon: Plus,
					onclick: () => goto('/tours/new'),
					variant: 'secondary'
				},
				{
					label: 'Refresh',
					icon: RefreshCw,
					onclick: handleRefresh,
					variant: 'secondary'
				}
			]}
			infoItems={[
				{
					icon: Calendar,
					label: 'Total',
					value: `${stats.totalBookings} bookings`
				},
				{
					icon: Euro,
					label: 'Revenue',
					value: formatEuro(stats.totalRevenue)
				},
				{
					icon: Users,
					label: 'Participants',
					value: `${stats.totalParticipants} people`
				},
				{
					icon: TrendingUp,
					label: 'Upcoming',
					value: `${stats.upcomingCount} tours`
				}
			]}
		/>

		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title="All Bookings"
				subtitle="Manage your tour bookings and view payment status"
			/>
		</div>
	</div>
	
	<!-- Error State -->
	{#if isError}
		<div class="rounded-xl p-6 mb-6" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium" style="color: var(--color-danger-900);">Failed to load bookings</p>
					<p class="text-sm" style="color: var(--color-danger-700);">There was an error loading your booking data.</p>
				</div>
				<button onclick={handleRefresh} class="button-secondary button--small">
					<RefreshCw class="h-4 w-4" />
					Retry
				</button>
			</div>
		</div>
	{/if}

	<!-- Statistics - Desktop Only (Mobile shows in header) -->
	<div class="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8 {isLoading ? 'opacity-75' : ''}">
		<StatsCard
			title="Total Bookings"
			value={stats.totalBookings}
			subtitle="{stats.confirmedBookings} confirmed"
			icon={Calendar}
			variant="small"
		/>

		<StatsCard
			title="Total Revenue"
			value={formatEuro(stats.totalRevenue)}
			subtitle="from confirmed bookings"
			icon={Euro}
			variant="small"
		/>

		<StatsCard
			title="Total Participants"
			value={stats.totalParticipants}
			subtitle="confirmed guests"
			icon={Users}
			variant="small"
		/>

		<StatsCard
			title="Upcoming Tours"
			value={stats.upcomingCount}
			subtitle="future bookings"
			icon={TrendingUp}
			variant="small"
		/>
	</div>
		
	<!-- Bookings Table -->
	<div class="rounded-xl overflow-hidden {isLoading ? 'opacity-75' : ''}" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="px-6 py-4 flex items-center justify-between" style="border-bottom: 1px solid var(--border-primary);">
			<h2 class="text-lg font-medium" style="color: var(--text-primary);">All Bookings</h2>
			<button
				onclick={handleRefresh}
				disabled={isLoading}
				class="button-secondary button--small"
			>
				{#if isLoading}
					<Loader2 class="h-4 w-4 animate-spin" />
				{:else}
					<RefreshCw class="h-4 w-4" />
				{/if}
				{isLoading ? 'Loading...' : 'Refresh'}
			</button>
		</div>
		<BookingsList bookings={bookings as any} />
	</div>
</div> 
<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatDate, formatTime, formatDateTime } from '$lib/utils/date-helpers.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	
	// Icons
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Plus from 'lucide-svelte/icons/plus';
	import Edit from 'lucide-svelte/icons/edit';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import TrendingUp from 'lucide-svelte/icons/trending-up';

	// Get data from load function
	let { data } = $props();
	let tourId = $derived(data.tourId);
	
	// TanStack Query for schedule data - reactive to tour changes
	let scheduleQuery = $derived(createQuery({
		queryKey: queryKeys.tourSchedule(tourId),
		queryFn: () => queryFunctions.fetchTourSchedule(tourId),
		staleTime: 30 * 1000, // 30 seconds - shorter for real-time updates
		gcTime: 2 * 60 * 1000, // 2 minutes
		refetchOnWindowFocus: true, // Refetch when user returns to tab
	}));

	// Also fetch tour details to stay in sync with capacity changes
	let tourQuery = $derived(createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 30 * 1000, // 30 seconds
		gcTime: 2 * 60 * 1000, // 2 minutes
	}));

	let tour = $derived($scheduleQuery.data?.tour || $tourQuery.data?.tour || null);
	let timeSlots = $derived($scheduleQuery.data?.timeSlots || []);
	let scheduleStats = $derived($scheduleQuery.data?.scheduleStats || {});
	let isLoading = $derived($scheduleQuery.isLoading);
	let isError = $derived($scheduleQuery.isError);

	// Separate upcoming and past slots
	let upcomingSlots = $derived(timeSlots.filter((slot: any) => slot.isUpcoming));
	let pastSlots = $derived(timeSlots.filter((slot: any) => slot.isPast));

	// Refresh function
	function handleRefresh() {
		$scheduleQuery.refetch();
		$tourQuery.refetch();
	}

	function getSlotStatusColor(slot: any): string {
		if (slot.isPast) return 'bg-gray-100 text-gray-600 border-gray-200';
		if (slot.status === 'cancelled') return 'bg-red-100 text-red-700 border-red-200';
		if (slot.availableSpots === 0) return 'bg-orange-100 text-orange-700 border-orange-200';
		if (slot.totalBookings > 0) return 'bg-blue-100 text-blue-700 border-blue-200';
		return 'bg-green-100 text-green-700 border-green-200';
	}

	function getSlotStatusText(slot: any): string {
		if (slot.isPast) return 'Past';
		if (slot.status === 'cancelled') return 'Cancelled';
		if (slot.availableSpots === 0) return 'Full';
		if (slot.totalBookings > 0) return 'Booked';
		return 'Available';
	}

	function getSlotStatusIcon(slot: any) {
		if (slot.isPast) return Clock;
		if (slot.status === 'cancelled') return XCircle;
		if (slot.availableSpots === 0) return AlertCircle;
		if (slot.totalBookings > 0) return Users;
		return CheckCircle;
	}

	function getBookingRateColor(rate: number): string {
		if (rate >= 80) return 'text-green-600';
		if (rate >= 50) return 'text-blue-600';
		if (rate >= 20) return 'text-orange-600';
		return 'text-gray-600';
	}
</script>

<svelte:head>
	<title>{tour?.name || 'Tour'} Schedule - Zaur</title>
	<meta name="description" content="Manage time slots and schedule for {tour?.name || 'your tour'}" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	{#if isLoading}
		<div class="p-8 text-center">
			<Loader2 class="w-8 h-8 mx-auto mb-2 animate-spin" style="color: var(--text-tertiary);" />
			<p class="text-sm" style="color: var(--text-secondary);">Loading schedule...</p>
		</div>
	{:else if isError || !tour}
		<div class="mb-6 rounded-xl p-4" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium" style="color: var(--color-danger-900);">Failed to load schedule</p>
					<p class="text-sm mt-1" style="color: var(--color-danger-700);">Please try refreshing the page.</p>
				</div>
				<button onclick={() => goto(`/tours/${tourId}`)} class="button-secondary button--small">
					Back to Tour
				</button>
			</div>
		</div>
	{:else}
		<!-- Header -->
		<div class="mb-6 sm:mb-8">
			<!-- Mobile Header -->
			<MobilePageHeader
				title="Schedule"
				secondaryInfo={tour.name}
				quickActions={[
					{
						label: 'Add Slot',
						icon: Plus,
						onclick: () => goto(`/tours/${tourId}/schedule/new`),
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
						label: 'Total',
						value: `${scheduleStats.totalSlots || 0} slots`
					},
					{
						icon: Clock,
						label: 'Upcoming',
						value: `${scheduleStats.upcomingSlots || 0}`
					},
					{
						icon: Users,
						label: 'Capacity',
						value: `${tour.capacity} max`
					},
					{
						icon: BarChart3,
						label: 'Bookings',
						value: `${scheduleStats.totalBookings || 0}`
					}
				]}
			/>
			
			<!-- Desktop Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title="Tour Schedule"
					subtitle="Manage time slots and availability for {tour.name}"
					breadcrumbs={[
						{ label: 'Tours', href: '/tours' },
						{ label: tour.name, href: `/tours/${tourId}` },
						{ label: 'Schedule' }
					]}
				>
					<button onclick={() => goto(`/tours/${tourId}`)} class="button-secondary button--gap mr-4">
						<ArrowLeft class="h-4 w-4" />
						Back to Tour
					</button>
					<div class="flex gap-3">
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
						<button onclick={() => goto(`/tours/${tourId}/schedule/new`)} class="button-primary button--gap">
							<Plus class="h-4 w-4" />
							Add Time Slot
						</button>
					</div>
				</PageHeader>
			</div>
		</div>

		<!-- Schedule Stats - Desktop Only -->
		<div class="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
			<StatsCard
				title="Total Slots"
				value={scheduleStats.totalSlots || 0}
				subtitle="{scheduleStats.upcomingSlots || 0} upcoming"
				icon={Calendar}
				variant="small"
			/>
			
			<StatsCard
				title="Total Bookings"
				value={scheduleStats.totalBookings || 0}
				subtitle="across all slots"
				icon={Users}
				variant="small"
			/>
			
			<StatsCard
				title="Participants"
				value={scheduleStats.totalParticipants || 0}
				subtitle="total guests"
				icon={BarChart3}
				variant="small"
			/>
			
			<StatsCard
				title="Booking Rate"
				value="{scheduleStats.averageBookingRate || 0}%"
				subtitle="slots with bookings"
				icon={TrendingUp}
				variant="small"
			/>
		</div>

		<!-- Tour Capacity Info -->
		<div class="mb-6 rounded-xl p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<div class="flex items-center gap-3">
				<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
					<Users class="h-4 w-4 text-blue-600" />
				</div>
				<div>
					<p class="font-medium" style="color: var(--text-primary);">Tour Capacity: {tour.capacity} guests per slot</p>
					<p class="text-sm" style="color: var(--text-secondary);">
						Each time slot can accommodate up to {tour.capacity} participants. 
						{#if scheduleStats.totalSlots > 0}
							Current utilization: <span class="{getBookingRateColor(scheduleStats.averageBookingRate || 0)}">{scheduleStats.averageBookingRate || 0}%</span>
						{/if}
					</p>
				</div>
			</div>
		</div>

		<!-- Upcoming Slots -->
		{#if upcomingSlots.length > 0}
			<div class="mb-8 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold" style="color: var(--text-primary);">Upcoming Time Slots</h3>
						<span class="text-sm" style="color: var(--text-secondary);">
							{upcomingSlots.length} slots
						</span>
					</div>
				</div>
				
				<div class="divide-y" style="border-color: var(--border-primary);">
					{#each upcomingSlots as slot}
						<div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
							<!-- Mobile Layout -->
							<div class="sm:hidden">
								<div class="flex items-start justify-between mb-2">
									<div class="flex-1 min-w-0">
										<h4 class="text-sm font-medium" style="color: var(--text-primary);">
											{formatDate(slot.startTime)}
										</h4>
										<p class="text-xs mt-0.5" style="color: var(--text-secondary);">
											{formatSlotTimeRange(slot.startTime, slot.endTime)}
										</p>
									</div>
									<span class="ml-2 px-2 py-1 text-xs rounded-full border {getSlotStatusColor(slot)}">
										{getSlotStatusText(slot)}
									</span>
								</div>
								
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3 text-xs" style="color: var(--text-tertiary);">
										<span class="flex items-center gap-1">
											<Users class="h-3 w-3" />
											{slot.totalParticipants}/{tour.capacity}
										</span>
										<span class="flex items-center gap-1">
											<BarChart3 class="h-3 w-3" />
											{slot.totalBookings} bookings
										</span>
									</div>
									<div class="flex gap-1">
										<button onclick={() => goto(`/tours/${tourId}/schedule/${slot.id}/edit`)} class="button-secondary button--small button--icon">
											<Edit class="h-3 w-3" />
										</button>
									</div>
								</div>
							</div>
							
							<!-- Desktop Layout -->
							<div class="hidden sm:flex items-center justify-between">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-4">
										<div>
											<h4 class="text-sm font-medium" style="color: var(--text-primary);">
												{formatDate(slot.startTime)}
											</h4>
											<p class="text-xs mt-1" style="color: var(--text-secondary);">
												{formatSlotTimeRange(slot.startTime, slot.endTime)}
											</p>
										</div>
										
										<div class="flex items-center gap-6 text-sm" style="color: var(--text-secondary);">
											<div class="flex items-center gap-1">
												<Users class="h-4 w-4" />
												<span>{slot.totalParticipants}/{tour.capacity} guests</span>
											</div>
											<div class="flex items-center gap-1">
												<BarChart3 class="h-4 w-4" />
												<span>{slot.totalBookings} bookings</span>
											</div>
											{#if slot.confirmedBookings > 0}
												<div class="flex items-center gap-1">
													<CheckCircle class="h-4 w-4 text-green-600" />
													<span>{slot.confirmedBookings} confirmed</span>
												</div>
											{/if}
											{#if slot.pendingBookings > 0}
												<div class="flex items-center gap-1">
													<Clock class="h-4 w-4 text-orange-600" />
													<span>{slot.pendingBookings} pending</span>
												</div>
											{/if}
										</div>
									</div>
								</div>
								
								<div class="flex items-center gap-3">
									<span class="px-3 py-1 text-xs rounded-full border {getSlotStatusColor(slot)}">
										{getSlotStatusText(slot)}
									</span>
									
									<div class="flex gap-1">
										<button onclick={() => goto(`/tours/${tourId}/schedule/${slot.id}/edit`)} class="button-secondary button--small button--icon" title="Edit time slot">
											<Edit class="h-4 w-4" />
										</button>
										<button onclick={() => goto(`/tours/${tourId}/bookings?slot=${slot.id}`)} class="button-secondary button--small button--icon" title="View bookings">
											<Users class="h-4 w-4" />
										</button>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Past Slots -->
		{#if pastSlots.length > 0}
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold" style="color: var(--text-primary);">Past Time Slots</h3>
						<span class="text-sm" style="color: var(--text-secondary);">
							{pastSlots.length} completed
						</span>
					</div>
				</div>
				
				<div class="divide-y" style="border-color: var(--border-primary);">
					{#each pastSlots.slice(0, 10) as slot}
						<div class="p-4 opacity-75">
							<!-- Mobile Layout -->
							<div class="sm:hidden">
								<div class="flex items-start justify-between mb-2">
									<div class="flex-1 min-w-0">
										<h4 class="text-sm font-medium" style="color: var(--text-primary);">
											{formatDate(slot.startTime)}
										</h4>
										<p class="text-xs mt-0.5" style="color: var(--text-secondary);">
											{formatSlotTimeRange(slot.startTime, slot.endTime)}
										</p>
									</div>
									<span class="ml-2 px-2 py-1 text-xs rounded-full border {getSlotStatusColor(slot)}">
										Completed
									</span>
								</div>
								
								<div class="flex items-center gap-3 text-xs" style="color: var(--text-tertiary);">
									<span class="flex items-center gap-1">
										<Users class="h-3 w-3" />
										{slot.totalParticipants} guests
									</span>
									<span class="flex items-center gap-1">
										<BarChart3 class="h-3 w-3" />
										{slot.totalBookings} bookings
									</span>
								</div>
							</div>
							
							<!-- Desktop Layout -->
							<div class="hidden sm:flex items-center justify-between">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-4">
										<div>
											<h4 class="text-sm font-medium" style="color: var(--text-primary);">
												{formatDate(slot.startTime)}
											</h4>
											<p class="text-xs mt-1" style="color: var(--text-secondary);">
												{formatSlotTimeRange(slot.startTime, slot.endTime)}
											</p>
										</div>
										
										<div class="flex items-center gap-6 text-sm" style="color: var(--text-secondary);">
											<div class="flex items-center gap-1">
												<Users class="h-4 w-4" />
												<span>{slot.totalParticipants} guests served</span>
											</div>
											<div class="flex items-center gap-1">
												<BarChart3 class="h-4 w-4" />
												<span>{slot.totalBookings} bookings</span>
											</div>
										</div>
									</div>
								</div>
								
								<span class="px-3 py-1 text-xs rounded-full border {getSlotStatusColor(slot)}">
									Completed
								</span>
							</div>
						</div>
					{/each}
					
					{#if pastSlots.length > 10}
						<div class="p-4 text-center">
							<p class="text-sm" style="color: var(--text-secondary);">
								+ {pastSlots.length - 10} more past slots
							</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Empty State -->
		{#if timeSlots.length === 0}
			<div class="rounded-xl p-8 sm:p-12 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="max-w-md mx-auto">
					<div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<Calendar class="h-8 w-8 text-blue-600" />
					</div>
					<h3 class="text-xl font-semibold mb-2" style="color: var(--text-primary);">
						No time slots yet
					</h3>
					<p class="text-sm mb-6" style="color: var(--text-secondary);">
						Create your first time slot to start accepting bookings for this tour
					</p>
					<button onclick={() => goto(`/tours/${tourId}/schedule/new`)} class="button-primary button--gap">
						<Plus class="h-4 w-4" />
						Add First Time Slot
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style> 
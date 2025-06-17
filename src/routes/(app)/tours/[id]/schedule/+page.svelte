<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { formatDate, formatTime } from '$lib/utils/date-helpers.js';
	import { 
		formatSlotTimeRange,
		getScheduleSlotStatusColor,
		getScheduleSlotStatusText,
		getScheduleSlotStatusIcon
	} from '$lib/utils/time-slot-client.js';
	import { browser } from '$app/environment';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	
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
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Copy from 'lucide-svelte/icons/copy';
	import Download from 'lucide-svelte/icons/download';
	import UserCheck from 'lucide-svelte/icons/user-check';

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

	// State
	let selectedView = $state<'upcoming' | 'past'>('upcoming');
	let selectedSlots = $state<Set<string>>(new Set());
	let showBulkActions = $derived(selectedSlots.size > 0);

	// Separate upcoming and past slots
	let upcomingSlots = $derived(timeSlots.filter((slot: any) => slot.isUpcoming));
	let pastSlots = $derived(timeSlots.filter((slot: any) => slot.isPast));
	let displayedSlots = $derived(selectedView === 'upcoming' ? upcomingSlots : pastSlots);

	// Today's slots for quick reference
	let todaySlots = $derived(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		
		return upcomingSlots.filter((slot: any) => {
			const slotDate = new Date(slot.startTime);
			return slotDate >= today && slotDate < tomorrow;
		});
	});

	// Refresh function
	function handleRefresh() {
		$scheduleQuery.refetch();
		$tourQuery.refetch();
	}



	function getBookingRateColor(rate: number): string {
		if (rate >= 80) return 'text-green-600';
		if (rate >= 50) return 'text-blue-600';
		if (rate >= 20) return 'text-orange-600';
		return 'text-gray-600';
	}

	function getOccupancyColor(percentage: number): string {
		if (percentage >= 90) return 'text-red-600 font-semibold';
		if (percentage >= 70) return 'text-orange-600 font-medium';
		if (percentage >= 50) return 'text-blue-600';
		return 'text-green-600';
	}

	function toggleSlotSelection(slotId: string) {
		const newSelection = new Set(selectedSlots);
		if (newSelection.has(slotId)) {
			newSelection.delete(slotId);
		} else {
			newSelection.add(slotId);
		}
		selectedSlots = newSelection;
	}

	function selectAllSlots() {
		selectedSlots = new Set(displayedSlots.map((slot: any) => slot.id));
	}

	function clearSelection() {
		selectedSlots = new Set();
	}

	async function bulkDelete() {
		if (!confirm(`Delete ${selectedSlots.size} time slots? This cannot be undone.`)) return;
		
		// TODO: Implement bulk delete API
		console.log('Bulk delete:', Array.from(selectedSlots));
		clearSelection();
	}

	async function exportSchedule() {
		// TODO: Implement schedule export
		console.log('Export schedule');
	}

	function quickCheckIn(slotId: string) {
		// Navigate to check-in scanner with pre-selected slot
		goto(`/checkin-scanner?slot=${slotId}`);
	}

	// Calculate slot occupancy percentage
	function getOccupancyPercentage(slot: any): number {
		if (!slot.capacity || slot.capacity === 0) return 0;
		return Math.round((slot.totalParticipants / slot.capacity) * 100);
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
						label: 'Export',
						icon: Download,
						onclick: exportSchedule,
						variant: 'secondary',
						size: 'icon'
					},
					{
						label: 'Refresh',
						icon: RefreshCw,
						onclick: handleRefresh,
						variant: 'secondary',
						size: 'icon',
						disabled: isLoading
					}
				]}
				infoItems={[
					{
						icon: Calendar,
						label: 'Today',
						value: `${todaySlots().length} slots`
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
						label: 'Utilization',
						value: `${scheduleStats.averageBookingRate || 0}%`
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
							onclick={exportSchedule}
							class="button-secondary button--gap"
						>
							<Download class="h-4 w-4" />
							Export
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
						<button onclick={() => goto(`/tours/${tourId}/schedule/new`)} class="button-primary button--gap">
							<Plus class="h-4 w-4" />
							Add Time Slot
						</button>
					</div>
				</PageHeader>
			</div>
		</div>

		<!-- Success Banners -->
		{#if browser && page.url.searchParams.get('slotCreated') === 'true'}
			<div class="mb-6 rounded-xl p-4" style="background: var(--color-success-light); border: 1px solid var(--color-success-200);">
				<div class="flex items-center gap-3">
					<CheckCircle class="h-5 w-5 flex-shrink-0" style="color: var(--color-success);" />
					<div class="flex-1">
						<p class="font-medium" style="color: var(--color-success-900);">
							Time slot created successfully!
						</p>
						<p class="text-sm mt-1" style="color: var(--color-success-700);">
							Your new time slot is now available for bookings.
						</p>
					</div>
				</div>
			</div>
		{/if}
		
		{#if browser && page.url.searchParams.get('slotUpdated') === 'true'}
			<div class="mb-6 rounded-xl p-4" style="background: var(--color-success-light); border: 1px solid var(--color-success-200);">
				<div class="flex items-center gap-3">
					<CheckCircle class="h-5 w-5 flex-shrink-0" style="color: var(--color-success);" />
					<div class="flex-1">
						<p class="font-medium" style="color: var(--color-success-900);">
							Time slot updated successfully!
						</p>
						<p class="text-sm mt-1" style="color: var(--color-success-700);">
							Your changes have been saved.
						</p>
					</div>
				</div>
			</div>
		{/if}
		
		{#if browser && page.url.searchParams.get('slotDeleted') === 'true'}
			<div class="mb-6 rounded-xl p-4" style="background: var(--color-success-light); border: 1px solid var(--color-success-200);">
				<div class="flex items-center gap-3">
					<CheckCircle class="h-5 w-5 flex-shrink-0" style="color: var(--color-success);" />
					<div class="flex-1">
						<p class="font-medium" style="color: var(--color-success-900);">
							Time slot deleted successfully!
						</p>
						<p class="text-sm mt-1" style="color: var(--color-success-700);">
							The time slot has been removed from your schedule.
						</p>
					</div>
				</div>
			</div>
		{/if}

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
				trend={scheduleStats.pendingBookings > 0 ? { value: `${scheduleStats.pendingBookings} pending`, positive: false } : undefined}
				variant="small"
			/>
			
			<StatsCard
				title="Capacity Utilization"
				value="{scheduleStats.averageBookingRate || 0}%"
				subtitle="average occupancy"
				icon={TrendingUp}
				variant="small"
			/>
			
			<StatsCard
				title="Today's Schedule"
				value={todaySlots().length}
				subtitle="time slots today"
				icon={Clock}
				trend={todaySlots().length > 0 ? { value: `${todaySlots().reduce((sum: number, slot: any) => sum + slot.totalParticipants, 0)} guests`, positive: true } : undefined}
				variant="small"
			/>
		</div>

		<!-- Tour Capacity Info -->
		<div class="mb-6 rounded-xl p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
						<Users class="h-4 w-4 text-blue-600" />
					</div>
					<div>
						<p class="font-medium" style="color: var(--text-primary);">Tour Capacity: {tour.capacity} bookings per slot</p>
						<p class="text-sm" style="color: var(--text-secondary);">
							Each time slot can accept up to {tour.capacity} bookings. Each booking can have multiple participants. 
							{#if scheduleStats.totalSlots > 0}
								Current utilization: <span class="{getBookingRateColor(scheduleStats.averageBookingRate || 0)}">{scheduleStats.averageBookingRate || 0}%</span>
							{/if}
						</p>
					</div>
				</div>
				<button onclick={() => goto(`/tours/${tourId}/edit`)} class="button-secondary button--small button--gap">
					<Edit class="h-4 w-4" />
					Edit Tour
				</button>
			</div>
		</div>

		<!-- Today's Slots - Quick Overview -->
		{#if todaySlots().length > 0}
			<div class="mb-6 rounded-xl" style="background: var(--bg-tertiary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Clock class="h-5 w-5" style="color: var(--text-primary);" />
							<h3 class="font-semibold" style="color: var(--text-primary);">Today's Schedule</h3>
						</div>
						<button onclick={() => goto('/checkin-scanner')} class="button-primary button--small button--gap">
							<QrCode class="h-4 w-4" />
							Check-in Scanner
						</button>
					</div>
				</div>
				<div class="p-4">
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each todaySlots() as slot}
							<div class="p-3 rounded-lg border transition-colors hover:shadow-sm" style="background: var(--bg-primary); border-color: var(--border-primary);">
								<div class="flex items-start justify-between mb-2">
									<div>
										<p class="font-medium text-sm" style="color: var(--text-primary);">
											{formatSlotTimeRange(slot.startTime, slot.endTime)}
										</p>
										<p class="text-xs mt-0.5 {getOccupancyColor(getOccupancyPercentage(slot))}" style="color: var(--text-secondary);">
											{slot.totalParticipants}/{slot.capacity} participants ({getOccupancyPercentage(slot)}%)
										</p>
									</div>
									<Tooltip text="Quick check-in">
										<button
											onclick={() => quickCheckIn(slot.id)}
											class="button-secondary button--small button--icon"
										>
										<UserCheck class="h-3 w-3" />
										</button>
									</Tooltip>
								</div>
								{#if slot.totalBookings > 0}
									<div class="flex items-center gap-2 text-xs" style="color: var(--text-tertiary);">
										<span>{slot.confirmedBookings} confirmed</span>
										{#if slot.pendingBookings > 0}
											<span>• {slot.pendingBookings} pending</span>
										{/if}
									</div>
								{:else}
									<p class="text-xs" style="color: var(--text-tertiary);">No bookings yet</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- View Tabs -->
		<div class="mb-4 flex items-center justify-between">
			<div class="flex gap-1 p-1 rounded-lg" style="background: var(--bg-secondary);">
				<button
					onclick={() => { selectedView = 'upcoming'; clearSelection(); }}
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {selectedView === 'upcoming' ? 'bg-white shadow-sm' : ''}"
					style="color: {selectedView === 'upcoming' ? 'var(--text-primary)' : 'var(--text-secondary)'};"
				>
					Upcoming ({upcomingSlots.length})
				</button>
				<button
					onclick={() => { selectedView = 'past'; clearSelection(); }}
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors {selectedView === 'past' ? 'bg-white shadow-sm' : ''}"
					style="color: {selectedView === 'past' ? 'var(--text-primary)' : 'var(--text-secondary)'};"
				>
					Past ({pastSlots.length})
				</button>
			</div>

			{#if showBulkActions}
				<div class="flex items-center gap-2">
					<span class="text-sm" style="color: var(--text-secondary);">
						{selectedSlots.size} selected
					</span>
					<button onclick={clearSelection} class="button-secondary button--small">
						Clear
					</button>
					<button onclick={bulkDelete} class="button--danger button--gap button--small">
						<Trash2 class="h-4 w-4" />
						Delete
					</button>
				</div>
			{/if}
		</div>

		<!-- Time Slots List -->
		{#if displayedSlots.length > 0}
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold" style="color: var(--text-primary);">
							{selectedView === 'upcoming' ? 'Upcoming Time Slots' : 'Past Time Slots'}
						</h3>
						{#if displayedSlots.length > 5}
							<button
								onclick={selectAllSlots}
								class="text-sm"
								style="color: var(--color-primary-600);"
							>
								Select all
							</button>
						{/if}
					</div>
				</div>
				
				<div class="divide-y" style="border-color: var(--border-primary);">
					{#each displayedSlots as slot}
						<div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors {selectedSlots.has(slot.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}">
							<!-- Mobile Layout -->
							<div class="sm:hidden">
								<div class="flex items-start gap-3">
									<input
										type="checkbox"
										checked={selectedSlots.has(slot.id)}
										onchange={() => toggleSlotSelection(slot.id)}
										class="form-checkbox mt-1"
									/>
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between mb-2">
											<div>
												<h4 class="text-sm font-medium" style="color: var(--text-primary);">
													{formatDate(slot.startTime)}
												</h4>
												<p class="text-xs mt-0.5" style="color: var(--text-secondary);">
													{formatSlotTimeRange(slot.startTime, slot.endTime)}
												</p>
											</div>
																		<span class="ml-2 px-2 py-1 text-xs rounded-full border {getScheduleSlotStatusColor(slot)}">
								{getScheduleSlotStatusText(slot)}
											</span>
										</div>
										
										<div class="space-y-2">
											<div class="flex items-center justify-between">
												<div class="flex items-center gap-3 text-xs" style="color: var(--text-tertiary);">
													<span class="flex items-center gap-1">
														<Users class="h-3 w-3" />
														{slot.totalParticipants}/{slot.capacity}
													</span>
													<span class="{getOccupancyColor(getOccupancyPercentage(slot))}">
														{getOccupancyPercentage(slot)}%
													</span>
												</div>
												<div class="flex gap-1">
													{#if slot.isUpcoming}
														<Tooltip text="Check-in">
															<button onclick={() => quickCheckIn(slot.id)} class="button-secondary button--small button--icon">
															<UserCheck class="h-3 w-3" />
															</button>
														</Tooltip>
													{/if}
													<button onclick={() => goto(`/tours/${tourId}/schedule/${slot.id}/edit`)} class="button-secondary button--small button--icon">
														<Edit class="h-3 w-3" />
													</button>
												</div>
											</div>
											
											{#if slot.totalBookings > 0}
												<div class="text-xs p-2 rounded" style="background: var(--bg-secondary);">
													<div class="flex items-center justify-between mb-1">
														<span style="color: var(--text-secondary);">Bookings:</span>
														<span style="color: var(--text-primary);">{slot.totalBookings}</span>
													</div>
													<div class="flex gap-2">
														<span class="text-green-600">{slot.confirmedBookings} confirmed</span>
														{#if slot.pendingBookings > 0}
															<span class="text-orange-600">{slot.pendingBookings} pending</span>
														{/if}
														{#if slot.totalParticipants > 0}
															<div class="mt-1 pt-1 border-t" style="border-color: var(--border-primary);">
																<span style="color: var(--text-tertiary);">Total: {slot.totalParticipants} participant{slot.totalParticipants === 1 ? '' : 's'}</span>
															</div>
														{/if}
													</div>
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>
							
							<!-- Desktop Layout -->
							<div class="hidden sm:flex items-center gap-4">
								<input
									type="checkbox"
									checked={selectedSlots.has(slot.id)}
									onchange={() => toggleSlotSelection(slot.id)}
									class="form-checkbox"
								/>
								
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-6">
											<div class="min-w-[140px]">
												<h4 class="text-sm font-medium" style="color: var(--text-primary);">
													{formatDate(slot.startTime)}
												</h4>
												<p class="text-xs mt-1" style="color: var(--text-secondary);">
													{formatSlotTimeRange(slot.startTime, slot.endTime)}
												</p>
											</div>
											
											<div class="flex items-center gap-4 text-sm" style="color: var(--text-secondary);">
												<Tooltip text="Occupancy">
													<div class="flex items-center gap-1">
														<Users class="h-4 w-4" />
														<span class="{getOccupancyColor(getOccupancyPercentage(slot))}">
															{slot.totalParticipants}/{slot.capacity} ({getOccupancyPercentage(slot)}%)
														</span>
													</div>
												</Tooltip>
												
												{#if slot.totalBookings > 0}
													<div class="flex items-center gap-3">
														<Tooltip text="Total bookings">
															<div class="flex items-center gap-1">
																<BarChart3 class="h-4 w-4" />
																<span>{slot.totalBookings}</span>
															</div>
														</Tooltip>
														<Tooltip text="Confirmed bookings">
															<div class="flex items-center gap-1">
																<CheckCircle class="h-4 w-4 text-green-600" />
																<span>{slot.confirmedBookings}</span>
															</div>
														</Tooltip>
														{#if slot.pendingBookings > 0}
															<Tooltip text="Pending bookings">
																<div class="flex items-center gap-1">
																	<Clock class="h-4 w-4 text-orange-600" />
																	<span>{slot.pendingBookings}</span>
																</div>
															</Tooltip>
														{/if}
														{#if slot.totalParticipants > 0}
															<Tooltip text="Total participants across all bookings">
																<div class="flex items-center gap-1">
																	<Users class="h-4 w-4 text-purple-600" />
																	<span class="text-purple-600">{slot.totalParticipants}</span>
																</div>
															</Tooltip>
														{/if}
													</div>
												{:else}
													<span class="text-xs" style="color: var(--text-tertiary);">No bookings</span>
												{/if}
											</div>
										</div>
										
										<div class="flex items-center gap-3">
											<span class="px-3 py-1 text-xs rounded-full border {getScheduleSlotStatusColor(slot)}">
												{getScheduleSlotStatusText(slot)}
											</span>
											
											<div class="flex gap-1">
												{#if slot.isUpcoming}
													<Tooltip text="Quick check-in">
														<button onclick={() => quickCheckIn(slot.id)} class="button-secondary button--small button--icon">
															<UserCheck class="h-4 w-4" />
														</button>
													</Tooltip>
												{/if}
												<Tooltip text="View bookings">
													<button onclick={() => goto(`/tours/${tourId}/bookings?slot=${slot.id}`)} class="button-secondary button--small button--icon">
														<Users class="h-4 w-4" />
													</button>
												</Tooltip>
												<Tooltip text="Edit time slot">
													<button onclick={() => goto(`/tours/${tourId}/schedule/${slot.id}/edit`)} class="button-secondary button--small button--icon">
														<Edit class="h-4 w-4" />
													</button>
												</Tooltip>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<!-- Empty State -->
			<div class="rounded-xl p-8 sm:p-12 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="max-w-md mx-auto">
					<div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<Calendar class="h-8 w-8 text-blue-600" />
					</div>
					<h3 class="text-xl font-semibold mb-2" style="color: var(--text-primary);">
						{selectedView === 'upcoming' ? 'No upcoming time slots' : 'No past time slots'}
					</h3>
					<p class="text-sm mb-6" style="color: var(--text-secondary);">
						{selectedView === 'upcoming' 
							? 'Create time slots to start accepting bookings for this tour' 
							: 'Past time slots will appear here after they complete'}
					</p>
					{#if selectedView === 'upcoming'}
						<button onclick={() => goto(`/tours/${tourId}/schedule/new`)} class="button-primary button--gap">
							<Plus class="h-4 w-4" />
							Add First Time Slot
						</button>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Quick Tips -->
		<div class="mt-6 p-4 rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<h3 class="font-medium mb-2" style="color: var(--text-primary);">Quick Tips</h3>
			<ul class="space-y-1 text-sm" style="color: var(--text-secondary);">
				<li>• Click the check-in button to quickly scan QR codes for a specific time slot</li>
				<li>• Select multiple slots to perform bulk actions like deletion</li>
				<li>• Time slots inherit the tour's default capacity but can be adjusted individually</li>
				<li>• Cancelled slots will notify customers automatically if bookings exist</li>
			</ul>
		</div>
	{/if}
</div>

<style lang="postcss">
	@reference "tailwindcss";
</style> 
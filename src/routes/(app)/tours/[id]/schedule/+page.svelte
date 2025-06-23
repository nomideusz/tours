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
	import Tooltip from '$lib/components/Tooltip.svelte';
	import Drawer from '$lib/components/Drawer.svelte';
	import TimeSlotForm from '$lib/components/TimeSlotForm.svelte';
	import MiniMonthCalendar from '$lib/components/MiniMonthCalendar.svelte';
	
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

	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Copy from 'lucide-svelte/icons/copy';
	import Download from 'lucide-svelte/icons/download';
	import UserCheck from 'lucide-svelte/icons/user-check';

	// Get data from load function
	let { data } = $props();
	let tourId = $derived(data.tourId);
	
	// Check for query parameters to auto-open drawer or show welcome
	$effect(() => {
		if (browser && page.url) {
			const searchParams = page.url.searchParams;
			
			// Handle welcome parameter for newly created tours
			if (searchParams.get('welcome') === 'true') {
				showWelcome = true;
				hadScheduledSlots = searchParams.get('scheduled') === 'true';
				
				// Don't auto-open drawer - let user read message and choose when ready
				
				// Clean up URL
				const newUrl = new URL(page.url);
				newUrl.searchParams.delete('welcome');
				newUrl.searchParams.delete('scheduled');
				window.history.replaceState({}, '', newUrl.pathname + newUrl.search);
			} else if (searchParams.get('new') === 'true') {
				// Open drawer for new slot
				openNewSlot();
				// Clean up URL
				const newUrl = new URL(page.url);
				newUrl.searchParams.delete('new');
				window.history.replaceState({}, '', newUrl.pathname + newUrl.search);
			} else if (searchParams.get('edit')) {
				// Open drawer for editing specific slot
				const slotId = searchParams.get('edit');
				if (slotId) {
					openEditSlot(slotId);
					// Clean up URL
					const newUrl = new URL(page.url);
					newUrl.searchParams.delete('edit');
					window.history.replaceState({}, '', newUrl.pathname + newUrl.search);
				}
			}
		}
	});
	
	// TanStack Query for schedule data - reactive to tour changes
	let scheduleQuery = $derived(createQuery({
		queryKey: queryKeys.tourSchedule(tourId),
		queryFn: () => queryFunctions.fetchTourSchedule(tourId),
		staleTime: 30 * 1000, // 30 seconds - shorter for real-time updates
		gcTime: 2 * 60 * 1000, // 2 minutes
		refetchOnWindowFocus: true, // Refetch when user returns to tab
		refetchOnMount: true, // Always refetch when component mounts
	}));

	// Also fetch tour details to stay in sync with capacity changes
	let tourQuery = $derived(createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 30 * 1000, // 30 seconds
		gcTime: 2 * 60 * 1000, // 2 minutes
		refetchOnWindowFocus: true, // Refetch when user returns to tab
		refetchOnMount: true, // Always refetch when component mounts
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
	let showSlotDrawer = $state(false);
	let editingSlotId = $state<string | undefined>(undefined);
	let successMessage = $state<string | null>(null);
	let showWelcome = $state(false);
	let hadScheduledSlots = $state(false);
	let preselectedDate = $state<string | undefined>(undefined);

	// Separate upcoming and past slots
	let upcomingSlots = $derived(timeSlots.filter((slot: any) => slot.isUpcoming));
	let pastSlots = $derived(timeSlots.filter((slot: any) => slot.isPast));
	let displayedSlots = $derived(selectedView === 'upcoming' ? upcomingSlots : pastSlots);

	// Create slots map for MiniMonthCalendar
	let slotsMap = $derived(() => {
		const map = new Map<string, number>();
		timeSlots.forEach((slot: any) => {
			const date = new Date(slot.startTime).toISOString().split('T')[0];
			map.set(date, (map.get(date) || 0) + 1);
		});
		return map;
	});

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

	// Handle success from TimeSlotForm
	function handleSlotSuccess() {
		const wasEditing = !!editingSlotId;
		showSlotDrawer = false;
		editingSlotId = undefined;
		preselectedDate = undefined;
		successMessage = wasEditing ? 'Time slot updated successfully!' : 'Time slot created successfully!';
		
		// Dismiss welcome message if first slot was created
		if (showWelcome && !wasEditing) {
			showWelcome = false;
		}
		
		// Clear success message after 5 seconds
		setTimeout(() => {
			successMessage = null;
		}, 5000);
	}

	// Handle opening drawer for new slot
	function openNewSlot(date?: string) {
		editingSlotId = undefined;
		preselectedDate = date;
		// Close and reopen to force state reset
		showSlotDrawer = false;
		setTimeout(() => {
			showSlotDrawer = true;
		}, 50);
	}

	// Handle opening drawer for editing
	function openEditSlot(slotId: string) {
		editingSlotId = slotId;
		preselectedDate = undefined;
		showSlotDrawer = true;
	}

	// Handle calendar date click
	function handleCalendarDateClick(date: string) {
		// Check if there are existing slots on this date
		const slotsOnDate = timeSlots.filter((slot: any) => {
			const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
			return slotDate === date;
		});

		if (slotsOnDate.length > 0) {
			// If slots exist, scroll to them or filter view
			// For now, just open new slot form with date preselected
			openNewSlot(date);
		} else {
			// No slots on this date, open form to create one
			openNewSlot(date);
		}
	}

	function getBookingRateColor(rate: number): string {
		if (rate >= 80) return 'var(--color-success-600)';
		if (rate >= 50) return 'var(--color-primary-600)';
		if (rate >= 20) return 'var(--color-warning-600)';
		return 'var(--text-secondary)';
	}

	function getOccupancyColor(percentage: number): string {
		if (percentage >= 90) return 'var(--color-danger-600)';
		if (percentage >= 70) return 'var(--color-warning-600)';
		if (percentage >= 50) return 'var(--color-primary-600)';
		return 'var(--color-success-600)';
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
	<title>{showWelcome ? `Set up ${tour?.name || 'Tour'} Schedule` : `${tour?.name || 'Tour'} Schedule`} - Zaur</title>
	<meta name="description" content="{showWelcome ? 'Add time slots to make your tour bookable' : 'Manage time slots and schedule'} for {tour?.name || 'your tour'}" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	{#if isLoading}
		<div class="p-8 text-center">
			<div class="w-8 h-8 mx-auto mb-2 rounded-full animate-spin" style="border: 2px solid var(--border-secondary); border-top-color: var(--color-primary-600);"></div>
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
				title={showWelcome ? "Schedule Setup" : "Schedule"}
				secondaryInfo={showWelcome ? "Add your first time slots" : `${tour?.name}`}
				quickActions={[
					{
						label: 'Add Slot',
						icon: Plus,
						onclick: () => openNewSlot(),
						variant: 'primary'
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
					title={showWelcome ? "Schedule Setup" : "Tour Schedule"}
					subtitle={showWelcome ? "Add time slots to make your tour bookable" : "Manage time slots and availability for {tour.name}"}
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
					<button 
						onclick={() => openNewSlot()}
						class="button-primary button--gap"
					>
						<Plus class="h-4 w-4" />
						Add Time Slot
					</button>
				</PageHeader>
			</div>
		</div>

		<!-- Setup Guide for New Tours -->
		{#if showWelcome}
			<div class="mb-6 rounded-xl p-6" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
				<div class="flex items-start gap-4">
					<div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style="background: var(--color-success-600);">
						<CheckCircle class="h-6 w-6 text-white" />
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-semibold mb-2" style="color: var(--color-success-900);">
							🎉 Tour "{tour?.name}" created successfully!
						</h3>
						<p class="text-sm mb-4" style="color: var(--color-success-800);">
							{#if hadScheduledSlots}
								Your initial time slots are ready! You can add more slots below or edit existing ones.
							{:else}
								Ready for the next step? Add time slots so customers can book your tour. This makes your tour live and bookable.
							{/if}
						</p>
						<div class="flex flex-col sm:flex-row gap-3 mb-4">
							<div class="flex items-center gap-2 text-sm" style="color: var(--color-success-700);">
								<span class="w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-semibold" style="background: var(--color-success-600); color: #ffffff;">1</span>
								<span class="font-medium">✅ Tour Created</span>
							</div>
							<div class="flex items-center gap-2 text-sm" style="color: var(--text-primary);">
								<span class="w-6 h-6 text-white rounded-full flex items-center justify-center text-xs font-semibold" style="background: var(--color-primary-600); color: #ffffff;">2</span>
								<span class="font-medium">📅 Add Time Slots</span>
							</div>
							<div class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);">
								<span class="w-6 h-6 border-2 rounded-full flex items-center justify-center text-xs font-semibold" style="border-color: var(--border-secondary); color: var(--text-secondary);">3</span>
								<span>Tour Goes Live</span>
							</div>
						</div>
						<div class="flex flex-col sm:flex-row gap-3">
							<button 
								onclick={() => { showWelcome = false; openNewSlot(); }}
								class="button-primary button--gap"
							>
								<Plus class="h-4 w-4" />
								{hadScheduledSlots ? 'Add More Slots' : 'Add First Time Slot'}
							</button>
							<button 
								onclick={() => showWelcome = false}
								class="text-sm underline hover:no-underline"
								style="color: var(--text-secondary);"
							>
								I'll do this later
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Success Message -->
		{#if successMessage}
			<div class="mb-6 rounded-xl p-4" style="background: var(--color-success-light); border: 1px solid var(--color-success-200);">
				<div class="flex items-center gap-3">
					<CheckCircle class="h-5 w-5 flex-shrink-0" style="color: var(--color-success);" />
					<div class="flex-1">
						<p class="font-medium" style="color: var(--color-success-900);">
							{successMessage}
						</p>
					</div>
				</div>
			</div>
		{/if}

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
									<div class="flex gap-1">
										<Tooltip text="Edit">
											<button
												onclick={() => openEditSlot(slot.id)}
												class="button-secondary button--small button--icon"
											>
												<Edit class="h-3 w-3" />
											</button>
										</Tooltip>
										<Tooltip text="Quick check-in">
											<button
												onclick={() => quickCheckIn(slot.id)}
												class="button-secondary button--small button--icon"
											>
											<UserCheck class="h-3 w-3" />
											</button>
										</Tooltip>
									</div>
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

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<!-- Desktop Calendar Sidebar (Left) -->
			<div class="hidden lg:block lg:col-span-1">
				<div class="sticky top-6 space-y-4">
					<MiniMonthCalendar
						slotsMap={slotsMap()}
						selectedDate={preselectedDate}
						onDateClick={handleCalendarDateClick}
						class="w-full"
					/>
					
					<!-- Quick Stats -->
					<div class="rounded-xl p-4 w-full" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
						<h4 class="text-sm font-medium mb-3" style="color: var(--text-primary);">Month Overview</h4>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span style="color: var(--text-secondary);">Total Slots</span>
								<span style="color: var(--text-primary);">{timeSlots.length}</span>
							</div>
							<div class="flex justify-between">
								<span style="color: var(--text-secondary);">Avg. Occupancy</span>
								<span style="color: {getBookingRateColor(scheduleStats.averageBookingRate || 0)}">{scheduleStats.averageBookingRate || 0}%</span>
							</div>
							<div class="flex justify-between">
								<span style="color: var(--text-secondary);">Total Bookings</span>
								<span style="color: var(--text-primary);">{scheduleStats.totalBookings || 0}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Main Content (Right) -->
			<div class="lg:col-span-3">
				<!-- Mobile Calendar (Above tabs) -->
				<div class="lg:hidden mb-4">
					<MiniMonthCalendar
						slotsMap={slotsMap()}
						selectedDate={preselectedDate}
						onDateClick={handleCalendarDateClick}
						class="w-full"
					/>
				</div>

				<!-- View Tabs -->
				<div class="mb-4 flex items-center justify-between">
					<div class="flex gap-1 p-1 rounded-lg" style="background: var(--bg-secondary);">
						<button
							onclick={() => { selectedView = 'upcoming'; clearSelection(); }}
							class="px-4 py-2 text-sm font-medium rounded-md transition-colors {selectedView === 'upcoming' ? 'active-filter' : ''}"
							style="color: {selectedView === 'upcoming' ? 'var(--text-primary)' : 'var(--text-secondary)'}; background: {selectedView === 'upcoming' ? 'var(--bg-primary)' : 'transparent'}; {selectedView === 'upcoming' ? 'box-shadow: var(--shadow-sm);' : ''}"
						>
							Upcoming ({upcomingSlots.length})
						</button>
						<button
							onclick={() => { selectedView = 'past'; clearSelection(); }}
							class="px-4 py-2 text-sm font-medium rounded-md transition-colors {selectedView === 'past' ? 'active-filter' : ''}"
							style="color: {selectedView === 'past' ? 'var(--text-primary)' : 'var(--text-secondary)'}; background: {selectedView === 'past' ? 'var(--bg-primary)' : 'transparent'}; {selectedView === 'past' ? 'box-shadow: var(--shadow-sm);' : ''}"
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
						<div class="p-4 transition-colors {selectedSlots.has(slot.id) ? 'selected-slot' : ''}" 
							style="{selectedSlots.has(slot.id) ? 'background: var(--color-primary-light);' : 'background: transparent;'}"
							onmouseenter={(e) => !selectedSlots.has(slot.id) && (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
							onmouseleave={(e) => !selectedSlots.has(slot.id) && (e.currentTarget.style.backgroundColor = 'transparent')}
						>
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
													<span style="color: {getOccupancyColor(getOccupancyPercentage(slot))}">{getOccupancyPercentage(slot)}%</span>
												</div>
												<div class="flex gap-1">
													{#if slot.isUpcoming}
														<Tooltip text="Check-in">
															<button onclick={() => quickCheckIn(slot.id)} class="button-secondary button--small button--icon">
															<UserCheck class="h-3 w-3" />
															</button>
														</Tooltip>
													{/if}
													<button onclick={() => openEditSlot(slot.id)} class="button-secondary button--small button--icon">
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
														<span style="color: var(--color-success-600);">{slot.confirmedBookings} confirmed</span>
														{#if slot.pendingBookings > 0}
															<span style="color: var(--color-warning-600);">{slot.pendingBookings} pending</span>
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
														<span style="color: {getOccupancyColor(getOccupancyPercentage(slot))}">
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
																<CheckCircle class="h-4 w-4" style="color: var(--color-success-600);" />
																<span>{slot.confirmedBookings}</span>
															</div>
														</Tooltip>
														{#if slot.pendingBookings > 0}
															<Tooltip text="Pending bookings">
																<div class="flex items-center gap-1">
																	<Clock class="h-4 w-4" style="color: var(--color-warning-600);" />
																	<span>{slot.pendingBookings}</span>
																</div>
															</Tooltip>
														{/if}
														{#if slot.totalParticipants > 0}
															<Tooltip text="Total participants across all bookings">
																<div class="flex items-center gap-1">
																	<Users class="h-4 w-4" style="color: var(--color-primary-600);" />
																	<span style="color: var(--color-primary-600);">{slot.totalParticipants}</span>
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
													<button onclick={() => openEditSlot(slot.id)} class="button-secondary button--small button--icon">
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
					<div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background: var(--color-primary-light);">
						<Calendar class="h-8 w-8" style="color: var(--color-primary-600);" />
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
						<button onclick={() => openNewSlot()} class="button-primary button--gap">
							<Plus class="h-4 w-4" />
							Add First Time Slot
						</button>
					{/if}
				</div>
			</div>
		{/if}

			</div><!-- End Main Content (lg:col-span-3) -->
		</div><!-- End Grid -->

	{/if}
</div>

<!-- Add/Edit Slot Drawer -->
<Drawer
	bind:isOpen={showSlotDrawer}
	title={editingSlotId ? 'Edit Time Slot' : 'Add Time Slot'}
	subtitle={tour ? `${editingSlotId ? 'Modify' : 'Create'} a time slot for ${tour.name}` : ''}
	onClose={() => {
		showSlotDrawer = false;
		editingSlotId = undefined;
		preselectedDate = undefined;
	}}
>
	{#snippet children()}
		<TimeSlotForm
			tourId={tourId}
			slotId={editingSlotId}
			tour={tour}
			mode="modal"
			preselectedDate={preselectedDate}
			onSuccess={handleSlotSuccess}
			onCancel={() => {
				showSlotDrawer = false;
				editingSlotId = undefined;
				preselectedDate = undefined;
			}}
		/>
	{/snippet}
</Drawer>

<style lang="postcss">
	@reference "tailwindcss";
</style> 
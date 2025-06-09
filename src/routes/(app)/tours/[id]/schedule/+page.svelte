<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';

	// Icons
	import Calendar from 'lucide-svelte/icons/calendar';
	import Plus from 'lucide-svelte/icons/plus';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Edit from 'lucide-svelte/icons/edit';
	import Copy from 'lucide-svelte/icons/copy';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import CalendarDays from 'lucide-svelte/icons/calendar-days';
	import List from 'lucide-svelte/icons/list';
	import Filter from 'lucide-svelte/icons/filter';
	import MoreVertical from 'lucide-svelte/icons/more-vertical';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// State management
	let currentDate = $state(new Date());
	let showAddModal = $state(false);
	let selectedDate = $state('');
	let isCreating = $state(false);
	let deletingSlotId = $state<string | null>(null);
	let editingSlot = $state<any>(null);
	let viewMode = $state<'calendar' | 'list'>('calendar');
	let selectedSlot = $state<any>(null);
	let showSlotDetails = $state(false);

	// Form state
	let newSlot = $state({
		startTime: '10:00',
		endTime: '12:00',
		availableSpots: data.tour.capacity
	});

	// Update form when tour data changes
	$effect(() => {
		if (!editingSlot && !showAddModal) {
			newSlot.availableSpots = data.tour.capacity;
		}
	});

	// Statistics
	let scheduleStats = $derived.by(() => {
		const slots = data.timeSlots || [];
		const now = new Date();

		const totalSlots = slots.length;
		const bookedSlots = slots.filter((slot) => (slot.bookedSpots || 0) > 0).length;
		const availableSlots = slots.filter(
			(slot) =>
				(slot.bookedSpots || 0) < (slot.availableSpots || 0) && new Date(slot.startTime) > now
		).length;
		const upcomingSlots = slots.filter((slot) => new Date(slot.startTime) > now).length;

		return {
			totalSlots,
			bookedSlots,
			availableSlots,
			upcomingSlots
		};
	});

	// Calendar helpers
	function getCalendarDays() {
		const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
		const startDate = new Date(startOfMonth);
		startDate.setDate(startDate.getDate() - startDate.getDay());

		const days = [];
		const currentDay = new Date(startDate);

		for (let i = 0; i < 42; i++) {
			const dayInfo = {
				date: new Date(currentDay),
				isCurrentMonth: currentDay.getMonth() === currentDate.getMonth(),
				isToday: isToday(currentDay),
				isSelectable: currentDay >= new Date(),
				timeSlots: getTimeSlotsForDate(currentDay)
			};
			days.push(dayInfo);
			currentDay.setDate(currentDay.getDate() + 1);
		}

		return days;
	}

	function isToday(date: Date): boolean {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	}

	function getTimeSlotsForDate(date: Date) {
		const dateStr = date.toISOString().split('T')[0];
		const slots = data.timeSlots || [];
		return slots
			.filter((slot) => {
				const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
				return slotDate === dateStr;
			})
			.sort((a, b) => a.startTime.localeCompare(b.startTime));
	}

	function formatTime(datetime: string): string {
		return new Date(datetime).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatDate(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	function formatDateDisplay(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function previousMonth() {
		currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
	}

	function nextMonth() {
		currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
	}

	function openAddModal(date?: Date) {
		if (date) {
			selectedDate = formatDate(date);
		} else {
			selectedDate = formatDate(new Date());
		}
		showAddModal = true;
		editingSlot = null;
	}

	function openEditModal(slot: any) {
		const slotDate = new Date(slot.startTime);
		selectedDate = formatDate(slotDate);
		newSlot = {
			startTime: formatTime(slot.startTime).replace(' AM', '').replace(' PM', ''),
			endTime: formatTime(slot.endTime).replace(' AM', '').replace(' PM', ''),
			availableSpots: slot.availableSpots
		};
		editingSlot = slot;
		showAddModal = true;
	}

	function closeAddModal() {
		showAddModal = false;
		selectedDate = '';
		editingSlot = null;
		newSlot = {
			startTime: '10:00',
			endTime: '12:00',
			availableSpots: data.tour.capacity
		};
	}

	function deleteTimeSlot(slotId: string) {
		if (!confirm('Are you sure you want to delete this time slot? This action cannot be undone.'))
			return;
		deletingSlotId = slotId;
		const form = document.getElementById(`delete-slot-${slotId}`) as HTMLFormElement;
		form?.requestSubmit();
	}

	function duplicateSlot(slot: any) {
		const slotDate = new Date(slot.startTime);
		slotDate.setDate(slotDate.getDate() + 1); // Next day
		selectedDate = formatDate(slotDate);
		newSlot = {
			startTime: formatTime(slot.startTime).replace(' AM', '').replace(' PM', ''),
			endTime: formatTime(slot.endTime).replace(' AM', '').replace(' PM', ''),
			availableSpots: data.tour.capacity // Use tour's default capacity, not the custom slot capacity
		};
		showAddModal = true;
	}

	function viewSlotDetails(slot: any) {
		selectedSlot = slot;
		showSlotDetails = true;
	}

	function getSlotStatusColor(slot: any) {
		if (slot.bookedSpots >= slot.availableSpots) {
			return 'bg-red-50 text-red-700 border-red-200';
		} else if (slot.bookedSpots > 0) {
			return 'bg-amber-50 text-amber-700 border-amber-200';
		}
		return 'bg-green-50 text-green-700 border-green-200';
	}

	function getSlotFillPercentage(slot: any): number {
		return slot.availableSpots > 0 ? (slot.bookedSpots / slot.availableSpots) * 100 : 0;
	}

	// List view helpers
	function getUpcomingSlots() {
		const now = new Date();
		const slots = data.timeSlots || [];
		return slots
			.filter((slot) => new Date(slot.startTime) > now)
			.sort((a, b) => a.startTime.localeCompare(b.startTime))
			.slice(0, 20); // Show next 20 slots
	}

	// Update form state on form results
	$effect(() => {
		if (form?.success) {
			closeAddModal();
			showSlotDetails = false;
			invalidateAll();
		}
		if (form?.error) {
			isCreating = false;
			deletingSlotId = null;
		}
	});
</script>

<svelte:head>
	<title>Schedule - {data.tour?.name || 'Tour'} - Zaur</title>
</svelte:head>

<div class="mx-auto max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
	{#if form?.error}
		<div class="mb-6">
			<ErrorAlert variant="error" title="Error" message={form.error} />
		</div>
	{/if}

	<!-- Page Header -->
	<div class="mb-6 sm:mb-8">
		<PageHeader
			title="Schedule"
			subtitle={`Manage time slots for ${data.tour.name}`}
			backUrl={`/tours/${data.tour.id}`}
			breadcrumbs={[
				{ label: 'Tours', href: '/tours' },
				{ label: data.tour.name, href: `/tours/${data.tour.id}` },
				{ label: 'Schedule' }
			]}
		>
			<button onclick={() => goto(`/tours/${data.tour.id}`)} class="hidden sm:flex button-secondary button--gap mr-4">
				<ArrowLeft class="h-4 w-4" />
				Back to Tour
			</button>
			<div class="flex items-center gap-3">
				<!-- View Toggle -->
				<div class="hidden rounded-lg p-1 sm:flex" style="background: var(--bg-secondary);">
					<button
						onclick={() => (viewMode = 'calendar')}
						class="rounded px-4 py-3 text-sm font-medium transition-all {viewMode === 'calendar'
							? 'shadow-sm'
							: ''}"
						style="background: {viewMode === 'calendar'
							? 'var(--bg-primary)'
							: 'transparent'}; color: var(--text-primary);"
					>
						<CalendarDays class="mr-2 inline h-4 w-4" />
						Calendar
					</button>
					<button
						onclick={() => (viewMode = 'list')}
						class="rounded px-4 py-3 text-sm font-medium transition-all {viewMode === 'list'
							? 'shadow-sm'
							: ''}"
						style="background: {viewMode === 'list'
							? 'var(--bg-primary)'
							: 'transparent'}; color: var(--text-primary);"
					>
						<List class="mr-2 inline h-4 w-4" />
						List
					</button>
				</div>

				<button onclick={() => openAddModal()} class="button-primary button--gap">
					<Plus class="h-4 w-4" />
					<span class="hidden sm:inline">Add Time Slot</span>
					<span class="sm:hidden">Add</span>
				</button>
			</div>
		</PageHeader>
	</div>

	<!-- Quick Stats -->
	<div class="mb-8">
		<div class="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
			<StatsCard
				title="Total Slots"
				value={scheduleStats.totalSlots}
				subtitle="all time slots"
				icon={Calendar}
				variant="small"
			/>
			<StatsCard
				title="Upcoming"
				value={scheduleStats.upcomingSlots}
				subtitle="future slots"
				icon={Clock}
				variant="small"
			/>
			<StatsCard
				title="With Bookings"
				value={scheduleStats.bookedSlots}
				subtitle="have reservations"
				icon={Users}
				variant="small"
			/>
			<StatsCard
				title="Available"
				value={scheduleStats.availableSlots}
				subtitle="open for booking"
				icon={BarChart3}
				variant="small"
			/>
		</div>
	</div>

	{#if viewMode === 'calendar'}
		<!-- Calendar View -->
		<div class="mb-6">
			<!-- Calendar Controls -->
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-4">
					<button onclick={previousMonth} class="button-secondary button--small button--icon">
						<ChevronLeft class="h-4 w-4" />
					</button>
					<h2 class="text-xl font-semibold" style="color: var(--text-primary);">
						{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
					</h2>
					<button onclick={nextMonth} class="button-secondary button--small button--icon">
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>

				<!-- Mobile View Toggle -->
				<button
					onclick={() => (viewMode = 'list')}
					class="button-secondary button--gap sm:hidden"
				>
					<List class="h-4 w-4" />
					List
				</button>
			</div>

			<!-- Calendar Legend -->
			<div
				class="mb-4 flex flex-wrap items-center gap-4 text-xs"
				style="color: var(--text-tertiary);"
			>
				<span>Tour default: {data.tour.capacity} spots</span>
				<span class="text-amber-600">* = Custom capacity for this slot</span>
				<span class="flex items-center gap-1">
					<div class="h-3 w-3 rounded border border-green-200 bg-green-50"></div>
					Available
				</span>
				<span class="flex items-center gap-1">
					<div class="h-3 w-3 rounded border border-amber-200 bg-amber-50"></div>
					Partially booked
				</span>
				<span class="flex items-center gap-1">
					<div class="h-3 w-3 rounded border border-red-200 bg-red-50"></div>
					Full/Overbooked
				</span>
			</div>
		</div>

		<!-- Calendar Grid Wrapper -->
		<div class="relative">
			<!-- Calendar Grid -->
			<div
				class="overflow-hidden rounded-xl shadow-sm"
				style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
			>
				<!-- Calendar Header -->
				<div class="grid grid-cols-7 gap-px" style="background: var(--border-primary);">
					{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
						<div
							class="p-3 text-center text-sm font-medium"
							style="background: var(--bg-secondary); color: var(--text-secondary);"
						>
							{day}
						</div>
					{/each}
				</div>

				<!-- Calendar Body -->
				<div class="grid grid-cols-7 gap-px" style="background: var(--border-primary);">
					{#each getCalendarDays() as dayInfo}
						<div
							class="group/day relative flex min-h-28 flex-col p-2 transition-shadow hover:shadow-lg sm:min-h-36 {dayInfo.isSelectable &&
							dayInfo.isCurrentMonth &&
							dayInfo.timeSlots.length === 0
								? 'cursor-pointer'
								: ''}"
							style="background: var(--bg-primary);"
							class:opacity-40={!dayInfo.isCurrentMonth}
							onclick={dayInfo.isSelectable &&
							dayInfo.isCurrentMonth &&
							dayInfo.timeSlots.length === 0
								? () => openAddModal(dayInfo.date)
								: undefined}
							onkeydown={dayInfo.isSelectable &&
							dayInfo.isCurrentMonth &&
							dayInfo.timeSlots.length === 0
								? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAddModal(dayInfo.date); } }
								: undefined}
							role={dayInfo.isSelectable && dayInfo.isCurrentMonth && dayInfo.timeSlots.length === 0
								? 'button'
								: undefined}
							{...(dayInfo.isSelectable && dayInfo.isCurrentMonth && dayInfo.timeSlots.length === 0 ? { tabindex: 0 } : {})}
							aria-label={dayInfo.isSelectable &&
							dayInfo.isCurrentMonth &&
							dayInfo.timeSlots.length === 0
								? `Add time slot for ${dayInfo.date.toLocaleDateString()}`
								: undefined}
						>
							<!-- Date Header -->
							<div class="day-header mb-2 flex items-center justify-between">
								<span
									class="text-sm font-medium {dayInfo.isToday
										? 'flex h-6 w-6 items-center justify-center rounded-full text-xs text-white'
										: ''}"
									style="color: {dayInfo.isToday
										? 'white'
										: 'var(--text-primary)'}; background: {dayInfo.isToday
										? 'var(--color-primary)'
										: 'transparent'};"
								>
									{dayInfo.date.getDate()}
								</span>

								{#if dayInfo.isSelectable && dayInfo.isCurrentMonth}
									<Tooltip text="Add time slot" position="bottom-left">
										<button
											onclick={() => openAddModal(dayInfo.date)}
											class="add-slot-btn flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-all duration-200 group-hover/day:opacity-100 hover:scale-110"
											style="background: var(--color-primary); color: white;"
										>
											<Plus class="h-3 w-3" />
										</button>
									</Tooltip>
								{/if}
							</div>

							<!-- Time Slots -->
							<div class="flex-1 space-y-1">
								{#if dayInfo.timeSlots.length === 0 && dayInfo.isSelectable && dayInfo.isCurrentMonth}
									<!-- Empty day hint -->
									<div
										class="flex flex-1 items-center justify-center opacity-0 transition-opacity duration-200 group-hover/day:opacity-30"
									>
										<div class="text-center">
											<Plus class="mx-auto mb-1 h-6 w-6" style="color: var(--color-primary);" />
											<p class="text-xs" style="color: var(--text-tertiary);">Click to add</p>
										</div>
									</div>
								{:else}
									{#each dayInfo.timeSlots.slice(0, 3) as slot}
										<div
											class="group/slot relative cursor-pointer rounded-lg border px-2 py-1.5 text-xs transition-all duration-200 hover:scale-105 hover:shadow-md {getSlotStatusColor(
												slot
											)}"
											onclick={() => viewSlotDetails(slot)}
										>
											<div class="mb-1 flex items-center justify-between gap-1">
												<span class="font-medium">
													{formatTime(slot.startTime)}
												</span>
												<span
													class="text-xs opacity-75"
													class:text-amber-600={slot.availableSpots !== data.tour.capacity}
												>
													{slot.bookedSpots}/{data.tour.capacity}
													{#if slot.availableSpots !== data.tour.capacity}*{/if}
												</span>
											</div>

											<!-- Progress bar -->
											<div
												class="h-1 w-full rounded-full"
												style="background: currentColor; opacity: 0.2;"
											>
												<div
													class="h-1 rounded-full transition-all duration-300"
													style="width: {getSlotFillPercentage(
														slot
													)}%; background: currentColor; opacity: 0.8;"
												></div>
											</div>

											<!-- Quick Actions -->
											<div
												class="absolute -top-1 -right-1 z-20 opacity-0 transition-opacity group-hover/slot:opacity-100"
											>
												{#if slot.bookedSpots === 0}
													<form
														id="delete-slot-{slot.id}"
														method="POST"
														action="?/delete"
														class="inline-block"
														use:enhance={() => {
															deletingSlotId = slot.id;
															return async ({ result }) => {
																deletingSlotId = null;
																if (result.type === 'success') {
																	await invalidateAll();
																}
															};
														}}
													>
														<input type="hidden" name="slotId" value={slot.id} />
														<Tooltip text="Delete slot" position="bottom-left">
															<button
																type="button"
																onclick={(e) => {
																	e.stopPropagation();
																	deleteTimeSlot(slot.id);
																}}
																disabled={deletingSlotId === slot.id}
																class="delete-slot-btn flex h-5 w-5 items-center justify-center rounded-full shadow-lg transition-colors"
																style="background: var(--color-error); color: white;"
															>
																{#if deletingSlotId === slot.id}
																	<div
																		class="h-2 w-2 animate-spin rounded-full border border-white border-t-transparent"
																	></div>
																{:else}
																	<Trash2 class="h-2 w-2" />
																{/if}
															</button>
														</Tooltip>
													</form>
												{/if}
											</div>
										</div>
									{/each}

									{#if dayInfo.timeSlots.length > 3}
										<div class="py-1 text-center text-xs opacity-60">
											+{dayInfo.timeSlots.length - 3} more
										</div>
									{:else if dayInfo.isSelectable && dayInfo.isCurrentMonth && dayInfo.timeSlots.length > 0}
										<Tooltip text="Add another time slot" position="bottom-left">
											<button
												onclick={() => openAddModal(dayInfo.date)}
												class="mt-1 flex w-full items-center justify-center rounded border-2 border-dashed py-1 opacity-0 transition-all duration-200 group-hover/day:opacity-60 hover:opacity-100"
												style="border-color: var(--color-primary); color: var(--color-primary);"
											>
												<Plus class="h-3 w-3" />
											</button>
										</Tooltip>
									{/if}
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<!-- List View -->
		<div class="space-y-6">
			<!-- List Controls -->
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold" style="color: var(--text-primary);">
					Upcoming Time Slots
				</h3>
				<button
					onclick={() => (viewMode = 'calendar')}
					class="button-secondary button--gap sm:hidden"
				>
					<CalendarDays class="h-4 w-4" />
					Calendar
				</button>
			</div>

			<!-- Time Slots List -->
			<div class="space-y-4">
				{#each getUpcomingSlots() as slot}
					<div
						class="rounded-xl border p-4 transition-all duration-200 hover:shadow-lg sm:p-6"
						style="background: var(--bg-primary); border-color: var(--border-primary);"
					>
						<div class="flex items-center justify-between">
							<div class="flex-1">
								<div class="mb-3 flex items-center gap-4">
									<div>
										<h4 class="font-semibold" style="color: var(--text-primary);">
											{formatDateDisplay(slot.startTime)}
										</h4>
										<p class="text-sm" style="color: var(--text-secondary);">
											{formatTime(slot.startTime)} - {formatTime(slot.endTime)}
										</p>
									</div>
									<span
										class="rounded-full border px-3 py-1 text-sm font-medium {getSlotStatusColor(
											slot
										)}"
									>
										{slot.bookedSpots}/{data.tour.capacity} booked
										{#if slot.availableSpots !== data.tour.capacity}
											<span class="text-xs opacity-75">• Limited to {slot.availableSpots}</span>
										{/if}
									</span>
								</div>

								<!-- Progress Bar -->
								<div class="mb-3 h-2 w-full rounded-full" style="background: var(--bg-tertiary);">
									<div
										class="h-2 rounded-full transition-all duration-300"
										style="width: {getSlotFillPercentage(slot)}%; background: var(--color-primary);"
									></div>
								</div>

								<div class="flex items-center gap-4 text-sm" style="color: var(--text-tertiary);">
									<span>
										{slot.availableSpots} capacity
										{#if slot.availableSpots !== data.tour.capacity}
											<span class="text-amber-600">(custom)</span>
										{:else}
											<span>(tour default)</span>
										{/if}
									</span>
									<span>•</span>
									<span>Status: {slot.status}</span>
								</div>
							</div>

							<!-- Actions -->
							<div class="ml-4 flex items-center gap-2">
								<Tooltip text="Edit slot" position="top">
									<button
										onclick={() => openEditModal(slot)}
										class="button-secondary button--small button--icon"
									>
										<Edit class="h-4 w-4" />
									</button>
								</Tooltip>
								<Tooltip text="Duplicate slot" position="top">
									<button
										onclick={() => duplicateSlot(slot)}
										class="button-secondary button--small button--icon"
									>
										<Copy class="h-4 w-4" />
									</button>
								</Tooltip>
								{#if slot.bookedSpots === 0}
									<form
										id="delete-slot-{slot.id}"
										method="POST"
										action="?/delete"
										class="inline-block"
										use:enhance={() => {
											deletingSlotId = slot.id;
											return async ({ result }) => {
												deletingSlotId = null;
												if (result.type === 'success') {
													await invalidateAll();
												}
											};
										}}
									>
										<input type="hidden" name="slotId" value={slot.id} />
										<Tooltip text="Delete slot" position="top">
											<button
												type="button"
												onclick={(e) => {
													e.preventDefault();
													deleteTimeSlot(slot.id);
												}}
												disabled={deletingSlotId === slot.id}
												class="button-danger button--small button--icon"
											>
												{#if deletingSlotId === slot.id}
													<div class="form-spinner"></div>
												{:else}
													<Trash2 class="h-4 w-4" />
												{/if}
											</button>
										</Tooltip>
									</form>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Empty State -->
	{#if data.timeSlots.length === 0}
		<div class="mt-8">
			<EmptyState
				icon={Calendar}
				title="No Time Slots Scheduled"
				description="Create your first time slot to start accepting bookings for this tour."
				actionText="Add First Time Slot"
				onAction={() => openAddModal()}
			/>
		</div>
	{/if}
</div>

<!-- Add/Edit Time Slot Modal -->
{#if showAddModal}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
		<div
			class="w-full max-w-md rounded-xl bg-white shadow-xl"
			style="background: var(--bg-primary);"
		>
			<form
				method="POST"
				action={editingSlot ? '?/updateCapacity' : '?/create'}
				use:enhance={() => {
					isCreating = true;
					return async ({ result }) => {
						isCreating = false;
						if (result.type === 'success') {
							closeAddModal();
							await invalidateAll();
						}
					};
				}}
			>
				{#if editingSlot}
					<input type="hidden" name="slotId" value={editingSlot.id} />
					<input type="hidden" name="newCapacity" bind:value={newSlot.availableSpots} />
				{/if}

				<div class="p-6" style="border-bottom: 1px solid var(--border-primary);">
					<h3 class="text-xl font-semibold" style="color: var(--text-primary);">
						{editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}
					</h3>
					<p class="mt-1 text-sm" style="color: var(--text-secondary);">
						{editingSlot
							? 'Update the time slot details'
							: 'Create a new bookable time slot for your tour'}
					</p>
				</div>

				<div class="space-y-6 p-6">
					<!-- Date -->
					<div class="form-field">
						<label for="startDate" class="form-label">Date</label>
						<input
							type="date"
							id="startDate"
							name="startDate"
							bind:value={selectedDate}
							min={formatDate(new Date())}
							disabled={!!editingSlot}
							required
							class="form-input"
							class:opacity-50={!!editingSlot}
						/>
						{#if editingSlot}
							<p class="form-help">Date cannot be changed for existing slots</p>
						{/if}
					</div>

					<!-- Time Range -->
					<div class="grid grid-cols-2 gap-4">
						<div class="form-field">
							<label for="startTime" class="form-label">Start Time</label>
							<input
								type="time"
								id="startTime"
								name="startTime"
								bind:value={newSlot.startTime}
								disabled={!!editingSlot}
								required
								class="form-input"
								class:opacity-50={!!editingSlot}
							/>
						</div>
						<div class="form-field">
							<label for="endTime" class="form-label">End Time</label>
							<input
								type="time"
								id="endTime"
								name="endTime"
								bind:value={newSlot.endTime}
								disabled={!!editingSlot}
								required
								class="form-input"
								class:opacity-50={!!editingSlot}
							/>
						</div>
					</div>

					<!-- Available Spots -->
					<div class="form-field">
						<label for="availableSpots" class="form-label">Available Spots</label>
						<input
							type="number"
							id="availableSpots"
							name="availableSpots"
							bind:value={newSlot.availableSpots}
							min={editingSlot?.bookedSpots || 1}
							required
							class="form-input"
						/>
						<p class="form-help">
							Capacity for this time slot (Tour default: {data.tour.capacity} spots)
							{#if editingSlot && editingSlot.bookedSpots > 0}
								<br /><strong>Note:</strong> Cannot be less than current bookings ({editingSlot.bookedSpots})
							{/if}
						</p>
					</div>
				</div>

				<div
					class="flex items-center justify-end gap-3 p-6"
					style="border-top: 1px solid var(--border-primary);"
				>
					<button
						type="button"
						onclick={closeAddModal}
						class="button-secondary"
						disabled={isCreating}
					>
						Cancel
					</button>
					<button type="submit" class="button-primary button--gap" disabled={isCreating}>
						{#if isCreating}
							<div class="form-spinner"></div>
						{:else}
							<Clock class="h-4 w-4" />
						{/if}
						{editingSlot ? 'Update Slot' : 'Create Slot'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Slot Details Modal -->
{#if showSlotDetails && selectedSlot}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
		<div
			class="w-full max-w-lg rounded-xl bg-white shadow-xl"
			style="background: var(--bg-primary);"
		>
			<div class="p-6" style="border-bottom: 1px solid var(--border-primary);">
				<div class="flex items-center justify-between">
					<h3 class="text-xl font-semibold" style="color: var(--text-primary);">
						Time Slot Details
					</h3>
					<button
						onclick={() => (showSlotDetails = false)}
						class="button-secondary button--small button--icon"
					>
						<Plus class="h-4 w-4 rotate-45" />
					</button>
				</div>
			</div>

			<div class="space-y-4 p-6">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<h4 class="mb-1 text-sm font-medium" style="color: var(--text-secondary);">
							Date & Time
						</h4>
						<p class="font-semibold" style="color: var(--text-primary);">
							{formatDateDisplay(selectedSlot.startTime)}
						</p>
						<p class="text-sm" style="color: var(--text-secondary);">
							{formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
						</p>
					</div>
					<div>
						<h4 class="mb-1 text-sm font-medium" style="color: var(--text-secondary);">Bookings</h4>
						<p class="font-semibold" style="color: var(--text-primary);">
							{selectedSlot.bookedSpots} of {selectedSlot.availableSpots}
							{#if selectedSlot.availableSpots !== data.tour.capacity}
								<span class="text-xs font-normal text-amber-600">
									({selectedSlot.availableSpots > data.tour.capacity ? 'expanded' : 'limited'} capacity)
								</span>
							{/if}
						</p>
						<p class="text-sm" style="color: var(--text-secondary);">
							{selectedSlot.availableSpots - selectedSlot.bookedSpots} spots remaining
							{#if selectedSlot.availableSpots !== data.tour.capacity}
								<br /><span class="text-xs">
									Tour default: {data.tour.capacity}, this slot: {selectedSlot.availableSpots}
								</span>
							{/if}
						</p>
					</div>
				</div>

				<!-- Progress Bar -->
				<div>
					<div class="mb-2 flex justify-between text-sm" style="color: var(--text-secondary);">
						<span>Booking Progress</span>
						<span>{getSlotFillPercentage(selectedSlot).toFixed(0)}% full</span>
					</div>
					<div class="h-3 w-full rounded-full" style="background: var(--bg-tertiary);">
						<div
							class="h-3 rounded-full transition-all duration-300"
							style="width: {getSlotFillPercentage(
								selectedSlot
							)}%; background: var(--color-primary);"
						></div>
					</div>
				</div>

				<div class="space-y-3 pt-4">
					{#if selectedSlot.availableSpots !== data.tour.capacity}
						<form
							method="POST"
							action="?/updateCapacity"
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success') {
										await invalidateAll();
										showSlotDetails = false;
									}
								};
							}}
						>
							<input type="hidden" name="slotId" value={selectedSlot.id} />
							<input type="hidden" name="newCapacity" value={data.tour.capacity} />
							<button
								type="submit"
								class="button-secondary button--gap w-full"
								style="color: var(--color-primary); border-color: var(--color-primary);"
							>
								<Users class="h-4 w-4" />
								Reset to Default Capacity ({data.tour.capacity})
							</button>
						</form>
					{/if}

					<div class="flex items-center gap-2">
						<button
							onclick={() => {
								openEditModal(selectedSlot);
								showSlotDetails = false;
							}}
							class="button-primary button--gap flex-1"
						>
							<Edit class="h-4 w-4" />
							Edit Capacity
						</button>
						<button
							onclick={() => {
								duplicateSlot(selectedSlot);
								showSlotDetails = false;
							}}
							class="button-secondary button--gap flex-1"
						>
							<Copy class="h-4 w-4" />
							Duplicate
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Ensure delete buttons have higher z-index than tooltips */
	.delete-slot-btn {
		z-index: 60;
	}

	/* Add button positioning */
	.add-slot-btn {
		z-index: 10;
	}

	/* Ensure time slot tooltips are above other elements */
	.group\/slot [data-tooltip] {
		z-index: 55;
	}
</style>

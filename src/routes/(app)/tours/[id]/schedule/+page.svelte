<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import TimeSlotForm from '$lib/components/TimeSlotForm.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Plus from 'lucide-svelte/icons/plus';
	import Edit2 from 'lucide-svelte/icons/edit-2';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Eye from 'lucide-svelte/icons/eye';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import type { PageData, ActionData } from './$types.js';
	import type { TimeSlot } from '$lib/types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let tour = $derived(data.tour);
	let timeSlots = $state(data.timeSlots || []);
	let showCreateForm = $state(false);
	let editingSlot = $state<TimeSlot | null>(null);
	let error = $state<string | null>(form?.error || null);

	// Filter future and current slots, then sort by start time
	// Use a more conservative approach for SSR safety
	let futureSlots = $derived((() => {
		try {
			if (!timeSlots || timeSlots.length === 0) return [];
			
			const now = new Date();
			return timeSlots.filter(slot => {
				try {
					if (!slot?.startTime) return false;
					const slotDate = new Date(slot.startTime);
					return !isNaN(slotDate.getTime()) && slotDate >= now;
				} catch {
					return false;
				}
			});
		} catch {
			return timeSlots || [];
		}
	})());

	// Sort slots by start time
	let sortedSlots = $derived((() => {
		try {
			if (!futureSlots || futureSlots.length === 0) return [];
			
			return [...futureSlots].sort((a, b) => {
				try {
					const dateA = new Date(a.startTime);
					const dateB = new Date(b.startTime);
					
					if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
					return dateA.getTime() - dateB.getTime();
				} catch {
					return 0;
				}
			});
		} catch {
			return futureSlots || [];
		}
	})());

	// Get upcoming slots (next 3)
	let upcomingSlots = $derived((() => {
		try {
			if (!sortedSlots || sortedSlots.length === 0) return [];
			
			const now = new Date();
			return sortedSlots.filter(slot => {
				try {
					if (!slot?.startTime) return false;
					const slotDate = new Date(slot.startTime);
					return !isNaN(slotDate.getTime()) && slotDate > now;
				} catch {
					return false;
				}
			}).slice(0, 3);
		} catch {
			return [];
		}
	})());

	// Calculate total booked spots today
	let todayBookings = $derived(() => {
		try {
			if (!sortedSlots || sortedSlots.length === 0) return 0;
			
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);
			
			return sortedSlots
				.filter(slot => {
					try {
						if (!slot?.startTime) return false;
						const slotDate = new Date(slot.startTime);
						return !isNaN(slotDate.getTime()) && slotDate >= today && slotDate < tomorrow;
					} catch {
						return false;
					}
				})
				.reduce((total, slot) => {
					try {
						return total + (slot.bookedSpots || 0);
					} catch {
						return total;
					}
				}, 0);
		} catch {
			return 0;
		}
	});

	function formatDateTime(dateString: string | undefined): string {
		if (!dateString) return 'No date';
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return 'Invalid date';
			return date.toLocaleDateString('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			});
		} catch (error) {
			console.warn('Error formatting date:', dateString);
			return 'Invalid date';
		}
	}

	function getAvailabilityText(slot: TimeSlot): string {
		const available = slot.availableSpots - slot.bookedSpots;
		if (available === 0) {
			return `${slot.bookedSpots} booked, fully booked`;
		}
		return `${slot.bookedSpots} booked, ${available} available`;
	}

	function getStatusColor(slot: TimeSlot): string {
		if (slot.bookedSpots >= slot.availableSpots) return '#EF4444'; // Red - full
		if (slot.bookedSpots > 0) return '#F59E0B'; // Amber - partial
		return '#10B981'; // Green - available
	}

	function getStatusText(slot: TimeSlot): string {
		if (slot.bookedSpots >= slot.availableSpots) return 'full';
		if (slot.bookedSpots > 0) return 'partial';
		return 'available';
	}

	function handleCreateSuccess() {
		showCreateForm = false;
		// Reload the page to get fresh data
		window.location.reload();
	}

	function handleEditSuccess() {
		editingSlot = null;
		// Reload the page to get fresh data
		window.location.reload();
	}

	function startEdit(slot: TimeSlot) {
		editingSlot = slot;
		showCreateForm = false;
	}

	function cancelEdit() {
		editingSlot = null;
		showCreateForm = false;
	}

	function handleAddSlot() {
		showCreateForm = true;
		editingSlot = null;
	}

	async function deleteSlot(slotId: string) {
		if (!confirm('Are you sure you want to delete this time slot?')) return;
		
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = `?/delete-slot`;
		
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = 'slotId';
		input.value = slotId;
		form.appendChild(input);
		
		document.body.appendChild(form);
		form.submit();
	}
</script>

<svelte:head>
	<title>Schedule - {tour.name} | Zaur</title>
	<meta name="description" content="Manage time slots and schedule for {tour.name}" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Mobile-First Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Compact Header -->
		<MobilePageHeader
			title="{tour.name} Schedule"
			secondaryInfo="{futureSlots?.length || 0} upcoming slots"
			quickActions={[
				{
					label: 'Add Slot',
					icon: Plus,
					onclick: handleAddSlot,
					variant: 'primary'
				},
				{
					label: 'Back',
					icon: ArrowLeft,
						onclick: () => goto(`/tours/${tour.id}`),
					variant: 'secondary',
					size: 'icon'
				}
			]}
			infoItems={[
				{
					icon: Calendar,
					label: 'Today',
					value: `${todayBookings()} bookings`
				},
				{
					icon: Clock,
					label: 'Duration',
					value: `${tour.duration}min`
				},
				{
					icon: Users,
					label: 'Capacity',
					value: `${tour.capacity} max`
				},
				{
					icon: DollarSign,
					label: 'Price',
					value: `€${tour.price}`
				}
			]}
		/>

		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title="Schedule Management"
				subtitle="Manage available time slots for {tour.name}"
				breadcrumbs={[
					{ label: 'Tours', href: '/tours' },
					{ label: tour.name, href: `/tours/${tour.id}` },
					{ label: 'Schedule' }
				]}
			>
				<button onclick={() => goto(`/tours/${tour.id}`)} class="hidden sm:flex button-secondary button--gap mr-4">
					<ArrowLeft class="h-4 w-4" />
					Back to Tour
				</button>
				<div class="hidden sm:flex gap-3">
					<button onclick={() => goto(`/tours/${tour.id}/edit`)} class="button-secondary button--gap">
						<Calendar class="h-4 w-4" />
						Edit Tour
					</button>
				</div>
			</PageHeader>
		</div>
	</div>

	<!-- Error Display -->
	{#if error}
		<div class="mb-6">
			<ErrorAlert variant="error" title="Error" message={error} />
		</div>
	{/if}

	<!-- Mobile-First Content Layout -->

	<!-- 1. Quick Actions - Most Important for Tour Guides -->
	{#if !showCreateForm && !editingSlot}
		<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold" style="color: var(--text-primary);">Quick Actions</h3>
					<span class="text-xs px-2 py-1 rounded-full" style="background: var(--color-primary-100); color: var(--color-primary-700);">
						Schedule Management
					</span>
				</div>
			</div>
			<div class="p-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<button 
						onclick={handleAddSlot}
						class="button-primary button--gap button--full-width justify-center"
					>
						<Plus class="h-4 w-4" />
						Add Time Slot
					</button>
					<button
						onclick={() => goto(`/tours/${tour.id}`)}
						class="button-secondary button--gap button--full-width justify-center"
					>
						<Eye class="h-4 w-4" />
						View Tour Details
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- 2. Create/Edit Form -->
	{#if showCreateForm}
		<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold" style="color: var(--text-primary);">Create New Time Slot</h3>
					<button onclick={cancelEdit} class="button-secondary button--small">
						Cancel
					</button>
				</div>
			</div>
			<div class="p-4">
				<TimeSlotForm
					tourCapacity={tour.capacity}
					tourDuration={tour.duration}
					onCancel={cancelEdit}
					onSuccess={handleCreateSuccess}
				/>
			</div>
		</div>
	{/if}

	{#if editingSlot}
		<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold" style="color: var(--text-primary);">Edit Time Slot</h3>
					<button onclick={cancelEdit} class="button-secondary button--small">
						Cancel
					</button>
				</div>
			</div>
			<div class="p-4">
				<TimeSlotForm
					slot={editingSlot}
					tourCapacity={tour.capacity}
					tourDuration={tour.duration}
					isEdit={true}
					onCancel={cancelEdit}
					onSuccess={handleEditSuccess}
				/>
			</div>
		</div>
	{/if}

	<!-- 3. Upcoming Slots - Critical for Daily Operations -->
	{#if upcomingSlots?.length > 0 && !showCreateForm && !editingSlot}
		<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold" style="color: var(--text-primary);">Next Upcoming Slots</h3>
					<span class="text-xs" style="color: var(--color-primary-600);">
						{upcomingSlots?.length || 0} coming up
					</span>
				</div>
			</div>
			<div class="p-4">
				<div class="space-y-3">
					{#each upcomingSlots as slot}
						<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-secondary);">
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium" style="color: var(--text-primary);">
									{formatDateTime(slot.startTime)}
								</p>
								<p class="text-xs mt-1" style="color: var(--text-secondary);">
									{getAvailabilityText(slot)}
								</p>
							</div>
							<div class="flex items-center gap-2">
								<div 
									class="w-2 h-2 rounded-full"
									style="background-color: {getStatusColor(slot)};"
								></div>
								<button
									onclick={() => startEdit(slot)}
									class="button-secondary button--small button--icon"
								>
									<Edit2 class="h-3 w-3" />
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- 4. Tour Overview - Desktop Priority, Mobile Compact -->
	<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold" style="color: var(--text-primary);">Tour Overview</h3>
				<button onclick={() => goto(`/tours/${tour.id}/edit`)} class="button-secondary button--small">
					<Edit2 class="h-3 w-3 mr-1" />
					Edit
				</button>
			</div>
		</div>
		<div class="p-4">
			<!-- Mobile: Compact Grid -->
			<div class="sm:hidden grid grid-cols-2 gap-4 text-center">
				<div>
					<div class="text-lg font-bold" style="color: var(--text-primary);">{tour.duration}</div>
					<div class="text-xs" style="color: var(--text-secondary);">Minutes</div>
				</div>
				<div>
					<div class="text-lg font-bold" style="color: var(--text-primary);">{tour.capacity}</div>
					<div class="text-xs" style="color: var(--text-secondary);">Max Guests</div>
				</div>
				<div>
					<div class="text-lg font-bold" style="color: var(--text-primary);">€{tour.price}</div>
					<div class="text-xs" style="color: var(--text-secondary);">Base Price</div>
				</div>
				<div>
					<div class="text-lg font-bold" style="color: var(--text-primary);">{futureSlots?.length || 0}</div>
					<div class="text-xs" style="color: var(--text-secondary);">Upcoming</div>
				</div>
			</div>

			<!-- Desktop: Full Layout -->
			<div class="hidden sm:block">
				<h4 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">{tour.name}</h4>
				<p class="text-sm mb-4" style="color: var(--text-secondary);">{tour.description}</p>
				
				<div class="grid grid-cols-4 gap-4">
					<div class="text-center">
						<div class="flex items-center justify-center mb-2">
							<Clock class="h-5 w-5" style="color: var(--text-tertiary);" />
						</div>
						<p class="text-sm font-semibold" style="color: var(--text-primary);">{tour.duration} min</p>
						<p class="text-xs" style="color: var(--text-tertiary);">Duration</p>
					</div>
					<div class="text-center">
						<div class="flex items-center justify-center mb-2">
							<Users class="h-5 w-5" style="color: var(--text-tertiary);" />
						</div>
						<p class="text-sm font-semibold" style="color: var(--text-primary);">{tour.capacity}</p>
						<p class="text-xs" style="color: var(--text-tertiary);">Max Capacity</p>
					</div>
					<div class="text-center">
						<div class="flex items-center justify-center mb-2">
							<Calendar class="h-5 w-5" style="color: var(--text-tertiary);" />
						</div>
						<p class="text-sm font-semibold" style="color: var(--text-primary);">{futureSlots?.length || 0}</p>
						<p class="text-xs" style="color: var(--text-tertiary);">Upcoming Slots</p>
					</div>
					<div class="text-center">
						<div class="flex items-center justify-center mb-2">
							<span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style="background: var(--bg-primary); color: var(--text-primary);">€</span>
						</div>
						<p class="text-sm font-semibold" style="color: var(--text-primary);">€{tour.price}</p>
						<p class="text-xs" style="color: var(--text-tertiary);">Base Price</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- 5. All Time Slots List -->
	<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold" style="color: var(--text-primary);">
					Upcoming Time Slots ({futureSlots?.length || 0})
				</h3>
				{#if futureSlots?.length > 0 && !showCreateForm && !editingSlot}
					<button onclick={handleAddSlot} class="button-secondary button--small">
						<Plus class="h-3 w-3 mr-1" />
						Add
					</button>
				{/if}
			</div>
		</div>
		<div class="p-4">
			{#if !sortedSlots || sortedSlots.length === 0}
				<div class="text-center py-8">
					<Calendar class="w-8 h-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
					<p class="text-sm font-medium mb-2" style="color: var(--text-primary);">No time slots scheduled</p>
					<p class="text-xs mb-4" style="color: var(--text-secondary);">
						Create your first time slot to start accepting bookings.
					</p>
					<button onclick={handleAddSlot} class="button-primary button--small button--gap">
						<Plus class="h-3 w-3" />
						Add Time Slot
					</button>
				</div>
			{:else}
				<div class="space-y-3">
					{#each sortedSlots as slot (slot.id)}
						<div class="p-3 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
							<div class="flex items-center justify-between">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<h4 class="text-sm font-medium truncate" style="color: var(--text-primary);">
											{formatDateTime(slot.startTime)}
										</h4>
										<div class="flex items-center gap-1">
											<div 
												class="w-2 h-2 rounded-full"
												style="background-color: {getStatusColor(slot)};"
											></div>
											<span class="text-xs" style="color: var(--text-secondary);">
												{getStatusText(slot)}
											</span>
										</div>
									</div>
									<p class="text-xs" style="color: var(--text-tertiary);">
										{getAvailabilityText(slot)}
									</p>
								</div>
								
								<div class="flex items-center gap-1">
									<button
										onclick={() => startEdit(slot)}
										class="button-secondary button--small button--icon"
										title="Edit slot"
									>
										<Edit2 class="h-3 w-3" />
									</button>
									
									{#if slot.bookedSpots === 0}
										<button
											onclick={() => deleteSlot(slot.id)}
											class="button-secondary button--small button--icon text-red-600 hover:bg-red-50"
											title="Delete slot"
										>
											<Trash2 class="h-3 w-3" />
										</button>
									{:else}
										<button
											class="button-secondary button--small button--icon opacity-50 cursor-not-allowed"
											title="Cannot delete slot with bookings"
											disabled
										>
											<Trash2 class="h-3 w-3" />
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div> 
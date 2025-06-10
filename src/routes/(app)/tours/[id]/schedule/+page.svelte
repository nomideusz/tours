<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import TimeSlotForm from '$lib/components/TimeSlotForm.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Plus from 'lucide-svelte/icons/plus';
	import Edit2 from 'lucide-svelte/icons/edit-2';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import type { PageData, ActionData } from './$types.js';
	import type { TimeSlot } from '$lib/types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let tour = $derived(data.tour);
	let timeSlots = $state(data.timeSlots || []);
	let showCreateForm = $state(false);
	let editingSlot = $state<TimeSlot | null>(null);
	let error = $state<string | null>(form?.error || null);

	// Sort slots by start time
	let sortedSlots = $derived(
		[...timeSlots].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
	);

	function formatDateTime(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
	}

	function formatTimeRange(startTime: string, endTime: string): string {
		const start = new Date(startTime);
		const end = new Date(endTime);
		
		const startStr = start.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
		
		const endStr = end.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
		
		return `${startStr} - ${endStr}`;
	}

	function getAvailabilityText(slot: TimeSlot): string {
		const available = slot.availableSpots - slot.bookedSpots;
		return `${slot.bookedSpots} booked, ${available} available`;
	}

	function getStatusColor(slot: TimeSlot): string {
		if (slot.bookedSpots >= slot.availableSpots) return '#EF4444'; // Red - full
		if (slot.bookedSpots > 0) return '#F59E0B'; // Amber - partial
		return '#10B981'; // Green - available
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

<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<!-- Header -->
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
	
	<!-- Mobile Back Button -->
	<div class="sm:hidden mb-6">
		<button onclick={() => goto(`/tours/${tour.id}`)} class="button-secondary button--gap button--small">
			<ArrowLeft class="h-4 w-4" />
			Back to Tour
		</button>
	</div>

	<!-- Error Display -->
	{#if error}
		<div class="mb-6">
			<ErrorAlert variant="error" title="Error" message={error} />
		</div>
	{/if}

	<!-- Tour Info Card -->
	<div class="mb-8 p-6 rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h2 class="text-xl font-semibold mb-2" style="color: var(--text-primary);">{tour.name}</h2>
				<p class="text-sm mb-4" style="color: var(--text-secondary);">{tour.description}</p>
				
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
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
						<p class="text-sm font-semibold" style="color: var(--text-primary);">{timeSlots.length}</p>
						<p class="text-xs" style="color: var(--text-tertiary);">Scheduled Times</p>
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

	<!-- Create New Slot Button -->
	{#if !showCreateForm && !editingSlot}
		<div class="mb-6">
			<button 
				onclick={() => { showCreateForm = true; editingSlot = null; }}
				class="button-primary button--gap"
			>
				<Plus class="h-4 w-4" />
				Add Time Slot
			</button>
		</div>
	{/if}

	<!-- Create Form -->
	{#if showCreateForm}
		<div class="mb-8 p-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Create New Time Slot</h3>
			<TimeSlotForm
				tourCapacity={tour.capacity}
				onCancel={cancelEdit}
				onSuccess={handleCreateSuccess}
			/>
		</div>
	{/if}

	<!-- Edit Form -->
	{#if editingSlot}
		<div class="mb-8 p-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Edit Time Slot</h3>
			<TimeSlotForm
				slot={editingSlot}
				tourCapacity={tour.capacity}
				isEdit={true}
				onCancel={cancelEdit}
				onSuccess={handleEditSuccess}
			/>
		</div>
	{/if}

	<!-- Time Slots List -->
	<div class="rounded-xl overflow-hidden shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-6">
			<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">
				Scheduled Time Slots ({timeSlots.length})
			</h3>
			
			{#if sortedSlots.length === 0}
				<div class="text-center py-12">
					<Calendar class="h-12 w-12 mx-auto mb-4" style="color: var(--text-tertiary);" />
					<p class="text-lg font-medium mb-2" style="color: var(--text-primary);">No time slots scheduled</p>
					<p class="text-sm mb-4" style="color: var(--text-secondary);">
						Create your first time slot to start accepting bookings for this tour.
					</p>
					<button 
						onclick={() => { showCreateForm = true; editingSlot = null; }}
						class="button-primary button--gap"
					>
						<Plus class="h-4 w-4" />
						Add Time Slot
					</button>
				</div>
			{:else}
				<div class="space-y-4">
					{#each sortedSlots as slot (slot.id)}
						<div class="p-4 rounded-lg border" style="background: var(--bg-secondary); border-color: var(--border-primary);">
							<div class="flex items-center justify-between">
								<div class="flex-1">
									<div class="flex items-center gap-4 mb-2">
										<h4 class="font-medium" style="color: var(--text-primary);">
											{formatDateTime(slot.startTime)}
										</h4>
										<div class="flex items-center gap-2">
											<div 
												class="w-2 h-2 rounded-full"
												style="background-color: {getStatusColor(slot)};"
											></div>
											<span class="text-sm" style="color: var(--text-secondary);">
												{slot.status}
											</span>
										</div>
									</div>
									<p class="text-sm mb-1" style="color: var(--text-secondary);">
										{formatTimeRange(slot.startTime, slot.endTime)}
									</p>
									<p class="text-sm" style="color: var(--text-tertiary);">
										{getAvailabilityText(slot)}
									</p>
								</div>
								
								<div class="flex items-center gap-2">
									<button
										onclick={() => startEdit(slot)}
										class="p-2 rounded-lg transition-colors"
										style="color: var(--text-tertiary); hover:background: var(--bg-tertiary);"
										title="Edit slot"
									>
										<Edit2 class="h-4 w-4" />
									</button>
									
									{#if slot.bookedSpots === 0}
										<button
											onclick={() => deleteSlot(slot.id)}
											class="p-2 rounded-lg transition-colors text-red-600 hover:bg-red-50"
											title="Delete slot"
										>
											<Trash2 class="h-4 w-4" />
										</button>
									{:else}
										<button
											class="p-2 rounded-lg opacity-50 cursor-not-allowed"
											title="Cannot delete slot with bookings"
											disabled
										>
											<Trash2 class="h-4 w-4 text-gray-400" />
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
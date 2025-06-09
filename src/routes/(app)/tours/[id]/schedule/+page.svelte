<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import TimeSlotManager from '$lib/components/TimeSlotManager.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import type { PageData, ActionData } from './$types.js';
	import type { TimeSlot } from '$lib/types.js';
	import { createId } from '@paralleldrive/cuid2';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let tour = $derived(data.tour);
	let timeSlots = $state(data.timeSlots || []);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Handle slot creation
	async function handleSlotCreated(slot: Partial<TimeSlot>) {
		if (!browser) return;
		
		isLoading = true;
		error = null;

		try {
			// Use SvelteKit's action approach with proper form submission
			const formData = new FormData();
			formData.append('slot', JSON.stringify(slot));

			const response = await fetch(`/tours/${tour.id}/schedule?/create-slot`, {
				method: 'POST',
				body: formData
			});

			// Get the response as text first to handle SvelteKit serialization
			const responseText = await response.text();
			let result;
			
			try {
				result = JSON.parse(responseText);
			} catch {
				// If JSON parsing fails, it might be a redirect or error
				throw new Error('Invalid server response');
			}

			if (result.type === 'success') {
				// Since SvelteKit serializes the response, reconstruct the slot from the input data
				const newSlot = {
					id: createId(),
					tourId: slot.tourId!,
					startTime: slot.startTime!,
					endTime: slot.endTime!,
					availableSpots: slot.availableSpots!,
					bookedSpots: 0,
					status: 'available' as const,
					isRecurring: false,
					recurringPattern: null,
					recurringEnd: null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};
				timeSlots = [...timeSlots, newSlot];
			} else {
				error = result.error || 'Failed to create time slot';
			}
		} catch (err) {
			console.error('Error creating slot:', err);
			error = 'Failed to create time slot. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	// Handle slot update
	async function handleSlotUpdated(slot: TimeSlot) {
		if (!browser) return;
		
		isLoading = true;
		error = null;

		try {
			const response = await fetch(`/tours/${tour.id}/schedule?/update-slot`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					slot: JSON.stringify(slot)
				})
			});

			const result = await response.json();
			
			if (result.type === 'success') {
				// Update the slot in the list
				const updatedSlot = result.data?.slot || result.slot;
				if (updatedSlot) {
					timeSlots = timeSlots.map(s => s.id === slot.id ? updatedSlot : s);
				} else {
					error = 'Unexpected server response format';
				}
			} else {
				error = result.error || 'Failed to update time slot';
			}
		} catch (err) {
			console.error('Error updating slot:', err);
			error = 'Failed to update time slot. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	// Handle slot deletion
	async function handleSlotDeleted(slotId: string) {
		if (!browser) return;
		
		isLoading = true;
		error = null;

		try {
			const response = await fetch(`/tours/${tour.id}/schedule?/delete-slot`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					slotId
				})
			});

			const result = await response.json();
			
			if (result.type === 'success') {
				// Remove the slot from the list
				timeSlots = timeSlots.filter(slot => slot.id !== slotId);
			} else {
				error = result.error || 'Failed to delete time slot';
			}
		} catch (err) {
			console.error('Error deleting slot:', err);
			error = 'Failed to delete time slot. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	// Handle bulk creation
	async function handleBulkCreate(slots: Partial<TimeSlot>[]) {
		if (!browser) return;
		
		isLoading = true;
		error = null;

		try {
			const response = await fetch(`/tours/${tour.id}/schedule?/bulk-create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					slots: JSON.stringify(slots)
				})
			});

			const result = await response.json();
			
			if (result.type === 'success') {
				// Add all new slots to the list
				const newSlots = result.data?.slots || result.slots || [];
				if (newSlots.length > 0) {
					timeSlots = [...timeSlots, ...newSlots];
				} else {
					error = 'No slots returned from server';
				}
			} else {
				error = result.error || 'Failed to create time slots';
			}
		} catch (err) {
			console.error('Error bulk creating slots:', err);
			error = 'Failed to create time slots. Please try again.';
		} finally {
			isLoading = false;
		}
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

	<!-- Time Slot Manager -->
	<div class="rounded-xl overflow-hidden shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-6">
			<TimeSlotManager
				tourId={tour.id}
				tourCapacity={tour.capacity}
				existingSlots={timeSlots as unknown as TimeSlot[]}
				{isLoading}
				onSlotCreated={handleSlotCreated}
				onSlotUpdated={handleSlotUpdated}
				onSlotDeleted={handleSlotDeleted}
				onBulkCreate={handleBulkCreate}
			/>
		</div>
	</div>

	<!-- Quick Tips -->
	<div class="mt-8 p-6 rounded-xl" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
		<h3 class="font-semibold mb-3" style="color: var(--text-primary);">💡 Schedule Management Tips</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style="color: var(--text-secondary);">
			<div>
				<h4 class="font-medium mb-2" style="color: var(--text-primary);">Single Time Slots</h4>
				<ul class="space-y-1">
					<li>• Perfect for one-off tours or special events</li>
					<li>• Set specific dates and times manually</li>
					<li>• Customize capacity per slot if needed</li>
				</ul>
			</div>
			<div>
				<h4 class="font-medium mb-2" style="color: var(--text-primary);">Bulk Creation</h4>
				<ul class="space-y-1">
					<li>• Create multiple slots across date ranges</li>
					<li>• Choose specific days of the week</li>
					<li>• Set multiple time slots per day</li>
				</ul>
			</div>
		</div>
	</div>
</div> 
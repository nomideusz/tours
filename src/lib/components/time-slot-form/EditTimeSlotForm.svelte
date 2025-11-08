<script lang="ts">
	import { formatDate, formatTime } from '$lib/utils/date-helpers.js';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { updateTimeSlotMutation, deleteTimeSlotMutation } from '$lib/queries/mutations.js';
	
	// Components
	import ConfirmationModal from '$lib/components/modals/ConfirmationModal.svelte';
	import TimeRange from '$lib/components/form/inputs/TimeRange.svelte';
	import NumberInput from '$lib/components/form/inputs/NumberInput.svelte';
	import MultiDayTimeRange from './components/MultiDayTimeRange.svelte';
	import DatePicker from '$lib/components/form/inputs/DatePicker.svelte';
	
	// Icons
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Info from 'lucide-svelte/icons/info';
	import Clock from 'lucide-svelte/icons/clock';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Users from 'lucide-svelte/icons/users';

	// Props
	let {
		tourId,
		slotId,
		mode = 'page',
		onSuccess,
		onCancel,
		onSubmissionStart,
		onSubmissionEnd,
		class: className = '',
		tour: propTour
	} = $props<{
		tourId: string;
		slotId: string;
		mode?: 'page' | 'modal' | 'inline' | 'drawer';
		onSuccess?: (result?: any) => void;
		onCancel?: () => void;
		onSubmissionStart?: () => void;
		onSubmissionEnd?: () => void;
		class?: string;
		tour?: any;
	}>();

	// State
	let isSubmitting = $state(false);
	let isDeleting = $state(false);
	let showDeleteConfirm = $state(false);
	let error = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	
	// Form data
	let date = $state('');
	let startTime = $state('');
	let endTime = $state('');
	let endDate = $state('');
	let capacity = $state(0);
	let status = $state<'available' | 'cancelled'>('available');
	let notes = $state('');
	
	// Initialize mutations
	const updateSlotMutation = updateTimeSlotMutation(tourId, slotId);
	const deleteSlotMutation = deleteTimeSlotMutation(tourId);
	
	// Fetch tour details if not provided
	let tourQuery = $derived(propTour ? null : createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 1 * 60 * 1000,
		gcTime: 5 * 60 * 1000,
	}));

	// Fetch existing schedule to get slot data
	let scheduleQuery = $derived(createQuery({
		queryKey: queryKeys.tourSchedule(tourId),
		queryFn: () => queryFunctions.fetchTourSchedule(tourId),
		staleTime: 30 * 1000,
		gcTime: 2 * 60 * 1000,
	}));

	// Get tour and slot data
	let tour = $derived(propTour || $tourQuery?.data?.tour || null);
	let currentSlot = $derived(
		$scheduleQuery.data?.timeSlots?.find((slot: any) => slot.id === slotId) || null
	);
	let hasBookings = $derived(currentSlot?.bookedSpots > 0);
	let isLoading = $derived(propTour ? $scheduleQuery.isLoading : ($tourQuery?.isLoading || $scheduleQuery.isLoading));
	
	// Populate form when slot loads
	$effect(() => {
		if (currentSlot) {
			const startDateTime = new Date(currentSlot.startTime);
			const endDateTime = new Date(currentSlot.endTime);
			
			date = startDateTime.toISOString().split('T')[0];
			startTime = startDateTime.toTimeString().slice(0, 5);
			endTime = endDateTime.toTimeString().slice(0, 5);
			
			// Check if slot spans multiple days
			const startDateStr = startDateTime.toISOString().split('T')[0];
			const endDateStr = endDateTime.toISOString().split('T')[0];
			endDate = endDateStr !== startDateStr ? endDateStr : '';
			
			capacity = currentSlot.capacity || tour?.capacity || 10;
			status = currentSlot.status === 'cancelled' ? 'cancelled' : 'available';
			notes = currentSlot.notes || '';
		}
	});

	// Mode styling
	let containerClass = $derived(
		mode === 'inline' ? 'bg-white dark:bg-gray-900 rounded-xl border' : 
		mode === 'modal' ? 'time-slot-modal-form' : 
		mode === 'drawer' ? 'time-slot-drawer-form' :
		'rounded-xl'
	);

	// Event handlers
	async function handleSubmit() {
		if (isSubmitting) return;
		
		// Basic validation
		if (!date || !startTime || !endTime || capacity < 1) {
			error = 'Please fill in all required fields';
			return;
		}
		
		isSubmitting = true;
		error = null;
		
		// Notify modal that submission started
		onSubmissionStart?.();
		
		try {
			const start = new Date(`${date}T${startTime}:00`);
			const actualEndDate = endDate || date;
			const end = new Date(`${actualEndDate}T${endTime}:00`);
			
			const slotData = {
				startTime: start.toISOString(),
				endTime: end.toISOString(),
				capacity,
				status,
				notes
			};
			
			const result = await $updateSlotMutation.mutateAsync(slotData);
			
			// Handle success
			error = null;
			successMessage = 'Time slot updated successfully';
			
			// Call onSuccess with the result
			onSuccess?.(result);
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update time slot';
		} finally {
			isSubmitting = false;
			// Notify modal that submission ended
			onSubmissionEnd?.();
		}
	}

	async function handleDelete() {
		if (isDeleting || !slotId) return;
		
		isDeleting = true;
		error = null;
		
		try {
			await $deleteSlotMutation.mutateAsync(slotId);
			onSuccess?.();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete time slot';
		} finally {
			isDeleting = false;
			showDeleteConfirm = false;
		}
	}
</script>

<div class="{containerClass} {className}">
	{#if mode === 'page'}
		<div class="flex items-center justify-between mb-6">
			<h1 class="text-2xl font-bold">Edit Time Slot</h1>
			{#if currentSlot}
				<div class="text-sm text-gray-500">
					{#if hasBookings}
						<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full">
							<Info class="w-3.5 h-3.5" />
							{currentSlot.bookedSpots} booking{currentSlot.bookedSpots !== 1 ? 's' : ''}
						</span>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	{#if isLoading}
		<div class="flex items-center justify-center p-12">
			<Loader2 class="w-8 h-8 animate-spin text-gray-400" />
		</div>
	{:else if !currentSlot}
		<div class="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
			<p class="flex items-center gap-2">
				<AlertCircle class="w-5 h-5" />
				Time slot not found
			</p>
		</div>
	{:else}
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
			<!-- Error and Success Messages -->
			{#if error}
				<div class="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
					<p class="flex items-center gap-2">
						<AlertCircle class="w-5 h-5" />
						{error}
					</p>
				</div>
			{/if}
			
			{#if successMessage}
				<div class="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
					<p class="flex items-center gap-2">
						<CheckCircle class="w-5 h-5" />
						{successMessage}
					</p>
				</div>
			{/if}

			{#if tour?.duration > 1440}
				<!-- Multi-day tour: use MultiDayTimeRange -->
				<div>
					<MultiDayTimeRange
						bind:startDate={date}
						bind:startTime
						bind:endDate
						bind:endTime
						label="Time Slot"
						tourDuration={tour.duration}
						disabled={hasBookings}
					/>
					{#if hasBookings}
						<p class="text-sm text-gray-500 mt-1">Date and time cannot be changed when bookings exist</p>
					{/if}
				</div>
			{:else}
				<!-- Single-day tour: separate date and time fields -->
				<!-- Date Field -->
				<div>
					<DatePicker
						bind:value={date}
						label="Date"
						placeholder="Select date"
						disabled={hasBookings}
						required={true}
					/>
					{#if hasBookings}
						<p class="text-sm text-gray-500 mt-1">Date cannot be changed when bookings exist</p>
					{/if}
				</div>

				<!-- Time Range -->
				<div>
					<label class="block text-sm font-medium mb-2">
						<Clock class="w-4 h-4 inline mr-1" />
						Time
					</label>
					<TimeRange
						bind:startTime
						bind:endTime
						defaultDuration={tour?.duration}
						disabled={hasBookings}
					/>
					{#if hasBookings}
						<p class="text-sm text-gray-500 mt-1">Time cannot be changed when bookings exist</p>
					{/if}
				</div>
			{/if}

			<!-- Capacity -->
			<div>
				<label for="capacity" class="block text-sm font-medium mb-2">
					<Users class="w-4 h-4 inline mr-1" />
					Capacity
				</label>
				<NumberInput
					id="capacity"
					label=""
					bind:value={capacity}
					min={hasBookings ? currentSlot.bookedSpots : 1}
					max={999}
					required
				/>
				{#if hasBookings}
					<p class="text-sm text-gray-500 mt-1">
						Minimum capacity: {currentSlot.bookedSpots} (current bookings)
					</p>
				{/if}
			</div>

			<!-- Status -->
			<div>
				<label for="status" class="block text-sm font-medium mb-2">Status</label>
				<select
					id="status"
					bind:value={status}
					disabled={hasBookings}
					class="select w-full {hasBookings ? 'opacity-50 cursor-not-allowed' : ''}"
				>
					<option value="available">Available</option>
					<option value="cancelled">Cancelled</option>
				</select>
				{#if hasBookings}
					<p class="text-sm text-gray-500 mt-1">Status cannot be changed when bookings exist</p>
				{/if}
			</div>

			<!-- Notes -->
			<div>
				<label for="notes" class="block text-sm font-medium mb-2">Notes (optional)</label>
				<textarea
					id="notes"
					bind:value={notes}
					rows="3"
					class="input w-full"
					placeholder="Add any internal notes about this time slot..."
				></textarea>
			</div>

			<!-- Form Actions -->
			<div class="flex gap-3 pt-4 border-t">
				<button
					type="submit"
					disabled={isSubmitting}
					class="button-primary flex-1"
				>
					{#if isSubmitting}
						<Loader2 class="w-4 h-4 animate-spin mr-2" />
						Updating...
					{:else}
						<CheckCircle class="w-4 h-4 mr-2" />
						Update Slot
					{/if}
				</button>

				{#if mode !== 'page'}
					<button
						type="button"
						onclick={onCancel}
						disabled={isSubmitting}
						class="button-secondary"
					>
						Cancel
					</button>
				{/if}

				{#if !hasBookings}
					<button
						type="button"
						onclick={() => showDeleteConfirm = true}
						disabled={isSubmitting || isDeleting}
						class="button-danger"
						title="Delete this time slot"
					>
						<Trash2 class="w-4 h-4" />
					</button>
				{/if}
			</div>
		</form>
	{/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<ConfirmationModal
		title="Delete Time Slot"
		message="Are you sure you want to delete this time slot? This action cannot be undone."
		confirmText="Delete"
		onConfirm={handleDelete}
		onCancel={() => showDeleteConfirm = false}
		variant="danger"
	/>
{/if}

<style>
	.time-slot-modal-form {
		padding: 1.5rem;
	}

	.time-slot-drawer-form {
		padding: 1rem;
	}
</style> 
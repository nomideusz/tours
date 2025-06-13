<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatDate, formatTime } from '$lib/utils/date-helpers.js';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	
	// Icons
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Save from 'lucide-svelte/icons/save';
	import X from 'lucide-svelte/icons/x';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Info from 'lucide-svelte/icons/info';

	// Get data from load function
	let { data } = $props();
	let tourId = $derived(data.tourId);
	let slotId = $derived(data.slotId);
	
	// Fetch tour details
	let tourQuery = $derived(createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 1 * 60 * 1000,
		gcTime: 5 * 60 * 1000,
	}));

	// Fetch existing schedule to check for conflicts
	let scheduleQuery = $derived(createQuery({
		queryKey: queryKeys.tourSchedule(tourId),
		queryFn: () => queryFunctions.fetchTourSchedule(tourId),
		staleTime: 30 * 1000,
		gcTime: 2 * 60 * 1000,
	}));

	let tour = $derived($tourQuery.data?.tour || null);
	let allSlots = $derived($scheduleQuery.data?.timeSlots || []);
	let currentSlot = $derived(allSlots.find((slot: any) => slot.id === slotId) || null);
	let otherSlots = $derived(allSlots.filter((slot: any) => slot.id !== slotId));
	let isLoading = $derived($tourQuery.isLoading || $scheduleQuery.isLoading);

	// Form state
	let isSubmitting = $state(false);
	let isDeleting = $state(false);
	let showDeleteConfirm = $state(false);
	let error = $state<string | null>(null);
	let conflicts = $state<any[]>([]);

	// Form data - will be populated when slot loads
	let formData = $state({
		date: '',
		startTime: '',
		endTime: '',
		capacity: 0,
		status: 'available' as 'available' | 'cancelled',
		notes: ''
	});

	// Populate form when slot loads
	$effect(() => {
		if (currentSlot) {
			const startDate = new Date(currentSlot.startTime);
			const endDate = new Date(currentSlot.endTime);
			
			formData.date = startDate.toISOString().split('T')[0];
			formData.startTime = startDate.toTimeString().slice(0, 5);
			formData.endTime = endDate.toTimeString().slice(0, 5);
			formData.capacity = currentSlot.availableSpots;
			formData.status = currentSlot.status === 'cancelled' ? 'cancelled' : 'available';
			formData.notes = currentSlot.notes || '';
		}
	});

	// Check for conflicts when date/time changes
	$effect(() => {
		if (formData.date && formData.startTime && formData.endTime && otherSlots.length > 0) {
			checkConflicts();
		}
	});

	function checkConflicts() {
		const newStart = new Date(`${formData.date}T${formData.startTime}:00`);
		const newEnd = new Date(`${formData.date}T${formData.endTime}:00`);
		
		conflicts = otherSlots.filter((slot: any) => {
			const slotStart = new Date(slot.startTime);
			const slotEnd = new Date(slot.endTime);
			
			// Check if times overlap
			return (newStart < slotEnd && newEnd > slotStart);
		});
	}

	function generateTimeOptions() {
		const options = [];
		for (let hour = 6; hour <= 22; hour++) {
			for (let minute = 0; minute < 60; minute += 30) {
				const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
				options.push(time);
			}
		}
		return options;
	}

	function getEndTimeFromDuration() {
		if (!tour?.duration || !formData.startTime) return;
		
		const start = new Date(`2000-01-01T${formData.startTime}:00`);
		const end = new Date(start.getTime() + tour.duration * 60000);
		formData.endTime = end.toTimeString().slice(0, 5);
	}

	async function handleSubmit() {
		if (isSubmitting) return;
		
		// Validate required fields
		if (!formData.date || !formData.startTime || !formData.endTime) {
			error = 'Please fill in all required fields';
			return;
		}
		
		// Check for conflicts
		if (conflicts.length > 0) {
			error = 'Please resolve time conflicts before saving';
			return;
		}
		
		// Validate time logic
		const start = new Date(`${formData.date}T${formData.startTime}:00`);
		const end = new Date(`${formData.date}T${formData.endTime}:00`);
		
		if (end <= start) {
			error = 'End time must be after start time';
			return;
		}
		
		isSubmitting = true;
		error = null;
		
		try {
			const response = await fetch(`/api/tours/${tourId}/schedule/${slotId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					startTime: start.toISOString(),
					endTime: end.toISOString()
				})
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to update time slot');
			}
			
			// Redirect back to schedule
			goto(`/tours/${tourId}/schedule`);
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update time slot';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDelete() {
		if (isDeleting) return;
		
		isDeleting = true;
		error = null;
		
		try {
			const response = await fetch(`/api/tours/${tourId}/schedule/${slotId}`, {
				method: 'DELETE'
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to delete time slot');
			}
			
			// Redirect back to schedule
			goto(`/tours/${tourId}/schedule`);
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete time slot';
		} finally {
			isDeleting = false;
			showDeleteConfirm = false;
		}
	}

	function handleCancel() {
		goto(`/tours/${tourId}/schedule`);
	}

	// Calculate duration in minutes
	let duration = $derived(() => {
		if (!formData.startTime || !formData.endTime) return 0;
		const start = new Date(`2000-01-01T${formData.startTime}:00`);
		const end = new Date(`2000-01-01T${formData.endTime}:00`);
		return Math.max(0, (end.getTime() - start.getTime()) / 60000);
	});

	// Check if slot has bookings
	let hasBookings = $derived(currentSlot?.bookedSpots > 0);
</script>

<svelte:head>
	<title>Edit Time Slot - {tour?.name || 'Tour'} | Zaur</title>
	<meta name="description" content="Edit time slot for {tour?.name || 'your tour'}" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	{#if isLoading}
		<div class="p-8 text-center">
			<Loader2 class="w-8 h-8 mx-auto mb-2 animate-spin" style="color: var(--text-tertiary);" />
			<p class="text-sm" style="color: var(--text-secondary);">Loading time slot details...</p>
		</div>
	{:else if !tour || !currentSlot}
		<div class="mb-6 rounded-xl p-4" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium" style="color: var(--color-danger-900);">Time slot not found</p>
					<p class="text-sm mt-1" style="color: var(--color-danger-700);">Please check the slot ID and try again.</p>
				</div>
				<button onclick={() => goto(`/tours/${tourId}/schedule`)} class="button-secondary button--small">
					Back to Schedule
				</button>
			</div>
		</div>
	{:else}
		<!-- Header -->
		<div class="mb-6 sm:mb-8">
			<!-- Mobile Header -->
			<MobilePageHeader
				title="Edit Time Slot"
				secondaryInfo={tour.name}
				quickActions={[
					{
						label: 'Save',
						icon: Save,
						onclick: handleSubmit,
						variant: 'primary',
						disabled: isSubmitting || conflicts.length > 0
					},
					{
						label: 'Delete',
						icon: Trash2,
						onclick: () => showDeleteConfirm = true,
						variant: 'secondary',
						disabled: isDeleting
					},
					{
						label: 'Cancel',
						icon: X,
						onclick: handleCancel,
						variant: 'secondary'
					}
				]}
				infoItems={[
					{
						icon: Calendar,
						label: 'Date',
						value: formData.date ? formatDate(formData.date) : 'Not set'
					},
					{
						icon: Clock,
						label: 'Duration',
						value: duration() > 0 ? formatDuration(duration()) : 'Not set'
					},
					{
						icon: Users,
						label: 'Bookings',
						value: `${currentSlot.bookedSpots}/${currentSlot.availableSpots}`
					},
					{
						icon: conflicts.length > 0 ? AlertCircle : CheckCircle,
						label: 'Status',
						value: conflicts.length > 0 ? 'Conflicts' : 'Ready'
					}
				]}
			/>
			
			<!-- Desktop Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title="Edit Time Slot"
					subtitle="Modify the time slot for {tour.name}"
					breadcrumbs={[
						{ label: 'Tours', href: '/tours' },
						{ label: tour.name, href: `/tours/${tourId}` },
						{ label: 'Schedule', href: `/tours/${tourId}/schedule` },
						{ label: 'Edit Slot' }
					]}
				>
					<button onclick={handleCancel} class="button-secondary button--gap mr-4">
						<ArrowLeft class="h-4 w-4" />
						Back to Schedule
					</button>
					<div class="flex gap-3">
						<button 
							onclick={() => showDeleteConfirm = true}
							disabled={isDeleting}
							class="button-danger button--gap"
						>
							{#if isDeleting}
								<Loader2 class="h-4 w-4 animate-spin" />
								Deleting...
							{:else}
								<Trash2 class="h-4 w-4" />
								Delete
							{/if}
						</button>
						<button onclick={handleCancel} class="button-secondary button--gap">
							<X class="h-4 w-4" />
							Cancel
						</button>
						<button 
							onclick={handleSubmit} 
							disabled={isSubmitting || conflicts.length > 0}
							class="button-primary button--gap"
						>
							{#if isSubmitting}
								<Loader2 class="h-4 w-4 animate-spin" />
								Saving...
							{:else}
								<Save class="h-4 w-4" />
								Save Changes
							{/if}
						</button>
					</div>
				</PageHeader>
			</div>
		</div>

		{#if error}
			<div class="mb-6 rounded-xl p-4" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-danger-600);" />
					<div>
						<p class="font-medium" style="color: var(--color-danger-900);">Error</p>
						<p class="text-sm mt-1" style="color: var(--color-danger-700);">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Bookings Warning -->
		{#if hasBookings}
			<div class="mb-6 rounded-xl p-4" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
				<div class="flex gap-3">
					<Info class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
					<div>
						<p class="font-medium" style="color: var(--color-warning-900);">This slot has active bookings</p>
						<p class="text-sm mt-1" style="color: var(--color-warning-700);">
							{currentSlot.bookedSpots} guest{currentSlot.bookedSpots === 1 ? '' : 's'} booked. 
							Changes may affect existing bookings. Consider notifying customers of any changes.
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Conflicts Warning -->
		{#if conflicts.length > 0}
			<div class="mb-6 rounded-xl p-4" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
					<div>
						<p class="font-medium" style="color: var(--color-warning-900);">Time Conflict Detected</p>
						<p class="text-sm mt-1" style="color: var(--color-warning-700);">
							This time slot would overlap with {conflicts.length} existing slot{conflicts.length === 1 ? '' : 's'}:
						</p>
						<ul class="text-sm mt-2 space-y-1" style="color: var(--color-warning-700);">
							{#each conflicts as conflict}
								<li>• {formatDate(conflict.startTime)} at {formatTime(conflict.startTime)} - {formatTime(conflict.endTime)}</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		{/if}

		<!-- Main Form -->
		<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-6" style="border-bottom: 1px solid var(--border-primary); background: var(--bg-secondary);">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
						<Calendar class="w-5 h-5 text-white" />
					</div>
					<div>
						<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Time Slot Details</h2>
						<p class="text-sm mt-1" style="color: var(--text-secondary);">
							Originally: {formatDate(currentSlot.startTime)} at {formatTime(currentSlot.startTime)} - {formatTime(currentSlot.endTime)}
						</p>
					</div>
				</div>
			</div>
			
			<div class="p-6 space-y-6">
				<!-- Date & Time -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label for="edit-date" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">Date *</label>
						<input
							id="edit-date"
							type="date"
							bind:value={formData.date}
							min={new Date().toISOString().split('T')[0]}
							class="form-input w-full"
							required
						/>
					</div>
					
					<div>
						<label for="edit-startTime" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">Start Time *</label>
						<select id="edit-startTime" bind:value={formData.startTime} class="form-select w-full" required>
							{#each generateTimeOptions() as time}
								<option value={time}>{time}</option>
							{/each}
						</select>
					</div>
					
					<div>
						<label for="edit-endTime" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">End Time *</label>
						<div class="flex gap-2">
							<select id="edit-endTime" bind:value={formData.endTime} class="form-select flex-1" required>
								{#each generateTimeOptions() as time}
									<option value={time}>{time}</option>
								{/each}
							</select>
							{#if tour.duration}
								<button
									type="button"
									onclick={getEndTimeFromDuration}
									class="button-secondary button--small button--icon"
									title="Use tour duration ({formatDuration(tour.duration)})"
								>
									<Clock class="h-4 w-4" />
								</button>
							{/if}
						</div>
						{#if duration() > 0}
							<p class="text-xs mt-1" style="color: var(--text-tertiary);">
								Duration: {formatDuration(duration())}
								{#if tour.duration && duration !== tour.duration}
									<span style="color: var(--color-warning-600);">
										(Tour default: {formatDuration(tour.duration)})
									</span>
								{/if}
							</p>
						{/if}
					</div>
				</div>

				<!-- Capacity & Status -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="edit-capacity" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">Capacity</label>
						<input
							id="edit-capacity"
							type="number"
							bind:value={formData.capacity}
							min={currentSlot.bookedSpots}
							max="100"
							class="form-input w-full"
							required
						/>
						<p class="text-xs mt-1" style="color: var(--text-tertiary);">
							{currentSlot.bookedSpots} already booked • Tour default: {tour.capacity} guests
						</p>
					</div>
					
					<div>
						<label for="edit-status" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">Status</label>
						<select id="edit-status" bind:value={formData.status} class="form-select w-full">
							<option value="available">Available</option>
							<option value="cancelled">Cancelled</option>
						</select>
						{#if formData.status === 'cancelled' && hasBookings}
							<p class="text-xs mt-1" style="color: var(--color-warning-600);">
								Cancelling will affect {currentSlot.bookedSpots} existing booking{currentSlot.bookedSpots === 1 ? '' : 's'}
							</p>
						{/if}
					</div>
				</div>

				<!-- Notes -->
				<div>
					<label for="edit-notes" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">Notes (Optional)</label>
					<textarea
						id="edit-notes"
						bind:value={formData.notes}
						rows="3"
						class="form-textarea w-full"
						placeholder="Any special notes for this time slot..."
					></textarea>
				</div>
			</div>
		</div>

		<!-- Delete Confirmation Modal -->
		{#if showDeleteConfirm}
			<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
				<div class="bg-white rounded-xl p-6 max-w-md w-full" style="background: var(--bg-primary);">
					<div class="flex items-center gap-3 mb-4">
						<div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
							<Trash2 class="w-5 h-5 text-red-600" />
						</div>
						<div>
							<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Delete Time Slot</h3>
							<p class="text-sm" style="color: var(--text-secondary);">This action cannot be undone</p>
						</div>
					</div>
					
					<div class="mb-6">
						<p class="text-sm" style="color: var(--text-secondary);">
							Are you sure you want to delete this time slot?
						</p>
						{#if hasBookings}
							<div class="mt-3 p-3 rounded-lg" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
								<p class="text-sm font-medium" style="color: var(--color-danger-900);">
									⚠️ This slot has {currentSlot.bookedSpots} active booking{currentSlot.bookedSpots === 1 ? '' : 's'}
								</p>
								<p class="text-xs mt-1" style="color: var(--color-danger-700);">
									Deleting will cancel all bookings. Consider notifying customers first.
								</p>
							</div>
						{/if}
					</div>
					
					<div class="flex gap-3">
						<button 
							onclick={() => showDeleteConfirm = false}
							class="button-secondary flex-1"
							disabled={isDeleting}
						>
							Cancel
						</button>
						<button 
							onclick={handleDelete}
							class="button-danger flex-1"
							disabled={isDeleting}
						>
							{#if isDeleting}
								<Loader2 class="h-4 w-4 animate-spin mr-2" />
								Deleting...
							{:else}
								Delete Slot
							{/if}
						</button>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div> 
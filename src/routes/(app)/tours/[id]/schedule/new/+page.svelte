<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatDate, formatTime } from '$lib/utils/date-helpers.js';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { invalidatePublicTourData } from '$lib/queries/public-queries.js';
	
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
	import Plus from 'lucide-svelte/icons/plus';
	import Copy from 'lucide-svelte/icons/copy';
	import Loader2 from 'lucide-svelte/icons/loader-2';

	// Get query client for invalidation
	const queryClient = useQueryClient();

	// Get data from load function
	let { data } = $props();
	let tourId = $derived(data.tourId);
	
	// Fetch tour details for smart defaults
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
	let existingSlots = $derived($scheduleQuery.data?.timeSlots || []);
	let isLoading = $derived($tourQuery.isLoading || $scheduleQuery.isLoading);

	// Form state
	let isSubmitting = $state(false);
	let showAdvanced = $state(false);
	let error = $state<string | null>(null);
	let conflicts = $state<any[]>([]);

	// Smart defaults based on tour
	let formData = $state({
		date: '',
		startTime: '10:00',
		endTime: '12:00',
		capacity: 0, // Will be set from tour data
		status: 'active' as 'active' | 'cancelled',
		notes: '',
		// Advanced options
		recurring: false,
		recurringType: 'weekly' as 'daily' | 'weekly' | 'monthly',
		recurringEnd: '',
		recurringCount: 1
	});

	// Set smart defaults when tour loads
	$effect(() => {
		if (tour && formData.capacity === 0) {
			formData.capacity = tour.capacity;
			
			// Set default end time based on tour duration
			if (tour.duration) {
				const start = new Date(`2000-01-01T${formData.startTime}:00`);
				const end = new Date(start.getTime() + tour.duration * 60000);
				formData.endTime = end.toTimeString().slice(0, 5);
			}
			
			// Set default date to tomorrow
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			formData.date = tomorrow.toISOString().split('T')[0];
		}
	});

	// Check for conflicts when date/time changes
	$effect(() => {
		if (formData.date && formData.startTime && formData.endTime && existingSlots.length > 0) {
			checkConflicts();
		}
	});

	function checkConflicts() {
		const newStart = new Date(`${formData.date}T${formData.startTime}:00`);
		const newEnd = new Date(`${formData.date}T${formData.endTime}:00`);
		
		conflicts = existingSlots.filter((slot: any) => {
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

	function copyFromExisting() {
		if (existingSlots.length === 0) return;
		
		// Copy from the most recent slot
		const recent = existingSlots[0];
		const recentStart = new Date(recent.startTime);
		const recentEnd = new Date(recent.endTime);
		
		formData.startTime = recentStart.toTimeString().slice(0, 5);
		formData.endTime = recentEnd.toTimeString().slice(0, 5);
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
			const response = await fetch(`/api/tours/${tourId}/schedule`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					startTime: start.toISOString(),
					endTime: end.toISOString(),
					recurringEnd: formData.recurringEnd ? new Date(formData.recurringEnd).toISOString() : null
				})
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to create time slot');
			}
			
			// Invalidate the schedule query so it refreshes immediately
			await queryClient.invalidateQueries({ queryKey: queryKeys.tourSchedule(tourId) });
			
			// Invalidate tours list since new slot affects upcomingSlots count
			await queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
			await queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
			
			// Invalidate public booking page cache since availability changed
			if (tour?.qrCode) {
				invalidatePublicTourData(queryClient, tour.qrCode);
			}
			
			// Redirect back to schedule with success flag
			goto(`/tours/${tourId}/schedule?slotCreated=true`);
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create time slot';
		} finally {
			isSubmitting = false;
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

	// Get suggested times based on existing slots
	let suggestedTimes = $derived(() => {
		if (existingSlots.length === 0) return [];
		
		const times = new Map();
		existingSlots.forEach((slot: any) => {
			const start = new Date(slot.startTime).toTimeString().slice(0, 5);
			const end = new Date(slot.endTime).toTimeString().slice(0, 5);
			const key = `${start}-${end}`;
			times.set(key, (times.get(key) || 0) + 1);
		});
		
		return Array.from(times.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 3)
			.map(([time]) => {
				const [start, end] = time.split('-');
				return { start, end };
			});
	});
</script>

<svelte:head>
	<title>Add Time Slot - {tour?.name || 'Tour'} | Zaur</title>
	<meta name="description" content="Create a new time slot for {tour?.name || 'your tour'}" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	{#if isLoading}
		<div class="p-8 text-center">
			<Loader2 class="w-8 h-8 mx-auto mb-2 animate-spin" style="color: var(--text-tertiary);" />
			<p class="text-sm" style="color: var(--text-secondary);">Loading tour details...</p>
		</div>
	{:else if !tour}
		<div class="mb-6 rounded-xl p-4" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium" style="color: var(--color-danger-900);">Tour not found</p>
					<p class="text-sm mt-1" style="color: var(--color-danger-700);">Please check the tour ID and try again.</p>
				</div>
				<button onclick={() => goto('/tours')} class="button-secondary button--small">
					Back to Tours
				</button>
			</div>
		</div>
	{:else}
		<!-- Header -->
		<div class="mb-6 sm:mb-8">
			<!-- Mobile Header -->
			<MobilePageHeader
				title="Add Time Slot"
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
						label: 'Capacity',
						value: `${formData.capacity} max`
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
					title="Add Time Slot"
					subtitle="Create a new available time for {tour.name}"
					breadcrumbs={[
						{ label: 'Tours', href: '/tours' },
						{ label: tour.name, href: `/tours/${tourId}` },
						{ label: 'Schedule', href: `/tours/${tourId}/schedule` },
						{ label: 'Add Slot' }
					]}
				>
					<button onclick={handleCancel} class="button-secondary button--gap mr-4">
						<ArrowLeft class="h-4 w-4" />
						Back to Schedule
					</button>
					<div class="flex gap-3">
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
								Creating...
							{:else}
								<Save class="h-4 w-4" />
								Create Time Slot
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

		<!-- Conflicts Warning -->
		{#if conflicts.length > 0}
			<div class="mb-6 rounded-xl p-4" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
					<div>
						<p class="font-medium" style="color: var(--color-warning-900);">Time Conflict Detected</p>
						<p class="text-sm mt-1" style="color: var(--color-warning-700);">
							This time slot overlaps with {conflicts.length} existing slot{conflicts.length === 1 ? '' : 's'}:
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

		<!-- Quick Suggestions -->
		{#if suggestedTimes().length > 0}
			<div class="mb-6 rounded-xl p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
				<h3 class="font-medium mb-3" style="color: var(--text-primary);">Popular Time Slots</h3>
				<div class="flex flex-wrap gap-2">
					{#each suggestedTimes() as suggestion}
						<button
							onclick={() => {
								formData.startTime = suggestion.start;
								formData.endTime = suggestion.end;
							}}
							class="px-3 py-1 text-sm rounded-lg border transition-colors hover:bg-blue-50 hover:border-blue-300"
							style="background: var(--bg-primary); border-color: var(--border-primary); color: var(--text-secondary);"
						>
							{suggestion.start} - {suggestion.end}
						</button>
					{/each}
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
						<p class="text-sm mt-1" style="color: var(--text-secondary);">Set the date, time, and capacity for this slot</p>
					</div>
				</div>
			</div>
			
			<div class="p-6 space-y-6">
				<!-- Date & Time -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label for="date" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">Date *</label>
						<input
							id="date"
							type="date"
							bind:value={formData.date}
							min={new Date().toISOString().split('T')[0]}
							class="form-input w-full"
							required
						/>
					</div>
					
					<div>
						<label for="startTime" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">Start Time *</label>
						<select id="startTime" bind:value={formData.startTime} class="form-select w-full" required>
							{#each generateTimeOptions() as time}
								<option value={time}>{time}</option>
							{/each}
						</select>
					</div>
					
					<div>
						<label for="endTime" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">End Time *</label>
						<div class="flex gap-2">
							<select id="endTime" bind:value={formData.endTime} class="form-select flex-1" required>
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
						<label for="capacity" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">Capacity</label>
						<input
							id="capacity"
							type="number"
							bind:value={formData.capacity}
							min="1"
							max="100"
							class="form-input w-full"
							required
						/>
						<p class="text-xs mt-1" style="color: var(--text-tertiary);">
							Tour default: {tour.capacity} guests
						</p>
					</div>
					
					<div>
						<label for="status" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">Status</label>
						<select id="status" bind:value={formData.status} class="form-select w-full">
							<option value="active">Active</option>
							<option value="cancelled">Cancelled</option>
						</select>
					</div>
				</div>

				<!-- Notes -->
				<div>
					<label for="notes" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">Notes (Optional)</label>
					<textarea
						id="notes"
						bind:value={formData.notes}
						rows="3"
						class="form-textarea w-full"
						placeholder="Any special notes for this time slot..."
					></textarea>
				</div>

				<!-- Advanced Options Toggle -->
				<div class="border-t pt-6" style="border-color: var(--border-primary);">
					<button
						type="button"
						onclick={() => showAdvanced = !showAdvanced}
						class="flex items-center gap-2 text-sm font-medium"
						style="color: var(--color-primary-600);"
					>
						<Plus class="h-4 w-4 transition-transform {showAdvanced ? 'rotate-45' : ''}" />
						Advanced Options
					</button>
				</div>

				<!-- Advanced Options -->
				{#if showAdvanced}
					<div class="space-y-4 p-4 rounded-lg" style="background: var(--bg-secondary);">
						<div class="flex items-center gap-3">
							<input
								type="checkbox"
								bind:checked={formData.recurring}
								id="recurring"
								class="form-checkbox"
							/>
							<label for="recurring" class="text-sm font-medium" style="color: var(--text-primary);">
								Create recurring time slots
							</label>
						</div>

						{#if formData.recurring}
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
								<div>
									<label for="recurringType" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">Repeat</label>
									<select id="recurringType" bind:value={formData.recurringType} class="form-select w-full">
										<option value="daily">Daily</option>
										<option value="weekly">Weekly</option>
										<option value="monthly">Monthly</option>
									</select>
								</div>
								
								<div>
									<label for="recurringEnd" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">Until</label>
									<input
										id="recurringEnd"
										type="date"
										bind:value={formData.recurringEnd}
										min={formData.date}
										class="form-input w-full"
									/>
								</div>
								
								<div>
									<label for="recurringCount" class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">Count</label>
									<input
										id="recurringCount"
										type="number"
										bind:value={formData.recurringCount}
										min="1"
										max="52"
										class="form-input w-full"
									/>
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Quick Actions -->
				{#if existingSlots.length > 0}
					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							onclick={copyFromExisting}
							class="button-secondary button--small button--gap"
						>
							<Copy class="h-4 w-4" />
							Copy from recent slot
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div> 
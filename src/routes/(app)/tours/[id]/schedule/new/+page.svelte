<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatDate, formatTime } from '$lib/utils/date-helpers.js';
	import { formatDuration } from '$lib/utils/tour-helpers-client.js';
	import { validateTourForm, getFieldError, hasFieldError, type ValidationError } from '$lib/validation.js';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { invalidatePublicTourData } from '$lib/queries/public-queries.js';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import NumberInput from '$lib/components/NumberInput.svelte';
	import DatePicker from '$lib/components/DatePicker.svelte';
	import TimePicker from '$lib/components/TimePicker.svelte';
	import InlineCalendar from '$lib/components/InlineCalendar.svelte';
	
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
	let validationErrors = $state<ValidationError[]>([]);
	let touchedFields = $state<Set<string>>(new Set());
	
	// Common time slots
	const timeSlots = [
		'08:00', '09:00', '10:00', '11:00', '12:00',
		'13:00', '14:00', '15:00', '16:00', '17:00',
		'18:00', '19:00', '20:00', '21:00'
	];

	// Smart defaults based on tour
	let formData = $state({
		date: '',
		startTime: '10:00',
		endTime: '12:00',
		capacity: 0, // Will be set from tour data
		availability: 'available' as 'available' | 'cancelled', // Changed from status to availability
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

	// Real-time field validation
	function validateField(fieldName: string) {
		touchedFields.add(fieldName);
		
		// Remove any existing errors for this field
		validationErrors = validationErrors.filter(error => error.field !== fieldName);
		
		// Validate specific field
		let fieldError: ValidationError | null = null;
		
		switch (fieldName) {
			case 'date':
				if (!formData.date) {
					fieldError = { field: 'date', message: 'Date is required' };
				}
				break;
			case 'startTime':
				if (!formData.startTime) {
					fieldError = { field: 'startTime', message: 'Start time is required' };
				}
				break;
			case 'endTime':
				if (!formData.endTime) {
					fieldError = { field: 'endTime', message: 'End time is required' };
				} else if (formData.startTime && formData.endTime <= formData.startTime) {
					fieldError = { field: 'endTime', message: 'End time must be after start time' };
				}
				break;
			case 'capacity':
				if (!formData.capacity || formData.capacity < 1) {
					fieldError = { field: 'capacity', message: 'Capacity must be at least 1' };
				} else if (formData.capacity > 500) {
					fieldError = { field: 'capacity', message: 'Capacity cannot exceed 500' };
				}
				break;
		}
		
		if (fieldError) {
			validationErrors = [...validationErrors, fieldError];
		}
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
		validateField('endTime');
	}

	function copyFromExisting() {
		if (existingSlots.length === 0) return;
		
		// Copy from the most recent slot
		const recent = existingSlots[0];
		const recentStart = new Date(recent.startTime);
		const recentEnd = new Date(recent.endTime);
		
		formData.startTime = recentStart.toTimeString().slice(0, 5);
		formData.endTime = recentEnd.toTimeString().slice(0, 5);
		
		// Validate after copying
		validateField('startTime');
		validateField('endTime');
	}

	async function handleSubmit() {
		if (isSubmitting) return;
		
		// Mark all required fields as touched
		touchedFields.add('date');
		touchedFields.add('startTime');
		touchedFields.add('endTime');
		touchedFields.add('capacity');
		
		// Validate all fields
		validateField('date');
		validateField('startTime');
		validateField('endTime');
		validateField('capacity');
		
		// Check for conflicts
		if (conflicts.length > 0) {
			error = 'Please resolve time conflicts before saving';
			scrollToFirstError();
			return;
		}
		
		// Check if there are validation errors
		if (validationErrors.length > 0) {
			error = 'Please correct the errors below';
			scrollToFirstError();
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
					status: formData.availability, // Map availability to status for API
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

	// Combine all errors
	let allErrors = $derived([...validationErrors]);

	// Mobile error handling - scroll to first error
	function scrollToFirstError() {
		if (typeof window === 'undefined') return;
		
		// Wait for DOM to update
		setTimeout(() => {
			const firstErrorField = document.querySelector('.form-input.error, .form-textarea.error, .form-select.error');
			if (firstErrorField) {
				// Scroll with some offset for mobile header
				const yOffset = -100; // Adjust based on your mobile header height
				const y = firstErrorField.getBoundingClientRect().top + window.pageYOffset + yOffset;
				window.scrollTo({ top: y, behavior: 'smooth' });
			}
		}, 100);
	}
</script>

<svelte:head>
	<title>Add Time Slot - {tour?.name || 'Tour'} | Zaur</title>
	<meta name="description" content="Create a new time slot for {tour?.name || 'your tour'}" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 lg:pb-8">
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
		<!-- Mobile Error Summary -->
		{#if allErrors.length > 0}
			<div class="lg:hidden mb-4 rounded-xl p-4" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
				<div class="flex items-center gap-3">
					<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0" />
					<div class="flex-1">
						<p class="font-medium text-sm" style="color: var(--color-error-900);">
							{allErrors.length} error{allErrors.length === 1 ? '' : 's'} to fix
						</p>
						<p class="text-xs mt-1" style="color: var(--color-error-700);">
							Tap an error to scroll to the field
						</p>
					</div>
				</div>
				<div class="mt-3 space-y-2">
					{#each allErrors as error}
						<button 
							type="button"
							onclick={() => {
								const field = document.getElementById(error.field);
								if (field) {
									field.focus();
									field.scrollIntoView({ behavior: 'smooth', block: 'center' });
								}
							}}
							class="block w-full text-left p-2 text-sm rounded border hover:bg-red-50"
							style="border-color: var(--color-error-200); color: var(--color-error-700);"
						>
							{error.message}
						</button>
					{/each}
				</div>
			</div>
		{/if}

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

		<!-- Conflicts Warning (smooth animation, no layout shift) -->
		<div class="mb-6 overflow-hidden transition-all duration-500 ease-out" style="max-height: {conflicts.length > 0 ? '200px' : '0'}; opacity: {conflicts.length > 0 ? '1' : '0'};">
			{#if conflicts.length > 0}
				<div class="rounded-xl p-4 transform transition-all duration-500 ease-out" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200); transform: translateY({conflicts.length > 0 ? '0' : '-10px'});">
					<div class="flex gap-3">
						<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5 transition-all duration-500 ease-out" style="color: var(--color-warning-600);" />
						<div>
							<p class="font-medium transition-all duration-500 ease-out" style="color: var(--color-warning-900);">Time Conflict Detected</p>
							<p class="text-sm mt-1 transition-all duration-500 ease-out" style="color: var(--color-warning-700);">
								This time slot overlaps with {conflicts.length} existing slot{conflicts.length === 1 ? '' : 's'}:
							</p>
							<ul class="text-sm mt-2 space-y-1 transition-all duration-500 ease-out" style="color: var(--color-warning-700);">
								{#each conflicts as conflict}
									<li>• {formatDate(conflict.startTime)} at {formatTime(conflict.startTime)} - {formatTime(conflict.endTime)}</li>
								{/each}
							</ul>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Main form content -->
			<div class="lg:col-span-2 space-y-8">
				<!-- Basic Information -->
				<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<h2 class="font-semibold" style="color: var(--text-primary);">Time Slot Details</h2>
						<p class="text-sm mt-1" style="color: var(--text-secondary);">Set the date, time, and capacity for this slot</p>
					</div>
					<div class="p-6 space-y-6">
						<!-- Date & Time Selection -->
						<div class="space-y-6">
							<!-- Mobile: Stacked layout -->
							<div class="md:hidden space-y-6">
								<div>
									<label class="form-label">Select Date</label>
									<InlineCalendar
										bind:value={formData.date}
										minDate={new Date().toISOString().split('T')[0]}
										onchange={() => validateField('date')}
									/>
									{#if getFieldError(allErrors, 'date')}
										<p class="form-error mt-2">{getFieldError(allErrors, 'date')}</p>
									{/if}
								</div>
								
								<div>
									<label class="form-label">Select Start Time</label>
									<div class="grid grid-cols-3 gap-2 mb-3">
										{#each timeSlots as time}
											<button
												type="button"
												onclick={() => {
													formData.startTime = time;
													getEndTimeFromDuration();
													validateField('startTime');
												}}
												class="px-3 py-2 text-sm rounded-lg border transition-all duration-200 hover:bg-gray-50 
													{formData.startTime === time ? 'ring-1 ring-blue-400 bg-blue-50 border-blue-300 font-medium' : ''}"
												style="border-color: var(--border-primary); color: var(--text-secondary);"
											>
												{time}
											</button>
										{/each}
									</div>
									
									<!-- Custom Time Inputs -->
									<div class="grid grid-cols-1 gap-2 mt-4">
										<TimePicker
											bind:value={formData.startTime}
											label="Or set custom start time"
											placeholder="Select start time"
											use24hour={true}
											onchange={() => {
												validateField('startTime');
												getEndTimeFromDuration();
											}}
											error={hasFieldError(allErrors, 'startTime')}
										/>
										<TimePicker
											bind:value={formData.endTime}
											label="Custom end time"
											placeholder="Select end time"
											use24hour={true}
											onchange={() => validateField('endTime')}
											error={hasFieldError(allErrors, 'endTime')}
										/>
									</div>
									
									{#if getFieldError(allErrors, 'startTime')}
										<p class="form-error">{getFieldError(allErrors, 'startTime')}</p>
									{/if}
								</div>
							</div>

							<!-- Desktop: Side-by-side layout -->
							<div class="hidden md:block">
								<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
									<div>
										<label class="form-label">Select Date</label>
										<InlineCalendar
											bind:value={formData.date}
											minDate={new Date().toISOString().split('T')[0]}
											onchange={() => validateField('date')}
										/>
										{#if getFieldError(allErrors, 'date')}
											<p class="form-error mt-2">{getFieldError(allErrors, 'date')}</p>
										{/if}
									</div>
									
									<div>
										<label class="form-label">Select Start Time</label>
										<div class="grid grid-cols-4 gap-2 mb-3">
											{#each timeSlots as time}
												<button
													type="button"
													onclick={() => {
														formData.startTime = time;
														getEndTimeFromDuration();
														validateField('startTime');
													}}
													class="px-3 py-2 text-sm rounded-lg border transition-all duration-200 hover:bg-gray-50 
														{formData.startTime === time ? 'ring-1 ring-blue-400 bg-blue-50 border-blue-300 font-medium' : ''}"
													style="border-color: var(--border-primary); color: var(--text-secondary);"
												>
													{time}
												</button>
											{/each}
										</div>
										
										<!-- Custom Time Inputs -->
										<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
											<TimePicker
												bind:value={formData.startTime}
												label="Or set custom start time"
												placeholder="Select start time"
												use24hour={true}
												onchange={() => {
													validateField('startTime');
													getEndTimeFromDuration();
												}}
												error={hasFieldError(allErrors, 'startTime')}
											/>
											<TimePicker
												bind:value={formData.endTime}
												label="Custom end time"
												placeholder="Select end time"
												use24hour={true}
												onchange={() => validateField('endTime')}
												error={hasFieldError(allErrors, 'endTime')}
											/>
										</div>
										
										{#if getFieldError(allErrors, 'startTime')}
											<p class="form-error">{getFieldError(allErrors, 'startTime')}</p>
										{/if}
									</div>
								</div>
							</div>
						</div>

						{#if formData.startTime}
							<div class="mt-4">
								<label class="form-label">End Time</label>
								<div class="p-4 rounded-lg" style="background: var(--bg-secondary);">
									<div class="flex items-center justify-between">
										<span class="text-sm" style="color: var(--text-secondary);">
											End time: <strong>{formData.endTime || '--:--'}</strong>
										</span>
										{#if duration() > 0}
											<span class="text-sm" style="color: var(--text-tertiary);">
												Duration: {formatDuration(duration())}
											</span>
										{/if}
									</div>
									{#if tour.duration && duration() !== tour.duration}
										<div class="mt-2 flex items-center justify-between">
											<span class="text-sm text-orange-600">
												Custom duration (default: {formatDuration(tour.duration)})
											</span>
											<button
												type="button"
												onclick={() => {
													getEndTimeFromDuration();
													validateField('endTime');
												}}
												class="text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
											>
												Reset to default
											</button>
										</div>
									{/if}
								</div>
							</div>
						{/if}
						{#if getFieldError(allErrors, 'endTime')}
							<p class="form-error">{getFieldError(allErrors, 'endTime')}</p>
						{/if}
					</div>
				</div>

				<!-- Capacity & Status -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
					<div>
						<NumberInput
							id="capacity"
							name="capacity"
							label="Max Capacity"
							bind:value={formData.capacity}
							min={1}
							max={500}
							step={1}
							placeholder="Enter capacity"
							incrementLabel="Increase capacity"
							decrementLabel="Decrease capacity"
							error={getFieldError(allErrors, 'capacity')}
							hasError={hasFieldError(allErrors, 'capacity')}
							integerOnly={true}
							onblur={() => validateField('capacity')}
						/>
						{#if tour.capacity && formData.capacity !== tour.capacity}
							<p class="text-sm mt-2 p-2 rounded" style="background: var(--bg-secondary); color: var(--text-secondary);">
								Tour default: {tour.capacity} guests
								<button
									type="button"
									onclick={() => {
										formData.capacity = tour.capacity;
										validateField('capacity');
									}}
									class="ml-2 text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
								>
									Use default
								</button>
							</p>
						{/if}
					</div>
					
					<div>
						<label for="availability" class="form-label">Availability</label>
						<select id="availability" bind:value={formData.availability} class="form-select w-full">
							<option value="available">Available for Booking</option>
							<option value="cancelled">Cancelled (Not Bookable)</option>
						</select>
						<p class="text-xs mt-1" style="color: var(--text-tertiary);">
							{formData.availability === 'available' ? 'Customers can book this time slot' : 'This time slot will not be visible to customers'}
						</p>
					</div>
				</div>

				<!-- Recurring Options -->
				<div class="border-t pt-4" style="border-color: var(--border-primary);">
					<button
						type="button"
						onclick={() => {
							showAdvanced = !showAdvanced;
							if (showAdvanced) {
								formData.recurring = true;
							} else {
								formData.recurring = false;
							}
						}}
						class="flex items-center justify-between w-full p-3 text-left rounded-lg border transition-colors"
						style="background: var(--bg-secondary); border-color: var(--border-primary);"
					>
						<span class="text-sm font-medium" style="color: var(--text-primary);">
							Recurring time slots
						</span>
						<div class="transform transition-transform {showAdvanced ? 'rotate-180' : ''}">
							<svg class="w-4 h-4" style="color: var(--text-secondary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
							</svg>
						</div>
					</button>

					{#if showAdvanced}
						<div class="mt-3 p-4 rounded-lg space-y-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
							<div class="space-y-4">
								<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div>
										<label for="recurringType" class="form-label">Repeat</label>
										<select id="recurringType" bind:value={formData.recurringType} class="form-select w-full">
											<option value="daily">Daily</option>
											<option value="weekly">Weekly</option>
											<option value="monthly">Monthly</option>
										</select>
									</div>
									
									<div>
										<DatePicker
											bind:value={formData.recurringEnd}
											label="Until"
											placeholder="Select end date"
											minDate={formData.date}
											onchange={() => {}}
										/>
									</div>
									
									<div>
										<NumberInput
											id="recurringCount"
											name="recurringCount"
											label="Count"
											bind:value={formData.recurringCount}
											min={1}
											max={52}
											step={1}
											placeholder="Number of slots"
											integerOnly={true}
										/>
									</div>
								</div>
								<div class="text-sm p-3 rounded-lg" style="background: var(--bg-secondary); color: var(--text-secondary);">
									<strong>Preview:</strong> This will create {formData.recurringCount} time slot{formData.recurringCount === 1 ? '' : 's'} 
									{formData.recurringType === 'daily' ? 'every day' : formData.recurringType === 'weekly' ? 'every week' : 'every month'} 
									starting from {formData.date || 'the selected date'}.
								</div>
							</div>

							{#if existingSlots.length > 0}
								<div class="pt-3 border-t" style="border-color: var(--border-primary);">
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
					{/if}
				</div>
			</div>

			<!-- Sidebar -->
			<div class="hidden lg:block space-y-6">
				<!-- Action Buttons -->
				<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="space-y-3">
						<button
							type="button"
							onclick={handleSubmit}
							disabled={isSubmitting || conflicts.length > 0}
							class="button-primary button--full-width button--gap"
						>
							{#if isSubmitting}
								<Loader2 class="w-4 h-4 animate-spin" />
								Creating...
							{:else}
								<Save class="w-4 h-4" />
								Create Time Slot
							{/if}
						</button>
						
						<button
							type="button"
							onclick={handleCancel}
							disabled={isSubmitting}
							class="button-secondary button--full-width"
						>
							Cancel
						</button>
					</div>
				</div>

				<!-- Form Progress -->
				<div class="rounded-xl p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
					<h3 class="font-medium mb-3" style="color: var(--text-primary);">Progress</h3>
					<div class="space-y-2">
						<div class="flex items-center gap-2 text-sm">
							{#if formData.date}
								<CheckCircle class="h-4 w-4 text-green-600" />
							{:else}
								<div class="h-4 w-4 rounded-full border-2 border-gray-300"></div>
							{/if}
							<span style="color: var(--text-secondary);">Date selected</span>
						</div>
						<div class="flex items-center gap-2 text-sm">
							{#if formData.startTime && formData.endTime && duration() > 0}
								<CheckCircle class="h-4 w-4 text-green-600" />
							{:else}
								<div class="h-4 w-4 rounded-full border-2 border-gray-300"></div>
							{/if}
							<span style="color: var(--text-secondary);">Time configured</span>
						</div>
						<div class="flex items-center gap-2 text-sm">
							{#if formData.capacity > 0}
								<CheckCircle class="h-4 w-4 text-green-600" />
							{:else}
								<div class="h-4 w-4 rounded-full border-2 border-gray-300"></div>
							{/if}
							<span style="color: var(--text-secondary);">Capacity set</span>
						</div>
						<div class="flex items-center gap-2 text-sm">
							{#if conflicts.length === 0}
								<CheckCircle class="h-4 w-4 text-green-600" />
							{:else}
								<AlertCircle class="h-4 w-4 text-red-600" />
							{/if}
							<span style="color: var(--text-secondary);">No conflicts</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Mobile Bottom Actions -->
			<div class="lg:hidden fixed bottom-0 left-0 right-0 p-4 z-10" style="background: var(--bg-primary); border-top: 1px solid var(--border-primary);">
				<div class="max-w-screen-2xl mx-auto flex gap-3">
					<button
						type="button"
						onclick={handleCancel}
						disabled={isSubmitting}
						class="button-secondary flex-1"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={handleSubmit}
						disabled={isSubmitting || conflicts.length > 0}
						class="button-primary flex-1 button--gap"
					>
						{#if isSubmitting}
							<Loader2 class="w-4 h-4 animate-spin" />
							Creating...
						{:else}
							<Save class="w-4 h-4" />
							Create
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

 
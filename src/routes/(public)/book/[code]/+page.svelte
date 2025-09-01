<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import type { TimeSlot } from '$lib/types.js';
	import { tourOwnerStore } from '$lib/stores/tourOwner.js';
	import { formatTourOwnerCurrency } from '$lib/utils/currency.js';
	import { getTourDisplayPriceFormattedWithCurrency } from '$lib/utils/tour-helpers-client.js';
	import { createPublicTourQuery, createTimeSlotAvailabilityQuery } from '$lib/queries/public-queries.js';
	import { 
		formatSlotDateTime,
		formatSlotTimeRange,
		getSlotAvailabilityText,
		getSlotStatusText,
		getSlotStatusColor,
		isSlotFull
	} from '$lib/utils/time-slot-client.js';
	import BookingCalendar from '$lib/components/BookingCalendar.svelte';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Check from 'lucide-svelte/icons/check';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Shield from 'lucide-svelte/icons/shield';
	import Info from 'lucide-svelte/icons/info';
	import X from 'lucide-svelte/icons/x';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import CalendarDays from 'lucide-svelte/icons/calendar-days';
	
	let { data, form }: { data: PageData; form: any } = $props();
	
	// Use TanStack Query for real-time data
	let tourQuery = $derived(createPublicTourQuery(data.qrCode, {
		refetchOnWindowFocus: true
	}));
	
	// Get data from TanStack Query
	let tour = $derived($tourQuery.data?.tour || null);
	let allTimeSlots = $derived($tourQuery.data?.timeSlots || []);
	let tourOwner = $derived($tourQuery.data?.tourOwner || null);
	let isLoading = $derived($tourQuery.isLoading);
	let queryError = $derived($tourQuery.error);
	
	// Prevent error flash during initial load
	let showError = $state(false);
	let showNotFound = $state(false);
	let errorTimeout: ReturnType<typeof setTimeout> | null = null;
	let notFoundTimeout: ReturnType<typeof setTimeout> | null = null;
	
	$effect(() => {
		// Handle error state
		if (queryError && !isLoading && !tour) {
			// Only show error after a brief delay to prevent flash
			if (errorTimeout) clearTimeout(errorTimeout);
			errorTimeout = setTimeout(() => {
				showError = true;
			}, 500); // 500ms delay
		} else {
			showError = false;
			if (errorTimeout) {
				clearTimeout(errorTimeout);
				errorTimeout = null;
			}
		}
		
		// Handle not found state
		if (!tour && !isLoading && !queryError) {
			// Only show not found after a brief delay to prevent flash
			if (notFoundTimeout) clearTimeout(notFoundTimeout);
			notFoundTimeout = setTimeout(() => {
				showNotFound = true;
			}, 500); // 500ms delay
		} else {
			showNotFound = false;
			if (notFoundTimeout) {
				clearTimeout(notFoundTimeout);
				notFoundTimeout = null;
			}
		}
		
		// Cleanup timeouts on component destroy
		return () => {
			if (errorTimeout) clearTimeout(errorTimeout);
			if (notFoundTimeout) clearTimeout(notFoundTimeout);
		};
	});
	
	// Set tour owner in store for header to use
	$effect(() => {
		if (tourOwner?.username && tourOwner?.name) {
			tourOwnerStore.set({
				username: tourOwner.username,
				name: tourOwner.name
			});
		}
		
		// Clean up when component is destroyed
		return () => {
			tourOwnerStore.set(null);
		};
	});
	
	// Booking form state
	let selectedTimeSlot = $state<TimeSlot | null>(null);
	let participants = $state(1);
	let adultParticipants = $state(1);
	let childParticipants = $state(0);
	let customerName = $state((form as any)?.customerName || '');
	let customerEmail = $state((form as any)?.customerEmail || '');
	let customerPhone = $state((form as any)?.customerPhone || '');
	let specialRequests = $state((form as any)?.specialRequests || '');
	let isSubmitting = $state(false);
	let showSuccess = $state(false);
	let error = $state<string | null>(null);
	
	// Tour image URL
	let imageUrl = $derived(tour?.images?.[0] ? 
		`/api/images/${tour.id}/${tour.images[0]}?size=large` : 
		null
	);
	
	// Process time slots from query
	let hasRealTimeSlots = $derived(allTimeSlots?.length > 0);
	
	// Calculate total price based on pricing model
	let totalPrice = $derived(() => {
		if (!tour) return 0;
		
		if (tour.enablePricingTiers && tour.pricingTiers) {
			// Pricing tiers enabled - calculate based on adult/child breakdown
			const adultPrice = parseFloat(tour.pricingTiers.adult) || 0;
			const childPrice = parseFloat(tour.pricingTiers.child) || 0;
			return (adultParticipants * adultPrice) + (childParticipants * childPrice);
		} else {
			// Single pricing - use traditional calculation
			return participants * parseFloat(tour.price);
		}
	});
	
	// Get the actual price value for display
	let displayPrice = $derived(totalPrice());
	
	// Total participant count for validation
	let totalParticipants = $derived(tour?.enablePricingTiers ? adultParticipants + childParticipants : participants);
	
	// Handle time slot selection from calendar
	function handleSlotSelect(slot: TimeSlot | null) {
		selectedTimeSlot = slot;
	}
	
	// Handle form errors
	$effect(() => {
		if (form?.error) {
			error = form.error;
		} else {
			error = null;
		}
	});
</script>

<style>
	.booking-summary {
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Smooth transitions for disabled states */
	.opacity-50 {
		transition: opacity 0.2s ease, filter 0.2s ease;
	}

	.pointer-events-none {
		filter: grayscale(0.2);
	}
</style>

<svelte:head>
	<title>Book {tour?.name || 'Tour'} - Zaur</title>
	<meta name="description" content="Book {tour?.name || 'this tour'} instantly with our secure QR booking system." />
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<div class="max-w-2xl mx-auto">
		{#if isLoading}
			<!-- Loading State -->
			<div class="flex items-center justify-center min-h-[400px]">
				<div class="text-center">
					<Loader2 class="w-12 h-12 animate-spin mx-auto mb-4" style="color: var(--color-primary-600);" />
					<p class="text-lg font-medium" style="color: var(--text-primary);">Loading tour details...</p>
					<p class="text-sm" style="color: var(--text-secondary);">Please wait while we fetch the latest information</p>
				</div>
			</div>
		{:else if showError && !tour}
			<!-- Error State - only show if not loading and no tour data -->
			<div class="flex items-center justify-center min-h-[400px]">
				<div class="text-center max-w-md mx-auto px-6">
					<AlertCircle class="w-16 h-16 mx-auto mb-4" style="color: var(--color-danger-600);" />
					<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Unable to Load Tour</h1>
					<p class="mb-4" style="color: var(--text-secondary);">
						{queryError?.message || 'There was an error loading the tour details. Please try again.'}
					</p>
					<button 
						onclick={() => $tourQuery.refetch()}
						class="button-primary"
					>
						Try Again
					</button>
				</div>
			</div>
		{:else if showNotFound && !tour}
			<!-- Tour Not Found - only show if not loading and no tour -->
			<div class="flex items-center justify-center min-h-[400px]">
				<div class="text-center max-w-md mx-auto px-6">
					<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Tour Not Found</h1>
					<p class="mb-4" style="color: var(--text-secondary);">This QR code could not be found or may be inactive.</p>
					<ul class="text-sm space-y-2 mb-6" style="color: var(--text-tertiary);">
						<li>• The QR code may have been deactivated</li>
						<li>• The tour may no longer be available</li>
						<li>• There may be a temporary issue</li>
					</ul>
				</div>
			</div>
		{:else if tour}
			<!-- Hero Section -->
			<div class="space-y-4">
				<!-- Tour Header Card -->
				<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					{#if imageUrl}
						<div class="h-48 sm:h-64" style="background: var(--bg-secondary);">
							<img 
								src={imageUrl} 
								alt={tour.name}
								class="w-full h-full object-cover"
								loading="lazy"
							/>
						</div>
					{/if}
					
					<div class="p-6">
						<h1 class="text-2xl font-semibold mb-3" style="color: var(--text-primary);">{tour.name}</h1>
						
						{#if tour.description}
							<p class="text-sm mb-4" style="color: var(--text-secondary);">{tour.description}</p>
						{/if}
						
						<!-- Tour Info Badges -->
						<div class="flex flex-wrap gap-3 mb-4">
							{#if tour.location}
								<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm" style="background: var(--bg-secondary);">
									<MapPin class="w-4 h-4" style="color: var(--text-tertiary);" />
									<span style="color: var(--text-primary);">{tour.location}</span>
								</div>
							{/if}
							<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm" style="background: var(--bg-secondary);">
								<Clock class="w-4 h-4" style="color: var(--text-tertiary);" />
								<span style="color: var(--text-primary);">
									{tour.duration ? `${Math.floor(tour.duration / 60)}h ${tour.duration % 60}m` : 'Duration TBD'}
								</span>
							</div>
						</div>
						
						<!-- Pricing Info -->
						<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
							<div class="text-sm">
								{#if tour.enablePricingTiers && tour.pricingTiers}
									{#if parseFloat(tour.pricingTiers.child) < parseFloat(tour.pricingTiers.adult)}
										<div class="grid grid-cols-2 gap-3">
											<div>
												<span style="color: var(--text-secondary);">Adults</span>
												<div class="font-semibold" style="color: var(--text-primary);">
													{formatTourOwnerCurrency(tour.pricingTiers.adult, tourOwner?.currency)}
												</div>
											</div>
											<div>
												<span style="color: var(--text-secondary);">Children</span>
												<div class="font-semibold" style="color: var(--text-primary);">
													{parseFloat(tour.pricingTiers.child) > 0 ? formatTourOwnerCurrency(tour.pricingTiers.child, tourOwner?.currency) : 'Free'}
												</div>
											</div>
										</div>
									{:else}
										<div class="flex justify-between items-center">
											<span style="color: var(--text-secondary);">Per person</span>
											<span class="font-semibold" style="color: var(--text-primary);">
												{formatTourOwnerCurrency(tour.pricingTiers.adult, tourOwner?.currency)}
											</span>
										</div>
									{/if}
								{:else}
									<div class="flex justify-between items-center">
										<span style="color: var(--text-secondary);">Per person</span>
										<span class="font-semibold" style="color: var(--text-primary);">
											{getTourDisplayPriceFormattedWithCurrency(tour, tourOwner?.currency)}
										</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
				
				<!-- Tour Details -->
				{#if (tour.includedItems && tour.includedItems.length > 0) || 
					 (tour.excludedItems && tour.excludedItems.length > 0) || 
					 (tour.requirements && tour.requirements.length > 0)}
					<div class="grid gap-4 sm:grid-cols-2">
						<!-- What's Included -->
						{#if tour.includedItems && tour.includedItems.length > 0}
							<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
								<div class="p-4 border-b" style="border-color: var(--border-primary);">
									<h3 class="font-semibold text-sm" style="color: var(--text-primary);">What's Included</h3>
								</div>
								<div class="p-4">
									<ul class="space-y-2">
										{#each tour.includedItems as item}
											<li class="flex items-start gap-2 text-sm" style="color: var(--text-secondary);">
												<Check class="w-4 h-4 mt-0.5 flex-shrink-0" style="color: var(--color-success-600);" />
												<span>{item}</span>
											</li>
										{/each}
									</ul>
								</div>
							</div>
						{/if}
						
						<!-- What's Not Included -->
						{#if tour.excludedItems && tour.excludedItems.length > 0}
							<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
								<div class="p-4 border-b" style="border-color: var(--border-primary);">
									<h3 class="font-semibold text-sm" style="color: var(--text-primary);">Not Included</h3>
								</div>
								<div class="p-4">
									<ul class="space-y-2">
										{#each tour.excludedItems as item}
											<li class="flex items-start gap-2 text-sm" style="color: var(--text-secondary);">
												<X class="w-4 h-4 mt-0.5 flex-shrink-0" style="color: var(--text-tertiary);" />
												<span>{item}</span>
											</li>
										{/each}
									</ul>
								</div>
							</div>
						{/if}
						
						<!-- Requirements -->
						{#if tour.requirements && tour.requirements.length > 0}
							<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
								<div class="p-4 border-b" style="border-color: var(--border-primary);">
									<h3 class="font-semibold text-sm" style="color: var(--text-primary);">Requirements</h3>
								</div>
								<div class="p-4">
									<ul class="space-y-2">
										{#each tour.requirements as requirement}
											<li class="flex items-start gap-2 text-sm" style="color: var(--text-secondary);">
												<Info class="w-4 h-4 mt-0.5 flex-shrink-0" style="color: var(--text-tertiary);" />
												<span>{requirement}</span>
											</li>
										{/each}
									</ul>
								</div>
							</div>
						{/if}
					</div>
				{/if}
				
				<!-- Tour Policies -->
				<div class="grid gap-4 sm:grid-cols-2">
					<!-- Cancellation Policy -->
					<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b" style="border-color: var(--border-primary);">
							<div class="flex items-center gap-2">
								<Shield class="w-4 h-4" style="color: var(--text-tertiary);" />
								<h3 class="font-semibold text-sm" style="color: var(--text-primary);">Cancellation Policy</h3>
							</div>
						</div>
						<div class="p-4">
							{#if tour.cancellationPolicy}
								<div class="text-sm space-y-1" style="color: var(--text-secondary);">
									{#each tour.cancellationPolicy.split('\n') as line}
										{#if line.trim()}
											<p>{line}</p>
										{/if}
									{/each}
								</div>
							{:else}
								<ul class="text-sm space-y-1" style="color: var(--text-secondary);">
									<li>• Free cancellation up to 24 hours before</li>
									<li>• 50% refund within 24 hours</li>
									<li>• No refund for no-shows</li>
								</ul>
							{/if}
						</div>
					</div>
					
					<!-- Important Information -->
					<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b" style="border-color: var(--border-primary);">
							<div class="flex items-center gap-2">
								<Info class="w-4 h-4" style="color: var(--text-tertiary);" />
								<h3 class="font-semibold text-sm" style="color: var(--text-primary);">Important Information</h3>
							</div>
						</div>
						<div class="p-4">
							<ul class="text-sm space-y-1" style="color: var(--text-secondary);">
								<li>• Meeting: {tour.location || 'Will be provided'}</li>
								{#if tour.minParticipants && tour.minParticipants > 1}
									<li>• Min. {tour.minParticipants} participants required</li>
								{/if}
								<li>• Duration: {tour.duration ? `${Math.floor(tour.duration / 60)}h ${tour.duration % 60}m` : 'See details'}</li>
								<li>• Arrive 10-15 minutes early</li>
							</ul>
						</div>
					</div>
				</div>
			
				<!-- Booking Form -->
				<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Book Your Tour</h2>
					</div>
					<div class="p-6">
					{#if showSuccess}
						<!-- Success Message -->
						<div class="mb-6 rounded-lg p-6 text-center" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
							<div class="flex justify-center mb-4">
								<div class="w-16 h-16 rounded-full flex items-center justify-center" style="background: var(--color-success-100);">
									<Check class="w-8 h-8" style="color: var(--color-success-600);" />
								</div>
							</div>
							<h3 class="text-lg font-semibold mb-2" style="color: var(--color-success-900);">Booking Successful!</h3>
							<p class="text-sm mb-4" style="color: var(--color-success-700);">
								Your booking has been submitted successfully. You will receive a confirmation email shortly.
							</p>
							{#if (form as any)?.bookingReference}
								<div class="rounded-lg p-3 mb-2" style="background: var(--bg-primary); border: 1px solid var(--color-success-300);">
									<p class="text-sm font-medium" style="color: var(--text-secondary);">Booking Reference</p>
									<p class="text-lg font-mono font-bold" style="color: var(--color-success-800);">{(form as any).bookingReference}</p>
								</div>
							{/if}
						</div>
					{:else}
						{#if error}
							<div class="mb-6 rounded-lg p-4" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
								<p class="text-sm" style="color: var(--color-danger-600);">{error}</p>
							</div>
						{/if}
						
						{#if !hasRealTimeSlots}
							<div class="mb-6 alert-warning rounded-lg p-6 text-center">
								<h3 class="text-lg font-semibold mb-2">No Available Time Slots</h3>
								<p class="text-sm">
									There are currently no time slots available for this tour. Please contact the tour guide directly for availability.
								</p>
							</div>
						{:else}
							<form method="POST" action="?/book" use:enhance={() => {
								isSubmitting = true;
								return async ({ result, update }) => {
									isSubmitting = false;
									
									if (result.type === 'redirect') {
										// Successful booking - redirect to payment
										goto(result.location);
									} else if (result.type === 'failure') {
										// Form validation errors
										await update();
									} else if (result.type === 'error') {
										// Server error  
										error = 'Failed to create booking. Please try again.';
									} else {
										// Default case
										await update();
									}
								};
							}} class="space-y-6">
								<!-- Hidden inputs for form data -->
								{#if selectedTimeSlot}
									<input type="hidden" name="timeSlotId" value={selectedTimeSlot.id} />
									<input type="hidden" name="availableSpots" value={selectedTimeSlot.availableSpots} />
									<input type="hidden" name="bookedSpots" value={selectedTimeSlot.bookedSpots || 0} />
									
									<!-- Participant data based on pricing model -->
									{#if tour.enablePricingTiers && tour.pricingTiers}
										<input type="hidden" name="totalParticipants" value={totalParticipants} />
										<input type="hidden" name="participantBreakdown" value={JSON.stringify({
											adults: adultParticipants,
											children: childParticipants
										})} />
									{:else}
										<input type="hidden" name="totalParticipants" value={participants} />
									{/if}
								{/if}
								
								<!-- Date & Time Selection -->
								<div>
									<div class="block text-sm font-medium mb-3" style="color: var(--text-primary);">
										Select Date & Time
									</div>
									<BookingCalendar 
										timeSlots={allTimeSlots || []}
										selectedSlot={selectedTimeSlot}
										onSlotSelect={handleSlotSelect}
										tour={tour}
										tourOwner={tourOwner}
									/>
								</div>
								
								<!-- Booking Summary -->
								{#if selectedTimeSlot}
									<div class="booking-summary rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
										<div class="flex items-center gap-2 mb-3">
											<CalendarDays class="w-4 h-4" style="color: var(--color-primary-600);" />
											<h3 class="font-semibold text-sm" style="color: var(--text-primary);">Your Selection</h3>
										</div>
										<div class="space-y-2">
											<div class="flex justify-between text-sm">
												<span style="color: var(--text-secondary);">Date</span>
												<span style="color: var(--text-primary);">
													{new Date(selectedTimeSlot.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
												</span>
											</div>
											<div class="flex justify-between text-sm">
												<span style="color: var(--text-secondary);">Time</span>
												<span style="color: var(--text-primary);">
													{formatSlotTimeRange(selectedTimeSlot.startTime, selectedTimeSlot.endTime)}
												</span>
											</div>
											{#if totalParticipants > 0}
												<div class="flex justify-between text-sm">
													<span style="color: var(--text-secondary);">Participants</span>
													<span style="color: var(--text-primary);">
														{totalParticipants} {totalParticipants === 1 ? 'person' : 'people'}
													</span>
												</div>
											{/if}
											{#if displayPrice > 0}
												<div class="pt-2 mt-2 border-t flex justify-between" style="border-color: var(--border-primary);">
													<span class="font-semibold text-sm" style="color: var(--text-primary);">Total</span>
													<span class="font-semibold" style="color: var(--color-primary-600);">
														{formatTourOwnerCurrency(displayPrice, tourOwner?.currency)}
													</span>
												</div>
											{/if}
										</div>
									</div>
								{/if}
								
								<!-- Participants -->
								<div class="space-y-4" class:opacity-50={!selectedTimeSlot} class:pointer-events-none={!selectedTimeSlot}>
									{#if !selectedTimeSlot}
										<div class="text-sm p-3 rounded-lg text-center" style="background: var(--bg-secondary); border: 2px dashed var(--border-primary); color: var(--text-secondary);">
											<span class="font-medium">👆 Select a time slot above to continue</span>
										</div>
									{/if}
								
									{#if selectedTimeSlot || !selectedTimeSlot}
									{#if tour.enablePricingTiers && tour.pricingTiers}
										<!-- Pricing Tiers: Adult/Child Selection -->
										<div class="space-y-4">
											<div class="text-sm font-medium" style="color: var(--text-primary);">Number of Participants</div>
											
											<div class="grid grid-cols-2 gap-4">
												<div>
													<label for="adultParticipants" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
														Adults ({formatTourOwnerCurrency(tour.pricingTiers.adult, tourOwner?.currency)} each)
													</label>
													<select
														id="adultParticipants"
														bind:value={adultParticipants}
														name="adultParticipants"
														class="form-select w-full"
														required
													>
														{#each Array.from({length: Math.min((selectedTimeSlot?.availableSpots || 10) - (selectedTimeSlot?.bookedSpots || 0), 10)}, (_, i) => i + 1) as num}
															<option value={num}>{num}</option>
														{/each}
													</select>
												</div>
												
												<div>
													<label for="childParticipants" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
														Children ({parseFloat(tour.pricingTiers.child) > 0 ? formatTourOwnerCurrency(tour.pricingTiers.child, tourOwner?.currency) + ' each' : 'Free'})
													</label>
													<select
														id="childParticipants"
														bind:value={childParticipants}
														name="childParticipants"
														class="form-select w-full"
													>
														{#each Array.from({length: Math.min((selectedTimeSlot?.availableSpots || 10) - (selectedTimeSlot?.bookedSpots || 0) - adultParticipants + 1, 11)}, (_, i) => i) as num}
															<option value={num}>{num}</option>
														{/each}
													</select>
												</div>
											</div>
											
											<div class="text-sm p-3 rounded-lg" style="background: var(--bg-secondary); color: var(--text-secondary);">
												Total: {totalParticipants} {totalParticipants === 1 ? 'person' : 'people'}
												{#if totalParticipants > ((selectedTimeSlot?.availableSpots || 10) - (selectedTimeSlot?.bookedSpots || 0))}
													<span class="font-medium" style="color: var(--color-danger-600);">
														• Exceeds available spots ({(selectedTimeSlot?.availableSpots || 10) - (selectedTimeSlot?.bookedSpots || 0)} remaining)
													</span>
												{/if}
											</div>
										</div>
									{:else}
										<!-- Single Pricing: Traditional Selection -->
										<div>
											<label for="participants" class="block text-sm font-medium mb-3" style="color: var(--text-primary);">
												Number of Participants
											</label>
											<select
												id="participants"
												bind:value={participants}
												name="participants"
												class="form-select w-full"
												required
											>
												{#each Array.from({length: Math.min((selectedTimeSlot?.availableSpots || 10) - (selectedTimeSlot?.bookedSpots || 0), 10)}, (_, i) => i + 1) as num}
													<option value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
												{/each}
											</select>
										</div>
									{/if}
								{/if}
								</div>
									
									<!-- Customer Information -->
									<div class="space-y-4" class:opacity-50={!selectedTimeSlot} class:pointer-events-none={!selectedTimeSlot}>
										{#if !selectedTimeSlot}
											<div class="text-sm p-3 rounded-lg text-center" style="background: var(--bg-secondary); border: 2px dashed var(--border-primary); color: var(--text-secondary);">
												<span class="font-medium">Complete the steps above first</span>
											</div>
										{/if}
									<div class="space-y-4">
										<div class="font-medium" style="color: var(--text-primary);">Your Information</div>
										
										<div>
											<label for="customerName" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
												Full Name *
											</label>
											<input
												id="customerName"
												type="text"
												bind:value={customerName}
												name="customerName"
												class="form-input w-full"
												required
											/>
										</div>
										
										<div>
											<label for="customerEmail" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
												Email Address *
											</label>
											<input
												id="customerEmail"
												type="email"
												bind:value={customerEmail}
												name="customerEmail"
												class="form-input w-full"
												required
											/>
										</div>
										
										<div>
											<label for="customerPhone" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
												Phone Number
											</label>
											<input
												id="customerPhone"
												type="tel"
												bind:value={customerPhone}
												name="customerPhone"
												class="form-input w-full"
											/>
										</div>
										
										<div>
											<label for="specialRequests" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
												Special Requests
											</label>
											<textarea
												id="specialRequests"
												bind:value={specialRequests}
												name="specialRequests"
												rows="3"
												class="form-textarea w-full"
												placeholder="Any special requirements or requests..."
											></textarea>
										</div>
									</div>
									</div>
									
									<!-- Total Price -->
									<div class="space-y-4" class:opacity-50={!selectedTimeSlot} class:pointer-events-none={!selectedTimeSlot}>
									<div class="border-t pt-4" style="border-color: var(--border-primary);">
										{#if tour.enablePricingTiers && tour.pricingTiers && (adultParticipants > 0 || childParticipants > 0)}
											<!-- Pricing Breakdown -->
											<div class="space-y-2 mb-3">
												{#if adultParticipants > 0}
													<div class="flex justify-between text-sm" style="color: var(--text-secondary);">
														<span>{adultParticipants} Adult{adultParticipants === 1 ? '' : 's'} × {formatTourOwnerCurrency(tour.pricingTiers.adult, tourOwner?.currency)}</span>
														<span>{formatTourOwnerCurrency(adultParticipants * parseFloat(tour.pricingTiers.adult), tourOwner?.currency)}</span>
													</div>
												{/if}
												{#if childParticipants > 0}
													<div class="flex justify-between text-sm" style="color: var(--text-secondary);">
														<span>{childParticipants} Child{childParticipants === 1 ? '' : 'ren'} × {parseFloat(tour.pricingTiers.child) > 0 ? formatTourOwnerCurrency(tour.pricingTiers.child, tourOwner?.currency) : 'Free'}</span>
														<span>{formatTourOwnerCurrency(childParticipants * parseFloat(tour.pricingTiers.child), tourOwner?.currency)}</span>
													</div>
												{/if}
											</div>
										{/if}
										
										<div class="flex justify-between items-center text-lg font-semibold">
											<span style="color: var(--text-primary);">Total Price</span>
											<span style="color: var(--color-primary-600);">{formatTourOwnerCurrency(displayPrice, tourOwner?.currency)}</span>
										</div>
									</div>
									</div>
									
									<!-- Submit Button -->
									<button
										type="submit"
										disabled={isSubmitting || !customerName || !customerEmail || !selectedTimeSlot || totalParticipants > ((selectedTimeSlot?.availableSpots || 0) - (selectedTimeSlot?.bookedSpots || 0)) || totalParticipants === 0}
										class="w-full button-primary"
									>
										{#if isSubmitting}
											<Loader2 class="w-4 h-4 animate-spin" />
											Processing...
										{:else}
											<ArrowRight class="w-4 h-4" />
											Continue to Payment • {formatTourOwnerCurrency(displayPrice, tourOwner?.currency)}
										{/if}
									</button>
							</form>
						{/if}
					{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div> 
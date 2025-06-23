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
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Check from 'lucide-svelte/icons/check';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	
	let { data, form }: { data: PageData; form: any } = $props();
	
	// Use TanStack Query for real-time data
	let tourQuery = $derived(createPublicTourQuery(data.qrCode, {
		refetchInterval: 30000, // 30 seconds
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
	let selectedDate = $state<string>('');
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
	let availableDates = $state<string[]>([]);
	let availableTimeSlots = $state<TimeSlot[]>([]);
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
	
	// Process available dates when time slots change
	$effect(() => {
		if (allTimeSlots && allTimeSlots.length > 0) {
			const now = new Date();
			// Only include dates that have future time slots
			const futureSlotsOnly = allTimeSlots.filter((slot: TimeSlot) => new Date(slot.startTime) > now);
			const dates = [...new Set(
				futureSlotsOnly.map((slot: TimeSlot) => slot.startTime.split('T')[0])
			)] as string[];
			availableDates = dates.sort();
			
			// If we have a selected date, reload slots for that date
			if (selectedDate && dates.includes(selectedDate)) {
				loadTimeSlotsForDate(selectedDate);
			}
		}
	});
	
	function selectDate(date: string) {
		selectedDate = date;
		selectedTimeSlot = null; // Reset time slot selection
		loadTimeSlotsForDate(date);
	}
	
	function loadTimeSlotsForDate(date: string) {
		const now = new Date();
		availableTimeSlots = allTimeSlots.filter((slot: TimeSlot) => 
			slot.startTime.startsWith(date) && 
			!isSlotFull(slot) &&
			new Date(slot.startTime) > now // Ensure slot is in the future
		).sort((a: TimeSlot, b: TimeSlot) => a.startTime.localeCompare(b.startTime));
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		});
	}
	
	function selectTimeSlot(slot: TimeSlot) {
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
			<div class="mb-6 rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				{#if imageUrl}
					<div class="h-64 sm:h-80" style="background: var(--bg-secondary);">
						<img 
							src={imageUrl} 
							alt={tour.name}
							class="w-full h-full object-cover"
							loading="lazy"
						/>
					</div>
				{/if}
				
				<div class="p-4 sm:p-6">
					<h1 class="text-2xl sm:text-3xl font-bold mb-2" style="color: var(--text-primary);">{tour.name}</h1>
					
					<div class="flex flex-wrap gap-4 text-sm mb-4" style="color: var(--text-secondary);">
						{#if tour.location}
							<span class="flex items-center gap-1">
								<MapPin class="w-4 h-4" />
								{tour.location}
							</span>
						{/if}
						<span class="flex items-center gap-1">
							<Clock class="w-4 h-4" />
							{tour.duration ? `${Math.floor(tour.duration / 60)}h ${tour.duration % 60}m` : 'Duration TBD'}
						</span>
						<span class="flex items-center gap-1">
							<Users class="w-4 h-4" />
							Max {tour.capacity} people
						</span>
						{#if tour.enablePricingTiers && tour.pricingTiers}
							<span class="flex items-center gap-1 font-semibold" style="color: var(--color-primary-600);">
								<DollarSign class="w-4 h-4" />
								Adults: {formatTourOwnerCurrency(tour.pricingTiers.adult, tourOwner?.currency)}
								{#if parseFloat(tour.pricingTiers.child) > 0}
									• Children: {formatTourOwnerCurrency(tour.pricingTiers.child, tourOwner?.currency)}
								{:else}
									• Children: Free
								{/if}
							</span>
						{:else}
							<span class="flex items-center gap-1 font-semibold" style="color: var(--color-primary-600);">
								<DollarSign class="w-4 h-4" />
								{getTourDisplayPriceFormattedWithCurrency(tour, tourOwner?.currency)} per person
							</span>
						{/if}
					</div>
					
					{#if tour.description}
						<p class="mb-4" style="color: var(--text-primary);">{tour.description}</p>
					{/if}
				</div>
			</div>
			
			<!-- Booking Form -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h2 class="font-semibold" style="color: var(--text-primary);">Book Your Tour</h2>
				</div>
				<div class="p-4 sm:p-6">
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
							<div class="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
								<h3 class="text-lg font-semibold text-amber-900 mb-2">No Available Time Slots</h3>
								<p class="text-sm text-amber-700">
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
								
								<!-- Date Selection -->
								<div>
									<label class="block text-sm font-medium mb-3" style="color: var(--text-primary);">
										Select Date
									</label>
									<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
										{#each availableDates as date}
											<button
												type="button"
												onclick={() => selectDate(date)}
												class="p-3 text-sm rounded-lg border text-center transition-colors"
												style="border-color: {selectedDate === date ? 'var(--color-primary-500)' : 'var(--border-primary)'}; background: {selectedDate === date ? 'var(--color-primary-50)' : 'transparent'}; color: {selectedDate === date ? 'var(--color-primary-900)' : 'var(--text-primary)'}"
												onmouseenter={(e) => {
													if (selectedDate !== date) {
														e.currentTarget.style.borderColor = 'var(--border-secondary)';
														e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
													}
												}}
												onmouseleave={(e) => {
													if (selectedDate !== date) {
														e.currentTarget.style.borderColor = 'var(--border-primary)';
														e.currentTarget.style.backgroundColor = 'transparent';
													}
												}}
											>
												{formatDate(date)}
											</button>
										{/each}
									</div>
								</div>
								
								<!-- Time Slot Selection -->
								{#if selectedDate}
									<div>
										<label class="block text-sm font-medium mb-3" style="color: var(--text-primary);">
											Select Time
										</label>
										<div class="space-y-2 max-h-48 overflow-y-auto">
											{#each availableTimeSlots as slot}
												<button
													type="button"
													onclick={() => selectTimeSlot(slot)}
													class="w-full p-4 text-left rounded-lg border transition-colors"
													style="border-color: {selectedTimeSlot?.id === slot.id ? 'var(--color-primary-500)' : 'var(--border-primary)'}; background: {selectedTimeSlot?.id === slot.id ? 'var(--color-primary-50)' : 'transparent'}"
													onmouseenter={(e) => {
														if (selectedTimeSlot?.id !== slot.id) {
															e.currentTarget.style.borderColor = 'var(--border-secondary)';
															e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
														}
													}}
													onmouseleave={(e) => {
														if (selectedTimeSlot?.id !== slot.id) {
															e.currentTarget.style.borderColor = 'var(--border-primary)';
															e.currentTarget.style.backgroundColor = 'transparent';
														}
													}}
												>
													<div class="flex justify-between items-center">
														<div>
															<p class="font-medium" style="color: var(--text-primary);">
																{formatSlotTimeRange(slot.startTime, slot.endTime)}
															</p>
															<p class="text-sm" style="color: var(--text-secondary);">
																{getSlotAvailabilityText(slot)}
															</p>
														</div>
														<div class="text-right">
															{#if tour.enablePricingTiers && tour.pricingTiers}
																<p class="text-xs font-medium" style="color: var(--color-primary-600);">
																	Adults: {formatTourOwnerCurrency(tour.pricingTiers.adult, tourOwner?.currency)}
																</p>
																{#if parseFloat(tour.pricingTiers.child) > 0}
																	<p class="text-xs" style="color: var(--color-primary-600);">
																		Children: {formatTourOwnerCurrency(tour.pricingTiers.child, tourOwner?.currency)}
																	</p>
																{:else}
																	<p class="text-xs" style="color: var(--color-primary-600);">
																		Children: Free
																	</p>
																{/if}
															{:else}
																<p class="text-sm font-medium" style="color: var(--color-primary-600);">
																	{getTourDisplayPriceFormattedWithCurrency(tour, tourOwner?.currency)}
																</p>
															{/if}
														</div>
													</div>
												</button>
											{/each}
										</div>
									</div>
								{/if}
								
								<!-- Participants -->
								{#if selectedTimeSlot}
									{#if tour.enablePricingTiers && tour.pricingTiers}
										<!-- Pricing Tiers: Adult/Child Selection -->
										<div class="space-y-4">
											<h3 class="text-sm font-medium" style="color: var(--text-primary);">Number of Participants</h3>
											
											<div class="grid grid-cols-2 gap-4">
												<div>
													<label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
														Adults ({formatTourOwnerCurrency(tour.pricingTiers.adult, tourOwner?.currency)} each)
													</label>
													<select
														bind:value={adultParticipants}
														name="adultParticipants"
														class="form-select w-full"
														required
													>
														{#each Array.from({length: Math.min(selectedTimeSlot.availableSpots - selectedTimeSlot.bookedSpots, 10)}, (_, i) => i + 1) as num}
															<option value={num}>{num}</option>
														{/each}
													</select>
												</div>
												
												<div>
													<label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
														Children ({parseFloat(tour.pricingTiers.child) > 0 ? formatTourOwnerCurrency(tour.pricingTiers.child, tourOwner?.currency) + ' each' : 'Free'})
													</label>
													<select
														bind:value={childParticipants}
														name="childParticipants"
														class="form-select w-full"
													>
														{#each Array.from({length: Math.min(selectedTimeSlot.availableSpots - selectedTimeSlot.bookedSpots - adultParticipants + 1, 11)}, (_, i) => i) as num}
															<option value={num}>{num}</option>
														{/each}
													</select>
												</div>
											</div>
											
											<div class="text-sm p-3 rounded-lg" style="background: var(--bg-secondary); color: var(--text-secondary);">
												Total: {totalParticipants} {totalParticipants === 1 ? 'person' : 'people'}
												{#if totalParticipants > (selectedTimeSlot.availableSpots - selectedTimeSlot.bookedSpots)}
													<span class="font-medium" style="color: var(--color-danger-600);">
														• Exceeds available spots ({selectedTimeSlot.availableSpots - selectedTimeSlot.bookedSpots} remaining)
													</span>
												{/if}
											</div>
										</div>
									{:else}
										<!-- Single Pricing: Traditional Selection -->
										<div>
											<label class="block text-sm font-medium mb-3" style="color: var(--text-primary);">
												Number of Participants
											</label>
											<select
												bind:value={participants}
												name="participants"
												class="form-select w-full"
												required
											>
												{#each Array.from({length: Math.min(selectedTimeSlot.availableSpots - selectedTimeSlot.bookedSpots, 10)}, (_, i) => i + 1) as num}
													<option value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
												{/each}
											</select>
										</div>
									{/if}
								{/if}
									
									<!-- Customer Information -->
									<div class="space-y-4">
										<h3 class="font-medium" style="color: var(--text-primary);">Your Information</h3>
										
										<div>
											<label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
												Full Name *
											</label>
											<input
												type="text"
												bind:value={customerName}
												name="customerName"
												class="form-input w-full"
												required
											/>
										</div>
										
										<div>
											<label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
												Email Address *
											</label>
											<input
												type="email"
												bind:value={customerEmail}
												name="customerEmail"
												class="form-input w-full"
												required
											/>
										</div>
										
										<div>
											<label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
												Phone Number
											</label>
											<input
												type="tel"
												bind:value={customerPhone}
												name="customerPhone"
												class="form-input w-full"
											/>
										</div>
										
										<div>
											<label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
												Special Requests
											</label>
											<textarea
												bind:value={specialRequests}
												name="specialRequests"
												rows="3"
												class="form-textarea w-full"
												placeholder="Any special requirements or requests..."
											></textarea>
										</div>
									</div>
									
									<!-- Total Price -->
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
									
									<!-- Submit Button -->
									<button
										type="submit"
										disabled={isSubmitting || !customerName || !customerEmail || !selectedTimeSlot || totalParticipants > (selectedTimeSlot.availableSpots - selectedTimeSlot.bookedSpots) || totalParticipants === 0}
										class="w-full button-primary button--gap justify-center py-4 text-base"
									>
										{#if isSubmitting}
											<Loader2 class="w-5 h-5 animate-spin" />
											Processing...
										{:else}
											<ChevronRight class="w-5 h-5" />
											Book Now - {formatTourOwnerCurrency(displayPrice, tourOwner?.currency)}
										{/if}
									</button>
							</form>
						{/if}
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div> 
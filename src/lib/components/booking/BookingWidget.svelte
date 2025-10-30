<script lang="ts">
	import type { Tour, TimeSlot } from '$lib/types.js';
	import type { BookingPriceResult } from '$lib/utils/pricing-calculations.js';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { formatTourOwnerCurrency } from '$lib/utils/currency.js';
	import { getTourDisplayPriceFormattedWithCurrency } from '$lib/utils/tour-helpers-client.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import BookingCalendar from '$lib/components/BookingCalendar.svelte';
	import ParticipantCategorySelector from '$lib/components/booking/ParticipantCategorySelector.svelte';
	import AddonSelector from '$lib/components/booking/AddonSelector.svelte';
	import PriceBreakdown from '$lib/components/booking/PriceBreakdown.svelte';
	import CompactWeatherDisplay from '$lib/components/booking/CompactWeatherDisplay.svelte';
	import Check from 'lucide-svelte/icons/check';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Info from 'lucide-svelte/icons/info';
	import { slide } from 'svelte/transition';
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import { themeStore } from '$lib/stores/theme.js';
	import { isKeyboardVisible } from '$lib/stores/keyboard.js';
	
	// Get current theme for conditional styling
	let currentTheme = $state<string>('light');
	$effect(() => {
		if (browser) {
			const unsubscribe = themeStore.subscribe((theme) => {
				currentTheme = theme;
			});
			return () => unsubscribe();
		}
	});
	
	interface TourOwnerWithCurrency {
		username?: string;
		name?: string;
		currency?: string;
	}
	
	interface Props {
		tour: Tour;
		tourOwner: TourOwnerWithCurrency | null | undefined;
		allTimeSlots: TimeSlot[] | undefined;
		hasRealTimeSlots: boolean;
		form: any;
		
		// Bindings for parent state
		selectedTimeSlot: TimeSlot | null;
		participants: number;
		adultParticipants: number;
		childParticipants: number;
		participantCounts: Record<string, number>;
		isPrivateTour: boolean;
		selectedAddonIds: string[];
		customerName: string;
		customerEmail: string;
		customerPhone: string;
		specialRequests: string;
		error: string | null;
		showSuccess: boolean;
		
		// Callbacks
		onSlotSelect: (slot: TimeSlot | null) => void;
		totalParticipants: number;
		priceCalculation: BookingPriceResult | any;
		tourCoordinates?: { lat: number; lng: number } | null;
	}
	
	let { 
		tour,
		tourOwner,
		allTimeSlots,
		hasRealTimeSlots,
		form,
		selectedTimeSlot = $bindable(),
		participants = $bindable(),
		adultParticipants = $bindable(),
		childParticipants = $bindable(),
		participantCounts = $bindable(),
		isPrivateTour = $bindable(),
		selectedAddonIds = $bindable(),
		customerName = $bindable(),
		customerEmail = $bindable(),
		customerPhone = $bindable(),
		specialRequests = $bindable(),
		error = $bindable(),
		showSuccess = $bindable(),
		onSlotSelect,
		totalParticipants,
		priceCalculation,
		tourCoordinates = null
	}: Props = $props();
	
	let isSubmitting = $state(false);
	
	// Validate contact information
	let isContactInfoValid = $derived(
		customerName.trim().length > 0 && 
		customerEmail.trim().length > 0 && 
		customerEmail.includes('@')
	);
	
	// Track if user is actively changing time slot (to prevent auto-scroll)
	let isChangingTimeSlot = $state(false);
	
	// Track which steps have been shown (once shown, keep them visible)
	let hasShownStep2 = $state(false);
	let hasShownStep3 = $state(false);
	
	// Update tracking when steps should appear
	$effect(() => {
		if (selectedTimeSlot || (typeof totalParticipants === 'number' && totalParticipants > 0)) {
			hasShownStep2 = true;
		}
		const addons = tour.optionalAddons?.addons;
		if (typeof totalParticipants === 'number' && totalParticipants > 0 && addons && addons.length > 0) {
			hasShownStep3 = true;
		}
	});
	
	// Smooth scroll to next step when it becomes active (mobile only)
	let previousStepState = $state<{slot: boolean, participants: boolean}>({
		slot: false,
		participants: false
	});
	
	// Add flag to prevent rapid re-execution
	let isScrolling = $state(false);
	
	$effect(() => {
		if (!browser || window.innerWidth > 640 || isScrolling) return;
		
		const hasSlot = !!selectedTimeSlot;
		const hasParticipants = typeof totalParticipants === 'number' && totalParticipants > 0;
		
		// Only proceed if state actually changed
		if (hasSlot === previousStepState.slot && hasParticipants === previousStepState.participants) {
			return;
		}
		
		let scrollTriggered = false;
		
		// When time slot is selected, scroll to participants step (but not if user is just changing)
		if (hasSlot && !previousStepState.slot && !isChangingTimeSlot) {
			scrollTriggered = true;
			isScrolling = true;
			// Wait for DOM to update AND transitions to complete
			tick().then(() => {
				// Longer wait for both the calendar collapse and step 2 to appear
				setTimeout(() => {
					const step2 = document.querySelector('.booking-step[data-step="2"]') as HTMLElement;
					if (step2) {
						const yOffset = -120; // More space above for comfortable viewing
						const y = step2.getBoundingClientRect().top + window.scrollY + yOffset;
						
						// Slower, more deliberate scroll using scrollTo with custom timing
						const startY = window.scrollY;
						const distance = y - startY;
						const duration = 800; // Slower: 800ms instead of browser default ~500ms
						let start: number | null = null;
						
						function scrollStep(timestamp: number) {
							if (!start) start = timestamp;
							const progress = Math.min((timestamp - start) / duration, 1);
							// Ease-out-cubic for smoother deceleration
							const easing = 1 - Math.pow(1 - progress, 3);
							window.scrollTo(0, startY + distance * easing);
							
							if (progress < 1) {
								requestAnimationFrame(scrollStep);
							} else {
								// Scroll complete, reset flag after a delay
								setTimeout(() => { isScrolling = false; }, 100);
							}
						}
						
						requestAnimationFrame(scrollStep);
					} else {
						isScrolling = false;
					}
				}, 500); // Wait for slide transitions (300ms) + buffer
			}).catch(err => {
				console.error('Scroll animation error:', err);
				isScrolling = false;
			});
		}
		
		// When participants are selected, scroll to contact info
		if (hasParticipants && !previousStepState.participants && hasSlot) {
			scrollTriggered = true;
			isScrolling = true;
			tick().then(() => {
				setTimeout(() => {
					const contactSection = document.querySelector('.contact-info-section') as HTMLElement;
					if (contactSection) {
						const yOffset = -100;
						const y = contactSection.getBoundingClientRect().top + window.scrollY + yOffset;
						
						// Slower scroll for contact section too
						const startY = window.scrollY;
						const distance = y - startY;
						const duration = 700;
						let start: number | null = null;
						
						function scrollStep(timestamp: number) {
							if (!start) start = timestamp;
							const progress = Math.min((timestamp - start) / duration, 1);
							const easing = 1 - Math.pow(1 - progress, 3);
							window.scrollTo(0, startY + distance * easing);
							
							if (progress < 1) {
								requestAnimationFrame(scrollStep);
							} else {
								// Scroll complete, reset flag after a delay
								setTimeout(() => { isScrolling = false; }, 100);
							}
						}
						
						requestAnimationFrame(scrollStep);
					} else {
						isScrolling = false;
					}
				}, 200);
			}).catch(err => {
				console.error('Scroll animation error:', err);
				isScrolling = false;
			});
		}
		
		// Update state tracking
		previousStepState = { slot: hasSlot, participants: hasParticipants };
		
		// If no scroll was triggered, reset the flag immediately
		if (!scrollTriggered) {
			isScrolling = false;
		}
	});
	
	// Ensure infant category is available if countInfantsTowardCapacity is enabled
	let categoriesForBooking = $derived.by(() => {
		if (!tour.participantCategories?.categories) return [];
		
		const categories = [...tour.participantCategories.categories];
		
		// Check if infant category exists
		const hasInfant = categories.some(c => 
			c.id === 'infant' || c.label.toLowerCase().includes('infant') || c.label.toLowerCase().includes('baby')
		);
		
		// If countInfantsTowardCapacity is explicitly true (checked) and no infant category exists, add one
		// Note: We check === true to ensure it was explicitly enabled, not just undefined
		if (tour.countInfantsTowardCapacity === true && !hasInfant) {
			console.log('🍼 Auto-adding infant category to booking page (countInfantsTowardCapacity is enabled)');
			categories.push({
				id: 'infant',
				label: 'Infant (0-2)',
				price: 0,
				minAge: 0,
				maxAge: 2,
				sortOrder: categories.length,
				countsTowardCapacity: true
			});
		}
		
		return categories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
	});
</script>

<div class="booking-widget">
	<!-- Enhanced Pricing Header -->
	<div class="widget-header">
		<h2 class="widget-title">Book This Experience</h2>
		
		<!-- Price Display -->
		<div class="space-y-3">
			{#if tour.pricingModel === 'private_tour' && tour.privateTour}
				<div>
					<div class="text-2xl font-bold" style="color: var(--text-primary);">
						{formatTourOwnerCurrency(tour.privateTour.flatPrice, tourOwner?.currency)}
					</div>
					<div class="text-sm" style="color: var(--text-secondary);">Flat rate per tour</div>
				</div>
			{:else if tour.pricingModel === 'participant_categories' && tour.participantCategories}
				<!-- Show all category prices -->
				<div class="space-y-2">
					{#each tour.participantCategories.categories as cat}
						<div class="flex justify-between items-center">
							<span class="text-sm" style="color: var(--text-secondary);">
								{cat.label.replace(/\s*\([\d\-+]+\)/, '')}
							</span>
							<span class="font-semibold" style="color: var(--text-primary);">
								{cat.price > 0 ? formatTourOwnerCurrency(cat.price, tourOwner?.currency) : 'Free'}
							</span>
						</div>
					{/each}
				</div>
			{:else if tour.enablePricingTiers && tour.pricingTiers}
				<!-- Adult/Child Pricing -->
				<div class="space-y-2">
					<div class="flex justify-between items-center">
						<span class="text-sm" style="color: var(--text-secondary);">Adult</span>
						<span class="font-semibold" style="color: var(--text-primary);">
							{formatTourOwnerCurrency(tour.pricingTiers.adult, tourOwner?.currency)}
						</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm" style="color: var(--text-secondary);">Child</span>
						<span class="font-semibold" style="color: var(--text-primary);">
							{tour.pricingTiers.child && parseFloat(String(tour.pricingTiers.child)) > 0 
								? formatTourOwnerCurrency(tour.pricingTiers.child, tourOwner?.currency) 
								: 'Free'}
						</span>
					</div>
				</div>
			{:else}
				<!-- Simple per-person -->
				<div>
					<div class="text-2xl font-bold" style="color: var(--text-primary);">
						{getTourDisplayPriceFormattedWithCurrency(tour, tourOwner?.currency)}
					</div>
					<div class="text-sm" style="color: var(--text-secondary);">per person</div>
				</div>
			{/if}
		</div>
	</div>
	
	<div class="widget-body">
		{#if showSuccess}
			<!-- Success Message -->
			<div class="rounded-lg p-4 text-center" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
				<Check class="w-8 h-8 mx-auto mb-2" style="color: var(--color-success-600);" />
				<h3 class="font-semibold mb-1" style="color: var(--color-success-900);">Booking Successful!</h3>
				<p class="text-sm" style="color: var(--color-success-700);">
					Check your email for confirmation.
				</p>
				{#if form?.bookingReference}
					<div class="mt-3 font-mono text-sm" style="color: var(--color-success-800);">
						Ref: {form.bookingReference}
					</div>
				{/if}
			</div>
		{:else}
			{#if error}
				<div class="mb-4 rounded-lg p-3" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
					<p class="text-sm" style="color: var(--color-danger-600);">{error}</p>
				</div>
			{/if}
			
		{#if !hasRealTimeSlots}
			<div class="no-slots-banner">
				<Info class="icon" />
				<h3 class="title">No Available Slots</h3>
				<p class="description">Contact the guide for availability.</p>
			</div>
			{:else}
				<form id={`booking-form-${tour.id}`} method="POST" action="?/book" use:enhance={() => {
					isSubmitting = true;
					return async ({ result, update }) => {
						isSubmitting = false;
						
						if (result.type === 'redirect') {
							goto(result.location);
						} else if (result.type === 'failure') {
							await update();
						} else if (result.type === 'error') {
							error = 'Failed to create booking. Please try again.';
						} else {
							await update();
						}
					};
				}} class="space-y-4">
					<!-- Hidden inputs for form data -->
					{#if selectedTimeSlot}
						<input type="hidden" name="timeSlotId" value={selectedTimeSlot.id} />
						<input type="hidden" name="availableSpots" value={selectedTimeSlot.availableSpots} />
						<input type="hidden" name="bookedSpots" value={selectedTimeSlot.bookedSpots || 0} />
						
						<!-- Participant data based on pricing model -->
						{#if tour.pricingModel === 'participant_categories' && participantCounts}
							<input type="hidden" name="totalParticipants" value={totalParticipants} />
							<input type="hidden" name="participantsByCategory" value={JSON.stringify(participantCounts)} />
						{:else if tour.enablePricingTiers && tour.pricingTiers}
							<input type="hidden" name="totalParticipants" value={totalParticipants} />
							<input type="hidden" name="participantBreakdown" value={JSON.stringify({
								adults: adultParticipants,
								children: childParticipants
							})} />
						{:else}
							<input type="hidden" name="totalParticipants" value={participants} />
						{/if}
					{/if}
					
				<!-- Step 1: Date & Time Selection -->
				<div class="booking-step" class:active={!selectedTimeSlot} class:completed={selectedTimeSlot} data-step="1">
					<div class="step-number">{selectedTimeSlot ? '✓' : '1'}</div>
					<div>
						<h3 class="font-medium mb-2" style="color: var(--text-primary);">
							{selectedTimeSlot ? 'Selected Date & Time' : 'Select Date & Time'}
						</h3>
						{#if selectedTimeSlot}
							<div class="p-3 rounded-lg" style="background: var(--bg-secondary);" transition:slide={{ duration: 300 }}>
								<div class="flex items-start justify-between">
									<div class="text-sm flex-1">
										<div class="flex items-center gap-2 flex-wrap">
											<span style="color: var(--text-primary);">
												{new Date(selectedTimeSlot.startTime).toLocaleDateString('en-US', { 
													weekday: 'short', 
													month: 'short', 
													day: 'numeric' 
												})}
											</span>
											<!-- Compact Weather Display (inline after date) -->
											{#if tourCoordinates}
												<CompactWeatherDisplay
													coordinates={tourCoordinates}
													tourDateTime={new Date(selectedTimeSlot.startTime)}
												/>
											{/if}
										</div>
										<div class="mt-0.5" style="color: var(--text-secondary);">
											{formatSlotTimeRange(selectedTimeSlot.startTime, selectedTimeSlot.endTime)}
										</div>
									</div>
					<button 
						type="button"
						onclick={() => {
							isChangingTimeSlot = true;
							onSlotSelect(null);
							// Reset the flag after transitions complete
							setTimeout(() => {
								isChangingTimeSlot = false;
							}, 400);
						}}
						class="button-text flex-shrink-0 ml-3"
						style="color: var(--color-accent-600);"
					>
						Change
					</button>
								</div>
							</div>
						{:else}
							<div transition:slide={{ duration: 300 }}>
								<BookingCalendar 
									timeSlots={allTimeSlots || []}
									selectedSlot={selectedTimeSlot}
									onSlotSelect={onSlotSelect}
									tour={tour}
									tourOwner={tourOwner}
									class="in-widget"
								/>
							</div>
						{/if}
					</div>
				</div>
					
			<!-- Step 2: Participants -->
			<!-- Once shown, keep visible permanently -->
			{#if hasShownStep2}
				<div class="booking-step" class:active={selectedTimeSlot && totalParticipants === 0} class:completed={selectedTimeSlot && totalParticipants > 0} data-step="2">
					<div class="step-number">{totalParticipants > 0 ? '✓' : '2'}</div>
							<div>
								<h3 class="font-medium mb-2" style="color: var(--text-primary);">
									{totalParticipants > 0 ? 'Selected Participants' : 'Select Participants'}
								</h3>
								
								{#if tour.pricingModel === 'private_tour' && tour.privateTour}
									<!-- Private Tour -->
									{@const minCap = tour.privateTour.minCapacity ?? tour.minCapacity ?? 4}
									{@const maxCap = tour.privateTour.maxCapacity ?? tour.maxCapacity ?? 12}
									<div class="space-y-3">
										<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
											<div class="text-sm font-medium mb-1" style="color: var(--text-primary);">
												Private Tour - {formatTourOwnerCurrency(tour.privateTour.flatPrice, tourOwner?.currency)}
											</div>
											<div class="text-xs" style="color: var(--text-secondary);">
												Flat rate for {minCap}-{maxCap} people
											</div>
										</div>
										
										<select
											bind:value={participants}
											name="participants"
											class="form-select w-full"
											required
										>
											<option value="" disabled>Select group size</option>
											{#each Array.from({length: maxCap - minCap + 1}, (_, i) => minCap + i) as num}
												<option value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
											{/each}
										</select>
									</div>
								{:else if tour.pricingModel === 'participant_categories' && tour.participantCategories}
									<!-- Participant Categories (with auto-added infant if needed) -->
									<ParticipantCategorySelector
										categories={categoriesForBooking}
										bind:participantCounts
										availableSpots={(selectedTimeSlot?.availableSpots || 10) - (selectedTimeSlot?.bookedSpots || 0)}
										currencySymbol={tourOwner?.currency === 'PLN' ? 'zł' : tourOwner?.currency === 'EUR' ? '€' : '$'}
										onCountsChange={(counts) => {
											participantCounts = counts;
											participants = Object.values(counts).reduce((sum, count) => sum + count, 0);
										}}
									/>
								{:else if tour.enablePricingTiers && tour.pricingTiers}
									<!-- Adult/Child Pricing -->
									{@const minParticipants = tour.minCapacity || 1}
									{@const maxAvailable = Math.min(10, (selectedTimeSlot?.availableSpots || 10) - (selectedTimeSlot?.bookedSpots || 0))}
									<div class="space-y-3">
										<div class="grid grid-cols-2 gap-2 sm:gap-3">
											<div>
												<label for="adultSelect" class="block text-xs font-medium mb-1" style="color: var(--text-secondary);">
													Adults • {formatTourOwnerCurrency(tour.pricingTiers.adult, tourOwner?.currency)}
												</label>
												<select
													id="adultSelect"
													bind:value={adultParticipants}
													class="form-select w-full"
													required
												>
													{#each Array.from({length: Math.max(1, maxAvailable)}, (_, i) => i + 1) as num}
														<option value={num}>{num}</option>
													{/each}
												</select>
											</div>
											<div>
												<label for="childSelect" class="block text-xs font-medium mb-1" style="color: var(--text-secondary);">
													Children • {tour.pricingTiers.child && parseFloat(String(tour.pricingTiers.child)) > 0 ? formatTourOwnerCurrency(tour.pricingTiers.child, tourOwner?.currency) : 'Free'}
												</label>
												<select
													id="childSelect"
													bind:value={childParticipants}
													class="form-select w-full"
												>
													{#each Array.from({length: Math.max(0, maxAvailable - adultParticipants) + 1}, (_, i) => i) as num}
														<option value={num}>{num}</option>
													{/each}
												</select>
											</div>
										</div>
										{#if minParticipants > 1}
											<div class="text-xs" style="color: var(--text-tertiary);">
												Minimum {minParticipants} total participants required
											</div>
										{/if}
									</div>
								{:else}
									<!-- Simple Per-Person Pricing -->
									{@const minParticipants = tour.minCapacity || 1}
									{@const maxAvailable = Math.min(20, (selectedTimeSlot?.availableSpots || 10) - (selectedTimeSlot?.bookedSpots || 0))}
									{@const maxParticipants = Math.max(minParticipants, maxAvailable)}
									<div>
										<select
											bind:value={participants}
											name="participants"
											class="form-select w-full"
											required
										>
											<option value="" disabled>Select number of participants</option>
											{#each Array.from({length: maxParticipants - minParticipants + 1}, (_, i) => minParticipants + i) as num}
												<option value={num}>
													{num} {num === 1 ? 'person' : 'people'} • {formatTourOwnerCurrency(parseFloat(tour.price) * num, tourOwner?.currency)}
												</option>
											{/each}
										</select>
										{#if minParticipants > 1}
											<div class="text-xs mt-1" style="color: var(--text-tertiary);">
												Minimum {minParticipants} participants required
											</div>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					{/if}
					
			<!-- Step 3: Add-ons (if available) -->
			<!-- Once shown, keep visible permanently -->
			{#if hasShownStep3 && tour.optionalAddons?.addons && tour.optionalAddons.addons.length > 0}
				<div class="booking-step" class:completed={selectedTimeSlot && totalParticipants > 0 && selectedAddonIds.length > 0} data-step="3">
					<div class="step-number">{selectedAddonIds.length > 0 ? '✓' : '3'}</div>
							<div>
								<h3 class="font-medium mb-2" style="color: var(--text-primary);">
									Optional Add-ons
								</h3>
								<AddonSelector
									addons={tour.optionalAddons.addons}
									bind:selectedAddonIds
									currencySymbol={tourOwner?.currency === 'PLN' ? 'zł' : tourOwner?.currency === 'EUR' ? '€' : '$'}
									onAddonsChange={(ids) => { selectedAddonIds = ids; }}
								/>
							</div>
						</div>
					{/if}
					
					<!-- Price Summary -->
					{#if selectedTimeSlot && totalParticipants > 0}
						<div class="mt-4 p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
							<PriceBreakdown
								{tour}
								participants={totalParticipants}
								{participantCounts}
								{selectedAddonIds}
								isPrivateTour={tour.pricingModel === 'private_tour' && isPrivateTour}
								currencySymbol={tourOwner?.currency === 'PLN' ? 'zł' : tourOwner?.currency === 'EUR' ? '€' : '$'}
								currency={tourOwner?.currency || 'EUR'}
							/>
						</div>
					{/if}
					
					<!-- Customer Information -->
					{#if selectedTimeSlot && totalParticipants > 0}
					<div class="space-y-3 pt-4 border-t contact-info-section" style="border-color: var(--border-primary);">
						<h3 class="text-sm font-medium" style="color: var(--text-primary);">
							Contact Information
							<span class="text-xs font-normal" style="color: var(--text-tertiary);">*Required</span>
						</h3>
							
							<div>
								<label for="customerName" class="block text-xs font-medium mb-1" style="color: var(--text-secondary);">
									Full Name <span style="color: var(--color-error-600);">*</span>
								</label>
								<input
									id="customerName"
									type="text"
									name="customerName"
									bind:value={customerName}
									placeholder="Enter your full name"
									class="form-input w-full"
									required
								/>
							</div>
							
							<div>
								<label for="customerEmail" class="block text-xs font-medium mb-1" style="color: var(--text-secondary);">
									Email <span style="color: var(--color-error-600);">*</span>
								</label>
								<input
									id="customerEmail"
									type="email"
									name="customerEmail"
									bind:value={customerEmail}
									placeholder="your@email.com"
									class="form-input w-full"
									required
								/>
							</div>
							
							<div>
								<label for="customerPhone" class="block text-xs font-medium mb-1" style="color: var(--text-secondary);">
									Phone (Optional)
								</label>
								<input
									id="customerPhone"
									type="tel"
									name="customerPhone"
									bind:value={customerPhone}
									placeholder="+1 234 567 8900"
									class="form-input w-full"
								/>
							</div>
							
							<div>
								<label for="specialRequests" class="block text-xs font-medium mb-1" style="color: var(--text-secondary);">
									Special Requests (Optional)
								</label>
								<textarea
									id="specialRequests"
									name="specialRequests"
									bind:value={specialRequests}
									placeholder="Any special requirements or questions..."
									rows="2"
									class="form-input w-full text-sm"
								></textarea>
							</div>
						</div>
					{/if}
					
					<!-- Submit Button -->
					{#if selectedTimeSlot && totalParticipants > 0}
						{@const displayPrice = priceCalculation?.totalAmount || 0}
						<button
							type="submit"
							disabled={isSubmitting || !selectedTimeSlot || totalParticipants === 0 || !isContactInfoValid}
							class="button-primary w-full mt-4 flex items-center justify-center gap-2"
						>
							{#if isSubmitting}
								<Loader2 class="w-4 h-4 animate-spin" />
								Processing...
							{:else if displayPrice === 0}
								<CheckCircle class="w-4 h-4" />
								Confirm Free Booking
							{:else}
								<ArrowRight class="w-4 h-4" />
								Book Now • {formatTourOwnerCurrency(displayPrice, tourOwner?.currency)}
							{/if}
						</button>
					{/if}
				</form>
			{/if}
		{/if}
	</div>
	
	<!-- Mobile sticky booking footer (shown only when booking form is ready) -->
	{#if selectedTimeSlot && totalParticipants > 0 && !showSuccess}
		{@const displayPrice = priceCalculation?.totalAmount || 0}
		<div class="mobile-sticky-footer" class:keyboard-hidden={$isKeyboardVisible} style="-webkit-backface-visibility: hidden;">
			<div class="mobile-footer-content">
				<div class="mobile-price-summary">
					<div class="mobile-price-label">Total</div>
					<div class="mobile-price-amount">
						{displayPrice === 0 ? 'Free' : formatTourOwnerCurrency(displayPrice, tourOwner?.currency)}
					</div>
				</div>
				<button
					type="submit"
					form={`booking-form-${tour.id}`}
					disabled={isSubmitting || !isContactInfoValid}
					class="mobile-book-button"
					class:dark-mode={currentTheme === 'dark'}
				>
					{#if isSubmitting}
						<Loader2 class="w-4 h-4 animate-spin" />
					{:else}
						Book Now
					{/if}
				</button>
			</div>
			<div class="mobile-footer-branding">
				<a href="/" class="powered-by-link">Powered by Zaur</a>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Enhanced Widget Design */
	.booking-widget {
		background: var(--bg-primary);
		border-radius: 1.25rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
		overflow: hidden;
		border: 1px solid var(--border-primary);
		transition: all 0.3s ease;
		position: relative;
	}
	
	/* Only apply hover shadow on desktop (pointer devices) */
	@media (hover: hover) and (pointer: fine) {
		.booking-widget:hover {
			box-shadow: 0 25px 50px rgba(0, 0, 0, 0.12);
		}
	}
	
	.widget-header {
		padding: 2rem;
		background: linear-gradient(to bottom, var(--bg-secondary), var(--bg-primary));
		border-bottom: 1px solid var(--border-primary);
		border-radius: 1.25rem 1.25rem 0 0;
		overflow: hidden;
	}
	
	.widget-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		text-align: center;
	}
	
	.widget-body {
		padding: 1.5rem;
		overflow: visible;
	}
	
	/* Booking flow steps */
	.booking-step {
		padding: 1.5rem 1.5rem 1.5rem 2.5rem;
		border-radius: 0.75rem;
		background: var(--bg-secondary);
		margin-bottom: 1rem;
		position: relative;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		overflow: visible;
		will-change: transform, opacity;
	}
	
	.booking-step.completed {
		background: var(--color-success-50);
		border: 1px solid var(--color-success-200);
	}
	
	:global([data-theme="dark"]) .booking-step.completed {
		background: var(--color-success-100);
		border-color: var(--color-success-200);
	}
	
	.booking-step.active {
		background: var(--bg-primary);
		border: 2px solid var(--color-accent-500);
		box-shadow: var(--shadow-md);
	}
	
	:global([data-theme="dark"]) .booking-step.active {
		border-color: var(--color-accent-600);
		background: var(--bg-secondary);
	}
	
	.step-number {
		position: absolute;
		top: 1.5rem;
		left: -1rem;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--text-secondary);
		z-index: 2;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	.booking-step.active .step-number {
		background: var(--color-accent-600);
		color: white;
		border-color: var(--color-accent-600);
	}
	
	.booking-step.completed .step-number {
		background: var(--color-success-600);
		color: white;
		border-color: var(--color-success-600);
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.booking-widget {
			border-radius: 0;
			box-shadow: none;
			border: none;
			border-top: 1px solid var(--border-primary);
			margin: 0 -1rem;
		}

		.widget-header {
			padding: 1.5rem 1rem;
			background: var(--bg-primary);
			position: sticky;
			top: 0;
			z-index: 10;
			border-bottom: 2px solid var(--border-primary);
		}
		
		.widget-title {
			font-size: 1.125rem;
			margin-bottom: 1rem;
		}
		
		.widget-body {
			padding: 1rem;
		}

		.booking-step {
			padding: 1rem 1rem 1rem 2rem;
			margin-bottom: 0.75rem;
			border-radius: 0.5rem;
		}

		.step-number {
			left: -0.75rem;
			width: 1.5rem;
			height: 1.5rem;
			font-size: 0.75rem;
		}
		
		/* Price display in header */
		.widget-header .space-y-3 {
			gap: 0.5rem;
		}
		
		/* Make form inputs more mobile-friendly */
		.form-input, .form-select {
			font-size: 16px; /* Prevent zoom on iOS */
		}
	}

	/* No Available Slots Banner */
	.no-slots-banner {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 2rem 1.5rem;
		background: var(--color-warning-50, #fffbeb);
		border: 1px solid var(--color-warning-200, #fde68a);
		border-radius: 0.5rem;
		gap: 0.5rem;
	}

	.no-slots-banner :global(.icon) {
		width: 2rem;
		height: 2rem;
		color: var(--color-warning-600, #d97706);
		flex-shrink: 0;
	}

	.no-slots-banner .title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #1f2937);
	}

	.no-slots-banner .description {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary, #6b7280);
	}
	
	/* Mobile sticky footer */
	.mobile-sticky-footer {
		display: none;
	}
	
	@media (max-width: 640px) {
		.mobile-sticky-footer {
			display: flex;
			flex-direction: column;
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			z-index: 9999;
			background: var(--bg-primary);
			backdrop-filter: blur(10px);
			-webkit-backdrop-filter: blur(10px);
			border-top: 1px solid var(--border-primary);
			box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
			/* iOS Safari viewport fixes */
			transform: translate3d(0, 0, 0);
			-webkit-transform: translate3d(0, 0, 0);
			backface-visibility: hidden;
			-webkit-backface-visibility: hidden;
			/* Force GPU acceleration */
			will-change: transform;
			/* Ensure footer is always on top */
			contain: layout style;
			/* Smooth transitions for keyboard hiding */
			transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out;
		}
		
		/* iOS Safari specific fixes */
		@supports (-webkit-touch-callout: none) {
			.mobile-sticky-footer {
				/* Ensure bottom is always at viewport bottom */
				bottom: 0 !important;
				/* Prevent iOS bounce effect from affecting position */
				transform: translate3d(0, 0, 0);
				-webkit-transform: translate3d(0, 0, 0);
			}
		}
		
		/* Hide sticky footer when mobile keyboard is visible */
		.mobile-sticky-footer.keyboard-hidden {
			transform: translate3d(0, 100%, 0);
			-webkit-transform: translate3d(0, 100%, 0);
			opacity: 0;
			pointer-events: none;
		}
		
		.mobile-footer-content {
			display: flex;
			padding: 1rem;
			gap: 1rem;
			align-items: center;
		}
		
		.mobile-footer-branding {
			padding: 0.5rem 1rem;
			border-top: 1px solid var(--border-primary);
			text-align: center;
			background: var(--bg-secondary);
		}
		
		.powered-by-link {
			display: inline-block;
			font-size: 0.625rem;
			color: var(--text-tertiary);
			text-decoration: none !important;
			opacity: 0.7;
			transition: opacity var(--transition-base) ease;
		}
		
		/* Remove any global link underline styles */
		.powered-by-link::after {
			display: none !important;
		}
		
		.powered-by-link:hover {
			opacity: 1;
			color: var(--text-secondary);
			text-decoration: none !important;
		}
		
		.mobile-price-summary {
			flex: 1;
		}
		
		.mobile-price-label {
			font-size: 0.75rem;
			color: var(--text-tertiary);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		
		.mobile-price-amount {
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--text-primary);
		}
		
		.mobile-book-button {
			padding: 0.875rem 2rem;
			background: var(--color-primary-600);
			color: white;
			border: none;
			border-radius: 2rem;
			font-weight: 600;
			font-size: 1rem;
			cursor: pointer;
			transition: all 0.2s ease;
			display: flex;
			align-items: center;
			gap: 0.5rem;
		}
		
		.mobile-book-button.dark-mode {
			background: var(--color-primary-500);
			box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15);
		}
		
		.mobile-book-button:disabled {
			background: var(--color-gray-300) !important;
			color: var(--text-tertiary) !important;
			cursor: not-allowed;
			box-shadow: none !important;
		}
		
		.mobile-book-button.dark-mode:disabled {
			background: var(--color-gray-600) !important;
			color: var(--color-gray-400) !important;
		}
		
		.mobile-book-button:not(:disabled):active {
			transform: scale(0.98);
		}
		
		.mobile-book-button.dark-mode:not(:disabled):active {
			background: var(--color-primary-400);
		}
	}
	
	@media (max-width: 640px) {
		
		/* Hide desktop submit button on mobile when sticky footer is shown */
		.booking-widget:has(.mobile-sticky-footer) .button-primary.w-full {
			display: none;
		}
		
		/* Add padding to account for sticky footer */
		.booking-widget {
			padding-bottom: 1rem;
			/* iOS Safari scroll fix */
			-webkit-overflow-scrolling: touch;
		}
		
		/* Add extra padding when sticky footer is shown to prevent content overlap */
		.booking-widget:has(.mobile-sticky-footer) {
			padding-bottom: calc(6rem + env(safe-area-inset-bottom, 0));
		}
	}
</style>


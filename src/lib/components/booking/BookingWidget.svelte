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
	import Check from 'lucide-svelte/icons/check';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Info from 'lucide-svelte/icons/info';
	
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
		totalParticipants: () => number;
		priceCalculation: () => BookingPriceResult | any;
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
		priceCalculation
	}: Props = $props();
	
	let isSubmitting = $state(false);
	
	// Validate contact information
	let isContactInfoValid = $derived(
		customerName.trim().length > 0 && 
		customerEmail.trim().length > 0 && 
		customerEmail.includes('@')
	);
	
	// Ensure infant category is available if countInfantsTowardCapacity is enabled
	let categoriesForBooking = $derived(() => {
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

<div class="booking-widget rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	<!-- Pricing Header -->
	<div class="p-6 border-b" style="border-color: var(--border-primary);">
		<h2 class="text-lg font-semibold mb-3" style="color: var(--text-primary);">Book This Tour</h2>
		
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
	
	<div class="p-6">
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
				<form method="POST" action="?/book" use:enhance={() => {
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
							<input type="hidden" name="totalParticipants" value={totalParticipants()} />
							<input type="hidden" name="participantsByCategory" value={JSON.stringify(participantCounts)} />
						{:else if tour.enablePricingTiers && tour.pricingTiers}
							<input type="hidden" name="totalParticipants" value={totalParticipants()} />
							<input type="hidden" name="participantBreakdown" value={JSON.stringify({
								adults: adultParticipants,
								children: childParticipants
							})} />
						{:else}
							<input type="hidden" name="totalParticipants" value={participants} />
						{/if}
					{/if}
					
					<!-- Step 1: Date & Time Selection -->
					<div class="booking-step" class:active={!selectedTimeSlot} class:completed={selectedTimeSlot}>
						<div class="step-number">{selectedTimeSlot ? '✓' : '1'}</div>
						<div class="ml-4">
							<h3 class="font-medium mb-2" style="color: var(--text-primary);">
								{selectedTimeSlot ? 'Selected Date & Time' : 'Select Date & Time'}
							</h3>
							{#if selectedTimeSlot}
								<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-secondary);">
									<div class="text-sm">
										<div style="color: var(--text-primary);">
											{new Date(selectedTimeSlot.startTime).toLocaleDateString('en-US', { 
												weekday: 'short', 
												month: 'short', 
												day: 'numeric' 
											})}
										</div>
										<div style="color: var(--text-secondary);">
											{formatSlotTimeRange(selectedTimeSlot.startTime, selectedTimeSlot.endTime)}
										</div>
									</div>
									<button 
										type="button"
										onclick={() => onSlotSelect(null)}
										class="text-sm underline"
										style="color: var(--color-primary-600);"
									>
										Change
									</button>
								</div>
							{:else}
								<BookingCalendar 
									timeSlots={allTimeSlots || []}
									selectedSlot={selectedTimeSlot}
									onSlotSelect={onSlotSelect}
									tour={tour}
									tourOwner={tourOwner}
								/>
							{/if}
						</div>
					</div>
					
					<!-- Step 2: Participants -->
					{#if selectedTimeSlot}
						<div class="booking-step" class:active={selectedTimeSlot && totalParticipants() === 0} class:completed={totalParticipants() > 0}>
							<div class="step-number">{totalParticipants() > 0 ? '✓' : '2'}</div>
							<div class="ml-4">
								<h3 class="font-medium mb-2" style="color: var(--text-primary);">
									{totalParticipants() > 0 ? 'Selected Participants' : 'Select Participants'}
								</h3>
								
								{#if tour.pricingModel === 'private_tour' && tour.privateTour}
									<!-- Private Tour -->
									{@const minCap = tour.privateTour?.minCapacity || tour.minCapacity || 4}
									{@const maxCap = tour.privateTour?.maxCapacity || tour.maxCapacity || 12}
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
										categories={categoriesForBooking()}
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
													{#each Array.from({length: Math.min(10, (selectedTimeSlot?.availableSpots || 10) - (selectedTimeSlot?.bookedSpots || 0))}, (_, i) => i + 1) as num}
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
													{#each Array.from({length: Math.min(10, (selectedTimeSlot?.availableSpots || 10) - (selectedTimeSlot?.bookedSpots || 0) - adultParticipants) + 1}, (_, i) => i) as num}
														<option value={num}>{num}</option>
													{/each}
												</select>
											</div>
										</div>
									</div>
								{:else}
									<!-- Simple Per-Person Pricing -->
									<div>
										<select
											bind:value={participants}
											name="participants"
											class="form-select w-full"
											required
										>
											<option value="" disabled>Select number of participants</option>
											{#each Array.from({length: Math.min(20, (selectedTimeSlot?.availableSpots || 10) - (selectedTimeSlot?.bookedSpots || 0))}, (_, i) => i + 1) as num}
												<option value={num}>
													{num} {num === 1 ? 'person' : 'people'} • {formatTourOwnerCurrency(parseFloat(tour.price) * num, tourOwner?.currency)}
												</option>
											{/each}
										</select>
									</div>
								{/if}
							</div>
						</div>
					{/if}
					
					<!-- Step 3: Add-ons (if available) -->
					{#if totalParticipants() > 0 && tour.optionalAddons?.addons && tour.optionalAddons.addons.length > 0}
						<div class="booking-step" class:completed={selectedAddonIds.length > 0}>
							<div class="step-number">{selectedAddonIds.length > 0 ? '✓' : '3'}</div>
							<div class="ml-4">
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
					{#if selectedTimeSlot && totalParticipants() > 0}
						<div class="mt-4 p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
							<PriceBreakdown
								{tour}
								participants={totalParticipants()}
								{participantCounts}
								{selectedAddonIds}
								isPrivateTour={tour.pricingModel === 'private_tour' && isPrivateTour}
								currencySymbol={tourOwner?.currency === 'PLN' ? 'zł' : tourOwner?.currency === 'EUR' ? '€' : '$'}
							/>
						</div>
					{/if}
					
					<!-- Customer Information -->
					{#if selectedTimeSlot && totalParticipants() > 0}
						<div class="space-y-3 pt-4 border-t" style="border-color: var(--border-primary);">
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
					{#if selectedTimeSlot && totalParticipants() > 0}
						{@const displayPrice = priceCalculation().totalAmount}
						<button
							type="submit"
							disabled={isSubmitting || !selectedTimeSlot || totalParticipants() === 0 || !isContactInfoValid}
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
</div>

<style>
	/* Booking flow steps */
	.booking-step {
		padding: 1.5rem;
		border-radius: 0.75rem;
		background: var(--bg-secondary);
		margin-bottom: 1rem;
		position: relative;
		transition: all 0.2s ease;
	}
	
	.booking-step.completed {
		background: var(--color-success-50);
		border: 1px solid var(--color-success-200);
	}
	
	.booking-step.active {
		background: var(--bg-primary);
		border: 2px solid var(--color-primary-500);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	
	.step-number {
		position: absolute;
		top: 1.5rem;
		left: -0.75rem;
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
	}
	
	.booking-step.active .step-number {
		background: var(--color-primary-600);
		color: white;
		border-color: var(--color-primary-600);
	}
	
	.booking-step.completed .step-number {
		background: var(--color-success-600);
		color: white;
		border-color: var(--color-success-600);
	}

	/* Mobile optimizations */
	@media (max-width: 450px) {
		.booking-widget {
			margin: 0 -0.5rem;
			border-radius: 0.5rem;
		}

		.booking-step {
			padding: 1rem;
			margin-bottom: 0.75rem;
		}

		.step-number {
			left: -0.5rem;
			width: 1.75rem;
			height: 1.75rem;
			font-size: 0.75rem;
		}

		.booking-widget .p-6 {
			padding: 1rem !important;
		}

		.booking-widget h2 {
			font-size: 1rem;
		}

		.booking-widget h3 {
			font-size: 0.875rem;
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
</style>


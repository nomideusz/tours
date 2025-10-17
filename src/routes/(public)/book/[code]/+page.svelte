<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import type { TimeSlot } from '$lib/types.js';
	import { tourOwnerStore } from '$lib/stores/tourOwner.js';
	import { formatTourOwnerCurrency } from '$lib/utils/currency.js';
	import { getTourDisplayPriceFormattedWithCurrency, formatCategoryName } from '$lib/utils/tour-helpers-client.js';
	import { createPublicTourQuery, createTimeSlotAvailabilityQuery } from '$lib/queries/public-queries.js';
	import { 
		formatSlotDateTime,
		formatSlotTimeRange,
		getSlotAvailabilityText,
		getSlotStatusText,
		getSlotStatusColor,
		isSlotFull
	} from '$lib/utils/time-slot-client.js';
	import LoadingState from '$lib/components/booking/LoadingState.svelte';
	import ErrorState from '$lib/components/booking/ErrorState.svelte';
	import TourNotFound from '$lib/components/booking/TourNotFound.svelte';
	import TourHeroSection from '$lib/components/booking/TourHeroSection.svelte';
	import TourDetailsTabs from '$lib/components/booking/TourDetailsTabs.svelte';
	import BookingWidget from '$lib/components/booking/BookingWidget.svelte';
	import { calculateBookingPrice } from '$lib/utils/pricing-calculations.js';
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
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import X from 'lucide-svelte/icons/x';
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
	let participantCounts = $state<Record<string, number>>({});
	let isPrivateTour = $state(false);
	let selectedTier = $state<import('$lib/types.js').GroupPricingTier | null>(null);
	let selectedAddonIds = $state<string[]>([]);
	let customerName = $state((form as any)?.customerName || '');
	let customerEmail = $state((form as any)?.customerEmail || '');
	let customerPhone = $state((form as any)?.customerPhone || '');
	let specialRequests = $state((form as any)?.specialRequests || '');
	let isSubmitting = $state(false);
	let showSuccess = $state(false);
	let activeTab = $state('includes');
	let error = $state<string | null>(null);
	
	// Tour image URL
	let imageUrl = $derived(tour?.images?.[0] ? 
		`/api/images/${tour.id}/${tour.images[0]}?size=large` : 
		null
	);
	
	// Process time slots from query
	let hasRealTimeSlots = $derived(allTimeSlots?.length > 0);
	
	// Calculate pricing using centralized utility
	let priceCalculation = $derived(() => {
		if (!tour) {
			return {
				basePrice: 0,
				discountedBase: 0,
				addonsTotal: 0,
				groupDiscount: 0,
				totalAmount: 0,
				categoryBreakdown: null,
				selectedTier: null,
				errors: []
			};
		}
		
		// For private tour with flat rate
		if ((isPrivateTour || tour.pricingModel === 'private_tour') && tour.privateTour) {
			const addonsTotal = selectedAddonIds.length > 0 && tour.optionalAddons?.addons
				? tour.optionalAddons.addons
					.filter((addon: any) => selectedAddonIds.includes(addon.id))
					.reduce((sum: number, addon: any) => sum + addon.price, 0)
				: 0;
			
			return {
				basePrice: tour.privateTour.flatPrice,
				discountedBase: tour.privateTour.flatPrice,
				addonsTotal,
				groupDiscount: 0,
				totalAmount: tour.privateTour.flatPrice + addonsTotal,
				categoryBreakdown: null,
				selectedTier: null,
				errors: []
			};
		}
		
		return calculateBookingPrice(
			tour,
			participants,
			selectedAddonIds,
			adultParticipants,
			childParticipants,
			participantCounts
		);
	});
	
	// Get the actual price value for display
	let displayPrice = $derived(priceCalculation().totalAmount);
	
	// Total participant count for validation
	let totalParticipants = $derived(() => {
		if (!tour) return 0;
		
		// Private tour: use selected participants (or min capacity)
		if ((isPrivateTour || tour.pricingModel === 'private_tour') && tour.privateTour) {
			return participants || tour.privateTour.minCapacity || tour.minCapacity || 1;
		}
		
		// Participant categories: sum counts that count toward capacity
		if (tour.pricingModel === 'participant_categories' && tour.participantCategories) {
			return Object.entries(participantCounts).reduce((sum, [catId, count]) => {
				const category = tour.participantCategories?.categories?.find((c: any) => c.id === catId);
				if (category && category.countsTowardCapacity !== false) {
					return sum + count;
				}
				return sum;
			}, 0);
		}
		
		// Group tiers or hybrid: use tier min participants or participants
		if (tour.pricingModel === 'group_tiers' || tour.pricingModel === 'hybrid') {
			return selectedTier ? selectedTier.minParticipants : participants;
		}
		
		// Adult/child: sum of both
		if (tour.enablePricingTiers) {
			return adultParticipants + childParticipants;
		}
		
		// Per person: use participants
		return participants;
	});
	
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
	
	// Initialize private tour values
	$effect(() => {
		if (tour && tour.pricingModel === 'private_tour' && tour.privateTour && !isPrivateTour && selectedTimeSlot) {
			participants = tour.privateTour.minCapacity || tour.minCapacity || 4;
			isPrivateTour = true;
		}
	});
</script>

<svelte:head>
	<title>Book {tour?.name || 'Tour'} - Zaur</title>
	<meta name="description" content="Book {tour?.name || 'this tour'} instantly with our secure QR booking system." />
	<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
		{#if isLoading}
			<LoadingState />
		{:else if showError && !tour}
			<ErrorState 
				message={queryError?.message}
				onRetry={() => $tourQuery.refetch()}
			/>
		{:else if showNotFound && !tour}
			<TourNotFound />
		{:else if tour}
			<!-- Main Content Container -->
			<div class="max-w-4xl mx-auto">
				<TourHeroSection 
					{tour} 
					tourGuide={tourOwner}
					imageUrl={imageUrl || undefined} 
				/>
				
				<!-- Tour Details -->
				<TourDetailsTabs {tour} />
				
				<!-- Booking Widget (Full Width) -->
				<div class="mt-8">
					<BookingWidget
						{tour}
						{tourOwner}
						{allTimeSlots}
						{hasRealTimeSlots}
						{form}
						bind:selectedTimeSlot
						bind:participants
						bind:adultParticipants
						bind:childParticipants
						bind:participantCounts
						bind:isPrivateTour
						bind:selectedAddonIds
						bind:customerName
						bind:customerEmail
						bind:customerPhone
						bind:specialRequests
						bind:error
						bind:showSuccess
						onSlotSelect={handleSlotSelect}
						{totalParticipants}
						{priceCalculation}
					/>
				</div>
			</div>
		{/if}
</div>


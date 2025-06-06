<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { PageData, ActionData } from './$types.js';
	import type { TimeSlot } from '$lib/types.js';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Euro from 'lucide-svelte/icons/euro';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Check from 'lucide-svelte/icons/check';
	
	let { data, form }: { data: PageData; form: ActionData | null } = $props();
	
	// SEO data from server
	const seo = $derived(data.seo);
	
	// Booking form state
	let selectedDate = $state<string>('');
	let selectedTimeSlot = $state<TimeSlot | null>(null);
	let participants = $state(1);
	let customerName = $state((form as any)?.customerName || '');
	let customerEmail = $state((form as any)?.customerEmail || '');
	let customerPhone = $state((form as any)?.customerPhone || '');
	let specialRequests = $state((form as any)?.specialRequests || '');
	let isSubmitting = $state(false);
	let showSuccess = $state(false);
	let error = $state<string | null>(null);
	
	// Get tour from expanded QR code data
	let tour = $derived(data.qrCode.expand?.tour || null);
	let imageUrl = $derived(tour?.images?.[0] ? 
		`/uploads/tours/${tour.id}/${tour.images[0]}` : 
		null
	);
	
	// Process time slots from server
	let availableDates = $state<string[]>([]);
	let availableTimeSlots = $state<TimeSlot[]>([]);
	let allTimeSlots = $derived(data.timeSlots || []);
	let hasRealTimeSlots = $derived(data.timeSlots?.length > 0);
	
	// Calculate total price
	let totalPrice = $derived(tour && tour.price ? participants * Number(tour.price) : 0);
	
	// Show success message if booking was successful
	$effect(() => {
		if ((form as any)?.success) {
			showSuccess = true;
		}
		if ((form as any)?.error) {
			error = (form as any).error;
		}
	});
	
	// Generate demo time slots if none from server
	function generateDemoTimeSlots(): TimeSlot[] {
		if (!tour) return [];
		
		const slots: TimeSlot[] = [];
		const today = new Date();
		
		for (let i = 1; i <= 14; i++) {
			const date = new Date(today);
			date.setDate(today.getDate() + i);
			const dateStr = date.toISOString().split('T')[0];
			
			// Morning slot
			slots.push({
				id: `demo-${i}-1`,
				tour: tour.id,
				startTime: `${dateStr}T09:00:00`,
				endTime: `${dateStr}T11:00:00`,
				availableSpots: Math.floor(Math.random() * 8) + 2,
				bookedSpots: Math.floor(Math.random() * 3),
				status: 'available' as const,
				isRecurring: false,
				created: new Date().toISOString(),
				updated: new Date().toISOString()
			});
			
			// Afternoon slot
			slots.push({
				id: `demo-${i}-2`,
				tour: tour.id,
				startTime: `${dateStr}T14:00:00`,
				endTime: `${dateStr}T16:00:00`,
				availableSpots: Math.floor(Math.random() * 6) + 1,
				bookedSpots: Math.floor(Math.random() * 4),
				status: 'available' as const,
				isRecurring: false,
				created: new Date().toISOString(),
				updated: new Date().toISOString()
			});
		}
		
		return slots;
	}
	
	onMount(() => {
		// Extract unique dates from time slots
		const dates = new Set<string>();
		allTimeSlots.forEach(slot => {
			const date = slot.startTime.split('T')[0];
			dates.add(date);
		});
		availableDates = Array.from(dates).sort();
	});
	
	function selectDate(date: string) {
		selectedDate = date;
		selectedTimeSlot = null; // Reset time slot selection
		loadTimeSlotsForDate(date);
	}
	
	function loadTimeSlotsForDate(date: string) {
		availableTimeSlots = allTimeSlots.filter(slot => 
			slot.startTime.startsWith(date) && slot.availableSpots > 0
		).sort((a, b) => a.startTime.localeCompare(b.startTime));
	}
	
	function formatTime(dateString: string) {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	{#if seo}
		<title>{seo.title}</title>
		<meta name="description" content={seo.description} />
		<meta name="keywords" content={seo.keywords} />
		<link rel="canonical" href={seo.canonical} />
		
		<!-- Open Graph -->
		<meta property="og:title" content={seo.openGraph?.title} />
		<meta property="og:description" content={seo.openGraph?.description} />
		<meta property="og:url" content={seo.openGraph?.url} />
		<meta property="og:type" content={seo.openGraph?.type} />
		<meta property="og:image" content={seo.openGraph?.image} />
		
		<!-- Twitter -->
		<meta name="twitter:card" content={seo.twitter?.card} />
		<meta name="twitter:title" content={seo.twitter?.title} />
		<meta name="twitter:description" content={seo.twitter?.description} />
		<meta name="twitter:image" content={seo.twitter?.image} />
		
		<!-- Structured Data -->
		{#if seo.structuredData}
			{@html `<script type="application/ld+json">${JSON.stringify(seo.structuredData)}</script>`}
		{/if}
	{/if}
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
		{#if !data.qrCode || !tour}
			<div class="flex items-center justify-center min-h-screen">
				<div class="text-center max-w-md mx-auto px-6">
					<h1 class="text-2xl font-bold text-gray-900 mb-2">QR Code Not Found</h1>
					<p class="text-gray-600 mb-4">This QR code could not be loaded. This might happen if:</p>
					<ul class="text-sm text-gray-500 text-left space-y-2 mb-6">
						<li>• The QR code has been deactivated</li>
						<li>• The QR code doesn't exist</li>
						<li>• There's a configuration issue with the booking system</li>
					</ul>
					<div class="bg-gray-100 rounded-lg p-4 text-xs text-gray-500 text-left">
						<p class="font-semibold mb-1">Debug Info:</p>
						<p>QR Code: {$page.params.code}</p>
						<p>URL: {$page.url.pathname}</p>
					</div>
				</div>
			</div>
		{:else}
			<!-- Hero Section -->
			<div class="relative bg-white shadow-sm rounded-lg overflow-hidden mb-8">
				{#if imageUrl}
					<div class="h-64 sm:h-80 bg-gray-200">
						<img 
							src={imageUrl} 
							alt={tour.name}
							class="w-full h-full object-cover"
						/>
					</div>
				{/if}
				
				<div class="px-6 py-6 sm:px-8">
					<h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{tour.name}</h1>
					
					<div class="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
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
						<span class="flex items-center gap-1 font-semibold text-gray-900">
							<Euro class="w-4 h-4" />
							{tour.price} per person
						</span>
					</div>
					
					{#if tour.description}
						<p class="text-gray-700 mb-6">{tour.description}</p>
					{/if}
				</div>
			</div>
			
			<!-- Booking Form -->
			<div class="bg-white rounded-lg shadow-sm p-6 sm:p-8">
			<h2 class="text-xl font-semibold text-gray-900 mb-6">Book Your Tour</h2>
			
			{#if showSuccess}
				<!-- Success Message -->
				<div class="mb-6 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
					<div class="flex justify-center mb-4">
						<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
							<Check class="w-8 h-8 text-green-600" />
						</div>
					</div>
					<h3 class="text-lg font-semibold text-green-900 mb-2">Booking Successful!</h3>
					<p class="text-sm text-green-700 mb-4">
						Your booking has been submitted successfully. You will receive a confirmation email shortly.
					</p>
					{#if (form as any)?.bookingReference}
						<div class="bg-white border border-green-300 rounded-lg p-3 mb-2">
							<p class="text-sm font-medium text-gray-900">Booking Reference</p>
							<p class="text-lg font-mono font-bold text-green-800">{(form as any).bookingReference}</p>
						</div>
					{/if}
					{#if (form as any)?.bookingId}
						<p class="text-xs text-green-600">
							Internal ID: {(form as any).bookingId}
						</p>
					{/if}
				</div>
			{:else}
				{#if error}
					<div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
						<p class="text-sm text-red-600">{error}</p>
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
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}} class="space-y-6">
						<!-- Hidden inputs for form data -->
						{#if selectedTimeSlot}
							<input type="hidden" name="timeSlotId" value={selectedTimeSlot.id} />
							<input type="hidden" name="availableSpots" value={selectedTimeSlot.availableSpots} />
							<input type="hidden" name="bookedSpots" value={selectedTimeSlot.bookedSpots || 0} />
							<input type="hidden" name="participants" value={participants} />
							<input type="hidden" name="customerName" value={customerName} />
							<input type="hidden" name="customerEmail" value={customerEmail} />
							<input type="hidden" name="customerPhone" value={customerPhone} />
							<input type="hidden" name="specialRequests" value={specialRequests} />
						{/if}
						
						<!-- Date Selection -->
				<div>
					<span class="block text-sm font-medium text-gray-700 mb-3">
						Select Date
					</span>
					<div class="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
						{#each availableDates.slice(0, 12) as date}
							<button
								type="button"
								onclick={() => selectDate(date)}
								class="p-3 text-center rounded-lg border transition-colors {
									selectedDate === date 
										? 'bg-blue-50 border-blue-500 text-blue-700' 
										: 'bg-white border-gray-200 hover:border-gray-300'
								}"
							>
								<div class="text-xs text-gray-500">
									{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
								</div>
								<div class="font-semibold">
									{new Date(date).getDate()}
								</div>
								<div class="text-xs text-gray-500">
									{new Date(date).toLocaleDateString('en-US', { month: 'short' })}
								</div>
							</button>
						{/each}
					</div>
				</div>
				
				<!-- Time Slot Selection -->
				{#if selectedDate && availableTimeSlots.length > 0}
					<div>
						<span class="block text-sm font-medium text-gray-700 mb-3">
							Select Time
						</span>
						<div class="space-y-2">
							{#each availableTimeSlots as slot}
								{@const spotsLeft = slot.availableSpots}
								<button
									type="button"
									onclick={() => selectedTimeSlot = slot}
									disabled={spotsLeft < participants}
									class="w-full p-4 rounded-lg border text-left transition-colors {
										selectedTimeSlot?.id === slot.id
											? 'bg-blue-50 border-blue-500'
											: spotsLeft < participants
											? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
											: 'bg-white border-gray-200 hover:border-gray-300'
									}"
								>
									<div class="flex items-center justify-between">
										<div>
											<div class="font-semibold">
												{formatTime(slot.startTime)} - {formatTime(slot.endTime)}
											</div>
											<div class="text-sm text-gray-600">
												{spotsLeft} spots left
											</div>
										</div>
										{#if selectedTimeSlot?.id === slot.id}
											<ChevronRight class="w-5 h-5 text-blue-600" />
										{/if}
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Number of Participants -->
				{#if selectedTimeSlot}
					<div>
						<label for="participants" class="block text-sm font-medium text-gray-700 mb-2">
							Number of Participants
						</label>
						<select
							id="participants"
							bind:value={participants}
							class="form-select w-full"
						>
							{#each Array(Math.min(selectedTimeSlot.availableSpots, 10)) as _, i}
								<option value={i + 1}>{i + 1} {i === 0 ? 'person' : 'people'}</option>
							{/each}
						</select>
					</div>
					
					<!-- Customer Details -->
					<div class="space-y-4">
						<h3 class="font-medium text-gray-900">Your Details</h3>
						
						<div>
							<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
								Full Name <span class="text-red-500">*</span>
							</label>
							<input
								id="name"
								type="text"
								bind:value={customerName}
								required
								class="form-input w-full"
								placeholder="John Doe"
							/>
						</div>
						
						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
								Email <span class="text-red-500">*</span>
							</label>
							<input
								id="email"
								type="email"
								bind:value={customerEmail}
								required
								class="form-input w-full"
								placeholder="john@example.com"
							/>
						</div>
						
						<div>
							<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
								Phone Number
							</label>
							<input
								id="phone"
								type="tel"
								bind:value={customerPhone}
								class="form-input w-full"
								placeholder="+1 234 567 8900"
							/>
						</div>
						
						<div>
							<label for="requests" class="block text-sm font-medium text-gray-700 mb-1">
								Special Requests
							</label>
							<textarea
								id="requests"
								bind:value={specialRequests}
								rows="3"
								class="form-textarea w-full"
								placeholder="Any special requirements or requests..."
							></textarea>
						</div>
					</div>
					
					<!-- Price Summary -->
					<div class="bg-gray-50 rounded-lg p-4">
						<div class="flex justify-between items-center mb-2">
							<span class="text-gray-600">Tour price</span>
							<span>€{tour.price} × {participants}</span>
						</div>
						<div class="flex justify-between items-center font-semibold text-lg">
							<span>Total</span>
							<span>€{totalPrice}</span>
						</div>
					</div>
					
					<!-- Submit Button -->
					<button
						type="submit"
						disabled={isSubmitting || !customerName || !customerEmail}
						class="w-full button-primary button--gap justify-center py-3 text-base"
					>
						{#if isSubmitting}
							<div class="form-spinner"></div>
							Processing...
						{:else}
							Continue to Payment
							<ChevronRight class="w-5 h-5" />
						{/if}
					</button>
				{/if}
				</form>
				{/if}
			{/if}
			</div>
			
			<!-- Footer -->
			<div class="mt-12 text-center text-sm text-gray-500">
				<p>Powered by <a href="https://zaur.app" class="text-blue-600 hover:underline">Zaur</a></p>
			</div>
		{/if}
	</div>
</div> 
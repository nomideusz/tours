<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types.js';
	import type { TimeSlot } from '$lib/types.js';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Euro from 'lucide-svelte/icons/euro';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	
	let { data }: { data: PageData } = $props();
	
	// Booking form state
	let selectedDate = $state<string>('');
	let selectedTimeSlot = $state<TimeSlot | null>(null);
	let participants = $state(1);
	let customerName = $state('');
	let customerEmail = $state('');
	let customerPhone = $state('');
	let specialRequests = $state('');
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	
	// Get tour from expanded QR code data
	let tour = $derived(data.qrCode.expand?.tour || null);
	let imageUrl = $derived(tour?.images?.[0] ? 
		`${data.pbUrl}/api/files/${tour.collectionId}/${tour.id}/${tour.images[0]}?thumb=300x300` : 
		null
	);
	
	// Available dates (mock data - would come from time slots)
	let availableDates = $state<string[]>([]);
	let availableTimeSlots = $state<TimeSlot[]>([]);
	
	// Calculate total price
	let totalPrice = $derived(tour ? participants * tour.price : 0);
	
	onMount(() => {
		// Generate some available dates for demo
		const dates: string[] = [];
		const today = new Date();
		for (let i = 1; i <= 30; i++) {
			const date = new Date(today);
			date.setDate(today.getDate() + i);
			dates.push(date.toISOString().split('T')[0]);
		}
		availableDates = dates;
	});
	
	function selectDate(date: string) {
		selectedDate = date;
		// Load time slots for selected date
		// This would normally fetch from the API
		loadTimeSlotsForDate(date);
	}
	
	function loadTimeSlotsForDate(date: string) {
		// Mock time slots - in production, fetch from API
		availableTimeSlots = [
			{
				id: '1',
				tour: tour?.id || '',
				startTime: `${date}T09:00:00`,
				endTime: `${date}T11:00:00`,
				availableSpots: 7,
				bookedSpots: 3,
				status: 'available' as const,
				isRecurring: false,
				created: new Date().toISOString(),
				updated: new Date().toISOString()
			},
			{
				id: '2',
				tour: tour?.id || '',
				startTime: `${date}T14:00:00`,
				endTime: `${date}T16:00:00`,
				availableSpots: 3,
				bookedSpots: 7,
				status: 'available' as const,
				isRecurring: false,
				created: new Date().toISOString(),
				updated: new Date().toISOString()
			}
		];
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
	
	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!selectedTimeSlot || !tour) return;
		
		error = null;
		isSubmitting = true;
		
		try {
			// Here you would submit the booking to your API
			// For now, just show success message
			alert('Booking submitted successfully! You will receive a confirmation email shortly.');
			
			// Reset form
			selectedDate = '';
			selectedTimeSlot = null;
			participants = 1;
			customerName = '';
			customerEmail = '';
			customerPhone = '';
			specialRequests = '';
		} catch (err) {
			error = 'Failed to submit booking. Please try again.';
			console.error('Booking error:', err);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	{#if !data.qrCode || !tour}
		<div class="flex items-center justify-center min-h-screen p-4">
			<div class="text-center">
				<h1 class="text-2xl font-bold text-gray-900 mb-2">Invalid QR Code</h1>
				<p class="text-gray-600">This QR code is not valid or has been deactivated.</p>
			</div>
		</div>
	{:else}
		<!-- Hero Section -->
		<div class="relative bg-white shadow-sm">
			{#if imageUrl}
				<div class="h-64 sm:h-80 bg-gray-200">
					<img 
						src={imageUrl} 
						alt={tour.name}
						class="w-full h-full object-cover"
					/>
				</div>
			{/if}
			
			<div class="px-4 py-6 sm:px-6">
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
						{Math.floor(tour.duration / 60)}h {tour.duration % 60}m
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
		<div class="px-4 py-6 sm:px-6">
			<h2 class="text-xl font-semibold text-gray-900 mb-6">Book Your Tour</h2>
			
			{#if error}
				<div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
					<p class="text-sm text-red-600">{error}</p>
				</div>
			{/if}
			
			<form onsubmit={handleSubmit} class="space-y-6">
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
		</div>
		
		<!-- Footer -->
		<div class="mt-12 px-4 py-6 sm:px-6 text-center text-sm text-gray-500">
			<p>Powered by <a href="https://zaur.app" class="text-blue-600 hover:underline">Zaur</a></p>
		</div>
	{/if}
</div> 
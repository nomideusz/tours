<script lang="ts">
	import type { PageData } from './$types.js';
	import { tourOwnerStore } from '$lib/stores/tourOwner.js';
	import { createPublicProfileQuery } from '$lib/queries/public-queries.js';
	import { formatTourOwnerCurrency } from '$lib/utils/currency.js';
	import { getTourDisplayPriceFormattedWithCurrency } from '$lib/utils/tour-helpers-client.js';
	import { generateQRImageURL, generateBookingURL } from '$lib/utils/qr-generation.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import User from 'lucide-svelte/icons/user';
	import Building from 'lucide-svelte/icons/building';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Globe from 'lucide-svelte/icons/globe';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Ticket from 'lucide-svelte/icons/ticket';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import Star from 'lucide-svelte/icons/star';
	import Shield from 'lucide-svelte/icons/shield';
	import Smartphone from 'lucide-svelte/icons/smartphone';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	
	let { data }: { data: PageData } = $props();
	
	// Use TanStack Query for real-time data
	let profileQuery = $derived(createPublicProfileQuery(data.username));
	
	// Get data from TanStack Query
	let profile = $derived($profileQuery.data?.profile || null);
	let tours = $derived($profileQuery.data?.tours || []);
	let totalTours = $derived($profileQuery.data?.totalTours || 0);
	let isLoading = $derived($profileQuery.isLoading);
	let queryError = $derived($profileQuery.error);
	
	// Set tour owner in store for header to use
	$effect(() => {
		if (profile?.username && profile?.name) {
			tourOwnerStore.set({
				username: profile.username,
				name: profile.name
			});
		}
		
		// Clean up when component is destroyed
		return () => {
			tourOwnerStore.set(null);
		};
	});
	
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		
		const isToday = date.toDateString() === today.toDateString();
		const isTomorrow = date.toDateString() === tomorrow.toDateString();
		
		if (isToday) return 'Today';
		if (isTomorrow) return 'Tomorrow';
		
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}
	
	function formatDuration(minutes: number) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
		}
		return `${mins}m`;
	}
	
	function getNextTimeSlots(timeSlots: any[], limit = 3) {
		const now = new Date();
		return timeSlots
			.filter(slot => 
				slot.availableSpots > slot.bookedSpots &&
				new Date(slot.startTime) > now // Ensure slot is in the future
			)
			.slice(0, limit);
	}
	
	function getQRCodeURL(qrCode: string) {
		return generateQRImageURL(qrCode, { 
			size: 120, 
			color: '3B82F6', 
			backgroundColor: 'FFFFFF' 
		});
	}
	
	function getBookingPageURL(qrCode: string) {
		return generateBookingURL(qrCode);
	}
	
	// Get the next available slot for a tour
	function getNextAvailableSlot(timeSlots: any[]) {
		const now = new Date();
		const futureSlots = timeSlots
			.filter(slot => 
				slot.availableSpots > slot.bookedSpots &&
				new Date(slot.startTime) > now
			)
			.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
		
		return futureSlots[0];
	}
</script>

<svelte:head>
	<title>Book Tours with {profile?.name || data.username} (@{data.username})</title>
	<meta name="description" content="Book tours with {profile?.name || data.username}. {profile?.description || `Professional tour guide offering ${totalTours} tours.`}" />
</svelte:head>

<div class="min-h-screen" style="background: var(--bg-secondary);">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 min-h-[600px]">
		{#if isLoading}
			<!-- Loading State -->
			<div class="flex items-center justify-center min-h-[600px]">
				<div class="text-center">
					<Loader2 class="w-12 h-12 animate-spin mx-auto mb-4" style="color: var(--color-primary-600);" />
					<p class="text-lg font-medium" style="color: var(--text-primary);">Loading profile...</p>
					<p class="text-sm" style="color: var(--text-secondary);">Please wait while we fetch the latest tour information</p>
				</div>
			</div>
		{:else if queryError}
			<!-- Error State -->
			<div class="flex items-center justify-center min-h-[600px]">
				<div class="text-center max-w-md mx-auto px-6">
					<div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--color-danger-50);">
						<AlertCircle class="w-10 h-10" style="color: var(--color-danger-600);" />
					</div>
					<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Profile Not Found</h1>
					<p class="mb-6" style="color: var(--text-secondary);">
						The profile @{data.username} could not be found or is not available.
					</p>
					<button 
						onclick={() => $profileQuery.refetch()}
						class="button-primary"
					>
						Try Again
					</button>
				</div>
			</div>
		{:else if profile}
			<!-- Profile Header -->
			<div class="rounded-xl overflow-hidden shadow-sm mb-6 fade-in" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<!-- Cover Background -->
				<div class="h-14 sm:h-16" style="background: var(--color-primary-600);"></div>
				
				<!-- Profile Content -->
				<div class="px-4 sm:px-6 lg:px-8">
					<div class="-mt-8 sm:-mt-12 pb-6">
						<div class="flex flex-col sm:flex-row sm:items-end sm:space-x-5">
							<!-- Avatar -->
							<div class="flex justify-center sm:justify-start">
								{#if profile.avatar}
									<img 
										src={profile.avatar} 
										alt={profile.name}
										class="w-24 h-24 sm:w-32 sm:h-32 rounded-full ring-4 shadow"
										style="ring-color: var(--bg-primary);"
									/>
								{:else}
									<div class="w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center shadow ring-4" 
										style="background: var(--bg-tertiary); ring-color: var(--bg-primary);">
										<User class="w-12 h-12 sm:w-16 sm:h-16" style="color: var(--text-tertiary);" />
									</div>
								{/if}
							</div>
							
							<!-- Profile Info -->
							<div class="mt-4 sm:mt-6 flex-1 text-center sm:text-left">
								<div class="pt-4 sm:pt-6">
									<h1 class="text-2xl sm:text-3xl font-bold" style="color: var(--text-primary);">{profile.name}</h1>
									<p class="text-sm mb-4 sm:mb-3" style="color: var(--text-secondary);">@{profile.username}</p>
								</div>
								
								<!-- Tour count badge -->
								<div class="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium" style="background: var(--bg-secondary); color: var(--text-primary);">
									<Ticket class="w-4 h-4 mr-2" />
									{totalTours} {totalTours === 1 ? 'Tour' : 'Tours'}
								</div>
							</div>
						</div>
					</div>
					
					<!-- Additional Info -->
					<div class="flex flex-wrap gap-4 pb-6 text-sm">
						{#if profile.businessName}
							<div class="flex items-center gap-2">
								<Building class="w-4 h-4" style="color: var(--text-tertiary);" />
								<span style="color: var(--text-secondary);">{profile.businessName}</span>
							</div>
						{/if}
						{#if profile.location}
							<div class="flex items-center gap-2">
								<MapPin class="w-4 h-4" style="color: var(--text-tertiary);" />
								<span style="color: var(--text-secondary);">{profile.location}</span>
							</div>
						{/if}
						{#if profile.website}
							<a 
								href={profile.website}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center gap-2 transition-colors hover-link"
								style="color: var(--text-secondary);"
							>
								<Globe class="w-4 h-4" />
								<span>{profile.website.replace(/^https?:\/\//, '')}</span>
								<ExternalLink class="w-3 h-3" />
							</a>
						{/if}
					</div>
				</div>
				
				{#if profile.description}
					<div class="px-4 sm:px-6 lg:px-8 pb-6 border-t" style="border-color: var(--border-primary);">
						<div class="pt-6">
							<h3 class="text-sm font-medium mb-2" style="color: var(--text-primary);">About</h3>
							<p class="text-sm leading-relaxed" style="color: var(--text-secondary);">{profile.description}</p>
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Tours Section -->
			{#if tours.length > 0}
				<div class="mb-6">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-semibold" style="color: var(--text-primary);">Available Tours</h2>
						<span class="text-sm px-3 py-1 rounded-full" style="background: var(--bg-primary); color: var(--text-secondary);">
							{totalTours} tour{totalTours === 1 ? '' : 's'}
						</span>
					</div>
					
					<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{#each tours as tour}
							{@const nextSlot = getNextAvailableSlot(tour.timeSlots || [])}
							<div class="rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-md flex flex-col h-full" 
								style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
								<!-- Tour Image -->
								{#if tour.images && tour.images.length > 0}
									<div class="aspect-[16/10] overflow-hidden flex-shrink-0" style="background: var(--bg-secondary);">
										<img 
											src="/api/images/{tour.id}/{tour.images[0]}?size=medium"
											alt={tour.name}
											class="w-full h-full object-cover transition-transform hover:scale-105"
											loading="lazy"
										/>
									</div>
								{:else}
									<div class="aspect-[16/10] flex items-center justify-center flex-shrink-0" style="background: var(--bg-tertiary);">
										<MapPin class="w-12 h-12" style="color: var(--text-tertiary);" />
									</div>
								{/if}
								
								<!-- Tour Content -->
								<div class="p-4 sm:p-5 flex flex-col flex-1">
									<div class="flex-1">
										<h3 class="font-semibold text-lg mb-2 line-clamp-2" style="color: var(--text-primary);">
											{tour.name}
										</h3>
										
										{#if tour.description}
											<p class="text-sm mb-3 line-clamp-2" style="color: var(--text-secondary);">
												{tour.description}
											</p>
										{/if}
										
										<!-- Tour Details -->
										<div class="space-y-2 mb-4 text-sm">
											<div class="flex flex-wrap gap-x-4 gap-y-2">
												{#if tour.location}
													<div class="flex items-center gap-2">
														<MapPin class="w-4 h-4" style="color: var(--text-tertiary);" />
														<span style="color: var(--text-secondary);" class="truncate">{tour.location}</span>
													</div>
												{/if}
												{#if tour.duration}
													<div class="flex items-center gap-2">
														<Clock class="w-4 h-4" style="color: var(--text-tertiary);" />
														<span style="color: var(--text-secondary);">{formatDuration(tour.duration)}</span>
													</div>
												{/if}
												<div class="flex items-center gap-2">
													<Users class="w-4 h-4" style="color: var(--text-tertiary);" />
													<span style="color: var(--text-secondary);">Max {tour.capacity}</span>
												</div>
											</div>
											
											<!-- Pricing on separate line for better visibility -->
											<div class="flex items-center gap-2">
												<DollarSign class="w-4 h-4" style="color: var(--text-tertiary);" />
												<span style="color: var(--text-secondary);">
													{#if tour.enablePricingTiers && tour.pricingTiers}
														{#if parseFloat(tour.pricingTiers.child) < parseFloat(tour.pricingTiers.adult)}
															Adults: <span class="font-medium" style="color: var(--text-primary);">{formatTourOwnerCurrency(tour.pricingTiers.adult, profile?.currency)}</span>
															• Children: <span class="font-medium" style="color: var(--text-primary);">{formatTourOwnerCurrency(tour.pricingTiers.child, profile?.currency)}</span>
														{:else}
															<span class="font-medium" style="color: var(--text-primary);">{formatTourOwnerCurrency(tour.pricingTiers.adult, profile?.currency)}</span> per person
														{/if}
													{:else}
														<span class="font-medium" style="color: var(--text-primary);">{formatTourOwnerCurrency(tour.price, profile?.currency)}</span> per person
													{/if}
												</span>
											</div>
										</div>
										
										<!-- Next Available Slot -->
										{#if nextSlot}
											<div class="p-3 rounded-lg mb-4" style="background: var(--bg-secondary);">
												<p class="text-xs font-medium mb-1" style="color: var(--text-tertiary);">Next available</p>
												<p class="text-sm font-medium" style="color: var(--text-primary);">
													{formatDate(nextSlot.startTime)}
												</p>
												<p class="text-sm" style="color: var(--text-secondary);">
													{formatSlotTimeRange(nextSlot.startTime, nextSlot.endTime)}
												</p>
											</div>
										{:else}
											<div class="p-3 rounded-lg mb-4" style="background: var(--bg-secondary);">
												<p class="text-sm" style="color: var(--text-tertiary);">
													No scheduled times available
												</p>
											</div>
										{/if}
									</div>
									
									<!-- CTA Button - Always at bottom -->
									<div class="mt-auto">
										{#if tour.qrCode}
											<a 
												href={getBookingPageURL(tour.qrCode)}
												class="button-primary button--gap justify-center w-full"
											>
												<Ticket class="w-4 h-4" />
												Book Now
												<ChevronRight class="w-4 h-4" />
											</a>
										{:else}
											<button 
												disabled
												class="button--secondary w-full opacity-50 cursor-not-allowed"
											>
												Booking Unavailable
											</button>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<!-- No Tours Available -->
				<div class="rounded-xl text-center shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-8 sm:p-12">
						<div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--bg-secondary);">
							<Calendar class="w-10 h-10" style="color: var(--text-tertiary);" />
						</div>
						<h3 class="text-xl font-semibold mb-2" style="color: var(--text-primary);">No Tours Available</h3>
						<p style="color: var(--text-secondary);">
							{profile.name} doesn't have any active tours at the moment. Please check back later or contact them directly.
						</p>
					</div>
				</div>
			{/if}
			
			<!-- How It Works -->
			<div class="rounded-xl shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 sm:p-6 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: var(--color-primary-50);">
							<Sparkles class="w-5 h-5" style="color: var(--color-primary-600);" />
						</div>
						<h2 class="font-semibold" style="color: var(--text-primary);">How QR Booking Works</h2>
					</div>
				</div>
				<div class="p-6 sm:p-8">
					<div class="grid gap-6 sm:grid-cols-3">
						<div class="text-center">
							<div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--bg-secondary);">
								<QrCode class="w-8 h-8" style="color: var(--color-primary-600);" />
							</div>
							<h3 class="font-medium mb-2" style="color: var(--text-primary);">1. Find & Scan</h3>
							<p class="text-sm" style="color: var(--text-secondary);">
								Scan a tour QR code or click "Book Now" to select your tour
							</p>
						</div>
						<div class="text-center">
							<div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--bg-secondary);">
								<Calendar class="w-8 h-8" style="color: var(--color-primary-600);" />
							</div>
							<h3 class="font-medium mb-2" style="color: var(--text-primary);">2. Choose & Pay</h3>
							<p class="text-sm" style="color: var(--text-secondary);">
								Pick your preferred date and time, then pay securely online
							</p>
						</div>
						<div class="text-center">
							<div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--bg-secondary);">
								<Smartphone class="w-8 h-8" style="color: var(--color-primary-600);" />
							</div>
							<h3 class="font-medium mb-2" style="color: var(--text-primary);">3. Show Ticket</h3>
							<p class="text-sm" style="color: var(--text-secondary);">
								Get your QR ticket instantly and show it at check-in
							</p>
						</div>
					</div>
					
					<!-- Benefits -->
					<div class="mt-8 grid gap-4 sm:grid-cols-2">
						<div class="flex items-start gap-3">
							<Shield class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" />
							<div>
								<p class="font-medium text-sm mb-1" style="color: var(--text-primary);">Secure Payment</p>
								<p class="text-sm" style="color: var(--text-secondary);">
									Pay directly to tour guides via Stripe
								</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<Star class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" />
							<div>
								<p class="font-medium text-sm mb-1" style="color: var(--text-primary);">Instant Confirmation</p>
								<p class="text-sm" style="color: var(--text-secondary);">
									Get your tickets immediately after booking
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Profile Not Found (after loading) -->
			<div class="flex items-center justify-center min-h-[600px]">
				<div class="text-center max-w-md mx-auto px-6">
					<div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--bg-primary);">
						<User class="w-10 h-10" style="color: var(--text-tertiary);" />
					</div>
					<h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary);">Profile Not Found</h1>
					<p class="mb-4" style="color: var(--text-secondary);">The profile @{data.username} does not exist or is not available.</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.hover-link:hover {
		color: var(--color-primary-600) !important;
	}
	
	/* Smooth transition for profile content */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.fade-in {
		animation: fadeIn 0.3s ease-out;
	}
</style> 
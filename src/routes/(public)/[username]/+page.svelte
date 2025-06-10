<script lang="ts">
	import type { PageData } from './$types.js';
	import { tourOwnerStore } from '$lib/stores/tourOwner.js';
	import { generateQRImageURL, generateBookingURL } from '$lib/utils/qr-generation.js';
	import User from 'lucide-svelte/icons/user';
	import Building from 'lucide-svelte/icons/building';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Globe from 'lucide-svelte/icons/globe';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Euro from 'lucide-svelte/icons/euro';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	
	let { data }: { data: PageData } = $props();
	
	const { profile, tours, totalTours } = data;
	
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
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}
	
	function formatTime(dateString: string) {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
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
		return timeSlots
			.filter(slot => slot.availableSpots > slot.bookedSpots)
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
</script>

<svelte:head>
	<title>Book Tours with {profile.name} (@{profile.username})</title>
	<meta name="description" content="Book tours with {profile.name}. {profile.description || `Professional tour guide offering ${totalTours} tours.`}" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Profile Header -->
	<div class="rounded-xl overflow-hidden mb-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="px-6 py-8 text-white" style="background: var(--color-primary-600);">
			<div class="flex flex-col sm:flex-row items-start sm:items-center gap-6">
				<!-- Avatar -->
				<div class="flex-shrink-0">
					{#if profile.avatar}
						<img 
							src={profile.avatar} 
							alt={profile.name}
							class="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg"
						/>
					{:else}
						<div class="w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center border-4 border-white shadow-lg" style="background: var(--bg-primary);">
							<User class="w-12 h-12 sm:w-16 sm:h-16" style="color: var(--text-secondary);" />
						</div>
					{/if}
				</div>
				
				<!-- Profile Info -->
				<div class="flex-1">
					<h1 class="text-3xl sm:text-4xl font-bold mb-2">{profile.name}</h1>
					<p class="text-white/80 text-lg mb-3">@{profile.username}</p>
					
					<div class="flex flex-wrap gap-4 text-white/80">
						{#if profile.businessName}
							<div class="flex items-center gap-2">
								<Building class="w-5 h-5" />
								<span>{profile.businessName}</span>
							</div>
						{/if}
						{#if profile.location}
							<div class="flex items-center gap-2">
								<MapPin class="w-5 h-5" />
								<span>{profile.location}</span>
							</div>
						{/if}
						{#if profile.website}
							<a 
								href={profile.website}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center gap-2 hover:text-white transition-colors"
							>
								<Globe class="w-5 h-5" />
								<span>{profile.website.replace(/^https?:\/\//, '')}</span>
							</a>
						{/if}
					</div>
				</div>
			</div>
		</div>
		
		{#if profile.description}
			<div class="px-6 py-6">
				<h2 class="font-semibold mb-3" style="color: var(--text-primary);">About {profile.name}</h2>
				<p class="leading-relaxed" style="color: var(--text-secondary);">{profile.description}</p>
			</div>
		{/if}
	</div>
	
	<!-- Tours Available -->
	{#if tours.length > 0}
		<div class="rounded-xl mb-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h2 class="font-semibold" style="color: var(--text-primary);">Available Tours</h2>
				<p class="text-sm mt-1" style="color: var(--text-secondary);">Choose from {totalTours} tour{totalTours === 1 ? '' : 's'} offered by {profile.name}</p>
			</div>
			
			<div class="p-4">
				<div class="space-y-6">
					{#each tours as tour}
						<div class="rounded-lg border p-6" style="border-color: var(--border-primary); background: var(--bg-secondary);">
							<div class="grid gap-6 lg:grid-cols-3">
								<!-- Tour Info -->
								<div class="lg:col-span-2">
									<!-- Tour Image -->
									{#if tour.images && tour.images.length > 0}
										<div class="aspect-video rounded-lg mb-4 overflow-hidden" style="background: var(--bg-tertiary);">
											<img 
												src="/api/images/{tour.id}/{tour.images[0]}?size=large"
												alt={tour.name}
												class="w-full h-full object-cover"
											/>
										</div>
									{:else}
										<div class="aspect-video rounded-lg mb-4 flex items-center justify-center" style="background: var(--bg-tertiary);">
											<MapPin class="w-12 h-12" style="color: var(--text-tertiary);" />
										</div>
									{/if}
									
									<!-- Tour Details -->
									<h3 class="text-xl font-bold mb-3" style="color: var(--text-primary);">{tour.name}</h3>
									{#if tour.description}
										<p class="mb-4 leading-relaxed" style="color: var(--text-secondary);">{tour.description}</p>
									{/if}
									
									<div class="flex flex-wrap gap-4 text-sm mb-4" style="color: var(--text-secondary);">
										{#if tour.location}
											<span class="flex items-center gap-2">
												<MapPin class="w-4 h-4" />
												{tour.location}
											</span>
										{/if}
										{#if tour.duration}
											<span class="flex items-center gap-2">
												<Clock class="w-4 h-4" />
												{formatDuration(tour.duration)}
											</span>
										{/if}
										<span class="flex items-center gap-2">
											<Users class="w-4 h-4" />
											Up to {tour.capacity} people
										</span>
									</div>
									
									<div class="flex items-center gap-2 text-xl font-bold" style="color: var(--color-primary-600);">
										<Euro class="w-6 h-6" />
										<span>{tour.price} per person</span>
									</div>
								</div>
								
								<!-- Booking Section -->
								<div class="lg:col-span-1">
									<div class="rounded-lg p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
										<h4 class="font-semibold mb-3" style="color: var(--text-primary);">Available Times</h4>
										
										{#if tour.timeSlots && tour.timeSlots.length > 0}
											{@const nextSlots = getNextTimeSlots(tour.timeSlots, 3)}
											{#if nextSlots.length > 0}
												<div class="space-y-2 mb-4">
													{#each nextSlots as slot}
														<div class="p-3 rounded-lg border text-sm" style="border-color: var(--border-primary); background: var(--bg-secondary);">
															<div class="font-medium" style="color: var(--text-primary);">
																{formatDate(slot.startTime)}
															</div>
															<div style="color: var(--text-secondary);">
																{formatTime(slot.startTime)} - {formatTime(slot.endTime)}
															</div>
															<div class="text-xs mt-1" style="color: var(--text-tertiary);">
																{slot.availableSpots - slot.bookedSpots} spots available
															</div>
														</div>
													{/each}
												</div>
												
												<!-- QR Code -->
												{#if tour.qrCode}
													<div class="text-center">
														<a 
															href={getBookingPageURL(tour.qrCode)}
															class="block mb-3 hover:opacity-80 transition-opacity"
														>
															<img 
																src={getQRCodeURL(tour.qrCode)}
																alt="QR code to book {tour.name}"
																class="w-32 h-32 mx-auto rounded-lg"
																style="border: 2px solid var(--border-primary);"
															/>
														</a>
														<p class="text-sm mb-2" style="color: var(--text-secondary);">
															Scan to book instantly
														</p>
														<div class="text-xs px-3 py-2 rounded-full inline-block" style="background: var(--bg-tertiary); color: var(--text-tertiary);">
															{tour.qrCode}
														</div>
													</div>
												{:else}
													<div class="text-center py-4">
														<p class="text-sm mb-2" style="color: var(--text-secondary);">QR code not available</p>
														<p class="text-xs" style="color: var(--text-tertiary);">Contact {profile.name} directly to book</p>
													</div>
												{/if}
											{:else}
												<div class="text-center py-4">
													<p class="text-sm mb-2" style="color: var(--text-secondary);">No available times</p>
													<p class="text-xs" style="color: var(--text-tertiary);">Contact {profile.name} for custom scheduling</p>
												</div>
											{/if}
										{:else}
											<div class="text-center py-4">
												<p class="text-sm mb-2" style="color: var(--text-secondary);">Schedule upon request</p>
												<p class="text-xs" style="color: var(--text-tertiary);">Contact {profile.name} to arrange your tour</p>
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<!-- No Tours Available -->
		<div class="rounded-xl text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-8">
				<div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--bg-secondary);">
					<Calendar class="w-8 h-8" style="color: var(--text-tertiary);" />
				</div>
				<h3 class="text-xl font-semibold mb-2" style="color: var(--text-primary);">No Tours Available</h3>
				<p style="color: var(--text-secondary);">
					{profile.name} doesn't have any active tours at the moment. Please check back later or contact them directly.
				</p>
			</div>
		</div>
	{/if}
	
	<!-- How to Book -->
	<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<h2 class="font-semibold" style="color: var(--text-primary);">How to Book</h2>
		</div>
		<div class="p-6">
			<div class="grid gap-6 sm:grid-cols-3">
				<div class="text-center">
					<div class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style="background: var(--color-primary-50);">
						<QrCode class="w-6 h-6" style="color: var(--color-primary-600);" />
					</div>
					<h3 class="font-medium mb-2" style="color: var(--text-primary);">1. Scan QR Code</h3>
					<p class="text-sm" style="color: var(--text-secondary);">Use your phone to scan the QR code for the tour you want</p>
				</div>
				<div class="text-center">
					<div class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style="background: var(--color-primary-50);">
						<Calendar class="w-6 h-6" style="color: var(--color-primary-600);" />
					</div>
					<h3 class="font-medium mb-2" style="color: var(--text-primary);">2. Choose Time</h3>
					<p class="text-sm" style="color: var(--text-secondary);">Select from available time slots that work for you</p>
				</div>
				<div class="text-center">
					<div class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style="background: var(--color-primary-50);">
						<Euro class="w-6 h-6" style="color: var(--color-primary-600);" />
					</div>
					<h3 class="font-medium mb-2" style="color: var(--text-primary);">3. Pay & Confirm</h3>
					<p class="text-sm" style="color: var(--text-secondary);">Complete payment and receive your booking confirmation</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style> 
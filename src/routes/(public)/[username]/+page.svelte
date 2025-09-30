<script lang="ts">
	import type { PageData } from './$types.js';
	import { tourOwnerStore } from '$lib/stores/tourOwner.js';
	import { createPublicProfileQuery } from '$lib/queries/public-queries.js';
	import { formatTourOwnerCurrency } from '$lib/utils/currency.js';
	import { getTourDisplayPriceFormattedWithCurrency, formatCategoryName } from '$lib/utils/tour-helpers-client.js';
	import { generateQRImageURL, generateBookingURL } from '$lib/utils/qr-generation.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import User from 'lucide-svelte/icons/user';
	import Building from 'lucide-svelte/icons/building';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Globe from 'lucide-svelte/icons/globe';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Ticket from 'lucide-svelte/icons/ticket';
	import Info from 'lucide-svelte/icons/info';
	import Check from 'lucide-svelte/icons/check';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import CalendarDays from 'lucide-svelte/icons/calendar-days';
	
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
			<div class="space-y-6">
				<!-- Profile Card -->
				<div class="rounded-xl overflow-hidden fade-in" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<!-- Profile Content -->
					<div class="p-6">
						<div class="flex flex-col sm:flex-row gap-6">
							<!-- Avatar -->
							<div class="flex justify-center sm:justify-start">
								{#if profile.avatar}
									<img 
										src={profile.avatar} 
										alt={profile.name}
										class="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
										style="border: 3px solid var(--border-primary);"
									/>
								{:else}
									<div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center" 
										style="background: var(--bg-secondary); border: 3px solid var(--border-primary);">
										<User class="w-10 h-10 sm:w-12 sm:h-12" style="color: var(--text-tertiary);" />
									</div>
								{/if}
							</div>
							
							<!-- Profile Info -->
							<div class="flex-1 text-center sm:text-left">
								<div class="mb-4">
									<h1 class="text-2xl font-semibold mb-1" style="color: var(--text-primary);">{profile.name}</h1>
									<p class="text-sm" style="color: var(--text-secondary);">@{profile.username}</p>
								</div>
								
								{#if profile.description}
									<p class="text-sm leading-relaxed mb-4" style="color: var(--text-secondary);">
										{profile.description}
									</p>
								{/if}
								
								<!-- Info badges -->
								<div class="flex flex-wrap gap-3 text-sm">
									{#if profile.businessName}
										<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" style="background: var(--bg-secondary);">
											<Building class="w-4 h-4" style="color: var(--text-tertiary);" />
											<span style="color: var(--text-primary);">{profile.businessName}</span>
										</div>
									{/if}
									{#if profile.location}
										<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" style="background: var(--bg-secondary);">
											<MapPin class="w-4 h-4" style="color: var(--text-tertiary);" />
											<span style="color: var(--text-primary);">{profile.location}</span>
										</div>
									{/if}
									{#if profile.website}
										<a 
											href={profile.website}
											target="_blank"
											rel="noopener noreferrer"
											class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
											style="background: var(--bg-secondary); color: var(--text-primary);"
										>
											<Globe class="w-4 h-4" />
											<span class="text-sm">{profile.website.replace(/^https?:\/\//, '')}</span>
											<ExternalLink class="w-3 h-3" />
										</a>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Tours Section -->
				<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<div class="flex items-center justify-between">
							<h2 class="text-lg font-semibold" style="color: var(--text-primary);">
								Available Tours
							</h2>
							<span class="px-3 py-1 text-sm rounded-full font-medium" 
								style="background: var(--color-primary-50); color: var(--color-primary-600);">
								{totalTours} {totalTours === 1 ? 'Tour' : 'Tours'}
							</span>
						</div>
					</div>
					
					{#if tours.length > 0}
						<div class="p-6">
							<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{#each tours as tour}
									{@const nextSlot = getNextAvailableSlot(tour.timeSlots || [])}
									<div class="rounded-lg overflow-hidden transition-all hover:shadow-md" 
										style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
										<!-- Tour Image -->
										{#if tour.images && tour.images.length > 0}
											<div class="aspect-[16/10] overflow-hidden" style="background: var(--bg-secondary);">
												<img 
													src="/api/images/{tour.id}/{tour.images[0]}?size=medium"
													alt={tour.name}
													class="w-full h-full object-cover transition-transform hover:scale-105"
													loading="lazy"
												/>
											</div>
										{:else}
											<div class="aspect-[16/10] flex items-center justify-center" style="background: var(--bg-tertiary);">
												<MapPin class="w-12 h-12" style="color: var(--text-tertiary);" />
											</div>
										{/if}
										
										<!-- Tour Content -->
										<div class="p-4 flex flex-col">
											<h3 class="font-semibold mb-2 line-clamp-1" style="color: var(--text-primary);">
												{tour.name}
											</h3>
											
											{#if tour.description}
												<p class="text-sm mb-3 line-clamp-2" style="color: var(--text-secondary);">
													{tour.description}
												</p>
											{/if}
											
											<!-- Tour Info Grid -->
											<div class="grid grid-cols-2 gap-2 mb-3 text-sm">
												{#if tour.location}
													<div class="flex items-center gap-1.5">
														<MapPin class="w-3.5 h-3.5" style="color: var(--text-tertiary);" />
														<span style="color: var(--text-secondary);" class="truncate">{tour.location}</span>
													</div>
												{/if}
												{#if tour.duration}
													<div class="flex items-center gap-1.5">
														<Clock class="w-3.5 h-3.5" style="color: var(--text-tertiary);" />
														<span style="color: var(--text-secondary);">{formatDuration(tour.duration)}</span>
													</div>
												{/if}
											</div>

											<!-- Categories -->
											{#if tour.categories && tour.categories.length > 0}
												<div class="flex flex-wrap gap-1 mb-3">
													{#each tour.categories.slice(0, 3) as category}
														<span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border"
															style="
																background: var(--color-primary-50);
																border-color: var(--color-primary-200);
																color: var(--color-primary-700);
															"
														>
															{formatCategoryName(category)}
														</span>
													{/each}
													{#if tour.categories.length > 3}
														<span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border"
															style="
																background: var(--bg-secondary);
																border-color: var(--border-primary);
																color: var(--text-tertiary);
															"
														>
															+{tour.categories.length - 3}
														</span>
													{/if}
												</div>
											{/if}
											
											<!-- Pricing -->
											<div class="p-2.5 rounded-lg mb-3" style="background: var(--bg-secondary);">
												<div class="text-sm">
													{#if tour.enablePricingTiers && tour.pricingTiers}
														{#if parseFloat(tour.pricingTiers.child) < parseFloat(tour.pricingTiers.adult)}
															<div class="space-y-1">
																<div class="flex justify-between">
																	<span style="color: var(--text-secondary);">Adults</span>
																	<span class="font-semibold" style="color: var(--text-primary);">
																		{formatTourOwnerCurrency(tour.pricingTiers.adult, profile?.currency)}
																	</span>
																</div>
																<div class="flex justify-between">
																	<span style="color: var(--text-secondary);">Children</span>
																	<span class="font-semibold" style="color: var(--text-primary);">
																		{formatTourOwnerCurrency(tour.pricingTiers.child, profile?.currency)}
																	</span>
																</div>
															</div>
														{:else}
															<div class="flex justify-between">
																<span style="color: var(--text-secondary);">Per person</span>
																<span class="font-semibold" style="color: var(--text-primary);">
																	{formatTourOwnerCurrency(tour.pricingTiers.adult, profile?.currency)}
																</span>
															</div>
														{/if}
													{:else}
														<div class="flex justify-between">
															<span style="color: var(--text-secondary);">Per person</span>
															<span class="font-semibold" style="color: var(--text-primary);">
																{formatTourOwnerCurrency(tour.price, profile?.currency)}
															</span>
														</div>
													{/if}
												</div>
											</div>
											
											<!-- Next Available Slot -->
											{#if nextSlot}
												<div class="flex items-center gap-2 text-sm mb-4">
													<CalendarDays class="w-4 h-4" style="color: var(--color-primary-600);" />
													<div>
														<span class="font-medium" style="color: var(--text-primary);">
															{formatDate(nextSlot.startTime)}
														</span>
														<span style="color: var(--text-secondary);">
															• {formatSlotTimeRange(nextSlot.startTime, nextSlot.endTime)}
														</span>
													</div>
												</div>
											{:else}
												<div class="flex items-center gap-2 text-sm mb-4">
													<Info class="w-4 h-4" style="color: var(--text-tertiary);" />
													<span style="color: var(--text-tertiary);">
														No scheduled times
													</span>
												</div>
											{/if}
											
											<!-- CTA Button -->
											{#if tour.qrCode}
												<button 
													onclick={() => {
														window.location.href = getBookingPageURL(tour.qrCode);
													}}
													class="button-primary w-full"
												>
													<ArrowRight class="w-4 h-4" />
													View Details & Book
												</button>
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
								{/each}
							</div>
						</div>
					{:else}
						<div class="p-12 text-center">
							<Calendar class="w-12 h-12 mx-auto mb-3" style="color: var(--text-tertiary);" />
							<p style="color: var(--text-secondary);">
								No tours available at the moment
							</p>
						</div>
					{/if}
				</div>
				
				<!-- How Booking Works -->
				<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<h2 class="text-lg font-semibold" style="color: var(--text-primary);">
							How Booking Works
						</h2>
					</div>
					<div class="p-6">
						<div class="grid gap-6 sm:grid-cols-3">
							<div class="flex flex-col items-center text-center">
								<div class="w-12 h-12 mb-3 rounded-lg flex items-center justify-center" 
									style="background: var(--color-primary-50);">
									<span class="text-lg font-semibold" style="color: var(--color-primary-600);">1</span>
								</div>
								<h3 class="font-medium mb-1 text-sm" style="color: var(--text-primary);">Select Tour</h3>
								<p class="text-xs" style="color: var(--text-secondary);">
									Choose your preferred tour and date
								</p>
							</div>
							<div class="flex flex-col items-center text-center">
								<div class="w-12 h-12 mb-3 rounded-lg flex items-center justify-center" 
									style="background: var(--color-primary-50);">
									<span class="text-lg font-semibold" style="color: var(--color-primary-600);">2</span>
								</div>
								<h3 class="font-medium mb-1 text-sm" style="color: var(--text-primary);">Pay Securely</h3>
								<p class="text-xs" style="color: var(--text-secondary);">
									Complete payment via Stripe
								</p>
							</div>
							<div class="flex flex-col items-center text-center">
								<div class="w-12 h-12 mb-3 rounded-lg flex items-center justify-center" 
									style="background: var(--color-primary-50);">
									<span class="text-lg font-semibold" style="color: var(--color-primary-600);">3</span>
								</div>
								<h3 class="font-medium mb-1 text-sm" style="color: var(--text-primary);">Get Ticket</h3>
								<p class="text-xs" style="color: var(--text-secondary);">
									Receive instant QR ticket
								</p>
							</div>
						</div>
						
						<!-- Key Features -->
						<div class="mt-6 pt-6 border-t grid gap-3 sm:grid-cols-2" style="border-color: var(--border-primary);">
							<div class="flex items-center gap-2 text-sm">
								<Check class="w-4 h-4" style="color: var(--color-success-600);" />
								<span style="color: var(--text-secondary);">Instant confirmation</span>
							</div>
							<div class="flex items-center gap-2 text-sm">
								<Check class="w-4 h-4" style="color: var(--color-success-600);" />
								<span style="color: var(--text-secondary);">Secure payments</span>
							</div>
							<div class="flex items-center gap-2 text-sm">
								<Check class="w-4 h-4" style="color: var(--color-success-600);" />
								<span style="color: var(--text-secondary);">Mobile tickets</span>
							</div>
							<div class="flex items-center gap-2 text-sm">
								<Check class="w-4 h-4" style="color: var(--color-success-600);" />
								<span style="color: var(--text-secondary);">Easy check-in</span>
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
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
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
	
	/* Hover states for interactive elements */
	a[href*="http"]:hover {
		background: var(--bg-tertiary);
	}
	
	/* Image aspect ratio consistency */
	.aspect-\[16\/10\] {
		aspect-ratio: 16 / 10;
	}
	
	/* Button icon spacing */
	:global(.button-primary svg),
	:global(.button--secondary svg) {
		flex-shrink: 0;
	}
</style> 
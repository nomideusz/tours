<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import { formatEuro } from '$lib/utils/currency.js';
	import { 
		formatDuration,
		getTourStatusColor,
		getTourStatusDot,
		getImageUrl
	} from '$lib/utils/tour-client.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import type { Tour } from '$lib/types.js';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { browser } from '$app/environment';
	
	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Eye from 'lucide-svelte/icons/eye';
	import Plus from 'lucide-svelte/icons/plus';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Clock from 'lucide-svelte/icons/clock';
	import Edit from 'lucide-svelte/icons/edit';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Copy from 'lucide-svelte/icons/copy';
	import Share2 from 'lucide-svelte/icons/share-2';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import MoreVertical from 'lucide-svelte/icons/more-vertical';

	let { data }: { data: PageData } = $props();

	let tours = $state<Tour[]>((data.tours as unknown as Tour[]) || []);
	let copiedQRCode = $state<string | null>(null);
	let expandedTour = $state<string | null>(null);
	let statusUpdating = $state<string | null>(null);

	// Use stats from server (with fallbacks for type safety)
	let stats = $derived(data.stats || {
		totalTours: 0,
		activeTours: 0,
		draftTours: 0,
		monthlyTours: 0,
		totalRevenue: 0,
		todayBookings: 0,
		weekBookings: 0,
		monthRevenue: 0,
		totalBookings: 0,
		confirmedBookings: 0,
		totalParticipants: 0
	});

	// Update tours when data changes
	$effect(() => {
		tours = (data.tours as unknown as Tour[]) || [];
	});

	// Utility functions are now imported from shared utilities

	function getQRImageUrl(tour: Tour): string {
		if (!tour.qrCode) return '';
		const baseURL = browser ? window.location.origin : 'https://zaur.app';
		return generateQRImageURL(tour.qrCode, {
			size: 150,
			baseURL
		});
	}

	function copyQRUrl(tour: Tour) {
		if (!browser || !tour.qrCode) return;
		const baseURL = window.location.origin;
		const bookingUrl = `${baseURL}/book/${tour.qrCode}`;
		navigator.clipboard.writeText(bookingUrl);
		
		// Show feedback
		copiedQRCode = tour.qrCode;
		setTimeout(() => {
			copiedQRCode = null;
		}, 2000);
	}

	async function shareQR(tour: Tour) {
		if (!browser || !tour.qrCode) return;
		const baseURL = window.location.origin;
		const bookingUrl = `${baseURL}/book/${tour.qrCode}`;
		
		if (navigator.share) {
			try {
				await navigator.share({
					title: `Book ${tour.name}`,
					text: `Book your tour: ${tour.name}`,
					url: bookingUrl
				});
			} catch (err) {
				// Fallback to copy
				copyQRUrl(tour);
			}
		} else {
			// Fallback to copy
			copyQRUrl(tour);
		}
	}

	function toggleTourExpansion(tourId: string) {
		expandedTour = expandedTour === tourId ? null : tourId;
	}

	async function toggleTourStatus(tour: Tour) {
		if (!browser || statusUpdating) return;
		
		const newStatus = tour.status === 'active' ? 'draft' : 'active';
		statusUpdating = tour.id;

		try {
			const response = await fetch(`/api/tours/${tour.id}/status`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status: newStatus })
			});

			if (response.ok) {
				const result = await response.json();
				// Update local state
				tours = tours.map(t => 
					t.id === tour.id ? { ...t, status: newStatus } : t
				);
			} else {
				console.error('Failed to update tour status:', response.status, response.statusText);
			}
		} catch (error) {
			console.error('Failed to update tour status:', error);
		} finally {
			statusUpdating = null;
		}
	}
</script>

<svelte:head>
	<title>Tours - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<div class="mb-6 sm:mb-8">
		<PageHeader 
			title="Tours"
			subtitle="Manage your tour catalog, track performance, and grow your business"
		>
			<button onclick={() => goto('/tours/new')} class="hidden sm:flex button-primary button--gap">
				<Plus class="h-4 w-4 sm:h-5 sm:w-5" />
				Create Tour
			</button>
		</PageHeader>
	</div>

	<!-- Mobile Quick Actions -->
	<div class="sm:hidden mb-6">
		<div class="grid grid-cols-2 gap-3">
			<button
				onclick={() => goto('/tours/new')}
				class="button-primary button--gap button--small justify-center py-3"
			>
				<Plus class="h-4 w-4" />
				New Tour
			</button>
			<button
				onclick={() => goto('/dashboard')}
				class="button-secondary button--gap button--small justify-center py-3"
			>
				<Clock class="h-4 w-4" />
				Operations
			</button>
		</div>
	</div>

	<!-- Performance Overview -->
	<div class="mb-8">
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
			<StatsCard
				title="Total Tours"
				value={stats.totalTours}
				subtitle="{stats.activeTours} active"
				icon={MapPin}
				trend={stats.monthlyTours > 0 ? { value: `+${stats.monthlyTours} this month`, positive: true } : undefined}
				variant="small"
			/>

			<StatsCard
				title="Total Bookings"
				value={stats.totalBookings}
				subtitle="all time"
				icon={BarChart3}
				variant="small"
			/>

			<StatsCard
				title="Monthly Revenue"
				value={formatEuro(stats.monthRevenue)}
				subtitle="this month"
				icon={DollarSign}
				trend={stats.monthRevenue > 0 ? { value: "This month", positive: true } : undefined}
				variant="small"
			/>

			<StatsCard
				title="Total Participants"
				value={stats.totalParticipants}
				subtitle="all guests served"
				icon={Users}
				variant="small"
			/>
		</div>
	</div>

	<!-- Tours Section -->
	{#if tours.length === 0}
		<div class="rounded-xl p-8 sm:p-12" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<EmptyState
				icon={MapPin}
				title="No tours yet"
				description="Create your first tour to start receiving bookings and tracking performance"
				actionText="Create Your First Tour"
				onAction={() => goto('/tours/new')}
			/>
		</div>
	{:else}
		<!-- Section Header -->
		<div class="flex items-center justify-between mb-6">
			<div>
				<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Your Tours</h2>
				<p class="text-sm" style="color: var(--text-secondary);">Showing {tours.length} tours</p>
			</div>
		</div>

		<!-- Tours Grid -->
		<div class="grid gap-4 sm:gap-6">
			{#each tours as tour (tour.id)}
				<div class="rounded-xl transition-all duration-200 hover:shadow-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					
					<!-- Mobile Layout -->
					<div class="block sm:hidden">
						<div class="p-4 rounded-xl">
							<!-- Header Row -->
							<div class="flex items-start justify-between mb-3">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<h3 class="text-lg font-semibold truncate" style="color: var(--text-primary);">{tour.name}</h3>
										<Tooltip text="Click to {tour.status === 'active' ? 'deactivate' : 'activate'} tour" position="top">
											<button
												onclick={() => toggleTourStatus(tour)}
												disabled={statusUpdating === tour.id}
												class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed {getTourStatusColor(tour.status)}"
											>
												<span class="w-1.5 h-1.5 rounded-full {getTourStatusDot(tour.status)}"></span>
												{statusUpdating === tour.id ? 'Updating...' : tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
											</button>
										</Tooltip>
									</div>
									{#if tour.location}
										<div class="flex items-center gap-1 text-sm" style="color: var(--text-secondary);">
											<MapPin class="h-3 w-3" />
											<span class="truncate">{tour.location}</span>
										</div>
									{/if}
								</div>
								
								<!-- Mobile QR Code -->
								{#if tour.qrCode}
									<div class="flex-shrink-0 ml-3">
										<Tooltip text="Tap to copy booking URL" position="bottom-left">
											<button
												onclick={() => copyQRUrl(tour)}
												class="w-12 h-12 rounded-lg overflow-hidden transition-all duration-200 active:scale-95"
												style="border: 1px solid var(--border-primary);"
											>
												<img 
													src={getQRImageUrl(tour)} 
													alt="QR Code for {tour.name}"
													class="w-full h-full object-cover"
													loading="lazy"
												/>
											</button>
										</Tooltip>
										<p class="text-xs text-center mt-1" style="color: var(--text-tertiary);">{tour.qrCode}</p>
									</div>
								{/if}
							</div>

							<!-- Key Metrics Row -->
							<div class="grid grid-cols-4 gap-2 mb-4 p-3 rounded-lg" style="background: var(--bg-secondary);">
								<div class="text-center">
									<p class="text-sm font-bold" style="color: var(--text-primary);">€{tour.price}</p>
									<p class="text-xs" style="color: var(--text-tertiary);">Price</p>
								</div>
								<div class="text-center">
									<p class="text-sm font-bold" style="color: var(--text-primary);">{formatDuration(tour.duration)}</p>
									<p class="text-xs" style="color: var(--text-tertiary);">Duration</p>
								</div>
								<div class="text-center">
									<p class="text-sm font-bold" style="color: var(--text-primary);">{tour.capacity}</p>
									<p class="text-xs" style="color: var(--text-tertiary);">Max guests</p>
								</div>
								<div class="text-center">
									<p class="text-sm font-bold" style="color: var(--text-primary);">{tour.qrScans || 0}</p>
									<p class="text-xs" style="color: var(--text-tertiary);">QR scans</p>
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="grid grid-cols-2 gap-2">
								<button
									onclick={() => goto(`/tours/${tour.id}`)}
									class="button-primary button--small button--gap justify-center py-3"
								>
									<Eye class="h-4 w-4" />
									View & Stats
								</button>
								<button
									onclick={() => goto(`/tours/${tour.id}/schedule`)}
									class="button-secondary button--small button--gap justify-center py-3"
								>
									<Calendar class="h-4 w-4" />
									Schedule
								</button>
							</div>

							<!-- Secondary Actions -->
							<div class="grid grid-cols-3 gap-2 mt-2">
								<button
									onclick={() => goto(`/tours/${tour.id}/edit`)}
									class="button-secondary button--small px-3 py-2 justify-center"
								>
									<Edit class="h-3 w-3" />
									<span class="ml-1 text-xs">Edit</span>
								</button>
								{#if tour.qrCode}
									<Tooltip text="Share booking link" position="top">
										<button
											onclick={() => shareQR(tour)}
											class="button-secondary button--small px-3 py-2 justify-center"
										>
											<Share2 class="h-3 w-3" />
											<span class="ml-1 text-xs">Share</span>
										</button>
									</Tooltip>
									<a
										href="/book/{tour.qrCode}"
										target="_blank"
										rel="noopener noreferrer"
										class="button-secondary button--small px-3 py-2 justify-center"
									>
										<ExternalLink class="h-3 w-3" />
										<span class="ml-1 text-xs">Preview</span>
									</a>
								{:else}
									<div class="col-span-2"></div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Desktop Layout -->
					<div class="hidden sm:block">
						<div class="p-6 rounded-xl">
							<div class="flex gap-6">
								<!-- Tour Image -->
								<div class="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0" style="background: var(--bg-secondary);">
									{#if tour?.images?.[0]}
										{@const imageUrl = getImageUrl(tour, tour.images[0])}
										{#if imageUrl}
											<img 
												src={imageUrl} 
												alt={tour.name || 'Tour'}
												class="w-full h-full object-cover"
												loading="lazy"
											/>
										{:else}
											<div class="w-full h-full flex items-center justify-center">
												<MapPin class="h-8 w-8" style="color: var(--text-tertiary);" />
											</div>
										{/if}
									{:else}
										<div class="w-full h-full flex items-center justify-center">
											<MapPin class="h-8 w-8" style="color: var(--text-tertiary);" />
										</div>
									{/if}
								</div>

								<!-- Main Content -->
								<div class="flex-1 min-w-0">
									<div class="flex items-start justify-between">
										<!-- Tour Details -->
										<div class="flex-1 min-w-0">
											<!-- Title & Status -->
											<div class="flex items-start gap-3 mb-2">
												<h3 class="text-lg font-semibold" style="color: var(--text-primary);">{tour.name}</h3>
												<Tooltip text="Click to {tour.status === 'active' ? 'deactivate' : 'activate'} tour" position="top">
													<button
														onclick={() => toggleTourStatus(tour)}
														disabled={statusUpdating === tour.id}
														class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed {getTourStatusColor(tour.status)}"
													>
														<span class="w-1.5 h-1.5 rounded-full {getTourStatusDot(tour.status)}"></span>
														{statusUpdating === tour.id ? 'Updating...' : tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
													</button>
												</Tooltip>
											</div>

											<!-- Category & Location -->
											<div class="flex items-center gap-4 mb-3">
												{#if tour.category}
													<span class="text-sm px-2 py-1 rounded-md" style="background: var(--bg-tertiary); color: var(--text-secondary);">
														{tour.category}
													</span>
												{/if}
												{#if tour.location}
													<div class="flex items-center gap-1 text-sm" style="color: var(--text-secondary);">
														<MapPin class="h-3 w-3" />
														<span>{tour.location}</span>
													</div>
												{/if}
											</div>

											<!-- Quick Metrics -->
											<div class="grid grid-cols-4 gap-4 mb-4">
												<div class="text-center">
													<div class="flex items-center justify-center mb-1">
														<DollarSign class="h-4 w-4" style="color: var(--text-tertiary);" />
													</div>
													<p class="text-sm font-semibold" style="color: var(--text-primary);">€{tour.price}</p>
													<p class="text-xs" style="color: var(--text-tertiary);">Price</p>
												</div>
												<div class="text-center">
													<div class="flex items-center justify-center mb-1">
														<Clock class="h-4 w-4" style="color: var(--text-tertiary);" />
													</div>
													<p class="text-sm font-semibold" style="color: var(--text-primary);">{formatDuration(tour.duration)}</p>
													<p class="text-xs" style="color: var(--text-tertiary);">Duration</p>
												</div>
												<div class="text-center">
													<div class="flex items-center justify-center mb-1">
														<Users class="h-4 w-4" style="color: var(--text-tertiary);" />
													</div>
													<p class="text-sm font-semibold" style="color: var(--text-primary);">{tour.capacity}</p>
													<p class="text-xs" style="color: var(--text-tertiary);">Max guests</p>
												</div>
												<div class="text-center">
													<div class="flex items-center justify-center mb-1">
														<QrCode class="h-4 w-4" style="color: var(--text-tertiary);" />
													</div>
													<p class="text-sm font-semibold" style="color: var(--text-primary);">{tour.qrScans || 0}</p>
													<p class="text-xs" style="color: var(--text-tertiary);">QR scans</p>
												</div>
											</div>

											<!-- Description Preview -->
											{#if tour.description}
												<p class="text-sm line-clamp-2 mb-4" style="color: var(--text-secondary);">
													{tour.description}
												</p>
											{/if}

											<!-- Actions Row -->
											<div class="flex items-center gap-3">
												<button
													onclick={() => goto(`/tours/${tour.id}`)}
													class="button-primary button--small button--gap"
												>
													<Eye class="h-4 w-4" />
													View Details
												</button>
												<button
													onclick={() => goto(`/tours/${tour.id}/schedule`)}
													class="button-secondary button--small button--gap"
												>
													<Calendar class="h-4 w-4" />
													Schedule
												</button>
												<button
													onclick={() => goto(`/tours/${tour.id}/edit`)}
													class="button-secondary button--small button--gap"
												>
													<Edit class="h-4 w-4" />
													Edit
												</button>
											</div>
										</div>

										<!-- QR Code & Actions -->
										<div class="flex flex-col items-center gap-3 flex-shrink-0 ml-6">
											{#if tour.qrCode}
												<div class="relative">
													<Tooltip text="Click to copy booking URL" position="top">
														<button
															onclick={() => copyQRUrl(tour)}
															class="qr-button relative w-20 h-20 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg"
															style="border: 1px solid var(--border-primary);"
														>
															<img 
																src={getQRImageUrl(tour)} 
																alt="QR Code for {tour.name}"
																class="w-full h-full object-cover transition-opacity"
																loading="lazy"
															/>
															<!-- Copy icon overlay -->
															<div class="qr-overlay absolute inset-0 flex items-center justify-center opacity-0 transition-opacity">
																<div class="bg-white bg-opacity-90 rounded-full p-2 shadow-md">
																	<Copy class="h-4 w-4 text-gray-700" />
																</div>
															</div>
														</button>
													</Tooltip>
												</div>
												
												<p class="text-xs text-center" style="color: var(--text-tertiary);">{tour.qrCode}</p>

												<!-- QR Actions -->
												<div class="flex gap-1 justify-center">
													<Tooltip text="Share booking link" position="top">
														<button
															onclick={() => shareQR(tour)}
															class="flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-gray-100"
															style="color: var(--text-tertiary);"
														>
															<Share2 class="h-4 w-4" />
														</button>
													</Tooltip>
													<Tooltip text="Preview booking page" position="top">
														<a
															href="/book/{tour.qrCode}"
															target="_blank"
															rel="noopener noreferrer"
															class="flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-gray-100"
															style="color: var(--text-tertiary);"
														>
															<ExternalLink class="h-4 w-4" />
														</a>
													</Tooltip>
												</div>
											{:else}
												<div class="w-20 h-20 rounded-lg flex items-center justify-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
													<QrCode class="h-8 w-8" style="color: var(--text-tertiary);" />
												</div>
												<p class="text-xs text-center" style="color: var(--text-tertiary);">No QR</p>
											{/if}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Copy Success Toast -->
{#if copiedQRCode}
	<div class="fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-md flex items-center gap-3 animate-in slide-in-from-right duration-300" style="background: var(--bg-primary); border: 1px solid var(--color-success); color: var(--text-primary);">
		<div class="w-5 h-5 rounded-full flex items-center justify-center" style="background: var(--color-success-light);">
			<CheckCircle class="w-3 h-3" style="color: var(--color-success);" />
		</div>
		<span class="text-sm font-medium">Booking URL copied</span>
	</div>
{/if}

<style>
	.line-clamp-2 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.qr-button:hover img {
		opacity: 0.75;
	}

	.qr-button:hover .qr-overlay {
		opacity: 1;
	}

	@keyframes slide-in-from-right {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.slide-in-from-right {
		animation: slide-in-from-right 0.3s ease-out;
	}
</style> 
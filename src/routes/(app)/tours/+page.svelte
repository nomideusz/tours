<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import { formatEuro } from '$lib/utils/currency.js';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { Tour } from '$lib/types.js';
	
	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import Eye from 'lucide-svelte/icons/eye';
	import Plus from 'lucide-svelte/icons/plus';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Clock from 'lucide-svelte/icons/clock';
	import Edit from 'lucide-svelte/icons/edit';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import MoreHorizontal from 'lucide-svelte/icons/more-horizontal';

	let { data }: { data: PageData } = $props();

	let tours = $state<Tour[]>((data.tours as unknown as Tour[]) || []);

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

	function getStatusColor(status: Tour['status']) {
		switch (status) {
			case 'active':
				return 'bg-green-50 text-green-700 border-green-200';
			case 'draft':
				return 'bg-gray-50 text-gray-700 border-gray-200';
			default:
				return 'bg-gray-50 text-gray-700 border-gray-200';
		}
	}

	function getStatusDot(status: Tour['status']) {
		switch (status) {
			case 'active':
				return 'bg-green-500';
			case 'draft':
				return 'bg-gray-500';
			default:
				return 'bg-gray-500';
		}
	}

	function getImageUrl(tour: Tour | null | undefined, imagePath: string | null | undefined): string {
		if (!tour?.id || !imagePath || typeof imagePath !== 'string') return '';
		
		try {
			// Handle old PocketBase URLs
			if (imagePath.startsWith('http')) {
				return imagePath; // Return old URL as-is for backward compatibility
			}
			// Handle new local storage
			return `/uploads/tours/${encodeURIComponent(tour.id)}/${encodeURIComponent(imagePath)}`;
		} catch (error) {
			console.warn('Error generating image URL:', error);
			return '';
		}
	}

	function formatDuration(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
		}
		return `${mins}m`;
	}
</script>

<svelte:head>
	<title>Tours - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<div class="mb-6 sm:mb-8">
		<PageHeader 
			title="Tours"
			subtitle="Manage and track your tour offerings with improved performance"
		>
			<button onclick={() => goto('/tours/new')} class="hidden sm:flex button-primary button--gap">
				<Plus class="h-4 w-4 sm:h-5 sm:w-5" />
				Create Tour
			</button>
		</PageHeader>
	</div>

	<!-- Quick Actions - Mobile -->
	<div class="lg:hidden mb-6">
		<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<h3 class="text-base font-semibold mb-3" style="color: var(--text-primary);">Quick Actions</h3>
			<div class="grid grid-cols-2 gap-3">
				<button
					onclick={() => goto('/tours/new')}
					class="button-primary button--gap button--small justify-center py-3"
				>
					<Plus class="h-4 w-4" />
					New Tour
				</button>
				<button
					onclick={() => goto('/checkin-scanner')}
					class="button-primary button--gap button--small justify-center py-3"
				>
					<Eye class="h-4 w-4" />
					QR Scanner
				</button>
			</div>
		</div>
	</div>

	<!-- Content Container with Responsive Ordering -->
	<div class="flex flex-col">
		
		<!-- Tours List - First on mobile, Second on desktop -->
		<div class="order-1 lg:order-2 mb-6 lg:mb-0">
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
				<!-- Tours Grid -->
				<div class="space-y-4">
					<!-- Section Header -->
					<div class="flex items-center justify-between">
						<div>
							<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Your Tours</h2>
							<p class="text-sm" style="color: var(--text-secondary);">Showing {tours.length} tours</p>
						</div>
						<button 
							onclick={() => goto('/srurs')}
							class="button-secondary button--small button--gap"
						>
							<ExternalLink class="h-4 w-4" />
							<span class="hidden sm:inline">View Original</span>
							<span class="sm:hidden">Original</span>
						</button>
					</div>

					<!-- Tours Cards -->
					<div class="grid gap-4">
						{#each tours as tour (tour.id)}
							<div class="rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg group" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
								<div class="p-4 sm:p-6">
									<div class="flex gap-4 sm:gap-6">
										<!-- Tour Image -->
										<div class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0" style="background: var(--bg-secondary);">
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
														<MapPin class="h-6 w-6 sm:h-8 sm:w-8" style="color: var(--text-tertiary);" />
													</div>
												{/if}
											{:else}
												<div class="w-full h-full flex items-center justify-center">
													<MapPin class="h-6 w-6 sm:h-8 sm:w-8" style="color: var(--text-tertiary);" />
												</div>
											{/if}
										</div>

										<!-- Main Content -->
										<div class="flex-1 min-w-0">
											<div class="flex items-start justify-between gap-4">
												<!-- Tour Details -->
												<div class="flex-1 min-w-0">
													<!-- Title & Status -->
													<div class="flex items-start gap-3 mb-2">
														<h3 class="text-lg font-semibold truncate" style="color: var(--text-primary);">{tour.name}</h3>
														<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 {getStatusColor(tour.status)}">
															<span class="w-1.5 h-1.5 rounded-full {getStatusDot(tour.status)}"></span>
															{tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
														</span>
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
																<span class="truncate">{tour.location}</span>
															</div>
														{/if}
													</div>

													<!-- Quick Metrics -->
													<div class="grid grid-cols-3 gap-4 mb-4">
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
													</div>

													<!-- Description Preview -->
													{#if tour.description}
														<p class="text-sm line-clamp-2 mb-4" style="color: var(--text-secondary);">
															{tour.description}
														</p>
													{/if}

													<!-- Performance Metrics Placeholder -->
													<div class="grid grid-cols-2 gap-3 p-3 rounded-lg" style="background: var(--bg-secondary);">
														<div class="text-center">
															<p class="text-xs font-medium" style="color: var(--text-tertiary);">Today's Bookings</p>
															<p class="text-lg font-bold" style="color: var(--text-primary);">--</p>
														</div>
														<div class="text-center">
															<p class="text-xs font-medium" style="color: var(--text-tertiary);">Next Booking</p>
															<p class="text-sm font-medium" style="color: var(--text-secondary);">--</p>
														</div>
													</div>
												</div>

												<!-- QR Code & Actions -->
												<div class="flex flex-col items-center gap-3 flex-shrink-0">
													<!-- QR Code Placeholder -->
													<div class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
														<QrCode class="h-6 w-6 sm:h-8 sm:w-8" style="color: var(--text-tertiary);" />
													</div>
													<p class="text-xs text-center" style="color: var(--text-tertiary);">Main QR</p>

																						<!-- Actions -->
									<div class="flex flex-col sm:flex-row gap-2">
										<button
											onclick={() => goto(`/tours/${tour.id}`)}
											class="button-primary button--small px-3 py-2"
										>
											<Eye class="h-3 w-3 sm:h-4 sm:w-4" />
											<span class="hidden sm:inline ml-1">View</span>
										</button>
										<button
											onclick={() => goto(`/tours/${tour.id}/edit`)}
											class="button-secondary button--small px-3 py-2"
										>
											<Edit class="h-3 w-3 sm:h-4 sm:w-4" />
											<span class="hidden sm:inline ml-1">Edit</span>
										</button>
									</div>

													<!-- More Options -->
													<button class="p-2 rounded-lg transition-colors" style="color: var(--text-tertiary); hover:background: var(--bg-tertiary);">
														<MoreHorizontal class="h-4 w-4" />
													</button>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Stats Grid - Second on mobile, First on desktop -->
		<div class="order-2 lg:order-1 mb-6 lg:mb-8">
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
					title="Today's Bookings" 
					value={stats.todayBookings}
					subtitle="bookings for today"
					icon={Calendar}
					variant="small"
				/>

				<StatsCard
					title="Weekly Bookings"
					value={stats.weekBookings}
					subtitle="{stats.totalBookings} total bookings"
					icon={BarChart3}
					trend={stats.weekBookings > 0 ? { value: "This week", positive: true } : undefined}
					variant="small"
				/>

				<StatsCard
					title="Monthly Revenue"
					value={formatEuro(stats.monthRevenue)}
					subtitle="{stats.totalParticipants} total guests"
					icon={DollarSign}
					trend={stats.monthRevenue > 0 ? { value: "This month", positive: true } : undefined}
					variant="small"
				/>
			</div>
		</div>

	</div>
</div>

<style>
	.line-clamp-2 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
</style> 
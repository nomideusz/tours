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
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
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

	let { data }: { data: PageData } = $props();

	let copiedQRCode = $state<string | null>(null);
	let statusUpdating = $state<string | null>(null);

	// Use data directly from server with proper type casting
	let tours = $state((data.tours as unknown as Tour[]) || []);
	
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
				// Update local state instead of reloading
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
	<!-- Mobile-First Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Compact Header -->
		<MobilePageHeader
			title="Tours Management"
			secondaryInfo="{tours.length} tours"
			quickActions={[
				{
					label: 'New Draft',
					icon: Plus,
					onclick: () => goto('/tours/new'),
					variant: 'secondary'
				},
				{
					label: 'Create & Go Live',
					icon: Plus,
					onclick: () => goto('/tours/new?activate=true'),
					variant: 'primary'
				}
			]}
			infoItems={[
				{
					icon: MapPin,
					label: 'Total',
					value: `${stats.totalTours} tours`
				},
				{
					icon: BarChart3,
					label: 'Active',
					value: `${stats.activeTours} active`
				},
				{
					icon: DollarSign,
					label: 'Revenue',
					value: formatEuro(stats.monthRevenue)
				},
				{
					icon: Users,
					label: 'Bookings',
					value: `${stats.monthRevenue > 0 ? stats.totalBookings : 0} total`
				}
			]}
		/>

		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title="Tours Management"
				subtitle="Manage your tour catalog, track performance, and grow your business"
			>
				<div class="flex gap-3">
					<button onclick={() => goto('/tours/new')} class="button-secondary button--gap">
						<Plus class="h-4 w-4" />
						New Draft
					</button>
					<button onclick={() => goto('/tours/new?activate=true')} class="button-primary button--gap">
						<Plus class="h-4 w-4" />
						Create & Go Live
					</button>
				</div>
			</PageHeader>
		</div>
	</div>

	<!-- Tours Section -->
	{#if tours.length === 0}
		<div class="rounded-xl p-8 sm:p-12 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="max-w-md mx-auto">
				<div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<MapPin class="h-8 w-8 text-blue-600" />
				</div>
				<h3 class="text-xl font-semibold mb-2" style="color: var(--text-primary);">
					No tours yet
				</h3>
				<p class="text-sm mb-6" style="color: var(--text-secondary);">
					Create your first tour to start receiving bookings and tracking performance
				</p>
				<div class="flex flex-col sm:flex-row gap-3 justify-center">
					<button onclick={() => goto('/tours/new')} class="button-secondary button--gap">
						<Plus class="h-4 w-4" />
						Start with Draft
					</button>
					<button onclick={() => goto('/tours/new?activate=true')} class="button-primary button--gap">
						<Plus class="h-4 w-4" />
						Create & Go Live
					</button>
				</div>
			</div>
		</div>
	{:else}
		<!-- Performance Overview - Hidden on Mobile, Show on Desktop -->
		<div class="hidden sm:block mb-8">
			<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Performance Overview</h3>
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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

		<!-- Tours List -->
		<div class="space-y-4">
			{#each tours as tour (tour.id)}
				<div class="rounded-xl transition-all duration-200 hover:shadow-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					
					<!-- Mobile Layout - Simplified -->
					<div class="sm:hidden p-4">
						<div class="flex items-start gap-3">
							<!-- QR Code -->
							{#if tour.qrCode}
								<Tooltip text="Tap to copy booking URL" position="top">
									<button
										onclick={() => copyQRUrl(tour)}
										class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-200 active:scale-95"
										style="border: 1px solid var(--border-primary);"
									>
																			{#if copiedQRCode === tour.qrCode}
										<div class="w-full h-full flex items-center justify-center" style="background: var(--color-success-light);">
											<CheckCircle class="h-6 w-6" style="color: var(--color-success);" />
										</div>
									{:else if browser}
										<img 
											src={getQRImageUrl(tour)} 
											alt="QR Code for {tour.name}"
											class="w-full h-full object-cover"
											loading="lazy"
										/>
									{:else}
										<div class="w-full h-full flex items-center justify-center" style="background: var(--bg-secondary);">
											<QrCode class="h-6 w-6" style="color: var(--text-tertiary);" />
										</div>
									{/if}
									</button>
								</Tooltip>
							{:else}
								<div class="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
									<QrCode class="h-6 w-6" style="color: var(--text-tertiary);" />
								</div>
							{/if}

							<!-- Tour Info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-start justify-between mb-2">
									<h3 class="text-lg font-semibold truncate" style="color: var(--text-primary);">{tour.name}</h3>
									<Tooltip text="Click to {tour.status === 'active' ? 'deactivate' : 'activate'} tour" position="top">
										<button
											onclick={() => toggleTourStatus(tour)}
											disabled={statusUpdating === tour.id}
											class="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 transition-all duration-200 {getTourStatusColor(tour.status)}"
										>
											<span class="w-1.5 h-1.5 rounded-full {getTourStatusDot(tour.status)}"></span>
											{statusUpdating === tour.id ? 'Updating...' : tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
										</button>
									</Tooltip>
								</div>

								<!-- Key Info -->
								<div class="flex items-center gap-3 text-sm mb-3" style="color: var(--text-secondary);">
									<span class="font-medium">{formatEuro(tour.price)}</span>
									<span>•</span>
									<span>{formatDuration(tour.duration)}</span>
									<span>•</span>
									<span>{tour.capacity} max</span>
								</div>

								<!-- Actions -->
								<div class="flex gap-2">
									<button onclick={() => goto(`/tours/${tour.id}`)} class="flex-1 button-primary button--small button--gap justify-center">
										<Eye class="h-3 w-3" />
										View
									</button>
									<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="flex-1 button-secondary button--small button--gap justify-center">
										<Calendar class="h-3 w-3" />
										Schedule
									</button>
									<button onclick={() => goto(`/tours/${tour.id}/edit`)} class="button-secondary button--small button--icon">
										<Edit class="h-3 w-3" />
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Desktop Layout - Unchanged but cleaned up -->
					<div class="hidden sm:block">
						<div class="p-6">
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
												<button onclick={() => goto(`/tours/${tour.id}`)} class="button-primary button--small button--gap">
													<Eye class="h-4 w-4" />
													View Details
												</button>
												<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="button-secondary button--small button--gap">
													<Calendar class="h-4 w-4" />
													Schedule
												</button>
												<button onclick={() => goto(`/tours/${tour.id}/edit`)} class="button-secondary button--small button--gap">
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
																													{#if copiedQRCode === tour.qrCode}
															<div class="w-full h-full flex items-center justify-center" style="background: var(--color-success-light);">
																<CheckCircle class="h-8 w-8" style="color: var(--color-success);" />
															</div>
														{:else if browser}
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
														{:else}
															<div class="w-full h-full flex items-center justify-center" style="background: var(--bg-secondary);">
																<QrCode class="h-8 w-8" style="color: var(--text-tertiary);" />
															</div>
														{/if}
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

<!-- Copy Success Feedback - Simplified -->
{#if copiedQRCode}
	<div class="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right duration-300" style="background: var(--color-success); color: white;">
		<CheckCircle class="w-4 h-4" />
		<span class="text-sm font-medium">Copied!</span>
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
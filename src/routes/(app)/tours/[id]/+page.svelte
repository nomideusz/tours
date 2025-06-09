<script lang="ts">
	import type { PageData } from './$types.js';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { formatEuro } from '$lib/utils/currency.js';
	import { formatDate, formatTime, formatDateTime } from '$lib/utils/date-helpers.js';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { 
		formatDuration,
		getTourStatusColor,
		getTourStatusDot,
		getBookingStatusColor,
		getSlotStatusColor,
		getTourImageUrl,
		calculateConversionRate
	} from '$lib/utils/tour-helpers.js';
	import { browser } from '$app/environment';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	
	// Icons
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Edit from 'lucide-svelte/icons/edit';
	import Calendar from 'lucide-svelte/icons/calendar';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Share2 from 'lucide-svelte/icons/share-2';
	import Copy from 'lucide-svelte/icons/copy';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Download from 'lucide-svelte/icons/download';

	let { data }: { data: PageData } = $props();

	let tour = $derived(data.tour);
	let tourStats = $derived(data.tourStats);
	let upcomingSlots = $derived(data.upcomingSlots || []);
	let recentBookings = $derived(data.recentBookings || []);
	
	// State
	let copiedQRCode = $state(false);
	let statusUpdating = $state(false);

	// Calculate conversion rate using shared utility
	let conversionRate = $derived(calculateConversionRate(tourStats?.qrScans || 0, tourStats?.qrConversions || 0));

	function getQRImageUrl(): string {
		if (!tour.qrCode) return '';
		const baseURL = browser ? window.location.origin : 'https://zaur.app';
		return generateQRImageURL(tour.qrCode, {
			size: 200,
			baseURL
		});
	}

	// Image URL helper using shared utility
	function getImageUrl(imagePath: string | null | undefined): string {
		return getTourImageUrl(tour?.id || '', imagePath, 'large');
	}

	// Copy QR code to clipboard
	async function copyQRUrl() {
		if (!browser || !tour.qrCode) return;
		const baseURL = window.location.origin;
		const bookingUrl = `${baseURL}/book/${tour.qrCode}`;
		
		try {
			await navigator.clipboard.writeText(bookingUrl);
			copiedQRCode = true;
			setTimeout(() => {
				copiedQRCode = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy QR code:', err);
		}
	}

	async function shareQR() {
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
				copyQRUrl();
			}
		} else {
			// Fallback to copy
			copyQRUrl();
		}
	}

	function downloadQR() {
		if (!browser || !tour.qrCode) return;
		const link = document.createElement('a');
		link.href = getQRImageUrl();
		link.download = `qr-${tour.name.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
		link.click();
	}

	async function toggleTourStatus() {
		if (!browser || statusUpdating) return;
		
		const newStatus = tour.status === 'active' ? 'draft' : 'active';
		statusUpdating = true;

		try {
			const response = await fetch(`/api/tours/${tour.id}/status`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status: newStatus })
			});

			if (response.ok) {
				// Update local state
				tour = { ...tour, status: newStatus };
			} else {
				console.error('Failed to update tour status:', response.status, response.statusText);
			}
		} catch (error) {
			console.error('Failed to update tour status:', error);
		} finally {
			statusUpdating = false;
		}
	}
</script>

<svelte:head>
	<title>{tour.name} - Tour Details | Zaur</title>
	<meta name="description" content="Manage your {tour.name} tour - view statistics, bookings, and schedule." />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Header Section -->
	<div class="mb-6 sm:mb-8">
		<PageHeader 
			title={tour.name}
			subtitle={tour.description}
			breadcrumbs={[
				{ label: 'Tours', href: '/tours' },
				{ label: tour.name }
			]}
		>
			<button onclick={() => goto('/tours')} class="hidden sm:flex button-secondary button--gap mr-4">
				<ArrowLeft class="h-4 w-4" />
				Back to Tours
			</button>
			<div class="hidden sm:flex gap-3">
				<button onclick={() => goto(`/tours/${tour.id}/edit`)} class="button-secondary button--gap">
					<Edit class="h-4 w-4" />
					Edit Tour
				</button>
				<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="button-primary button--gap">
					<Calendar class="h-4 w-4" />
					Manage Schedule
				</button>
			</div>
		</PageHeader>
		
		<!-- Mobile Back Button -->
		<div class="sm:hidden mb-4">
			<button onclick={() => goto('/tours')} class="button-secondary button--gap button--small">
				<ArrowLeft class="h-4 w-4" />
				Back to Tours
			</button>
		</div>
	</div>

	<!-- Tour Status & Quick Info -->
	<div class="mb-8 p-4 sm:p-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div class="flex items-center gap-4">
				<Tooltip text="Click to {tour.status === 'active' ? 'deactivate' : 'activate'} tour" position="top">
					<button
						onclick={() => toggleTourStatus()}
						disabled={statusUpdating}
						class="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed {getTourStatusColor(tour.status)}"
					>
						<span class="w-2 h-2 rounded-full {getTourStatusDot(tour.status)}"></span>
						{statusUpdating ? 'Updating...' : tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
					</button>
				</Tooltip>
				
				<div class="hidden sm:flex items-center gap-6 text-sm" style="color: var(--text-secondary);">
					<div class="flex items-center gap-1">
						<MapPin class="h-4 w-4" />
						<span>{tour.location}</span>
					</div>
					<div class="flex items-center gap-1">
						<Clock class="h-4 w-4" />
						<span>{formatDuration(tour.duration)}</span>
					</div>
					<div class="flex items-center gap-1">
						<Users class="h-4 w-4" />
						<span>Max {tour.capacity} guests</span>
					</div>
					<div class="flex items-center gap-1">
						<DollarSign class="h-4 w-4" />
						<span>{formatEuro(tour.price)} per person</span>
					</div>
				</div>
			</div>
			
			<!-- Mobile Quick Actions -->
			<div class="sm:hidden grid grid-cols-2 gap-2">
				<button onclick={() => goto(`/tours/${tour.id}/edit`)} class="button-secondary button--small button--gap justify-center">
					<Edit class="h-4 w-4" />
					Edit
				</button>
				<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="button-primary button--small button--gap justify-center">
					<Calendar class="h-4 w-4" />
					Schedule
				</button>
			</div>
		</div>
		
		<!-- Mobile Quick Info -->
		<div class="sm:hidden mt-4 grid grid-cols-2 gap-3 text-sm" style="color: var(--text-secondary);">
			<div class="flex items-center gap-1">
				<MapPin class="h-3 w-3" />
				<span class="truncate">{tour.location}</span>
			</div>
			<div class="flex items-center gap-1">
				<Clock class="h-3 w-3" />
				<span>{formatDuration(tour.duration)}</span>
			</div>
			<div class="flex items-center gap-1">
				<Users class="h-3 w-3" />
				<span>Max {tour.capacity}</span>
			</div>
			<div class="flex items-center gap-1">
				<DollarSign class="h-3 w-3" />
				<span>{formatEuro(tour.price)}</span>
			</div>
		</div>
	</div>

	<!-- Performance Statistics -->
	<div class="mb-8">
		<h2 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Performance Overview</h2>
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
			<StatsCard
				title="Total Revenue"
				value={formatEuro(tourStats?.totalRevenue || 0)}
				subtitle="all time earnings"
				icon={DollarSign}
				variant="small"
			/>
			
			<StatsCard
				title="Total Bookings"
				value={tourStats?.totalBookings || 0}
				subtitle="{tourStats?.confirmedBookings || 0} confirmed"
				icon={BarChart3}
				variant="small"
			/>
			
			<StatsCard
				title="Participants"
				value={tourStats?.totalParticipants || 0}
				subtitle="guests served"
				icon={Users}
				variant="small"
			/>
			
			<StatsCard
				title="Conversion Rate"
				value="{conversionRate.toFixed(1)}%"
				subtitle="{tourStats?.qrScans || 0} scans, {tourStats?.qrConversions || 0} bookings"
				icon={TrendingUp}
				variant="small"
			/>
		</div>
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
		
		<!-- Left Column: Tour Visual & QR -->
		<div class="lg:col-span-1 space-y-6">
			
			<!-- Tour Images -->
			{#if tour.images && tour.images.length > 0}
				<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<h3 class="font-semibold" style="color: var(--text-primary);">Tour Gallery</h3>
					</div>
					<div class="p-4">
						<div class="grid gap-3">
							{#each tour.images.slice(0, 3) as imagePath, index}
								{@const imageUrl = getImageUrl(imagePath)}
								{#if imageUrl}
									<div class="aspect-video rounded-lg overflow-hidden" style="background: var(--bg-secondary);">
										<img 
											src={imageUrl} 
											alt="{tour.name} - Image {index + 1}"
											class="w-full h-full object-cover"
											loading="lazy"
										/>
									</div>
								{/if}
							{/each}
							{#if tour.images.length > 3}
								<div class="text-center py-2">
									<span class="text-sm" style="color: var(--text-secondary);">
										+{tour.images.length - 3} more images
									</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- QR Code Section -->
			{#if tour.qrCode}
				<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<h3 class="font-semibold" style="color: var(--text-primary);">QR Code</h3>
						<p class="text-sm mt-1" style="color: var(--text-secondary);">Share this code for bookings</p>
					</div>
					<div class="p-6 text-center">
						<div class="inline-block p-4 rounded-xl" style="background: var(--bg-secondary);">
							<img 
								src={getQRImageUrl()} 
								alt="QR Code for {tour.name}"
								class="w-40 h-40 mx-auto"
								loading="lazy"
							/>
						</div>
						
						<div class="mt-4">
							<p class="text-sm font-medium mb-3" style="color: var(--text-primary);">{tour.qrCode}</p>
							<div class="flex justify-center gap-2">
								<Tooltip text="Copy booking URL" position="top">
									<button
										onclick={() => copyQRUrl()}
										class="button-secondary button--small button--icon"
									>
										<Copy class="h-4 w-4" />
									</button>
								</Tooltip>
								<Tooltip text="Share booking link" position="top">
									<button
										onclick={() => shareQR()}
										class="button-secondary button--small button--icon"
									>
										<Share2 class="h-4 w-4" />
									</button>
								</Tooltip>
								<Tooltip text="Download QR code" position="top">
									<button
										onclick={() => downloadQR()}
										class="button-secondary button--small button--icon"
									>
										<Download class="h-4 w-4" />
									</button>
								</Tooltip>
								<Tooltip text="Preview booking page" position="top">
									<a
										href="/book/{tour.qrCode}"
										target="_blank"
										rel="noopener noreferrer"
										class="button-secondary button--small button--icon"
									>
										<ExternalLink class="h-4 w-4" />
									</a>
								</Tooltip>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Quick Stats -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h3 class="font-semibold" style="color: var(--text-primary);">Quick Stats</h3>
				</div>
				<div class="p-4">
					<div class="space-y-3">
						<div class="flex justify-between">
							<span style="color: var(--text-secondary);">Today's Bookings</span>
							<span class="font-medium" style="color: var(--text-primary);">{tourStats?.todayBookings || 0}</span>
						</div>
						<div class="flex justify-between">
							<span style="color: var(--text-secondary);">This Week</span>
							<span class="font-medium" style="color: var(--text-primary);">{tourStats?.weekBookings || 0}</span>
						</div>
						<div class="flex justify-between">
							<span style="color: var(--text-secondary);">This Month</span>
							<span class="font-medium" style="color: var(--text-primary);">{tourStats?.monthBookings || 0}</span>
						</div>
						<div class="flex justify-between">
							<span style="color: var(--text-secondary);">Pending Bookings</span>
							<span class="font-medium text-yellow-600">{tourStats?.pendingBookings || 0}</span>
						</div>
						<div class="flex justify-between">
							<span style="color: var(--text-secondary);">Upcoming Slots</span>
							<span class="font-medium text-green-600">{tourStats?.upcomingSlots || 0}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Right Column: Upcoming Slots & Recent Bookings -->
		<div class="lg:col-span-2 space-y-6">
			
			<!-- Upcoming Time Slots -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 sm:p-6 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold" style="color: var(--text-primary);">Upcoming Time Slots</h3>
						<button 
							onclick={() => goto(`/tours/${tour.id}/schedule`)}
							class="button-secondary button--small"
						>
							Manage All
						</button>
					</div>
				</div>
				<div class="p-4 sm:p-6">
					{#if upcomingSlots.length > 0}
						<div class="space-y-4">
							{#each upcomingSlots as slot}
								<div class="flex items-center justify-between p-4 rounded-lg" style="background: var(--bg-secondary);">
									<div class="flex-1">
										<p class="font-medium" style="color: var(--text-primary);">
											{formatDate(slot.startTime)} • {formatTime(slot.startTime)}
										</p>
										<p class="text-sm mt-1" style="color: var(--text-secondary);">
											{slot.bookedSpots} of {tour.capacity} spots booked
										</p>
									</div>
									<div class="flex items-center gap-3">
										<span class="px-2 py-1 text-xs font-medium rounded-full border {getSlotStatusColor(slot.status)}">
											{slot.status}
										</span>
										<div class="w-16 h-2 rounded-full" style="background: var(--bg-tertiary);">
											<div 
												class="h-2 rounded-full transition-all duration-300"
												style="width: {tour.capacity > 0 ? Math.min((slot.bookedSpots / tour.capacity) * 100, 100) : 0}%; background: var(--color-primary-600);"
											></div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-12">
							<div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--bg-secondary);">
								<Calendar class="w-8 h-8" style="color: var(--text-tertiary);" />
							</div>
							<p class="font-medium mb-2" style="color: var(--text-primary);">No upcoming time slots</p>
							<p class="text-sm mb-4" style="color: var(--text-secondary);">Schedule time slots to start receiving bookings</p>
							<button 
								onclick={() => goto(`/tours/${tour.id}/schedule`)}
								class="button-primary button--gap"
							>
								<Calendar class="h-4 w-4" />
								Add Time Slots
							</button>
						</div>
					{/if}
				</div>
			</div>

			<!-- Recent Bookings -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 sm:p-6 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold" style="color: var(--text-primary);">Recent Bookings</h3>
						<button 
							onclick={() => goto(`/bookings?tour=${tour.id}`)}
							class="button-secondary button--small"
						>
							View All
						</button>
					</div>
				</div>
				<div class="p-4 sm:p-6">
					{#if recentBookings.length > 0}
						<div class="space-y-4">
							{#each recentBookings as booking}
								<div class="flex items-center justify-between p-4 rounded-lg" style="background: var(--bg-secondary);">
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-3 mb-2">
											<p class="font-medium truncate" style="color: var(--text-primary);">{booking.customerName}</p>
											<span class="px-2 py-1 text-xs font-medium rounded-full border flex-shrink-0 {getBookingStatusColor(booking.status)}">
												{booking.status}
											</span>
										</div>
										<p class="text-sm truncate" style="color: var(--text-secondary);">{booking.customerEmail}</p>
										<div class="flex items-center gap-3 mt-1 text-xs" style="color: var(--text-tertiary);">
											<span>{booking.participants} guest{booking.participants !== 1 ? 's' : ''}</span>
											<span>•</span>
											<span>{formatEuro(booking.totalAmount)}</span>
											<span>•</span>
											<span>{formatDate(booking.createdAt)}</span>
										</div>
									</div>
									<div class="text-right flex-shrink-0 ml-4">
										<p class="text-sm font-medium" style="color: var(--text-primary);">#{booking.bookingReference}</p>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-12">
							<div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: var(--bg-secondary);">
								<BarChart3 class="w-8 h-8" style="color: var(--text-tertiary);" />
							</div>
							<p class="font-medium mb-2" style="color: var(--text-primary);">No bookings yet</p>
							<p class="text-sm mb-4" style="color: var(--text-secondary);">Share your QR code to start receiving bookings</p>
							<button 
								onclick={() => shareQR()}
								class="button-primary button--gap"
							>
								<Share2 class="h-4 w-4" />
								Share QR Code
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Copy Success Toast -->
{#if copiedQRCode}
	<div class="fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-md flex items-center gap-3 slide-in-from-right" style="background: var(--bg-primary); border: 1px solid var(--color-success); color: var(--text-primary);">
		<div class="w-5 h-5 rounded-full flex items-center justify-center" style="background: var(--color-success-light);">
			<CheckCircle class="w-3 h-3" style="color: var(--color-success);" />
		</div>
		<span class="text-sm font-medium">Booking URL copied</span>
	</div>
{/if}

<style>
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
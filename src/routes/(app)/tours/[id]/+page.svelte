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
	} from '$lib/utils/tour-client.js';
	import { browser } from '$app/environment';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	
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

	// Get booking URL helper
	function getBookingUrl(): string {
		if (!browser || !tour.qrCode) return '';
		return `${window.location.origin}/book/${tour.qrCode}`;
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
	<!-- Compact Mobile Header + Desktop Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Compact Header -->
		<MobilePageHeader
			title={tour.name}
			statusButton={{
				label: statusUpdating ? 'Updating...' : tour.status.charAt(0).toUpperCase() + tour.status.slice(1),
				onClick: toggleTourStatus,
				disabled: statusUpdating,
				color: getTourStatusColor(tour.status),
				dotColor: getTourStatusDot(tour.status),
				tooltip: `Click to ${tour.status === 'active' ? 'deactivate' : 'activate'} tour`
			}}
			secondaryInfo={formatEuro(tour.price)}
			quickActions={[
				{
					label: 'Edit',
					icon: Edit,
					onClick: () => goto(`/tours/${tour.id}/edit`),
					variant: 'secondary'
				},
				{
					label: 'Schedule',
					icon: Calendar,
					onClick: () => goto(`/tours/${tour.id}/schedule`),
					variant: 'primary'
				},
				{
					label: 'Share',
					icon: Share2,
					onClick: shareQR,
					variant: 'secondary',
					size: 'icon'
				}
			]}
			infoItems={[
				{
					icon: MapPin,
					label: 'Location',
					value: tour.location || 'Not specified'
				},
				{
					icon: Clock,
					label: 'Duration',
					value: formatDuration(tour.duration)
				},
				{
					icon: Users,
					label: 'Capacity',
					value: `Max ${tour.capacity}`
				},
				{
					icon: BarChart3,
					label: 'Bookings',
					value: `${tourStats?.totalBookings || 0} total`
				}
			]}
		/>

		<!-- Desktop Header -->
		<div class="hidden sm:block">
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
		</div>
	</div>

	<!-- Desktop Tour Status & Quick Info -->
	<div class="mb-8">
		<div class="hidden sm:block p-4 sm:p-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
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
				
				<!-- Desktop Quick Actions -->
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
			</div>
		</div>
	</div>

	<!-- Mobile-First Content Layout -->
	
	<!-- 1. QR Code Section - Most Important for Tour Guides -->
	{#if tour.qrCode}
		<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold" style="color: var(--text-primary);">QR Code</h3>
					<span class="text-xs px-2 py-1 rounded-full" style="background: var(--color-primary-100); color: var(--color-primary-700);">
						{tourStats?.qrScans || 0} scans
					</span>
				</div>
			</div>
			<div class="p-4">
				<!-- Mobile: Horizontal QR Layout -->
				<div class="sm:hidden flex items-center gap-4">
					<div class="flex-shrink-0">
						<img 
							src={getQRImageUrl()} 
							alt="QR Code for {tour.name}"
							class="w-20 h-20 rounded-lg"
							loading="lazy"
						/>
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium mb-2 break-all" style="color: var(--text-primary);">{getBookingUrl()}</p>
						<div class="flex gap-2">
							<button onclick={() => copyQRUrl()} class="flex-1 button-secondary button--small button--gap justify-center" class:opacity-50={copiedQRCode}>
								{#if copiedQRCode}
									<CheckCircle class="h-3 w-3" style="color: var(--color-success);" />
									Copied!
								{:else}
									<Copy class="h-3 w-3" />
									Copy
								{/if}
							</button>
							<button onclick={() => shareQR()} class="flex-1 button-primary button--small button--gap justify-center">
								<Share2 class="h-3 w-3" />
								Share
							</button>
						</div>
					</div>
				</div>
				
				<!-- Desktop: Centered QR Layout -->
				<div class="hidden sm:block text-center">
					<div class="inline-block p-4 rounded-xl" style="background: var(--bg-secondary);">
						<img 
							src={getQRImageUrl()} 
							alt="QR Code for {tour.name}"
							class="w-40 h-40 mx-auto"
							loading="lazy"
						/>
					</div>
					<div class="mt-4">
						<p class="text-sm font-medium mb-3 break-all text-center" style="color: var(--text-primary);">{getBookingUrl()}</p>
						<div class="flex justify-center gap-2">
							<Tooltip text="Copy booking URL" position="top">
								<button onclick={() => copyQRUrl()} class="button-secondary button--small button--icon" class:opacity-50={copiedQRCode}>
									{#if copiedQRCode}
										<CheckCircle class="h-4 w-4" style="color: var(--color-success);" />
									{:else}
										<Copy class="h-4 w-4" />
									{/if}
								</button>
							</Tooltip>
							<Tooltip text="Share booking link" position="top">
								<button onclick={() => shareQR()} class="button-secondary button--small button--icon">
									<Share2 class="h-4 w-4" />
								</button>
							</Tooltip>
							<Tooltip text="Download QR code" position="top">
								<button onclick={() => downloadQR()} class="button-secondary button--small button--icon">
									<Download class="h-4 w-4" />
								</button>
							</Tooltip>
							<Tooltip text="Preview booking page" position="top">
								<a href="/book/{tour.qrCode}" target="_blank" rel="noopener noreferrer" class="button-secondary button--small button--icon">
									<ExternalLink class="h-4 w-4" />
								</a>
							</Tooltip>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- 2. Today's Operations - Critical for Daily Use -->
	<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold" style="color: var(--text-primary);">Today's Operations</h3>
				<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="button-secondary button--small">
					<Calendar class="h-3 w-3 mr-1" />
					Schedule
				</button>
			</div>
		</div>
		<div class="p-4">
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
				<div>
					<div class="text-lg font-bold" style="color: var(--text-primary);">{tourStats?.todayBookings || 0}</div>
					<div class="text-xs" style="color: var(--text-secondary);">Today's Bookings</div>
				</div>
				<div>
					<div class="text-lg font-bold text-yellow-600">{tourStats?.pendingBookings || 0}</div>
					<div class="text-xs" style="color: var(--text-secondary);">Pending</div>
				</div>
				<div>
					<div class="text-lg font-bold text-green-600">{tourStats?.upcomingSlots || 0}</div>
					<div class="text-xs" style="color: var(--text-secondary);">Upcoming Slots</div>
				</div>
				<div>
					<div class="text-lg font-bold" style="color: var(--text-primary);">{tourStats?.weekBookings || 0}</div>
					<div class="text-xs" style="color: var(--text-secondary);">This Week</div>
				</div>
			</div>
		</div>
	</div>

	<!-- 3. Upcoming Slots & Recent Bookings - Operational Info -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
		<!-- Upcoming Time Slots -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold" style="color: var(--text-primary);">Next Slots</h3>
					<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="text-xs" style="color: var(--color-primary-600);">
						View All
					</button>
				</div>
			</div>
			<div class="p-4">
				{#if upcomingSlots.length > 0}
					<div class="space-y-3">
						{#each upcomingSlots.slice(0, 3) as slot}
							<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-secondary);">
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium" style="color: var(--text-primary);">
										{formatDate(slot.startTime)} • {formatTime(slot.startTime)}
									</p>
									<p class="text-xs mt-1" style="color: var(--text-secondary);">
										{slot.bookedSpots}/{tour.capacity} booked
									</p>
								</div>
								<div class="flex items-center gap-2">
									<span class="px-2 py-1 text-xs rounded-full {getSlotStatusColor(slot.status)}">
										{slot.status}
									</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8">
						<Calendar class="w-8 h-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
						<p class="text-sm" style="color: var(--text-secondary);">No upcoming slots</p>
						<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="text-xs mt-2" style="color: var(--color-primary-600);">
							Add Time Slots
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Recent Bookings -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold" style="color: var(--text-primary);">Recent Bookings</h3>
					<button onclick={() => goto(`/bookings?tour=${tour.id}`)} class="text-xs" style="color: var(--color-primary-600);">
						View All
					</button>
				</div>
			</div>
			<div class="p-4">
				{#if recentBookings.length > 0}
					<div class="space-y-3">
						{#each recentBookings.slice(0, 3) as booking}
							<div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-secondary);">
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium truncate" style="color: var(--text-primary);">{booking.customerName}</p>
									<div class="flex items-center gap-2 mt-1">
										<span class="text-xs" style="color: var(--text-secondary);">{booking.participants} guests</span>
										<span class="text-xs" style="color: var(--text-tertiary);">•</span>
										<span class="text-xs" style="color: var(--text-secondary);">{formatEuro(booking.totalAmount)}</span>
									</div>
								</div>
								<span class="px-2 py-1 text-xs rounded-full {getBookingStatusColor(booking.status)}">
									{booking.status}
								</span>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8">
						<BarChart3 class="w-8 h-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
						<p class="text-sm" style="color: var(--text-secondary);">No bookings yet</p>
						<button onclick={() => shareQR()} class="text-xs mt-2" style="color: var(--color-primary-600);">
							Share QR Code
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- 4. Performance Statistics - Analytics -->
	<div class="mb-6">
		<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Performance Overview</h3>
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

	<!-- 5. Tour Gallery - Visual Content (Lowest Priority) -->
	{#if tour.images && tour.images.length > 0}
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h3 class="font-semibold" style="color: var(--text-primary);">Tour Gallery</h3>
			</div>
			<div class="p-4">
				<!-- Mobile: Horizontal Scroll -->
				<div class="sm:hidden flex gap-3 overflow-x-auto pb-2">
					{#each tour.images.slice(0, 5) as imagePath, index}
						{@const imageUrl = getImageUrl(imagePath)}
						{#if imageUrl}
							<div class="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden" style="background: var(--bg-secondary);">
								<img 
									src={imageUrl} 
									alt="{tour.name} - Image {index + 1}"
									class="w-full h-full object-cover"
									loading="lazy"
								/>
							</div>
						{/if}
					{/each}
					{#if tour.images.length > 5}
						<div class="flex-shrink-0 w-24 h-16 rounded-lg flex items-center justify-center text-xs" style="background: var(--bg-secondary); color: var(--text-secondary);">
							+{tour.images.length - 5}
						</div>
					{/if}
				</div>
				
				<!-- Desktop: Grid Layout -->
				<div class="hidden sm:grid gap-3 grid-cols-2 lg:grid-cols-3">
					{#each tour.images.slice(0, 6) as imagePath, index}
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
					{#if tour.images.length > 6}
						<div class="aspect-video rounded-lg flex items-center justify-center text-sm" style="background: var(--bg-secondary); color: var(--text-secondary);">
							+{tour.images.length - 6} more images
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* No custom styles needed - using design system */
</style> 
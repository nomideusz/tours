<script lang="ts">
	// @ts-nocheck
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate } from '$lib/utils/date-helpers.js';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { 
		formatDuration,
		calculateConversionRate,
		getConversionRateText,
		toggleTourStatus,
		getTourBookingStatus,
		getTourDisplayPriceFormatted,
		getTourImageUrl
	} from '$lib/utils/tour-helpers-client.js';
	import { 
		formatSlotTimeRange
	} from '$lib/utils/time-slot-client.js';
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	
	// TanStack Query
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { invalidatePublicTourData } from '$lib/queries/public-queries.js';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
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
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Download from 'lucide-svelte/icons/download';
	import Plus from 'lucide-svelte/icons/plus';
	import UserCheck from 'lucide-svelte/icons/user-check';

	// Get data from load function
	let { data } = $props();
	let tourId = $derived(data.tourId);
	
	// TanStack Query client for invalidation
	const queryClient = useQueryClient();
	
	// TanStack Query for tour details
	let tourQuery = $derived(createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000,    // 5 minutes
	}));

	// Also fetch schedule data for proper slot information (like the schedule page does)
	let scheduleQuery = $derived(createQuery({
		queryKey: queryKeys.tourSchedule(tourId),
		queryFn: () => queryFunctions.fetchTourSchedule(tourId),
		staleTime: 30 * 1000, // 30 seconds - shorter for real-time updates
		gcTime: 2 * 60 * 1000, // 2 minutes
		refetchOnWindowFocus: true, // Refetch when user returns to tab
	}));

	let tour = $derived($tourQuery.data?.tour || null);
	let tourStats = $derived($tourQuery.data?.tourStats || {});
	// Use schedule data for richer slot information
	let allTimeSlots = $derived($scheduleQuery.data?.timeSlots || []);
	// @ts-ignore
	let upcomingSlots = $derived(allTimeSlots.filter((slot) => slot.isUpcoming));
	let isLoading = $derived($tourQuery.isLoading || $scheduleQuery.isLoading);
	let isError = $derived($tourQuery.isError || $scheduleQuery.isError);
	
	// Calculate pending bookings for upcoming slots only
	let upcomingPendingCount = $derived(
		// @ts-ignore
		upcomingSlots.reduce((count, slot) => count + (slot.pendingBookings || 0), 0)
	);
	
	// State
	let copiedQRCode = $state(false);
	let copiedEmbedCode = $state(false);
	let statusUpdating = $state(false);
	let showWidget = $state(false);
	let selectedImageIndex = $state(false ? 0 : null);

	// Calculate conversion rate using shared utility
	let conversionRate = $derived(calculateConversionRate(tourStats?.qrScans || 0, tourStats?.qrConversions || 0));
	
	// Cleanup on destroy
	onDestroy(() => {
		if (browser && selectedImageIndex !== null) {
			document.body.style.overflow = '';
		}
	});

	// Calculate slot occupancy percentage (same as schedule page)
	// @ts-ignore
	function getOccupancyPercentage(slot) {
		if (!slot.capacity || slot.capacity === 0) return 0;
		return Math.round((slot.totalParticipants / slot.capacity) * 100);
	}

	// @ts-ignore
	function getOccupancyColor(percentage) {
		if (percentage >= 90) return 'text-red-600 font-semibold';
		if (percentage >= 70) return 'text-orange-600 font-medium';
		if (percentage >= 50) return 'text-blue-600';
		return 'text-green-600';
	}

	// @ts-ignore
	function quickCheckIn(slotId) {
		// Navigate to check-in scanner with pre-selected slot
		goto(`/checkin-scanner?slot=${slotId}`);
	}

	function getQRImageUrl() {
		if (!tour.qrCode) return '';
		const baseURL = browser ? window.location.origin : 'https://zaur.app';
		return generateQRImageURL(tour.qrCode, {
			size: 200,
			baseURL
		});
	}

	// Get booking URL helper
	function getBookingUrl() {
		if (!browser || !tour.qrCode) return '';
		return `${window.location.origin}/book/${tour.qrCode}`;
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

	async function handleTourStatusToggle() {
		if (!browser || statusUpdating) return;
		statusUpdating = true;
		
		try {
			const newStatus = await toggleTourStatus(tour);
			
			if (newStatus) {
				// Update local state
				tour = { ...tour, status: newStatus };
				
				// Immediately invalidate queries to ensure fresh data across all pages
				queryClient.invalidateQueries({ queryKey: queryKeys.toursStats });
				queryClient.invalidateQueries({ queryKey: queryKeys.userTours });
				queryClient.invalidateQueries({ queryKey: queryKeys.tourDetails(tour.id) });
				queryClient.invalidateQueries({ queryKey: queryKeys.tourSchedule(tour.id) });
				
				// Also invalidate public data if tour has QR code
				if (tour.qrCode) {
					invalidatePublicTourData(queryClient, tour.qrCode);
				}
			}
		} finally {
			statusUpdating = false;
		}
	}

	// Embed widget functions
	function getEmbedCode() {
		if (!browser || !tour.qrCode) return '';
		const baseURL = window.location.origin;
		return `<iframe src="${baseURL}/embed/book/${tour.qrCode}?theme=auto" width="100%" height="220" frameborder="0" style="border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); border: none;"></iframe>`;
	}

	async function copyEmbedCode() {
		if (!browser) return;
		
		try {
			await navigator.clipboard.writeText(getEmbedCode());
			copiedEmbedCode = true;
			setTimeout(() => {
				copiedEmbedCode = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy embed code:', err);
		}
	}
</script>

<svelte:head>
	<title>{tour?.name || 'Tour'} - Tour Details | Zaur</title>
	<meta name="description" content="Manage your {tour?.name || 'tour'} - view statistics, bookings, and schedule." />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	{#if isLoading}
		<div class="p-8 text-center">
			<div class="form-spinner mb-4"></div>
			<p class="text-sm" style="color: var(--text-secondary);">Loading tour details...</p>
		</div>
	{:else if isError || !tour}
		<div class="mb-6 rounded-xl p-4" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium" style="color: var(--color-danger-900);">Failed to load tour</p>
					<p class="text-sm mt-1" style="color: var(--color-danger-700);">Please try refreshing the page.</p>
				</div>
				<button onclick={() => goto('/tours')} class="button-secondary button--small">
					Back to Tours
				</button>
			</div>
		</div>
	{:else}
		<!-- Compact Success Notification -->
		{#if browser && (page.url.searchParams.get('created') === 'true' || page.url.searchParams.get('scheduled') === 'true' || page.url.searchParams.get('edited') === 'true')}
			{@const isCreated = page.url.searchParams.get('created') === 'true'}
			{@const isScheduled = page.url.searchParams.get('scheduled') === 'true'}
			{@const isEdited = page.url.searchParams.get('edited') === 'true'}
			<div class="mb-4 rounded-lg p-3 flex items-center gap-3" style="background: var(--color-success-light); border: 1px solid var(--color-success-200);">
				<CheckCircle class="h-5 w-5 flex-shrink-0" style="color: var(--color-success);" />
				<div class="flex-1">
					<p class="text-sm font-medium" style="color: var(--color-success-900);">
						{#if isCreated}
							Tour created successfully! {tour.status === 'draft' ? 'Activate it when ready.' : "It's now live!"}
						{:else if isScheduled}
							Schedule created! Your time slots are ready for bookings.
						{:else if isEdited}
							Changes saved successfully!
						{/if}
					</p>
				</div>
				{#if isCreated && (!upcomingSlots || upcomingSlots.length === 0)}
					<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="button-primary button--small button--gap">
						<Plus class="h-3 w-3" />
						Add Slots
					</button>
				{/if}
			</div>
		{/if}
		
		<!-- Header Section -->
		<div class="mb-6 sm:mb-8">
		<!-- Mobile Compact Header -->
		<MobilePageHeader
			title={tour.name}
			secondaryInfo="{getTourDisplayPriceFormatted(tour)} per person"
			statusButton={{
				label: getTourBookingStatus(tour).label,
				color: getTourBookingStatus(tour).color,
				dotColor: getTourBookingStatus(tour).dotColor,
				tooltip: getTourBookingStatus(tour).description,
				onclick: getTourBookingStatus(tour).status === 'draft' ? () => handleTourStatusToggle() : 
						getTourBookingStatus(tour).status === 'no-slots' ? () => goto(`/tours/${tour.id}/schedule`) : 
						() => handleTourStatusToggle(),
				disabled: statusUpdating
			}}
			quickActions={[
				{
					label: 'Bookings',
					icon: Users,
					onclick: () => goto(`/tours/${tour.id}/bookings`),
					variant: 'primary'
				},
				{
					label: 'Edit',
					icon: Edit,
					onclick: () => goto(`/tours/${tour.id}/edit`),
					variant: 'secondary'
				},
				{
					label: 'Schedule',
					icon: Calendar,
					onclick: () => goto(`/tours/${tour.id}/schedule`),
					variant: 'secondary'
				},
				{
					label: 'Share',
					icon: Share2,
					onclick: () => shareQR(),
					variant: 'secondary'
				}
			]}
			infoItems={[
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
				},
				{
					icon: Calendar,
					label: 'Next slot',
					value: upcomingSlots.length > 0 ? formatDate(upcomingSlots[0].startTime) : 'None scheduled'
				}
			]}
		/>

		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title={tour.name}
				breadcrumbs={[
					{ label: 'Tours', href: '/tours?refresh=true' },
					{ label: tour.name }
				]}
			>
				<button onclick={() => goto('/tours?refresh=true')} class="hidden sm:flex button-secondary button--gap mr-4">
					<ArrowLeft class="h-4 w-4" />
					Back to Tours
				</button>
				
				<!-- Tour Status Button -->
				{@const status = getTourBookingStatus(tour)}
				<Tooltip text={status.status === 'bookable' ? 'Click to pause bookings (set to draft)' : status.description} position="bottom">
					<button 
						onclick={status.status === 'draft' ? () => handleTourStatusToggle() : 
								status.status === 'no-slots' ? () => goto(`/tours/${tour.id}/schedule`) : 
								() => handleTourStatusToggle()}
						disabled={statusUpdating}
						class="button-secondary button--gap mr-6"
						style="background-color: {status.color}; color: var(--color-white); border-color: {status.color};"
					>
						<span class="w-2 h-2 rounded-full {status.dotColor}"></span>
						{status.label}
					</button>
				</Tooltip>
				
				<div class="hidden sm:flex gap-3">
					<button onclick={() => goto(`/tours/${tour.id}/bookings`)} class="button-secondary button--gap">
						<Users class="h-4 w-4" />
						View Bookings
					</button>
					<button onclick={() => goto(`/tours/${tour.id}/edit`)} class="button-secondary button--gap">
						<Edit class="h-4 w-4" />
						Edit Tour
					</button>
					<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="button-secondary button--gap">
						<Calendar class="h-4 w-4" />
						Manage Schedule
					</button>
				</div>
			</PageHeader>
		</div>
	</div>

	<!-- Mobile-First Content Layout -->
	
	<!-- 1. QR Code & Booking - Most Important for Tour Guides -->
	{#if tour.qrCode}
		<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold" style="color: var(--text-primary);">QR Code & Booking Link</h3>
					<span class="text-xs px-2 py-1 rounded-full" style="background: var(--color-primary-100); color: var(--color-primary-700);">
						{tourStats?.qrScans || 0} scans • {getConversionRateText(tourStats?.qrScans || 0, tourStats?.qrConversions || 0)} conversion
					</span>
				</div>
			</div>
			<div class="p-4">
				<!-- Mobile Layout -->
				<div class="sm:hidden">
					<div class="flex items-center gap-4">
						<div class="flex-shrink-0">
							<Tooltip text="Tap to copy booking URL" position="right">
								<button
									onclick={() => copyQRUrl()}
									class="relative w-20 h-20 rounded-lg overflow-hidden transition-all duration-200 active:scale-95"
									style="border: 1px solid var(--border-primary);"
								>
									{#if copiedQRCode}
										<div class="w-full h-full flex items-center justify-center" style="background: var(--color-success-light);">
											<CheckCircle class="h-8 w-8" style="color: var(--color-success);" />
										</div>
									{:else if browser}
										<img 
											src={getQRImageUrl()} 
											alt="QR Code for {tour.name}"
											class="w-full h-full object-cover"
											loading="lazy"
										/>
									{:else}
										<div class="w-full h-full flex items-center justify-center" style="background: var(--bg-secondary);">
											<QrCode class="h-8 w-8" style="color: var(--text-tertiary);" />
										</div>
									{/if}
								</button>
							</Tooltip>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium mb-2 break-all" style="color: var(--text-primary);">{getBookingUrl()}</p>
							<div class="flex gap-2">
								<button onclick={() => copyQRUrl()} class="flex-1 button-primary button--small button--gap justify-center" class:opacity-50={copiedQRCode}>
									{#if copiedQRCode}
										<CheckCircle class="h-3 w-3" style="color: var(--color-success);" />
										Copied!
									{:else}
										<Copy class="h-3 w-3" />
										Copy Link
									{/if}
								</button>
								<button onclick={() => shareQR()} class="button-secondary button--small button--icon">
									<Share2 class="h-3 w-3" />
								</button>
								<a
									href="/book/{tour.qrCode}"
									target="_blank"
									rel="noopener noreferrer"
									class="button-secondary button--small button--icon"
								>
									<ExternalLink class="h-3 w-3" />
								</a>
							</div>
						</div>
					</div>
				</div>

				<!-- Desktop Layout -->
				<div class="hidden sm:block">
					<div class="flex flex-col justify-center p-6 rounded-xl" style="background: var(--bg-secondary);">
						<div class="text-center">
							<div class="inline-block p-3 rounded-lg mb-4" style="background: var(--bg-primary);">
								<img 
									src={getQRImageUrl()} 
									alt="QR Code for {tour.name}"
									class="w-32 h-32 mx-auto"
									loading="lazy"
								/>
							</div>
							<p class="text-sm font-medium break-all px-4 py-2 rounded-md mb-4" style="color: var(--text-primary); background: var(--bg-primary);">{getBookingUrl()}</p>
							<div class="flex justify-center gap-2">
								<Tooltip text="Copy booking URL" position="top">
									<button onclick={() => copyQRUrl()} class="button-primary button--gap" class:opacity-50={copiedQRCode}>
										{#if copiedQRCode}
											<CheckCircle class="h-4 w-4" style="color: var(--color-success);" />
											Copied!
										{:else}
											<Copy class="h-4 w-4" />
											Copy Link
										{/if}
									</button>
								</Tooltip>
								<Tooltip text="Share booking link" position="top">
									<button onclick={() => shareQR()} class="button-secondary button--icon">
										<Share2 class="h-4 w-4" />
									</button>
								</Tooltip>
								<Tooltip text="Download QR code" position="top">
									<button onclick={() => downloadQR()} class="button-secondary button--icon">
										<Download class="h-4 w-4" />
									</button>
								</Tooltip>
								<Tooltip text="Preview booking page" position="top">
									<a href="/book/{tour.qrCode}" target="_blank" rel="noopener noreferrer" class="button-secondary button--icon">
										<ExternalLink class="h-4 w-4" />
									</a>
								</Tooltip>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- 2. Tour Overview -->
	<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<!-- Quick Stats Bar -->
		<div class="p-4 border-b" style="background: var(--bg-secondary); border-color: var(--border-primary); border-radius: var(--radius-lg) var(--radius-lg) 0 0;">
			<div class="flex flex-wrap gap-4 justify-center text-sm">
				<div class="flex items-center gap-2">
					<DollarSign class="h-4 w-4" style="color: var(--text-tertiary);" />
					<div class="flex items-baseline gap-1">
						<span style="color: var(--text-primary);">{getTourDisplayPriceFormatted(tour)}</span>
						{#if tour.enablePricingTiers && tour.pricingTiers?.child !== undefined}
							<span class="text-xs" style="color: var(--text-secondary);">
								/ {$globalCurrencyFormatter(tour.pricingTiers.child)} child
							</span>
						{/if}
					</div>
				</div>
				<div class="flex items-center gap-2">
					<Clock class="h-4 w-4" style="color: var(--text-tertiary);" />
					<span style="color: var(--text-primary);">{formatDuration(tour.duration)}</span>
				</div>
				<div class="flex items-center gap-2">
					<Users class="h-4 w-4" style="color: var(--text-tertiary);" />
					<span style="color: var(--text-primary);">Max {tour.capacity}</span>
				</div>
				<div class="flex items-center gap-2">
					<MapPin class="h-4 w-4" style="color: var(--text-tertiary);" />
					<span style="color: var(--text-primary);">{tour.location || 'Not set'}</span>
				</div>
				{#if tour.category}
					<div class="flex items-center gap-2">
						<span class="px-2 py-1 text-xs rounded-md font-medium" style="background: var(--bg-tertiary); color: var(--text-primary);">
							{tour.category}
						</span>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Tour Details -->
		<div class="p-4 space-y-4">
			{#if tour.description}
				<div>
					<p class="text-sm" style="color: var(--text-secondary);">{tour.description}</p>
				</div>
			{/if}
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#if tour.includedItems && tour.includedItems.length > 0}
					<div>
						<h4 class="text-sm font-medium mb-2" style="color: var(--text-primary);">What's Included</h4>
						<ul class="space-y-1">
							{#each tour.includedItems as item}
								<li class="flex items-start gap-2 text-sm" style="color: var(--text-secondary);">
									<CheckCircle class="h-4 w-4 flex-shrink-0 mt-0.5 text-green-600" />
									<span>{item}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				
				{#if tour.requirements && tour.requirements.length > 0}
					<div>
						<h4 class="text-sm font-medium mb-2" style="color: var(--text-primary);">Requirements</h4>
						<ul class="space-y-1">
							{#each tour.requirements as requirement}
								<li class="flex items-start gap-2 text-sm" style="color: var(--text-secondary);">
									<span class="text-orange-600 mt-0.5">•</span>
									<span>{requirement}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
			
			{#if tour.cancellationPolicy}
				<div class="pt-3 border-t" style="border-color: var(--border-primary);">
					<h4 class="text-sm font-medium mb-2" style="color: var(--text-primary);">Cancellation Policy</h4>
					<p class="text-sm" style="color: var(--text-secondary);">{tour.cancellationPolicy}</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- 3. Upcoming Schedule -->
	<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold" style="color: var(--text-primary);">Upcoming Schedule</h3>
				<div class="flex items-center gap-2">
					{#if upcomingPendingCount > 0}
						<span class="px-2 py-0.5 text-xs rounded-full" style="background: var(--color-warning-100); color: var(--color-warning-700); border: 1px solid var(--color-warning-200);">
							{upcomingPendingCount} pending
						</span>
					{/if}
					<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="button-secondary button--small button--gap">
						<Calendar class="h-3 w-3" />
						<span class="hidden sm:inline">Full Schedule</span>
					</button>
				</div>
			</div>
		</div>
		<div class="p-4">
			{#if upcomingSlots.length > 0}
				<div class="mb-4">
					<div class="space-y-2">
						{#each upcomingSlots.slice(0, 5) as slot}
							<div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" 
								style="background: var(--bg-secondary);"
								onclick={() => goto(`/tours/${tour.id}/schedule`)}
								onkeydown={(e) => e.key === 'Enter' && goto(`/tours/${tour.id}/schedule`)}
								role="button"
								tabindex="0"
							>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-3">
										<div>
											<p class="text-sm font-medium" style="color: var(--text-primary);">
												{formatDate(slot.startTime)} • {formatSlotTimeRange(slot.startTime, slot.endTime)}
											</p>
											<div class="flex items-center gap-3 mt-1">
												<span class="text-xs {getOccupancyColor(getOccupancyPercentage(slot))}">
													{slot.totalParticipants}/{slot.capacity} guests
												</span>
												{#if slot.totalBookings > 0}
													<span class="text-xs" style="color: var(--text-secondary);">
														{slot.confirmedBookings} confirmed
														{#if slot.pendingBookings > 0}
															• {slot.pendingBookings} pending
														{/if}
													</span>
												{:else}
													<span class="text-xs" style="color: var(--text-tertiary);">No bookings yet</span>
												{/if}
											</div>
										</div>
									</div>
								</div>
								<div class="flex items-center gap-2">
									{#if slot.isUpcoming}
										<Tooltip text="Quick check-in" position="left">
											<button 
												onclick={(e) => { e.stopPropagation(); quickCheckIn(slot.id); }}
												class="button-secondary button--small button--icon"
											>
												<UserCheck class="h-3 w-3" />
											</button>
										</Tooltip>
									{/if}
								</div>
							</div>
						{/each}
					</div>

				</div>
			{:else}
				<div class="text-center py-8">
					<Calendar class="w-8 h-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
					<p class="text-sm mb-3" style="color: var(--text-secondary);">No time slots scheduled</p>
					<button onclick={() => goto(`/tours/${tour.id}/schedule?new=true`)} class="button-primary button--gap">
						<Plus class="h-4 w-4" />
						Add Time Slots
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- 4. Tour Gallery -->
	{#if tour.images && tour.images.length > 0}
		<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold" style="color: var(--text-primary);">Gallery</h3>
					<span class="text-xs" style="color: var(--text-secondary);">{tour.images.length} {tour.images.length === 1 ? 'image' : 'images'}</span>
				</div>
			</div>
			<div class="p-4">
				<!-- Responsive Grid -->
				<div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
					{#each tour.images as imagePath, index}
						{@const imageUrl = getTourImageUrl(tour.id, imagePath, 'medium')}
						{#if imageUrl && index < 11}
							<button
								onclick={() => selectedImageIndex = index}
								class="aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
								style="background: var(--bg-secondary); padding: 0; border: none;"
							>
								<img 
									src={imageUrl} 
									alt="{tour.name} - Image {index + 1}"
									class="w-full h-full object-cover"
									loading="lazy"
								/>
							</button>
						{/if}
					{/each}
					{#if tour.images.length > 11}
						<button
							onclick={() => selectedImageIndex = 0}
							class="aspect-square rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
							style="background: var(--bg-secondary); color: var(--text-secondary); border: none;"
						>
							<div class="text-center">
								<span class="text-lg font-medium">+{tour.images.length - 11}</span>
								<span class="text-xs block">more</span>
							</div>
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- 5. Website Widget - Collapsible Advanced Feature -->
	{#if tour.qrCode}
		<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<button
				onclick={() => showWidget = !showWidget}
				class="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
				style="border-radius: inherit;"
			>
				<div>
					<h3 class="font-semibold" style="color: var(--text-primary);">Website Booking Widget</h3>
					<p class="text-sm mt-1" style="color: var(--text-secondary);">
						Embed a booking form directly on your website
					</p>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-xs px-2 py-1 rounded-full" style="background: var(--bg-tertiary); color: var(--text-tertiary);">
						Advanced
					</span>
					<svg 
						class="w-5 h-5 transition-transform duration-200 {showWidget ? 'rotate-180' : ''}" 
						style="color: var(--text-secondary);"
						fill="none" 
						stroke="currentColor" 
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</div>
			</button>
			
			{#if showWidget}
				<div class="border-t" style="border-color: var(--border-primary);">
					<div class="p-4">
						<div class="max-w-2xl mx-auto space-y-4">
							<p class="text-sm mb-4" style="color: var(--text-secondary);">
								Add this widget to your website for seamless direct bookings. The widget is responsive and matches your website's theme automatically.
							</p>
							
							<!-- Widget Preview -->
							<div class="mb-4">
								<iframe
									src="/embed/book/{tour.qrCode}?theme=auto"
									width="100%"
									height="320"
									frameborder="0"
									title="Booking widget for {tour.name}"
									class="bg-white rounded-lg shadow-sm"
									style="border: 1px solid var(--border-primary);"
								></iframe>
							</div>
							
							<!-- Embed Code Action -->
							<div class="space-y-3">
								<button 
									onclick={() => copyEmbedCode()}
									class="w-full button-primary button--gap justify-center"
									class:opacity-50={copiedEmbedCode}
								>
									{#if copiedEmbedCode}
										<CheckCircle class="h-4 w-4" style="color: var(--color-success);" />
										Embed Code Copied!
									{:else}
										<Copy class="h-4 w-4" />
										Copy HTML Embed Code
									{/if}
								</button>
								
								<!-- Quick Tips -->
								<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
									<p class="text-xs font-medium mb-2" style="color: var(--text-primary);">💡 Integration Benefits:</p>
									<ul class="text-xs space-y-1" style="color: var(--text-secondary);">
										<li>• <strong>No redirects:</strong> Customers book directly on your site</li>
										<li>• <strong>Responsive design:</strong> Works on desktop and mobile</li>
										<li>• <strong>Auto theme:</strong> Matches your website's dark/light mode</li>
										<li>• <strong>Real-time sync:</strong> All bookings appear in your dashboard</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}

{/if}

<!-- Image Lightbox - Moved outside container for proper z-index layering -->
{#if selectedImageIndex !== null && tour.images}
	<!-- Prevent body scroll when lightbox is open -->
	{#if browser}
		{@const _ = (() => { 
			document.body.style.overflow = 'hidden'; 
			document.documentElement.style.overflow = 'hidden';
		})()}
		{@const __ = () => { 
			document.body.style.overflow = ''; 
			document.documentElement.style.overflow = '';
		}}
	{/if}
	<div 
		class="fixed inset-0 flex items-center justify-center p-4"
		style="background: rgba(0, 0, 0, 0.95); z-index: 100;"
		onclick={() => {
			selectedImageIndex = null;
			if (browser) {
				document.body.style.overflow = '';
				document.documentElement.style.overflow = '';
			}
		}}
		role="button"
		tabindex="0"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				selectedImageIndex = null;
				if (browser) {
					document.body.style.overflow = '';
					document.documentElement.style.overflow = '';
				}
			}
			if (e.key === 'ArrowRight' && selectedImageIndex !== null && selectedImageIndex < tour.images.length - 1) selectedImageIndex++;
			if (e.key === 'ArrowLeft' && selectedImageIndex !== null && selectedImageIndex > 0) selectedImageIndex--;
		}}
	>
		<button
			onclick={() => {
				selectedImageIndex = null;
				if (browser) {
					document.body.style.overflow = '';
					document.documentElement.style.overflow = '';
				}
			}}
			class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
			aria-label="Close"
		>
			<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
		
		<!-- Navigation arrows -->
		{#if selectedImageIndex > 0}
			<button
				onclick={(e) => {
					e.stopPropagation();
					if (selectedImageIndex !== null) selectedImageIndex--;
				}}
				class="absolute left-4 text-white hover:text-gray-300 transition-colors"
				aria-label="Previous image"
			>
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
		{/if}
		
		{#if selectedImageIndex < tour.images.length - 1}
			<button
				onclick={(e) => {
					e.stopPropagation();
					if (selectedImageIndex !== null) selectedImageIndex++;
				}}
				class="absolute right-4 text-white hover:text-gray-300 transition-colors"
				aria-label="Next image"
			>
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		{/if}
		
		<img 
			src={getTourImageUrl(tour.id, tour.images[selectedImageIndex], 'large')} 
			alt="{tour.name} - Image {selectedImageIndex + 1}"
			class="max-w-full max-h-full object-contain"
		/>
		
		<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
			{selectedImageIndex + 1} / {tour.images.length}
		</div>
	</div>
{/if}
</div>
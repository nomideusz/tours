<script lang="ts">
	// @ts-nocheck
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate, getStatusColor, getPaymentStatusColor } from '$lib/utils/date-helpers.js';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { 
		formatDuration,
		calculateConversionRate,
		getConversionRateText,
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
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import TourStatusToggle from '$lib/components/TourStatusToggle.svelte';
	import Portal from '$lib/components/Portal.svelte';
	import StyledQRCode from '$lib/components/StyledQRCode.svelte';
	
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
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import CircleDollarSign from 'lucide-svelte/icons/circle-dollar-sign';
	import ReceiptText from 'lucide-svelte/icons/receipt-text';

	// Get data from load function
	let { data } = $props();
	let tourId = $derived(data.tourId);
	
	// TanStack Query client for invalidation
	const queryClient = useQueryClient();
	
	// TanStack Query for tour details
	let tourQuery = $derived(createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 30 * 1000, // 30 seconds for faster updates
		gcTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	}));

	// Also fetch schedule data for proper slot information (like the schedule page does)
	let scheduleQuery = $derived(createQuery({
		queryKey: queryKeys.tourSchedule(tourId),
		queryFn: () => queryFunctions.fetchTourSchedule(tourId),
		staleTime: 30 * 1000, // 30 seconds - shorter for real-time updates
		gcTime: 2 * 60 * 1000, // 2 minutes
		refetchOnWindowFocus: true, // Refetch when user returns to tab
		refetchOnMount: true,
	}));

	// Fetch recent bookings for this tour
	let tourBookingsQuery = $derived(createQuery({
		queryKey: queryKeys.tourBookings(tourId),
		queryFn: () => queryFunctions.fetchTourBookings(tourId),
		staleTime: 30 * 1000, // 30 seconds
		gcTime: 2 * 60 * 1000, // 2 minutes
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	}));

	let tour = $derived($tourQuery.data?.tour || null);
	let tourStats = $derived($tourQuery.data?.tourStats || {});
	// Use schedule data for richer slot information
	let allTimeSlots = $derived($scheduleQuery.data?.timeSlots || []);
	// @ts-ignore
	let upcomingSlots = $derived(allTimeSlots.filter((slot) => slot.isUpcoming));
	// Recent bookings data
	let recentBookings = $derived($tourBookingsQuery.data?.bookings || []);
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

	// Get more user-friendly payment status label
	function getPaymentStatusLabel(status: string): string {
		switch (status) {
			case 'paid':
				return 'Paid';
			case 'pending':
				return 'Unpaid';
			case 'failed':
				return 'Failed';
			case 'refunded':
				return 'Refunded';
			default:
				return 'Unpaid';
		}
	}
	
	// Get booking status icon
	function getBookingStatusIcon(status: string): any {
		switch (status) {
			case 'confirmed':
				return CheckCircle;
			case 'pending':
				return AlertCircle;
			case 'cancelled':
				return XCircle;
			case 'completed':
				return CheckCircle;
			default:
				return AlertCircle;
		}
	}
	
	// Get payment status icon
	function getPaymentStatusIcon(status: string): any {
		switch (status) {
			case 'paid':
				return CircleDollarSign;
			case 'pending':
				return AlertTriangle;
			case 'failed':
				return XCircle;
			case 'refunded':
				return ReceiptText;
			default:
				return AlertTriangle;
		}
	}

	function downloadQR() {
		if (!browser || !tour.qrCode) return;
		const link = document.createElement('a');
		// Generate a high-resolution QR code for download
		const downloadUrl = generateQRImageURL(tour.qrCode, {
			size: 1000, // High resolution for print
			color: '000000', // Black for better printing and compatibility
			backgroundColor: 'FFFFFF',
			style: 'default',
			margin: 4,
			errorCorrection: 'H'
		});
		link.href = downloadUrl;
		link.download = `qr-${tour.name.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
		link.click();
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
		<div class="flex justify-center py-12">
			<div class="text-center">
				<div class="animate-spin h-8 w-8 mx-auto mb-4 rounded-full border-2 border-t-transparent" style="border-color: var(--border-primary); border-top-color: transparent;"></div>
				<p class="text-sm" style="color: var(--text-secondary);">Loading tour details...</p>
			</div>
		</div>
	{:else if isError || !tour}
		<div class="mb-6 rounded-xl p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium" style="color: var(--text-primary);">Failed to load tour</p>
					<p class="text-sm mt-1" style="color: var(--text-secondary);">Please try refreshing the page.</p>
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
			<div class="mb-4 rounded-lg p-3 flex items-center gap-3" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
				<CheckCircle class="h-5 w-5 flex-shrink-0" style="color: var(--color-primary);" />
				<div class="flex-1">
					<p class="text-sm" style="color: var(--text-primary);">
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
			statusButton={getTourBookingStatus(tour).status === 'no-slots' ? {
				label: getTourBookingStatus(tour).label,
				color: '',
				textColor: 'var(--text-primary)',
				backgroundColor: 'var(--bg-tertiary)',
				dotColor: getTourBookingStatus(tour).dotColor,
				tooltip: getTourBookingStatus(tour).description,
				onclick: () => goto(`/tours/${tour.id}/schedule`)
			} : undefined}
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
				{#if status.status === 'no-slots'}
					<button 
						onclick={() => goto(`/tours/${tour.id}/schedule`)}
						class="button-secondary button--gap mr-6"
					>
						<span class="w-2 h-2 rounded-full {status.dotColor}"></span>
						{status.label}
					</button>
				{:else if status.status === 'draft' || status.status === 'bookable'}
					<div class="mr-6">
						<TourStatusToggle {tour} size="default" />
					</div>
				{/if}
				
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
					<span class="text-xs px-2 py-1 rounded-full" style="background: var(--bg-tertiary); color: var(--text-secondary);">
						{tourStats?.qrScans || 0} scans • {getConversionRateText(tourStats?.qrScans || 0, tourStats?.qrConversions || 0)} conversion
					</span>
				</div>
			</div>
			<div class="p-4">
				<!-- Mobile Layout -->
				<div class="sm:hidden">
					<div class="flex items-center gap-4">
						<div class="flex-shrink-0 relative">
							<Tooltip text="Tap to copy booking URL" position="right">
								<StyledQRCode
									qrCode={tour.qrCode}
									tourName={tour.name}
									size={120}
									style="modern"
									onclick={() => copyQRUrl()}
								/>
								{#if copiedQRCode}
									<div class="absolute inset-0 flex items-center justify-center rounded-2xl" style="background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px);">
										<CheckCircle class="h-8 w-8" style="color: var(--color-primary);" />
									</div>
								{/if}
							</Tooltip>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-xs font-mono mb-3 break-all" style="color: var(--text-secondary);">{getBookingUrl()}</p>
							<div class="flex gap-2">
								<button onclick={() => copyQRUrl()} class="flex-1 button-primary button--small button--gap justify-center" class:opacity-50={copiedQRCode}>
									{#if copiedQRCode}
										<CheckCircle class="h-3 w-3" />
										Copied!
									{:else}
										<Copy class="h-3 w-3" />
										Copy Link
									{/if}
								</button>
								<button onclick={() => downloadQR()} class="button-secondary button--small button--icon">
									<Download class="h-3 w-3" />
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
							<div class="inline-block mb-4 relative">
								<StyledQRCode
									qrCode={tour.qrCode}
									tourName={tour.name}
									size={200}
									style="premium"
									showLabel={true}
									onclick={() => copyQRUrl()}
								/>
								{#if copiedQRCode}
									<div class="absolute inset-0 flex items-center justify-center rounded-2xl" style="background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px);">
										<CheckCircle class="h-12 w-12" style="color: var(--color-primary);" />
									</div>
								{/if}
							</div>
							<p class="text-sm font-mono break-all px-4 py-2 rounded-md mb-4" style="color: var(--text-secondary); background: var(--bg-primary);">{getBookingUrl()}</p>
							<div class="flex justify-center gap-2">
								<Tooltip text="Copy booking URL" position="top">
									<button onclick={() => copyQRUrl()} class="button-primary button--gap" class:opacity-50={copiedQRCode}>
										{#if copiedQRCode}
											<CheckCircle class="h-4 w-4" />
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
			<div class="flex flex-wrap gap-4 justify-between text-sm">
				<div class="flex items-center gap-2">
					<DollarSign class="h-4 w-4" style="color: var(--text-tertiary);" />
					<div class="flex items-baseline gap-1">
						<span class="font-semibold" style="color: var(--text-primary);">{getTourDisplayPriceFormatted(tour)}</span>
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
						<span class="px-2 py-1 text-xs rounded-md font-medium" style="background: var(--bg-primary); color: var(--text-secondary);">
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
					<p class="text-sm leading-relaxed" style="color: var(--text-secondary);">{tour.description}</p>
				</div>
			{/if}
			
			{#if (tour.includedItems && tour.includedItems.length > 0) || (tour.requirements && tour.requirements.length > 0)}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#if tour.includedItems && tour.includedItems.length > 0}
						<div class="p-4 rounded-lg" style="background: var(--bg-secondary);">
							<h4 class="text-sm font-semibold mb-3 flex items-center gap-2" style="color: var(--text-primary);">
								<CheckCircle class="h-4 w-4" style="color: var(--color-primary);" />
								What's Included
							</h4>
							<ul class="space-y-2">
								{#each tour.includedItems as item}
									<li class="flex items-start gap-2 text-sm" style="color: var(--text-secondary);">
										<span class="text-xs mt-0.5" style="color: var(--color-primary);">✓</span>
										<span>{item}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
					
					{#if tour.requirements && tour.requirements.length > 0}
						<div class="p-4 rounded-lg" style="background: var(--bg-secondary);">
							<h4 class="text-sm font-semibold mb-3" style="color: var(--text-primary);">Requirements</h4>
							<ul class="space-y-2">
								{#each tour.requirements as requirement}
									<li class="flex items-start gap-2 text-sm" style="color: var(--text-secondary);">
										<span class="text-xs mt-0.5" style="color: var(--text-tertiary);">•</span>
										<span>{requirement}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{/if}
			
			{#if tour.cancellationPolicy}
				<div class="p-4 rounded-lg" style="background: var(--bg-secondary);">
					<h4 class="text-sm font-semibold mb-2" style="color: var(--text-primary);">Cancellation Policy</h4>
					<p class="text-sm leading-relaxed" style="color: var(--text-secondary);">{tour.cancellationPolicy}</p>
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
						<span class="px-2 py-0.5 text-xs rounded-full" style="background: var(--bg-tertiary); color: var(--text-primary); font-weight: 500;">
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
				<div class="space-y-2">
					{#each upcomingSlots.slice(0, 5) as slot}
						{@const occupancyPercent = getOccupancyPercentage(slot)}
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
											<span class="text-xs" style="color: {occupancyPercent >= 70 ? 'var(--color-danger)' : 'var(--text-secondary)'}; font-weight: {occupancyPercent >= 90 ? '600' : '400'};">
												{slot.totalParticipants}/{slot.capacity} guests
												{#if occupancyPercent >= 90}
													<span class="ml-1">• Almost full</span>
												{/if}
											</span>
											{#if slot.totalBookings > 0}
												<span class="text-xs" style="color: var(--text-tertiary);">
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
				{#if upcomingSlots.length > 5}
					<div class="mt-3 text-center">
						<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="text-sm" style="color: var(--color-primary);">
							View all {upcomingSlots.length} upcoming slots →
						</button>
					</div>
				{/if}
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

	<!-- 4. Recent Bookings -->
	{#if recentBookings.length > 0}
		<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold" style="color: var(--text-primary);">Recent Bookings</h3>
					<button onclick={() => goto(`/tours/${tour.id}/bookings`)} class="button-secondary button--small button--gap">
						<Users class="h-3 w-3" />
						View All
					</button>
				</div>
			</div>
			<div class="p-4">
				<div class="space-y-3">
					{#each recentBookings.slice(0, 5) as booking}
						{@const BookingIcon = getBookingStatusIcon(booking.status)}
						{@const PaymentIcon = getPaymentStatusIcon(booking.paymentStatus || 'pending')}
						<div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" 
							style="background: var(--bg-secondary);"
							onclick={() => goto(`/bookings/${booking.id}`)}
							onkeydown={(e) => e.key === 'Enter' && goto(`/bookings/${booking.id}`)}
							role="button"
							tabindex="0"
						>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium truncate" style="color: var(--text-primary);">
									{booking.customerName}
								</p>
								<div class="flex items-center gap-3 mt-1">
									<span class="text-xs" style="color: var(--text-secondary);">
										{booking.participants} {booking.participants === 1 ? 'guest' : 'guests'}
									</span>
									{#if booking.expand?.timeSlot?.startTime}
										<span class="text-xs" style="color: var(--text-secondary);">
											{formatDate(booking.expand.timeSlot.startTime)}
										</span>
									{:else}
										<span class="text-xs" style="color: var(--text-tertiary);">
											No time slot
										</span>
									{/if}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium {getStatusColor(booking.status)}">
										<BookingIcon class="h-3 w-3" />
										<span class="capitalize">{booking.status}</span>
									</span>
									{#if booking.paymentStatus}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium {getPaymentStatusColor(booking.paymentStatus)}">
											<PaymentIcon class="h-3 w-3" />
											{getPaymentStatusLabel(booking.paymentStatus)}
										</span>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<div class="text-sm font-medium" style="color: var(--text-primary);">
									{$globalCurrencyFormatter(booking.totalAmount)}
								</div>
							</div>
						</div>
					{/each}
				</div>
				{#if recentBookings.length > 5}
					<div class="mt-3 text-center">
						<button onclick={() => goto(`/tours/${tour.id}/bookings`)} class="text-sm" style="color: var(--color-primary);">
							View all {recentBookings.length} bookings →
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- 5. Tour Gallery -->
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
								class="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity bg-gray-100 dark:bg-gray-800"
								style="padding: 0; border: 1px solid var(--border-primary);"
							>
								<img 
									src={imageUrl} 
									alt="{tour.name} - Image {index + 1}"
									class="absolute inset-0 w-full h-full object-cover"
									loading={index < 6 ? "eager" : "lazy"}
								/>
							</button>
						{/if}
					{/each}
					{#if tour.images.length > 11}
						<button
							onclick={() => selectedImageIndex = 0}
							class="aspect-square rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
							style="background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-primary);"
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

	<!-- 6. Website Widget - Collapsible Advanced Feature -->
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
									<p class="text-xs font-medium mb-2" style="color: var(--text-primary);">Integration Benefits:</p>
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

</div>

<!-- Image Lightbox - Using Portal to render at document root -->
{#if selectedImageIndex !== null && tour.images}
	<Portal>
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
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div 
			class="tour-lightbox-overlay"
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
	</Portal>
{/if}

<style>
	/* Lightbox styles with high z-index to ensure it appears above everything */
	:global(.tour-lightbox-overlay) {
		position: fixed !important;
		top: 0 !important;
		left: 0 !important;
		right: 0 !important;
		bottom: 0 !important;
		width: 100vw !important;
		height: 100vh !important;
		background: rgba(0, 0, 0, 0.95) !important;
		z-index: 999999 !important; /* Very high z-index */
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		padding: 1rem !important;
		isolation: isolate !important;
	}
	
	/* Ensure the lightbox is truly on top by resetting any inherited transforms */
	:global(body:has(.tour-lightbox-overlay)) {
		overflow: hidden !important;
	}
</style>
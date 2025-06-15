<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate, formatTime, formatDateTime } from '$lib/utils/date-helpers.js';
	import { generateQRImageURL } from '$lib/utils/qr-generation.js';
	import { 
		formatDuration,
		getTourStatusColor,
		getTourStatusDot,
		getBookingStatusColor,
		getSlotStatusColor,
		getTourImageUrl,
		calculateConversionRate,
		getConversionRateText,
		toggleTourStatus,
		getTourBookingStatus
	} from '$lib/utils/tour-helpers-client.js';
	import { 
		formatSlotDateTime,
		getSlotAvailabilityText,
		getSlotStatusColor as getSlotStatusColorFromSlot,
		getSlotStatusText,
		getUpcomingSlots
	} from '$lib/utils/time-slot-client.js';
	import { browser } from '$app/environment';
	
	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	
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
	import Plus from 'lucide-svelte/icons/plus';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import PlusCircle from 'lucide-svelte/icons/plus-circle';

	// Get data from load function
	let { data } = $props();
	let tourId = $derived(data.tourId);
	
	// TanStack Query for tour details
	let tourQuery = $derived(createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000,    // 5 minutes
	}));

	let tour = $derived($tourQuery.data?.tour || null);
	let tourStats = $derived($tourQuery.data?.tourStats || {});
	let upcomingSlots = $derived($tourQuery.data?.upcomingSlots || []);
	let recentBookings = $derived($tourQuery.data?.recentBookings || []);
	let isLoading = $derived($tourQuery.isLoading);
	let isError = $derived($tourQuery.isError);
	
	// State
	let copiedQRCode = $state(false);
	let copiedEmbedCode = $state(false);
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

	async function handleTourStatusToggle() {
		if (!browser || statusUpdating) return;
		statusUpdating = true;
		
		try {
			const newStatus = await toggleTourStatus(tour);
			
			if (newStatus) {
				// Update local state
				tour = { ...tour, status: newStatus };
			}
		} finally {
			statusUpdating = false;
		}
	}

	// Embed widget functions
	function getEmbedCode(): string {
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
		<!-- Success Banner for Newly Created Tours -->
		{#if browser && $page.url.searchParams.get('created') === 'true'}
			<div class="mb-6 rounded-xl p-4 sm:p-6" style="background: var(--color-success-light); border: 1px solid var(--color-success-200);">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0">
						<CheckCircle class="h-6 w-6" style="color: var(--color-success);" />
					</div>
					<div class="flex-1">
						<h3 class="font-semibold mb-2" style="color: var(--color-success-900);">
							🎉 Tour Created Successfully!
						</h3>
						<p class="text-sm mb-4" style="color: var(--color-success-800);">
							Your tour "{tour.name}" has been created as a {tour.status === 'active' ? 'live' : 'draft'} tour. 
							{#if tour.status === 'draft'}
								It won't be visible to customers until you activate it.
							{:else}
								It's now live and ready to accept bookings!
							{/if}
						</p>
						
						<div class="space-y-3">
							<h4 class="font-medium text-sm" style="color: var(--color-success-900);">Next Steps:</h4>
							
							{#if !upcomingSlots || upcomingSlots.length === 0}
								<div class="flex items-start gap-3 p-3 rounded-lg" style="background: rgba(255, 255, 255, 0.5);">
									<div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
										<span class="text-xs font-bold text-blue-600">1</span>
									</div>
									<div>
										<p class="font-medium text-sm" style="color: var(--color-success-900);">Add Time Slots</p>
										<p class="text-xs mt-1" style="color: var(--color-success-700);">
											Set up when you'll run this tour so customers can book specific times.
										</p>
										<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="button-primary button--small button--gap mt-2">
											<Calendar class="h-3 w-3" />
											Add Schedule
										</button>
									</div>
								</div>
							{/if}
							
							{#if tour.status === 'draft'}
								<div class="flex items-start gap-3 p-3 rounded-lg" style="background: rgba(255, 255, 255, 0.5);">
									<div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
										<span class="text-xs font-bold text-green-600">{!upcomingSlots || upcomingSlots.length === 0 ? '2' : '1'}</span>
									</div>
									<div>
										<p class="font-medium text-sm" style="color: var(--color-success-900);">Activate Your Tour</p>
										<p class="text-xs mt-1" style="color: var(--color-success-700);">
											When you're ready, activate your tour to make it visible to customers.
										</p>
										<button onclick={() => handleTourStatusToggle()} class="button-success button--small button--gap mt-2">
											<CheckCircle class="h-3 w-3" />
											Activate Tour
										</button>
									</div>
								</div>
							{/if}
							
							<div class="flex items-start gap-3 p-3 rounded-lg" style="background: rgba(255, 255, 255, 0.5);">
								<div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
									<span class="text-xs font-bold text-purple-600">{tour.status === 'active' ? (!upcomingSlots || upcomingSlots.length === 0 ? '2' : '1') : (!upcomingSlots || upcomingSlots.length === 0 ? '3' : '2')}</span>
								</div>
								<div>
									<p class="font-medium text-sm" style="color: var(--color-success-900);">Share Your QR Code</p>
									<p class="text-xs mt-1" style="color: var(--color-success-700);">
										{#if tour.status === 'active'}
											Your tour is live! Share the QR code or booking link to start getting bookings.
										{:else}
											Once activated, share the QR code or booking link to start getting bookings.
										{/if}
									</p>
									<div class="flex gap-2 mt-2">
										<button onclick={() => copyQRUrl()} class="button-secondary button--small button--gap">
											<Copy class="h-3 w-3" />
											Copy Link
										</button>
										<button onclick={() => shareQR()} class="button-secondary button--small button--gap">
											<Share2 class="h-3 w-3" />
											Share
										</button>
									</div>
								</div>
							</div>
						</div>
						
						<div class="mt-4 pt-4 border-t" style="border-color: var(--color-success-300);">
							<div class="flex items-center justify-between">
								<p class="text-xs" style="color: var(--color-success-700);">
									💡 <strong>Pro tip:</strong> You can always come back to this page to manage your tour, view bookings, and track performance.
								</p>
								<button onclick={() => goto('/tours?refresh=true')} class="button-secondary button--small button--gap">
									<ArrowLeft class="h-3 w-3" />
									Back to Tours
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Success Banner for Edited Tours -->
		{#if browser && $page.url.searchParams.get('edited') === 'true'}
			<div class="mb-6 rounded-xl p-4" style="background: var(--color-success-light); border: 1px solid var(--color-success-200);">
				<div class="flex items-center gap-3">
					<CheckCircle class="h-5 w-5 flex-shrink-0" style="color: var(--color-success);" />
					<div class="flex-1">
						<p class="font-medium" style="color: var(--color-success-900);">
							Tour updated successfully!
						</p>
						<p class="text-sm mt-1" style="color: var(--color-success-700);">
							Your changes have been saved and are now live.
						</p>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Compact Mobile Header + Desktop Header -->
		<div class="mb-6 sm:mb-8">
		<!-- Mobile Compact Header -->
		<div class="sm:hidden mb-6">
			<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<!-- Header Row -->
				<div class="flex items-center justify-between mb-4">
					<div class="flex-1">
						<h1 class="text-xl font-bold" style="color: var(--text-primary);">{tour.name}</h1>
						<p class="text-sm font-medium mt-1" style="color: var(--text-primary);">{$globalCurrencyFormatter(tour.price)}</p>
					</div>
					
					<!-- Booking Status -->
					<div class="flex items-center gap-2">
						<div class="relative group">
							<div 
								class="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium border transition-all duration-200"
								style="color: {getTourBookingStatus(tour).color}; background: {getTourBookingStatus(tour).bgColor}; border-color: {getTourBookingStatus(tour).borderColor};"
							>
								<div class="w-1.5 h-1.5 rounded-full {getTourBookingStatus(tour).dotColor}"></div>
								<span>{getTourBookingStatus(tour).label}</span>
								{#if getTourBookingStatus(tour).status === 'no-slots'}
									<PlusCircle class="w-3 h-3 opacity-60" />
								{/if}
							</div>
							<!-- Tooltip -->
							<div class="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs whitespace-nowrap rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50" style="background: var(--bg-primary); border: 1px solid var(--border-primary); color: var(--text-primary);">
								{getTourBookingStatus(tour).description}
								{#if getTourBookingStatus(tour).status === 'no-slots'}
									<br><span class="text-blue-600">Add time slots to accept bookings</span>
								{:else if getTourBookingStatus(tour).status === 'draft'}
									<br><span class="text-blue-600">Activate to make visible to customers</span>
								{/if}
							</div>
						</div>
						
						<!-- Action Button -->
						{#if getTourBookingStatus(tour).status === 'draft'}
							<button
								onclick={() => handleTourStatusToggle()}
								disabled={statusUpdating}
								class="p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
								title="Activate tour"
							>
								{#if statusUpdating}
									<div class="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin"></div>
								{:else}
									<CheckCircle class="w-4 h-4" style="color: var(--color-success-600);" />
								{/if}
							</button>
						{:else if getTourBookingStatus(tour).status === 'no-slots'}
							<button
								onclick={() => goto(`/tours/${tour.id}/schedule`)}
								class="p-2 rounded-md hover:bg-gray-100 transition-colors"
								title="Add time slots"
							>
								<PlusCircle class="w-4 h-4" style="color: var(--color-warning-600);" />
							</button>
						{:else}
							<button
								onclick={() => handleTourStatusToggle()}
								disabled={statusUpdating}
								class="p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
								title="Set to draft"
							>
								{#if statusUpdating}
									<div class="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin"></div>
								{:else}
									<Edit class="w-4 h-4" style="color: var(--text-tertiary);" />
								{/if}
							</button>
						{/if}
					</div>
				</div>
				
				<!-- Quick Actions -->
				<div class="grid grid-cols-2 gap-3">
					<button onclick={() => goto(`/tours/${tour.id}/bookings`)} class="button-primary button--small button--gap">
						<Users class="h-4 w-4" />
						Bookings
					</button>
					<button onclick={() => goto(`/tours/${tour.id}/edit`)} class="button-secondary button--small button--gap">
						<Edit class="h-4 w-4" />
						Edit
					</button>
					<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="button-secondary button--small button--gap">
						<Calendar class="h-4 w-4" />
						Schedule
					</button>
					<button onclick={() => shareQR()} class="button-secondary button--small button--gap">
						<Share2 class="h-4 w-4" />
						Share
					</button>
				</div>
				
				<!-- Info Grid -->
				<div class="grid grid-cols-2 gap-3 mt-4 pt-4 border-t" style="border-color: var(--border-primary);">
					<div class="text-center p-2">
						<div class="flex items-center justify-center gap-1 text-xs" style="color: var(--text-tertiary);">
							<MapPin class="h-3 w-3" />
							<span>Location</span>
						</div>
						<p class="text-sm font-medium mt-1" style="color: var(--text-primary);">{tour.location || 'Not specified'}</p>
					</div>
					<div class="text-center p-2">
						<div class="flex items-center justify-center gap-1 text-xs" style="color: var(--text-tertiary);">
							<Clock class="h-3 w-3" />
							<span>Duration</span>
						</div>
						<p class="text-sm font-medium mt-1" style="color: var(--text-primary);">{formatDuration(tour.duration)}</p>
					</div>
					<div class="text-center p-2">
						<div class="flex items-center justify-center gap-1 text-xs" style="color: var(--text-tertiary);">
							<Users class="h-3 w-3" />
							<span>Capacity</span>
						</div>
						<p class="text-sm font-medium mt-1" style="color: var(--text-primary);">Max {tour.capacity}</p>
					</div>
					<div class="text-center p-2">
						<div class="flex items-center justify-center gap-1 text-xs" style="color: var(--text-tertiary);">
							<BarChart3 class="h-3 w-3" />
							<span>Bookings</span>
						</div>
						<p class="text-sm font-medium mt-1" style="color: var(--text-primary);">{tourStats?.totalBookings || 0} total</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title={tour.name}
				subtitle={tour.description}
				breadcrumbs={[
					{ label: 'Tours', href: '/tours?refresh=true' },
					{ label: tour.name }
				]}
			>
				<button onclick={() => goto('/tours?refresh=true')} class="hidden sm:flex button-secondary button--gap mr-4">
					<ArrowLeft class="h-4 w-4" />
					Back to Tours
				</button>
				<div class="hidden sm:flex gap-3">
					<button onclick={() => goto(`/tours/${tour.id}/bookings`)} class="button-primary button--gap">
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

	<!-- Desktop Tour Status & Quick Info -->
	<div class="mb-8">
		<div class="hidden sm:block p-4 sm:p-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div class="flex items-center gap-4">
					<!-- Booking Status -->
					<div class="flex items-center gap-3">
						<div class="relative group">
							<div 
								class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200"
								style="color: {getTourBookingStatus(tour).color}; background: {getTourBookingStatus(tour).bgColor}; border-color: {getTourBookingStatus(tour).borderColor};"
							>
								<div class="w-2 h-2 rounded-full {getTourBookingStatus(tour).dotColor}"></div>
								<span>{getTourBookingStatus(tour).label}</span>
								{#if getTourBookingStatus(tour).status === 'no-slots'}
									<AlertTriangle class="w-4 h-4 opacity-60" />
								{:else if getTourBookingStatus(tour).status === 'bookable'}
									<CheckCircle class="w-4 h-4 opacity-60" />
								{/if}
							</div>
							<!-- Tooltip -->
							<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs whitespace-nowrap rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50" style="background: var(--bg-primary); border: 1px solid var(--border-primary); color: var(--text-primary);">
								{getTourBookingStatus(tour).description}
								{#if getTourBookingStatus(tour).status === 'no-slots'}
									<br><span class="text-blue-600">Add time slots to accept bookings</span>
								{:else if getTourBookingStatus(tour).status === 'draft'}
									<br><span class="text-blue-600">Activate to make visible to customers</span>
								{/if}
							</div>
						</div>
						
						<!-- Action Buttons -->
						<div class="flex items-center gap-2">
							{#if getTourBookingStatus(tour).status === 'draft'}
								<button
									onclick={() => handleTourStatusToggle()}
									disabled={statusUpdating}
									class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 hover:bg-green-50 border border-green-200 text-green-700"
									title="Activate tour"
								>
									{#if statusUpdating}
										<div class="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin"></div>
										<span>Activating...</span>
									{:else}
										<CheckCircle class="w-3 h-3" />
										<span>Activate</span>
									{/if}
								</button>
							{:else if getTourBookingStatus(tour).status === 'no-slots'}
								<button
									onclick={() => goto(`/tours/${tour.id}/schedule`)}
									class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-orange-50 border border-orange-200 text-orange-700"
									title="Add time slots"
								>
									<PlusCircle class="w-3 h-3" />
									<span>Add Slots</span>
								</button>
							{:else}
								<button
									onclick={() => handleTourStatusToggle()}
									disabled={statusUpdating}
									class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 hover:bg-gray-50 border border-gray-200 text-gray-700"
									title="Set to draft"
								>
									{#if statusUpdating}
										<div class="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin"></div>
										<span>Updating...</span>
									{:else}
										<Edit class="w-3 h-3" />
										<span>Draft</span>
									{/if}
								</button>
							{/if}
						</div>
					</div>
					
					<div class="hidden lg:flex items-center gap-6 text-sm" style="color: var(--text-secondary);">
						<div class="flex items-center gap-1">
							<MapPin class="h-4 w-4" />
							<span>{tour.location || 'Not specified'}</span>
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
							<span>{$globalCurrencyFormatter(tour.price)} per person</span>
						</div>
					</div>
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
					<h3 class="font-semibold" style="color: var(--text-primary);">QR Code & Booking Link</h3>
					<span class="text-xs px-2 py-1 rounded-full" style="background: var(--color-primary-100); color: var(--color-primary-700);">
						{tourStats?.qrScans || 0} scans • {getConversionRateText(tourStats?.qrScans || 0, tourStats?.qrConversions || 0)} conversion
					</span>
				</div>
			</div>
			<div class="p-4">
				<!-- Mobile: Horizontal QR Layout -->
				<div class="sm:hidden flex items-center gap-4">
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
				<h3 class="font-semibold" style="color: var(--text-primary);">Quick Stats</h3>
				<div class="flex gap-2">
					<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="button-secondary button--small button--gap">
						<Calendar class="h-3 w-3" />
						Schedule
					</button>
					<button onclick={() => goto(`/tours/${tour.id}/bookings`)} class="button-secondary button--small button--gap">
						<Users class="h-3 w-3" />
						Bookings
					</button>
				</div>
			</div>
		</div>
		<div class="p-4">
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
				<div>
					<div class="text-lg font-bold" style="color: var(--text-primary);">{tourStats?.todayBookings || 0}</div>
					<div class="text-xs" style="color: var(--text-secondary);">Today's Bookings</div>
				</div>
				<div>
					<div class="text-lg font-bold" style="color: var(--color-warning-600);">{tourStats?.pendingBookings || 0}</div>
					<div class="text-xs" style="color: var(--text-secondary);">Pending</div>
				</div>
				<div>
					<div class="text-lg font-bold" style="color: var(--color-success);">{tourStats?.upcomingSlots || 0}</div>
					<div class="text-xs" style="color: var(--text-secondary);">Upcoming Slots</div>
				</div>
				<div>
					<div class="text-lg font-bold" style="color: var(--text-primary);">{tourStats?.weekBookings || 0}</div>
					<div class="text-xs" style="color: var(--text-secondary);">This Week</div>
				</div>
			</div>
		</div>
	</div>

	<!-- 3. Tour Info & Actions -->
	<div class="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Tour Information -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h3 class="font-semibold" style="color: var(--text-primary);">Tour Information</h3>
			</div>
			<div class="p-4 space-y-3">
				{#if tour.category}
					<div class="flex items-center justify-between">
						<span class="text-sm" style="color: var(--text-secondary);">Category</span>
						<span class="text-sm font-medium px-2 py-1 rounded-md" style="background: var(--bg-tertiary); color: var(--text-primary);">
							{tour.category}
						</span>
					</div>
				{/if}
				<div class="flex items-center justify-between">
					<span class="text-sm" style="color: var(--text-secondary);">Price</span>
					<span class="text-sm font-medium" style="color: var(--text-primary);">{$globalCurrencyFormatter(tour.price)} per person</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm" style="color: var(--text-secondary);">Duration</span>
					<span class="text-sm font-medium" style="color: var(--text-primary);">{formatDuration(tour.duration)}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm" style="color: var(--text-secondary);">Capacity</span>
					<span class="text-sm font-medium" style="color: var(--text-primary);">Up to {tour.capacity} guests</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm" style="color: var(--text-secondary);">Location</span>
					<span class="text-sm font-medium" style="color: var(--text-primary);">{tour.location || 'Not specified'}</span>
				</div>
				{#if tour.description}
					<div class="pt-3 border-t" style="border-color: var(--border-primary);">
						<p class="text-sm" style="color: var(--text-secondary);">
							{tour.description}
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-4 border-b" style="border-color: var(--border-primary);">
				<h3 class="font-semibold" style="color: var(--text-primary);">Quick Actions</h3>
			</div>
			<div class="p-4 space-y-2">
				<button onclick={() => goto(`/tours/${tour.id}/bookings`)} class="w-full button-primary button--gap justify-start">
					<Users class="h-4 w-4" />
					View All Bookings
					{#if tourStats?.totalBookings > 0}
						<span class="ml-auto text-xs opacity-80">{tourStats.totalBookings}</span>
					{/if}
				</button>
				<button onclick={() => goto(`/tours/${tour.id}/schedule`)} class="w-full button-secondary button--gap justify-start">
					<Calendar class="h-4 w-4" />
					Manage Schedule
					{#if tourStats?.upcomingSlots > 0}
						<span class="ml-auto text-xs opacity-80">{tourStats.upcomingSlots} slots</span>
					{/if}
				</button>
				<button onclick={() => goto(`/tours/${tour.id}/schedule/new`)} class="w-full button-secondary button--gap justify-start">
					<Plus class="h-4 w-4" />
					Add Time Slot
				</button>
				<button onclick={() => goto('/checkin-scanner')} class="w-full button-secondary button--gap justify-start">
					<QrCode class="h-4 w-4" />
					Check-in Scanner
				</button>
				<button onclick={() => goto(`/tours/${tour.id}/edit`)} class="w-full button-secondary button--gap justify-start">
					<Edit class="h-4 w-4" />
					Edit Tour Details
				</button>
			</div>
		</div>
	</div>

	<!-- 4. Upcoming Slots & Recent Bookings - Operational Info -->
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
										{formatSlotDateTime(slot.startTime)}
									</p>
									<p class="text-xs mt-1" style="color: var(--text-secondary);">
										{getSlotAvailabilityText(slot)}
									</p>
								</div>
								<div class="flex items-center gap-2">
									<div 
										class="w-2 h-2 rounded-full"
										style="background-color: {getSlotStatusColorFromSlot(slot)};"
									></div>
									<span class="text-xs" style="color: var(--text-secondary);">
										{getSlotStatusText(slot)}
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
					<button onclick={() => goto(`/tours/${tour.id}/bookings`)} class="text-xs" style="color: var(--color-primary-600);">
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
										<span class="text-xs" style="color: var(--text-secondary);">{$globalCurrencyFormatter(booking.totalAmount)}</span>
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

	<!-- 5. Performance Statistics - Analytics -->
	<div class="mb-6">
		<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Performance Overview</h3>
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<StatsCard
				title="Total Revenue"
				value={$globalCurrencyFormatter(tourStats?.totalRevenue || 0)}
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

	<!-- 6. Website Embed Widget -->
	<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold" style="color: var(--text-primary);">Website Embed Widget</h3>
				<span class="text-xs px-2 py-1 rounded-full" style="background: var(--color-primary-100); color: var(--color-primary-700);">
					Easy Integration
				</span>
			</div>
		</div>
		<div class="p-4">
			<p class="text-sm mb-4" style="color: var(--text-secondary);">
				Add this booking widget to your website to allow customers to book directly without leaving your site.
			</p>
			
			<!-- Widget Preview -->
			<div class="mb-4">
				<h4 class="text-sm font-medium mb-2" style="color: var(--text-primary);">Preview:</h4>
				<div class="border rounded-lg overflow-hidden" style="border-color: var(--border-primary);">
					<iframe
						src="/embed/book/{tour.qrCode}?theme=auto"
						width="100%"
						height="220"
						frameborder="0"
						title="Booking widget for {tour.name}"
						class="bg-white"
					></iframe>
				</div>
			</div>
			
			<!-- Embed Code -->
			<div>
				<div class="flex items-center justify-between mb-2">
					<h4 class="text-sm font-medium" style="color: var(--text-primary);">Embed Code:</h4>
					<button 
						onclick={() => copyEmbedCode()}
						class="button-secondary button--small button--gap"
						class:opacity-50={copiedEmbedCode}
					>
						{#if copiedEmbedCode}
							<CheckCircle class="h-3 w-3" style="color: var(--color-success);" />
							Copied!
						{:else}
							<Copy class="h-3 w-3" />
							Copy Code
						{/if}
					</button>
				</div>
				<div class="relative">
					<pre class="text-xs p-3 rounded-lg overflow-x-auto" style="background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-primary);">{getEmbedCode()}</pre>
				</div>
			</div>
			
			<!-- Integration Tips -->
			<div class="mt-4 p-3 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
				<h5 class="text-sm font-medium mb-2" style="color: var(--text-primary);">💡 Integration Tips:</h5>
				<ul class="text-xs space-y-1" style="color: var(--text-secondary);">
					<li>• Copy the code above and paste it into your website's HTML</li>
					<li>• The widget is responsive and will adapt to your site's design</li>
					<li>• Supports automatic dark/light mode based on user preferences</li>
					<li>• Customers can book without leaving your website</li>
					<li>• All bookings will appear in your dashboard as usual</li>
					<li>• Change <code>?theme=auto</code> to <code>?theme=dark</code> or <code>?theme=light</code> for fixed themes</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- 7. Tour Gallery - Visual Content (Lowest Priority) -->
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
{/if}
</div>
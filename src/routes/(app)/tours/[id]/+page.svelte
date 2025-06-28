<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate, getStatusColor } from '$lib/utils/date-helpers.js';
	import { browser } from '$app/environment';
	
	// TanStack Query
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import ScheduleCalendar from '$lib/components/ScheduleCalendar.svelte';
	import TimeSlotsList from '$lib/components/TimeSlotsList.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import TimeSlotForm from '$lib/components/time-slot-form/TimeSlotForm.svelte';
	import PageContainer from '$lib/components/PageContainer.svelte';
	
	// Icons
	import Calendar from 'lucide-svelte/icons/calendar';
	import Euro from 'lucide-svelte/icons/euro';
	import Users from 'lucide-svelte/icons/users';
	import Clock from 'lucide-svelte/icons/clock';

	import Edit from 'lucide-svelte/icons/edit';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Copy from 'lucide-svelte/icons/copy';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Plus from 'lucide-svelte/icons/plus';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Eye from 'lucide-svelte/icons/eye';
	import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
	import CalendarDays from 'lucide-svelte/icons/calendar-days';
	import FileText from 'lucide-svelte/icons/file-text';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Image from 'lucide-svelte/icons/image';
	import Check from 'lucide-svelte/icons/check';
	import Info from 'lucide-svelte/icons/info';
	import Shield from 'lucide-svelte/icons/shield';
	import Tag from 'lucide-svelte/icons/tag';
	import Download from 'lucide-svelte/icons/download';
	import Banknote from 'lucide-svelte/icons/banknote';
	
	// Get data from load function
	let { data } = $props();
	let tourId = $derived(data.tourId);
	
	const queryClient = useQueryClient();
	
	// TanStack Query for tour details
	const tourDetailsQuery = createQuery({
		get queryKey() { return queryKeys.tourDetails(tourId); },
		get queryFn() { return () => queryFunctions.fetchTourDetails(tourId); },
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		get enabled() { return !!tourId && browser; },
	});
	
	// TanStack Query for tour schedule - using enhanced endpoint
	const tourScheduleQuery = createQuery({
		get queryKey() { return ['tour-schedule', tourId]; },
		get queryFn() { 
			return async () => {
				const response = await fetch(`/api/tour-schedule/${tourId}`);
				if (!response.ok) throw new Error('Failed to fetch schedule');
				return response.json();
			};
		},
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		refetchOnWindowFocus: true,
		get enabled() { return !!tourId && browser; },
		retry: 3,
		retryDelay: 1000,
	});
	
	// Derive data from queries - separate loading states
	let tour = $derived($tourDetailsQuery.data?.tour || null);
	let stats = $derived($tourDetailsQuery.data?.stats || null);
	let schedule = $derived($tourScheduleQuery.data || null);
	
	// Separate loading states to prevent one query blocking the entire page
	let tourLoading = $derived($tourDetailsQuery.isLoading);
	let scheduleLoading = $derived($tourScheduleQuery.isLoading);
	let isLoading = $derived(tourLoading && scheduleLoading); // Only loading if BOTH are loading
	let isError = $derived($tourDetailsQuery.isError || $tourScheduleQuery.isError);
	
	// Debug effect to track query states
	$effect(() => {
		console.log('Query states:', {
			tourLoading,
			scheduleLoading,
			tourError: $tourDetailsQuery.isError,
			scheduleError: $tourScheduleQuery.isError,
			tourData: !!tour,
			scheduleData: !!schedule,
			tourId
		});
	});
	
	// State
	let qrCopied = $state(false);
	let linkCopied = $state(false);
	let selectedDate = $state(new Date());
	let currentMonth = $state(new Date());
	let showAllImages = $state(false);
	let showFullDescription = $state(false);
	let showAddSlotsModal = $state(false);
	let mobileTab = $state<'info' | 'schedule' | 'qr'>('info');
	let lightboxOpen = $state(false);
	let lightboxImage = $state<string>('');
	let lightboxImageLoading = $state(false);
	let lightboxImageError = $state(false);
	
	// Calendar event handlers
	function handleDateSelect(date: Date) {
		console.log('Date selected in parent:', date, 'formatted:', date.toDateString());
		selectedDate = new Date(date); // Ensure we get a fresh Date object
		console.log('Updated selectedDate:', selectedDate.toDateString());
	}
	
	function handleMonthChange(month: Date) {
		console.log('Month changed in parent:', month);
		currentMonth = new Date(month); // Ensure we get a fresh Date object
	}
	
	// Lightbox functions
	function openLightbox(imagePath: string) {
		lightboxImage = `/api/images/${tourId}/${imagePath}`;
		lightboxImageLoading = true;
		lightboxImageError = false;
		lightboxOpen = true;
	}
	
	function closeLightbox() {
		lightboxOpen = false;
		lightboxImage = '';
		lightboxImageLoading = false;
		lightboxImageError = false;
	}
	
	function handleImageLoad() {
		lightboxImageLoading = false;
	}
	
	function handleImageError() {
		lightboxImageLoading = false;
		lightboxImageError = true;
	}
	
	// Handle keyboard events for lightbox
	$effect(() => {
		function handleKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape' && lightboxOpen) {
				closeLightbox();
			}
		}
		
		if (browser && lightboxOpen) {
			document.addEventListener('keydown', handleKeydown);
			return () => document.removeEventListener('keydown', handleKeydown);
		}
	});
	
	// Selected date slots - using enhanced data structure
	let selectedDateSlots = $derived(() => {
		if (!schedule?.timeSlots || !selectedDate) return [];
		
		// Format dates consistently for comparison
		const selectedDateStr = selectedDate.getFullYear() + '-' + 
			String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
			String(selectedDate.getDate()).padStart(2, '0');
		
		const filteredSlots = schedule.timeSlots.filter((slot: any) => {
			if (!slot.startTime) return false;
			
			const slotDate = new Date(slot.startTime);
			const slotDateStr = slotDate.getFullYear() + '-' + 
				String(slotDate.getMonth() + 1).padStart(2, '0') + '-' + 
				String(slotDate.getDate()).padStart(2, '0');
			
			return slotDateStr === selectedDateStr;
		});
		
		console.log('Selected date:', selectedDateStr, 'Total slots:', schedule.timeSlots.length, 'Found slots:', filteredSlots.length);
		if (filteredSlots.length > 0) {
			console.log('Matching slots:', filteredSlots.map((s: any) => ({ id: s.id, startTime: s.startTime })));
		}
		return filteredSlots;
	});
	
	// Get booking URL
	let bookingUrl = $derived(
		browser && tour?.qrCode ? `${window.location.origin}/book/${tour.qrCode}` : ''
	);
	
	// Get formatted conversion rate with special handling
	function getConversionRateText(): string {
		if (!stats) return '0%';
		
		const rate = stats.conversionRate || 0;
		const scans = tour?.qrScans || 0;
		const conversions = tour?.qrConversions || 0;
		
		// Show 100%+ for rates over 100%
		if (rate > 100) return '100%+';
		
		// Show 100%* when conversions exist but no scans
		if (conversions > 0 && scans === 0) return '100%*';
		
		// Normal percentage
		return `${Math.round(rate)}%`;
	}
	
	// Copy functions
	async function copyQrCode() {
		if (!bookingUrl) return;
		
		try {
			await navigator.clipboard.writeText(bookingUrl);
			qrCopied = true;
			setTimeout(() => {
				qrCopied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy QR code:', err);
		}
	}
	
	async function copyBookingLink() {
		if (!bookingUrl) return;
		
		try {
			await navigator.clipboard.writeText(bookingUrl);
			linkCopied = true;
			setTimeout(() => {
				linkCopied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy link:', err);
		}
	}
	
	// Download QR code as image
	function downloadQrCode() {
		if (!bookingUrl || !tour?.qrCode) return;
		
		// Create a temporary link element
		const link = document.createElement('a');
		link.href = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(bookingUrl)}&qzone=2&format=png`;
		link.download = `${tour.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qr-code.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
	
	// Check for success messages from navigation
	let showEditSuccess = $state(false);
	let showScheduleSuccess = $state(false);
	let showAddSlotsSuccess = $state(false);
	
	$effect(() => {
		if (browser) {
			const urlParams = new URLSearchParams(window.location.search);
			if (urlParams.get('edited') === 'true') {
				showEditSuccess = true;
				// Clear the URL parameter
				const newUrl = new URL(window.location.href);
				newUrl.searchParams.delete('edited');
				window.history.replaceState({}, '', newUrl.toString());
				
				// Hide after 3 seconds
				setTimeout(() => {
					showEditSuccess = false;
				}, 3000);
			}
			
			if (urlParams.get('scheduled') === 'true') {
				showScheduleSuccess = true;
				// Clear the URL parameter
				const newUrl = new URL(window.location.href);
				newUrl.searchParams.delete('scheduled');
				window.history.replaceState({}, '', newUrl.toString());
				
				// Scroll to schedule section
				const scheduleSection = document.getElementById('schedule');
				if (scheduleSection) {
					scheduleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
				
				// Hide after 3 seconds
				setTimeout(() => {
					showScheduleSuccess = false;
				}, 3000);
			}
		}
	});
	
	// Handle navigation success messages and data refresh
	$effect(() => {
		if (browser && tourId) {
			const urlParams = new URLSearchParams(window.location.search);
			
			// Only invalidate queries if we have specific parameters indicating data changes
			if (urlParams.get('edited') === 'true' || urlParams.get('scheduled') === 'true') {
				// Use setTimeout to avoid blocking the UI
				setTimeout(() => {
					queryClient.invalidateQueries({ queryKey: queryKeys.tourDetails(tourId) });
					queryClient.invalidateQueries({ queryKey: ['tour-schedule', tourId] });
				}, 100);
			}
		}
	});
</script>

<svelte:head>
	<title>{tour?.name || 'Tour Details'} - Zaur</title>
	<meta name="description" content="Manage your tour details, schedule, and bookings" />
</svelte:head>

<PageContainer>
	<!-- Success Messages -->
	{#if showEditSuccess}
		<div class="mb-6 rounded-xl p-4 alert-success animate-fade-in">
			<div class="flex items-center gap-3">
				<CheckCircle class="h-5 w-5" />
				<p class="font-medium">Tour updated successfully!</p>
			</div>
		</div>
	{/if}
	
	{#if showScheduleSuccess}
		<div class="mb-6 rounded-xl p-4 alert-success animate-fade-in">
			<div class="flex items-center gap-3">
				<CheckCircle class="h-5 w-5" />
				<p class="font-medium">Schedule updated successfully!</p>
			</div>
		</div>
	{/if}
	
	{#if showAddSlotsSuccess}
		<div class="mb-6 rounded-xl p-4 alert-success animate-fade-in">
			<div class="flex items-center gap-3">
				<CheckCircle class="h-5 w-5" />
				<p class="font-medium">Time slots added successfully!</p>
			</div>
		</div>
	{/if}
	
	<!-- Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Header -->
		<MobilePageHeader
			title={tour?.name || 'Loading...'}
			statusButton={tour ? {
				label: tour.status === 'active' ? 'Active' : 'Draft',
				backgroundColor: tour.status === 'active' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
				textColor: tour.status === 'active' ? 'var(--color-success-700)' : 'var(--color-warning-700)'
			} : undefined}
			secondaryInfo={tour && stats ? `${stats.totalBookings || 0} bookings • ${$globalCurrencyFormatter(stats.totalRevenue || 0)} • ${tour.qrScans || 0} scans` : ''}
			quickActions={[
				{
					label: 'Edit',
					icon: Edit,
					onclick: () => goto(`/tours/${tourId}/edit`),
					variant: 'secondary'
				},
				{
					label: 'Add Slots',
					icon: Plus,
					onclick: () => showAddSlotsModal = true,
					variant: 'primary'
				}
			]}
		/>
		
		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title={tour?.name || 'Loading...'}
				subtitle={tour ? `${tour.category ? tour.category + ' tour' : 'Tour'} • ${tour.location || 'Location not set'}` : 'Loading tour details...'}
				breadcrumbs={[
					{ label: 'Tours', href: '/tours' },
					{ label: tour?.name || 'Tour' }
				]}
			>
				<div class="flex items-center gap-3">
					{#if tour}
						<div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm {getStatusColor(tour.status)}">
							{#if tour.status === 'active'}
								<CheckCircle class="h-4 w-4" />
							{:else}
								<FileText class="h-4 w-4" />
							{/if}
							<span class="font-medium capitalize">{tour.status}</span>
						</div>
					{/if}
					<button onclick={() => goto(`/tours/${tourId}/edit`)} class="button-secondary button--gap">
						<Edit class="h-4 w-4" />
						Edit Tour
					</button>
					<button onclick={() => showAddSlotsModal = true} class="button-primary button--gap">
						<Plus class="h-4 w-4" />
						Add Time Slots
					</button>
				</div>
			</PageHeader>
		</div>
	</div>
	
	{#if isError}
		<div class="mb-6 rounded-xl p-4 alert-error">
			<div class="flex items-center gap-3">
				<AlertCircle class="h-5 w-5" />
				<div>
					<p class="font-medium">Failed to load tour details</p>
					<p class="text-sm mt-1">Please check your connection and try again.</p>
				</div>
			</div>
		</div>
	{/if}
	
	{#if tourLoading && !tour}
		<div class="animate-pulse space-y-6">
			<!-- Loading skeleton -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div class="lg:col-span-2 space-y-6">
					<!-- Stats skeleton -->
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
						{#each Array(4) as _}
							<div class="rounded-lg p-3" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
								<div class="h-3 w-12 mb-2 rounded" style="background: var(--bg-tertiary);"></div>
								<div class="h-6 w-16 mb-1 rounded" style="background: var(--bg-tertiary);"></div>
								<div class="h-3 w-20 rounded" style="background: var(--bg-tertiary);"></div>
							</div>
						{/each}
					</div>
					
					<!-- Tour info skeleton -->
					<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b" style="border-color: var(--border-primary);">
							<div class="h-6 w-32 rounded" style="background: var(--bg-tertiary);"></div>
						</div>
						<div class="p-4 space-y-4">
							<div class="h-4 w-full rounded" style="background: var(--bg-tertiary);"></div>
							<div class="h-4 w-3/4 rounded" style="background: var(--bg-tertiary);"></div>
							<div class="h-4 w-5/6 rounded" style="background: var(--bg-tertiary);"></div>
						</div>
					</div>
					
					<!-- Schedule skeleton -->
					<div class="rounded-xl h-96" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b" style="border-color: var(--border-primary);">
							<div class="h-6 w-32 rounded" style="background: var(--bg-tertiary);"></div>
						</div>
					</div>
				</div>
				
				<div class="space-y-6">
					<!-- QR skeleton -->
					<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b" style="border-color: var(--border-primary);">
							<div class="h-6 w-40 rounded" style="background: var(--bg-tertiary);"></div>
						</div>
						<div class="p-4">
							<div class="aspect-square bg-white rounded-lg flex items-center justify-center">
								<div class="w-3/4 h-3/4 rounded" style="background: var(--bg-tertiary);"></div>
							</div>
						</div>
					</div>
					
					<!-- Actions skeleton -->
					<div class="rounded-xl h-48" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 space-y-3">
							<div class="h-10 w-full rounded" style="background: var(--bg-tertiary);"></div>
							<div class="h-10 w-full rounded" style="background: var(--bg-tertiary);"></div>
							<div class="h-10 w-full rounded" style="background: var(--bg-tertiary);"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else if tour}
		<!-- Mobile Tabs -->
		<div class="sm:hidden mb-6 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="grid grid-cols-3 gap-1">
				<button
					onclick={() => mobileTab = 'info'}
					class="px-3 py-2 text-sm font-medium rounded-md transition-colors {mobileTab === 'info' ? 'bg-primary text-white' : ''}"
					style="{mobileTab === 'info' ? 'background: var(--color-primary-500); color: white;' : 'color: var(--text-secondary);'}"
				>
					Info
				</button>
				<button
					onclick={() => mobileTab = 'schedule'}
					class="px-3 py-2 text-sm font-medium rounded-md transition-colors {mobileTab === 'schedule' ? 'bg-primary text-white' : ''}"
					style="{mobileTab === 'schedule' ? 'background: var(--color-primary-500); color: white;' : 'color: var(--text-secondary);'}"
				>
					Schedule
				</button>
				<button
					onclick={() => mobileTab = 'qr'}
					class="px-3 py-2 text-sm font-medium rounded-md transition-colors {mobileTab === 'qr' ? 'bg-primary text-white' : ''}"
					style="{mobileTab === 'qr' ? 'background: var(--color-primary-500); color: white;' : 'color: var(--text-secondary);'}"
				>
					QR & Stats
				</button>
			</div>
		</div>
		
		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
			<!-- Left Column - Main Content -->
			<div class="lg:col-span-2 xl:col-span-3 space-y-6 xl:space-y-8 {mobileTab !== 'info' && mobileTab !== 'schedule' ? 'hidden sm:block' : ''}">
				<!-- Tour Details - Compact version at top -->
				<div class="rounded-xl {mobileTab !== 'info' ? 'hidden sm:block' : ''}" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b flex items-center justify-between" style="border-color: var(--border-primary);">
						<h2 class="font-semibold" style="color: var(--text-primary);">Tour Information</h2>
						<div class="flex items-center gap-3">
							<!-- Inline stats - Desktop only -->
							<div class="hidden sm:flex items-center gap-4 text-sm" style="color: var(--text-secondary);">
								<span>{stats?.totalBookings || 0} bookings</span>
								<span>•</span>
								<span>{$globalCurrencyFormatter(stats?.totalRevenue || 0)}</span>
								<span>•</span>
								<span>{tour.qrScans || 0} scans</span>
								<span>•</span>
								<span>{getConversionRateText()} conversion</span>
							</div>
							<button onclick={() => goto(`/tours/${tourId}/edit`)} class="button-secondary button--small button--icon">
								<Edit class="h-4 w-4" />
							</button>
						</div>
					</div>
					<div class="p-4 space-y-4">
						<!-- Key facts - full width -->
						<div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
							<div class="sm:col-span-2 p-2 sm:p-3 rounded-lg text-center" style="background: var(--bg-secondary);">
								<p class="text-xs" style="color: var(--text-tertiary);">Price</p>
								<p class="font-semibold text-base sm:text-lg" style="color: var(--text-primary);">€{tour.price}</p>
							</div>
							<div class="sm:col-span-2 p-2 sm:p-3 rounded-lg text-center" style="background: var(--bg-secondary);">
								<p class="text-xs" style="color: var(--text-tertiary);">Duration</p>
								<p class="font-semibold text-base sm:text-lg" style="color: var(--text-primary);">{tour.duration}min</p>
							</div>
							<div class="sm:col-span-2 p-2 sm:p-3 rounded-lg text-center" style="background: var(--bg-secondary);">
								<p class="text-xs" style="color: var(--text-tertiary);">Max Group Size</p>
								<p class="font-semibold text-base sm:text-lg" style="color: var(--text-primary);">{tour.capacity}</p>
							</div>
						</div>
						
						<!-- Description - full width -->
						{#if tour.description}
							<div>
								{#if tour.description.length > 200 && !showFullDescription}
									<p class="text-sm leading-relaxed" style="color: var(--text-primary);">
										{tour.description.slice(0, 200)}...
										<button onclick={() => showFullDescription = true} class="text-sm font-medium hover:underline ml-1" style="color: var(--color-primary-600);">
											Show more
										</button>
									</p>
								{:else if tour.description.length > 200 && showFullDescription}
									<p class="text-sm leading-relaxed" style="color: var(--text-primary);">
										{tour.description}
										<button onclick={() => showFullDescription = false} class="text-sm font-medium hover:underline ml-1" style="color: var(--color-primary-600);">
											Show less
										</button>
									</p>
								{:else}
									<p class="text-sm leading-relaxed" style="color: var(--text-primary);">{tour.description}</p>
								{/if}
							</div>
						{/if}

						<!-- Additional details in responsive grid -->
						{#if (tour.includedItems && tour.includedItems.length > 0) || (tour.requirements && tour.requirements.length > 0) || tour.cancellationPolicy}
							<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{#if tour.includedItems && tour.includedItems.length > 0}
									<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
										<p class="text-sm font-medium mb-2 flex items-center gap-1" style="color: var(--text-secondary);">
											<Check class="h-4 w-4" style="color: var(--color-success-600);" />
											What's Included
										</p>
										<div class="space-y-1">
											{#each tour.includedItems as item}
												<div class="flex items-center gap-2 text-xs" style="color: var(--text-primary);">
													<Check class="h-3 w-3 flex-shrink-0" style="color: var(--color-success-600);" />
													{item}
												</div>
											{/each}
										</div>
									</div>
								{/if}
								
								{#if tour.requirements && tour.requirements.length > 0}
									<div class="p-3 rounded-lg" style="background: var(--bg-secondary);">
										<p class="text-sm font-medium mb-2 flex items-center gap-1" style="color: var(--text-secondary);">
											<Info class="h-4 w-4" style="color: var(--color-warning-600);" />
											Requirements
										</p>
										<div class="space-y-1">
											{#each tour.requirements as requirement}
												<div class="flex items-center gap-2 text-xs" style="color: var(--text-primary);">
													<Info class="h-3 w-3 flex-shrink-0" style="color: var(--color-warning-600);" />
													{requirement}
												</div>
											{/each}
										</div>
									</div>
								{/if}
								
								{#if tour.cancellationPolicy}
									<div class="p-3 rounded-lg {tour.includedItems || tour.requirements ? '' : 'sm:col-span-2 lg:col-span-3'}" style="background: var(--bg-secondary);">
										<p class="text-sm font-medium mb-2 flex items-center gap-1" style="color: var(--text-secondary);">
											<Shield class="h-4 w-4" style="color: var(--color-info-600);" />
											Cancellation Policy
										</p>
										<p class="text-xs leading-relaxed" style="color: var(--text-primary);">{tour.cancellationPolicy}</p>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
				
				<!-- Schedule Section -->
				<div id="schedule" class="rounded-xl {mobileTab === 'schedule' ? 'block' : 'hidden sm:block'}" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b flex items-center justify-between" style="border-color: var(--border-primary);">
						<div>
							<h2 class="font-semibold" style="color: var(--text-primary);">Tour Schedule</h2>
							{#if schedule?.scheduleStats}
								<p class="text-sm mt-1" style="color: var(--text-secondary);">
									{schedule.scheduleStats.upcomingSlots} upcoming • {schedule.scheduleStats.totalBookings} bookings total
								</p>
							{:else if scheduleLoading}
								<p class="text-sm mt-1" style="color: var(--text-secondary);">Loading schedule...</p>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<button onclick={() => goto(`/tours/${tourId}/bookings`)} class="button-secondary button--small button--gap">
								<Eye class="h-3 w-3" />
								<span class="hidden sm:inline">View Bookings</span>
							</button>
							<button onclick={() => showAddSlotsModal = true} class="button-primary button--small button--gap">
								<Plus class="h-3 w-3" />
								<span class="hidden sm:inline">Add Slots</span>
							</button>
						</div>
					</div>
					
					{#if scheduleLoading}
						<div class="p-4">
							<div class="animate-pulse">
								<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
									<!-- Calendar skeleton -->
									<div class="h-96 rounded-lg" style="background: var(--bg-secondary);"></div>
									<!-- Slots skeleton -->
									<div class="space-y-3">
										{#each Array(3) as _}
											<div class="h-20 rounded-lg" style="background: var(--bg-secondary);"></div>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{:else if schedule?.timeSlots && schedule.timeSlots.length > 0}
						<div class="p-4">
							<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1fr_1.2fr] gap-6 xl:gap-8">
								<!-- Calendar -->
								<div>
									<ScheduleCalendar 
										bind:selectedDate
										bind:currentMonth
										slots={schedule.timeSlots}
										onSelectDate={handleDateSelect}
										onMonthChange={handleMonthChange}
									/>
								</div>
								
								<!-- Selected Date Slots -->
								<div>
									<!-- Debug info -->
									{#if browser}
										<div class="mb-2 p-2 text-xs rounded" style="background: var(--bg-secondary); color: var(--text-secondary);">
											Selected: {selectedDate.toDateString()}, Slots: {selectedDateSlots().length}
											{#if schedule?.timeSlots}
												<br>Total schedule slots: {schedule.timeSlots.length}
												<br>Sample slot dates: {schedule.timeSlots.slice(0, 3).map((s: any) => new Date(s.startTime).toDateString()).join(', ')}
											{/if}
										</div>
									{/if}
									
									<TimeSlotsList 
										selectedDate={selectedDate}
										slots={selectedDateSlots()}
										onEditSlot={(slot) => {
											// TODO: Open inline edit modal instead of navigation
											console.log('Edit slot:', slot);
											// For now, navigate to edit page
											goto(`/tours/${tourId}/schedule/edit/${slot.id}`);
										}}
									/>
								</div>
							</div>
						</div>
					{:else}
						<div class="p-4">
							<div class="text-center py-12">
								<CalendarDays class="w-12 h-12 mx-auto mb-4" style="color: var(--text-tertiary); opacity: 0.5;" />
								<h3 class="text-lg font-medium mb-2" style="color: var(--text-primary);">No time slots scheduled</h3>
								<p class="text-sm mb-6" style="color: var(--text-secondary);">
									Create time slots to start accepting bookings for this tour
								</p>
								<button onclick={() => showAddSlotsModal = true} class="button-primary button--gap">
									<Plus class="h-4 w-4" />
									Create Time Slots
								</button>
							</div>
						</div>
					{/if}
				</div>
				
				<!-- Tour Images - At bottom on desktop, normal position on mobile -->
				{#if tour.images && tour.images.length > 0}
					<div class="rounded-xl {mobileTab !== 'info' ? 'hidden sm:block' : ''}" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b flex items-center justify-between" style="border-color: var(--border-primary);">
							<h2 class="font-semibold" style="color: var(--text-primary);">Tour Gallery</h2>
							<span class="text-sm" style="color: var(--text-secondary);">{tour.images.length} {tour.images.length === 1 ? 'image' : 'images'}</span>
						</div>
						<div class="p-4">
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
								{#each showAllImages ? tour.images : tour.images.slice(0, 6) as image, index}
									<button onclick={() => openLightbox(image)} class="relative aspect-video rounded-lg overflow-hidden group cursor-pointer gallery-thumbnail loaded">
										<img 
											src={`/api/images/${tourId}/${image}?size=medium`}
											alt="Tour image {index + 1}"
											class="w-full h-full object-cover transition-transform group-hover:scale-105 thumbnail-image"
											loading="lazy"
										/>
										<div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10" style="background: rgba(0, 0, 0, 0.3);">
											<Eye class="w-6 h-6 text-white" />
										</div>
									</button>
								{/each}
							</div>
							{#if tour.images.length > 6 && !showAllImages}
								<button onclick={() => showAllImages = true} class="mt-3 button-secondary button--small button--full-width">
									Show all {tour.images.length} images
								</button>
							{/if}
							{#if tour.images.length > 6 && showAllImages}
								<button onclick={() => showAllImages = false} class="mt-3 button-secondary button--small button--full-width">
									Show less
								</button>
							{/if}
						</div>
					</div>
				{:else}
					<div class="rounded-xl {mobileTab !== 'info' ? 'hidden sm:block' : ''}" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b flex items-center justify-between" style="border-color: var(--border-primary);">
							<h2 class="font-semibold" style="color: var(--text-primary);">Tour Gallery</h2>
							<button onclick={() => goto(`/tours/${tourId}/edit`)} class="button-secondary button--small button--icon">
								<Plus class="h-4 w-4" />
							</button>
						</div>
						<div class="p-8 text-center">
							<Image class="w-12 h-12 mx-auto mb-3" style="color: var(--text-tertiary); opacity: 0.5;" />
							<p class="text-sm mb-3" style="color: var(--text-secondary);">No images uploaded yet</p>
							<button onclick={() => goto(`/tours/${tourId}/edit`)} class="button-secondary button--small">
								Add Images
							</button>
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Right Column - Sidebar -->
			<div class="space-y-6 xl:space-y-8 {mobileTab !== 'qr' ? 'hidden lg:block' : ''}">
				<!-- QR Code Section -->
				<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<h3 class="font-semibold" style="color: var(--text-primary);">QR Code & Booking Link</h3>
					</div>
					<div class="p-4 space-y-4">
						<!-- QR Code -->
						<div class="aspect-square bg-white rounded-lg p-6 flex items-center justify-center shadow-inner">
							{#if tour.qrCode}
								<img 
									src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(bookingUrl)}&qzone=2`}
									alt="Tour QR Code"
									class="w-full h-full object-contain"
								/>
							{:else}
								<div class="text-center">
									<QrCode class="w-16 h-16 mx-auto mb-2" style="color: var(--text-tertiary);" />
									<p class="text-sm" style="color: var(--text-secondary);">Generating QR code...</p>
								</div>
							{/if}
						</div>
						
						<!-- QR Code ID -->
						{#if tour.qrCode}
							<div class="text-center p-2 rounded" style="background: var(--bg-secondary);">
								<p class="text-xs font-mono" style="color: var(--text-secondary);">{tour.qrCode}</p>
							</div>
						{/if}
						
						<!-- Removed duplicate stats cards - this info is already shown in tour information header -->
						
						<!-- Actions -->
						<div class="space-y-2">
							<button onclick={copyQrCode} class="button-primary button--full-width button--gap">
								{#if qrCopied}
									<CheckCircle class="h-4 w-4" />
									Link Copied!
								{:else}
									<Copy class="h-4 w-4" />
									Copy Booking Link
								{/if}
							</button>
							<div class="grid grid-cols-2 gap-2">
								<button onclick={() => window.open(bookingUrl, '_blank')} class="button-secondary button--full-width button--gap">
									<ExternalLink class="h-4 w-4" />
									<span class="hidden sm:inline">Preview</span>
									<span class="sm:hidden">Preview</span>
								</button>
								<button onclick={downloadQrCode} class="button-secondary button--full-width button--gap">
									<Download class="h-4 w-4" />
									<span class="hidden sm:inline">Download</span>
									<span class="sm:hidden">Download</span>
								</button>
							</div>
						</div>
						
						<!-- Link Display -->
						<div class="text-xs text-center" style="color: var(--text-tertiary);">
							<p class="truncate">{bookingUrl}</p>
						</div>
					</div>
				</div>
				
				<!-- Quick Actions - Mobile only -->
				<div class="rounded-xl sm:hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<h3 class="font-semibold" style="color: var(--text-primary);">Quick Actions</h3>
					</div>
					<div class="p-4 space-y-2">
						<button onclick={() => goto(`/tours/${tourId}/bookings`)} class="button-secondary button--full-width button--gap justify-start">
							<CalendarDays class="h-4 w-4" />
							Tour Bookings
						</button>
						<button onclick={() => goto(`/analytics?tour=${tourId}`)} class="button-secondary button--full-width button--gap justify-start">
							<BarChart3 class="h-4 w-4" />
							Tour Analytics
						</button>
						<button onclick={() => goto('/checkin-scanner')} class="button-secondary button--full-width button--gap justify-start">
							<QrCode class="h-4 w-4" />
							QR Scanner
						</button>
					</div>
				</div>
				
				<!-- Recent Activity -->
				{#if stats?.recentBookings && stats.recentBookings.length > 0}
					<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b flex items-center justify-between" style="border-color: var(--border-primary);">
							<div>
								<h3 class="font-semibold" style="color: var(--text-primary);">Recent Bookings</h3>
								<p class="text-xs mt-0.5" style="color: var(--text-secondary);">Last {stats.recentBookings.length} bookings</p>
							</div>
							<button onclick={() => goto(`/tours/${tourId}/bookings`)} class="text-xs hover:underline" style="color: var(--text-tertiary);">
								View all
							</button>
						</div>
						<div class="divide-y" style="border-color: var(--border-primary);">
							{#each stats.recentBookings.slice(0, 5) as booking}
								<button onclick={() => goto(`/bookings/${booking.id}`)} class="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
									<div class="flex items-center justify-between mb-2">
										<div class="flex items-center gap-2">
											<span class="text-sm font-medium" style="color: var(--text-primary);">{booking.customerName}</span>
											{#if booking.status === 'confirmed'}
												<span class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full" style="background: var(--color-success-100); color: var(--color-success-700);">
													Confirmed
												</span>
											{/if}
										</div>
										<ChevronRight class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style="color: var(--text-tertiary);" />
									</div>
									<div class="flex items-center justify-between text-xs" style="color: var(--text-secondary);">
										<div class="flex items-center gap-3">
											<span class="flex items-center gap-1">
												<Users class="w-3 h-3" />
												{booking.participants} {booking.participants === 1 ? 'guest' : 'guests'}
											</span>
											<span class="flex items-center gap-1">
												<Calendar class="w-3 h-3" />
												{formatDate(booking.tourDate || booking.effectiveDate || booking.created)}
											</span>
										</div>
										<span class="font-medium" style="color: var(--text-primary);">
											{$globalCurrencyFormatter(booking.totalAmount)}
										</span>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b" style="border-color: var(--border-primary);">
							<h3 class="font-semibold" style="color: var(--text-primary);">Recent Bookings</h3>
						</div>
						<div class="p-8 text-center">
							<Calendar class="w-8 h-8 mx-auto mb-2" style="color: var(--text-tertiary); opacity: 0.5;" />
							<p class="text-sm" style="color: var(--text-secondary);">No bookings yet</p>
							<p class="text-xs mt-1" style="color: var(--text-tertiary);">Share your QR code to get bookings</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

<!-- Floating Action Button (Mobile) -->
{#if tour && !tourLoading}
	<div class="floating-actions sm:hidden">
		{#if tour.status === 'active'}
			<button 
				onclick={() => goto('/checkin-scanner')}
				class="floating-action-btn"
				aria-label="QR Scanner"
			>
				<QrCode class="w-6 h-6" />
			</button>
		{:else}
			<button 
				onclick={() => showAddSlotsModal = true}
				class="floating-action-btn"
				aria-label="Add time slots"
			>
				<Plus class="w-6 h-6" />
			</button>
		{/if}
	</div>
{/if}
</PageContainer>

<!-- Add Time Slots Modal -->
<Modal bind:isOpen={showAddSlotsModal} title="Add Time Slots for {tour?.name || 'Tour'}" size="lg">
	<TimeSlotForm 
		tourId={tourId}
		mode="modal"
		onSuccess={() => {
			showAddSlotsModal = false;
			// Refresh the schedule data
			queryClient.invalidateQueries({ queryKey: ['tour-schedule', tourId] });
			// Show success message
			showAddSlotsSuccess = true;
			setTimeout(() => {
				showAddSlotsSuccess = false;
			}, 3000);
		}}
		onCancel={() => showAddSlotsModal = false}
	/>
</Modal>

<!-- Image Lightbox -->
{#if lightboxOpen}
	<div class="lightbox-overlay" onclick={closeLightbox}>
		<div class="lightbox-content" onclick={(e) => e.stopPropagation()}>
			<button onclick={closeLightbox} class="lightbox-close" aria-label="Close lightbox">
				<XCircle class="w-6 h-6" />
			</button>
			
			<!-- Loading spinner -->
			{#if lightboxImageLoading}
				<div class="lightbox-loader">
					<div class="spinner"></div>
					<p class="loader-text">Loading image...</p>
				</div>
			{/if}
			
			<!-- Error state -->
			{#if lightboxImageError}
				<div class="lightbox-error">
					<AlertCircle class="w-12 h-12 mb-4" />
					<p class="error-text">Failed to load image</p>
					<button onclick={closeLightbox} class="button-secondary button--small mt-4">
						Close
					</button>
				</div>
			{/if}
			
			<!-- Image -->
			{#if !lightboxImageError}
				<img 
					src={lightboxImage} 
					alt="Tour image" 
					class="lightbox-image" 
					class:loading={lightboxImageLoading}
					onload={handleImageLoad}
					onerror={handleImageError}
				/>
			{/if}
		</div>
	</div>
{/if}

<style>
	.animate-fade-in {
		animation: fadeIn 0.3s ease-out;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	/* Floating Action Button */
	.floating-actions {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 40;
	}
	
	.floating-action-btn {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		background: var(--color-primary-500);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		transition: all 0.2s ease;
		border: none;
		cursor: pointer;
	}
	
	.floating-action-btn:hover {
		background: var(--color-primary-600);
		transform: scale(1.05);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
	}
	
	.floating-action-btn:active {
		transform: scale(0.95);
	}
	
	/* Ensure proper layout on all screen sizes */
	@media (max-width: 640px) {
		.grid {
			gap: 1rem;
		}
	}
	
	/* Improve readability on small screens */
	@media (max-width: 400px) {
		.text-lg {
			font-size: 1rem;
		}
		
		.text-2xl {
			font-size: 1.25rem;
		}
	}
	
	/* Lightbox styles */
	.lightbox-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--overlay-dark);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 1rem;
	}
	
	.lightbox-content {
		position: relative;
		max-width: 95vw;
		max-height: 95vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.lightbox-image {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		border-radius: 8px;
		box-shadow: 0 25px 50px -12px var(--shadow-dark);
		transition: opacity 0.3s ease;
	}
	
	.lightbox-image.loading {
		opacity: 0;
	}
	
	.lightbox-close {
		position: absolute;
		top: -1rem;
		right: -1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 50%;
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		z-index: 10000;
		color: var(--text-primary);
	}
	
	.lightbox-close:hover {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
		transform: scale(1.1);
	}
	
	.lightbox-close svg {
		color: var(--text-primary);
	}
	
	/* Lightbox loader */
	.lightbox-loader {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		color: var(--text-primary);
	}
	
	.spinner {
		width: 3rem;
		height: 3rem;
		border: 3px solid var(--border-primary);
		border-top: 3px solid var(--color-primary-500);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}
	
	.loader-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
	}
	
	/* Lightbox error */
	.lightbox-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		color: var(--text-primary);
		text-align: center;
		padding: 2rem;
	}
	
	.error-text {
		font-size: 1rem;
		color: var(--text-secondary);
		margin: 0;
	}
	
	.lightbox-error svg {
		color: var(--color-error-500);
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	/* Gallery thumbnail loading */
	.gallery-thumbnail {
		position: relative;
	}
	
	.thumbnail-skeleton {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--bg-secondary);
		border-radius: inherit;
		z-index: 2;
		transition: opacity 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 1;
	}
	
	.thumbnail-skeleton::after {
		content: '';
		width: 1.5rem;
		height: 1.5rem;
		border: 2px solid var(--border-primary);
		border-top: 2px solid var(--color-primary-500);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	.gallery-thumbnail.loaded .thumbnail-skeleton {
		opacity: 0;
		pointer-events: none;
	}
	
	.thumbnail-image {
		position: relative;
		z-index: 1;
	}
</style> 
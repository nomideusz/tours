<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate, getStatusColor } from '$lib/utils/date-helpers.js';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	
	// TanStack Query
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { updateTourStatusMutation } from '$lib/queries/mutations.js';
	
	// Onboarding utilities
	import { canActivateTours, getOnboardingMessage, getNextOnboardingStep } from '$lib/utils/onboarding.js';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import TourTimeline from '$lib/components/TourTimeline.svelte';
	import TimeSlotsList from '$lib/components/TimeSlotsList.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import Drawer from '$lib/components/Drawer.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
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
	import X from 'lucide-svelte/icons/x';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	
	// Get data from load function
	let { data } = $props();
	let tourId = $derived(data.tourId);
	let profile = $derived(data.user);
	
	const queryClient = useQueryClient();
	
	// Initialize mutations
	const updateStatusMutation = updateTourStatusMutation();
	
	// TanStack Query for tour details
	const tourDetailsQuery = createQuery({
		queryKey: queryKeys.tourDetails(tourId),
		queryFn: () => queryFunctions.fetchTourDetails(tourId),
		staleTime: 5 * 60 * 1000, // 5 minutes - reduce refetching
		gcTime: 10 * 60 * 1000, // 10 minutes
		refetchOnWindowFocus: false, // Don't refetch on window focus to reduce requests
		refetchOnMount: true, // Refetch on mount once
		enabled: !!tourId && browser,
		retry: 2, // Reduce retries to 2
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Max 5 second delay
	});
	
	// Derive data from queries - only need tour details since TourTimeline handles its own schedule data
	let tour = $derived($tourDetailsQuery.data?.tour || null);
	let stats = $derived($tourDetailsQuery.data?.stats || null);
	
	// Only loading state for tour details
	let tourLoading = $derived($tourDetailsQuery.isLoading);
	let isLoading = $derived(tourLoading);
	let isError = $derived($tourDetailsQuery.isError);
	
	// Onboarding status
	let hasConfirmedLocation = $state(false);
	let paymentStatus = $state({ isSetup: false, loading: true });
	
	// Initialize onboarding status
	$effect(() => {
		if (browser && profile) {
			// Check if location is confirmed from localStorage
			hasConfirmedLocation = localStorage.getItem('locationConfirmed') === 'true';
			
			// Also consider location confirmed if user has country+currency or stripe account
			if ((profile.country && profile.currency) || profile.stripeAccountId) {
				hasConfirmedLocation = true;
				localStorage.setItem('locationConfirmed', 'true');
			}
			
			// Check payment status
			checkPaymentStatus();
		}
	});
	
	// Check payment status
	async function checkPaymentStatus() {
		if (!profile?.stripeAccountId) {
			paymentStatus = { isSetup: false, loading: false };
			return;
		}

		try {
			const response = await fetch('/api/payments/connect/status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: profile.id })
			});

			if (response.ok) {
				const data = await response.json();
				paymentStatus = {
					isSetup: data.canReceivePayments || false,
					loading: false
				};
			} else {
				paymentStatus = { isSetup: false, loading: false };
			}
		} catch (error) {
			console.error('Error checking payment status:', error);
			paymentStatus = { isSetup: false, loading: false };
		}
	}
	
	// State
	let qrCopied = $state(false);
	let linkCopied = $state(false);
	let selectedDate = $state(new Date());
	let selectedDateSlots = $state<any[]>([]);
	let calendarView = $state<'day' | 'week' | 'month'>('month');
	let currentCalendarDate = $state(new Date());
	let showAllImages = $state(false);
	let showFullDescription = $state(false);
	let showAddSlotsModal = $state(false);
	let mobileTab = $state<'info' | 'schedule' | 'qr'>('info');
	let lightboxOpen = $state(false);
	let lightboxImage = $state<string>('');
	let lightboxImageLoading = $state(false);
	let lightboxImageError = $state(false);
	let showWelcomePrompt = $state(false);
	let hasInitialSchedule = $state(false);
	let showOnboardingModal = $state(false);
	let onboardingModalMessage = $state('');
	
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
	
	// Query for selected date slots
	const selectedDateSlotsQuery = createQuery({
		queryKey: ['tour-slots-for-date', tourId, selectedDate.toDateString()],
		queryFn: async () => {
			if (!tourId) return [];
			const scheduleData = await queryFunctions.fetchTourSchedule(tourId);
			const selectedDateStr = selectedDate.toDateString();
			return scheduleData.timeSlots?.filter((slot: any) => {
				if (!slot.startTime) return false;
				try {
					const slotDate = new Date(slot.startTime);
					return !isNaN(slotDate.getTime()) && slotDate.toDateString() === selectedDateStr;
				} catch (error) {
					return false;
				}
			}) || [];
		},
		staleTime: 2 * 60 * 1000, // 2 minutes
		enabled: !!tourId && browser,
	});
	
	// Update selectedDateSlots when query data changes
	$effect(() => {
		selectedDateSlots = $selectedDateSlotsQuery.data || [];
	});
	
	// Handle slot selection from TourTimeline
	function handleSlotClick(slot: any) {
		// Update selected date to the slot's date
		const newDate = new Date(slot.startTime);
		if (selectedDate.toDateString() !== newDate.toDateString()) {
			selectedDate = newDate;
		}
	}
	
	// Handle view changes from TourTimeline
	function handleViewChange(newView: 'day' | 'week' | 'month') {
		calendarView = newView;
	}
	
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
	
	// Copy functions with proper timeout cleanup
	let copyTimeouts: NodeJS.Timeout[] = [];
	
	async function copyQrCode() {
		if (!bookingUrl) return;
		
		try {
			await navigator.clipboard.writeText(bookingUrl);
			qrCopied = true;
			const timeoutId = setTimeout(() => {
				qrCopied = false;
			}, 2000);
			copyTimeouts.push(timeoutId);
		} catch (err) {
			console.error('Failed to copy QR code:', err);
		}
	}

	async function copyBookingLink() {
		if (!bookingUrl) return;
		
		try {
			await navigator.clipboard.writeText(bookingUrl);
			linkCopied = true;
			const timeoutId = setTimeout(() => {
				linkCopied = false;
			}, 2000);
			copyTimeouts.push(timeoutId);
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

	// Activate tour from welcome prompt
	async function activateTour() {
		if (!tour || tour.status === 'active') return;
		
		// Check onboarding completion
		const activationCheck = canActivateTours(profile, hasConfirmedLocation, paymentStatus);
		if (!activationCheck.canActivate) {
			const onboardingMessage = getOnboardingMessage(activationCheck.missingSteps);
			const nextStep = getNextOnboardingStep(activationCheck.missingSteps);
			
			onboardingModalMessage = `${onboardingMessage}\n\n${nextStep ? `Next: ${nextStep.action}` : ''}`;
			showOnboardingModal = true;
			return;
		}
		
		try {
			await $updateStatusMutation.mutateAsync({ 
				tourId: tour.id, 
				status: 'active' 
			});
			
			// Close welcome prompt after successful activation
			showWelcomePrompt = false;
			
			// Show a brief success message
			showEditSuccess = true;
			const timeoutId = setTimeout(() => {
				showEditSuccess = false;
			}, 3000);
			successTimeouts.push(timeoutId);
		} catch (error) {
			console.error('Failed to activate tour:', error);
			// Could add error state here if needed
		}
	}
	
	function handleOnboardingModalConfirm() {
		showOnboardingModal = false;
		// Redirect to dashboard for onboarding
		goto('/dashboard');
	}

	// Check for success messages from navigation
	let showEditSuccess = $state(false);
	let showScheduleSuccess = $state(false);
	let showAddSlotsSuccess = $state(false);
	
	// Track timeouts for proper cleanup
	let successTimeouts: NodeJS.Timeout[] = [];
	
	// Only run URL effects once per page load, not on every render
	let hasProcessedUrlParams = $state(false);
	
	$effect(() => {
		if (browser && !hasProcessedUrlParams) {
			hasProcessedUrlParams = true;
			const urlParams = new URLSearchParams(window.location.search);
			
			if (urlParams.get('edited') === 'true') {
				showEditSuccess = true;
				// Clear the URL parameter
				const newUrl = new URL(window.location.href);
				newUrl.searchParams.delete('edited');
				window.history.replaceState({}, '', newUrl.toString());
				
				// Hide after 3 seconds
				const timeoutId = setTimeout(() => {
					showEditSuccess = false;
				}, 3000);
				successTimeouts.push(timeoutId);
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
				const timeoutId = setTimeout(() => {
					showScheduleSuccess = false;
				}, 3000);
				successTimeouts.push(timeoutId);
			}
			
			if (urlParams.get('created') === 'true') {
				showWelcomePrompt = true;
				// Clear the URL parameter
				const newUrl = new URL(window.location.href);
				newUrl.searchParams.delete('created');
				
				// Also check if tour was created with initial schedule
				hasInitialSchedule = urlParams.get('scheduled') === 'true';
				if (hasInitialSchedule) {
					newUrl.searchParams.delete('scheduled');
				}
				
				window.history.replaceState({}, '', newUrl.toString());
				
				// Welcome prompt stays visible until manually dismissed
			}
		}
		
		// Cleanup function for timeouts
		return () => {
			successTimeouts.forEach(timeout => clearTimeout(timeout));
			copyTimeouts.forEach(timeout => clearTimeout(timeout));
			successTimeouts = [];
			copyTimeouts = [];
		};
	});

	// Force queries to start immediately on mount
	onMount(() => {
		console.log('🔄 Tour details page mounted, tourId:', tourId);
		console.log('📊 Tour details query state:', {
			isLoading: $tourDetailsQuery.isLoading,
			isError: $tourDetailsQuery.isError,
			data: $tourDetailsQuery.data
		});
		
		// Immediately refetch tour details query
		$tourDetailsQuery.refetch();
	});
	
	// Debug query states
	$effect(() => {
		if ($tourDetailsQuery.isLoading) {
			console.log('⏳ Tour details loading...');
		}
		if ($tourDetailsQuery.isError) {
			console.error('❌ Tour details error:', $tourDetailsQuery.error);
		}
		if ($tourDetailsQuery.data) {
			console.log('✅ Tour details loaded:', $tourDetailsQuery.data);
		}
		if ($selectedDateSlotsQuery.data) {
			console.log('📅 Selected date slots loaded:', $selectedDateSlotsQuery.data);
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
	
	{#if showWelcomePrompt}
		<div class="mb-6 rounded-xl p-6 alert-info animate-fade-in" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
			<div class="flex items-start gap-4">
				<div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style="background: var(--color-primary-100);">
					<Calendar class="h-6 w-6" style="color: var(--color-primary-600);" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-lg mb-2" style="color: var(--color-primary-900);">🎉 Tour Created Successfully!</h3>
					{#if tour?.status === 'active'}
						{#if hasInitialSchedule}
							<p class="mb-4" style="color: var(--color-primary-700);">
								Your tour is now live with initial time slots! You can view your schedule below, add more time slots, or start sharing your QR code to get bookings.
							</p>
							<div class="flex flex-col sm:flex-row gap-3">
								<button onclick={() => {
									const scheduleSection = document.getElementById('schedule');
									if (scheduleSection) {
										scheduleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
									}
									showWelcomePrompt = false;
								}} class="button-primary button--gap">
									<Calendar class="h-4 w-4" />
									View Schedule
								</button>
								<button onclick={() => showAddSlotsModal = true} class="button-secondary button--gap">
									<Plus class="h-4 w-4" />
									Add More Slots
								</button>
								<button onclick={() => showWelcomePrompt = false} class="button-secondary button--gap">
									<X class="h-4 w-4" />
									Dismiss
								</button>
							</div>
						{:else}
							<p class="mb-4" style="color: var(--color-primary-700);">
								Your tour is now live! To start accepting bookings, you'll need to add some time slots when your tour will be available.
							</p>
							<div class="flex flex-col sm:flex-row gap-3">
								<button onclick={() => showAddSlotsModal = true} class="button-primary button--gap">
									<Plus class="h-4 w-4" />
									Add Time Slots Now
								</button>
								<button onclick={() => showWelcomePrompt = false} class="button-secondary button--gap">
									<X class="h-4 w-4" />
									Dismiss
								</button>
							</div>
						{/if}
					{:else}
						<!-- Draft tour -->
						{#if hasInitialSchedule}
							<p class="mb-4" style="color: var(--color-primary-700);">
								Your tour has been created as a draft with initial time slots. You can activate it now to start accepting bookings, or review and edit it first.
							</p>
							<div class="flex flex-col sm:flex-row gap-3">
								<button 
									onclick={activateTour} 
									class="button-primary button--gap"
									disabled={$updateStatusMutation.isPending}
								>
									{#if $updateStatusMutation.isPending}
										<div class="w-4 h-4 rounded-full animate-spin mr-2" style="border: 2px solid currentColor; border-top-color: transparent;"></div>
									{:else}
										<CheckCircle class="h-4 w-4" />
									{/if}
									{$updateStatusMutation.isPending ? 'Activating...' : 'Activate Tour'}
								</button>
								<button onclick={() => {
									const scheduleSection = document.getElementById('schedule');
									if (scheduleSection) {
										scheduleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
									}
									showWelcomePrompt = false;
								}} class="button-secondary button--gap">
									<Calendar class="h-4 w-4" />
									View Schedule
								</button>
								<button onclick={() => goto(`/tours/${tourId}/edit`)} class="button-secondary button--gap">
									<Edit class="h-4 w-4" />
									Edit First
								</button>
								<button onclick={() => showWelcomePrompt = false} class="button-secondary button--gap">
									<X class="h-4 w-4" />
									Dismiss
								</button>
							</div>
						{:else}
							<p class="mb-4" style="color: var(--color-primary-700);">
								Your tour has been created as a draft. Add some time slots to start accepting bookings, then activate your tour when you're ready.
							</p>
							<div class="flex flex-col sm:flex-row gap-3">
								<button onclick={() => showAddSlotsModal = true} class="button-primary button--gap">
									<Plus class="h-4 w-4" />
									Add Time Slots
								</button>
								<button 
									onclick={activateTour} 
									class="button-secondary button--gap"
									disabled={$updateStatusMutation.isPending}
								>
									{#if $updateStatusMutation.isPending}
										<div class="w-4 h-4 rounded-full animate-spin mr-2" style="border: 2px solid currentColor; border-top-color: transparent;"></div>
									{:else}
										<CheckCircle class="h-4 w-4" />
									{/if}
									{$updateStatusMutation.isPending ? 'Activating...' : 'Activate Now'}
								</button>
								<button onclick={() => goto(`/tours/${tourId}/edit`)} class="button-secondary button--gap">
									<Edit class="h-4 w-4" />
									Edit Tour
								</button>
								<button onclick={() => showWelcomePrompt = false} class="button-secondary button--gap">
									<X class="h-4 w-4" />
									Dismiss
								</button>
							</div>
						{/if}
					{/if}
				</div>
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
				backgroundColor: tour.status === 'active' ? 'var(--color-success-100)' : 'var(--color-warning-100)',
				textColor: tour.status === 'active' ? 'var(--color-success-800)' : 'var(--color-warning-800)'
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
					label: 'Add Time Slots',
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
						<div class="tour-status-badge tour-status-badge--{tour.status}">
							{#if tour.status === 'active'}
								<CheckCircle class="h-5 w-5" />
							{:else}
								<FileText class="h-5 w-5" />
							{/if}
							<span class="capitalize font-medium">{tour.status}</span>
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
					<div class="p-3 sm:p-4 space-y-4 sm:space-y-4">
						<!-- Key facts - compact mobile layout -->
						<div class="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-2">
							<div class="p-2 sm:p-3 rounded-lg text-center" style="background: var(--bg-secondary);">
								<p class="text-[10px] sm:text-xs" style="color: var(--text-tertiary);">Price</p>
								<p class="font-semibold text-sm sm:text-lg" style="color: var(--text-primary);">{$globalCurrencyFormatter(tour.price)}</p>
							</div>
							<div class="p-2 sm:p-3 rounded-lg text-center" style="background: var(--bg-secondary);">
								<p class="text-[10px] sm:text-xs" style="color: var(--text-tertiary);">Duration</p>
								<p class="font-semibold text-sm sm:text-lg" style="color: var(--text-primary);">{tour.duration}min</p>
							</div>
							<div class="p-2 sm:p-3 rounded-lg text-center" style="background: var(--bg-secondary);">
								<p class="text-[10px] sm:text-xs leading-tight" style="color: var(--text-tertiary);">Max Group</p>
								<p class="font-semibold text-sm sm:text-lg" style="color: var(--text-primary);">{tour.capacity}</p>
							</div>
						</div>
						
						<!-- Description - mobile-optimized text -->
						{#if tour.description}
							<div>
								{#if tour.description.length > 200 && !showFullDescription}
									<p class="text-sm sm:text-sm leading-relaxed" style="color: var(--text-primary);">
										{tour.description.slice(0, 200)}...
										<button onclick={() => showFullDescription = true} class="text-sm font-medium hover:underline ml-1" style="color: var(--color-primary-600);">
											Show more
										</button>
									</p>
								{:else if tour.description.length > 200 && showFullDescription}
									<p class="text-sm sm:text-sm leading-relaxed" style="color: var(--text-primary);">
										{tour.description}
										<button onclick={() => showFullDescription = false} class="text-sm font-medium hover:underline ml-1" style="color: var(--color-primary-600);">
											Show less
										</button>
									</p>
								{:else}
									<p class="text-sm sm:text-sm leading-relaxed" style="color: var(--text-primary);">{tour.description}</p>
								{/if}
							</div>
						{/if}

						<!-- Additional details - mobile-optimized -->
						{#if (tour.includedItems && tour.includedItems.length > 0) || (tour.requirements && tour.requirements.length > 0) || tour.cancellationPolicy}
							<div class="space-y-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:space-y-0">
								{#if tour.includedItems && tour.includedItems.length > 0}
									<div class="p-3 sm:p-3 rounded-lg" style="background: var(--bg-secondary);">
										<p class="text-sm font-medium mb-2 flex items-center gap-1" style="color: var(--text-secondary);">
											<Check class="h-4 w-4" style="color: var(--color-success-600);" />
											What's Included
										</p>
										<div class="space-y-1.5 sm:space-y-1">
											{#each tour.includedItems as item}
												<div class="flex items-start gap-2 text-xs sm:text-xs" style="color: var(--text-primary);">
													<Check class="h-3 w-3 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" />
													<span class="leading-relaxed">{item}</span>
												</div>
											{/each}
										</div>
									</div>
								{/if}
								
								{#if tour.requirements && tour.requirements.length > 0}
									<div class="p-3 sm:p-3 rounded-lg" style="background: var(--bg-secondary);">
										<p class="text-sm font-medium mb-2 flex items-center gap-1" style="color: var(--text-secondary);">
											<Info class="h-4 w-4" style="color: var(--color-warning-600);" />
											Requirements
										</p>
										<div class="space-y-1.5 sm:space-y-1">
											{#each tour.requirements as requirement}
												<div class="flex items-start gap-2 text-xs sm:text-xs" style="color: var(--text-primary);">
													<Info class="h-3 w-3 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
													<span class="leading-relaxed">{requirement}</span>
												</div>
											{/each}
										</div>
									</div>
								{/if}
								
								{#if tour.cancellationPolicy}
									<div class="p-3 sm:p-3 rounded-lg {tour.includedItems || tour.requirements ? '' : 'sm:col-span-2 lg:col-span-3'}" style="background: var(--bg-secondary);">
										<p class="text-sm font-medium mb-2 flex items-center gap-1" style="color: var(--text-secondary);">
											<Shield class="h-4 w-4" style="color: var(--color-info-600);" />
											Cancellation Policy
										</p>
										<p class="text-xs sm:text-xs leading-relaxed" style="color: var(--text-primary);">{tour.cancellationPolicy}</p>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
				
				<!-- Schedule Section -->
				<section id="schedule" class="rounded-xl {mobileTab !== 'schedule' ? 'hidden sm:block' : ''}" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<div class="flex items-center justify-between">
							<h2 class="text-lg font-semibold" style="color: var(--text-primary);">
								Tour Schedule
							</h2>
							<button onclick={() => showAddSlotsModal = true} class="button-primary button--small button--gap">
								<Plus class="h-4 w-4" />
								Add Slots
							</button>
						</div>
					</div>
					
					<div class="p-4">
						<!-- Mobile: Stack vertically, Desktop: Side by side -->
						<div class="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-[1fr_1.2fr] lg:gap-6 xl:gap-8">
							<!-- Calendar -->
							<div>
								<TourTimeline 
									tourId={tourId}
									bind:view={calendarView}
									bind:currentDate={currentCalendarDate}
									defaultView="month"
									hideHeader={true}
									hideStats={true}
									compact={true}
									onSlotClick={handleSlotClick}
									onViewChange={handleViewChange}
								/>
							</div>
							
							<!-- Selected Date Slots -->
							<div class="lg:mt-0">
								<TimeSlotsList 
									selectedDate={selectedDate}
									slots={selectedDateSlots}
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
				</section>
				
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
							<button onclick={() => goto(`/tours/${tourId}/bookings`)} class="button-secondary button--small button--gap">
								<Eye class="h-3 w-3" />
								<span class="hidden sm:inline">View All</span>
								<span class="sm:hidden">All</span>
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
												{#if booking.tourDate && booking.tourDate !== 'null' && booking.tourDate !== null}
													{formatDate(booking.tourDate)}
												{:else if booking.effectiveDate && booking.effectiveDate !== 'null' && booking.effectiveDate !== null}
													{formatDate(booking.effectiveDate)}
												{:else if booking.created && booking.created !== 'null' && booking.created !== null}
													{formatDate(booking.created)}
												{:else}
													{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
												{/if}
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
		<button 
			onclick={() => showAddSlotsModal = true}
			class="floating-action-btn"
			aria-label="Add time slots"
		>
			<Plus class="w-6 h-6" />
		</button>
	</div>
{/if}
</PageContainer>

<!-- Add Time Slots Drawer -->
<Drawer 
	bind:isOpen={showAddSlotsModal} 
	title="Add Time Slots for {tour?.name || 'Tour'}"
	onClose={() => showAddSlotsModal = false}
>
	<TimeSlotForm 
		tourId={tourId}
		mode="modal"
		onSuccess={() => {
			showAddSlotsModal = false;
			// Refresh the TourTimeline data (it uses tour-schedule query internally)
			queryClient.invalidateQueries({ queryKey: ['tour-schedule', tourId] });
			// Also refresh the selected date slots
			queryClient.invalidateQueries({ queryKey: ['tour-slots-for-date', tourId] });
			// Show success message
			showAddSlotsSuccess = true;
			// Close welcome prompt if it was open (newly created tour)
			showWelcomePrompt = false;
			setTimeout(() => {
				showAddSlotsSuccess = false;
			}, 3000);
		}}
		onCancel={() => showAddSlotsModal = false}
	/>
</Drawer>

<!-- Image Lightbox -->
{#if lightboxOpen}
	<div 
		class="lightbox-overlay" 
		onclick={closeLightbox}
		onkeydown={(e) => e.key === 'Enter' && closeLightbox()}
		role="button"
		tabindex="0"
	>
		<div 
			class="lightbox-content" 
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="0"
		>
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
					alt="" 
					class="lightbox-image" 
					class:loading={lightboxImageLoading}
					onload={handleImageLoad}
					onerror={handleImageError}
				/>
			{/if}
		</div>
	</div>
{/if}

<!-- Onboarding Required Modal -->
<ConfirmationModal
	bind:isOpen={showOnboardingModal}
	title="Complete Onboarding First"
	message={onboardingModalMessage}
	confirmText="Go to Dashboard"
	cancelText="Cancel"
	variant="info"
	icon={AlertCircle}
	onConfirm={handleOnboardingModalConfirm}
/>

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
		bottom: 5rem; /* Account for mobile navigation height */
		right: 1rem;
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
	
	/* Override Opera-specific badge sizing for desktop status badge */
	.tour-status-badge {
		padding: 0.5rem 1.25rem !important;
		font-size: 1rem !important;
		gap: 0.5rem !important;
	}
	
	/* Ensure mobile badges still work properly */
	@media (max-width: 640px) {
		.tour-status-badge {
			padding: 0.25rem 0.75rem !important;
			font-size: 0.75rem !important;
		}
	}
</style> 
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate, getStatusColor } from '$lib/utils/date-helpers.js';
	import { formatDuration, formatCategoryName, getTourDisplayPriceFormatted } from '$lib/utils/tour-helpers-client.js';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	
	// TanStack Query
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	import { updateTourStatusMutation } from '$lib/queries/mutations.js';
	
	// Onboarding utilities
	import { canActivateTours, getOnboardingMessage, getNextOnboardingStep } from '$lib/utils/onboarding.js';
	
	// Umami tracking
	import { trackDashboardEvent, trackTourEvent } from '$lib/utils/umami-tracking.js';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import TourTimeline from '$lib/components/TourTimeline.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import PageContainer from '$lib/components/PageContainer.svelte';
	import UnifiedPricingSummary from '$lib/components/pricing/UnifiedPricingSummary.svelte';
	import AddSlotsDrawer from '$lib/components/AddSlotsDrawer.svelte';
	
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
	import TrendingDown from 'lucide-svelte/icons/trending-down';
	import Eye from 'lucide-svelte/icons/eye';
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
	import Baby from 'lucide-svelte/icons/baby';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	
	// Get data from load function
	let { data } = $props();
	let tourId = $derived(data.tourId);
	let profile = $derived(data.user);
	
	const queryClient = useQueryClient();
	
	// Initialize mutations
	const updateStatusMutation = updateTourStatusMutation();
	
	// Copy tour state
	let isCopyingTour = $state(false);
	let copyError = $state<string | null>(null);
	
	// Generate color for tour based on tour ID/name (same algorithm as tours page)
	function getTourCalendarColor(tourId: string | undefined, tourName: string | undefined): string {
		if (!tourId || !tourName) {
			// Fallback color if data is missing
			return '#3B82F6';
		}
		
		// Use a hash function to generate consistent colors
		let hash = 0;
		const str = tourId + tourName;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) - hash) + str.charCodeAt(i);
			hash = hash & hash; // Convert to 32-bit integer
		}
		
		// Generate HSL values
		const hue = Math.abs(hash) % 360;
		const saturation = 65 + (Math.abs(hash >> 8) % 20); // 65-85%
		const lightness = 45 + (Math.abs(hash >> 16) % 15); // 45-60%
		
		// Convert HSL to RGB for better browser compatibility
		const h = hue / 360;
		const s = saturation / 100;
		const l = lightness / 100;
		
		let r, g, b;
		
		if (s === 0) {
			r = g = b = l; // achromatic
		} else {
			const hue2rgb = (p: number, q: number, t: number) => {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1/6) return p + (q - p) * 6 * t;
				if (t < 1/2) return q;
				if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
				return p;
			};
			
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		}
		
		// Convert to hex
		const toHex = (x: number) => {
			const hex = Math.round(x * 255).toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		};
		
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}
	
	// Time range state (always show all time)
	let timeRange = $state<'week' | 'month' | 'quarter' | 'year' | 'all'>('all');
	
	// TanStack Query for tour details with time range
	const tourDetailsQuery = $derived(createQuery({
		queryKey: [...queryKeys.tourDetails(tourId), timeRange],
		queryFn: () => queryFunctions.fetchTourDetails(tourId, timeRange),
		staleTime: 5 * 60 * 1000, // 5 minutes - reduce refetching
		gcTime: 10 * 60 * 1000, // 10 minutes
		refetchOnWindowFocus: false, // Don't refetch on window focus to reduce requests
		refetchOnMount: true, // Refetch on mount once
		enabled: !!tourId && browser,
		retry: 2, // Reduce retries to 2
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Max 5 second delay
	}));
	
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
	let calendarView = $state<'day' | 'week' | 'month'>('month');
	let currentCalendarDate = $state(new Date());
	let showAllImages = $state(false);
	let showFullDescription = $state(false);
	let mobileTab = $state<'overview' | 'schedule'>('overview');
	let lightboxOpen = $state(false);
	let lightboxImage = $state<string>('');
	let lightboxImageLoading = $state(false);
	let lightboxImageError = $state(false);
	let showWelcomePrompt = $state(false);
	let hasInitialSchedule = $state(false);
	let showOnboardingModal = $state(false);
	let onboardingModalMessage = $state('');
	let showPricingDetails = $state(false);
	
	// Add slots drawer state
	let showAddSlotsDrawer = $state(false);
	let addSlotsInitialDate = $state<string | undefined>(undefined);
	
	// Check if we're on mobile for responsive modal/drawer
	let isMobile = $state(false);
	
	// Update mobile state based on window size
	$effect(() => {
		if (browser) {
			const checkMobile = () => {
				isMobile = window.innerWidth < 768; // md breakpoint
			};
			
			checkMobile();
			window.addEventListener('resize', checkMobile);
			
			return () => {
				window.removeEventListener('resize', checkMobile);
			};
		}
	});
	
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
	
	// Handle slot selection from TourTimeline
	function handleSlotClick(slot: any) {
		// When clicking a single slot, switch to day view for that date
		// This shows the slot details in context
		const slotDate = new Date(slot.startTime);
		currentCalendarDate = slotDate;
		calendarView = 'day';
		console.log('Slot clicked, switching to day view:', slot);
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
			
			// Track QR code copy event
			trackDashboardEvent('qr_copy', {
				tour_id: tourId,
				tour_name: tour?.name,
				page: 'tour_details'
			});
			
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
		const activationCheck = canActivateTours(profile, hasConfirmedLocation, paymentStatus, tour.price);
		if (!activationCheck.canActivate) {
			const onboardingMessage = getOnboardingMessage(activationCheck.missingSteps, tour.price === 0);
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
			// Redirect to calendar for onboarding
	goto('/calendar');
	}
	
	// Copy tour function
	async function handleCopyTour() {
		if (!tour || isCopyingTour) return;
		
		try {
			isCopyingTour = true;
			copyError = null;
			
			const response = await fetch(`/api/tours/${tour.id}/copy`, {
				method: 'POST'
			});
			
			if (!response.ok) {
				const error = await response.text();
				throw new Error(error || 'Failed to copy tour');
			}
			
			const result = await response.json();
			
			// Navigate to the new tour's edit page
			if (result.id) {
				goto(`/tours/${result.id}/edit`);
			}
		} catch (error: any) {
			console.error('Failed to copy tour:', error);
			
			// Show error message
			if (error.message?.includes('Tour limit reached')) {
				copyError = 'Tour limit reached. Please upgrade your subscription to create more tours.';
			} else {
				copyError = error.message || 'Failed to copy tour. Please try again.';
			}
			
			// Clear error after 5 seconds
			const timeoutId = setTimeout(() => {
				copyError = null;
			}, 5000);
			copyTimeouts.push(timeoutId);
		} finally {
			isCopyingTour = false;
		}
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
			
			// Check for tab parameter to switch mobile tab
			if (urlParams.get('tab') === 'schedule') {
				mobileTab = 'schedule';
				// Clear the URL parameter
				const newUrl = new URL(window.location.href);
				newUrl.searchParams.delete('tab');
				window.history.replaceState({}, '', newUrl.toString());
			}
			
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

	// Smart back navigation
	function getSmartBackDestination(): string {
		// Check if user came from a specific page
		try {
			const referrer = document.referrer;
			console.log('🔍 Smart back navigation (tours) - referrer:', referrer);
			
			if (referrer) {
				const referrerUrl = new URL(referrer);
				const referrerPath = referrerUrl.pathname;
				const referrerSearch = referrerUrl.search;
				
				console.log('🔍 Referrer details:', {
					path: referrerPath,
					search: referrerSearch,
					fullUrl: referrer
				});
				
				// Check if they came from calendar/dashboard
				if (referrerPath === '/dashboard' || referrerPath === '/calendar') {
					console.log('✅ Going back to calendar');
					return '/calendar';
				}
				
				// Check if they came from a specific booking page
				const bookingDetailsMatch = referrerPath.match(/^\/bookings\/([^\/]+)$/);
				if (bookingDetailsMatch) {
					console.log('✅ Going back to booking details');
					return referrerPath; // Go back to whatever booking page they came from
				}
				
				// Check if they came from filtered bookings page
				if (referrerPath === '/bookings' && referrerSearch) {
					console.log('✅ Going back to filtered bookings');
					return `/bookings${referrerSearch}`;
				}
				
				// Check if they came from main bookings page
				if (referrerPath === '/bookings') {
					console.log('✅ Going back to main bookings');
					return '/bookings';
				}
				
				// Check if they came from tours list with filters
				if (referrerPath === '/tours' && referrerSearch) {
					console.log('✅ Going back to filtered tours');
					return `/tours${referrerSearch}`;
				}
				
				// Check if they came from main tours page
				if (referrerPath === '/tours') {
					console.log('✅ Going back to main tours');
					return '/tours';
				}
			}
			
			// If no referrer or referrer doesn't match expected patterns
			console.log('🔍 No valid referrer found, checking browser history');
			
			// Try to determine from URL or other context
			const currentUrl = new URL(window.location.href);
			const fromParam = currentUrl.searchParams.get('from');
			
			if (fromParam) {
				console.log('✅ Using "from" parameter:', fromParam);
				return fromParam;
			}
			
		} catch (error) {
			console.warn('Could not parse referrer for smart back navigation:', error);
		}
		
		// Default to tours page
		console.log('🔍 Using default: /tours');
		return '/tours';
	}

	function handleSmartBack() {
		console.log('🚀 Attempting smart back navigation...');
		
		// Try to use browser history first
		if (window.history.length > 1) {
			const referrer = document.referrer;
			console.log('🔍 Browser history available, referrer:', referrer);
			
			// Check if we can safely go back
			if (referrer && referrer.includes(window.location.origin)) {
				console.log('✅ Using browser back() - safe internal navigation');
				window.history.back();
				return;
			}
		}
		
		// Fallback to smart destination
		const destination = getSmartBackDestination();
		console.log('🚀 Navigating to:', destination);
		goto(destination);
	}

	// Get smart back button text
	function getSmartBackText(): string {
		const destination = getSmartBackDestination();
		if (destination === '/calendar') return 'Back to Calendar';
		if (destination.startsWith('/bookings/')) return 'Back to Booking';
		if (destination.startsWith('/bookings')) return 'Back to Bookings';
		if (destination.startsWith('/tours')) return 'Back to Tours';
		return 'Back';
	}

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
			console.log('⏳ Tour details loading for tourId:', tourId);
		}
		if ($tourDetailsQuery.isError) {
			console.error('❌ Tour details error for tourId:', tourId, 'Error:', $tourDetailsQuery.error);
			console.error('❌ Full error object:', $tourDetailsQuery.error);
		}
		if ($tourDetailsQuery.data) {
			console.log('✅ Tour details loaded for tourId:', tourId, 'Data:', $tourDetailsQuery.data);
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
							<button onclick={() => { addSlotsInitialDate = undefined; showAddSlotsDrawer = true; }} class="button-secondary button--gap">
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
							<button onclick={() => { addSlotsInitialDate = undefined; showAddSlotsDrawer = true; }} class="button-primary button--gap">
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
							<button onclick={() => { addSlotsInitialDate = undefined; showAddSlotsDrawer = true; }} class="button-primary button--gap">
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
				onclick: undefined,
				disabled: false,
				className: tour.status === 'active' ? 'status-confirmed' : 'status-pending'
			} : null}
			secondaryInfo={tour && stats ? `${stats.totalBookings || 0} bookings • ${$globalCurrencyFormatter(stats.totalRevenue || 0)}` : ''}
			primaryAction={{
			label: 'Add Time Slots',
			icon: Plus,
			onclick: () => { addSlotsInitialDate = undefined; showAddSlotsDrawer = true; },
			variant: 'primary'
			}}
			quickActions={[]}
			showBackButton={true}
			onBackClick={handleSmartBack}
			tourColor={tour ? getTourCalendarColor(tour.id, tour.name) : undefined}
		/>
		
		<!-- Desktop Header -->
		<div class="hidden sm:block">
			{#if tour}
				<!-- Tour color strip -->
				<div class="tour-color-strip mb-2" style="background-color: {getTourCalendarColor(tour.id, tour.name)}; height: 4px; border-radius: 2px;"></div>
			{/if}
			<PageHeader 
				title={tour?.name || 'Loading...'}
				subtitle={tour ? `Tour • ${tour.location || 'Location not set'}` : 'Loading tour details...'}
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
					<button onclick={() => handleCopyTour()} class="button-secondary button--gap" disabled={isCopyingTour}>
						{#if isCopyingTour}
							<RefreshCw class="h-4 w-4 animate-spin" />
							Copying...
						{:else}
							<Copy class="h-4 w-4" />
							Copy Tour
						{/if}
					</button>
					<button onclick={() => { addSlotsInitialDate = undefined; showAddSlotsDrawer = true; }} class="button-primary button--gap">
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
					<p class="text-sm mt-1">
						{$tourDetailsQuery.error?.message || 'Please check your connection and try again.'}
					</p>
					{#if tourId}
						<p class="text-xs mt-1 opacity-75">Tour ID: {tourId}</p>
					{/if}
					<button onclick={() => $tourDetailsQuery.refetch()} class="button-secondary button--small mt-2">
						Retry
					</button>
				</div>
			</div>
		</div>
	{/if}
	
	{#if copyError}
		<div class="mb-6 rounded-xl p-4 alert-error animate-fade-in">
			<div class="flex items-center gap-3">
				<AlertCircle class="h-5 w-5" />
				<p>{copyError}</p>
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
			<div class="grid grid-cols-2 gap-1">
				<button
					onclick={() => mobileTab = 'overview'}
					class="px-3 py-2 text-sm font-medium rounded-md transition-colors {mobileTab === 'overview' ? 'bg-primary text-white' : ''}"
					style="{mobileTab === 'overview' ? 'background: var(--color-primary-500); color: white;' : 'color: var(--text-secondary);'}"
				>
					Overview
				</button>
				<button
					onclick={() => mobileTab = 'schedule'}
					class="px-3 py-2 text-sm font-medium rounded-md transition-colors {mobileTab === 'schedule' ? 'bg-primary text-white' : ''}"
					style="{mobileTab === 'schedule' ? 'background: var(--color-primary-500); color: white;' : 'color: var(--text-secondary);'}"
				>
					Schedule
				</button>
			</div>
		</div>
		
		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
			<!-- Left Column - Main Content -->
			<div class="lg:col-span-2 xl:col-span-3 space-y-6 xl:space-y-8">

				
				<!-- Overview Tab Content (Mobile) -->
				<div class="{mobileTab !== 'overview' ? 'hidden sm:block' : ''} space-y-6">
					<!-- Tour Details - Compact version at top -->
					<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b flex items-center justify-between" style="border-color: var(--border-primary);">
							<h2 class="font-semibold" style="color: var(--text-primary);">Tour Information</h2>
							<div class="flex items-center gap-3">
								<!-- Inline stats - Desktop only -->
								<div class="hidden sm:flex items-center gap-4 text-sm" style="color: var(--text-secondary);">
									<span>{stats?.totalBookings || 0} bookings</span>
									{#if stats?.trends?.bookingsTrend !== undefined && stats?.trends?.bookingsTrend !== 0}
										<span class="flex items-center gap-1 {stats.trends.bookingsTrend > 0 ? 'text-green-600' : 'text-red-600'}">
											{#if stats.trends.bookingsTrend > 0}
												<TrendingUp class="h-3 w-3" />
												+{stats.trends.bookingsTrend}%
											{:else}
												<TrendingDown class="h-3 w-3" />
												{stats.trends.bookingsTrend}%
											{/if}
										</span>
									{/if}
									<span>•</span>
									<span>{$globalCurrencyFormatter(stats?.totalRevenue || 0)}</span>
									{#if stats?.trends?.revenueTrend !== undefined && stats?.trends?.revenueTrend !== 0}
										<span class="flex items-center gap-1 {stats.trends.revenueTrend > 0 ? 'text-green-600' : 'text-red-600'}">
											{#if stats.trends.revenueTrend > 0}
												<TrendingUp class="h-3 w-3" />
												+{stats.trends.revenueTrend}%
											{:else}
												<TrendingDown class="h-3 w-3" />
												{stats.trends.revenueTrend}%
											{/if}
										</span>
									{/if}
									<span>•</span>
									<span>{tour?.qrScans || 0} scans</span>
									<span>•</span>
									<span>{getConversionRateText()} conversion</span>
								</div>
								<!-- Edit and Copy buttons - visible on all screen sizes -->
								<div class="flex items-center gap-3">
									<button onclick={() => goto(`/tours/${tourId}/edit`)} class="button-secondary button--small button--gap">
										<Edit class="h-4 w-4" />
										<span class="hidden sm:inline">Edit</span>
										<span class="sm:hidden">Edit</span>
									</button>
									<button onclick={() => handleCopyTour()} class="button-secondary button--small button--gap" disabled={isCopyingTour}>
										{#if isCopyingTour}
											<RefreshCw class="h-4 w-4 animate-spin" />
											<span class="hidden sm:inline">Copying...</span>
											<span class="sm:hidden">Copy</span>
										{:else}
											<Copy class="h-4 w-4" />
											<span class="hidden sm:inline">Copy</span>
											<span class="sm:hidden">Copy</span>
										{/if}
									</button>
								</div>
							</div>
						</div>
						<div class="p-3 sm:p-4 space-y-4 sm:space-y-4">
							<!-- Key facts - compact mobile layout -->
							<div class="grid grid-cols-2 gap-3">
								<div class="p-3 rounded-lg text-center" style="background: var(--bg-secondary);">
									<p class="text-xs" style="color: var(--text-tertiary);">
										{#if tour.pricingModel === 'private_tour'}
											Flat Rate
										{:else if tour.pricingModel === 'participant_categories'}
											Base Price
										{:else if tour.pricingModel === 'group_tiers'}
											Tier Pricing
										{:else if tour.enablePricingTiers && tour.pricingTiers?.child !== undefined}
											Adult Price
										{:else}
											Price
										{/if}
									</p>
									<p class="font-semibold text-lg" style="color: var(--text-primary);">
										{getTourDisplayPriceFormatted(tour)}
									</p>
									{#if tour.enablePricingTiers && tour.pricingTiers?.child !== undefined && tour.pricingModel === 'adult_child'}
										<div class="flex items-center justify-center gap-1 mt-1">
											<Baby class="h-3 w-3" style="color: var(--text-tertiary);" />
											<span class="text-xs font-medium" style="color: var(--text-secondary);">
												{$globalCurrencyFormatter(tour.pricingTiers.child)}
											</span>
										</div>
									{/if}
								</div>
								<div class="p-3 rounded-lg text-center" style="background: var(--bg-secondary);">
									<p class="text-xs" style="color: var(--text-tertiary);">Duration</p>
									<p class="font-semibold text-lg" style="color: var(--text-primary);">{formatDuration(tour.duration)}</p>
								</div>
							</div>
							
							<!-- Detailed Pricing Breakdown (Accordion-style for new pricing models) -->
							{#if (tour.pricingModel === 'participant_categories' || tour.pricingModel === 'private_tour') && profile?.currency}
								<div class="pricing-accordion rounded-lg" style="border: 1px solid var(--border-primary); overflow: hidden;">
									<!-- Accordion Header -->
									<button
										onclick={() => showPricingDetails = !showPricingDetails}
										class="w-full flex items-center justify-between p-3 sm:p-4 text-left transition-colors"
										style="background: var(--bg-secondary);"
										onmouseenter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
										onmouseleave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
									>
										<div class="flex items-center gap-2">
											<ChevronDown 
												class="h-4 w-4 transition-transform duration-200 {showPricingDetails ? 'rotate-180' : ''}" 
												style="color: var(--text-secondary);" 
											/>
											<span class="font-medium text-sm sm:text-base" style="color: var(--text-primary);">
												{#if tour.pricingModel === 'private_tour'}
													Pricing Details
												{:else}
													Pricing & Discounts
												{/if}
											</span>
										</div>
										<span class="text-xs sm:text-sm" style="color: var(--text-tertiary);">
											{showPricingDetails ? 'Hide' : 'Show'} details
										</span>
									</button>
									
									<!-- Accordion Content -->
									{#if showPricingDetails}
										<div class="accordion-content" transition:slide={{ duration: 200 }}>
											<div class="p-3 sm:p-4 pt-0">
												<UnifiedPricingSummary
													pricingModel={tour.pricingModel}
													categories={tour.participantCategories?.categories}
													privateTourPrice={tour.privateTour?.flatPrice}
													groupDiscounts={tour.groupDiscounts}
													addons={tour.optionalAddons?.addons}
													currencySymbol={profile.currency === 'USD' ? '$' : profile.currency === 'EUR' ? '€' : profile.currency === 'GBP' ? '£' : profile.currency}
													minCapacity={tour.pricingModel === 'private_tour' ? (tour.privateTour?.minCapacity || tour.minCapacity || 1) : (tour.minCapacity || 1)}
													maxCapacity={tour.pricingModel === 'private_tour' ? (tour.privateTour?.maxCapacity || tour.maxCapacity || tour.capacity) : (tour.maxCapacity || tour.capacity)}
												/>
											</div>
										</div>
									{/if}
								</div>
							{/if}
							
							<!-- Description - mobile-optimized text -->
							{#if tour.description}
								<div>
									{#if tour.description.length > 200 && !showFullDescription}
										<div class="text-sm sm:text-sm leading-relaxed space-y-2" style="color: var(--text-primary);">
											{#each tour.description.slice(0, 200).split('\n').filter((line: string) => line.trim()) as paragraph}
												<p>{paragraph}</p>
											{/each}
											<span>...</span>
											<button onclick={() => showFullDescription = true} class="text-sm font-medium hover:underline ml-1" style="color: var(--color-primary-600);">
												Show more
											</button>
										</div>
									{:else if tour.description.length > 200 && showFullDescription}
										<div class="text-sm sm:text-sm leading-relaxed space-y-2" style="color: var(--text-primary);">
											{#each tour.description.split('\n').filter((line: string) => line.trim()) as paragraph}
												<p>{paragraph}</p>
											{/each}
											<button onclick={() => showFullDescription = false} class="text-sm font-medium hover:underline ml-1" style="color: var(--color-primary-600);">
												Show less
											</button>
										</div>
									{:else}
										<div class="text-sm sm:text-sm leading-relaxed space-y-2" style="color: var(--text-primary);">
											{#each tour.description.split('\n').filter((line: string) => line.trim()) as paragraph}
												<p>{paragraph}</p>
											{/each}
										</div>
									{/if}
								</div>
							{/if}

							<!-- Categories -->
							{#if tour.categories && tour.categories.length > 0}
								<div class="flex flex-wrap gap-1.5">
									{#each tour.categories as category}
										<span class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border"
											style="
												background: var(--color-primary-50);
												border-color: var(--color-primary-200);
												color: var(--color-primary-700);
											"
										>
											{formatCategoryName(category)}
										</span>
									{/each}
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
					
					<!-- QR Code Section (Mobile Only) -->
					<div class="sm:hidden rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
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
					

					
					<!-- Tour Images - At bottom on desktop, normal position on mobile -->
					{#if tour.images && tour.images.length > 0}
						<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
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
						<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
							<div class="p-4 border-b flex items-center justify-between" style="border-color: var(--border-primary);">
								<h2 class="font-semibold" style="color: var(--text-primary);">Tour Gallery</h2>
								<button onclick={() => goto(`/tours/${tourId}/edit`)} class="button-secondary button--small button--gap">
									<Edit class="h-4 w-4" />
									Edit
								</button>
							</div>
							<div class="p-8 text-center">
								<Image class="w-12 h-12 mx-auto mb-3" style="color: var(--text-tertiary); opacity: 0.5;" />
								<p class="text-sm mb-3" style="color: var(--text-secondary);">No images uploaded yet</p>
								<p class="text-xs" style="color: var(--text-tertiary);">Upload images in the tour editor to showcase your experience</p>
							</div>
						</div>
					{/if}
				</div>
				
				<!-- Schedule Tab Content -->
				<div class="{mobileTab !== 'schedule' ? 'hidden sm:block' : ''} space-y-6">
					<!-- Schedule Section -->
					<section id="schedule" class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b" style="border-color: var(--border-primary);">
							<h2 class="text-lg font-semibold" style="color: var(--text-primary);">
								Tour Schedule
							</h2>
						</div>
						
						<!-- Remove extra padding - TourTimeline has its own -->
						<div>
							<!-- Calendar with navigation -->
							<TourTimeline 
								tourId={tourId}
								bind:view={calendarView}
								bind:currentDate={currentCalendarDate}
								defaultView="month"
								hideHeaderText={true}
								hideStats={true}
								hideViewToggle={false}
								compact={true}
								onSlotClick={handleSlotClick}
								onViewChange={handleViewChange}
								tour={tour}
								onQuickAdd={(date) => {
									// Open add slots drawer with selected date
									const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
									addSlotsInitialDate = dateStr;
									showAddSlotsDrawer = true;
								}}
							/>
						</div>
					</section>
					
					<!-- Recent Bookings (Mobile Only) -->
					<div class="sm:hidden">
						{#if stats?.recentBookings && stats.recentBookings.length > 0}
							<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
								<div class="p-4 border-b flex items-center justify-between" style="border-color: var(--border-primary);">
									<div>
										<h3 class="font-semibold" style="color: var(--text-primary);">Recent Bookings</h3>
										<p class="text-xs mt-0.5" style="color: var(--text-secondary);">Last {stats.recentBookings.length} bookings</p>
									</div>
									<button onclick={() => goto(`/bookings?tour=${tourId}`)} class="button-secondary button--small button--gap">
										<Eye class="h-3 w-3" />
										View All
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
			</div>
			
			<!-- Right Column - Sidebar (Desktop Only) -->
			<div class="hidden lg:block space-y-6 xl:space-y-8">
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
				
				<!-- Recent Activity -->
				{#if stats?.recentBookings && stats.recentBookings.length > 0}
					<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="p-4 border-b flex items-center justify-between" style="border-color: var(--border-primary);">
							<div>
								<h3 class="font-semibold" style="color: var(--text-primary);">Recent Bookings</h3>
								<p class="text-xs mt-0.5" style="color: var(--text-secondary);">Last {stats.recentBookings.length} bookings</p>
							</div>
							<button onclick={() => goto(`/bookings?tour=${tourId}`)} class="button-secondary button--small button--gap">
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


</PageContainer>

<!-- Add Slots Drawer -->
<AddSlotsDrawer
	bind:isOpen={showAddSlotsDrawer}
	tourId={tourId}
	initialDate={addSlotsInitialDate}
	onClose={() => showAddSlotsDrawer = false}
	onSuccess={async () => {
		// Invalidate queries to refresh data
		await queryClient.invalidateQueries({
			queryKey: queryKeys.tourSchedule(tourId)
		});
		await queryClient.invalidateQueries({
			queryKey: queryKeys.tourDetails(tourId)
		});
	}}
/>

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
	
	.animate-fade-in {
		animation: fadeIn 0.3s ease-out;
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
	
	/* Pricing Accordion styles */
	.pricing-accordion {
		transition: all 0.2s ease;
	}
	
	.pricing-accordion:hover {
		border-color: var(--border-secondary) !important;
	}
	
	.accordion-content :global(.pricing-summary) {
		margin-top: 0;
		background: transparent;
		border: none;
		padding: 0;
	}
	
	.accordion-content :global(.pricing-summary:hover) {
		border-color: transparent;
		box-shadow: none;
	}
</style> 
<script lang="ts">
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { formatDate, formatDateTime, getStatusColor, getPaymentStatusColor } from '$lib/utils/date-helpers.js';
	import { formatParticipantDisplayDetailed, formatParticipantDisplayCompact } from '$lib/utils/participant-display.js';
	import { getTourDisplayPriceFormatted } from '$lib/utils/tour-helpers-client.js';
	
	// Get data from load function
	let { data } = $props();
	
	// TanStack Query
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys } from '$lib/queries/shared-stats.js';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	
	// Icons
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import User from 'lucide-svelte/icons/user';
	import Mail from 'lucide-svelte/icons/mail';
	import Phone from 'lucide-svelte/icons/phone';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Edit from 'lucide-svelte/icons/edit';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Euro from 'lucide-svelte/icons/euro';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import ReceiptText from 'lucide-svelte/icons/receipt-text';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import CircleDollarSign from 'lucide-svelte/icons/circle-dollar-sign';
	import Ticket from 'lucide-svelte/icons/ticket';

	// Get booking ID from load function
	let bookingId = $derived(data.bookingId);
	
	// Query client for invalidation
	const queryClient = useQueryClient();
	
	// TanStack Query for booking data - remove auto-refresh to prevent timer accumulation
	let bookingQuery = $derived(createQuery({
		queryKey: ['booking', bookingId],
		queryFn: async () => {
			const response = await fetch(`/api/bookings/${bookingId}`);
			if (!response.ok) throw new Error('Failed to fetch booking');
			return response.json();
		},
		staleTime: 2 * 60 * 1000, // 2 minutes - reduce excessive refetching
		gcTime: 10 * 60 * 1000,   // 10 minutes
		refetchOnWindowFocus: false, // Disable window focus refetching
		// Removed refetchInterval to prevent timer accumulation
	}));
	
	// Derive data from query
	let booking = $derived($bookingQuery.data?.booking || null);
	let payment = $derived($bookingQuery.data?.payment || null);
	let isLoading = $derived($bookingQuery.isLoading);
	let isError = $derived($bookingQuery.isError);
	let showStatusModal = $state(false);
	let newStatus = $state('pending');
	let isUpdating = $state(false);
	let cancellationReason = $state<'weather' | 'illness' | 'emergency' | 'low_enrollment' | 'other'>('other');
	let customMessage = $state('');
	let error = $state<string | null>(null);

	// Update newStatus when booking loads
	$effect(() => {
		if (booking && !showStatusModal) {
			newStatus = booking.status;
		}
	});

	// Status button for mobile header (removed)
	let statusButton = $derived(null);

	// Primary action for mobile header (change status button on the right)
	let primaryAction = $derived(booking ? {
		label: 'Change Status',
		icon: Edit,
		onclick: () => { showStatusModal = true; },
		variant: 'primary' as const,
		disabled: false
	} : null);

	// Quick actions for mobile
	let quickActions = $derived(booking ? [
		{
			label: 'Email',
			icon: Mail,
			onclick: () => openEmailClient(),
			variant: 'secondary' as const
		},
		...(booking.customerPhone ? [{
			label: 'Call',
			icon: Phone,
			onclick: () => { window.location.href = `tel:${booking.customerPhone}`; },
			variant: 'secondary' as const
		}] : [])
	] : []);

	function openEmailClient() {
		if (!booking) return;
		const subject = encodeURIComponent(`Regarding your ${booking.expand?.tour?.name} booking`);
		const timeText = safeFormatSlotTimeRange(booking.expand?.timeSlot?.startTime, booking.expand?.timeSlot?.endTime);
		const dateText = safeFormatDate(booking.expand?.timeSlot?.startTime);
		const body = encodeURIComponent(`Hi ${booking.customerName},\n\nI wanted to reach out regarding your upcoming tour booking.\n\nTour: ${booking.expand?.tour?.name}\nDate: ${dateText}\nTime: ${timeText}\nParticipants: ${booking.participants}\n\nBest regards`);
		
		window.open(`mailto:${booking.customerEmail}?subject=${subject}&body=${body}`);
	}

	function getTourDateTime(): string {
		if (!booking) return 'Loading...';
		try {
			if (booking.expand?.timeSlot?.startTime) {
				return formatDateTime(booking.expand.timeSlot.startTime);
			}
			return 'Time slot not set';
		} catch (error) {
			console.warn('Error getting tour date time:', error);
			return 'Time slot not set';
		}
	}

	// Safe date formatting functions to prevent undefined errors
	function safeFormatDate(dateString: string | undefined): string {
		if (!dateString) return 'Date TBD';
		try {
			return formatDate(dateString);
		} catch (error) {
			console.warn('Error formatting date:', error);
			return 'Date TBD';
		}
	}

	function safeFormatDateTime(dateString: string | undefined): string {
		if (!dateString) return 'Date TBD';
		try {
			return formatDateTime(dateString);
		} catch (error) {
			console.warn('Error formatting date time:', error);
			return 'Date TBD';
		}
	}

	function safeFormatDateTimeForTimeline(dateString: string | undefined): string {
		if (!dateString) return 'Recently';
		try {
			return formatDateTime(dateString);
		} catch (error) {
			console.warn('Error formatting date time:', error);
			return 'Recently';
		}
	}

	function safeFormatSlotTimeRange(startTime: string | undefined, endTime: string | undefined): string {
		if (!startTime || !endTime) return 'Time TBD';
		try {
			return formatSlotTimeRange(startTime, endTime);
		} catch (error) {
			console.warn('Error formatting time range:', error);
			return 'Time TBD';
		}
	}

	function calculateTotal(): number {
		if (!booking) return 0;
		try {
			const totalAmount = booking.totalAmount;
			if (!totalAmount) return 0;
			
			const amount = typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount;
			if (isNaN(amount)) return 0;
			
			return amount;
		} catch (error) {
			console.warn('Error calculating total:', error);
			return 0;
		}
	}

	function isPastBooking(): boolean {
		if (!booking) return false;
		try {
			if (!booking.expand?.timeSlot?.startTime) {
				return false;
			}
			
			const bookingDateTime = new Date(booking.expand.timeSlot.startTime);
			if (isNaN(bookingDateTime.getTime())) {
				return false;
			}
			
			return bookingDateTime < new Date();
		} catch (error) {
			console.warn('Error checking if past booking:', error);
			return false;
		}
	}

	function canChangeStatus(): boolean {
		if (!booking) return false;
		// Can't change status for completed bookings in the past
		if (isPastBooking() && booking.status === 'completed') {
			return false;
		}
		return true;
	}
	
	// Get payment status icon
	function getPaymentStatusIcon(status: string): any {
		switch (status) {
			case 'paid':
			case 'succeeded':
				return CircleDollarSign;
			case 'pending':
			case 'processing':
				return AlertTriangle;
			case 'failed':
				return XCircle;
			case 'refunded':
				return ReceiptText;
			default:
				return AlertTriangle;
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

	// Smart back navigation
	function getSmartBackDestination(): string {
		if (!booking) return '/bookings';
		
		// Check if user came from a tour details page or filtered bookings
		try {
			const referrer = document.referrer;
			console.log('🔍 Smart back navigation - referrer:', referrer);
			
			if (referrer) {
				const referrerUrl = new URL(referrer);
				const referrerPath = referrerUrl.pathname;
				const referrerSearch = referrerUrl.search;
				
				console.log('🔍 Referrer details:', {
					path: referrerPath,
					search: referrerSearch,
					fullUrl: referrer
				});
				
				// Check if they came from dashboard
				if (referrerPath === '/dashboard') {
					console.log('✅ Going back to dashboard');
					return '/dashboard';
				}
				
				// Check if they came from the same tour's details page
				if (referrerPath === `/tours/${booking.expand?.tour?.id}`) {
					console.log('✅ Going back to tour details');
					return `/tours/${booking.expand?.tour?.id}`;
				}
				
				// Check if they came from any tour details page (booking might have wrong tourId)
				const tourDetailsMatch = referrerPath.match(/^\/tours\/([^\/]+)$/);
				if (tourDetailsMatch) {
					console.log('✅ Going back to tour details (generic)');
					return referrerPath; // Go back to whatever tour page they came from
				}
				
				// Check if they came from filtered bookings page for this tour
				if (referrerPath === '/bookings' && referrerSearch.includes(`tour=${booking.expand?.tour?.id}`)) {
					console.log('✅ Going back to filtered bookings (same tour)');
					return `/bookings?tour=${booking.expand?.tour?.id}`;
				}
				
				// Check if they came from any filtered bookings page
				if (referrerPath === '/bookings' && referrerSearch) {
					console.log('✅ Going back to filtered bookings');
					return `/bookings${referrerSearch}`;
				}
				
				// Check if they came from main bookings page
				if (referrerPath === '/bookings') {
					console.log('✅ Going back to main bookings');
					return '/bookings';
				}
				
				// Check if they came from tours list
				if (referrerPath === '/tours') {
					console.log('✅ Going back to tours list');
					return '/tours';
				}
			}
			
			// If no referrer or referrer doesn't match expected patterns, try to use browser history
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
		
		// Default to bookings page
		console.log('🔍 Using default: /bookings');
		return '/bookings';
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
		if (destination === '/dashboard') return 'Back to Dashboard';
		if (destination.startsWith('/tours/')) return 'Back to Tour';
		if (destination === '/tours') return 'Back to Tours';
		if (destination.startsWith('/bookings')) return 'Back to Bookings';
		return 'Back';
	}
</script>

<svelte:head>
	<title>{booking?.customerName || 'Loading'} - Booking Details | Zaur</title>
	<meta name="description" content="Manage booking details for {booking?.customerName || 'customer'}" />
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	{#if isLoading}
		<div class="p-8 text-center">
			<Loader2 class="w-8 h-8 mx-auto mb-2 animate-spin" style="color: var(--text-tertiary);" />
			<p class="text-sm" style="color: var(--text-secondary);">Loading booking details...</p>
		</div>
	{:else if isError || !booking}
		<div class="mb-6 rounded-xl p-4" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium" style="color: var(--color-danger-900);">Failed to load booking</p>
					<p class="text-sm mt-1" style="color: var(--color-danger-700);">Please check your connection and try again.</p>
				</div>
				<button onclick={() => goto('/bookings')} class="button-secondary button--small">
					Back to Bookings
				</button>
			</div>
		</div>
	{:else}
		{@const BookingIcon = getBookingStatusIcon(booking.status)}
		{@const PaymentIcon = getPaymentStatusIcon(payment?.status || booking.paymentStatus || 'pending')}
		
		<!-- Header -->
		<div class="mb-6 sm:mb-8">
			<!-- Compact Mobile Page Header -->
			<MobilePageHeader
				title={booking.customerName}
				secondaryInfo={`${booking.expand?.tour?.name || 'Unknown Tour'} • ${safeFormatDate(booking.expand?.timeSlot?.startTime)}`}
				statusButton={statusButton}
				primaryAction={primaryAction}
				quickActions={quickActions}
				showBackButton={true}
				onBackClick={handleSmartBack}
			/>
			
			<!-- Desktop Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title="Booking Details"
					subtitle={`${booking.customerName} • ${booking.expand?.tour?.name || 'Unknown Tour'}`}
					breadcrumbs={[
						{ label: 'Bookings', href: '/bookings' },
						{ label: `#${booking.id.slice(-8)}` }
					]}
				>
									<button onclick={handleSmartBack} class="button-secondary button--gap">
					<ArrowLeft class="h-4 w-4" />
					{getSmartBackText()}
				</button>
				</PageHeader>
			</div>
		</div>

		{#if error}
			<div class="mb-6 rounded-xl p-4" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
				<div class="flex gap-3">
					<AlertCircle class="h-5 w-5 flex-shrink-0 mt-0.5" style="color: var(--color-danger-600);" />
					<div>
						<p class="font-medium" style="color: var(--color-danger-900);">Error</p>
						<p class="text-sm mt-1" style="color: var(--color-danger-700);">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
			<!-- Left Column - Main Details -->
			<div class="lg:col-span-2 space-y-4 sm:space-y-6">
				<!-- Booking Summary Card -->
				<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 sm:p-6">
						<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sm:mb-6">
							<div>
								<h2 class="text-lg sm:text-xl font-semibold" style="color: var(--text-primary);">
									{booking.expand?.tour?.name || 'Unknown Tour'}
								</h2>
								<p class="text-sm mt-1" style="color: var(--text-secondary);">
									Booking #{booking.id.slice(-8)}
								</p>
							</div>
							<div class="flex items-center gap-2 flex-wrap">
								<span class="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs rounded-full border {getStatusColor(booking.status)}">
									<BookingIcon class="h-3.5 w-3.5" />
									<span class="capitalize font-medium">{booking.status}</span>
								</span>
								<span class="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs rounded-full border {getPaymentStatusColor(payment?.status || booking.paymentStatus || 'pending')}">
									<PaymentIcon class="h-3.5 w-3.5" />
									<span class="font-medium">
										{payment?.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'Pending'}
									</span>
								</span>
							</div>
						</div>

						<!-- Mobile: Vertical Stack, Desktop: Grid -->
						<div class="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
							<!-- Tour Date & Time -->
							<div class="rounded-lg p-3 sm:p-4 flex items-start gap-3" style="background: var(--bg-secondary);">
								<div class="rounded-lg p-1.5 sm:p-2 flex-shrink-0" style="background: var(--bg-tertiary);">
									<Calendar class="h-4 w-4 sm:h-5 sm:w-5" style="color: var(--text-secondary);" />
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-xs sm:text-sm font-medium" style="color: var(--text-secondary);">Tour Date</p>
									<p class="text-sm sm:text-base font-semibold truncate" style="color: var(--text-primary);">
										{safeFormatDate(booking.expand?.timeSlot?.startTime)}
									</p>
									<p class="text-xs sm:text-sm mt-0.5" style="color: var(--text-secondary);">
										{safeFormatSlotTimeRange(booking.expand?.timeSlot?.startTime, booking.expand?.timeSlot?.endTime)}
									</p>
								</div>
							</div>

							<!-- Total Amount - Shown prominently on mobile -->
							<div class="rounded-lg p-3 sm:p-4 flex items-start gap-3 order-first sm:order-none" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
								<div class="rounded-lg p-1.5 sm:p-2 flex-shrink-0" style="background: var(--color-primary-100);">
									<Euro class="h-4 w-4 sm:h-5 sm:w-5" style="color: var(--color-primary-600);" />
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-xs sm:text-sm font-medium" style="color: var(--color-primary-700);">Total Amount</p>
									<p class="text-lg sm:text-xl font-bold" style="color: var(--color-primary-900);">
										{$globalCurrencyFormatter(calculateTotal())}
									</p>
									{#if booking.expand?.tour?.enablePricingTiers && booking.participantBreakdown}
										<p class="text-xs mt-0.5" style="color: var(--color-primary-600);">
											Pricing tiers applied
										</p>
									{/if}
								</div>
							</div>

							<!-- Participants -->
							<div class="rounded-lg p-3 sm:p-4 flex items-start gap-3" style="background: var(--bg-secondary);">
								<div class="rounded-lg p-1.5 sm:p-2 flex-shrink-0" style="background: var(--bg-tertiary);">
									<Users class="h-4 w-4 sm:h-5 sm:w-5" style="color: var(--text-secondary);" />
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-xs sm:text-sm font-medium" style="color: var(--text-secondary);">Participants</p>
									<p class="text-sm sm:text-base font-semibold" style="color: var(--text-primary);">
										{booking.participants}
									</p>
									{#if booking.participantBreakdown && (booking.participantBreakdown.adults > 0 || booking.participantBreakdown.children > 0)}
										<p class="text-xs sm:text-sm mt-0.5" style="color: var(--text-secondary);">
											{booking.participantBreakdown.adults || 0}A
											{#if booking.participantBreakdown.children > 0}
												+ {booking.participantBreakdown.children}C
											{/if}
										</p>
									{/if}
								</div>
							</div>

							<!-- Booking Date - Hidden on mobile, shown in timeline -->
							<div class="hidden sm:flex rounded-lg p-3 sm:p-4 items-start gap-3" style="background: var(--bg-secondary);">
								<div class="rounded-lg p-1.5 sm:p-2 flex-shrink-0" style="background: var(--bg-tertiary);">
									<ReceiptText class="h-4 w-4 sm:h-5 sm:w-5" style="color: var(--text-secondary);" />
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-xs sm:text-sm font-medium" style="color: var(--text-secondary);">Booking Date</p>
									<p class="text-sm sm:text-base font-semibold" style="color: var(--text-primary);">
										{safeFormatDate(booking.createdAt)}
									</p>
									<p class="text-xs sm:text-sm mt-0.5" style="color: var(--text-secondary);">
										at {booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}
									</p>
								</div>
							</div>

							<!-- Location -->
							<div class="rounded-lg p-3 sm:p-4 flex items-start gap-3 sm:col-span-2 lg:col-span-1" style="background: var(--bg-secondary);">
								<div class="rounded-lg p-1.5 sm:p-2 flex-shrink-0" style="background: var(--bg-tertiary);">
									<MapPin class="h-4 w-4 sm:h-5 sm:w-5" style="color: var(--text-secondary);" />
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-xs sm:text-sm font-medium" style="color: var(--text-secondary);">Meeting Point</p>
									<p class="text-sm sm:text-base font-semibold" style="color: var(--text-primary);">
										{booking.expand?.tour?.location || 'Location not set'}
									</p>
									<button
										onclick={() => {
											console.log('Navigating to tour:', booking.expand?.tour?.id);
											goto(`/tours/${booking.expand?.tour?.id}`);
										}}
										class="text-xs mt-1 inline-flex items-center gap-1 hover:underline"
										style="color: var(--color-primary-600);"
									>
										View tour details
										<ExternalLink class="h-3 w-3" />
									</button>
								</div>
							</div>
						</div>

						<!-- Special Requests -->
						{#if booking.specialRequests}
							<div class="mt-4 rounded-lg p-3 sm:p-4" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
								<div class="flex items-start gap-2 sm:gap-3">
									<MessageSquare class="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
									<div class="flex-1 min-w-0">
										<p class="font-medium text-xs sm:text-sm" style="color: var(--color-warning-900);">Special Requests</p>
										<p class="text-xs sm:text-sm mt-1" style="color: var(--color-warning-800);">{booking.specialRequests}</p>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Customer Information Card -->
				<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="px-4 py-3 sm:px-6 sm:py-4" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
						<h3 class="font-semibold text-sm sm:text-base" style="color: var(--text-primary);">Customer Information</h3>
					</div>
					
					<div class="p-4 sm:p-6">
						<div class="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
							<div class="space-y-3 sm:space-y-4">
								<div class="flex items-start gap-3">
									<User class="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" style="color: var(--text-tertiary);" />
									<div class="min-w-0">
										<p class="text-xs sm:text-sm" style="color: var(--text-secondary);">Name</p>
										<p class="font-medium text-sm sm:text-base" style="color: var(--text-primary);">{booking.customerName}</p>
									</div>
								</div>
								
								<div class="flex items-start gap-3">
									<Mail class="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" style="color: var(--text-tertiary);" />
									<div class="min-w-0">
										<p class="text-xs sm:text-sm" style="color: var(--text-secondary);">Email</p>
										<a href="mailto:{booking.customerEmail}" class="font-medium text-sm sm:text-base hover:underline break-all" style="color: var(--color-primary-600);">
											{booking.customerEmail}
										</a>
									</div>
								</div>
							</div>

							<div class="space-y-3 sm:space-y-4">
								{#if booking.customerPhone}
									<div class="flex items-start gap-3">
										<Phone class="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" style="color: var(--text-tertiary);" />
										<div class="min-w-0">
											<p class="text-xs sm:text-sm" style="color: var(--text-secondary);">Phone</p>
											<a href="tel:{booking.customerPhone}" class="font-medium text-sm sm:text-base hover:underline" style="color: var(--color-primary-600);">
												{booking.customerPhone}
											</a>
										</div>
									</div>
								{/if}
								
								<div class="flex items-start gap-3">
									<Ticket class="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" style="color: var(--text-tertiary);" />
									<div class="min-w-0">
										<p class="text-xs sm:text-sm" style="color: var(--text-secondary);">Booking Code</p>
										<p class="font-mono font-medium text-sm sm:text-base" style="color: var(--text-primary);">
											{booking.ticketQRCode || booking.bookingReference || booking.id.slice(-8)}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Mobile Quick Info Cards -->
				<div class="sm:hidden grid grid-cols-2 gap-3 mb-4">
					<!-- Status & Payment -->
					<div class="rounded-xl p-4 border-2 transition-all duration-200" 
						style="background: var(--bg-primary); border-color: var(--border-primary);">
						<div class="space-y-2">
							<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border {getStatusColor(booking.status)}">
								<BookingIcon class="h-3 w-3" />
								<span class="capitalize font-medium">{booking.status}</span>
							</span>
							<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border {getPaymentStatusColor(payment?.status || booking.paymentStatus || 'pending')}">
								<PaymentIcon class="h-3 w-3" />
								<span class="font-medium">
									{payment?.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'Pending'}
								</span>
							</span>
						</div>
					</div>
					
					<!-- Participants & Booking ID -->
					<div class="rounded-xl p-4 border-2" 
						style="background: var(--bg-primary); border-color: var(--border-primary);">
						<div class="space-y-2">
							<div class="flex items-center gap-2">
								<Users class="h-4 w-4" style="color: var(--text-secondary);" />
								<span class="text-sm font-semibold" style="color: var(--text-primary);">
									{booking.participants} {booking.participants === 1 ? 'person' : 'people'}
								</span>
							</div>
							<div class="flex items-center gap-2">
								<Ticket class="h-4 w-4" style="color: var(--text-secondary);" />
								<span class="text-xs font-mono" style="color: var(--text-secondary);">
									#{booking.id.slice(-8)}
								</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Hidden form for status updates -->
				<form id="mobile-status-update-form" method="POST" action="?/updateStatus" class="hidden"
					use:enhance={() => {
						isUpdating = true;
						error = null;
						
						return async ({ result, update }) => {
							if (result.type === 'success') {
								// Immediate optimistic updates
								const updatedStatus = newStatus as typeof booking.status;
								
								// 1. Update local state immediately
								booking = { ...booking, status: updatedStatus };
								
								// 2. Optimistically update all query caches immediately
								queryClient.setQueryData(['booking', bookingId], (oldData: any) => {
									if (oldData?.booking) {
										return {
											...oldData,
											booking: { ...oldData.booking, status: updatedStatus }
										};
									}
									return oldData;
								});
								
								// Update recent bookings cache
								queryClient.setQueriesData({ queryKey: ['recentBookings'], exact: false }, (oldData: any) => {
									if (Array.isArray(oldData)) {
										return oldData.map((b: any) => 
											b.id === bookingId ? { ...b, status: updatedStatus } : b
										);
									}
									return oldData;
								});
								
								// 3. Then invalidate queries to fetch fresh data in background
								Promise.all([
									queryClient.invalidateQueries({ queryKey: ['booking', bookingId] }),
									queryClient.invalidateQueries({ queryKey: ['recentBookings'], exact: false }),
									queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats }),
								]).catch((invalidationError) => {
									console.warn('Background refetch failed:', invalidationError);
								});
								
							} else if (result.type === 'failure') {
								error = (result.data as any)?.error || 'Failed to update status';
							}
							
							// Always reset form state
							isUpdating = false;
							await update();
						};
					}}
				>
					<input type="hidden" name="id" value={booking.id} />
					<input type="hidden" name="status" bind:value={newStatus} />
				</form>

				<!-- Payment Details (if available) -->
				{#if payment}
					<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="px-4 py-3 sm:px-6 sm:py-4" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
							<h3 class="font-semibold text-sm sm:text-base" style="color: var(--text-primary);">Payment Information</h3>
						</div>
						
						<div class="p-4 sm:p-6">
							<div class="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
								<div class="space-y-3 sm:space-y-4">
									<div class="flex items-start gap-3">
										<CreditCard class="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" style="color: var(--text-tertiary);" />
										<div class="min-w-0">
											<p class="text-xs sm:text-sm" style="color: var(--text-secondary);">Payment Method</p>
											<p class="font-medium text-sm sm:text-base" style="color: var(--text-primary);">
												{payment.paymentMethod?.card?.brand || 'Card'} •••• {payment.paymentMethod?.card?.last4 || '****'}
											</p>
										</div>
									</div>
									
									<div class="flex items-start gap-3">
										<DollarSign class="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" style="color: var(--text-tertiary);" />
										<div class="min-w-0">
											<p class="text-xs sm:text-sm" style="color: var(--text-secondary);">Amount Paid</p>
											<p class="font-medium text-sm sm:text-base" style="color: var(--text-primary);">
												{$globalCurrencyFormatter(payment.amount || calculateTotal())}
											</p>
										</div>
									</div>
								</div>

								<div class="space-y-3 sm:space-y-4">
									<div class="flex items-start gap-3">
										<Calendar class="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" style="color: var(--text-tertiary);" />
										<div class="min-w-0">
											<p class="text-xs sm:text-sm" style="color: var(--text-secondary);">Payment Date</p>
											<p class="font-medium text-sm sm:text-base" style="color: var(--text-primary);">
												{safeFormatDateTime(payment.created)}
											</p>
										</div>
									</div>
									
									{#if payment.stripePaymentIntentId}
										<div class="flex items-start gap-3">
											<ReceiptText class="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" style="color: var(--text-tertiary);" />
											<div class="min-w-0">
												<p class="text-xs sm:text-sm" style="color: var(--text-secondary);">Transaction ID</p>
												<p class="font-mono text-xs break-all" style="color: var(--text-primary);">
													{payment.stripePaymentIntentId}
												</p>
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Right Column - Actions and Status (hidden on mobile, actions moved to top) -->
			<div class="hidden lg:block space-y-4 sm:space-y-6">
				<!-- Actions Card -->
				<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="px-4 py-3 sm:px-6 sm:py-4" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
						<h3 class="font-semibold text-sm sm:text-base" style="color: var(--text-primary);">Actions</h3>
					</div>
					
					<div class="p-4 sm:p-6 space-y-3">
						<!-- Status Update Form -->
						<div class="space-y-3">
							<select 
								name="status" 
								value={booking.status}
								onchange={async (e) => {
									const target = e.target as HTMLSelectElement;
									if (target.value === 'cancelled') {
										newStatus = target.value;
										showStatusModal = true;
									} else {
										// For non-cancellation status changes, update directly
										newStatus = target.value;
										
										// Wait for DOM to update before submitting
										await tick();
										
										// Submit form programmatically
										const form = document.getElementById('status-update-form') as HTMLFormElement;
										if (form) {
											console.log('Submitting form with status:', newStatus);
											form.requestSubmit();
										}
									}
								}}
								class="form-select form-select--small w-full"
								style="cursor: pointer;"
							>
								<option value="pending">Pending</option>
								<option value="confirmed">Confirmed</option>
								<option value="cancelled">Cancelled</option>
								<option value="completed">Completed</option>
							</select>
							
							<!-- Hidden form for non-cancellation status updates -->
							<form id="status-update-form" method="POST" action="?/updateStatus" class="hidden"
								use:enhance={() => {
									isUpdating = true;
									error = null;
									
									return async ({ result, update }) => {
										if (result.type === 'success') {
											// Immediate optimistic updates
											const updatedStatus = newStatus as typeof booking.status;
											
											// 1. Update local state immediately
											booking = { ...booking, status: updatedStatus };
											
											// 2. Optimistically update all query caches immediately
											queryClient.setQueryData(['booking', bookingId], (oldData: any) => {
												if (oldData?.booking) {
													return {
														...oldData,
														booking: { ...oldData.booking, status: updatedStatus }
													};
												}
												return oldData;
											});
											
											// Update recent bookings cache
											queryClient.setQueriesData({ queryKey: ['recentBookings'], exact: false }, (oldData: any) => {
												if (Array.isArray(oldData)) {
													return oldData.map((b: any) => 
														b.id === bookingId ? { ...b, status: updatedStatus } : b
													);
												}
												return oldData;
											});
											
											// 3. Then invalidate queries to fetch fresh data in background
											Promise.all([
												queryClient.invalidateQueries({ queryKey: ['booking', bookingId] }),
												queryClient.invalidateQueries({ queryKey: ['recentBookings'], exact: false }),
												queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats }),
											]).catch((invalidationError) => {
												console.warn('Background refetch failed:', invalidationError);
											});
											
										} else if (result.type === 'failure') {
											error = (result.data as any)?.error || 'Failed to update status';
										}
										
										// Always reset form state
										isUpdating = false;
										await update();
									};
								}}
							>
								<input type="hidden" name="id" value={booking.id} />
								<input type="hidden" name="status" bind:value={newStatus} />
							</form>
						</div>
						
						<div class="grid grid-cols-1 gap-2 pt-2">
							<button
								onclick={openEmailClient}
								class="button-secondary button--gap button--small"
							>
								<Mail class="h-4 w-4" />
								Email Customer
							</button>
							
							{#if booking.customerPhone}
								<button
									onclick={() => window.location.href = `tel:${booking.customerPhone}`}
									class="button-secondary button--gap button--small"
								>
									<Phone class="h-4 w-4" />
									Call Customer
								</button>
							{/if}
							
							<button
								onclick={() => goto(`/tours/${booking.expand?.tour?.id}`)}
								class="button-secondary button--gap button--small"
							>
								<MapPin class="h-4 w-4" />
								View Tour
							</button>
						</div>
					</div>
				</div>

				<!-- Timeline Card -->
				<div class="rounded-xl overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="px-4 py-3 sm:px-6 sm:py-4" style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);">
						<h3 class="font-semibold text-sm sm:text-base" style="color: var(--text-primary);">Timeline</h3>
					</div>
					
					<div class="p-4 sm:p-6">
						<div class="space-y-4">
							<div class="flex items-start gap-3">
								<div class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style="background: var(--text-tertiary);"></div>
								<div class="flex-1">
									<p class="text-sm font-medium" style="color: var(--text-primary);">Booking Created</p>
									<p class="text-xs" style="color: var(--text-secondary);">{safeFormatDateTime(booking.createdAt)}</p>
								</div>
							</div>
							
							{#if booking.status === 'confirmed' || booking.status === 'completed'}
								<div class="flex items-start gap-3">
									<div class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style="background: var(--color-success-500);"></div>
									<div class="flex-1">
										<p class="text-sm font-medium" style="color: var(--text-primary);">Booking Confirmed</p>
										<p class="text-xs" style="color: var(--text-secondary);">
											{safeFormatDateTimeForTimeline(booking.updatedAt)}
										</p>
									</div>
								</div>
							{/if}
							
							{#if payment?.status === 'paid' || payment?.status === 'succeeded'}
								<div class="flex items-start gap-3">
									<div class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style="background: var(--color-success-500);"></div>
									<div class="flex-1">
										<p class="text-sm font-medium" style="color: var(--text-primary);">Payment Received</p>
										<p class="text-xs" style="color: var(--text-secondary);">
											{safeFormatDateTimeForTimeline(payment.created)}
										</p>
									</div>
								</div>
							{/if}
							
							{#if booking.status === 'completed'}
								<div class="flex items-start gap-3">
									<div class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style="background: var(--color-info-500);"></div>
									<div class="flex-1">
										<p class="text-sm font-medium" style="color: var(--text-primary);">Tour Completed</p>
										<p class="text-xs" style="color: var(--text-secondary);">
											{safeFormatDateTime(booking.expand?.timeSlot?.endTime) !== 'Date TBD' ? safeFormatDateTime(booking.expand?.timeSlot?.endTime) : 'Marked complete'}
										</p>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Status Change Modal -->
{#if showStatusModal && booking}
	<div class="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50" style="background: rgba(0, 0, 0, 0.5);">
		<div class="rounded-xl shadow-2xl max-w-md w-full" style="background: var(--bg-primary);">
			<form
				method="POST"
				action="?/updateStatus"
				use:enhance={() => {
					isUpdating = true;
					error = null;
					
					return async ({ result, update }) => {
						if (result.type === 'success') {
							// Immediate optimistic updates
							const updatedStatus = newStatus as typeof booking.status;
							
							// 1. Update local state immediately
							booking = { ...booking, status: updatedStatus };
							showStatusModal = false;
							
							// 2. Optimistically update all query caches immediately
							queryClient.setQueryData(['booking', bookingId], (oldData: any) => {
								if (oldData?.booking) {
									return {
										...oldData,
										booking: { ...oldData.booking, status: updatedStatus }
									};
								}
								return oldData;
							});
							
							// Update recent bookings cache
							queryClient.setQueriesData({ queryKey: ['recentBookings'], exact: false }, (oldData: any) => {
								if (Array.isArray(oldData)) {
									return oldData.map((b: any) => 
										b.id === bookingId ? { ...b, status: updatedStatus } : b
									);
								}
								return oldData;
							});
							
							// 3. Then invalidate queries to fetch fresh data in background
							Promise.all([
								queryClient.invalidateQueries({ queryKey: ['booking', bookingId] }),
								queryClient.invalidateQueries({ queryKey: ['recentBookings'], exact: false }),
								queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats }),
							]).catch((invalidationError) => {
								console.warn('Background refetch failed:', invalidationError);
							});
							
						} else if (result.type === 'failure') {
							error = (result.data as any)?.error || 'Failed to update status';
						}
						
						// Always reset form state
						isUpdating = false;
						cancellationReason = 'other';
						customMessage = '';
						await update();
					};
				}}
			>
				<div class="p-6" style="border-bottom: 1px solid var(--border-primary);">
					<h3 class="text-lg font-semibold" style="color: var(--text-primary);">Update Booking Status</h3>
					<p class="text-sm mt-1" style="color: var(--text-secondary);">Change the status of this booking</p>
				</div>
				
				<div class="p-6 space-y-4">
					<input type="hidden" name="id" value={booking.id} />
					
					<div>
						<label class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
							New Status
						</label>
						<select 
							name="status" 
							bind:value={newStatus}
							class="form-select w-full"
							style="cursor: pointer;"
						>
							<option value="pending">Pending</option>
							<option value="confirmed">Confirmed</option>
							<option value="cancelled">Cancelled</option>
							<option value="completed">Completed</option>
						</select>
					</div>
					
					{#if newStatus === 'cancelled'}
						<div class="rounded-lg p-4" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
							<div class="flex items-start gap-3">
								<AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--color-warning-600);" />
								<div class="flex-1">
									<p class="font-medium" style="color: var(--color-warning-900);">
										Cancelling this booking will:
									</p>
									<ul class="mt-2 space-y-1 text-sm" style="color: var(--color-warning-700);">
										<li>• Send a cancellation email to the customer</li>
										<li>• Process a full refund automatically</li>
										<li>• Free up the spot for other customers</li>
									</ul>
								</div>
							</div>
						</div>
						
						<div>
							<label class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
								Cancellation Reason
							</label>
							<select 
								name="cancellationReason" 
								bind:value={cancellationReason}
								class="form-select w-full"
								style="cursor: pointer;"
							>
								<option value="weather">Weather Conditions</option>
								<option value="illness">Guide Illness</option>
								<option value="emergency">Emergency</option>
								<option value="low_enrollment">Low Enrollment</option>
								<option value="other">Other</option>
							</select>
						</div>
						
						<div>
							<label class="block text-sm font-medium mb-2" style="color: var(--text-secondary);">
								Custom Message (Optional)
							</label>
							<textarea
								name="customMessage"
								bind:value={customMessage}
								rows={3}
								placeholder="Add a personal message to the customer..."
								class="form-textarea w-full resize-none"
							></textarea>
							<p class="text-xs mt-1" style="color: var(--text-tertiary);">
								This message will be included in the cancellation email
							</p>
						</div>
					{/if}
					
					{#if error}
						<div class="rounded-lg p-3" style="background: var(--color-danger-50); border: 1px solid var(--color-danger-200);">
							<p class="text-sm" style="color: var(--color-danger-900);">{error}</p>
						</div>
					{/if}
				</div>
				
				<div class="p-6 flex justify-end gap-3" style="border-top: 1px solid var(--border-primary);">
					<button
						type="button"
						onclick={() => {
							showStatusModal = false;
							newStatus = booking.status;
						}}
						class="button-secondary"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isUpdating || newStatus === booking.status}
						class="button-primary button--gap {isUpdating ? 'opacity-50' : ''}"
					>
						{#if isUpdating}
							<Loader2 class="h-4 w-4 animate-spin" />
							Updating...
						{:else}
							Update Status
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style lang="postcss">
	@reference "tailwindcss";
</style> 
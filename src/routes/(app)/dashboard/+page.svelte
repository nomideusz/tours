<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import { browser } from '$app/environment';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { formatDate, getStatusColor, getPaymentStatusColor } from '$lib/utils/date-helpers.js';
	import { formatSlotTimeRange } from '$lib/utils/time-slot-client.js';
	import { formatParticipantDisplayCompact } from '$lib/utils/participant-display.js';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import PromoStatusBanner from '$lib/components/PromoStatusBanner.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import TourTimeline from '$lib/components/TourTimeline.svelte';
	import DashboardSkeleton from '$lib/components/DashboardSkeleton.svelte';
	import OnboardingSkeleton from '$lib/components/OnboardingSkeleton.svelte';
	import OnboardingSection from '$lib/components/OnboardingSection.svelte';
	import {
		userCurrency,
		currentCurrencyInfo,
		SUPPORTED_CURRENCIES,
		type Currency
	} from '$lib/stores/currency.js';
	import type { AuthUser } from '$lib/stores/auth.js';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';

	// TanStack Query for API-only data fetching
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';

	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import QrCode from 'lucide-svelte/icons/qr-code';
	import Users from 'lucide-svelte/icons/users';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Plus from 'lucide-svelte/icons/plus';
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Copy from 'lucide-svelte/icons/copy';
	import Link from 'lucide-svelte/icons/link';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Globe from 'lucide-svelte/icons/globe';
	import Crown from 'lucide-svelte/icons/crown';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Mail from 'lucide-svelte/icons/mail';
	import Flag from 'lucide-svelte/icons/flag';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import CircleDollarSign from 'lucide-svelte/icons/circle-dollar-sign';
	import ReceiptText from 'lucide-svelte/icons/receipt-text';
	import Check from 'lucide-svelte/icons/check';
	import RefreshCcw from 'lucide-svelte/icons/refresh-ccw';

	let { data }: { data: PageData } = $props();

	// TanStack Query for dashboard data - using profile page pattern (simple, direct)
	const dashboardStatsQuery = createQuery({
			queryKey: queryKeys.dashboardStats,
			queryFn: ({ signal }) => queryFunctions.fetchDashboardStats(signal),
			staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes to reduce requests
			gcTime: 10 * 60 * 1000,
			refetchOnWindowFocus: false, // Don't refetch on window focus to reduce requests
			refetchOnMount: false, // Don't automatically refetch on mount
			retry: 1, // Reduce retries
			retryDelay: 2000, // Simple 2 second delay
			networkMode: 'online',
			meta: {
				errorMessage: 'Failed to load dashboard statistics'
			}
	});

	const recentBookingsQuery = createQuery({
		queryKey: queryKeys.recentBookings(10),
		queryFn: ({ signal }) => queryFunctions.fetchRecentBookings(10, signal),
		staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false, // Don't refetch on window focus to reduce requests
		refetchOnMount: false, // Don't automatically refetch on mount
		retry: 1, // Reduce retries
		retryDelay: 2000, // Simple 2 second delay
		networkMode: 'online',
		meta: {
			errorMessage: 'Failed to load recent bookings'
		}
	});

	// Get profile from layout data (this stays server-side since it's needed for auth)
	const profile = $derived(data.user as AuthUser | null);

	// Check for payment setup completion
	let isPaymentSetupComplete = $state(false);

	// Check for email verification completion
	let isEmailVerificationComplete = $state(false);

	// Track if user has explicitly confirmed their location
	let hasConfirmedLocation = $state(false);

	// Payment setup loading state
	let isSettingUpPayment = $state(false);
	
		// Payment confirmation modal state
	let showPaymentConfirmModal = $state(false);
	let pendingPaymentCountry = $state<string | null>(null);

	// Force refresh on mount to ensure we have latest user data
	onMount(() => {
		let timeouts: NodeJS.Timeout[] = []; // Track timeouts for cleanup
		
		// Check if returning from email verification
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('verified') === 'true') {
			isEmailVerificationComplete = true;
			// Clear the URL parameter
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.delete('verified');
			window.history.replaceState({}, '', newUrl.toString());
		}

		// Check if returning from payment setup
		if (urlParams.get('setup') === 'complete') {
			isPaymentSetupComplete = true;
			// Clear the URL parameter
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.delete('setup');
			window.history.replaceState({}, '', newUrl.toString());

			// Double-check payment status after a delay
			const timeoutId = setTimeout(() => {
				checkPaymentStatus();
			}, 500);
			timeouts.push(timeoutId);
		}

		// Check if returning from profile location update
		if (urlParams.get('location') === 'updated') {
			saveSuccess = true;
			// Clear the URL parameter
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.delete('location');
			window.history.replaceState({}, '', newUrl.toString());

			// Hide success message after 5 seconds
			const timeoutId = setTimeout(() => {
				saveSuccess = false;
			}, 5000);
			timeouts.push(timeoutId);
		}

		// Check if user has previously confirmed their location (stored in localStorage)
		// Only set this for users who have explicitly confirmed, not just those with auto-detected country
		hasConfirmedLocation = localStorage.getItem('locationConfirmed') === 'true';
		
		// For users with complete setup (email verified + stripe account + country), 
		// assume location is confirmed to prevent onboarding flash
		if (profile && profile.emailVerified && profile.stripeAccountId && profile.country && !hasConfirmedLocation) {
			hasConfirmedLocation = true;
			localStorage.setItem('locationConfirmed', 'true');
		}

		// Check if promo banner was previously dismissed
		const dismissData = localStorage.getItem('promoBannerDismissed');
		if (dismissData) {
			try {
				const parsed = JSON.parse(dismissData);
				// Check if dismissal has expired
				if (parsed.expiry && parsed.expiry > Date.now()) {
					promoBannerDismissed = true;
				} else {
					// Clear expired dismissal
					localStorage.removeItem('promoBannerDismissed');
				}
			} catch (e) {
				// Invalid data, clear it
				localStorage.removeItem('promoBannerDismissed');
			}
		}

		// Close dropdown when clicking outside
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Element;
			if (!target.closest('.country-selector') && !target.closest('.relative')) {
				showCountryDropdown = false;
			}
		};

		// Close dropdown with Escape key
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				showCountryDropdown = false;
			}
		};

		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleKeyDown);
		
		// Cleanup function
		return () => {
			// Clear all timeouts
			timeouts.forEach(timeout => clearTimeout(timeout));
			copyTimeouts.forEach(timeout => clearTimeout(timeout));
			successTimeouts.forEach(timeout => clearTimeout(timeout));
			// Remove event listeners
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeyDown);
		};
	});

	// Use TanStack Query data with fallbacks
	let stats = $derived(
		$dashboardStatsQuery.data || {
			todayBookings: 0,
			weeklyRevenue: 0,
			upcomingTours: 0,
			totalCustomers: 0,
			totalTours: 0,
			activeTours: 0,
			hasTours: false
		}
	);
	let recentBookings = $derived($recentBookingsQuery.data || []);

	// Loading states
	let isLoading = $derived($dashboardStatsQuery.isLoading || $recentBookingsQuery.isLoading);
	let isError = $derived($dashboardStatsQuery.isError || $recentBookingsQuery.isError);

	// Check if this is a new user - only after data has loaded
	let isNewUser = $derived(!isLoading && stats.totalTours === 0);

	// Profile link state
	let profileLinkCopied = $state(false);
	
	// Promo banner dismissal state
	let promoBannerDismissed = $state(false);

	// Currency confirmation state
	let selectedCurrency = $state<Currency>($userCurrency);
	let selectedCountry = $state('');
	let savingCurrency = $state(false);
	let saveSuccess = $state(false);
	let saveError = $state<string | null>(null);

	// Show country dropdown UI
	let showCountryDropdown = $state(false);

	// Track if user manually changed currency (different from country default)



	// Import country data from shared module
	import { COUNTRY_LIST, getCountryInfo, getCurrencyForCountry, type CountryInfo } from '$lib/utils/countries.js';

	// Get current country info
	let currentCountryInfo = $derived(getCountryInfo(selectedCountry));

	// Check if settings need confirmation - only show if location hasn't been explicitly confirmed
	// Even if country is auto-detected during registration, users must explicitly confirm
	let needsConfirmation = $derived(Boolean(browser && profile && !hasConfirmedLocation && !profile?.stripeAccountId));

	// Show email verification if email not verified (regardless of tour count)
	let needsEmailVerification = $derived(Boolean(profile && !profile.emailVerified));

	// Check payment status - declare early to avoid reference issues
	let paymentStatus = $state<{ isSetup: boolean; loading: boolean }>({
		isSetup: false,
		loading: true
	});

	// Email resend state
	let resendingEmail = $state(false);
	let resendEmailSuccess = $state(false);
	let resendEmailError = $state<string | null>(null);

	// Show success messages
	let showEmailVerificationSuccess = $derived(
		isEmailVerificationComplete && profile?.emailVerified
	);
	let showPaymentSetupSuccess = $derived(isPaymentSetupComplete && paymentStatus.isSetup);
	let showLocationSaveSuccess = $derived(saveSuccess);

	// Calculate completed setup steps
	let stepsCompleted = $derived(
		(!needsEmailVerification ? 1 : 0) +
			(paymentStatus.isSetup ? 1 : 0) +
			(!needsConfirmation ? 1 : 0) +
			(stats.totalTours > 0 ? 1 : 0)
	);

	// Subscription limits check
	let isApproachingLimits = $derived.by(() => {
		if (!profile || profile.subscriptionPlan !== 'free') return false;
		// Free plan: 2 bookings/month, 1 tour
		const bookingsUsed = profile.monthlyBookingsUsed || 0;
		const toursCreated = stats.totalTours || 0;
		return bookingsUsed >= 2 || toursCreated >= 1;
	});

	// Get the full profile URL
	const profileUrl = $derived(
		browser && profile ? `${window.location.origin}/${profile.username}` : ''
	);

	// Create today's schedule from recent bookings
	let todaysSchedule = $derived.by(() => {
		if (!Array.isArray(recentBookings)) return [];
		
		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

		return recentBookings
			.filter((booking: any) => {
				if (!booking.effectiveDate) return false;
				const bookingDate = new Date(booking.effectiveDate);
				return bookingDate >= todayStart && bookingDate < todayEnd;
			})
			.map((booking: any) => ({
				id: booking.id,
				time: booking.effectiveDate,
				tourName: booking.tour || 'Unknown Tour',
				tourId: booking.tourId,
				participants: booking.participants || 0,
				customerName: booking.customerName,
				status: booking.status,
				timeSlot: booking.expand?.timeSlot,
				expand: booking.expand
			}))
			.slice(0, 4); // Limit to 4 items
	});

	// Track timeouts for proper cleanup
	let copyTimeouts: NodeJS.Timeout[] = [];
	let successTimeouts: NodeJS.Timeout[] = [];
	
	// Copy profile link function
	async function copyProfileLink() {
		try {
			await navigator.clipboard.writeText(profileUrl);
			profileLinkCopied = true;
			const timeoutId = setTimeout(() => {
				profileLinkCopied = false;
			}, 2000);
			copyTimeouts.push(timeoutId);
		} catch (err) {
			console.error('Failed to copy link:', err);
		}
	}

	// Save currency selection - simplified to single action
	async function saveCurrencySelection() {
		if (!profile || !selectedCountry || !selectedCurrency) return;

		savingCurrency = true;
		saveError = null;
		try {
			const formData = new FormData();
			formData.append('currency', selectedCurrency);
			formData.append('country', selectedCountry);

			const response = await fetch('/api/profile/update', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				userCurrency.set(selectedCurrency);
				saveSuccess = true;
				hasConfirmedLocation = true;

				// Save confirmation to localStorage
				localStorage.setItem('locationConfirmed', 'true');

				// Refresh user data to reflect changes
				await invalidateAll();

				const timeoutId = setTimeout(() => {
					saveSuccess = false;
				}, 5000); // Show success message for 5 seconds
				successTimeouts.push(timeoutId);
			} else {
				const data = await response.json();
				saveError = data.error || 'Failed to update settings';
			}
		} catch (error) {
			saveError = 'Network error. Please try again.';
		} finally {
			savingCurrency = false;
		}
	}

	// Update currency when country changes and auto-set currency based on country
	function onCountryChange(countryCode: string) {
		selectedCountry = countryCode;
		// Auto-set currency based on country
		const countryCurrency = getCurrencyForCountry(countryCode);
		if (countryCurrency) {
			selectedCurrency = countryCurrency as Currency;
			// Also update the global currency store
			userCurrency.set(selectedCurrency);
		}
		showCountryDropdown = false;
	}



	// Reset selections to original values
	function resetSelections() {
		if (profile && profile.country && profile.currency) {
			// Use saved profile data
			selectedCountry = profile.country;
			selectedCurrency = profile.currency as Currency;
		} else {
			// Reset to user currency store value
			selectedCurrency = $userCurrency;
		}

	}

	// Load currency settings and check if confirmation needed - run only once per profile
	let lastProfileId = $state<string | null>(null);
	$effect(() => {
		if (browser && profile && profile.id !== lastProfileId) {
			lastProfileId = profile.id;
			
			if (profile.country && profile.currency) {
				// Use saved profile data
				selectedCountry = profile.country;
				selectedCurrency = profile.currency as Currency;
			} else {
				// Auto-detect if not set - only import once
				import('$lib/utils/country-detector.js').then(({ detectCountry }) => {
					const detectedCountry = detectCountry();
					const country = getCountryInfo(detectedCountry);
					if (country) {
						selectedCountry = detectedCountry;
						selectedCurrency = country.currency as Currency;
					}
				});
			}
		}
	});

	// Payment setup function - shows confirmation modal
	function setupPayments() {
		if (!profile || isSettingUpPayment) return;

		// If stripeAccountId already exists, country is already locked - skip the modal
		if (profile.stripeAccountId) {
			// Go directly to payment setup without warning
			confirmPaymentSetup();
			return;
		}

		// Get the country for payment setup
		const userCountry = profile.country || selectedCountry || 'US';
		pendingPaymentCountry = userCountry;
		showPaymentConfirmModal = true;
	}
	
	// Actually setup payments after confirmation
	async function confirmPaymentSetup() {
		if (!profile || isSettingUpPayment) return;

		// Use existing country if stripeAccountId exists, otherwise use pending country
		const countryForSetup = profile.stripeAccountId ? 
			(profile.country || 'US') : 
			(pendingPaymentCountry || profile.country || selectedCountry || 'US');

		showPaymentConfirmModal = false;
		isSettingUpPayment = true;
		
		try {
			const response = await fetch('/api/payments/connect/setup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: profile.id,
					email: profile.email,
					businessName: profile.businessName || profile.name,
					country: countryForSetup,
					returnUrl: `${window.location.origin}/dashboard?setup=complete`
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Payment setup API error:', errorData);
				// Store the error for display
				saveError = errorData.error || 'Failed to setup payment account';
				isSettingUpPayment = false;
				pendingPaymentCountry = null;
				return;
			}

			const { accountLink } = await response.json();
			window.location.href = accountLink;
		} catch (error) {
			console.error('Payment setup error:', error);
			
			// Network or other errors
			saveError = error instanceof Error ? error.message : 'Failed to setup payment account. Please try again.';
			isSettingUpPayment = false;
		} finally {
			pendingPaymentCountry = null;
		}
	}

	// Function to check payment status
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

	$effect(() => {
		if (profile?.stripeAccountId) {
			checkPaymentStatus();
		} else {
			paymentStatus = { isSetup: false, loading: false };
		}
	});

	// Resend verification email function
	async function resendVerificationEmail() {
		if (!profile || resendingEmail) return;
		
		resendingEmail = true;
		resendEmailError = null;
		resendEmailSuccess = false;
		
		try {
			// Generate verification URL
			const verificationUrl = `${window.location.origin}/auth/verify?token=${profile.id}`;
			
			const response = await fetch('/api/send-auth-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					emailType: 'email-verification',
					email: profile.email,
					name: profile.name || 'Tour Guide',
					verificationUrl: verificationUrl
				})
			});
			
			if (response.ok) {
				resendEmailSuccess = true;
				const timeoutId = setTimeout(() => {
					resendEmailSuccess = false;
				}, 5000);
				successTimeouts.push(timeoutId);
			} else {
				const data = await response.json();
				resendEmailError = data.error || 'Failed to send verification email';
			}
		} catch (error) {
			resendEmailError = 'Network error. Please try again.';
		} finally {
			resendingEmail = false;
		}
	}

	// Close success banners
	function closeEmailVerificationBanner() {
		isEmailVerificationComplete = false;
	}

	function closePaymentSetupBanner() {
		isPaymentSetupComplete = false;
	}

	function closeLocationBanner() {
		saveSuccess = false;
	}



	// Determine if currency settings need attention
	let shouldShowCurrencySetup = $derived.by(() => {
		// Check if user is new based on tours and customers
		const newUserCheck = !stats.totalTours && stats.totalCustomers === 0;

		// Show setup if:
		// 1. Profile doesn't have country set, OR
		// 2. No currency is set, OR
		// 3. User is new and hasn't explicitly confirmed location
		return (
			profile && (!profile.country || !$userCurrency || (newUserCheck && !hasConfirmedLocation))
		);
	});

	let isLocationConfirmed = $derived.by(() => {
		// Only confirmed if user has explicitly confirmed (not just auto-detected)
		return profile?.country !== null && profile?.country !== undefined && hasConfirmedLocation;
	});

	// Country selection state
	let currencyExpanded = $state(false);
	let countryToUpdate = $state<string | null>(null);
	let isUpdatingCountry = $state<Record<string, boolean>>({});

	async function handleCountryConfirm(country: string) {
		if (!profile) return;

		// Update loading states
		countryToUpdate = country;
		isUpdatingCountry[country] = true;

		try {
			// Update user profile with selected country
			const response = await fetch('/api/profile/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					country,
					currency: getCurrencyForCountry(country) as Currency
				})
			});

			if (!response.ok) {
				throw new Error('Failed to update profile');
			}

			// Set the currency in the store
			userCurrency.set(getCurrencyForCountry(country) as Currency);

			// Mark location as explicitly confirmed
			if (browser) {
				localStorage.setItem('locationConfirmed', 'true');
			}

			// Collapse currency section
			currencyExpanded = false;

			// Clear loading state
			countryToUpdate = null;
			isUpdatingCountry[country] = false;
		} catch (error) {
			console.error('Failed to update country:', error);
			// Clear loading state on error
			countryToUpdate = null;
			isUpdatingCountry[country] = false;
			// TODO: Show error message
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

	// Timeline view state
	let timelineView = $state<'day' | 'week' | 'month'>('week');
</script>

<svelte:head>
	<title>Dashboard - Zaur</title>
	<meta name="description" content="Your tour operations center" />
</svelte:head>

<div class="mx-auto max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
	<!-- Success Messages (always show at top) -->
	{#if showEmailVerificationSuccess}
		<div 
			in:fade={{ duration: 300 }}
			out:fade={{ duration: 300 }}
			class="rounded-xl p-4 sm:p-6 mb-6 shadow-sm alert-success"
		>
			<div class="flex items-start gap-3">
				<div class="flex-shrink-0">
					<CheckCircle class="h-5 w-5 sm:h-6 sm:w-6" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-sm sm:text-base mb-1">Email Verified!</h3>
					<p class="text-xs sm:text-sm">
						Your email has been successfully verified. You can now receive booking notifications.
					</p>
				</div>
			</div>
		</div>
	{/if}

	{#if showPaymentSetupSuccess}
		<div 
			in:fade={{ duration: 300 }}
			out:fade={{ duration: 300 }}
			class="rounded-xl p-4 sm:p-6 mb-6 shadow-sm alert-success"
		>
			<div class="flex items-start gap-3">
				<div class="flex-shrink-0">
					<CreditCard class="h-5 w-5 sm:h-6 sm:w-6" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-sm sm:text-base mb-1">Payment Account Ready!</h3>
					<p class="text-xs sm:text-sm">
						Your payment account is set up. You can now receive payments from customers.
					</p>
				</div>
			</div>
		</div>
	{/if}

	{#if showLocationSaveSuccess}
		<div 
			in:fade={{ duration: 300 }}
			out:fade={{ duration: 300 }}
			class="rounded-xl p-4 sm:p-6 mb-6 shadow-sm alert-success"
		>
			<div class="flex items-start gap-3">
				<div class="flex-shrink-0">
					<CheckCircle class="h-5 w-5 sm:h-6 sm:w-6" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-sm sm:text-base mb-1">Location Confirmed!</h3>
					<p class="text-xs sm:text-sm mb-2">
						{#if profile?.country && profile?.currency}
							{@const countryInfo = getCountryInfo(profile.country)}
							Business location: {countryInfo?.flag || ''} {countryInfo?.name || profile.country} • Currency: {profile.currency}
						{:else}
							Your business location has been saved.
						{/if}
					</p>
					<p class="text-xs" style="color: var(--text-tertiary);">
						{#if profile?.stripeAccountId}
							Location is permanently locked because payment setup has been started.
						{:else}
							You can still update this in your <a href="/profile" class="underline hover:no-underline" style="color: var(--color-primary-600);">profile settings</a> until payment setup starts.
						{/if}
					</p>
				</div>
			</div>
		</div>
	{/if}

	{#if saveError && !isNewUser}
		<div class="alert-error mb-6 rounded-lg p-4">
			<div class="flex items-start gap-3">
				<div class="flex-shrink-0">
					<AlertCircle class="h-5 w-5" />
				</div>
				<div class="flex-1">
					<h3 class="mb-1 text-sm font-medium">
						Payment setup failed
					</h3>
					<p class="text-sm">
						{saveError}
					</p>
				</div>
				<button
					onclick={() => (saveError = null)}
					class="button-secondary button--small button--icon ml-2"
					aria-label="Close"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<!-- Promo Status Banner (show for all users with promo benefits) -->
	{#if profile && (profile.promoCodeUsed || (profile.subscriptionDiscountPercentage ?? 0) > 0 || (profile.subscriptionFreeUntil && new Date(profile.subscriptionFreeUntil) > new Date())) && !promoBannerDismissed}
		<div class="mb-4 sm:mb-6">
			<PromoStatusBanner 
				showDismiss={true} 
				onDismiss={() => {
					promoBannerDismissed = true;
					// Store dismissal in localStorage with expiry
					if (browser) {
						const dismissData = {
							dismissed: true,
							timestamp: Date.now(),
							// Expire after 7 days
							expiry: Date.now() + (7 * 24 * 60 * 60 * 1000)
						};
						localStorage.setItem('promoBannerDismissed', JSON.stringify(dismissData));
					}
				}} 
			/>
		</div>
	{/if}

	{#if isLoading && !isError}
		<!-- Show skeleton only when loading and not in error state -->
		<DashboardSkeleton />
	{:else if isError}
		<!-- Show error state -->
		<div class="rounded-lg p-8 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<AlertCircle class="h-12 w-12 mx-auto mb-4" style="color: var(--color-danger-600);" />
			<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">
				Unable to Load Dashboard
			</h3>
			<p class="text-sm mb-4" style="color: var(--text-secondary);">
				There was an error loading your dashboard data. Please try refreshing the page.
			</p>
			<button 
				onclick={() => window.location.reload()} 
				class="button-primary button--gap"
			>
				<RefreshCcw class="h-4 w-4" />
				Refresh Page
			</button>
		</div>
	{:else}
		<!-- Dashboard Header -->
		<div class="mb-6">
			<!-- Mobile Header -->
			<MobilePageHeader
				title={isLoading ? "Dashboard" : (isNewUser ? "Welcome to Zaur!" : "Operations Center")}
				secondaryInfo={isLoading ? "Loading..." : (isNewUser ? "Let's get you started" : `${stats.upcomingTours} upcoming`)}
				quickActions={[
					{
						label: 'Create',
						icon: Plus,
						onclick: () => goto('/tours/new'),
						variant: 'primary'
					},
					{
						label: 'Check-in',
						icon: QrCode,
						onclick: () => goto('/checkin-scanner'),
						variant: 'secondary'
					}
				]}
			/>
			
			<!-- Desktop Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title={isLoading ? "Dashboard" : (isNewUser ? "Welcome to Zaur!" : "Operations Center")}
					subtitle={isLoading ? "Loading your data..." : (isNewUser ? "Complete these steps to start accepting tour bookings" : "Manage your daily tour operations")}
				>
					<div class="flex items-center gap-4">
						<button onclick={() => goto('/tours/new')} class="button-primary button--gap">
							<Plus class="h-4 w-4" />
							Create Tour
						</button>
					</div>
				</PageHeader>
			</div>
		</div>

		<!-- Onboarding Section -->
		{#if !isLoading && !paymentStatus.loading && (needsEmailVerification || needsConfirmation || !paymentStatus.isSetup || stats.totalTours === 0)}
			<!-- Show actual onboarding steps only after data has loaded -->
			<OnboardingSection
				{profile}
				{stats}
				{needsEmailVerification}
				{needsConfirmation}
				{paymentStatus}
				{stepsCompleted}
				{resendingEmail}
				resendEmailSuccess={resendEmailSuccess || false}
				resendEmailError={resendEmailError || null}
				{isSettingUpPayment}
				saveError={saveError || null}
				{hasConfirmedLocation}
				{selectedCountry}
				{selectedCurrency}
				{savingCurrency}
				{currencyExpanded}
				resendVerificationEmail={() => resendVerificationEmail()}
				setupPayments={() => setupPayments()}
				onCurrencyExpandedChange={(expanded) => currencyExpanded = expanded}
				onCountryChange={(country) => onCountryChange(country)}
				saveCurrencySelection={() => saveCurrencySelection()}
				resetSelections={() => resetSelections()}
			/>
		{/if}

		<!-- Tour Timeline - Main Feature -->
		<div class="mb-8">
			<TourTimeline 
				bind:view={timelineView}
				onSlotClick={(slot) => {
					// Navigate to tour details page when clicking a slot
					goto(`/tours/${slot.tourId}`);
				}}
			/>
		</div>

		<!-- Recent Bookings -->
		{#if recentBookings && recentBookings.length > 0}
			<div class="mb-8">
				<div
					class="rounded-lg"
					style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
				>
					<div class="border-b p-4" style="border-color: var(--border-primary);">
						<div class="flex items-center justify-between">
							<h3 class="text-base font-semibold" style="color: var(--text-primary);">
								Recent Bookings
							</h3>
							<button
								onclick={() => goto('/bookings')}
								class="button-secondary button--small button--gap"
							>
								View all
								<ArrowRight class="h-3 w-3" />
							</button>
						</div>
					</div>

					<div class="divide-y" style="border-color: var(--border-primary);">
						{#each recentBookings.slice(0, 4) as booking}
							{@const BookingIcon = getBookingStatusIcon(booking.status)}
							{@const PaymentIcon = getPaymentStatusIcon(booking.paymentStatus || 'pending')}
							<div class="p-4 transition-all duration-150 cursor-pointer hover:bg-[var(--bg-secondary)]"
								role="button"
								tabindex="0"
								onclick={() => goto(`/bookings/${booking.id}`)}
								onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goto(`/bookings/${booking.id}`); } }}
							>
								<div class="flex items-start justify-between">
									<div class="min-w-0 flex-1">
										<div class="mb-1 flex items-center gap-2">
											<span class="text-sm font-medium" style="color: var(--text-primary);">
												{booking.customerName || 'Anonymous'}
											</span>
											<span
												class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full {getStatusColor(booking.status)}"
											>
												<BookingIcon class="h-3 w-3" />
												<span class="capitalize">{booking.status}</span>
											</span>
											{#if booking.paymentStatus}
												<span
													class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full {getPaymentStatusColor(booking.paymentStatus)}"
												>
													<PaymentIcon class="h-3 w-3" />
													{getPaymentStatusLabel(booking.paymentStatus)}
												</span>
											{/if}
										</div>
										<p class="text-xs" style="color: var(--text-secondary);">
											{booking.tourName || booking.tour || 'Unknown Tour'} • 
											{#if booking.effectiveDate}
												{formatDate(booking.effectiveDate)}
											{:else if booking.expand?.timeSlot?.startTime}
												{formatDate(booking.expand.timeSlot.startTime)}
											{:else}
												No date
											{/if}
										</p>
										<p class="mt-1 text-xs" style="color: var(--text-tertiary);">
											{booking.participants} {booking.participants === 1 ? 'guest' : 'guests'} • {$globalCurrencyFormatter(booking.totalAmount || 0)}
										</p>
									</div>
									<button
										onclick={(e) => {
											e.stopPropagation();
											goto(`/bookings/${booking.id}`);
										}}
										class="button-secondary button--small button--icon ml-3"
									>
										<ArrowRight class="h-3 w-3" />
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Quick Actions -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<button
				onclick={() => goto('/tours/new')}
				class="quick-action-card"
			>
				<Plus class="h-5 w-5 mb-2" style="color: var(--color-primary-600);" />
				<span class="font-medium" style="color: var(--text-primary);">Create Tour</span>
			</button>
			<button
				onclick={() => goto('/checkin-scanner')}
				class="quick-action-card"
			>
				<QrCode class="h-5 w-5 mb-2" style="color: var(--color-success-600);" />
				<span class="font-medium" style="color: var(--text-primary);">Check-in Scanner</span>
			</button>
			<button
				onclick={() => goto('/analytics')}
				class="quick-action-card"
			>
				<TrendingUp class="h-5 w-5 mb-2" style="color: var(--color-warning-600);" />
				<span class="font-medium" style="color: var(--text-primary);">View Analytics</span>
			</button>
			<button
				onclick={() => goto('/profile')}
				class="quick-action-card"
			>
				<UserCheck class="h-5 w-5 mb-2" style="color: var(--color-info-600);" />
				<span class="font-medium" style="color: var(--text-primary);">Update Profile</span>
			</button>
		</div>
	{/if}
</div>

<!-- Payment Confirmation Modal -->
{#if showPaymentConfirmModal && pendingPaymentCountry}
	{@const countryInfo = getCountryInfo(pendingPaymentCountry || '')}
	{@const stripeCurrency = getCurrencyForCountry(pendingPaymentCountry || '')}
	<ConfirmationModal
		isOpen={showPaymentConfirmModal}
		title="Confirm Payment Account Country"
		message={`You are about to create a payment account for ${countryInfo?.flag || ''} ${countryInfo?.name || pendingPaymentCountry}.

Your payment account will use ${stripeCurrency} as the currency.

⚠️ IMPORTANT: Once you proceed, your country selection will be IMMEDIATELY and PERMANENTLY locked. This cannot be changed later, even if you don't complete the setup process.

Please ensure this is the correct country where your business is legally registered.`}
		confirmText={`Yes, ${countryInfo?.name || pendingPaymentCountry} is correct`}
		cancelText="Cancel"
		variant="warning"
		icon={Globe}
		onConfirm={confirmPaymentSetup}
		onCancel={() => {
			showPaymentConfirmModal = false;
			pendingPaymentCountry = null;
		}}
		onClose={() => {
			showPaymentConfirmModal = false;
			pendingPaymentCountry = null;
		}}
	/>
{/if}

<style>
	.opacity-50 {
		opacity: 0.5;
	}

	.schedule-item {
		transition: background-color 0.2s ease;
	}

	.schedule-item:hover {
		background-color: var(--bg-tertiary);
	}

	.schedule-item .schedule-actions {
		opacity: 0;
		transition: opacity 0.2s ease-in-out;
	}

	.schedule-item:hover .schedule-actions {
		opacity: 1;
	}



	.subscription-tier {
		position: relative;
		padding: 1.5rem;
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
		background: var(--bg-primary);
		transition: all 0.2s ease;
	}

	.subscription-tier:hover {
		border-color: var(--color-primary-300);
		box-shadow: var(--shadow-md);
	}

	.subscription-tier.current {
		border-color: var(--color-primary-500);
		background: var(--color-primary-50);
	}

	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}

	.booking-item {
		transition: background-color 0.2s ease;
	}

	.booking-item:hover {
		background-color: var(--bg-secondary);
	}

	.country-list {
		scrollbar-width: thin;
		scrollbar-color: var(--border-secondary) transparent;
	}

	.country-list::-webkit-scrollbar {
		width: 8px;
	}

	.country-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.country-list::-webkit-scrollbar-thumb {
		background-color: var(--border-secondary);
		border-radius: 4px;
	}

	.country-list::-webkit-scrollbar-thumb:hover {
		background-color: var(--border-primary);
	}

	/* Success message animations */
	.success-message {
		animation: slideInDown 0.3s ease-out;
	}

	@keyframes slideInDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.quick-action-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s;
		text-align: center;
	}

	.quick-action-card:hover {
		background: var(--bg-secondary);
		border-color: var(--border-secondary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}
</style>

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
			queryFn: queryFunctions.fetchDashboardStats,
			staleTime: 0, // Always consider data stale for immediate updates
			gcTime: 5 * 60 * 1000,
			refetchOnWindowFocus: 'always',
			refetchOnMount: 'always'
	});

	const recentBookingsQuery = createQuery({
		queryKey: queryKeys.recentBookings(10),
		queryFn: () => queryFunctions.fetchRecentBookings(10),
		staleTime: 0, // Always consider data stale for immediate updates
		gcTime: 5 * 60 * 1000,
		refetchOnWindowFocus: 'always',
		refetchOnMount: 'always'
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
		// Refresh all data to ensure emailVerified status is current
		invalidateAll();

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

			// Force refresh payment status and user data
			invalidateAll().then(() => {
				// Double-check payment status after data refresh
				setTimeout(() => {
					checkPaymentStatus();
				}, 500);
			});
		}

		// Check if user has previously confirmed their location (stored in localStorage)
		// Only set this for users who have explicitly confirmed, not just those with auto-detected country
		hasConfirmedLocation = localStorage.getItem('locationConfirmed') === 'true';
		
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
		return () => {
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
			activeTours: 0
		}
	);
	let recentBookings = $derived($recentBookingsQuery.data || []);

	// Loading states
	let isLoading = $derived($dashboardStatsQuery.isLoading || $recentBookingsQuery.isLoading);
	let isError = $derived($dashboardStatsQuery.isError || $recentBookingsQuery.isError);

	// Check if this is a new user
	let isNewUser = $derived(stats.totalTours === 0);

	// Debug location confirmation state
	$effect(() => {
		if (browser && !isLoading) {
			console.log('Location confirmation state:', {
				hasConfirmedLocation,
				needsConfirmation,
				profileCountry: profile?.country,
				profileCurrency: profile?.currency,
				isNewUser,
				totalTours: stats.totalTours,
				totalCustomers: stats.totalCustomers,
				localStorage: localStorage.getItem('locationConfirmed')
			});
		}
	});

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
	let needsConfirmation = $derived(browser && profile && !hasConfirmedLocation && !profile?.stripeAccountId);

	// Show email verification if email not verified (regardless of tour count)
	let needsEmailVerification = $derived(profile && !profile.emailVerified);

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
	let isApproachingLimits = $derived(() => {
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
	let todaysSchedule = $derived(
		(() => {
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
		})()
	);

	// Copy profile link function
	async function copyProfileLink() {
		try {
			await navigator.clipboard.writeText(profileUrl);
			profileLinkCopied = true;
			setTimeout(() => {
				profileLinkCopied = false;
			}, 2000);
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

				setTimeout(() => {
					saveSuccess = false;
				}, 100); // Just a short delay for smooth transition
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

	// Load currency settings and check if confirmation needed
	$effect(() => {
		if (browser && profile) {
			if (profile.country && profile.currency) {
				// Use saved profile data
				selectedCountry = profile.country;
				selectedCurrency = profile.currency as Currency;
			} else {
				// Auto-detect if not set
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
		if (!profile?.email || !profile?.id) return;

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
					email: profile.email,
					emailType: 'email-verification',
					name: profile.name || 'Tour Guide',
					verificationUrl: verificationUrl
				})
			});

			if (response.ok) {
				resendEmailSuccess = true;
				setTimeout(() => {
					resendEmailSuccess = false;
				}, 5000);
			} else {
				const data = await response.json();
				resendEmailError = data.error || 'Failed to resend email';
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
	let shouldShowCurrencySetup = $derived(() => {
		// Update isNewUser calculation to match the one above
		const newUserCheck = !stats.hasTours && stats.totalCustomers === 0;

		// Show setup if:
		// 1. Profile doesn't have country set, OR
		// 2. No currency is set, OR
		// 3. User is new and hasn't explicitly confirmed location
		return (
			profile && (!profile.country || !$userCurrency || (newUserCheck && !hasConfirmedLocation))
		);
	});

	let isLocationConfirmed = $derived(() => {
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
					<p class="text-xs sm:text-sm">
						Your business location has been saved. You're all set!
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

	{#if isLoading}
		<!-- Loading State -->
		<div class="flex min-h-[60vh] items-center justify-center">
			<div class="text-center">
				<Loader2 class="mx-auto mb-4 h-8 w-8 animate-spin" style="color: var(--text-tertiary);" />
				<p class="text-sm" style="color: var(--text-secondary);">Loading your dashboard...</p>
			</div>
		</div>
	{:else if isNewUser}
		<!-- Clean Onboarding for New Users -->
		<div class="mb-8">
			<h1 class="mb-2 text-2xl font-bold sm:text-3xl" style="color: var(--text-primary);">
				Welcome to Zaur, {profile?.name || 'Tour Guide'}!
			</h1>
			<p class="text-sm" style="color: var(--text-secondary);">
				Let's get your tour business ready in a few simple steps
			</p>
		</div>

		<!-- Onboarding Progress Card -->
		<div
			class="mb-8 rounded-xl"
			style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
		>
			<div class="p-6">
				<!-- Progress Indicator -->
				<div class="mb-8">
					<div class="mb-2 flex items-center justify-between">
						<p class="text-xs font-medium" style="color: var(--text-tertiary);">Setup Progress</p>
						<p class="text-xs font-medium" style="color: var(--text-tertiary);">
							{stepsCompleted === 4 ? 'All steps completed' : `${stepsCompleted} of 4 completed`}
						</p>
					</div>
					<div class="h-2 w-full rounded-full" style="background: var(--bg-tertiary);">
						<div
							class="h-full rounded-full transition-all duration-500"
							style="background: var(--color-primary-500); width: {(stepsCompleted / 4) * 100 +
								'%'};"
						></div>
					</div>
				</div>

				<div class="space-y-4">
					<!-- Email Verification Step -->
					{#if needsEmailVerification}
						<div
							class="flex items-start gap-4 rounded-lg p-4 transition-all"
							style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
						>
							<div
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
								style="background: var(--bg-tertiary); color: var(--text-secondary);"
							>
								<Mail class="h-4 w-4" />
							</div>
							<div class="flex-1">
								<h3 class="mb-1 text-sm font-semibold" style="color: var(--text-primary);">
									Verify your email address
								</h3>
								<p class="mb-3 text-sm" style="color: var(--text-secondary);">
									Check your inbox at <span class="font-medium">{profile?.email}</span> and click the
									verification link.
								</p>
								{#if resendEmailSuccess}
									<p class="mb-3 text-xs" style="color: var(--color-success-600);">
										Verification email sent! Check your inbox.
									</p>
								{/if}
								{#if resendEmailError}
									<p class="form-error mb-3">{resendEmailError}</p>
								{/if}
								<div class="flex items-center gap-2">
									<button
										onclick={resendVerificationEmail}
										disabled={resendingEmail}
										class="button-secondary button--small"
									>
										{#if resendingEmail}
											<Loader2 class="mr-1 h-3 w-3 animate-spin" />
											Sending...
										{:else}
											Resend Email
										{/if}
									</button>
									<span class="text-xs" style="color: var(--text-tertiary);">
										Didn't receive it? Check spam folder
									</span>
								</div>
							</div>
						</div>
					{:else}
						<div
							class="flex items-start gap-4 rounded-lg p-4"
							style="background: var(--bg-secondary); border: 1px solid var(--color-success-200);"
						>
							<div
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
								style="background: var(--color-success-100); color: var(--color-success-600);"
							>
								<CheckCircle class="h-4 w-4" />
							</div>
							<div class="flex-1">
								<h3 class="text-sm font-semibold" style="color: var(--text-primary);">
									Email verified
								</h3>
								<p class="text-sm" style="color: var(--text-secondary);">
									Your email address has been verified successfully.
								</p>
							</div>
						</div>
					{/if}

					<!-- Location Confirmation Step -->
					{#if needsConfirmation}
						<div
							class="flex items-start gap-4 rounded-lg p-4 transition-all"
							style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
						>
							<div
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
								style="background: var(--bg-tertiary); color: var(--text-secondary);"
							>
								<Globe class="h-4 w-4" />
							</div>
							<div class="flex-1 max-w-fit">
								<h3 class="mb-1 text-sm font-semibold" style="color: var(--text-primary);">
									Confirm your business location
								</h3>
								<p class="mb-4 text-sm" style="color: var(--text-secondary);">
									We'll use this to set your default currency and regional settings.
								</p>
								
								<!-- Simplified Country Selection -->
								<div class="space-y-3">
									<!-- Warning Message -->
									<div class="alert-warning rounded-lg p-3">
										<div class="flex items-start gap-2">
											<AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
											<div class="min-w-0 flex-1">
												<p class="text-xs leading-relaxed">
													<strong>Important:</strong> Country selection determines your payment account location.
												</p>
												<p class="text-xs leading-relaxed mt-1">
													This cannot be changed later. Choose where your business is registered.
												</p>
											</div>
										</div>
									</div>

									<!-- Country Dropdown -->
									<div>
										<label class="mb-1.5 block text-xs font-medium" style="color: var(--text-primary);">
											Select your country
										</label>
										<div class="relative">
											<button
												onclick={() => (showCountryDropdown = !showCountryDropdown)}
												class="flex w-full items-center justify-between rounded-lg p-3 text-left"
												style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
											>
												<div class="flex items-center gap-2">
													{#if currentCountryInfo}
														<span class="text-sm font-medium">{currentCountryInfo.flag}</span>
														<span class="text-sm" style="color: var(--text-primary);">
															{currentCountryInfo.name}
														</span>
													{:else}
														<span class="text-sm" style="color: var(--text-secondary);">
															Select country
														</span>
													{/if}
												</div>
												<svg
													class="h-4 w-4 transition-transform {showCountryDropdown ? 'rotate-180' : ''}"
													style="color: var(--text-tertiary);"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 9l-7 7-7-7"
													/>
												</svg>
											</button>

											{#if showCountryDropdown}
												<div
													class="absolute z-50 mt-1 w-full overflow-hidden rounded-lg shadow-lg"
													style="background: var(--bg-primary); border: 1px solid var(--border-primary); max-height: 16rem;"
												>
													<div class="overflow-y-auto" style="max-height: 16rem;">
														{#each COUNTRY_LIST as country}
															<button
																onclick={() => {
																	onCountryChange(country.code);
																	showCountryDropdown = false;
																}}
																class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
																style="color: var(--text-primary);"
															>
																<span>{country.flag}</span>
																<span>{country.name}</span>
																{#if selectedCountry === country.code}
																	<CheckCircle
																		class="ml-auto h-3.5 w-3.5"
																		style="color: var(--color-primary-600);"
																	/>
																{/if}
															</button>
														{/each}
													</div>
												</div>
											{/if}
										</div>
									</div>

									<!-- Currency Display -->
									{#if selectedCountry}
										{@const countryCurrency = getCurrencyForCountry(selectedCountry)}
										{@const currencyInfo = SUPPORTED_CURRENCIES[countryCurrency as Currency]}
										<div class="rounded-lg p-3" style="background: var(--bg-tertiary); border: 1px solid var(--border-secondary);">
											<p class="text-xs font-medium mb-0.5" style="color: var(--text-secondary);">
												Your currency will be:
											</p>
											<p class="text-sm font-medium" style="color: var(--text-primary);">
												{currencyInfo.symbol} {currencyInfo.code} - {currencyInfo.name}
											</p>
										</div>
									{/if}

									<!-- Error message -->
									{#if saveError}
										<div class="alert-error rounded-lg p-3 text-sm">
											{saveError}
										</div>
									{/if}

									<!-- Action Button -->
									<button
										onclick={saveCurrencySelection}
										disabled={savingCurrency || !selectedCountry}
										class="button-primary button--small w-full"
									>
										{#if savingCurrency}
											<Loader2 class="mr-1 h-3 w-3 animate-spin" />
											Saving...
										{:else}
											Confirm Location
										{/if}
									</button>
								</div>
							</div>
						</div>
					{:else if profile?.stripeAccountId && profile?.country}
						{@const confirmedCountry = getCountryInfo(profile?.country || '')}
						<div
							class="flex items-start gap-4 rounded-lg p-4 alert-success"
						>
							<div
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white"
							>
								<CheckCircle class="h-4 w-4" style="color: var(--color-success-600);" />
							</div>
							<div class="flex-1">
								<h3 class="text-sm font-semibold">
									Location set
								</h3>
								<p class="text-sm">
									Your business location is locked due to payment setup.
								</p>
								{#if confirmedCountry && profile?.currency}
									<div class="mt-2 flex items-center gap-2">
										<span class="text-sm font-medium">
											{confirmedCountry.flag} {confirmedCountry.name}
										</span>
										<span class="text-sm opacity-70">•</span>
										<span class="text-sm font-medium">
											{profile.currency}
										</span>
									</div>
								{/if}
							</div>
						</div>
					{:else}
						{@const confirmedCountry = getCountryInfo(profile?.country || '')}
						<div
							class="flex items-start gap-4 rounded-lg p-4 alert-success"
						>
							<div
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white"
							>
								<CheckCircle class="h-4 w-4" style="color: var(--color-success-600);" />
							</div>
							<div class="flex-1">
								<h3 class="text-sm font-semibold">
									Location confirmed
								</h3>
								<p class="text-sm">
									Your business location and currency are set.
								</p>
								{#if confirmedCountry && profile?.currency}
									<div class="mt-2 flex items-center gap-2">
										<span class="text-sm font-medium">
											{confirmedCountry.flag} {confirmedCountry.name}
										</span>
										<span class="text-sm opacity-70">•</span>
										<span class="text-sm font-medium">
											{profile.currency}
										</span>
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Payment Setup Step -->
					{#if !paymentStatus.loading}
						{#if !paymentStatus.isSetup}
							<div
								class="flex items-start gap-4 rounded-lg p-4 transition-all {needsConfirmation ? 'opacity-50' : ''}"
								style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
							>
								<div
									class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
									style="background: var(--bg-tertiary); color: var(--text-secondary);"
								>
									<CreditCard class="h-4 w-4" />
								</div>
								<div class="flex-1 max-w-fit">
									<h3 class="mb-1 text-sm font-semibold" style="color: var(--text-primary);">
										Connect your bank account
									</h3>
									<p class="mb-4 text-sm" style="color: var(--text-secondary);">
										Set up payments to receive money from tour bookings directly to your bank
										account.
									</p>
																{#if needsConfirmation}
								<p class="text-xs" style="color: var(--text-tertiary);">
									Confirm your location first to set up payments for your region
								</p>
							{:else}
								<div class="space-y-2">
									<button
										onclick={setupPayments}
										disabled={isSettingUpPayment}
										class="button-primary button--small"
									>
										{#if isSettingUpPayment}
											<Loader2 class="mr-1 h-3 w-3 animate-spin" />
											Redirecting to Stripe...
										{:else}
											Connect with Stripe
										{/if}
									</button>
									<div class="alert-warning rounded-lg p-2 max-w-fit">
										<p class="text-xs">
											<strong>Important:</strong> Once you start payment setup, your country ({currentCountryInfo?.name || 'selected country'}) will be permanently locked and cannot be changed
										</p>
									</div>
									<p class="text-xs" style="color: var(--text-tertiary);">
										Wrong country? <a href="/profile" class="underline">Update in Profile</a> before continuing
									</p>
								</div>
							{/if}
								</div>
							</div>
						{:else}
							<div
								class="flex items-start gap-4 rounded-lg p-4 alert-success"
							>
								<div
									class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white"
								>
									<CheckCircle class="h-4 w-4" style="color: var(--color-success-600);" />
								</div>
								<div class="flex-1">
									<h3 class="text-sm font-semibold">
										Payment account connected
									</h3>
									<p class="text-sm">
										You're ready to accept payments from customers.
									</p>
								</div>
							</div>
						{/if}
					{/if}

					<!-- Create First Tour Step (Always visible) -->
					{#if stats.totalTours === 0}
						<div
							class="flex items-start gap-4 rounded-lg p-4 transition-all {needsEmailVerification ||
							!paymentStatus.isSetup ||
							needsConfirmation
								? 'opacity-50'
								: ''}"
							style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
						>
							<div
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
								style="background: var(--bg-tertiary); color: var(--text-secondary);"
							>
								<Plus class="h-4 w-4" />
							</div>
							<div class="flex-1">
								<h3 class="mb-1 text-sm font-semibold" style="color: var(--text-primary);">
									Create your first tour
								</h3>
								<p class="mb-4 text-sm" style="color: var(--text-secondary);">
									Set up your first tour listing to start accepting bookings from customers.
								</p>
								{#if needsEmailVerification || !paymentStatus.isSetup || needsConfirmation}
									<p class="text-xs" style="color: var(--text-tertiary);">
										Complete the previous steps to unlock
									</p>
								{:else}
									<button onclick={() => goto('/tours/new')} class="button-primary button--small">
										Create Tour
									</button>
								{/if}
							</div>
						</div>
					{:else}
						<div
							class="flex items-start gap-4 rounded-lg p-4 alert-success"
						>
							<div
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white"
							>
								<CheckCircle class="h-4 w-4" style="color: var(--color-success-600);" />
							</div>
							<div class="flex-1">
								<h3 class="text-sm font-semibold">
									Tour created
								</h3>
								<p class="text-sm">
									You have {stats.totalTours} active {stats.totalTours === 1 ? 'tour' : 'tours'}.
								</p>
							</div>
						</div>
					{/if}
				</div>

				<!-- Get Started Section -->
				{#if !needsEmailVerification && paymentStatus.isSetup && !needsConfirmation && stats.totalTours > 0}
					<div class="mt-8 rounded-lg p-6 text-center" style="background: var(--bg-secondary);">
						<CheckCircle class="mx-auto mb-4 h-12 w-12" style="color: var(--color-success-600);" />
						<h3 class="mb-2 text-lg font-semibold" style="color: var(--text-primary);">
							You're all set!
						</h3>
						<p class="mb-6 text-sm" style="color: var(--text-secondary);">
							Your account is fully configured and you have active tours.
						</p>
						<button onclick={() => goto('/tours')} class="button-primary button--gap">
							<MapPin class="h-4 w-4" />
							Manage Tours
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Help Section -->
		<div
			class="rounded-lg p-4"
			style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
		>
			<div class="flex items-start gap-3">
				<AlertCircle class="mt-0.5 h-5 w-5" style="color: var(--text-tertiary);" />
				<div>
					<h4 class="mb-1 text-sm font-medium" style="color: var(--text-primary);">Need help?</h4>
					<p class="text-sm" style="color: var(--text-secondary);">
						If you have any questions or issues during setup, please <a
							href="/help"
							class="underline">contact our support team</a
						>.
					</p>
				</div>
			</div>
		</div>
	{:else}
		<!-- Regular Dashboard for Users with Tours -->

		<!-- Header Section -->
		<div class="mb-6 sm:mb-8">
			<!-- Mobile Header -->
			<MobilePageHeader
				title="Welcome back"
				secondaryInfo={profile?.name || 'Tour Guide'}
				quickActions={[
					{
						label: 'Create Tour',
						icon: Plus,
						onclick: () => goto('/tours/new'),
						variant: 'primary'
					}
				]}
				infoItems={[
					{
						icon: Calendar,
						label: 'Today',
						value: `${stats.todayBookings} bookings`
					},
					{
						icon: DollarSign,
						label: 'Week',
						value: $globalCurrencyFormatter(stats.weeklyRevenue)
					},
					{
						icon: TrendingUp,
						label: 'Upcoming',
						value: `${stats.upcomingTours}`
					},
					{
						icon: Users,
						label: 'Customers',
						value: `${stats.totalCustomers}`
					}
				]}
			/>
			
			<!-- Desktop Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title={`Welcome back, ${profile?.name || 'Tour Guide'}`}
					subtitle={new Date().toLocaleDateString('en-US', {
						weekday: 'long',
						month: 'long',
						day: 'numeric',
						year: 'numeric'
					})}
				/>
			</div>
		</div>

		<!-- Important Notices (Collapsed into single row when possible) -->
		{#if needsEmailVerification || !paymentStatus.isSetup || needsConfirmation}
			<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#if needsEmailVerification}
					<div
						class="flex items-start gap-3 rounded-lg p-4"
						style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
					>
						<Mail class="mt-0.5 h-4 w-4" style="color: var(--text-tertiary);" />
						<div class="min-w-0 flex-1">
							<h3 class="mb-0.5 text-xs font-medium" style="color: var(--text-primary);">
								Verify email
							</h3>
							<p class="text-xs" style="color: var(--text-secondary);">
								Check {profile?.email}
							</p>
						</div>
						<button
							onclick={resendVerificationEmail}
							disabled={resendingEmail}
							class="button-secondary button--small px-2 py-1 text-xs"
						>
							Resend
						</button>
					</div>
				{/if}

				{#if needsConfirmation}
					<div
						class="flex items-start gap-3 rounded-lg p-4"
						style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
					>
						<Globe class="mt-0.5 h-4 w-4" style="color: var(--text-tertiary);" />
						<div class="min-w-0 flex-1">
							<h3 class="mb-0.5 text-xs font-medium" style="color: var(--text-primary);">
								Confirm location
							</h3>
							<div class="relative mt-1">
								<button
									onclick={() => (showCountryDropdown = !showCountryDropdown)}
									class="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs"
									style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
								>
									<div class="flex items-center gap-1.5">
										{#if currentCountryInfo}
											<span>{currentCountryInfo.flag}</span>
											<span style="color: var(--text-primary);">
												{currentCountryInfo.name}
											</span>
											<span style="color: var(--text-tertiary);">•</span>
											<span style="color: var(--text-secondary);">
												{selectedCurrency}
											</span>
										{:else}
											<span style="color: var(--text-secondary);">
												Select country
											</span>
										{/if}
									</div>
									<svg
										class="h-3 w-3 transition-transform {showCountryDropdown ? 'rotate-180' : ''}"
										style="color: var(--text-tertiary);"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										/>
									</svg>
								</button>

								{#if showCountryDropdown}
									<div
										class="absolute z-50 mt-1 w-full overflow-hidden rounded-lg shadow-lg"
										style="background: var(--bg-primary); border: 1px solid var(--border-primary); max-height: 12rem;"
									>
										<div class="overflow-y-auto" style="max-height: 12rem;">
											{#each COUNTRY_LIST as country}
												<button
													onclick={async () => {
														onCountryChange(country.code);
														showCountryDropdown = false;
														await saveCurrencySelection();
													}}
													class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
													style="color: var(--text-primary);"
												>
													<span>{country.flag}</span>
													<span>{country.name}</span>
													{#if selectedCountry === country.code}
														<CheckCircle
															class="ml-auto h-3 w-3"
															style="color: var(--color-primary-600);"
														/>
													{/if}
												</button>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{:else if profile?.stripeAccountId && !hasConfirmedLocation}
					<div
						class="flex items-start gap-3 rounded-lg p-4"
						style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
					>
						<Globe class="mt-0.5 h-4 w-4" style="color: var(--text-tertiary);" />
						<div class="min-w-0 flex-1">
							<h3 class="mb-0.5 text-xs font-medium" style="color: var(--text-primary);">
								Location locked
							</h3>
							<div class="flex items-center gap-1.5 text-xs">
								{#if currentCountryInfo}
									<span>{currentCountryInfo.flag}</span>
									<span style="color: var(--text-primary);">
										{currentCountryInfo.name}
									</span>
									<span style="color: var(--text-tertiary);">•</span>
									<span style="color: var(--text-secondary);">
										{profile?.currency || 'EUR'}
									</span>
								{/if}
							</div>
							<p class="text-[10px] mt-1" style="color: var(--text-tertiary);">
								Country fixed after payment setup
							</p>
						</div>
					</div>
				{/if}

				{#if !paymentStatus.loading && !paymentStatus.isSetup}
					<div
						class="rounded-lg p-4"
						style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
					>
						<div class="flex items-start gap-3">
							<CreditCard class="mt-0.5 h-4 w-4" style="color: var(--text-tertiary);" />
							<div class="min-w-0 flex-1">
								<h3 class="mb-0.5 text-xs font-medium" style="color: var(--text-primary);">
									Payment setup
								</h3>
								<p class="text-xs" style="color: var(--text-secondary);">
									{#if needsConfirmation}
										Confirm location first
									{:else}
										Connect bank account
									{/if}
								</p>
							</div>
							{#if needsConfirmation}
								<span class="text-xs" style="color: var(--text-tertiary);">
									<AlertCircle class="inline h-3 w-3" />
								</span>
							{:else}
								<button
									onclick={setupPayments}
									disabled={isSettingUpPayment}
									class="button-primary button--small px-2 py-1 text-xs"
								>
									{#if isSettingUpPayment}
										<Loader2 class="h-3 w-3 animate-spin" />
									{:else}
										Setup
									{/if}
								</button>
							{/if}
						</div>
						{#if !needsConfirmation && currentCountryInfo && !profile?.stripeAccountId}
							<div class="mt-2 rounded p-1.5 max-w-fit" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
								<p class="text-[10px]" style="color: var(--color-warning-700);">
									Country: {currentCountryInfo.name} (will be permanent)
								</p>
							</div>
						{/if}
						{#if saveError && !needsConfirmation}
							<div class="mt-2 rounded p-1.5" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
								<p class="text-[10px]" style="color: var(--color-error-700);">
									{saveError}
								</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Performance Overview -->
		<div class="mb-6">
			<h2 class="mb-4 text-lg font-semibold" style="color: var(--text-primary);">
				Performance Overview
			</h2>
			<!-- Mobile: Ultra-compact 2x2 grid -->
			<div class="grid grid-cols-2 gap-2 sm:hidden">
				<div
					class="rounded-lg p-3"
					style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
				>
					<div class="mb-1 flex items-center justify-between">
						<Calendar class="h-3.5 w-3.5" style="color: var(--text-tertiary);" />
						<span class="text-[10px] tracking-wide uppercase" style="color: var(--text-tertiary);"
							>Today</span
						>
					</div>
					<p class="text-base font-bold" style="color: var(--text-primary);">
						{stats.todayBookings}
					</p>
					<p class="text-[10px]" style="color: var(--text-tertiary);">
						{stats.todayBookings === 1 ? 'booking' : 'bookings'}
					</p>
				</div>
				<div
					class="rounded-lg p-3"
					style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
				>
					<div class="mb-1 flex items-center justify-between">
						<DollarSign class="h-3.5 w-3.5" style="color: var(--text-tertiary);" />
						<span class="text-[10px] tracking-wide uppercase" style="color: var(--text-tertiary);"
							>Week</span
						>
					</div>
					<p class="text-base font-bold" style="color: var(--text-primary);">
						{$globalCurrencyFormatter(stats.weeklyRevenue)}
					</p>
					<p class="text-[10px]" style="color: var(--text-tertiary);">revenue</p>
				</div>
				<div
					class="rounded-lg p-3"
					style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
				>
					<div class="mb-1 flex items-center justify-between">
						<TrendingUp class="h-3.5 w-3.5" style="color: var(--text-tertiary);" />
						<span class="text-[10px] tracking-wide uppercase" style="color: var(--text-tertiary);"
							>Next 7d</span
						>
					</div>
					<p class="text-base font-bold" style="color: var(--text-primary);">
						{stats.upcomingTours}
					</p>
					<p class="text-[10px]" style="color: var(--text-tertiary);">upcoming</p>
				</div>
				<div
					class="rounded-lg p-3"
					style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
				>
					<div class="mb-1 flex items-center justify-between">
						<Users class="h-3.5 w-3.5" style="color: var(--text-tertiary);" />
						<span class="text-[10px] tracking-wide uppercase" style="color: var(--text-tertiary);"
							>Total</span
						>
					</div>
					<p class="text-base font-bold" style="color: var(--text-primary);">
						{stats.totalCustomers}
					</p>
					<p class="text-[10px]" style="color: var(--text-tertiary);">customers</p>
				</div>
			</div>

			<!-- Desktop: StatsCard components -->
			<div class="hidden gap-3 sm:grid sm:grid-cols-4">
				<StatsCard
					title="Today"
					value={stats.todayBookings}
					subtitle={stats.todayBookings === 1 ? 'booking' : 'bookings'}
					icon={Calendar}
					variant="small"
				/>
				<StatsCard
					title="This Week"
					value={$globalCurrencyFormatter(stats.weeklyRevenue)}
					subtitle="revenue"
					icon={DollarSign}
					variant="small"
				/>
				<StatsCard
					title="Next 7 Days"
					value={stats.upcomingTours}
					subtitle="upcoming tours"
					icon={TrendingUp}
					variant="small"
				/>
				<StatsCard
					title="Total Customers"
					value={stats.totalCustomers}
					subtitle="all time"
					icon={Users}
					variant="small"
				/>
			</div>
		</div>

		<!-- Today's Activity -->
		<div class="mb-8">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Today's Activity</h2>
				<div class="flex items-center gap-2">
					{#if todaysSchedule.length > 0}
						<button
							onclick={() => goto('/checkin-scanner')}
							class="button-primary button--small button--gap"
						>
							<QrCode class="h-3 w-3" />
							<span class="hidden sm:inline">Scanner</span>
						</button>
					{/if}
					<button
						onclick={() => goto('/analytics')}
						class="button-secondary button--small button--gap"
					>
						<TrendingUp class="h-3 w-3" />
						<span class="hidden sm:inline">Analytics</span>
					</button>
				</div>
			</div>

			<!-- Today's Schedule -->
			{#if todaysSchedule.length > 0}
				<div
					class="rounded-lg"
					style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
				>
					<div class="border-b p-4" style="border-color: var(--border-primary);">
						<div class="flex items-center justify-between">
							<h3 class="text-sm font-medium" style="color: var(--text-primary);">
								Today's Schedule
							</h3>
							<div class="flex items-center gap-2 text-xs" style="color: var(--text-tertiary);">
								<Users class="h-3 w-3" />
								{todaysSchedule.reduce((sum: number, s: any) => sum + (s.participants || 0), 0)} total
								guests
							</div>
						</div>
					</div>
					<div class="divide-y" style="border-color: var(--border-primary);">
						{#each todaysSchedule as schedule}
							<div class="flex items-center justify-between p-4">
								<div class="min-w-0 flex-1">
									<div class="mb-1 flex items-center gap-2">
										<span class="text-sm font-medium" style="color: var(--text-primary);">
											{#if schedule.timeSlot?.startTime && schedule.timeSlot?.endTime}
												{formatSlotTimeRange(
													schedule.timeSlot.startTime,
													schedule.timeSlot.endTime
												)}
											{:else}
												{formatDate(schedule.time)}
											{/if}
										</span>
										<span
											class="rounded-full px-2 py-0.5 text-xs {getStatusColor(schedule.status)}"
										>
											{schedule.status}
										</span>
									</div>
									<p class="text-xs" style="color: var(--text-secondary);">
										{schedule.tourName} • {schedule.participants || 0} guests
										{#if schedule.customerName}
											• {schedule.customerName}
										{/if}
									</p>
								</div>
								<div class="flex items-center gap-1">
									<button
										onclick={() => goto(`/bookings/${schedule.id}`)}
										class="button-secondary button--small button--icon"
									>
										<ArrowRight class="h-3 w-3" />
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div
					class="rounded-lg p-8 text-center"
					style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
				>
					<Calendar class="mx-auto mb-3 h-8 w-8" style="color: var(--text-tertiary);" />
					<p class="mb-1 text-sm" style="color: var(--text-primary);">No tours scheduled today</p>
					<p class="text-xs" style="color: var(--text-secondary);">Enjoy your day off!</p>
				</div>
			{/if}
		</div>

		<!-- Quick Actions & Recent Activity -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Recent Bookings -->
			<div class="lg:col-span-2">
				<div
					class="rounded-lg"
					style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
				>
					<div
						class="flex items-center justify-between border-b p-4"
						style="border-color: var(--border-primary);"
					>
						<h3 class="text-sm font-medium" style="color: var(--text-primary);">Recent Bookings</h3>
						<button
							onclick={() => goto('/bookings')}
							class="text-xs hover:underline"
							style="color: var(--text-tertiary);"
						>
							View all
						</button>
					</div>

					<div class="divide-y" style="border-color: var(--border-primary);">
						{#if recentBookings.length > 0}
							{#each recentBookings.slice(0, 4) as booking}
								{@const BookingIcon = getBookingStatusIcon(booking.status)}
								{@const PaymentIcon = getPaymentStatusIcon(booking.paymentStatus || 'pending')}
								<div class="p-4">
									<div class="flex items-start justify-between">
										<div class="min-w-0 flex-1">
											<div class="mb-1 flex items-center gap-2">
												<span class="text-sm font-medium" style="color: var(--text-primary);">
													{booking.customerName}
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
												{booking.tourName || booking.tour || 'Unknown Tour'} • {formatDate(
													booking.effectiveDate || booking.created
												)}
											</p>
											<p class="mt-1 text-xs" style="color: var(--text-tertiary);">
												{formatParticipantDisplayCompact(booking)} guests • {$globalCurrencyFormatter(
													booking.totalAmount || 0
												)}
											</p>
										</div>
										<button
											onclick={() => goto(`/bookings/${booking.id}`)}
											class="button-secondary button--small button--icon ml-3"
										>
											<ArrowRight class="h-3 w-3" />
										</button>
									</div>
								</div>
							{/each}
						{:else}
							<div class="p-8 text-center">
								<Calendar class="mx-auto mb-2 h-6 w-6" style="color: var(--text-tertiary);" />
								<p class="text-sm" style="color: var(--text-secondary);">No bookings yet</p>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Quick Actions Sidebar -->
			<div class="space-y-4">
				<!-- Profile Link -->
				{#if profile?.username}
					<div
						class="rounded-lg p-4"
						style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
					>
						<div class="mb-3 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<Link class="h-4 w-4" style="color: var(--text-tertiary);" />
								<h3 class="text-sm font-medium" style="color: var(--text-primary);">
									Your Profile
								</h3>
							</div>
							<button
								onclick={copyProfileLink}
								class="button-secondary button--small button--icon"
								title={profileLinkCopied ? 'Copied!' : 'Copy link'}
							>
								{#if profileLinkCopied}
									<CheckCircle class="h-3 w-3" />
								{:else}
									<Copy class="h-3 w-3" />
								{/if}
							</button>
						</div>
						<p class="mb-3 text-xs" style="color: var(--text-secondary);">
							zaur.app/{profile.username}
						</p>
						<button
							onclick={() => window.open(`/${profile?.username}`, '_blank')}
							class="button-secondary button--small button--gap w-full"
						>
							<ExternalLink class="h-3 w-3" />
							View Profile
						</button>
					</div>
				{/if}

				<!-- Quick Actions -->
				<div
					class="rounded-lg p-4"
					style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
				>
					<h3 class="mb-3 text-sm font-medium" style="color: var(--text-primary);">
						Quick Actions
					</h3>
					<div class="space-y-2">
						<button
							onclick={() => goto('/tours/new')}
							class="button-primary button--small button--gap w-full"
						>
							<Plus class="h-3 w-3" />
							Create Tour
						</button>
						<button
							onclick={() => goto('/tours')}
							class="button-secondary button--small button--gap w-full"
						>
							<MapPin class="h-3 w-3" />
							Manage Tours
						</button>
						{#if isApproachingLimits()}
							<button
								onclick={() => goto('/subscription')}
								class="button-secondary button--small button--gap w-full"
								style="border-color: var(--color-warning-200); color: var(--color-warning-600);"
							>
								<Crown class="h-3 w-3" />
								Upgrade Plan
							</button>
						{/if}
					</div>
				</div>
			</div>
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
</style>

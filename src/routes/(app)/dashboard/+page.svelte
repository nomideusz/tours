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

	// TanStack Query for dashboard data - configured for live updates
	const dashboardStatsQuery = createQuery({
			queryKey: queryKeys.dashboardStats,
			queryFn: () => queryFunctions.fetchDashboardStats(),
			staleTime: 0, // Always consider data potentially stale for immediate updates
			gcTime: 2 * 60 * 1000, // 2 minutes garbage collection
			refetchOnWindowFocus: true, // Enable window focus refetching for live updates
			refetchOnMount: 'always', // Always refetch on mount
			enabled: true, // Always enabled - queryFn checks for browser
			retry: 1, // Reduce retries
			retryDelay: 2000, // Simple 2 second delay
			meta: {
				errorMessage: 'Failed to load dashboard statistics'
			}
	});

	const recentBookingsQuery = createQuery({
		queryKey: queryKeys.recentBookings(10),
		queryFn: () => queryFunctions.fetchRecentBookings(10),
		staleTime: 0, // Always consider data potentially stale for immediate updates
		gcTime: 2 * 60 * 1000, // 2 minutes garbage collection
		refetchOnWindowFocus: true, // Enable window focus refetching for live updates
		refetchOnMount: 'always', // Always refetch on mount
		enabled: true, // Always enabled - queryFn checks for browser
		retry: 1, // Reduce retries
		retryDelay: 2000, // Simple 2 second delay
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
		console.log('🏠 Dashboard mounted');
		console.log('📊 Dashboard stats query state:', {
			isLoading: $dashboardStatsQuery.isLoading,
			isError: $dashboardStatsQuery.isError,
			data: $dashboardStatsQuery.data
		});
		console.log('📚 Recent bookings query state:', {
			isLoading: $recentBookingsQuery.isLoading,
			isError: $recentBookingsQuery.isError,
			data: $recentBookingsQuery.data
		});
		
		// Force refetch both queries only if they haven't loaded yet
		if (!$dashboardStatsQuery.data && !$dashboardStatsQuery.isLoading) {
			$dashboardStatsQuery.refetch();
		}
		if (!$recentBookingsQuery.data && !$recentBookingsQuery.isLoading) {
			$recentBookingsQuery.refetch();
		}
		
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
		
		// Also consider location confirmed if user has explicitly set country in profile
		// This handles the case where users set location in profile page before payment setup
		if (profile && profile.country && profile.currency && !hasConfirmedLocation) {
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
	
	// Debug loading state
	$effect(() => {
		console.log('🔍 Dashboard loading state:', {
			isLoading,
			isError,
			browser,
			dashboardQueryEnabled: browser,
			recentBookingsQueryEnabled: browser
		});
	});

	// Check if this is a new user - only after data has loaded
	let isNewUser = $derived(!isLoading && stats.totalTours === 0);
	
	// Debug query states
	$effect(() => {
		if ($dashboardStatsQuery.isLoading) {
			console.log('⏳ Dashboard stats loading...');
		}
		if ($dashboardStatsQuery.isError) {
			console.error('❌ Dashboard stats error:', $dashboardStatsQuery.error);
		}
		if ($dashboardStatsQuery.data) {
			console.log('✅ Dashboard stats loaded:', $dashboardStatsQuery.data);
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

	// Calculate completed setup steps - only for new users
	let stepsCompleted = $derived(
		(!needsEmailVerification ? 1 : 0) +
			(paymentStatus.isSetup ? 1 : 0) +
			(!needsConfirmation ? 1 : 0)
	);

	// Check if all onboarding steps are complete
	let isOnboardingComplete = $derived(
		!needsEmailVerification && 
		!needsConfirmation && 
		paymentStatus.isSetup && 
		stats.totalTours > 0
	);
	
	// Show onboarding until ALL steps are complete
	let showOnboarding = $derived(
		!isLoading && 
		!paymentStatus.loading && 
		!isOnboardingComplete &&
		$dashboardStatsQuery.data !== undefined
	);
	
	// Show compact onboarding if user has tours but onboarding incomplete
	let showCompactOnboarding = $derived(
		showOnboarding && stats.totalTours > 0
	);
	
	// Hide dashboard content until first tour is created
	let showDashboardContent = $derived(
		!isLoading && stats.totalTours > 0
	);
	
	// Debug onboarding logic (remove when ready)
	// $effect(() => {
	// 	console.log('🔍 Onboarding Debug:', {
	// 		isLoading,
	// 		paymentStatusLoading: paymentStatus.loading,
	// 		needsEmailVerification,
	// 		needsConfirmation,
	// 		paymentSetup: paymentStatus.isSetup,
	// 		statsTotalTours: stats.totalTours,
	// 		isOnboardingComplete,
	// 		showOnboarding,
	// 		showCompactOnboarding,
	// 		showDashboardContent
	// 	});
	// });

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
				currencyExpanded = false; // Close the modal

				// Save confirmation to localStorage
				localStorage.setItem('locationConfirmed', 'true');

				// Scroll to top to show success message (important for mobile)
				if (browser) {
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}

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

		// Show success message and scroll to top
		saveSuccess = true;
		hasConfirmedLocation = true;
		
		// Scroll to top to show success message (important for mobile)
		if (browser) {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}

		// Collapse currency section
		currencyExpanded = false;

		// Clear loading state
		countryToUpdate = null;
		isUpdatingCountry[country] = false;

		// Hide success message after 5 seconds
		const timeoutId = setTimeout(() => {
			saveSuccess = false;
		}, 5000);
		successTimeouts.push(timeoutId);
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

	// Timeline view state - default to day view for operations focus
	let timelineView = $state<'day' | 'week' | 'month'>('day');
	let timelineCurrentDate = $state(new Date());
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
			title={isLoading ? "Dashboard" : (isNewUser ? "Welcome to Zaur!" : "Dashboard")}
			secondaryInfo={isLoading ? "Loading..." : (isNewUser ? "Account Setup Required" : "")}
			quickActions={[
				{
					label: 'Create Tour',
					icon: Plus,
					onclick: () => goto('/tours/new'),
					variant: 'primary'
				}
			]}
		/>
			
			<!-- Desktop Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title={isLoading ? "Dashboard" : (isNewUser ? "Welcome to Zaur!" : "Dashboard")}
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
		{#if showOnboarding}
			<!-- Show onboarding until all steps complete -->
			<div class="compact-onboarding mb-8 {showCompactOnboarding ? 'compact-onboarding--compact' : ''}">
				<div class="compact-onboarding-header">
					<h2 class="compact-onboarding-title">
						{showCompactOnboarding ? 'Complete Setup' : 'Account Setup'}
					</h2>
					<p class="compact-onboarding-description">
						{showCompactOnboarding 
							? 'Finish these remaining steps to complete your setup'
							: 'Complete these essential steps to begin accepting bookings'}
					</p>
				</div>

				<div class="compact-onboarding-steps">
					<!-- Essential Steps -->
					<div class="compact-onboarding-grid">
						{#if needsEmailVerification}
							<div class="compact-step">
								<div class="compact-step-header">
									<Mail class="compact-step-icon" />
									<span class="compact-step-title">Verify Email</span>
								</div>
								<p class="compact-step-description">Check your inbox and click the verification link</p>
								<button 
									onclick={resendVerificationEmail}
									disabled={resendingEmail}
									class="compact-step-button"
								>
									{#if resendingEmail}
										<Loader2 class="h-4 w-4 animate-spin" />
										Sending...
									{:else}
										Resend Email
									{/if}
								</button>
								{#if resendEmailSuccess}
									<p class="compact-step-success">✓ Email sent! Check your inbox.</p>
								{/if}
								{#if resendEmailError}
									<p class="compact-step-error">{resendEmailError}</p>
								{/if}
							</div>
						{/if}

						{#if needsConfirmation}
							<div class="compact-step">
								<div class="compact-step-header">
									<Globe class="compact-step-icon" />
									<span class="compact-step-title">Confirm Location</span>
								</div>
								<p class="compact-step-description">Set your business location for payments</p>
								<button 
									onclick={() => { currencyExpanded = true; }}
									class="compact-step-button"
								>
									Set Location
								</button>
							</div>
						{/if}

						{#if !paymentStatus.isSetup}
							<div class="compact-step">
								<div class="compact-step-header">
									<CreditCard class="compact-step-icon" />
									<span class="compact-step-title">Setup Payments</span>
								</div>
								<p class="compact-step-description">Connect your payment account to receive money</p>
								<button 
									onclick={setupPayments}
									disabled={isSettingUpPayment || needsConfirmation}
									class="compact-step-button {needsConfirmation ? 'opacity-50' : ''}"
								>
									{#if isSettingUpPayment}
										<Loader2 class="h-4 w-4 animate-spin" />
										Setting up...
									{:else if needsConfirmation}
										Confirm location first
									{:else}
										Setup Payments
									{/if}
								</button>
							</div>
						{/if}
					</div>

					<!-- Main Action - only show if no tours created yet -->
					{#if !showCompactOnboarding}
						<div class="compact-onboarding-main-action">
							<button 
								onclick={() => goto('/tours/new')}
								class="compact-main-button"
							>
								<Plus class="h-5 w-5" />
								Create Your First Tour
							</button>
							<p class="compact-main-description">
								Begin accepting bookings for your business
							</p>
						</div>
					{/if}
				</div>

				<!-- Progress indicator -->
				<div class="compact-progress">
					<div class="compact-progress-text">
						{#if showCompactOnboarding}
							{stepsCompleted + (stats.totalTours > 0 ? 1 : 0)}/4 steps complete
						{:else}
							{stepsCompleted + (stats.totalTours > 0 ? 1 : 0)}/4 setup steps complete
						{/if}
					</div>
					<div class="compact-progress-bar">
						<div 
							class="compact-progress-fill"
							style="width: {showCompactOnboarding 
								? ((stepsCompleted + (stats.totalTours > 0 ? 1 : 0)) / 4) * 100 
								: ((stepsCompleted + (stats.totalTours > 0 ? 1 : 0)) / 4) * 100}%;"
						></div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Location Confirmation Modal -->
		{#if showOnboarding && needsConfirmation && currencyExpanded}
			<div class="compact-location-modal">
				<div class="compact-location-backdrop" 
					onclick={() => { currencyExpanded = false; resetSelections(); }}
					onkeydown={(e) => { if (e.key === 'Escape') { currencyExpanded = false; resetSelections(); } }}
					role="button" 
					tabindex="0"
				></div>
				<div class="compact-location-content">
					<h3 class="compact-location-title">
						Confirm Your Business Location
					</h3>
					<p class="compact-location-description">
						This determines your payment currency and cannot be changed after payment setup begins.
					</p>
					
					{#if saveError}
						<div class="alert-error mb-4 rounded-lg p-3">
							<p class="text-sm">{saveError}</p>
						</div>
					{/if}
					
					<div class="compact-country-grid">
						{#each COUNTRY_LIST as country}
							<button
								onclick={() => onCountryChange(country.code)}
								class="compact-country-option {selectedCountry === country.code ? 'compact-country-option--selected' : ''}"
							>
								<span class="compact-country-flag">{country.flag}</span>
								<div class="compact-country-info">
									<p class="compact-country-name">{country.name}</p>
									<p class="compact-country-currency">{country.currency}</p>
								</div>
								{#if selectedCountry === country.code}
									<CheckCircle class="h-4 w-4 compact-country-check" />
								{/if}
							</button>
						{/each}
					</div>
					
					{#if selectedCountry}
						{@const countryInfo = getCountryInfo(selectedCountry)}
						<div class="compact-country-selected">
							<p class="compact-country-selected-text">
								✓ Selected: {countryInfo?.flag} {countryInfo?.name} • Currency: <strong>{countryInfo?.currency}</strong>
							</p>
						</div>
					{/if}
					
					<div class="compact-location-actions">
						<button
							onclick={saveCurrencySelection}
							disabled={!selectedCountry || savingCurrency}
							class="compact-location-confirm {!selectedCountry || savingCurrency ? 'opacity-50' : ''}"
						>
							{#if savingCurrency}
								<Loader2 class="h-4 w-4 animate-spin" />
							{:else}
								Confirm Location
							{/if}
						</button>
						<button
							onclick={() => { currencyExpanded = false; resetSelections(); }}
							class="compact-location-cancel"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Message when no tours created yet -->
		{#if !showDashboardContent && !isLoading}
			<div class="no-content-message">
				<div class="no-content-icon">
					<MapPin class="h-12 w-12" />
				</div>
				<h3 class="no-content-title">Ready to Start Your Tour Business?</h3>
				<p class="no-content-description">
					Create your first tour to unlock your dashboard and start accepting bookings from customers.
				</p>
			</div>
		{/if}

		<!-- Dashboard Content - Only show after first tour is created -->
		{#if showDashboardContent}
			<!-- Tour Timeline - Main Feature -->
			<div class="mb-8">
				<div class="timeline-container">
									<TourTimeline 
					bind:view={timelineView}
					bind:currentDate={timelineCurrentDate}
					onSlotClick={(slot) => {
						// Navigate to tour details page when clicking a slot
						// On mobile, go directly to schedule tab
						if (window.innerWidth < 768) {
							goto(`/tours/${slot.tourId}?tab=schedule`);
						} else {
							goto(`/tours/${slot.tourId}`);
						}
					}}
				/>
				</div>
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
	
	/* Timeline container - prevent layout jumps during navigation */
	.timeline-container {
		min-height: 400px; /* Minimum height to prevent collapse */
		transition: all 0.2s ease-out; /* Smooth transitions */
		position: relative;
	}
	
	/* Ensure timeline content doesn't cause layout shifts */
	.timeline-container :global(.timeline-content) {
		width: 100%;
		min-height: inherit;
	}
	
	/* Hide any loading states that might cause jumps */
	.timeline-container :global(.loading-spinner) {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 10;
	}
	
	/* Ensure smooth height transitions on different screen sizes */
	@media (max-width: 640px) {
		.timeline-container {
			min-height: 300px; /* Smaller minimum on mobile */
		}
	}
	
	@media (min-width: 1024px) {
		.timeline-container {
			min-height: 450px; /* Larger minimum on desktop */
		}
	}
	
	/* Compact Onboarding Styles */
	.compact-onboarding {
		background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%);
		border: 1px solid var(--color-primary-200);
		border-radius: 1rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}
	
	/* Compact variant for when user has tours but setup incomplete */
	.compact-onboarding--compact {
		background: var(--bg-secondary);
		border: 1px solid var(--border-secondary);
		padding: 1rem;
		margin-bottom: 1.5rem;
	}
	
	.compact-onboarding--compact .compact-onboarding-header {
		margin-bottom: 1rem;
	}
	
	.compact-onboarding--compact .compact-onboarding-title {
		font-size: 1.25rem;
	}
	
	.compact-onboarding--compact .compact-onboarding-grid {
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.75rem;
	}
	
	.compact-onboarding--compact .compact-step {
		padding: 0.75rem;
	}
	
	.compact-onboarding--compact .compact-progress {
		margin-top: 1rem;
	}
	
	/* No content message styles */
	.no-content-message {
		text-align: center;
		padding: 3rem 1.5rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		margin-bottom: 2rem;
	}
	
	.no-content-icon {
		color: var(--text-tertiary);
		margin-bottom: 1rem;
		display: flex;
		justify-content: center;
	}
	
	.no-content-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.no-content-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin: 0;
		max-width: 400px;
		margin-left: auto;
		margin-right: auto;
	}
	
	.compact-onboarding-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}
	
	.compact-onboarding-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.compact-onboarding-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	.compact-onboarding-steps {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.compact-onboarding-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
	}
	
	.compact-step {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		text-align: center;
		transition: all 0.2s ease;
	}
	
	.compact-step:hover {
		border-color: var(--color-primary-300);
		box-shadow: var(--shadow-sm);
	}
	
	.compact-step-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	
	.compact-step-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--color-primary-600);
	}
	
	.compact-step-title {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.875rem;
	}
	
	.compact-step-description {
		color: var(--text-secondary);
		font-size: 0.75rem;
		margin-bottom: 0.75rem;
		line-height: 1.4;
	}
	
	.compact-step-button {
		background: var(--color-primary-600);
		color: white;
		border: none;
		border-radius: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: center;
		width: 100%;
	}
	
	.compact-step-button:hover:not(:disabled) {
		background: var(--color-primary-700);
		transform: translateY(-1px);
	}
	
	.compact-step-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.compact-step-success {
		color: var(--color-success-600);
		font-size: 0.75rem;
		margin-top: 0.5rem;
		font-weight: 500;
	}
	
	.compact-step-error {
		color: var(--color-danger-600);
		font-size: 0.75rem;
		margin-top: 0.5rem;
	}
	
	.compact-onboarding-main-action {
		text-align: center;
		padding: 1rem;
		background: var(--bg-primary);
		border: 2px dashed var(--color-primary-300);
		border-radius: 0.75rem;
		margin-top: 0.5rem;
	}
	
	.compact-main-button {
		background: var(--color-primary-600);
		color: white;
		border: none;
		border-radius: 0.75rem;
		padding: 1rem 2rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: center;
		margin: 0 auto 0.5rem;
		box-shadow: var(--shadow-sm);
	}
	
	.compact-main-button:hover {
		background: var(--color-primary-700);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
	
	.compact-main-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin: 0;
	}
	
	.compact-progress {
		text-align: center;
		margin-top: 1.5rem;
	}
	
	.compact-progress-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
	}
	
	.compact-progress-bar {
		width: 100%;
		height: 6px;
		background: var(--color-primary-100);
		border-radius: 3px;
		overflow: hidden;
	}
	
	.compact-progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600));
		transition: width 0.3s ease;
		border-radius: 3px;
	}
	
	/* Location Modal Styles */
	.compact-location-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}
	
	.compact-location-backdrop {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(2px);
	}
	
	.compact-location-content {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 1.5rem;
		max-width: 600px;
		width: 100%;
		max-height: 80vh;
		overflow-y: auto;
		position: relative;
		box-shadow: var(--shadow-lg);
	}
	
	.compact-location-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
		text-align: center;
	}
	
	.compact-location-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
		text-align: center;
	}
	
	.compact-country-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	
	.compact-country-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
	}
	
	.compact-country-option:hover {
		border-color: var(--color-primary-300);
		background: var(--bg-tertiary);
	}
	
	.compact-country-option--selected {
		border-color: var(--color-primary-500);
		background: var(--color-primary-50);
	}
	
	.compact-country-flag {
		font-size: 1.25rem;
		flex-shrink: 0;
	}
	
	.compact-country-info {
		flex: 1;
		min-width: 0;
	}
	
	.compact-country-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin: 0;
	}
	
	.compact-country-currency {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin: 0;
	}
	
	.compact-country-check {
		color: var(--color-primary-600);
		flex-shrink: 0;
	}
	
	.compact-country-selected {
		background: var(--color-success-50);
		border: 1px solid var(--color-success-200);
		border-radius: 0.5rem;
		padding: 0.75rem;
		margin-bottom: 1.5rem;
	}
	
	.compact-country-selected-text {
		color: var(--color-success-700);
		font-size: 0.875rem;
		margin: 0;
		text-align: center;
	}
	
	.compact-location-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}
	
	.compact-location-confirm {
		background: var(--color-primary-600);
		color: white;
		border: none;
		border-radius: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.compact-location-confirm:hover:not(:disabled) {
		background: var(--color-primary-700);
	}
	
	.compact-location-cancel {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	
	.compact-location-cancel:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-secondary);
	}
	
	/* Mobile Responsive */
	@media (max-width: 768px) {
		.compact-onboarding {
			padding: 1rem;
		}
		
		.compact-onboarding-grid {
			grid-template-columns: 1fr;
		}
		
		.compact-country-grid {
			grid-template-columns: 1fr;
		}
		
		.compact-location-actions {
			flex-direction: column;
		}
		
		.compact-location-confirm,
		.compact-location-cancel {
			width: 100%;
			justify-content: center;
		}
	}
</style>

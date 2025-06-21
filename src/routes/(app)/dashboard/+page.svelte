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
	import { userCurrency, currentCurrencyInfo, SUPPORTED_CURRENCIES, type Currency } from '$lib/stores/currency.js';
	import type { AuthUser } from '$lib/stores/auth.js';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	
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

	let { data }: { data: PageData } = $props();

	// TanStack Query for dashboard data - using profile page pattern (simple, direct)
	const dashboardStatsQuery = createQuery({
		queryKey: queryKeys.dashboardStats,
		queryFn: queryFunctions.fetchDashboardStats,
		staleTime: 0, // Always consider data stale for immediate updates
		gcTime: 5 * 60 * 1000,
		refetchOnWindowFocus: 'always',
		refetchOnMount: 'always',
	});

	const recentBookingsQuery = createQuery({
		queryKey: queryKeys.recentBookings(10),
		queryFn: () => queryFunctions.fetchRecentBookings(10),
		staleTime: 0, // Always consider data stale for immediate updates
		gcTime: 5 * 60 * 1000,
		refetchOnWindowFocus: 'always',
		refetchOnMount: 'always',
	});

	// Get profile from layout data (this stays server-side since it's needed for auth)
	const profile = $derived(data.user as AuthUser | null);
	
	// Check for payment setup completion
	let isPaymentSetupComplete = $state(false);
	
	// Check for email verification completion  
	let isEmailVerificationComplete = $state(false);
	
	// Track if user has explicitly confirmed their location
	let hasConfirmedLocation = $state(false);
	
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
			
			// Auto-dismiss email verification success after 5 seconds
			setTimeout(() => {
				isEmailVerificationComplete = false;
			}, 5000);
		}
		
		// Check if returning from payment setup
		if (urlParams.get('setup') === 'complete') {
			isPaymentSetupComplete = true;
			// Clear the URL parameter
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.delete('setup');
			window.history.replaceState({}, '', newUrl.toString());
			
			// Force refresh payment status
			setTimeout(() => {
				if (profile?.stripeAccountId) {
					checkPaymentStatus();
				}
			}, 1000);
			
			// Auto-dismiss payment setup success after 5 seconds
			setTimeout(() => {
				isPaymentSetupComplete = false;
			}, 5000);
		}
		
		// Check if user has previously confirmed their location (stored in localStorage)
		hasConfirmedLocation = localStorage.getItem('locationConfirmed') === 'true';
		
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
	let stats = $derived($dashboardStatsQuery.data || {
		todayBookings: 0,
		weeklyRevenue: 0,
		upcomingTours: 0,
		totalCustomers: 0,
		totalTours: 0,
		activeTours: 0
	});
	let recentBookings = $derived($recentBookingsQuery.data || []);
	
	// Loading states
	let isLoading = $derived($dashboardStatsQuery.isLoading || $recentBookingsQuery.isLoading);
	let isError = $derived($dashboardStatsQuery.isError || $recentBookingsQuery.isError);
	
	// Check if this is a new user
	let isNewUser = $derived(stats.totalTours === 0);
	
	// Profile link state
	let profileLinkCopied = $state(false);
	
	// Currency confirmation state
	let selectedCurrency = $state<Currency>($userCurrency);
	let selectedCountry = $state(profile?.country || '');
	let savingCurrency = $state(false);
	let saveSuccess = $state(false);
	let saveError = $state<string | null>(null);
	
	// Show expanded selection UI
	let showCurrencySelector = $state(false);
	let showCountryDropdown = $state(false);
	
	// Track if user manually changed currency (different from country default)
	let manualCurrencyOverride = $state(false);
	
	// Country list for the dashboard (simplified)
	const COMMON_COUNTRIES = [
		{ code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' },
		{ code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
		{ code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR' },
		{ code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR' },
		{ code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR' },
		{ code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR' },
		{ code: 'PL', name: 'Poland', flag: '🇵🇱', currency: 'PLN' },
		{ code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY' },
		{ code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD' },
		{ code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD' },
		{ code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF' },
		{ code: 'SE', name: 'Sweden', flag: '🇸🇪', currency: 'SEK' },
		{ code: 'NO', name: 'Norway', flag: '🇳🇴', currency: 'NOK' },
		{ code: 'DK', name: 'Denmark', flag: '🇩🇰', currency: 'DKK' },
		{ code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', currency: 'CZK' },
		{ code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR' },
		{ code: 'BE', name: 'Belgium', flag: '🇧🇪', currency: 'EUR' },
		{ code: 'AT', name: 'Austria', flag: '🇦🇹', currency: 'EUR' },
		{ code: 'PT', name: 'Portugal', flag: '🇵🇹', currency: 'EUR' },
		{ code: 'IE', name: 'Ireland', flag: '🇮🇪', currency: 'EUR' }
	];
	
	// Get current country info
	let currentCountryInfo = $derived(COMMON_COUNTRIES.find(c => c.code === selectedCountry));
	
	// Check if settings need confirmation - show if not explicitly confirmed yet OR if setup just completed
	let needsConfirmation = $derived(browser && profile && (!hasConfirmedLocation || isPaymentSetupComplete));
	
	// Show email verification if email not verified (regardless of tour count)
	let needsEmailVerification = $derived(profile && !profile.emailVerified);
	
	// Check payment status - declare early to avoid reference issues
	let paymentStatus = $state<{ isSetup: boolean; loading: boolean }>({ isSetup: false, loading: true });
	
	// Email resend state
	let resendingEmail = $state(false);
	let resendEmailSuccess = $state(false);
	let resendEmailError = $state<string | null>(null);
	
	// Show success messages
	let showEmailVerificationSuccess = $derived(isEmailVerificationComplete && profile?.emailVerified);
	let showPaymentSetupSuccess = $derived(isPaymentSetupComplete && paymentStatus.isSetup);
	let showLocationSaveSuccess = $derived(saveSuccess);
	
	// Subscription limits check
	let isApproachingLimits = $derived(() => {
		if (!profile || profile.subscriptionPlan !== 'free') return false;
		// Free plan: 2 bookings/month, 1 tour
		const bookingsUsed = profile.monthlyBookingsUsed || 0;
		const toursCreated = stats.totalTours || 0;
		return bookingsUsed >= 2 || toursCreated >= 1;
	});
	
	// Get the full profile URL
	const profileUrl = $derived(browser && profile ? `${window.location.origin}/${profile.username}` : '');
	
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
					showCurrencySelector = false;
				}, 2000);
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
		const country = COMMON_COUNTRIES.find(c => c.code === countryCode);
		// Only auto-set currency if user hasn't manually overridden it
		if (country && country.currency as Currency && !manualCurrencyOverride) {
			selectedCurrency = country.currency as Currency;
		}
		showCountryDropdown = false;
	}
	
	// Track manual currency changes
	function onCurrencyChange(currency: Currency) {
		selectedCurrency = currency;
		manualCurrencyOverride = true;
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
		manualCurrencyOverride = false;
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
					if (detectedCountry && COMMON_COUNTRIES.find(c => c.code === detectedCountry)) {
						selectedCountry = detectedCountry;
						const country = COMMON_COUNTRIES.find(c => c.code === detectedCountry);
						if (country && country.currency as Currency) {
							selectedCurrency = country.currency as Currency;
						}
					}
				});
			}
		}
	});

	// Payment setup function with return URL
	async function setupPayments() {
		if (!profile) return;
		
		try {
			const response = await fetch('/api/payments/connect/setup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: profile.id,
					email: profile.email,
					businessName: profile.businessName || profile.name,
					country: profile.country || 'DE',
					returnUrl: `${window.location.origin}/dashboard`
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to setup payment account');
			}

			const { accountLink } = await response.json();
			window.location.href = accountLink;
		} catch (error) {
			console.error('Payment setup error:', error);
			saveError = error instanceof Error ? error.message : 'Failed to setup payment account';
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
		if (!profile?.email) return;
		
		resendingEmail = true;
		resendEmailError = null;
		resendEmailSuccess = false;
		
		try {
			const response = await fetch('/api/send-auth-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: profile.email,
					type: 'email-verification'
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
</script>

<svelte:head>
	<title>Dashboard - Zaur</title>
	<meta name="description" content="Your tour operations center" />
</svelte:head>

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
	
	.currency-button {
		background-color: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.currency-button:hover {
		background-color: var(--bg-secondary);
		border-color: var(--border-primary);
	}
	
	.currency-button.selected {
		background-color: var(--color-primary-100);
		border-color: var(--color-primary-500);
		color: var(--color-primary-700);
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

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	
	<!-- Success Messages (always show at top) -->
	{#if showEmailVerificationSuccess}
		<div class="mb-6 rounded-lg p-4 success-message" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
			<div class="flex items-start gap-3">
				<div class="flex-shrink-0">
					<CheckCircle class="h-5 w-5" style="color: var(--color-success-600);" />
				</div>
				<div class="flex-1">
					<h3 class="text-sm font-medium mb-1" style="color: var(--color-success-900);">
						Email verified successfully!
					</h3>
					<p class="text-sm" style="color: var(--color-success-700);">
						Your email has been verified. You now have access to all features.
					</p>
				</div>
			</div>
		</div>
	{/if}
	
	{#if showPaymentSetupSuccess}
		<div class="mb-6 rounded-lg p-4 success-message" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
			<div class="flex items-start gap-3">
				<div class="flex-shrink-0">
					<CheckCircle class="h-5 w-5" style="color: var(--color-success-600);" />
				</div>
				<div class="flex-1">
					<h3 class="text-sm font-medium mb-1" style="color: var(--color-success-900);">
						Payment setup completed!
					</h3>
					<p class="text-sm" style="color: var(--color-success-700);">
						Your payment account is now active. You can start receiving payments from tour bookings.
					</p>
				</div>
			</div>
		</div>
	{/if}
	
	{#if showLocationSaveSuccess}
		<div class="mb-6 rounded-lg p-4 success-message" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
			<div class="flex items-start gap-3">
				<div class="flex-shrink-0">
					<CheckCircle class="h-5 w-5" style="color: var(--color-success-600);" />
				</div>
				<div class="flex-1">
					<h3 class="text-sm font-medium mb-1" style="color: var(--color-success-900);">
						Location settings saved!
					</h3>
					<p class="text-sm" style="color: var(--color-success-700);">
						Your country and currency preferences have been updated.
					</p>
				</div>
			</div>
		</div>
	{/if}

	{#if isLoading}
		<!-- Loading State -->
		<div class="flex items-center justify-center min-h-[60vh]">
			<div class="text-center">
				<Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" style="color: var(--text-tertiary);" />
				<p class="text-sm" style="color: var(--text-secondary);">Loading your dashboard...</p>
			</div>
		</div>
	{:else if isNewUser}
		<!-- Clean Onboarding for New Users -->
		<div class="mb-8">
			<h1 class="text-2xl sm:text-3xl font-bold mb-2" style="color: var(--text-primary);">
				Welcome to Zaur, {profile?.name || 'Tour Guide'}!
			</h1>
			<p class="text-sm" style="color: var(--text-secondary);">
				Let's get your tour business ready in a few simple steps
			</p>
		</div>

		<!-- Onboarding Progress Card -->
		<div class="mb-8 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-6">
				<!-- Progress Indicator -->
				<div class="mb-8">
					<div class="flex items-center justify-between mb-2">
						<p class="text-xs font-medium" style="color: var(--text-tertiary);">Setup Progress</p>
						<p class="text-xs font-medium" style="color: var(--text-tertiary);">
							{#if needsEmailVerification && !paymentStatus.isSetup && needsConfirmation && stats.totalTours === 0}
								0 of 4 completed
							{:else if (needsEmailVerification && !paymentStatus.isSetup && needsConfirmation) || (needsEmailVerification && !paymentStatus.isSetup && stats.totalTours === 0) || (needsEmailVerification && needsConfirmation && stats.totalTours === 0) || (!paymentStatus.isSetup && needsConfirmation && stats.totalTours === 0)}
								1 of 4 completed
							{:else if (needsEmailVerification && !paymentStatus.isSetup) || (needsEmailVerification && needsConfirmation) || (needsEmailVerification && stats.totalTours === 0) || (!paymentStatus.isSetup && needsConfirmation) || (!paymentStatus.isSetup && stats.totalTours === 0) || (needsConfirmation && stats.totalTours === 0)}
								2 of 4 completed
							{:else if needsEmailVerification || !paymentStatus.isSetup || needsConfirmation || stats.totalTours === 0}
								3 of 4 completed
							{:else}
								All steps completed
							{/if}
						</p>
					</div>
					<div class="w-full h-2 rounded-full" style="background: var(--bg-tertiary);">
						<div 
							class="h-full rounded-full transition-all duration-500" 
							style="background: var(--color-primary-500); width: {
								(!needsEmailVerification && paymentStatus.isSetup && !needsConfirmation && stats.totalTours > 0) ? '100%' :
								((!needsEmailVerification && paymentStatus.isSetup && !needsConfirmation) || 
								 (!needsEmailVerification && paymentStatus.isSetup && stats.totalTours > 0) || 
								 (!needsEmailVerification && !needsConfirmation && stats.totalTours > 0) ||
								 (paymentStatus.isSetup && !needsConfirmation && stats.totalTours > 0)) ? '75%' :
								((!needsEmailVerification && !paymentStatus.isSetup && needsConfirmation) || 
								 (needsEmailVerification && paymentStatus.isSetup && !needsConfirmation) || 
								 (!needsEmailVerification && paymentStatus.isSetup && !needsConfirmation) ||
								 (stats.totalTours > 0 && (needsEmailVerification || !paymentStatus.isSetup || needsConfirmation))) ? '50%' :
								((!needsEmailVerification && !paymentStatus.isSetup) || 
								 (!needsEmailVerification && needsConfirmation) || 
								 (!needsEmailVerification && stats.totalTours === 0) ||
								 (needsEmailVerification && !paymentStatus.isSetup) ||
								 (needsEmailVerification && needsConfirmation) ||
								 (needsEmailVerification && stats.totalTours === 0) ||
								 (!paymentStatus.isSetup && needsConfirmation) ||
								 (!paymentStatus.isSetup && stats.totalTours === 0) ||
								 (needsConfirmation && stats.totalTours === 0)) ? '25%' : '0%'
							};"
						></div>
					</div>
				</div>
				
				<div class="space-y-4">
					<!-- Email Verification Step -->
					{#if needsEmailVerification}
						<div class="flex items-start gap-4 p-4 rounded-lg transition-all" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
							<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--bg-tertiary); color: var(--text-secondary);">
								<Mail class="w-4 h-4" />
							</div>
							<div class="flex-1">
								<h3 class="text-sm font-semibold mb-1" style="color: var(--text-primary);">
									Verify your email address
								</h3>
								<p class="text-sm mb-3" style="color: var(--text-secondary);">
									Check your inbox at <span class="font-medium">{profile?.email}</span> and click the verification link.
								</p>
								{#if resendEmailSuccess}
									<p class="text-xs mb-3" style="color: var(--color-success-600);">
										Verification email sent! Check your inbox.
									</p>
								{/if}
								{#if resendEmailError}
									<p class="text-xs mb-3" style="color: var(--color-error-600);">
										{resendEmailError}
									</p>
								{/if}
								<div class="flex items-center gap-2">
									<button
										onclick={resendVerificationEmail}
										disabled={resendingEmail}
										class="button-secondary button--small"
									>
										{#if resendingEmail}
											<Loader2 class="h-3 w-3 animate-spin mr-1" />
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
						<div class="flex items-start gap-4 p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--color-success-200);">
							<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--color-success-100); color: var(--color-success-600);">
								<CheckCircle class="w-4 h-4" />
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
					
					<!-- Payment Setup Step -->
					{#if !paymentStatus.loading}
						{#if !paymentStatus.isSetup}
							<div class="flex items-start gap-4 p-4 rounded-lg transition-all" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
								<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--bg-tertiary); color: var(--text-secondary);">
									<CreditCard class="w-4 h-4" />
								</div>
								<div class="flex-1">
									<h3 class="text-sm font-semibold mb-1" style="color: var(--text-primary);">
										Connect your bank account
									</h3>
									<p class="text-sm mb-4" style="color: var(--text-secondary);">
										Set up payments to receive money from tour bookings directly to your bank account.
									</p>
									<button
										onclick={setupPayments}
										class="button-primary button--small"
									>
										Connect with Stripe
									</button>
								</div>
							</div>
						{:else}
							<div class="flex items-start gap-4 p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--color-success-200);">
								<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--color-success-100); color: var(--color-success-600);">
									<CheckCircle class="w-4 h-4" />
								</div>
								<div class="flex-1">
									<h3 class="text-sm font-semibold" style="color: var(--text-primary);">
										Payment account connected
									</h3>
									<p class="text-sm" style="color: var(--text-secondary);">
										You're ready to accept payments from customers.
									</p>
								</div>
							</div>
						{/if}
					{/if}
					
					<!-- Location Confirmation Step -->
					{#if needsConfirmation}
						<div class="flex items-start gap-4 p-4 rounded-lg transition-all" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
							<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--bg-tertiary); color: var(--text-secondary);">
								<Globe class="w-4 h-4" />
							</div>
							<div class="flex-1">
								<h3 class="text-sm font-semibold mb-1" style="color: var(--text-primary);">
									Confirm your business location
								</h3>
								<p class="text-sm mb-4" style="color: var(--text-secondary);">
									We'll use this to set your default currency and regional settings.
								</p>
								
								{#if !showCurrencySelector}
									<div class="flex items-center gap-3 mb-4">
										{#if currentCountryInfo}
											<div class="flex items-center gap-2 px-3 py-2 rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-secondary);">
												<span>{currentCountryInfo.flag}</span>
												<span class="text-sm font-medium" style="color: var(--text-primary);">{currentCountryInfo.name}</span>
												<span class="text-sm" style="color: var(--text-tertiary);">•</span>
												<span class="text-sm" style="color: var(--text-secondary);">{selectedCurrency}</span>
											</div>
										{/if}
									</div>
									<div class="flex items-center gap-2">
										<button
											onclick={() => showCurrencySelector = true}
											class="button-secondary button--small"
										>
											Change Location
										</button>
										<button
											onclick={saveCurrencySelection}
											disabled={savingCurrency || !selectedCountry || !selectedCurrency}
											class="button-primary button--small"
										>
											{#if savingCurrency}
												<Loader2 class="h-3 w-3 animate-spin mr-1" />
												Saving...
											{:else}
												Confirm Location
											{/if}
										</button>
									</div>
								{:else}
									<!-- Expanded Selection -->
									<div class="space-y-4">
										{#if saveError}
											<div class="p-3 rounded-lg text-sm" style="background: var(--color-error-50); color: var(--color-error-700);">
												{saveError}
											</div>
										{/if}
										
										<!-- Country Selection -->
										<div>
											<label class="block text-xs font-medium mb-2" style="color: var(--text-primary);">Select your country</label>
											<div class="relative">
												<button
													onclick={() => showCountryDropdown = !showCountryDropdown}
													class="w-full flex items-center justify-between p-3 rounded-lg text-left"
													style="background: var(--bg-primary); border: 1px solid var(--border-primary);"
												>
																								<div class="flex items-center gap-2">
												{#if currentCountryInfo}
													<span>{currentCountryInfo.flag}</span>
													<span class="text-sm" style="color: var(--text-primary);">{currentCountryInfo.name}</span>
												{:else}
													<span class="text-sm" style="color: var(--text-secondary);">Select country</span>
												{/if}
											</div>
											<svg class="w-4 h-4" style="color: var(--text-tertiary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
											</svg>
												</button>
												
												{#if showCountryDropdown}
													<div class="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
														<div class="max-h-48 overflow-y-auto country-list">
															{#each COMMON_COUNTRIES as country}
																<button
																	onclick={() => {
																		onCountryChange(country.code);
																		showCountryDropdown = false;
																	}}
																	class="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
																	style="color: var(--text-primary);"
																>
																	<span>{country.flag}</span>
																	<span>{country.name}</span>
																	{#if selectedCountry === country.code}
																		<CheckCircle class="w-3 h-3 ml-auto" style="color: var(--color-primary-600);" />
																	{/if}
																</button>
															{/each}
														</div>
													</div>
												{/if}
											</div>
										</div>
										
										<!-- Currency Display -->
										<div>
											<label class="block text-xs font-medium mb-2" style="color: var(--text-primary);">Currency</label>
											<div class="grid grid-cols-3 gap-2">
												{#each Object.entries(SUPPORTED_CURRENCIES) as [code, info]}
													<button
														onclick={() => onCurrencyChange(code as Currency)}
														class="currency-button p-2 rounded-lg text-xs font-medium transition-all
																{selectedCurrency === code ? 'selected' : ''}"
													>
														{info.symbol} {code}
													</button>
												{/each}
											</div>
											<p class="text-xs mt-2" style="color: var(--text-tertiary);">
												Select the currency you'll use for your tours
											</p>
										</div>
										
										<div class="flex justify-end gap-2 pt-2">
											<button
												onclick={() => {
													resetSelections();
													showCurrencySelector = false;
												}}
												class="button-secondary button--small"
											>
												Cancel
											</button>
											<button
												onclick={saveCurrencySelection}
												disabled={savingCurrency || !selectedCountry}
												class="button-primary button--small"
											>
												{#if savingCurrency}
													<Loader2 class="h-3 w-3 animate-spin mr-1" />
													Saving...
												{:else}
													Save Location
												{/if}
											</button>
										</div>
									</div>
								{/if}
							</div>
						</div>
					{:else}
						<div class="flex items-start gap-4 p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--color-success-200);">
							<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--color-success-100); color: var(--color-success-600);">
								<CheckCircle class="w-4 h-4" />
							</div>
							<div class="flex-1">
								<h3 class="text-sm font-semibold" style="color: var(--text-primary);">
									Location confirmed
								</h3>
								<p class="text-sm" style="color: var(--text-secondary);">
									Your business location and currency are set.
								</p>
							</div>
						</div>
					{/if}
					
					<!-- Create First Tour Step (Always visible) -->
					{#if stats.totalTours === 0}
						<div class="flex items-start gap-4 p-4 rounded-lg transition-all {needsEmailVerification || !paymentStatus.isSetup || needsConfirmation ? 'opacity-50' : ''}" 
							 style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
							<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--bg-tertiary); color: var(--text-secondary);">
								<Plus class="w-4 h-4" />
							</div>
							<div class="flex-1">
								<h3 class="text-sm font-semibold mb-1" style="color: var(--text-primary);">
									Create your first tour
								</h3>
								<p class="text-sm mb-4" style="color: var(--text-secondary);">
									Set up your first tour listing to start accepting bookings from customers.
								</p>
								{#if needsEmailVerification || !paymentStatus.isSetup || needsConfirmation}
									<p class="text-xs" style="color: var(--text-tertiary);">
										Complete the previous steps to unlock
									</p>
								{:else}
									<button
										onclick={() => goto('/tours/new')}
										class="button-primary button--small"
									>
										Create Tour
									</button>
								{/if}
							</div>
						</div>
					{:else}
						<div class="flex items-start gap-4 p-4 rounded-lg" style="background: var(--bg-secondary); border: 1px solid var(--color-success-200);">
							<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background: var(--color-success-100); color: var(--color-success-600);">
								<CheckCircle class="w-4 h-4" />
							</div>
							<div class="flex-1">
								<h3 class="text-sm font-semibold" style="color: var(--text-primary);">
									Tour created
								</h3>
								<p class="text-sm" style="color: var(--text-secondary);">
									You have {stats.totalTours} active {stats.totalTours === 1 ? 'tour' : 'tours'}.
								</p>
							</div>
						</div>
					{/if}
				</div>
				
				<!-- Get Started Section -->
				{#if !needsEmailVerification && paymentStatus.isSetup && !needsConfirmation && stats.totalTours > 0}
					<div class="mt-8 p-6 rounded-lg text-center" style="background: var(--bg-secondary);">
						<CheckCircle class="w-12 h-12 mx-auto mb-4" style="color: var(--color-success-600);" />
						<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">You're all set!</h3>
						<p class="text-sm mb-6" style="color: var(--text-secondary);">
							Your account is fully configured and you have active tours.
						</p>
						<button
							onclick={() => goto('/tours')}
							class="button-primary button--gap"
						>
							<MapPin class="h-4 w-4" />
							Manage Tours
						</button>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Help Section -->
		<div class="rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
			<div class="flex items-start gap-3">
				<AlertCircle class="w-5 h-5 mt-0.5" style="color: var(--text-tertiary);" />
				<div>
					<h4 class="text-sm font-medium mb-1" style="color: var(--text-primary);">Need help?</h4>
					<p class="text-sm" style="color: var(--text-secondary);">
						If you have any questions or issues during setup, please <a href="/help" class="underline">contact our support team</a>.
					</p>
				</div>
			</div>
		</div>
	{:else}
		<!-- Regular Dashboard for Users with Tours -->
		
		<!-- Header Section -->
		<div class="mb-8">
			<h1 class="text-2xl sm:text-3xl font-bold mb-1" style="color: var(--text-primary);">
				Welcome back, {profile?.name || 'Tour Guide'}
			</h1>
			<p class="text-sm" style="color: var(--text-secondary);">
				{new Date().toLocaleDateString('en-US', { 
					weekday: 'long', 
					month: 'long', 
					day: 'numeric',
					year: 'numeric'
				})}
			</p>
		</div>
		
		<!-- Important Notices (Collapsed into single row when possible) -->
		{#if needsEmailVerification || !paymentStatus.isSetup || needsConfirmation}
			<div class="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#if needsEmailVerification}
					<div class="rounded-lg p-4 flex items-start gap-3" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
						<Mail class="h-4 w-4 mt-0.5" style="color: var(--text-tertiary);" />
						<div class="flex-1 min-w-0">
							<h3 class="text-xs font-medium mb-0.5" style="color: var(--text-primary);">
								Verify email
							</h3>
							<p class="text-xs" style="color: var(--text-secondary);">
								Check {profile?.email}
							</p>
						</div>
						<button
							onclick={resendVerificationEmail}
							disabled={resendingEmail}
							class="button-secondary button--small text-xs px-2 py-1"
						>
							Resend
						</button>
					</div>
				{/if}
				
				{#if !paymentStatus.loading && !paymentStatus.isSetup}
					<div class="rounded-lg p-4 flex items-start gap-3" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
						<CreditCard class="h-4 w-4 mt-0.5" style="color: var(--text-tertiary);" />
						<div class="flex-1 min-w-0">
							<h3 class="text-xs font-medium mb-0.5" style="color: var(--text-primary);">
								Payment setup
							</h3>
							<p class="text-xs" style="color: var(--text-secondary);">
								Connect bank account
							</p>
						</div>
						<button
							onclick={setupPayments}
							class="button-primary button--small text-xs px-2 py-1"
						>
							Setup
						</button>
					</div>
				{/if}
				
				{#if needsConfirmation}
					<div class="rounded-lg p-4 flex items-start gap-3" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
						<Globe class="h-4 w-4 mt-0.5" style="color: var(--text-tertiary);" />
						<div class="flex-1 min-w-0">
							<h3 class="text-xs font-medium mb-0.5" style="color: var(--text-primary);">
								Confirm location
							</h3>
							<p class="text-xs" style="color: var(--text-secondary);">
								{currentCountryInfo?.name || 'Select country'} • {selectedCurrency}
							</p>
						</div>
						<button
							onclick={() => showCurrencySelector = true}
							class="button-secondary button--small text-xs px-2 py-1"
						>
							Update
						</button>
					</div>
				{/if}
			</div>
		{/if}
		
		<!-- Currency Settings Modal (when expanded) -->
		{#if showCurrencySelector}
			<div class="mb-6 rounded-lg p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h3 class="text-sm font-medium" style="color: var(--text-primary);">Update Location Settings</h3>
						<button
							onclick={() => {
								resetSelections();
								showCurrencySelector = false;
							}}
							class="button-secondary button--small button--icon"
							aria-label="Close"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
					
					{#if saveError}
						<div class="p-3 rounded-lg text-sm" style="background: var(--color-error-50); color: var(--color-error-700);">
							{saveError}
						</div>
					{/if}
					
					<!-- Country Selection -->
					<div>
						<label class="block text-xs font-medium mb-2" style="color: var(--text-primary);">Country</label>
						<div class="relative">
							<button
								onclick={() => showCountryDropdown = !showCountryDropdown}
								class="w-full flex items-center justify-between p-3 rounded-lg text-left"
								style="background: var(--bg-secondary); border: 1px solid var(--border-primary);"
							>
								<div class="flex items-center gap-2">
									{#if currentCountryInfo}
										<span>{currentCountryInfo.flag}</span>
										<span class="text-sm" style="color: var(--text-primary);">{currentCountryInfo.name}</span>
									{:else}
										<span class="text-sm" style="color: var(--text-secondary);">Select country</span>
									{/if}
								</div>
								<svg class="w-4 h-4" style="color: var(--text-tertiary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							
							{#if showCountryDropdown}
								<div class="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
									<div class="max-h-48 overflow-y-auto country-list">
										{#each COMMON_COUNTRIES as country}
											<button
												onclick={() => {
													onCountryChange(country.code);
													showCountryDropdown = false;
												}}
												class="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
												style="color: var(--text-primary);"
											>
												<span>{country.flag}</span>
												<span>{country.name}</span>
												{#if selectedCountry === country.code}
													<CheckCircle class="w-3 h-3 ml-auto" style="color: var(--color-primary-600);" />
												{/if}
											</button>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
					
					<!-- Currency Display (Read-only) -->
					<div>
						<label class="block text-xs font-medium mb-2" style="color: var(--text-primary);">Currency</label>
						<div class="grid grid-cols-3 gap-2">
							{#each Object.entries(SUPPORTED_CURRENCIES) as [code, info]}
								<button
									onclick={() => onCurrencyChange(code as Currency)}
									class="currency-button p-2 rounded-lg text-xs font-medium transition-all
											{selectedCurrency === code ? 'selected' : ''}"
								>
									{info.symbol} {code}
								</button>
							{/each}
						</div>
						<p class="text-xs mt-2" style="color: var(--text-tertiary);">
							Select the currency you'll use for your tours
						</p>
					</div>
					
					<div class="flex justify-end gap-2 pt-2">
						<button
							onclick={() => {
								resetSelections();
								showCurrencySelector = false;
							}}
							class="button-secondary button--small"
						>
							Cancel
						</button>
						<button
							onclick={saveCurrencySelection}
							disabled={savingCurrency || !selectedCountry}
							class="button-primary button--small"
						>
							{#if savingCurrency}
								<Loader2 class="h-3 w-3 animate-spin mr-1" />
								Saving...
							{:else}
								Save Location
							{/if}
						</button>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Today's Overview -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Today's Overview</h2>
				{#if todaysSchedule.length > 0}
					<button
						onclick={() => goto('/checkin-scanner')}
						class="button-primary button--small button--gap"
					>
						<QrCode class="h-3 w-3" />
						Scanner
					</button>
				{/if}
			</div>
			
			<!-- Quick Stats Grid -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
				<div class="rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
					<div class="flex items-center justify-between mb-2">
						<Calendar class="h-4 w-4" style="color: var(--text-tertiary);" />
						<span class="text-xs" style="color: var(--text-tertiary);">Today</span>
					</div>
					<p class="text-xl font-semibold" style="color: var(--text-primary);">{todaysSchedule.length}</p>
					<p class="text-xs" style="color: var(--text-secondary);">{todaysSchedule.length === 1 ? 'tour' : 'tours'}</p>
				</div>
				
				<div class="rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
					<div class="flex items-center justify-between mb-2">
						<Users class="h-4 w-4" style="color: var(--text-tertiary);" />
						<span class="text-xs" style="color: var(--text-tertiary);">Guests</span>
					</div>
					<p class="text-xl font-semibold" style="color: var(--text-primary);">
						{todaysSchedule.reduce((sum: number, s: any) => sum + (s.participants || 0), 0)}
					</p>
					<p class="text-xs" style="color: var(--text-secondary);">today</p>
				</div>
				
				<div class="rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
					<div class="flex items-center justify-between mb-2">
						<DollarSign class="h-4 w-4" style="color: var(--text-tertiary);" />
						<span class="text-xs" style="color: var(--text-tertiary);">Revenue</span>
					</div>
					<p class="text-xl font-semibold" style="color: var(--text-primary);">{$globalCurrencyFormatter(stats.weeklyRevenue)}</p>
					<p class="text-xs" style="color: var(--text-secondary);">this week</p>
				</div>
				
				<div class="rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
					<div class="flex items-center justify-between mb-2">
						<TrendingUp class="h-4 w-4" style="color: var(--text-tertiary);" />
						<span class="text-xs" style="color: var(--text-tertiary);">Upcoming</span>
					</div>
					<p class="text-xl font-semibold" style="color: var(--text-primary);">{stats.upcomingTours || 0}</p>
					<p class="text-xs" style="color: var(--text-secondary);">next 7 days</p>
				</div>
			</div>
			
			<!-- Today's Schedule -->
			{#if todaysSchedule.length > 0}
				<div class="rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<h3 class="text-sm font-medium" style="color: var(--text-primary);">Today's Schedule</h3>
					</div>
					<div class="divide-y" style="border-color: var(--border-primary);">
						{#each todaysSchedule as schedule}
							<div class="p-4 flex items-center justify-between">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<span class="text-sm font-medium" style="color: var(--text-primary);">
											{#if schedule.timeSlot?.startTime && schedule.timeSlot?.endTime}
												{formatSlotTimeRange(schedule.timeSlot.startTime, schedule.timeSlot.endTime)}
											{:else}
												{formatDate(schedule.time)}
											{/if}
										</span>
										<span class="px-2 py-0.5 text-xs rounded-full {getStatusColor(schedule.status)}">
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
					{#if todaysSchedule.length > 4}
						<div class="p-3 text-center border-t" style="border-color: var(--border-primary);">
							<button 
								onclick={() => goto('/bookings')} 
								class="text-xs hover:underline" style="color: var(--text-tertiary);"
							>
								View all bookings
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="rounded-lg p-8 text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
					<Calendar class="w-8 h-8 mx-auto mb-3" style="color: var(--text-tertiary);" />
					<p class="text-sm mb-1" style="color: var(--text-primary);">No tours scheduled today</p>
					<p class="text-xs" style="color: var(--text-secondary);">Enjoy your day off!</p>
				</div>
			{/if}
		</div>
		
		<!-- Quick Actions & Recent Activity -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Recent Bookings -->
			<div class="lg:col-span-2">
				<div class="rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b flex items-center justify-between" style="border-color: var(--border-primary);">
						<h3 class="text-sm font-medium" style="color: var(--text-primary);">Recent Bookings</h3>
						<button onclick={() => goto('/bookings')} class="text-xs hover:underline" style="color: var(--text-tertiary);">
							View all
						</button>
					</div>
					
					<div class="divide-y" style="border-color: var(--border-primary);">
						{#if recentBookings.length > 0}
							{#each recentBookings.slice(0, 4) as booking}
								<div class="p-4">
									<div class="flex items-start justify-between">
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2 mb-1">
												<span class="text-sm font-medium" style="color: var(--text-primary);">
													{booking.customerName}
												</span>
												<span class="px-2 py-0.5 text-xs rounded-full {getStatusColor(booking.status)}">
													{booking.status}
												</span>
											</div>
											<p class="text-xs" style="color: var(--text-secondary);">
												{booking.tourName || booking.tour || 'Unknown Tour'} • {formatDate(booking.effectiveDate || booking.created)}
											</p>
											<p class="text-xs mt-1" style="color: var(--text-tertiary);">
												{formatParticipantDisplayCompact(booking)} guests • {$globalCurrencyFormatter(booking.totalAmount || 0)}
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
								<Calendar class="w-6 h-6 mx-auto mb-2" style="color: var(--text-tertiary);" />
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
					<div class="rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
						<div class="flex items-center justify-between mb-3">
							<div class="flex items-center gap-2">
								<Link class="h-4 w-4" style="color: var(--text-tertiary);" />
								<h3 class="text-sm font-medium" style="color: var(--text-primary);">Your Profile</h3>
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
						<p class="text-xs mb-3" style="color: var(--text-secondary);">
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
				<div class="rounded-lg p-4" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
					<h3 class="text-sm font-medium mb-3" style="color: var(--text-primary);">Quick Actions</h3>
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
								onclick={() => goto('/dashboard/subscription')}
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
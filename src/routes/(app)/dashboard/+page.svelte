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

	// TanStack Query for dashboard data
	const dashboardStatsQuery = createQuery({
		queryKey: queryKeys.dashboardStats,
		queryFn: queryFunctions.fetchDashboardStats,
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 5 * 60 * 1000,    // 5 minutes
	});

	const recentBookingsQuery = createQuery({
		queryKey: queryKeys.recentBookings(10),
		queryFn: () => queryFunctions.fetchRecentBookings(10),
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000,    // 5 minutes
	});

	// Get profile from layout data (this stays server-side since it's needed for auth)
	const profile = $derived(data.user as AuthUser | null);
	
	// Force refresh on mount to ensure we have latest user data
	onMount(() => {
		// Refresh all data to ensure emailVerified status is current
		invalidateAll();
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
	let showCurrencyConfirmation = $state(false);
	let selectedCurrency = $state<Currency>($userCurrency);
	let selectedCountry = $state(profile?.country || '');
	let savingCurrency = $state(false);
	let saveSuccess = $state(false);
	let saveError = $state<string | null>(null);
	
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
	
	// Save currency selection
	async function saveCurrencySelection() {
		if (!profile) return;
		
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
				showCurrencyConfirmation = false;
				sessionStorage.setItem('currencyConfirmed', 'true');
				saveSuccess = true;
				setTimeout(() => {
					saveSuccess = false;
				}, 3000);
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
	
	// Update currency when country changes
	function onCountryChange(countryCode: string) {
		selectedCountry = countryCode;
		const country = COMMON_COUNTRIES.find(c => c.code === countryCode);
		if (country && country.currency as Currency) {
			selectedCurrency = country.currency as Currency;
		}
	}
	
	// Check if we should show currency confirmation (only if not set in profile)
	$effect(() => {
		if (browser && profile && !profile.country && !sessionStorage.getItem('currencyConfirmed')) {
			// Only auto-detect if user doesn't have country set
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
			showCurrencyConfirmation = true;
		} else if (profile?.country && profile?.currency) {
			// Use saved profile data
			selectedCountry = profile.country;
			selectedCurrency = profile.currency as Currency;
		}
	});

	// Payment setup function
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
					country: profile.country || 'DE'
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
	
	// Check payment status
	let paymentStatus = $state<{ isSetup: boolean; loading: boolean }>({ isSetup: false, loading: true });
	
	$effect(() => {
		if (profile?.stripeAccountId) {
			// Check if payment account is fully set up
			fetch('/api/payments/connect/status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: profile.id })
			})
			.then(res => res.json())
			.then(data => {
				paymentStatus = { 
					isSetup: data.canReceivePayments || false, 
					loading: false 
				};
			})
			.catch(() => {
				paymentStatus = { isSetup: false, loading: false };
			});
		} else {
			paymentStatus = { isSetup: false, loading: false };
		}
	});
</script>

<svelte:head>
	<title>Dashboard - Zaur</title>
	<meta name="description" content="Your tour operations center" />
</svelte:head>

<style>
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
	
	.step-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background-color: var(--color-primary-100);
		color: var(--color-primary-600);
		font-weight: 600;
		font-size: 0.875rem;
	}
	
	.currency-option {
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.currency-option:hover {
		background-color: var(--bg-tertiary);
		transform: translateY(-1px);
	}
	
	.currency-option.selected {
		background-color: var(--color-primary-100);
		border-color: var(--color-primary-500);
		color: var(--color-primary-700);
	}
	
	:global([data-theme="dark"]) .currency-option.selected {
		background-color: var(--color-primary-900);
		color: var(--color-primary-100);
		border-color: var(--color-primary-400);
	}
	
	.country-option {
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 60px;
	}
	
	.country-option:hover {
		background-color: var(--bg-tertiary);
		transform: translateY(-1px);
	}
	
	.country-option.selected {
		background-color: var(--color-primary-100);
		border-color: var(--color-primary-500);
	}
	
	:global([data-theme="dark"]) .country-option.selected {
		background-color: var(--color-primary-900);
		border-color: var(--color-primary-400);
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
</style>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	{#if isLoading}
		<!-- Loading State -->
		<div class="flex items-center justify-center min-h-[60vh]">
			<div class="text-center">
				<Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" style="color: var(--text-tertiary);" />
				<p class="text-sm" style="color: var(--text-secondary);">Loading your dashboard...</p>
			</div>
		</div>
	{:else if isNewUser}
		<!-- Empty State for New Users -->
		<div class="mb-6">
			<h1 class="text-2xl sm:text-3xl font-bold" style="color: var(--text-primary);">
				Welcome to Zaur, {profile?.name || 'Tour Guide'}! 👋
			</h1>
			<p class="text-sm font-medium mt-1" style="color: var(--text-secondary);">
				Let's get your tour business up and running
			</p>
		</div>
		
		<!-- Email Verification Notice -->
		{#if profile && !profile.emailVerified}
			<div class="mb-6 rounded-lg p-4" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0">
						<Mail class="h-5 w-5" style="color: var(--color-warning-600);" />
					</div>
					<div class="flex-1">
						<h3 class="text-sm font-medium mb-1" style="color: var(--color-warning-900);">
							Verify your email address
						</h3>
						<p class="text-sm" style="color: var(--color-warning-700);">
							We've sent a verification email to {profile.email}. Please check your inbox and verify your email to unlock all features.
						</p>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Profile Link Section - Moved to top for visibility -->
		<div class="mb-6 rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="flex items-center gap-3 mb-3">
				<Link class="h-5 w-5" style="color: var(--color-primary-600);" />
				<h3 class="font-semibold" style="color: var(--text-primary);">Your public profile is ready!</h3>
			</div>
			<p class="text-sm mb-4" style="color: var(--text-secondary);">
				Share this link with your customers to showcase your tours:
			</p>
			<div class="flex flex-col sm:flex-row gap-3">
				<div class="flex-1 rounded-lg px-4 py-3 overflow-x-auto no-scrollbar" style="background: var(--bg-secondary);">
					<a 
						href="/{profile?.username || ''}" 
						target="_blank" 
						rel="noopener noreferrer"
						class="text-sm font-mono whitespace-nowrap block"
						style="color: var(--color-primary-600);"
					>
						{profileUrl}
					</a>
				</div>
				<div class="flex items-center gap-2">
					<Tooltip text="View your profile" position="top">
						<a
							href="/{profile?.username || ''}"
							target="_blank"
							rel="noopener noreferrer"
							class="button-secondary button--icon"
						>
							<ExternalLink class="h-4 w-4" />
						</a>
					</Tooltip>
					<Tooltip text={profileLinkCopied ? "Copied!" : "Copy URL"} position="top">
						<button
							onclick={copyProfileLink}
							class="button-primary button--icon {profileLinkCopied ? 'button-success' : ''}"
						>
							{#if profileLinkCopied}
								<CheckCircle class="h-4 w-4" />
							{:else}
								<Copy class="h-4 w-4" />
							{/if}
						</button>
					</Tooltip>
				</div>
			</div>
		</div>
		
		<!-- Success Message -->
		{#if saveSuccess}
			<div class="mb-6 rounded-lg p-4" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0">
						<CheckCircle class="h-5 w-5" style="color: var(--color-success-600);" />
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium" style="color: var(--color-success-900);">
							Settings saved successfully!
						</p>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Currency & Country Confirmation -->
		{#if showCurrencyConfirmation}
			<div class="mb-8 rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center gap-3 mb-4">
					<Globe class="h-5 w-5" style="color: var(--color-primary-600);" />
					<h3 class="font-semibold" style="color: var(--text-primary);">Confirm your location and currency</h3>
				</div>
				<p class="text-sm mb-4" style="color: var(--text-secondary);">
					We've detected your location. Please confirm your country and preferred currency for pricing your tours:
				</p>
				
				{#if saveError}
					<div class="mb-4 p-3 rounded-lg" style="background: var(--color-error-50); border: 1px solid var(--color-error-200);">
						<p class="text-sm" style="color: var(--color-error-700);">{saveError}</p>
					</div>
				{/if}
				
				<!-- Country Selection Grid -->
				<div class="mb-4">
					<label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
						Select your country
					</label>
					<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
						{#each COMMON_COUNTRIES as country}
							<button
								onclick={() => onCountryChange(country.code)}
								class="country-option p-3 rounded-lg border text-left transition-all flex items-center gap-2
										{selectedCountry === country.code ? 'selected' : ''}"
								style="border-color: {selectedCountry === country.code ? 'var(--color-primary-500)' : 'var(--border-secondary)'};"
							>
								<span class="text-2xl">{country.flag}</span>
								<div class="flex-1 min-w-0">
									<div class="font-medium text-sm truncate" style="color: var(--text-primary);">
										{country.name}
									</div>
									<div class="text-xs" style="color: var(--text-secondary);">
										{SUPPORTED_CURRENCIES[country.currency as Currency]?.symbol} {country.currency}
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>
				
				<!-- Currency Grid -->
				<div class="mb-4">
					<label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
						Currency (auto-selected based on country, but you can change it)
					</label>
					<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
						{#each Object.entries(SUPPORTED_CURRENCIES) as [code, info]}
							<button
								onclick={() => selectedCurrency = code as Currency}
								class="currency-option p-3 rounded-lg border text-left transition-all
										{selectedCurrency === code ? 'selected' : ''}"
								style="border-color: {selectedCurrency === code ? 'var(--color-primary-500)' : 'var(--border-secondary)'};"
							>
								<div class="font-medium text-sm" style="color: var(--text-primary);">
									{info.symbol} {code}
								</div>
								<div class="text-xs" style="color: var(--text-secondary);">
									{info.name}
								</div>
							</button>
						{/each}
					</div>
				</div>
				
				<button
					onclick={saveCurrencySelection}
					disabled={savingCurrency || !selectedCountry}
					class="button-primary button--gap"
				>
					{#if savingCurrency}
						<Loader2 class="h-4 w-4 animate-spin" />
						Saving...
					{:else}
						<CheckCircle class="h-4 w-4" />
						Confirm Location & Currency
					{/if}
				</button>
			</div>
		{/if}
		
		<!-- Getting Started Steps - Moved higher for better visibility -->
		<div class="mb-8 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="p-6">
				<h2 class="text-xl font-semibold mb-6" style="color: var(--text-primary);">
					Get started in {!paymentStatus.isSetup ? '3' : '2'} simple steps
				</h2>
				
				<div class="space-y-6">
					{#if !paymentStatus.isSetup && !paymentStatus.loading}
						<!-- Step 1 - Payment Setup (only show if not set up) -->
						<div class="flex gap-4">
							<div class="step-number">1</div>
							<div class="flex-1">
								<h3 class="font-medium mb-1" style="color: var(--text-primary);">
									Set up payment method
								</h3>
								<p class="text-sm mb-3" style="color: var(--text-secondary);">
									Connect your bank account to receive payments from tour bookings. This takes just a few minutes.
								</p>
								<button
									onclick={setupPayments}
									class="button-primary button--gap"
								>
									<CreditCard class="h-4 w-4" />
									Set Up Payments
								</button>
							</div>
						</div>
					{/if}
					
					<!-- Tour Creation Step (Step 1 if payments done, Step 2 if not) -->
					<div class="flex gap-4">
						<div class="step-number {!paymentStatus.isSetup ? 'opacity-50' : ''}">{!paymentStatus.isSetup ? '2' : '1'}</div>
						<div class="flex-1 {!paymentStatus.isSetup ? 'opacity-50' : ''}">
							<h3 class="font-medium mb-1" style="color: var(--text-primary);">
								Create your first tour
							</h3>
							<p class="text-sm mb-3" style="color: var(--text-secondary);">
								Add details about your tour, set pricing, upload photos, and define available time slots.
							</p>
							{#if paymentStatus.isSetup}
								<button
									onclick={() => goto('/tours/new')}
									class="button-primary button--gap"
								>
									<Plus class="h-4 w-4" />
									Create Your First Tour
								</button>
							{/if}
						</div>
					</div>
					
					<!-- QR Code Step -->
					<div class="flex gap-4">
						<div class="step-number opacity-50">{!paymentStatus.isSetup ? '3' : '2'}</div>
						<div class="flex-1 opacity-50">
							<h3 class="font-medium mb-1" style="color: var(--text-primary);">
								Share & start accepting bookings
							</h3>
							<p class="text-sm" style="color: var(--text-secondary);">
								Get your unique QR code and booking link. Share them to start accepting bookings and check in guests.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Subscription Plans Overview - Moved to bottom as less urgent -->
		<div class="rounded-xl p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="flex items-center gap-3 mb-4">
				<Crown class="h-5 w-5" style="color: var(--color-primary-600);" />
				<h3 class="font-semibold" style="color: var(--text-primary);">Subscription Plans</h3>
			</div>
			<p class="text-sm mb-6" style="color: var(--text-secondary);">
				Start with our free plan and upgrade as your business grows
			</p>
			
			<div class="grid gap-4 mb-6">
				<!-- Free Plan -->
				<div class="subscription-tier {profile?.subscriptionPlan === 'free' ? 'current' : ''}">
					<div class="flex items-start justify-between mb-3">
						<div>
							<h4 class="font-medium" style="color: var(--text-primary);">Free Starter</h4>
							<p class="text-2xl font-bold mt-1" style="color: var(--text-primary);">€0<span class="text-sm font-normal" style="color: var(--text-secondary);">/month</span></p>
						</div>
						{#if profile?.subscriptionPlan === 'free'}
							<span class="px-2 py-1 text-xs rounded-full" style="background: var(--color-primary-100); color: var(--color-primary-700);">
								Current Plan
							</span>
						{/if}
					</div>
					<ul class="space-y-2 text-sm" style="color: var(--text-secondary);">
						<li class="flex items-center gap-2">
							<CheckCircle class="h-4 w-4 flex-shrink-0" style="color: var(--color-success-600);" />
							<span>1 tour</span>
						</li>
						<li class="flex items-center gap-2">
							<CheckCircle class="h-4 w-4 flex-shrink-0" style="color: var(--color-success-600);" />
							<span>2 bookings per month</span>
						</li>
						<li class="flex items-center gap-2">
							<CheckCircle class="h-4 w-4 flex-shrink-0" style="color: var(--color-success-600);" />
							<span>Basic features</span>
						</li>
					</ul>
				</div>
				
				<!-- Starter Pro -->
				<div class="subscription-tier">
					<div class="mb-3">
						<h4 class="font-medium" style="color: var(--text-primary);">Starter Pro</h4>
						<p class="text-2xl font-bold mt-1" style="color: var(--text-primary);">€12<span class="text-sm font-normal" style="color: var(--text-secondary);">/month</span></p>
					</div>
					<ul class="space-y-2 text-sm" style="color: var(--text-secondary);">
						<li class="flex items-center gap-2">
							<CheckCircle class="h-4 w-4 flex-shrink-0" style="color: var(--color-success-600);" />
							<span>3 tours</span>
						</li>
						<li class="flex items-center gap-2">
							<CheckCircle class="h-4 w-4 flex-shrink-0" style="color: var(--color-success-600);" />
							<span>15 bookings per month</span>
						</li>
						<li class="flex items-center gap-2">
							<CheckCircle class="h-4 w-4 flex-shrink-0" style="color: var(--color-success-600);" />
							<span>SMS notifications</span>
						</li>
					</ul>
				</div>
			</div>
			
			<a href="/dashboard/subscription" class="inline-flex items-center gap-2 text-sm font-medium" style="color: var(--color-primary-600);">
				View all plans & pricing
				<ArrowRight class="h-3 w-3" />
			</a>
		</div>
		
		<!-- Subscription Limit Warning -->
		{#if isApproachingLimits()}
			<div class="mb-6 rounded-lg p-4" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0">
						<AlertCircle class="h-5 w-5" style="color: var(--color-warning-600);" />
					</div>
					<div class="flex-1">
						<h3 class="text-sm font-medium mb-1" style="color: var(--color-warning-900);">
							You're approaching your plan limits
						</h3>
						<p class="text-sm" style="color: var(--color-warning-700);">
							Free plan: {profile?.monthlyBookingsUsed || 0}/2 bookings used this month, {stats.totalTours}/1 tours created.
						</p>
						<a href="/dashboard/subscription" class="inline-flex items-center gap-1 mt-2 text-sm font-medium" style="color: var(--color-warning-600);">
							Upgrade to accept more bookings
							<ArrowRight class="h-3 w-3" />
						</a>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Success Message for existing users -->
		{#if saveSuccess}
			<div class="mb-6 rounded-lg p-4" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0">
						<CheckCircle class="h-5 w-5" style="color: var(--color-success-600);" />
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium" style="color: var(--color-success-900);">
							Settings saved successfully!
						</p>
					</div>
				</div>
			</div>
		{/if}
		
	{:else}
		<!-- Regular Dashboard for Users with Tours -->
		
		<!-- Subscription Limit Warning -->
		{#if isApproachingLimits()}
			<div class="mb-6 rounded-lg p-4" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0">
						<AlertCircle class="h-5 w-5" style="color: var(--color-warning-600);" />
					</div>
					<div class="flex-1">
						<h3 class="text-sm font-medium mb-1" style="color: var(--color-warning-900);">
							You're approaching your plan limits
						</h3>
						<p class="text-sm" style="color: var(--color-warning-700);">
							Free plan: {profile?.monthlyBookingsUsed || 0}/2 bookings used this month, {stats.totalTours}/1 tours created.
						</p>
						<a href="/dashboard/subscription" class="inline-flex items-center gap-1 mt-2 text-sm font-medium" style="color: var(--color-warning-600);">
							Upgrade to accept more bookings
							<ArrowRight class="h-3 w-3" />
						</a>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Operations Header -->
		<div class="mb-6 sm:mb-8">
			<div class="flex flex-col gap-4">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1 class="text-2xl sm:text-3xl font-bold" style="color: var(--text-primary);">
							Dashboard
						</h1>
						<p class="text-sm font-medium mt-1" style="color: var(--text-secondary);">
							{new Date().toLocaleDateString('en-US', { 
								weekday: 'long', 
								month: 'long', 
								day: 'numeric',
								year: 'numeric'
							})}
						</p>
					</div>
					
					<!-- Quick Scanner Access - Single Button -->
					{#if todaysSchedule.length > 0}
						<button
							onclick={() => goto('/checkin-scanner')}
							class="button-primary button--gap"
						>
							<QrCode class="h-4 w-4" />
							<span class="hidden sm:inline">Check-in Scanner</span>
							<span class="sm:hidden">Scanner</span>
						</button>
					{/if}
				</div>
				
				<!-- Profile Link Section -->
				<div class="rounded-lg p-3" style="background: var(--bg-tertiary); border: 1px solid var(--border-secondary);">
					<div class="flex flex-col gap-3">
						<!-- Label with icon - same on all screen sizes -->
						<div class="flex items-center justify-between w-full">
							<div class="flex items-center gap-2">
								<Link class="h-4 w-4 flex-shrink-0" style="color: var(--color-primary-600);" />
								<span class="text-sm font-medium" style="color: var(--text-secondary);">
									Your public profile
								</span>
							</div>
							
							<!-- Action buttons -->
							<div class="flex items-center gap-2">
								<Tooltip text="View your profile" position="top">
									<a
										href="/{profile?.username || ''}"
										target="_blank"
										rel="noopener noreferrer"
										class="button-secondary button--small button--icon"
									>
										<ExternalLink class="h-3 w-3" />
									</a>
								</Tooltip>
								<Tooltip text={profileLinkCopied ? "Copied!" : "Copy URL"} position="top">
									<button
										onclick={copyProfileLink}
										class="button-primary button--small button--icon {profileLinkCopied ? 'button-success' : ''}"
									>
										{#if profileLinkCopied}
											<CheckCircle class="h-3 w-3" />
										{:else}
											<Copy class="h-3 w-3" />
										{/if}
									</button>
								</Tooltip>
							</div>
						</div>
						
						<!-- Full URL display on all screens -->
						<div class="w-full bg-white bg-opacity-50 rounded px-2 py-1 overflow-x-auto no-scrollbar">
							<a 
								href="/{profile?.username || ''}" 
								target="_blank" 
								rel="noopener noreferrer"
								class="text-sm font-mono whitespace-nowrap block"
								style="color: var(--color-primary-600);"
							>
								{profileUrl}
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Today's Schedule - Operations Priority -->
		{#if todaysSchedule.length > 0}
			<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold" style="color: var(--text-primary);">Today's Schedule</h3>
						<div class="flex items-center gap-3">
							<span class="text-sm" style="color: var(--text-secondary);">
								{todaysSchedule.length} {todaysSchedule.length === 1 ? 'tour' : 'tours'} today
							</span>
							<button onclick={() => goto('/bookings')} class="button-secondary button--small button--gap">
								<Calendar class="h-3 w-3" />
								All Bookings
							</button>
						</div>
					</div>
				</div>
				<div class="p-4">
					<div class="space-y-3">
						{#each todaysSchedule.slice(0, 4) as schedule}
							<div class="flex items-center justify-between p-3 rounded-lg transition-colors schedule-item" style="background: var(--bg-secondary);">
								<div class="flex-1 min-w-0">
									<h4 class="text-sm font-medium truncate" style="color: var(--text-primary);">
										<button 
											onclick={() => goto(`/tours/${schedule.expand?.tour?.id || schedule.tourId}`)} 
											class="hover:underline text-left"
										>
											{schedule.tourName}
										</button>
									</h4>
									<div class="flex items-center gap-2 mt-1">
										<span class="text-xs font-medium" style="color: var(--text-secondary);">
											{#if schedule.timeSlot?.startTime && schedule.timeSlot?.endTime}
												{formatSlotTimeRange(schedule.timeSlot.startTime, schedule.timeSlot.endTime)}
											{:else}
												{formatDate(schedule.time)}
											{/if}
										</span>
										<span class="text-xs" style="color: var(--text-tertiary);">•</span>
										<span class="text-xs" style="color: var(--text-secondary);">
											{schedule.participants || 0} guests
										</span>
										{#if schedule.customerName}
											<span class="text-xs" style="color: var(--text-tertiary);">•</span>
											<button 
												onclick={() => goto(`/bookings/${schedule.id}`)} 
												class="text-xs hover:underline" style="color: var(--text-secondary);"
											>
												{schedule.customerName}
											</button>
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-2">
									<span class="px-2 py-1 text-xs rounded-full {getStatusColor(schedule.status)}">
										{schedule.status}
									</span>
									<div class="flex items-center gap-1 schedule-actions">
										{#if schedule.status === 'confirmed'}
											<Tooltip text="Quick Check-in" position="top">
												<button
													onclick={() => goto('/checkin-scanner')}
													class="button-secondary button--small p-1"
												>
													<UserCheck class="h-3 w-3" />
												</button>
											</Tooltip>
										{/if}
										<Tooltip text="View Booking" position="top">
											<button
												onclick={() => goto(`/bookings/${schedule.id}`)}
												class="button-secondary button--small p-1"
											>
												<ArrowRight class="h-3 w-3" />
											</button>
										</Tooltip>
									</div>
								</div>
							</div>
						{/each}
						{#if todaysSchedule.length > 4}
							<div class="text-center pt-2">
								<button 
									onclick={() => goto('/bookings')} 
									class="text-xs hover:underline" style="color: var(--text-tertiary);"
								>
									+ {todaysSchedule.length - 4} more tours today - View all bookings
								</button>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<div class="mb-6 rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold" style="color: var(--text-primary);">Today's Schedule</h3>
						<button onclick={() => goto('/tours')} class="button-secondary button--small">
							<MapPin class="h-3 w-3 mr-1" />
							Tours
						</button>
					</div>
				</div>
				<div class="p-8">
					<div class="text-center">
						<Calendar class="w-8 h-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
						<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">No tours today</h3>
						<p class="text-sm mb-6" style="color: var(--text-secondary);">
							You don't have any confirmed bookings for today.
						</p>
						<button
							onclick={() => goto('/tours')}
							class="button-primary button--gap"
						>
							<MapPin class="h-4 w-4" />
							Manage Tours
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Quick Stats - Focus on Today & This Week -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
			<StatsCard
				title="Today's Bookings" 
				value={stats.todayBookings}
				subtitle="new today"
				icon={Calendar}
				variant="small"
			/>

			<StatsCard
				title="Week Revenue"
				value={$globalCurrencyFormatter(stats.weeklyRevenue)}
				subtitle="last 7 days"
				icon={DollarSign}
				trend={stats.weeklyRevenue > 0 ? { value: "This week", positive: true } : undefined}
				variant="small"
			/>

			<StatsCard
				title="Upcoming Tours"
				value={stats.upcomingTours || 0}
				subtitle="next 7 days"
				icon={TrendingUp}
				variant="small"
			/>

			<StatsCard
				title="Total Guests"
				value={stats.totalCustomers}
				subtitle="this week"
				icon={Users}
				variant="small"
			/>
		</div>

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
			<!-- Recent Activity -->
			<div class="lg:col-span-2">
				<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<div class="flex items-center justify-between">
							<h3 class="font-semibold" style="color: var(--text-primary);">Recent Bookings</h3>
							<button onclick={() => goto('/bookings')} class="button-secondary button--small">
								View All
							</button>
						</div>
					</div>
					
					<div class="divide-y" style="border-color: var(--border-primary);">
						{#if recentBookings.length > 0}
							{#each recentBookings.slice(0, 5) as booking}
								<div class="p-4 transition-colors booking-item" style="background: var(--bg-primary);">
									<div class="flex items-center justify-between">
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2 mb-1">
												<p class="text-sm font-medium truncate" style="color: var(--text-primary);">
													{booking.customerName}
												</p>
												<span class="px-2 py-1 text-xs rounded-full {getStatusColor(booking.status)}">
													{booking.status}
												</span>
												<span class="px-2 py-1 text-xs rounded-full {getPaymentStatusColor(booking.paymentStatus || 'pending')}">
													💳 {booking.paymentStatus || 'pending'}
												</span>
											</div>
											<p class="text-xs mb-1" style="color: var(--text-secondary);">
												{booking.tourName || booking.tour || 'Unknown Tour'}
											</p>
											<div class="flex items-center gap-2 text-xs" style="color: var(--text-tertiary);">
												<span>{formatDate(booking.effectiveDate || booking.created)}</span>
												{#if booking.expand?.timeSlot?.startTime && booking.expand?.timeSlot?.endTime}
													<span>•</span>
													<span>{formatSlotTimeRange(booking.expand.timeSlot.startTime, booking.expand.timeSlot.endTime)}</span>
												{/if}
												<span>•</span>
												<span>{formatParticipantDisplayCompact(booking)} guests</span>
												<span>•</span>
												<span>{$globalCurrencyFormatter(booking.totalAmount || 0)}</span>
											</div>
										</div>
										<div class="flex items-center gap-2 ml-3">
											{#if booking.status === 'pending'}
												<button
													onclick={() => goto(`/bookings/${booking.id}`)}
													class="button-primary button--small"
												>
													Review
												</button>
											{:else}
												<button
													onclick={() => goto(`/bookings/${booking.id}`)}
													class="button-secondary button--small"
												>
													View
												</button>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						{:else}
							<div class="p-8">
								<div class="text-center">
									<Calendar class="w-8 h-8 mx-auto mb-2" style="color: var(--text-tertiary);" />
									<p class="text-sm" style="color: var(--text-secondary);">No bookings yet</p>
									<button onclick={() => goto('/tours')} class="text-xs mt-2" style="color: var(--color-primary-600);">
										View Tours
									</button>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Desktop Sidebar -->
			<div class="hidden lg:block space-y-6">
				<!-- Today's Performance -->
				<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<h3 class="font-semibold" style="color: var(--text-primary);">Today's Performance</h3>
					</div>
					<div class="p-4">
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-sm" style="color: var(--text-secondary);">Tours Today</span>
								<span class="font-semibold" style="color: var(--text-primary);">{todaysSchedule.length}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm" style="color: var(--text-secondary);">Total Guests</span>
								<span class="font-semibold" style="color: var(--text-primary);">
									{todaysSchedule.reduce((sum: number, s: any) => sum + (s.participants || 0), 0)}
								</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm" style="color: var(--text-secondary);">New Bookings</span>
								<span class="font-semibold" style="color: var(--text-primary);">{stats.todayBookings}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- This Week Summary -->
				<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<h3 class="font-semibold" style="color: var(--text-primary);">This Week</h3>
					</div>
					<div class="p-4">
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-sm" style="color: var(--text-secondary);">Revenue</span>
								<span class="font-semibold" style="color: var(--text-primary);">{$globalCurrencyFormatter(stats.weeklyRevenue)}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm" style="color: var(--text-secondary);">Guests</span>
								<span class="font-semibold" style="color: var(--text-primary);">{stats.totalCustomers}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm" style="color: var(--text-secondary);">Upcoming</span>
								<span class="font-semibold" style="color: var(--text-primary);">{stats.upcomingTours} tours</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
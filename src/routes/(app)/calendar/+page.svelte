<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types.js';
	import { browser } from '$app/environment';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import TourTimeline from '$lib/components/TourTimeline.svelte';
	import DashboardSkeleton from '$lib/components/DashboardSkeleton.svelte';
	import OnboardingSkeleton from '$lib/components/OnboardingSkeleton.svelte';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	// TanStack Query for API-only data fetching
	import { createQuery } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';

	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Plus from 'lucide-svelte/icons/plus';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Mail from 'lucide-svelte/icons/mail';
	import Globe from 'lucide-svelte/icons/globe';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	
	// Components
	import FlagIcon from '$lib/components/FlagIcon.svelte';
	import { COUNTRY_LIST, getCountryInfo, getCurrencyForCountry } from '$lib/utils/countries.js';

	let { data }: { data: PageData } = $props();

	// TanStack Query for dashboard data
	const dashboardStatsQuery = createQuery({
		queryKey: queryKeys.dashboardStats,
		queryFn: () => queryFunctions.fetchDashboardStats(),
		staleTime: 0,
		gcTime: 2 * 60 * 1000,
		refetchOnWindowFocus: true,
		refetchOnMount: 'always',
		enabled: true,
		retry: 1,
		retryDelay: 2000
	});

	// Get user from layout data (reactive)
	let user = $derived(data?.user);
	// Profile is the same as user in this context
	let profile = $derived(data?.user);

	// Timeline state
	let timelineView = $state<'month' | 'week' | 'day'>('month');
	let timelineCurrentDate = $state(new Date());

	// Loading and error states
	let isLoading = $derived($dashboardStatsQuery.isLoading);
	let isError = $derived($dashboardStatsQuery.isError);

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

	// Onboarding state
	let hasConfirmedLocation = $state(false);
	let selectedCountry = $state('');
	let savingCurrency = $state(false);
	let showLocationModal = $state(false);
	let countrySearchTerm = $state('');
	let resendingEmail = $state(false);
	let resendEmailSuccess = $state(false);
	let isSettingUpPayment = $state(false);
	let paymentStatus = $state<{ isSetup: boolean; loading: boolean }>({
		isSetup: false,
		loading: true
	});

	// Check onboarding status
	let needsEmailVerification = $derived(Boolean(profile && !profile.emailVerified));
	let needsConfirmation = $derived(Boolean(browser && profile && !hasConfirmedLocation && !profile?.stripeAccountId));
	let isNewUser = $derived(!isLoading && stats.totalTours === 0);

	// Calculate onboarding progress
	let onboardingSteps = $derived.by(() => {
		const steps = [];
		
		if (needsEmailVerification) {
			steps.push({
				id: 'email',
				title: 'Verify Email',
				description: 'Check your inbox',
				icon: Mail,
				complete: false,
				action: resendVerificationEmail
			});
		}
		
		if (needsConfirmation) {
			steps.push({
				id: 'location',
				title: 'Business Location',
				description: selectedCountry ? getCountryInfo(selectedCountry)?.name : 'Select country',
				icon: Globe,
				complete: false,
				action: () => showLocationModal = true
			});
		}
		
		if (!paymentStatus.isSetup) {
			steps.push({
				id: 'payment',
				title: 'Payment Setup',
				description: 'Connect Stripe',
				icon: CreditCard,
				complete: false,
				action: setupPayments
			});
		}
		
		if (stats.totalTours === 0) {
			steps.push({
				id: 'tour',
				title: 'Create Tour',
				description: 'Add your first tour',
				icon: MapPin,
				complete: false,
				action: () => goto('/tours/new')
			});
		}
		
		return steps;
	});

	let showOnboarding = $derived(!isLoading && onboardingSteps.length > 0);

	// Function to check payment status
	async function checkPaymentStatus() {
		if (!profile) {
			paymentStatus = { isSetup: false, loading: false };
			return;
		}
		
		// Check if user has bank account setup (cross-border payments)
		// In this case, paymentSetup is true but stripeAccountId is null
		if (profile.paymentSetup && !profile.stripeAccountId) {
			paymentStatus = { isSetup: true, loading: false };
			return;
		}
		
		// Check with the API for Stripe Connect status
		if (profile.stripeAccountId) {
			try {
				const response = await fetch('/api/payments/connect/status');
				const data = await response.json();
				paymentStatus = {
					isSetup: data.chargesEnabled || false,
					loading: false
				};
			} catch (error) {
				console.error('Failed to check payment status:', error);
				// Fallback to profile data
				paymentStatus = { 
					isSetup: profile.paymentSetup || false, 
					loading: false 
				};
			}
		} else {
			// No payment setup at all
			paymentStatus = { 
				isSetup: false, 
				loading: false 
			};
		}
	}
	
	// Re-check payment status when user data changes
	$effect(() => {
		if (profile && browser && !paymentStatus.loading) {
			// If profile indicates payment is setup but our state doesn't match, re-check
			if (profile.paymentSetup && !paymentStatus.isSetup) {
				checkPaymentStatus();
			}
			// Also re-check if profile has stripeAccountId but we think payment isn't setup
			if (profile.stripeAccountId && !paymentStatus.isSetup && !paymentStatus.loading) {
				checkPaymentStatus();
			}
		}
	});
	
	// Initialize
	onMount(async () => {
		// Check if returning from Stripe setup
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('setup') === 'complete') {
			// Remove the query parameter
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.delete('setup');
			window.history.replaceState({}, '', newUrl.toString());
			
			// Show loading state while refreshing
			paymentStatus.loading = true;
			
			// Refresh all data to reflect the new payment status
			await invalidateAll();
			
			// Small delay to ensure database is updated
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Force re-check payment status after data refresh
			await checkPaymentStatus();
		} else {
			// Check payment status on normal page load
			await checkPaymentStatus();
		}

		// Check location confirmation
		if (browser) {
			hasConfirmedLocation = localStorage.getItem('locationConfirmed') === 'true';
			
			if (profile && profile.country && profile.currency && !hasConfirmedLocation) {
				hasConfirmedLocation = true;
				localStorage.setItem('locationConfirmed', 'true');
			}
		}

		// Auto-detect country
		if (browser && !selectedCountry && profile?.country) {
			selectedCountry = profile.country;
		} else if (browser && !selectedCountry) {
			try {
				const response = await fetch('https://ipapi.co/json/');
				const data = await response.json();
				const countryCode = data.country_code;
				
				if (countryCode && COUNTRY_LIST.find(c => c.code === countryCode)) {
					selectedCountry = countryCode;
				}
			} catch (error) {
				console.error('Failed to detect country:', error);
				selectedCountry = 'US';
			}
		}
	});

	// Filter countries based on search
	let filteredCountryList = $derived(
		countrySearchTerm.trim() === '' 
			? COUNTRY_LIST 
			: COUNTRY_LIST.filter(country => 
				country.name.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
				country.code.toLowerCase().includes(countrySearchTerm.toLowerCase())
			)
	);

	// Actions
	async function resendVerificationEmail() {
		resendingEmail = true;
		
		try {
			const response = await fetch('/api/send-auth-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					email: user?.email,
					type: 'verification'
				})
			});
			
			if (response.ok) {
				resendEmailSuccess = true;
				setTimeout(() => resendEmailSuccess = false, 5000);
			}
		} catch (error) {
			console.error('Failed to send email:', error);
		} finally {
			resendingEmail = false;
		}
	}

	async function saveCurrencySelection() {
		if (!profile || !selectedCountry) return;

		savingCurrency = true;
		try {
			const formData = new FormData();
			formData.append('country', selectedCountry);
			formData.append('currency', getCurrencyForCountry(selectedCountry));

			const response = await fetch('/api/profile/update', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				hasConfirmedLocation = true;
				localStorage.setItem('locationConfirmed', 'true');
				showLocationModal = false;
				await invalidateAll();
			}
		} catch (error) {
			console.error('Failed to save location:', error);
		} finally {
			savingCurrency = false;
		}
	}

	async function setupPayments() {
		if (isSettingUpPayment || !user) return;
		
		isSettingUpPayment = true;
		try {
			const response = await fetch('/api/payments/connect/setup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user.id,
					email: user.email,
					businessName: profile?.businessName || user.name,
					country: profile?.country || selectedCountry || 'US',
					returnUrl: `${window.location.origin}/calendar?setup=complete`
				})
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				console.error('Payment setup error:', errorData);
				
				// If the account was invalid and cleared, retry automatically
				if (errorData.requiresRetry) {
					// Refresh the page data to get the cleared account state
					await invalidateAll();
					
					// Retry the setup after a short delay
					setTimeout(async () => {
						isSettingUpPayment = false;
						await setupPayments();
					}, 1000);
					return;
				}
				
				isSettingUpPayment = false;
				return;
			}
			
			const data = await response.json();
			if (data.accountLink) {
				window.location.href = data.accountLink;
			}
		} catch (error) {
			console.error('Failed to setup payments:', error);
			isSettingUpPayment = false;
		}
	}
</script>

<style>
	/* Simple, clean styles */
	.calendar-container {
		min-height: 400px;
	}

	/* Onboarding styles - simple and clean like marketing pages */
	.onboarding-section {
		margin-bottom: 2rem;
	}

	.onboarding-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 2rem;
	}

	.onboarding-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.onboarding-subtitle {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
	}

	.onboarding-steps {
		display: grid;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	@media (min-width: 640px) {
		.onboarding-steps {
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		}
	}

	.onboarding-step {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		text-align: center;
		transition: all 0.2s ease;
	}

	.onboarding-step:hover {
		border-color: var(--color-primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.onboarding-step-complete {
		background: var(--color-success-50);
		border-color: var(--color-success-200);
	}

	.step-icon {
		width: 2rem;
		height: 2rem;
		margin: 0 auto 0.5rem;
		color: var(--color-primary);
	}

	.step-icon-complete {
		color: var(--color-success);
	}

	.step-title {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.875rem;
		margin-bottom: 0.25rem;
	}

	.step-description {
		color: var(--text-secondary);
		font-size: 0.75rem;
		margin-bottom: 0.75rem;
	}



	/* Location modal - simple overlay */
	.location-modal {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.location-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(2px);
	}

	.location-content {
		position: relative;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		padding: 1.5rem;
		max-width: 600px;
		width: 100%;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: var(--shadow-lg);
	}

	.location-header {
		margin-bottom: 1rem;
	}

	.location-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.location-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.country-search {
		margin-bottom: 1rem;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 1rem;
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.country-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.5rem;
		margin-bottom: 1rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.country-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border: 1px solid var(--border-primary);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.75rem;
	}

	.country-option:hover {
		background: var(--bg-secondary);
		border-color: var(--color-primary);
	}

	.country-option--selected {
		background: var(--color-primary-50);
		border-color: var(--color-primary);
	}

	.location-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	/* Welcome message for new users */
	.welcome-message {
		text-align: center;
		padding: 3rem 1.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		margin-bottom: 2rem;
	}

	.welcome-icon {
		color: var(--color-primary);
		margin-bottom: 1rem;
		display: flex;
		justify-content: center;
	}

	.welcome-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.welcome-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
		max-width: 400px;
		margin-left: auto;
		margin-right: auto;
	}
</style>

<svelte:head>
	<title>Calendar - Zaur</title>
</svelte:head>

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
	{#if isLoading}
		{#if isNewUser}
			<OnboardingSkeleton />
		{:else}
			<DashboardSkeleton />
		{/if}
	{:else if isError}
		<div class="text-center py-12">
			<p class="text-red-500 mb-4">Failed to load calendar</p>
			<button 
				onclick={() => window.location.reload()} 
				class="button-primary"
			>
				Refresh Page
			</button>
		</div>
	{:else}
		<!-- Simple Header -->
		<div class="mb-6">
			<MobilePageHeader
				title="Calendar"
				quickActions={!showOnboarding ? [
					{
						label: 'Add Tour',
						icon: Plus,
						onclick: () => goto('/tours/new'),
						variant: 'primary'
					}
				] : []}
			/>
			
			<div class="hidden sm:block">
				<PageHeader 
					title="Calendar"
					subtitle={showOnboarding ? "Complete setup to start accepting bookings" : "Your tour schedule at a glance"}
				>
					{#if !showOnboarding}
						<button onclick={() => goto('/tours/new')} class="button-primary button--gap">
							<Plus class="h-4 w-4" />
							Add Tour
						</button>
					{/if}
				</PageHeader>
			</div>
		</div>

		<!-- Simple Onboarding Section -->
		{#if showOnboarding}
			<div class="onboarding-section" in:fade={{ duration: 200 }}>
				<div class="onboarding-card">
					<h2 class="onboarding-title">Quick Setup</h2>
					<p class="onboarding-subtitle">
						{onboardingSteps.length === 1 ? 'Just one step' : `${onboardingSteps.length} simple steps`} to get started
					</p>

					<div class="onboarding-steps">
						{#each onboardingSteps as step}
							<div class="onboarding-step {step.complete ? 'onboarding-step-complete' : ''}">
								<div class="step-icon {step.complete ? 'step-icon-complete' : ''}">
									{#if step.complete}
										<CheckCircle class="w-8 h-8" />
									{:else if step.icon === Mail}
										<Mail class="w-8 h-8" />
									{:else if step.icon === Globe}
										<Globe class="w-8 h-8" />
									{:else if step.icon === CreditCard}
										<CreditCard class="w-8 h-8" />
									{:else if step.icon === MapPin}
										<MapPin class="w-8 h-8" />
									{/if}
								</div>
								<h3 class="step-title">{step.title}</h3>
								<p class="step-description">{step.description}</p>
								{#if !step.complete && step.action}
									<button 
										onclick={step.action}
										class="button-primary button--small w-full"
									>
										{#if step.id === 'email' && resendingEmail}
											<Loader2 class="h-3 w-3 animate-spin" />
										{:else if step.id === 'payment' && isSettingUpPayment}
											<Loader2 class="h-3 w-3 animate-spin" />
										{:else if step.id === 'location' && savingCurrency}
											<Loader2 class="h-3 w-3 animate-spin" />
										{:else}
											{step.id === 'email' ? 'Resend' : 
											 step.id === 'location' ? 'Select' :
											 step.id === 'payment' ? 'Connect' : 
											 'Create'}
										{/if}
									</button>
								{/if}
								{#if step.id === 'email' && resendEmailSuccess}
									<p class="text-xs text-green-600 mt-1">✓ Email sent!</p>
								{/if}
							</div>
						{/each}
					</div>


				</div>
			</div>
		{/if}

		<!-- Calendar - Main Focus -->
		{#if !isNewUser || !showOnboarding}
			<div class="calendar-container" in:fade={{ delay: showOnboarding ? 200 : 0 }}>
				{#if stats.totalTours === 0}
					<!-- Simple welcome message for new users -->
					<div class="welcome-message">
						<div class="welcome-icon">
							<Calendar class="h-12 w-12" />
						</div>
						<h3 class="welcome-title">Your Calendar Awaits</h3>
						<p class="welcome-description">
							Create your first tour to see your bookings appear here
						</p>
						<button 
							onclick={() => goto('/tours/new')}
							class="button-primary button--large button--gap"
						>
							<Plus class="h-5 w-5" />
							Create Your First Tour
						</button>
					</div>
				{:else}
					<!-- Tour Timeline -->
					<TourTimeline 
						bind:view={timelineView}
						bind:currentDate={timelineCurrentDate}
						onSlotClick={(slot) => {
							goto(`/tours/${slot.tourId}?tab=schedule`);
						}}
					/>
				{/if}
			</div>
		{/if}

		<!-- Location Selection Modal -->
		{#if showLocationModal}
			<div class="location-modal">
				<button 
					class="location-backdrop" 
					onclick={() => showLocationModal = false}
					aria-label="Close modal"
					type="button"
				></button>
				<div class="location-content">
					<div class="location-header">
						<h3 class="location-title">Select Your Business Location</h3>
						<p class="location-description">
							This determines your payment currency and cannot be changed later
						</p>
					</div>

					<div class="country-search">
						<input
							type="text"
							bind:value={countrySearchTerm}
							placeholder="Search countries..."
							class="search-input"
						/>
					</div>

					<div class="country-grid">
						{#each filteredCountryList as country}
							<button
								onclick={() => selectedCountry = country.code}
								class="country-option {selectedCountry === country.code ? 'country-option--selected' : ''}"
							>
								<FlagIcon countryCode={country.code} size="sm" />
								<span>{country.name}</span>
							</button>
						{/each}
					</div>

					{#if selectedCountry}
						{@const countryInfo = getCountryInfo(selectedCountry)}
						<div class="text-sm text-center mb-4" style="color: var(--text-secondary);">
							Selected: <strong>{countryInfo?.name}</strong> • Currency: <strong>{countryInfo?.currency}</strong>
						</div>
					{/if}

					<div class="location-actions">
						<button
							onclick={() => showLocationModal = false}
							class="button-secondary"
						>
							Cancel
						</button>
						<button
							onclick={saveCurrencySelection}
							disabled={!selectedCountry || savingCurrency}
							class="button-primary button--gap"
						>
							{#if savingCurrency}
								<Loader2 class="h-4 w-4 animate-spin" />
							{/if}
							Confirm Location
						</button>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

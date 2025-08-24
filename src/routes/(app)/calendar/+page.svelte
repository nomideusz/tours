<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types.js';
	import { browser } from '$app/environment';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import TourTimeline from '$lib/components/TourTimeline.svelte';
	import DashboardSkeleton from '$lib/components/DashboardSkeleton.svelte';
	import OnboardingSkeleton from '$lib/components/OnboardingSkeleton.svelte';
	import QuickAddModal from '$lib/components/calendar/QuickAddModal.svelte';
	import LocationModal from '$lib/components/calendar/LocationModal.svelte';
	import ToursLegend from '$lib/components/calendar/ToursLegend.svelte';
	import OnboardingSection from '$lib/components/calendar/OnboardingSection.svelte';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	// TanStack Query for API-only data fetching
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	
	const queryClient = useQueryClient();

	// Icons
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Plus from 'lucide-svelte/icons/plus';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Mail from 'lucide-svelte/icons/mail';
	import Globe from 'lucide-svelte/icons/globe';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Clock from 'lucide-svelte/icons/clock';
	import Users from 'lucide-svelte/icons/users';
	import Settings from 'lucide-svelte/icons/settings';
	import Baby from 'lucide-svelte/icons/baby';
	import Info from 'lucide-svelte/icons/info';
	
	// Components
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import { getCountryInfo, getCurrencyForCountry, getPaymentMethod } from '$lib/utils/countries.js';
	import { formatDateForInput, getSmartCapacity, getLastUsedCapacity, calculateTotalRecurringSlots, getRecurringEndDate } from '$lib/utils/calendar-helpers.js';
	import { checkConflicts, checkRecurringConflicts } from '$lib/components/time-slot-form/utils/time-utils.js';
	
	// Tour helpers
	import { formatDuration, getImageUrl, getTourDisplayPriceFormatted } from '$lib/utils/tour-helpers-client.js';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import type { Tour } from '$lib/types.js';

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
	
	// Query for user tours
	const userToursQuery = createQuery({
		queryKey: queryKeys.userTours,
		queryFn: queryFunctions.fetchUserTours,
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	});

	// Get user from layout data (reactive)
	let user = $derived(data?.user);
	// Profile is the same as user in this context
	let profile = $derived(data?.user);

	// Timeline state
	let timelineView = $state<'month' | 'week' | 'day'>('month');
	let timelineCurrentDate = $state(new Date());
	let highlightedTourId = $state('');
	
	// Quick Add Modal state
	let showQuickAddModal = $state(false);
	let quickAddDate = $state<Date | null>(null);
	let quickAddStep = $state<'select-tour' | 'configure-slot'>('select-tour');
	let selectedTourForSlot = $state<string>('');
	let isAddingSlot = $state(false);
	let lastCreatedSlot = $state<{time: string, date: string, capacity: number, tourId: string} | null>(null);
	let selectedTourSlots = $state<any[]>([]);
	let hasConflict = $state(false);
	let conflictMessage = $state<string>('');
	let recurringConflictCount = $state(0);
	let totalRecurringSlots = $state(0);
	let selectedTourData = $state<any>(null);
	
	// Time Slot Form state
	let timeSlotForm = $state({
		startTime: '10:00',
		endTime: '12:00',
		capacity: 10,
		recurring: false,
		recurringType: 'weekly' as 'daily' | 'weekly' | 'monthly',
		recurringCount: 4
	});

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
	
	// Tours data
	let tours = $derived(($userToursQuery.data as Tour[]) || []);

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
	
	// Payment setup modal state
	let showPaymentConfirmModal = $state(false);
	let pendingPaymentCountry = $state<string | null>(null);

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
				action: resendVerificationEmail,
				actionText: 'Resend Email'
			});
		}
		
		if (needsConfirmation) {
			steps.push({
				id: 'location',
				title: 'Business Location',
				description: selectedCountry ? getCountryInfo(selectedCountry)?.name : 'Select country',
				icon: Globe,
				complete: false,
				action: () => showLocationModal = true,
				actionText: 'Select Location'
			});
		}
		
		if (!paymentStatus.isSetup && !paymentStatus.loading) {
			steps.push({
				id: 'payment',
				title: 'Payment Setup',
				description: 'Connect Stripe',
				icon: CreditCard,
				complete: false,
				action: setupPayments,
				actionText: 'Setup Payments'
			});
		}
		
		if (stats.totalTours === 0) {
			steps.push({
				id: 'tour',
				title: 'Create Tour',
				description: 'Add your first tour',
				icon: MapPin,
				complete: false,
				action: () => goto('/tours/new'),
				actionText: 'Create Tour'
			});
		}
		
		return steps;
	});

	let showOnboarding = $derived(!isLoading && onboardingSteps.length > 0);
	

	
	// Helper function to format date for input (timezone-safe)

	

	
	// Check for conflicts when time or recurring settings change
	$effect(() => {
		// Trigger on any form changes including recurring settings
		const triggerCheck = {
			date: quickAddDate,
			startTime: timeSlotForm.startTime,
			endTime: timeSlotForm.endTime,
			recurring: timeSlotForm.recurring,
			recurringType: timeSlotForm.recurringType,
			recurringCount: timeSlotForm.recurringCount,
			tourId: selectedTourForSlot,
			slotsCount: selectedTourSlots.length
		};
		
		if (quickAddDate && timeSlotForm.startTime && timeSlotForm.endTime && selectedTourForSlot) {
			const dateStr = formatDateForInput(quickAddDate);
			
			// Only skip conflict checking if we haven't selected a tour yet
			// Empty array is valid (tour might have no slots)
			if (!selectedTourForSlot) {
				hasConflict = false;
				conflictMessage = '';
				recurringConflictCount = 0;
				totalRecurringSlots = 0;
				return;
			}
			

			
			if (timeSlotForm.recurring) {
				// Check recurring conflicts
				const formData = {
					date: dateStr,
					startTime: timeSlotForm.startTime,
					endTime: timeSlotForm.endTime,
					recurring: true,
					recurringType: timeSlotForm.recurringType,
					recurringEnd: getRecurringEndDate(dateStr, timeSlotForm.recurringType, timeSlotForm.recurringCount),
					recurringCount: timeSlotForm.recurringCount
				};
				
				// Debug: Log what we're checking
				console.log('=== RECURRING CONFLICT CHECK ===');
				console.log('Form data:', formData);
				console.log('Existing slots count:', selectedTourSlots.length);
				if (selectedTourSlots.length > 0) {
					console.log('First slot example:', selectedTourSlots[0]);
					console.log('Slot dates:', selectedTourSlots.map(s => ({
						start: new Date(s.startTime).toISOString(),
						end: new Date(s.endTime).toISOString()
					})));
				}
				
				// Debug: Check each date manually
				let debugConflictCount = 0;
				let currentDebugDate = new Date(formData.date);
				for (let i = 0; i < formData.recurringCount; i++) {
					const checkDateStr = currentDebugDate.toISOString().split('T')[0];
					const dayConflicts = checkConflicts(checkDateStr, formData.startTime, formData.endTime, selectedTourSlots);
					if (dayConflicts.length > 0) {
						debugConflictCount++;
						console.log(`Day ${i + 1} (${checkDateStr}): CONFLICT FOUND`, dayConflicts);
					} else {
						console.log(`Day ${i + 1} (${checkDateStr}): No conflict`);
					}
					
					// Move to next date
					if (formData.recurringType === 'daily') {
						currentDebugDate.setDate(currentDebugDate.getDate() + 1);
					} else if (formData.recurringType === 'weekly') {
						currentDebugDate.setDate(currentDebugDate.getDate() + 7);
					} else if (formData.recurringType === 'monthly') {
						currentDebugDate.setMonth(currentDebugDate.getMonth() + 1);
					}
				}
				console.log('Manual debug conflict count:', debugConflictCount);
				
				const recurringResult = checkRecurringConflicts(formData, selectedTourSlots);
				console.log('Function conflict result:', recurringResult);
				
				recurringConflictCount = recurringResult.conflictCount;
				totalRecurringSlots = calculateTotalRecurringSlots(dateStr, timeSlotForm.recurringType, timeSlotForm.recurringCount);
				console.log(`Found ${recurringConflictCount} conflicts out of ${totalRecurringSlots} slots`);
				console.log('=== END CONFLICT CHECK ===');
				
				hasConflict = recurringResult.hasConflicts;
				if (hasConflict) {
					conflictMessage = `${recurringConflictCount} of ${totalRecurringSlots} recurring slots conflict with existing time slots`;
		} else {
					conflictMessage = '';
				}
			} else {
				// Check single slot conflict
				const conflicts = checkConflicts(dateStr, timeSlotForm.startTime, timeSlotForm.endTime, selectedTourSlots);
				
				hasConflict = conflicts.length > 0;
				if (hasConflict && conflicts[0]) {
					const conflictSlot = conflicts[0];
					const conflictStart = new Date(conflictSlot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
					const conflictEnd = new Date(conflictSlot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
					conflictMessage = `Conflicts with existing slot: ${conflictStart} - ${conflictEnd}`;
				} else {
					conflictMessage = '';
				}
				
				recurringConflictCount = 0;
				totalRecurringSlots = 0;
			}
		} else {
			hasConflict = false;
			conflictMessage = '';
			recurringConflictCount = 0;
			totalRecurringSlots = 0;
		}
	});
	

	
	// Helper function to calculate end time based on start time and duration
	function calculateEndTime(startTime: string, duration: number): string {
		if (!startTime || !duration) return startTime;
		
		const [hours, minutes] = startTime.split(':').map(Number);
		const totalMinutes = hours * 60 + minutes + duration;
		
		const endHours = Math.floor(totalMinutes / 60) % 24;
		const endMinutes = totalMinutes % 60;
		
		return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
	}
	
	// Auto-calculate end time when start time changes
	$effect(() => {
		if (selectedTourData && timeSlotForm.startTime) {
			const newEndTime = calculateEndTime(timeSlotForm.startTime, selectedTourData.duration);
			timeSlotForm.endTime = newEndTime;
		}
	});
	




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
	
	// Check payment status whenever profile data is available or changes
	$effect(() => {
		if (profile && browser) {
			checkPaymentStatus();
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
			await new Promise(resolve => setTimeout(resolve, 1000));
		}
		
		// The effect will trigger when profile data loads
		// But also do an initial check if profile is already available
		await checkPaymentStatus();

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
				
				if (countryCode) {
					selectedCountry = countryCode;
				}
			} catch (error) {
				console.error('Failed to detect country:', error);
				selectedCountry = 'US';
			}
		}
	});



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
		if (!user || isSettingUpPayment) return;

		// If stripeAccountId already exists, country is already locked - skip the modal
		if (user.stripeAccountId) {
			// Go directly to payment setup without warning
			confirmPaymentSetup();
			return;
		}

		// Get the country for payment setup
		const userCountry = profile?.country || selectedCountry || 'US';
		const paymentMethod = getPaymentMethod(userCountry);
		
		// Check if this is a cross-border country
		if (paymentMethod === 'crossborder') {
			// For cross-border payments, go directly to setup (no Stripe Connect modal needed)
			confirmPaymentSetup();
		} else {
			// Show regular payment confirmation modal for Stripe Connect countries
			pendingPaymentCountry = userCountry;
			showPaymentConfirmModal = true;
		}
	}
	
	// Actually setup payments after confirmation
	async function confirmPaymentSetup() {
		if (!user || isSettingUpPayment) return;

		// Use existing country if stripeAccountId exists, otherwise use pending country
		const countryForSetup = user.stripeAccountId ? 
			(user.country || 'US') : 
			(pendingPaymentCountry || profile?.country || selectedCountry || 'US');

		showPaymentConfirmModal = false;
		isSettingUpPayment = true;
		
		try {
			const response = await fetch('/api/payments/connect/setup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user.id,
					email: user.email,
					businessName: profile?.businessName || user.name,
					country: countryForSetup,
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
				pendingPaymentCountry = null;
				return;
			}
			
			const data = await response.json();
			if (data.accountLink) {
				window.location.href = data.accountLink;
			}
		} catch (error) {
			console.error('Failed to setup payments:', error);
			isSettingUpPayment = false;
		} finally {
			pendingPaymentCountry = null;
		}
	}
</script>

<style>
	/* Simple, clean styles */
	.calendar-container {
		min-height: 400px;
	}

	/* Tours Legend spacing */
	.tours-legend-wrapper {
		margin-bottom: 2rem;
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
	

	/* Removed old quick-add styles since we're using the new modal design */
	

	



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

		<!-- Onboarding Section -->
		{#if showOnboarding}
			<OnboardingSection
				{user}
				{profile}
				{needsEmailVerification}
				{needsConfirmation}
				{isNewUser}
				{onboardingSteps}
				bind:hasConfirmedLocation={hasConfirmedLocation}
				bind:selectedCountry={selectedCountry}
				bind:savingCurrency={savingCurrency}
				bind:showLocationModal={showLocationModal}
				bind:countrySearchTerm={countrySearchTerm}
				bind:resendingEmail={resendingEmail}
				bind:resendEmailSuccess={resendEmailSuccess}
				bind:isSettingUpPayment={isSettingUpPayment}
				bind:paymentStatus={paymentStatus}
				bind:showPaymentConfirmModal={showPaymentConfirmModal}
				bind:pendingPaymentCountry={pendingPaymentCountry}
				on:resendEmail={resendVerificationEmail}
				on:confirmLocation={(e) => {
					selectedCountry = e.detail.country;
					saveCurrencySelection();
				}}
				on:setupPayment={(e) => {
					pendingPaymentCountry = e.detail.country;
					confirmPaymentSetup();
				}}
				on:createFirstTour={() => goto('/tours/new')}
			/>
									{/if}
		
		<!-- Tours Legend Section - Show whenever tours exist -->
		<div class="tours-legend-wrapper">
			<ToursLegend {tours} {highlightedTourId} />
		</div>

		<!-- Location Selection Modal -->
		<LocationModal 
			bind:show={showLocationModal}
			bind:selectedCountry={selectedCountry}
			bind:savingCurrency={savingCurrency}
			on:close={() => showLocationModal = false}
			on:save={saveCurrencySelection}
		/>
		{/if}
	
	<!-- Quick Add Modal Component -->
	<QuickAddModal
		bind:show={showQuickAddModal}
		bind:date={quickAddDate}
		bind:step={quickAddStep}
		bind:selectedTourId={selectedTourForSlot}
		bind:selectedTourData={selectedTourData}
		bind:selectedTourSlots={selectedTourSlots}
		bind:timeSlotForm={timeSlotForm}
		bind:isAddingSlot={isAddingSlot}
		bind:lastCreatedSlot={lastCreatedSlot}
		bind:hasConflict={hasConflict}
		bind:conflictMessage={conflictMessage}
		bind:recurringConflictCount={recurringConflictCount}
		bind:totalRecurringSlots={totalRecurringSlots}
		{tours}
		on:close={() => {
			showQuickAddModal = false;
			quickAddStep = 'select-tour';
			selectedTourForSlot = '';
			selectedTourData = null;
		}}
		on:createFirstTour={() => goto('/tours/new')}
		on:submit={async (e) => {
			const { tourId, formData } = e.detail;
			isAddingSlot = true;
			
			try {
				const response = await fetch(`/api/tours/${tourId}/schedule`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(formData)
				});
				
				if (response.ok) {
					// Remember the last created slot info for smart suggestions
					lastCreatedSlot = {
						time: formData.startTime,
						date: formatDateForInput(quickAddDate!),
						capacity: formData.capacity,
						tourId: tourId
					};
					
					// Invalidate timeline queries to refresh the calendar
					await queryClient.invalidateQueries({
						queryKey: ['allTimeSlots']
					});
					
					// Also invalidate specific tour schedule if we have a tour ID
					if (tourId) {
						await queryClient.invalidateQueries({
							queryKey: ['tourSchedule', tourId]
						});
					}
					
					// Clear the cached slots for this tour to force refetch next time
					selectedTourSlots = [];
					
					// Close modal and reset form
					showQuickAddModal = false;
					quickAddStep = 'select-tour';
					selectedTourForSlot = '';
					selectedTourData = null;
					timeSlotForm = {
						startTime: '10:00',
						endTime: '12:00',
						capacity: 10,
						recurring: false,
						recurringType: 'weekly',
						recurringCount: 4
					};
				} else {
					const error = await response.json();
					console.error('Failed to add time slot:', error);
				}
			} catch (error) {
				console.error('Error adding time slot:', error);
			} finally {
				isAddingSlot = false;
			}
		}}
	/>

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
							// When a single slot is clicked, switch to day view to show details
							// Extract the date from the slot's startTime (which should be in ISO format)
							const slotDate = new Date(slot.startTime);
							// Set the date to the beginning of the day to avoid time zone issues
							const targetDate = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
							timelineCurrentDate = targetDate;
							timelineView = 'day';
							// Highlight and scroll to the tour in the legend
							highlightedTourId = slot.tourId;
							// Scroll to the highlighted tour row after a small delay
							setTimeout(() => {
								const element = document.getElementById(`tour-row-${slot.tourId}`);
								if (element) {
									element.scrollIntoView({ behavior: 'smooth', block: 'center' });
								}
							}, 100);
							// Clear highlight after a moment
							setTimeout(() => highlightedTourId = '', 3000);
						}}
						onViewChange={(newView) => {
							timelineView = newView;
						}}
						onQuickAdd={(date) => {
							// Open Quick Add modal for the clicked date
							quickAddDate = date;
							quickAddStep = 'select-tour';
							selectedTourForSlot = '';
							selectedTourData = null;
							selectedTourSlots = [];
							hasConflict = false;
							conflictMessage = '';
							recurringConflictCount = 0;
							totalRecurringSlots = 0;
							
							// Use smart defaults for capacity (keep last used or default to 10)
							const defaultCapacity = lastCreatedSlot?.capacity || 10;
							
							timeSlotForm = {
								startTime: '10:00',
								endTime: '12:00',
								capacity: defaultCapacity,
								recurring: false,
								recurringType: 'weekly',
								recurringCount: 4
							};
							showQuickAddModal = true;
						}}
					/>
				{/if}
				</div>
		{/if}

		<!-- Location Selection Modal -->
		<LocationModal 
			bind:show={showLocationModal}
			bind:selectedCountry={selectedCountry}
			bind:savingCurrency={savingCurrency}
			on:close={() => showLocationModal = false}
			on:save={saveCurrencySelection}
		/>

	




<!-- Payment Confirmation Modal -->
{#if showPaymentConfirmModal && pendingPaymentCountry}
	{@const countryInfo = getCountryInfo(pendingPaymentCountry || '')}
	{@const stripeCurrency = getCurrencyForCountry(pendingPaymentCountry || '')}
	<ConfirmationModal
		isOpen={showPaymentConfirmModal}
		title="Confirm Payment Account Country"
		message={`You are about to create a payment account for ${countryInfo?.name || pendingPaymentCountry}.

Your payment account will use ${stripeCurrency} as the currency.

⚠️ This choice is permanent and cannot be changed later. Make sure this is the correct country for your business.`}
		confirmText="Create Payment Account"
		cancelText="Cancel"
		variant="warning"
		icon={Globe}
		showFlagInMessage={true}
		flagCountryCode={countryInfo?.code || pendingPaymentCountry}
		flagCountryName={countryInfo?.name || pendingPaymentCountry}
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

</div>

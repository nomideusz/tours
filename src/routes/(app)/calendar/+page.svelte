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
	import X from 'lucide-svelte/icons/x';
	
	// Components
	import FlagIcon from '$lib/components/FlagIcon.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import CapacitySlider from '$lib/components/CapacitySlider.svelte';
	import { COUNTRY_LIST, getCountryInfo, getCurrencyForCountry, getPaymentMethod } from '$lib/utils/countries.js';
	
	// Tour helpers
	import { formatDuration, getImageUrl, getTourDisplayPriceFormatted } from '$lib/utils/tour-helpers-client.js';
	import { globalCurrencyFormatter } from '$lib/utils/currency.js';
	import { checkConflicts, checkRecurringConflicts } from '$lib/components/time-slot-form/utils/time-utils.js';
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
		
		if (!paymentStatus.isSetup && !paymentStatus.loading) {
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
	
	// Helper function to format date for input (timezone-safe)
	function formatDateForInput(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}
	
	// Helper function to get last used capacity from existing time slots
	function getLastUsedCapacity(timeSlots: any[]): number | null {
		if (!timeSlots || timeSlots.length === 0) return null;
		
		// Sort by creation time descending and get the first one
		const sortedSlots = [...timeSlots].sort((a, b) => {
			const aTime = new Date(a.createdAt || a.created || a.startTime).getTime();
			const bTime = new Date(b.createdAt || b.created || b.startTime).getTime();
			return bTime - aTime; // Most recent first
		});
		
		// Check both field names for compatibility
		// API returns 'capacity' but database stores as 'availableSpots'
		return sortedSlots[0]?.capacity || sortedSlots[0]?.availableSpots || null;
	}
	

	
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
	
	// Helper function to calculate recurring end date
	function getRecurringEndDate(startDate: string, recurringType: string, count: number): string {
		const date = new Date(startDate);
		
		switch (recurringType) {
			case 'daily':
				date.setDate(date.getDate() + count - 1);
				break;
			case 'weekly':
				date.setDate(date.getDate() + (count - 1) * 7);
				break;
			case 'monthly':
				date.setMonth(date.getMonth() + count - 1);
				break;
		}
		
		return date.toISOString().split('T')[0];
	}
	
	// Helper function to calculate total recurring slots
	function calculateTotalRecurringSlots(startDate: string, recurringType: string, count: number): number {
		return count; // Simple: the count is the total number of slots
	}
	
	// Helper function to get smart capacity default
	function getSmartCapacity(tourId: string, tour: any, timeSlots?: any[]): number {
		// Priority order:
		// 1. Last created slot for the same tour (if within this session)
		// 2. Last used capacity from existing time slots
		// 3. Tour's default capacity (if reasonable)
		// 4. Fallback to 10
		
		if (lastCreatedSlot && lastCreatedSlot.tourId === tourId) {
			return lastCreatedSlot.capacity;
		}
		
		if (timeSlots) {
			const lastUsed = getLastUsedCapacity(timeSlots);
			if (lastUsed !== null) return lastUsed;
		}
		
		// Only use tour capacity if it's a reasonable number (not 1)
		// Tours with capacity of 1 are likely misconfigured
		if (tour?.capacity && tour.capacity > 1) {
			return tour.capacity;
		}
		
		// Default to 10 for better UX
		return 10;
	}

	// Generate color for tour based on tour ID/name (same algorithm as TourTimeline)
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
	

	/* Removed old quick-add styles since we're using the new modal design */
	
	.form-group {
		margin-bottom: 1rem;
	}
	
	.form-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.form-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-primary);
	}
	
	@media (max-width: 640px) {
		.form-actions {
			flex-direction: column-reverse;
		}
		
		.form-actions button {
			width: 100%;
		}
	}
	
	/* Tours Legend Section */
	.tours-legend-section {
		margin-top: 2rem;
	}
	
	.tours-legend-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}
	
	.tours-legend-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.tours-legend-table {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		overflow: hidden;
	}
	
	.table-wrapper {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}
	
	.tours-table {
		width: 100%;
		min-width: 320px;
		border-collapse: collapse;
		table-layout: fixed;
	}
	
	.tours-table thead {
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-primary);
	}
	
	.tours-table th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
	}
	
	.table-header-color {
		width: 3rem;
	}
	
	.table-header-actions {
		width: 3rem;
		text-align: center;
	}
	
	.table-header-stats {
		width: 5rem;
		text-align: center;
	}
	
	/* Mobile column widths */
	@media (max-width: 640px) {
		.table-header-color {
			width: 2.5rem;
		}
		
		.table-header-name {
			width: auto; /* Takes remaining space */
		}
		
		.table-header-stats {
			width: 4rem;
		}
		
		.table-header-actions {
			width: 2.5rem;
		}
	}
	
	.tours-table tbody tr {
		border-bottom: 1px solid var(--border-primary);
		transition: background-color 0.2s;
	}
	
	.tours-table tbody tr:last-child {
		border-bottom: none;
	}
	
	.tours-table tbody tr:hover {
		background: var(--bg-secondary);
	}
	
	.tour-row--draft {
		opacity: 0.7;
	}
	
	.tour-row--highlighted {
		animation: highlightPulse 2s ease-in-out;
		background: var(--color-primary-100) !important;
	}
	
	@keyframes highlightPulse {
		0% {
			background: var(--bg-primary);
		}
		20% {
			background: var(--color-primary-100);
			box-shadow: 0 0 0 2px var(--color-primary-200);
		}
		80% {
			background: var(--color-primary-100);
			box-shadow: 0 0 0 2px var(--color-primary-200);
		}
		100% {
			background: var(--bg-primary);
			box-shadow: none;
		}
	}
	
	.tours-table td {
		padding: 0.75rem 1rem;
		vertical-align: middle;
	}
	
	.table-cell-color {
		width: 3rem;
		padding: 0.75rem 0.5rem 0.75rem 1rem;
	}
	
	.table-cell-name {
		font-weight: 500;
	}
	
	.tour-name-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
		color: var(--text-primary);
		font-weight: 500;
		transition: color 0.2s;
	}
	
	.tour-name-link:hover .tour-name-text {
		color: var(--color-primary-600);
		text-decoration: underline;
	}
	
	.tour-badge-draft {
		display: inline-flex;
		align-items: center;
		padding: 0.125rem 0.5rem;
		background: var(--color-warning-100);
		color: var(--color-warning-700);
		border: 1px solid var(--color-warning-200);
		border-radius: 0.25rem;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
	}
	
	.table-cell-location {
		color: var(--text-secondary);
	}
	
	.tour-location {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
	}
	
	.text-muted {
		color: var(--text-tertiary);
	}
	
	.table-cell-price {
		font-weight: 600;
		color: var(--color-primary-600);
	}
	
	.table-cell-stats {
		text-align: center;
	}
	
	.tour-stats-compact {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}
	
	.stat-value {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.stat-label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-tertiary);
	}
	
	.tours-table .table-cell-actions {
		width: 3rem;
		padding: 0.75rem 1rem 0.75rem 0.5rem !important;
		text-align: center;
	}
	
	.button-icon-small {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		background: transparent;
		border: 1px solid var(--border-primary);
		border-radius: 0.375rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.button-icon-small:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border-color: var(--border-secondary);
	}
	
	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--text-secondary);
	}
	
	/* Responsive adjustments */
	@media (max-width: 640px) {
		.tours-table th,
		.tours-table td {
			padding: 0.5rem 0.25rem;
			font-size: 0.875rem;
		}
		
		.table-header-color,
		.table-cell-color {
			width: 2.5rem;
			padding-left: 0.5rem;
			padding-right: 0.25rem;
		}
		
		.table-cell-name {
			padding-left: 0.5rem;
			padding-right: 0.25rem;
		}
		
		.table-cell-stats {
			padding-left: 0.25rem;
			padding-right: 0.25rem;
			text-align: center;
		}
		
		.tours-table .table-cell-actions {
			padding: 0.5rem 0.5rem 0.5rem 0.25rem !important;
		}
		
		.tour-name-text {
			font-size: 0.875rem;
			line-height: 1.25;
		}
		
		.tour-badge-draft {
			font-size: 0.625rem;
			padding: 0.125rem 0.375rem;
		}
	}

	/* Enhanced Modal Styles */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.15s ease;
		padding: 1rem;
	}

	.modal-container {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 1rem;
		width: 100%;
		max-width: 640px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		animation: slideUp 0.2s ease;
		box-shadow: 
			0 25px 50px -12px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	/* Modal Header */
	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-primary);
		background: var(--bg-secondary);
	}

	.modal-header-content {
		flex: 1;
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.25rem 0;
	}

	.modal-subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.modal-close {
		background: transparent;
		border: none;
		padding: 0.375rem;
		cursor: pointer;
		color: var(--text-tertiary);
		transition: all 0.15s ease;
		border-radius: 0.5rem;
		margin-left: 1rem;
	}

	.modal-close:hover:not(:disabled) {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.modal-close:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Progress Steps */
	.modal-steps {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-primary);
	}

	.step {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-tertiary);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.step.active {
		color: var(--text-primary);
	}

	.step.completed {
		color: var(--color-success);
	}

	.step-number {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.75rem;
		background: var(--bg-tertiary);
		border: 2px solid var(--border-primary);
		transition: all 0.2s ease;
	}

	.step.active .step-number {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.step.completed .step-number {
		background: var(--color-success);
		color: white;
		border-color: var(--color-success);
	}

	.step-label {
		font-weight: 500;
	}

	.step-connector {
		width: 60px;
		height: 2px;
		background: var(--border-primary);
		margin: 0 1rem;
		transition: all 0.2s ease;
	}

	.step-connector.active {
		background: var(--color-success);
	}

	/* Modal Content */
	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

	/* Tour Selection Step */
	.tour-selection {
		animation: fadeIn 0.2s ease;
	}

	.tour-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.tour-card {
		position: relative;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
		border: 2px solid var(--border-primary);
		border-radius: 0.75rem;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
	}

	.tour-card:hover {
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.tour-card.selected {
		border-color: var(--color-primary);
		background: var(--color-primary-50);
	}

	.tour-card-image {
		width: 100%;
		height: 100px;
		object-fit: cover;
	}

	.tour-card-placeholder {
		width: 100%;
		height: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-secondary);
		color: var(--text-tertiary);
	}

	.tour-card-content {
		padding: 0.75rem;
		flex: 1;
	}

	.tour-card-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.tour-card-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.tour-card-meta span {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.tour-card-meta :global(svg) {
		width: 14px;
		height: 14px;
		opacity: 0.6;
	}

	.tour-card-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: var(--color-warning-100);
		color: var(--color-warning-600);
		padding: 0.125rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.tour-card-selected-indicator {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: var(--color-primary);
		color: white;
		padding: 0.25rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Empty State */
	.empty-state-card {
		text-align: center;
		padding: 3rem 2rem;
		background: var(--bg-secondary);
		border-radius: 0.75rem;
		border: 1px solid var(--border-primary);
	}

	:global(.empty-state-icon) {
		color: var(--text-tertiary);
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
	}

	.empty-state-text {
		color: var(--text-secondary);
		margin: 0 0 1.5rem 0;
	}

	/* Modal Divider */
	.modal-divider {
		text-align: center;
		margin: 1.5rem 0;
		position: relative;
	}

	.modal-divider::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--border-primary);
	}

	.modal-divider span {
		background: var(--bg-primary);
		padding: 0 1rem;
		position: relative;
		color: var(--text-tertiary);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Configure Slot Step */
	.slot-form {
		animation: fadeIn 0.2s ease;
	}

	.selected-tour-info {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.selected-tour-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.selected-tour-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.change-tour-btn {
		background: transparent;
		border: none;
		color: var(--color-primary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		transition: all 0.15s ease;
	}

	.change-tour-btn:hover {
		background: var(--color-primary-50);
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.capacity-slider-container {
		margin-bottom: 1.5rem;
	}

	.smart-capacity-hint {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: var(--color-success-600);
		margin-top: 0.5rem;
		font-style: italic;
	}

	.capacity-override-hint {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: var(--color-info-600);
		margin-top: 0.5rem;
		font-style: italic;
	}

	.form-group {
		margin-bottom: 0;
	}

	.form-label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	/* Recurring Section */
	.recurring-section {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 0.75rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		user-select: none;
	}

	.checkbox-input {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.recurring-options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-primary);
	}

	.recurring-preview {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-top: 1rem;
		padding: 0.75rem;
		background: var(--color-info-50);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-info-600);
	}

	.recurring-preview :global(svg) {
		flex-shrink: 0;
		margin-top: 1px;
	}

	/* Form Actions */
	.form-actions {
		display: flex;
		gap: 0.75rem;
	}

	.form-actions button {
		flex: 1;
	}

	/* Button Full Width */
	.button--full {
		width: 100%;
	}

	/* Animations */
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from { 
			opacity: 0;
			transform: translateY(20px);
		}
		to { 
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Responsive Design */
	@media (max-width: 640px) {
		.modal-container {
			max-width: 100%;
			max-height: 100%;
			height: 100%;
			border-radius: 0;
		}

		.tour-grid {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.capacity-slider-container {
			margin-bottom: 1rem;
		}

		.smart-capacity-hint,
		.capacity-override-hint {
			font-size: 0.75rem;
		}

		.recurring-options {
			grid-template-columns: 1fr;
		}

		.modal-steps {
			padding: 1rem;
		}

		.step-label {
			display: none;
		}

		.step-connector {
			width: 40px;
			margin: 0 0.5rem;
		}
	}
	
	/* Conflict warning styles */
	.conflict-warning {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		margin-top: -0.5rem;
		margin-bottom: 1rem;
		background: var(--color-error-50);
		color: var(--color-error-700);
		border: 1px solid var(--color-error-200);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: 500;
	}
	
	.conflict-warning :global(svg) {
		flex-shrink: 0;
		color: var(--color-error-600);
	}
	
	.conflict-warning.recurring-conflict {
		background: var(--color-warning-50);
		color: var(--color-warning-700);
		border-color: var(--color-warning-200);
	}
	
	.conflict-warning.recurring-conflict :global(svg) {
		color: var(--color-warning-600);
	}
	
	.form-input.input-error {
		border-color: var(--color-error-500) !important;
		background: var(--color-error-50);
	}
	
	.form-input.input-error:focus {
		box-shadow: 0 0 0 3px var(--color-error-100);
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
		
		<!-- Tours Legend Section - Show whenever tours exist -->
		{#if tours && tours.length > 0}
			<div class="tours-legend-section">
					<div class="tours-legend-header">
						<h2 class="tours-legend-title">Tour Calendar Legend</h2>
						<button onclick={() => goto('/tours/new')} class="button-primary button--small button--gap">
							<Plus class="h-4 w-4" />
							<span class="hidden sm:inline">Add Tour</span>
						</button>
					</div>
					
					<div class="tours-legend-table">
						<div class="table-wrapper">
							<table class="tours-table">
							<thead>
								<tr>
									<th class="table-header-color"></th>
									<th class="table-header-name">Tour Name</th>
									<th class="table-header-location hidden sm:table-cell">Location</th>
									<th class="table-header-price hidden md:table-cell">Price</th>
									<th class="table-header-stats">Upcoming</th>
									<th class="table-header-actions"></th>
								</tr>
							</thead>
							<tbody>
								{#each tours as tour}
									<tr 
										class="tour-row {tour.status === 'draft' ? 'tour-row--draft' : ''} {highlightedTourId === tour.id ? 'tour-row--highlighted' : ''}"
										id="tour-row-{tour.id}"
									>
										<td class="table-cell-color">
											<div 
												style="display: inline-block; width: 24px; height: 24px; background-color: {getTourCalendarColor(tour.id, tour.name)}; border: 1px solid rgba(0,0,0,0.1); border-radius: 4px;"
												title="Calendar color for {tour.name}"
											></div>
										</td>
										<td class="table-cell-name">
											<button 
												onclick={() => goto(`/tours/${tour.id}`)}
												class="tour-name-link"
											>
												<span class="tour-name-text">{tour.name}</span>
												{#if tour.status === 'draft'}
													<span class="tour-badge-draft">Draft</span>
												{/if}
											</button>
										</td>
										<td class="table-cell-location hidden sm:table-cell">
											{#if tour.location}
												<div class="tour-location">
													<MapPin class="h-3 w-3" />
													<span>{tour.location}</span>
												</div>
											{:else}
												<span class="text-muted">—</span>
											{/if}
										</td>
										<td class="table-cell-price hidden md:table-cell">
											<span class="tour-price">
												{getTourDisplayPriceFormatted(tour)}
											</span>
										</td>
										<td class="table-cell-stats">
											<div class="tour-stats-compact">
												<span class="stat-value">{tour.upcomingSlots || 0}</span>
												<span class="stat-label">slots</span>
											</div>
										</td>
										<td class="table-cell-actions">
											<button 
												onclick={() => goto(`/tours/${tour.id}`)}
												class="button-icon-small"
												title="Manage tour"
											>
												<Settings class="h-4 w-4" />
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
						</div>
						
						{#if tours.length === 0}
							<div class="empty-state">
								<p>No tours yet. Create your first tour to see it here.</p>
							</div>
						{/if}
					</div>
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
	
	<!-- Enhanced Quick Add Modal -->
	{#if showQuickAddModal}
		<div 
			class="modal-backdrop" 
			onclick={(e) => {
				if (e.target === e.currentTarget && !isAddingSlot) {
					showQuickAddModal = false;
				}
			}}
			onkeydown={(e) => {
				if (e.key === 'Escape' && !isAddingSlot) {
					showQuickAddModal = false;
				}
			}}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="modal-container">
				<!-- Modal Header -->
				<div class="modal-header">
					<div class="modal-header-content">
						<h2 class="modal-title">
							{#if quickAddStep === 'select-tour'}
								Choose Tour
							{:else}
								Configure Time Slot
							{/if}
						</h2>
						<p class="modal-subtitle">
							{quickAddDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
						</p>
					</div>
					<button
						onclick={() => showQuickAddModal = false}
						class="modal-close"
						disabled={isAddingSlot}
						aria-label="Close modal"
					>
						<X class="h-5 w-5" />
					</button>
				</div>

				<!-- Modal Progress Steps -->
				<div class="modal-steps">
					<div class="step {quickAddStep === 'select-tour' ? 'active' : quickAddStep === 'configure-slot' ? 'completed' : ''}">
						<div class="step-number">{quickAddStep === 'configure-slot' ? '✓' : '1'}</div>
						<span class="step-label">Select Tour</span>
					</div>
					<div class="step-connector {quickAddStep === 'configure-slot' ? 'active' : ''}"></div>
					<div class="step {quickAddStep === 'configure-slot' ? 'active' : ''}">
						<div class="step-number">2</div>
						<span class="step-label">Add Details</span>
					</div>
				</div>

				<!-- Modal Content -->
				<div class="modal-content">
					{#if quickAddStep === 'select-tour'}
						<!-- Step 1: Select Tour -->
						<div class="tour-selection">
							{#if tours.length === 0}
								<div class="empty-state-card">
									<MapPin class="h-12 w-12 empty-state-icon" />
									<h3 class="empty-state-title">No Tours Available</h3>
									<p class="empty-state-text">Create your first tour to start adding time slots</p>
									<button
										onclick={() => {
											showQuickAddModal = false;
											goto('/tours/new');
										}}
										class="button-primary button--gap"
									>
										<Plus class="h-4 w-4" />
										Create Your First Tour
									</button>
								</div>
							{:else}
								<div class="tour-grid">
									{#each tours as tour}
										{@const isSelected = selectedTourForSlot === tour.id}
										<button
											onclick={async () => {
												// Always fetch fresh data, even if same tour selected again
												const isAlreadySelected = selectedTourForSlot === tour.id;
												selectedTourForSlot = tour.id;
												
												// Always clear and refetch to ensure we have latest data
												selectedTourSlots = [];
												
												// Fetch tour schedule to get smart capacity and existing slots
												// Add timestamp to prevent caching issues
												try {
													const response = await fetch(`/api/tour-schedule/${tour.id}?t=${Date.now()}`);
													if (response.ok) {
														const data = await response.json();
														selectedTourSlots = data.timeSlots || [];
														console.log('=== FETCHED TOUR SLOTS ===');
														console.log('Tour ID:', tour.id);
														console.log('Number of slots:', selectedTourSlots.length);
														if (selectedTourSlots.length > 0) {
															console.log('Sample slot:', selectedTourSlots[0]);
														}
														console.log('=== END FETCH ===');
														const smartCapacity = getSmartCapacity(tour.id, tour, data.timeSlots);
														timeSlotForm.capacity = smartCapacity;
													} else {
														selectedTourSlots = [];
														console.warn('Failed to fetch slots - response not ok');
														// Fallback to tour capacity or last created
														timeSlotForm.capacity = getSmartCapacity(tour.id, tour);
													}
												} catch (error) {
													console.error('Error fetching tour schedule:', error);
													selectedTourSlots = [];
													// Fallback to tour capacity or last created
													timeSlotForm.capacity = getSmartCapacity(tour.id, tour);
												}
												
												// Auto-advance to next step only after slots are loaded
												// Small delay for better UX
												setTimeout(() => {
													quickAddStep = 'configure-slot';
												}, 200);
											}}
											class="tour-card {isSelected ? 'selected' : ''}"
										>
											{#if tour.images && tour.images.length > 0}
												<img 
													src={getImageUrl(tour, tour.images[0])} 
													alt={tour.name}
													class="tour-card-image"
												/>
											{:else}
												<div class="tour-card-placeholder">
													<MapPin class="h-8 w-8" />
												</div>
											{/if}
											<div class="tour-card-content">
												<h4 class="tour-card-name">{tour.name}</h4>
																		<div class="tour-card-meta">
							<span class="tour-card-duration">
								<Clock class="h-3.5 w-3.5" />
								{formatDuration(tour.duration)}
							</span>
						</div>
												{#if tour.status === 'draft'}
													<span class="tour-card-badge">Draft</span>
												{/if}
											</div>
											{#if isSelected}
												<div class="tour-card-selected-indicator">
													<CheckCircle class="h-5 w-5" />
												</div>
											{/if}
										</button>
									{/each}
								</div>
								
								<div class="modal-divider">
									<span>or</span>
								</div>
								
								<button
									onclick={() => {
										showQuickAddModal = false;
										goto('/tours/new');
									}}
									class="button-secondary button--gap button--full"
								>
									<Plus class="h-4 w-4" />
									Create New Tour
								</button>
							{/if}
						</div>
					{:else if quickAddStep === 'configure-slot'}
						<!-- Step 2: Configure Time Slot -->
						{@const selectedTour = tours.find(t => t.id === selectedTourForSlot)}
						<form 
							class="slot-form"
							onsubmit={async (e) => {
								e.preventDefault();
								if (!selectedTourForSlot || !quickAddDate || isAddingSlot || hasConflict) return;
								
								isAddingSlot = true;
								
								try {
									// Create full date-time strings
									const dateStr = formatDateForInput(quickAddDate);
									const startDateTime = new Date(`${dateStr}T${timeSlotForm.startTime}:00`);
									const endDateTime = new Date(`${dateStr}T${timeSlotForm.endTime}:00`);
									
									const requestBody = {
										startTime: startDateTime.toISOString(),
										endTime: endDateTime.toISOString(),
										capacity: timeSlotForm.capacity,
										status: 'available',
										recurring: timeSlotForm.recurring,
										recurringType: timeSlotForm.recurringType,
										recurringCount: timeSlotForm.recurringCount
									};
									
									const response = await fetch(`/api/tours/${selectedTourForSlot}/schedule`, {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify(requestBody)
									});
									
									if (response.ok) {
										// Remember the last created slot info for smart suggestions
										lastCreatedSlot = {
											time: timeSlotForm.startTime,
											date: formatDateForInput(quickAddDate),
											capacity: timeSlotForm.capacity,
											tourId: selectedTourForSlot
										};
										
										const savedTourId = selectedTourForSlot; // Save for cache invalidation
										
										// Invalidate cache immediately to ensure fresh data on next open
										await queryClient.invalidateQueries({ 
											queryKey: ['tour-schedule', savedTourId]
										});
										await queryClient.invalidateQueries({ 
											queryKey: ['allTimeSlots']
										});
										
										// Clear the cached slots for this tour to force refetch next time
										selectedTourSlots = [];
										
										// Close modal and reset form
										showQuickAddModal = false;
										quickAddStep = 'select-tour';
										selectedTourForSlot = '';
										timeSlotForm = {
											startTime: '10:00',
											endTime: '12:00',
											capacity: 10,
											recurring: false,
											recurringType: 'weekly',
											recurringCount: 4
										};
										
										// You could add a toast notification here for success
									} else {
										const error = await response.json();
										console.error('Failed to add time slot:', error);
										// You could show an error message here
									}
								} catch (error) {
									console.error('Error adding time slot:', error);
								} finally {
									isAddingSlot = false;
								}
							}}
						>
							{#if selectedTour}
								<div class="selected-tour-info">
									<div class="selected-tour-header">
										<h4 class="selected-tour-name">{selectedTour.name}</h4>
										<button
											type="button"
											onclick={() => quickAddStep = 'select-tour'}
											class="change-tour-btn"
										>
											Change tour
										</button>
									</div>
								</div>
							{/if}
							
							<div class="form-grid">
								<div class="form-group">
									<label for="slot-start-time" class="form-label">Start Time</label>
									<input
										id="slot-start-time"
										type="time"
										bind:value={timeSlotForm.startTime}
										class="form-input {hasConflict ? 'input-error' : ''}"
										required
										disabled={isAddingSlot}
									/>
								</div>
								
								<div class="form-group">
									<label for="slot-end-time" class="form-label">End Time</label>
									<input
										id="slot-end-time"
										type="time"
										bind:value={timeSlotForm.endTime}
										class="form-input {hasConflict ? 'input-error' : ''}"
										required
										disabled={isAddingSlot}
									/>
								</div>
							</div>
							
							{#if hasConflict}
								<div class="conflict-warning {timeSlotForm.recurring ? 'recurring-conflict' : ''}">
									<AlertCircle class="w-4 h-4" />
									<span>{conflictMessage}</span>
								</div>
							{/if}
							
							<!-- Capacity Slider -->
							<div class="capacity-slider-container">
								<CapacitySlider
									bind:value={timeSlotForm.capacity}
									label="Available Spots"
									min={1}
									max={200}
									step={1}
									disabled={isAddingSlot}
									showMarkers={true}
									unit="spots"
									defaultValue={lastCreatedSlot?.tourId === selectedTourForSlot ? lastCreatedSlot.capacity : (selectedTour?.capacity && selectedTour.capacity > 1 ? selectedTour.capacity : 10)}
								/>
								{#if lastCreatedSlot?.tourId === selectedTourForSlot}
									<p class="smart-capacity-hint">
										<CheckCircle class="w-4 h-4 inline" />
										Using capacity from your last slot
									</p>
								{:else if selectedTour?.capacity === 1 && timeSlotForm.capacity === 10}
									<p class="smart-capacity-hint">
										<CheckCircle class="w-4 h-4 inline" />
										Using recommended default capacity
									</p>
								{:else if selectedTour?.capacity && selectedTour.capacity > 1 && timeSlotForm.capacity > selectedTour.capacity}
									<p class="capacity-override-hint">
										<Info class="w-4 h-4 inline" />
										Exceeds tour's default capacity of {selectedTour.capacity}
									</p>
								{/if}
							</div>
							
							<!-- Recurring Options -->
							<div class="recurring-section">
								<label class="checkbox-label">
									<input
										type="checkbox"
										bind:checked={timeSlotForm.recurring}
										disabled={isAddingSlot}
										class="checkbox-input"
									/>
									<span>Create recurring slots</span>
								</label>
								
								{#if timeSlotForm.recurring}
									<div class="recurring-options">
										<div class="form-group">
											<label for="recurring-type" class="form-label">Repeat</label>
											<select
												id="recurring-type"
												bind:value={timeSlotForm.recurringType}
												class="form-select"
												disabled={isAddingSlot}
											>
												<option value="daily">Daily</option>
												<option value="weekly">Weekly</option>
												<option value="monthly">Monthly</option>
											</select>
										</div>
										
										<div class="form-group">
											<label for="recurring-count" class="form-label">Number of occurrences</label>
											<input
												id="recurring-count"
												type="number"
												bind:value={timeSlotForm.recurringCount}
												class="form-input"
												min="2"
												max="52"
												disabled={isAddingSlot}
											/>
										</div>
									</div>
									
									<div class="recurring-preview">
										<Info class="h-4 w-4" />
										<span>
											This will create {timeSlotForm.recurringCount} slots, 
											{timeSlotForm.recurringType === 'daily' ? 'one each day' : 
											 timeSlotForm.recurringType === 'weekly' ? 'one each week' : 
											 'one each month'}
										</span>
									</div>
								{/if}
							</div>
							
							<div class="form-actions">
								<button
									type="button"
									onclick={() => quickAddStep = 'select-tour'}
									class="button-secondary"
									disabled={isAddingSlot}
								>
									Back
								</button>
								<button
									type="submit"
									class="button-primary button--gap"
									disabled={isAddingSlot || hasConflict}
								>
									{#if isAddingSlot}
										<Loader2 class="h-4 w-4 animate-spin" />
										Adding...
									{:else if hasConflict}
										<AlertCircle class="h-4 w-4" />
										{timeSlotForm.recurring ? `${recurringConflictCount} Conflicts` : 'Time Conflict'}
									{:else}
										<Plus class="h-4 w-4" />
										Add {timeSlotForm.recurring ? `${timeSlotForm.recurringCount} Slots` : 'Slot'}
									{/if}
								</button>
							</div>
						</form>
					{/if}
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

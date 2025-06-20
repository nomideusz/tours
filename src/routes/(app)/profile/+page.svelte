<script lang="ts">
	import User from 'lucide-svelte/icons/user';
	import Lock from 'lucide-svelte/icons/lock';
	import Mail from 'lucide-svelte/icons/mail';
	import Shield from 'lucide-svelte/icons/shield';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import Save from 'lucide-svelte/icons/save';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Activity from 'lucide-svelte/icons/activity';
	import Users from 'lucide-svelte/icons/users';
	import Globe from 'lucide-svelte/icons/globe';
	import Phone from 'lucide-svelte/icons/phone';
	import Building from 'lucide-svelte/icons/building';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Copy from 'lucide-svelte/icons/copy';
	import { onMount } from 'svelte';
	import { toastError, toastSuccess } from '$lib/utils/toast.js';
	import { browser } from '$app/environment';
	import { detectCountry } from '$lib/utils/country-detector.js';
	import { userCurrency, setUserCurrencyFromServer, SUPPORTED_CURRENCIES, type Currency } from '$lib/stores/currency.js';
	import Upload from 'lucide-svelte/icons/upload';
	import X from 'lucide-svelte/icons/x';


	// Profile Components
	import ProfileAvatar from '$lib/components/profile/ProfileAvatar.svelte';
	import PersonalInfoForm from '$lib/components/profile/PersonalInfoForm.svelte';
	import PasswordChangeForm from '$lib/components/profile/PasswordChangeForm.svelte';
	import ProfileSummary from '$lib/components/profile/ProfileSummary.svelte';
	import PaymentSetup from '$lib/components/profile/PaymentSetup.svelte';
	import AccountInfo from '$lib/components/profile/AccountInfo.svelte';
	import PreferencesSection from '$lib/components/profile/PreferencesSection.svelte';

	// TanStack Query
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	// TanStack Query client for invalidation
	const queryClient = useQueryClient();

	// TanStack Query for profile data
	const profileQuery = createQuery({
		queryKey: queryKeys.profile,
		queryFn: queryFunctions.fetchProfile,
		staleTime: 0, // Always consider data stale to ensure fresh data on refresh
		gcTime: 5 * 60 * 1000, // 5 minutes cache
		refetchOnWindowFocus: true,
		refetchOnMount: 'always', // Always refetch on mount to ensure fresh data
	});

	const profileStatsQuery = createQuery({
		queryKey: queryKeys.profileStats,
		queryFn: queryFunctions.fetchProfileStats,
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 5 * 60 * 1000,    // 5 minutes
	});

	// Derive data from queries
	let user = $derived($profileQuery.data || {});
	let profileStats = $derived.by(() => {
		const rawStats = $profileStatsQuery.data;
		if (!rawStats) {
			return {
				totalTours: 0,
				activeTours: 0,
				totalBookings: 0,
				totalRevenue: 0,
				totalParticipants: 0,
				accountAge: 0
			};
		}
		
		// Map the API response to expected format
		const mappedStats = {
			totalTours: rawStats.totalTours || 0,
			activeTours: rawStats.activeTours || 0,
			totalBookings: rawStats.upcomingTours || 0, // Use upcomingTours as a proxy for total bookings
			totalRevenue: rawStats.weeklyRevenue || 0, // Weekly revenue
			totalParticipants: rawStats.totalCustomers || 0, // Total unique customers
			accountAge: rawStats.monthlyTours || 0 // Monthly tours created
		};
		
		console.log('📊 Profile stats mapping:', { rawStats, mappedStats });
		return mappedStats;
	});

	let isLoading = $derived($profileQuery.isLoading || $profileStatsQuery.isLoading);
	let isError = $derived($profileQuery.isError || $profileStatsQuery.isError);

	// Loading states
	let profileLoading = $state(false);
	let passwordLoading = $state(false);
	let verificationLoading = $state(false);
	let paymentStatusLoading = $state(true);

	// Form data - initialized with reactive updates from query data
	let name = $state('');
	let username = $state('');
	let businessName = $state('');
	let description = $state('');
	let phone = $state('');
	let website = $state('');
	let country = $state('');
	let currency = $state('EUR');

	// Derived values to ensure proper defaults
	let displayCountry = $derived(country || user?.country || '');
	let displayCurrency = $derived(currency || user?.currency || 'EUR');

	// Track if form has been initialized to prevent overwriting user changes
	let formInitialized = $state(false);

	// Update form data when user data is loaded (only on first load)
	$effect(() => {
		if (user && Object.keys(user).length > 0 && !formInitialized) {
			// Update form data only on initial load
			name = user.name || '';
			username = user.username || '';
			businessName = user.businessName || '';
			description = user.description || '';
			phone = user.phone || '';
			website = user.website || '';
			country = user.country || '';
			currency = user.currency || 'EUR';
			avatarLoadError = false; // Reset avatar error on data load
			formInitialized = true; // Mark as initialized
			
			// Store original form data to track changes (deep copy to prevent reference issues)
			originalFormData = JSON.parse(JSON.stringify({
				name: user.name || '',
				username: user.username || '',
				businessName: user.businessName || '',
				description: user.description || '',
				phone: user.phone || '',
				website: user.website || '',
				country: user.country || '',
				currency: user.currency || 'EUR'
			}));
			
			console.log('📋 Form data initialized from user:', { 
				userCountry: user.country, 
				userCurrency: user.currency, 
				userCountryType: typeof user.country,
				userCurrencyType: typeof user.currency,
				formCountry: country, 
				formCurrency: currency 
			});
		}
	});

	// Track unsaved changes using derived value (more reliable than $effect for this use case)
	let hasUnsavedChanges = $derived.by(() => {
		if (!formInitialized || !originalFormData || Object.keys(originalFormData).length === 0) {
			console.log('🔍 Form not initialized yet or no original data');
			return false;
		}
		
		const currentFormData = {
			name, username, businessName, description, phone, website, country, currency
		};
		const hasChanges = JSON.stringify(currentFormData) !== JSON.stringify(originalFormData);
		
		// Debug logging
		console.log('🔍 Profile changes check:', {
			formInitialized,
			hasChanges,
			currentFormData,
			originalFormData
		});
		
		return hasChanges;
	});

	// Password form data
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordError = $state('');

	// Payment status
	let paymentStatus: {
		hasAccount: boolean;
		isSetupComplete: boolean;
		canReceivePayments: boolean;
		accountInfo?: {
			businessName?: string;
			requiresAction?: boolean;
			[key: string]: any;
		} | null;
	} = $state({
		hasAccount: false,
		isSetupComplete: false,
		canReceivePayments: false,
		accountInfo: null
	});

	// Profile link state
	let profileLinkCopied = $state(false);

	// Avatar upload state
	let selectedAvatar: File | null = $state(null);
	let avatarPreview = $state('');
	let avatarInputElement: HTMLInputElement | undefined = $state();
	let avatarLoadError = $state(false);
	let uploadingAvatar = $state(false);

	// Error and success states
	let errorMessage = $state('');
	let profileSaved = $state(false);
	let passwordChanged = $state(false);
	let avatarSaved = $state(false);
	let avatarRemoved = $state(false);
	let personalInfoSaved = $state(false);
	let businessInfoSaved = $state(false);

	// Track original form data for change detection
	let originalFormData = $state<any>({});

	// Load payment status when user data is available
	$effect(() => {
		if (user?.id) {
			loadPaymentStatus();
		}
	});

	async function loadPaymentStatus() {
		try {
			paymentStatusLoading = true;
			const response = await fetch(`/api/payments/connect/status?userId=${user.id}`);
			if (response.ok) {
				paymentStatus = await response.json();
			}
		} catch (error) {
			console.error('Failed to load payment status:', error);
		} finally {
			paymentStatusLoading = false;
		}
	}

	// Copy profile link function
	async function copyProfileLink() {
		if (!username) return;
		try {
			const profileUrl = `${window.location.origin}/${username}`;
			await navigator.clipboard.writeText(profileUrl);
			profileLinkCopied = true;
			setTimeout(() => {
				profileLinkCopied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy link:', err);
		}
	}

	// Personal info update function
	async function updatePersonalInfo() {
		profileLoading = true;
		errorMessage = '';

		try {
			const formData = new FormData();
			formData.append('name', name);
			formData.append('username', username);
			formData.append('businessName', businessName);
			formData.append('description', description);
			formData.append('phone', phone);
			formData.append('website', website);
			formData.append('country', country);
			formData.append('currency', currency);

			const response = await fetch('/api/profile/update', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to update personal information');
			}

			if (result.success) {
				// Update the currency store
				userCurrency.set(currency as Currency);
				
				// Update original form data to reflect saved state (deep copy to prevent reference issues)
				originalFormData = JSON.parse(JSON.stringify({ name, username, businessName, description, phone, website, country, currency }));
				
				// Force remove all cached data and refetch immediately
				queryClient.removeQueries({ queryKey: queryKeys.profile });
				await queryClient.refetchQueries({ 
					queryKey: queryKeys.profile,
					type: 'active'
				});
				
				// Show inline success feedback
				personalInfoSaved = true;
				setTimeout(() => {
					personalInfoSaved = false;
				}, 3000);
			}
		} catch (error) {
			console.error('Personal info update error:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to update personal information';
		} finally {
			profileLoading = false;
		}
	}

	// Password change function
	async function changePassword() {
		passwordLoading = true;
		passwordError = '';
		errorMessage = '';

		try {
			const formData = new FormData();
			formData.append('currentPassword', currentPassword);
			formData.append('newPassword', newPassword);
			formData.append('confirmPassword', confirmPassword);

			const response = await fetch('/api/profile/change-password', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to change password');
			}

			if (result.success) {
				currentPassword = '';
				newPassword = '';
				confirmPassword = '';
				
				// Show inline success feedback
				passwordChanged = true;
				setTimeout(() => {
					passwordChanged = false;
				}, 3000);
			}
		} catch (error) {
			console.error('Password change error:', error);
			passwordError = error instanceof Error ? error.message : 'Failed to change password';
		} finally {
			passwordLoading = false;
		}
	}

	// Payment setup function
	async function setupPayments() {
		try {
			const response = await fetch('/api/payments/connect/setup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user.id,
					email: user.email,
					businessName: businessName || user.businessName || user.name,
					country: country || user.country || 'DE'
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
			errorMessage = error instanceof Error ? error.message : 'Failed to setup payment account';
		}
	}

	// Avatar upload functions
	async function onAvatarSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (file) {
			// Validate file type and size
			const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
			if (!validTypes.includes(file.type)) {
				toastError('Please select a valid image file (JPEG, PNG, or WebP)');
				return;
			}
			
			if (file.size > 2 * 1024 * 1024) { // 2MB limit
				toastError('Avatar image must be smaller than 2MB');
				return;
			}
			
			selectedAvatar = file;
			
			// Create preview immediately for instant feedback
			const reader = new FileReader();
			reader.onload = (e) => {
				avatarPreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
			
			// Auto-save avatar immediately
			await saveAvatarOnly();
		}
	}

	// Auto-save avatar function
	async function saveAvatarOnly() {
		if (!selectedAvatar) return;
		
		try {
			uploadingAvatar = true;
			const formData = new FormData();
			formData.append('avatar', selectedAvatar);

			const response = await fetch('/api/profile/avatar', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to update avatar');
			}

			if (result.success) {
				// Clear selected file
				selectedAvatar = null;
				
				// Update the user avatar URL immediately for instant feedback
				if (result.avatar) {
					// Force refresh profile data immediately
					await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
					
					// Keep the preview until the actual data loads, then clear it
					setTimeout(() => {
						avatarPreview = '';
						avatarLoadError = false; // Reset any previous load errors
					}, 2000);
				}
				
				// Show success feedback
				avatarSaved = true;
				setTimeout(() => {
					avatarSaved = false;
				}, 3000);
			}
		} catch (error) {
			console.error('Avatar update error:', error);
			toastError(error instanceof Error ? error.message : 'Failed to update avatar');
			// Clear preview on error
			avatarPreview = '';
		} finally {
			uploadingAvatar = false;
		}
	}

	async function removeAvatar() {
		try {
			uploadingAvatar = true;
			
			// Create form data to remove avatar
			const formData = new FormData();
			formData.append('remove', 'true'); // Signal to remove avatar

			const response = await fetch('/api/profile/avatar', {
				method: 'DELETE'
			});

			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.error || 'Failed to remove avatar');
			}

			// Clear local state immediately for instant feedback
			selectedAvatar = null;
			avatarPreview = '';
			avatarLoadError = false;
			if (avatarInputElement) {
				avatarInputElement.value = '';
			}

			// Refresh profile data
			await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
			
			// Show success feedback for removal
			avatarRemoved = true;
			setTimeout(() => {
				avatarRemoved = false;
			}, 3000);
		} catch (error) {
			console.error('Avatar removal error:', error);
			toastError(error instanceof Error ? error.message : 'Failed to remove avatar');
		} finally {
			uploadingAvatar = false;
		}
	}

	// Country to currency mapping for new users
	const countryCurrencyMap: Record<string, string> = {
		'US': 'USD',
		'GB': 'GBP', 
		'UK': 'GBP',
		'JP': 'JPY',
		'CA': 'CAD',
		'AU': 'AUD',
		'CH': 'CHF',
		'SE': 'SEK',
		'NO': 'NOK',
		'DK': 'DKK',
		'PL': 'PLN',
		'CZ': 'CZK',
		'DE': 'EUR',
		'FR': 'EUR',
		'IT': 'EUR',
		'ES': 'EUR',
		'NL': 'EUR',
		'BE': 'EUR',
		'AT': 'EUR',
		'PT': 'EUR',
		'IE': 'EUR',
		'FI': 'EUR',
		'GR': 'EUR',
		'LU': 'EUR',
		'MT': 'EUR',
		'CY': 'EUR',
		'SK': 'EUR',
		'SI': 'EUR',
		'EE': 'EUR',
		'LV': 'EUR',
		'LT': 'EUR'
	};

	// Function to get currency for country
	function getCurrencyForCountry(countryCode: string): string {
		return countryCurrencyMap[countryCode] || 'EUR';
	}

	// Initialize currency store and detect country on client-side
	onMount(() => {
		// Set user currency in store from server data
		if (user?.currency) {
			setUserCurrencyFromServer(user.currency);
		}
		
		// If no country is set, detect it on client-side
		if (!country && browser) {
			const detectedCountry = detectCountry();
			country = detectedCountry;
			
			// If user has no existing currency preference, set it based on detected country
			if (!user?.currency && detectedCountry) {
				const suggestedCurrency = getCurrencyForCountry(detectedCountry);
				currency = suggestedCurrency;
				console.log(`💱 Setting initial currency to ${suggestedCurrency} based on detected country ${detectedCountry}`);
			}
		}
	});
</script>

<svelte:head>
	<title>Profile Settings - Zaur</title>
</svelte:head>

{#if isLoading}
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
		<div class="flex justify-center items-center py-12">
			<LoadingSpinner size="large" text="Loading profile..." />
		</div>
	</div>
{:else if isError}
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
		<ErrorAlert variant="error" message="Failed to load profile data. Please refresh the page." />
	</div>
{:else}
<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Mobile-First Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Compact Header -->
		<MobilePageHeader
			title="Profile Settings"
			secondaryInfo={user?.name || 'Profile'}
			quickActions={[
				{
					label: 'View Public',
					icon: ExternalLink,
					onclick: () => username && window.open(`/${username}`, '_blank'),
					variant: 'primary',
					disabled: !username
				},
				{
					label: profileLinkCopied ? 'Copied!' : 'Copy Link',
					icon: profileLinkCopied ? CheckCircle : Copy,
					onclick: copyProfileLink,
					variant: 'secondary',
					disabled: !username
				}
			]}
			infoItems={[
				{
					icon: User,
					label: 'Username',
					value: username ? `@${username}` : 'Not set'
				},
				{
					icon: Mail,
					label: 'Email',
					value: user?.verified ? 'Verified' : 'Unverified'
				},
				{
					icon: MapPin,
					label: 'Tours',
					value: `${profileStats.totalTours} total`
				},
				{
					icon: Activity,
					label: 'Status',
					value: paymentStatus.canReceivePayments ? 'Active' : 'Setup needed'
				}
			]}
		/>

		<!-- Desktop Header -->
		<div class="hidden sm:block">
			<PageHeader 
				title="Profile Settings"
				subtitle="Manage your account information and preferences"
			>
				<div class="flex gap-3">
					{#if username}
						<button onclick={() => window.open(`/${username}`, '_blank')} class="button-secondary button--gap">
							<ExternalLink class="h-4 w-4" />
							View Public Profile
						</button>
						<button onclick={copyProfileLink} class="button-secondary button--gap">
							{#if profileLinkCopied}
								<CheckCircle class="h-4 w-4" />
								Copied!
							{:else}
								<Copy class="h-4 w-4" />
								Copy Profile Link
							{/if}
						</button>
					{/if}
				</div>
			</PageHeader>
		</div>
	</div>

	<!-- Error Messages -->
	{#if errorMessage}
		<div class="mb-6">
			<ErrorAlert variant="error" message={errorMessage} />
		</div>
	{/if}

	<!-- Profile Stats Overview -->
	<div class="hidden sm:block mb-6">
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<StatsCard
				title="Tours Created"
				value={profileStats.totalTours || 0}
				subtitle="{profileStats.activeTours || 0} active"
				icon={MapPin}
				trend={(profileStats.activeTours || 0) > 0 ? { value: `${profileStats.activeTours} active`, positive: true } : undefined}
				variant="small"
			/>

			<StatsCard
				title="Upcoming Tours"
				value={profileStats.totalBookings}
				subtitle="scheduled"
				icon={Users}
				variant="small"
			/>

			<StatsCard
				title="Revenue Earned"
				value={`${SUPPORTED_CURRENCIES[currency as Currency]?.symbol || '€'}${profileStats.totalRevenue || 0}`}
				subtitle="weekly earnings"
				icon={DollarSign}
				variant="small"
			/>

			<StatsCard
				title="Guests Served"
				value={profileStats.totalParticipants}
				subtitle="{profileStats.accountAge} days active"
				icon={Activity}
				variant="small"
			/>
		</div>
	</div>

	<!-- Main Content Grid -->
	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Profile Information - Takes 2 columns on desktop -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Personal Information -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center gap-3">
						<div class="p-2 rounded-lg" style="background: var(--color-primary-50);">
							<User class="h-4 w-4" style="color: var(--color-primary-600);" />
						</div>
						<div>
							<h2 class="font-semibold" style="color: var(--text-primary);">Personal Information</h2>
							<p class="text-sm" style="color: var(--text-secondary);">Update your profile details</p>
						</div>
					</div>
				</div>
				<div class="p-4 sm:p-6 space-y-8">
					<!-- Avatar Section -->
					<ProfileAvatar
						{user}
						{avatarPreview}
						{avatarSaved}
						{avatarRemoved}
						{avatarLoadError}
						{uploadingAvatar}
						onAvatarSelect={onAvatarSelect}
						onRemoveAvatar={removeAvatar}
					/>

					<!-- Personal Information Form -->
					<PersonalInfoForm
						{user}
						bind:name
						bind:username
						bind:businessName
						bind:description
						bind:phone
						bind:website
						bind:country
						bind:currency
						onSubmit={updatePersonalInfo}
						loading={profileLoading}
					/>

					<!-- Success Message (when saved) -->
					{#if personalInfoSaved}
						<div class="flex items-center justify-center gap-2 text-sm pt-6 mt-8" style="color: var(--color-success); border-top: 1px solid var(--border-primary);">
							<CheckCircle class="h-4 w-4" />
							Profile updated successfully!
						</div>
					{/if}
				</div>
			</div>

			<!-- Security Section -->
			{#if !user?.isOAuth2User}
				<PasswordChangeForm
					bind:currentPassword
					bind:newPassword
					bind:confirmPassword
					{passwordError}
					{passwordChanged}
					{passwordLoading}
					onSubmit={changePassword}
				/>
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Profile Summary -->
			<ProfileSummary
				{user}
				{username}
				{businessName}
				{phone}
				{website}
				{avatarPreview}
				{avatarLoadError}
			/>

			<!-- Payment Setup Section -->
			<PaymentSetup
				{paymentStatus}
				{paymentStatusLoading}
				onSetupPayments={setupPayments}
			/>

			<!-- Account Info -->
			<AccountInfo {user} />

			<!-- Preferences -->
			<PreferencesSection />
		</div>
	</div>

	<!-- Floating Save Button -->
	{#if hasUnsavedChanges}
		<div class="fixed z-50 transition-all duration-300 ease-out floating-save-container">
			<button
				onclick={updatePersonalInfo}
				disabled={profileLoading}
				class="floating-save-btn"
				title={profileLoading ? 'Saving...' : personalInfoSaved ? 'Saved!' : 'Save Changes'}
			>
				{#if profileLoading}
					<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
				{:else}
					<Save class="w-4 h-4" />
				{/if}
			</button>
		</div>
	{/if}
</div>
{/if}

<style lang="postcss">
	@reference "tailwindcss";
	
	/* Floating Save Button Positioning */
	.floating-save-container {
		bottom: 2rem;
		right: 2rem;
	}

	/* Mobile positioning - account for bottom navigation */
	@media (max-width: 767px) {
		.floating-save-container {
			bottom: calc(env(safe-area-inset-bottom, 0px) + 5rem);
			right: 1.5rem;
		}
	}

	/* Desktop positioning - align with form content */
	@media (min-width: 1024px) {
		.floating-save-container {
			right: max(2rem, calc((100vw - 80rem) / 2 + 2rem));
		}
	}

	/* Floating Save Button Styling */
	.floating-save-btn {
		position: relative;
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		border: none;
		cursor: pointer;
		color: white;
		background: var(--color-primary-600);
		box-shadow: 
			0 4px 12px rgba(0, 0, 0, 0.15),
			0 2px 4px rgba(0, 0, 0, 0.1);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.floating-save-btn:hover:not(:disabled) {
		background: var(--color-primary-700);
		transform: translateY(-1px);
		box-shadow: 
			0 6px 16px rgba(0, 0, 0, 0.2),
			0 3px 6px rgba(0, 0, 0, 0.15);
	}

	.floating-save-btn:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: 
			0 2px 8px rgba(0, 0, 0, 0.15),
			0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.floating-save-btn:disabled {
		opacity: 0.8;
		cursor: not-allowed;
	}
</style>
 
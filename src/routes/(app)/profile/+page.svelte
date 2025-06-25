<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { toastError, toastSuccess } from '$lib/utils/toast.js';
	import { detectCountry } from '$lib/utils/country-detector.js';
	import { userCurrency, setUserCurrencyFromServer, SUPPORTED_CURRENCIES, type Currency } from '$lib/stores/currency.js';
	import { getCountryInfo, getCurrencyForCountry } from '$lib/utils/countries.js';
	
	// Icons
	import User from 'lucide-svelte/icons/user';
	import Lock from 'lucide-svelte/icons/lock';
	import Mail from 'lucide-svelte/icons/mail';
	import Shield from 'lucide-svelte/icons/shield';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Copy from 'lucide-svelte/icons/copy';
	import Camera from 'lucide-svelte/icons/camera';
	import Globe from 'lucide-svelte/icons/globe';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	
	// Profile Components
	import ProfileAvatar from '$lib/components/profile/ProfileAvatar.svelte';
	import PersonalInfoForm from '$lib/components/profile/PersonalInfoForm.svelte';
	import PasswordChangeForm from '$lib/components/profile/PasswordChangeForm.svelte';
	import PaymentSetup from '$lib/components/profile/PaymentSetup.svelte';
	import AccountInfo from '$lib/components/profile/AccountInfo.svelte';
	import PreferencesSection from '$lib/components/profile/PreferencesSection.svelte';
	import DangerZone from '$lib/components/profile/DangerZone.svelte';

	// TanStack Query
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	const queryClient = useQueryClient();

	// Query for profile data
	const profileQuery = createQuery({
		queryKey: queryKeys.profile,
		queryFn: queryFunctions.fetchProfile,
		staleTime: 0,
		gcTime: 5 * 60 * 1000,
		refetchOnWindowFocus: true,
		refetchOnMount: 'always'
	});

	// Derive data from query
	let user = $derived($profileQuery.data || {});
	let isLoading = $derived($profileQuery.isLoading);
	let isError = $derived($profileQuery.isError);

	// Form states
	let profileLoading = $state(false);
	let passwordLoading = $state(false);
	let profileSaveSuccess = $state(false);
	let passwordChangeSuccess = $state(false);
	
	// Form data
	let name = $state('');
	let username = $state('');
	let businessName = $state('');
	let description = $state('');
	let phone = $state('');
	let website = $state('');
	let location = $state('');
	let country = $state('');
	let currency = $state('EUR');
	
	// Password form
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordError = $state('');
	
	// Payment status
	let paymentStatus = $state<{ isSetup: boolean; loading: boolean }>({
		isSetup: false,
		loading: true
	});
	
	// Avatar state
	let selectedAvatar: File | null = $state(null);
	let avatarPreview = $state('');
	let avatarLoadError = $state(false);
	let uploadingAvatar = $state(false);
	let avatarUploadError = $state('');
	
	// Profile link
	let profileLinkCopied = $state(false);
	
	// Payment setup modal state
	let showPaymentConfirmModal = $state(false);
	let pendingPaymentCountry = $state<string | null>(null);
	let isSettingUpPayment = $state(false);
	let paymentSetupError = $state<string | null>(null);
	
	// Initialize form data when user loads
	let formInitialized = $state(false);
	$effect(() => {
		if (user && Object.keys(user).length > 0 && !formInitialized) {
			name = user.name || '';
			username = user.username || '';
			businessName = user.businessName || '';
			description = user.description || '';
			phone = user.phone || '';
			website = user.website || '';
			location = user.location || '';
			country = user.country || '';
			currency = user.currency || 'EUR';
			formInitialized = true;
		}
	});
	
	// Check payment status
	async function checkPaymentStatus() {
		if (!user?.stripeAccountId) {
			paymentStatus = { isSetup: false, loading: false };
			return;
		}

		try {
			const response = await fetch('/api/payments/connect/status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: user.id })
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
		if (user?.stripeAccountId) {
			checkPaymentStatus();
		} else {
			paymentStatus = { isSetup: false, loading: false };
		}
	});
	
	// Profile link functions
	async function copyProfileLink() {
		if (!username) return;
		try {
			const profileUrl = `${window.location.origin}/${username}`;
			await navigator.clipboard.writeText(profileUrl);
			profileLinkCopied = true;
			toastSuccess('Profile link copied!');
			setTimeout(() => {
				profileLinkCopied = false;
			}, 2000);
		} catch (err) {
			toastError('Failed to copy link');
		}
	}
	
	// Update profile
	async function updatePersonalInfo() {
		profileLoading = true;

		try {
			// Clean up phone if it's just a country code
			const cleanPhone = phone.trim().match(/^\+\d{1,4}\s*$/) ? '' : phone;
			
			const formData = new FormData();
			formData.append('name', name);
			formData.append('username', username);
			formData.append('businessName', businessName);
			formData.append('description', description);
			formData.append('phone', cleanPhone);
			formData.append('website', website);
			formData.append('location', location);
			formData.append('country', country);
			formData.append('currency', currency);

			const response = await fetch('/api/profile/update', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to update profile');
			}

			// Update currency store
			userCurrency.set(currency as Currency);
			
			// Refresh profile data
			await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
			
			toastSuccess('Profile updated successfully');
			profileSaveSuccess = true;
			
			// Scroll to top to show success message
			window.scrollTo({ top: 0, behavior: 'smooth' });
			
			// Hide success message after 5 seconds
			setTimeout(() => {
				profileSaveSuccess = false;
			}, 5000);
		} catch (error) {
			toastError(error instanceof Error ? error.message : 'Failed to update profile');
		} finally {
			profileLoading = false;
		}
	}
	
	// Change password
	async function changePassword() {
		passwordLoading = true;
		passwordError = '';

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

			// Clear form
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			
			toastSuccess('Password changed successfully');
			passwordChangeSuccess = true;
			passwordError = ''; // Clear any existing error
			
			// Hide success message after 5 seconds
			setTimeout(() => {
				passwordChangeSuccess = false;
			}, 5000);
		} catch (error) {
			passwordError = error instanceof Error ? error.message : 'Failed to change password';
		} finally {
			passwordLoading = false;
		}
	}
	
	// Payment setup function - shows confirmation modal
	function setupPayments() {
		if (!user || isSettingUpPayment) return;

		// If stripeAccountId already exists, country is already locked - skip the modal
		if (user.stripeAccountId) {
			// Go directly to payment setup without warning
			confirmPaymentSetup();
			return;
		}

		// Get the country for payment setup
		const userCountry = country || user.country || 'US';
		pendingPaymentCountry = userCountry;
		showPaymentConfirmModal = true;
	}
	
	// Actually setup payments after confirmation
	async function confirmPaymentSetup() {
		if (!user || isSettingUpPayment) return;

		// Use existing country if stripeAccountId exists, otherwise use pending country
		const countryForSetup = user.stripeAccountId ? 
			(user.country || 'US') : 
			(pendingPaymentCountry || country || user.country || 'US');

		showPaymentConfirmModal = false;
		isSettingUpPayment = true;
		
		try {
			const response = await fetch('/api/payments/connect/setup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user.id,
					email: user.email,
					businessName: user.businessName || user.name,
					country: countryForSetup,
					returnUrl: `${window.location.origin}/dashboard?setup=complete`
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Payment setup API error:', errorData);
				// Show error in UI
				paymentSetupError = errorData.error || 'Failed to setup payment account';
				isSettingUpPayment = false;
				pendingPaymentCountry = null;
				return;
			}

			const { accountLink } = await response.json();
			window.location.href = accountLink;
		} catch (error) {
			console.error('Payment setup error:', error);
			
			// Network or other errors
			paymentSetupError = error instanceof Error ? error.message : 'Failed to setup payment account. Please try again.';
			isSettingUpPayment = false;
		} finally {
			pendingPaymentCountry = null;
		}
	}
	
	// Avatar functions
	async function onAvatarSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		avatarUploadError = ''; // Clear previous errors
		
		if (file) {
			// Validate file
			const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
			if (!validTypes.includes(file.type)) {
				avatarUploadError = 'Please select a valid image file (JPEG, PNG, or WebP)';
				toastError(avatarUploadError);
				return;
			}
			
			// Check file size (2MB limit)
			const maxSize = 2 * 1024 * 1024; // 2MB
			if (file.size > maxSize) {
				const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
				avatarUploadError = `Image too large (${sizeInMB}MB). Maximum size is 2MB. Please compress or resize your image.`;
				toastError(avatarUploadError);
				
				// Clear the error after 5 seconds
				setTimeout(() => {
					avatarUploadError = '';
				}, 5000);
				return;
			}
			
			selectedAvatar = file;
			
			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				avatarPreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
			
			// Auto-save
			await saveAvatar();
		}
	}

	async function saveAvatar() {
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

			selectedAvatar = null;
			await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
			
			// Clear preview after delay
			setTimeout(() => {
				avatarPreview = '';
				avatarLoadError = false;
			}, 2000);
			
			toastSuccess('Avatar updated successfully');
		} catch (error) {
			toastError(error instanceof Error ? error.message : 'Failed to update avatar');
			avatarPreview = '';
		} finally {
			uploadingAvatar = false;
		}
	}

	async function removeAvatar() {
		try {
			uploadingAvatar = true;

			const response = await fetch('/api/profile/avatar', {
				method: 'DELETE'
			});

			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.error || 'Failed to remove avatar');
			}

			selectedAvatar = null;
			avatarPreview = '';
			avatarLoadError = false;
			
			await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
			toastSuccess('Avatar removed successfully');
		} catch (error) {
			toastError(error instanceof Error ? error.message : 'Failed to remove avatar');
		} finally {
			uploadingAvatar = false;
		}
	}
	
	// Delete account
	async function deleteAccount(password: string) {
		try {
			const response = await fetch('/api/profile/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			});

			const result = await response.json();

			if (!response.ok) {
				// Check for active bookings error
				if (result.activeBookings) {
					const bookingList = result.activeBookings
						.map((b: any) => `• ${b.tourName} on ${new Date(b.startTime).toLocaleDateString()}`)
						.join('\n');
					throw new Error(`${result.error}\n\n${bookingList}`);
				}
				throw new Error(result.error || 'Failed to delete account');
			}

			// Success - redirect to home page with message
			toastSuccess('Account deleted successfully. Redirecting...');
			
			// Wait a moment for the message to show
			setTimeout(() => {
				window.location.href = '/';
			}, 2000);
			
		} catch (error) {
			throw error; // Re-throw to be handled by DangerZone component
		}
	}
	
	// Initialize currency on mount
	onMount(() => {
		if (user?.currency) {
			setUserCurrencyFromServer(user.currency);
		}
		
		// Check if returning from payment setup
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('setup') === 'complete') {
			// Clear the URL parameter
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.delete('setup');
			window.history.replaceState({}, '', newUrl.toString());
			
			// Show success message
			toastSuccess('Payment setup completed!');
			
			// Force refresh payment status
			checkPaymentStatus();
		}
	});
	
	// Mobile header actions
	let mobileQuickActions = $derived([
		{
			label: profileLinkCopied ? 'Copied!' : 'Copy Link',
			icon: profileLinkCopied ? CheckCircle : Copy,
			onclick: copyProfileLink,
			variant: 'secondary' as const,
			disabled: !username
		},
		{
			label: 'View',
			icon: ExternalLink,
			onclick: () => window.open(`/${username}`, '_blank'),
			variant: 'secondary' as const,
			disabled: !username
		}
	]);
	
	// Mobile info items - show quick status info not duplicated elsewhere
	let mobileInfoItems = $derived([
		{
			icon: Globe,
			label: 'Profile URL',
			value: username ? `zaur.app/${username}` : 'Not set'
		},
		{
			icon: CreditCard,
			label: 'Payments',
			value: paymentStatus.isSetup ? 'Active' : 'Not setup'
		}
	]);
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
	<!-- Error Message Banner -->
	{#if paymentSetupError}
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
						{paymentSetupError}
					</p>
				</div>
				<button
					onclick={() => (paymentSetupError = null)}
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
	
	<!-- Mobile-First Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Compact Header -->
		<MobilePageHeader
			title="Profile Settings"
			secondaryInfo={user?.email || 'Loading...'}
			quickActions={mobileQuickActions}
			infoItems={mobileInfoItems}
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
							View Profile
						</button>
						<button onclick={copyProfileLink} class="button-secondary button--gap">
							{#if profileLinkCopied}
								<CheckCircle class="h-4 w-4" />
								Copied!
							{:else}
								<Copy class="h-4 w-4" />
								Copy Link
							{/if}
						</button>
					{/if}
				</div>
			</PageHeader>
		</div>
	</div>

	<!-- Main Content -->
	<div class="grid gap-6 lg:gap-8 lg:grid-cols-3">
		<!-- Main Column -->
		<div class="lg:col-span-2 space-y-6 lg:space-y-8">
			<!-- Avatar & Personal Information -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 sm:p-6 border-b" style="border-color: var(--border-primary);">
					<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Profile Information</h2>
				</div>
				<div class="p-4 sm:p-6 space-y-6">
					<!-- Avatar -->
					<ProfileAvatar
						{user}
						{avatarPreview}
						avatarSaved={false}
						avatarRemoved={false}
						{avatarLoadError}
						{uploadingAvatar}
						onAvatarSelect={onAvatarSelect}
						onRemoveAvatar={removeAvatar}
					/>
					
					{#if avatarUploadError}
						<div class="alert-error rounded-lg p-3 text-sm">
							<p>{avatarUploadError}</p>
						</div>
					{/if}
					
					<!-- Form -->
					<PersonalInfoForm
						{user}
						bind:name
						bind:username
						bind:businessName
						bind:description
						bind:phone
						bind:website
						bind:location
						bind:country
						bind:currency
						onSubmit={updatePersonalInfo}
						loading={profileLoading}
						paymentSetup={!!user?.stripeAccountId}
						saveSuccess={profileSaveSuccess}
					/>
				</div>
			</div>

			<!-- Mobile: Payment Setup (higher priority on mobile) -->
			<div class="lg:hidden">
				<PaymentSetup
					{paymentStatus}
					onSetupPayments={setupPayments}
					{isSettingUpPayment}
					error={paymentSetupError}
				/>
			</div>

			<!-- Security -->
			{#if !user?.isOAuth2User}
				<PasswordChangeForm
					bind:currentPassword
					bind:newPassword
					bind:confirmPassword
					{passwordError}
					passwordChanged={passwordChangeSuccess}
					{passwordLoading}
					onSubmit={changePassword}
				/>
			{/if}

			<!-- Mobile: Account Info -->
			<div class="lg:hidden">
				<AccountInfo {user} />
			</div>

			<!-- Mobile: Preferences -->
			<div class="lg:hidden">
				<PreferencesSection />
			</div>
			
			<!-- Danger Zone (always last) -->
			<DangerZone
				{user}
				onDelete={deleteAccount}
			/>
		</div>

		<!-- Desktop Sidebar -->
		<div class="hidden lg:block space-y-6">
			<!-- Quick Links -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h3 class="font-medium" style="color: var(--text-primary);">Quick Links</h3>
				</div>
				<div class="p-4 space-y-2">
					{#if username}
						<a 
							href="/{username}" 
							target="_blank"
							class="flex items-center gap-3 p-3 rounded-lg transition-colors"
							style="border: 1px solid var(--border-primary);"
							onmouseenter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
							onmouseleave={(e) => e.currentTarget.style.background = 'transparent'}
						>
							<User class="h-4 w-4" style="color: var(--text-tertiary);" />
							<div>
								<p class="text-sm font-medium" style="color: var(--text-primary);">Public Profile</p>
								<p class="text-xs" style="color: var(--text-secondary);">zaur.app/{username}</p>
							</div>
							<ExternalLink class="h-4 w-4 ml-auto" style="color: var(--text-tertiary);" />
						</a>
					{/if}
					
					<a 
						href="/dashboard"
						class="flex items-center gap-3 p-3 rounded-lg transition-colors"
						style="border: 1px solid var(--border-primary);"
						onmouseenter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
						onmouseleave={(e) => e.currentTarget.style.background = 'transparent'}
					>
						<Shield class="h-4 w-4" style="color: var(--text-tertiary);" />
						<div>
							<p class="text-sm font-medium" style="color: var(--text-primary);">Dashboard</p>
							<p class="text-xs" style="color: var(--text-secondary);">View your operations</p>
						</div>
					</a>
				</div>
			</div>
			
			<!-- Payment Setup -->
			<PaymentSetup
				{paymentStatus}
				onSetupPayments={setupPayments}
				{isSettingUpPayment}
				error={paymentSetupError}
			/>

			<!-- Account Info -->
			<AccountInfo {user} />

			<!-- Preferences -->
			<PreferencesSection />
		</div>
	</div>
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

<!-- Payment Setup Loading Overlay -->
{#if isSettingUpPayment}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="rounded-xl p-6 shadow-xl max-w-sm mx-4 text-center" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<div class="mb-4">
				<div class="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style="background: var(--bg-secondary);">
					<CreditCard class="h-8 w-8 animate-pulse" style="color: var(--color-primary-600);" />
				</div>
				<h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary);">Setting up your payment account</h3>
				<p class="text-sm" style="color: var(--text-secondary);">
					Please wait while we prepare your Stripe account...
				</p>
			</div>
			<div class="flex justify-center">
				<div class="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style="border-color: var(--color-primary-600); border-top-color: transparent;"></div>
			</div>
			<p class="text-xs mt-4" style="color: var(--text-tertiary);">
				You'll be redirected to Stripe in a moment
			</p>
		</div>
	</div>
{/if}
{/if}
 
 
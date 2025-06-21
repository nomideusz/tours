<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { toastError, toastSuccess } from '$lib/utils/toast.js';
	import { detectCountry } from '$lib/utils/country-detector.js';
	import { userCurrency, setUserCurrencyFromServer, SUPPORTED_CURRENCIES, type Currency } from '$lib/stores/currency.js';
	
	// Icons
	import User from 'lucide-svelte/icons/user';
	import Lock from 'lucide-svelte/icons/lock';
	import Mail from 'lucide-svelte/icons/mail';
	import Shield from 'lucide-svelte/icons/shield';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Copy from 'lucide-svelte/icons/copy';
	import Camera from 'lucide-svelte/icons/camera';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	
	// Profile Components
	import ProfileAvatar from '$lib/components/profile/ProfileAvatar.svelte';
	import PersonalInfoForm from '$lib/components/profile/PersonalInfoForm.svelte';
	import PasswordChangeForm from '$lib/components/profile/PasswordChangeForm.svelte';
	import PaymentSetup from '$lib/components/profile/PaymentSetup.svelte';
	import AccountInfo from '$lib/components/profile/AccountInfo.svelte';
	import PreferencesSection from '$lib/components/profile/PreferencesSection.svelte';

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
	
	// Form data
	let name = $state('');
	let username = $state('');
	let businessName = $state('');
	let description = $state('');
	let phone = $state('');
	let website = $state('');
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
	
	// Profile link
	let profileLinkCopied = $state(false);
	
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
				throw new Error(result.error || 'Failed to update profile');
			}

			// Update currency store
			userCurrency.set(currency as Currency);
			
			// Refresh profile data
			await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
			
			toastSuccess('Profile updated successfully');
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
		} catch (error) {
			passwordError = error instanceof Error ? error.message : 'Failed to change password';
		} finally {
			passwordLoading = false;
		}
	}
	
	// Payment setup
	async function setupPayments() {
		try {
			const response = await fetch('/api/payments/connect/setup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: user.id,
					email: user.email,
					businessName: businessName || user.businessName || user.name,
					country: country || user.country || 'DE',
					returnUrl: `${window.location.origin}/profile`
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to setup payment account');
			}

			const { accountLink } = await response.json();
			window.location.href = accountLink;
		} catch (error) {
			toastError(error instanceof Error ? error.message : 'Failed to setup payment account');
		}
	}
	
	// Avatar functions
	async function onAvatarSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (file) {
			// Validate file
			const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
			if (!validTypes.includes(file.type)) {
				toastError('Please select a valid image file (JPEG, PNG, or WebP)');
				return;
			}
			
			if (file.size > 2 * 1024 * 1024) {
				toastError('Avatar image must be smaller than 2MB');
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
	
	// Initialize currency on mount
	onMount(() => {
		if (user?.currency) {
			setUserCurrencyFromServer(user.currency);
		}
	});
</script>

<svelte:head>
	<title>Profile Settings - Zaur</title>
</svelte:head>

{#if isLoading}
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
		<div class="flex justify-center items-center py-12">
			<LoadingSpinner size="large" text="Loading profile..." />
		</div>
	</div>
{:else if isError}
	<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
		<ErrorAlert variant="error" message="Failed to load profile data. Please refresh the page." />
	</div>
{:else}
<div class="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
	<!-- Header -->
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

	<!-- Main Content -->
	<div class="grid gap-8 lg:grid-cols-3 mt-8">
		<!-- Main Column -->
		<div class="lg:col-span-2 space-y-8">
			<!-- Avatar & Personal Information -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-6 border-b" style="border-color: var(--border-primary);">
					<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Profile Information</h2>
				</div>
				<div class="p-6 space-y-6">
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
					
					<!-- Form -->
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
						paymentSetup={paymentStatus.isSetup}
					/>
				</div>
			</div>

			<!-- Security -->
			{#if !user?.isOAuth2User}
				<PasswordChangeForm
					bind:currentPassword
					bind:newPassword
					bind:confirmPassword
					{passwordError}
					passwordChanged={false}
					{passwordLoading}
					onSubmit={changePassword}
				/>
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
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
							class="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-gray-50"
							style="border: 1px solid var(--border-primary);"
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
						class="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-gray-50"
						style="border: 1px solid var(--border-primary);"
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
			/>

			<!-- Account Info -->
			<AccountInfo {user} />

			<!-- Preferences -->
			<PreferencesSection />
		</div>
	</div>
</div>
{/if}
 
 
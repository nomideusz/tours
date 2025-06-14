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

	// TanStack Query
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { queryKeys, queryFunctions } from '$lib/queries/shared-stats.js';
	// TanStack Query client for invalidation
	const queryClient = useQueryClient();

	// TanStack Query for profile data
	const profileQuery = createQuery({
		queryKey: queryKeys.profile,
		queryFn: queryFunctions.fetchProfile,
		staleTime: 30 * 1000, // 30 seconds - reasonable for profile data
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

	// Error and success states
	let errorMessage = $state('');
	let profileSaved = $state(false);
	let passwordChanged = $state(false);

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

	// Profile update function
	async function updateProfile() {
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
			
			if (selectedAvatar) {
				formData.append('avatar', selectedAvatar);
			}

			const response = await fetch('/api/profile/update', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to update profile');
			}

			if (result.success) {
				// Update form fields immediately with the returned data
				if (result.updatedUser) {
					name = result.updatedUser.name || '';
					username = result.updatedUser.username || '';
					businessName = result.updatedUser.businessName || '';
					description = result.updatedUser.description || '';
					phone = result.updatedUser.phone || '';
					website = result.updatedUser.website || '';
					country = result.updatedUser.country || '';
					currency = result.updatedUser.currency || 'EUR';
					console.log('✅ Updated form fields immediately:', { country, currency });
				}
				
				// Update the currency store
				userCurrency.set(currency as Currency);
				
				// Clear avatar upload state on successful update
				selectedAvatar = null;
				avatarPreview = '';
				
				// Update the query cache with the fresh data immediately
				queryClient.setQueryData(queryKeys.profile, (oldData: any) => {
					const updatedData = { ...oldData, ...result.updatedUser };
					console.log('🔄 Cache updated with:', updatedData);
					return updatedData;
				});
				
				// Invalidate to ensure next fetch gets fresh data
				queryClient.invalidateQueries({ queryKey: queryKeys.profile });
				
				// Show inline success feedback
				profileSaved = true;
				setTimeout(() => {
					profileSaved = false;
				}, 3000);
			}
		} catch (error) {
			console.error('Profile update error:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
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
					businessName: user.businessName || user.name,
					country: user.country || 'DE'
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
	function onAvatarSelect(event: Event) {
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
			
			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				avatarPreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function removeAvatar() {
		selectedAvatar = null;
		avatarPreview = '';
		if (avatarInputElement) {
			avatarInputElement.value = '';
		}
	}

	// Initialize currency store and detect country on client-side
	onMount(() => {
		// Set user currency in store from server data
		if (user?.currency) {
			setUserCurrencyFromServer(user.currency);
		}
		
		// If no country is set, detect it on client-side
		if (!country && browser) {
			country = detectCountry();
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
				<div class="p-4 sm:p-6">
					<form onsubmit={(e) => { e.preventDefault(); updateProfile(); }}>
						<div class="space-y-6">
							<!-- Username -->
							<div>
								<label for="username" class="form-label">
									Username
								</label>
								<div class="relative">
									<User class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
									<input
										type="text"
										id="username" 
										name="username"
										bind:value={username}
										class="form-input pl-10"
										placeholder="Enter your username"
										required
									/>
								</div>
								{#if username}
									<p class="text-sm text-gray-600 mt-1">
										Your personal URL: <a href="/{username}" class="text-blue-600 hover:text-blue-800" target="_blank">zaur.app/{username}</a>
									</p>
								{/if}
							</div>

							<!-- Avatar Upload -->
							<div>
								<label for="avatar" class="form-label">
									Profile Avatar
								</label>
								<div class="flex items-start gap-4">
									<!-- Current Avatar Display -->
									<div class="flex-shrink-0">
										<div class="w-20 h-20 rounded-full overflow-hidden" style="background: var(--bg-secondary); border: 2px solid var(--border-primary);">
											{#if avatarPreview}
												<img src={avatarPreview} alt="Avatar preview" class="w-full h-full object-cover" />
											{:else if user?.avatar && !avatarLoadError}
												<img 
													src={user.avatar} 
													alt="Current avatar" 
													class="w-full h-full object-cover"
													onerror={() => avatarLoadError = true}
												/>
											{:else}
												<div class="w-full h-full flex items-center justify-center">
													<User class="h-8 w-8" style="color: var(--text-tertiary);" />
												</div>
											{/if}
										</div>
									</div>
									
									<!-- Upload Controls -->
									<div class="flex-1 space-y-3">
										<div class="flex gap-2">
											<input
												type="file"
												id="avatar"
												name="avatar"
												accept="image/jpeg,image/jpg,image/png,image/webp"
												class="hidden"
												onchange={onAvatarSelect}
												bind:this={avatarInputElement}
											/>
											<label
												for="avatar"
												class="button-secondary button--gap button--small cursor-pointer"
											>
												<Upload class="h-3 w-3" />
												Choose Avatar
											</label>
											
											{#if selectedAvatar || avatarPreview}
												<button
													type="button"
													onclick={removeAvatar}
													class="button--danger button--gap button--small"
												>
													<X class="h-3 w-3" />
													Remove
												</button>
											{/if}
										</div>
										
										<p class="text-xs" style="color: var(--text-tertiary);">
											Upload a square image (JPEG, PNG, WebP) up to 2MB. Image will be automatically cropped to fit.
										</p>
										
										{#if selectedAvatar}
											<p class="text-xs" style="color: var(--color-success);">
												✓ Ready to upload: {selectedAvatar.name}
											</p>
										{/if}
									</div>
								</div>
							</div>

							<!-- Name -->
							<div>
								<label for="name" class="form-label">
									Full Name
								</label>
								<div class="relative">
									<User class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
									<input
										type="text"
										id="name"
										name="name" 
										bind:value={name}
										class="form-input pl-10"
										placeholder="Enter your full name"
									/>
								</div>
							</div>

							<!-- Email -->
							<div>
								<label for="email" class="form-label">
									Email Address
								</label>
								<div class="relative">
									<Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
									<input
										type="email"
										id="email"
										name="email"
										value={user?.email || ''}
										class="form-input pl-10"
										placeholder="Enter your email"
										required
										readonly
									/>
								</div>
							</div>

							<!-- Business Name -->
							<div>
								<label for="businessName" class="form-label">
									Business Name
								</label>
								<input
									type="text"
									id="businessName"
									name="businessName" 
									bind:value={businessName}
									class="form-input"
									placeholder="Enter your business name"
								/>
							</div>

							<!-- Description -->
							<div>
								<label for="description" class="form-label">
									Description
								</label>
								<textarea
									id="description"
									name="description" 
									bind:value={description}
									class="form-input"
									placeholder="Tell us about yourself or your business"
									rows="3"
								></textarea>
							</div>

							<!-- Phone -->
							<div>
								<label for="phone" class="form-label">
									Phone Number
								</label>
								<input
									type="tel"
									id="phone"
									name="phone" 
									bind:value={phone}
									class="form-input"
									placeholder="Enter your phone number"
								/>
							</div>

							<!-- Website -->
							<div>
								<label for="website" class="form-label">
									Website
								</label>
								<input
									type="url"
									id="website"
									name="website" 
									bind:value={website}
									class="form-input"
									placeholder="https://example.com"
								/>
							</div>

							<!-- Country -->
							<div>
								<label for="country" class="form-label">
									Country
								</label>
								<select
									id="country"
									name="country"
									class="form-select cursor-pointer"
									bind:value={country}
									onchange={() => console.log('Country changed to:', country)}
								>
									<option value="">Select your country</option>
									<option value="AT">Austria</option>
									<option value="BE">Belgium</option>
									<option value="DE">Germany</option>
									<option value="DK">Denmark</option>
									<option value="ES">Spain</option>
									<option value="FI">Finland</option>
									<option value="FR">France</option>
									<option value="GB">United Kingdom</option>
									<option value="IE">Ireland</option>
									<option value="IT">Italy</option>
									<option value="NL">Netherlands</option>
									<option value="NO">Norway</option>
									<option value="PL">Poland</option>
									<option value="PT">Portugal</option>
									<option value="SE">Sweden</option>
									<option value="CH">Switzerland</option>
								</select>
							</div>

							<!-- Currency -->
							<div>
								<label for="currency" class="form-label">
									Preferred Currency
								</label>
								<select
									id="currency"
									name="currency"
									class="form-select cursor-pointer"
									bind:value={currency}
									onchange={() => userCurrency.set(currency as Currency)}
								>
									{#each Object.values(SUPPORTED_CURRENCIES) as currencyInfo}
										<option value={currencyInfo.code}>
											{currencyInfo.symbol} {currencyInfo.name} ({currencyInfo.code})
										</option>
									{/each}
								</select>
								<p class="text-xs mt-1" style="color: var(--text-tertiary);">
									This will be used for all price displays throughout the app
								</p>
							</div>


						</div>

						<!-- Submit Button -->
						<div class="flex items-center justify-end gap-3 pt-6 mt-8" style="border-top: 1px solid var(--border-primary);">
							{#if profileSaved}
								<div class="flex items-center gap-2 text-sm" style="color: var(--color-success);">
									<CheckCircle class="h-4 w-4" />
									Profile updated successfully!
								</div>
							{/if}
							<button
								type="submit"
								disabled={profileLoading}
								class="button-primary button--gap"
							>
								{#if profileLoading}
									<LoadingSpinner size="small" variant="white" text="Saving..." />
								{:else if profileSaved}
									<CheckCircle class="h-4 w-4" />
									Saved!
								{:else}
									<Save class="h-4 w-4" />
									Save Changes
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>

			<!-- Security Section -->
			{#if !user?.isOAuth2User}
				<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
					<div class="p-4 border-b" style="border-color: var(--border-primary);">
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-lg" style="background: var(--color-warning-50);">
								<Lock class="h-4 w-4" style="color: var(--color-warning-600);" />
							</div>
							<div>
								<h2 class="font-semibold" style="color: var(--text-primary);">Security Settings</h2>
								<p class="text-sm" style="color: var(--text-secondary);">Change your password and security preferences</p>
							</div>
						</div>
					</div>
					<div class="p-4 sm:p-6">
						<form onsubmit={(e) => { e.preventDefault(); changePassword(); }}>
							<div class="space-y-4">
								{#if passwordError}
									<ErrorAlert variant="error" message={passwordError} />
								{/if}

								<div>
									<label for="currentPassword" class="form-label">Current Password</label>
									<div class="relative">
										<Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
										<input
											type="password"
											id="currentPassword"
											name="currentPassword"
											bind:value={currentPassword}
											class="form-input pl-10"
											placeholder="Enter current password"
											required
										/>
									</div>
								</div>

								<div>
									<label for="newPassword" class="form-label">New Password</label>
									<div class="relative">
										<Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
										<input
											type="password"
											id="newPassword"
											name="newPassword"
											bind:value={newPassword}
											class="form-input pl-10"
											placeholder="Enter new password"
											required
										/>
									</div>
								</div>

								<div>
									<label for="confirmPassword" class="form-label">Confirm New Password</label>
									<div class="relative">
										<Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
										<input
											type="password"
											id="confirmPassword"
											name="confirmPassword"
											bind:value={confirmPassword}
											class="form-input pl-10"
											placeholder="Confirm new password"
											required
										/>
									</div>
								</div>

								<div class="flex items-center justify-end gap-3 pt-4">
									{#if passwordChanged}
										<div class="flex items-center gap-2 text-sm" style="color: var(--color-success);">
											<CheckCircle class="h-4 w-4" />
											Password changed successfully!
										</div>
									{/if}
									<button
										type="submit"
										disabled={passwordLoading}
										class="button-secondary button--gap"
									>
										{#if passwordLoading}
											<LoadingSpinner size="small" text="Changing..." />
										{:else if passwordChanged}
											<CheckCircle class="h-4 w-4" />
											Changed!
										{:else}
											<Shield class="h-4 w-4" />
											Change Password
										{/if}
									</button>
								</div>
							</div>
						</form>
					</div>
				</div>
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Profile Summary -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h3 class="font-semibold" style="color: var(--text-primary);">Profile Summary</h3>
				</div>
				<div class="p-4 space-y-4">
					<div class="flex items-center gap-3">
						<div class="w-12 h-12 rounded-full flex items-center justify-center" style="background: var(--bg-secondary);">
							{#if avatarPreview}
								<img src={avatarPreview} alt="Avatar preview" class="w-full h-full rounded-full object-cover" />
							{:else if user?.avatar && !avatarLoadError}
								<img 
									src={user.avatar} 
									alt="Avatar" 
									class="w-full h-full rounded-full object-cover"
									onerror={() => avatarLoadError = true}
								/>
							{:else}
								<User class="h-6 w-6" style="color: var(--text-secondary);" />
							{/if}
						</div>
						<div class="flex-1 min-w-0">
							<p class="font-medium truncate" style="color: var(--text-primary);">{user?.name || 'No name set'}</p>
							<p class="text-sm truncate" style="color: var(--text-secondary);">@{username || 'username-required'}</p>
						</div>
					</div>

					<div class="space-y-2 text-sm">
						<div class="flex items-center gap-2">
							<Mail class="h-4 w-4" style="color: var(--text-tertiary);" />
							<span style="color: var(--text-secondary);">{user?.email}</span>
							{#if user?.verified}
								<CheckCircle class="h-3 w-3" style="color: var(--color-success);" />
							{/if}
						</div>

						{#if businessName}
							<div class="flex items-center gap-2">
								<Building class="h-4 w-4" style="color: var(--text-tertiary);" />
								<span style="color: var(--text-secondary);">{businessName}</span>
							</div>
						{/if}

						{#if phone}
							<div class="flex items-center gap-2">
								<Phone class="h-4 w-4" style="color: var(--text-tertiary);" />
								<span style="color: var(--text-secondary);">{phone}</span>
							</div>
						{/if}

						{#if website}
							<div class="flex items-center gap-2">
								<Globe class="h-4 w-4" style="color: var(--text-tertiary);" />
								<a href={website} target="_blank" class="text-blue-600 hover:text-blue-800 truncate">{website}</a>
							</div>
						{/if}
					</div>

					{#if username}
						<div class="pt-3 border-t" style="border-color: var(--border-primary);">
							<div class="flex items-center justify-between">
								<span class="text-sm" style="color: var(--text-secondary);">Public Profile</span>
								<button onclick={() => window.open(`/${username}`, '_blank')} class="text-xs" style="color: var(--color-primary-600);">
									View Live
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Payment Setup Section -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center gap-3">
						<div class="p-2 rounded-lg" style="background: var(--color-success-light);">
							<DollarSign class="h-4 w-4" style="color: var(--color-success);" />
						</div>
						<div>
							<h3 class="font-semibold" style="color: var(--text-primary);">Payment Setup</h3>
							<p class="text-xs" style="color: var(--text-secondary);">Accept customer payments</p>
						</div>
					</div>
				</div>
				<div class="p-4">
					{#if paymentStatusLoading}
						<div class="flex justify-center py-4">
							<LoadingSpinner size="small" />
						</div>
					{:else}
						<div class="space-y-4">
							<!-- Account Status -->
							<div class="flex items-start gap-3 p-3 rounded-lg" style="background: var(--bg-secondary);">
								{#if paymentStatus.canReceivePayments}
									<CheckCircle class="h-4 w-4 mt-0.5" style="color: var(--color-success);" />
									<div>
										<p class="text-sm font-medium" style="color: var(--text-primary);">Active</p>
										<p class="text-xs" style="color: var(--text-secondary);">Ready to accept payments</p>
									</div>
								{:else if paymentStatus.hasAccount && !paymentStatus.isSetupComplete}
									<AlertCircle class="h-4 w-4 mt-0.5" style="color: var(--color-warning);" />
									<div>
										<p class="text-sm font-medium" style="color: var(--text-primary);">Setup incomplete</p>
										<p class="text-xs" style="color: var(--text-secondary);">Complete setup required</p>
									</div>
								{:else}
									<CreditCard class="h-4 w-4 mt-0.5" style="color: var(--text-tertiary);" />
									<div>
										<p class="text-sm font-medium" style="color: var(--text-primary);">Not set up</p>
										<p class="text-xs" style="color: var(--text-secondary);">Set up payment account</p>
									</div>
								{/if}
							</div>

							<!-- Setup Button -->
							<div class="flex justify-center">
								{#if !paymentStatus.hasAccount}
									<button
										onclick={setupPayments}
										class="button-primary button--gap button--small"
									>
										<CreditCard class="h-3 w-3" />
										Setup Payments
									</button>
								{:else if !paymentStatus.isSetupComplete || paymentStatus.accountInfo?.requiresAction}
									<button
										onclick={setupPayments}
										class="button-secondary button--gap button--small"
									>
										<AlertCircle class="h-3 w-3" />
										Complete Setup
									</button>
								{:else}
									<button
										onclick={setupPayments}
										class="button-secondary button--gap button--small"
									>
										<CreditCard class="h-3 w-3" />
										Manage Account
									</button>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Account Info -->
			<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="p-4 border-b" style="border-color: var(--border-primary);">
					<h3 class="font-semibold" style="color: var(--text-primary);">Account Info</h3>
				</div>
				<div class="p-4 space-y-3 text-sm">
					<div class="flex justify-between">
						<span style="color: var(--text-secondary);">Account Type</span>
						<span style="color: var(--text-primary);">{user?.role === 'admin' ? 'Administrator' : 'Tour Guide'}</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary);">Member Since</span>
						<span style="color: var(--text-primary);">Recently</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary);">Email Status</span>
						<span style="color: var(--text-primary);">{user?.verified ? 'Verified' : 'Unverified'}</span>
					</div>
					{#if user?.isOAuth2User}
						<div class="flex justify-between">
							<span style="color: var(--text-secondary);">Login Method</span>
							<span style="color: var(--text-primary);">OAuth2</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
{/if} 
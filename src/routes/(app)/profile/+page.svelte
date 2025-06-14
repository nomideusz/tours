<script lang="ts">
	import { enhance } from '$app/forms';
	import { t, language } from '$lib/i18n.js';
	import Loader from 'lucide-svelte/icons/loader';
	import User from 'lucide-svelte/icons/user';
	import Lock from 'lucide-svelte/icons/lock';
	import Mail from 'lucide-svelte/icons/mail';
	import Shield from 'lucide-svelte/icons/shield';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import Calendar from 'lucide-svelte/icons/calendar';
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
	import FileText from 'lucide-svelte/icons/file-text';
	import { onMount } from 'svelte';
	import { toastError, toastSuccess } from '$lib/utils/toast.js';
	import { browser } from '$app/environment';
	import { detectCountry } from '$lib/utils/country-detector.js';
	import { userCurrency, setUserCurrencyFromServer, SUPPORTED_CURRENCIES, type Currency } from '$lib/stores/currency.js';

	let { data, form } = $props();

	// Loading states
	let profileLoading = $state(false);
	let passwordLoading = $state(false);
	let verificationLoading = $state(false);
	let paymentStatusLoading = $state(true);

	// Form data
	let name = $state(data.user?.name || '');
	let username = $state(data.user?.username || '');
	let businessName = $state(data.user?.businessName || '');
	let description = $state(data.user?.description || '');
	let phone = $state(data.user?.phone || '');
	let website = $state(data.user?.website || '');
	let country = $state(data.user?.country || '');
	let currency = $state(data.user?.currency || 'EUR');

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

	// Profile stats
	let profileStats = $state({
		totalTours: 0,
		activeTours: 0,
		totalBookings: 0,
		totalRevenue: 0,
		totalGuests: 0,
		accountAge: 0
	});

	// Profile link state
	let profileLinkCopied = $state(false);
	let profileStatsLoading = $state(true);

	// Reset password form on success and update profile data
	$effect(() => {
		if (form?.success && form?.message?.includes('Password')) {
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		}
		
		// Update profile form with returned data on successful profile update
		if (form?.success && form?.updatedUser) {
			name = form.updatedUser.name;
			username = form.updatedUser.username;
			businessName = form.updatedUser.businessName;
			description = form.updatedUser.description;
			phone = form.updatedUser.phone;
			website = form.updatedUser.website;
			country = form.updatedUser.country;
			currency = form.updatedUser.currency;
			// Update the currency store
			userCurrency.set(currency as Currency);
		}
		
		// Handle Stripe redirect
		if (form?.success && form?.redirect) {
			window.location.href = form.redirect;
		}
	});

	// Load data
	$effect(() => {
		if (data.user.id) {
			loadPaymentStatus();
			loadProfileStats();
		}
	});

	async function loadPaymentStatus() {
		try {
			paymentStatusLoading = true;
			const response = await fetch(`/api/payments/connect/status?userId=${data.user.id}`);
			if (response.ok) {
				paymentStatus = await response.json();
			}
		} catch (error) {
			console.error('Failed to load payment status:', error);
		} finally {
			paymentStatusLoading = false;
		}
	}

	async function loadProfileStats() {
		try {
			profileStatsLoading = true;
			const response = await fetch(`/api/dashboard-stats?userId=${data.user.id}`);
			if (response.ok) {
				const stats = await response.json();
				profileStats = {
					totalTours: stats.totalTours || 0,
					activeTours: stats.activeTours || 0,
					totalBookings: stats.totalBookings || 0,
					totalRevenue: stats.totalRevenue || 0,
					totalGuests: stats.totalParticipants || 0,
					accountAge: 0
				};
			}
		} catch (error) {
			console.error('Failed to load profile stats:', error);
		} finally {
			profileStatsLoading = false;
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

	let isSubmitting = $state(false);

	// Initialize currency store and detect country on client-side
	onMount(() => {
		// Set user currency in store from server data
		if (data.user?.currency) {
			setUserCurrencyFromServer(data.user.currency);
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

<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
	<!-- Mobile-First Header -->
	<div class="mb-6 sm:mb-8">
		<!-- Mobile Compact Header -->
		<MobilePageHeader
			title="Profile Settings"
			secondaryInfo={data.user?.name || 'Profile'}
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
					value: data.user?.verified ? 'Verified' : 'Unverified'
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

	<!-- Success/Error Messages -->
	{#if form?.error}
		<div class="mb-6">
			<ErrorAlert variant="error" message={form.error} />
		</div>
	{/if}

	{#if form?.success}
		<div class="mb-6">
			<ErrorAlert variant="info" title="Success" message="Profile updated successfully!" />
		</div>
	{/if}

	<!-- Profile Stats Overview -->
	<div class="hidden sm:block mb-6">
		{#if profileStatsLoading}
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{#each Array(4) as _}
					<div class="rounded-xl p-4" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
						<div class="animate-pulse">
							<div class="h-4 bg-gray-200 rounded mb-2"></div>
							<div class="h-6 bg-gray-200 rounded mb-1"></div>
							<div class="h-3 bg-gray-200 rounded w-2/3"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<StatsCard
					title="Tours Created"
					value={profileStats.totalTours}
					subtitle="{profileStats.activeTours} active"
					icon={MapPin}
					trend={profileStats.activeTours > 0 ? { value: `${profileStats.activeTours} active`, positive: true } : undefined}
					variant="small"
				/>

				<StatsCard
					title="Total Bookings"
					value={profileStats.totalBookings}
					subtitle="all time"
					icon={Users}
					variant="small"
				/>

				<StatsCard
					title="Revenue Earned"
					value={`€${profileStats.totalRevenue}`}
					subtitle="total earnings"
					icon={DollarSign}
					variant="small"
				/>

				<StatsCard
					title="Guests Served"
					value={profileStats.totalGuests}
					subtitle="{profileStats.accountAge} days active"
					icon={Activity}
					variant="small"
				/>
			</div>
		{/if}
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
					<form 
						method="POST" 
						action="?/updateProfile"
						use:enhance={() => {
							isSubmitting = true;
							return async ({ update }) => {
								await update();
								isSubmitting = false;
							};
						}}
					>
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
										value={data.user?.email || ''}
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
						<div class="flex justify-end pt-6 mt-8" style="border-top: 1px solid var(--border-primary);">
							<button
								type="submit"
								disabled={isSubmitting}
								class="button-primary button--gap"
							>
								{#if isSubmitting}
									<LoadingSpinner size="small" variant="white" text="Saving..." />
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
			{#if !data.user?.isOAuth2User}
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
						<form 
							method="POST" 
							action="?/changePassword"
							use:enhance={() => {
								passwordLoading = true;
								return async ({ update }) => {
									await update();
									passwordLoading = false;
								};
							}}
						>
							<div class="space-y-4">
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

								<div class="flex justify-end pt-4">
									<button
										type="submit"
										disabled={passwordLoading}
										class="button-secondary button--gap"
									>
										{#if passwordLoading}
											<LoadingSpinner size="small" text="Changing..." />
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
							{#if data.user?.avatar}
								<img src={data.user.avatar} alt="Avatar" class="w-full h-full rounded-full object-cover" />
							{:else}
								<User class="h-6 w-6" style="color: var(--text-secondary);" />
							{/if}
						</div>
						<div class="flex-1 min-w-0">
							<p class="font-medium truncate" style="color: var(--text-primary);">{data.user?.name || 'No name set'}</p>
							<p class="text-sm truncate" style="color: var(--text-secondary);">@{username || 'username-required'}</p>
						</div>
					</div>

					<div class="space-y-2 text-sm">
						<div class="flex items-center gap-2">
							<Mail class="h-4 w-4" style="color: var(--text-tertiary);" />
							<span style="color: var(--text-secondary);">{data.user?.email}</span>
							{#if data.user?.verified}
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
									<form method="POST" action="?/setupPayments">
										<button
											type="submit"
											class="button-primary button--gap button--small"
										>
											<CreditCard class="h-3 w-3" />
											Setup Payments
										</button>
									</form>
								{:else if !paymentStatus.isSetupComplete || paymentStatus.accountInfo?.requiresAction}
									<form method="POST" action="?/setupPayments">
										<button
											type="submit"
											class="button-secondary button--gap button--small"
										>
											<AlertCircle class="h-3 w-3" />
											Complete Setup
										</button>
									</form>
								{:else}
									<form method="POST" action="?/setupPayments">
										<button
											type="submit"
											class="button-secondary button--gap button--small"
										>
											<CreditCard class="h-3 w-3" />
											Manage Account
										</button>
									</form>
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
						<span style="color: var(--text-primary);">{data.user?.role === 'admin' ? 'Administrator' : 'Tour Guide'}</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary);">Member Since</span>
						<span style="color: var(--text-primary);">Recently</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary);">Email Status</span>
						<span style="color: var(--text-primary);">{data.user?.verified ? 'Verified' : 'Unverified'}</span>
					</div>
					{#if data.user?.isOAuth2User}
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
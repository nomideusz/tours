<script lang="ts">
	import { enhance } from '$app/forms';
	import { t, language } from '$lib/i18n.js';
	import Loader from 'lucide-svelte/icons/loader';
	import User from 'lucide-svelte/icons/user';
	import Lock from 'lucide-svelte/icons/lock';
	import Mail from 'lucide-svelte/icons/mail';
	import Shield from 'lucide-svelte/icons/shield';

	let { data, form } = $props<{ data: any; form?: any }>();

	// Loading states
	let profileLoading = $state(false);
	let passwordLoading = $state(false);
	let verificationLoading = $state(false);

	// Form data
	let name = $state(data.user.name);
	let username = $state(data.user.username);
	let businessName = $state(data.user.businessName);
	let description = $state(data.user.description);
	let phone = $state(data.user.phone);
	let website = $state(data.user.website);

	// Password form data
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	// Reset password form on success
	$effect(() => {
		if (form?.success && form?.message?.includes('Password')) {
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		}
	});
</script>

<svelte:head>
	<title>Profile Settings - Zaur</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="mx-auto max-w-4xl px-6 sm:px-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">Profile Settings</h1>
			<p class="mt-2 text-gray-600">Manage your account information and security settings.</p>
		</div>

		<!-- Success/Error Messages -->
		{#if form?.success}
			<div class="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
				<p class="text-sm text-green-600">{form.message}</p>
			</div>
		{/if}

		{#if form?.error}
			<div class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
				<p class="text-sm text-red-600">{form.error}</p>
			</div>
		{/if}

		<div class="grid gap-8 lg:grid-cols-2">
			<!-- Profile Information -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div class="flex items-center gap-3 mb-6">
					<User class="h-5 w-5 text-gray-500" />
					<h2 class="text-xl font-semibold text-gray-900">Profile Information</h2>
				</div>

				<form
					method="POST"
					action="?/updateProfile"
					use:enhance={({ formData }) => {
						profileLoading = true;
						return async ({ result, update }) => {
							await update();
							profileLoading = false;
							
							// Update local state with the returned updated user data if successful
							if (result.type === 'success' && result.data?.updatedUser) {
								const updated = result.data.updatedUser as any;
								name = updated.name || '';
								username = updated.username || '';
								businessName = updated.businessName || '';
								description = updated.description || '';
								phone = updated.phone || '';
								website = updated.website || '';
							}
						};
					}}
					class="space-y-4"
				>
					<!-- Avatar Display -->
					{#if data.user.avatar}
						<div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
							<img
								src={`https://z.xeon.pl/api/files/_pb_users_auth_/${data.user.id}/${data.user.avatar}`}
								alt="Avatar"
								class="h-16 w-16 rounded-full object-cover"
							/>
							<div>
								<p class="text-sm font-medium text-gray-900">Profile Picture</p>
								<p class="text-xs text-gray-500">Synced from your OAuth2 provider</p>
							</div>
						</div>
					{/if}

					<!-- Name -->
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
							Full Name
						</label>
						<input
							type="text"
							id="name"
							name="name"
							bind:value={name}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Your full name"
						/>
					</div>

					<!-- Username -->
					<div>
						<label for="username" class="block text-sm font-medium text-gray-700 mb-1">
							Username
						</label>
						<input
							type="text"
							id="username"
							name="username"
							bind:value={username}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="username"
						/>
					</div>

					<!-- Business Name -->
					<div>
						<label for="businessName" class="block text-sm font-medium text-gray-700 mb-1">
							Business Name
						</label>
						<input
							type="text"
							id="businessName"
							name="businessName"
							bind:value={businessName}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Your business or company name"
						/>
					</div>

					<!-- Description -->
					<div>
						<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
							Description
						</label>
						<textarea
							id="description"
							name="description"
							bind:value={description}
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="Tell us about yourself or your business"
						></textarea>
					</div>

					<!-- Phone -->
					<div>
						<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
							Phone Number
						</label>
						<input
							type="tel"
							id="phone"
							name="phone"
							bind:value={phone}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="+1 (555) 123-4567"
						/>
					</div>

					<!-- Website -->
					<div>
						<label for="website" class="block text-sm font-medium text-gray-700 mb-1">
							Website
						</label>
						<input
							type="url"
							id="website"
							name="website"
							bind:value={website}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							placeholder="https://yourwebsite.com"
						/>
					</div>

					<button
						type="submit"
						disabled={profileLoading}
						class="w-full flex justify-center items-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{#if profileLoading}
							<Loader size={16} class="animate-spin" />
							<span>Updating...</span>
						{:else}
							Update Profile
						{/if}
					</button>
				</form>
			</div>

			<!-- Security Settings -->
			<div class="space-y-8">
				<!-- Account Security -->
				<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div class="flex items-center gap-3 mb-6">
						<Shield class="h-5 w-5 text-gray-500" />
						<h2 class="text-xl font-semibold text-gray-900">Account Security</h2>
					</div>

					<!-- Email Verification Status -->
					<div class="mb-6 p-4 rounded-lg {data.user.verified ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}">
						<div class="flex items-center gap-3">
							<Mail class="h-5 w-5 {data.user.verified ? 'text-green-600' : 'text-yellow-600'}" />
							<div class="flex-1">
								<p class="text-sm font-medium {data.user.verified ? 'text-green-900' : 'text-yellow-900'}">
									Email: {data.user.email}
								</p>
								<p class="text-xs {data.user.verified ? 'text-green-600' : 'text-yellow-600'}">
									{data.user.verified ? 'Verified' : 'Not verified'}
								</p>
							</div>
							{#if !data.user.verified}
								<form
									method="POST"
									action="?/requestVerification"
									use:enhance={() => {
										verificationLoading = true;
										return async ({ update }) => {
											await update();
											verificationLoading = false;
										};
									}}
								>
									<button
										type="submit"
										disabled={verificationLoading}
										class="text-xs px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg disabled:opacity-50"
									>
										{verificationLoading ? 'Sending...' : 'Verify'}
									</button>
								</form>
							{/if}
						</div>
					</div>

					<!-- OAuth2 Notice -->
					{#if data.user.isOAuth2User}
						<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<p class="text-sm text-blue-700">
								<strong>OAuth2 Account:</strong> You're signed in via Google/GitHub. Password changes are managed through your OAuth2 provider.
							</p>
						</div>
					{/if}
				</div>

				<!-- Change Password (only for non-OAuth2 users) -->
				{#if !data.user.isOAuth2User}
					<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div class="flex items-center gap-3 mb-6">
							<Lock class="h-5 w-5 text-gray-500" />
							<h2 class="text-xl font-semibold text-gray-900">Change Password</h2>
						</div>

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
							class="space-y-4"
						>
							<div>
								<label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">
									Current Password
								</label>
								<input
									type="password"
									id="currentPassword"
									name="currentPassword"
									bind:value={currentPassword}
									required
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>

							<div>
								<label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">
									New Password
								</label>
								<input
									type="password"
									id="newPassword"
									name="newPassword"
									bind:value={newPassword}
									required
									minlength="8"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
								<p class="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
							</div>

							<div>
								<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
									Confirm New Password
								</label>
								<input
									type="password"
									id="confirmPassword"
									name="confirmPassword"
									bind:value={confirmPassword}
									required
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>

							<button
								type="submit"
								disabled={passwordLoading}
								class="w-full flex justify-center items-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{#if passwordLoading}
									<Loader size={16} class="animate-spin" />
									<span>Changing...</span>
								{:else}
									Change Password
								{/if}
							</button>
						</form>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div> 
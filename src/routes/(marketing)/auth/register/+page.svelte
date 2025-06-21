<script lang="ts">
	import { enhance } from '$app/forms';
	import { isLoading } from '$lib/stores/auth.js';
	import Loader from 'lucide-svelte/icons/loader';
	import { t, language } from '$lib/i18n.js';
	import OAuth2Button from '$lib/components/OAuth2Button.svelte';
	import { getAvailableOAuth2Providers, type OAuth2Provider } from '$lib/oauth2.js';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';


	// Define the type for our form data
	type RegisterForm = {
		username?: string;
		email?: string;
		error?: string;
		success?: boolean;
	};

	let { form } = $props<{ form?: RegisterForm }>();

	// Use the loading state from auth store
	const isAuthLoading = $derived($isLoading);
	let manualLoading = $state(false);

	// Combined loading state
	const isRegistering = $derived(isAuthLoading || manualLoading);

	// Form data - use server-returned values if available
	let username = $state(form?.username || '');
	let email = $state(form?.email || '');
	let password = $state(''); // Don't restore password for security reasons
	let confirmPassword = $state('');

	// Form validation
	let usernameError = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let confirmPasswordError = $state('');

	// OAuth2 providers
	let availableProviders = $state<OAuth2Provider[]>([]);

	// Load available OAuth2 providers
	onMount(async () => {
		availableProviders = await getAvailableOAuth2Providers();
	});

	// Validate form inputs
	function validateForm() {
		// Reset errors
		usernameError = '';
		emailError = '';
		passwordError = '';
		confirmPasswordError = '';

		let isValid = true;

		// Username validation
		if (!username) {
			usernameError = 'Username is required';
			isValid = false;
		} else if (username.length < 2) {
			usernameError = 'Username must be at least 2 characters';
			isValid = false;
		} else if (!/^[a-z0-9]+$/.test(username)) {
			usernameError = 'Username can only contain lowercase letters and numbers';
			isValid = false;
		}

		// Email validation
		if (!email) {
			emailError = t('loginPage.validation.emailRequired', $language);
			isValid = false;
		} else if (!/^\S+@\S+\.\S+$/.test(email)) {
			emailError = t('loginPage.validation.emailInvalid', $language);
			isValid = false;
		}

		// Password validation
		if (!password) {
			passwordError = t('loginPage.validation.passwordRequired', $language);
			isValid = false;
		} else if (password.length < 8) {
			passwordError = 'Password must be at least 8 characters';
			isValid = false;
		}

		// Confirm password validation
		if (!confirmPassword) {
			confirmPasswordError = 'Please confirm your password';
			isValid = false;
		} else if (password !== confirmPassword) {
			confirmPasswordError = 'Passwords do not match';
			isValid = false;
		}

		return isValid;
	}
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center sm:px-6 lg:px-8 -mt-20">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="text-center">
			<h2 class="text-3xl font-bold text-gray-900 mb-2">
				Create Your Account
			</h2>
			<p class="text-sm text-gray-600">
				Choose your username and get your personal URL at zaur.app/username
			</p>
		</div>

		{#if form?.error}
			<div class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
				<p class="text-sm text-red-600">{form.error}</p>
			</div>
		{/if}

		<div class="mt-8 bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
			<!-- OAuth2 Registration Options -->
			{#if availableProviders.length > 0}
				<div class="mb-6">
					<div class="space-y-3">
						{#each availableProviders as provider}
							<OAuth2Button {provider} variant="outline" />
						{/each}
					</div>
					
					<div class="relative my-6">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t border-gray-300"></div>
						</div>
						<div class="relative flex justify-center text-sm">
							<span class="px-2 bg-white text-gray-500">Or create account with email</span>
						</div>
					</div>
				</div>
			{/if}

			<form
				method="POST"
				novalidate
				use:enhance={({ formData, cancel }) => {
					// Run client-side validation first
					if (!validateForm()) {
						// Cancel form submission if validation fails
						cancel();
						return;
					}

					manualLoading = true;
					// Store the current values for reference
					const submittedUsername = formData.get('username') as string;
					const submittedEmail = formData.get('email') as string;

					return async ({ update }) => {
						await update({ reset: false }); // Prevent form reset to keep values
						// Update local values in case server returned different ones
						if (form?.username) username = form.username;
						else username = submittedUsername;
						
						if (form?.email) email = form.email;
						else email = submittedEmail;
						
						setTimeout(() => {
							manualLoading = false;
						}, 500);
					};
				}}
				class="space-y-6"
			>
				<div>
					<label for="username" class="block text-sm font-medium text-gray-700 mb-2">
						Username
					</label>
					<div class="relative">
						<span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">zaur.app/</span>
						<input
							type="text"
							id="username"
							name="username"
							bind:value={username}
							class="w-full pl-20 pr-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors {usernameError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}"
							placeholder="johndoe"
							disabled={isRegistering || manualLoading}
							oninput={(e) => {
								// Convert to lowercase and remove invalid chars as user types
								username = e.currentTarget.value.toLowerCase().replace(/[^a-z0-9]/g, '');
							}}
							onblur={() => {
								if (!username) usernameError = 'Username is required';
								else if (username.length < 2) usernameError = 'Username must be at least 2 characters';
								else if (!/^[a-z0-9]+$/.test(username)) usernameError = 'Username can only contain lowercase letters and numbers';
								else usernameError = '';
							}}
						/>
					</div>
					{#if usernameError}
						<p class="mt-1 text-sm text-red-600">{usernameError}</p>
					{/if}
					<p class="mt-1 text-sm text-gray-500">This will be your personal URL: zaur.app/{username || 'username'}</p>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
						{t('loginPage.email', $language)}
					</label>
					<input
						type="email"
						id="email"
						name="email"
						bind:value={email}
						class="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors {emailError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}"
						placeholder={t('loginPage.emailPlaceholder', $language)}
						disabled={isRegistering || manualLoading}
						onblur={() => {
							if (!email) emailError = t('loginPage.validation.emailRequired', $language);
							else if (!/^\S+@\S+\.\S+$/.test(email))
								emailError = t('loginPage.validation.emailInvalid', $language);
							else emailError = '';
						}}
					/>
					{#if emailError}
						<p class="mt-1 text-sm text-red-600">{emailError}</p>
					{/if}
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
						{t('loginPage.password', $language)}
					</label>
					<input
						type="password"
						id="password"
						name="password"
						bind:value={password}
						class="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors {passwordError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}"
						placeholder="Enter your password"
						disabled={isRegistering || manualLoading}
						onblur={() => {
							if (!password) passwordError = t('loginPage.validation.passwordRequired', $language);
							else if (password.length < 8) passwordError = 'Password must be at least 8 characters';
							else passwordError = '';
						}}
					/>
					{#if passwordError}
						<p class="mt-1 text-sm text-red-600">{passwordError}</p>
					{/if}
				</div>

				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
						Confirm Password
					</label>
					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						bind:value={confirmPassword}
						class="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors {confirmPasswordError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}"
						placeholder="Confirm your password"
						disabled={isRegistering || manualLoading}
						onblur={() => {
							if (!confirmPassword) confirmPasswordError = 'Please confirm your password';
							else if (password !== confirmPassword) confirmPasswordError = 'Passwords do not match';
							else confirmPasswordError = '';
						}}
					/>
					{#if confirmPasswordError}
						<p class="mt-1 text-sm text-red-600">{confirmPasswordError}</p>
					{/if}
				</div>

				<!-- Don't auto-detect country during registration - let users set it up later -->

				<button
					type="submit"
					class="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
					disabled={isRegistering || manualLoading}
					onclick={(e) => {
						if (!validateForm()) {
							e.preventDefault();
						}
					}}
				>
					{#if isRegistering || manualLoading}
						<Loader size={16} class="animate-spin" />
						<span>Creating Account...</span>
					{:else}
						Create Account
					{/if}
				</button>
			</form>

			<div class="mt-6 text-center text-sm">
				<a href="/auth/login" class="text-blue-600 hover:text-blue-500 transition-colors">
					Already have an account? Sign in
				</a>
			</div>
		</div>
	</div>
</div>

 
<script lang="ts">
	import { enhance } from '$app/forms';
	import { isLoading } from '$lib/stores/auth.js';
	import Loader from 'lucide-svelte/icons/loader';
	import { t, language } from '$lib/i18n.js';
	import OAuth2Button from '$lib/components/OAuth2Button.svelte';
	import { getAvailableOAuth2Providers, type OAuth2Provider } from '$lib/oauth2.js';
	import { onMount } from 'svelte';


	// Define the type for our form data
	type LoginForm = {
		email?: string;
		error?: string;
		success?: boolean;
		redirectTo?: string;
	};

	let { form, data } = $props<{ form?: LoginForm; data: { redirectTo: string; error?: string } }>();

	// Use the loading state from auth store
	const isAuthLoading = $derived($isLoading);
	let manualLoading = $state(false);

	// Combined loading state
	const isLoggingIn = $derived(isAuthLoading || manualLoading);

	// Form data - use server-returned values if available
	let email = $state(form?.email || '');
	let password = $state(''); // Don't restore password for security reasons

	// Form validation
	let emailError = $state('');
	let passwordError = $state('');

	// OAuth2 providers
	let availableProviders = $state<OAuth2Provider[]>([]);

	// Load available OAuth2 providers
	onMount(async () => {
		availableProviders = await getAvailableOAuth2Providers();
	});

	// Validate form inputs
	function validateForm() {
		// Reset errors
		emailError = '';
		passwordError = '';

		let isValid = true;

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
		}

		return isValid;
	}
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center sm:px-6 lg:px-8 -mt-20">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="text-center">
			<h2 class="text-3xl font-bold text-gray-900 mb-2">
				{t('loginPage.title', $language)}
			</h2>
			<p class="text-sm text-gray-600">
				Welcome back! Please sign in to your account.
			</p>
		</div>

		{#if form?.error || data?.error}
			<div class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
				<p class="text-sm text-red-600">{form?.error || data?.error}</p>
			</div>
		{/if}

		<div class="mt-8 bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
			<!-- OAuth2 Login Options -->
			{#if availableProviders.length > 0}
				<div class="mb-6">
					<div class="space-y-3">
						{#each availableProviders as provider}
							<OAuth2Button {provider} variant="outline" redirectTo={form?.redirectTo || data.redirectTo} />
						{/each}
					</div>
					
					<div class="relative my-6">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t border-gray-300"></div>
						</div>
						<div class="relative flex justify-center text-sm">
							<span class="px-2 bg-white text-gray-500">Or continue with email</span>
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
					// Store the current email for reference
					const submittedEmail = formData.get('email') as string;

					return async ({ update }) => {
						await update({ reset: false }); // Prevent form reset to keep values
						// Update local email value in case server returned a different one
						if (form?.email) {
							email = form.email;
						} else {
							email = submittedEmail;
						}
						setTimeout(() => {
							manualLoading = false;
						}, 500);
					};
				}}
				class="space-y-6"
			>
				<!-- Hidden redirect field -->
				<input type="hidden" name="redirectTo" value={form?.redirectTo || data.redirectTo} />
				
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
						disabled={isLoggingIn || manualLoading}
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
						placeholder={t('loginPage.passwordPlaceholder', $language)}
						disabled={isLoggingIn || manualLoading}
						onblur={() => {
							if (!password) passwordError = t('loginPage.validation.passwordRequired', $language);
							else passwordError = '';
						}}
					/>
					{#if passwordError}
						<p class="mt-1 text-sm text-red-600">{passwordError}</p>
					{/if}
				</div>

				<button
					type="submit"
					class="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
					disabled={isLoggingIn || manualLoading}
					onclick={(e) => {
						if (!validateForm()) {
							e.preventDefault();
						}
					}}
				>
					{#if isLoggingIn || manualLoading}
						<Loader size={16} class="animate-spin" />
						<span>{t('loginPage.loggingIn', $language)}</span>
					{:else}
						{t('loginPage.loginButton', $language)}
					{/if}
				</button>
			</form>

			<div class="mt-6 flex items-center justify-center gap-4 text-sm">
				<a href="/auth/forgot-password" class="text-blue-600 hover:text-blue-500 transition-colors">
					{t('loginPage.forgotPassword', $language)}
				</a>
				<span class="text-gray-400">•</span>
				<a href="/auth/register" class="text-blue-600 hover:text-blue-500 transition-colors">
					Create an account
				</a>
			</div>
		</div>
	</div>
</div>

 
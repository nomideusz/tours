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
		needsVerification?: boolean;
		userId?: string;
		message?: string;
	};

	let { form, data } = $props<{ form?: LoginForm; data: { redirectTo: string; error?: string; earlyAccessEnabled: boolean } }>();

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

	// Verification email state
	let isResendingVerification = $state(false);
	let verificationSent = $state(false);

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

	// Handle resending verification email
	let resendForm = $state<HTMLFormElement>();

	function resendVerificationEmail() {
		if (!form?.userId || !email || !resendForm) return;
		isResendingVerification = true;
		resendForm.requestSubmit();
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
			{#if data.earlyAccessEnabled}
				<div class="mt-4 badge badge--warning">
					🚀 Early Access
				</div>
			{/if}
		</div>

		{#if form?.message || verificationSent}
			<div class="alert-success rounded-lg p-3 mb-4">
				<p class="text-sm">{form?.message || 'Verification email sent! Please check your inbox.'}</p>
			</div>
		{:else if form?.needsVerification}
			<div class="alert-warning rounded-lg p-4 mb-4">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0">
						<svg class="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="flex-1">
						<h3 class="text-sm font-medium text-amber-800 mb-2">Email verification required</h3>
						<p class="text-sm text-amber-700 mb-3">{form?.error}</p>
						<button
							type="button"
							onclick={resendVerificationEmail}
							disabled={isResendingVerification}
							class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md text-amber-800 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{#if isResendingVerification}
								<Loader size={12} class="animate-spin" />
								Sending...
							{:else}
								Resend verification email
							{/if}
						</button>
					</div>
				</div>
			</div>
		{:else if form?.error || data?.error}
			<div class="alert-error rounded-lg p-3 mb-4">
				<p class="text-sm">{form?.error || data?.error}</p>
			</div>
		{/if}

		<div class="mt-8 bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
			<!-- OAuth2 Login Options -->
			{#if availableProviders.length > 0}
				<div class="mb-6">
					<div class="space-y-3">
						{#each availableProviders as provider}
							<OAuth2Button {provider} variant="outline" redirectTo={form?.redirectTo || data.redirectTo || ''} />
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
				action="?/login"
				novalidate
				use:enhance={({ formData, cancel }) => {
					// Run client-side validation first
					if (!validateForm()) {
						// Cancel form submission if validation fails
						cancel();
						return;
					}

					manualLoading = true;
					console.log('🔄 Login form submitted, setting manual loading to true');
					// Store the current email for reference
					const submittedEmail = formData.get('email') as string;

					return async ({ result, update }) => {
						console.log('🔄 Login form result:', result.type, result);
						
						// Always call update first to let SvelteKit handle the result
						await update({ reset: false });
						
						// Only reset loading state for non-redirect responses
						if (result.type !== 'redirect') {
							console.log('❌ Login failed or other result, resetting loading state');
							
							// Update local email value in case server returned a different one
							if (form?.email) {
								email = form.email;
							} else {
								email = submittedEmail;
							}
							
							manualLoading = false;
						} else {
							console.log('✅ Login successful, redirect will be handled by SvelteKit');
							// Keep loading state during redirect for smooth UX
						}
					};
				}}
				class="space-y-6"
			>
				<!-- Hidden redirect field -->
				<input type="hidden" name="redirectTo" value={form?.redirectTo || data.redirectTo || ''} />
				
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
						{t('loginPage.email', $language)}
					</label>
					<input
						type="email"
						id="email"
						name="email"
						bind:value={email}
						class="form-input {emailError ? 'error' : ''}"
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
						<p class="form-error">{emailError}</p>
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
						class="form-input {passwordError ? 'error' : ''}"
						placeholder={t('loginPage.passwordPlaceholder', $language)}
						disabled={isLoggingIn || manualLoading}
						onblur={() => {
							if (!password) passwordError = t('loginPage.validation.passwordRequired', $language);
							else passwordError = '';
						}}
					/>
					{#if passwordError}
						<p class="form-error">{passwordError}</p>
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

			<!-- Hidden form for resending verification email -->
			{#if form?.needsVerification}
				<form
					bind:this={resendForm}
					method="POST"
					action="?/resendVerification"
					class="hidden"
					use:enhance={() => {
						return async ({ result, update }) => {
							// Don't interfere with redirects
							if (result.type === 'redirect') {
								return;
							}
							
							await update();
							isResendingVerification = false;
							if (result.type === 'success') {
								verificationSent = true;
							}
						};
					}}
				>
					<input type="hidden" name="userId" value={form?.userId || ''} />
					<input type="hidden" name="email" value={email} />
				</form>
			{/if}

			<div class="mt-6 flex items-center justify-center gap-4 text-sm">
				<a href="/auth/forgot-password" class="text-blue-600 hover:text-blue-500 transition-colors">
					{t('loginPage.forgotPassword', $language)}
				</a>
				<span class="text-gray-400">•</span>
				{#if data.earlyAccessEnabled}
					<a href="/early-access" class="text-blue-600 hover:text-blue-500 transition-colors">
						Request early access
					</a>
				{:else}
					<a href="/auth/register" class="text-blue-600 hover:text-blue-500 transition-colors">
						Create an account
					</a>
				{/if}
			</div>
		</div>
	</div>
</div>

 
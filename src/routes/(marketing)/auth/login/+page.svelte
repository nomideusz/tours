<script lang="ts">
	import { enhance } from '$app/forms';
	import { isLoading } from '$lib/stores/auth.js';
	import Loader from 'lucide-svelte/icons/loader';
	import { t, language } from '$lib/i18n.js';
	import OAuth2Button from '$lib/components/OAuth2Button.svelte';
	import { getAvailableOAuth2Providers, type OAuth2Provider } from '$lib/oauth2.js';
	import { onMount } from 'svelte';
	import LogIn from 'lucide-svelte/icons/log-in';
	import Mail from 'lucide-svelte/icons/mail';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';

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

	let { form, data } = $props<{ form?: LoginForm; data: { redirectTo: string; error?: string; message?: string; type?: string } }>();

	// Use the loading state from auth store
	const isAuthLoading = $derived($isLoading);
	let manualLoading = $state(false);

	// Combined loading state
	const isLoggingIn = $derived(isAuthLoading || manualLoading);

	// Form data - use server-returned values if available
	let email = $state(form?.email || '');
	let password = $state(''); // Don't restore password for security reasons
	let showPassword = $state(false);

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

<div class="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
	<div class="w-full max-w-lg relative z-10">
		<!-- Header -->
		<div class="text-center mb-6 sm:mb-8">
			<h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
				Welcome Back
			</h2>
			<p class="text-gray-600 text-sm">
				Sign in to your account to continue
			</p>
		</div>

		<!-- Status Messages -->
		{#if form?.message || verificationSent || (data?.message && data?.type === 'success')}
			<div class="bg-white border border-green-200 rounded-xl p-4 mb-4 sm:mb-6 shadow-sm">
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
							<CheckCircle class="w-4 h-4 text-green-600" />
						</div>
					</div>
					<p class="text-sm font-medium text-green-800">{form?.message || data?.message || 'Success! Please check your inbox.'}</p>
				</div>
			</div>
		{:else if form?.needsVerification}
			<div class="bg-white border border-orange-200 rounded-xl p-4 mb-4 sm:mb-6 shadow-sm">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
							<AlertCircle class="w-4 h-4 text-orange-600" />
						</div>
					</div>
					<div class="flex-1">
						<h3 class="text-sm font-semibold text-gray-900 mb-2">Email Verification Required</h3>
						<p class="text-sm text-gray-600 mb-3">{form?.error}</p>
						<button
							type="button"
							onclick={resendVerificationEmail}
							disabled={isResendingVerification}
							class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
						>
							{#if isResendingVerification}
								<Loader size={12} class="animate-spin" />
								Sending verification email...
							{:else}
								<Mail size={12} />
								Resend verification email
							{/if}
						</button>
					</div>
				</div>
			</div>
		{:else if form?.error || data?.error}
			<div class="bg-white border border-red-200 rounded-xl p-4 mb-4 sm:mb-6 shadow-sm">
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
							<AlertCircle class="w-4 h-4 text-red-600" />
						</div>
					</div>
					<p class="text-sm font-medium text-red-800">{form?.error || data?.error}</p>
				</div>
			</div>
		{/if}

		<!-- Login Card -->
		<div class="modern-card">
			<div class="relative">
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
							<div class="relative flex justify-center">
								<span class="px-4 bg-white text-gray-500 text-sm font-medium">
									Or continue with email
								</span>
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
					class="space-y-4 sm:space-y-5"
				>
					<!-- Hidden redirect field -->
					<input type="hidden" name="redirectTo" value={form?.redirectTo || data.redirectTo || ''} />
					
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">
							{t('loginPage.email', $language)}
						</label>
						<input
							type="email"
							id="email"
							name="email"
							bind:value={email}
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 text-sm {emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
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
							<p class="mt-1 text-xs text-red-600">{emailError}</p>
						{/if}
					</div>

					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">
							{t('loginPage.password', $language)}
						</label>
						<div class="relative password-input-container">
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								name="password"
								bind:value={password}
								class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 text-sm {passwordError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
								placeholder={t('loginPage.passwordPlaceholder', $language)}
								disabled={isLoggingIn || manualLoading}
								onblur={() => {
									if (!password) passwordError = t('loginPage.validation.passwordRequired', $language);
									else passwordError = '';
								}}
							/>
							<button
								type="button"
								class="absolute inset-y-0 right-0 pr-3 flex items-center password-toggle-btn"
								onclick={() => showPassword = !showPassword}
							>
								{#if showPassword}
									<EyeOff class="h-4 w-4 text-gray-400" />
								{:else}
									<Eye class="h-4 w-4 text-gray-400" />
								{/if}
							</button>
						</div>
						{#if passwordError}
							<p class="mt-1 text-xs text-red-600">{passwordError}</p>
						{/if}
					</div>

					<button
						type="submit"
						class="w-full button-coral button--full-width"
						disabled={isLoggingIn || manualLoading}
						onclick={(e) => {
							if (!validateForm()) {
								e.preventDefault();
							}
						}}
					>
						{#if isLoggingIn || manualLoading}
							<Loader size={16} class="animate-spin mr-2" />
							<span>{t('loginPage.loggingIn', $language)}</span>
						{:else}
							<LogIn size={16} class="mr-2" />
							<span>{t('loginPage.loginButton', $language)}</span>
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

				<!-- Navigation -->
				<div class="mt-6 flex items-center justify-center gap-4 text-sm">
					<a href="/auth/forgot-password" class="text-coral-600 hover:text-coral-500 font-medium">
						Forgot password?
					</a>
					<div class="w-1 h-1 rounded-full bg-gray-400"></div>
					<a href="/auth/register" class="text-coral-600 hover:text-coral-500 font-medium">
						Create account
					</a>
				</div>
			</div>
		</div>
	</div>
</div>

 
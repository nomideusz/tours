<script lang="ts">
	import { enhance } from '$app/forms';
	import { isLoading } from '$lib/stores/auth.js';
	import Loader from 'lucide-svelte/icons/loader';
	import Check from 'lucide-svelte/icons/check';
	import Gift from 'lucide-svelte/icons/gift';
	import X from 'lucide-svelte/icons/x';
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

	let { form, data } = $props<{ form?: RegisterForm; data: { earlyAccessEnabled: boolean } }>();

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
	let accessCode = $state('');

	// Form validation
	let usernameError = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let confirmPasswordError = $state('');
	let accessCodeError = $state('');

	// Promo code validation state
	let isValidatingCode = $state(false);
	let promoCodeValid = $state(false);
	let promoCodeBenefit = $state('');
	let promoCodeDescription = $state('');

	// OAuth2 providers
	let availableProviders = $state<OAuth2Provider[]>([]);

	// Load available OAuth2 providers
	onMount(async () => {
		availableProviders = await getAvailableOAuth2Providers();
	});
	
	// Debounce timer
	let codeValidationTimer: NodeJS.Timeout;
	
	// Validate promo code as user types
	async function validatePromoCode(code: string) {
		// Clear previous validation
		promoCodeValid = false;
		promoCodeBenefit = '';
		promoCodeDescription = '';
		accessCodeError = '';
		
		// Clear previous timer
		if (codeValidationTimer) {
			clearTimeout(codeValidationTimer);
		}
		
		if (!code) {
			return;
		}
		
		// Debounce the validation
		codeValidationTimer = setTimeout(async () => {
			isValidatingCode = true;
			
			try {
				const response = await fetch('/api/promo-code/validate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ code })
				});
				
				const result = await response.json();
				
				if (result.valid) {
					promoCodeValid = true;
					promoCodeBenefit = result.benefitText;
					promoCodeDescription = result.benefits.description || '';
				} else {
					accessCodeError = result.error || 'Invalid promo code';
				}
			} catch (error) {
				console.error('Error validating promo code:', error);
				accessCodeError = 'Failed to validate promo code';
			} finally {
				isValidatingCode = false;
			}
		}, 500); // 500ms debounce
	}

	// Validate form inputs
	function validateForm() {
		// Reset errors
		usernameError = '';
		emailError = '';
		passwordError = '';
		confirmPasswordError = '';
		accessCodeError = '';

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

		// Access code validation (only if early access is enabled)
		if (data?.earlyAccessEnabled) {
			if (!accessCode) {
				accessCodeError = 'Early access code is required';
				isValid = false;
			} else if (!promoCodeValid && !isValidatingCode) {
				accessCodeError = 'Please enter a valid early access code';
				isValid = false;
			}
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
			{#if data?.earlyAccessEnabled}
				<div class="mt-4 badge badge--warning">
					🚀 Early Access
				</div>
			{/if}
		</div>

		{#if form?.error}
			<div class="alert-error rounded-lg p-3 mb-4">
				<p class="text-sm">{form.error}</p>
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

					return async ({ result, update }) => {
						console.log('🔄 Registration form result:', result.type, result);
						
						// Always call update first to let SvelteKit handle the result
						await update({ reset: false });
						
						// Only reset loading state for non-redirect responses
						if (result.type !== 'redirect') {
							console.log('❌ Registration failed or other result, resetting loading state');
							
							// Update local values in case server returned different ones
							if (form?.username) username = form.username;
							else username = submittedUsername;
							
							if (form?.email) email = form.email;
							else email = submittedEmail;
							
							manualLoading = false;
						} else {
							console.log('✅ Registration successful, redirect will be handled by SvelteKit');
							// Keep loading state during redirect for smooth UX
						}
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
							class="form-input pl-20 {usernameError ? 'error' : ''}"
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
						<p class="form-error">{usernameError}</p>
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
						class="form-input {emailError ? 'error' : ''}"
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
						placeholder="Enter your password"
						disabled={isRegistering || manualLoading}
						onblur={() => {
							if (!password) passwordError = t('loginPage.validation.passwordRequired', $language);
							else if (password.length < 8) passwordError = 'Password must be at least 8 characters';
							else passwordError = '';
						}}
					/>
					{#if passwordError}
						<p class="form-error">{passwordError}</p>
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
						class="form-input {confirmPasswordError ? 'error' : ''}"
						placeholder="Confirm your password"
						disabled={isRegistering || manualLoading}
						onblur={() => {
							if (!confirmPassword) confirmPasswordError = 'Please confirm your password';
							else if (password !== confirmPassword) confirmPasswordError = 'Passwords do not match';
							else confirmPasswordError = '';
						}}
					/>
					{#if confirmPasswordError}
						<p class="form-error">{confirmPasswordError}</p>
					{/if}
				</div>

				{#if data?.earlyAccessEnabled}
					<div>
						<label for="accessCode" class="block text-sm font-medium text-gray-700 mb-2">
							Early Access Code
						</label>
						<div class="relative">
							<input
								type="text"
								id="accessCode"
								name="accessCode"
								bind:value={accessCode}
								class="form-input pr-10 {accessCodeError ? 'error' : ''} {promoCodeValid ? '!border-green-500' : ''}"
								placeholder="Enter your early access code"
								disabled={isRegistering || manualLoading}
								oninput={(e) => {
									// Convert to uppercase for consistency
									accessCode = e.currentTarget.value.toUpperCase();
									validatePromoCode(accessCode);
								}}
								onblur={() => {
									if (!accessCode) accessCodeError = 'Early access code is required';
									else if (!promoCodeValid && !isValidatingCode) accessCodeError = 'Invalid early access code';
									else accessCodeError = '';
								}}
							/>
							<div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
								{#if isValidatingCode}
									<Loader size={16} class="animate-spin text-gray-400" />
								{:else if promoCodeValid}
									<Check size={16} class="text-green-500" />
								{:else if accessCode && accessCodeError}
									<X size={16} class="text-red-500" />
								{/if}
							</div>
						</div>
						{#if accessCodeError}
							<p class="form-error">{accessCodeError}</p>
						{/if}
						{#if promoCodeValid && promoCodeBenefit}
							<div class="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
								<div class="flex items-start gap-2">
									<Gift size={16} class="text-green-600 mt-0.5 flex-shrink-0" />
									<div class="text-sm">
										<p class="font-medium text-green-900">{promoCodeBenefit}</p>
										{#if promoCodeDescription}
											<p class="text-green-700 mt-1">{promoCodeDescription}</p>
										{/if}
									</div>
								</div>
							</div>
						{/if}
						<p class="mt-1 text-sm text-gray-500">
							Don't have a code? <a href="/early-access" class="link">Request early access</a>
						</p>
					</div>
				{/if}

				<!-- Don't auto-detect country during registration - let users set it up later -->

				<button
					type="submit"
					class="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
					disabled={isRegistering || manualLoading || (data?.earlyAccessEnabled && (!promoCodeValid || isValidatingCode))}
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

 
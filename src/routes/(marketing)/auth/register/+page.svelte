<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { t, language } from '$lib/i18n.js';
	import { isLoading } from '$lib/stores/auth.js';
	import Loader from 'lucide-svelte/icons/loader';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import UserPlus from 'lucide-svelte/icons/user-plus';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';
	import OAuth2Button from '$lib/components/OAuth2Button.svelte';
	import { getAvailableOAuth2Providers, type OAuth2Provider } from '$lib/oauth2.js';
	import { onMount } from 'svelte';

	// Define the type for our form data
	type RegisterForm = {
		username?: string;
		email?: string;
		error?: string;
		success?: boolean;
		message?: string;
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
	let password = $state('');
	let confirmPassword = $state('');
	let accessCode = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	// OAuth2 providers
	let availableProviders = $state<OAuth2Provider[]>([]);

	// Load available OAuth2 providers
	onMount(async () => {
		availableProviders = await getAvailableOAuth2Providers();
	});

	// Form validation
	let usernameError = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let confirmPasswordError = $state('');

	// Auto-correction visual feedback
	let usernameCorrected = $state(false);
	let promoCorrected = $state(false);

	// Auto-correction functions
	function sanitizeUsername(value: string) {
		// Convert to lowercase and remove spaces
		return value.toLowerCase().replace(/\s+/g, '');
	}

	function formatPromoCode(value: string) {
		// Convert to uppercase
		return value.toUpperCase();
	}

	// Error scrolling for mobile
	function scrollToFirstError() {
		// Only scroll on mobile devices
		if (window.innerWidth <= 768) {
			setTimeout(() => {
				const firstError = document.querySelector('.border-red-300, .text-red-600');
				if (firstError) {
					firstError.scrollIntoView({ 
						behavior: 'smooth', 
						block: 'center' 
					});
				}
			}, 100);
		}
	}

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
		} else if (username.length < 3) {
			usernameError = 'Username must be at least 3 characters';
			isValid = false;
		} else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
			usernameError = 'Username can only contain letters, numbers, hyphens, and underscores';
			isValid = false;
		}

		// Email validation
		if (!email) {
			emailError = 'Email is required';
			isValid = false;
		} else if (!/^\S+@\S+\.\S+$/.test(email)) {
			emailError = 'Please enter a valid email address';
			isValid = false;
		}

		// Password validation
		if (!password) {
			passwordError = 'Password is required';
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

		// Scroll to first error on mobile if validation failed
		if (!isValid) {
			scrollToFirstError();
		}

		return isValid;
	}

	function goToLogin() {
		goto('/auth/login');
	}
</script>



<div class="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
	<div class="w-full max-w-lg lg:max-w-2xl relative z-10">
		<!-- Header -->
		<div class="text-center mb-6 sm:mb-8">
			<h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
				Create Account
			</h2>
			<p class="text-gray-600 text-sm">
				Start your journey with Zaur
			</p>
		</div>

		<!-- Error Messages -->
		{#if form?.error}
			<div class="bg-white border border-red-200 rounded-xl p-4 mb-4 sm:mb-6 shadow-sm">
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
							<AlertCircle class="w-4 h-4 text-red-600" />
						</div>
					</div>
					<p class="text-sm font-medium text-red-800">{form.error}</p>
				</div>
			</div>
		{/if}

		<!-- Success Message -->
		{#if form?.success}
			<div class="bg-white border border-green-200 rounded-xl p-4 mb-4 sm:mb-6 shadow-sm">
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
							<CheckCircle class="w-4 h-4 text-green-600" />
						</div>
					</div>
					<p class="text-sm font-medium text-green-800">{form.message || 'Account created successfully!'}</p>
				</div>
			</div>
		{/if}

		<!-- Register Card -->
		<div class="modern-card">
			<div class="relative">
				<!-- OAuth2 Register Options -->
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
					novalidate
					use:enhance={({ formData, cancel }) => {
						// Run client-side validation first
						if (!validateForm()) {
							cancel();
							return;
						}

						manualLoading = true;
						const submittedUsername = formData.get('username') as string;
						const submittedEmail = formData.get('email') as string;

						return async ({ result, update }) => {
							await update({ reset: false });
							
							if (result.type !== 'redirect') {
								// Update local values in case server returned different ones
								if (form?.username) {
									username = form.username;
								} else {
									username = submittedUsername;
								}
								
								if (form?.email) {
									email = form.email;
								} else {
									email = submittedEmail;
								}
								
								// Clear passwords for security
								password = '';
								confirmPassword = '';
								
								manualLoading = false;
							}
						};
					}}
					class="space-y-4 sm:space-y-5"
				>
					<!-- Account Information Grid -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
						<div>
							<label for="username" class="block text-sm font-medium text-gray-700 mb-1.5">
								Username
							</label>
							<input
								type="text"
								id="username"
								name="username"
								bind:value={username}
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 text-sm {usernameError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
								placeholder="Choose a username"
								disabled={isRegistering}
								oninput={(e) => {
									const target = e.target as HTMLInputElement;
									const sanitized = sanitizeUsername(target.value);
									if (target.value !== sanitized) {
										username = sanitized;
										usernameCorrected = true;
										setTimeout(() => usernameCorrected = false, 2000);
									}
								}}
								onblur={() => {
									if (!username) usernameError = 'Username is required';
									else if (username.length < 3) usernameError = 'Username must be at least 3 characters';
									else if (!/^[a-zA-Z0-9_-]+$/.test(username)) usernameError = 'Username can only contain letters, numbers, hyphens, and underscores';
									else usernameError = '';
								}}
							/>
							{#if usernameError}
								<p class="mt-1 text-xs text-red-600">{usernameError}</p>
							{:else if usernameCorrected}
								<p class="mt-1 text-xs text-green-600">✓ Auto-corrected to lowercase</p>
							{/if}
						</div>

						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">
								Email Address
							</label>
							<input
								type="email"
								id="email"
								name="email"
								bind:value={email}
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 text-sm {emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
								placeholder="your@email.com"
								disabled={isRegistering}
								onblur={() => {
									if (!email) emailError = 'Email is required';
									else if (!/^\S+@\S+\.\S+$/.test(email)) emailError = 'Please enter a valid email address';
									else emailError = '';
								}}
							/>
							{#if emailError}
								<p class="mt-1 text-xs text-red-600">{emailError}</p>
							{/if}
						</div>
					</div>

					<!-- Password Grid -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
						<div>
							<label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">
								Password
							</label>
							<div class="relative password-input-container">
								<input
									type={showPassword ? 'text' : 'password'}
									id="password"
									name="password"
									bind:value={password}
									class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 text-sm {passwordError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
									placeholder="Min. 8 characters"
									disabled={isRegistering}
									onblur={() => {
										if (!password) passwordError = 'Password is required';
										else if (password.length < 8) passwordError = 'Password must be at least 8 characters';
										else passwordError = '';
									}}
								/>
								<button
									type="button"
									class="absolute inset-y-0 right-0 pr-3 flex items-center password-toggle-btn"
									tabindex="-1"
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

						<div>
							<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1.5">
								Confirm Password
							</label>
							<div class="relative password-input-container">
								<input
									type={showConfirmPassword ? 'text' : 'password'}
									id="confirmPassword"
									name="confirmPassword"
									bind:value={confirmPassword}
									class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 text-sm {confirmPasswordError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
									placeholder="Confirm password"
									disabled={isRegistering}
									onblur={() => {
										if (!confirmPassword) confirmPasswordError = 'Please confirm your password';
										else if (password !== confirmPassword) confirmPasswordError = 'Passwords do not match';
										else confirmPasswordError = '';
									}}
								/>
								<button
									type="button"
									class="absolute inset-y-0 right-0 pr-3 flex items-center password-toggle-btn"
									tabindex="-1"
									onclick={() => showConfirmPassword = !showConfirmPassword}
								>
									{#if showConfirmPassword}
										<EyeOff class="h-4 w-4 text-gray-400" />
									{:else}
										<Eye class="h-4 w-4 text-gray-400" />
									{/if}
								</button>
							</div>
							{#if confirmPasswordError}
								<p class="mt-1 text-xs text-red-600">{confirmPasswordError}</p>
							{/if}
						</div>
					</div>

					<!-- Optional Fields Section -->
					<details class="border border-gray-200 rounded-lg p-4 bg-gray-50">
						<summary class="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
							Additional Information (Optional)
						</summary>
						<div class="mt-4 space-y-4">
							<!-- Business name and location removed from registration - users can add these in their profile later -->

							<div>
								<label for="accessCode" class="block text-sm font-medium text-gray-700 mb-1.5">
									Promo Code
								</label>
								<input
									type="text"
									id="accessCode"
									name="accessCode"
									bind:value={accessCode}
									class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 text-sm"
									placeholder="Enter promo code if you have one"
									disabled={isRegistering}
									oninput={(e) => {
										const target = e.target as HTMLInputElement;
										const formatted = formatPromoCode(target.value);
										if (target.value !== formatted) {
											accessCode = formatted;
											promoCorrected = true;
											setTimeout(() => promoCorrected = false, 2000);
										}
									}}
								/>
								{#if promoCorrected}
									<p class="mt-1 text-xs text-green-600">✓ Auto-corrected to uppercase</p>
								{/if}
							</div>
						</div>
					</details>

					<button
						type="submit"
						class="w-full button-coral button--full-width"
						disabled={isRegistering}
						onclick={(e) => {
							if (!validateForm()) {
								e.preventDefault();
							}
						}}
					>
						{#if isRegistering}
							<Loader size={16} class="animate-spin mr-2" />
							<span>Creating account...</span>
						{:else}
							<UserPlus size={16} class="mr-2" />
							<span>Create Account</span>
						{/if}
					</button>
				</form>

				<!-- Navigation -->
				<div class="mt-6 text-center">
					<p class="text-sm text-gray-600">
						Already have an account?
						<a href="/auth/login" class="font-medium text-coral-600 hover:text-coral-500 ml-1">
							Sign in
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

 
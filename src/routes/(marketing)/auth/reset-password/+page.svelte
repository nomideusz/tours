<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Loader from 'lucide-svelte/icons/loader';
	import { t, language } from '$lib/i18n.js';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Compass from 'lucide-svelte/icons/compass';
	import Route from 'lucide-svelte/icons/route';
	import Shield from 'lucide-svelte/icons/shield';
	import KeyRound from 'lucide-svelte/icons/key-round';
	import Key from 'lucide-svelte/icons/key';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Eye from 'lucide-svelte/icons/eye';
	import EyeOff from 'lucide-svelte/icons/eye-off';

	// Define the type for our form data
	type ResetPasswordForm = {
		error?: string;
		success?: boolean;
		message?: string;
	};

	let { form, data } = $props<{ form?: ResetPasswordForm; data: { token?: string; error?: string } }>();

	// Form state
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let isLoading = $state(false);

	// Form validation
	let passwordError = $state('');
	let confirmPasswordError = $state('');

	// Get token from data
	const token = $derived(data?.token);

	// Validate form inputs
	function validateForm() {
		passwordError = '';
		confirmPasswordError = '';
		let isValid = true;

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

		return isValid;
	}

	function goToLogin() {
		goto('/auth/login');
	}
</script>

<div class="min-h-screen subtle-retro-section flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
	<div class="w-full max-w-lg relative z-10">
		<!-- Header -->
		<div class="text-center mb-6 sm:mb-8">
			<h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
				Set New Password
			</h2>
			<p class="text-gray-600 text-sm">
				Create a new password for your account
			</p>
		</div>

		{#if data?.error}
			<!-- Error State -->
			<div class="bg-white border border-red-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
				<div class="text-center">
					<div class="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
						<AlertCircle class="w-6 h-6 text-red-600" />
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Invalid Reset Link</h3>
					<p class="text-sm text-gray-600 mb-4">{data.error}</p>
					<a href="/auth/forgot-password" class="inline-flex items-center gap-2 text-sm font-medium text-coral-600 hover:text-coral-500">
						<ArrowLeft class="w-4 h-4" />
						Request new reset link
					</a>
				</div>
			</div>
		{:else}
			<!-- Reset Password Card -->
			<div class="modern-card">
				<div class="relative">
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

					<form
						method="POST"
						novalidate
						use:enhance={({ formData, cancel }) => {
							// Run client-side validation first
							if (!validateForm()) {
								cancel();
								return;
							}

							isLoading = true;

							return async ({ result, update }) => {
								await update({ reset: false });
								
								if (result.type !== 'redirect') {
									isLoading = false;
								}
							};
						}}
						class="space-y-4 sm:space-y-5"
					>
						<!-- Hidden token field -->
						<input type="hidden" name="token" value={token} />

						<div>
							<label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">
								New Password
							</label>
							<div class="relative password-input-container">
								<input
									type={showPassword ? 'text' : 'password'}
									id="password"
									name="password"
									bind:value={password}
									class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 text-sm {passwordError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
									placeholder="Enter new password"
									disabled={isLoading}
									onblur={() => {
										if (!password) passwordError = 'Password is required';
										else if (password.length < 8) passwordError = 'Password must be at least 8 characters';
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
									placeholder="Confirm new password"
									disabled={isLoading}
									onblur={() => {
										if (!confirmPassword) confirmPasswordError = 'Please confirm your password';
										else if (password !== confirmPassword) confirmPasswordError = 'Passwords do not match';
										else confirmPasswordError = '';
									}}
								/>
								<button
									type="button"
									class="absolute inset-y-0 right-0 pr-3 flex items-center password-toggle-btn"
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

						<button
							type="submit"
							class="w-full button-primary button--full-width"
							disabled={isLoading}
							onclick={(e) => {
								if (!validateForm()) {
									e.preventDefault();
								}
							}}
						>
							{#if isLoading}
								<Loader size={16} class="animate-spin mr-2" />
								<span>Updating password...</span>
							{:else}
								<Key size={16} class="mr-2" />
								<span>Update Password</span>
							{/if}
						</button>
					</form>

					<!-- Navigation -->
					<div class="mt-6 text-center">
						<a href="/auth/login" class="inline-flex items-center gap-2 text-sm font-medium text-coral-600 hover:text-coral-500">
							<ArrowLeft class="w-4 h-4" />
							Back to sign in
						</a>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Subtle retro section with minimal color - matches HeroSection */
	.subtle-retro-section {
		background: linear-gradient(
			180deg,
			var(--bg-primary) 0%,
			var(--bg-secondary) 100%
		);
		position: relative;
		overflow: hidden;
		min-height: 100vh;
		display: flex;
		align-items: center;
	}
	
	/* Very subtle texture overlay - matches HeroSection */
	.subtle-retro-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 40px,
			rgba(0, 0, 0, 0.02) 40px,
			rgba(0, 0, 0, 0.02) 41px
		);
		pointer-events: none;
	}
</style>

 
<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Loader from 'lucide-svelte/icons/loader';
	import { t, language } from '$lib/i18n.js';


	// Define the type for our form data
	type ResetPasswordForm = {
		message?: string;
		success?: boolean;
	};

	let { form } = $props<{ form?: ResetPasswordForm }>();

	// Get token from URL params
	let token = $derived(page.url.searchParams.get('token') || '');

	// Form state
	let password = $state('');
	let passwordConfirm = $state('');
	let isLoading = $state(false);

	// Form validation
	let passwordError = $state('');
	let passwordConfirmError = $state('');

	// Validate form inputs
	function validateForm() {
		// Reset errors
		passwordError = '';
		passwordConfirmError = '';

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
		if (!passwordConfirm) {
			passwordConfirmError = 'Please confirm your password';
			isValid = false;
		} else if (password !== passwordConfirm) {
			passwordConfirmError = 'Passwords do not match';
			isValid = false;
		}

		return isValid;
	}

	function goToLogin() {
						goto('/auth/login');
	}
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center sm:px-6 lg:px-8 -mt-20">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="text-center">
			<h2 class="text-3xl font-bold text-gray-900 mb-2">
				Reset Your Password
			</h2>
			<p class="text-sm text-gray-600">
				Enter your new password below.
			</p>
		</div>

		{#if form?.message && !form?.success}
			<div class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
				<p class="text-sm text-red-600">{form.message}</p>
			</div>
		{/if}

		<div class="mt-8 bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
			{#if !token}
				<div class="text-center">
					<div class="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
						<p class="text-sm text-red-600">Invalid or missing reset token. Please check your email link.</p>
					</div>
					<button 
						class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors"
						onclick={goToLogin}
					>
						Back to Login
					</button>
				</div>
			{:else if form?.success}
				<div class="text-center">
					<div class="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
						<p class="text-sm text-green-600">Your password has been successfully reset!</p>
					</div>
					<button 
						class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors"
						onclick={goToLogin}
					>
						Sign In
					</button>
				</div>
			{:else}
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

						isLoading = true;

						return async ({ update }) => {
							await update({ reset: false });
							isLoading = false;
						};
					}}
					class="space-y-6"
				>
					<!-- Hidden token field -->
					<input type="hidden" name="token" value={token} />

					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
							New Password
						</label>
						<input
							type="password"
							id="password"
							name="password"
							bind:value={password}
							class="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors {passwordError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}"
							placeholder="Enter your new password"
							disabled={isLoading}
							onblur={() => {
								if (!password) passwordError = 'Password is required';
								else if (password.length < 8) passwordError = 'Password must be at least 8 characters';
								else passwordError = '';
							}}
						/>
						{#if passwordError}
							<p class="mt-1 text-sm text-red-600">{passwordError}</p>
						{/if}
					</div>

					<div>
						<label for="passwordConfirm" class="block text-sm font-medium text-gray-700 mb-2">
							Confirm New Password
						</label>
						<input
							type="password"
							id="passwordConfirm"
							name="passwordConfirm"
							bind:value={passwordConfirm}
							class="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors {passwordConfirmError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}"
							placeholder="Confirm your new password"
							disabled={isLoading}
							onblur={() => {
								if (!passwordConfirm) passwordConfirmError = 'Please confirm your password';
								else if (password !== passwordConfirm) passwordConfirmError = 'Passwords do not match';
								else passwordConfirmError = '';
							}}
						/>
						{#if passwordConfirmError}
							<p class="mt-1 text-sm text-red-600">{passwordConfirmError}</p>
						{/if}
					</div>

					<button
						type="submit"
						class="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
						disabled={isLoading}
						onclick={(e) => {
							if (!validateForm()) {
								e.preventDefault();
							}
						}}
					>
						{#if isLoading}
							<Loader size={16} class="animate-spin" />
							<span>Resetting Password...</span>
						{:else}
							Reset Password
						{/if}
					</button>
				</form>

				<div class="mt-6 text-center text-sm">
					<a href="/auth/login" class="text-blue-600 hover:text-blue-500 transition-colors">
						Back to Login
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>

 
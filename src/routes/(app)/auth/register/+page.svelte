<script lang="ts">
	import { enhance } from '$app/forms';
	import { authState } from '$lib/auth.js';
	import Loader from 'lucide-svelte/icons/loader';
	import { t, language } from '$lib/i18n.js';


	// Define the type for our form data
	type RegisterForm = {
		name?: string;
		email?: string;
		error?: string;
		success?: boolean;
	};

	let { form } = $props<{ form?: RegisterForm }>();

	// Destructure the auth state for reactivity
	const isRegistering = $derived($authState === 'loggingIn'); // Reuse login state
	let manualLoading = $state(false);

	// Form data - use server-returned values if available
	let name = $state(form?.name || '');
	let email = $state(form?.email || '');
	let password = $state(''); // Don't restore password for security reasons
	let confirmPassword = $state('');

	// Form validation
	let nameError = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let confirmPasswordError = $state('');

	// Validate form inputs
	function validateForm() {
		// Reset errors
		nameError = '';
		emailError = '';
		passwordError = '';
		confirmPasswordError = '';

		let isValid = true;

		// Name validation
		if (!name) {
			nameError = 'Name is required';
			isValid = false;
		} else if (name.length < 2) {
			nameError = 'Name must be at least 2 characters';
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
				Join thousands of tour guides growing their business with Zaur.
			</p>
		</div>

		{#if form?.error}
			<div class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
				<p class="text-sm text-red-600">{form.error}</p>
			</div>
		{/if}

		<div class="mt-8 bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
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
					const submittedName = formData.get('name') as string;
					const submittedEmail = formData.get('email') as string;

					return async ({ update }) => {
						await update({ reset: false }); // Prevent form reset to keep values
						// Update local values in case server returned different ones
						if (form?.name) name = form.name;
						else name = submittedName;
						
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
					<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
						Full Name
					</label>
					<input
						type="text"
						id="name"
						name="name"
						bind:value={name}
						class="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors {nameError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}"
						placeholder="Enter your full name"
						disabled={isRegistering || manualLoading}
						onblur={() => {
							if (!name) nameError = 'Name is required';
							else if (name.length < 2) nameError = 'Name must be at least 2 characters';
							else nameError = '';
						}}
					/>
					{#if nameError}
						<p class="mt-1 text-sm text-red-600">{nameError}</p>
					{/if}
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

 
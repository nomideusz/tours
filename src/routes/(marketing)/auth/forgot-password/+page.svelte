<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { goto } from '$app/navigation';
	import Loader from 'lucide-svelte/icons/loader';
	import { t, language } from '$lib/i18n.js';


	// Form state variables
	let email = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let success = $state('');

	// Handle form submission
	const handleSubmit: SubmitFunction = () => {
		isLoading = true;
		error = '';
		success = '';

		return async ({ result }) => {
			isLoading = false;

			if (result.type === 'failure') {
				error = result.data?.message || 'Failed to send password reset email';
			} else if (result.type === 'success') {
				success = t('forgotPassword.success', $language);
				email = ''; // Clear the form
			}
		};
	};

	function goToLogin() {
		goto('/auth/login');
	}

	// Form validation
	let emailError = $state('');

	function validateEmail() {
		if (!email) {
			emailError = t('forgotPassword.validation.emailRequired', $language);
			return false;
		} else if (!/^\S+@\S+\.\S+$/.test(email)) {
			emailError = t('forgotPassword.validation.emailInvalid', $language);
			return false;
		}
		emailError = '';
		return true;
	}
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center sm:px-6 lg:px-8 -mt-20">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="text-center">
			<h2 class="text-3xl font-bold text-gray-900 mb-2">
				{t('forgotPassword.title', $language)}
			</h2>
			<p class="text-sm text-gray-600">
				{t('forgotPassword.description', $language)}
			</p>
		</div>

		{#if error}
			<div class="alert-error rounded-lg p-3 mb-4">
				<p class="text-sm">{error}</p>
			</div>
		{/if}

		<div class="mt-8 bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
			{#if success}
				<div class="text-center">
					<div class="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
						<p class="text-sm text-green-600">{success}</p>
					</div>
					<button 
						class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors"
						onclick={goToLogin}
					>
						{t('forgotPassword.returnToLogin', $language)}
					</button>
				</div>
			{:else}
				<form method="POST" novalidate use:enhance={handleSubmit} class="space-y-6">
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
							{t('forgotPassword.emailLabel', $language)}
						</label>
						<input
							type="email"
							id="email"
							name="email"
							placeholder={t('forgotPassword.emailPlaceholder', $language)}
							value={email}
							oninput={(e) => (email = e.currentTarget.value)}
							onblur={() => validateEmail()}
							class="form-input {emailError ? 'error' : ''}"
							required
							disabled={isLoading}
						/>
						{#if emailError}
							<p class="form-error">{emailError}</p>
						{/if}
					</div>

					<button
						type="submit"
						class="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
						disabled={isLoading}
						onclick={(e) => {
							if (!validateEmail()) {
								e.preventDefault();
							}
						}}
					>
						{#if isLoading}
							<Loader size={16} class="animate-spin" />
							<span>{t('forgotPassword.sending', $language)}</span>
						{:else}
							{t('forgotPassword.sendButton', $language)}
						{/if}
					</button>
				</form>

				<div class="mt-6 text-center text-sm">
					<a href="/auth/login" class="text-blue-600 hover:text-blue-500 transition-colors">
						{t('forgotPassword.backToLogin', $language)}
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>

 
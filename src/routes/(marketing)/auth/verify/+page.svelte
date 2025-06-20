<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Loader from 'lucide-svelte/icons/loader';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';

	// Define the type for our form data
	type VerifyEmailForm = {
		message?: string;
		success?: boolean;
		error?: string;
		alreadyVerified?: boolean;
	};

	let { form } = $props<{ form?: VerifyEmailForm }>();

	// Get token from URL params
	let token = $derived(page.url.searchParams.get('token') || '');

	// Form state
	let isLoading = $state(false);
	let autoVerified = $state(false);

	// Auto-verify if we have a token in the URL
	let mounted = $state(false);

	// Auto-submit form when component mounts if we have a token
	function autoVerify() {
		if (token && !autoVerified && mounted) {
			autoVerified = true;
			// Trigger the form submission automatically
			const form = document.getElementById('verifyForm') as HTMLFormElement;
			if (form) {
				form.requestSubmit();
			}
		}
	}

	// Set mounted flag and try auto-verify
	$effect(() => {
		mounted = true;
		autoVerify();
	});

	function goToLogin() {
		goto('/auth/login');
	}

	function goToRegister() {
		goto('/auth/register');
	}

	function goToDashboard() {
		goto('/dashboard');
	}
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center sm:px-6 lg:px-8 -mt-20">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="text-center">
			<h2 class="text-3xl font-bold text-gray-900 mb-2">
				Email Verification
			</h2>
			<p class="text-sm text-gray-600">
				{#if !token}
					Verify your email address to activate your account.
				{:else if form?.success}
					Your email has been successfully verified!
				{:else if form?.message}
					There was an issue with verification.
				{:else}
					Verifying your email address...
				{/if}
			</p>
		</div>

		{#if form?.message && !form?.success}
			<div class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
				<div class="flex items-center">
					<XCircle class="h-5 w-5 text-red-400 mr-2" />
					<p class="text-sm text-red-600">{form.message}</p>
				</div>
			</div>
		{/if}

		{#if form?.error && !form?.success}
			<div class="mt-6 {form?.alreadyVerified ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4">
				<div class="flex items-center">
					{#if form?.alreadyVerified}
						<CheckCircle class="h-5 w-5 text-blue-400 mr-2" />
						<p class="text-sm text-blue-600">{form.error}</p>
					{:else}
						<XCircle class="h-5 w-5 text-red-400 mr-2" />
						<p class="text-sm text-red-600">{form.error}</p>
					{/if}
				</div>
			</div>
		{/if}

		<div class="mt-8 bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
			{#if !token}
				<!-- No token provided -->
				<div class="text-center">
					<div class="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
						<div class="flex items-center">
							<XCircle class="h-5 w-5 text-amber-400 mr-2" />
							<p class="text-sm text-amber-600">No verification token provided. Please check your email for the verification link.</p>
						</div>
					</div>
					<div class="space-y-3">
						<button 
							class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors"
							onclick={goToLogin}
						>
							Sign In
						</button>
						<button 
							class="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors"
							onclick={goToRegister}
						>
							Create New Account
						</button>
					</div>
				</div>
			{:else if form?.alreadyVerified}
				<!-- Already verified -->
				<div class="text-center">
					<div class="mb-6">
						<CheckCircle class="h-16 w-16 text-blue-500 mx-auto mb-4" />
						<h3 class="text-lg font-medium text-gray-900 mb-2">Already Verified</h3>
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
							<p class="text-sm text-blue-600">Your email address has already been verified.</p>
						</div>
					</div>
					<button 
						class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors"
						onclick={goToDashboard}
					>
						Continue to Dashboard
					</button>
				</div>
			{:else if form?.success}
				<!-- Verification successful -->
				<div class="text-center">
					<div class="mb-6">
						<CheckCircle class="h-16 w-16 text-green-500 mx-auto mb-4" />
						<h3 class="text-lg font-medium text-gray-900 mb-2">Email Verified Successfully!</h3>
						<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
							<p class="text-sm text-green-600">Your email address has been verified and your account is now active.</p>
						</div>
					</div>
					<button 
						class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer transition-colors"
						onclick={goToDashboard}
					>
						Go to Dashboard
					</button>
				</div>
			{:else}
				<!-- Verification in progress or form -->
				<form
					id="verifyForm"
					method="POST"
					action="?/verify"
					use:enhance={({ formData, cancel }) => {
						isLoading = true;

						return async ({ result, update }) => {
							// Let SvelteKit handle redirects automatically
							if (result.type === 'redirect') {
								// Don't call update() for redirects, let SvelteKit handle it
								return;
							}
							
							await update({ reset: false });
							isLoading = false;
						};
					}}
					class="text-center"
				>
					<!-- Hidden token field -->
					<input type="hidden" name="token" value={token} />

					{#if isLoading}
						<div class="mb-6">
							<Loader class="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
							<p class="text-sm text-gray-600">Verifying your email address...</p>
						</div>
					{:else}
						<div class="mb-6">
							<p class="text-sm text-gray-600 mb-4">
								Click the button below to verify your email address.
							</p>
							<button
								type="submit"
								class="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
								disabled={isLoading}
							>
								Verify Email Address
							</button>
						</div>
					{/if}
				</form>

				<div class="mt-6 text-center text-sm">
					<a href="/auth/login" class="text-blue-600 hover:text-blue-500 transition-colors">
						Back to Sign In
					</a>
				</div>
			{/if}
		</div>
	</div>
</div> 
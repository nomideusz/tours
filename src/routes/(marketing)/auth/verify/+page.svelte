<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Loader from 'lucide-svelte/icons/loader';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Shield from 'lucide-svelte/icons/shield';
	import Mail from 'lucide-svelte/icons/mail';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	// Define the type for our form data
	type VerifyEmailForm = {
		message?: string;
		success?: boolean;
		error?: string;
		alreadyVerified?: boolean;
		wrongAccount?: boolean;
		tokenEmail?: string;
		currentEmail?: string;
	};

	let { data, form } = $props<{ data: any, form?: VerifyEmailForm }>();

	// Get token from URL params
	let token = $derived(page.url.searchParams.get('token') || '');

	// Form state
	let isLoading = $state(false);
	let autoVerified = $state(false);

	// Check if there's a wrong account error from the initial load
	let hasWrongAccountError = $derived(
		data?.wrongAccount || form?.wrongAccount
	);

	// Auto-verify if we have a token in the URL and no wrong account error
	let mounted = $state(false);

	// Auto-submit form when component mounts if we have a token and no wrong account error
	function autoVerify() {
		if (token && !autoVerified && mounted && !hasWrongAccountError) {
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

	function goToLogout() {
		goto('/auth/logout');
	}
</script>

<div class="min-h-screen subtle-retro-section flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
	<div class="w-full max-w-lg relative z-10">
		<!-- Header -->
		<div class="text-center mb-6 sm:mb-8">
			<h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
				Email Verification
			</h2>
			<p class="text-gray-600 text-sm">
				{#if !token}
					Verify your email address to activate your account
				{:else if form?.success}
					Your email has been successfully verified!
				{:else if form?.message}
					There was an issue with verification
				{:else}
					We're verifying your email address
				{/if}
			</p>
		</div>

		<!-- Success Message -->
		{#if form?.success}
			<div class="bg-white border border-green-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
				<div class="text-center">
					<div class="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
						<CheckCircle class="w-6 h-6 text-green-600" />
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Email Verified!</h3>
					<p class="text-sm text-gray-600 mb-4">
						Your email address has been verified and your account is now active.
					</p>
					<button
						onclick={goToDashboard}
						class="button-coral button--full-width"
					>
						<Shield class="w-4 h-4 mr-2" />
						Go to Dashboard
					</button>
				</div>
			</div>
		{:else if form?.alreadyVerified || data?.alreadyVerified}
			<!-- Already verified -->
			<div class="bg-white border border-blue-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
				<div class="text-center">
					<div class="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
						<CheckCircle class="w-6 h-6 text-blue-600" />
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Already Verified</h3>
					<p class="text-sm text-gray-600 mb-4">
						Your email address has already been verified.
					</p>
					<button
						onclick={goToDashboard}
						class="button-coral button--full-width"
					>
						<Shield class="w-4 h-4 mr-2" />
						Go to Dashboard
					</button>
				</div>
			</div>
		{:else if data?.wrongAccount || form?.wrongAccount}
			<!-- Wrong account -->
			<div class="bg-white border border-orange-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
				<div class="text-center">
					<div class="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
						<AlertTriangle class="w-6 h-6 text-orange-600" />
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Wrong Account</h3>
					<div class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
						<p class="text-sm text-gray-700 mb-2">
							This verification is for: <strong class="text-orange-700">{data?.tokenEmail || form?.tokenEmail}</strong>
						</p>
						<p class="text-sm text-gray-700">
							You're currently logged in as: <strong class="text-orange-700">{data?.currentEmail || form?.currentEmail}</strong>
						</p>
					</div>
					<p class="text-sm text-gray-600 mb-6">
						To verify this email address, please log out first and click the verification link again.
					</p>
					<div class="space-y-3">
						<button
							type="button"
							onclick={goToLogout}
							class="w-full button-coral button--full-width"
						>
							<LogOut class="w-4 h-4 mr-2" />
							Log Out
						</button>
						<button
							onclick={goToDashboard}
							class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
						>
							<Shield class="w-4 h-4 mr-2" />
							Go to Dashboard
						</button>
					</div>
				</div>
			</div>
		{:else if form?.error || data?.error}
			<!-- Error Messages -->
			<div class="bg-white border border-red-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
				<div class="text-center">
					<div class="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
						<AlertCircle class="w-6 h-6 text-red-600" />
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Verification Failed</h3>
					<p class="text-sm text-gray-600 mb-4">
						{form?.error || data?.error}
					</p>
					<a href="/auth/login" class="inline-flex items-center gap-2 text-sm font-medium text-coral-600 hover:text-coral-500">
						<ArrowLeft class="w-4 h-4" />
						Back to sign in
					</a>
				</div>
			</div>
		{:else if !token}
			<!-- No token provided -->
			<div class="modern-card">
				<div class="text-center">
					<div class="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
						<Mail class="w-6 h-6 text-gray-600" />
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">No Verification Token</h3>
					<p class="text-sm text-gray-600 mb-6">
						Please check your email for the verification link.
					</p>
					<div class="space-y-3">
						<button 
							class="w-full button-coral button--full-width"
							onclick={goToLogin}
						>
							<ArrowLeft class="w-4 h-4 mr-2" />
							Back to Sign In
						</button>
						<button 
							class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
							onclick={goToRegister}
						>
							Create Account
						</button>
					</div>
				</div>
			</div>
		{:else}
			<!-- Verification Card -->
			<div class="modern-card">
				<div class="relative">
					{#if form?.message && !form?.success}
						<div class="bg-white border border-red-200 rounded-xl p-4 mb-4 sm:mb-6 shadow-sm">
							<div class="flex items-center gap-3">
								<div class="flex-shrink-0">
									<div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
										<AlertCircle class="w-4 h-4 text-red-600" />
									</div>
								</div>
								<p class="text-sm font-medium text-red-800">{form.message}</p>
							</div>
						</div>
					{/if}

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
								<div class="w-12 h-12 mx-auto bg-coral-100 rounded-full flex items-center justify-center mb-4">
									<Loader class="w-6 h-6 text-coral-600 animate-spin" />
								</div>
								<h3 class="text-lg font-semibold text-gray-900 mb-2">Verifying Email...</h3>
								<p class="text-sm text-gray-600">Please wait while we verify your email address</p>
							</div>
						{:else}
							<div class="mb-6">
								<div class="w-12 h-12 mx-auto bg-coral-100 rounded-full flex items-center justify-center mb-4">
									<Mail class="w-6 h-6 text-coral-600" />
								</div>
								<h3 class="text-lg font-semibold text-gray-900 mb-4">Ready to Verify</h3>
								<p class="text-sm text-gray-600 mb-6">
									Click below to verify your email address and activate your account.
								</p>
								<button
									type="submit"
									class="w-full button-coral button--full-width"
									disabled={isLoading}
								>
									<Mail class="w-4 h-4 mr-2" />
									Verify Email Address
								</button>
							</div>
						{/if}
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
	/* Subtle retro section with minimal color - matches other auth pages */
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
	
	/* Very subtle texture overlay - matches other auth pages */
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
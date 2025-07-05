<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Loader from 'lucide-svelte/icons/loader';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import LogOut from 'lucide-svelte/icons/log-out';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Compass from 'lucide-svelte/icons/compass';
	import Flag from 'lucide-svelte/icons/flag';
	import Shield from 'lucide-svelte/icons/shield';
	import Mail from 'lucide-svelte/icons/mail';

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

<div class="min-h-screen bg-gradient-to-br from-adventure-navy via-adventure-navy to-adventure-teal flex flex-col justify-center items-center sm:px-6 lg:px-8 pt-24 relative overflow-hidden">
	<!-- Adventure Background Pattern -->
	<div class="absolute inset-0 opacity-10">
		<div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse"></div>
		<div class="absolute top-10 left-10 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
		<div class="absolute top-20 right-20 w-2 h-2 bg-white rounded-full animate-pulse delay-1000"></div>
		<div class="absolute bottom-20 left-20 w-1 h-1 bg-white rounded-full animate-pulse delay-2000"></div>
		<div class="absolute bottom-10 right-10 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-500"></div>
		<div class="absolute top-1/2 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-1500"></div>
		<div class="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-3000"></div>
	</div>
	
	<!-- Journey Lines -->
	<div class="absolute inset-0 opacity-5">
		<div class="absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent transform -rotate-6"></div>
		<div class="absolute top-3/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent transform rotate-6"></div>
	</div>

	<div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
		<!-- Header -->
		<div class="text-center mb-8">
			<h2 class="text-3xl font-bold text-white mb-2">
				Email Verification
			</h2>
			<p class="text-white text-opacity-80 text-sm">
				{#if !token}
					Verify your email address to activate your account
				{:else if form?.success}
					Your email has been successfully verified!
				{:else if form?.message}
					There was an issue with verification
				{/if}
			</p>
		</div>

		<!-- Error Messages -->
		{#if form?.message && !form?.success}
			<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/50 border-2 border-red-300 rounded-xl p-4 mb-6 relative overflow-hidden">
				<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-500"></div>
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center">
							<XCircle class="w-4 h-4 text-white" />
						</div>
					</div>
					<p class="text-sm font-medium text-red-700">{form.message}</p>
				</div>
			</div>
		{/if}

		{#if form?.error || data?.error}
			<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/50 border-2 border-adventure-golden/20 rounded-xl p-4 mb-6 relative overflow-hidden">
				<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-adventure-golden to-adventure-sunset"></div>
				<div class="flex items-center gap-3">
					<div class="flex-shrink-0">
						<div class="w-8 h-8 rounded-full bg-gradient-to-br from-adventure-golden to-adventure-sunset flex items-center justify-center">
							{#if (form?.error || data?.error)?.includes('already verified')}
								<MapPin class="w-4 h-4 text-adventure-navy" />
							{:else}
								<XCircle class="w-4 h-4 text-adventure-navy" />
							{/if}
						</div>
					</div>
					<p class="text-sm font-medium text-adventure-navy">{form?.error || data?.error}</p>
				</div>
			</div>
		{/if}

		<!-- Adventure Verification Card -->
		<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/30 border-2 border-adventure-golden/20 rounded-xl p-8 relative overflow-hidden shadow-2xl">
			<!-- Card Pattern Overlay -->
			<div class="absolute inset-0 opacity-5">
				<div class="absolute inset-0 bg-gradient-to-br from-adventure-golden/10 to-transparent"></div>
				<div class="absolute top-4 left-4 w-6 h-6 border-2 border-adventure-golden/20 rounded-full"></div>
				<div class="absolute top-4 right-4 w-4 h-4 border-2 border-adventure-golden/20 rounded-full"></div>
				<div class="absolute bottom-4 left-4 w-4 h-4 border-2 border-adventure-golden/20 rounded-full"></div>
				<div class="absolute bottom-4 right-4 w-6 h-6 border-2 border-adventure-golden/20 rounded-full"></div>
			</div>
			
			<!-- Vintage Border -->
			<div class="absolute inset-0 rounded-xl border-2 border-adventure-golden/10 m-2"></div>
			
			<div class="relative z-10">
				{#if !token}
					<!-- No token provided -->
					<div class="text-center">
						<div class="mb-6 adventure-card bg-gradient-to-br from-white to-adventure-cream/50 border-2 border-red-300 rounded-xl p-6 relative overflow-hidden">
							<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-500"></div>
							<div class="flex items-center gap-3 mb-4">
								<div class="flex-shrink-0">
									<div class="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center">
										<Mail class="w-6 h-6 text-white" />
									</div>
								</div>
								<div class="text-left">
									<h3 class="text-lg font-semibold text-red-800">No Verification Token</h3>
									<p class="text-sm text-red-600">Missing verification link</p>
								</div>
							</div>
							<p class="text-sm text-red-700">Please check your email for the verification link.</p>
						</div>
						<div class="space-y-3">
							<button 
								class="w-full adventure-cta group relative overflow-hidden"
								onclick={goToLogin}
							>
								<div class="relative z-10 flex justify-center items-center gap-2 py-3 px-4 text-sm font-bold text-adventure-navy transition-all duration-200">
									<Compass size={16} />
									<span>Back to Sign In</span>
								</div>
							</button>
							<button 
								class="w-full px-4 py-3 rounded-lg border-2 border-adventure-earth/20 bg-white/80 text-adventure-navy hover:bg-adventure-earth/5 transition-all duration-200"
								onclick={goToRegister}
							>
								<span class="text-sm font-medium">Create Account</span>
							</button>
						</div>
					</div>
				{:else if data?.wrongAccount || form?.wrongAccount}
					<!-- Wrong account -->
					<div class="text-center">
						<div class="mb-6">
							<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-adventure-sunset to-adventure-golden mb-4">
								<AlertTriangle class="w-8 h-8 text-adventure-navy" />
							</div>
							<h3 class="text-lg font-semibold text-adventure-navy mb-4">Wrong Account</h3>
							<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/50 border-2 border-adventure-sunset/30 rounded-xl p-4 mb-4 relative overflow-hidden">
								<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-adventure-sunset to-adventure-golden"></div>
								<p class="text-sm text-adventure-navy mb-2">
									This verification is for: <strong class="text-adventure-teal">{data?.tokenEmail || form?.tokenEmail}</strong>
								</p>
								<p class="text-sm text-adventure-navy">
									You're currently logged in as: <strong class="text-adventure-teal">{data?.currentEmail || form?.currentEmail}</strong>
								</p>
							</div>
							<p class="text-sm text-adventure-earth/80 mb-6">
								To verify this email address, please log out first and click the verification link again.
							</p>
						</div>
						<div class="space-y-3">
							<button
								type="button"
								onclick={goToLogout}
								class="w-full button-coral button--full-width"
							>
								<LogOut size={16} class="mr-2" />
								<span>Log Out</span>
							</button>
							<button
								onclick={goToDashboard}
								class="w-full button-coral button--full-width"
							>
								<Compass size={16} class="mr-2" />
								<span>Go to Dashboard</span>
							</button>
						</div>
					</div>
				{:else if form?.alreadyVerified || data?.alreadyVerified}
					<!-- Already verified -->
					<div class="text-center">
						<div class="mb-6">
							<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-adventure-golden to-adventure-sunset mb-4">
								<CheckCircle class="w-8 h-8 text-adventure-navy" />
							</div>
							<h3 class="text-lg font-semibold text-adventure-navy mb-4">Already Verified</h3>
							<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/50 border-2 border-adventure-golden/20 rounded-xl p-4 mb-4 relative overflow-hidden">
								<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-adventure-golden to-adventure-sunset"></div>
								<p class="text-sm text-adventure-navy">Your email address has already been verified.</p>
							</div>
						</div>
						<button
							onclick={goToDashboard}
							class="w-full button-coral button--full-width"
						>
							<Compass size={16} class="mr-2" />
							<span>Go to Dashboard</span>
						</button>
					</div>
				{:else if form?.success}
					<!-- Verification successful -->
					<div class="text-center">
						<div class="mb-6">
							<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-adventure-golden to-adventure-sunset mb-4">
								<Shield class="w-8 h-8 text-adventure-navy" />
							</div>
							<h3 class="text-lg font-semibold text-adventure-navy mb-4">Email Verified!</h3>
							<div class="adventure-card bg-gradient-to-br from-white to-adventure-cream/50 border-2 border-adventure-golden/20 rounded-xl p-4 mb-4 relative overflow-hidden">
								<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-adventure-golden to-adventure-sunset"></div>
								<p class="text-sm text-adventure-navy">Your email address has been verified and your account is now active.</p>
							</div>
						</div>
						<button
							onclick={goToDashboard}
							class="w-full button-coral button--full-width"
						>
							<Compass size={16} class="mr-2" />
							<span>Go to Dashboard</span>
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
								<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-adventure-golden to-adventure-sunset mb-4">
									<Loader class="w-8 h-8 text-adventure-navy animate-spin" />
								</div>
								<h3 class="text-lg font-semibold text-adventure-navy mb-2">Verifying Email...</h3>
								<p class="text-sm text-adventure-earth/80">Please wait while we verify your email address</p>
							</div>
						{:else}
							<div class="mb-6">
								<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-adventure-golden to-adventure-sunset mb-4">
									<Flag class="w-8 h-8 text-adventure-navy" />
								</div>
								<h3 class="text-lg font-semibold text-adventure-navy mb-4">Ready to Verify</h3>
								<p class="text-sm text-adventure-earth/80 mb-6">
									Click below to verify your email address and activate your account.
								</p>
								<button
									type="submit"
									class="w-full button-coral button--full-width"
									disabled={isLoading}
								>
									<MapPin size={16} class="mr-2" />
									<span>Verify Email Address</span>
								</button>
							</div>
						{/if}
					</form>

					<!-- Navigation -->
					<div class="mt-8 text-center">
						<a href="/auth/login" class="text-coral-600 hover:text-coral-500 font-medium transition-colors duration-200 group">
							<span class="relative">
								Back to sign in
								<span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-coral-500 group-hover:w-full transition-all duration-200"></span>
							</span>
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* Ensure proper cursor behavior */
	.adventure-cta,
	.adventure-cta * {
		cursor: pointer !important;
	}
	
	.adventure-cta:disabled,
	.adventure-cta:disabled * {
		cursor: not-allowed !important;
	}
</style> 
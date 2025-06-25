<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Loader from 'lucide-svelte/icons/loader';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import LogOut from 'lucide-svelte/icons/log-out';

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

<style>
	.page-container {
		min-height: 100vh;
		background-color: var(--bg-secondary);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 0 var(--space-6);
		margin-top: -5rem;
	}

	.content-wrapper {
		width: 100%;
		max-width: 28rem;
		margin: 0 auto;
	}

	.page-header {
		text-align: center;
		margin-bottom: var(--space-8);
	}

	.page-title {
		font-size: var(--text-3xl);
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: var(--space-2);
	}

	.page-subtitle {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}

	.card {
		background: var(--bg-primary);
		padding: var(--space-8) var(--space-6);
		box-shadow: var(--shadow-lg);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-primary);
	}

	.icon-large {
		width: 4rem;
		height: 4rem;
		margin: 0 auto var(--space-4);
	}

	.icon-success {
		color: var(--color-success-500);
	}

	.icon-warning {
		color: var(--color-warning-500);
	}

	.icon-info {
		color: var(--color-info-500);
	}

	.section-title {
		font-size: var(--text-lg);
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: var(--space-2);
	}

	.section-text {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin-bottom: var(--space-4);
	}

	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.spinner {
		animation: spin 1s linear infinite;
		color: var(--color-primary-500);
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.back-link {
		margin-top: var(--space-6);
		text-align: center;
		font-size: var(--text-sm);
	}

	.back-link a {
		color: var(--color-primary-600);
		transition: color var(--transition-fast);
	}

	.back-link a:hover {
		color: var(--color-primary-500);
	}

	/* Override for specific alert styling */
	.alert-wrapper {
		margin-top: var(--space-6);
		margin-bottom: var(--space-4);
	}

	.alert-flex {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.alert-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
	}
</style>

<div class="page-container">
	<div class="content-wrapper">
		<div class="page-header">
			<h2 class="page-title">
				Email Verification
			</h2>
			<p class="page-subtitle">
				{#if !token}
					Verify your email address to activate your account.
				{:else if form?.success}
					Your email has been successfully verified!
				{:else if form?.message}
					There was an issue with verification.
				{/if}
			</p>
		</div>

		{#if form?.message && !form?.success}
			<div class="alert-wrapper">
				<div class="alert-error rounded-lg p-4">
					<div class="alert-flex">
						<XCircle class="alert-icon" />
						<p class="text-sm">{form.message}</p>
					</div>
				</div>
			</div>
		{/if}

		{#if form?.error || data?.error}
			<div class="alert-wrapper">
				{#if (form?.error || data?.error)?.includes('already verified')}
					<div class="alert-info rounded-lg p-3">
						<p class="text-sm">{form?.error || data?.error}</p>
					</div>
				{:else}
					<div class="alert-error rounded-lg p-3">
						<p class="text-sm">{form?.error || data?.error}</p>
					</div>
				{/if}
			</div>
		{/if}

		<div class="card">
			{#if !token}
				<!-- No token provided -->
				<div class="text-center">
					<div class="alert-warning rounded-lg p-4 mb-4">
						<div class="alert-flex">
							<XCircle class="alert-icon" />
							<p class="text-sm">No verification token provided. Please check your email for the verification link.</p>
						</div>
					</div>
					<div class="action-buttons">
						<button 
							class="button button-primary"
							onclick={goToLogin}
						>
							Sign In
						</button>
						<button 
							class="button button-secondary"
							onclick={goToRegister}
						>
							Create New Account
						</button>
					</div>
				</div>
			{:else if data?.wrongAccount || form?.wrongAccount}
				<!-- Wrong account -->
				<div class="text-center">
					<div class="mb-6">
						<AlertTriangle class="icon-large icon-warning" />
						<h3 class="section-title">Wrong Account</h3>
						<div class="alert-warning rounded-lg p-4 mb-4">
							<p class="text-sm mb-2">
								This verification link is for <strong>{data?.tokenEmail || form?.tokenEmail}</strong>
							</p>
							<p class="text-sm">
								You are currently logged in as <strong>{data?.currentEmail || form?.currentEmail}</strong>
							</p>
						</div>
						<p class="section-text">
							To verify this email, please log out first and then click the verification link again.
						</p>
					</div>
					<div class="action-buttons">
						<button 
							class="button button-warning"
							onclick={goToLogout}
						>
							<LogOut class="h-4 w-4" />
							Log Out
						</button>
						<button 
							class="button button-secondary"
							onclick={goToDashboard}
						>
							Go to Dashboard
						</button>
					</div>
				</div>
			{:else if form?.alreadyVerified || data?.alreadyVerified}
				<!-- Already verified -->
				<div class="text-center">
					<div class="mb-6">
						<CheckCircle class="icon-large icon-info" />
						<h3 class="section-title">Already Verified</h3>
						<div class="alert-info rounded-lg p-4 mb-4">
							<p class="text-sm">Your email address has already been verified.</p>
						</div>
					</div>
					<button 
						class="button button-primary w-full"
						onclick={goToDashboard}
					>
						Continue to Dashboard
					</button>
				</div>
			{:else if form?.success}
				<!-- Verification successful -->
				<div class="text-center">
					<div class="mb-6">
						<CheckCircle class="icon-large icon-success" />
						<h3 class="section-title">Email Verified Successfully!</h3>
						<div class="alert-success rounded-lg p-4 mb-4">
							<p class="text-sm">Your email address has been verified and your account is now active.</p>
						</div>
					</div>
					<button 
						class="button button-success w-full"
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
							<Loader class="icon-large spinner" />
							<p class="section-text">Verifying your email address...</p>
						</div>
					{:else}
						<div class="mb-6">
							<p class="section-text">
								Click the button below to verify your email address.
							</p>
							<button
								type="submit"
								class="button button-primary w-full"
								disabled={isLoading}
							>
								Verify Email Address
							</button>
						</div>
					{/if}
				</form>

				<div class="back-link">
					<a href="/auth/login">
						Back to Sign In
					</a>
				</div>
			{/if}
		</div>
	</div>
</div> 
<script lang="ts">
	import { enhance } from '$app/forms';
	import Loader from 'lucide-svelte/icons/loader';
	import Mail from 'lucide-svelte/icons/mail';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';

	// Define the type for our form data
	type ForgotPasswordForm = {
		success?: boolean;
		message?: string;
	};

	let { form } = $props<{ form?: ForgotPasswordForm }>();

	// Form state
	let email = $state('');
	let isLoading = $state(false);

	// Form validation
	let emailError = $state('');

	// Validate form inputs
	function validateForm() {
		emailError = '';
		let isValid = true;

		// Email validation
		if (!email) {
			emailError = 'Email is required';
			isValid = false;
		} else if (!/^\S+@\S+\.\S+$/.test(email)) {
			emailError = 'Please enter a valid email address';
			isValid = false;
		}

		return isValid;
	}
</script>

<div class="min-h-[calc(100vh-5rem)] sm:min-h-[calc(100vh-8.5rem)] subtle-retro-section flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
	<div class="w-full max-w-lg relative z-10">
		<!-- Header -->
		<div class="text-center mb-6 sm:mb-8">
			<h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
				Reset Password
			</h2>
			<p class="text-gray-600 text-sm">
				Enter your email address and we'll send you a reset link
			</p>
		</div>

		<!-- Success Message -->
		{#if form?.success}
			<div class="bg-white border border-green-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
				<div class="text-center">
					<div class="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
						<CheckCircle class="w-6 h-6 text-green-600" />
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
					<p class="text-sm text-gray-600 mb-4">
						We've sent a password reset link to your email address if an account exists.
					</p>
					<a href="/auth/login" class="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-500">
						<ArrowLeft class="w-4 h-4" />
						Back to sign in
					</a>
				</div>
			</div>
		{:else}
			<!-- Reset Password Card -->
			<div class="modern-card">
				<div class="relative">
					{#if form?.message}
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
									
									// Clear the email field on success for security
									if (form?.success) {
										email = '';
									}
								}
							};
						}}
						class="space-y-4 sm:space-y-5"
					>
						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
								Email Address
							</label>
							<input
								type="email"
								id="email"
								name="email"
								bind:value={email}
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary {emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}"
								placeholder="Enter your email address"
								disabled={isLoading}
								onblur={() => {
									if (!email) emailError = 'Email is required';
									else if (!/^\S+@\S+\.\S+$/.test(email)) emailError = 'Please enter a valid email address';
									else emailError = '';
								}}
							/>
							{#if emailError}
								<p class="mt-1 text-sm text-red-600">{emailError}</p>
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
								<span>Sending reset link...</span>
							{:else}
								<Mail size={16} class="mr-2" />
								<span>Send Reset Link</span>
							{/if}
						</button>
					</form>

					<!-- Navigation -->
					<div class="mt-6 text-center">
						<a href="/auth/login" class="inline-flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80">
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

 
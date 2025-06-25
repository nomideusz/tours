<script lang="ts">
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import { t, language } from '$lib/i18n.js';

	let email = $state('');
	let isSubmitting = $state(false);
	let submitted = $state(false);
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = '';

		try {
			const response = await fetch('/api/early-access', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email })
			});

			const data = await response.json();

			if (response.ok && data.success) {
				submitted = true;
			} else {
				error = data.error || 'Failed to submit request. Please try again.';
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Early Access - Zaur</title>
	<meta name="description" content="Join the Zaur early access program and lock in special pricing forever." />
</svelte:head>

<div class="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8" style="background: var(--background-primary);">
	<div class="sm:mx-auto sm:w-full sm:max-w-lg">
		{#if submitted}
			<!-- Success State -->
			<div class="text-center px-4">
				<div class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style="background: var(--color-success-100); color: var(--color-success-600);">
					<CheckCircle size={40} strokeWidth={1.5} />
				</div>
				<h1 class="text-3xl font-bold mb-4" style="color: var(--text-primary);">
					You're on the List! 🎉
				</h1>
				<p class="text-lg mb-8" style="color: var(--text-secondary);">
					We'll review your request and send you an early access code within 24 hours.
				</p>
				<div class="space-y-4">
					<a href="/auth/login" class="button-primary inline-flex items-center gap-2">
						Go to Login
						<ArrowRight size={18} strokeWidth={2} />
					</a>
					<p class="text-sm" style="color: var(--text-tertiary);">
						Already have a code? You can sign in right away.
					</p>
				</div>
			</div>
		{:else}
			<!-- Form State -->
			<div class="text-center mb-8 px-4">
				<div class="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style="background: var(--color-primary-100); color: var(--color-primary-600);">
					<Sparkles size={32} strokeWidth={1.5} />
				</div>
				<h1 class="text-3xl font-bold mb-3" style="color: var(--text-primary);">
					Join Early Access
				</h1>
				<p class="text-lg" style="color: var(--text-secondary);">
					Be among the first tour guides to use Zaur
				</p>
			</div>

			<div class="card px-6 py-8 sm:px-10">
				<form onsubmit={handleSubmit} class="space-y-6">
					{#if error}
						<div class="alert-error">
							{error}
						</div>
					{/if}

					<div>
						<label for="email" class="form-label">
							Work Email
						</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							class="form-input"
							placeholder="hello@yourtours.com"
							required
							disabled={isSubmitting}
						/>
						<p class="form-help">We'll send your early access code to this email</p>
					</div>

					<!-- Benefits Card -->
					<div class="rounded-lg p-4" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
						<h3 class="font-semibold mb-2 flex items-center gap-2" style="color: var(--color-warning-800);">
							<Sparkles size={16} strokeWidth={2} />
							Early Access Benefits
						</h3>
						<ul class="space-y-1.5 text-sm" style="color: var(--color-warning-700);">
							<li class="flex items-start gap-2">
								<span class="mt-0.5">•</span>
								<span>Lock in special pricing forever</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-0.5">•</span>
								<span>Direct access to founders</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-0.5">•</span>
								<span>Vote on new features</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="mt-0.5">•</span>
								<span>Priority support</span>
							</li>
						</ul>
					</div>

					<button
						type="submit"
						class="button-primary w-full relative"
						disabled={isSubmitting || !email}
					>
						{#if isSubmitting}
							<span class="opacity-0">Request Early Access</span>
							<span class="absolute inset-0 flex items-center justify-center">
								<span class="loader"></span>
							</span>
						{:else}
							Request Early Access
						{/if}
					</button>
				</form>

				<div class="mt-6 text-center">
					<p class="text-sm" style="color: var(--text-tertiary);">
						Already have a code? 
						<a href="/auth/register" class="link">
							Create your account
						</a>
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.loader {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style> 
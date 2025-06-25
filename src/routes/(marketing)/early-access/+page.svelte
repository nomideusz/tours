<script lang="ts">
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import { t, language } from '$lib/i18n.js';

	let email = $state('');
	let businessName = $state('');
	let message = $state('');
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
				body: JSON.stringify({ email, businessName, message })
			});

			if (response.ok) {
				submitted = true;
			} else {
				error = 'Failed to submit request. Please try again.';
			}
		} catch (err) {
			error = 'An error occurred. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center sm:px-6 lg:px-8 -mt-20">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="text-center">
			<h2 class="text-3xl font-bold text-gray-900 mb-2">
				{t('earlyAccessTitle', $language)}
			</h2>
			<div class="badge badge--warning mb-4">
				🚀 Early Access Program
			</div>
			<p class="text-sm text-gray-600">
				{t('earlyAccessSubtitle', $language)}
			</p>
		</div>

		<div class="mt-8 bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
			{#if submitted}
				<div class="text-center">
					<CheckCircle size={48} class="mx-auto text-green-600 mb-4" />
					<h3 class="text-lg font-semibold mb-2">Request Received!</h3>
					<p class="text-sm text-gray-600">
						We'll review your request and send you an early access code within 24 hours.
					</p>
					<a href="/auth/login" class="button-primary mt-6">
						Return to Login
					</a>
				</div>
			{:else}
				<form onsubmit={handleSubmit} class="space-y-6">
					{#if error}
						<div class="alert-error rounded-lg p-3">
							<p class="text-sm">{error}</p>
						</div>
					{/if}

					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
							{t('loginPage.email', $language)}
						</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							class="form-input"
							placeholder="tour@guide.com"
							required
							disabled={isSubmitting}
						/>
					</div>

					<div>
						<label for="businessName" class="block text-sm font-medium text-gray-700 mb-2">
							Business Name
						</label>
						<input
							type="text"
							id="businessName"
							bind:value={businessName}
							class="form-input"
							placeholder="Amazing City Tours"
							disabled={isSubmitting}
						/>
					</div>

					<div>
						<label for="message" class="block text-sm font-medium text-gray-700 mb-2">
							Tell us about your tour business (optional)
						</label>
						<textarea
							id="message"
							bind:value={message}
							class="form-input"
							rows="3"
							placeholder="Type of tours, number of guides, current challenges..."
							disabled={isSubmitting}
						></textarea>
					</div>

					<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
						<h4 class="text-sm font-semibold text-yellow-900 mb-2">🎁 Early Access Benefits:</h4>
						<ul class="text-sm text-yellow-800 space-y-1">
							<li>• Lock in special pricing forever</li>
							<li>• Priority support</li>
							<li>• Direct access to founders</li>
							<li>• Vote on new features</li>
						</ul>
					</div>

					<button
						type="submit"
						class="button-primary w-full"
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Submitting...' : 'Request Early Access'}
					</button>
				</form>
			{/if}

			<div class="mt-6 text-center text-sm">
				<a href="/auth/login" class="text-blue-600 hover:text-blue-500 transition-colors">
					Already have a code? Sign in
				</a>
			</div>
		</div>
	</div>
</div> 
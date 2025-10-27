<script lang="ts">
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';
	import { COUNTRY_LIST } from '$lib/utils/countries.js';

	let loading = $state(false);
	let error = $state<string | null>(null);
	let spotsRemaining = $state<number | null>(null);

	// Form data - minimal required fields
	let formData = $state({
		name: '',
		email: '',
		businessName: '',
		website: '',
		location: '',
		country: '',
		tourTypes: '',
		tourFrequency: 'Weekly',
		currentBookingMethod: 'Manual (Phone/WhatsApp)',
		biggestChallenge: 'Looking for better booking management',
		betaContribution: 'Active usage and feedback',
		yearsExperience: 2,
		teamSize: 1,
		interestedFeatures: [],
		availabilityForFeedback: true,
		referralSource: ''
	});

	// Convert country list to select options
	const countryOptions = COUNTRY_LIST.map(c => ({
		value: c.code,
		label: `${c.flag} ${c.name}`
	}));

	// Referral source options
	const referralSources = [
		{ value: 'Social Media', label: 'Social Media' },
		{ value: 'Search Engine', label: 'Search Engine' },
		{ value: 'Friend/Colleague', label: 'Friend/Colleague' },
		{ value: 'Blog/Article', label: 'Blog/Article' },
		{ value: 'Other', label: 'Other' }
	];

	// Fetch remaining spots
	$effect(() => {
		fetch('/api/beta-applications/stats')
			.then(res => res.json())
			.then(data => spotsRemaining = data.spotsRemaining ?? null)
			.catch(() => {});
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = null;

		try {
			const response = await fetch('/api/beta-applications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to submit application');
			}

			goto('/beta-2/apply/success');
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Apply for Beta 2 - Zaur</title>
	<meta name="description" content="Join Zaur Beta 2 - Get 4 months free + 20% off forever. Limited to 100 tour guides." />
</svelte:head>

<div class="min-h-screen py-8 sm:py-12" style="background: var(--bg-primary);" in:fade={{ duration: 300 }}>
	<div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="text-center mb-10">
			<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style="background: var(--color-primary-100); color: var(--color-primary-700);">
				<FlaskConical class="w-5 h-5" />
				<span class="font-semibold">Beta 2 Application</span>
			</div>

			<h1 class="text-4xl sm:text-5xl font-bold mb-4" style="color: var(--text-primary);">
				Join Beta 2
			</h1>
			<p class="text-xl mb-4" style="color: var(--text-secondary);">
				4 months free + 20% off forever
			</p>
			{#if spotsRemaining !== null}
				<div class="inline-flex items-center gap-2 px-4 py-2 rounded-lg" style="background: var(--color-warning-50); border: 1px solid var(--color-warning-200);">
					<span class="text-sm font-semibold" style="color: var(--color-warning-700);">
						Only {spotsRemaining} of 100 spots remaining
					</span>
				</div>
			{/if}
		</div>

		{#if error}
			<div class="alert-error mb-6">
				<AlertCircle class="w-5 h-5" />
				<p>{error}</p>
			</div>
		{/if}

		<!-- Application Form -->
		<form onsubmit={handleSubmit}>
			<div class="card mb-8" style="overflow: visible;">
				<h2 class="text-2xl font-semibold mb-6" style="color: var(--text-primary);">Application Details</h2>
				
				<div class="space-y-5">
					<!-- Personal Info -->
					<div class="grid sm:grid-cols-2 gap-4">
						<div>
							<label for="name" class="form-label">
								Your Name
							</label>
							<input
								type="text"
								id="name"
								bind:value={formData.name}
								required
								class="form-input"
								placeholder="John Doe"
							/>
						</div>

						<div>
							<label for="email" class="form-label">
								Email
							</label>
							<input
								type="email"
								id="email"
								bind:value={formData.email}
								required
								class="form-input"
								placeholder="john@example.com"
							/>
						</div>
					</div>

					<!-- Business Info (Optional) -->
					<div class="grid sm:grid-cols-2 gap-4">
						<div>
							<label for="businessName" class="form-label">
								Business Name <span class="text-xs" style="color: var(--text-tertiary);">(optional)</span>
							</label>
							<input
								type="text"
								id="businessName"
								bind:value={formData.businessName}
								class="form-input"
								placeholder="Your Tour Company"
							/>
						</div>

						<div>
							<label for="website" class="form-label">
								Website <span class="text-xs" style="color: var(--text-tertiary);">(optional)</span>
							</label>
							<input
								type="url"
								id="website"
								bind:value={formData.website}
								class="form-input"
								placeholder="https://yoursite.com"
							/>
						</div>
					</div>

					<!-- Location -->
					<div class="grid sm:grid-cols-2 gap-4">
						<div>
							<label for="location" class="form-label">
								City
							</label>
							<input
								type="text"
								id="location"
								bind:value={formData.location}
								required
								class="form-input"
								placeholder="Paris"
							/>
						</div>

						<div style="position: relative; z-index: 110;">
							<label for="country" class="form-label">
								Country
							</label>
							<CustomSelect
								bind:value={formData.country}
								options={countryOptions}
								placeholder="Select country..."
								class="w-full form-input-height"
							/>
						</div>
					</div>

					<!-- Tours -->
					<div>
						<label for="tourTypes" class="form-label">
							What tours do you offer?
						</label>
						<textarea
							id="tourTypes"
							bind:value={formData.tourTypes}
							required
							rows="3"
							class="form-input"
							placeholder="E.g., City walking tours, Food & wine experiences, Historical tours..."
						></textarea>
					</div>

					<!-- Referral Source -->
					<div style="position: relative; z-index: 100;">
						<label for="referralSource" class="form-label">
							How did you find us?
						</label>
						<CustomSelect
							bind:value={formData.referralSource}
							options={referralSources}
							placeholder="Select..."
							class="w-full form-input-height"
						/>
					</div>

					<!-- Benefits inside card -->
					<div class="mt-6 p-4 rounded-lg" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
						<div class="grid grid-cols-2 gap-2 text-sm">
							<div class="flex items-center gap-1.5">
								<CheckCircle class="w-4 h-4" style="color: var(--color-success-600);" />
								<span style="color: var(--color-success-800);">4 months free</span>
							</div>
							<div class="flex items-center gap-1.5">
								<CheckCircle class="w-4 h-4" style="color: var(--color-success-600);" />
								<span style="color: var(--color-success-800);">20% off forever</span>
							</div>
						</div>
					</div>

					<!-- Submit inside card -->
					<div class="mt-6">
						<button
							type="submit"
							disabled={loading}
							class="button-primary button--full-width"
						>
							{#if loading}
								<Loader2 class="w-5 h-5 animate-spin inline mr-2" />
								Submitting...
							{:else}
								<Sparkles class="w-5 h-5 inline mr-2" />
								Join Beta 2
							{/if}
						</button>

						<p class="text-center text-xs mt-4" style="color: var(--text-tertiary);">
							By applying, you agree to our <a href="/terms" class="underline">Terms</a>
						</p>
					</div>
				</div>
			</div>
		</form>
	</div>
</div>

<style>
	/* Make CustomSelect match form-input height */
	:global(.form-input-height .select-button) {
		min-height: 2.75rem;
		padding: 0.75rem 1rem;
	}
</style>


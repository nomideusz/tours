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

	// Validation errors
	let validationErrors = $state<Record<string, string>>({});

	// Validate individual field
	function validateField(field: string, value: any): string | null {
		switch (field) {
			case 'name':
				if (!value || value.trim().length < 2) {
					return 'Name must be at least 2 characters';
				}
				if (value.length > 100) {
					return 'Name must be less than 100 characters';
				}
				break;
			case 'email':
				if (!value) {
					return 'Email is required';
				}
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(value)) {
					return 'Please enter a valid email address';
				}
				break;
			case 'website':
				if (value && value.trim()) {
					try {
						new URL(value);
					} catch {
						return 'Please enter a valid URL (e.g., https://example.com)';
					}
				}
				break;
			case 'location':
				if (!value || value.trim().length < 2) {
					return 'City is required';
				}
				break;
			case 'country':
				if (!value) {
					return 'Country is required';
				}
				break;
			case 'tourTypes':
				if (!value || value.trim().length < 10) {
					return 'Please provide at least a brief description of your tours';
				}
				break;
		}
		return null;
	}

	// Validate on blur
	function handleBlur(field: string) {
		const error = validateField(field, formData[field as keyof typeof formData]);
		if (error) {
			validationErrors[field] = error;
		} else {
			delete validationErrors[field];
		}
		validationErrors = { ...validationErrors };
	}

	// Validate country when it changes (for CustomSelect)
	$effect(() => {
		if (formData.country && validationErrors.country) {
			handleBlur('country');
		}
	});

	// Website URL formatting
	function formatWebsiteUrl(value: string): string {
		if (!value) return '';
		value = value.trim();
		
		// Add https:// if no protocol is specified
		if (value && !value.match(/^https?:\/\//)) {
			return `https://${value}`;
		}
		
		return value;
	}

	// Handle website blur - format and validate
	function handleWebsiteBlur() {
		if (formData.website) {
			formData.website = formatWebsiteUrl(formData.website);
		}
		handleBlur('website');
	}

	// Validate all required fields
	function validateForm(): boolean {
		const errors: Record<string, string> = {};
		
		// Validate required fields
		const requiredFields = ['name', 'email', 'location', 'country', 'tourTypes'];
		for (const field of requiredFields) {
			const error = validateField(field, formData[field as keyof typeof formData]);
			if (error) {
				errors[field] = error;
			}
		}

		// Validate optional fields that have values
		if (formData.website) {
			const error = validateField('website', formData.website);
			if (error) errors.website = error;
		}

		validationErrors = errors;
		return Object.keys(errors).length === 0;
	}

	// Convert country list to select options
	const countryOptions = COUNTRY_LIST.map(c => ({
		value: c.code,
		label: `${c.flag} ${c.name}`
	}));

	// Tour frequency options
	const tourFrequencyOptions = [
		{ value: 'Daily', label: 'Daily' },
		{ value: 'Weekly', label: 'Weekly' },
		{ value: 'Monthly', label: 'Monthly' },
		{ value: 'Seasonal', label: 'Seasonal' },
		{ value: 'Occasional', label: 'Occasional' }
	];

	// Booking method options
	const bookingMethodOptions = [
		{ value: 'Manual (Phone/WhatsApp)', label: 'Manual (Phone/WhatsApp)' },
		{ value: 'Email', label: 'Email' },
		{ value: 'Website Form', label: 'Website Form' },
		{ value: 'Booking Platform', label: 'Booking Platform (GetYourGuide, Viator, etc.)' },
		{ value: 'Social Media', label: 'Social Media' },
		{ value: 'Other', label: 'Other' }
	];

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
		
		// Clear any previous errors
		error = null;

		// Validate form
		if (!validateForm()) {
			error = 'Please fix the errors above before submitting';
			// Scroll to first error
			const firstErrorField = Object.keys(validationErrors)[0];
			if (firstErrorField) {
				const element = document.getElementById(firstErrorField);
				element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				element?.focus();
			}
			return;
		}

		loading = true;

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

<div class="apply-page" style="background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);" in:fade={{ duration: 300 }}>
	<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-16 py-8 sm:py-20">
		
		<!-- Section Divider -->
		<hr class="section-divider" aria-hidden="true" />
		
		<!-- Header -->
		<div class="apply-header">
			<div class="beta-badge">
				<FlaskConical class="w-4 h-4" />
				<span>Beta 2 Application</span>
			</div>

			<h1 class="apply-title">
				Join Beta 2
			</h1>
			<p class="apply-subtitle">
				Get 4 months free + 20% lifetime discount
			</p>
			
			{#if spotsRemaining !== null}
				<div class="spots-badge">
					<Sparkles class="w-4 h-4" />
					<span>Only {spotsRemaining} of 100 spots remaining</span>
				</div>
			{/if}
		</div>

		{#if error}
			<div class="error-alert">
				<AlertCircle class="w-5 h-5" />
				<p>{error}</p>
			</div>
		{/if}

		<!-- Application Form -->
		<form onsubmit={handleSubmit} class="apply-form">
			<div class="form-card">
				<h2 class="form-card-title">Application Details</h2>
				
				<div class="space-y-5">
					<!-- Personal Info -->
					<div class="grid md:grid-cols-2 gap-4 lg:gap-6">
						<div>
							<label for="name" class="form-label">
								Your Name <span style="color: var(--color-danger-600);">*</span>
							</label>
							<input
								type="text"
								id="name"
								bind:value={formData.name}
								onblur={() => handleBlur('name')}
								class="form-input"
								class:input-error={validationErrors.name}
								placeholder="John Doe"
							/>
							{#if validationErrors.name}
								<p class="validation-error">{validationErrors.name}</p>
							{/if}
						</div>

						<div>
							<label for="email" class="form-label">
								Email <span style="color: var(--color-danger-600);">*</span>
							</label>
							<input
								type="email"
								id="email"
								bind:value={formData.email}
								onblur={() => handleBlur('email')}
								class="form-input"
								class:input-error={validationErrors.email}
								placeholder="john@example.com"
							/>
							{#if validationErrors.email}
								<p class="validation-error">{validationErrors.email}</p>
							{/if}
						</div>
					</div>

					<!-- Business Info (Optional) -->
					<div class="grid md:grid-cols-2 gap-4 lg:gap-6">
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
								onblur={handleWebsiteBlur}
								class="form-input"
								class:input-error={validationErrors.website}
								placeholder="yoursite.com"
							/>
							{#if validationErrors.website}
								<p class="validation-error">{validationErrors.website}</p>
							{/if}
						</div>
					</div>

					<!-- Location -->
					<div class="grid md:grid-cols-2 gap-4 lg:gap-6">
						<div>
							<label for="location" class="form-label">
								City <span style="color: var(--color-danger-600);">*</span>
							</label>
							<input
								type="text"
								id="location"
								bind:value={formData.location}
								onblur={() => handleBlur('location')}
								class="form-input"
								class:input-error={validationErrors.location}
								placeholder="Paris"
							/>
							{#if validationErrors.location}
								<p class="validation-error">{validationErrors.location}</p>
							{/if}
						</div>

						<div style="position: relative; z-index: 110;">
							<label for="country" class="form-label">
								Country <span style="color: var(--color-danger-600);">*</span>
							</label>
							<CustomSelect
								bind:value={formData.country}
								options={countryOptions}
								placeholder="Select country..."
								searchable={true}
								searchPlaceholder="Search countries..."
								class="w-full form-input-height {validationErrors.country ? 'input-error' : ''}"
							/>
							{#if validationErrors.country}
								<p class="validation-error">{validationErrors.country}</p>
							{/if}
						</div>
					</div>

					<!-- Tours -->
					<div>
						<label for="tourTypes" class="form-label">
							What tours do you offer? <span style="color: var(--color-danger-600);">*</span>
						</label>
						<textarea
							id="tourTypes"
							bind:value={formData.tourTypes}
							onblur={() => handleBlur('tourTypes')}
							rows="3"
							class="form-input"
							class:input-error={validationErrors.tourTypes}
							placeholder="E.g., City walking tours, Food & wine experiences, Historical tours..."
						></textarea>
						{#if validationErrors.tourTypes}
							<p class="validation-error">{validationErrors.tourTypes}</p>
						{/if}
					</div>

					<!-- Optional Fields -->
					<div class="grid md:grid-cols-3 gap-4 lg:gap-6">
						<div>
							<label for="yearsExperience" class="form-label">
								Years of Experience <span class="text-xs" style="color: var(--text-tertiary);">(optional)</span>
							</label>
							<input
								type="number"
								id="yearsExperience"
								bind:value={formData.yearsExperience}
								min="0"
								max="50"
								class="form-input"
								placeholder="2"
							/>
						</div>

						<div>
							<label for="teamSize" class="form-label">
								Team Size <span class="text-xs" style="color: var(--text-tertiary);">(optional)</span>
							</label>
							<input
								type="number"
								id="teamSize"
								bind:value={formData.teamSize}
								min="1"
								max="100"
								class="form-input"
								placeholder="1"
							/>
						</div>

						<div style="position: relative; z-index: 105;">
							<label for="tourFrequency" class="form-label">
								Tour Frequency <span class="text-xs" style="color: var(--text-tertiary);">(optional)</span>
							</label>
							<CustomSelect
								bind:value={formData.tourFrequency}
								options={tourFrequencyOptions}
								placeholder="Select frequency..."
								class="w-full form-input-height"
							/>
						</div>
					</div>

					<div class="grid md:grid-cols-2 gap-4 lg:gap-6">
						<div style="position: relative; z-index: 104;">
							<label for="currentBookingMethod" class="form-label">
								Current Booking Method <span class="text-xs" style="color: var(--text-tertiary);">(optional)</span>
							</label>
							<CustomSelect
								bind:value={formData.currentBookingMethod}
								options={bookingMethodOptions}
								placeholder="Select method..."
								class="w-full form-input-height"
							/>
						</div>

						<div style="position: relative; z-index: 103;">
							<label for="referralSource" class="form-label">
								How did you find us? <span class="text-xs" style="color: var(--text-tertiary);">(optional)</span>
							</label>
							<CustomSelect
								bind:value={formData.referralSource}
								options={referralSources}
								placeholder="Select..."
								class="w-full form-input-height"
							/>
						</div>
					</div>

					<div>
						<label for="biggestChallenge" class="form-label">
							Biggest Challenge <span class="text-xs" style="color: var(--text-tertiary);">(optional)</span>
						</label>
						<textarea
							id="biggestChallenge"
							bind:value={formData.biggestChallenge}
							rows="3"
							class="form-input"
							placeholder="What's your biggest challenge with managing tours and bookings?"
						></textarea>
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
								Apply Now
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
	/* Apply Page */
	.apply-page {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
		padding-bottom: 3rem;
	}
	
	/* Section Divider */
	.section-divider {
		border: none;
		max-width: 14rem;
		height: 8px;
		background: transparent;
		margin: 0 auto 4rem;
		position: relative;
		display: flex;
		align-items: center;
		overflow: visible;
	}
	
	.section-divider::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--border-secondary) 50%,
			transparent 100%
		);
	}
	
	.section-divider::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 8px;
		height: 8px;
		background: var(--primary);
		border-radius: 50%;
		opacity: 0.6;
		z-index: 1;
		box-shadow: 0 0 0 2px var(--bg-primary);
	}
	
	/* Apply Header */
	.apply-header {
		text-align: center;
		margin-bottom: 3rem;
		max-width: 48rem;
		margin-left: auto;
		margin-right: auto;
	}
	
	.beta-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1.25rem;
		background: var(--color-accent-100);
		color: var(--color-accent-700);
		border: 1px solid var(--color-accent-300);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		margin-bottom: 1.5rem;
		text-transform: uppercase;
		box-shadow: 0 2px 8px rgba(var(--color-accent-600-rgb), 0.2);
		transition: all var(--transition-base);
	}
	
	.beta-badge:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(var(--color-accent-600-rgb), 0.3);
		border-color: var(--color-accent-600);
		background: var(--color-accent-200);
	}
	
	.apply-title {
		font-size: 3rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1rem;
		line-height: 1.2;
		letter-spacing: -0.025em;
	}
	
	.apply-subtitle {
		font-size: 1.25rem;
		color: var(--text-secondary);
		line-height: 1.6;
		letter-spacing: -0.01em;
		margin-bottom: 1.5rem;
	}
	
	.spots-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: var(--color-primary-50);
		color: var(--color-primary-700);
		border: 1px solid var(--color-primary-200);
		border-radius: var(--radius-lg);
		font-size: 0.875rem;
		font-weight: 600;
		box-shadow: 0 2px 8px rgba(var(--color-primary-600-rgb), 0.15);
	}
	
	/* Form Card */
	.apply-form {
		max-width: 48rem;
		margin: 0 auto;
	}
	
	.form-card {
		background: var(--bg-secondary);
		border: 2px solid var(--border-primary);
		border-radius: var(--radius-xl);
		padding: 2.5rem;
		box-shadow: var(--shadow-lg);
		overflow: visible;
	}
	
	.form-card-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 2rem;
		letter-spacing: -0.02em;
	}
	
	/* Error Alert */
	.error-alert {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		background: var(--color-danger-50);
		color: var(--color-danger-700);
		border: 2px solid var(--color-danger-200);
		border-radius: var(--radius-lg);
		margin-bottom: 2rem;
		font-size: 0.9375rem;
		font-weight: 500;
		box-shadow: 0 2px 8px rgba(var(--color-danger-500-rgb), 0.1);
	}
	
	.error-alert :global(svg) {
		flex-shrink: 0;
		color: var(--color-danger-600);
	}
	
	/* Make CustomSelect match form-input height */
	:global(.form-input-height .select-button) {
		min-height: 2.75rem;
		padding: 0.75rem 1rem;
	}

	/* Validation error styles */
	.validation-error {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-danger-600);
	}

	.input-error {
		border-color: var(--color-danger-500) !important;
		background-color: var(--color-danger-50) !important;
	}

	.input-error:focus {
		outline-color: var(--color-danger-500) !important;
		border-color: var(--color-danger-500) !important;
	}

	:global(.input-error .select-button) {
		border-color: var(--color-danger-500) !important;
		background-color: var(--color-danger-50) !important;
	}
	
	/* Mobile Responsive */
	@media (max-width: 768px) {
		.section-divider {
			margin: 0 auto 3rem;
			max-width: 10rem;
		}
		
		.apply-header {
			margin-bottom: 2rem;
		}
		
		.apply-title {
			font-size: 2rem;
			line-height: 1.15;
		}
		
		.apply-subtitle {
			font-size: 1.0625rem;
		}
		
		.form-card {
			padding: 1.75rem;
			border-radius: var(--radius-lg);
		}
		
		.form-card-title {
			font-size: 1.5rem;
			margin-bottom: 1.5rem;
		}
	}

	/* Narrow smartphones optimization */
	@media (max-width: 480px) {
		.section-divider {
			margin: 0 auto 2.5rem;
			max-width: 8rem;
		}
		
		.apply-title {
			font-size: 1.75rem !important;
		}
		
		.apply-subtitle {
			font-size: 1rem;
		}
		
		.form-card {
			padding: 1.5rem;
			border-radius: var(--radius-md);
		}

		.form-card-title {
			font-size: 1.375rem !important;
			margin-bottom: 1.25rem;
		}

		.form-input,
		.form-label,
		:global(.select-button) {
			font-size: 0.9375rem !important;
		}

		/* Better spacing for narrow screens */
		.space-y-5 {
			gap: 1rem !important;
		}

		/* Make grids single column on very narrow screens */
		.grid {
			grid-template-columns: 1fr !important;
		}

		/* Adjust validation errors */
		.validation-error {
			font-size: 0.8125rem;
		}
	}
</style>


<script lang="ts">
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	
	// Components
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MobilePageHeader from '$lib/components/MobilePageHeader.svelte';
	import PageContainer from '$lib/components/PageContainer.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	
	// Icons
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Loader from 'lucide-svelte/icons/loader';
	import User from 'lucide-svelte/icons/user';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Send from 'lucide-svelte/icons/send';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	
	// Form state
	let isSubmitting = $state(false);
	let error = $state('');
	let success = $state(false);
	
	// Simplified form data - removed unnecessary fields
	let formData = $state({
		// Basic info
		name: '',
		email: '',
		businessName: '',
		location: '', // City, Country format
		
		// Essential screening questions only
		tourTypes: '',
		tourVolume: '', // Simplified from frequency
		biggestChallenge: '',
		
		// Optional
		website: ''
	});
	
	// Simplified tour volume options
	const tourVolumeOptions = [
		{ value: 'starting', label: 'Just starting out' },
		{ value: 'part-time', label: 'Part-time (1-10 tours/week)' },
		{ value: 'full-time', label: 'Full-time (10+ tours/week)' },
		{ value: 'team', label: 'Team operation' }
	];
	
	// Example countries for quick selection (not limiting - all countries accepted)
	const exampleCountries = [
		{ code: 'US', name: 'United States', flag: '🇺🇸' },
		{ code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
		{ code: 'ES', name: 'Spain', flag: '🇪🇸' },
		{ code: 'FR', name: 'France', flag: '🇫🇷' },
		{ code: 'IT', name: 'Italy', flag: '🇮🇹' },
		{ code: 'DE', name: 'Germany', flag: '🇩🇪' }
	];
	
	// Common country name to code mappings
	const countryMappings: Record<string, string> = {
		// Common full names
		'united states': 'US', 'usa': 'US', 'america': 'US', 'united states of america': 'US',
		'united kingdom': 'GB', 'uk': 'GB', 'great britain': 'GB', 'england': 'GB',
		'spain': 'ES', 'españa': 'ES',
		'france': 'FR',
		'italy': 'IT', 'italia': 'IT',
		'germany': 'DE', 'deutschland': 'DE',
		'portugal': 'PT',
		'netherlands': 'NL', 'holland': 'NL',
		'belgium': 'BE',
		'switzerland': 'CH',
		'austria': 'AT',
		'poland': 'PL', 'polska': 'PL',
		'czech republic': 'CZ', 'czechia': 'CZ',
		'greece': 'GR',
		'turkey': 'TR',
		'mexico': 'MX', 'méxico': 'MX',
		'canada': 'CA',
		'brazil': 'BR', 'brasil': 'BR',
		'argentina': 'AR',
		'australia': 'AU',
		'new zealand': 'NZ',
		'japan': 'JP',
		'china': 'CN',
		'india': 'IN',
		'thailand': 'TH',
		'vietnam': 'VN',
		'indonesia': 'ID',
		'malaysia': 'MY',
		'singapore': 'SG',
		'south korea': 'KR', 'korea': 'KR',
		'egypt': 'EG',
		'morocco': 'MA',
		'south africa': 'ZA',
		'israel': 'IL',
		'uae': 'AE', 'united arab emirates': 'AE', 'dubai': 'AE',
		'norway': 'NO',
		'sweden': 'SE',
		'denmark': 'DK',
		'finland': 'FI',
		'ireland': 'IE',
		'scotland': 'GB',
		'wales': 'GB'
	};
	
	// Helper function to get country code
	function getCountryCode(input: string): string {
		if (!input) return 'XX'; // Default fallback
		
		// If it's already a 2-letter code, return it
		if (input.length === 2 && /^[A-Z]{2}$/i.test(input)) {
			return input.toUpperCase();
		}
		
		// Try to find in mappings
		const normalized = input.toLowerCase().trim();
		const code = countryMappings[normalized];
		if (code) return code;
		
		// If not found, use first 2 letters as fallback
		return input.substring(0, 2).toUpperCase();
	}
	
	// Validation state
	let touchedFields = $state<Set<string>>(new Set());
	let validationErrors = $state<{ field: string; message: string }[]>([]);
	
	// Error element reference for scrolling
	let errorElement = $state<HTMLElement>();
	
	// Scroll to error when it appears
	$effect(() => {
		if (error && errorElement && browser) {
			setTimeout(() => {
				errorElement?.scrollIntoView({ 
					behavior: 'smooth', 
					block: 'center' 
				});
			}, 100);
		}
	});
	
	// Location suggestion helper
	function handleLocationInput(value: string) {
		formData.location = value;
		// Auto-format common inputs
		if (value && !value.includes(',')) {
			// Suggest adding country after city
			// This is just a UX hint, not enforced
		}
	}
	
	// Field validation functions
	function validateField(field: string, value: any): string | null {
		switch (field) {
			case 'name':
				return !value || value.trim() === '' ? 'Your name is required' : null;
			case 'email':
				if (!value || value.trim() === '') return 'Email address is required';
				
				const email = value.trim().toLowerCase();
				
				// More comprehensive email validation
				const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
				
				if (!emailRegex.test(email)) {
					return 'Please enter a valid email address';
				}
				
				// Additional checks for common mistakes
				if (email.includes('..')) {
					return 'Email cannot contain consecutive dots';
				}
				
				if (email.startsWith('.') || email.endsWith('.')) {
					return 'Email cannot start or end with a dot';
				}
				
				if (email.includes('@.') || email.includes('.@')) {
					return 'Invalid email format around @ symbol';
				}
				
				return null;
			case 'location':
				return !value || value.trim() === '' ? 'City and country are required' : null;
			case 'tourTypes':
				return !value || value.trim() === '' ? 'Please describe your tours' : null;
			case 'tourVolume':
				return !value || value.trim() === '' ? 'Please select your tour volume' : null;
			case 'biggestChallenge':
				return !value || value.trim() === '' ? 'Please share your main challenge' : null;
			default:
				return null;
		}
	}
	
	// Handle field blur for validation
	function handleFieldBlur(field: string, value: any) {
		// Create new Set for reactivity
		touchedFields = new Set([...touchedFields, field]);
		
		const errorMessage = validateField(field, value);
		validationErrors = validationErrors.filter(e => e.field !== field);
		
		if (errorMessage) {
			validationErrors = [...validationErrors, { field, message: errorMessage }];
		}
	}
	
	// Get field error
	function getFieldError(field: string): string | null {
		if (!touchedFields.has(field)) return null;
		return validationErrors.find(e => e.field === field)?.message || null;
	}
	
	// Has field error
	function hasFieldError(field: string): boolean {
		return touchedFields.has(field) && validationErrors.some(e => e.field === field);
	}
	
	// Form validation
	function validateForm(): boolean {
		const requiredFields = [
			'name', 'email', 'location', 
			'tourTypes', 'tourVolume', 'biggestChallenge'
		];
		
		// Mark all fields as touched (create new Set for reactivity)
		touchedFields = new Set([...touchedFields, ...requiredFields]);
		
		// Clear existing errors
		validationErrors = [];
		
		// Validate all fields
		let hasErrors = false;
		requiredFields.forEach(field => {
			const value = formData[field as keyof typeof formData];
			const errorMessage = validateField(field, value);
			if (errorMessage) {
				validationErrors = [...validationErrors, { field, message: errorMessage }];
				hasErrors = true;
			}
		});
		
		return !hasErrors;
	}
	
	// Calculate form completion percentage
	let formCompletion = $derived.by(() => {
		const fields = [
			formData.name,
			formData.email,
			formData.location,
			formData.tourTypes,
			formData.tourVolume,
			formData.biggestChallenge
		];
		
		const completed = fields.filter(field => field && field.toString().trim() !== '').length;
		const total = fields.length;
		const percentage = Math.round((completed / total) * 100);
		
		return {
			completed,
			total,
			percentage,
			isComplete: percentage === 100
		};
	});
	
	// Handle form submission
	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		// Clear any previous general error
		error = '';
		
		if (!validateForm()) {
			// Don't show generic error if we have specific field errors
			if (validationErrors.length === 0) {
				error = 'Please complete all required fields';
			} else {
				// Clear generic error, let field-specific errors show
				error = '';
				
				// Scroll to first error field for better UX
				setTimeout(() => {
					const firstErrorField = validationErrors[0]?.field;
					if (firstErrorField) {
						const element = document.getElementById(firstErrorField);
						if (element) {
							element.scrollIntoView({ behavior: 'smooth', block: 'center' });
							element.focus();
						}
					}
				}, 100);
			}
			return;
		}
		
		error = '';
		isSubmitting = true;
		
		try {
			// Extract city and country from location
			const locationParts = formData.location.split(',').map(p => p.trim()).filter(p => p);
			let country = '';
			let city = '';
			
			if (locationParts.length >= 2) {
				// Format: "City, Country"
				city = locationParts[0];
				country = getCountryCode(locationParts[locationParts.length - 1]);
			} else if (locationParts.length === 1) {
				// Single value - could be either city or country
				const value = locationParts[0];
				city = value;
				// For country, try to extract a 2-letter code or use first 2 letters
				country = getCountryCode(value);
			}
			
			const response = await fetch('/api/beta-applications', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...formData,
					city: city || formData.location,
					country: country || 'XX', // Always use 2-letter code
					// Set defaults for removed fields
					phone: '',
					yearsExperience: 0,
					teamSize: 1,
					tourFrequency: formData.tourVolume,
					currentBookingMethod: 'Not specified',
					betaContribution: 'Interested in testing and providing feedback',
					interestedFeatures: ['qr_codes', 'payment_processing', 'calendar_management'],
					availabilityForFeedback: true,
					referralSource: 'Beta application form'
				})
			});
			
			const data = await response.json();
			
			if (response.ok) {
				success = true;
				// Show success message for a moment then redirect
				setTimeout(() => {
					goto('/beta/success');
				}, 2000);
			} else {
				error = data.error || 'Failed to submit application. Please try again.';
			}
		} catch (err) {
			error = 'Network error. Please check your connection and try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Apply for Zaur Beta - Quick Application</title>
	<meta name="description" content="Join the Zaur beta program in 2 minutes. We're selecting tour guides to test our QR booking platform." />
</svelte:head>

<PageContainer>
	<div class="max-w-3xl mx-auto pb-16">
		<!-- Header -->
		<div class="mb-6 sm:mb-8">
			<!-- Mobile Header -->
			<MobilePageHeader
				title="Beta Application"
				secondaryInfo={`${formCompletion.percentage}% complete`}
				primaryAction={{
					label: 'Quick Form',
					icon: FlaskConical,
					variant: 'secondary',
					disabled: true,
					onclick: () => {}
				}}
			/>
			
			<!-- Desktop Header -->
			<div class="hidden sm:block">
				<PageHeader 
					title="Apply for Beta Program"
					subtitle="2-minute application • 50 spots available"
				>
					<div class="flex items-center gap-4">
						<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style="background: var(--color-primary-100); color: var(--color-primary-700);">
							<FlaskConical class="h-4 w-4" />
							Limited Beta
						</div>
					</div>
				</PageHeader>
			</div>
		</div>

		{#if error}
			<div bind:this={errorElement} class="mb-6">
				<ErrorAlert variant="error" title="Error" message={error} />
			</div>
		{/if}

		{#if success}
			<div class="mb-6 p-6 rounded-xl" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);" in:fade={{ duration: 200 }}>
				<div class="flex items-start gap-3">
					<CheckCircle class="h-6 w-6 flex-shrink-0 mt-0.5" style="color: var(--color-success-600);" />
					<div>
						<h3 class="text-lg font-semibold mb-2" style="color: var(--color-success-900);">Application Submitted!</h3>
						<p style="color: var(--color-success-700);">Thank you! We'll review your application and contact you within 48 hours.</p>
					</div>
				</div>
			</div>
		{:else}
			<form onsubmit={handleSubmit} class="space-y-6 sm:space-y-8">
			<!-- Contact Information -->
			<div class="rounded-xl p-4 sm:p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center gap-3 mb-4 sm:mb-6">
					<User class="h-5 w-5" style="color: var(--color-primary-600);" />
					<h2 class="text-lg font-semibold" style="color: var(--text-primary);">Contact Information</h2>
				</div>
				
				<div class="grid sm:grid-cols-2 gap-4">
					<div class="sm:col-span-2 lg:col-span-1">
						<label for="name" class="form-label">
							Your Name <span style="color: var(--color-error);">*</span>
						</label>
						<input
							type="text"
							id="name"
							bind:value={formData.name}
							onblur={() => handleFieldBlur('name', formData.name)}
							placeholder="John Smith"
							class="form-input {hasFieldError('name') ? 'error' : ''}"
							disabled={isSubmitting}
							autocomplete="name"
						/>
						{#if getFieldError('name')}
							<p class="mt-1 text-sm" style="color: var(--color-error);">{getFieldError('name')}</p>
						{/if}
					</div>
					
					<div class="sm:col-span-2 lg:col-span-1">
						<label for="email" class="form-label">
							Email Address <span style="color: var(--color-error);">*</span>
						</label>
						<input
							type="text"
							id="email"
							bind:value={formData.email}
							onblur={() => handleFieldBlur('email', formData.email)}
							oninput={() => {
								// Real-time validation for email
								if (touchedFields.has('email')) {
									handleFieldBlur('email', formData.email);
								}
							}}
							placeholder="john@example.com"
							class="form-input {hasFieldError('email') ? 'error' : ''}"
							disabled={isSubmitting}
							autocomplete="email"
						/>
						{#if getFieldError('email')}
							<p class="mt-1 text-sm" style="color: var(--color-error);">{getFieldError('email')}</p>
						{/if}
					</div>
					
					<div class="sm:col-span-2">
						<label for="businessName" class="form-label">
							Business Name <span class="text-sm" style="color: var(--text-tertiary);">(optional)</span>
						</label>
						<input
							type="text"
							id="businessName"
							bind:value={formData.businessName}
							placeholder="Adventure Tours Co."
							class="form-input"
							disabled={isSubmitting}
							autocomplete="organization"
						/>
					</div>
					
					<div class="sm:col-span-2">
						<label for="location" class="form-label">
							Your Location <span style="color: var(--color-error);">*</span>
						</label>
						<input
							type="text"
							id="location"
							bind:value={formData.location}
							oninput={(e) => handleLocationInput((e.target as HTMLInputElement).value)}
							onblur={() => handleFieldBlur('location', formData.location)}
							placeholder="Barcelona, Spain or just Spain"
							class="form-input {hasFieldError('location') ? 'error' : ''}"
							disabled={isSubmitting}
							autocomplete="address-level2"
						/>
						{#if getFieldError('location')}
							<p class="mt-1 text-sm" style="color: var(--color-error);">{getFieldError('location')}</p>
						{/if}
					</div>
				</div>
			</div>
			
			<!-- About Your Tours -->
			<div class="rounded-xl p-4 sm:p-6" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
				<div class="flex items-center gap-3 mb-4 sm:mb-6">
					<MapPin class="h-5 w-5" style="color: var(--color-primary-600);" />
					<h2 class="text-lg font-semibold" style="color: var(--text-primary);">About Your Tours</h2>
				</div>
				
				<div class="grid sm:grid-cols-2 gap-4">
					<div class="sm:col-span-2">
						<label for="tourTypes" class="form-label">
							What tours do you offer? <span style="color: var(--color-error);">*</span>
						</label>
						<textarea
							id="tourTypes"
							bind:value={formData.tourTypes}
							onblur={() => handleFieldBlur('tourTypes', formData.tourTypes)}
							placeholder="Walking tours, food experiences, adventure activities..."
							rows="3"
							class="form-input {hasFieldError('tourTypes') ? 'error' : ''}"
							disabled={isSubmitting}
						></textarea>
						{#if getFieldError('tourTypes')}
							<p class="mt-1 text-sm" style="color: var(--color-error);">{getFieldError('tourTypes')}</p>
						{/if}
					</div>
					
					<div>
						<label for="tourVolume" class="form-label">
							Business Size <span style="color: var(--color-error);">*</span>
						</label>
						<select
							id="tourVolume"
							bind:value={formData.tourVolume}
							onblur={() => handleFieldBlur('tourVolume', formData.tourVolume)}
							class="form-select {hasFieldError('tourVolume') ? 'error' : ''}"
							disabled={isSubmitting}
						>
							<option value="">Select your tour volume...</option>
							{#each tourVolumeOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						{#if getFieldError('tourVolume')}
							<p class="mt-1 text-sm" style="color: var(--color-error);">{getFieldError('tourVolume')}</p>
						{/if}
					</div>
					
					<div>
						<label for="website" class="form-label">
							Website or Social Media <span class="text-sm" style="color: var(--text-tertiary);">(optional)</span>
						</label>
						<input
							type="text"
							id="website"
							bind:value={formData.website}
							placeholder="www.example.com or @yourtours"
							class="form-input"
							disabled={isSubmitting}
						/>
					</div>
					
					<div class="sm:col-span-2">
						<label for="biggestChallenge" class="form-label">
							What's your biggest booking challenge? <span style="color: var(--color-error);">*</span>
						</label>
						<textarea
							id="biggestChallenge"
							bind:value={formData.biggestChallenge}
							onblur={() => handleFieldBlur('biggestChallenge', formData.biggestChallenge)}
							placeholder="Last-minute cancellations, payment processing, managing availability..."
							rows="3"
							class="form-input {hasFieldError('biggestChallenge') ? 'error' : ''}"
							disabled={isSubmitting}
						></textarea>
						{#if getFieldError('biggestChallenge')}
							<p class="mt-1 text-sm" style="color: var(--color-error);">{getFieldError('biggestChallenge')}</p>
						{/if}
					</div>
				</div>
			</div>
			
			<!-- Beta Program Info -->
			<div class="rounded-xl p-4 sm:p-6" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
				<h3 class="font-semibold mb-3" style="color: var(--color-primary-900);">What you'll get as a beta tester:</h3>
				<ul class="space-y-2 text-sm" style="color: var(--color-primary-700);">
					<li class="flex items-start gap-2">
						<CheckCircle class="h-4 w-4 mt-0.5 flex-shrink-0" />
						<span>Free access during beta period</span>
					</li>
					<li class="flex items-start gap-2">
						<CheckCircle class="h-4 w-4 mt-0.5 flex-shrink-0" />
						<span>30% lifetime discount after launch</span>
					</li>
					<li class="flex items-start gap-2">
						<CheckCircle class="h-4 w-4 mt-0.5 flex-shrink-0" />
						<span>Direct influence on product features</span>
					</li>
					<li class="flex items-start gap-2">
						<CheckCircle class="h-4 w-4 mt-0.5 flex-shrink-0" />
						<span>Priority support and onboarding</span>
					</li>
				</ul>
			</div>
			
			<!-- Submit Section -->
			<div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
				<div class="text-center sm:text-left">
					<p class="text-sm" style="color: var(--text-secondary);">
						Takes 2 minutes • {formCompletion.completed}/{formCompletion.total} fields
					</p>
				</div>
				
				<button 
					type="submit" 
					class="button-primary button--gap button--large w-full sm:w-auto"
					disabled={isSubmitting || !formCompletion.isComplete}
				>
					{#if isSubmitting}
						<Loader class="w-5 h-5 animate-spin" />
						<span>Submitting...</span>
					{:else}
						<Send class="h-5 w-5" />
						<span>Submit Application</span>
					{/if}
				</button>
			</div>
		</form>
		{/if}
	</div>
</PageContainer>

<style lang="postcss">
	/* Ensure form styles work correctly in this component */
	:global(.form-input),
	:global(.form-select),
	:global(.form-textarea) {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-xs);
		font-size: var(--text-sm);
		transition: all var(--transition-fast) ease;
		background-color: var(--bg-input);
		color: var(--text-primary);
	}

	:global(.form-select) {
		padding-right: 2.5rem;
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
		background-position: right 0.75rem center;
		background-repeat: no-repeat;
		background-size: 1.25em 1.25em;
		appearance: none;
		cursor: pointer;
	}

	:global(.form-input:focus),
	:global(.form-select:focus),
	:global(.form-textarea:focus) {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: var(--focus-shadow-primary);
	}

	:global(.form-input.error),
	:global(.form-select.error),
	:global(.form-textarea.error) {
		border-color: var(--color-error);
	}

	:global(.form-input.error:focus),
	:global(.form-select.error:focus),
	:global(.form-textarea.error:focus) {
		border-color: var(--color-error);
		box-shadow: var(--focus-shadow-error);
	}

	:global(.form-label) {
		display: block;
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.375rem;
	}

	:global(.form-input:disabled),
	:global(.form-select:disabled),
	:global(.form-textarea:disabled) {
		background-color: var(--bg-tertiary);
		color: var(--text-tertiary);
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Dark mode select arrow */
	:global([data-theme="dark"] .form-select) {
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23c9d1d9' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
	}

	/* Ensure textarea resizing works */
	:global(.form-textarea) {
		resize: vertical;
		min-height: 60px;
		font-family: inherit;
		line-height: 1.5;
	}
	
	/* Mobile optimizations */
	@media (max-width: 640px) {
		:global(.form-input),
		:global(.form-select),
		:global(.form-textarea) {
			font-size: 1rem; /* Prevent zoom on iOS */
		}
	}
</style>
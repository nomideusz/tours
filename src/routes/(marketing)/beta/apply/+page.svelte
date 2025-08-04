<script lang="ts">
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import FlaskConical from 'lucide-svelte/icons/flask-conical';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Loader from 'lucide-svelte/icons/loader';
	
	// Form state
	let isSubmitting = $state(false);
	let error = $state('');
	let success = $state(false);
	
	// Form data
	let formData = $state({
		// Basic info
		name: '',
		email: '',
		phone: '',
		website: '',
		
		// Business info
		businessName: '',
		location: '',
		country: '',
		
		// Screening questions
		tourTypes: '',
		tourFrequency: '',
		currentBookingMethod: '',
		biggestChallenge: '',
		betaContribution: '',
		
		// Additional info
		yearsExperience: 1,
		teamSize: 1,
		interestedFeatures: [] as string[],
		availabilityForFeedback: true,
		referralSource: ''
	});
	
	// Feature options
	const featureOptions = [
		{ value: 'qr_codes', label: 'QR Code Bookings' },
		{ value: 'calendar_management', label: 'Calendar Management' },
		{ value: 'customer_database', label: 'Customer Database' },
		{ value: 'email_automation', label: 'Email Automation' },
		{ value: 'payment_processing', label: 'Payment Processing' },
		{ value: 'analytics', label: 'Analytics & Reports' },
		{ value: 'multi_language', label: 'Multi-language Support' },
		{ value: 'team_management', label: 'Team Management' }
	];
	
	// Tour frequency options
	const frequencyOptions = [
		'1-2 tours per week',
		'3-5 tours per week',
		'6-10 tours per week',
		'10+ tours per week',
		'Daily tours',
		'Seasonal/occasional'
	];
	
	// Handle feature toggle
	function toggleFeature(feature: string) {
		if (formData.interestedFeatures.includes(feature)) {
			formData.interestedFeatures = formData.interestedFeatures.filter(f => f !== feature);
		} else {
			formData.interestedFeatures = [...formData.interestedFeatures, feature];
		}
	}
	
	// Form validation
	function validateForm() {
		if (!formData.name || !formData.email || !formData.location || !formData.country) {
			return 'Please fill in all required fields';
		}
		
		if (!formData.tourTypes || !formData.tourFrequency || !formData.currentBookingMethod || 
			!formData.biggestChallenge || !formData.betaContribution) {
			return 'Please answer all screening questions';
		}
		
		if (formData.interestedFeatures.length === 0) {
			return 'Please select at least one feature you\'re interested in';
		}
		
		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			return 'Please enter a valid email address';
		}
		
		return null;
	}
	
	// Handle form submission
	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		// Validate form
		const validationError = validateForm();
		if (validationError) {
			error = validationError;
			return;
		}
		
		error = '';
		isSubmitting = true;
		
		try {
			const response = await fetch('/api/beta-applications', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
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
	<title>Apply for Zaur Beta Program - Help Shape the Future</title>
	<meta name="description" content="Apply to be one of 50 tour guides in the Zaur beta program. Get free access, provide feedback, and shape the platform." />
</svelte:head>

<div class="apply-page" in:fade={{ duration: 300 }}>
	<div class="container">
		<!-- Header -->
		<div class="header-section">
			<div class="beta-badge-large">
				<FlaskConical class="w-6 h-6" />
				<span>Beta Application</span>
			</div>
			
			<h1 class="page-title">Apply for the Beta Program</h1>
			<p class="page-description">
				We're looking for 50 passionate tour guides to help test and shape Zaur. 
				Tell us about your business and how you can contribute to making Zaur better.
			</p>
		</div>
		
		{#if success}
			<div class="success-message" in:fade={{ duration: 200 }}>
				<CheckCircle class="w-6 h-6" />
				<div>
					<h3>Application Submitted!</h3>
					<p>Thank you for applying. We'll review your application and get back to you by January 20.</p>
				</div>
			</div>
		{:else}
			<form class="application-form" onsubmit={handleSubmit}>
				{#if error}
					<div class="error-message" in:fade={{ duration: 200 }}>
						<AlertCircle class="w-5 h-5" />
						<span>{error}</span>
					</div>
				{/if}
				
				<!-- Basic Information -->
				<section class="form-section">
					<h2 class="section-title">Basic Information</h2>
					
					<div class="form-grid">
						<div class="form-group">
							<label for="name" class="required">Your Name</label>
							<input
								type="text"
								id="name"
								bind:value={formData.name}
								placeholder="John Smith"
								required
								disabled={isSubmitting}
							/>
						</div>
						
						<div class="form-group">
							<label for="email" class="required">Email Address</label>
							<input
								type="email"
								id="email"
								bind:value={formData.email}
								placeholder="john@example.com"
								required
								disabled={isSubmitting}
							/>
						</div>
						
						<div class="form-group">
							<label for="phone">Phone Number</label>
							<input
								type="tel"
								id="phone"
								bind:value={formData.phone}
								placeholder="+1 234 567 8900"
								disabled={isSubmitting}
							/>
						</div>
						
						<div class="form-group">
							<label for="website">Website/Social Media</label>
							<input
								type="text"
								id="website"
								bind:value={formData.website}
								placeholder="www.example.com"
								disabled={isSubmitting}
							/>
						</div>
					</div>
				</section>
				
				<!-- Business Information -->
				<section class="form-section">
					<h2 class="section-title">Business Information</h2>
					
					<div class="form-grid">
						<div class="form-group">
							<label for="businessName">Business Name</label>
							<input
								type="text"
								id="businessName"
								bind:value={formData.businessName}
								placeholder="Adventure Tours Co."
								disabled={isSubmitting}
							/>
						</div>
						
						<div class="form-group">
							<label for="location" class="required">City/Location</label>
							<input
								type="text"
								id="location"
								bind:value={formData.location}
								placeholder="Barcelona, Spain"
								required
								disabled={isSubmitting}
							/>
						</div>
						
						<div class="form-group">
							<label for="country" class="required">Country Code</label>
							<input
								type="text"
								id="country"
								bind:value={formData.country}
								placeholder="ES"
								maxlength="2"
								required
								disabled={isSubmitting}
								style="text-transform: uppercase"
								oninput={(e) => {
									const target = e.target as HTMLInputElement;
									target.value = target.value.toUpperCase();
								}}
							/>
							<p class="field-hint">2-letter country code (e.g., US, GB, ES)</p>
						</div>
						
						<div class="form-group">
							<label for="yearsExperience" class="required">Years in Business</label>
							<input
								type="number"
								id="yearsExperience"
								bind:value={formData.yearsExperience}
								min="0"
								max="50"
								required
								disabled={isSubmitting}
							/>
						</div>
						
						<div class="form-group">
							<label for="teamSize" class="required">Team Size</label>
							<input
								type="number"
								id="teamSize"
								bind:value={formData.teamSize}
								min="1"
								max="100"
								required
								disabled={isSubmitting}
							/>
							<p class="field-hint">Including yourself</p>
						</div>
					</div>
				</section>
				
				<!-- Screening Questions -->
				<section class="form-section">
					<h2 class="section-title">About Your Tours</h2>
					
					<div class="form-group">
						<label for="tourTypes" class="required">What types of tours do you offer?</label>
						<textarea
							id="tourTypes"
							bind:value={formData.tourTypes}
							placeholder="Walking tours, food tours, adventure activities..."
							rows="3"
							required
							disabled={isSubmitting}
						></textarea>
					</div>
					
					<div class="form-group">
						<label for="tourFrequency" class="required">How many tours do you typically run?</label>
						<select
							id="tourFrequency"
							bind:value={formData.tourFrequency}
							required
							disabled={isSubmitting}
						>
							<option value="">Select frequency...</option>
							{#each frequencyOptions as option}
								<option value={option}>{option}</option>
							{/each}
						</select>
					</div>
					
					<div class="form-group">
						<label for="currentBookingMethod" class="required">
							How do you currently manage bookings?
						</label>
						<textarea
							id="currentBookingMethod"
							bind:value={formData.currentBookingMethod}
							placeholder="Paper forms, WhatsApp, existing booking software..."
							rows="3"
							required
							disabled={isSubmitting}
						></textarea>
					</div>
					
					<div class="form-group">
						<label for="biggestChallenge" class="required">
							What's your biggest challenge with tour management?
						</label>
						<textarea
							id="biggestChallenge"
							bind:value={formData.biggestChallenge}
							placeholder="Last-minute cancellations, payment processing, customer communication..."
							rows="3"
							required
							disabled={isSubmitting}
						></textarea>
					</div>
				</section>
				
				<!-- Beta Contribution -->
				<section class="form-section">
					<h2 class="section-title">Beta Program Contribution</h2>
					
					<div class="form-group">
						<label for="betaContribution" class="required">
							How would you contribute to the beta program?
						</label>
						<textarea
							id="betaContribution"
							bind:value={formData.betaContribution}
							placeholder="I can provide feedback on mobile features, test with real customers, participate in weekly calls..."
							rows="4"
							required
							disabled={isSubmitting}
						></textarea>
						<p class="field-hint">
							We're looking for guides who can actively test features and provide detailed feedback
						</p>
					</div>
					
					<div class="form-group">
						<label class="required">Which features are you most interested in?</label>
						<div class="checkbox-grid">
							{#each featureOptions as feature}
								<label class="checkbox-label">
									<input
										type="checkbox"
										checked={formData.interestedFeatures.includes(feature.value)}
										onchange={() => toggleFeature(feature.value)}
										disabled={isSubmitting}
									/>
									<span>{feature.label}</span>
								</label>
							{/each}
						</div>
					</div>
					
					<div class="form-group">
						<label class="checkbox-label standalone">
							<input
								type="checkbox"
								bind:checked={formData.availabilityForFeedback}
								disabled={isSubmitting}
							/>
							<span>I'm available for weekly feedback sessions and testing new features</span>
						</label>
					</div>
				</section>
				
				<!-- Additional Information -->
				<section class="form-section">
					<h2 class="section-title">How Did You Hear About Us?</h2>
					
					<div class="form-group">
						<label for="referralSource">Referral Source</label>
						<input
							type="text"
							id="referralSource"
							bind:value={formData.referralSource}
							placeholder="Social media, friend, search engine..."
							disabled={isSubmitting}
						/>
					</div>
				</section>
				
				<!-- Submit Button -->
				<div class="form-actions">
					<button 
						type="submit" 
						class="button-primary button--large"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							<Loader class="w-5 h-5 animate-spin" />
							<span>Submitting...</span>
						{:else}
							<span>Submit Application</span>
						{/if}
					</button>
					
					<p class="submit-note">
						We'll review all applications and notify selected beta testers by September 30, 2025
					</p>
				</div>
			</form>
		{/if}
	</div>
</div>

<style>
	.apply-page {
		min-height: 100vh;
		padding: 2rem 0 4rem;
		background: var(--bg-primary);
	}
	
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}
	
	/* Header */
	.header-section {
		text-align: center;
		margin-bottom: 3rem;
	}
	
	.beta-badge-large {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1.5rem;
		background: var(--primary);
		color: white;
		border-radius: 9999px;
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
	}
	
	.page-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}
	
	.page-description {
		font-size: 1.125rem;
		color: var(--text-secondary);
		line-height: 1.6;
		max-width: 600px;
		margin: 0 auto;
	}
	
	/* Messages */
	.success-message,
	.error-message {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border-radius: 0.75rem;
		margin-bottom: 2rem;
	}
	
	.success-message {
		background: var(--success-light);
		color: var(--success);
		border: 1px solid var(--success);
	}
	
	.success-message h3 {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}
	
	.error-message {
		background: var(--danger-light);
		color: var(--danger);
		border: 1px solid var(--danger);
	}
	
	/* Form */
	.application-form {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 1rem;
		padding: 2rem;
	}
	
	.form-section {
		margin-bottom: 2.5rem;
	}
	
	.form-section:last-of-type {
		margin-bottom: 2rem;
	}
	
	.section-title {
		font-size: 1.375rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border-color);
	}
	
	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}
	
	.form-group {
		display: flex;
		flex-direction: column;
	}
	
	.form-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.form-group label.required::after {
		content: ' *';
		color: var(--danger);
	}
	
	.form-group input,
	.form-group select,
	.form-group textarea {
		padding: 0.625rem 0.875rem;
		border: 1px solid var(--border-color);
		border-radius: 0.5rem;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}
	
	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px var(--primary-light);
	}
	
	.form-group input:disabled,
	.form-group select:disabled,
	.form-group textarea:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.form-group textarea {
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
		line-height: 1.5;
	}
	
	.field-hint {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		margin-top: 0.25rem;
	}
	
	/* Checkboxes */
	.checkbox-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
	}
	
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--text-secondary);
		padding: 0.5rem;
		border-radius: 0.375rem;
		transition: background 0.2s ease;
	}
	
	.checkbox-label:hover {
		background: var(--bg-tertiary);
	}
	
	.checkbox-label.standalone {
		padding: 0.75rem;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: 0.5rem;
		margin-top: 0.5rem;
	}
	
	.checkbox-label input[type="checkbox"] {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
	}
	
	/* Form Actions */
	.form-actions {
		text-align: center;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color);
	}
	
	.form-actions button {
		min-width: 200px;
	}
	
	.submit-note {
		margin-top: 1rem;
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}
	
	/* Mobile */
	@media (max-width: 640px) {
		.apply-page {
			padding: 1.5rem 0 3rem;
		}
		
		.page-title {
			font-size: 2rem;
		}
		
		.application-form {
			padding: 1.5rem;
		}
		
		.form-grid {
			grid-template-columns: 1fr;
			gap: 1.25rem;
		}
		
		.checkbox-grid {
			grid-template-columns: 1fr;
		}
	}
	
	/* Dark mode adjustments */
	:global(.dark) .application-form {
		background: var(--bg-secondary);
	}
	
	:global(.dark) .form-group input,
	:global(.dark) .form-group select,
	:global(.dark) .form-group textarea {
		background: var(--bg-primary);
	}
</style>
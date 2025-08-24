<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Mail from 'lucide-svelte/icons/mail';
	import Globe from 'lucide-svelte/icons/globe';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import Plus from 'lucide-svelte/icons/plus';
	import FlagIcon from '$lib/components/FlagIcon.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import { COUNTRY_LIST, getCountryInfo, getCurrencyForCountry } from '$lib/utils/countries.js';

	// Props
	let {
		user,
		profile,
		needsEmailVerification = false,
		needsConfirmation = false,
		isNewUser = false,
		onboardingSteps = [],
		hasConfirmedLocation = $bindable(false),
		selectedCountry = $bindable(''),
		savingCurrency = $bindable(false),
		showLocationModal = $bindable(false),
		countrySearchTerm = $bindable(''),
		resendingEmail = $bindable(false),
		resendEmailSuccess = $bindable(false),
		isSettingUpPayment = $bindable(false),
		paymentStatus = $bindable({ isSetup: false, loading: true }),
		showPaymentConfirmModal = $bindable(false),
		pendingPaymentCountry = $bindable<string | null>(null)
	}: {
		user: any;
		profile: any;
		needsEmailVerification?: boolean;
		needsConfirmation?: boolean;
		isNewUser?: boolean;
		onboardingSteps?: any[];
		hasConfirmedLocation?: boolean;
		selectedCountry?: string;
		savingCurrency?: boolean;
		showLocationModal?: boolean;
		countrySearchTerm?: string;
		resendingEmail?: boolean;
		resendEmailSuccess?: boolean;
		isSettingUpPayment?: boolean;
		paymentStatus?: { isSetup: boolean; loading: boolean };
		showPaymentConfirmModal?: boolean;
		pendingPaymentCountry?: string | null;
	} = $props();

	const dispatch = createEventDispatcher<{
		resendEmail: void;
		confirmLocation: { country: string };
		setupPayment: { country: string };
		createFirstTour: void;
	}>();

	// Computed values
	let filteredCountries = $derived(
		COUNTRY_LIST.filter(country => 
			country.name.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
			country.code.toLowerCase().includes(countrySearchTerm.toLowerCase())
		).slice(0, 10)
	);

	let completedSteps = $derived(onboardingSteps.filter(step => step.completed).length);
	let totalSteps = $derived(onboardingSteps.length);
	let progressPercentage = $derived(totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0);

	function handleResendEmail() {
		dispatch('resendEmail');
	}

	function handleCountrySelect(countryCode: string) {
		selectedCountry = countryCode;
		showLocationModal = false;
		countrySearchTerm = '';
		dispatch('confirmLocation', { country: countryCode });
	}

	function handleSetupPayment() {
		if (selectedCountry) {
			pendingPaymentCountry = selectedCountry;
			showPaymentConfirmModal = true;
		}
	}

	function confirmPaymentSetup() {
		if (pendingPaymentCountry) {
			dispatch('setupPayment', { country: pendingPaymentCountry });
			showPaymentConfirmModal = false;
			pendingPaymentCountry = null;
		}
	}

	function handleCreateFirstTour() {
		dispatch('createFirstTour');
	}
</script>

<!-- Email Verification Notice -->
{#if needsEmailVerification}
	<div class="onboarding-notice email-verification" transition:fade>
		<div class="notice-content">
			<div class="notice-icon">
				<Mail class="w-6 h-6" />
			</div>
			<div class="notice-text">
				<h3>Verify your email address</h3>
				<p>We've sent a verification link to <strong>{user?.email}</strong>. Please check your inbox and click the link to verify your account.</p>
			</div>
			<div class="notice-actions">
				<button 
					onclick={handleResendEmail}
					class="button--secondary button--small"
					disabled={resendingEmail}
				>
					{#if resendingEmail}
						<Loader2 class="w-4 h-4 animate-spin" />
						Sending...
					{:else}
						Resend Email
					{/if}
				</button>
			</div>
		</div>
		{#if resendEmailSuccess}
			<div class="success-message" transition:fade>
				<CheckCircle class="w-4 h-4" />
				Email sent successfully!
			</div>
		{/if}
	</div>
{/if}

<!-- Location Confirmation -->
{#if needsConfirmation}
	<div class="onboarding-notice location-confirmation" transition:fade>
		<div class="notice-content">
			<div class="notice-icon">
				<Globe class="w-6 h-6" />
			</div>
			<div class="notice-text">
				<h3>Confirm your business location</h3>
				<p>This determines your currency and payment processing requirements. <strong>Cannot be changed after payment setup.</strong></p>
			</div>
			<div class="notice-actions">
				<button 
					onclick={() => showLocationModal = true}
					class="button--primary button--small"
				>
					<Globe class="w-4 h-4" />
					Select Country
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- User Onboarding -->
{#if onboardingSteps.length > 0 && !needsEmailVerification && !needsConfirmation}
	<div class="onboarding-section" transition:fade>
		<div class="onboarding-header">
			<h2>{isNewUser ? 'Welcome to Zaur! 🎉' : 'Complete Your Setup'}</h2>
			<p>{isNewUser ? "Let's get your tour business set up in just a few steps." : "Finish setting up your account to start accepting bookings."}</p>
			
			<!-- Progress Bar -->
			<div class="progress-container">
				<div class="progress-bar">
					<div class="progress-fill" style="width: {progressPercentage}%"></div>
				</div>
				<span class="progress-text">{completedSteps} of {totalSteps} completed</span>
			</div>
		</div>

		<div class="onboarding-steps" class:single-step={onboardingSteps.length === 1}>
			{#each onboardingSteps as step}
				<div class="onboarding-step" class:completed={step.completed} class:single={onboardingSteps.length === 1}>
					<div class="step-icon">
						{#if step.completed}
							<CheckCircle class="w-5 h-5 text-green-600" />
						{:else if step.id === 'payment' && paymentStatus.loading}
							<Loader2 class="w-5 h-5 animate-spin" />
						{:else}
							<svelte:component this={step.icon} class="w-5 h-5" />
						{/if}
					</div>
					<div class="step-content">
						<h4>{step.title}</h4>
						<p>{step.description}</p>
						{#if !step.completed && step.action}
							<button 
								onclick={step.action}
								class="button--primary button--small"
								disabled={step.disabled || (step.id === 'payment' && (paymentStatus.loading || isSettingUpPayment))}
							>
								{#if step.id === 'payment' && isSettingUpPayment}
									<Loader2 class="w-4 h-4 animate-spin" />
									Setting up...
								{:else}
									{step.actionText}
								{/if}
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- Location Selection Modal -->
{#if showLocationModal}
	<div class="modal-backdrop" onclick={() => showLocationModal = false}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Select Your Business Location</h3>
				<p>This determines your currency and cannot be changed after payment setup.</p>
			</div>
			
			<div class="modal-body">
				<div class="search-container">
					<input
						type="text"
						placeholder="Search countries..."
						bind:value={countrySearchTerm}
						class="search-input"
					/>
				</div>
				
				<div class="countries-list">
					{#each filteredCountries as country}
						<button
							onclick={() => handleCountrySelect(country.code)}
							class="country-option"
						>
							<FlagIcon countryCode={country.code} class="flag-icon" />
							<span class="country-name">{country.name}</span>
							<span class="country-currency">{getCurrencyForCountry(country.code)}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Payment Setup Confirmation Modal -->
<ConfirmationModal
	bind:isOpen={showPaymentConfirmModal}
	title="Set Up Payment Processing"
	message="Your country will be permanently locked to {getCountryInfo(pendingPaymentCountry || '')?.name || 'the selected country'}. This cannot be changed later. Continue?"
	confirmText="Continue Setup"
	cancelText="Cancel"
	onConfirm={confirmPaymentSetup}
	onCancel={() => {
		showPaymentConfirmModal = false;
		pendingPaymentCountry = null;
	}}
/>

<style>
	.onboarding-notice {
		background: var(--surface-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.onboarding-notice.email-verification {
		border-color: var(--warning);
		background: var(--warning-light);
	}

	.onboarding-notice.location-confirmation {
		border-color: var(--info);
		background: var(--info-light);
	}

	.notice-content {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.notice-icon {
		flex-shrink: 0;
		color: var(--primary);
	}

	.notice-text {
		flex: 1;
	}

	.notice-text h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.notice-text p {
		margin: 0;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.notice-actions {
		flex-shrink: 0;
	}

	.success-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1rem;
		padding: 0.75rem;
		background: var(--success-light);
		border: 1px solid var(--success);
		border-radius: 6px;
		color: var(--success-dark);
		font-size: 0.875rem;
	}

	.onboarding-section {
		background: var(--surface-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.onboarding-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.onboarding-header h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.onboarding-header p {
		margin: 0 0 1.5rem 0;
		color: var(--text-secondary);
		font-size: 1.125rem;
	}

	.progress-container {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.progress-bar {
		flex: 1;
		height: 8px;
		background: var(--surface-tertiary);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--primary);
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.progress-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		white-space: nowrap;
	}

	.onboarding-steps {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.onboarding-step {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.onboarding-step.completed {
		background: var(--success-light);
		border-color: var(--success);
	}

	/* Single step layout - centered and more compact */
	.onboarding-steps.single-step {
		align-items: center;
	}

	.onboarding-step.single {
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 400px;
		margin: 0 auto;
		gap: 1.5rem;
	}

	.onboarding-step.single .step-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.onboarding-step.single .step-content h4 {
		margin: 0;
		font-size: 1.25rem;
	}

	.onboarding-step.single .step-content p {
		margin: 0;
		font-size: 0.9375rem;
	}

	.step-icon {
		flex-shrink: 0;
		color: var(--text-secondary);
	}

	.onboarding-step.completed .step-icon {
		color: var(--success);
	}

	.step-content {
		flex: 1;
	}

	.step-content h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.step-content p {
		margin: 0 0 1rem 0;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: var(--bg-secondary);
		border-radius: 12px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 500px;
		max-height: 80vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-primary);
	}

	.modal-header h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.modal-header p {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.search-container {
		margin-bottom: 1rem;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		background: var(--bg-secondary);
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.search-input:focus {
		outline: none;
		border-color: var(--primary);
	}

	.countries-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.country-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;
	}

	.country-option:hover {
		background: var(--surface-secondary);
		border-color: var(--primary);
	}

	.flag-icon {
		width: 24px;
		height: 18px;
		flex-shrink: 0;
	}

	.country-name {
		flex: 1;
		font-weight: 500;
		color: var(--text-primary);
	}

	.country-currency {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	@media (max-width: 640px) {
		.notice-content {
			flex-direction: column;
			gap: 1rem;
		}

		.notice-actions {
			align-self: flex-start;
		}

		.progress-container {
			flex-direction: column;
			gap: 0.5rem;
		}

		.onboarding-step {
			flex-direction: column;
			gap: 1rem;
		}

		.step-icon {
			align-self: flex-start;
		}
	}
</style>

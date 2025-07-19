<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { AuthUser } from '$lib/stores/auth.js';
	import type { Currency } from '$lib/stores/currency.js';
	import { userCurrency } from '$lib/stores/currency.js';
	import { COUNTRY_LIST, getCountryInfo, getCurrencyForCountry, type CountryInfo } from '$lib/utils/countries.js';
	
	// Icons
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Mail from 'lucide-svelte/icons/mail';
	import Globe from 'lucide-svelte/icons/globe';
	import CreditCard from 'lucide-svelte/icons/credit-card';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Loader2 from 'lucide-svelte/icons/loader-2';

	// Props
	interface Props {
		profile: AuthUser | null;
		stats: any;
		needsEmailVerification: boolean;
		needsConfirmation: boolean;
		paymentStatus: { isSetup: boolean; loading: boolean };
		stepsCompleted: number;
		resendingEmail: boolean;
		resendEmailSuccess: boolean;
		resendEmailError: string | null;
		isSettingUpPayment: boolean;
		saveError: string | null;
		hasConfirmedLocation: boolean;
		selectedCountry: string;
		selectedCurrency: Currency;
		savingCurrency: boolean;
		currencyExpanded: boolean;
		// Callbacks
		resendVerificationEmail: () => void;
		setupPayments: () => void;
		onCurrencyExpandedChange: (expanded: boolean) => void;
		onCountryChange: (country: string) => void;
		saveCurrencySelection: () => void;
		resetSelections: () => void;
	}

	let {
		profile,
		stats,
		needsEmailVerification,
		needsConfirmation,
		paymentStatus,
		stepsCompleted,
		resendingEmail,
		resendEmailSuccess,
		resendEmailError,
		isSettingUpPayment,
		saveError,
		hasConfirmedLocation,
		selectedCountry,
		selectedCurrency,
		savingCurrency,
		currencyExpanded,
		resendVerificationEmail,
		setupPayments,
		onCurrencyExpandedChange,
		onCountryChange,
		saveCurrencySelection,
		resetSelections
	}: Props = $props();
</script>

<div class="mb-8">
	<div class="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
		<!-- Email Verification Step -->
		<div class="onboarding-step {!needsEmailVerification ? 'onboarding-step--completed' : ''}">
			<div class="flex items-start gap-4">
				<div class="onboarding-step-icon {!needsEmailVerification ? 'onboarding-step-icon--completed' : ''}">
					{#if !needsEmailVerification}
						<CheckCircle class="w-8 h-8" />
					{:else}
						<Mail class="w-8 h-8" />
					{/if}
				</div>
				<div class="flex-1">
					<h3 class="onboarding-step-title">
						Verify Email
					</h3>
					<p class="onboarding-step-description">
						{#if !needsEmailVerification}
							Email verified!
						{:else}
							Check your inbox for verification email
						{/if}
					</p>
					{#if needsEmailVerification}
						<button 
							onclick={resendVerificationEmail}
							disabled={resendingEmail}
							class="button-secondary button--small"
						>
							{#if resendingEmail}
								<Loader2 class="h-4 w-4 animate-spin" />
							{:else}
								Resend Email
							{/if}
						</button>
						{#if resendEmailSuccess}
							<p class="onboarding-status-message onboarding-success-message">
								Email sent! Check your inbox.
							</p>
						{/if}
						{#if resendEmailError}
							<p class="onboarding-status-message onboarding-error-message">
								{resendEmailError}
							</p>
						{/if}
					{/if}
				</div>
			</div>
		</div>

		<!-- Location Confirmation Step -->
		<div class="onboarding-step {!needsConfirmation ? 'onboarding-step--completed' : ''}">
			<div class="flex items-start gap-4">
				<div class="onboarding-step-icon {!needsConfirmation ? 'onboarding-step-icon--completed' : ''}">
					{#if !needsConfirmation}
						<CheckCircle class="w-8 h-8" />
					{:else}
						<Globe class="w-8 h-8" />
					{/if}
				</div>
				<div class="flex-1">
					<h3 class="onboarding-step-title">
						Confirm Location
					</h3>
					<p class="onboarding-step-description">
						{#if !needsConfirmation}
							{#if profile?.country && profile?.currency}
								{@const countryInfo = getCountryInfo(profile.country)}
								{#if countryInfo?.flag && countryInfo.flag.length > 2}
									{countryInfo.flag}
								{:else if countryInfo?.code}
									<span class="country-code-fallback" style="display: inline-flex; vertical-align: middle; margin: 0 0.25rem;">{countryInfo.code}</span>
								{/if}
								{countryInfo?.name || profile.country} • {profile.currency}
							{:else}
								Location confirmed!
							{/if}
						{:else if selectedCountry}
							{@const countryInfo = getCountryInfo(selectedCountry)}
							Detected: 
							{#if countryInfo?.flag && countryInfo.flag.length > 2}
								{countryInfo.flag}
							{:else}
								<span class="country-code-fallback" style="display: inline-flex; vertical-align: middle; margin: 0 0.25rem;">{countryInfo?.code || selectedCountry}</span>
							{/if}
							{countryInfo?.name} • {countryInfo?.currency}
						{:else}
							Set your business location
						{/if}
					</p>
					{#if !needsConfirmation && profile?.country}
						<div class="space-y-1">
							{#if profile?.stripeAccountId}
								<p class="location-lock-warning">
									🔒 Location permanently locked
								</p>
								<p class="location-lock-text">
									Cannot be changed - payment setup was started
								</p>
							{:else}
								<p class="location-lock-warning">
									⚠️ Will be locked when payment setup starts
								</p>
								<p class="location-lock-text">
									Wrong country? <a href="/profile" class="location-lock-link">Update in Profile</a> before continuing
								</p>
							{/if}
						</div>
					{/if}
					{#if needsConfirmation}
						{#if selectedCountry}
							<!-- Auto-detected location - easy confirm/change -->
							<div class="space-y-2 mt-2">
								<div class="flex gap-2">
									<button 
										onclick={saveCurrencySelection}
										disabled={savingCurrency}
										class="button-primary button--small"
									>
										{#if savingCurrency}
											<Loader2 class="h-4 w-4 animate-spin" />
										{:else}
											✓ Confirm
										{/if}
									</button>
									<button 
										onclick={() => {
											onCurrencyExpandedChange(true);
											// Scroll to the expanded section on mobile
											setTimeout(() => {
												const expandedSection = document.querySelector('[data-location-section]');
												if (expandedSection) {
													expandedSection.scrollIntoView({ 
														behavior: 'smooth', 
														block: 'start' 
													});
												}
											}, 100);
										}}
										class="button-secondary button--small"
									>
										Change
									</button>
								</div>
								<p class="text-xs" style="color: var(--text-tertiary);">
									Auto-detected from your location
								</p>
							</div>
						{:else}
							<button 
								onclick={() => {
									onCurrencyExpandedChange(true);
									// Scroll to the expanded section on mobile
									setTimeout(() => {
										const expandedSection = document.querySelector('[data-location-section]');
										if (expandedSection) {
											expandedSection.scrollIntoView({ 
												behavior: 'smooth', 
												block: 'start' 
											});
										}
									}, 100); // Small delay to ensure DOM is updated
								}}
								class="button-secondary button--small"
							>
								Set Location
							</button>
						{/if}
					{/if}
				</div>
			</div>
		</div>

		<!-- Payment Setup Step -->
		<div class="onboarding-step {paymentStatus.isSetup ? 'onboarding-step--completed' : ''}">
			<div class="flex items-start gap-4">
				<div class="onboarding-step-icon {paymentStatus.isSetup ? 'onboarding-step-icon--completed' : ''}">
					{#if paymentStatus.isSetup}
						<CheckCircle class="w-8 h-8" />
					{:else}
						<CreditCard class="w-8 h-8" />
					{/if}
				</div>
				<div class="flex-1">
					<h3 class="onboarding-step-title">
						Setup Payments
					</h3>
					<p class="onboarding-step-description">
						{#if paymentStatus.isSetup}
							Ready to receive payments!
						{:else}
							Connect your payment account
						{/if}
					</p>
					{#if !paymentStatus.isSetup}
						<button 
							onclick={setupPayments}
							disabled={isSettingUpPayment || needsConfirmation}
							class="{needsConfirmation ? 'button-secondary opacity-50' : 'button-primary'} button--small"
						>
							{#if isSettingUpPayment}
								<Loader2 class="h-4 w-4 animate-spin" />
							{:else if needsConfirmation}
								Confirm location first
							{:else}
								Setup Payments
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Create Tour Step -->
		<div class="onboarding-step {stats.totalTours > 0 ? 'onboarding-step--completed' : ''}">
			<div class="flex items-start gap-4">
				<div class="onboarding-step-icon {stats.totalTours > 0 ? 'onboarding-step-icon--completed' : ''}">
					{#if stats.totalTours > 0}
						<CheckCircle class="w-8 h-8" />
					{:else}
						<MapPin class="w-8 h-8" />
					{/if}
				</div>
				<div class="flex-1">
					<h3 class="onboarding-step-title">
						Create Tour
					</h3>
					<p class="onboarding-step-description">
						{#if stats.totalTours > 0}
							{stats.totalTours} tour{stats.totalTours > 1 ? 's' : ''} created!
						{:else}
							Create your first tour
						{/if}
					</p>
					{#if stats.totalTours === 0}
						<button 
							onclick={() => goto('/tours/new')}
							class="button-primary button--small"
						>
							Create Tour
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Progress Bar -->
	<div class="onboarding-progress">
		<div class="flex items-center justify-between mb-4">
			<h3 class="onboarding-step-title">
				Setup Progress
			</h3>
			<span class="onboarding-step-description font-medium">
				{stepsCompleted}/4 steps
			</span>
		</div>
		<div class="onboarding-progress-bar">
			<div 
				class="onboarding-progress-fill"
				style="width: {(stepsCompleted / 4) * 100}%;"
			></div>
		</div>
	</div>

	<!-- Location Confirmation Expanded -->
	{#if needsConfirmation && currencyExpanded}
		<div data-location-section class="onboarding-location-section">
			<h3 class="onboarding-step-title">
				{selectedCountry ? 'Confirm or Change Your Location' : 'Select Your Business Location'}
			</h3>
			<p class="onboarding-step-description">
				This determines your payment currency and cannot be changed after payment setup begins.
			</p>
			
			{#if selectedCountry}
				{@const countryInfo = getCountryInfo(selectedCountry)}
				<div class="country-selected-info mb-4">
					<div class="flex items-center gap-2 mb-2">
						<span class="country-flag" style="font-size: 1.75rem;">
							{#if countryInfo?.flag && countryInfo.flag.length > 2}
								{countryInfo.flag}
							{:else}
								<span class="country-code-fallback" style="width: 2rem; height: 2rem; font-size: 0.9rem;">{countryInfo?.code || selectedCountry}</span>
							{/if}
						</span>
						<div>
							<h4 class="country-selected-title">
								{countryInfo?.name}
							</h4>
							<p class="country-selected-text">
								Currency: <strong>{countryInfo?.currency}</strong>
							</p>
						</div>
					</div>
					<p class="text-xs" style="color: var(--text-tertiary);">
						✓ Auto-detected from your location
					</p>
					<div class="flex gap-3 mt-3">
						<button
							onclick={saveCurrencySelection}
							disabled={savingCurrency}
							class="button-primary"
						>
							{#if savingCurrency}
								<Loader2 class="h-4 w-4 animate-spin" />
							{:else}
								Confirm This Location
							{/if}
						</button>
						<button
							onclick={() => { onCurrencyExpandedChange(false); resetSelections(); }}
							class="button-secondary"
						>
							Cancel
						</button>
					</div>
					<div class="mt-4 pt-4" style="border-top: 1px solid var(--border-primary);">
						<p class="onboarding-step-description mb-3">
							Or choose a different country:
						</p>
					</div>
				</div>
			{/if}
			
			{#if saveError}
				<div class="alert-error mb-4 rounded-lg p-3">
					<p class="text-sm">{saveError}</p>
				</div>
			{/if}
			
			<div class="space-y-4">
				<div>
					{#if !selectedCountry}
						<label class="block onboarding-step-title mb-2">
							Select Country
						</label>
					{/if}
					<div class="country-selection-grid">
						{#each COUNTRY_LIST as country}
							<button
								onclick={() => onCountryChange(country.code)}
								class="country-option {selectedCountry === country.code ? 'country-option--selected' : ''}"
							>
								<span class="country-flag" title="{country.name}">
									{#if country.flag && country.flag.length > 2}
										{country.flag}
									{:else}
										<span class="country-code-fallback">{country.code}</span>
									{/if}
								</span>
								<div class="flex-1 min-w-0">
									<p class="country-name">
										{country.name}
									</p>
									<p class="country-currency">
										Currency: {country.currency}
									</p>
								</div>
								{#if selectedCountry === country.code}
									<CheckCircle class="h-5 w-5 flex-shrink-0" style="color: var(--color-primary-600);" />
								{/if}
							</button>
						{/each}
					</div>
				</div>
				
				{#if !selectedCountry}
					<div class="flex gap-3">
						<button
							onclick={saveCurrencySelection}
							disabled={!selectedCountry || savingCurrency}
							class="button-primary {!selectedCountry || savingCurrency ? 'opacity-50' : ''}"
						>
							{#if savingCurrency}
								<Loader2 class="h-4 w-4 animate-spin" />
							{:else}
								Confirm Location
							{/if}
						</button>
						<button
							onclick={() => { onCurrencyExpandedChange(false); resetSelections(); }}
							class="button-secondary"
						>
							Cancel
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div> 
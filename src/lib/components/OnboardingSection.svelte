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
		<div class="rounded-xl p-6 {!needsEmailVerification ? 'bg-green-50 dark:bg-green-900/20' : ''}"
			style="background: {!needsEmailVerification ? '' : 'var(--bg-primary)'}; border: 1px solid {!needsEmailVerification ? 'var(--color-success-300)' : 'var(--border-primary)'};"
		>
			<div class="flex items-start gap-4">
				<div class="flex-shrink-0">
					{#if !needsEmailVerification}
						<CheckCircle class="h-8 w-8" style="color: var(--color-success-600);" />
					{:else}
						<Mail class="h-8 w-8" style="color: var(--text-tertiary);" />
					{/if}
				</div>
				<div class="flex-1">
					<h3 class="font-semibold mb-2" style="color: var(--text-primary);">
						Verify Email
					</h3>
					<p class="text-sm mb-4" style="color: var(--text-secondary);">
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
							<p class="text-xs mt-2" style="color: var(--color-success-600);">
								Email sent! Check your inbox.
							</p>
						{/if}
						{#if resendEmailError}
							<p class="text-xs mt-2" style="color: var(--color-error);">
								{resendEmailError}
							</p>
						{/if}
					{/if}
				</div>
			</div>
		</div>

		<!-- Location Confirmation Step -->
		<div class="rounded-xl p-6 {!needsConfirmation ? 'bg-green-50 dark:bg-green-900/20' : ''}"
			style="background: {!needsConfirmation ? '' : 'var(--bg-primary)'}; border: 1px solid {!needsConfirmation ? 'var(--color-success-300)' : 'var(--border-primary)'};"
		>
			<div class="flex items-start gap-4">
				<div class="flex-shrink-0">
					{#if !needsConfirmation}
						<CheckCircle class="h-8 w-8" style="color: var(--color-success-600);" />
					{:else}
						<Globe class="h-8 w-8" style="color: var(--text-tertiary);" />
					{/if}
				</div>
				<div class="flex-1">
					<h3 class="font-semibold mb-2" style="color: var(--text-primary);">
						Confirm Location
					</h3>
					<p class="text-sm mb-4" style="color: var(--text-secondary);">
						{#if !needsConfirmation}
							{#if profile?.country && profile?.currency}
								{@const countryInfo = getCountryInfo(profile.country)}
								{countryInfo?.flag || ''} {countryInfo?.name || profile.country} • {profile.currency}
							{:else}
								Location confirmed!
							{/if}
						{:else}
							Set your business location
						{/if}
					</p>
					{#if !needsConfirmation && profile?.country}
						<div class="space-y-1">
							{#if profile?.stripeAccountId}
								<p class="text-xs" style="color: var(--text-tertiary);">
									🔒 Location permanently locked
								</p>
								<p class="text-xs" style="color: var(--text-secondary);">
									Cannot be changed - payment setup was started
								</p>
							{:else}
								<p class="text-xs" style="color: var(--text-tertiary);">
									⚠️ Will be locked when payment setup starts
								</p>
								<p class="text-xs" style="color: var(--text-secondary);">
									Wrong country? <a href="/profile" class="underline hover:no-underline" style="color: var(--color-primary-600);">Update in Profile</a> before continuing
								</p>
							{/if}
						</div>
					{/if}
					{#if needsConfirmation}
						<button 
							onclick={() => onCurrencyExpandedChange(true)}
							class="button-secondary button--small"
						>
							Set Location
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Payment Setup Step -->
		<div class="rounded-xl p-6 {paymentStatus.isSetup ? 'bg-green-50 dark:bg-green-900/20' : ''}"
			style="background: {paymentStatus.isSetup ? '' : 'var(--bg-primary)'}; border: 1px solid {paymentStatus.isSetup ? 'var(--color-success-300)' : 'var(--border-primary)'};"
		>
			<div class="flex items-start gap-4">
				<div class="flex-shrink-0">
					{#if paymentStatus.isSetup}
						<CheckCircle class="h-8 w-8" style="color: var(--color-success-600);" />
					{:else}
						<CreditCard class="h-8 w-8" style="color: var(--text-tertiary);" />
					{/if}
				</div>
				<div class="flex-1">
					<h3 class="font-semibold mb-2" style="color: var(--text-primary);">
						Setup Payments
					</h3>
					<p class="text-sm mb-4" style="color: var(--text-secondary);">
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
		<div class="rounded-xl p-6 {stats.totalTours > 0 ? 'bg-green-50 dark:bg-green-900/20' : ''}"
			style="background: {stats.totalTours > 0 ? '' : 'var(--bg-primary)'}; border: 1px solid {stats.totalTours > 0 ? 'var(--color-success-300)' : 'var(--border-primary)'};"
		>
			<div class="flex items-start gap-4">
				<div class="flex-shrink-0">
					{#if stats.totalTours > 0}
						<CheckCircle class="h-8 w-8" style="color: var(--color-success-600);" />
					{:else}
						<MapPin class="h-8 w-8" style="color: var(--text-tertiary);" />
					{/if}
				</div>
				<div class="flex-1">
					<h3 class="font-semibold mb-2" style="color: var(--text-primary);">
						Create Tour
					</h3>
					<p class="text-sm mb-4" style="color: var(--text-secondary);">
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
	<div class="rounded-xl p-6 mb-8" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
		<div class="flex items-center justify-between mb-4">
			<h3 class="font-semibold" style="color: var(--text-primary);">
				Setup Progress
			</h3>
			<span class="text-sm font-medium" style="color: var(--text-secondary);">
				{stepsCompleted}/4 steps
			</span>
		</div>
		<div class="w-full rounded-full h-3" style="background: var(--bg-secondary);">
			<div 
				class="h-3 rounded-full transition-all duration-500"
				style="background: var(--color-primary-600); width: {(stepsCompleted / 4) * 100}%;"
			></div>
		</div>
	</div>

	<!-- Location Confirmation Expanded -->
	{#if needsConfirmation && currencyExpanded}
		<div class="rounded-xl p-6 mb-8" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
			<h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">
				Confirm Your Business Location
			</h3>
			<p class="text-sm mb-6" style="color: var(--text-secondary);">
				This determines your payment currency and cannot be changed after payment setup begins.
			</p>
			
			{#if saveError}
				<div class="alert-error mb-4 rounded-lg p-3">
					<p class="text-sm">{saveError}</p>
				</div>
			{/if}
			
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
						Select Country
					</label>
					<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{#each COUNTRY_LIST as country}
							<button
								onclick={() => onCountryChange(country.code)}
								class="flex items-center gap-3 p-3 text-left border rounded-lg transition-all hover:shadow-sm {selectedCountry === country.code ? 'border-primary-500 bg-primary-50' : ''}"
								style="border-color: {selectedCountry === country.code ? 'var(--color-primary-500)' : 'var(--border-primary)'}; background: {selectedCountry === country.code ? 'var(--color-primary-50)' : 'var(--bg-primary)'};"
							>
								<span class="text-xl">{country.flag}</span>
								<div class="flex-1 min-w-0">
									<p class="font-medium truncate" style="color: var(--text-primary);">
										{country.name}
									</p>
									<p class="text-xs truncate" style="color: var(--text-secondary);">
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
				
				{#if selectedCountry}
					{@const countryInfo = getCountryInfo(selectedCountry)}
					<div class="p-4 rounded-lg" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
						<h4 class="font-medium mb-2" style="color: var(--color-primary-900);">
							Selected: {countryInfo?.flag} {countryInfo?.name}
						</h4>
						<p class="text-sm" style="color: var(--color-primary-700);">
							Your payment currency will be: <strong>{countryInfo?.currency}</strong>
						</p>
						<p class="text-xs mt-2" style="color: var(--color-primary-600);">
							⚠️ This cannot be changed after payment setup begins
						</p>
					</div>
				{/if}
				
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
			</div>
		</div>
	{/if}
</div> 
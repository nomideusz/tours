<script lang="ts">
	import User from 'lucide-svelte/icons/user';
	import Mail from 'lucide-svelte/icons/mail';
	import Phone from 'lucide-svelte/icons/phone';
	import Globe from 'lucide-svelte/icons/globe';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import { SUPPORTED_CURRENCIES, type Currency } from '$lib/stores/currency.js';
	import { userCurrency } from '$lib/stores/currency.js';
	import { COUNTRY_LIST, getCountryInfo, getCurrencyForCountry } from '$lib/utils/countries.js';

	let {
		user,
		name = $bindable(),
		username = $bindable(),
		businessName = $bindable(),
		description = $bindable(),
		phone = $bindable(),
		website = $bindable(),
		location = $bindable(),
		country = $bindable(),
		currency = $bindable(),
		onSubmit,
		loading = false,
		paymentSetup = false,
		saveSuccess = false
	}: {
		user: any;
		name: string;
		username: string;
		businessName: string;
		description: string;
		phone: string;
		website: string;
		location: string;
		country: string;
		currency: string;
		onSubmit: () => void;
		loading?: boolean;
		paymentSetup?: boolean;
		saveSuccess?: boolean;
	} = $props();

	// Validation errors
	let errors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});
	
	// Get phone code based on selected country
	let phoneCode = $derived(() => {
		if (country) {
			const countryInfo = getCountryInfo(country);
			return countryInfo?.phoneCode || '';
		}
		return '';
	});
	
	// Phone placeholder with country code
	let phonePlaceholder = $derived(() => {
		const code = phoneCode();
		if (code) {
			// Generate example number based on country
			switch(code) {
				case '+1': return '+1 (555) 123-4567';
				case '+44': return '+44 20 1234 5678';
				case '+49': return '+49 30 12345678';
				case '+33': return '+33 1 23 45 67 89';
				case '+39': return '+39 06 1234 5678';
				case '+34': return '+34 91 123 45 67';
				case '+61': return '+61 2 1234 5678';
				case '+81': return '+81 3-1234-5678';
				default: return `${code} 123456789`;
			}
		}
		return '+1 (555) 123-4567';
	});
	
	// Auto-suggest country code on first focus, but allow manual override
	let hasAutoSuggested = $state(false);
	
	// Reset the flag when country changes or phone is cleared
	$effect(() => {
		if (country) {
			hasAutoSuggested = false;
		}
		// Also reset if phone is cleared so it can suggest again
		if (!phone || phone.trim() === '') {
			hasAutoSuggested = false;
		}
	});
	
	// Auto-update currency when country changes
	$effect(() => {
		if (country) {
			const countryCurrency = getCurrencyForCountry(country);
			if (countryCurrency && countryCurrency !== currency) {
				currency = countryCurrency;
				// Also update the global currency store
				userCurrency.set(currency as Currency);
			}
		}
	});

	// Validation rules
	function validateUsername(value: string): string | null {
		if (!value) return 'Username is required';
		if (value.length < 2) return 'Username must be at least 2 characters';
		if (!/^[a-zA-Z0-9-_]+$/.test(value)) return 'Username can only contain letters, numbers, hyphens, and underscores';
		return null;
	}

	function validateWebsite(value: string): string | null {
		if (!value) return null; // Optional field
		const formatted = formatWebsiteUrl(value);
		try {
			new URL(formatted);
			return null;
		} catch {
			return 'Please enter a valid website URL';
		}
	}

	function validatePhone(value: string): string | null {
		if (!value) return null; // Optional field
		
		// Treat phone field with only country code as empty (optional)
		const trimmedValue = value.trim();
		// Check if it's just a country code (e.g., "+1 ", "+44", etc.)
		if (trimmedValue.match(/^\+\d{1,4}\s*$/)) {
			return null; // Treat as empty/optional
		}
		
		// Basic phone validation - at least 10 digits total (including country code)
		const digits = value.replace(/\D/g, '');
		if (digits.length < 10) return 'Please enter a valid phone number with country code';
		// Check if it starts with + for international format
		if (!value.startsWith('+')) {
			return 'Please include country code (e.g., +1, +44, +49)';
		}
		// Validate it looks like a proper international number
		// Allow various formatting: spaces, dashes, parentheses
		const cleanedForValidation = value.replace(/[\s\-\(\)]/g, '');
		if (!cleanedForValidation.match(/^\+\d{7,15}$/)) {
			return 'Please enter a valid international phone number';
		}
		return null;
	}

	// Real-time validation
	function validateField(field: string, value: string) {
		switch (field) {
			case 'username':
				errors[field] = validateUsername(value) || '';
				break;
			case 'website':
				errors[field] = validateWebsite(value) || '';
				break;
			case 'phone':
				errors[field] = validatePhone(value) || '';
				break;
		}
	}

	// Handle blur events
	function handleBlur(field: string) {
		touched[field] = true;
		validateField(field, getFieldValue(field));
	}

	function getFieldValue(field: string): string {
		switch (field) {
			case 'username': return username;
			case 'website': return website;
			case 'phone': return phone;
			default: return '';
		}
	}

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

	function handleWebsiteBlur() {
		website = formatWebsiteUrl(website);
		handleBlur('website');
	}

	// Form submission
	function handleSubmit(e: Event) {
		e.preventDefault();
		
		// Validate all fields
		errors = {};
		const usernameError = validateUsername(username);
		const websiteError = validateWebsite(website);
		const phoneError = validatePhone(phone);
		
		if (usernameError) errors.username = usernameError;
		if (websiteError) errors.website = websiteError;
		if (phoneError) errors.phone = phoneError;
		
		// Mark all as touched
		touched = {
			username: true,
			website: true,
			phone: true
		};
		
		// If no errors, submit
		if (Object.keys(errors).length === 0) {
			onSubmit();
		}
	}
</script>

<form onsubmit={handleSubmit} novalidate class="space-y-6">
	<!-- Success Message -->
	{#if saveSuccess}
		<div class="rounded-lg p-4" style="background: var(--color-success-50); border: 1px solid var(--color-success-200);">
			<div class="flex items-center gap-2">
				<CheckCircle class="h-4 w-4 flex-shrink-0" style="color: var(--color-success-600);" />
				<div>
					<p class="text-sm font-medium" style="color: var(--color-success-900);">
						Profile updated successfully!
					</p>
					<p class="text-xs mt-0.5" style="color: var(--color-success-700);">
						Your changes have been saved.
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Username -->
	<div>
		<label for="username" class="form-label">
			Username <span class="text-red-500">*</span>
		</label>
		<div class="relative">
			<User class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
			<input
				type="text"
				id="username" 
				name="username"
				bind:value={username}
				onblur={() => handleBlur('username')}
				class="form-input pl-10"
				class:border-red-300={touched.username && errors.username}
				class:focus:border-red-500={touched.username && errors.username}
				placeholder="your-username"
			/>
		</div>
		{#if touched.username && errors.username}
			<div class="flex items-center gap-1 mt-1">
				<AlertCircle class="h-3 w-3 text-red-500" />
				<p class="text-xs text-red-600">{errors.username}</p>
			</div>
		{:else if username}
			<p class="text-xs mt-1" style="color: var(--text-secondary);">
				Profile URL: zaur.app/{username}
			</p>
		{/if}
	</div>

	<!-- Name -->
	<div>
		<label for="name" class="form-label">
			Full Name
		</label>
		<input
			type="text"
			id="name"
			name="name" 
			bind:value={name}
			class="form-input"
			placeholder="John Doe"
		/>
	</div>

	<!-- Email (Read-only) -->
	<div>
		<label for="email" class="form-label">
			Email Address
		</label>
		<div class="relative">
			<Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
			<input
				type="email"
				id="email"
				name="email"
				value={user?.email || ''}
				class="form-input pl-10"
				readonly
				disabled
			/>
		</div>
		<p class="text-xs mt-1" style="color: var(--text-tertiary);">
			Email cannot be changed
		</p>
	</div>

	<!-- Business Name -->
	<div>
		<label for="businessName" class="form-label">
			Business Name
		</label>
		<input
			type="text"
			id="businessName"
			name="businessName" 
			bind:value={businessName}
			class="form-input"
			placeholder="Your Tour Company"
		/>
	</div>

	<!-- Description -->
	<div>
		<label for="description" class="form-label">
			About You
		</label>
		<textarea
			id="description"
			name="description" 
			bind:value={description}
			class="form-input"
			placeholder="Tell your customers about yourself and your tours..."
			rows="4"
		></textarea>
		<p class="text-xs mt-1" style="color: var(--text-tertiary);">
			This will appear on your public profile
		</p>
	</div>

	<!-- Location Section -->
	<div class="pt-6 border-t" style="border-color: var(--border-primary);">
		<h3 class="text-sm font-medium mb-4" style="color: var(--text-primary);">Location & Currency</h3>
		
		<div class="grid gap-4 sm:grid-cols-2">
			<!-- Country -->
			<div>
				<label for="country" class="form-label">
					Country
				</label>
				<div class="relative">
					<MapPin class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
					<select
						id="country"
						name="country"
						class="form-select pl-10 cursor-pointer"
						bind:value={country}
						disabled={paymentSetup}
					>
						<option value="">Select country</option>
						{#each COUNTRY_LIST as country}
							<option value={country.code}>
								{country.flag} {country.name}
							</option>
						{/each}
					</select>
				</div>
				{#if paymentSetup}
					<p class="text-xs mt-1" style="color: var(--color-warning-600);">
						Country cannot be changed after payment setup starts
					</p>
				{/if}
			</div>

			<!-- Currency -->
			<div>
				<label for="currency" class="form-label">
					Currency
				</label>
				{#if country}
					{@const countryCurrency = getCurrencyForCountry(country)}
					{@const currencyInfo = SUPPORTED_CURRENCIES[countryCurrency as Currency]}
					<div class="form-input" style="background: var(--bg-tertiary); cursor: not-allowed;">
						{currencyInfo.symbol} {currencyInfo.code} - {currencyInfo.name}
					</div>
					<input type="hidden" name="currency" value={currency} />
					<p class="text-xs mt-1" style="color: var(--text-secondary);">
						{#if paymentSetup}
							Currency locked with country selection
						{:else}
							Currency is determined by your country selection
						{/if}
					</p>
				{:else}
					<div class="form-input" style="background: var(--bg-tertiary); cursor: not-allowed; color: var(--text-tertiary);">
						Select a country first
					</div>
					<p class="text-xs mt-1" style="color: var(--text-tertiary);">
						Currency will be set based on your country
					</p>
				{/if}
			</div>
		</div>

		<!-- Location/Address -->
		<div class="mt-4">
			<label for="location" class="form-label">
				City/Location
			</label>
			<div class="relative">
				<MapPin class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
				<input
					type="text"
					id="location"
					name="location"
					bind:value={location}
					class="form-input pl-10"
					placeholder="Berlin, Germany"
				/>
			</div>
			<p class="text-xs mt-1" style="color: var(--text-tertiary);">
				Helps customers know where you operate
			</p>
		</div>
		

	</div>

	<!-- Contact Section -->
	<div class="pt-6 border-t" style="border-color: var(--border-primary);">
		<h3 class="text-sm font-medium mb-4" style="color: var(--text-primary);">Contact Information</h3>
		
		<div class="grid gap-4 sm:grid-cols-2">
			<!-- Phone -->
			<div>
				<label for="phone" class="form-label">
					Phone Number
				</label>
				<div class="relative">
					<Phone class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
					<input
						type="tel"
						id="phone"
						name="phone" 
						bind:value={phone}
						onfocus={() => {
							const code = phoneCode();
							// Auto-suggest country code on first focus if field is empty
							if (code && !hasAutoSuggested && (!phone || phone.trim() === '')) {
								phone = code + ' ';
								hasAutoSuggested = true;
								// Place cursor at end after DOM updates
								setTimeout(() => {
									const input = document.getElementById('phone') as HTMLInputElement;
									if (input) {
										input.setSelectionRange(input.value.length, input.value.length);
									}
								}, 0);
							}
						}}
						onblur={() => handleBlur('phone')}
						class="form-input pl-10"
						class:border-red-300={touched.phone && errors.phone}
						class:focus:border-red-500={touched.phone && errors.phone}
						placeholder={phonePlaceholder()}
					/>
				</div>
				{#if touched.phone && errors.phone}
					<div class="flex items-center gap-1 mt-1">
						<AlertCircle class="h-3 w-3 text-red-500" />
						<p class="text-xs text-red-600">{errors.phone}</p>
					</div>
				{:else}
					<p class="text-xs mt-1" style="color: var(--text-tertiary);">
						{#if phoneCode() && country}
							Will suggest {phoneCode()} based on your country • You can override with any code below
						{:else}
							Include country code for payment processing
						{/if}
					</p>
				{/if}
				<details class="mt-2">
					<summary class="text-xs cursor-pointer" style="color: var(--text-secondary);">
						Use a different country code
					</summary>
					<div class="mt-1 flex flex-wrap gap-1">
						{#each ['+1 US/CA', '+44 UK', '+49 DE', '+33 FR', '+39 IT', '+34 ES', '+61 AU', '+81 JP'] as code}
							<button
								type="button"
								onclick={(e) => {
									e.preventDefault();
									// Extract country code
									const countryCode = code.split(' ')[0];
									
									// Set phone to country code (overrides any auto-suggestion)
									phone = countryCode + ' ';
									hasAutoSuggested = true; // Prevent further auto-suggestions
									
									// Focus the phone input and place cursor at end
									const phoneInput = document.getElementById('phone') as HTMLInputElement;
									if (phoneInput) {
										phoneInput.focus();
										setTimeout(() => {
											phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
										}, 0);
									}
								}}
								class="country-code-button"
							>
								{code}
							</button>
						{/each}
					</div>
				</details>
			</div>

			<!-- Website -->
			<div>
				<label for="website" class="form-label">
					Website
				</label>
				<div class="relative">
					<Globe class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
					<input
						type="text"
						id="website"
						name="website" 
						bind:value={website}
						onblur={handleWebsiteBlur}
						class="form-input pl-10 pr-10"
						class:border-red-300={touched.website && errors.website}
						class:focus:border-red-500={touched.website && errors.website}
						placeholder="www.example.com"
					/>
					{#if website && !errors.website}
						<a 
							href={website} 
							target="_blank" 
							rel="noopener noreferrer"
							class="absolute right-3 top-1/2 transform -translate-y-1/2"
							style="color: var(--color-primary-600);"
							title="Visit website"
						>
							<ExternalLink class="h-4 w-4" />
						</a>
					{/if}
				</div>
				{#if touched.website && errors.website}
					<div class="flex items-center gap-1 mt-1">
						<AlertCircle class="h-3 w-3 text-red-500" />
						<p class="text-xs text-red-600">{errors.website}</p>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Save Button -->
	<div class="flex justify-end pt-6">
		<button
			type="submit"
			disabled={loading}
			class="button-primary"
		>
			{#if loading}
				<span class="flex items-center gap-2">
					<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
					Saving...
				</span>
			{:else}
				Save Changes
			{/if}
		</button>
	</div>
</form>

<style>
	.country-code-button {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		transition: all 150ms ease;
		background: var(--bg-secondary);
		border: 1px solid var(--border-secondary);
		color: var(--text-primary);
		cursor: pointer;
		font-family: inherit;
	}
	
	.country-code-button:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-primary);
		color: var(--text-primary);
	}
	
	.country-code-button:active {
		transform: scale(0.98);
	}
</style> 
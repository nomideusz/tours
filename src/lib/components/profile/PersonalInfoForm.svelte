<script lang="ts">
	import User from 'lucide-svelte/icons/user';
	import Mail from 'lucide-svelte/icons/mail';
	import Phone from 'lucide-svelte/icons/phone';
	import Globe from 'lucide-svelte/icons/globe';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import { SUPPORTED_CURRENCIES, type Currency } from '$lib/stores/currency.js';
	import { userCurrency } from '$lib/stores/currency.js';

	let {
		user,
		name = $bindable(),
		username = $bindable(),
		businessName = $bindable(),
		description = $bindable(),
		phone = $bindable(),
		website = $bindable(),
		country = $bindable(),
		currency = $bindable(),
		onSubmit,
		loading = false
	}: {
		user: any;
		name: string;
		username: string;
		businessName: string;
		description: string;
		phone: string;
		website: string;
		country: string;
		currency: string;
		onSubmit: () => void;
		loading?: boolean;
	} = $props();

	// Country code mapping
	const countryPhoneCodes: Record<string, string> = {
		'US': '+1',
		'CA': '+1',
		'GB': '+44',
		'UK': '+44',
		'DE': '+49',
		'FR': '+33',
		'IT': '+39',
		'ES': '+34',
		'NL': '+31',
		'BE': '+32',
		'AT': '+43',
		'CH': '+41',
		'SE': '+46',
		'NO': '+47',
		'DK': '+45',
		'FI': '+358',
		'PL': '+48',
		'CZ': '+420',
		'PT': '+351',
		'IE': '+353',
		'GR': '+30',
		'LU': '+352',
		'MT': '+356',
		'CY': '+357',
		'SK': '+421',
		'SI': '+386',
		'EE': '+372',
		'LV': '+371',
		'LT': '+370',
		'JP': '+81',
		'AU': '+61'
	};

	// Get country code for phone number
	function getCountryCode(countryCode: string): string {
		return countryPhoneCodes[countryCode] || '+1';
	}

	// Simplified phone number handling - allow free-form input
	function handlePhoneInput(event: Event) {
		const target = event.target as HTMLInputElement;
		// Just update the value without complex formatting
		phone = target.value;
	}

	// Auto-add country code when phone field is focused and empty
	function handlePhoneFocus(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!phone && country) {
			const countryCode = getCountryCode(country);
			phone = `${countryCode} `;
			// Set cursor after the country code
			setTimeout(() => {
				target.setSelectionRange(phone.length, phone.length);
			}, 0);
		}
	}

	// Get placeholder based on country
	let phonePlaceholder = $derived(() => {
		if (country) {
			const countryCode = getCountryCode(country);
			return `${countryCode} (555) 123-4567`;
		}
		return '+1 (555) 123-4567';
	});

	// Website URL formatting and validation
	function formatWebsiteUrl(value: string): string {
		if (!value) return '';
		
		// Remove whitespace
		value = value.trim();
		
		// Add https:// if no protocol is specified
		if (value && !value.match(/^https?:\/\//)) {
			return `https://${value}`;
		}
		
		return value;
	}

	function handleWebsiteBlur(event: Event) {
		const target = event.target as HTMLInputElement;
		website = formatWebsiteUrl(target.value);
		websiteBlurred = true;
	}

	// Website validation
	function isValidWebsite(url: string): boolean {
		if (!url) return true; // Empty is valid
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	// Only show validation feedback after user has interacted with the field
	let websiteBlurred = $state(false);
	let websiteValid = $derived(isValidWebsite(website));
	let showWebsiteValidation = $derived(websiteBlurred && website.length > 0);
</script>

<div class="pb-6 border-b" style="border-color: var(--border-primary);">
	<div class="flex items-center justify-between mb-4">
		<h3 class="font-medium" style="color: var(--text-primary);">Personal Information</h3>
	</div>

	<form onsubmit={(e) => { e.preventDefault(); onSubmit(); }}>
		<div class="space-y-4">
			<!-- Username -->
			<div>
				<label for="username" class="form-label">
					Username
				</label>
				<div class="relative">
					<User class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
					<input
						type="text"
						id="username" 
						name="username"
						bind:value={username}
						class="form-input pl-10"
						placeholder="Enter your username"
						required
					/>
				</div>
				{#if username}
					<p class="text-sm text-gray-600 mt-1">
						Your personal URL: <a href="/{username}" class="text-blue-600 hover:text-blue-800" target="_blank">zaur.app/{username}</a>
					</p>
				{/if}
			</div>

			<!-- Name -->
			<div>
				<label for="name" class="form-label">
					Full Name
				</label>
				<div class="relative">
					<User class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
					<input
						type="text"
						id="name"
						name="name" 
						bind:value={name}
						class="form-input pl-10"
						placeholder="Enter your full name"
					/>
				</div>
			</div>

			<!-- Email -->
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
						placeholder="Enter your email"
						required
						readonly
					/>
				</div>
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
					placeholder="Enter your business name"
				/>
			</div>

			<!-- Description -->
			<div>
				<label for="description" class="form-label">
					Description
				</label>
				<textarea
					id="description"
					name="description" 
					bind:value={description}
					class="form-input"
					placeholder="Tell us about yourself or your business"
					rows="3"
				></textarea>
			</div>

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
						oninput={handlePhoneInput}
						onfocus={handlePhoneFocus}
						class="form-input pl-10"
						placeholder={phonePlaceholder()}
						autocomplete="tel"
					/>
				</div>
				<p class="text-xs mt-1" style="color: var(--text-tertiary);">
					{#if country}
						Country code {getCountryCode(country)} will be added automatically when you focus the field
					{:else}
						Enter your phone number with country code for international format
					{/if}
				</p>
			</div>

			<!-- Website -->
			<div>
				<label for="website" class="form-label">
					Website
				</label>
				<div class="relative">
					<Globe class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style="color: var(--text-tertiary);" />
					<input
						type="url"
						id="website"
						name="website" 
						bind:value={website}
						onblur={handleWebsiteBlur}
						class="form-input pl-10 pr-10"
						class:border-red-300={showWebsiteValidation && !websiteValid}
						class:border-green-300={showWebsiteValidation && websiteValid}
						placeholder="example.com"
						autocomplete="url"
					/>
					{#if website && websiteValid}
						<a 
							href={website} 
							target="_blank" 
							rel="noopener noreferrer"
							class="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
							title="Visit website"
						>
							<ExternalLink class="h-4 w-4" />
						</a>
					{/if}
				</div>
				<div class="flex items-center justify-between mt-1">
					<p class="text-xs" style="color: var(--text-tertiary);">
						{#if !website}
							Enter your website URL (https:// will be added automatically)
						{:else if showWebsiteValidation && websiteValid}
							<span style="color: var(--color-success);">✓ Valid website URL</span>
						{:else if showWebsiteValidation && !websiteValid}
							<span style="color: var(--color-error);">⚠ Please enter a valid website URL</span>
						{:else}
							Enter your website URL (https:// will be added automatically)
						{/if}
					</p>
				</div>
			</div>

			<!-- Country -->
			<div>
				<label for="country" class="form-label">
					Country
				</label>
				<select
					id="country"
					name="country"
					class="form-select cursor-pointer"
					bind:value={country}
				>
					<option value="">Select your country</option>
					<option value="AT">Austria</option>
					<option value="BE">Belgium</option>
					<option value="DE">Germany</option>
					<option value="DK">Denmark</option>
					<option value="ES">Spain</option>
					<option value="FI">Finland</option>
					<option value="FR">France</option>
					<option value="GB">United Kingdom</option>
					<option value="IE">Ireland</option>
					<option value="IT">Italy</option>
					<option value="NL">Netherlands</option>
					<option value="NO">Norway</option>
					<option value="PL">Poland</option>
					<option value="PT">Portugal</option>
					<option value="SE">Sweden</option>
					<option value="CH">Switzerland</option>
				</select>
			</div>

			<!-- Currency -->
			<div>
				<label for="currency" class="form-label">
					Preferred Currency
				</label>
				<select
					id="currency"
					name="currency"
					class="form-select cursor-pointer"
					bind:value={currency}
					onchange={() => userCurrency.set(currency as Currency)}
				>
					{#each Object.values(SUPPORTED_CURRENCIES) as currencyInfo}
						<option value={currencyInfo.code}>
							{currencyInfo.symbol} {currencyInfo.name} ({currencyInfo.code})
						</option>
					{/each}
				</select>
				<p class="text-xs mt-1" style="color: var(--text-tertiary);">
					This will be used for all price displays throughout the app
				</p>
			</div>
		</div>
	</form>
</div> 
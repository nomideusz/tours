<script lang="ts">
	import User from 'lucide-svelte/icons/user';
	import Mail from 'lucide-svelte/icons/mail';
	import Phone from 'lucide-svelte/icons/phone';
	import Globe from 'lucide-svelte/icons/globe';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
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
		loading = false,
		paymentSetup = false
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
		paymentSetup?: boolean;
	} = $props();

	// Validation errors
	let errors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});

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
		// Basic phone validation - at least 10 digits
		const digits = value.replace(/\D/g, '');
		if (digits.length < 10) return 'Please enter a valid phone number';
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
						<option value="US">United States</option>
						<option value="CA">Canada</option>
						<option value="AU">Australia</option>
						<option value="JP">Japan</option>
					</select>
				</div>
				{#if paymentSetup}
					<p class="text-xs mt-1" style="color: var(--color-warning);">
						Locked after payment setup
					</p>
				{/if}
			</div>

			<!-- Currency -->
			<div>
				<label for="currency" class="form-label">
					Currency
				</label>
				<select
					id="currency"
					name="currency"
					class="form-select cursor-pointer"
					bind:value={currency}
					onchange={() => userCurrency.set(currency as Currency)}
					disabled={paymentSetup}
				>
					{#each Object.values(SUPPORTED_CURRENCIES) as currencyInfo}
						<option value={currencyInfo.code}>
							{currencyInfo.symbol} {currencyInfo.code}
						</option>
					{/each}
				</select>
				{#if paymentSetup}
					<p class="text-xs mt-1" style="color: var(--color-warning);">
						Locked with payment account
					</p>
				{/if}
			</div>
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
						onblur={() => handleBlur('phone')}
						class="form-input pl-10"
						class:border-red-300={touched.phone && errors.phone}
						class:focus:border-red-500={touched.phone && errors.phone}
						placeholder="+1 (555) 123-4567"
					/>
				</div>
				{#if touched.phone && errors.phone}
					<div class="flex items-center gap-1 mt-1">
						<AlertCircle class="h-3 w-3 text-red-500" />
						<p class="text-xs text-red-600">{errors.phone}</p>
					</div>
				{/if}
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
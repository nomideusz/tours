<script lang="ts">
	import User from 'lucide-svelte/icons/user';
	import Mail from 'lucide-svelte/icons/mail';
	import Upload from 'lucide-svelte/icons/upload';
	import X from 'lucide-svelte/icons/x';
	import Save from 'lucide-svelte/icons/save';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import { SUPPORTED_CURRENCIES, type Currency } from '$lib/stores/currency.js';

	// Props
	interface Props {
		user: any;
		name: string;
		username: string;
		businessName: string;
		description: string;
		phone: string;
		website: string;
		country: string;
		currency: string;
		profileLoading: boolean;
		avatarLoadError: boolean;
		avatarSaved: boolean;
		personalInfoSaved: boolean;
		onUpdatePersonalInfo: () => void;
		onAvatarSelect: (event: Event) => void;
		onRemoveAvatar: () => void;
	}

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
		profileLoading,
		avatarLoadError,
		avatarSaved,
		personalInfoSaved,
		onUpdatePersonalInfo,
		onAvatarSelect,
		onRemoveAvatar
	}: Props = $props();

	let selectedAvatar: File | null = $state(null);
	let avatarPreview = $state('');
	let avatarInputElement: HTMLInputElement | undefined = $state();
</script>

<div class="rounded-xl" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	<div class="p-4 border-b" style="border-color: var(--border-primary);">
		<div class="flex items-center gap-3">
			<div class="p-2 rounded-lg" style="background: var(--color-primary-50);">
				<User class="h-4 w-4" style="color: var(--color-primary-600);" />
			</div>
			<div>
				<h2 class="font-semibold" style="color: var(--text-primary);">Personal Information</h2>
				<p class="text-sm" style="color: var(--text-secondary);">Update your profile details</p>
			</div>
		</div>
	</div>
	<div class="p-4 sm:p-6 space-y-8">
		<form onsubmit={(e) => { e.preventDefault(); onUpdatePersonalInfo(); }}>
			<div class="space-y-6">
				<!-- Avatar Section -->
				<div class="pb-6 border-b" style="border-color: var(--border-primary);">
					<div class="flex items-center justify-between mb-4">
						<h3 class="font-medium" style="color: var(--text-primary);">Profile Avatar</h3>
						{#if avatarSaved}
							<div class="flex items-center gap-2 text-sm" style="color: var(--color-success);">
								<CheckCircle class="h-4 w-4" />
								Avatar updated!
							</div>
						{/if}
					</div>

					<div class="space-y-4">
						<div class="flex items-start gap-4">
							<!-- Current Avatar Display -->
							<div class="flex-shrink-0">
								<div class="w-20 h-20 rounded-full overflow-hidden" style="background: var(--bg-secondary); border: 2px solid var(--border-primary);">
									{#if avatarPreview}
										<img src={avatarPreview} alt="Avatar preview" class="w-full h-full object-cover" />
									{:else if user?.avatar && !avatarLoadError}
										<img 
											src={user.avatar} 
											alt="Current avatar" 
											class="w-full h-full object-cover"
											onerror={() => avatarLoadError = true}
										/>
									{:else}
										<div class="w-full h-full flex items-center justify-center">
											<User class="h-8 w-8" style="color: var(--text-tertiary);" />
										</div>
									{/if}
								</div>
							</div>
							
							<!-- Upload Controls -->
							<div class="flex-1 space-y-3">
								<div class="flex gap-2">
									<input
										type="file"
										id="avatar"
										name="avatar"
										accept="image/jpeg,image/jpg,image/png,image/webp"
										class="hidden"
										onchange={onAvatarSelect}
										bind:this={avatarInputElement}
									/>
									<label
										for="avatar"
										class="button-secondary button--gap button--small cursor-pointer"
									>
										<Upload class="h-3 w-3" />
										Choose Avatar
									</label>
									
									{#if selectedAvatar || avatarPreview}
										<button
											type="button"
											onclick={onRemoveAvatar}
											class="button--danger button--gap button--small"
										>
											<X class="h-3 w-3" />
											Remove
										</button>
									{/if}
								</div>
								
								<p class="text-xs" style="color: var(--text-tertiary);">
									Upload a square image (JPEG, PNG, WebP) up to 2MB. Automatically saved when selected.
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Form Fields -->
				<div class="space-y-4">
					<!-- Username -->
					<div>
						<label for="username" class="form-label">Username</label>
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
						<label for="name" class="form-label">Full Name</label>
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
						<label for="email" class="form-label">Email Address</label>
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

					<!-- Other form fields... -->
					<div>
						<label for="country" class="form-label">Country</label>
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

					<div>
						<label for="currency" class="form-label">Preferred Currency</label>
						<select
							id="currency"
							name="currency"
							class="form-select cursor-pointer"
							bind:value={currency}
						>
							{#each Object.values(SUPPORTED_CURRENCIES) as currencyInfo}
								<option value={currencyInfo.code}>
									{currencyInfo.symbol} {currencyInfo.name} ({currencyInfo.code})
								</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- Submit Button -->
				<div class="flex items-center justify-end gap-3 pt-6 mt-8" style="border-top: 1px solid var(--border-primary);">
					{#if personalInfoSaved}
						<div class="flex items-center gap-2 text-sm" style="color: var(--color-success);">
							<CheckCircle class="h-4 w-4" />
							Profile updated successfully!
						</div>
					{/if}
					<button
						type="submit"
						disabled={profileLoading}
						class="button-primary button--gap"
					>
						{#if profileLoading}
							<LoadingSpinner size="small" variant="white" text="Saving..." />
						{:else if personalInfoSaved}
							<CheckCircle class="h-4 w-4" />
							Saved!
						{:else}
							<Save class="h-4 w-4" />
							Save Changes
						{/if}
					</button>
				</div>
			</div>
		</form>
	</div>
</div> 
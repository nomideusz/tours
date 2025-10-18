<script lang="ts">
	import { authenticateWithOAuth2, oauth2ProviderInfo, type OAuth2Provider } from '$lib/oauth2.js';
	import Loader from 'lucide-svelte/icons/loader';
	import { trackAuthEvent } from '$lib/utils/umami-tracking.js';

	// Props
	let { 
		provider, 
		disabled = false,
		size = 'default',
		variant = 'default',
		redirectTo
	} = $props<{
		provider: OAuth2Provider;
		disabled?: boolean;
		size?: 'small' | 'default' | 'large';
		variant?: 'default' | 'outline';
		redirectTo?: string;
	}>();

	// State
	let isLoading = $state(false);

	// Get provider config
	const providerConfig = oauth2ProviderInfo[provider as keyof typeof oauth2ProviderInfo];

	// Handle OAuth2 authentication
	async function handleOAuth2Login() {
		if (isLoading || disabled) return;
		
		isLoading = true;
		try {
			// Track OAuth login attempt
			trackAuthEvent('login', provider, true);
			await authenticateWithOAuth2(provider, redirectTo);
		} finally {
			isLoading = false;
		}
	}

	// Size classes
	const sizeClasses = {
		small: 'py-2 px-3 text-sm',
		default: 'py-3 px-4 text-sm',
		large: 'py-4 px-6 text-base'
	};

	// Variant classes
	const variantClasses = {
		default: `text-white ${providerConfig.color}`,
		outline: `text-gray-700 bg-white border border-gray-300 hover:bg-gray-50`
	} as const;
</script>

<button
	type="button"
	onclick={handleOAuth2Login}
	disabled={isLoading || disabled}
	class="w-full flex justify-center items-center gap-3 rounded-lg shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors {sizeClasses[size as keyof typeof sizeClasses]} {variantClasses[variant as keyof typeof variantClasses]}"
>
	{#if isLoading}
		<Loader size={16} class="animate-spin" />
		<span>Connecting...</span>
	{:else}
		<span class="text-lg">{providerConfig.icon}</span>
		<span>Continue with {providerConfig.name}</span>
	{/if}
</button> 
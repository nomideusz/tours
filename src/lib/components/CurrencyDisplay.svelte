<script lang="ts">
	import { userCurrency, SUPPORTED_CURRENCIES } from '$lib/stores/currency.js';
	
	let { 
		amount, 
		compact = false, 
		showCents = true,
		class: className = '' 
	}: {
		amount: number | string;
		compact?: boolean;
		showCents?: boolean;
		class?: string;
	} = $props();
	
	// Reactive currency formatting
	let formattedAmount = $derived(() => {
		const num = typeof amount === 'string' ? parseFloat(amount) : amount;
		
		if (isNaN(num)) {
			const currencyInfo = SUPPORTED_CURRENCIES[$userCurrency];
			return `${currencyInfo.symbol}0${currencyInfo.decimals > 0 ? '.00' : ''}`;
		}
		
		const currencyInfo = SUPPORTED_CURRENCIES[$userCurrency];
		
		if (compact && num >= 1000) {
			// Show compact notation for large numbers
			if (num >= 1000000) {
				return `${currencyInfo.symbol}${(num / 1000000).toFixed(1)}M`;
			} else if (num >= 1000) {
				return `${currencyInfo.symbol}${(num / 1000).toFixed(1)}K`;
			}
		}
		
		if (currencyInfo.decimals === 0 || !showCents) {
			return `${currencyInfo.symbol}${Math.round(num)}`;
		}
		
		return `${currencyInfo.symbol}${num.toFixed(currencyInfo.decimals)}`;
	});
</script>

<span class={className}>{formattedAmount}</span> 
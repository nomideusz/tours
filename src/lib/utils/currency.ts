import { get } from 'svelte/store';
import { userCurrency, SUPPORTED_CURRENCIES, type Currency } from '$lib/stores/currency.js';
import { derived, type Readable } from 'svelte/store';

// Global reactive currency store for use in components
export const globalCurrencyFormatter = derived(userCurrency, ($currency) => {
	return (amount: number | string, options?: {
		compact?: boolean;
		showCents?: boolean;
	}) => {
		const num = typeof amount === 'string' ? parseFloat(amount) : amount;
		
		if (isNaN(num)) {
			const currencyInfo = SUPPORTED_CURRENCIES[$currency];
			return `${currencyInfo.symbol}0${currencyInfo.decimals > 0 ? '.00' : ''}`;
		}
		
		const currencyInfo = SUPPORTED_CURRENCIES[$currency];
		const { compact = false, showCents = true } = options || {};
		
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
	};
});

/**
 * Format a number as currency using user's preferred currency
 */
export function formatCurrency(amount: number | string, options?: {
	compact?: boolean;
	showCents?: boolean;
	currency?: Currency;
}): string {
	const num = typeof amount === 'string' ? parseFloat(amount) : amount;
	
	if (isNaN(num)) {
		const currency = options?.currency || get(userCurrency);
		const currencyInfo = SUPPORTED_CURRENCIES[currency];
		return `${currencyInfo.symbol}0${currencyInfo.decimals > 0 ? '.00' : ''}`;
	}
	
	const currency = options?.currency || get(userCurrency);
	const currencyInfo = SUPPORTED_CURRENCIES[currency];
	const { compact = false, showCents = true } = options || {};
	
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
}

/**
 * Create a reactive currency formatter for Svelte components
 * This will automatically update when the user changes their currency preference
 */
export function createReactiveCurrencyFormatter(options?: {
	compact?: boolean;
	showCents?: boolean;
}): Readable<(amount: number | string) => string> {
	return derived(userCurrency, ($currency) => {
		return (amount: number | string) => {
			return formatCurrency(amount, { ...options, currency: $currency });
		};
	});
}

/**
 * Format a number as currency in Euros (legacy function for backward compatibility)
 * Now uses the user's preferred currency for global compatibility
 */
export function formatEuro(amount: number | string): string {
	return formatCurrency(amount);
}

/**
 * Parse a currency string to a number
 */
export function parseCurrency(currency: string): number {
	// Remove currency symbols and parse
	const cleaned = currency.replace(/[€$£¥,\s]/g, '');
	const num = parseFloat(cleaned);
	return isNaN(num) ? 0 : num;
}

/**
 * Format currency with explicit currency code
 */
export function formatCurrencyWithCode(amount: number | string, currency: Currency): string {
	return formatCurrency(amount, { currency });
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: Currency): string {
	return SUPPORTED_CURRENCIES[currency]?.symbol || '€';
}

/**
 * Get the current user's currency symbol reactively
 */
export const currentCurrencySymbol = derived(userCurrency, ($currency) => {
	return SUPPORTED_CURRENCIES[$currency]?.symbol || '€';
});

/**
 * Create reactive currency store for a specific amount
 * Useful for displaying amounts that should update when currency changes
 */
export function createReactiveCurrency(amount: number | string, options?: {
	compact?: boolean;
	showCents?: boolean;
}): Readable<string> {
	return derived(userCurrency, ($currency) => {
		return formatCurrency(amount, { ...options, currency: $currency });
	});
}

/**
 * Format currency using tour owner's currency preference (for public routes)
 * Falls back to EUR if no currency is provided
 */
export function formatTourOwnerCurrency(amount: number | string, ownerCurrency?: string): string {
	const currency = (ownerCurrency && ownerCurrency in SUPPORTED_CURRENCIES) 
		? ownerCurrency as Currency 
		: 'EUR';
	return formatCurrency(amount, { currency });
} 
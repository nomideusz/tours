import { writable, derived, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import { CURRENCY_DATA, getCurrencyInfo, type Currency, type CurrencyInfo } from '$lib/utils/countries.js';

// Re-export types from countries module for consistency
export type { Currency, CurrencyInfo } from '$lib/utils/countries.js';

// Re-export currency data for backward compatibility
export const SUPPORTED_CURRENCIES = CURRENCY_DATA;

// Create the currency store
function createCurrencyStore() {
	const { subscribe, set, update } = writable<Currency>('EUR');

	// Get initial currency from localStorage or default to EUR
	const getInitialCurrency = (): Currency => {
		if (!browser) return 'EUR';
		
		const stored = localStorage.getItem('userCurrency');
		if (stored && stored in CURRENCY_DATA) {
			return stored as Currency;
		}
		return 'EUR';
	};

	// Initialize with stored value
	if (browser) {
		set(getInitialCurrency());
	}

	return {
		subscribe,
		set: (currency: Currency) => {
			if (browser) {
				localStorage.setItem('userCurrency', currency);
			}
			set(currency);
		},
		update,
		// Helper method to get currency info
		getInfo: getCurrencyInfo
	};
}

export const userCurrency = createCurrencyStore();

// Derived store for current currency info
export const currentCurrencyInfo: Readable<CurrencyInfo> = derived(
	userCurrency,
	($currency) => getCurrencyInfo($currency)
);

// Helper function to set user currency from server data
export function setUserCurrencyFromServer(currency: string) {
	if (currency && currency in CURRENCY_DATA) {
		userCurrency.set(currency as Currency);
	}
} 
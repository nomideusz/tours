import { writable, derived, type Readable } from 'svelte/store';
import { browser } from '$app/environment';

export type Currency = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK';

export interface CurrencyInfo {
	code: Currency;
	symbol: string;
	name: string;
	decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<Currency, CurrencyInfo> = {
	EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
	USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
	GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
	JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
	CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
	AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
	CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2 },
	SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimals: 2 },
	NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', decimals: 2 },
	DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', decimals: 2 },
	PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Złoty', decimals: 2 },
	CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', decimals: 2 }
};

// Create the currency store
function createCurrencyStore() {
	const { subscribe, set, update } = writable<Currency>('EUR');

	// Get initial currency from localStorage or default to EUR
	const getInitialCurrency = (): Currency => {
		if (!browser) return 'EUR';
		
		const stored = localStorage.getItem('userCurrency');
		if (stored && stored in SUPPORTED_CURRENCIES) {
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
		getInfo: (currency: Currency): CurrencyInfo => SUPPORTED_CURRENCIES[currency]
	};
}

export const userCurrency = createCurrencyStore();

// Derived store for current currency info
export const currentCurrencyInfo: Readable<CurrencyInfo> = derived(
	userCurrency,
	($currency) => SUPPORTED_CURRENCIES[$currency]
);

// Helper function to set user currency from server data
export function setUserCurrencyFromServer(currency: string) {
	if (currency && currency in SUPPORTED_CURRENCIES) {
		userCurrency.set(currency as Currency);
	}
} 
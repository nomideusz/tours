import { getStripeLocale as getStripeLocaleFromCountries } from './countries.js';

// Re-export the getStripeLocale function from countries.ts
export const getStripeLocale = getStripeLocaleFromCountries;

// Keep this for backward compatibility if needed
export const countryToStripeLocale = {
  DEFAULT: 'en-US'
}; 
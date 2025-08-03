import { getCountryByLocale, getCountryByTimezone } from './countries.js';

/**
 * Default country if we can't detect anything else
 * Use Poland since Zaur is Poland-registered
 */
const DEFAULT_COUNTRY = 'PL';

/**
 * Detects the user's probable country based on browser information
 * Uses a combination of locale and timezone to make an educated guess
 * 
 * @returns {string} Two-letter country code (ISO 3166-1 alpha-2)
 */
export function detectCountry(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_COUNTRY; // Server-side rendering fallback
  }
  
  // Try to detect from browser language
  const browserLanguages = navigator.languages || [navigator.language];
  
  for (const language of browserLanguages) {
    const languageCode = language.split('-')[0].toLowerCase();
    const fullCode = language.toLowerCase();
    
    // Check for exact match first
    const countryByFullCode = getCountryByLocale(fullCode);
    if (countryByFullCode) {
      return countryByFullCode.code;
    }
    
    // Then check for language code only
    const countryByLangCode = getCountryByLocale(languageCode);
    if (countryByLangCode) {
      return countryByLangCode.code;
    }
  }
  
  // Try to detect from timezone
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryByTimezone = getCountryByTimezone(timezone);
    if (countryByTimezone) {
      return countryByTimezone.code;
    }
  } catch (e) {
    // Timezone detection failed, continue with default
  }
  
  // Default fallback
  return DEFAULT_COUNTRY;
} 
/**
 * Map common browser locales to country codes
 */
const LOCALE_TO_COUNTRY: Record<string, string> = {
  'de': 'DE', // German
  'en-GB': 'GB', // British English
  'en-IE': 'IE', // Irish English
  'fr': 'FR', // French
  'it': 'IT', // Italian
  'es': 'ES', // Spanish
  'pt': 'PT', // Portuguese
  'nl': 'NL', // Dutch
  'pl': 'PL', // Polish
  'da': 'DK', // Danish
  'sv': 'SE', // Swedish
  'no': 'NO', // Norwegian
  'fi': 'FI', // Finnish
  'at': 'AT', // Austrian German
  'ch': 'CH', // Swiss
  'be': 'BE'  // Belgium
};

/**
 * Map timezones to likely country codes
 */
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Europe/Berlin': 'DE',
  'Europe/London': 'GB',
  'Europe/Dublin': 'IE',
  'Europe/Paris': 'FR',
  'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES',
  'Europe/Lisbon': 'PT',
  'Europe/Amsterdam': 'NL',
  'Europe/Warsaw': 'PL',
  'Europe/Copenhagen': 'DK',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Helsinki': 'FI',
  'Europe/Vienna': 'AT',
  'Europe/Zurich': 'CH',
  'Europe/Brussels': 'BE'
};

/**
 * Default country if we can't detect anything else
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
    if (LOCALE_TO_COUNTRY[language]) {
      return LOCALE_TO_COUNTRY[language];
    }
    
    // Then check for language code only
    if (LOCALE_TO_COUNTRY[languageCode]) {
      return LOCALE_TO_COUNTRY[languageCode];
    }
  }
  
  // Try to detect from timezone
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONE_TO_COUNTRY[timezone]) {
      return TIMEZONE_TO_COUNTRY[timezone];
    }
  } catch (e) {
    // Timezone detection failed, continue with default
  }
  
  // Default fallback
  return DEFAULT_COUNTRY;
} 
/**
 * Comprehensive country data for Stripe Connect Express supported countries
 * This is the single source of truth for all country-related data in the app
 */

export type CountryCode = 
  | 'US' | 'CA' | 'MX' // North America
  | 'GB' | 'IE' | 'FR' | 'DE' | 'ES' | 'IT' | 'NL' | 'BE' | 'AT' | 'CH' | 'PT' | 'PL' | 'SE' | 'NO' | 'DK' | 'FI' | 'CZ' | 'SK' | 'HU' | 'RO' | 'BG' | 'HR' | 'SI' | 'EE' | 'LV' | 'LT' | 'GR' | 'CY' | 'MT' | 'LU' | 'GI' | 'LI' // Europe
  | 'JP' | 'AU' | 'NZ' | 'SG' | 'HK' | 'TH' // Asia Pacific
  | 'AE'; // Middle East

export type Currency = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK' | 'NZD' | 'SGD' | 'HKD' | 'THB' | 'AED' | 'MXN';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  decimals: number;
}

export interface CountryInfo {
  code: CountryCode;
  name: string;
  flag: string;
  currency: Currency;
  phoneCode: string; // International dialing code
  stripeLocale: string;
  locales: string[]; // Browser locales that map to this country
  timezones: string[]; // Timezones that map to this country
}

// Single source of truth for all currency data
export const CURRENCY_DATA: Record<Currency, CurrencyInfo> = {
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
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', decimals: 2 },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimals: 2 },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', decimals: 2 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimals: 2 },
  MXN: { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', decimals: 2 }
};

export const STRIPE_SUPPORTED_COUNTRIES: Record<CountryCode, CountryInfo> = {
  // North America
  'US': {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    phoneCode: '+1',
    stripeLocale: 'en-US',
    locales: ['en-US'],
    timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles']
  },
  'CA': {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    phoneCode: '+1',
    stripeLocale: 'en-CA',
    locales: ['en-CA', 'fr-CA'],
    timezones: ['America/Toronto', 'America/Vancouver']
  },
  'MX': {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    currency: 'MXN',
    phoneCode: '+52',
    stripeLocale: 'es-MX',
    locales: ['es-MX'],
    timezones: ['America/Mexico_City']
  },
  
  // Europe
  'GB': {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    phoneCode: '+44',
    stripeLocale: 'en-GB',
    locales: ['en-GB'],
    timezones: ['Europe/London']
  },
  'IE': {
    code: 'IE',
    name: 'Ireland',
    flag: '🇮🇪',
    currency: 'EUR',
    phoneCode: '+353',
    stripeLocale: 'en-IE',
    locales: ['en-IE'],
    timezones: ['Europe/Dublin']
  },
  'FR': {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    phoneCode: '+33',
    stripeLocale: 'fr-FR',
    locales: ['fr', 'fr-FR'],
    timezones: ['Europe/Paris']
  },
  'DE': {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    phoneCode: '+49',
    stripeLocale: 'de-DE',
    locales: ['de', 'de-DE'],
    timezones: ['Europe/Berlin']
  },
  'ES': {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    currency: 'EUR',
    phoneCode: '+34',
    stripeLocale: 'es-ES',
    locales: ['es', 'es-ES'],
    timezones: ['Europe/Madrid']
  },
  'IT': {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    currency: 'EUR',
    phoneCode: '+39',
    stripeLocale: 'it-IT',
    locales: ['it', 'it-IT'],
    timezones: ['Europe/Rome']
  },
  'NL': {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    currency: 'EUR',
    phoneCode: '+31',
    stripeLocale: 'nl-NL',
    locales: ['nl', 'nl-NL'],
    timezones: ['Europe/Amsterdam']
  },
  'BE': {
    code: 'BE',
    name: 'Belgium',
    flag: '🇧🇪',
    currency: 'EUR',
    phoneCode: '+32',
    stripeLocale: 'fr-BE',
    locales: ['fr-BE', 'nl-BE'],
    timezones: ['Europe/Brussels']
  },
  'AT': {
    code: 'AT',
    name: 'Austria',
    flag: '🇦🇹',
    currency: 'EUR',
    phoneCode: '+43',
    stripeLocale: 'de-AT',
    locales: ['de-AT'],
    timezones: ['Europe/Vienna']
  },
  'CH': {
    code: 'CH',
    name: 'Switzerland',
    flag: '🇨🇭',
    currency: 'CHF',
    phoneCode: '+41',
    stripeLocale: 'de-CH',
    locales: ['de-CH', 'fr-CH', 'it-CH'],
    timezones: ['Europe/Zurich']
  },
  'PT': {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    currency: 'EUR',
    phoneCode: '+351',
    stripeLocale: 'pt-PT',
    locales: ['pt', 'pt-PT'],
    timezones: ['Europe/Lisbon']
  },
  'PL': {
    code: 'PL',
    name: 'Poland',
    flag: '🇵🇱',
    currency: 'PLN',
    phoneCode: '+48',
    stripeLocale: 'pl-PL',
    locales: ['pl', 'pl-PL'],
    timezones: ['Europe/Warsaw']
  },
  'SE': {
    code: 'SE',
    name: 'Sweden',
    flag: '🇸🇪',
    currency: 'SEK',
    phoneCode: '+46',
    stripeLocale: 'sv-SE',
    locales: ['sv', 'sv-SE'],
    timezones: ['Europe/Stockholm']
  },
  'NO': {
    code: 'NO',
    name: 'Norway',
    flag: '🇳🇴',
    currency: 'NOK',
    phoneCode: '+47',
    stripeLocale: 'nb-NO',
    locales: ['no', 'nb', 'nb-NO'],
    timezones: ['Europe/Oslo']
  },
  'DK': {
    code: 'DK',
    name: 'Denmark',
    flag: '🇩🇰',
    currency: 'DKK',
    phoneCode: '+45',
    stripeLocale: 'da-DK',
    locales: ['da', 'da-DK'],
    timezones: ['Europe/Copenhagen']
  },
  'FI': {
    code: 'FI',
    name: 'Finland',
    flag: '🇫🇮',
    currency: 'EUR',
    phoneCode: '+358',
    stripeLocale: 'fi-FI',
    locales: ['fi', 'fi-FI'],
    timezones: ['Europe/Helsinki']
  },
  'CZ': {
    code: 'CZ',
    name: 'Czech Republic',
    flag: '🇨🇿',
    currency: 'CZK',
    phoneCode: '+420',
    stripeLocale: 'cs-CZ',
    locales: ['cs', 'cs-CZ'],
    timezones: ['Europe/Prague']
  },
  'SK': {
    code: 'SK',
    name: 'Slovakia',
    flag: '🇸🇰',
    currency: 'EUR',
    phoneCode: '+421',
    stripeLocale: 'sk-SK',
    locales: ['sk', 'sk-SK'],
    timezones: ['Europe/Bratislava']
  },
  'HU': {
    code: 'HU',
    name: 'Hungary',
    flag: '🇭🇺',
    currency: 'EUR',
    phoneCode: '+36',
    stripeLocale: 'hu-HU',
    locales: ['hu', 'hu-HU'],
    timezones: ['Europe/Budapest']
  },
  'RO': {
    code: 'RO',
    name: 'Romania',
    flag: '🇷🇴',
    currency: 'EUR',
    phoneCode: '+40',
    stripeLocale: 'ro-RO',
    locales: ['ro', 'ro-RO'],
    timezones: ['Europe/Bucharest']
  },
  'BG': {
    code: 'BG',
    name: 'Bulgaria',
    flag: '🇧🇬',
    currency: 'EUR',
    phoneCode: '+359',
    stripeLocale: 'bg-BG',
    locales: ['bg', 'bg-BG'],
    timezones: ['Europe/Sofia']
  },
  'HR': {
    code: 'HR',
    name: 'Croatia',
    flag: '🇭🇷',
    currency: 'EUR',
    phoneCode: '+385',
    stripeLocale: 'hr-HR',
    locales: ['hr', 'hr-HR'],
    timezones: ['Europe/Zagreb']
  },
  'SI': {
    code: 'SI',
    name: 'Slovenia',
    flag: '🇸🇮',
    currency: 'EUR',
    phoneCode: '+386',
    stripeLocale: 'sl-SI',
    locales: ['sl', 'sl-SI'],
    timezones: ['Europe/Ljubljana']
  },
  'EE': {
    code: 'EE',
    name: 'Estonia',
    flag: '🇪🇪',
    currency: 'EUR',
    phoneCode: '+372',
    stripeLocale: 'et-EE',
    locales: ['et', 'et-EE'],
    timezones: ['Europe/Tallinn']
  },
  'LV': {
    code: 'LV',
    name: 'Latvia',
    flag: '🇱🇻',
    currency: 'EUR',
    phoneCode: '+371',
    stripeLocale: 'lv-LV',
    locales: ['lv', 'lv-LV'],
    timezones: ['Europe/Riga']
  },
  'LT': {
    code: 'LT',
    name: 'Lithuania',
    flag: '🇱🇹',
    currency: 'EUR',
    phoneCode: '+370',
    stripeLocale: 'lt-LT',
    locales: ['lt', 'lt-LT'],
    timezones: ['Europe/Vilnius']
  },
  'GR': {
    code: 'GR',
    name: 'Greece',
    flag: '🇬🇷',
    currency: 'EUR',
    phoneCode: '+30',
    stripeLocale: 'el-GR',
    locales: ['el', 'el-GR'],
    timezones: ['Europe/Athens']
  },
  'CY': {
    code: 'CY',
    name: 'Cyprus',
    flag: '🇨🇾',
    currency: 'EUR',
    phoneCode: '+357',
    stripeLocale: 'el-CY',
    locales: ['el-CY'],
    timezones: ['Europe/Nicosia']
  },
  'MT': {
    code: 'MT',
    name: 'Malta',
    flag: '🇲🇹',
    currency: 'EUR',
    phoneCode: '+356',
    stripeLocale: 'mt-MT',
    locales: ['mt', 'mt-MT'],
    timezones: ['Europe/Malta']
  },
  'LU': {
    code: 'LU',
    name: 'Luxembourg',
    flag: '🇱🇺',
    currency: 'EUR',
    phoneCode: '+352',
    stripeLocale: 'fr-LU',
    locales: ['fr-LU', 'de-LU'],
    timezones: ['Europe/Luxembourg']
  },
  'GI': {
    code: 'GI',
    name: 'Gibraltar',
    flag: '🇬🇮',
    currency: 'GBP',
    phoneCode: '+350',
    stripeLocale: 'en-GB',
    locales: ['en-GI'],
    timezones: ['Europe/Gibraltar']
  },
  'LI': {
    code: 'LI',
    name: 'Liechtenstein',
    flag: '🇱🇮',
    currency: 'CHF',
    phoneCode: '+423',
    stripeLocale: 'de-LI',
    locales: ['de-LI'],
    timezones: ['Europe/Vaduz']
  },
  
  // Asia Pacific
  'JP': {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    currency: 'JPY',
    phoneCode: '+81',
    stripeLocale: 'ja-JP',
    locales: ['ja', 'ja-JP'],
    timezones: ['Asia/Tokyo']
  },
  'AU': {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    phoneCode: '+61',
    stripeLocale: 'en-AU',
    locales: ['en-AU'],
    timezones: ['Australia/Sydney', 'Australia/Melbourne']
  },
  'NZ': {
    code: 'NZ',
    name: 'New Zealand',
    flag: '🇳🇿',
    currency: 'NZD',
    phoneCode: '+64',
    stripeLocale: 'en-NZ',
    locales: ['en-NZ'],
    timezones: ['Pacific/Auckland']
  },
  'SG': {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    currency: 'SGD',
    phoneCode: '+65',
    stripeLocale: 'en-SG',
    locales: ['en-SG'],
    timezones: ['Asia/Singapore']
  },
  'HK': {
    code: 'HK',
    name: 'Hong Kong SAR China',
    flag: '🇭🇰',
    currency: 'HKD',
    phoneCode: '+852',
    stripeLocale: 'zh-HK',
    locales: ['zh-HK'],
    timezones: ['Asia/Hong_Kong']
  },
  'TH': {
    code: 'TH',
    name: 'Thailand',
    flag: '🇹🇭',
    currency: 'THB',
    phoneCode: '+66',
    stripeLocale: 'th-TH',
    locales: ['th', 'th-TH'],
    timezones: ['Asia/Bangkok']
  },
  
  // Middle East
  'AE': {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    phoneCode: '+971',
    stripeLocale: 'ar-AE',
    locales: ['ar', 'ar-AE'],
    timezones: ['Asia/Dubai']
  }
};

// Get all supported country codes
export const SUPPORTED_COUNTRY_CODES = Object.keys(STRIPE_SUPPORTED_COUNTRIES) as CountryCode[];

// Get country list for dropdowns (sorted alphabetically)
export const COUNTRY_LIST = Object.values(STRIPE_SUPPORTED_COUNTRIES).sort((a, b) => 
  a.name.localeCompare(b.name)
);

// Helper functions
export function getCountryInfo(code: string): CountryInfo | undefined {
  return STRIPE_SUPPORTED_COUNTRIES[code as CountryCode];
}

export function getCountryByLocale(locale: string): CountryInfo | undefined {
  return Object.values(STRIPE_SUPPORTED_COUNTRIES).find(country => 
    country.locales.includes(locale.toLowerCase())
  );
}

export function getCountryByTimezone(timezone: string): CountryInfo | undefined {
  return Object.values(STRIPE_SUPPORTED_COUNTRIES).find(country => 
    country.timezones.includes(timezone)
  );
}

export function getStripeLocale(countryCode: string): string {
  const country = getCountryInfo(countryCode);
  return country?.stripeLocale || 'en-US';
}

export function getCurrencyForCountry(countryCode: string): Currency {
  const country = getCountryInfo(countryCode);
  return country?.currency || 'EUR';
}

export function getCurrencyInfo(currencyCode: Currency): CurrencyInfo {
  return CURRENCY_DATA[currencyCode];
}

export function getPhoneCodeForCountry(countryCode: string): string {
  const country = getCountryInfo(countryCode);
  return country?.phoneCode || '';
} 
/**
 * Comprehensive country data for Stripe Connect Express supported countries
 * This is the single source of truth for all country-related data in the app
 */

export type CountryCode = 
  | 'US' | 'CA' | 'MX' // North America
  | 'GB' | 'IE' | 'FR' | 'DE' | 'ES' | 'IT' | 'NL' | 'BE' | 'AT' | 'CH' | 'PT' | 'PL' | 'SE' | 'NO' | 'DK' | 'FI' | 'CZ' | 'SK' | 'HU' | 'RO' | 'BG' | 'HR' | 'SI' | 'EE' | 'LV' | 'LT' | 'GR' | 'CY' | 'MT' | 'LU' | 'GI' | 'LI' // Europe
  | 'JP' | 'AU' | 'NZ' | 'SG' | 'HK' | 'TH' // Asia Pacific
  | 'AE'; // Middle East

export type Currency = 
  // Stripe Connect currencies
  'EUR' | 'USD' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK' | 'NZD' | 'SGD' | 'HKD' | 'THB' | 'AED' | 'MXN' |
  // Additional cross-border currencies
  'INR' | 'IDR' | 'PHP' | 'VND' | 'LKR' | 'BDT' | 'PKR' | 'NPR' | 'MMK' | 'LAK' | 'MDL' | 'UAH' | 'GEL' | 'AMD' | 'AZN' | 
  'KZT' | 'UZS' | 'KGS' | 'TJS' | 'KES' | 'TZS' | 'UGX' | 'ETB' | 'ZAR' | 'EGP' | 'MAD' | 'NGN' | 'GHS' | 
  'ARS' | 'CLP' | 'COP' | 'PEN' | 'UYU' | 'PYG' | 'BOB' | 'VES' | 'GTQ' | 'CRC' | 'HNL' | 'NIO' | 'DOP' | 
  'JMD' | 'TTD' | 'BSD' | 'BBD';

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
  // Stripe Connect currencies
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
  MXN: { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', decimals: 2 },
  
  // Cross-border currencies - Asia Pacific
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimals: 0 },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimals: 2 },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimals: 0 },
  LKR: { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', decimals: 2 },
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', decimals: 2 },
  PKR: { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', decimals: 2 },
  NPR: { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee', decimals: 2 },
  MMK: { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat', decimals: 2 },
  LAK: { code: 'LAK', symbol: '₭', name: 'Lao Kip', decimals: 0 },
  
  // Cross-border currencies - Eastern Europe & Caucasus
  MDL: { code: 'MDL', symbol: 'L', name: 'Moldovan Leu', decimals: 2 },
  UAH: { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', decimals: 2 },
  GEL: { code: 'GEL', symbol: '₾', name: 'Georgian Lari', decimals: 2 },
  AMD: { code: 'AMD', symbol: '֏', name: 'Armenian Dram', decimals: 2 },
  AZN: { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat', decimals: 2 },
  
  // Cross-border currencies - Central Asia
  KZT: { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge', decimals: 2 },
  UZS: { code: 'UZS', symbol: 'soʻm', name: 'Uzbekistani Som', decimals: 2 },
  KGS: { code: 'KGS', symbol: 'с', name: 'Kyrgyzstani Som', decimals: 2 },
  TJS: { code: 'TJS', symbol: 'SM', name: 'Tajikistani Somoni', decimals: 2 },
  
  // Cross-border currencies - Africa
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', decimals: 2 },
  TZS: { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', decimals: 2 },
  UGX: { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', decimals: 0 },
  ETB: { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', decimals: 2 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimals: 2 },
  EGP: { code: 'EGP', symbol: '£', name: 'Egyptian Pound', decimals: 2 },
  MAD: { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham', decimals: 2 },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', decimals: 2 },
  GHS: { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', decimals: 2 },
  
  // Cross-border currencies - Latin America
  ARS: { code: 'ARS', symbol: '$', name: 'Argentine Peso', decimals: 2 },
  CLP: { code: 'CLP', symbol: '$', name: 'Chilean Peso', decimals: 0 },
  COP: { code: 'COP', symbol: '$', name: 'Colombian Peso', decimals: 2 },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', decimals: 2 },
  UYU: { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso', decimals: 2 },
  PYG: { code: 'PYG', symbol: '₲', name: 'Paraguayan Guaraní', decimals: 0 },
  BOB: { code: 'BOB', symbol: 'Bs', name: 'Bolivian Boliviano', decimals: 2 },
  VES: { code: 'VES', symbol: 'Bs.S', name: 'Venezuelan Bolívar', decimals: 2 },
  GTQ: { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal', decimals: 2 },
  CRC: { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón', decimals: 2 },
  HNL: { code: 'HNL', symbol: 'L', name: 'Honduran Lempira', decimals: 2 },
  NIO: { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba', decimals: 2 },
  DOP: { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso', decimals: 2 },
  
  // Cross-border currencies - Caribbean
  JMD: { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar', decimals: 2 },
  TTD: { code: 'TTD', symbol: 'TT$', name: 'Trinidad & Tobago Dollar', decimals: 2 },
  BSD: { code: 'BSD', symbol: 'B$', name: 'Bahamian Dollar', decimals: 2 },
  BBD: { code: 'BBD', symbol: 'Bds$', name: 'Barbadian Dollar', decimals: 2 }
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

// Additional cross-border countries with basic info (countries not in Stripe Connect but supported via cross-border payouts)
export const CROSSBORDER_ONLY_COUNTRIES: Record<string, CountryInfo> = {
  // Asia-Pacific
  'MV': { code: 'MV' as CountryCode, name: 'Maldives', flag: '🇲🇻', currency: 'USD', phoneCode: '+960', stripeLocale: 'en-US', locales: ['en'], timezones: ['Indian/Maldives'] }, // USD is actually used in Maldives
  'IN': { code: 'IN' as CountryCode, name: 'India', flag: '🇮🇳', currency: 'INR', phoneCode: '+91', stripeLocale: 'en-IN', locales: ['en-IN', 'hi'], timezones: ['Asia/Kolkata'] },
  'ID': { code: 'ID' as CountryCode, name: 'Indonesia', flag: '🇮🇩', currency: 'IDR', phoneCode: '+62', stripeLocale: 'en-US', locales: ['id'], timezones: ['Asia/Jakarta'] },
  'PH': { code: 'PH' as CountryCode, name: 'Philippines', flag: '🇵🇭', currency: 'PHP', phoneCode: '+63', stripeLocale: 'en-US', locales: ['en-PH'], timezones: ['Asia/Manila'] },
  'VN': { code: 'VN' as CountryCode, name: 'Vietnam', flag: '🇻🇳', currency: 'VND', phoneCode: '+84', stripeLocale: 'en-US', locales: ['vi'], timezones: ['Asia/Ho_Chi_Minh'] },
  'LK': { code: 'LK' as CountryCode, name: 'Sri Lanka', flag: '🇱🇰', currency: 'LKR', phoneCode: '+94', stripeLocale: 'en-US', locales: ['en-LK'], timezones: ['Asia/Colombo'] },
  'BD': { code: 'BD' as CountryCode, name: 'Bangladesh', flag: '🇧🇩', currency: 'BDT', phoneCode: '+880', stripeLocale: 'en-US', locales: ['bn'], timezones: ['Asia/Dhaka'] },
  'PK': { code: 'PK' as CountryCode, name: 'Pakistan', flag: '🇵🇰', currency: 'PKR', phoneCode: '+92', stripeLocale: 'en-US', locales: ['en-PK', 'ur'], timezones: ['Asia/Karachi'] },
  'NP': { code: 'NP' as CountryCode, name: 'Nepal', flag: '🇳🇵', currency: 'NPR', phoneCode: '+977', stripeLocale: 'en-US', locales: ['ne'], timezones: ['Asia/Kathmandu'] },
  'MM': { code: 'MM' as CountryCode, name: 'Myanmar', flag: '🇲🇲', currency: 'MMK', phoneCode: '+95', stripeLocale: 'en-US', locales: ['my'], timezones: ['Asia/Yangon'] },
  'KH': { code: 'KH' as CountryCode, name: 'Cambodia', flag: '🇰🇭', currency: 'USD', phoneCode: '+855', stripeLocale: 'en-US', locales: ['km'], timezones: ['Asia/Phnom_Penh'] }, // USD is widely used in Cambodia
  'LA': { code: 'LA' as CountryCode, name: 'Laos', flag: '🇱🇦', currency: 'LAK', phoneCode: '+856', stripeLocale: 'en-US', locales: ['lo'], timezones: ['Asia/Vientiane'] },
  
  // Eastern Europe & Caucasus
  'MD': { code: 'MD' as CountryCode, name: 'Moldova', flag: '🇲🇩', currency: 'MDL', phoneCode: '+373', stripeLocale: 'en-US', locales: ['ro-MD'], timezones: ['Europe/Chisinau'] },
  'UA': { code: 'UA' as CountryCode, name: 'Ukraine', flag: '🇺🇦', currency: 'UAH', phoneCode: '+380', stripeLocale: 'en-US', locales: ['uk'], timezones: ['Europe/Kiev'] },
  'GE': { code: 'GE' as CountryCode, name: 'Georgia', flag: '🇬🇪', currency: 'GEL', phoneCode: '+995', stripeLocale: 'en-US', locales: ['ka'], timezones: ['Asia/Tbilisi'] },
  'AM': { code: 'AM' as CountryCode, name: 'Armenia', flag: '🇦🇲', currency: 'AMD', phoneCode: '+374', stripeLocale: 'en-US', locales: ['hy'], timezones: ['Asia/Yerevan'] },
  'AZ': { code: 'AZ' as CountryCode, name: 'Azerbaijan', flag: '🇦🇿', currency: 'AZN', phoneCode: '+994', stripeLocale: 'en-US', locales: ['az'], timezones: ['Asia/Baku'] },
  
  // Central Asia
  'KZ': { code: 'KZ' as CountryCode, name: 'Kazakhstan', flag: '🇰🇿', currency: 'KZT', phoneCode: '+7', stripeLocale: 'en-US', locales: ['kk', 'ru-KZ'], timezones: ['Asia/Almaty'] },
  'UZ': { code: 'UZ' as CountryCode, name: 'Uzbekistan', flag: '🇺🇿', currency: 'UZS', phoneCode: '+998', stripeLocale: 'en-US', locales: ['uz'], timezones: ['Asia/Tashkent'] },
  'KG': { code: 'KG' as CountryCode, name: 'Kyrgyzstan', flag: '🇰🇬', currency: 'KGS', phoneCode: '+996', stripeLocale: 'en-US', locales: ['ky'], timezones: ['Asia/Bishkek'] },
  'TJ': { code: 'TJ' as CountryCode, name: 'Tajikistan', flag: '🇹🇯', currency: 'TJS', phoneCode: '+992', stripeLocale: 'en-US', locales: ['tg'], timezones: ['Asia/Dushanbe'] },
  
  // Africa
  'KE': { code: 'KE' as CountryCode, name: 'Kenya', flag: '🇰🇪', currency: 'KES', phoneCode: '+254', stripeLocale: 'en-US', locales: ['en-KE', 'sw'], timezones: ['Africa/Nairobi'] },
  'TZ': { code: 'TZ' as CountryCode, name: 'Tanzania', flag: '🇹🇿', currency: 'TZS', phoneCode: '+255', stripeLocale: 'en-US', locales: ['en-TZ', 'sw-TZ'], timezones: ['Africa/Dar_es_Salaam'] },
  'UG': { code: 'UG' as CountryCode, name: 'Uganda', flag: '🇺🇬', currency: 'UGX', phoneCode: '+256', stripeLocale: 'en-US', locales: ['en-UG'], timezones: ['Africa/Kampala'] },
  'ET': { code: 'ET' as CountryCode, name: 'Ethiopia', flag: '🇪🇹', currency: 'ETB', phoneCode: '+251', stripeLocale: 'en-US', locales: ['am'], timezones: ['Africa/Addis_Ababa'] },
  'ZA': { code: 'ZA' as CountryCode, name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', phoneCode: '+27', stripeLocale: 'en-US', locales: ['en-ZA'], timezones: ['Africa/Johannesburg'] },
  'EG': { code: 'EG' as CountryCode, name: 'Egypt', flag: '🇪🇬', currency: 'EGP', phoneCode: '+20', stripeLocale: 'en-US', locales: ['ar-EG'], timezones: ['Africa/Cairo'] },
  'MA': { code: 'MA' as CountryCode, name: 'Morocco', flag: '🇲🇦', currency: 'MAD', phoneCode: '+212', stripeLocale: 'en-US', locales: ['ar-MA', 'fr-MA'], timezones: ['Africa/Casablanca'] },
  'NG': { code: 'NG' as CountryCode, name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', phoneCode: '+234', stripeLocale: 'en-US', locales: ['en-NG'], timezones: ['Africa/Lagos'] },
  'GH': { code: 'GH' as CountryCode, name: 'Ghana', flag: '🇬🇭', currency: 'GHS', phoneCode: '+233', stripeLocale: 'en-US', locales: ['en-GH'], timezones: ['Africa/Accra'] },
  
  // Latin America
  'AR': { code: 'AR' as CountryCode, name: 'Argentina', flag: '🇦🇷', currency: 'ARS', phoneCode: '+54', stripeLocale: 'es-AR', locales: ['es-AR'], timezones: ['America/Argentina/Buenos_Aires'] },
  'CL': { code: 'CL' as CountryCode, name: 'Chile', flag: '🇨🇱', currency: 'CLP', phoneCode: '+56', stripeLocale: 'es-CL', locales: ['es-CL'], timezones: ['America/Santiago'] },
  'CO': { code: 'CO' as CountryCode, name: 'Colombia', flag: '🇨🇴', currency: 'COP', phoneCode: '+57', stripeLocale: 'es-CO', locales: ['es-CO'], timezones: ['America/Bogota'] },
  'PE': { code: 'PE' as CountryCode, name: 'Peru', flag: '🇵🇪', currency: 'PEN', phoneCode: '+51', stripeLocale: 'es-PE', locales: ['es-PE'], timezones: ['America/Lima'] },
  'EC': { code: 'EC' as CountryCode, name: 'Ecuador', flag: '🇪🇨', currency: 'USD', phoneCode: '+593', stripeLocale: 'es-EC', locales: ['es-EC'], timezones: ['America/Guayaquil'] }, // Ecuador uses USD
  'UY': { code: 'UY' as CountryCode, name: 'Uruguay', flag: '🇺🇾', currency: 'UYU', phoneCode: '+598', stripeLocale: 'es-UY', locales: ['es-UY'], timezones: ['America/Montevideo'] },
  'PY': { code: 'PY' as CountryCode, name: 'Paraguay', flag: '🇵🇾', currency: 'PYG', phoneCode: '+595', stripeLocale: 'es-PY', locales: ['es-PY'], timezones: ['America/Asuncion'] },
  'BO': { code: 'BO' as CountryCode, name: 'Bolivia', flag: '🇧🇴', currency: 'BOB', phoneCode: '+591', stripeLocale: 'es-BO', locales: ['es-BO'], timezones: ['America/La_Paz'] },
  'VE': { code: 'VE' as CountryCode, name: 'Venezuela', flag: '🇻🇪', currency: 'VES', phoneCode: '+58', stripeLocale: 'es-VE', locales: ['es-VE'], timezones: ['America/Caracas'] },
  'GT': { code: 'GT' as CountryCode, name: 'Guatemala', flag: '🇬🇹', currency: 'GTQ', phoneCode: '+502', stripeLocale: 'es-GT', locales: ['es-GT'], timezones: ['America/Guatemala'] },
  'CR': { code: 'CR' as CountryCode, name: 'Costa Rica', flag: '🇨🇷', currency: 'CRC', phoneCode: '+506', stripeLocale: 'es-CR', locales: ['es-CR'], timezones: ['America/Costa_Rica'] },
  'PA': { code: 'PA' as CountryCode, name: 'Panama', flag: '🇵🇦', currency: 'USD', phoneCode: '+507', stripeLocale: 'es-PA', locales: ['es-PA'], timezones: ['America/Panama'] }, // Panama uses USD
  'HN': { code: 'HN' as CountryCode, name: 'Honduras', flag: '🇭🇳', currency: 'HNL', phoneCode: '+504', stripeLocale: 'es-HN', locales: ['es-HN'], timezones: ['America/Tegucigalpa'] },
  'NI': { code: 'NI' as CountryCode, name: 'Nicaragua', flag: '🇳🇮', currency: 'NIO', phoneCode: '+505', stripeLocale: 'es-NI', locales: ['es-NI'], timezones: ['America/Managua'] },
  'SV': { code: 'SV' as CountryCode, name: 'El Salvador', flag: '🇸🇻', currency: 'USD', phoneCode: '+503', stripeLocale: 'es-SV', locales: ['es-SV'], timezones: ['America/El_Salvador'] }, // El Salvador uses USD
  'DO': { code: 'DO' as CountryCode, name: 'Dominican Republic', flag: '🇩🇴', currency: 'DOP', phoneCode: '+1', stripeLocale: 'es-DO', locales: ['es-DO'], timezones: ['America/Santo_Domingo'] },
  
  // Caribbean
  'JM': { code: 'JM' as CountryCode, name: 'Jamaica', flag: '🇯🇲', currency: 'JMD', phoneCode: '+1', stripeLocale: 'en-JM', locales: ['en-JM'], timezones: ['America/Jamaica'] },
  'TT': { code: 'TT' as CountryCode, name: 'Trinidad and Tobago', flag: '🇹🇹', currency: 'TTD', phoneCode: '+1', stripeLocale: 'en-TT', locales: ['en-TT'], timezones: ['America/Port_of_Spain'] },
  'BS': { code: 'BS' as CountryCode, name: 'Bahamas', flag: '🇧🇸', currency: 'BSD', phoneCode: '+1', stripeLocale: 'en-BS', locales: ['en-BS'], timezones: ['America/Nassau'] },
  'BB': { code: 'BB' as CountryCode, name: 'Barbados', flag: '🇧🇧', currency: 'BBD', phoneCode: '+1', stripeLocale: 'en-BB', locales: ['en-BB'], timezones: ['America/Barbados'] },
};

// All countries that support payments (Connect + Cross-border)
export const ALL_SUPPORTED_COUNTRIES = {
  ...STRIPE_SUPPORTED_COUNTRIES,
  ...CROSSBORDER_ONLY_COUNTRIES
};

// Get country list for dropdowns (sorted alphabetically) - includes ALL supported countries
export const COUNTRY_LIST = Object.values(ALL_SUPPORTED_COUNTRIES).sort((a, b) => 
  a.name.localeCompare(b.name)
);

// Get only Stripe Connect countries for legacy purposes
export const STRIPE_CONNECT_COUNTRY_LIST = Object.values(STRIPE_SUPPORTED_COUNTRIES).sort((a, b) => 
  a.name.localeCompare(b.name)
);

// Helper functions
export function getCountryInfo(code: string): CountryInfo | undefined {
  return ALL_SUPPORTED_COUNTRIES[code as CountryCode];
}

export function getCountryByLocale(locale: string): CountryInfo | undefined {
  return Object.values(ALL_SUPPORTED_COUNTRIES).find(country => 
    country.locales.includes(locale.toLowerCase())
  );
}

export function getCountryByTimezone(timezone: string): CountryInfo | undefined {
  return Object.values(ALL_SUPPORTED_COUNTRIES).find(country => 
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

// ===== PAYMENT METHOD SUPPORT =====

// Countries that support Stripe Connect Express accounts (same as SUPPORTED_COUNTRY_CODES)
export const STRIPE_CONNECT_COUNTRIES = SUPPORTED_COUNTRY_CODES;

// Additional countries that support Stripe Cross-border payouts (from US platform)
// Based on Stripe's cross-border payout documentation
export const STRIPE_CROSSBORDER_ONLY_COUNTRIES = [
  // Additional cross-border only countries (not in Connect)
  'AD', 'AL', 'DZ', 'AG', 'AR', 'AM', 'AW', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BZ', 'BJ', 'BT', 
  'BO', 'BA', 'BW', 'BN', 'BF', 'KH', 'CM', 'CV', 'CF', 'TD', 'CL', 'CN', 'CO', 'KM', 'CG', 'CD', 
  'CK', 'CR', 'CI', 'CU', 'CW', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'ET', 'FJ', 'GA', 
  'GM', 'GE', 'GL', 'GD', 'GT', 'GN', 'GW', 'GY', 'HT', 'HN', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IL', 
  'JM', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR', 'KW', 'KG', 'LA', 'LB', 'LS', 'LR', 'LY', 'MO', 'MK', 
  'MG', 'MW', 'MV', 'ML', 'MH', 'MR', 'MU', 'FM', 'MD', 'MC', 'MN', 'ME', 'MA', 'MZ', 'MM', 'NA', 
  'NR', 'NP', 'NI', 'NE', 'NG', 'NU', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'QA', 
  'RW', 'KN', 'LC', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SB', 'SO', 'ZA', 'SS', 
  'LK', 'SD', 'SR', 'SZ', 'SY', 'TW', 'TJ', 'TZ', 'TL', 'TG', 'TO', 'TT', 'TN', 'TR', 'TM', 'TV', 
  'UG', 'UA', 'UY', 'UZ', 'VU', 'VE', 'VN', 'YE', 'ZM', 'ZW'
] as const;

// All countries that support Stripe Cross-border payouts (Connect + Cross-border only)
export const STRIPE_CROSSBORDER_COUNTRIES = [...STRIPE_CONNECT_COUNTRIES, ...STRIPE_CROSSBORDER_ONLY_COUNTRIES];

export type StripeConnectCountry = typeof STRIPE_CONNECT_COUNTRIES[number];
export type StripeCrossBorderCountry = typeof STRIPE_CROSSBORDER_COUNTRIES[number];

/**
 * Check if a country supports Stripe Connect Express accounts
 */
export function supportsStripeConnect(countryCode: string): boolean {
  return STRIPE_CONNECT_COUNTRIES.includes(countryCode as StripeConnectCountry);
}

/**
 * Check if a country supports Stripe Cross-border payouts
 */
export function supportsCrossBorderPayouts(countryCode: string): boolean {
  return STRIPE_CROSSBORDER_COUNTRIES.includes(countryCode as StripeCrossBorderCountry);
}

/**
 * Determine the best payment method for a tour guide's country
 */
export function getPaymentMethod(countryCode: string): 'connect' | 'crossborder' | 'unsupported' {
  if (supportsStripeConnect(countryCode)) {
    return 'connect';
  } else if (supportsCrossBorderPayouts(countryCode)) {
    return 'crossborder';
  } else {
    return 'unsupported';
  }
}

/**
 * Get user-friendly explanation of payment method
 */
export function getPaymentMethodExplanation(countryCode: string): {
  method: 'connect' | 'crossborder' | 'unsupported';
  title: string;
  description: string;
  processingTime: string;
} {
  const method = getPaymentMethod(countryCode);
  
  switch (method) {
    case 'connect':
      return {
        method,
        title: 'Direct Account',
        description: 'You\'ll have your own Stripe account with instant payouts and full control.',
        processingTime: 'Instant to your account'
      };
    
    case 'crossborder':
      return {
        method,
        title: 'Platform Collection',
        description: 'We\'ll collect payments on your behalf and send weekly payouts to your bank.',
        processingTime: 'Weekly payouts'
      };
    
    case 'unsupported':
      return {
        method,
        title: 'Not Supported',
        description: 'Unfortunately, payment processing is not available in your country yet.',
        processingTime: 'N/A'
      };
  }
} 
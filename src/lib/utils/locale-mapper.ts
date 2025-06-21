// Map country codes to Stripe-supported locales
// Full list: https://stripe.com/docs/connect/supported-languages

export const countryToStripeLocale: Record<string, string> = {
  // North America
  'US': 'en-US',
  'CA': 'en-CA', // or 'fr-CA' for French Canada
  'MX': 'es-MX',
  
  // Europe
  'GB': 'en-GB',
  'IE': 'en-IE',
  'FR': 'fr-FR',
  'DE': 'de-DE',
  'ES': 'es-ES',
  'IT': 'it-IT',
  'NL': 'nl-NL',
  'BE': 'fr-BE', // or 'nl-BE' for Dutch
  'AT': 'de-AT',
  'CH': 'de-CH', // or 'fr-CH', 'it-CH' depending on region
  'PT': 'pt-PT',
  'PL': 'pl-PL',
  'SE': 'sv-SE',
  'NO': 'nb-NO',
  'DK': 'da-DK',
  'FI': 'fi-FI',
  'CZ': 'cs-CZ',
  'SK': 'sk-SK',
  'HU': 'hu-HU',
  'RO': 'ro-RO',
  'BG': 'bg-BG',
  'HR': 'hr-HR',
  'SI': 'sl-SI',
  'EE': 'et-EE',
  'LV': 'lv-LV',
  'LT': 'lt-LT',
  'GR': 'el-GR',
  'CY': 'el-CY',
  'MT': 'mt-MT',
  
  // Asia Pacific
  'JP': 'ja-JP',
  'AU': 'en-AU',
  'NZ': 'en-NZ',
  'SG': 'en-SG',
  'HK': 'zh-HK',
  'MY': 'ms-MY',
  'TH': 'th-TH',
  'ID': 'id-ID',
  'PH': 'fil-PH',
  'VN': 'vi-VN',
  'IN': 'en-IN',
  
  // Middle East & Africa
  'AE': 'ar-AE',
  'SA': 'ar-SA',
  'IL': 'he-IL',
  'TR': 'tr-TR',
  'ZA': 'en-ZA',
  
  // Latin America
  'BR': 'pt-BR',
  'AR': 'es-AR',
  'CO': 'es-CO',
  'CL': 'es-CL',
  'PE': 'es-PE',
  
  // Default fallback
  'DEFAULT': 'en-US'
};

export function getStripeLocale(countryCode: string | null | undefined): string {
  if (!countryCode) return countryToStripeLocale.DEFAULT;
  return countryToStripeLocale[countryCode] || countryToStripeLocale.DEFAULT;
} 
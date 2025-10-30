/**
 * Language utilities for tour language selection and display
 */

export interface Language {
	code: string;
	name: string;
	flag: string;
	nativeName?: string;
}

export const LANGUAGES: Language[] = [
	{ code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
	{ code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
	{ code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
	{ code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
	{ code: 'it', name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
	{ code: 'pt', name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português' },
	{ code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
	{ code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
	{ code: 'ko', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
	{ code: 'ar', name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
	{ code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
	{ code: 'nl', name: 'Dutch', flag: '🇳🇱', nativeName: 'Nederlands' },
	{ code: 'pl', name: 'Polish', flag: '🇵🇱', nativeName: 'Polski' },
	{ code: 'tr', name: 'Turkish', flag: '🇹🇷', nativeName: 'Türkçe' },
	{ code: 'sv', name: 'Swedish', flag: '🇸🇪', nativeName: 'Svenska' },
	{ code: 'da', name: 'Danish', flag: '🇩🇰', nativeName: 'Dansk' },
	{ code: 'no', name: 'Norwegian', flag: '🇳🇴', nativeName: 'Norsk' },
	{ code: 'fi', name: 'Finnish', flag: '🇫🇮', nativeName: 'Suomi' },
	{ code: 'el', name: 'Greek', flag: '🇬🇷', nativeName: 'Ελληνικά' },
	{ code: 'cs', name: 'Czech', flag: '🇨🇿', nativeName: 'Čeština' },
	{ code: 'hu', name: 'Hungarian', flag: '🇭🇺', nativeName: 'Magyar' },
	{ code: 'ro', name: 'Romanian', flag: '🇷🇴', nativeName: 'Română' },
	{ code: 'sk', name: 'Slovak', flag: '🇸🇰', nativeName: 'Slovenčina' },
	{ code: 'bg', name: 'Bulgarian', flag: '🇧🇬', nativeName: 'Български' },
	{ code: 'hr', name: 'Croatian', flag: '🇭🇷', nativeName: 'Hrvatski' },
];

const LANGUAGE_MAP = new Map(LANGUAGES.map(l => [l.code, l]));

/**
 * Get language name from code
 */
export function getLanguageName(code: string): string {
	return LANGUAGE_MAP.get(code)?.name || code.toUpperCase();
}

/**
 * Get language flag emoji from code
 */
export function getLanguageFlag(code: string): string {
	return LANGUAGE_MAP.get(code)?.flag || '🌐';
}

/**
 * Get native language name from code
 */
export function getLanguageNativeName(code: string): string {
	return LANGUAGE_MAP.get(code)?.nativeName || code.toUpperCase();
}

/**
 * Format multiple languages for display
 * @param codes - Array of language codes
 * @param options - Display options
 */
export function formatLanguages(
	codes: string[], 
	options: {
		maxDisplay?: number;
		showFlags?: boolean;
		separator?: string;
	} = {}
): string {
	const { maxDisplay = 3, showFlags = false, separator = ', ' } = options;
	
	if (!codes || codes.length === 0) return '';
	
	const names = codes.slice(0, maxDisplay).map(code => {
		const flag = showFlags ? `${getLanguageFlag(code)} ` : '';
		return `${flag}${getLanguageName(code)}`;
	});
	
	if (codes.length > maxDisplay) {
		names.push(`+${codes.length - maxDisplay} more`);
	}
	
	return names.join(separator);
}

/**
 * Get all language names from codes
 */
export function getAllLanguageNames(codes: string[]): string[] {
	return codes.map(getLanguageName);
}


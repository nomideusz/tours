/**
 * Format a number as currency in Euros
 */
export function formatEuro(amount: number | string): string {
	const num = typeof amount === 'string' ? parseFloat(amount) : amount;
	
	if (isNaN(num)) return '€0.00';
	
	return `€${num.toFixed(2)}`;
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
 * Format currency for display with optional compact notation
 */
export function formatCurrency(amount: number | string, options?: {
	compact?: boolean;
	showCents?: boolean;
}): string {
	const num = typeof amount === 'string' ? parseFloat(amount) : amount;
	
	if (isNaN(num)) return '€0.00';
	
	const { compact = false, showCents = true } = options || {};
	
	if (compact && num >= 1000) {
		// Show compact notation for large numbers
		if (num >= 1000000) {
			return `€${(num / 1000000).toFixed(1)}M`;
		} else if (num >= 1000) {
			return `€${(num / 1000).toFixed(1)}K`;
		}
	}
	
	return showCents ? `€${num.toFixed(2)}` : `€${Math.round(num)}`;
} 
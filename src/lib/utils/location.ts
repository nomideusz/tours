/**
 * Utility functions for handling location data
 */

/**
 * Format a detailed address to show only relevant parts
 * Example: "Plaza Virgen de los Reyes, Santa Cruz, Casco Antiguo, Sevilla, Andalucía, España"
 * Becomes: "Plaza Virgen de los Reyes, Sevilla"
 * 
 * Strategy:
 * - Keep the first part (street/landmark)
 * - Keep the city (usually 2nd or 3rd from end)
 * - Optionally keep country if not in a major region
 */
export function formatShortAddress(address: string): string {
	if (!address) return '';
	
	// Split by comma
	const parts = address.split(',').map(part => part.trim()).filter(Boolean);
	
	// If only 1 part (e.g., just "Germany"), return as-is
	if (parts.length === 1) {
		return address;
	}
	
	// If 2-3 parts, return as-is (already good format like "Berlin, Germany")
	if (parts.length <= 3) {
		return address;
	}
	
	// Strategy: Keep first part + city (usually 2-3 from end)
	const firstPart = parts[0];
	
	// Try to identify the city (usually before region/state/country)
	// Common patterns:
	// - [..., City, Region, Country]
	// - [..., City, State/Province, Country]
	// - [..., City, Country]
	
	// Known regions/states/provinces (more comprehensive list)
	const regions = new Set([
		// Spain
		'andalucía', 'cataluña', 'catalunya', 'comunidad de madrid', 'valencia', 
		'galicia', 'país vasco', 'euskadi', 'castilla y león', 'castilla-la mancha',
		'aragón', 'murcia', 'asturias', 'extremadura', 'baleares', 'canarias',
		// Italy
		'lazio', 'veneto', 'tuscany', 'toscana', 'lombardy', 'lombardia', 
		'sicily', 'sicilia', 'piedmont', 'piemonte', 'campania', 'emilia-romagna',
		// France
		'île-de-france', 'provence', 'provence-alpes-côte d\'azur', 'nouvelle-aquitaine',
		'occitanie', 'auvergne-rhône-alpes', 'bretagne', 'normandie', 'grand est',
		// USA
		'california', 'texas', 'new york', 'florida', 'illinois', 'pennsylvania',
		'ohio', 'georgia', 'north carolina', 'michigan', 'washington', 'massachusetts',
		// UK
		'england', 'scotland', 'wales', 'northern ireland', 'greater london',
		// Germany
		'bavaria', 'bayern', 'baden-württemberg', 'nordrhein-westfalen', 'hessen',
		// Canada
		'ontario', 'quebec', 'québec', 'british columbia', 'alberta'
	]);
	
	// Known country indicators
	const countries = new Set([
		'españa', 'spain', 'france', 'francia', 'italy', 'italia',
		'germany', 'alemania', 'deutschland', 'portugal', 'uk', 'united kingdom',
		'usa', 'united states', 'canada', 'méxico', 'mexico', 'netherlands',
		'belgium', 'switzerland', 'austria', 'greece', 'poland', 'czech republic'
	]);
	
	// Work backwards to find city (skip regions and countries)
	let cityIndex = -1;
	let foundCity = false;
	
	for (let i = parts.length - 1; i >= 1; i--) {
		const part = parts[i].toLowerCase();
		
		// If it's a country, skip it
		if (countries.has(part)) {
			continue;
		}
		
		// If it's a postal code or purely numeric, skip it
		if (/^\d+$/.test(part) || /^\d{5}(-\d{4})?$/.test(part)) {
			continue;
		}
		
		// If it's a region, mark it but keep looking for city before it
		if (regions.has(part)) {
			continue;
		}
		
		// This is likely the city (first non-region, non-country we encounter)
		cityIndex = i;
		foundCity = true;
		break;
	}
	
	// If we found a city and it's different from the first part
	if (cityIndex > 0 && cityIndex !== 0) {
		return `${firstPart}, ${parts[cityIndex]}`;
	}
	
	// Fallback: return first two parts
	if (parts.length >= 2) {
		return `${parts[0]}, ${parts[1]}`;
	}
	
	return firstPart;
}

/**
 * Truncates a location string to fit within the specified character limit
 * while preserving the most important information (usually the beginning)
 */
export function truncateLocation(location: string, maxLength: number = 100): string {
	if (!location || location.length <= maxLength) {
		return location;
	}
	
	// If the location is too long, try to keep the most important parts
	// Generally, the beginning of an address is most important (street, building, area)
	
	// First, try to truncate at a comma or separator to keep meaningful parts
	const truncated = location.substring(0, maxLength - 3); // Leave space for "..."
	
	// Find the last comma, dash, or other separator before the cut-off point
	const separators = [', ', ' - ', ' | ', ' • '];
	let bestCutPoint = -1;
	
	for (const separator of separators) {
		const lastIndex = truncated.lastIndexOf(separator);
		if (lastIndex > maxLength * 0.6) { // Only use if we keep at least 60% of the allowed length
			bestCutPoint = Math.max(bestCutPoint, lastIndex);
		}
	}
	
	if (bestCutPoint > 0) {
		return truncated.substring(0, bestCutPoint) + '...';
	}
	
	// If no good separator found, just truncate at word boundary
	const words = truncated.split(' ');
	if (words.length > 1) {
		// Remove the last potentially incomplete word
		words.pop();
		const result = words.join(' ');
		if (result.length > 20) { // Only use if we have a reasonable amount of text
			return result + '...';
		}
	}
	
	// Fallback: hard truncation
	return truncated + '...';
}

/**
 * Validates if a location string is within acceptable length
 */
export function isValidLocationLength(location: string, maxLength: number = 100): boolean {
	return !location || location.length <= maxLength;
}

/**
 * Sanitizes and truncates a location string for form submission
 */
export function sanitizeLocation(location: string, maxLength: number = 100): string {
	if (!location) return '';
	
	// Trim whitespace
	const trimmed = location.trim();
	
	// Truncate if necessary
	return truncateLocation(trimmed, maxLength);
}

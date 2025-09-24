/**
 * Utility functions for handling location data
 */

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

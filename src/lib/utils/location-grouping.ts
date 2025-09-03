/**
 * Location grouping utilities for tour discovery
 * Groups detailed addresses into manageable city/region categories
 */

/**
 * Extract city or main location from a detailed address
 * Handles various address formats and returns the most relevant location group
 */
export function extractLocationGroup(location: string): string {
	if (!location || typeof location !== 'string') {
		return 'Other';
	}

	const cleanLocation = location.trim();
	
	// Common patterns for extracting meaningful location groups
	const patterns = [
		// City, Country format
		/^([^,]+),\s*([^,]+)$/,
		// Detailed address with city
		/,\s*([^,\d]+),?\s*\d*\s*[A-Z]{2,}?\s*$/i,
		// City with postal code
		/^([^,\d]+),?\s*\d+/,
		// Just city name (no commas)
		/^([^,]+)$/
	];

	for (const pattern of patterns) {
		const match = cleanLocation.match(pattern);
		if (match) {
			let city = match[1].trim();
			
			// Clean up common prefixes/suffixes
			city = city
				.replace(/^(downtown|central|old town|city center)\s+/i, '')
				.replace(/\s+(downtown|central|old town|city center)$/i, '')
				.replace(/\s+(area|district|neighborhood|quarter)$/i, '')
				.replace(/^(the\s+)/i, '');
			
			// Capitalize properly
			city = city
				.split(' ')
				.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
				.join(' ');
				
			return city;
		}
	}

	// Fallback: take first meaningful word
	const words = cleanLocation.split(/[,\s]+/).filter(word => 
		word.length > 2 && 
		!/^\d+$/.test(word) && 
		!/^(st|ave|rd|blvd|street|avenue|road|boulevard)$/i.test(word)
	);
	
	if (words.length > 0) {
		return words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
	}

	return 'Other';
}

/**
 * Group multiple locations into organized categories
 */
export function groupLocations(locations: string[]): { [key: string]: string[] } {
	const groups: { [key: string]: string[] } = {};
	
	for (const location of locations) {
		const group = extractLocationGroup(location);
		if (!groups[group]) {
			groups[group] = [];
		}
		groups[group].push(location);
	}
	
	return groups;
}

/**
 * Get sorted list of location groups for filters
 */
export function getLocationGroups(locations: string[]): string[] {
	const groups = groupLocations(locations);
	return Object.keys(groups).sort((a, b) => {
		// Put 'Other' at the end
		if (a === 'Other') return 1;
		if (b === 'Other') return -1;
		return a.localeCompare(b);
	});
}

/**
 * Check if a tour location matches a location group filter
 */
export function matchesLocationGroup(tourLocation: string, selectedGroup: string): boolean {
	if (!selectedGroup || selectedGroup === '') return true;
	return extractLocationGroup(tourLocation) === selectedGroup;
}

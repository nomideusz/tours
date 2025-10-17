/**
 * Intelligent age range calculator for participant categories
 * Adjusts labels based on which categories are present
 */

import type { ParticipantCategory } from '$lib/types.js';

/**
 * Calculate intelligent age range label for a category
 * based on what other categories exist
 */
export function getIntelligentAgeRange(
	category: ParticipantCategory,
	allCategories: ParticipantCategory[]
): string {
	// If category has explicit age range, use it
	if (category.ageRange) return category.ageRange;
	
	// If no min/max age defined, return empty
	if (category.minAge === undefined && category.maxAge === undefined) {
		return '';
	}
	
	const catId = category.id.toLowerCase();
	const catLabel = category.label.toLowerCase();
	
	// Helper to check if category exists
	const hasCategory = (search: string) => 
		allCategories.some(c => 
			c.id.toLowerCase().includes(search) || 
			c.label.toLowerCase().includes(search)
		);
	
	// INFANT (0-2)
	if (catId.includes('infant') || catLabel.includes('infant') || catLabel.includes('baby')) {
		if (category.maxAge !== undefined) {
			return `0-${category.maxAge}`;
		}
		return '0-2';
	}
	
	// CHILD (typically 3-12)
	if (catId.includes('child') || catLabel.includes('child')) {
		const min = category.minAge ?? 3;
		const max = category.maxAge ?? 12;
		return `${min}-${max}`;
	}
	
	// TEENAGER/YOUTH (typically 13-17)
	if (catId.includes('teen') || catLabel.includes('teen') || 
	    catId.includes('youth') || catLabel.includes('youth')) {
		const min = category.minAge ?? 13;
		const max = category.maxAge ?? 17;
		return `${min}-${max}`;
	}
	
	// STUDENT (typically 18-25 or any age with ID)
	if (catId.includes('student') || catLabel.includes('student')) {
		if (category.minAge !== undefined && category.maxAge !== undefined) {
			return `${category.minAge}-${category.maxAge}`;
		} else if (category.minAge !== undefined) {
			return `${category.minAge}+`;
		}
		return ''; // Just "Student" without age
	}
	
	// SENIOR (typically 65+)
	if (catId.includes('senior') || catLabel.includes('senior')) {
		const min = category.minAge ?? 65;
		return `${min}+`;
	}
	
	// ADULT - This is the complex one that needs intelligence
	if (catId.includes('adult') || catLabel.includes('adult')) {
		const hasChild = hasCategory('child');
		const hasTeen = hasCategory('teen') || hasCategory('youth');
		const hasSenior = hasCategory('senior');
		
		// Determine adult's lower bound
		let minAge = 18; // Default
		if (hasTeen) {
			// If teenager exists (typically ends at 17), adult starts at 18
			minAge = 18;
		} else if (hasChild) {
			// If child exists (typically ends at 12), adult starts at 13
			minAge = 13;
		}
		
		// Determine adult's upper bound - ONLY if Senior exists
		if (hasSenior) {
			// Senior exists, so adult ends at 64
			return `${minAge}-64`;
		} else {
			// No senior, so adult is open-ended
			return `${minAge}+`;
		}
	}
	
	// DEFAULT: Use explicit min/max if provided
	if (category.minAge !== undefined && category.maxAge !== undefined) {
		return `${category.minAge}-${category.maxAge}`;
	} else if (category.minAge !== undefined) {
		return `${category.minAge}+`;
	} else if (category.maxAge !== undefined) {
		return `0-${category.maxAge}`;
	}
	
	return '';
}

/**
 * Get display label with intelligent age range
 */
export function getCategoryDisplayLabel(
	category: ParticipantCategory,
	allCategories: ParticipantCategory[]
): string {
	const ageRange = getIntelligentAgeRange(category, allCategories);
	
	// Remove existing age range from label if present
	const baseLabel = category.label.replace(/\s*\([\d\-+]+\)/, '').trim();
	
	if (ageRange) {
		return `${baseLabel} (${ageRange})`;
	}
	
	return baseLabel;
}

/**
 * Check if only one category exists (no need for age ranges)
 */
export function shouldShowAgeRanges(categories: ParticipantCategory[]): boolean {
	// Only show age ranges if multiple categories exist
	return categories.length > 1;
}


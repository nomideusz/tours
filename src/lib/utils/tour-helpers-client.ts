/**
 * Client-side tour utilities
 * 
 * This file contains all client-safe tour utilities that can be used in browser code.
 * No database imports or server-side dependencies.
 */

import type { Tour } from '$lib/types.js';
import { formatCurrency, formatTourOwnerCurrency } from '$lib/utils/currency.js';

// ============================================
// FORMATTING FUNCTIONS
// ============================================

/**
 * Format duration in minutes to human-readable format
 */
export function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	if (hours > 0) {
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
	return `${mins}m`;
}

/**
 * Capitalize the first letter of a category name
 */
export function formatCategoryName(category: string): string {
	if (!category || typeof category !== 'string') return '';
	return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

/**
 * Get the display price for a tour, handling all pricing models correctly
 */
export function getTourDisplayPrice(tour: Tour): number {
	// Private tour: use flat price
	if (tour.pricingModel === 'private_tour' && tour.privateTour?.flatPrice) {
		return tour.privateTour.flatPrice;
	}
	
	// Participant categories: use the first (typically adult) category price
	if (tour.pricingModel === 'participant_categories' && tour.participantCategories?.categories?.length) {
		// Find adult category first, or use the first category with lowest sortOrder
		const categories = tour.participantCategories.categories;
		const adultCategory = categories.find(c => c.id === 'adult' || c.label.toLowerCase().includes('adult'));
		if (adultCategory) {
			return adultCategory.price;
		}
		// Fallback to first category sorted by sortOrder
		const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
		return sorted[0]?.price || 0;
	}
	
	// Group tiers: return minimum tier price (legacy)
	if (tour.pricingModel === 'group_tiers' && tour.groupPricingTiers?.tiers?.length) {
		const minPrice = Math.min(...tour.groupPricingTiers.tiers.map(t => t.price));
		return minPrice;
	}
	
	// Adult/child pricing (legacy): use adult price as the display price
	if (tour.enablePricingTiers && tour.pricingTiers?.adult) {
		return parseFloat(tour.pricingTiers.adult.toString());
	}
	
	// Per person (legacy): use the regular price field
	return parseFloat(tour.price.toString()) || 0;
}

/**
 * Get formatted display price for a tour
 */
export function getTourDisplayPriceFormatted(tour: Tour): string {
	// Private tour: show flat rate with optional per-person estimate
	if (tour.pricingModel === 'private_tour' && tour.privateTour?.flatPrice) {
		const flatPrice = tour.privateTour.flatPrice;
		if (flatPrice === 0) {
			return 'Free';
		}
		// Just show the flat rate - per-person calculation is shown elsewhere
		return `${formatCurrency(flatPrice)} per tour`;
	}
	
	// Participant categories: show base price with indicator
	if (tour.pricingModel === 'participant_categories' && tour.participantCategories?.categories?.length) {
		const categories = tour.participantCategories.categories;
		
		// Check if we have multiple unique prices
		const uniquePrices = [...new Set(categories.map(c => c.price))].sort((a, b) => a - b);
		
		if (uniquePrices.length === 1) {
			// All categories same price
			const price = uniquePrices[0];
			if (price === 0) {
				return 'Free';
			}
			return `${formatCurrency(price)}/person`;
		} else if (uniquePrices.length > 1) {
			// Multiple prices - show range
			const minPrice = uniquePrices[0];
			const maxPrice = uniquePrices[uniquePrices.length - 1];
			
			if (minPrice === 0) {
				return `Free - ${formatCurrency(maxPrice)}/person`;
			}
			return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}/person`;
		}
	}
	
	// Group tiers (legacy): show price range
	if (tour.pricingModel === 'group_tiers' && tour.groupPricingTiers?.tiers?.length) {
		const prices = tour.groupPricingTiers.tiers.map(t => t.price);
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);
		
		if (minPrice === maxPrice) {
			return formatCurrency(minPrice);
		}
		return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
	}
	
	const price = getTourDisplayPrice(tour);
	// Show "Free" for zero-price tours
	if (price === 0) {
		return 'Free';
	}
	return formatCurrency(price);
}

/**
 * Get formatted display price for a tour with tour owner's currency
 */
export function getTourDisplayPriceFormattedWithCurrency(tour: Tour, ownerCurrency?: string): string {
	// Private tour: show flat rate
	if (tour.pricingModel === 'private_tour' && tour.privateTour?.flatPrice) {
		const flatPrice = tour.privateTour.flatPrice;
		if (flatPrice === 0) {
			return 'Free';
		}
		return `${formatTourOwnerCurrency(flatPrice, ownerCurrency)} per tour`;
	}
	
	// Participant categories: show price range if multiple prices
	if (tour.pricingModel === 'participant_categories' && tour.participantCategories?.categories?.length) {
		const categories = tour.participantCategories.categories;
		const uniquePrices = [...new Set(categories.map(c => c.price))].sort((a, b) => a - b);
		
		if (uniquePrices.length === 1) {
			const price = uniquePrices[0];
			if (price === 0) {
				return 'Free';
			}
			return `${formatTourOwnerCurrency(price, ownerCurrency)}/person`;
		} else if (uniquePrices.length > 1) {
			const minPrice = uniquePrices[0];
			const maxPrice = uniquePrices[uniquePrices.length - 1];
			
			if (minPrice === 0) {
				return `Free - ${formatTourOwnerCurrency(maxPrice, ownerCurrency)}/person`;
			}
			return `${formatTourOwnerCurrency(minPrice, ownerCurrency)} - ${formatTourOwnerCurrency(maxPrice, ownerCurrency)}/person`;
		}
	}
	
	// Group tiers (legacy): show price range with currency
	if (tour.pricingModel === 'group_tiers' && tour.groupPricingTiers?.tiers?.length) {
		const prices = tour.groupPricingTiers.tiers.map(t => t.price);
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);
		
		if (minPrice === maxPrice) {
			return formatTourOwnerCurrency(minPrice, ownerCurrency);
		}
		return `${formatTourOwnerCurrency(minPrice, ownerCurrency)} - ${formatTourOwnerCurrency(maxPrice, ownerCurrency)}`;
	}
	
	const price = getTourDisplayPrice(tour);
	// Show "Free" for zero-price tours
	if (price === 0) {
		return 'Free';
	}
	return formatTourOwnerCurrency(price, ownerCurrency);
}

/**
 * Format tour price with currency
 */
export function formatTourPrice(price: number | string): string {
	const numPrice = typeof price === 'string' ? parseFloat(price) : price;
	// Show "Free" for zero-price tours
	if (numPrice === 0) {
		return 'Free';
	}
	return formatCurrency(price);
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

/**
 * Get status color classes for tour status badges
 * Using semantic classes that work with CSS variables
 */
export function getTourStatusColor(status: Tour['status']): string {
	switch (status) {
		case 'active':
			return 'status-confirmed'; // Green status
		case 'draft':
			return 'status-default'; // Gray status
		default:
			return 'status-default';
	}
}

/**
 * Get status dot color for tour status indicators
 * Returns CSS variable-based background color
 */
export function getTourStatusDot(status: Tour['status']): string {
	switch (status) {
		case 'active':
			return 'bg-[var(--color-success-500)]';
		case 'draft':
			return 'bg-[var(--color-gray-500)]';
		default:
			return 'bg-[var(--color-gray-500)]';
	}
}

/**
 * Get status color classes for booking status badges
 * Using semantic classes that work with CSS variables
 */
export function getBookingStatusColor(status: string): string {
	switch (status) {
		case 'confirmed':
			return 'status-confirmed';
		case 'pending':
			return 'status-pending';
		case 'cancelled':
			return 'status-cancelled';
		case 'completed':
			return 'status-completed';
		case 'no_show':
			return 'status-default';
		default:
			return 'status-default';
	}
}

/**
 * Get status color classes for time slot status badges
 * Using semantic classes that work with CSS variables
 */
export function getSlotStatusColor(status: string): string {
	switch (status) {
		case 'active': 
			return 'status-confirmed';
		case 'full': 
			return 'status-cancelled';
		case 'cancelled': 
			return 'status-default';
		default: 
			return 'status-completed';
	}
}

// ============================================
// IMAGE UTILITIES
// ============================================

/**
 * Generate image URL for tour images (uses MinIO storage via API)
 */
export function getTourImageUrl(
	tourId: string, 
	imagePath: string | null | undefined, 
	size: 'small' | 'medium' | 'large' = 'medium'
): string {
	if (!tourId || !imagePath || typeof imagePath !== 'string') {
		return '';
	}
	
	try {
		// Handle old PocketBase URLs for backward compatibility
		if (imagePath.startsWith('http')) {
			return imagePath;
		}
		// MinIO storage via API endpoint
		return `/api/images/${encodeURIComponent(tourId)}/${encodeURIComponent(imagePath)}?size=${size}`;
	} catch (error) {
		console.warn('Error generating image URL:', error);
		return '';
	}
}

/**
 * Generate image URL for a specific tour and image (legacy compatibility)
 */
export function getImageUrl(tour: Tour | null | undefined, imagePath: string | null | undefined): string {
	if (!tour?.id) return '';
	return getTourImageUrl(tour.id, imagePath);
}

// ============================================
// CALCULATION UTILITIES
// ============================================

/**
 * Calculate conversion rate percentage (capped at 100% for display)
 */
export function calculateConversionRate(scans: number, conversions: number): number {
	if (scans === 0) return conversions > 0 ? 100 : 0; // If no scans but conversions exist, show 100%
	const rate = (conversions / scans) * 100;
	return Math.min(rate, 100); // Cap at 100% for better UX
}

/**
 * Get conversion rate display text with context
 */
export function getConversionRateText(scans: number, conversions: number): string {
	if (scans === 0 && conversions === 0) return '0%';
	if (scans === 0 && conversions > 0) return '100%*'; // Asterisk indicates special case
	
	const actualRate = (conversions / scans) * 100;
	if (actualRate > 100) {
		return '100%+'; // Plus sign indicates it's capped
	}
	
	return `${Math.round(actualRate)}%`;
}

/**
 * Get tour capacity utilization percentage
 */
export function getCapacityUtilization(bookedSpots: number, totalCapacity: number): number {
	return totalCapacity > 0 ? Math.min((bookedSpots / totalCapacity) * 100, 100) : 0;
}

/**
 * Check if a tour is bookable
 */
export function isTourBookable(tour: Tour, hasAvailableSlots: boolean = true): boolean {
	return tour.status === 'active' && hasAvailableSlots;
}

/**
 * Get booking status information for a tour
 */
export function getTourBookingStatus(tour: Tour) {
	const isDraft = tour.status === 'draft';
	const hasSlots = (tour.upcomingSlots || 0) > 0;
	
	if (isDraft) {
		return {
			status: 'draft' as const,
			label: 'Draft',
			description: 'Not visible to customers',
			color: 'var(--text-tertiary)',
			bgColor: 'var(--bg-tertiary)',
			borderColor: 'var(--border-secondary)',
			dotColor: 'var(--color-gray-400)',
			canBook: false,
			icon: 'draft'
		};
	}
	
	if (!hasSlots) {
		return {
			status: 'no-slots' as const,
			label: 'No Time Slots',
			description: 'Tour is not accepting bookings',
			color: 'var(--color-warning-600)',
			bgColor: 'var(--color-warning-50)',
			borderColor: 'var(--color-warning-200)',
			dotColor: 'var(--color-warning-400)',
			canBook: false,
			icon: 'warning'
		};
	}
	
	return {
		status: 'bookable' as const,
		label: 'Accepting Bookings',
		description: `${tour.upcomingSlots} scheduled slot(s)`,
		color: 'var(--color-success-600)',
		bgColor: 'var(--color-success-50)',
		borderColor: 'var(--color-success-200)',
		dotColor: 'var(--color-success-400)',
		canBook: true,
		icon: 'success'
	};
}

/**
 * Get the appropriate icon component for booking status
 */
export function getBookingStatusIcon(status: string) {
	switch (status) {
		case 'draft': return 'edit';
		case 'no-slots': return 'alert-triangle';
		case 'bookable': return 'check-circle';
		default: return 'circle';
	}
}

// ============================================
// CLIENT-SIDE API FUNCTIONS
// ============================================

/**
 * Toggle tour status between 'active' and 'draft'
 * @returns Promise with the new status or null if request failed
 */
export async function toggleTourStatus(tour: { id: string; status: 'active' | 'draft' }): Promise<'active' | 'draft' | null> {
	if (!tour?.id) return null;
	
	const newStatus = tour.status === 'active' ? 'draft' : 'active';
	
	try {
		const response = await fetch(`/api/tours/${tour.id}/status`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ status: newStatus })
		});

		if (response.ok) {
			return newStatus;
		} else {
			console.error('Failed to update tour status:', response.status, response.statusText);
			return null;
		}
	} catch (error) {
		console.error('Failed to update tour status:', error);
		return null;
	}
} 
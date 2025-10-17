/**
 * Pricing Calculation Utilities
 * Handles all-in pricing calculations with Stripe Express fees
 * Ensures regulatory compliance (FTC, California SB 478, UK, EU)
 */

import type { Tour } from '$lib/types.js';
import { getCategoryDisplayLabel } from './category-age-ranges.js';

// Stripe Express fee structure by currency
// Source: https://stripe.com/pricing
export const STRIPE_FEES = {
	EUR: { percentage: 1.5, fixed: 0.25 }, // EU: 1.5% + €0.25
	USD: { percentage: 2.9, fixed: 0.30 }, // US: 2.9% + $0.30
	GBP: { percentage: 1.5, fixed: 0.25 }, // UK: 1.5% + £0.25
	AUD: { percentage: 1.75, fixed: 0.30 }, // AU: 1.75% + A$0.30
	CAD: { percentage: 2.9, fixed: 0.30 }, // CA: 2.9% + C$0.30
	CHF: { percentage: 2.9, fixed: 0.30 }, // CH: 2.9% + CHF 0.30
	DKK: { percentage: 1.5, fixed: 1.80 }, // DK: 1.5% + kr1.80
	NOK: { percentage: 1.5, fixed: 1.80 }, // NO: 1.5% + kr1.80
	SEK: { percentage: 1.5, fixed: 1.80 }, // SE: 1.5% + kr1.80
	PLN: { percentage: 1.5, fixed: 1.00 }, // PL: 1.5% + zł1.00
	CZK: { percentage: 1.5, fixed: 6.00 }, // CZ: 1.5% + Kč6.00
	// Default for other currencies
	DEFAULT: { percentage: 2.9, fixed: 0.30 }
};

export interface PricingBreakdown {
	basePrice: number;         // Tour price set by guide
	stripeFee: number;         // Stripe processing fee
	totalPrice: number;        // What customer pays
	guideReceives: number;     // What guide gets (basePrice in Zaur's case)
}

/**
 * Calculate all-in pricing with Stripe fees
 */
export function calculateAllInPricing(
	basePrice: number,
	currency: string = 'EUR'
): PricingBreakdown {
	const fees = STRIPE_FEES[currency as keyof typeof STRIPE_FEES] || STRIPE_FEES.DEFAULT;
	
	// Calculate Stripe processing fee
	const stripeFee = basePrice * (fees.percentage / 100) + fees.fixed;
	
	// Total price customer pays (base + Stripe fee)
	const totalPrice = basePrice + stripeFee;
	
	// Guide receives the full base price (Zaur takes no commission)
	const guideReceives = basePrice;
	
	return {
		basePrice,
		stripeFee,
		totalPrice,
		guideReceives
	};
}

/**
 * Calculate pricing for participant categories
 */
export function calculateCategoryPricing(
	categories: Array<{ id: string; price: number; count: number }>,
	currency: string = 'EUR'
): PricingBreakdown {
	// Sum up base prices
	const basePrice = categories.reduce((sum, cat) => sum + (cat.price * cat.count), 0);
	
	return calculateAllInPricing(basePrice, currency);
}

/**
 * Apply group discount to base price
 */
export function applyGroupDiscount(
	basePrice: number,
	groupSize: number,
	discounts: Array<{ minSize: number; maxSize: number; discountPercent: number }>
): number {
	// Find applicable discount
	const discount = discounts.find(d => 
		groupSize >= d.minSize && groupSize <= d.maxSize
	);
	
	if (!discount) return basePrice;
	
	// Apply discount
	return basePrice * (1 - discount.discountPercent / 100);
}

/**
 * Apply early bird discount
 */
export function applyEarlyBirdDiscount(
	basePrice: number,
	bookingDate: Date,
	tourDate: Date,
	earlyBird?: { daysInAdvance: number; discountPercent: number }
): number {
	if (!earlyBird) return basePrice;
	
	// Calculate days in advance
	const daysInAdvance = Math.floor(
		(tourDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24)
	);
	
	// Apply discount if booking is early enough
	if (daysInAdvance >= earlyBird.daysInAdvance) {
		return basePrice * (1 - earlyBird.discountPercent / 100);
	}
	
	return basePrice;
}

/**
 * Calculate add-ons total
 */
export function calculateAddonsTotal(
	addons: Array<{ price: number; quantity: number }>
): number {
	return addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
}

/**
 * Format price for display
 */
export function formatPrice(
	amount: number,
	currency: string = 'EUR',
	locale: string = 'en-US'
): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(amount);
}

/**
 * Get minimum viable price for a currency
 * This helps prevent underpricing
 */
export function getMinimumViablePrice(currency: string): number {
	const minimums: Record<string, number> = {
		USD: 25,  // Reduced from 35 since no platform fees
		EUR: 20,  // Reduced from 30
		GBP: 18,  // Reduced from 25
		AUD: 30,  // Reduced from 45
		CAD: 28,  // Reduced from 40
		CHF: 25,
		DKK: 150,
		NOK: 200,
		SEK: 200,
		PLN: 80,
		CZK: 500
	};
	
	return minimums[currency] || 20;
}

/**
 * Pricing validation messages
 */
export interface PricingValidation {
	errors: string[];
	warnings: string[];
	suggestions: string[];
}

/**
 * Validate tour pricing
 */
export function validatePricing(
	basePrice: number,
	currency: string,
	duration: number, // in minutes
	participantCategories?: Array<{ label: string; price: number }>
): PricingValidation {
	const errors: string[] = [];
	const warnings: string[] = [];
	const suggestions: string[] = [];
	
	// Check minimum viable price
	const minPrice = getMinimumViablePrice(currency);
	if (basePrice < minPrice) {
		warnings.push(
			`Price below ${formatPrice(minPrice, currency)} may not cover basic costs like preparation time, equipment, and insurance.`
		);
	}
	
	// Calculate hourly rate
	const hourlyRate = (basePrice * 60) / duration;
	const minHourlyRate = minPrice * 2; // Rough estimate
	
	if (hourlyRate < minHourlyRate) {
		warnings.push(
			`Your hourly rate (${formatPrice(hourlyRate, currency)}) seems low. Consider the value of your expertise.`
		);
	}
	
	// Check participant categories
	if (participantCategories && participantCategories.length > 1) {
		const adult = participantCategories.find(c => 
			c.label.toLowerCase().includes('adult')
		);
		const child = participantCategories.find(c => 
			c.label.toLowerCase().includes('child')
		);
		
		if (adult && child) {
			if (child.price > adult.price * 0.8) {
				warnings.push(
					'Child prices are typically 50-60% of adult prices in the industry.'
				);
			}
			if (child.price === 0 && adult.price > 0) {
				suggestions.push(
					'Consider charging a small fee for children (3-12) to cover costs. Infants (0-2) typically go free.'
				);
			}
		}
	}
	
	// Positive reinforcement for good pricing
	if (basePrice >= minPrice * 1.5) {
		suggestions.push(
			'Great pricing! Remember to highlight your unique value and expertise.'
		);
	}
	
	// Remind about net income
	const { guideReceives, stripeFee } = calculateAllInPricing(basePrice, currency);
	suggestions.push(
		`You'll receive ${formatPrice(guideReceives, currency)} after Stripe fees (${formatPrice(stripeFee, currency)}). Zaur charges no commission!`
	);
	
	return { errors, warnings, suggestions };
}

/**
 * Calculate suggested price based on costs
 */
export interface CostFactors {
	hourlyRate: number;       // Guide's desired hourly rate
	duration: number;         // Tour duration in minutes
	prepTime: number;         // Preparation time in minutes
	equipmentCost: number;    // Per-tour equipment cost
	otherCosts: number;       // Insurance, licenses, etc. per tour
	targetOccupancy: number;  // Expected occupancy rate (0-1)
	profitMargin: number;     // Desired profit margin (0-1)
}

export function calculateSuggestedPrice(
	factors: CostFactors,
	maxCapacity: number
): number {
	// Calculate total time investment
	const totalHours = (factors.duration + factors.prepTime) / 60;
	const laborCost = totalHours * factors.hourlyRate;
	
	// Add fixed costs
	const totalCosts = laborCost + factors.equipmentCost + factors.otherCosts;
	
	// Divide by expected participants
	const expectedParticipants = maxCapacity * factors.targetOccupancy;
	const costPerPerson = totalCosts / Math.max(expectedParticipants, 1);
	
	// Add profit margin
	const suggestedPrice = costPerPerson * (1 + factors.profitMargin);
	
	// Round to nearest 5
	return Math.round(suggestedPrice / 5) * 5;
}

/**
 * Validate group pricing tiers
 */
export interface GroupPricingTier {
	minParticipants: number;
	maxParticipants: number;
	price: number;
	label?: string;
}

export function validatePricingTiers(tiers: GroupPricingTier[]): { errors: string[]; warnings: string[] } {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	if (!tiers || tiers.length === 0) {
		return { errors, warnings };
	}
	
	// Check each tier
	tiers.forEach((tier, index) => {
		const tierNum = index + 1;
		
		// Basic validation
		if (tier.minParticipants < 1) {
			errors.push(`Tier ${tierNum}: Minimum participants must be at least 1`);
		}
		
		if (tier.maxParticipants < tier.minParticipants) {
			errors.push(`Tier ${tierNum}: Maximum participants must be greater than or equal to minimum`);
		}
		
		if (tier.price < 0) {
			errors.push(`Tier ${tierNum}: Price cannot be negative`);
		}
		
		// Warning for very low prices
		if (tier.price > 0 && tier.price < 10) {
			warnings.push(`Tier ${tierNum}: Price seems very low - make sure it covers your costs`);
		}
	});
	
	// Check for overlaps and gaps
	const sortedTiers = [...tiers].sort((a, b) => a.minParticipants - b.minParticipants);
	
	for (let i = 0; i < sortedTiers.length - 1; i++) {
		const current = sortedTiers[i];
		const next = sortedTiers[i + 1];
		
		// Check for overlaps
		if (current.maxParticipants >= next.minParticipants) {
			errors.push(`Tiers overlap: ${current.minParticipants}-${current.maxParticipants} overlaps with ${next.minParticipants}-${next.maxParticipants}`);
		}
		
		// Check for gaps
		if (current.maxParticipants + 1 < next.minParticipants) {
			warnings.push(`Gap in coverage: No pricing for ${current.maxParticipants + 1} to ${next.minParticipants - 1} participants`);
		}
	}
	
	// Check pricing logic (usually decreases per person as group size increases)
	for (let i = 0; i < sortedTiers.length - 1; i++) {
		const current = sortedTiers[i];
		const next = sortedTiers[i + 1];
		
		const currentPerPerson = current.price / current.maxParticipants;
		const nextPerPerson = next.price / next.minParticipants;
		
		if (nextPerPerson > currentPerPerson * 1.2) {
			warnings.push(`Unusual pricing: Per-person price increases significantly from tier ${i + 1} to ${i + 2}`);
		}
	}
	
	return { errors, warnings };
}

/**
 * Calculate booking price with participant categories, group discounts, and add-ons
 * Option A: Apply group discount to all category prices
 */
export interface BookingPriceResult {
	basePrice: number;           // Total before discounts and add-ons
	groupDiscount: number;       // Amount saved from group discount
	discountedBase: number;      // Base price after group discount
	addonsTotal: number;         // Total cost of add-ons
	totalAmount: number;         // Final amount to charge
	errors: string[];
	categoryBreakdown?: {        // Detailed breakdown per category
		[categoryId: string]: {
			label: string;
			count: number;
			originalPrice: number;
			discountedPrice: number;
			subtotal: number;
		};
	};
	selectedTier?: {
		minParticipants: number;
		maxParticipants: number;
		discountPercent?: number;
		label?: string;
	};
}

export function calculateBookingPrice(
	tour: Tour,
	totalParticipants: number,
	selectedAddonIds: string[] = [],
	adultCount?: number,
	childCount?: number,
	participantsByCategory?: Record<string, number>
): BookingPriceResult {
	const errors: string[] = [];
	let basePrice = 0;
	let groupDiscount = 0;
	let discountedBase = 0;
	let categoryBreakdown: any = {};
	let selectedTier: any = null;
	
	// Handle different pricing models
	if (tour.pricingModel === 'participant_categories' && tour.participantCategories) {
		// Calculate base price from participant categories
		const categories = tour.participantCategories.categories || [];
		
		// If we have detailed participant counts by category (NEW)
		if (participantsByCategory && Object.keys(participantsByCategory).length > 0) {
			Object.entries(participantsByCategory).forEach(([catId, count]) => {
				if (count > 0) {
					const category = categories.find(c => c.id === catId);
					if (category) {
						basePrice += category.price * count;
						categoryBreakdown[catId] = {
							label: getCategoryDisplayLabel(category, categories),
							count,
							originalPrice: category.price,
							discountedPrice: category.price,
							subtotal: category.price * count
						};
					}
				}
			});
		}
		// If we have legacy adult/child counts, use them
		else if (adultCount !== undefined || childCount !== undefined) {
			const adultCat = categories.find(c => c.id === 'adult' || c.label.toLowerCase().includes('adult'));
			const childCat = categories.find(c => c.id === 'child' || c.label.toLowerCase().includes('child'));
			
			if (adultCat && adultCount) {
				basePrice += adultCat.price * adultCount;
				categoryBreakdown[adultCat.id] = {
					label: getCategoryDisplayLabel(adultCat, categories),
					count: adultCount,
					originalPrice: adultCat.price,
					discountedPrice: adultCat.price,
					subtotal: adultCat.price * adultCount
				};
			}
			
			if (childCat && childCount) {
				basePrice += childCat.price * childCount;
				categoryBreakdown[childCat.id] = {
					label: getCategoryDisplayLabel(childCat, categories),
					count: childCount,
					originalPrice: childCat.price,
					discountedPrice: childCat.price,
					subtotal: childCat.price * childCount
				};
			}
		} else {
			// Use totalParticipants (assume all adults if no breakdown provided)
			const adultCat = categories.find(c => c.id === 'adult' || c.label.toLowerCase().includes('adult'));
			if (adultCat) {
				basePrice = adultCat.price * totalParticipants;
				categoryBreakdown[adultCat.id] = {
					label: getCategoryDisplayLabel(adultCat, categories),
					count: totalParticipants,
					originalPrice: adultCat.price,
					discountedPrice: adultCat.price,
					subtotal: adultCat.price * totalParticipants
				};
			}
		}
		
		// Apply group discounts if enabled
		if (tour.groupDiscounts?.enabled && tour.groupDiscounts.tiers.length > 0) {
			// Find applicable discount tier
			const applicableTier = tour.groupDiscounts.tiers.find(tier => 
				totalParticipants >= tier.minParticipants && 
				totalParticipants <= tier.maxParticipants
			);
			
			if (applicableTier) {
				selectedTier = {
					minParticipants: applicableTier.minParticipants,
					maxParticipants: applicableTier.maxParticipants,
					discountPercent: applicableTier.discountType === 'percentage' ? applicableTier.discountValue : undefined,
					label: applicableTier.label
				};
				
				// Apply discount to each category
				Object.keys(categoryBreakdown).forEach(catId => {
					const cat = categoryBreakdown[catId];
					
					if (applicableTier.discountType === 'percentage') {
						// Percentage discount: reduce price per person
						const discountPercent = applicableTier.discountValue;
						cat.discountedPrice = cat.originalPrice * (1 - discountPercent / 100);
						cat.subtotal = cat.discountedPrice * cat.count;
						selectedTier.discountPercent = discountPercent;
					} else {
						// Fixed price: set new price per person
						cat.discountedPrice = applicableTier.discountValue;
						cat.subtotal = cat.discountedPrice * cat.count;
					}
				});
				
				// Recalculate discounted base
				discountedBase = Object.values(categoryBreakdown).reduce(
					(sum: number, cat: any) => sum + cat.subtotal, 
					0
				);
				groupDiscount = basePrice - discountedBase;
			} else {
				// No applicable discount
				discountedBase = basePrice;
			}
		} else {
			// No group discounts
			discountedBase = basePrice;
		}
		
	} else if (tour.pricingModel === 'group_tiers' && tour.groupPricingTiers) {
		// Group-based pricing (flat price for group size)
		const tier = tour.groupPricingTiers.tiers.find((t: any) => 
			totalParticipants >= t.minParticipants && 
			totalParticipants <= t.maxParticipants
		);
		
		if (tier) {
			basePrice = tier.price;
			discountedBase = tier.price;
			selectedTier = {
				minParticipants: tier.minParticipants,
				maxParticipants: tier.maxParticipants,
				label: tier.label
			};
		} else {
			errors.push('No pricing tier found for this group size');
		}
	} else {
		// Legacy per-person pricing
		const priceNum = typeof tour.price === 'string' ? parseFloat(tour.price) : tour.price;
		basePrice = priceNum * totalParticipants;
		discountedBase = basePrice;
	}
	
	// Calculate add-ons total
	let addonsTotal = 0;
	if (tour.optionalAddons?.addons && selectedAddonIds.length > 0) {
		tour.optionalAddons.addons.forEach(addon => {
			if (selectedAddonIds.includes(addon.id)) {
				// Add-ons are per-person
				addonsTotal += addon.price * totalParticipants;
			}
		});
	}
	
	// Final total
	const totalAmount = discountedBase + addonsTotal;
	
	return {
		basePrice,
		groupDiscount,
		discountedBase,
		addonsTotal,
		totalAmount,
		errors,
		categoryBreakdown: Object.keys(categoryBreakdown).length > 0 ? categoryBreakdown : undefined,
		selectedTier
	};
}
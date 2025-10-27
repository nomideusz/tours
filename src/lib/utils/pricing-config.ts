export interface PricingFeature {
	text: string;
	included: boolean;
	comingSoon?: boolean;
}

export interface PricingPlan {
	id: 'free' | 'starter_pro' | 'professional' | 'agency';
	name: string;
	description: string;
	monthlyBookingLimit: number | null; // null = unlimited
	tourLimit: number | null; // null = unlimited
	basePrice: {
		monthly: number;
		yearly: number;
	};
	features: PricingFeature[];
	popular?: boolean;
	hidden?: boolean; // Hide from public pricing pages
	ctaText: string;
	ctaLink: string;
}

export const PRICING_PLANS: PricingPlan[] = [
	// Note: Free plan removed from public display (abandoned)
	// Free and Agency plans kept in type definitions for backward compatibility with existing DB records
	{
		id: 'starter_pro',
		name: 'Essential',
		description: 'Perfect for independent guides',
		monthlyBookingLimit: 60,
		tourLimit: 5,
		basePrice: { monthly: 25, yearly: 250 },
		popular: true,
		features: [
			{ text: '60 bookings/month', included: true },
			{ text: '5 tour types', included: true },
			{ text: 'Remove Zaur branding', included: true },
			{ text: 'Priority discovery ranking', included: true },
			{ text: 'Custom logo & colors', included: true, comingSoon: true },
			{ text: 'Basic analytics', included: true },
			{ text: 'QR code customization', included: true, comingSoon: true },
			{ text: 'Review collection prompts', included: true, comingSoon: true },
			{ text: 'Email support', included: true }
		],
		ctaText: 'Get Early Access',
		ctaLink: '/auth/register'
	},
	{
		id: 'professional',
		name: 'Premium',
		description: 'Scale your tour business',
		monthlyBookingLimit: null,
		tourLimit: null,
		basePrice: { monthly: 49, yearly: 490 },
		features: [
			{ text: 'Unlimited bookings', included: true },
			{ text: 'Unlimited tour types', included: true },
			{ text: 'Featured discovery listings', included: true },
			{ text: '"Verified Operator" badge', included: true },
			{ text: 'Discovery analytics', included: true },
			{ text: 'Advanced analytics & insights', included: true },
			{ text: 'WhatsApp notifications', included: true },
			{ text: 'Calendar sync (Google/Outlook)', included: true, comingSoon: true },
			{ text: 'Customer database export', included: true },
			{ text: 'Review automation', included: true, comingSoon: true },
			{ text: 'Multi-language booking pages', included: true, comingSoon: true },
			{ text: 'Weather integration', included: true},
			{ text: 'Cancellation management', included: true },
			{ text: 'Priority support (24h response)', included: true }
		],
		ctaText: 'Get Early Access',
		ctaLink: '/auth/register'
	}
	// Note: Agency plan also removed from public display (abandoned)
];

// Beta discount constants
export const EARLY_ACCESS_DISCOUNT = 0.5; // 50% off (legacy - not currently used)
export const BETA_1_DISCOUNT = 0.30; // 30% lifetime discount for Beta 1 users
export const BETA_2_DISCOUNT = 0.20; // 20% lifetime discount for Beta 2 users

// Beta 1 pricing (exact prices from Stripe, matches original script)
export const BETA_1_PRICES = {
	starter_pro: {
		monthly: 11.20, // From original base €16 - 30%
		yearly: 109.20 // Annual with 2 free months built in
	},
	professional: {
		monthly: 24.50, // From original base €35 - 30%
		yearly: 310.80 // Annual with 2 free months built in (was €245/year + extra discount)
	}
};

// Beta 2 pricing (20% off, rounded to clean numbers matching Stripe)
export const BETA_2_PRICES = {
	starter_pro: {
		monthly: 20, // €25 - 20% = €20
		yearly: 200 // €250 - 20% = €200
	},
	professional: {
		monthly: 39, // €49 - 20% ≈ €39 (rounded from €39.20)
		yearly: 390 // €490 - 20% ≈ €390 (rounded from €392)
	}
};

// User context for pricing calculations
export interface UserPricingContext {
	betaGroup?: 'beta_1' | 'beta_2' | 'public' | null;
	subscriptionFreeUntil?: string | null;
	subscriptionDiscountPercentage?: number | null;
	isLifetimeDiscount?: boolean | null;
	promoCodeUsed?: string | null;
}

// Pricing result interface
export interface PricingResult {
	original: number;
	final: number;
	savings: number;
	isInFreePeriod?: boolean;
	discountPercentage?: number;
	isLifetimeDiscount?: boolean;
}

// Calculate discounted price with precision (legacy function for simple early access)
export function calculateEarlyAccessPrice(basePrice: number): number {
	return Math.round(basePrice * (1 - EARLY_ACCESS_DISCOUNT) * 100) / 100;
}

// Advanced pricing calculation with user context
export function calculatePlanPricing(
	planId: 'free' | 'starter_pro' | 'professional' | 'agency',
	interval: 'monthly' | 'yearly',
	userContext?: UserPricingContext
): PricingResult {
	const plan = PRICING_PLANS.find(p => p.id === planId);
	
	if (!plan || planId === 'free' || planId === 'agency') {
		return { original: 0, final: 0, savings: 0 };
	}
	
	// Get the base price (yearly is annual total, monthly is per month)
	const originalPrice = plan.basePrice[interval];
	
	// Check if user is in free period
	const isInFreePeriod = !!(userContext?.subscriptionFreeUntil && 
		new Date(userContext.subscriptionFreeUntil) > new Date());
	
	// Determine user's cohort - check both betaGroup and discount percentage fields
	let cohort = userContext?.betaGroup || 'public';
	
	// Fallback: If betaGroup not set, determine from discount percentage
	if (cohort === 'public' && userContext?.subscriptionDiscountPercentage) {
		if (userContext.subscriptionDiscountPercentage === 30 && userContext.isLifetimeDiscount) {
			cohort = 'beta_1';
		} else if (userContext.subscriptionDiscountPercentage === 20 && userContext.isLifetimeDiscount) {
			cohort = 'beta_2';
		}
	}
	
	// Calculate based on cohort using exact prices (not percentages, to avoid rounding issues)
	if (cohort === 'beta_1') {
		// Beta 1: Use exact prices from BETA_1_PRICES constant
		const finalPrice = BETA_1_PRICES[planId]?.[interval] || originalPrice;
		const discount = originalPrice - finalPrice;
		return {
			original: originalPrice,
			final: finalPrice,
			savings: discount,
			discountPercentage: 30,
			isLifetimeDiscount: true,
			isInFreePeriod
		};
	} else if (cohort === 'beta_2') {
		// Beta 2: Use exact prices from BETA_2_PRICES constant
		const finalPrice = BETA_2_PRICES[planId]?.[interval] || originalPrice;
		const discount = originalPrice - finalPrice;
		return {
			original: originalPrice,
			final: finalPrice,
			savings: discount,
			discountPercentage: 20,
			isLifetimeDiscount: true,
			isInFreePeriod
		};
	}
	
	// Check for other custom discount percentages (promo codes, etc.)
	if (userContext?.subscriptionDiscountPercentage && userContext.subscriptionDiscountPercentage > 0) {
		const discountDecimal = userContext.subscriptionDiscountPercentage / 100;
		const finalPrice = Math.round(originalPrice * (1 - discountDecimal) * 100) / 100;
		const discount = originalPrice - finalPrice;
		return {
			original: originalPrice,
			final: finalPrice,
			savings: discount,
			discountPercentage: userContext.subscriptionDiscountPercentage,
			isLifetimeDiscount: userContext.isLifetimeDiscount || false,
			isInFreePeriod
		};
	}
	
	// Public cohort: full price, no discount
	return {
		original: originalPrice,
		final: originalPrice,
		savings: 0,
		isInFreePeriod
	};
}

// Get plan by ID
export function getPlanById(id: string): PricingPlan | undefined {
	return PRICING_PLANS.find(plan => plan.id === id);
}

// Features that are already implemented (not coming soon)
export const IMPLEMENTED_FEATURES = [
	'bookings/month',
	'tour types', 
	'Basic QR codes',
	'Email notifications',
	'Zaur branding visible',
	'Remove Zaur branding',
	'Email support',
	'Unlimited bookings',
	'Unlimited tour types',
	'Priority support',
	'Customer database export',
	'Dedicated account manager',
	'Basic analytics',
	'Advanced analytics',
	'Tour discovery listing',
	'Priority discovery ranking',
	'Featured discovery listings',
	'"Verified Operator" badge',
	'Discovery analytics',
	'Branded operator pages',
	'Multi-location discovery promotion'
];

export function isFeatureImplemented(featureText: string): boolean {
	return IMPLEMENTED_FEATURES.some(f => 
		featureText.toLowerCase().includes(f.toLowerCase())
	);
}

// Helper to check if user is Beta 2 member
export function isBeta2User(userContext?: UserPricingContext): boolean {
	return userContext?.subscriptionDiscountPercentage === 20 && 
	       userContext?.isLifetimeDiscount === true;
}

// Helper to check if user is Beta 1 or Early Access member
export function isBeta1User(userContext?: UserPricingContext): boolean {
	return userContext?.subscriptionDiscountPercentage === 30 && 
	       userContext?.isLifetimeDiscount === true;
}

// Get user's beta cohort identifier
export function getUserBetaCohort(userContext?: UserPricingContext): 'beta_1' | 'beta_2' | null {
	if (isBeta1User(userContext)) return 'beta_1';
	if (isBeta2User(userContext)) return 'beta_2';
	return null;
} 
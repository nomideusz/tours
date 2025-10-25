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
	ctaText: string;
	ctaLink: string;
}

export const PRICING_PLANS: PricingPlan[] = [
	{
		id: 'free',
		name: 'Free Starter',
		description: 'Perfect for trying out Zaur',
		monthlyBookingLimit: 3,
		tourLimit: 1,
		basePrice: { monthly: 0, yearly: 0 },
		features: [
			{ text: '3 bookings/month', included: true },
			{ text: '1 tour type', included: true },
			{ text: 'Basic QR codes', included: true },
			{ text: 'Email notifications', included: true },
			{ text: 'Tour discovery listing', included: true },
			{ text: 'Zaur branding visible', included: false },
			{ text: 'No SMS notifications', included: false },
			{ text: 'No analytics', included: false }
		],
		ctaText: 'Start Free',
		ctaLink: '/auth/register'
	},
	{
		id: 'starter_pro',
		name: 'Essential',
		description: 'Perfect for independent guides',
		monthlyBookingLimit: 60,
		tourLimit: 5,
		basePrice: { monthly: 25, yearly: 20.83 },
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
		basePrice: { monthly: 49, yearly: 40.83 },
		features: [
			{ text: 'Unlimited bookings', included: true },
			{ text: 'Unlimited tour types', included: true },
			{ text: 'Featured discovery listings', included: true },
			{ text: '"Verified Operator" badge', included: true },
			{ text: 'Discovery analytics', included: true },
			{ text: 'Advanced analytics & insights', included: true },
			{ text: 'WhatsApp notifications', included: true, comingSoon: true },
			{ text: 'Calendar sync (Google/Outlook)', included: true, comingSoon: true },
			{ text: 'Customer database export', included: true },
			{ text: 'Review automation', included: true, comingSoon: true },
			{ text: 'Multi-language booking pages', included: true, comingSoon: true },
			{ text: 'Weather integration', included: true, comingSoon: true },
			{ text: 'Cancellation management', included: true, comingSoon: true },
			{ text: 'Priority support (24h response)', included: true }
		],
		ctaText: 'Get Early Access',
		ctaLink: '/auth/register'
	},
	{
		id: 'agency',
		name: 'Agency',
		description: 'For tour companies',
		monthlyBookingLimit: null,
		tourLimit: null,
		basePrice: { monthly: 115, yearly: 95 },
		features: [
			{ text: 'Everything in Professional', included: true },
			{ text: 'Branded operator pages', included: true },
			{ text: 'Multi-location discovery promotion', included: true },
			{ text: 'SMS notifications', included: true, comingSoon: true },
			{ text: 'Up to 10 tour guides', included: true, comingSoon: true },
			{ text: 'Team management dashboard', included: true, comingSoon: true },
			{ text: 'Revenue sharing tools', included: true, comingSoon: true },
			{ text: 'White-label options', included: true, comingSoon: true },
			{ text: 'Custom domain (agency.zaur.app)', included: true, comingSoon: true },
			{ text: 'Advanced reporting (ROI, conversion rates)', included: true, comingSoon: true },
			{ text: 'API access', included: true, comingSoon: true },
			{ text: 'Dedicated account manager', included: true },
			{ text: 'Multi-location management', included: true, comingSoon: true }
		],
		ctaText: 'Contact Sales',
		ctaLink: '/contact'
	}
];

// Beta discount constants
export const EARLY_ACCESS_DISCOUNT = 0.5; // 50% off (legacy - not currently used)
export const BETA_1_DISCOUNT = 0.30; // 30% lifetime discount for Beta 1 users
export const BETA_2_DISCOUNT = 0.20; // 20% lifetime discount for Beta 2 users

// Beta 2 pricing (20% off full prices)
export const BETA_2_PRICES = {
	starter_pro: {
		monthly: 20, // €25 - 20% = €20
		yearly: 20
	},
	professional: {
		monthly: 39.2, // €49 - 20% = €39.20
		yearly: 39.2
	}
};

// User context for pricing calculations
export interface UserPricingContext {
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
	
	if (!plan || planId === 'free') {
		return { original: 0, final: 0, savings: 0 };
	}
	
	const originalPrice = plan.basePrice[interval];
	
	// If no user context, use early access pricing (for marketing page)
	if (!userContext) {
		const finalPrice = calculateEarlyAccessPrice(originalPrice);
		return {
			original: originalPrice,
			final: finalPrice,
			savings: originalPrice - finalPrice
		};
	}
	
	// Check if user is in free period (from promo code)
	const isInFreePeriod = userContext.subscriptionFreeUntil && 
		new Date(userContext.subscriptionFreeUntil) > new Date();
		
	if (isInFreePeriod) {
		return {
			original: originalPrice,
			final: 0,
			savings: originalPrice,
			isInFreePeriod: true
		};
	}
	
	// Apply promo code discount if user has one
	const discountPercentage = userContext.subscriptionDiscountPercentage || 0;
	if (discountPercentage > 0) {
		const discount = Math.round((originalPrice * discountPercentage) / 100 * 100) / 100;
		return {
			original: originalPrice,
			final: Math.round((originalPrice - discount) * 100) / 100,
			savings: discount,
			discountPercentage,
			isLifetimeDiscount: userContext.isLifetimeDiscount || false
		};
	}
	
	// No user-specific discounts - use early access pricing
	const finalPrice = calculateEarlyAccessPrice(originalPrice);
	return {
		original: originalPrice,
		final: finalPrice,
		savings: originalPrice - finalPrice
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
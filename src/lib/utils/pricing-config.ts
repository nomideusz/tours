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
		name: 'Solo Guide',
		description: 'Perfect for independent guides',
		monthlyBookingLimit: 60,
		tourLimit: 5,
		basePrice: { monthly: 20, yearly: 17 },
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
		name: 'Professional',
		description: 'Scale your tour business',
		monthlyBookingLimit: null,
		tourLimit: null,
		basePrice: { monthly: 45, yearly: 37 },
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

// Early access discount (50% off)
export const EARLY_ACCESS_DISCOUNT = 0.5;

// Calculate discounted price
export function calculateEarlyAccessPrice(basePrice: number): number {
	return Math.round(basePrice * (1 - EARLY_ACCESS_DISCOUNT));
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
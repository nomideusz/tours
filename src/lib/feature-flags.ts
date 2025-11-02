// Feature flags for early access
export const FEATURES = {
	// Phase 1 - Already implemented
	CORE_BOOKING: true,
	QR_CODES: true,
	EMAIL_NOTIFICATIONS: true,
	BASIC_DASHBOARD: true,
	
	// Phase 2 - Coming soon
	CUSTOM_BRANDING: false,
	SMS_NOTIFICATIONS: false,
	BASIC_ANALYTICS: false,
	CUSTOMER_EXPORT: false,
	
	// Phase 3 - Future
	MULTI_LANGUAGE: false,
	CALENDAR_SYNC: false,
	WHATSAPP_NOTIFICATIONS: true, // ✅ Enabled for Professional+ users
	REVIEW_COLLECTION: false,
	QR_CUSTOMIZATION: false,
	
	// Phase 4 - Advanced
	ADVANCED_ANALYTICS: false,
	WEATHER_INTEGRATION: false,
	AGENCY_FEATURES: false,
	API_ACCESS: false,
	CANCELLATION_MANAGEMENT: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export function isFeatureEnabled(feature: FeatureFlag): boolean {
	return FEATURES[feature] ?? false;
}

// Check if user's plan has access to a feature (when it's released)
export function hasFeatureAccess(
	feature: FeatureFlag, 
	userPlan: 'free' | 'starter_pro' | 'professional' | 'agency',
	betaGroup?: 'beta_1' | 'beta_2' | 'public' | null,
	isInFreeTrial?: boolean
): boolean {
	// First check if feature is even enabled
	if (!isFeatureEnabled(feature)) {
		return false;
	}
	
	// Beta 1 and Beta 2 users get Premium access during their free trial
	// This allows them to test all Premium features before committing
	if ((betaGroup === 'beta_1' || betaGroup === 'beta_2') && isInFreeTrial) {
		const professionalFeatures: FeatureFlag[] = [
			'CORE_BOOKING', 'QR_CODES', 'EMAIL_NOTIFICATIONS', 'BASIC_DASHBOARD',
			'CUSTOM_BRANDING', 'SMS_NOTIFICATIONS', 'BASIC_ANALYTICS', 
			'QR_CUSTOMIZATION', 'REVIEW_COLLECTION',
			'CUSTOMER_EXPORT', 'ADVANCED_ANALYTICS', 'WHATSAPP_NOTIFICATIONS',
			'CALENDAR_SYNC', 'MULTI_LANGUAGE', 'WEATHER_INTEGRATION', 'CANCELLATION_MANAGEMENT'
		];
		
		if (professionalFeatures.includes(feature)) {
			return true;
		}
	}
	
	// Then check plan access
	const planFeatures: Record<FeatureFlag, string[]> = {
		// Core features available to all
		CORE_BOOKING: ['free', 'starter_pro', 'professional', 'agency'],
		QR_CODES: ['free', 'starter_pro', 'professional', 'agency'],
		EMAIL_NOTIFICATIONS: ['free', 'starter_pro', 'professional', 'agency'],
		BASIC_DASHBOARD: ['free', 'starter_pro', 'professional', 'agency'],
		
		// Paid features
		CUSTOM_BRANDING: ['starter_pro', 'professional', 'agency'],
		SMS_NOTIFICATIONS: ['starter_pro', 'professional', 'agency'],
		BASIC_ANALYTICS: ['starter_pro', 'professional', 'agency'],
		QR_CUSTOMIZATION: ['starter_pro', 'professional', 'agency'],
		REVIEW_COLLECTION: ['starter_pro', 'professional', 'agency'],
		
		// Professional features
		CUSTOMER_EXPORT: ['professional', 'agency'],
		ADVANCED_ANALYTICS: ['professional', 'agency'],
		WHATSAPP_NOTIFICATIONS: ['professional', 'agency'],
		CALENDAR_SYNC: ['professional', 'agency'],
		MULTI_LANGUAGE: ['professional', 'agency'],
		WEATHER_INTEGRATION: ['professional', 'agency'],
		CANCELLATION_MANAGEMENT: ['professional', 'agency'],
		
		// Agency only
		AGENCY_FEATURES: ['agency'],
		API_ACCESS: ['agency'],
	};
	
	return planFeatures[feature]?.includes(userPlan) ?? false;
}

// Get list of coming soon features for a plan
export function getComingSoonFeatures(userPlan: string): string[] {
	const features: string[] = [];
	
	for (const [key, enabled] of Object.entries(FEATURES)) {
		if (!enabled && hasFeatureAccess(key as FeatureFlag, userPlan as unknown as 'free' | 'starter_pro' | 'professional' | 'agency')) {
			features.push(key);
		}
	}
	
	return features;
} 
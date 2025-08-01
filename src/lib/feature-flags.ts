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
	userPlan: 'free' | 'starter_pro' | 'professional' | 'agency'
): boolean {
	// First check if feature is even enabled
	if (!isFeatureEnabled(feature)) {
		return false;
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
		if (!enabled && hasFeatureAccess(key as FeatureFlag, userPlan as any)) {
			features.push(key);
		}
	}
	
	return features;
} 
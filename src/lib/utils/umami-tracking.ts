/**
 * Umami Analytics Event Tracking Utilities
 * 
 * This module provides type-safe event tracking for Umami analytics.
 * It helps track user behavior on marketing pages to optimize conversion rates.
 */

// Umami tracking interface (global umami object)
declare global {
	interface Window {
		umami?: {
			track: (eventName: string, eventData?: Record<string, any>) => void;
		};
	}
}

/**
 * Predefined event types for consistent tracking
 */
export const UMAMI_EVENTS = {
	// Page interactions
	PAGE_VIEW: 'page_view',
	SECTION_VIEW: 'section_view',
	
	// Beta registration funnel
	BETA_CTA_CLICK: 'beta_cta_click',
	BETA_APPLY_START: 'beta_apply_start',
	BETA_FORM_FIELD_FOCUS: 'beta_form_field_focus',
	BETA_FORM_SUBMIT: 'beta_form_submit',
	BETA_FORM_SUCCESS: 'beta_form_success',
	BETA_FORM_ERROR: 'beta_form_error',
	
	// Marketing interactions
	HERO_CTA_CLICK: 'hero_cta_click',
	PRICING_VIEW: 'pricing_view',
	FAQ_EXPAND: 'faq_expand',
	NEWSLETTER_SIGNUP: 'newsletter_signup',
	DEMO_REQUEST: 'demo_request',
	
	// Navigation
	NAV_CLICK: 'nav_click',
	FOOTER_LINK_CLICK: 'footer_link_click',
	
	// Engagement
	VIDEO_PLAY: 'video_play',
	IMAGE_CLICK: 'image_click',
	EXTERNAL_LINK_CLICK: 'external_link_click',
	
	// Drop-off points
	FORM_ABANDON: 'form_abandon',
	PAGE_EXIT: 'page_exit',
} as const;

/**
 * Event data interfaces for type safety
 */
export interface BaseEventData {
	page?: string;
	section?: string;
	element?: string;
	value?: string | number;
}

export interface BetaFunnelEventData extends BaseEventData {
	step?: 'hero' | 'pricing' | 'faq' | 'final_cta' | 'form';
	form_field?: string;
	form_completion?: number; // percentage
}

export interface NavigationEventData extends BaseEventData {
	destination?: string;
	source_section?: string;
}

/**
 * Check if current user should be excluded from tracking
 * Based on device fingerprint characteristics
 */
function shouldExcludeFromTracking(): boolean {
	if (typeof window === 'undefined') return false;
	
	// Admin user exclusion
	const currentUserData = (window as any).__CURRENT_USER__;
	if (currentUserData?.role === 'admin') {
		return true;
	}
	
	// Device fingerprint for Zaur's computer
	// Characteristics: Poland, Krakow, Windows 10/11, Desktop, Opera
	const userAgent = navigator.userAgent;
	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const language = navigator.language;
	const screenWidth = screen.width;
	const screenHeight = screen.height;
	
	// Check for Zaur's device characteristics
	const isOpera = /OPR\/|Opera/i.test(userAgent);
	const isWindows = /Windows/i.test(userAgent);
	const isPolandTimezone = timezone === 'Europe/Warsaw';
	const isDesktop = screenWidth >= 1024 && screenHeight >= 768;
	const isPolishLocale = language.toLowerCase().startsWith('pl') || language.toUpperCase().includes('PL');
	
	// High confidence match - exclude if most characteristics match
	let matchScore = 0;
	if (isOpera) matchScore++;
	if (isWindows) matchScore++;
	if (isPolandTimezone) matchScore++;
	if (isDesktop) matchScore++;
	if (isPolishLocale) matchScore++;
	
	// Exclude if 4 out of 5 characteristics match
	const shouldExclude = matchScore >= 4;
	
	if (shouldExclude && import.meta.env.DEV) {
		console.log('🚫 Excluding from Umami tracking - device fingerprint match:', {
			opera: isOpera,
			windows: isWindows,
			polandTz: isPolandTimezone,
			desktop: isDesktop,
			polishLocale: isPolishLocale,
			score: matchScore
		});
	}
	
	return shouldExclude;
}

/**
 * Debug function to check device fingerprint (development only)
 * Call this in browser console to see your device characteristics
 */
export function debugDeviceFingerprint(): boolean {
	if (typeof window === 'undefined') {
		console.log('❌ Server-side - no device info available');
		return false;
	}
	
	const userAgent = navigator.userAgent;
	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const language = navigator.language;
	const screenWidth = screen.width;
	const screenHeight = screen.height;
	
	// Check characteristics
	const isOpera = /OPR\/|Opera/i.test(userAgent);
	const isWindows = /Windows/i.test(userAgent);
	const isPolandTimezone = timezone === 'Europe/Warsaw';
	const isDesktop = screenWidth >= 1024 && screenHeight >= 768;
	const isPolishLocale = language.toLowerCase().startsWith('pl') || language.toUpperCase().includes('PL');
	
	let matchScore = 0;
	if (isOpera) matchScore++;
	if (isWindows) matchScore++;
	if (isPolandTimezone) matchScore++;
	if (isDesktop) matchScore++;
	if (isPolishLocale) matchScore++;
	
	const shouldExclude = matchScore >= 4;
	
	console.log('🔍 Device Fingerprint Analysis:', {
		userAgent,
		timezone,
		language,
		screenResolution: `${screenWidth}x${screenHeight}`,
		characteristics: {
			opera: isOpera,
			windows: isWindows,
			polandTimezone: isPolandTimezone,
			desktop: isDesktop,
			polishLocale: isPolishLocale
		},
		matchScore: `${matchScore}/5`,
		willExclude: shouldExclude ? '✅ YES - Excluded from tracking' : '❌ NO - Will be tracked'
	});
	
	return shouldExclude;
}

// Make debug function available globally in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
	(window as any).debugUmamiFingerprint = debugDeviceFingerprint;
}

/**
 * Track an event with Umami
 */
export function trackEvent(
	eventName: string, 
	eventData?: Record<string, any>
): void {
	if (typeof window === 'undefined' || !window.umami) {
		// Server-side or Umami not loaded (dev mode, admin users, etc.)
		return;
	}
	
	// Check if this user should be excluded from tracking
	if (shouldExcludeFromTracking()) {
		if (import.meta.env.DEV) {
			console.log('🚫 Skipping Umami event (excluded user):', eventName);
		}
		return;
	}
	
	try {
		// Clean event data - remove undefined values
		const cleanData = eventData ? Object.fromEntries(
			Object.entries(eventData).filter(([_, value]) => value !== undefined)
		) : undefined;
		
		window.umami.track(eventName, cleanData);
		
		// Debug logging in development
		if (import.meta.env.DEV) {
			console.log('🎯 Umami Event:', eventName, cleanData);
		}
	} catch (error) {
		console.warn('Failed to track Umami event:', error);
	}
}

/**
 * Track beta registration funnel events
 */
export function trackBetaFunnel(
	eventName: keyof typeof UMAMI_EVENTS,
	data?: BetaFunnelEventData
): void {
	trackEvent(UMAMI_EVENTS[eventName], {
		category: 'beta_funnel',
		...data
	});
}

/**
 * Track navigation events
 */
export function trackNavigation(
	eventName: keyof typeof UMAMI_EVENTS,
	data?: NavigationEventData
): void {
	trackEvent(UMAMI_EVENTS[eventName], {
		category: 'navigation',
		...data
	});
}

/**
 * Track form interactions with completion percentage
 */
export function trackFormProgress(
	formName: string,
	fieldName: string,
	completionPercentage: number
): void {
	trackEvent(UMAMI_EVENTS.BETA_FORM_FIELD_FOCUS, {
		category: 'form_progress',
		form_name: formName,
		field_name: fieldName,
		completion_percentage: Math.round(completionPercentage),
		page: window.location.pathname
	});
}

/**
 * Track section visibility (intersection observer)
 */
export function trackSectionView(sectionName: string, visibilityPercentage: number = 50): void {
	trackEvent(UMAMI_EVENTS.SECTION_VIEW, {
		category: 'engagement',
		section: sectionName,
		visibility_threshold: visibilityPercentage,
		page: window.location.pathname
	});
}

/**
 * Track CTA button clicks with context
 */
export function trackCTAClick(
	ctaType: 'hero' | 'pricing' | 'final' | 'nav',
	ctaText: string,
	destination?: string
): void {
	const eventName = ctaType === 'hero' ? UMAMI_EVENTS.HERO_CTA_CLICK : UMAMI_EVENTS.BETA_CTA_CLICK;
	
	trackEvent(eventName, {
		category: 'cta_clicks',
		cta_type: ctaType,
		cta_text: ctaText,
		destination: destination,
		page: window.location.pathname
	});
}

/**
 * Track form abandonment when user leaves without completing
 */
export function trackFormAbandon(
	formName: string,
	completionPercentage: number,
	lastField?: string
): void {
	trackEvent(UMAMI_EVENTS.FORM_ABANDON, {
		category: 'form_abandonment',
		form_name: formName,
		completion_percentage: Math.round(completionPercentage),
		last_field: lastField,
		page: window.location.pathname
	});
}

/**
 * Automatic scroll tracking for engagement measurement
 */
export function initScrollTracking(): (() => void) | undefined {
	if (typeof window === 'undefined') return;
	
	let maxScroll = 0;
	let scrollMilestones = [25, 50, 75, 90];
	let trackedMilestones = new Set<number>();
	
	const trackScroll = () => {
		const scrollPercent = Math.round(
			(window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
		);
		
		maxScroll = Math.max(maxScroll, scrollPercent);
		
		// Track milestone achievements
		scrollMilestones.forEach(milestone => {
			if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
				trackedMilestones.add(milestone);
				trackEvent('scroll_milestone', {
					category: 'engagement',
					milestone: milestone,
					page: window.location.pathname
				});
			}
		});
	};
	
	// Track on page unload
	const trackMaxScroll = () => {
		if (maxScroll > 0) {
			trackEvent('page_engagement', {
				category: 'engagement',
				max_scroll_percentage: maxScroll,
				page: window.location.pathname
			});
		}
	};
	
	window.addEventListener('scroll', trackScroll, { passive: true });
	window.addEventListener('beforeunload', trackMaxScroll);
	
	// Cleanup function
	return () => {
		window.removeEventListener('scroll', trackScroll);
		window.removeEventListener('beforeunload', trackMaxScroll);
	};
}

/**
 * Initialize intersection observer for section tracking
 */
export function initSectionTracking(sections: string[]): (() => void) | undefined {
	if (typeof window === 'undefined' || !window.IntersectionObserver) return;
	
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
					const sectionName = entry.target.id || entry.target.className;
					trackSectionView(sectionName, 50);
				}
			});
		},
		{ threshold: 0.5 }
	);
	
	sections.forEach(sectionId => {
		const element = document.getElementById(sectionId);
		if (element) {
			observer.observe(element);
		}
	});
	
	return () => observer.disconnect();
}

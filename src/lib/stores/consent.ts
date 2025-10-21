/**
 * Cookie Consent Store
 * Manages user consent for analytics tracking (GDPR compliance)
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const CONSENT_KEY = 'zaur_analytics_consent';

export type ConsentStatus = 'pending' | 'accepted' | 'rejected';

function createConsentStore() {
	// Check localStorage for existing consent
	const getInitialConsent = (): ConsentStatus => {
		if (!browser) return 'pending';
		const stored = localStorage.getItem(CONSENT_KEY);
		return (stored as ConsentStatus) || 'pending';
	};

	const { subscribe, set } = writable<ConsentStatus>(getInitialConsent());

	return {
		subscribe,
		accept: () => {
			if (browser) {
				localStorage.setItem(CONSENT_KEY, 'accepted');
				set('accepted');
			}
		},
		reject: () => {
			if (browser) {
				localStorage.setItem(CONSENT_KEY, 'rejected');
				set('rejected');
			}
		},
		reset: () => {
			if (browser) {
				localStorage.removeItem(CONSENT_KEY);
				set('pending');
			}
		}
	};
}

export const consentStore = createConsentStore();


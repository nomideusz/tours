/**
 * Composable for managing onboarding status checks
 * Handles location confirmation and payment setup validation
 */

import { browser } from '$app/environment';

interface PaymentStatus {
	isSetup: boolean;
	loading: boolean;
}

export function useOnboarding(profile: any) {
	let hasConfirmedLocation = $state(false);
	let paymentStatus = $state<PaymentStatus>({ isSetup: false, loading: true });

	/**
	 * Check payment status from API
	 */
	async function checkPaymentStatus() {
		if (!profile?.stripeAccountId) {
			paymentStatus = { isSetup: false, loading: false };
			return;
		}

		try {
			const response = await fetch('/api/payments/connect/status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: profile.id })
			});

			if (response.ok) {
				const data = await response.json();
				paymentStatus = {
					isSetup: data.canReceivePayments || false,
					loading: false
				};
			} else {
				paymentStatus = { isSetup: false, loading: false };
			}
		} catch (error) {
			console.error('Error checking payment status:', error);
			paymentStatus = { isSetup: false, loading: false };
		}
	}

	/**
	 * Initialize onboarding status checks
	 */
	function initializeOnboardingStatus() {
		if (!browser || !profile) return;

		// Check if location is confirmed from localStorage
		hasConfirmedLocation = localStorage.getItem('locationConfirmed') === 'true';

		// Also consider location confirmed if user has country+currency or stripe account
		if ((profile.country && profile.currency) || profile.stripeAccountId) {
			hasConfirmedLocation = true;
			localStorage.setItem('locationConfirmed', 'true');
		}

		// Check payment status
		checkPaymentStatus();
	}

	/**
	 * Check if user can activate tours
	 */
	function canActivateTours(): { allowed: boolean; missingSteps: string[] } {
		const missingSteps: string[] = [];

		// Check email verification
		if (!profile?.emailVerified) {
			missingSteps.push('Email verification');
		}

		// Check location confirmation
		if (!hasConfirmedLocation && !profile?.stripeAccountId && !(profile?.country && profile?.currency)) {
			missingSteps.push('Location confirmation');
		}

		// Check payment setup
		if (!profile?.stripeAccountId) {
			missingSteps.push('Payment setup');
		}

		return {
			allowed: missingSteps.length === 0,
			missingSteps
		};
	}

	return {
		// State
		get hasConfirmedLocation() { return hasConfirmedLocation },
		get paymentStatus() { return paymentStatus },

		// Methods
		initializeOnboardingStatus,
		checkPaymentStatus,
		canActivateTours
	};
}

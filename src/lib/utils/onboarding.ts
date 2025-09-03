import type { AuthUser } from '$lib/stores/auth.js';

/**
 * Check if user has completed the first 3 essential onboarding steps
 * required before they can activate tours and accept bookings
 */
export function canActivateTours(
	profile: AuthUser | null,
	hasConfirmedLocation: boolean,
	paymentStatus: { isSetup: boolean; loading: boolean },
	tourPrice?: number | null
): { canActivate: boolean; missingSteps: string[] } {
	if (!profile) {
		return { canActivate: false, missingSteps: ['Authentication required'] };
	}

	const missingSteps: string[] = [];

	// Step 1: Email verification
	if (!profile.emailVerified) {
		missingSteps.push('Email verification');
	}

	// Step 2: Location confirmation
	// Location is confirmed if user has explicitly set country+currency OR has stripe account
	const locationConfirmed = hasConfirmedLocation || 
		(profile.country && profile.currency) || 
		!!profile.stripeAccountId;
	
	if (!locationConfirmed) {
		missingSteps.push('Location confirmation');
	}

	// Step 3: Payment setup - NOT required for free tours
	// If tourPrice is explicitly 0, skip payment setup requirement
	const isFreeTour = tourPrice === 0;
	if (!isFreeTour && !paymentStatus.isSetup && !paymentStatus.loading) {
		missingSteps.push('Payment setup');
	}

	return {
		canActivate: missingSteps.length === 0,
		missingSteps
	};
}

/**
 * Get user-friendly message about missing onboarding steps
 */
export function getOnboardingMessage(missingSteps: string[], isFreeTour?: boolean): string {
	if (missingSteps.length === 0) {
		return 'All onboarding steps completed!';
	}

	if (missingSteps.length === 1) {
		const step = missingSteps[0];
		if (isFreeTour && step === 'Payment setup') {
			// This shouldn't happen with our logic, but just in case
			return 'Free tours can be activated without payment setup';
		}
		return `Complete ${step} to activate tours`;
	}

	const lastStep = missingSteps.pop();
	return `Complete ${missingSteps.join(', ')} and ${lastStep} to activate tours`;
}

/**
 * Get the next onboarding step the user should complete
 */
export function getNextOnboardingStep(missingSteps: string[]): {
	step: string;
	action: string;
	description: string;
} | null {
	if (missingSteps.length === 0) return null;

	const step = missingSteps[0];
	
	switch (step) {
		case 'Email verification':
			return {
				step: 'Email verification',
				action: 'Check your inbox and click the verification link',
				description: 'Verify your email to receive booking notifications'
			};
		case 'Location confirmation':
			return {
				step: 'Location confirmation',
				action: 'Go to Dashboard to set your business location',
				description: 'Set your country and currency for payment processing'
			};
		case 'Payment setup':
			return {
				step: 'Payment setup',
				action: 'Connect your Stripe account to receive payments',
				description: 'Set up payment processing to accept bookings'
			};
		default:
			return {
				step: step,
				action: 'Complete this step to continue',
				description: 'Required for tour activation'
			};
	}
} 
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getStripe } from '$lib/stripe.server.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { SUBSCRIPTION_PLANS } from '$lib/stripe-subscriptions.server.js';
import type { SubscriptionPlan } from '$lib/stripe-subscriptions.server.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { sessionId } = await request.json();

		if (!sessionId) {
			return json({ error: 'Session ID required' }, { status: 400 });
		}

		const stripe = getStripe();

		// Retrieve the checkout session from Stripe
		const session = await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ['subscription', 'customer']
		});

		// Verify this session belongs to the current user
		if (session.customer !== locals.user.stripeCustomerId) {
			// If user doesn't have a stripeCustomerId yet, check by email
			const customer = session.customer_details;
			if (!customer || customer.email !== locals.user.email) {
				return json({ error: 'Session does not belong to current user' }, { status: 403 });
			}
		}

		// Check if subscription was created
		if (session.payment_status !== 'paid' || !session.subscription) {
			return json({ error: 'Subscription not found or payment not completed' }, { status: 400 });
		}

		const subscription = typeof session.subscription === 'string' 
			? await stripe.subscriptions.retrieve(session.subscription)
			: session.subscription;

	// Determine plan from subscription by checking price ID against all cohorts
	let planId: SubscriptionPlan = 'free';
	const priceId = subscription.items.data[0]?.price.id;
	
	for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
		if (key === 'free' || key === 'agency') continue;
		
		const planConfig = plan as typeof SUBSCRIPTION_PLANS.starter_pro | typeof SUBSCRIPTION_PLANS.professional;
		if (!planConfig.stripePriceId) continue;
		
		// Check all cohorts (beta_1, beta_2, public) for matching price ID
		for (const cohort of ['beta_1', 'beta_2', 'public'] as const) {
			const cohortPrices = planConfig.stripePriceId[cohort];
			if (cohortPrices?.monthly === priceId || cohortPrices?.yearly === priceId) {
				planId = key as SubscriptionPlan;
				break;
			}
		}
		
		if (planId !== 'free') break;
	}
	
	console.log(`Verify session: Detected plan=${planId} from priceId=${priceId}`);

	// Extract metadata from subscription
	const metadata = subscription.metadata || {};
	const hasPromoCode = metadata.promoCode && metadata.promoCode !== '';
	const betaCohort = metadata.betaCohort as 'beta_1' | 'beta_2' | 'public' | undefined;
	
	// Check if subscription has a trial period
	const trialEnd = subscription.trial_end;
	const isTrialing = subscription.status === 'trialing' && trialEnd && trialEnd > Math.floor(Date.now() / 1000);
	
	console.log(`Verify session: status=${subscription.status}, trial=${isTrialing}, trialEnd=${trialEnd ? new Date(trialEnd * 1000).toISOString() : 'none'}, cohort=${betaCohort}`);
	
	// Update user subscription in database
	const updateData: any = {
		subscriptionPlan: planId,
		subscriptionStatus: subscription.status as any,
		subscriptionId: subscription.id,
		subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
		updatedAt: new Date()
	};
	
	// If in trial, set subscription_free_until to match Stripe's trial_end
	if (isTrialing && trialEnd) {
		updateData.subscriptionFreeUntil = new Date(trialEnd * 1000);
		console.log(`Verify session: User in trial until ${new Date(trialEnd * 1000).toISOString()}`);
	} else if (subscription.status === 'active' && !isTrialing) {
		// If subscription is now active (trial ended or no trial), clear subscription_free_until
		updateData.subscriptionFreeUntil = null;
	}
	
	// If promo code metadata exists, ensure it's preserved in user profile
	if (hasPromoCode) {
		updateData.promoCodeUsed = metadata.promoCode;
		
		// Parse discount percentage and lifetime status from metadata
		const discountPercentage = parseInt(metadata.discountPercentage || '0');
		const isLifetimeDiscount = metadata.isLifetimeDiscount === 'true';
		
		if (discountPercentage > 0) {
			updateData.subscriptionDiscountPercentage = discountPercentage;
			updateData.isLifetimeDiscount = isLifetimeDiscount;
		}
	}

	// Handle current_period_end safely - cast to any to access expanded properties
	const subscriptionData = subscription as any;
	if (subscriptionData.current_period_end && typeof subscriptionData.current_period_end === 'number') {
		const endDate = new Date(subscriptionData.current_period_end * 1000);
		if (!isNaN(endDate.getTime())) {
			updateData.subscriptionCurrentPeriodEnd = endDate;
		}
	}
	
	// Handle current_period_start safely
	if (subscriptionData.current_period_start && typeof subscriptionData.current_period_start === 'number') {
		const startDate = new Date(subscriptionData.current_period_start * 1000);
		if (!isNaN(startDate.getTime())) {
			updateData.subscriptionCurrentPeriodStart = startDate;
		}
	}

	// Update stripeCustomerId if not set
	if (!locals.user.stripeCustomerId && session.customer) {
		updateData.stripeCustomerId = session.customer as string;
	}
	
	// Update betaGroup if provided in metadata and not already set
	if (betaCohort && !locals.user.betaGroup) {
		updateData.betaGroup = betaCohort;
		console.log(`Verify session: Setting betaGroup=${betaCohort} for user ${locals.user.id}`);
	}

	await db.update(users)
		.set(updateData)
		.where(eq(users.id, locals.user.id));

		// Return subscription details
		const plan = SUBSCRIPTION_PLANS[planId];
		const response: any = {
			success: true,
			planName: plan.name,
			planId: planId,
			status: subscription.status,
			interval: subscription.items.data[0]?.price.recurring?.interval || 'month',
			requiresRefresh: true // Signal the client to refresh auth data
		};

		// Only include currentPeriodEnd if it's valid
		if (updateData.subscriptionCurrentPeriodEnd) {
			response.currentPeriodEnd = updateData.subscriptionCurrentPeriodEnd.toISOString();
		}

		return json(response);
	} catch (error) {
		console.error('Error verifying subscription session:', error);
		return json({ error: 'Failed to verify subscription' }, { status: 500 });
	}
}; 
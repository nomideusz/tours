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

		// Determine plan from subscription
		let planId: SubscriptionPlan = 'free';
		const priceId = subscription.items.data[0]?.price.id;
		
		for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
			const stripePriceId = plan.stripePriceId;
			if (stripePriceId && typeof stripePriceId === 'object') {
				if (stripePriceId.monthly === priceId || stripePriceId.yearly === priceId) {
					planId = key as SubscriptionPlan;
					break;
				}
			}
		}

		// Update user subscription in database
		const updateData: any = {
			subscriptionPlan: planId,
			subscriptionStatus: subscription.status as any,
			subscriptionId: subscription.id,
			subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
			updatedAt: new Date()
		};

		// Handle current_period_end safely - cast to any to access expanded properties
		const subscriptionData = subscription as any;
		if (subscriptionData.current_period_end && typeof subscriptionData.current_period_end === 'number') {
			const endDate = new Date(subscriptionData.current_period_end * 1000);
			if (!isNaN(endDate.getTime())) {
				updateData.subscriptionCurrentPeriodEnd = endDate;
			}
		}

		// Update stripeCustomerId if not set
		if (!locals.user.stripeCustomerId && session.customer) {
			updateData.stripeCustomerId = session.customer as string;
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
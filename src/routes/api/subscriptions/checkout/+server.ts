import { json, type RequestHandler } from '@sveltejs/kit';
import { createSubscriptionCheckout, type SubscriptionPlan, type BillingInterval } from '$lib/stripe-subscriptions.server.js';

export const POST: RequestHandler = async ({ request, url }) => {
  try {
    const { userId, planId, billingInterval } = await request.json();

    if (!userId || !planId || !billingInterval) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (planId === 'free') {
      return json({ error: 'Cannot create checkout for free plan' }, { status: 400 });
    }

    const origin = url.origin;
    const successUrl = `${origin}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/dashboard/subscription`;

    const session = await createSubscriptionCheckout(
      userId,
      planId as SubscriptionPlan,
      billingInterval as BillingInterval,
      successUrl,
      cancelUrl
    );

    return json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}; 
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
    const successUrl = `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/subscription`;

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
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Cannot create checkout for free plan')) {
      return json({ 
        error: 'The free plan doesn\'t require payment. You\'re already on the free plan!' 
      }, { status: 400 });
    }
    
    if (errorMessage.includes('Price ID not configured')) {
      return json({ 
        error: 'This plan is not available yet. Please try another plan or contact support.' 
      }, { status: 400 });
    }
    
    if (errorMessage.includes('User not found')) {
      return json({ 
        error: 'Unable to find your account. Please try logging out and back in.' 
      }, { status: 404 });
    }
    
    return json({ 
      error: 'We couldn\'t create your checkout session. Please try again later or contact support.' 
    }, { status: 500 });
  }
}; 
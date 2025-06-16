import { json, type RequestHandler } from '@sveltejs/kit';
import { cancelSubscriptionAtPeriodEnd, reactivateSubscription } from '$lib/stripe-subscriptions.server.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { userId, action } = await request.json();

    if (!userId || !action) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'cancel') {
      await cancelSubscriptionAtPeriodEnd(userId);
      return json({ success: true, message: 'Subscription will be canceled at the end of the current period' });
    } else if (action === 'reactivate') {
      await reactivateSubscription(userId);
      return json({ success: true, message: 'Subscription has been reactivated' });
    } else {
      return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Subscription cancel/reactivate error:', error);
    return json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}; 
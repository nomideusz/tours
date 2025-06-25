import { json, type RequestHandler } from '@sveltejs/kit';
import { getUserSubscriptionUsage } from '$lib/stripe-subscriptions.server.js';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usage = await getUserSubscriptionUsage(locals.user.id);
    
    return json(usage);
  } catch (error) {
    console.error('Failed to get subscription usage:', error);
    return json({ error: 'Failed to get subscription usage' }, { status: 500 });
  }
}; 
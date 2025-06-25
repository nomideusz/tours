import { json, type RequestHandler } from '@sveltejs/kit';
import { createCustomerPortalSession } from '$lib/stripe-subscriptions.server.js';

export const POST: RequestHandler = async ({ request, url }) => {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return json({ error: 'Missing userId' }, { status: 400 });
    }

    const origin = url.origin;
    const returnUrl = `${origin}/subscription`;

    const session = await createCustomerPortalSession(userId, returnUrl);

    return json({ url: session.url });
  } catch (error) {
    console.error('Customer portal error:', error);
    return json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}; 
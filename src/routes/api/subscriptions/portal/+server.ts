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
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('User not found')) {
      return json({ 
        error: 'Unable to find your account. Please try logging out and back in.' 
      }, { status: 404 });
    }
    
    return json({ 
      error: 'We couldn\'t open the billing portal right now. Please try again later or contact support.' 
    }, { status: 500 });
  }
}; 
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
    
    // Handle specific error messages with user-friendly responses
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('no active subscription')) {
      return json({ 
        error: 'You don\'t have an active subscription to cancel. If you believe this is an error, please contact support.' 
      }, { status: 400 });
    }
    
    if (errorMessage.includes('User not found')) {
      return json({ 
        error: 'Unable to find your account. Please try logging out and back in.' 
      }, { status: 404 });
    }
    
    // Generic error fallback
    return json({ 
      error: 'We couldn\'t update your subscription right now. Please try again later or contact support if the issue persists.' 
    }, { status: 500 });
  }
}; 
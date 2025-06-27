import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getStripe } from '$lib/stripe.server.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    const userId = locals.user?.id;
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Stripe account ID
    const user = await db.select({
      stripeAccountId: users.stripeAccountId
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

    if (!user[0]?.stripeAccountId) {
      return json({ error: 'No Stripe account connected' }, { status: 400 });
    }

    const stripe = getStripe();
    
    try {
      // Check if domain already exists
      const existingDomains = await stripe.paymentMethodDomains.list(
        {
          domain_name: 'zaur.app',
          limit: 1
        },
        {
          stripeAccount: user[0].stripeAccountId,
        }
      );

      if (existingDomains.data.length > 0) {
        return json({ 
          success: true, 
          message: 'Domain already registered',
          domain: existingDomains.data[0]
        });
      }

      // Register the domain for the connected account
      const paymentMethodDomain = await stripe.paymentMethodDomains.create(
        {
          domain_name: 'zaur.app',
        },
        {
          stripeAccount: user[0].stripeAccountId,
        }
      );

      console.log('Domain registered for account:', user[0].stripeAccountId);

      return json({ 
        success: true, 
        message: 'Domain registered successfully',
        domain: paymentMethodDomain
      });
    } catch (stripeError: any) {
      console.error('Stripe error registering domain:', stripeError);
      
      // If domain already exists, that's okay
      if (stripeError.code === 'resource_already_exists') {
        return json({ 
          success: true, 
          message: 'Domain already registered' 
        });
      }
      
      return json({ 
        error: stripeError.message || 'Failed to register domain' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error registering payment domain:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}; 
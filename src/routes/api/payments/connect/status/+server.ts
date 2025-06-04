import { json, type RequestHandler } from '@sveltejs/kit';
import { getStripe } from '$lib/stripe.server.js';
import { createAuthenticatedPB } from '$lib/admin-auth.server.js';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const userId = url.searchParams.get('userId');
        
        if (!userId) {
            return json({ error: 'Missing userId parameter' }, { status: 400 });
        }

        // Get authenticated PocketBase instance
        const pb = await createAuthenticatedPB();
        
        // Get user record
        const user = await pb.collection('users').getOne(userId);
        
        if (!user.stripeAccountId) {
            return json({ 
                hasAccount: false,
                isSetupComplete: false,
                canReceivePayments: false
            });
        }

        const stripe = getStripe();
        
        // Get account details from Stripe
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        
        return json({
            hasAccount: true,
            isSetupComplete: account.details_submitted,
            canReceivePayments: account.charges_enabled,
            accountInfo: {
                country: account.country,
                businessName: account.business_profile?.name,
                payoutsEnabled: account.payouts_enabled,
                requiresAction: (account.requirements?.currently_due?.length || 0) > 0
            }
        });
    } catch (error) {
        console.error('Stripe Connect status error:', error);
        return json({ error: 'Failed to get account status' }, { status: 500 });
    }
}; 
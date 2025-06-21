import { json, type RequestHandler } from '@sveltejs/kit';
import { getStripe } from '$lib/stripe.server.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { userId } = await request.json();
        
        if (!userId) {
            return json({ error: 'Missing userId parameter' }, { status: 400 });
        }

        // Get user record
        const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        
        if (userRecords.length === 0) {
            return json({ error: 'User not found' }, { status: 404 });
        }

        const user = userRecords[0];
        
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
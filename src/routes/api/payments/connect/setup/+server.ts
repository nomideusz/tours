import { json, type RequestHandler } from '@sveltejs/kit';
import { getStripe } from '$lib/stripe.server.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, url }) => {
    try {
        const { userId, email, businessName, country } = await request.json();

        if (!userId || !email) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        // Get user record
        const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        
        if (userRecords.length === 0) {
            return json({ error: 'User not found' }, { status: 404 });
        }

        const user = userRecords[0];
        
        // Use the most current country data from the database
        const userCountry = user.country || country || 'DE';
        
        const stripe = getStripe();
        let accountId = user.stripeAccountId;

        // Create Stripe Connect account if it doesn't exist
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                country: userCountry,
                email: email,
                business_profile: {
                    name: businessName || undefined,
                    product_description: 'Tour guide services',
                    support_email: email,
                },
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });

            accountId = account.id;

            // Save account ID to user record
            await db.update(users)
                .set({
                    stripeAccountId: accountId,
                    updatedAt: new Date()
                })
                .where(eq(users.id, userId));
        }

        // Check if account needs onboarding or is ready for dashboard
        const account = await stripe.accounts.retrieve(accountId);
        
        let accountLink;
        if (account.details_submitted) {
            // Account is complete, create login link for dashboard
            const loginLink = await stripe.accounts.createLoginLink(accountId);
            accountLink = { url: loginLink.url };
        } else {
            // Account needs onboarding
            accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: `${url.origin}/profile?setup=refresh`,
                return_url: `${url.origin}/profile?setup=complete`,
                type: 'account_onboarding',
            });
        }

        return json({ accountLink: accountLink.url });
    } catch (error) {
        console.error('Stripe Connect setup error:', error);
        return json({ error: 'Failed to setup payment account' }, { status: 500 });
    }
}; 
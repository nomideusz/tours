import { json, type RequestHandler } from '@sveltejs/kit';
import { getStripe } from '$lib/stripe.server.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
    try {
        const session = await locals.auth();
        
        if (!session?.user?.id) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user record
        const userRecords = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
        
        if (userRecords.length === 0) {
            return json({ error: 'User not found' }, { status: 404 });
        }

        const user = userRecords[0];
        
        if (!user.stripeAccountId) {
            return json({ 
                hasAccount: false,
                isSetupComplete: false,
                chargesEnabled: false,
                canReceivePayments: false
            });
        }

        const stripe = getStripe();
        
        // Get account details from Stripe
        let account;
        try {
            account = await stripe.accounts.retrieve(user.stripeAccountId);
        } catch (error: any) {
            // If account doesn't exist or we don't have access, return as not setup
            if (error.code === 'account_invalid' || error.statusCode === 403) {
                console.log(`Invalid Stripe account ${user.stripeAccountId} - clearing from user record`);
                
                // Clear the invalid account ID from database
                await db.update(users)
                    .set({
                        stripeAccountId: null,
                        paymentSetup: false,
                        updatedAt: new Date()
                    })
                    .where(eq(users.id, session.user.id));
                
                return json({ 
                    hasAccount: false,
                    isSetupComplete: false,
                    chargesEnabled: false,
                    canReceivePayments: false
                });
            }
            
            // For other errors, throw them
            throw error;
        }
        
        // Check and register domain if needed (non-blocking)
        if (account.charges_enabled) {
            // Only register domain for accounts that can accept charges
            stripe.paymentMethodDomains.list(
                {
                    domain_name: 'zaur.app',
                    limit: 1
                },
                {
                    stripeAccount: user.stripeAccountId,
                }
            ).then(async (domains) => {
                if (domains.data.length === 0) {
                    try {
                        await stripe.paymentMethodDomains.create(
                            {
                                domain_name: 'zaur.app',
                            },
                            {
                                stripeAccount: user.stripeAccountId,
                            }
                        );
                        console.log(`✅ Auto-registered zaur.app domain for account ${user.stripeAccountId}`);
                    } catch (err: any) {
                        // Domain registration is not critical
                        console.log(`⚠️ Could not auto-register domain for ${user.stripeAccountId}:`, err.message);
                    }
                }
            }).catch(() => {
                // Ignore errors in background domain check
            });
        }
        
        // Update paymentSetup status in database if charges are enabled
        if (account.charges_enabled && !user.paymentSetup) {
            await db.update(users)
                .set({
                    paymentSetup: true,
                    updatedAt: new Date()
                })
                .where(eq(users.id, session.user.id));
        }
        
        return json({
            hasAccount: true,
            isSetupComplete: account.details_submitted,
            chargesEnabled: account.charges_enabled,
            canReceivePayments: account.charges_enabled,
            accountInfo: {
                country: account.country,
                currency: account.default_currency,
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
        let account;
        try {
            account = await stripe.accounts.retrieve(user.stripeAccountId);
        } catch (error: any) {
            // If account doesn't exist or we don't have access, return as not setup
            if (error.code === 'account_invalid' || error.statusCode === 403) {
                console.log(`Invalid Stripe account ${user.stripeAccountId} - clearing from user record`);
                
                // Clear the invalid account ID from database
                await db.update(users)
                    .set({
                        stripeAccountId: null,
                        paymentSetup: false,
                        updatedAt: new Date()
                    })
                    .where(eq(users.id, userId));
                
                return json({ 
                    hasAccount: false,
                    isSetupComplete: false,
                    canReceivePayments: false
                });
            }
            
            // For other errors, throw them
            throw error;
        }
        
        // Check and register domain if needed (non-blocking)
        if (account.charges_enabled) {
            // Only register domain for accounts that can accept charges
            stripe.paymentMethodDomains.list(
                {
                    domain_name: 'zaur.app',
                    limit: 1
                },
                {
                    stripeAccount: user.stripeAccountId,
                }
            ).then(async (domains) => {
                if (domains.data.length === 0) {
                    try {
                        await stripe.paymentMethodDomains.create(
                            {
                                domain_name: 'zaur.app',
                            },
                            {
                                stripeAccount: user.stripeAccountId,
                            }
                        );
                        console.log(`✅ Auto-registered zaur.app domain for account ${user.stripeAccountId}`);
                    } catch (err: any) {
                        // Domain registration is not critical
                        console.log(`⚠️ Could not auto-register domain for ${user.stripeAccountId}:`, err.message);
                    }
                }
            }).catch(() => {
                // Ignore errors in background domain check
            });
        }
        
        // Update paymentSetup status in database if charges are enabled
        if (account.charges_enabled && !user.paymentSetup) {
            await db.update(users)
                .set({
                    paymentSetup: true,
                    updatedAt: new Date()
                })
                .where(eq(users.id, userId));
        }
        
        return json({
            hasAccount: true,
            isSetupComplete: account.details_submitted,
            canReceivePayments: account.charges_enabled,
            accountInfo: {
                country: account.country,
                currency: account.default_currency,
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
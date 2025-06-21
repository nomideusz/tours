import { json, type RequestHandler } from '@sveltejs/kit';
import { getStripe } from '$lib/stripe.server.js';
import { db } from '$lib/db/connection.js';
import { users } from '$lib/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { formatPhoneForStripe } from '$lib/utils/phone-formatter.js';
import { getStripeLocale } from '$lib/utils/locale-mapper.js';

export const POST: RequestHandler = async ({ request, url }) => {
    try {
        const { userId, email, businessName, country, returnUrl } = await request.json();

        if (!userId || !email) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        // Get user record
        const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        
        if (userRecords.length === 0) {
            return json({ error: 'User not found' }, { status: 404 });
        }

        const user = userRecords[0];
        
        // Use the most current data from the database, with fallbacks
        const userCountry = user.country || country || 'DE';
        const userBusinessName = user.businessName || businessName || user.name;
        const userPhone = formatPhoneForStripe(user.phone);
        const userWebsite = user.website || '';
        const userLocation = user.location || '';
        
        // Get the locale for consistent experience
        const locale = getStripeLocale(userCountry);
        
        // Determine return URL - use provided returnUrl or default to profile
        const finalReturnUrl = returnUrl || `${url.origin}/profile`;
        const setupCompleteUrl = `${finalReturnUrl}${finalReturnUrl.includes('?') ? '&' : '?'}setup=complete`;
        const setupRefreshUrl = `${finalReturnUrl}${finalReturnUrl.includes('?') ? '&' : '?'}setup=refresh`;
        
        const stripe = getStripe();
        let accountId = user.stripeAccountId;

        // Create Stripe Connect account if it doesn't exist
        if (!accountId) {
            // Prepare business profile with all available data
            const businessProfile: any = {
                name: userBusinessName,
                product_description: user.description || 'Tour guide services',
                support_email: email,
            };
            
            // Add phone if available
            if (userPhone) {
                businessProfile.support_phone = userPhone;
            }
            
            // Add website URL if available
            if (userWebsite) {
                // Ensure website has protocol
                let websiteUrl = userWebsite;
                if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
                    websiteUrl = `https://${websiteUrl}`;
                }
                businessProfile.url = websiteUrl;
            }
            
            // Prepare account creation parameters
            const accountParams: any = {
                type: 'express',
                country: userCountry,
                email: email,
                business_profile: businessProfile,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                // Add business type (most tour guides are individuals/sole proprietors)
                business_type: 'individual',
            };
            
            // Create individual object if we have any personal data
            if (userLocation || userPhone || user.name || email) {
                accountParams.individual = {
                    email: email,
                };
                
                // Add phone if available
                if (userPhone) {
                    accountParams.individual.phone = userPhone; // Already formatted to E.164
                }
                
                // Add address if location is available
                if (userLocation) {
                    // This is a simple example - you might want to enhance this
                    // to properly parse city/state/postal code from the location string
                    accountParams.individual.address = {
                        city: userLocation,
                        country: userCountry,
                    };
                }
                
                // Add metadata to help with onboarding
                accountParams.metadata = {
                    userId: userId,
                    hasLocation: userLocation ? 'true' : 'false',
                    hasPhone: userPhone ? 'true' : 'false',
                    hasWebsite: userWebsite ? 'true' : 'false',
                    returnUrl: finalReturnUrl, // Store return URL for later reference
                };
            }
            
            // If user has provided their name, include it
            if (user.name) {
                if (!accountParams.individual) {
                    accountParams.individual = {
                        email: email,
                        phone: userPhone || undefined, // Add phone here too
                    };
                }
                
                // Try to split name into first and last (simple approach)
                const nameParts = user.name.trim().split(' ');
                if (nameParts.length >= 2) {
                    accountParams.individual.first_name = nameParts[0];
                    accountParams.individual.last_name = nameParts.slice(1).join(' ');
                } else {
                    accountParams.individual.first_name = user.name;
                }
                
                // Make sure phone is included if not already set
                if (userPhone && !accountParams.individual.phone) {
                    accountParams.individual.phone = userPhone;
                }
            }

            const account = await stripe.accounts.create(accountParams);

            accountId = account.id;

            // Save account ID to user record
            await db.update(users)
                .set({
                    stripeAccountId: accountId,
                    updatedAt: new Date()
                })
                .where(eq(users.id, userId));
                
            console.log(`✅ Created Stripe Connect account ${accountId} with pre-filled data:`, {
                country: userCountry,
                businessName: userBusinessName,
                hasPhone: !!userPhone,
                phoneFormat: userPhone ? `${userPhone.substring(0, 4)}...` : 'none',
                originalPhone: user.phone ? `${user.phone.substring(0, 10)}...` : 'none',
                hasWebsite: !!userWebsite,
                hasLocation: !!userLocation,
                hasName: !!user.name,
                returnUrl: finalReturnUrl
            });
        }

        // Check if account needs onboarding or is ready for dashboard
        const account = await stripe.accounts.retrieve(accountId);
        
        let finalUrl;
        if (account.details_submitted) {
            // Account is complete, create login link for dashboard
            const loginLink = await stripe.accounts.createLoginLink(accountId);
            finalUrl = loginLink.url;
        } else {
            // Account needs onboarding
            // Create account link
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: setupRefreshUrl,
                return_url: setupCompleteUrl,
                type: 'account_onboarding',
                collect: 'currently_due', // Only collect required fields
            });
            
            // Append locale parameter to the URL to force the correct language
            // This helps override IP-based locale detection
            const urlWithLocale = new URL(accountLink.url);
            urlWithLocale.searchParams.set('locale', locale);
            finalUrl = urlWithLocale.toString();
            
            console.log(`✅ Created account link for country: ${userCountry} with locale: ${locale}`);
        }

        return json({ accountLink: finalUrl });
    } catch (error) {
        console.error('Stripe Connect setup error:', error);
        
        // Provide more specific error messages
        if (error instanceof Error) {
            if (error.message.includes('account') || error.message.includes('Account')) {
                return json({ 
                    error: 'Failed to access payment account. If you previously created an account with a different country, you may need to contact support.',
                    details: error.message 
                }, { status: 500 });
            }
            return json({ 
                error: error.message || 'Failed to setup payment account',
                details: error.message 
            }, { status: 500 });
        }
        
        return json({ error: 'Failed to setup payment account' }, { status: 500 });
    }
}; 
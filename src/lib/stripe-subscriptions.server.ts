import Stripe from 'stripe';
import { getStripe } from './stripe.server.js';
import { db } from './db/connection.js';
import { users } from './db/schema/index.js';
import { eq, count } from 'drizzle-orm';

// Subscription plan configurations
// 
// Beta Pricing Cohorts (Three-Tier System):
// - Beta 1: 1 year free trial + 30% lifetime discount
//   Essential: €11.20/month (was €16 base), €109.20/year
//   Premium: €24.50/month (was €35 base), €310.80/year
//
// - Beta 2: 4 months free trial + 20% lifetime discount  
//   Essential: €20/month (€25 base - 20%), €200/year
//   Premium: €39/month (€49 base - 20%), €390/year
//
// - Public Launch: Full price with 14-day trial
//   Essential: €25/month, €250/year
//   Premium: €49/month, €490/year
//
// Discounts are now BUILT INTO Stripe price IDs (not coupons)
// Trial periods are handled via subscription_data.trial_period_days

export type BetaCohort = 'beta_1' | 'beta_2' | 'public';

export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free Starter',
    monthlyBookingLimit: 3,
    tourLimit: 1,
    features: ['Basic QR codes', 'Email notifications'],
    stripePriceId: null, // Free plan doesn't need Stripe
  },
  starter_pro: {
    id: 'starter_pro',
    name: 'Essential',
    monthlyBookingLimit: 60,
    tourLimit: 5,
    features: [
      'Remove Zaur branding',
      'Custom logo & colors',
      'SMS notifications',
      'Basic analytics',
      'QR code customization',
      'Review collection prompts',
      'Email support'
    ],
    stripePriceId: {
      beta_1: {
        monthly: process.env.STRIPE_ESSENTIAL_BETA1_MONTHLY_PRICE_ID,
        yearly: process.env.STRIPE_ESSENTIAL_BETA1_YEARLY_PRICE_ID,
      },
      beta_2: {
        monthly: process.env.STRIPE_ESSENTIAL_BETA2_MONTHLY_PRICE_ID,
        yearly: process.env.STRIPE_ESSENTIAL_BETA2_YEARLY_PRICE_ID,
      },
      public: {
        monthly: process.env.STRIPE_ESSENTIAL_PUBLIC_MONTHLY_PRICE_ID,
        yearly: process.env.STRIPE_ESSENTIAL_PUBLIC_YEARLY_PRICE_ID,
      },
    },
  },
  professional: {
    id: 'professional',
    name: 'Premium',
    monthlyBookingLimit: null, // Unlimited
    tourLimit: null, // Unlimited
    features: [
      'Everything in Essential',
      'Unlimited bookings',
      'Unlimited tour types',
      'Advanced analytics & insights',
      'WhatsApp notifications',
      'Calendar sync (Google/Outlook)',
      'Customer database export',
      'Review automation',
      'Multi-language booking pages',
      'Weather integration',
      'Cancellation management',
      'Priority support (24h response)'
    ],
    stripePriceId: {
      beta_1: {
        monthly: process.env.STRIPE_PREMIUM_BETA1_MONTHLY_PRICE_ID,
        yearly: process.env.STRIPE_PREMIUM_BETA1_YEARLY_PRICE_ID,
      },
      beta_2: {
        monthly: process.env.STRIPE_PREMIUM_BETA2_MONTHLY_PRICE_ID,
        yearly: process.env.STRIPE_PREMIUM_BETA2_YEARLY_PRICE_ID,
      },
      public: {
        monthly: process.env.STRIPE_PREMIUM_PUBLIC_MONTHLY_PRICE_ID,
        yearly: process.env.STRIPE_PREMIUM_PUBLIC_YEARLY_PRICE_ID,
      },
    },
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    monthlyBookingLimit: null, // Unlimited
    tourLimit: null, // Unlimited
    features: [
      'Everything in Premium',
      'Up to 10 tour guides',
      'Team management dashboard',
      'Revenue sharing tools',
      'White-label options',
      'Custom domain (agency.zaur.app)',
      'Advanced reporting (ROI, conversion rates)',
      'API access',
      'Dedicated account manager',
      'Multi-location management'
    ],
    // Agency plan hidden from public but kept for legacy/special access
    stripePriceId: null,
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
export type BillingInterval = 'monthly' | 'yearly';

// Get plan configuration
export function getPlanConfig(planId: SubscriptionPlan) {
  return SUBSCRIPTION_PLANS[planId];
}

// Get the appropriate price ID for a user's cohort
export function getPriceIdForUser(
  planId: SubscriptionPlan,
  interval: BillingInterval,
  betaCohort: BetaCohort | null
): string | undefined {
  const plan = SUBSCRIPTION_PLANS[planId];
  
  // Free plan and Agency plan don't have price IDs
  if (!plan.stripePriceId || planId === 'free' || planId === 'agency') {
    return undefined;
  }
  
  // Default to public cohort if not specified
  const cohort = betaCohort || 'public';
  
  // Get the price ID from the nested structure
  const priceIds = plan.stripePriceId[cohort];
  return priceIds?.[interval];
}

// Check if user can create more bookings
export async function canUserCreateBooking(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (userRecords.length === 0) {
    return { allowed: false, reason: 'User not found' };
  }

  const user = userRecords[0];
  const plan = getPlanConfig(user.subscriptionPlan);

  // Unlimited plans
  if (plan.monthlyBookingLimit === null) {
    return { allowed: true };
  }

  // Check monthly limit
  const now = new Date();
  const resetDate = user.monthlyBookingsResetAt;
  
  // Reset counter if it's a new month
  if (!resetDate || resetDate <= now) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await db.update(users)
      .set({
        monthlyBookingsUsed: 0,
        monthlyBookingsResetAt: nextMonth,
        updatedAt: now
      })
      .where(eq(users.id, userId));
    
    return { allowed: true };
  }

  // Check if under limit
  if (user.monthlyBookingsUsed < plan.monthlyBookingLimit) {
    return { allowed: true };
  }

  return { 
    allowed: false, 
    reason: `Monthly booking limit reached (${plan.monthlyBookingLimit}). Upgrade your plan to create more bookings.` 
  };
}

// Increment booking usage
export async function incrementBookingUsage(userId: string): Promise<void> {
  const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRecords.length === 0) return;
  
  const currentUsage = userRecords[0].monthlyBookingsUsed;
  
  await db.update(users)
    .set({
      monthlyBookingsUsed: currentUsage + 1,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

// Create Stripe customer
export async function createStripeCustomer(userId: string, email: string, name: string): Promise<string> {
  const stripe = getStripe();
  
  console.log(`Creating Stripe customer for user ${userId}, email: ${email}, name: ${name}`);
  
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  console.log(`Stripe customer created:`, { id: customer.id, email: customer.email });
  
  // Update user with customer ID
  const updateResult = await db.update(users)
    .set({
      stripeCustomerId: customer.id,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));

  console.log(`Database updated for user ${userId} with customer ID: ${customer.id}`);

  return customer.id;
}

// Create subscription checkout session
export async function createSubscriptionCheckout(
  userId: string,
  planId: SubscriptionPlan,
  billingInterval: BillingInterval,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  if (planId === 'free') {
    throw new Error('Cannot create checkout for free plan');
  }
  
  if (planId === 'agency') {
    throw new Error('Agency plan is not available for self-service checkout');
  }

  const stripe = getStripe();
  
  // Get user and determine their cohort
  const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRecords.length === 0) {
    throw new Error('User not found');
  }

  const user = userRecords[0];
  const betaCohort = user.betaGroup || 'public';
  
  console.log(`User data:`, { 
    id: user.id, 
    email: user.email, 
    stripeCustomerId: user.stripeCustomerId,
    stripeCustomerIdType: typeof user.stripeCustomerId 
  });
  
  // Get the appropriate price ID for this user's cohort
  const priceId = getPriceIdForUser(planId, billingInterval, betaCohort);

  console.log(`Price lookup: plan=${planId}, interval=${billingInterval}, cohort=${betaCohort}, priceId=${priceId}`);

  if (!priceId) {
    throw new Error(`Price ID not configured for ${planId} ${billingInterval} (cohort: ${betaCohort}). Check your environment variables.`);
  }
  

  // Get or create Stripe customer - ensure it's a string or null
  // Check for corrupted '[object Object]' value in database
  let customerId: string | null = user.stripeCustomerId && 
    user.stripeCustomerId !== '[object Object]' && 
    user.stripeCustomerId !== 'undefined' && 
    user.stripeCustomerId !== 'null' 
      ? String(user.stripeCustomerId) 
      : null;
  
  if (!customerId) {
    console.log(`Creating new Stripe customer for user ${userId} (existing value was: ${user.stripeCustomerId})`);
    customerId = await createStripeCustomer(userId, user.email, user.name);
    console.log(`Created Stripe customer: ${customerId}`);
    
    // Re-fetch user to ensure we have the updated stripeCustomerId
    const updatedUserRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (updatedUserRecords.length > 0 && updatedUserRecords[0].stripeCustomerId) {
      customerId = updatedUserRecords[0].stripeCustomerId;
    }
  }
  
  // Ensure customerId is a string (not an object)
  if (typeof customerId !== 'string' || !customerId) {
    console.error(`Invalid customer ID for user ${userId}:`, { 
      customerId, 
      type: typeof customerId,
      userRecord: { id: user.id, email: user.email, stripeCustomerId: user.stripeCustomerId }
    });
    throw new Error(`Invalid customer ID for user ${userId}. Type: ${typeof customerId}, Value: ${JSON.stringify(customerId)}`);
  }
  
  console.log(`Using Stripe customer ID: ${customerId} for user ${userId}`);
  
  // Check if user already has an active subscription (upgrading vs new subscription)
  const hasActiveSubscription = user.subscriptionId && 
    user.subscriptionStatus === 'active' && 
    user.subscriptionPlan !== 'free';
  
  // Determine trial period based on cohort and subscription status
  // Beta 1: 365 days (1 year free) - only for NEW subscribers
  // Beta 2: 120 days (4 months free) - only for NEW subscribers
  // Public: 14 days - only for NEW subscribers
  // Upgrades: NO trial, immediate billing with proration
  let trialPeriodDays = 0;
  
  // Only apply trials to NEW subscribers (not upgrades)
  if (!hasActiveSubscription) {
    if (betaCohort === 'beta_1') {
      trialPeriodDays = 365;
    } else if (betaCohort === 'beta_2') {
      trialPeriodDays = 120;
    } else if (betaCohort === 'public') {
      trialPeriodDays = 14;
    }
  }
  
  // Prepare checkout session parameters
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planId,
      billingInterval,
      betaCohort,
      isUpgrade: hasActiveSubscription ? 'true' : 'false',
    },
    subscription_data: {
      metadata: {
        userId,
        planId,
        billingInterval,
        betaCohort,
        trialDays: trialPeriodDays.toString(),
        isUpgrade: hasActiveSubscription ? 'true' : 'false',
      },
      // For upgrades from existing subscription, handle proration
      ...(hasActiveSubscription ? { proration_behavior: 'create_prorations' as const } : {}),
    }
  };
  
  // Modern way: Set trial using payment_method_collection and trial_settings
  // This is compatible with Checkout (the old trial_period_days is deprecated)
  if (trialPeriodDays > 0 && !hasActiveSubscription) {
    // Calculate trial end date
    const trialEnd = Math.floor(Date.now() / 1000) + (trialPeriodDays * 24 * 60 * 60);
    
    sessionParams.subscription_data = {
      ...sessionParams.subscription_data,
      trial_end: trialEnd,
      trial_settings: {
        end_behavior: {
          missing_payment_method: 'cancel' as const,
        },
      },
    };
    
    // Allow customers to start trial without entering payment method for beta users
    if (betaCohort === 'beta_1' || betaCohort === 'beta_2') {
      sessionParams.payment_method_collection = 'if_required' as const;
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  
  console.log(`Created subscription checkout for user ${userId}: plan=${planId}, cohort=${betaCohort}, trial=${trialPeriodDays}d, isUpgrade=${hasActiveSubscription}`);

  return session;
}

// Create customer portal session
export async function createCustomerPortalSession(
  userId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe();
  
  const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRecords.length === 0) {
    throw new Error('User not found');
  }

  const user = userRecords[0];
  
  // Check for corrupted '[object Object]' value in database
  let customerId: string | null = user.stripeCustomerId && 
    user.stripeCustomerId !== '[object Object]' && 
    user.stripeCustomerId !== 'undefined' && 
    user.stripeCustomerId !== 'null' 
      ? user.stripeCustomerId 
      : null;

  // Create customer if they don't have one (e.g., PARTNER users with 100% discount)
  if (!customerId) {
    customerId = await createStripeCustomer(userId, user.email, user.name);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Update user subscription from Stripe webhook
export async function updateUserSubscription(
  stripeCustomerId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const userRecords = await db.select()
    .from(users)
    .where(eq(users.stripeCustomerId, stripeCustomerId))
    .limit(1);

  if (userRecords.length === 0) {
    console.error('User not found for Stripe customer:', stripeCustomerId);
    return;
  }

  const user = userRecords[0];
  
  // Extract cohort from subscription metadata
  const betaCohort = subscription.metadata.betaCohort as BetaCohort | undefined;
  
  // Determine plan from subscription by checking price ID against all cohorts
  let planId: SubscriptionPlan = 'free';
  const priceId = subscription.items.data[0]?.price.id;
  
  for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (key === 'free' || key === 'agency') continue;
    
    const planConfig = plan as typeof SUBSCRIPTION_PLANS.starter_pro | typeof SUBSCRIPTION_PLANS.professional;
    if (!planConfig.stripePriceId) continue;
    
    // Check all cohorts for matching price ID
    for (const cohort of ['beta_1', 'beta_2', 'public'] as BetaCohort[]) {
      const cohortPrices = planConfig.stripePriceId[cohort];
      if (cohortPrices?.monthly === priceId || cohortPrices?.yearly === priceId) {
        planId = key as SubscriptionPlan;
        break;
      }
    }
    
    if (planId !== 'free') break;
  }

  console.log(`Updating subscription for user ${user.id}: plan=${planId}, cohort=${betaCohort || user.betaGroup || 'unknown'}, status=${subscription.status}`);

  await db.update(users)
    .set({
      subscriptionPlan: planId,
      subscriptionStatus: subscription.status as any,
      subscriptionId: subscription.id,
      subscriptionCurrentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      subscriptionCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      subscriptionCancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      updatedAt: new Date()
    })
    .where(eq(users.id, user.id));
}

// Cancel subscription at period end
export async function cancelSubscriptionAtPeriodEnd(userId: string): Promise<void> {
  const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRecords.length === 0) {
    throw new Error('User not found');
  }

  const user = userRecords[0];
  if (!user.subscriptionId) {
    throw new Error('User has no active subscription');
  }

  const stripe = getStripe();
  await stripe.subscriptions.update(user.subscriptionId, {
    cancel_at_period_end: true,
  });

  await db.update(users)
    .set({
      subscriptionCancelAtPeriodEnd: true,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

// Reactivate subscription
export async function reactivateSubscription(userId: string): Promise<void> {
  const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRecords.length === 0) {
    throw new Error('User not found');
  }

  const user = userRecords[0];
  if (!user.subscriptionId) {
    throw new Error('User has no active subscription');
  }

  const stripe = getStripe();
  await stripe.subscriptions.update(user.subscriptionId, {
    cancel_at_period_end: false,
  });

  await db.update(users)
    .set({
      subscriptionCancelAtPeriodEnd: false,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

// Check if user can create more tours
export async function canUserCreateTour(userId: string): Promise<{ allowed: boolean; reason?: string; currentCount?: number; limit?: number | null }> {
  const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (userRecords.length === 0) {
    return { allowed: false, reason: 'User not found' };
  }

  const user = userRecords[0];
  const plan = getPlanConfig(user.subscriptionPlan);

  // Count current tours
  const { tours } = await import('./db/schema/index.js');
  const tourCountResult = await db.select({ tourCount: count() })
    .from(tours)
    .where(eq(tours.userId, userId));
  
  const currentCount = tourCountResult[0]?.tourCount || 0;

  // Unlimited plans
  if (plan.tourLimit === null) {
    return { allowed: true, currentCount, limit: null };
  }

  // Check if under limit
  if (currentCount < plan.tourLimit) {
    return { allowed: true, currentCount, limit: plan.tourLimit };
  }

  return { 
    allowed: false, 
    reason: `Tour limit reached (${plan.tourLimit}). Upgrade your plan to create more tours.`,
    currentCount,
    limit: plan.tourLimit
  };
}

// Get user subscription usage statistics
export async function getUserSubscriptionUsage(userId: string): Promise<{
  bookings: { used: number; limit: number | null; resetDate: Date | null };
  tours: { used: number; limit: number | null };
  plan: { name: string; id: SubscriptionPlan };
}> {
  const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (userRecords.length === 0) {
    throw new Error('User not found');
  }

  const user = userRecords[0];
  const plan = getPlanConfig(user.subscriptionPlan);

  // Count tours
  const { tours } = await import('./db/schema/index.js');
  const tourCountResult = await db.select({ tourCount: count() })
    .from(tours)
    .where(eq(tours.userId, userId));

  return {
    bookings: {
      used: user.monthlyBookingsUsed,
      limit: plan.monthlyBookingLimit,
      resetDate: user.monthlyBookingsResetAt
    },
    tours: {
      used: tourCountResult[0]?.tourCount || 0,
      limit: plan.tourLimit
    },
    plan: {
      name: plan.name,
      id: user.subscriptionPlan
    }
  };
} 
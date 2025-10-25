import Stripe from 'stripe';
import { getStripe } from './stripe.server.js';
import { db } from './db/connection.js';
import { users } from './db/schema/index.js';
import { eq, count } from 'drizzle-orm';

// Subscription plan configurations
// 
// Beta Pricing Tiers:
// - Beta 1 (50 users): 1 year free + 30% off forever
//   Essential: €25 → €17.50/month after trial
//   Premium: €49 → €34.30/month after trial
//
// - Beta 2 (100 users): 6 months free + 20% off forever  
//   Essential: €25 → €20/month after trial
//   Premium: €49 → €39.20/month after trial
//
// - Public Launch (March 2026): Full price
//   Essential: €25/month
//   Premium: €49/month
//
// Discounts are applied via promo codes (BETA2_GUIDE, BETA2_PRO, BETA2)
// and managed through user.subscriptionDiscountPercentage + user.subscriptionFreeUntil

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
      monthly: process.env.STRIPE_STARTER_PRO_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_STARTER_PRO_YEARLY_PRICE_ID,
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
      monthly: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID,
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
    stripePriceId: {
      monthly: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_AGENCY_YEARLY_PRICE_ID,
    },
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
export type BillingInterval = 'monthly' | 'yearly';

// Get plan configuration
export function getPlanConfig(planId: SubscriptionPlan) {
  return SUBSCRIPTION_PLANS[planId];
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
  
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  // Update user with customer ID
  await db.update(users)
    .set({
      stripeCustomerId: customer.id,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));

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

  const stripe = getStripe();
  const plan = getPlanConfig(planId);
  const priceId = plan.stripePriceId?.[billingInterval];

  if (!priceId) {
    throw new Error(`Price ID not configured for ${planId} ${billingInterval}`);
  }

  // Get or create customer
  const userRecords = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRecords.length === 0) {
    throw new Error('User not found');
  }

  const user = userRecords[0];
  let customerId = user.stripeCustomerId;

  if (!customerId) {
    customerId = await createStripeCustomer(userId, user.email, user.name);
  }
  
  // Check for promo benefits
  const now = new Date();
  const hasFreeTrial = user.subscriptionFreeUntil && new Date(user.subscriptionFreeUntil) > now;
  const hasDiscount = user.subscriptionDiscountPercentage && user.subscriptionDiscountPercentage > 0;
  
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
      promoCode: user.promoCodeUsed || '',
    },
  };
  
  // Apply promo benefits
  if (hasFreeTrial && user.subscriptionFreeUntil) {
    // Calculate free trial days
    const trialEndDate = new Date(user.subscriptionFreeUntil);
    const trialDays = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (trialDays > 0) {
      // Stripe requires minimum 2 days for trial
      sessionParams.subscription_data = {
        trial_period_days: Math.max(2, trialDays),
        metadata: {
          promoType: hasDiscount ? 'free_trial_with_discount' : 'free_trial',
          promoCode: user.promoCodeUsed || '',
          discountPercentage: user.subscriptionDiscountPercentage?.toString() || '0',
          isLifetimeDiscount: user.isLifetimeDiscount ? 'true' : 'false'
        }
      };
    }
  }
  
  // Apply discount coupon (can be combined with free trial)
  if (hasDiscount) {
    // Create or find a coupon for the discount percentage
    const couponId = `PROMO_${user.subscriptionDiscountPercentage}PCT${user.isLifetimeDiscount ? '_FOREVER' : ''}`;
    
    try {
      // Try to retrieve existing coupon
      await stripe.coupons.retrieve(couponId);
    } catch (error) {
      // Create coupon if it doesn't exist
      const couponData: any = {
        id: couponId,
        percent_off: user.subscriptionDiscountPercentage,
        duration: user.isLifetimeDiscount ? 'forever' : 'repeating',
        name: `${user.subscriptionDiscountPercentage}% ${user.isLifetimeDiscount ? 'Lifetime' : ''} Discount`,
        metadata: {
          type: 'promo_code_discount',
          promoCode: user.promoCodeUsed || ''
        }
      };
      
      // Only add duration_in_months for repeating coupons
      if (!user.isLifetimeDiscount) {
        couponData.duration_in_months = 12; // Default to 12 months if not lifetime
      }
      
      await stripe.coupons.create(couponData);
    }
    
    sessionParams.discounts = [{
      coupon: couponId
    }];
    
    if (!sessionParams.subscription_data) {
      sessionParams.subscription_data = {};
    }
    if (!sessionParams.subscription_data.metadata) {
      sessionParams.subscription_data.metadata = {};
    }
    // Merge discount metadata (don't override existing metadata from trial)
    sessionParams.subscription_data.metadata = {
      ...sessionParams.subscription_data.metadata,
      promoType: hasFreeTrial ? 'free_trial_with_discount' : (user.isLifetimeDiscount ? 'lifetime_discount' : 'percentage_discount'),
      promoCode: user.promoCodeUsed || '',
      discountPercentage: user.subscriptionDiscountPercentage?.toString() || '0',
      isLifetimeDiscount: user.isLifetimeDiscount ? 'true' : 'false'
    };
  }
  
  // Add basic metadata even if no promo code is used
  if (!sessionParams.subscription_data) {
    sessionParams.subscription_data = {};
  }
  if (!sessionParams.subscription_data.metadata) {
    sessionParams.subscription_data.metadata = {};
  }
  
  // Ensure all metadata fields are present
  sessionParams.subscription_data.metadata = {
    userId,
    planId,
    billingInterval,
    promoCode: user.promoCodeUsed || '',
    promoType: hasFreeTrial && hasDiscount ? 'free_trial_with_discount' : 
               hasFreeTrial ? 'free_trial' : 
               hasDiscount ? (user.isLifetimeDiscount ? 'lifetime_discount' : 'percentage_discount') : 'none',
    discountPercentage: user.subscriptionDiscountPercentage?.toString() || '0',
    isLifetimeDiscount: user.isLifetimeDiscount ? 'true' : 'false',
    ...sessionParams.subscription_data.metadata
  };

  const session = await stripe.checkout.sessions.create(sessionParams);

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
  let customerId = user.stripeCustomerId;

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
  
  // Determine plan from subscription
  let planId: SubscriptionPlan = 'free';
  const priceId = subscription.items.data[0]?.price.id;
  
  for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (plan.stripePriceId?.monthly === priceId || plan.stripePriceId?.yearly === priceId) {
      planId = key as SubscriptionPlan;
      break;
    }
  }

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
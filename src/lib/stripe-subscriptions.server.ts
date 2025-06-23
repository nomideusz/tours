import Stripe from 'stripe';
import { getStripe } from './stripe.server.js';
import { db } from './db/connection.js';
import { users } from './db/schema/index.js';
import { eq } from 'drizzle-orm';

// Subscription plan configurations
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free Starter',
    monthlyBookingLimit: 5,
    tourLimit: 1,
    features: ['Basic QR codes', 'Email notifications', '7-day onboarding sequence'],
    stripePriceId: null, // Free plan doesn't need Stripe
  },
  starter_pro: {
    id: 'starter_pro',
    name: 'Solo Guide',
    monthlyBookingLimit: 25,
    tourLimit: 3,
    features: ['Custom branding (logo, colors)', 'SMS notifications', 'QR code customization', 'Basic analytics', 'Email support'],
    stripePriceId: {
      monthly: process.env.STRIPE_STARTER_PRO_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_STARTER_PRO_YEARLY_PRICE_ID,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    monthlyBookingLimit: null, // Unlimited
    tourLimit: null, // Unlimited
    features: ['Advanced analytics & reporting', 'WhatsApp notifications', 'Customer database export', 'Review collection automation', 'Priority support (24h response)', 'Google Calendar integration', 'Multi-language booking pages'],
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
    features: ['Everything in Professional', 'Up to 10 tour guides', 'Team management dashboard', 'Revenue sharing tools', 'API access for custom integrations', 'White-label options', 'Custom domain (agency.zaur.app)', 'Dedicated account manager', 'Advanced reporting (ROI, conversion rates)'],
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

  const session = await stripe.checkout.sessions.create({
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
    },
  });

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
  if (!user.stripeCustomerId) {
    throw new Error('User has no Stripe customer ID');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
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
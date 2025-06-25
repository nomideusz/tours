# Zaur Subscription System Setup

## Overview

Zaur uses a tiered subscription model with the following plans:

### Free Starter
- 3 bookings/month
- 1 tour type
- Basic features

### Solo Guide - €16/month (€13/month annually)
- 60 bookings/month  
- 5 tour types
- Remove Zaur branding
- SMS notifications
- Basic analytics
- QR code customization

### Professional - €35/month (€29/month annually)
- Unlimited bookings
- Unlimited tour types
- Advanced analytics
- WhatsApp notifications
- Calendar sync
- Priority support

### Agency - €89/month (€74/month annually)
- Everything in Professional
- Up to 10 tour guides
- Team management
- White-label options
- API access

## Stripe Setup

### 1. Create Products in Stripe Dashboard

1. Go to Stripe Dashboard > Products
2. Create three products:
   - **Solo Guide** 
   - **Professional**
   - **Agency**

### 2. Create Prices for Each Product

For each product, create two prices:
- Monthly recurring price
- Yearly recurring price (with discount)

Example for Solo Guide:
- Monthly: €16.00/month
- Yearly: €156.00/year (shown as €13/month)

### 3. Configure Environment Variables

Add these to your `.env` file:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Subscription Price IDs
STRIPE_STARTER_PRO_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_STARTER_PRO_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PROFESSIONAL_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_AGENCY_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_AGENCY_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
```

### 4. Set Up Webhooks

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint URL: `https://zaur.app/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## Implementation Details

### Database Schema

The subscription system uses these fields in the users table:
- `stripeCustomerId` - Stripe customer ID
- `subscriptionPlan` - Current plan (free, starter_pro, professional, agency)
- `subscriptionStatus` - Stripe subscription status
- `subscriptionId` - Stripe subscription ID
- `monthlyBookingsUsed` - Bookings used this month
- `monthlyBookingsResetAt` - When to reset the counter

### Key Files

- `/subscription` - Subscription management page
- `/api/subscriptions/checkout` - Create checkout session
- `/api/subscriptions/portal` - Create customer portal session
- `/api/subscriptions/cancel` - Cancel/reactivate subscription
- `/lib/stripe-subscriptions.server.ts` - Core subscription logic

### Usage Tracking

The system automatically:
1. Tracks booking usage per month
2. Resets counters on the billing cycle
3. Prevents bookings when limits are reached
4. Shows warnings when approaching limits

## Testing

1. Use Stripe test mode with test cards
2. Test upgrade/downgrade flows
3. Test cancellation and reactivation
4. Verify webhook processing
5. Check usage limit enforcement

## 🎉 Success!

Your Stripe subscription system is now ready! Users can:

✅ Start with free plan  
✅ Upgrade to paid plans  
✅ Manage their subscriptions  
✅ Track their usage  
✅ Access customer portal  

The system automatically handles:
- Payment processing
- Subscription renewals
- Usage tracking
- Plan enforcement
- Webhook events

Happy selling! 🚀 
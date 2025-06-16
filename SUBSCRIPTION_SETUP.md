# Zaur Subscription System Setup Guide

This guide walks you through setting up the complete Stripe subscription system for Zaur's 4-tier pricing model.

## 🏗️ Architecture Overview

The subscription system includes:

- **4 Pricing Tiers**: Free Starter, Starter Pro (€12/€10), Professional (€29/€24), Agency (€79/€65)
- **Monthly/Annual Billing**: 17-20% savings on annual plans
- **Usage Tracking**: Monthly booking limits with automatic resets
- **Stripe Integration**: Checkout, Customer Portal, Webhooks
- **Database Schema**: Subscription fields in users table

## 📋 Prerequisites

1. **Stripe Account**: Set up at [stripe.com](https://stripe.com)
2. **Environment Variables**: Stripe keys configured
3. **Database**: PostgreSQL with Drizzle ORM
4. **Webhooks**: Stripe webhook endpoint configured

## 🚀 Quick Setup

### 1. Database Migration

The subscription fields have been added to your database schema. Run the migration:

```bash
pnpm drizzle-kit push
```

### 2. Create Stripe Products & Prices

Run the setup script to create products and prices in Stripe:

```bash
node scripts/setup-stripe-products.js
```

This will output environment variables that you need to add to your `.env` file:

```env
STRIPE_STARTER_PRO_MONTHLY_PRICE_ID="price_..."
STRIPE_STARTER_PRO_YEARLY_PRICE_ID="price_..."
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID="price_..."
STRIPE_PROFESSIONAL_YEARLY_PRICE_ID="price_..."
STRIPE_AGENCY_MONTHLY_PRICE_ID="price_..."
STRIPE_AGENCY_YEARLY_PRICE_ID="price_..."
```

### 3. Configure Stripe Webhooks

Add these events to your Stripe webhook:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

The webhook endpoint is: `https://your-domain.com/api/webhooks/stripe`

## 💳 Pricing Structure

### Free Starter
- **Price**: Free
- **Limits**: 2 bookings/month, 1 tour type
- **Features**: Basic QR codes, Email support

### Starter Pro
- **Price**: €12/month or €10/month (annual)
- **Limits**: 15 bookings/month, 3 tour types
- **Features**: Custom branding, SMS notifications

### Professional (Most Popular)
- **Price**: €29/month or €24/month (annual)
- **Limits**: Unlimited bookings and tours
- **Features**: Advanced analytics, Priority support, API access

### Agency
- **Price**: €79/month or €65/month (annual)
- **Limits**: Unlimited everything
- **Features**: Team management, White-label options, Dedicated support

## 🔧 API Endpoints

### Subscription Management

- `POST /api/subscriptions/checkout` - Create checkout session
- `POST /api/subscriptions/portal` - Customer portal access
- `POST /api/subscriptions/cancel` - Cancel/reactivate subscription

### Usage Tracking

- `canUserCreateBooking(userId)` - Check booking limits
- `incrementBookingUsage(userId)` - Track booking usage

## 🎯 User Flow

### 1. Registration
- New users start on Free Starter plan
- Can immediately create 1 tour and accept 2 bookings

### 2. Upgrade Process
1. User clicks upgrade button
2. Redirected to Stripe Checkout
3. Payment processed
4. Webhook updates user subscription
5. User redirected to success page

### 3. Subscription Management
- Access via `/dashboard/subscription`
- View current plan and usage
- Upgrade/downgrade plans
- Cancel subscription (remains active until period end)
- Access Stripe Customer Portal

## 📊 Usage Limits & Enforcement

### Booking Limits
- Checked before creating new bookings
- Monthly counter resets automatically
- Graceful error messages for limit exceeded

### Tour Limits
- Enforced in tour creation flow
- Clear upgrade prompts when limit reached

### Implementation Example

```typescript
// Check if user can create booking
const { allowed, reason } = await canUserCreateBooking(userId);

if (!allowed) {
  return json({ error: reason }, { status: 403 });
}

// Create booking and increment usage
await createBooking(bookingData);
await incrementBookingUsage(userId);
```

## 🔄 Webhook Events

### Subscription Events
- **Created**: New subscription activated
- **Updated**: Plan changes, renewals
- **Deleted**: Subscription cancelled

### Payment Events
- **Succeeded**: Subscription payment successful
- **Failed**: Payment failed (Stripe handles retries)

## 🎨 Frontend Components

### Subscription Page
- Current plan display
- Usage tracking
- Upgrade options
- Billing management

### Pricing Section
- 4-tier pricing display
- Monthly/annual toggle
- Feature comparisons
- CTA buttons

## 🔒 Security Considerations

### Webhook Security
- Stripe signature verification
- Idempotent event processing
- Error handling and logging

### User Data
- Stripe Customer ID stored securely
- Subscription data synced from Stripe
- No sensitive payment data stored locally

## 🧪 Testing

### Test Mode
1. Use Stripe test keys
2. Test card numbers: `4242424242424242`
3. Test webhook events in Stripe Dashboard

### Production Checklist
- [ ] Live Stripe keys configured
- [ ] Webhook endpoint verified
- [ ] All price IDs updated
- [ ] SSL certificate active
- [ ] Error monitoring enabled

## 📈 Analytics & Monitoring

### Key Metrics
- Subscription conversion rates
- Monthly recurring revenue (MRR)
- Churn rate
- Usage patterns

### Monitoring
- Webhook delivery success
- Payment failures
- Subscription status changes
- Usage limit violations

## 🆘 Troubleshooting

### Common Issues

**Webhook not receiving events**
- Check endpoint URL in Stripe Dashboard
- Verify webhook secret in environment
- Check server logs for errors

**Price ID not found**
- Ensure all price IDs are in environment variables
- Verify products exist in Stripe Dashboard
- Check for typos in environment variable names

**Subscription not updating**
- Check webhook event processing
- Verify customer ID mapping
- Review server logs for errors

### Support Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Webhook Testing](https://stripe.com/docs/webhooks/test)
- [SvelteKit API Routes](https://kit.svelte.dev/docs/routing#server)

## 🚀 Going Live

### Pre-Launch Checklist
1. **Test all subscription flows**
2. **Verify webhook processing**
3. **Test payment failures**
4. **Check usage limit enforcement**
5. **Validate email notifications**
6. **Test customer portal**
7. **Monitor error logs**

### Launch Day
1. Switch to live Stripe keys
2. Update webhook endpoint
3. Monitor subscription events
4. Watch for any errors
5. Be ready for customer support

## 📞 Customer Support

### Common Customer Questions

**How to change plans?**
- Use subscription management page
- Or contact support for assistance

**Billing questions?**
- Direct to Stripe Customer Portal
- Or handle via support team

**Cancellation policy?**
- Subscription remains active until period end
- No partial refunds (standard SaaS practice)

---

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
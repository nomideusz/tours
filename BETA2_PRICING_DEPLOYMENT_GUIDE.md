# Beta 2 Pricing System - Deployment Guide

## Overview

This guide covers the deployment of the new three-tier pricing cohort system for Zaur's Beta 2 launch.

## What Changed

### Pricing Structure
- **Before**: Single pricing with promo code coupons applied at checkout
- **After**: Three distinct pricing cohorts with prices built into Stripe

### Three Pricing Cohorts
1. **Beta 1** (30% lifetime discount + 1 year free trial)
   - Essential: €11.20/month, €109.20/year
   - Premium: €24.50/month, €310.80/year
   - For ~50 existing early access users

2. **Beta 2** (20% lifetime discount + 4 months free trial)
   - Essential: €20/month, €200/year
   - Premium: €39/month, €390/year
   - For ~100 Beta 2 users

3. **Public** (Full price + 14-day trial)
   - Essential: €25/month, €250/year
   - Premium: €49/month, €490/year
   - For general public users

### Key Changes
- Added `beta_cohort` enum type to database
- Updated `users.beta_group` to use enum instead of varchar
- Restructured Stripe price configuration with cohort-based mapping
- Updated checkout logic to select prices based on user's cohort
- Removed dynamic coupon creation (discounts now in prices)
- Hidden Agency plan from public UI (kept in code for legacy access)
- Updated promo code system to assign cohorts
- Modified pricing calculation utilities

## Pre-Deployment Checklist

### 1. Database Migration
```bash
# Run the migration to add beta_cohort enum
psql $DATABASE_URL < drizzle/migrations/0032_add_beta_cohort_enum.sql
```

Verify migration succeeded:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'beta_group';
-- Should return: beta_group | USER-DEFINED (beta_cohort enum)
```

### 2. Stripe Setup
```bash
# Run the Stripe price creation script
node scripts/setup-stripe-beta2-prices.js
```

This will:
- Create Essential and Premium products in Stripe
- Create 12 price objects (4 prices × 3 cohorts)
- Output environment variables to `scripts/stripe-price-ids-output.txt`

### 3. Environment Variables
Copy the price IDs from `scripts/stripe-price-ids-output.txt` to your `.env` file:

```bash
# Beta 1 Cohort
STRIPE_ESSENTIAL_BETA1_MONTHLY_PRICE_ID=price_xxx
STRIPE_ESSENTIAL_BETA1_YEARLY_PRICE_ID=price_xxx
STRIPE_PREMIUM_BETA1_MONTHLY_PRICE_ID=price_xxx
STRIPE_PREMIUM_BETA1_YEARLY_PRICE_ID=price_xxx

# Beta 2 Cohort
STRIPE_ESSENTIAL_BETA2_MONTHLY_PRICE_ID=price_xxx
STRIPE_ESSENTIAL_BETA2_YEARLY_PRICE_ID=price_xxx
STRIPE_PREMIUM_BETA2_MONTHLY_PRICE_ID=price_xxx
STRIPE_PREMIUM_BETA2_YEARLY_PRICE_ID=price_xxx

# Public Cohort
STRIPE_ESSENTIAL_PUBLIC_MONTHLY_PRICE_ID=price_xxx
STRIPE_ESSENTIAL_PUBLIC_YEARLY_PRICE_ID=price_xxx
STRIPE_PREMIUM_PUBLIC_MONTHLY_PRICE_ID=price_xxx
STRIPE_PREMIUM_PUBLIC_YEARLY_PRICE_ID=price_xxx
```

## Deployment Steps

### Step 1: Deploy Database Migration
```bash
# Production database
psql $PRODUCTION_DATABASE_URL < drizzle/migrations/0032_add_beta_cohort_enum.sql
```

### Step 2: Run Stripe Setup (if not done)
```bash
# Use production Stripe keys
STRIPE_SECRET_KEY=sk_live_xxx node scripts/setup-stripe-beta2-prices.js
```

### Step 3: Update Environment Variables
Add the 12 Stripe price ID environment variables to your production environment:
- Vercel: Project Settings → Environment Variables
- Railway: Project Settings → Variables
- Heroku: `heroku config:set STRIPE_ESSENTIAL_BETA1_MONTHLY_PRICE_ID=price_xxx ...`
- Docker: Update docker-compose.yml or .env.production

### Step 4: Deploy Application Code
```bash
# Build and deploy
git add .
git commit -m "feat: implement Beta 2 three-tier pricing cohort system"
git push origin master

# Or your deployment command
vercel --prod
# railway up
# etc.
```

### Step 5: Migrate Existing Users
After deployment, assign cohorts to existing users:

```bash
# Dry run first to preview changes
node scripts/migrate-users-to-cohorts.js --dry-run

# Review the output, then apply
node scripts/migrate-users-to-cohorts.js
```

This will:
- Assign `beta_1` to users with 30% discount or BETA_APPRECIATION code
- Assign `beta_2` to users with 20% discount or BETA2* codes
- Leave others as null (defaults to `public` cohort)

## Testing

### Test Each Cohort

#### 1. Test Beta 1 User
```sql
-- Create a test Beta 1 user
UPDATE users 
SET beta_group = 'beta_1', 
    subscription_discount_percentage = 30,
    is_lifetime_discount = true
WHERE email = 'test-beta1@example.com';
```

- Log in as test user
- Go to `/subscription` page
- Verify pricing shows 30% discount
- Start checkout for Essential or Premium
- Verify Stripe checkout session has 365-day trial
- Complete checkout and verify subscription created correctly

#### 2. Test Beta 2 User
```sql
-- Create a test Beta 2 user
UPDATE users 
SET beta_group = 'beta_2',
    subscription_discount_percentage = 20,
    is_lifetime_discount = true
WHERE email = 'test-beta2@example.com';
```

- Log in as test user
- Verify 20% discounted pricing shown
- Start checkout
- Verify 120-day trial period
- Complete checkout

#### 3. Test Public User
```sql
-- Create a test public user (or just create new account)
UPDATE users 
SET beta_group = NULL
WHERE email = 'test-public@example.com';
```

- Log in as test user
- Verify full pricing shown (€25/€49)
- Start checkout
- Verify 14-day trial period
- Complete checkout

### Verify Webhook Processing
```bash
# Use Stripe CLI to test webhooks
stripe listen --forward-to localhost:5173/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

## Monitoring

### Key Metrics to Watch
1. **Subscription Creation Success Rate**
   - Monitor for any checkout failures
   - Check logs for "Price ID not configured" errors

2. **Cohort Distribution**
   ```sql
   SELECT 
     beta_group,
     COUNT(*) as user_count,
     COUNT(*) FILTER (WHERE subscription_plan != 'free') as paid_users
   FROM users
   GROUP BY beta_group;
   ```

3. **Stripe Webhook Processing**
   - Monitor webhook endpoint in Stripe Dashboard
   - Check for any failed webhook deliveries

### Common Issues

#### Issue: "Price ID not configured" Error
**Cause**: Environment variable not set or incorrect cohort assignment
**Solution**: 
- Verify all 12 price ID env vars are set
- Check user's `beta_group` value in database
- Review logs for which cohort/price is being requested

#### Issue: User shows wrong pricing
**Cause**: `beta_group` not set correctly or pricing calculation issue
**Solution**:
- Check user's `beta_group` in database
- Verify `calculatePlanPricing()` is receiving correct cohort
- Clear browser cache/session

#### Issue: Checkout fails with "Invalid coupon"
**Cause**: Old code trying to apply legacy coupons
**Solution**: Verify deployed code doesn't have old coupon logic

## Rollback Plan

If critical issues arise:

### Quick Rollback (Keep Data)
```bash
# Revert to previous application version
git revert HEAD
git push origin master

# Previous checkout will fail for new users, but existing 
# subscriptions will continue working
```

### Full Rollback (If Database Issues)
```sql
-- Rollback database migration
ALTER TABLE users ALTER COLUMN beta_group TYPE varchar(20);
DROP TYPE IF EXISTS beta_cohort;
```

Then deploy previous application version.

**Note**: Existing Stripe products/prices can remain - they won't cause issues.

## Post-Deployment

### Week 1
- Monitor error rates daily
- Check subscription creation success rate
- Verify webhook processing working correctly
- Respond to any user-reported pricing issues

### Week 2-4
- Review cohort distribution analytics
- Monitor conversion rates by cohort
- Collect user feedback on pricing
- Adjust marketing messaging if needed

## Support

### User Questions
**"Why is my price different from what I see on the website?"**
- You're part of our Beta program with special lifetime pricing
- Beta 1: 30% off forever + 1 year free
- Beta 2: 20% off forever + 4 months free

**"Can I change my plan?"**
- Yes, you can upgrade/downgrade anytime
- Your Beta discount will be maintained
- Changes take effect at next billing cycle

### Admin Actions
```sql
-- Check a user's cohort and pricing
SELECT 
  email, 
  beta_group, 
  subscription_plan,
  subscription_discount_percentage,
  is_lifetime_discount
FROM users 
WHERE email = 'user@example.com';

-- Manually assign cohort (if needed)
UPDATE users 
SET beta_group = 'beta_1',
    subscription_discount_percentage = 30,
    is_lifetime_discount = true
WHERE id = 'user_id_here';
```

## Files Changed

### Database
- `drizzle/migrations/0032_add_beta_cohort_enum.sql`
- `src/lib/db/schema/drizzle.ts`

### Backend
- `src/lib/stripe-subscriptions.server.ts`
- `src/lib/utils/promo-codes.ts`
- `src/routes/api/webhooks/stripe/+server.ts`

### Frontend
- `src/lib/utils/pricing-config.ts`
- `src/routes/(app)/subscription/+page.svelte`
- `src/lib/components/marketing/PricingSection.svelte`
- `src/lib/stores/auth.ts`

### Scripts
- `scripts/setup-stripe-beta2-prices.js`
- `scripts/migrate-users-to-cohorts.js`

### Documentation
- `ENV_STRIPE_PRICES_EXAMPLE.md`
- `BETA2_PRICING_DEPLOYMENT_GUIDE.md` (this file)

## Questions?

Contact the development team or check:
- Stripe Dashboard: https://dashboard.stripe.com/
- Application logs
- Database queries shown above


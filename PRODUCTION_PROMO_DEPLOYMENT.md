# Production Promo Code Deployment Guide

## 🚀 **Deploying Promo Codes to Production**

This guide walks you through setting up your promo code system in production with live Stripe integration.

## 📋 **Pre-Deployment Checklist**

### 1. Stripe Live Account Setup

- [ ] Stripe account activated for live payments
- [ ] Business verification completed
- [ ] Bank account connected for payouts
- [ ] Live API keys generated

### 2. Environment Configuration

```bash
# Production .env variables
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # Your live secret key
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Live webhook secret
DATABASE_URL=postgresql://production-url  # Production database
```

### 3. Database Preparation

```bash
# Run in production environment
node scripts/apply-promo-codes.js
```

## 🔧 **Step-by-Step Production Setup**

### Step 1: Update Environment Variables

Replace your test keys with live keys in production:

```bash
# Get these from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_...  # Live Secret Key
STRIPE_PUBLISHABLE_KEY=pk_live_...  # Live Publishable Key
```

### Step 2: Configure Live Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your production URL: `https://zaur.app/api/webhooks/stripe`
4. Select these events:
   ```
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   invoice.payment_succeeded
   invoice.payment_failed
   ```
5. Copy the webhook signing secret
6. Add to your environment: `STRIPE_WEBHOOK_SECRET=whsec_...`

### Step 3: Deploy Promo Codes to Production Database

```bash
# Run this in your production environment
node scripts/apply-promo-codes.js
```

This creates default promo codes:
- `FOUNDER` - 1 year free + 50% lifetime
- `PREMIUM50` - 50% lifetime discount
- `FREETRIAL6` - 6 months free
- And more...

### Step 4: Test Production Integration

```bash
# Test your production setup
node scripts/test-production-promo.js
```

## 🎯 **Two Approaches for Stripe Coupons**

### Approach 1: Automatic Creation (Recommended)

**How it works:**
- Coupons are created automatically when users upgrade
- No manual setup required
- Scales infinitely
- Error-free naming

**Pros:**
- ✅ Zero manual work
- ✅ Always correct configuration
- ✅ Scales with any promo code
- ✅ No risk of typos

**Cons:**
- ⚠️ Coupons created on-demand
- ⚠️ No pre-visibility in Stripe dashboard

### Approach 2: Manual Pre-Creation (Optional)

**How it works:**
- Pre-create common coupons in Stripe
- System uses existing coupons if available
- Falls back to automatic creation for others

**To pre-create coupons:**
```bash
# Creates common coupons in your Stripe account
node scripts/create-stripe-coupons.js
```

**Pros:**
- ✅ Coupons visible in Stripe dashboard
- ✅ Can set custom descriptions
- ✅ Predictable coupon IDs

**Cons:**
- ⚠️ Manual work required
- ⚠️ Must create each discount combination
- ⚠️ Risk of mismatched configurations

## 🔄 **Production Testing Workflow**

### Manual Test Steps

1. **Register with Promo Code:**
   ```
   1. Visit https://zaur.app/auth/register
   2. Click "Have a promo code?"
   3. Enter "FOUNDER" or "PREMIUM50"
   4. Complete registration
   5. Verify benefits appear in profile
   ```

2. **Test Subscription Upgrade:**
   ```
   1. Go to /subscription page
   2. Select a paid plan
   3. Proceed to Stripe checkout
   4. Verify discount/trial is applied
   5. Complete test purchase (or cancel)
   ```

3. **Check Stripe Dashboard:**
   ```
   1. Go to Stripe Dashboard → Coupons
   2. Look for new "PROMO_*" coupons
   3. Verify correct percentages and duration
   4. Check subscription metadata
   ```

### Automated Monitoring

```bash
# Check production status anytime
node scripts/test-production-promo.js
```

## 📊 **Monitoring & Analytics**

### Stripe Dashboard Metrics

Monitor these in your Stripe dashboard:

1. **Coupons Page**: Track coupon usage and redemptions
2. **Subscriptions**: See which have promo discounts applied
3. **Revenue**: Compare discounted vs full-price revenue
4. **Webhooks**: Ensure webhook events are processing

### Database Queries

Track promo code usage:

```sql
-- Most popular promo codes
SELECT 
  promo_code_used,
  COUNT(*) as users,
  AVG(subscription_discount_percentage) as avg_discount
FROM users 
WHERE promo_code_used IS NOT NULL
GROUP BY promo_code_used
ORDER BY users DESC;

-- Revenue impact analysis
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN subscription_discount_percentage > 0 THEN 1 END) as discounted_users,
  AVG(subscription_discount_percentage) as avg_discount
FROM users;

-- Active promo codes performance
SELECT 
  code,
  type,
  current_uses,
  max_uses,
  discount_percentage,
  is_active
FROM promo_codes
ORDER BY current_uses DESC;
```

## 🚨 **Troubleshooting Common Issues**

### Issue: Coupons Not Being Created

**Symptoms:** Users get discounts in database but not in Stripe
**Solution:**
1. Check Stripe API keys are live keys
2. Verify webhook is processing correctly
3. Check server logs for Stripe API errors
4. Test coupon creation manually

### Issue: Webhooks Not Processing

**Symptoms:** Subscriptions created but metadata missing
**Solution:**
1. Verify webhook URL is correct
2. Check webhook secret matches environment
3. Test webhook endpoint manually
4. Check webhook logs in Stripe dashboard

### Issue: Promo Codes Not Validating

**Symptoms:** All promo codes show as invalid
**Solution:**
1. Ensure promo codes exist in production database
2. Run `node scripts/apply-promo-codes.js`
3. Check database connection
4. Verify API endpoints are deployed

## 🔒 **Production Security Best Practices**

### Environment Security
- ✅ Use live Stripe keys only in production
- ✅ Store secrets in secure environment variables
- ✅ Never commit secrets to version control
- ✅ Use different webhook secrets for test/live

### Database Security
- ✅ Use connection pooling
- ✅ Enable SSL for database connections
- ✅ Restrict database access by IP
- ✅ Regular backups of promo code data

### API Security
- ✅ Rate limit promo code validation
- ✅ Authentication required for applying codes
- ✅ Validate all user inputs
- ✅ Log promo code usage for auditing

## 📈 **Scaling Considerations**

### High-Volume Usage
- Consider Redis caching for promo code validation
- Implement rate limiting on validation API
- Monitor Stripe API rate limits
- Use database indexes for promo code lookups

### Multiple Environments
- Use different promo codes for staging/production
- Separate Stripe accounts for test/live
- Environment-specific webhook endpoints
- Automated deployment scripts

## 🎉 **Launch Checklist**

Before going live with promo codes:

- [ ] All environment variables set correctly
- [ ] Promo codes deployed to production database
- [ ] Stripe webhooks configured and tested
- [ ] Manual test completed successfully
- [ ] Monitoring and analytics in place
- [ ] Team trained on troubleshooting
- [ ] Backup plan for rolling back if needed

## 🔗 **Useful Resources**

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Coupons API](https://stripe.com/docs/api/coupons)
- [Production Deployment Best Practices](https://stripe.com/docs/keys#safe-keys)

---

## 🆘 **Need Help?**

If you encounter issues:

1. Run the diagnostic script: `node scripts/test-production-promo.js`
2. Check Stripe webhook logs in dashboard
3. Review server application logs
4. Test with a small discount first (5-10%)
5. Contact Stripe support if needed

**Remember:** Start with test mode, verify everything works, then switch to live mode! 🚀 
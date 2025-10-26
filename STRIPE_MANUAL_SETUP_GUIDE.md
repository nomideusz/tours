# Manual Stripe Product and Price Setup Guide

Since you can't run Node.js scripts directly in Stripe, this guide shows you how to manually create all products and prices through the Stripe Dashboard.

## Overview

You need to create:
- **2 Products** (Essential, Premium)
- **12 Prices** (4 prices per product × 3 cohorts)

Total time: ~15-20 minutes

---

## Step 1: Create Products

### Product 1: Essential

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) → **Products**
2. Click **"+ Add Product"** (top right)
3. Fill in:
   - **Name**: `Essential`
   - **Description**: `Perfect for independent guides getting started`
   - **Pricing model**: Leave as "Standard pricing"
   - Click **"Add pricing"** (don't fill it yet, we'll add prices separately)
4. Click **"Save product"**
5. **Copy the Product ID** (starts with `prod_...`) - you'll need this

### Product 2: Premium

1. Click **"+ Add Product"** again
2. Fill in:
   - **Name**: `Premium`
   - **Description**: `For guides who want to scale their business`
3. Click **"Save product"**
4. **Copy the Product ID** (starts with `prod_...`)

---

## Step 2: Create Prices for Essential Plan

Now go to **Products** → Click on **"Essential"** product → **"Add another price"**

### Essential - Beta 1 Monthly
1. Click **"Add another price"**
2. Fill in:
   - **Price**: `11.20` EUR
   - **Billing period**: Recurring → Monthly
   - **Price description** (optional): `Beta 1 Monthly`
3. Click **"Add price"**
4. **Copy the Price ID** (starts with `price_...`)
   - Save as: `STRIPE_ESSENTIAL_BETA1_MONTHLY_PRICE_ID`

### Essential - Beta 1 Yearly
1. Click **"Add another price"**
2. Fill in:
   - **Price**: `109.20` EUR
   - **Billing period**: Recurring → Yearly
   - **Price description**: `Beta 1 Yearly`
3. Click **"Add price"**
4. **Copy the Price ID** → Save as: `STRIPE_ESSENTIAL_BETA1_YEARLY_PRICE_ID`

### Essential - Beta 2 Monthly
1. Click **"Add another price"**
2. Fill in:
   - **Price**: `20.00` EUR
   - **Billing period**: Recurring → Monthly
   - **Price description**: `Beta 2 Monthly`
3. Click **"Add price"**
4. **Copy the Price ID** → Save as: `STRIPE_ESSENTIAL_BETA2_MONTHLY_PRICE_ID`

### Essential - Beta 2 Yearly
1. Click **"Add another price"**
2. Fill in:
   - **Price**: `200.00` EUR
   - **Billing period**: Recurring → Yearly
   - **Price description**: `Beta 2 Yearly`
3. Click **"Add price"**
4. **Copy the Price ID** → Save as: `STRIPE_ESSENTIAL_BETA2_YEARLY_PRICE_ID`

### Essential - Public Monthly
1. Click **"Add another price"**
2. Fill in:
   - **Price**: `25.00` EUR
   - **Billing period**: Recurring → Monthly
   - **Price description**: `Public Monthly`
3. Click **"Add price"**
4. **Copy the Price ID** → Save as: `STRIPE_ESSENTIAL_PUBLIC_MONTHLY_PRICE_ID`

### Essential - Public Yearly
1. Click **"Add another price"**
2. Fill in:
   - **Price**: `250.00` EUR
   - **Billing period**: Recurring → Yearly
   - **Price description**: `Public Yearly`
3. Click **"Add price"**
4. **Copy the Price ID** → Save as: `STRIPE_ESSENTIAL_PUBLIC_YEARLY_PRICE_ID`

---

## Step 3: Create Prices for Premium Plan

Go to **Products** → Click on **"Premium"** product → **"Add another price"**

### Premium - Beta 1 Monthly
- **Price**: `24.50` EUR
- **Billing period**: Monthly
- **Price description**: `Beta 1 Monthly`
- **Copy Price ID** → `STRIPE_PREMIUM_BETA1_MONTHLY_PRICE_ID`

### Premium - Beta 1 Yearly
- **Price**: `310.80` EUR
- **Billing period**: Yearly
- **Price description**: `Beta 1 Yearly`
- **Copy Price ID** → `STRIPE_PREMIUM_BETA1_YEARLY_PRICE_ID`

### Premium - Beta 2 Monthly
- **Price**: `39.00` EUR
- **Billing period**: Monthly
- **Price description**: `Beta 2 Monthly`
- **Copy Price ID** → `STRIPE_PREMIUM_BETA2_MONTHLY_PRICE_ID`

### Premium - Beta 2 Yearly
- **Price**: `390.00` EUR
- **Billing period**: Yearly
- **Price description**: `Beta 2 Yearly`
- **Copy Price ID** → `STRIPE_PREMIUM_BETA2_YEARLY_PRICE_ID`

### Premium - Public Monthly
- **Price**: `49.00` EUR
- **Billing period**: Monthly
- **Price description**: `Public Monthly`
- **Copy Price ID** → `STRIPE_PREMIUM_PUBLIC_MONTHLY_PRICE_ID`

### Premium - Public Yearly
- **Price**: `490.00` EUR
- **Billing period**: Yearly
- **Price description**: `Public Yearly`
- **Copy Price ID** → `STRIPE_PREMIUM_PUBLIC_YEARLY_PRICE_ID`

---

## Step 4: Copy All Price IDs to .env

After creating all prices, add them to your `.env` file:

```bash
# Beta 1 Cohort (30% lifetime discount + 1 year free)
STRIPE_ESSENTIAL_BETA1_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_ESSENTIAL_BETA1_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PREMIUM_BETA1_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PREMIUM_BETA1_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx

# Beta 2 Cohort (20% lifetime discount + 4 months free)
STRIPE_ESSENTIAL_BETA2_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_ESSENTIAL_BETA2_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PREMIUM_BETA2_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PREMIUM_BETA2_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx

# Public Cohort (full price + 14 day trial)
STRIPE_ESSENTIAL_PUBLIC_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_ESSENTIAL_PUBLIC_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PREMIUM_PUBLIC_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PREMIUM_PUBLIC_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
```

---

## Quick Reference Table

| Product | Cohort | Interval | Price | Env Variable Name |
|---------|--------|----------|-------|-------------------|
| Essential | Beta 1 | Monthly | €11.20 | STRIPE_ESSENTIAL_BETA1_MONTHLY_PRICE_ID |
| Essential | Beta 1 | Yearly | €109.20 | STRIPE_ESSENTIAL_BETA1_YEARLY_PRICE_ID |
| Essential | Beta 2 | Monthly | €20.00 | STRIPE_ESSENTIAL_BETA2_MONTHLY_PRICE_ID |
| Essential | Beta 2 | Yearly | €200.00 | STRIPE_ESSENTIAL_BETA2_YEARLY_PRICE_ID |
| Essential | Public | Monthly | €25.00 | STRIPE_ESSENTIAL_PUBLIC_MONTHLY_PRICE_ID |
| Essential | Public | Yearly | €250.00 | STRIPE_ESSENTIAL_PUBLIC_YEARLY_PRICE_ID |
| Premium | Beta 1 | Monthly | €24.50 | STRIPE_PREMIUM_BETA1_MONTHLY_PRICE_ID |
| Premium | Beta 1 | Yearly | €310.80 | STRIPE_PREMIUM_BETA1_YEARLY_PRICE_ID |
| Premium | Beta 2 | Monthly | €39.00 | STRIPE_PREMIUM_BETA2_MONTHLY_PRICE_ID |
| Premium | Beta 2 | Yearly | €390.00 | STRIPE_PREMIUM_BETA2_YEARLY_PRICE_ID |
| Premium | Public | Monthly | €49.00 | STRIPE_PREMIUM_PUBLIC_MONTHLY_PRICE_ID |
| Premium | Public | Yearly | €490.00 | STRIPE_PREMIUM_PUBLIC_YEARLY_PRICE_ID |

---

## Tips for Faster Setup

1. **Open two browser tabs**: One for Stripe Dashboard, one for this guide
2. **Use copy-paste**: Copy price IDs immediately to a text file
3. **Check twice**: Verify each price amount before saving
4. **Use price descriptions**: They help identify prices later (Beta 1 Monthly, etc.)
5. **Keep a spreadsheet**: Track which price IDs you've created

---

## Adding Metadata (Optional but Recommended)

For better tracking, you can add metadata to each price:

1. After creating a price, click on it
2. Scroll down to **"Metadata"**
3. Click **"Add metadata"**
4. Add these keys:
   - `cohort`: `beta_1`, `beta_2`, or `public`
   - `tier`: `essential` or `premium`
   - `billing`: `monthly` or `annual`

Example for Essential Beta 1 Monthly:
```
cohort: beta_1
tier: essential
billing: monthly
```

This makes it easier to identify prices later in Stripe Dashboard and webhooks.

---

## Verification

After creating all prices, verify in Stripe Dashboard:

1. Go to **Products**
2. Click on **Essential** → Should see 6 prices
3. Click on **Premium** → Should see 6 prices
4. Total: 12 prices across 2 products ✓

---

## Testing

After adding price IDs to `.env` and restarting your app:

1. Create a test user with `beta_group = 'beta_1'`
2. Go to subscription page
3. Verify correct pricing shows (30% discount)
4. Start checkout and verify correct price is selected

---

## Common Issues

### Issue: "Can't find the Add Price button"
**Solution**: Click on the product name first, then you'll see "Add another price"

### Issue: "Currency is wrong"
**Solution**: When creating a price, make sure EUR is selected in the currency dropdown (not USD)

### Issue: "Don't remember which price ID is which"
**Solution**: 
- Click on each price in Stripe Dashboard
- Look at the URL: `dashboard.stripe.com/prices/price_xxxxx`
- Check the amount and billing period to identify which one it is
- Add metadata (see section above) for easier identification

### Issue: "Made a mistake in price amount"
**Solution**: You cannot edit a price amount. Archive the incorrect price and create a new one with the correct amount.

---

## Alternative: Stripe CLI

If you have Stripe CLI installed, you can also create prices via command line:

```bash
# Example: Create Essential Beta 1 Monthly price
stripe prices create \
  --product prod_YOUR_ESSENTIAL_PRODUCT_ID \
  --unit-amount 1120 \
  --currency eur \
  --recurring[interval]=month \
  --metadata[cohort]=beta_1 \
  --metadata[tier]=essential
```

But the Dashboard method is usually simpler for one-time setup.

---

## Next Steps

After completing this manual setup:

1. ✅ Add all 12 price IDs to your `.env` file
2. ✅ Restart your application
3. ✅ Run the database migration (if not done yet)
4. ✅ Run the user cohort migration
5. ✅ Test subscription checkout for each cohort

---

## Need Help?

- **Stripe Documentation**: https://stripe.com/docs/billing/subscriptions/products-and-prices
- **Stripe Support**: Available in Dashboard → Help
- **Price ID format**: Always starts with `price_` followed by random characters
- **Product ID format**: Always starts with `prod_` followed by random characters


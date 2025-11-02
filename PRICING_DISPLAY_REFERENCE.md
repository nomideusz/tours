# Pricing Display Reference

## What Users See on Subscription Page

This document shows exactly what pricing is displayed for each cohort and plan combination.

---

## Public Users (No Beta Discount)

### Essential Plan
**Monthly:**
- Price: **€25/month**
- Badge: Regular pricing

**Yearly:**
- Price: **€250/year**
- Badge: 2 months free • Save €50

### Premium Plan
**Monthly:**
- Price: **€49/month**
- Badge: Regular pricing

**Yearly:**
- Price: **€490/year**
- Badge: 2 months free • Save €98

---

## Beta 2 Users (20% Lifetime Discount)

### Essential Plan
**Monthly:**
- ~~€25~~ **€20/month**
- Badge: 20% OFF forever

**Yearly:**
- ~~€250~~ **€200/year**
- Badge: 20% OFF forever

### Premium Plan
**Monthly:**
- ~~€49~~ **€39/month**
- Badge: 20% OFF forever

**Yearly:**
- ~~€490~~ **€390/year**
- Badge: 20% OFF forever

---

## Beta 1 Users (30% Lifetime Discount)

### Essential Plan
**Monthly:**
- **€11.20/month**
- Badge: 30% OFF forever
- *Note: Based on original base price of €16 (not current €25)*

**Yearly:**
- **€109.20/year**
- Badge: 30% OFF forever
- *Note: Based on original base price with 2 free months built in*

### Premium Plan
**Monthly:**
- **€24.50/month**
- Badge: 30% OFF forever
- *Note: Based on original base price of €35 (not current €49)*

**Yearly:**
- **€310.80/year**
- Badge: 30% OFF forever
- *Note: Based on original base price with 2 free months built in*

---

## Stripe Checkout Behavior

When users click "Subscribe" button:

### Public Users
- **Trial**: 14 days free
- **Then charged**: Monthly or yearly amount above

### Beta 2 Users
- **Trial**: 120 days free (4 months)
- **Then charged**: Discounted monthly or yearly amount

### Beta 1 Users
- **Trial**: 365 days free (1 year!)
- **Then charged**: Discounted monthly or yearly amount

---

## Annual Billing Value Proposition

### The Message: "2 Months Free"

When users select annual billing:
- They pay for **10 months** worth
- They get **12 months** of access
- Effectively **2 months free**

### Examples:

**Public Essential:**
- Monthly: €25 × 12 = €300/year
- Yearly: €250/year
- Savings: €50 (= 2 free months)

**Beta 2 Essential:**
- Monthly: €20 × 12 = €240/year
- Yearly: €200/year
- Savings: €40 (= 2 free months)

**Public Premium:**
- Monthly: €49 × 12 = €588/year
- Yearly: €490/year
- Savings: €98 (= 2 free months)

**Beta 2 Premium:**
- Monthly: €39 × 12 = €468/year
- Yearly: €390/year
- Savings: €78 (= 2 free months)

---

## Display Components Updated

1. **Subscription Page** (`src/routes/(app)/subscription/+page.svelte`)
   - Shows annual total with "/year" suffix
   - Calculates savings correctly (monthly rate × 2)
   - Toggle says "Annual (2 months free)"

2. **Marketing Pricing** (`src/lib/components/marketing/PricingSection.svelte`)
   - Toggle says "Annual (2 months free)"

3. **Beta Pricing** (`src/lib/components/marketing/BetaPricingSection.svelte`)
   - Toggle says "Annual (2 months free)"

---

## Stripe Price Alignment

All prices match exactly what's configured in Stripe:

### Essential - Public Cohort
- Monthly: `price_1SMPnsGWvjqJuxs9EZyrJ2Yt` = €25.00/month
- Yearly: `price_1SMPnsGWvjqJuxs95r4qYsjJ` = €250.00/year

### Essential - Beta 2 Cohort
- Monthly: `price_1SMPnrGWvjqJuxs9BA4Ie4r0` = €20.00/month
- Yearly: `price_1SMPnrGWvjqJuxs9Cp6i0KTP` = €200.00/year

### Premium - Public Cohort
- Monthly: `price_1SMPntGWvjqJuxs9Nf6Rmt4J` = €49.00/month
- Yearly: `price_1SMPntGWvjqJuxs97KDdM76h` = €490.00/year

### Premium - Beta 2 Cohort
- Monthly: `price_1SMPnrGWvjqJuxs9aRB3fBmo` = €39.00/month
- Yearly: `price_1SMPnsGWvjqJuxs9BemdsM7z` = €390.00/year

✅ Perfect 1:1 alignment between display and Stripe!

---

## Marketing Benefits

### Clear Value Proposition:
- ✅ "2 months free" is easy to understand
- ✅ Clean pricing (no decimals like €20.83)
- ✅ Annual amounts are round numbers (€250, €490)
- ✅ Savings are exact (€50, €98, €40, €78)

### For Each Cohort:
- **Public**: See full prices, understand the "2 free months" benefit
- **Beta 2**: See their 20% discount PLUS can get 2 free months on annual
- **Beta 1**: See their 30% discount PLUS can get 2 free months on annual

Everyone wins! 🎉


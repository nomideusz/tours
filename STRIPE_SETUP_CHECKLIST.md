# Stripe Manual Setup Checklist

Quick checklist for creating products and prices in Stripe Dashboard.

## Products to Create (2)

- [ ] **Essential** - "Perfect for independent guides getting started"
- [ ] **Premium** - "For guides who want to scale their business"

---

## Prices to Create for Essential (6)

### Beta 1 Cohort (30% discount)
- [ ] Monthly: €11.20 → Save Price ID as `STRIPE_ESSENTIAL_BETA1_MONTHLY_PRICE_ID`
- [ ] Yearly: €109.20 → Save Price ID as `STRIPE_ESSENTIAL_BETA1_YEARLY_PRICE_ID`

### Beta 2 Cohort (20% discount)
- [ ] Monthly: €20.00 → Save Price ID as `STRIPE_ESSENTIAL_BETA2_MONTHLY_PRICE_ID`
- [ ] Yearly: €200.00 → Save Price ID as `STRIPE_ESSENTIAL_BETA2_YEARLY_PRICE_ID`

### Public Cohort (full price)
- [ ] Monthly: €25.00 → Save Price ID as `STRIPE_ESSENTIAL_PUBLIC_MONTHLY_PRICE_ID`
- [ ] Yearly: €250.00 → Save Price ID as `STRIPE_ESSENTIAL_PUBLIC_YEARLY_PRICE_ID`

---

## Prices to Create for Premium (6)

### Beta 1 Cohort (30% discount)
- [ ] Monthly: €24.50 → Save Price ID as `STRIPE_PREMIUM_BETA1_MONTHLY_PRICE_ID`
- [ ] Yearly: €310.80 → Save Price ID as `STRIPE_PREMIUM_BETA1_YEARLY_PRICE_ID`

### Beta 2 Cohort (20% discount)
- [ ] Monthly: €39.00 → Save Price ID as `STRIPE_PREMIUM_BETA2_MONTHLY_PRICE_ID`
- [ ] Yearly: €390.00 → Save Price ID as `STRIPE_PREMIUM_BETA2_YEARLY_PRICE_ID`

### Public Cohort (full price)
- [ ] Monthly: €49.00 → Save Price ID as `STRIPE_PREMIUM_PUBLIC_MONTHLY_PRICE_ID`
- [ ] Yearly: €490.00 → Save Price ID as `STRIPE_PREMIUM_PUBLIC_YEARLY_PRICE_ID`

---

## After Creating All Prices

- [ ] Copy all 12 price IDs to `.env` file
- [ ] Restart application to load new environment variables
- [ ] Verify all 12 env vars are set correctly
- [ ] Run database migration (if not done yet)
- [ ] Run user cohort migration
- [ ] Test subscription checkout

---

## Quick Access

**Stripe Dashboard**: https://dashboard.stripe.com/products

**Total**: 2 Products + 12 Prices = ✅ Complete

**Time Required**: ~15-20 minutes


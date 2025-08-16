# BETA_APPRECIATION Promo Code Implementation

## Overview
The BETA_APPRECIATION promo code provides beta users with a powerful combination of benefits:
- **12 months free trial** (no charges during this period)
- **30% lifetime discount** (automatically applies after the free trial ends)

## How It Works

### 1. Database Structure
The promo code is stored in the `promo_codes` table with:
```sql
- id: 'cc15b7db-63d5-45cc-ab93-f4f5ac4ac2f9'
- code: 'BETA_APPRECIATION'
- type: 'early_access'
- discount_percentage: 30
- free_months: 12
- is_lifetime: true
```

### 2. User Application Flow

#### Step 1: User Applies Code
When a user applies the BETA_APPRECIATION code:
1. The system validates the code via `/api/promo-code/validate`
2. Benefits are calculated using `calculatePromoCodeBenefits()`
3. The code is applied via `/api/promo-code/apply`
4. User profile is updated with:
   - `promoCodeUsed`: 'BETA_APPRECIATION'
   - `subscriptionFreeUntil`: [date 12 months from now]
   - `subscriptionDiscountPercentage`: 30
   - `isLifetimeDiscount`: true

#### Step 2: During Free Trial (Months 1-12)
- User sees "FREE during trial" in pricing displays
- `calculateDiscountedPrice()` returns €0 for any subscription
- No charges are made to the user's payment method

#### Step 3: After Free Trial (Month 13+)
- System automatically transitions to lifetime discount
- User sees "30% OFF forever" in pricing displays
- `calculateDiscountedPrice()` applies 30% discount to all future bills
- Discount continues indefinitely

### 3. Stripe Integration

The system creates a seamless Stripe checkout experience:

#### During Checkout
```javascript
// The system automatically:
1. Sets trial_period_days for the free months
2. Creates/applies a "PROMO_30PCT_FOREVER" coupon
3. Sets coupon duration to "forever"
```

#### Stripe Session Parameters
```javascript
{
  subscription_data: {
    trial_period_days: [calculated days until free period ends],
    metadata: {
      promoType: 'free_trial_with_discount',
      promoCode: 'BETA_APPRECIATION',
      discountPercentage: '30',
      isLifetimeDiscount: 'true'
    }
  },
  discounts: [{
    coupon: 'PROMO_30PCT_FOREVER' // 30% off forever
  }]
}
```

### 4. Pricing Display

The UI automatically shows the correct pricing based on the user's current status:

#### During Free Trial
```
Professional Plan
€0/month (FREE during trial)
Regular price: €29/month
```

#### After Free Trial
```
Professional Plan
€20.30/month (30% OFF forever)
Regular price: €29/month
```

### 5. Key Functions

#### `calculatePromoCodeBenefits()`
- Returns both `freeUntilDate` and `discountPercentage`
- Sets `isLifetime: true` for permanent discount

#### `calculateDiscountedPrice()`
- Checks if user is in free period first
- If yes: returns €0
- If no: applies percentage discount

#### `formatPromoCodeBenefit()`
- Returns: "12 months free + 30% off forever"

## SQL Commands

### Create/Update the Promo Code
```sql
-- Update existing record
UPDATE promo_codes 
SET 
  discount_percentage = 30,
  free_months = 12,
  is_lifetime = true
WHERE id = 'cc15b7db-63d5-45cc-ab93-f4f5ac4ac2f9';

-- Or insert new record
INSERT INTO promo_codes (
  id, code, description, type, 
  discount_percentage, free_months, is_lifetime,
  max_uses, current_uses, valid_from, valid_until
) VALUES (
  'cc15b7db-63d5-45cc-ab93-f4f5ac4ac2f9',
  'BETA_APPRECIATION',
  'Beta user appreciation - 30% lifetime discount + 12 months free',
  'early_access',
  30, 12, true,
  100, 0, NOW(), NULL
);
```

### Check Promo Code Status
```sql
-- View the promo code details
SELECT * FROM promo_codes 
WHERE code = 'BETA_APPRECIATION';

-- Check how many users have used it
SELECT 
  code,
  current_uses,
  max_uses,
  (max_uses - current_uses) as remaining_uses
FROM promo_codes 
WHERE code = 'BETA_APPRECIATION';

-- See which users have this promo code
SELECT 
  id,
  email,
  name,
  promo_code_used,
  subscription_free_until,
  subscription_discount_percentage,
  is_lifetime_discount
FROM users 
WHERE promo_code_used = 'BETA_APPRECIATION';
```

## Testing

### Manual Testing Steps
1. Create a test user account
2. Navigate to `/subscription` or use the promo code input during registration
3. Enter code: `BETA_APPRECIATION`
4. Verify you see: "12 months free + 30% off forever"
5. Apply the code
6. Proceed to checkout
7. Verify Stripe shows:
   - Trial period of ~365 days
   - 30% discount that will apply after trial

### Automated Testing
Run the test script:
```bash
node test-beta-promo.js
```

## Important Notes

1. **One Promo Code Per User**: Each user can only use one promo code. Once BETA_APPRECIATION is applied, they cannot use another code.

2. **Immediate Lock-In**: The benefits are immediately saved to the user's profile and persist across all sessions.

3. **Stripe Synchronization**: The benefits are automatically synchronized with Stripe during checkout - no manual intervention needed.

4. **Lifetime Guarantee**: The 30% discount truly is lifetime - it will continue as long as the subscription is active.

5. **Cancellation & Resubscription**: If a user cancels and resubscribes later, the lifetime discount still applies (as it's stored in their profile).

## Troubleshooting

### Issue: Discount not showing after free trial
**Solution**: Check that `isLifetimeDiscount` is set to `true` in the user's profile

### Issue: Free trial not applying
**Solution**: Verify `subscriptionFreeUntil` is set to a future date

### Issue: Stripe not applying benefits
**Solution**: Check that both `trial_period_days` and `discounts` are set in the checkout session

## Business Impact

This promo code strategy:
1. **Attracts Early Adopters**: 12 months free removes all friction
2. **Creates Long-term Value**: 30% lifetime discount ensures retention
3. **Builds Loyalty**: Beta users feel valued with permanent benefits
4. **Predictable Revenue**: After free period, guaranteed recurring revenue at 70% of list price

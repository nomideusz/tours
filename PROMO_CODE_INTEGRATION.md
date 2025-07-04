# Promo Code Integration with Stripe

## Overview

The Zaur promo code system is now fully integrated with Stripe, allowing users to apply discount codes that automatically create Stripe coupons and apply them to subscription checkouts. This provides a seamless experience where users can get discounts, free trials, and lifetime benefits through promo codes.

## Features

### 🎯 Promo Code Types

1. **Early Access** - Free period + lifetime discount (e.g., FOUNDER, EARLY2025)
2. **Lifetime Discount** - Permanent percentage discount (e.g., PREMIUM50, TOURGUIDE25)
3. **Free Period** - X months free without discount (e.g., FREETRIAL6, YEARFREE)
4. **Percentage Discount** - Limited-time percentage discount (e.g., HALFOFF)

### 🔧 Key Components

- **Database Schema**: `promo_codes` table with user fields for tracking
- **API Endpoints**: Validate and apply promo codes
- **UI Component**: `PromoCodeInput` for easy form integration
- **Stripe Integration**: Automatic coupon creation and application
- **Subscription Flow**: Seamless checkout with promo benefits

## How It Works

### 1. User Flow

#### Subscription Page Flow
```
User enters promo code → Validation → Application → Stripe checkout → Subscription with benefits
```

1. User visits `/subscription` page
2. Enters promo code in the input field
3. System validates the code and shows benefits preview
4. User applies the code (stored in their profile)
5. When upgrading, Stripe checkout automatically applies the discount

#### Registration Flow
```
User registers → Optional promo code → Validation → Benefits applied → Account created with benefits
```

1. User visits `/auth/register` page
2. (Optional) Clicks "Have a promo code?" to expand promo code section
3. Enters promo code and sees real-time validation and benefits preview
4. Completes registration with promo code applied automatically
5. User account is created with promo benefits already active

**Note:** Promo codes are always optional during registration. Users can complete registration without entering any promo code.

### 2. Stripe Integration

When a user with a promo code creates a subscription:

1. **Free Trial**: Creates subscription with `trial_period_days`
2. **Discounts**: Creates Stripe coupon and applies to checkout
3. **Metadata**: Stores promo code info in subscription metadata

### 3. Automatic Coupon Creation

The system automatically creates Stripe coupons with this naming pattern:
- `PROMO_50PCT_FOREVER` - 50% lifetime discount
- `PROMO_25PCT` - 25% limited-time discount

## Setup Instructions

### 1. Database Setup

```bash
# Apply promo code schema and data
node scripts/apply-promo-codes.js

# Test the integration
node scripts/test-promo-integration.js
```

### 2. Environment Variables

Ensure these are set in your `.env`:

```bash
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Note:** The `EARLY_ACCESS_ENABLED` environment variable is no longer needed. Promo codes are now always optional for all users.

### 3. Stripe Configuration

No additional Stripe configuration needed - coupons are created automatically.

## Usage Examples

### Default Promo Codes

| Code | Type | Benefit | Max Uses |
|------|------|---------|----------|
| `FOUNDER` | Early Access | 1 year free + 50% lifetime | 10 |
| `EARLY2025` | Early Access | 1 year free + 50% lifetime | 10 |
| `PREMIUM50` | Lifetime Discount | 50% forever | Unlimited |
| `FREETRIAL6` | Free Period | 6 months free | Unlimited |
| `PARTNER` | Lifetime Discount | 100% forever (free) | Unlimited |

### API Usage

#### Validate Promo Code

```javascript
const response = await fetch('/api/promo-code/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'FOUNDER' })
});

const data = await response.json();
// { valid: true, benefitText: "12 months free + 50% off forever", benefits: {...} }
```

#### Apply Promo Code

```javascript
const response = await fetch('/api/promo-code/apply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'FOUNDER' })
});

const data = await response.json();
// { success: true, message: "Promo code applied successfully!", ... }
```

### UI Component Usage

#### Subscription Page Component
```svelte
<script>
  import PromoCodeInput from '$lib/components/PromoCodeInput.svelte';
  
  function handleApplied(event) {
    // User applied promo code successfully
    console.log('Applied:', event.detail);
    // Refresh page to show benefits
    window.location.reload();
  }
  
  function handleError(event) {
    // Handle validation errors
    console.error('Error:', event.detail.message);
  }
</script>

<PromoCodeInput 
  on:applied={handleApplied}
  on:error={handleError}
/>
```

#### Registration Page Integration
```svelte
<!-- Built-in registration promo code handling -->
<!-- Automatically validates and applies promo codes during registration -->

<!-- Always optional collapsible section -->
{#if !showPromoCode}
  <button onclick={() => showPromoCode = true}>
    Have a promo code? Click to enter it for exclusive discounts
  </button>
{:else}
  <input 
    type="text" 
    placeholder="Enter promo code for discounts"
    optional 
  />
{/if}
```

## Database Schema

### Promo Codes Table

```sql
CREATE TABLE promo_codes (
  id TEXT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  discount_percentage INTEGER,
  free_months INTEGER,
  is_lifetime BOOLEAN DEFAULT false,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP DEFAULT now(),
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### User Fields

```sql
-- Added to users table
promo_code_used VARCHAR(50),
subscription_discount_percentage INTEGER DEFAULT 0,
subscription_free_until TIMESTAMP,
is_lifetime_discount BOOLEAN DEFAULT false,
early_access_member BOOLEAN DEFAULT false
```

## Stripe Webhook Handling

The system automatically handles these webhook events:

- `customer.subscription.created` - Preserves promo code metadata
- `customer.subscription.updated` - Updates user benefits
- `invoice.payment_succeeded` - Tracks successful payments with discounts

## Error Handling

### Common Error Cases

1. **Invalid Code**: "Invalid promo code"
2. **Already Used**: "You have already used a promo code"
3. **Expired**: "This promo code has expired"
4. **Usage Limit**: "This promo code has reached its usage limit"
5. **Inactive**: "This promo code is no longer active"

### Validation Rules

- Codes are case-insensitive (stored as uppercase)
- One promo code per user (lifetime limit)
- Expiration date checking
- Usage limit enforcement
- Active status validation

## Testing

### Manual Testing

#### Subscription Page Testing
1. Visit `/subscription` page
2. Enter promo code (e.g., `FOUNDER`)
3. Verify benefits preview appears
4. Apply the code and check user profile
5. Attempt to upgrade subscription
6. Verify Stripe checkout shows discount

#### Registration Page Testing

1. Visit `/auth/register` page
2. See collapsible "Have a promo code?" section
3. Click to expand and enter code (e.g., `PREMIUM50`)
4. Verify real-time validation and benefits preview
5. Complete registration and verify benefits are applied
6. Test registration without promo code to ensure it's optional

### Automated Testing

```bash
# Run integration tests
node scripts/test-promo-integration.js

# Check database state
node scripts/check-promo-status.js
```

## Security Considerations

1. **Rate Limiting**: Consider adding rate limits to validation API
2. **Authentication**: Apply endpoint requires user authentication
3. **Validation**: Server-side validation prevents tampering
4. **Audit Trail**: All promo code usage is logged
5. **Stripe Security**: Uses Stripe's secure coupon system

## Performance Optimizations

1. **Coupon Caching**: Stripe coupons are reused when possible
2. **Database Indexing**: Indexes on promo code and user fields
3. **Validation Caching**: Consider Redis for frequent validations
4. **Batch Operations**: Efficient bulk promo code creation

## Monitoring & Analytics

### Key Metrics to Track

1. **Promo Code Usage**: Which codes are most popular
2. **Conversion Rates**: How many users upgrade after applying codes
3. **Revenue Impact**: Discount amounts and lifetime value
4. **User Retention**: Do promo users stay longer?

### Database Queries

```sql
-- Most popular promo codes
SELECT code, current_uses, max_uses 
FROM promo_codes 
ORDER BY current_uses DESC;

-- Users with active discounts
SELECT COUNT(*) as users_with_discounts
FROM users 
WHERE subscription_discount_percentage > 0;

-- Revenue impact
SELECT 
  promo_code_used,
  COUNT(*) as users,
  AVG(subscription_discount_percentage) as avg_discount
FROM users 
WHERE promo_code_used IS NOT NULL
GROUP BY promo_code_used;
```

## Support & Troubleshooting

### Common Issues

1. **Coupon Not Applied**: Check user profile for promo code data
2. **Subscription Metadata**: Verify webhook is processing correctly
3. **Database Sync**: Ensure user fields match Stripe data
4. **UI Not Updating**: Check event handlers and page refresh

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify API responses in Network tab
3. Check server logs for webhook processing
4. Validate database state with test script
5. Test Stripe dashboard for coupon creation

## Future Enhancements

### Planned Features

1. **Referral Codes**: User-generated promo codes
2. **Conditional Discounts**: Based on plan or region
3. **Bulk Code Generation**: Create multiple codes at once
4. **Usage Analytics**: Detailed reporting dashboard
5. **A/B Testing**: Test different discount strategies

### API Extensions

1. **Admin Endpoints**: Create/edit/delete promo codes
2. **Analytics API**: Usage statistics and reporting
3. **Bulk Operations**: Apply codes to multiple users
4. **Webhook Events**: Custom events for promo code usage

## Conclusion

The integrated promo code system provides a powerful way to offer discounts and incentives to users while maintaining full integration with Stripe's subscription system. 

### Key Benefits:
- **Always Optional**: Users can register and subscribe without any promo codes
- **Simple UX**: Collapsible promo code section doesn't clutter the registration form
- **Real-time Validation**: Instant feedback on promo code validity and benefits
- **Seamless Integration**: Works consistently across registration and subscription pages
- **Flexible**: Supports various discount types (lifetime, temporary, free periods)

The modular design allows for easy extension and customization while providing a seamless user experience. All users can access the platform regardless of whether they have promo codes.

For questions or issues, refer to the test script output or check the server logs for detailed error information. 
# How to Enable Cross-Border Payouts

## Current Status: ❌ DISABLED

Cross-border payouts are currently **disabled** because Stripe's cross-border payout feature requires a **US-based platform business**. Since Zaur is registered in Poland, this feature cannot be used.

## Requirements to Enable

To use Stripe Cross-Border Payouts, you would need:

1. **US-based business entity** (LLC, Corp, etc.)
2. **US Stripe account** registered to that entity
3. **US bank account** for the platform

## Alternative Options

### Option 1: Multi-Region Strategy
- Set up US subsidiary/entity
- Create separate US Stripe account
- Route cross-border payments through US entity

### Option 2: Alternative Payment Processors
- **Airwallex**: Supports Polish businesses with global payouts
- **ProcessOut**: Global payment orchestration platform
- **Adyen**: Enterprise solution with global coverage

### Option 3: Stripe Connect Expansion
- Focus on Stripe Connect's 46 countries (covers major markets)
- Add waitlist for unsupported countries
- Expand later with alternative processors

## How to Re-enable Cross-Border Code

If you set up a US entity and want to enable cross-border payouts:

### 1. Update Countries Configuration (`src/lib/utils/countries.ts`)

```typescript
// Change this line:
export const COUNTRY_LIST = Object.values(STRIPE_SUPPORTED_COUNTRIES).sort((a, b) => 
  a.name.localeCompare(b.name)
);

// To this:
export const COUNTRY_LIST = Object.values(ALL_SUPPORTED_COUNTRIES).sort((a, b) => 
  a.name.localeCompare(b.name)
);
```

### 2. Enable Payment Method Detection

```typescript
// In getPaymentMethod function, change:
} else if (supportsCrossBorderPayouts(countryCode)) {
  return 'unsupported';
  // return 'crossborder';
}

// To:
} else if (supportsCrossBorderPayouts(countryCode)) {
  return 'crossborder';
}
```

### 3. Set Up Stripe Configuration

1. **Enable cross-border payouts** in US Stripe Dashboard
2. **Complete business verification** if required
3. **Set up environment variables**:
   ```bash
   PAYOUT_PROCESSING_TOKEN=your_secure_random_token
   STRIPE_SECRET_KEY=sk_live_... # US account
   ```

### 4. Set Up Automated Payouts

Configure weekly cron job or GitHub Action to call:
```
POST /api/payouts/process
Authorization: Bearer your_secure_random_token
```

### 5. Configure Webhooks

Add webhook in US Stripe Dashboard:
- **URL**: `https://zaur.app/api/webhooks/stripe`
- **Events**: `payout.paid`, `payout.failed`, `payout.canceled`

## Current Implementation Status

✅ **Complete Infrastructure Available**:
- Database schema with payout tables
- Bank account collection forms
- Payout processing API
- Cross-border payment routing
- Weekly payout scheduling
- Payout dashboard UI

🔒 **Simply Disabled**: All code is in place and tested, just switches disabled for Polish business restrictions.

## Countries Affected

Currently **48 additional countries** would become available with cross-border payouts:

- **Asia**: India, Indonesia, Philippines, Vietnam, Maldives, etc.
- **Africa**: Nigeria, Kenya, South Africa, Egypt, etc.
- **Americas**: Many Caribbean and Latin American countries
- **Europe**: Some Eastern European countries

These countries are preserved in `CROSSBORDER_ONLY_COUNTRIES` and ready to enable.
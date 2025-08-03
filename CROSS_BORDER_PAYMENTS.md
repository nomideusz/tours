# Cross-Border Payment System

## ⚠️ CURRENT STATUS: DISABLED

**Cross-border payouts are currently DISABLED** because Stripe's cross-border payout feature requires a US-based platform business. Since Zaur is registered in Poland, this feature cannot be used.

See `ENABLE_CROSSBORDER_GUIDE.md` for details on how to enable this feature if/when a US entity is established.

## Overview

This document explains the cross-border payment system infrastructure that was built to enable tour guides from countries not supported by Stripe Connect to receive payments.

**Currently Active:** Tour guides in **46 countries** via Stripe Connect Direct Payments
**Infrastructure Ready:** Additional 50+ countries via Platform Collection (disabled)

## Supported Countries

### Direct Payment Countries (Stripe Connect)
- All 46 countries supported by Stripe Connect Express
- Tour guides get instant payouts to their own Stripe accounts
- **Examples:** Germany, France, UK, US, Poland, etc.

### Cross-Border Payout Countries
- **100+ additional countries** including:
- **Maldives** ✅
- India, Indonesia, Philippines, Sri Lanka, Vietnam
- Most countries in Africa, Asia, and Latin America
- Tour guides receive weekly payouts to their bank accounts

## How It Works

### For Supported Countries (Direct)
1. Tour guide creates Stripe Connect account during onboarding
2. Customers pay directly to tour guide's account
3. Tour guide receives instant payouts
4. Platform takes 0% commission

### For Cross-Border Countries (Platform Collection)
1. System detects tour guide's country doesn't support Stripe Connect
2. Platform collects payment on behalf of tour guide
3. Payment tracked in database for weekly payout
4. Automated system processes payouts every Wednesday
5. Tour guide receives 97%+ of booking value (after processing fees)

## Technical Implementation

### Country Detection
```typescript
// Automatic routing based on country
const paymentMethod = getPaymentMethod(tourGuideCountry);
// Returns: 'connect' | 'crossborder' | 'unsupported'
```

### Payment Flow
```typescript
// Frontend automatically tries direct payment first
let response = await fetch('/api/payments', { ... });

// If tour guide requires platform collection, automatically redirect
if (errorData.error === 'REDIRECT_TO_PLATFORM_PAYMENT') {
  response = await fetch('/api/payments/platform', { ... });
}
```

### Database Schema
- **payments** table with `paymentType` field ('direct' | 'platform_collected')
- **payouts** table for tracking weekly payouts
- **payoutItems** table linking individual payments to payouts

## Setup Instructions

### 1. Environment Variables
Add to your `.env` file:
```bash
# Token to secure the automated payout processing endpoint
PAYOUT_PROCESSING_TOKEN=your-secure-random-token
```

### 2. Database Migration
Run the database migration to add the new tables:
```bash
# The new schema is already in src/lib/db/schema/drizzle.ts
# Run your migration process to update the database
```

### 3. Automated Payouts
Set up a weekly cron job to process payouts:
```bash
# Every Wednesday at 12:00 PM UTC
0 12 * * 3 curl -X POST https://zaur.app/api/payouts/process \
  -H "Authorization: Bearer $PAYOUT_PROCESSING_TOKEN"
```

### 4. Stripe Configuration
- Ensure your Stripe account supports cross-border payouts
- Configure webhook endpoints for payout status updates

## User Experience

### For Tour Guides
1. **Direct Payment Countries:**
   - Complete Stripe Connect onboarding
   - Receive instant payouts
   - Full control over their Stripe account

2. **Cross-Border Countries:**
   - No Stripe account needed
   - Receive clear explanation of weekly payout system
   - View pending earnings and payout history in dashboard

### For Customers
- **Identical booking experience** regardless of tour guide's country
- **Automatic routing** - no additional steps needed
- **Same payment methods** available (cards, wallets, etc.)

## Monitoring & Analytics

### Tour Guide Dashboard
- Pending earnings from platform-collected payments
- Payout history and status
- Next payout date (every Wednesday)
- Lifetime earnings statistics

### Platform Analytics
- Track payment method distribution
- Monitor cross-border payout success rates
- Analyze geographical coverage expansion

## Error Handling

### Common Scenarios
1. **Unsupported Country:** Clear error message with support contact
2. **Payout Failures:** Automatic retry with detailed logging
3. **Currency Issues:** Automatic currency detection and conversion

### Logging
- All payment routing decisions logged
- Payout processing results tracked
- Failed payouts flagged for manual review

## Security

### Payment Collection
- Platform never stores customer payment details
- All payments processed through Stripe's secure infrastructure
- Tour guide bank details stored encrypted

### Payout Processing
- Secure API endpoint with token authentication
- Audit trail for all payout transactions
- Automatic fraud detection through Stripe

## Benefits

### For Zaur Platform
- **Support 100+ countries** vs previous 46
- **Maintain 0% commission model**
- **Scalable infrastructure** for global expansion
- **Compliance handled by Stripe**

### For Tour Guides
- **Access to international customers**
- **Reliable weekly payouts**
- **No additional fees or setup**
- **Transparent tracking**

### For Customers
- **Book tours worldwide** 
- **Familiar payment experience**
- **Same security guarantees**
- **Multiple payment methods**

## Troubleshooting

### Tour Guide Can't Set Up Payments
1. Check if country is in supported list
2. If cross-border country, no setup needed - payments automatically collected
3. If unsupported, contact support for alternative solutions

### Payouts Not Processing
1. Check automated job is running weekly
2. Verify `PAYOUT_PROCESSING_TOKEN` is set correctly
3. Review logs for specific error messages
4. Ensure minimum payout thresholds are met

### Customer Payment Issues
1. System automatically routes to correct payment method
2. Cross-border payments use platform account (more payment methods)
3. Direct payments use tour guide's Stripe account settings

## Future Enhancements

### Potential Improvements
1. **Daily payouts** for high-volume tour guides
2. **Multiple currencies** per tour guide
3. **Instant payouts** to digital wallets
4. **Enhanced analytics** and reporting

### Monitoring Metrics
- Payment success rates by country
- Average payout processing time
- Customer payment method preferences
- Tour guide satisfaction scores

---

## Quick Reference

### Key Files
- `src/lib/utils/countries.ts` - Single source of truth for country and payment method support
- `src/routes/api/payments/platform/+server.ts` - Platform payment collection
- `src/routes/api/payouts/process/+server.ts` - Weekly payout processing
- `src/routes/api/payouts/status/+server.ts` - Payout status API

### Important Endpoints
- `POST /api/payments` - Primary payment endpoint (auto-routing)
- `POST /api/payments/platform` - Platform collection for cross-border
- `POST /api/payouts/process` - Weekly payout processing (cron job)
- `GET /api/payouts/status` - Tour guide payout dashboard data

This system successfully enables Zaur to support tour guides worldwide while maintaining the 0% commission business model and providing excellent user experience for both tour guides and customers.
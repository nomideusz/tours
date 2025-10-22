# Deployment Guide: Separate Charges + Transfers System

## 🎯 What We're Deploying

A robust payment system that **holds funds on the platform** until after the cancellation window, then automatically transfers to tour guides. This **guarantees refunds are always available**.

---

## 📋 Pre-Deployment Checklist

### Environment Variables

Add to `.env` (both local and production):

```bash
# Cron job security (generate a random string)
CRON_SECRET=generate-random-secret-here-use-openssl-rand-base64-32

# Stripe keys (IMPORTANT: These must be PLATFORM account keys)
STRIPE_SECRET_KEY=sk_live_YOUR_PLATFORM_KEY  # NOT test key!
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PLATFORM_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### Database Migrations

Run both SQL migrations in order:

```bash
# 1. Cancellation policies & refund tracking
psql -d zaur_production -f database-migration-cancellation-refunds.sql

# 2. Transfer tracking
psql -d zaur_production -f database-migration-add-transfers.sql
```

Verify migrations:
```sql
-- Check new columns exist
\d bookings
-- Should show: refund_id, transfer_id, transfer_scheduled_for, etc.

\d tours  
-- Should show: cancellation_policy_id
```

---

## 🚀 Deployment Steps

### Step 1: Deploy Code Changes

Files that changed:
- ✅ `src/routes/api/payments/+server.ts` - Uses Separate Charges now
- ✅ `src/routes/api/webhooks/stripe/+server.ts` - Schedules transfers
- ✅ `src/routes/(public)/book/[code]/+page.server.ts` - Schedules transfers
- ✅ `src/lib/db/schema/drizzle.ts` - New fields
- ✅ `src/routes/api/bookings/[id]/cancel/+server.ts` - NEW cancellation API
- ✅ `src/routes/api/bookings/[id]/refund-preview/+server.ts` - NEW preview API
- ✅ `src/routes/api/cron/process-transfers/+server.ts` - NEW cron job
- ✅ `src/lib/payment-transfers.ts` - Transfer logic
- ✅ `src/lib/utils/cancellation-policies.ts` - Policy logic
- ✅ `src/lib/queries/mutations.ts` - Cancel mutation

Deploy as normal:
```bash
git add .
git commit -m "feat: Implement Separate Charges + Transfers for guaranteed refunds"
git push origin master
```

### Step 2: Update Stripe Webhook

⚠️ **CRITICAL**: Webhook must now listen to **platform account events** (not connected account)

1. Go to https://dashboard.stripe.com/webhooks
2. Find your webhook or create new one
3. **Endpoint URL**: `https://zaur.app/api/webhooks/stripe`
4. **Listen to**: Select "Events on your account" (NOT "Events on Connected accounts")
5. **Events to send**:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
   - ✅ `charge.refunded` (new - for refund notifications)
   - ✅ `transfer.created` (new - for transfer tracking)
   - ✅ `transfer.failed` (new - for transfer failures)

6. Copy the webhook signing secret → Update `STRIPE_WEBHOOK_SECRET` in env

### Step 3: Set Up Cron Job

Choose ONE method:

#### Option A: CapRover (if using CapRover)

Update `captain-definition`:
```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile"
}
```

Then set up manual cron via CapRover dashboard or external service.

#### Option B: External Cron Service (Recommended)

Use **cron-job.org** or **EasyCron**:

- **URL**: `https://zaur.app/api/cron/process-transfers`
- **Method**: GET
- **Schedule**: Every hour (`0 * * * *`)
- **Headers**: `Authorization: Bearer YOUR_CRON_SECRET`
- **Timeout**: 120 seconds
- **Retries**: 2

#### Option C: GitHub Actions

Create `.github/workflows/transfer-cron.yml`:

```yaml
name: Process Transfers
on:
  schedule:
    - cron: '0 * * * *' # Every hour
  workflow_dispatch: # Allow manual trigger
jobs:
  transfer:
    runs-on: ubuntu-latest
    steps:
      - name: Process pending transfers
        run: |
          curl -X GET "https://zaur.app/api/cron/process-transfers" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -f -s -S
```

Add `CRON_SECRET` to GitHub repository secrets.

### Step 4: Test the System

#### Test Payment Flow:
```bash
# 1. Create a test booking
# 2. Check logs for "Creating payment with transfer_data"
# 3. Verify payment shows in PLATFORM Stripe dashboard (not guide's)
# 4. Check booking record has transfer_scheduled_for set
```

Expected log output:
```
Creating payment with transfer_data (Separate Charges): { amount: 100, currency: 'usd', destination: 'acct_xxx' }
Payment intent created successfully: pi_xxx
💸 Transfer scheduled for 2025-10-23T12:00:00.000Z (policy: flexible)
```

#### Test Transfer Processing:
```bash
# Manually trigger cron (replace with your secret)
curl -X GET "http://localhost:5173/api/cron/process-transfers" \
  -H "Authorization: Bearer your-cron-secret"
```

Expected response:
```json
{
  "success": true,
  "timestamp": "2025-10-21T...",
  "totalPending": 5,
  "succeeded": 5,
  "failed": 0
}
```

#### Test Refund:
```bash
# Preview refund
curl "http://localhost:5173/api/bookings/BOOKING_ID/refund-preview"

# Cancel booking
curl -X POST "http://localhost:5173/api/bookings/BOOKING_ID/cancel" \
  -H "Content-Type: application/json" \
  -d '{"reason":"illness"}'
```

---

## 🔍 Monitoring After Deployment

### Check These Every Day (First Week):

1. **Platform Stripe Dashboard**
   - Check Payments tab - should see incoming payments
   - Check Transfers tab - should see outgoing transfers
   - Balance should fluctuate (in from payments, out via transfers)

2. **Database Queries**
```sql
-- Pending transfers
SELECT COUNT(*) FROM bookings 
WHERE transfer_status = 'pending' 
  AND transfer_scheduled_for < NOW();
-- Should be 0 if cron is running

-- Failed transfers (investigate these!)
SELECT * FROM bookings 
WHERE transfer_status = 'failed' 
ORDER BY updated_at DESC 
LIMIT 10;

-- Transfer timing verification
SELECT 
  booking_reference,
  total_amount,
  transfer_scheduled_for,
  transfer_processed_at,
  transfer_status,
  (transfer_processed_at - transfer_scheduled_for) as delay
FROM bookings
WHERE transfer_id IS NOT NULL
ORDER BY transfer_processed_at DESC
LIMIT 20;
```

3. **Cron Job Logs**
```
✅ Look for: "Transfer cron completed: X succeeded, 0 failed"
❌ Alert on: Any failed transfers
⚠️ Alert on: Cron job not running (no logs for >2 hours)
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Invalid API Key"
**Cause**: Using test keys in production or wrong account's keys
**Solution**: Verify `STRIPE_SECRET_KEY` is from PLATFORM account (not Connected account)

### Issue 2: "Webhook signature verification failed"
**Cause**: Wrong webhook secret
**Solution**: Get fresh secret from Stripe webhook settings, update `STRIPE_WEBHOOK_SECRET`

### Issue 3: "No source or destination"
**Cause**: Payment created without transfer_data
**Solution**: Verify code deployed correctly, check payment creation logs

### Issue 4: "Cron not processing transfers"
**Cause**: Cron job not running or authorization failed
**Solution**: 
- Check cron service is configured
- Verify `Authorization` header is correct
- Test manually with curl

### Issue 5: "Insufficient funds for transfer"
**Cause**: Platform account balance too low
**Solution**: This shouldn't happen (payments add funds), but check platform balance

---

## 🔄 Rollback Plan

If something goes wrong:

### Immediate Rollback (< 5 minutes):

```bash
# Revert to previous git commit
git revert HEAD
git push origin master
```

### Data Cleanup:

```sql
-- Reset any pending transfers to prevent issues
UPDATE bookings
SET transfer_status = NULL,
    transfer_scheduled_for = NULL
WHERE transfer_id IS NULL 
  AND transfer_status = 'pending';
```

### Switch Back to Direct Charges:

Restore old payment creation code:
```typescript
const paymentIntent = await createDirectPaymentIntent(
  requestAmount,
  currency,
  connectedAccountId,
  metadata
);
```

---

## 📊 Success Metrics

### Week 1 Goals:
- ✅ All new bookings use Separate Charges
- ✅ Zero failed transfers
- ✅ Transfer cron runs every hour
- ✅ No customer complaints about delayed refunds

### Week 2 Goals:
- ✅ Average transfer delay < 2 hours after scheduled time
- ✅ 100% of refunds processed successfully
- ✅ Tour guides understand new payment timing
- ✅ Platform balance stays positive (payments > transfers)

### Month 1 Goals:
- ✅ Zero chargeback disputes
- ✅ <1% failed transfer rate
- ✅ Positive tour guide feedback
- ✅ Smooth operations, no manual interventions

---

## 📧 Communication to Tour Guides

**Subject**: Important Update - New Payment Protection System

```
Hello Tour Guides!

We've implemented an improved payment system to protect both you and your customers:

WHAT'S CHANGING:
✓ Payments now held securely by Zaur until after your cancellation window
✓ Automatic transfer to your Stripe account when refund risk passes
✓ Guarantees you can always process customer refunds

YOUR PAYMENT TIMELINE:
• Flexible Policy (24h): Receive payment 25 hours before tour
• Moderate Policy (48h): Receive payment 49 hours before tour
• Strict Policy (7d): Receive payment 8 days before tour
• Completed tours: Immediate transfer

WHY THIS HELPS YOU:
✓ Professional refund processing
✓ No "insufficient balance" errors
✓ Protects your Stripe account reputation
✓ Reduces customer disputes

YOUR EARNINGS DON'T CHANGE - just the timing!

Questions? Visit our Help Center or reply to this email.

- The Zaur Team
```

---

## 🎉 You're Ready!

**Post-Deployment:**
1. Monitor for 24 hours
2. Check first transfers process correctly
3. Verify refunds work
4. Communicate with tour guides
5. Celebrate professional payment system! 🚀

**Support Resources:**
- Stripe Dashboard: https://dashboard.stripe.com
- Transfer Logs: Check `/api/cron/process-transfers` endpoint
- Database: Use provided SQL queries
- Documentation: See `docs/SEPARATE_CHARGES_MIGRATION.md`


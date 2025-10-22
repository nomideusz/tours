# Migration Guide: Direct Charges → Separate Charges + Transfers

## What Changes

### Before (Current - Direct Charges):
```
Customer → Pays → Guide's Stripe Account (immediate)
                    ↓
              Guide can withdraw anytime
```

### After (Separate Charges + Transfers):
```
Customer → Pays → Platform Stripe Account (held)
                    ↓ (after cancellation window)
               Transfer → Guide's Stripe Account
                           ↓
                      Guide can withdraw
```

## Key Code Changes

### 1. Update Payment Creation

**File: `src/routes/api/payments/+server.ts`**

**FIND:**
```typescript
const paymentIntent = await createDirectPaymentIntent(
  requestAmount, 
  currency,
  connectedAccountId,
  { bookingId, ... }
);
```

**REPLACE WITH:**
```typescript
// NEW: Create payment on platform with transfer_data
const paymentIntent = await stripe.paymentIntents.create({
  amount: formatAmountForStripe(requestAmount, currency),
  currency: currency.toLowerCase(),
  transfer_data: {
    destination: connectedAccountId,
  },
  metadata: {
    bookingId,
    bookingReference: booking.bookingReference,
    tourId: booking.tourId,
    customerEmail: booking.customerEmail
  },
  automatic_payment_methods: {
    enabled: true
  }
  // NOTE: No stripeAccount parameter - goes to platform
});
```

### 2. Add Transfer Scheduling on Booking Creation

**File: `src/routes/(public)/book/[code]/+page.server.ts`**

**AFTER creating booking, ADD:**

```typescript
import { calculateTransferTime } from '$lib/payment-transfers.js';

// Calculate when to transfer funds to guide
const transferScheduledFor = calculateTransferTime(
  timeSlot.startTime,
  tour.cancellationPolicyId || 'flexible'
);

// Update booking with transfer schedule
await db.update(bookings)
  .set({
    transferScheduledFor,
    transferStatus: 'pending'
  })
  .where(eq(bookings.id, booking.id));

console.log(`Transfer scheduled for ${transferScheduledFor.toISOString()}`);
```

### 3. Create Automated Transfer Cron Job

**File: `src/routes/api/cron/process-transfers/+server.ts`** (NEW)

```typescript
import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/connection.js';
import { bookings, tours, users } from '$lib/db/schema/index.js';
import { eq, and, lte, isNull } from 'drizzle-orm';
import { createTransferToGuide, isReadyForTransfer } from '$lib/payment-transfers.js';

export const GET: RequestHandler = async ({ request }) => {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET || 'your-secret-here';
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const now = new Date();
    console.log(`🔄 Transfer cron job started at ${now.toISOString()}`);
    
    // Find bookings ready for transfer
    const pendingTransfers = await db
      .select({
        bookingId: bookings.id,
        bookingAmount: bookings.totalAmount,
        bookingReference: bookings.bookingReference,
        tourId: tours.id,
        tourName: tours.name,
        guideId: users.id,
        guideStripeAccountId: users.stripeAccountId,
        guideCurrency: users.currency,
        paymentId: bookings.paymentId,
        transferScheduledFor: bookings.transferScheduledFor
      })
      .from(bookings)
      .innerJoin(tours, eq(bookings.tourId, tours.id))
      .innerJoin(users, eq(tours.userId, users.id))
      .where(and(
        eq(bookings.paymentStatus, 'paid'),
        eq(bookings.status, 'confirmed'),
        isNull(bookings.transferId),
        lte(bookings.transferScheduledFor, now)
      ))
      .limit(100); // Process up to 100 per run
    
    console.log(`Found ${pendingTransfers.length} bookings ready for transfer`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const booking of pendingTransfers) {
      try {
        // Validate guide has Stripe account
        if (!booking.guideStripeAccountId) {
          throw new Error('Guide has no Stripe account');
        }
        
        // Create transfer
        const transfer = await createTransferToGuide(
          parseFloat(booking.bookingAmount),
          booking.guideCurrency || 'EUR',
          booking.guideStripeAccountId,
          {
            bookingId: booking.bookingId,
            bookingReference: booking.bookingReference,
            tourId: booking.tourId,
            tourName: booking.tourName
          }
        );
        
        // Update booking with transfer info
        await db.update(bookings).set({
          transferId: transfer.id,
          transferStatus: 'completed',
          transferProcessedAt: new Date()
        }).where(eq(bookings.id, booking.bookingId));
        
        successCount++;
        console.log(`✅ [${successCount}/${pendingTransfers.length}] Transferred ${booking.guideCurrency}${booking.bookingAmount} for booking ${booking.bookingReference}`);
        
      } catch (error) {
        failCount++;
        console.error(`❌ Transfer failed for ${booking.bookingReference}:`, error);
        
        // Mark as failed
        await db.update(bookings).set({
          transferStatus: 'failed',
          transferNotes: error instanceof Error ? error.message : 'Transfer failed'
        }).where(eq(bookings.id, booking.bookingId));
      }
    }
    
    console.log(`✅ Transfer cron completed: ${successCount} succeeded, ${failCount} failed`);
    
    return json({
      success: true,
      processed: pendingTransfers.length,
      succeeded: successCount,
      failed: failCount
    });
    
  } catch (error) {
    console.error('❌ Transfer cron job error:', error);
    return json({
      error: 'Transfer processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
```

### 4. Set Up Cron Job

**CapRover cron (captain-definition):**
```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile",
  "cron": [
    {
      "scheduledTime": "0 * * * *",
      "containerPath": "/cron/process-transfers",
      "command": "curl -H 'Authorization: Bearer ${CRON_SECRET}' http://localhost:5173/api/cron/process-transfers"
    }
  ]
}
```

Or use external cron service:
- **Cron-job.org**
- **EasyCron**
- **GitHub Actions**

```yaml
# .github/workflows/transfer-cron.yml
name: Process Transfers
on:
  schedule:
    - cron: '0 * * * *' # Every hour
jobs:
  transfer:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger transfer processing
        run: |
          curl -X GET "https://zaur.app/api/cron/process-transfers" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### 5. Update Webhook Handler

**File: `src/routes/api/webhooks/stripe/+server.ts`**

Payment now goes to platform account, so webhook handling stays mostly the same but:

```typescript
case 'payment_intent.succeeded': {
  // Payment went to platform account
  // Schedule transfer to guide
  const transferTime = calculateTransferTime(
    timeSlot.startTime,
    tour.cancellationPolicyId
  );
  
  await db.update(bookings).set({
    transferScheduledFor: transferTime,
    transferStatus: 'pending'
  }).where(eq(bookings.id, bookingId));
}
```

## Configuration

### Environment Variables

Add to `.env`:
```bash
# Cron job security
CRON_SECRET=your-random-secret-here-generate-securely

# Stripe keys (same as before)
STRIPE_SECRET_KEY=sk_live_xxx # Platform account
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### Stripe Webhook Configuration

**Platform Webhook** (existing):
- Listen to: `payment_intent.succeeded`, `payment_intent.failed`, etc.
- URL: `https://zaur.app/api/webhooks/stripe`

**Connect Webhook** (might not need if using platform charges):
- Can be removed or kept for account events

## Benefits

✅ **Guaranteed Refunds** - Funds always available  
✅ **No Guide Balance Issues** - Platform holds funds  
✅ **Flexible Timing** - Transfer based on cancellation policy  
✅ **Early Payouts** - Completed tours transfer immediately  
✅ **Professional** - Industry standard approach  
✅ **Dispute Protection** - Reduces chargebacks  

## Migration Path

### Week 1: Preparation
1. Run database migration
2. Test transfer functions
3. Set up cron job
4. Update documentation

### Week 2: Gradual Rollout
1. New bookings use new system
2. Old bookings continue Direct Charges
3. Monitor transfer processing
4. Gather guide feedback

### Week 3: Full Migration
1. All bookings use Separate Charges
2. Update guide dashboard to show transfers
3. Communication to all guides
4. Monitor for issues

## Guide Communication

**Email to Tour Guides:**

```
Important Payment Processing Update

To better protect both you and your customers, we're implementing 
an improved payment system:

WHAT'S CHANGING:
• Payments now held securely until after cancellation window
• Automatic transfer to your account after refund period
• Guarantees you can always process refunds if needed

WHAT THIS MEANS FOR YOU:
• Flexible Policy (24h): Receive payment 25h before tour
• Moderate Policy (48h): Receive payment 49h before tour  
• Strict Policy (7d): Receive payment 8 days before tour
• Completed tours: Transfer within 1 hour of completion

WHY THIS HELPS YOU:
✓ No more "insufficient balance" refund failures
✓ Professional customer experience
✓ Reduces disputes and chargebacks
✓ Protects your Stripe account reputation

Your total earnings don't change - just the timing!
```

## Testing Checklist

- [ ] Create test booking with flexible policy
- [ ] Verify payment goes to platform account
- [ ] Verify transferScheduledFor is set correctly
- [ ] Wait for scheduled time (or adjust manually)
- [ ] Run cron job manually
- [ ] Verify transfer created on guide's account
- [ ] Verify booking updated with transfer_id
- [ ] Test refund on untransferred booking
- [ ] Test refund on transferred booking (needs reversal)

---

**Ready to implement?** I can help you with either:
1. Quick payout delay (simple, ships today)
2. Full transfer system (complete, ships in 1-2 weeks)


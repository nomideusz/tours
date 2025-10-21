# Quick Implementation Guide: Cancellation & Refund System

## What I've Built For You

### ✅ **1. Cancellation Policy Utilities** 
`src/lib/utils/cancellation-policies.ts`

**Features:**
- 5 predefined policies (Very Flexible → Non-Refundable)
- `calculateRefund()` - Smart refund calculation based on timing
- `getCancellationPolicyText()` - Human-readable policy for emails/UI
- `canCancelBooking()` - Validation before allowing cancellation
- `getActualRefundAmount()` - Handles Stripe fee considerations

**Example Usage:**
```typescript
import { calculateRefund, CANCELLATION_POLICIES } from '$lib/utils/cancellation-policies';

const refund = calculateRefund(
  100.00,                    // Booking amount
  booking.timeSlot.startTime, // Tour start time
  tour.cancellationPolicyId,  // Policy: 'flexible', 'strict', etc.
  'customer'                  // Who's cancelling: 'customer' or 'guide'
);

// Returns:
{
  isRefundable: true,
  refundPercentage: 100,
  refundAmount: 100.00,
  rule: 'Full refund if cancelled 24+ hours before tour',
  timeUntilTour: 47.5,  // hours
  canCancel: true
}
```

### ✅ **2. Stripe Refund Functions**
`src/lib/stripe.server.ts`

**New Functions:**

#### `createDirectRefund()`
```typescript
const refund = await createDirectRefund(
  paymentIntentId,      // pi_xxx from booking
  connectedAccountId,   // Tour guide's Stripe account
  refundAmount,         // In cents (optional for partial)
  'requested_by_customer',
  { bookingId, reason: 'customer_request' }
);
```

#### `checkRefundAvailability()`
```typescript
const check = await checkRefundAvailability(
  connectedAccountId,
  refundAmountInCents
);

if (!check.canRefund) {
  // Guide doesn't have enough balance!
  console.error(check.reason);
  // Alert guide, offer manual refund, etc.
}
```

### ✅ **3. Database Migration**
`database-migration-cancellation-refunds.sql`

**Adds to Tours:**
- `cancellation_policy_id` - Which policy this tour uses

**Adds to Bookings:**
- `refund_id` - Stripe refund ID
- `refund_amount` - Amount refunded
- `refund_status` - pending/succeeded/failed
- `refund_percentage` - % refunded
- `cancelled_by` - customer or guide
- `cancellation_reason` - why it was cancelled
- `refund_processed_at` - timestamp

## Next Steps to Complete Implementation

### Step 1: Run Database Migration

```bash
# Connect to your database
psql -d zaur_production -f database-migration-cancellation-refunds.sql
```

### Step 2: Update Drizzle Schema

Add to `src/lib/db/schema/drizzle.ts`:

```typescript
// In tours table
cancellationPolicyId: varchar('cancellation_policy_id', { length: 50 }).default('flexible'),

// In bookings table
refundId: varchar('refund_id', { length: 255 }),
refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }),
refundStatus: varchar('refund_status', { length: 50 }),
refundPercentage: integer('refund_percentage'),
cancelledBy: varchar('cancelled_by', { length: 20 }),
cancellationReason: varchar('cancellation_reason', { length: 100 }),
refundProcessedAt: timestamp('refund_processed_at', { withTimezone: true }),
refundNotes: text('refund_notes')
```

### Step 3: Create Cancellation API

`src/routes/api/bookings/[id]/cancel/+server.ts`:

```typescript
import { calculateRefund } from '$lib/utils/cancellation-policies';
import { createDirectRefund, formatAmountForStripe } from '$lib/stripe.server';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const { reason, customMessage } = await request.json();
  const bookingId = params.id;
  
  // 1. Fetch booking with tour and guide info
  const booking = await db.select()...;
  
  // 2. Calculate refund
  const refund = calculateRefund(
    parseFloat(booking.totalAmount),
    booking.timeSlot.startTime,
    tour.cancellationPolicyId,
    locals.user.id === tour.userId ? 'guide' : 'customer'
  );
  
  // 3. Check if refund is needed
  if (refund.refundAmount > 0 && booking.paymentStatus === 'paid') {
    // 4. Check guide's balance
    const balanceCheck = await checkRefundAvailability(
      guide.stripeAccountId,
      formatAmountForStripe(refund.refundAmount, currency)
    );
    
    if (!balanceCheck.canRefund) {
      return json({ 
        error: 'Insufficient balance for refund',
        details: balanceCheck.reason 
      }, { status: 400 });
    }
    
    // 5. Process refund via Stripe
    const stripeRefund = await createDirectRefund(
      booking.paymentId,
      guide.stripeAccountId,
      formatAmountForStripe(refund.refundAmount, currency),
      'requested_by_customer',
      { bookingId, reason }
    );
    
    // 6. Update booking
    await db.update(bookings).set({
      status: 'cancelled',
      refundId: stripeRefund.id,
      refundAmount: refund.refundAmount.toFixed(2),
      refundStatus: 'succeeded',
      refundPercentage: refund.refundPercentage,
      cancelledBy: refund.cancelledBy,
      cancellationReason: reason,
      refundProcessedAt: new Date()
    });
  }
  
  // 7. Send emails
  await sendCancellationEmail(booking, refund);
  
  return json({ success: true, refund });
};
```

### Step 4: Add to Tour Form

In `TourForm.svelte`, add policy selector:

```svelte
<div class="form-group">
  <label>Cancellation Policy</label>
  <select bind:value={formData.cancellationPolicyId}>
    <option value="veryFlexible">Very Flexible (2 hours)</option>
    <option value="flexible">Flexible (24 hours) - Recommended</option>
    <option value="moderate">Moderate (48 hours)</option>
    <option value="strict">Strict (7 days)</option>
    <option value="nonRefundable">Non-Refundable</option>
  </select>
  
  <p class="help-text">
    {getCancellationPolicyText(formData.cancellationPolicyId)}
  </p>
  
  <div class="policy-impact">
    ℹ️ More flexible policies typically result in higher booking rates
  </div>
</div>
```

### Step 5: Add Refund Preview to Booking Page

```svelte
{#if booking.status !== 'cancelled' && canCancel}
  {@const refundPreview = calculateRefund(
    parseFloat(booking.totalAmount),
    booking.timeSlot.startTime,
    tour.cancellationPolicyId,
    'customer'
  )}
  
  <div class="refund-preview">
    <h4>Cancellation Policy</h4>
    <p>{refundPreview.rule}</p>
    
    {#if refundPreview.isRefundable}
      <div class="refund-amount">
        You'll receive: {formatCurrency(refundPreview.refundAmount)}
        ({refundPreview.refundPercentage}% refund)
      </div>
    {:else}
      <div class="no-refund">
        No refund available at this time
      </div>
    {/if}
    
    <button onclick={handleCancelBooking}>
      Cancel Booking
    </button>
  </div>
{/if}
```

## Important Warnings for Tour Guides

### 🚨 **Critical Notices to Display:**

#### In Dashboard/Settings:
```
⚠️ PAYMENT & REFUND NOTICE

With Zaur's zero-commission model, payments go directly to YOUR Stripe account.

This means:
✓ You keep 100% of booking revenue
✗ Refunds come FROM your Stripe balance

IMPORTANT:
• Keep sufficient balance in Stripe for potential refunds
• Don't withdraw all funds immediately after receiving payment
• Maintain 10-20% buffer for cancellations
• Failed refunds can result in customer disputes

Your chosen policy: FLEXIBLE (24-hour full refund)
Estimated refund exposure: $250 (based on next 7 days of bookings)
```

#### When Changing Policy:
```
⚠️ POLICY CHANGE WARNING

Changing your cancellation policy only affects NEW bookings.

Existing bookings (3 bookings) will still use the old policy: FLEXIBLE

New bookings will use: STRICT
```

## Testing Checklist

Before going live:

- [ ] Test 100% refund (guide has balance)
- [ ] Test 50% partial refund
- [ ] Test insufficient balance error
- [ ] Test guide-initiated cancellation (always 100%)
- [ ] Test customer-initiated with different timings
- [ ] Test refund email sending
- [ ] Test refund status in booking details
- [ ] Verify Stripe dashboard shows refunds correctly
- [ ] Test with different currencies
- [ ] Test edge case: tour starts in 1 minute

## Customer Communication

### In Booking Confirmation Email:
```
CANCELLATION POLICY

This tour uses the FLEXIBLE cancellation policy:
• Full refund: Cancel 24+ hours before tour
• 50% refund: Cancel 12-24 hours before tour  
• No refund: Cancel less than 12 hours before tour

To cancel: Visit your booking page or email support@zaur.app

Note: If the tour guide cancels, you'll always receive a full refund.
```

### On Booking Page:
Show real-time refund calculator:
```
Cancel now (47 hours before tour): 100% refund ($97.00)
Cancel at 20 hours before: 50% refund ($48.50)
Cancel at 10 hours before: No refund
```

## Summary

This system provides:

✅ **Customer Protection** - Clear refund policies, automatic processing  
✅ **Guide Protection** - Prevents last-minute cancellations  
✅ **Platform Protection** - Reduces disputes, professional experience  
✅ **Flexibility** - 5 policies to match different tour types  
✅ **Fairness** - Guide cancellations always refund 100%  
✅ **Transparency** - Customers know exactly what to expect

The key is **education** - tour guides must understand they're responsible for refunds with Direct Charges!


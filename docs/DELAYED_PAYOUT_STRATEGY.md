# Delayed Payout Strategy for Refund Protection

## Problem Statement

With Stripe Connect Direct Charges:
- ✅ Payments go directly to tour guide's account
- ✅ Zero commission model works great
- ❌ Tour guides can withdraw immediately
- ❌ If withdrawn, no funds available for refunds
- ❌ Customer protection at risk

## Solution Options Comparison

### Option 1: Switch to Separate Charges & Transfers ⭐ **RECOMMENDED**

**How It Works:**
```
Payment → Platform Stripe Account (held)
    ↓ (after cancellation window passes)
Transfer → Guide's Stripe Account
```

**Pros:**
- ✅ **Complete control** over when guides get paid
- ✅ **Guarantees refund availability** - funds stay on platform
- ✅ **Per-booking control** - transfer each booking individually
- ✅ **Automatic protection** - no guide action needed
- ✅ **Stripe handles complexity** - built-in transfer system

**Cons:**
- ⚠️ **Platform becomes merchant of record** - more legal responsibility
- ⚠️ **Need platform Stripe account** in addition to Connect
- ⚠️ **Slightly different implementation** from current

**Implementation:**
```typescript
// Create payment on platform account
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // $100.00
  currency: 'usd',
  transfer_data: {
    destination: guideStripeAccountId,
  },
  metadata: { bookingId }
});

// Later, after cancellation window passes:
// Transfer happens automatically OR manually trigger:
const transfer = await stripe.transfers.create({
  amount: 10000,
  currency: 'usd',
  destination: guideStripeAccountId,
  metadata: { bookingId }
});
```

**Timeline Example (24h Flexible Policy):**
```
T+0:     Customer pays → Platform holds $100
T+24h:   Cancellation window closes → Transfer $100 to guide
T+48h+:  Guide can withdraw to bank account
```

---

### Option 2: Payout Schedule Control (Simpler)

**How It Works:**
```
Payment → Guide's account
BUT guide cannot withdraw until payout schedule allows
```

**Stripe Payout Schedules:**
```typescript
// Set guide's account to manual payouts
await stripe.accounts.update(guideAccountId, {
  settings: {
    payouts: {
      schedule: {
        delay_days: 7, // Hold for 7 days
        interval: 'manual' // Or 'daily', 'weekly', 'monthly'
      }
    }
  }
});
```

**Pros:**
- ✅ **Simple** - still using Direct Charges
- ✅ **One setting per guide** - not per booking
- ✅ **Stripe enforces** - guide can't override

**Cons:**
- ❌ **Not per-booking** - same delay for all
- ❌ **Less flexible** - can't release early for completed tours
- ❌ **Guide frustration** - delayed access to ALL funds
- ❌ **Fixed window** - doesn't match flexible policies (2h vs 24h vs 7d)

---

### Option 3: Hybrid - Separate Charges + Instant Transfers for Safe Bookings

**How It Works:**
```typescript
// All payments to platform first
const payment = await stripe.paymentIntents.create({
  amount: 10000,
  currency: 'usd',
  // No immediate transfer
});

// Then, intelligently transfer based on risk:
if (tourStartTime - now > cancellationWindow) {
  // Safe - tour far in future, transfer later
  scheduleTransfer(bookingId, tourStartTime - cancellationWindow);
} else if (tourStartTime < now && booking.status === 'completed') {
  // Tour completed - transfer immediately
  await createTransfer(guideId, amount);
}
```

**Pros:**
- ✅ **Best of both worlds** - safety + flexibility
- ✅ **Smart scheduling** - transfers at optimal time
- ✅ **Completed tours pay out fast** - good guide experience
- ✅ **Future tours protected** - refunds guaranteed

**Cons:**
- ⚠️ **Complex logic** - scheduling system needed
- ⚠️ **Platform merchant** - legal responsibility
- ⚠️ **More testing** required

---

## 🏆 **RECOMMENDED: Option 1 (Separate Charges & Transfers)**

### Why This Is Best:

1. **Customer Protection** (Primary Goal)
   - Refunds ALWAYS available
   - No "insufficient balance" errors
   - Professional experience

2. **Fair to Guides**
   - Get paid reliably after cancellation window
   - Clear timeline expectations
   - Automated process

3. **Platform Protection**
   - Reduces disputes
   - Better control
   - Compliance friendly

4. **Scalability**
   - Works for all policies (2h to 7d)
   - Per-booking granularity
   - Easy to adjust timing

### Implementation Plan

#### Phase 1: Update Payment Creation

**File: `src/routes/api/payments/+server.ts`**

```typescript
// OLD (Direct Charges):
const paymentIntent = await stripe.paymentIntents.create({
  amount: formatAmountForStripe(amount, currency),
  currency,
  metadata: { bookingId }
}, {
  stripeAccount: connectedAccountId // Goes directly to guide
});

// NEW (Separate Charges with Transfer):
const paymentIntent = await stripe.paymentIntents.create({
  amount: formatAmountForStripe(amount, currency),
  currency,
  transfer_data: {
    destination: connectedAccountId, // Where it will go eventually
  },
  metadata: { 
    bookingId,
    tourId,
    transferAfter: calculateTransferTime(tourStartTime, cancellationPolicy)
  }
  // No stripeAccount parameter - goes to platform
});
```

#### Phase 2: Automated Transfer System

**File: `src/lib/payment-transfers.ts`**

```typescript
/**
 * Calculate when to transfer funds to guide
 * Based on tour start time and cancellation policy
 */
export function calculateTransferTime(
  tourStartTime: Date,
  policyId: string = 'flexible'
): Date {
  const policy = CANCELLATION_POLICIES[policyId];
  
  // Get the longest refund window from policy
  const maxRefundHours = Math.max(...policy.rules.map(r => r.hoursBeforeTour));
  
  // Transfer funds AFTER the full refund window has passed
  // Add 1 hour buffer for safety
  const transferTime = new Date(tourStartTime);
  transferTime.setHours(transferTime.getHours() - maxRefundHours - 1);
  
  return transferTime;
}

/**
 * Create transfer to tour guide's account
 */
export async function transferToGuide(
  amount: number,
  currency: string,
  guideAccountId: string,
  metadata: Record<string, string>
): Promise<Stripe.Transfer> {
  const stripe = getStripe();
  
  const transfer = await stripe.transfers.create({
    amount: formatAmountForStripe(amount, currency),
    currency,
    destination: guideAccountId,
    metadata: {
      ...metadata,
      transferredAt: new Date().toISOString()
    }
  });
  
  console.log('✅ Transfer created:', transfer.id);
  return transfer;
}
```

#### Phase 3: Scheduled Transfer Job

**File: `src/routes/api/cron/process-transfers/+server.ts`**

```typescript
/**
 * Cron job to process pending transfers
 * Run every hour
 */
export const GET: RequestHandler = async () => {
  try {
    const now = new Date();
    
    // Find bookings ready for transfer
    const readyBookings = await db
      .select()
      .from(bookings)
      .where(and(
        eq(bookings.paymentStatus, 'paid'),
        eq(bookings.status, 'confirmed'),
        isNull(bookings.transferId), // Not yet transferred
        lte(bookings.transferScheduledFor, now) // Transfer time has passed
      ));
    
    console.log(`Found ${readyBookings.length} bookings ready for transfer`);
    
    for (const booking of readyBookings) {
      try {
        // Get tour and guide info
        const tour = await getTour(booking.tourId);
        const guide = await getGuide(tour.userId);
        
        // Create transfer
        const transfer = await transferToGuide(
          parseFloat(booking.totalAmount),
          guide.currency,
          guide.stripeAccountId,
          { bookingId: booking.id, tourId: tour.id }
        );
        
        // Update booking with transfer info
        await db.update(bookings).set({
          transferId: transfer.id,
          transferStatus: 'completed',
          transferProcessedAt: new Date()
        }).where(eq(bookings.id, booking.id));
        
        console.log(`✅ Transferred ${booking.totalAmount} for booking ${booking.id}`);
      } catch (error) {
        console.error(`❌ Transfer failed for ${booking.id}:`, error);
        // Mark as failed but don't stop processing others
        await db.update(bookings).set({
          transferStatus: 'failed',
          transferNotes: error.message
        }).where(eq(bookings.id, booking.id));
      }
    }
    
    return json({ 
      success: true, 
      processed: readyBookings.length 
    });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
};
```

#### Phase 4: Database Changes

```sql
-- Add transfer tracking to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS transfer_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS transfer_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS transfer_scheduled_for TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS transfer_processed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS transfer_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_transfer_scheduled 
  ON bookings(transfer_scheduled_for) 
  WHERE transfer_id IS NULL;
```

### Transfer Timeline Examples

#### Flexible Policy (24h full refund):
```
Monday 10:00 - Customer books tour for Saturday 14:00
Monday 10:00 - Payment held on platform ($100)
Friday 13:00  - Transfer window opens (24h + 1h buffer before tour)
Friday 13:00  - Cron job transfers $100 to guide
Saturday 14:00 - Tour happens
Sunday 14:00+ - Guide can withdraw to bank
```

#### Strict Policy (7 days full refund):
```
Monday - Customer books tour for next Monday
Payment held for 7+ days
Previous Friday - Transfer window opens
Guide receives payment BEFORE tour (but after refund risk)
```

### Real-Time Transfer Dashboard for Guides

Show guides their payment timeline:

```
💰 Upcoming Transfers

Booking BK-ABC123
Tour: City Walking Tour
Customer paid: $100.00
Transfer scheduled: Oct 23, 2025 at 13:00
Status: Pending ⏳

Booking BK-XYZ789  
Tour: Food Tour
Customer paid: $75.00
Transferred: Oct 21, 2025 at 14:30
Status: Complete ✅
Available to withdraw
```

---

## 🚀 **Quick Win: Minimum Implementation**

If you want to start simple:

### **Set Default Payout Delay**

When creating guide's Stripe Connect account:

```typescript
const account = await stripe.accounts.create({
  type: 'express',
  country: guideCountry,
  settings: {
    payouts: {
      schedule: {
        delay_days: 7, // Hold all payouts for 7 days
        interval: 'daily'
      }
    }
  }
});
```

**Effect:**
- All funds held for 7 days minimum
- Covers most cancellation policies
- Simple to implement
- Works with Direct Charges

**Downside:**
- Fixed 7 days for everyone (not policy-specific)
- Guide sees balance but can't withdraw

---

## 💡 **My Recommendation**

**Start with:** Payout delay (quick win)
**Migrate to:** Separate Charges + Transfers (full solution)

### Step 1: Immediate (1 day)
- Set all new Connect accounts to 7-day payout delay
- Add clear messaging to guides about delay
- Update existing accounts

### Step 2: Medium Term (1-2 weeks)
- Build transfer scheduling system
- Add transfer dashboard for guides
- Migrate to Separate Charges + Transfers

### Step 3: Polish (ongoing)
- Smart transfer scheduling based on policy
- Early transfer for completed tours
- Analytics on transfer timing

---

## 📋 **Implementation Checklist**

### Immediate Actions:
- [ ] Update Connect account creation to include payout delay
- [ ] Add transfer fields to database
- [ ] Document delay policy for tour guides
- [ ] Show pending payout timeline in dashboard

### Core Implementation:
- [ ] Switch from Direct Charges to Separate Charges
- [ ] Build transfer calculation logic
- [ ] Create cron job for automated transfers
- [ ] Add transfer status tracking
- [ ] Build guide payout dashboard

### Testing:
- [ ] Test transfer scheduling
- [ ] Verify refunds work from platform account
- [ ] Test early transfer for completed tours
- [ ] Test transfer failures and retries

Would you like me to implement:
1. **Quick solution** - Add 7-day payout delay to all accounts?
2. **Full solution** - Build complete transfer system?
3. **Both** - Start with #1, build #2 in parallel?


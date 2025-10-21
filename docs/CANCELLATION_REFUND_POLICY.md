# Cancellation & Refund Policy Implementation

## Overview

This document outlines Zaur's cancellation and refund policy system, designed specifically for **Stripe Connect Direct Charges** where payments go directly to tour guides' accounts.

## Critical Business Consideration

### 🔴 **Why This Matters**

With Direct Charges:
- ✅ **Payments**: Go directly to tour guide's Stripe account
- ❌ **Refunds**: Must come FROM tour guide's account
- ⚠️ **Risk**: Tour guide may not have sufficient balance for refunds

### The Challenge

```
Customer pays $100 → Goes to Guide's account immediately
Guide withdraws $100 to bank → Stripe balance = $0
Customer cancels next day → Needs $100 refund
❌ PROBLEM: Guide has $0 in Stripe, can't refund!
```

## Solution Strategy

### 1. **Time-Based Refund Policies**

We offer 5 predefined policies tour guides can choose from:

#### **Very Flexible** (Best for customer trust)
- ✅ 100% refund up to 2 hours before
- ❌ No refund within 2 hours

#### **Flexible** (Recommended - Industry Standard)
- ✅ 100% refund up to 24 hours before
- ⚠️ 50% refund 12-24 hours before
- ❌ No refund within 12 hours

#### **Moderate** (Balanced)
- ✅ 100% refund up to 48 hours before
- ⚠️ 50% refund 24-48 hours before
- ❌ No refund within 24 hours

#### **Strict** (Protects tour guide revenue)
- ✅ 100% refund up to 7 days before
- ⚠️ 50% refund 3-7 days before
- ⚠️ 25% refund 1-3 days before
- ❌ No refund within 24 hours

#### **Non-Refundable**
- ❌ No refunds under any circumstances
- ⚠️ Only recommended for special events

### 2. **Tour Guide Cancellation = 100% Refund**

**Critical Rule**: If the **tour guide** cancels (not the customer):
- ✅ **ALWAYS 100% refund** regardless of timing or policy
- This protects customers and incentivizes guides to honor bookings
- Prevents guides from canceling low-profit tours unfairly

### 3. **Stripe Fee Handling**

#### Full Refunds (100%)
- Customer gets: **Full amount back**
- Stripe refunds: **Their processing fee**
- Guide loses: **Everything (payment + time)**

#### Partial Refunds (50%, 25%, etc.)
- Customer gets: **Partial amount**
- Stripe keeps: **Their processing fee** (not refunded)
- Guide keeps: **Original - Refund - Stripe Fee**

**Example: $100 booking with $3 Stripe fee**
```
50% Cancellation:
- Customer gets back: $50
- Stripe keeps: $3 (their fee)
- Guide keeps: $100 - $50 - $3 = $47

100% Cancellation:
- Customer gets back: $100 (Stripe refunds their $3 fee too)
- Stripe keeps: $0
- Guide keeps: $0
```

## Technical Implementation

### Database Changes

```sql
-- Tours table
ALTER TABLE tours ADD COLUMN cancellation_policy_id VARCHAR(50) DEFAULT 'flexible';

-- Bookings table
ALTER TABLE bookings ADD COLUMN refund_id VARCHAR(255);
ALTER TABLE bookings ADD COLUMN refund_amount DECIMAL(10, 2);
ALTER TABLE bookings ADD COLUMN refund_status VARCHAR(50);
ALTER TABLE bookings ADD COLUMN refund_percentage INTEGER;
ALTER TABLE bookings ADD COLUMN cancelled_by VARCHAR(20); -- 'customer' or 'guide'
ALTER TABLE bookings ADD COLUMN cancellation_reason VARCHAR(100);
ALTER TABLE bookings ADD COLUMN refund_processed_at TIMESTAMP WITH TIME ZONE;
```

### API Endpoints Needed

#### 1. **POST /api/bookings/[id]/cancel**
```typescript
{
  cancelledBy: 'customer' | 'guide',
  reason: 'weather' | 'illness' | 'emergency' | 'low_enrollment' | 'other',
  customMessage?: string
}
```

Workflow:
1. Calculate refund using `calculateRefund()`
2. Check tour guide's Stripe balance
3. Create Stripe refund on connected account
4. Update booking status
5. Send cancellation email to customer
6. Send notification to tour guide

#### 2. **GET /api/bookings/[id]/refund-preview**
Shows customer what refund they'll get before cancelling

#### 3. **POST /api/tours/[id]/policy**
Update tour's cancellation policy

### UI Components Needed

#### 1. **Policy Selector** (Tour Edit Page)
```svelte
<CancellationPolicySelector
  bind:selectedPolicy={tour.cancellationPolicyId}
  currentBookings={stats.totalBookings}
/>
```

#### 2. **Refund Calculator** (Booking Detail Page)
```svelte
<RefundPreview
  booking={booking}
  timeSlot={timeSlot}
  policyId={tour.cancellationPolicyId}
/>
```

Shows real-time:
- Hours until tour
- Applicable refund percentage
- Exact refund amount
- Policy rule explanation

#### 3. **Cancellation Modal** (Customer & Guide)
```svelte
<CancellationModal
  booking={booking}
  refundCalculation={refund}
  onConfirm={handleCancel}
/>
```

## Best Practices for Tour Guides

### ✅ Recommendations:

1. **Choose "Flexible" Policy** (24h full refund)
   - Industry standard
   - Builds customer trust
   - Higher booking conversion

2. **Don't Withdraw Immediately**
   - Keep funds in Stripe for 48-72 hours
   - Ensures refunds can be processed
   - Prevents failed refund embarrassment

3. **Set Realistic Capacities**
   - Don't overbook hoping for cancellations
   - Honor all confirmed bookings

4. **Weather Contingencies**
   - Have backup dates for weather-dependent tours
   - Communicate clearly with customers

### ⚠️ Tour Guide Responsibilities:

1. **Maintain Stripe Balance**
   - Must have sufficient funds for potential refunds
   - Consider keeping 10-20% buffer

2. **Timely Responses**
   - Process refund requests within 24 hours
   - Communicate clearly about cancellations

3. **Fair Cancellations**
   - Don't cancel just because low enrollment
   - Honor minimum capacity commitments

## Refund Workflow

### Customer-Initiated Cancellation

```
1. Customer clicks "Cancel Booking"
2. System shows refund calculator:
   "Cancelling 48 hours before tour: 100% refund ($97.00)"
3. Customer confirms
4. System:
   a. Calculates refund via cancellation-policies.ts
   b. Checks tour guide's Stripe balance
   c. Creates Stripe refund via createDirectRefund()
   d. Updates booking: status='cancelled', refundAmount, etc.
   e. Sends cancellation email with refund details
   f. Sends notification to tour guide
5. Stripe processes refund (5-10 business days to customer's card)
```

### Guide-Initiated Cancellation

```
1. Guide clicks "Cancel Booking" or "Cancel Time Slot"
2. System warns: "This will trigger 100% refund to all customers"
3. Guide provides reason (weather, emergency, etc.)
4. System:
   a. Sets refundPercentage = 100 (automatic)
   b. Checks guide's Stripe balance
   c. Creates refund for FULL amount
   d. Updates booking
   e. Sends apology email to customer with full refund details
   f. Marks in system: cancelledBy='guide'
```

## Emergency Scenarios

### ⚠️ **Insufficient Balance**

If tour guide doesn't have funds:

```typescript
{
  error: "Unable to process refund",
  reason: "Insufficient balance in tour guide account",
  requiredAmount: "$100.00",
  availableBalance: "$25.00",
  action: "Contact support"
}
```

**Solution Options:**
1. Guide adds funds to Stripe account
2. Guide processes refund manually outside Stripe
3. Platform intervenes (rare cases)
4. Wait for future earnings to accumulate

### 🔴 **Dispute Protection**

Without proper refund handling:
- Customer files Stripe dispute
- Guide loses dispute + $15 dispute fee
- Damage to guide's Stripe account
- Platform reputation harm

**With proper handling:**
- Automatic refunds prevent disputes
- Clear policy reduces conflicts
- Professional customer experience

## Implementation Priority

### Phase 1: Core Functionality ✅
- [x] Cancellation policy utilities (`cancellation-policies.ts`)
- [x] Stripe refund functions (`stripe.server.ts`)
- [x] Database migration SQL

### Phase 2: API Endpoints (Next)
- [ ] POST /api/bookings/[id]/cancel
- [ ] GET /api/bookings/[id]/refund-preview
- [ ] POST /api/tours/[id]/cancellation-policy

### Phase 3: UI Components (After APIs)
- [ ] CancellationPolicySelector.svelte (tour edit)
- [ ] RefundPreview.svelte (booking details)
- [ ] CancellationConfirmModal.svelte (with refund preview)

### Phase 4: Testing & Edge Cases
- [ ] Test insufficient balance scenario
- [ ] Test partial refunds
- [ ] Test policy changes with existing bookings
- [ ] Test bulk cancellations (entire time slot)

## Recommendations

### For Platform (Zaur):

1. **Educate Tour Guides**
   - Explain Direct Charges refund responsibility
   - Provide best practice guidelines
   - Warn about balance requirements

2. **Set Reasonable Defaults**
   - Default to "Flexible" policy
   - Show policy in booking flow
   - Make it easy to change

3. **Monitor Refund Issues**
   - Track failed refunds
   - Alert guides with low balances
   - Provide support for disputes

4. **Consider Escrow Option** (Future)
   - Hold funds for 72 hours before allowing withdrawal
   - Ensures refund availability
   - More complex but safer

### For Tour Guides:

1. **Choose Policy Wisely**
   - More flexible = higher bookings
   - Too strict = fewer bookings
   - Consider your tour type

2. **Financial Management**
   - Don't withdraw all funds immediately
   - Keep 15-20% buffer for refunds
   - Monitor Stripe balance

3. **Communicate Clearly**
   - Set clear cancellation expectations
   - Honor your chosen policy
   - Process refunds promptly

## Legal Considerations

1. **Display Policy Prominently**
   - Show during booking process
   - Include in confirmation email
   - Make it easily accessible

2. **Honor Chosen Policy**
   - Can't change policy retroactively
   - Must refund per policy at booking time

3. **Consumer Protection Laws**
   - EU: Right of withdrawal (14 days for some services)
   - US: State-specific laws (e.g., California)
   - UK: Consumer Rights Act

4. **Document Everything**
   - Log all cancellations
   - Track refund attempts
   - Save communication

## Next Steps

1. ✅ Run migration: `database-migration-cancellation-refunds.sql`
2. Update Drizzle schema with new fields
3. Create cancellation API endpoint
4. Build UI components
5. Test thoroughly
6. Document for tour guides

---

**Important**: This system protects both customers AND tour guides when properly implemented and communicated.


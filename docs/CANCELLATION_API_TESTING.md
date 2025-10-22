# Cancellation & Refund API - Testing Guide

## ✅ **Implemented APIs**

### 1. **POST /api/bookings/[id]/cancel**
Cancels a booking and processes automatic refund based on cancellation policy.

**Request:**
```json
{
  "reason": "weather",
  "customMessage": "Storm approaching, tour unsafe"
}
```

**Response (Success):**
```json
{
  "success": true,
  "booking": {
    "id": "booking_id",
    "status": "cancelled",
    "cancelledBy": "customer",
    "refundStatus": "succeeded"
  },
  "refund": {
    "isRefundable": true,
    "percentage": 100,
    "amount": 97.00,
    "rule": "Full refund if cancelled 24+ hours before tour",
    "stripeRefundId": "re_xxx",
    "status": "succeeded",
    "processingTime": "5-10 business days"
  },
  "message": "Booking cancelled. 100% refund ($97.00) will be processed."
}
```

**Response (Insufficient Balance):**
```json
{
  "success": false,
  "error": "Insufficient balance in tour guide account for automatic refund",
  "details": {
    "bookingCancelled": true,
    "refundRequired": 97.00,
    "refundCurrency": "USD",
    "message": "Booking has been cancelled. Tour guide will process refund manually.",
    "contactGuide": true
  }
}
```

### 2. **GET /api/bookings/[id]/refund-preview**
Shows customer what refund they'll receive if they cancel now (real-time).

**Response:**
```json
{
  "canCancel": true,
  "booking": {
    "id": "booking_id",
    "reference": "BK-ABC123",
    "status": "confirmed",
    "paymentStatus": "paid",
    "amount": 97.00,
    "currency": "USD",
    "currencySymbol": "$"
  },
  "refund": {
    "isRefundable": true,
    "percentage": 100,
    "amount": 97.00,
    "formattedAmount": "$97.00",
    "rule": "Full refund if cancelled 24+ hours before tour",
    "timeUntilTour": {
      "hours": 47,
      "minutes": 32,
      "formatted": "1 day"
    }
  },
  "policy": {
    "id": "flexible",
    "cancelledBy": "customer"
  },
  "message": "You'll receive a 100% refund ($97.00) if you cancel now."
}
```

## 🧪 **Testing Scenarios**

### Test 1: Customer Cancels 48 Hours Before (Flexible Policy)
```bash
# Expected: 100% refund
curl -X POST http://localhost:5173/api/bookings/BOOKING_ID/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason":"change_of_plans"}'
```

**Expected Result:**
- ✅ Booking status = `cancelled`
- ✅ Refund = 100% of booking amount
- ✅ Stripe refund created
- ✅ Customer receives email with refund confirmation
- ✅ Time slot capacity restored

### Test 2: Customer Cancels 20 Hours Before (Flexible Policy)
```bash
# Expected: 50% refund (within 24h but more than 12h)
```

**Expected Result:**
- ✅ Booking status = `cancelled`
- ✅ Refund = 50% of booking amount
- ✅ Partial Stripe refund created
- ⚠️ Stripe keeps their processing fee

### Test 3: Customer Cancels 10 Hours Before (Flexible Policy)
```bash
# Expected: No refund (less than 12h)
```

**Expected Result:**
- ✅ Booking status = `cancelled`
- ❌ Refund = 0%
- ✅ No Stripe refund created
- ✅ Email sent explaining no refund per policy

### Test 4: Tour Guide Cancels (Any Time)
```bash
# Expected: ALWAYS 100% refund regardless of timing
```

**Expected Result:**
- ✅ Booking status = `cancelled`, `cancelledBy` = `guide`
- ✅ Refund = 100% (even if tour starts in 1 hour)
- ✅ Stripe refund created
- ✅ Customer receives apology email with full refund

### Test 5: Insufficient Guide Balance
**Setup:** Guide has withdrawn all funds

**Expected Result:**
```json
{
  "success": false,
  "error": "Insufficient balance in tour guide account for automatic refund",
  "details": {
    "bookingCancelled": true,
    "message": "Booking has been cancelled. Tour guide will process refund manually.",
    "contactGuide": true
  }
}
```

- ✅ Booking still cancelled
- ✅ Refund marked as `failed` in database
- ✅ Guide notified to process manually
- ✅ Customer notified to contact guide

### Test 6: Already Cancelled Booking
```bash
# Try to cancel twice
```

**Expected Result:**
```json
{
  "canCancel": false,
  "reason": "Booking is already cancelled"
}
```

### Test 7: Tour Already Started
```bash
# Try to cancel after tour start time
```

**Expected Result:**
```json
{
  "canCancel": false,
  "reason": "Tour has already started"
}
```

### Test 8: Refund Preview - Real-Time Updates
```bash
# Call preview endpoint multiple times as time passes
GET /api/bookings/BOOKING_ID/refund-preview
```

**Expected Behavior:**
- At 25 hours before: `100% refund ($97.00)`
- At 23 hours before: `50% refund ($48.50)` 
- At 10 hours before: `No refund (cancellation still allowed)`

## 📊 **Database Verification**

After cancellation, check booking record:

```sql
SELECT 
  id,
  status,
  payment_status,
  refund_id,
  refund_amount,
  refund_percentage,
  refund_status,
  cancelled_by,
  cancellation_reason,
  refund_processed_at
FROM bookings 
WHERE id = 'BOOKING_ID';
```

**Expected Values:**
```
status: 'cancelled'
refund_id: 're_abc123xyz' (Stripe refund ID)
refund_amount: '97.00'
refund_percentage: 100
refund_status: 'succeeded'
cancelled_by: 'customer'
cancellation_reason: 'change_of_plans'
refund_processed_at: 2025-10-21 10:30:00+00
```

## 🔍 **Stripe Dashboard Verification**

1. Go to tour guide's Stripe Dashboard
2. Navigate to Payments → Refunds
3. Find the refund (re_xxx)
4. Verify:
   - ✅ Amount matches
   - ✅ Status = Succeeded
   - ✅ Metadata shows booking reference
   - ✅ Customer sees it in their card statement

## ⚠️ **Edge Cases to Test**

### 1. Free Tours (no payment)
- Cancellation allowed
- No refund processing needed
- Status updated correctly

### 2. Partial Refund with Stripe Fees
```
Original: $100.00 booking
Stripe fee: $3.20
Guide received: $96.80

50% Cancellation:
- Refund to customer: $50.00
- Stripe keeps: $3.20 (not refunded on partial)
- Guide keeps: $100 - $50 - $3.20 = $46.80
```

### 3. Multiple Cancellations
- Customer cancels → Books again → Cancels again
- Each should process independently

### 4. Cross-Border Tours
- Ensure currency handling is correct
- Stripe fees vary by country

## 📧 **Email Verification**

After cancellation, customer should receive email with:

✅ Cancellation confirmation  
✅ Refund amount (if applicable)  
✅ Refund percentage  
✅ When to expect refund (5-10 business days)  
✅ Cancellation policy explanation  
✅ Tour guide contact info (for questions)

## 🚨 **Error Handling Tests**

### Invalid Booking ID
```bash
POST /api/bookings/invalid_id/cancel
# Expected: 404 "Booking not found"
```

### Missing Stripe Account
```bash
# Guide hasn't set up payments
# Expected: 400 "Cannot process refund: tour guide payment account not configured"
```

### Stripe API Failure
```bash
# Simulate Stripe downtime
# Expected: Booking cancelled, refund marked as failed, manual processing required
```

## 📈 **Success Metrics**

After implementation, monitor:

1. **Refund Success Rate**
   - Target: >95% automatic refunds succeed
   - Alert if <90%

2. **Guide Balance Issues**
   - Track how often insufficient balance blocks refunds
   - Send proactive warnings to guides

3. **Customer Satisfaction**
   - Track refund processing time
   - Monitor dispute rate (should decrease)

4. **Policy Distribution**
   - Which policies are most popular?
   - Correlation with booking conversion rates?

## 🔐 **Security Checklist**

- [ ] Only authenticated users can cancel
- [ ] Customers can only cancel their own bookings
- [ ] Guides can cancel any booking for their tours
- [ ] Refund amount calculated server-side (not from client)
- [ ] Stripe account validation before refund
- [ ] All actions logged with timestamps
- [ ] Sensitive data not exposed in errors

## 🎯 **Integration Checklist**

To fully integrate into the app:

- [x] API endpoints created
- [x] Database schema updated
- [x] Mutations exported
- [ ] Add "Cancel Booking" button to booking detail page
- [ ] Show refund preview before cancellation
- [ ] Add cancellation modal with refund info
- [ ] Display refund status in booking list
- [ ] Show pending refunds in guide dashboard
- [ ] Email templates for different refund scenarios

## 💡 **Quick Usage Example**

```typescript
// In booking detail page
import { cancelBookingMutation } from '$lib/queries/mutations';

const cancelMutation = cancelBookingMutation();

async function handleCancel() {
  try {
    const result = await $cancelMutation.mutateAsync({
      bookingId: booking.id,
      reason: 'illness',
      customMessage: 'Family emergency'
    });
    
    if (result.success) {
      alert(`Cancelled! ${result.refund.percentage}% refund processing.`);
    }
  } catch (error) {
    alert('Cancellation failed: ' + error.message);
  }
}
```

---

**Ready to test!** The API is fully implemented with proper error handling, Stripe integration, and database tracking. 🎉


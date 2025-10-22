# Stripe Webhook Events Reference

## Required Events for Separate Charges + Transfers

### Core Payment Events (REQUIRED):

#### `payment_intent.succeeded` ✅
- **When**: Customer payment completes successfully
- **Use**: Confirm booking, schedule transfer, send confirmation email
- **Critical**: Yes - bookings won't confirm without this

#### `payment_intent.payment_failed` ✅
- **When**: Payment fails (card declined, insufficient funds, etc.)
- **Use**: Mark booking as failed, notify customer
- **Critical**: Yes - prevents stuck "pending" bookings

#### `payment_intent.canceled` ✅
- **When**: Payment is cancelled before completion
- **Use**: Cancel booking, restore time slot capacity
- **Critical**: Yes - cleanup failed payment attempts

### Refund Events (RECOMMENDED):

#### `charge.refunded` ✅
- **When**: Refund is processed (full or partial)
- **Use**: Update booking refund status, notify guide
- **Critical**: No, but helpful for tracking

---

## Transfer Events (OPTIONAL - For Monitoring)

These are **NOT required** for the system to work, but helpful for monitoring:

#### `transfer.created` 
- **When**: Transfer is initiated from platform to guide
- **Use**: Log transfer activity, update dashboard
- **Critical**: No - cron job already tracks this

#### `transfer.updated`
- **When**: Transfer status changes
- **Use**: Track if transfer is processing/completed
- **Critical**: No - cron job marks as completed immediately

#### `transfer.reversed`
- **When**: Transfer is reversed (rare - usually for refunds after transfer)
- **Use**: Alert admin, update booking status
- **Critical**: No - but good to monitor

---

## What Happens With/Without Transfer Events

### WITH Transfer Events:
```
Customer pays → payment_intent.succeeded webhook
    ↓ 
Booking confirmed, transfer scheduled
    ↓ (24 hours later)
Cron creates transfer → transfer.created webhook (optional)
    ↓
You get notification in logs/dashboard
```

### WITHOUT Transfer Events (Still Works!):
```
Customer pays → payment_intent.succeeded webhook
    ↓
Booking confirmed, transfer scheduled
    ↓ (24 hours later)
Cron creates transfer → (no webhook, but system still works)
    ↓
Database updated by cron job directly
```

---

## Recommended Webhook Setup

### Minimum (Required):
```
Events on your account:
  ✅ payment_intent.succeeded
  ✅ payment_intent.payment_failed
  ✅ payment_intent.canceled
  ✅ charge.refunded
```

### Recommended (With Monitoring):
```
Events on your account:
  ✅ payment_intent.succeeded
  ✅ payment_intent.payment_failed
  ✅ payment_intent.canceled
  ✅ charge.refunded
  ✅ transfer.created
  ✅ transfer.updated
  ✅ transfer.reversed
```

---

## Other Important Events (Not Currently Used)

These might be useful in future:

- `account.updated` - When Connected account changes
- `account.external_account.created` - When guide adds bank account
- `payout.failed` - When guide's payout to bank fails
- `dispute.created` - Customer files dispute (important!)
- `customer.subscription.updated` - For platform subscriptions

---

## How to Check Current Webhook Setup

1. Go to: https://dashboard.stripe.com/webhooks
2. Click your webhook endpoint
3. Scroll to "Events to send"
4. Verify you see "Events on **your account**" (not Connected accounts)
5. Add the events listed above

---

## Testing Webhooks Locally

Use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5173/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded
stripe trigger transfer.created
stripe trigger charge.refunded
```

This lets you test without real payments!

---

## Summary

**You only NEED:**
- ✅ `payment_intent.*` events (3 events)
- ✅ `charge.refunded`

**Transfer events are OPTIONAL** - the cron job handles transfer processing independently. They're just nice for logging/monitoring.


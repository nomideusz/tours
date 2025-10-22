# Critical: transfer_data vs Manual Transfers

## 🚨 **Important Discovery**

There are TWO ways to transfer funds in Stripe. They work VERY differently!

---

## ❌ **Method 1: transfer_data (WRONG for us)**

```typescript
const payment = await stripe.paymentIntents.create({
  amount: 10000,
  currency: 'usd',
  transfer_data: {
    destination: 'acct_guide123'
  }
});
```

### What Happens:
```
Customer pays → Platform account receives payment
    ↓ (IMMEDIATELY - within seconds)
Stripe auto-creates transfer → Guide account receives funds
    ↓
Guide can withdraw immediately
```

### Timeline:
- **T+0 seconds**: Payment succeeds
- **T+5 seconds**: Stripe automatically creates transfer
- **T+10 seconds**: Guide has funds
- ❌ **NO HOLDING PERIOD** - defeats our purpose!

### Webhook You Showed:
```json
"transfer": "tr_3SKuq0GWvjqJuxs92yYRhV2y",  ← Created automatically!
"transfer_data": {
  "destination": "acct_1ReSnN2fzxkbZfrE"
}
```

This proves the transfer happened immediately.

---

## ✅ **Method 2: Manual Transfers (CORRECT)**

```typescript
// Step 1: Create payment WITHOUT transfer_data
const payment = await stripe.paymentIntents.create({
  amount: 10000,
  currency: 'usd',
  metadata: {
    guideAccountId: 'acct_guide123' // Store for later
  }
  // NO transfer_data parameter!
});

// Step 2: Later (via cron), create transfer manually
const transfer = await stripe.transfers.create({
  amount: 10000,
  currency: 'usd',
  destination: 'acct_guide123'
});
```

### What Happens:
```
Customer pays → Platform account receives payment
    ↓ (HELD - funds stay on platform)
    ⏰ Wait 24 hours (or whatever policy requires)
    ↓ (Cron job runs)
Manual transfer created → Guide account receives funds
    ↓
Guide can withdraw
```

### Timeline:
- **T+0**: Payment succeeds, funds on platform
- **T+1h to T+7d**: Funds HELD on platform (refunds available!)
- **T+transfer time**: Cron creates manual transfer
- **T+transfer time + 1h**: Guide has funds

---

## 🔧 **What I Fixed**

### Before (Wrong):
```typescript
paymentIntent.create({
  transfer_data: { destination: guide }  // ❌ Transfers immediately
});
```

### After (Correct):
```typescript
paymentIntent.create({
  metadata: { guideAccountId: guide }  // ✅ Store for later
  // No transfer_data!
});

// Later, in cron job:
transfers.create({
  destination: guide,  // ✅ Transfer when safe
  amount: amount
});
```

---

## 📊 **How to Verify It's Working**

### After Next Payment:

**1. Check Stripe Dashboard → Payments:**
```
Payment: $10.00
Status: Succeeded
Transfer: None  ← Should be NONE (not immediate)
```

**2. Check Stripe Dashboard → Transfers:**
```
(Should be empty until cron runs)
```

**3. Check Your Database:**
```sql
SELECT 
  booking_reference,
  total_amount,
  payment_status,
  transfer_id,           -- Should be NULL
  transfer_status,       -- Should be 'pending'
  transfer_scheduled_for -- Should have future date
FROM bookings 
WHERE id = 'xxx';
```

Expected:
```
transfer_id: NULL
transfer_status: 'pending'
transfer_scheduled_for: 2025-10-23 13:00:00
```

**4. After Cron Runs:**
```
transfer_id: 'tr_abc123'
transfer_status: 'completed'
transfer_processed_at: 2025-10-23 13:05:00
```

---

## ⚠️ **Key Differences**

| Feature | transfer_data | Manual Transfers |
|---------|---------------|------------------|
| **When transfer happens** | Immediately | When YOU trigger it |
| **Control** | None | Full control |
| **Holding period** | None | As long as you want |
| **Refund safety** | ❌ No guarantee | ✅ Guaranteed |
| **Good for** | Instant payouts | Delayed payouts |
| **Our use case** | ❌ Wrong | ✅ Correct |

---

## 🎯 **Bottom Line**

Your webhook showing `"transfer": "tr_xxx"` was proof that our first implementation was wrong. 

**Now fixed!** Payments will:
1. ✅ Go to platform account
2. ✅ Stay there (NO immediate transfer)
3. ✅ Wait for cron job to create transfer
4. ✅ Transfer only after cancellation window passes

Test again and you should see:
- Payment succeeds
- **NO** `transfer` field in webhook (or should be `null`)
- Funds stay on platform
- Transfer created later by cron

This is exactly what we want for guaranteed refunds! 🎯


# Running Stripe Setup for Production

## Important: Test vs Production

You ran the script on localhost using **test mode** keys (they start with `sk_test_...`).

For production, you need to run it again with **live mode** keys (start with `sk_live_...`).

---

## Option 1: Run Locally with Production Keys (Recommended)

### Step 1: Update .env with Production Key

```bash
# In your local .env file, temporarily add/update:
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE
```

⚠️ **Security Note**: Make sure `.env` is in your `.gitignore`!

### Step 2: Run the Script

```bash
node scripts/setup-stripe-beta2-prices.js
```

### Step 3: Copy Production Price IDs

The script will output production price IDs. Copy them to your **production environment variables**.

### Step 4: Revert Local .env (Important!)

```bash
# Change back to test key for local development:
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
```

---

## Option 2: Run on Production Server

If you have SSH access to your production server:

```bash
# SSH into production server
ssh user@your-server.com

# Navigate to your app directory
cd /path/to/your/app

# Run the script (will use production .env)
node scripts/setup-stripe-beta2-prices.js

# Copy the output price IDs to your production .env
```

---

## Option 3: Use Environment Variable Override

Run the script with an inline environment variable:

```bash
# On Linux/Mac
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY node scripts/setup-stripe-beta2-prices.js

# On Windows (PowerShell)
$env:STRIPE_SECRET_KEY="sk_live_YOUR_LIVE_KEY"; node scripts/setup-stripe-beta2-prices.js

# On Windows (CMD)
set STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY && node scripts/setup-stripe-beta2-prices.js
```

This way you don't need to modify your `.env` file.

---

## Option 4: Manual Setup in Production Stripe

If you prefer not to run scripts with production keys locally:

1. Log into [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Make sure you're in LIVE mode** (toggle in top left should say "Viewing live data")
3. Follow the manual setup guide: `STRIPE_MANUAL_SETUP_GUIDE.md`
4. Create all 12 prices manually through the UI

---

## Verifying Test vs Live Mode

### Test Mode Indicators:
- ✅ Price IDs start with `price_1SMP...` (what you have now)
- ✅ Dashboard shows "Test mode" banner
- ✅ Secret key starts with `sk_test_...`

### Production Mode Indicators:
- 🔴 Price IDs will be different (new IDs generated)
- 🔴 Dashboard shows "Viewing live data"
- 🔴 Secret key starts with `sk_live_...`

---

## Important Notes

### 1. You'll Get Different Price IDs
When you run the script in production, you'll get **completely different price IDs**. The test ones won't work in production.

```bash
# Test (what you have now):
STRIPE_ESSENTIAL_BETA1_MONTHLY_PRICE_ID=price_1SMPAa2fZ6HCOYQL5RtCLjNm

# Production (will be different):
STRIPE_ESSENTIAL_BETA1_MONTHLY_PRICE_ID=price_1XYZ...different...
```

### 2. Keep Test and Production Separate
Consider having separate `.env` files:
- `.env.local` - for local development (test keys)
- `.env.production` - for production server (live keys)

### 3. Products Will Be Created in Live Stripe
When you run with live keys, the products and prices will be visible to real customers. Double-check amounts before running!

### 4. No Need to Re-run Migration
The database migration and user cohort migration are the same for test and production.

---

## Recommended Workflow

### For Local Development:
```bash
# Use test keys in .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_ESSENTIAL_BETA1_MONTHLY_PRICE_ID=price_test_...
# ... (test price IDs)
```

### For Production Deployment:
```bash
# Use live keys in production environment
STRIPE_SECRET_KEY=sk_live_...
STRIPE_ESSENTIAL_BETA1_MONTHLY_PRICE_ID=price_live_...
# ... (production price IDs)
```

---

## Where to Find Your Live Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Toggle to **"Viewing live data"** (top left, switch from Test mode)
3. Go to **Developers** → **API keys**
4. Copy your **Secret key** (starts with `sk_live_...`)

⚠️ **Never commit live keys to git!**

---

## After Running for Production

1. ✅ You'll get 12 new price IDs (different from test)
2. ✅ Copy them to production environment variables
3. ✅ Deploy your app with the new price IDs
4. ✅ Test a real subscription (can cancel immediately to avoid charges)

---

## Testing Before Going Live

Before running in production:

1. **Verify amounts** in the script are correct:
   - Essential Beta 1 Monthly: €11.20 ✓
   - Premium Beta 2 Yearly: €390.00 ✓
   - etc.

2. **Backup plan**: If you create wrong prices, you can archive them in Stripe Dashboard

3. **Test mode first**: Make sure everything works perfectly with test keys before going live

---

## Security Best Practices

### ✅ DO:
- Keep live keys in environment variables only
- Use `.gitignore` for `.env` files
- Restrict live key access to necessary team members
- Use separate keys for test and production

### ❌ DON'T:
- Commit live keys to git
- Share live keys in Slack/email
- Use live keys in local development
- Store live keys in code files

---

## Quick Command Reference

```bash
# Check which mode you're in
echo $STRIPE_SECRET_KEY | grep -o "sk_test\|sk_live"

# Run script with production key (Linux/Mac)
STRIPE_SECRET_KEY=sk_live_xxx node scripts/setup-stripe-beta2-prices.js

# Run script with production key (Windows PowerShell)
$env:STRIPE_SECRET_KEY="sk_live_xxx"; node scripts/setup-stripe-beta2-prices.js
```

---

## Summary

**Current Status**: ✅ Test mode products/prices created (localhost)

**Next Step**: Run the same script with production keys to create live products/prices

**Result**: You'll get 12 new price IDs for production that are different from your test IDs

**Time Required**: 30 seconds to run, 5 minutes to update production env vars


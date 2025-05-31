# Deployment Fix Guide

## Fixed Issues

### 1. Stripe Initialization Error During Build
**Problem**: Build was failing with "Neither apiKey nor config.authenticator provided"
**Cause**: Stripe was being initialized at module load time, before environment variables were available
**Fix**: 
- Separated client and server Stripe code
- Created `stripe.server.ts` for server-only functionality
- Updated `stripe.ts` to only export client-safe public key
- Used lazy-loading for Stripe instance

### 2. Anonymous Booking Issues
**Problem**: Anonymous users couldn't book tours due to API permission errors
**Fix**: 
- Updated booking flow to pass time slot data via form instead of fetching by ID
- Added hidden form fields for `availableSpots` and `bookedSpots`
- Wrapped time slot updates in try-catch for graceful error handling

### 3. Missing Favicon
**Problem**: 404 errors for `/favicon.ico`
**Fix**: Created `favicon.ico` by copying `favicon.png`

## Environment Variables Required

Make sure these are set in CapRover:

```
# Stripe (Required)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# PocketBase (Optional, defaults to https://z.xeon.pl)
PUBLIC_POCKETBASE_URL=https://z.xeon.pl

# Email (If using)
RESEND_API_KEY=re_...
```

## Deployment Steps

1. **Build locally first to verify**:
   ```bash
   pnpm run build
   ```

2. **Deploy to CapRover**:
   ```bash
   caprover deploy
   ```
   - Select your app name when prompted
   - Confirm the deployment

3. **Verify environment variables** in CapRover dashboard

4. **Update PocketBase API rules** as per `docs/FIX_PUBLIC_ACCESS.md`:
   - **bookings** collection: Set `viewRule` to empty
   - **time_slots** collection: Set `listRule` and `viewRule` to empty

## What Changed

### Code Changes:
1. **src/lib/stripe.ts** - Now only exports public key (client-safe)
2. **src/lib/stripe.server.ts** - New file with server-only Stripe functionality
3. **src/routes/api/payments/+server.ts** - Updated imports
4. **src/routes/api/webhooks/stripe/+server.ts** - Updated imports
5. **src/routes/book/[code]/+page.svelte** - Added hidden form fields
6. **src/routes/book/[code]/+page.server.ts** - Updated booking logic
7. **static/favicon.ico** - Created to fix 404 errors

### Database Changes:
- Updated PocketBase API rules in schema file

## Verification

After deployment:
1. Visit a QR code page as anonymous user
2. Complete a test booking
3. Check Stripe dashboard for payment intents
4. Verify webhook events are being received

## Troubleshooting

If build still fails:
- Check all environment variables are set in CapRover
- Verify no other modules are importing from wrong Stripe module
- Check CapRover logs for specific errors

If anonymous booking fails:
- Ensure PocketBase API rules are updated (especially bookings viewRule)
- Check browser console for specific API errors
- Verify time slots are properly configured 
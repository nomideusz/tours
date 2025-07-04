# Remove Promo Startup Script

After your app successfully deploys and promo codes are set up, remove the temporary script:

## Step 1: Revert package.json

Change this:
```json
"setup-promo": "node scripts/apply-promo-codes.js",
"start": "npm run setup-promo && HOST=0.0.0.0 PORT=${PORT:-3000} BODY_SIZE_LIMIT=10485760 node build",
```

Back to this:
```json
"start": "HOST=0.0.0.0 PORT=${PORT:-3000} BODY_SIZE_LIMIT=10485760 node build",
```

## Step 2: Deploy Again

Deploy the cleaned up version so the promo setup doesn't run on every restart.

## Why Remove It?

- Prevents running the setup script on every app restart
- Avoids unnecessary database operations
- Keeps startup time fast
- Prevents potential "already exists" warnings

## Verification

After removing and redeploying, test that promo codes still work:
- Visit /auth/register
- Try entering "FOUNDER" or "PREMIUM50"
- Should still validate and show benefits 
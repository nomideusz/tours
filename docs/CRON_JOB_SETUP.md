# Cron Job Setup Guide - Process Transfers

## 🎯 Your Endpoint

**URL**: `https://zaur.app/api/cron/process-transfers`  
**Method**: `GET`  
**Auth**: `Authorization: Bearer YOUR_CRON_SECRET`  
**Schedule**: Every hour (`0 * * * *`)

---

## ⭐ **RECOMMENDED: cron-job.org** (Free & Reliable)

### Why This Is Best:
- ✅ **Free forever** for basic usage
- ✅ **Reliable** - they handle uptime
- ✅ **No code changes** needed
- ✅ **Easy setup** - 5 minutes
- ✅ **Email alerts** if job fails
- ✅ **Execution history** - see all runs

### Setup Steps:

1. **Go to**: https://cron-job.org/en/signup.php
2. **Sign up** (free account)
3. **Create New Cron Job**:
   - **Title**: `Zaur - Process Transfers`
   - **URL**: `https://zaur.app/api/cron/process-transfers`
   - **Schedule**: 
     - Type: Every hour
     - Or custom: `0 * * * *`
   - **Request Method**: `GET`
   - **Headers** → Add Custom Header:
     - Name: `Authorization`
     - Value: `Bearer YOUR_CRON_SECRET` (replace with your actual secret)

4. **Advanced Settings**:
   - **Timeout**: 120 seconds
   - **Retries**: 2
   - **Notification**: Enable email on failure

5. **Save & Enable**

6. **Test**: Click "Execute now" to test immediately

### Monitor:
- Check "Execution history" tab
- Should see successful runs every hour
- Response should be: `{"success":true,"processed":X,...}`

---

## Option 2: EasyCron (Alternative)

Similar to cron-job.org:

1. Go to: https://www.easycron.com
2. Sign up (free tier: 1 job)
3. Create cron job:
   - URL: `https://zaur.app/api/cron/process-transfers`
   - Cron Expression: `0 * * * *`
   - HTTP Headers: `Authorization: Bearer YOUR_CRON_SECRET`

---

## Option 3: GitHub Actions (If using GitHub)

If your code is on GitHub, use Actions:

**Create**: `.github/workflows/transfer-cron.yml`

```yaml
name: Process Transfers

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Allows manual trigger from GitHub UI

jobs:
  process-transfers:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    
    steps:
      - name: Call transfer endpoint
        run: |
          response=$(curl -s -w "\n%{http_code}" \
            -X GET "https://zaur.app/api/cron/process-transfers" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}")
          
          http_code=$(echo "$response" | tail -n1)
          body=$(echo "$response" | sed '$d')
          
          echo "HTTP Status: $http_code"
          echo "Response: $body"
          
          # Fail if not 200
          if [ $http_code -ne 200 ]; then
            echo "❌ Transfer processing failed"
            exit 1
          fi
          
          echo "✅ Transfers processed successfully"

      - name: Notify on failure
        if: failure()
        run: echo "::error::Transfer cron job failed"
```

**Setup:**
1. Add `CRON_SECRET` to GitHub repository secrets:
   - Go to repo → Settings → Secrets and variables → Actions
   - New repository secret
   - Name: `CRON_SECRET`
   - Value: Your secret string

2. Push the workflow file
3. Monitor: Actions tab in GitHub

---

## Option 4: Your Own Server Cron (If You Have One)

If you have a server with cron access:

**Edit crontab:**
```bash
crontab -e
```

**Add line:**
```bash
0 * * * * curl -X GET "https://zaur.app/api/cron/process-transfers" -H "Authorization: Bearer YOUR_CRON_SECRET" >> /var/log/zaur-transfers.log 2>&1
```

---

## Option 5: CapRover App Cron (If Using CapRover)

CapRover doesn't have built-in cron, but you can:

### Method A: Add Node.js cron inside your app

**Install**:
```bash
pnpm add node-cron
```

**Create**: `src/lib/cron/transfer-scheduler.ts`

```typescript
import cron from 'node-cron';

export function startTransferCron() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🔄 Running transfer cron job...');
      
      const response = await fetch('http://localhost:5173/api/cron/process-transfers', {
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        }
      });
      
      const result = await response.json();
      console.log('✅ Transfer cron result:', result);
    } catch (error) {
      console.error('❌ Transfer cron failed:', error);
    }
  });
  
  console.log('✅ Transfer cron scheduler started');
}
```

**In `src/hooks.server.ts`:**
```typescript
import { startTransferCron } from '$lib/cron/transfer-scheduler';

// Start cron when server starts
if (process.env.NODE_ENV === 'production') {
  startTransferCron();
}
```

### Method B: Use external cron service (cron-job.org) ← **Easier**

---

## 🧪 **Testing Your Cron Setup**

### Manual Test:

```bash
# Replace with your actual secret
curl -X GET "https://zaur.app/api/cron/process-transfers" \
  -H "Authorization: Bearer your-secret-here" \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "timestamp": "2025-10-21T10:30:00.000Z",
  "totalPending": 3,
  "succeeded": 3,
  "failed": 0,
  "results": [...]
}
```

### Test Wrong Secret:

```bash
curl -X GET "https://zaur.app/api/cron/process-transfers" \
  -H "Authorization: Bearer wrong-secret"
```

**Expected Response:**
```json
{
  "error": "Unauthorized"
}
```
(Status: 401)

---

## 📊 **Monitoring Your Cron**

### Check If It's Running:

**Query database:**
```sql
-- Should see recent transfers (within last hour if any pending)
SELECT 
  booking_reference,
  transfer_scheduled_for,
  transfer_processed_at,
  transfer_status,
  (NOW() - transfer_processed_at) as age
FROM bookings
WHERE transfer_id IS NOT NULL
ORDER BY transfer_processed_at DESC
LIMIT 10;
```

**If transfers are OLD** (processed >1 hour ago) and there are PENDING transfers, cron might not be running.

### Alert Conditions:

Set up alerts for:
1. **No transfers in 24 hours** (if you have bookings)
2. **Failed transfers** (transfer_status = 'failed')
3. **Cron endpoint returning errors**

---

## 🎯 **My Recommendation**

**Use cron-job.org because:**

1. ✅ **5-minute setup** (vs hours for GitHub Actions or internal cron)
2. ✅ **Free forever** (up to 25 jobs)
3. ✅ **Reliable** (99.9% uptime)
4. ✅ **Notifications** (email if job fails)
5. ✅ **No code changes** needed
6. ✅ **Execution logs** (see history)
7. ✅ **Can disable easily** if needed

**Setup Time**: ~5 minutes  
**Maintenance**: Zero

---

## 🔐 **Security Note**

Your `CRON_SECRET` should be:
- 32+ characters
- Random string
- Never committed to git

**Generate one:**
```bash
# On Mac/Linux:
openssl rand -base64 32

# Or use online generator:
# https://www.random.org/passwords/
```

**Add to environment:**
```bash
# .env (local)
CRON_SECRET=your-generated-secret-here

# Production (CapRover/hosting):
# Add as environment variable in hosting dashboard
```

---

## ✅ **Quick Start (5 Minutes)**

1. **Generate secret**:
   ```bash
   openssl rand -base64 32
   ```

2. **Add to production env** (CapRover dashboard → App Config → Environment Variables)

3. **Sign up at cron-job.org**

4. **Create job**:
   - URL: `https://zaur.app/api/cron/process-transfers`
   - Schedule: Every hour
   - Header: `Authorization: Bearer YOUR_SECRET`

5. **Click "Execute now"** to test

6. **Done!** Check execution history shows success

That's it! Transfers will now process automatically every hour. 🎉


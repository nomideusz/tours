# Troubleshoot 403 Forbidden Error - Map Tiles API

## 🔍 **Diagnosing the Issue**

You're getting:
```
GET https://tile.googleapis.com/v1/3dtiles/root.json 403 (Forbidden)
PERMISSION_DENIED
```

Even though Map Tiles API shows as "enabled" in Google Cloud Console.

---

## ✅ **Checklist - Follow in Order**

### **1. Verify Billing is Enabled**

**Why:** Google Maps Platform requires active billing (even for free tier usage)

**How to Check:**
1. Go to: [Google Cloud Console - Billing](https://console.cloud.google.com/billing)
2. Check if your project has a billing account linked
3. Status should show: "Billing account: [Account Name]"

**If Not Enabled:**
- Click "Link a billing account"
- Create/select billing account
- Add payment method (won't be charged within free tier)

---

### **2. Check API Key Restrictions**

**Why:** API key might be restricted to specific domains/IPs

**How to Check:**
1. Go to: [API Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your API key (the one in your `.env` file)
3. Scroll to "**API restrictions**"
4. Scroll to "**Application restrictions**"

**Recommended Settings for Development:**

**Application Restrictions:**
- **HTTP referrers (web sites)**
- Add these referrers:
  ```
  http://localhost:5173/*
  http://localhost:*
  http://127.0.0.1:*
  ```

**API Restrictions:**
- **Don't restrict key** (for now)
- OR **Restrict to these APIs:**
  - Maps JavaScript API
  - Places API
  - Map Tiles API
  - Geocoding API

**Save changes** and wait 1-2 minutes!

---

### **3. Verify Map Tiles API is Actually Enabled**

**Double-check:**
1. Go to: [APIs & Services → Enabled APIs](https://console.cloud.google.com/apis/dashboard)
2. Search for "Map Tiles API" in the enabled list
3. Click on it → Should show "API enabled"

**If Not Listed:**
1. Go to: [API Library](https://console.cloud.google.com/apis/library)
2. Search: "Map Tiles API"
3. Click "Enable" again
4. Wait 2-3 minutes for propagation

---

### **4. Wait for Propagation**

**Important:** After enabling an API or changing key restrictions:
- **Wait 1-2 minutes** minimum
- **Clear browser cache** (Ctrl+Shift+R)
- **Try in incognito mode** (rules out extension issues)

---

### **5. Test API Key Directly**

**Open in new browser tab:**
```
https://tile.googleapis.com/v1/3dtiles/root.json?key=YOUR_API_KEY_HERE
```

**Expected Results:**

✅ **If Working:**
```json
{
  "asset": {
    "version": "1.0"
  },
  "geometricError": 10000,
  "root": { ... }
}
```

❌ **If Not Working:**
```json
{
  "error": {
    "code": 403,
    "message": "..."
  }
}
```

---

## 🔧 **Common Solutions**

### **Solution 1: Remove API Restrictions (Temporarily)**

For testing, try removing all API restrictions:
1. Edit API key
2. API restrictions → "Don't restrict key"
3. Save
4. Wait 2 minutes
5. Test again

### **Solution 2: Create New API Key**

Sometimes easier than fixing restrictions:
1. Go to: Credentials → Create Credentials → API Key
2. Copy the new key
3. Add to your `.env`:
   ```
   PUBLIC_GOOGLE_MAPS_API_KEY=your_new_key_here
   ```
4. Restart dev server
5. Test

### **Solution 3: Check Project Quota**

1. Go to: [IAM & Admin → Quotas](https://console.cloud.google.com/iam-admin/quotas)
2. Search: "Map Tiles API"
3. Check if quota is 0 or disabled
4. If so, request quota increase

---

## 🆘 **Still Not Working?**

### **Enable Detailed Error Logging:**

Add to your component to see full error:

```typescript
} catch (error: any) {
  console.error('Full error object:', error);
  console.error('Error response:', error?.response);
  console.error('Error status:', error?.statusCode);
}
```

### **Check These:**

- [ ] **Billing enabled** on project?
- [ ] **API key from same project** as enabled API?
- [ ] **Waited 2-3 minutes** after enabling?
- [ ] **Cleared browser cache**?
- [ ] **Tested API key** in browser URL directly?
- [ ] **API key restrictions** allow localhost?
- [ ] **Incognito mode** (rules out extensions)?

---

## 📞 **Google Cloud Support**

If all else fails:
1. Go to: [Google Cloud Support](https://console.cloud.google.com/support)
2. Create case: "Map Tiles API 403 error despite being enabled"
3. Include: API key ID, project ID, error message

---

## 🎯 **Quick Test Script**

Run this in browser console on your marketing page:

```javascript
fetch('https://tile.googleapis.com/v1/3dtiles/root.json?key=YOUR_API_KEY')
  .then(r => r.json())
  .then(data => console.log('✅ API Working:', data))
  .catch(err => console.error('❌ API Error:', err));
```

Replace `YOUR_API_KEY` with your actual key.

---

**Most likely cause:** API key restrictions blocking localhost. Try removing restrictions temporarily to test! 🔍


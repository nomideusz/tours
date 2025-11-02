# Enable Map Tiles API - Quick Guide

## 🚨 **403 Forbidden Error Fix**

You're seeing this error:
```
GET https://tile.googleapis.com/v1/3dtiles/root.json 403 (Forbidden)
PERMISSION_DENIED
```

**This means:** Map Tiles API is not enabled in your Google Cloud project.

---

## ✅ **How to Enable Map Tiles API**

### **Step 1: Go to Google Cloud Console**
Visit: [https://console.cloud.google.com/](https://console.cloud.google.com/)

### **Step 2: Select Your Project**
Choose the project that has your API key

### **Step 3: Enable Map Tiles API**

**Option A - Direct Link:**
1. Click: [Enable Map Tiles API](https://console.cloud.google.com/apis/library/tile.googleapis.com)
2. Click "**Enable**" button
3. Wait ~30 seconds for activation

**Option B - Manual:**
1. Go to: **APIs & Services** → **Library**
2. Search for: **"Map Tiles API"**
3. Click on **"Map Tiles API"**
4. Click **"Enable"** button

### **Step 4: Verify**
1. Go to: **APIs & Services** → **Dashboard**
2. Confirm **"Map Tiles API"** appears in enabled APIs list

---

## 🔑 **API Key Permissions**

Your API key needs these APIs enabled:

| API | Required For | Status |
|-----|--------------|--------|
| Maps JavaScript API | Street View | ✅ Enabled |
| Places API (New) | Location search | ✅ Enabled |
| Map Tiles API | 3D Photorealistic Tiles | ❌ **Enable This!** |

---

## 💰 **Pricing Info**

**Map Tiles API - Photorealistic 3D Tiles:**

| Usage | Cost |
|-------|------|
| First 1,000 root tile requests/month | **FREE** |
| Additional requests | $15 per 1,000 |

**Your Marketing Page Usage:**
- ~1-2 root tile requests per visitor
- Free tier covers ~500-1,000 visitors/month
- Perfect for marketing purposes!

---

## 🧪 **After Enabling**

1. **Wait 30-60 seconds** for API to activate
2. **Refresh your marketing page**
3. **Scroll to 3D section**
4. **Should see:** Stunning photorealistic 3D map!

---

## 🆘 **Troubleshooting**

### **Still seeing 403?**
- Wait 1-2 minutes after enabling
- Check API is enabled in correct project
- Verify API key is from same project
- Hard refresh browser (Ctrl+Shift+R)

### **Different error?**
- Check browser console for details
- Verify billing is enabled (required for Maps APIs)
- Check API key restrictions aren't blocking localhost

---

## 📋 **Quick Checklist**

- [ ] Go to Google Cloud Console
- [ ] Select correct project
- [ ] Enable "Map Tiles API"
- [ ] Wait 30-60 seconds
- [ ] Refresh page
- [ ] See amazing 3D tiles! 🎉

---

## 🔗 **Useful Links**

- [Map Tiles API Documentation](https://developers.google.com/maps/documentation/tile)
- [Enable Map Tiles API](https://console.cloud.google.com/apis/library/tile.googleapis.com)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Pricing Calculator](https://cloud.google.com/products/calculator)


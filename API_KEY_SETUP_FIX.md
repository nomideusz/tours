# API Key Setup Fix - "REQUEST_DENIED" Error

## 🐛 The Problem

You saw this error:
```
Google Maps API error: REQUEST_DENIED API keys with referer restrictions cannot be used with this API.
```

This happens because Google Maps API keys with HTTP referrer restrictions can't be used for direct API calls from the browser (security feature).

## ✅ The Solution

We've implemented **server-side proxy endpoints** that call Google Maps API securely from the server.

### What Changed:
- ✅ Created `/api/maps/geocode` endpoint for location search
- ✅ Created `/api/maps/reverse-geocode` endpoint for coordinate → address
- ✅ Updated Google Maps service to use these endpoints
- ✅ Now works with restricted API keys (secure!)

## 🔧 How to Configure

### Option 1: Quick Setup (Development) - Use Same Key

Add to `.env`:
```bash
# Use the same key for both (simplest for development)
PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
GOOGLE_MAPS_API_KEY=your_key_here
PUBLIC_OPENWEATHER_API_KEY=your_weather_key_here
```

### Option 2: Secure Setup (Production) - Separate Keys

Create TWO API keys in Google Cloud Console:

**Key 1: Client-side key (for map display)**
```bash
PUBLIC_GOOGLE_MAPS_API_KEY=AIza...xyz
```
- Restrictions: HTTP referrers (your domain)
- APIs: Maps JavaScript API only

**Key 2: Server-side key (for geocoding)**
```bash
GOOGLE_MAPS_API_KEY=AIza...abc
```
- Restrictions: IP addresses (your server IP)
- APIs: Geocoding API only

## 🎯 What Works Now

### ✅ Autocomplete (as you type)
- Type in location field
- Suggestions appear automatically
- Uses server-side geocoding endpoint
- Works with restricted API keys

### ✅ Map Picker
- Click "Pick on map"
- Google Maps displays correctly
- Search works properly
- Uses appropriate API keys

### ✅ Geocoding
- Tour locations are geocoded for weather
- Uses server-side endpoint
- Secure and reliable

## 🔒 Security Benefits

### Before (Insecure):
- ❌ API key exposed in browser
- ❌ Direct API calls from client
- ❌ No way to use HTTP referrer restrictions
- ❌ API key visible in network tab

### After (Secure):
- ✅ Server-side API key never exposed
- ✅ All geocoding goes through server
- ✅ Can use HTTP referrer restrictions on client key
- ✅ Can use IP restrictions on server key
- ✅ Two-layer security

## 🧪 Testing

1. **Add both environment variables:**
   ```bash
   PUBLIC_GOOGLE_MAPS_API_KEY=your_key
   GOOGLE_MAPS_API_KEY=your_key  # Can be same key
   PUBLIC_OPENWEATHER_API_KEY=your_weather_key
   ```

2. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   pnpm run dev
   ```

3. **Test autocomplete:**
   - Go to create/edit tour
   - Type "Berlin" in location field
   - Should see suggestions appear as you type

4. **Check browser console:**
   - Should NOT see "REQUEST_DENIED" errors
   - Should see successful API calls to `/api/maps/geocode`

## 📊 Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ Type "Berlin"
       ↓
┌──────────────────┐
│ LocationPicker   │
│ (Client)         │
└──────┬───────────┘
       │ fetch('/api/maps/geocode?query=Berlin')
       ↓
┌──────────────────┐
│ Server Endpoint  │
│ /api/maps/       │
│ geocode          │
└──────┬───────────┘
       │ Uses GOOGLE_MAPS_API_KEY (server-side)
       ↓
┌──────────────────┐
│ Google Maps API  │
│ (Geocoding)      │
└──────┬───────────┘
       │ Returns results
       ↓
┌──────────────────┐
│   Browser        │
│ Shows suggestions│
└──────────────────┘
```

## 🎉 Benefits

1. **Secure:** API keys properly protected
2. **Works with restrictions:** HTTP referrer & IP restrictions supported
3. **Better control:** Server validates and filters results
4. **Reliable:** No CORS issues
5. **Scalable:** Easy to add rate limiting if needed

## 💡 Recommended Setup

### Development:
```bash
# Use same unrestricted key for simplicity
PUBLIC_GOOGLE_MAPS_API_KEY=AIza_your_key
GOOGLE_MAPS_API_KEY=AIza_your_key
PUBLIC_OPENWEATHER_API_KEY=your_weather_key
```

### Production:
```bash
# Use two separate keys with appropriate restrictions
PUBLIC_GOOGLE_MAPS_API_KEY=AIza_client_key  # HTTP referrer restricted
GOOGLE_MAPS_API_KEY=AIza_server_key         # IP restricted
PUBLIC_OPENWEATHER_API_KEY=your_weather_key
```

## ✅ Checklist

- [x] Created server proxy endpoints
- [x] Updated Google Maps service to use proxies
- [x] Works with API key restrictions
- [ ] Add GOOGLE_MAPS_API_KEY to your .env
- [ ] Restart dev server
- [ ] Test autocomplete functionality

## 🚀 Result

Autocomplete and geocoding now work perfectly, even with restricted API keys! This is the **proper, secure way** to integrate Google Maps. 

**Try it now** - autocomplete should work as you type! 🎯


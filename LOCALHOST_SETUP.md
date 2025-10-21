# Localhost Development Setup

## 🏠 Making Google Maps Work on Localhost

### Option 1: Unrestricted API Key (Quickest for Development)

1. **Go to Google Cloud Console**
   - Navigate to [API Credentials](https://console.cloud.google.com/apis/credentials)
   
2. **Create or Edit API Key**
   - Click on your API key
   - Under "Application restrictions"
   - Select **"None"**
   - Click "Save"

3. **⚠️ Warning:** Unrestricted keys are only safe for development!
   - Delete this key after testing
   - Create restricted keys for production

### Option 2: Add Localhost to Referrer Restrictions (Recommended)

1. **Go to Google Cloud Console**
   - Navigate to [API Credentials](https://console.cloud.google.com/apis/credentials)
   
2. **Edit Your API Key**
   - Click on your API key
   
3. **Set Application Restrictions**
   - Select **"HTTP referrers (web sites)"**
   
4. **Add these referrers:**
   ```
   localhost/*
   localhost:5173/*
   localhost:3000/*
   127.0.0.1/*
   127.0.0.1:5173/*
   127.0.0.1:3000/*
   http://localhost/*
   http://localhost:5173/*
   ```

5. **Click "Save"**

## 🔑 Environment Variables for Localhost

Your `.env` file should have:

```bash
# Google Maps - For map display
PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your_key_here

# Google Maps - For geocoding (can be same key)
GOOGLE_MAPS_API_KEY=AIza...your_key_here

# Weather
PUBLIC_OPENWEATHER_API_KEY=your_weather_key_here
```

**💡 Pro Tip:** During development, use the **same API key** for both Google Maps variables!

## 🔄 After Configuring

1. **Restart your dev server:**
   ```bash
   # Press Ctrl+C to stop
   pnpm run dev
   ```

2. **Hard refresh browser:**
   ```bash
   Ctrl+Shift+R  (Windows/Linux)
   Cmd+Shift+R   (Mac)
   ```

3. **Test autocomplete:**
   - Go to create/edit tour
   - Type in location field
   - Suggestions should appear!

## 🐛 Still Not Working?

### Check API Key Status

1. **In Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for errors

2. **Check if key is set:**
   ```javascript
   // Type in browser console:
   import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY
   ```
   Should show your key (if server restarted properly)

3. **Check API calls:**
   - Network tab in DevTools
   - Look for `/api/maps/geocode` calls
   - Should return 200 OK status

### Common Issues:

**"API key not configured" in server logs:**
- ✅ Add `GOOGLE_MAPS_API_KEY` to .env
- ✅ Restart dev server
- ✅ Use same key as PUBLIC_ version

**Still seeing REQUEST_DENIED:**
- ✅ Remove all restrictions during development
- ✅ OR add localhost/* to referrer list
- ✅ Wait a few minutes after changing restrictions

**Map loads but no autocomplete:**
- ✅ Check geocoding endpoint works: `http://localhost:5173/api/maps/geocode?query=Berlin`
- ✅ Should return JSON with results

## 📝 Quick Reference

### Development Setup (.env):
```bash
# Simplest setup - use same key everywhere
PUBLIC_GOOGLE_MAPS_API_KEY=AIza_your_key
GOOGLE_MAPS_API_KEY=AIza_your_key
PUBLIC_OPENWEATHER_API_KEY=weather_key
```

### API Key Restrictions for Development:
- **Option A:** No restrictions (delete key after testing)
- **Option B:** HTTP referrers: `localhost/*`

### API Key Restrictions for Production:
- **PUBLIC_GOOGLE_MAPS_API_KEY:** HTTP referrers to your domain
- **GOOGLE_MAPS_API_KEY:** IP restrictions to your server
- **PUBLIC_OPENWEATHER_API_KEY:** No restrictions needed

## ✅ Verification Checklist

- [ ] Added both `PUBLIC_GOOGLE_MAPS_API_KEY` and `GOOGLE_MAPS_API_KEY` to .env
- [ ] Added `PUBLIC_OPENWEATHER_API_KEY` to .env
- [ ] Restarted dev server
- [ ] Hard refreshed browser
- [ ] Verified API key has localhost in referrer list OR no restrictions
- [ ] Checked browser console for errors
- [ ] Tested typing in location field
- [ ] Suggestions appear as you type

## 🎯 Expected Behavior

When everything works:

1. **Type "Berlin"** → See "Berlin, Germany" and other Berlin locations
2. **Type "Paris"** → See "Paris, France" and nearby places  
3. **Type "New York"** → See "New York, NY, USA" etc.
4. **Click suggestion** → Location fills in automatically
5. **Weather widget** → Shows current conditions

## 🆘 Still Stuck?

Try this **debug checklist**:

1. **Verify .env file location:**
   - Should be in project root: `c:\cmder\apps\tours\.env`
   - Not in src/ folder

2. **Check .env syntax:**
   ```bash
   # Correct:
   GOOGLE_MAPS_API_KEY=AIzaSyAbc123...
   
   # Wrong:
   GOOGLE_MAPS_API_KEY = "AIzaSyAbc123..."  # No spaces or quotes
   ```

3. **Test server endpoint directly:**
   - Open: `http://localhost:5173/api/maps/geocode?query=test`
   - Should return JSON (not 503 error)

4. **Check all enabled APIs:**
   - Maps JavaScript API ✅
   - Geocoding API ✅
   - (Places API not needed for basic geocoding)

## 🎉 Success!

Once configured, you'll have:
- ✅ Real-time autocomplete as you type
- ✅ Accurate Google Maps geocoding
- ✅ Weather data for tour locations
- ✅ Secure API key handling
- ✅ Production-ready architecture

**Happy coding! 🚀**


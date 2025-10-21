# Google Weather API Integration

## 🎉 Now Using Google Weather API!

Your Zaur platform now uses **Google Weather API** (pilot program) as the primary weather provider, with **OpenWeatherMap** as a reliable fallback!

## 🆕 What's New

### **Google Weather API** (Primary)
- ✅ **FREE during pilot program**
- ✅ **10-day forecast** (vs 5-day OpenWeather)
- ✅ **240-hour hourly forecast**
- ✅ **Historical data** (24 hours)
- ✅ Same platform as your maps
- ✅ More comprehensive data
- 📚 [Google Weather API Documentation](https://developers.google.com/maps/documentation/weather)

### **OpenWeatherMap** (Fallback)
- ✅ Proven and stable
- ✅ 5-day forecast
- ✅ Industry standard
- ✅ Automatic fallback if Google fails

## 🔧 How It Works

### **Intelligent Fallback System:**

```
1. Try Google Weather API first
   ├─ SUCCESS → Use Google data (10-day forecast)
   └─ FAIL → Try OpenWeatherMap fallback
       ├─ SUCCESS → Use OpenWeather data (5-day forecast)
       └─ FAIL → Show error message
```

### **Console Logs:**
You'll see which provider is being used:
- `✅ Using Google Weather for current conditions`
- `✅ Using Google Weather for forecast (10 days)`
- `📡 Using OpenWeatherMap fallback for current conditions`

## 📝 Setup

### **Option 1: Google Weather Only** (Recommended)

```bash
# .env file
PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

**Benefits:**
- Single API key for maps + weather
- 10-day forecast
- FREE during pilot
- Simpler setup

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Weather API** in your project
3. Use your existing Google Maps API key
4. Done!

### **Option 2: Google Weather + OpenWeather Fallback** (Most Reliable)

```bash
# .env file
PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
```

**Benefits:**
- ✅ Best of both worlds
- ✅ Automatic fallback if Google has issues
- ✅ Maximum reliability
- ✅ 10-day forecast (Google) or 5-day (fallback)

**Steps:**
1. Get Google Maps API key (enable Weather API)
2. Get OpenWeatherMap API key (free account)
3. Add both to `.env`
4. System automatically uses best available

### **Option 3: OpenWeather Only** (Fallback Mode)

```bash
# .env file
PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
```

**Benefits:**
- Proven and stable
- FREE (1,000 calls/day)
- Works if Google pilot ends

## 🚀 Enable Google Weather API

### Step 1: Go to Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (same one with Google Maps)

### Step 2: Enable Weather API
1. Go to **APIs & Services** → **Library**
2. Search for **"Weather API"**
3. Click **Enable**
4. Wait a few seconds for activation

### Step 3: Register for Pilot (If Required)
If you see a message about pilot access:
1. Follow the registration link
2. Fill out the form
3. You should get access within minutes/hours

### Step 4: Use Your Existing API Key
The same API key you use for Google Maps will work for Weather API!

```bash
# Same key works for both!
PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...your_key
```

### Step 5: Test It
1. Restart your dev server
2. Go to a tour details page
3. Check browser console for: `✅ Using Google Weather for current conditions`

## 📊 Features Comparison

| Feature | Google Weather | OpenWeatherMap |
|---------|---------------|----------------|
| **Current Conditions** | ✅ Yes | ✅ Yes |
| **Forecast Length** | ✅ **10 days** | 5 days |
| **Hourly Forecast** | ✅ **240 hours** | 40 hours |
| **Historical Data** | ✅ 24 hours | ❌ Paid only |
| **Free Tier** | ✅ **Pilot (FREE)** | 1,000 calls/day |
| **Stability** | ⚠️ Experimental | ✅ Proven |
| **Integration** | ✅ Same as Maps | Separate platform |

## 💰 Pricing

### **Google Weather API:**
- **Currently:** FREE (pilot program)
- **Future:** TBD (pricing not announced yet)
- **Expected:** Similar to other Google Maps APIs (~$0.50-$2 per 1,000 requests)

### **OpenWeatherMap:**
- **Free Tier:** 1,000 calls/day (30,000/month)
- **Paid:** $40/month for 100,000 calls/day

### **Recommended Setup:**
- Use both: Google (primary) + OpenWeather (backup)
- Cost: **$0** during Google pilot
- After pilot: Still likely cheaper than alternatives
- Maximum reliability with dual providers

## 🔍 What You'll See

### **With Both API Keys:**
```
Console: ✅ Using Google Weather for current conditions
Widget: Shows 10-day forecast from Google
Fallback: Available if Google fails
```

### **With Only Google:**
```
Console: ✅ Using Google Weather for current conditions
Widget: Shows 10-day forecast
No fallback
```

### **With Only OpenWeather:**
```
Console: 📡 Using OpenWeatherMap fallback
Widget: Shows 5-day forecast
Reliable but limited
```

## 🎯 Benefits for Your Tours

### **10-Day Forecast:**
- Plan tours further in advance
- Better long-term scheduling
- More informed business decisions

### **Hourly Precision:**
- 240-hour hourly forecast
- Perfect for timing tours
- Avoid bad weather windows

### **Historical Data:**
- Review actual conditions during tours
- Correlate weather with customer satisfaction
- Data-driven insights

## 📖 Technical Details

### **Data Mapping:**
Google Weather uses different data structures, so we map them to our standard format:
- Weather codes → OpenWeather-style condition IDs
- Temperature units normalized
- Wind speed converted
- Same emoji system across both providers

### **Seamless Integration:**
The `UnifiedWeatherService` class handles everything:
- Tries Google first
- Falls back to OpenWeather automatically
- You don't need to change any component code
- Works transparently

## 🐛 Troubleshooting

### **"Using OpenWeatherMap fallback" when you have Google key:**
- Check Weather API is enabled in Google Cloud Console
- Verify API key has Weather API permissions
- Check console for specific Google errors
- May need to register for pilot program

### **Only seeing 5-day forecast:**
- Google Weather failed, using OpenWeather fallback
- Check Google Cloud Console for API errors
- Verify billing is enabled
- Check API quotas

### **No weather at all:**
- Check at least one API key is set
- Verify environment variables are correct
- Restart dev server after changing .env
- Check browser console for errors

## ✅ Quick Checklist

- [ ] Enable Weather API in Google Cloud Console
- [ ] Add `PUBLIC_GOOGLE_MAPS_API_KEY` to .env (can use existing Maps key)
- [ ] Optional: Add `PUBLIC_OPENWEATHER_API_KEY` for fallback
- [ ] Restart dev server
- [ ] Check tour details page - weather should appear
- [ ] Check console - should see "Using Google Weather"
- [ ] Verify 10-day forecast is available

## 🎉 Result

You now have:
- ✅ **Best weather data** from Google's pilot program
- ✅ **Reliable fallback** with OpenWeatherMap
- ✅ **10-day forecasts** for better planning
- ✅ **Zero cost** during pilot phase
- ✅ **Automatic failover** for maximum uptime

**The future is bright (and well-forecasted)!** ☀️🌤️

## 📚 Resources

- [Google Weather API Docs](https://developers.google.com/maps/documentation/weather)
- [Google Maps Innovators Newsletter](https://developers.google.com/maps/innovators/newsletters/02-2025) - Pilot announcement
- [OpenWeatherMap Docs](https://openweathermap.org/api) - Fallback provider



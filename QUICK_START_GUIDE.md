# Quick Start Guide - Google Maps & Weather Integration

## 🎉 What's New

Your Zaur tour platform now has:
- ✅ **Google Maps** for precise location selection
- ✅ **Weather Integration** with real-time conditions and forecasts
- ✅ **Weather Advisories** for tour guides
- ✅ **Professional map interface** for customers

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create API key
5. Restrict it to your domain
6. **Free:** $200/month credit (more than enough for most tour businesses)

### Step 2: Enable Google Weather API (Recommended)

**Good news!** Google now has a Weather API in pilot program (FREE)!

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (same as Google Maps)
3. Navigate to **APIs & Services** → **Library**
4. Search for **"Weather API"**
5. Click **Enable**
6. Your existing Google Maps API key will work!

**Benefits:**
- ✅ FREE during pilot
- ✅ 10-day forecast (vs 5-day others)
- ✅ Same key as Google Maps
- ✅ More comprehensive data

### Step 2b: Get OpenWeatherMap Key (Optional Backup)

For maximum reliability, also get OpenWeatherMap:

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up (free account)
3. Copy your API key from dashboard
4. Wait ~10 minutes for activation
5. **Free:** 1,000 calls/day

**This is optional but recommended** - your system will automatically fall back to OpenWeather if Google Weather has any issues.

### Step 3: Configure Environment Variables

Add to your `.env` file:

```bash
# ============================================
# GOOGLE MAPS & WEATHER (Recommended Setup)
# ============================================

# For maps display & Google Weather (PUBLIC = visible to browser)
PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here

# For geocoding/search (server-side, more secure)  
GOOGLE_MAPS_API_KEY=your_google_maps_key_here

# ============================================
# WEATHER FALLBACK (Optional but Recommended)
# ============================================

# OpenWeatherMap as backup (optional but recommended)
PUBLIC_OPENWEATHER_API_KEY=your_openweather_key_here
```

**What This Does:**
- ✅ **Google Maps** for location selection
- ✅ **Google Weather** for weather data (10-day forecast, FREE)
- ✅ **OpenWeatherMap** as fallback if Google fails
- ✅ Maximum reliability with dual providers

**Quick Setup (Development):**
Use the same Google Maps key for both PUBLIC_GOOGLE_MAPS_API_KEY and GOOGLE_MAPS_API_KEY.

**Secure Setup (Production):**
- PUBLIC_GOOGLE_MAPS_API_KEY: HTTP referrer restrictions
- GOOGLE_MAPS_API_KEY: IP restrictions

### Step 4: Deploy

Deploy your application with the new environment variables.

**CapRover:**
- Go to App Configs → Environment Variables
- Add both variables
- Restart app

**Other Platforms:**
- Add variables in your platform's environment settings
- Redeploy

## ✨ What Works Now

### For Tour Guides

**1. Location Selection (Enhanced)**
- Click "Pick on map" when creating/editing tours
- Search for locations with Google autocomplete
- Click map to select exact coordinates
- Use GPS for current location

**2. Weather Dashboard (NEW: Google Weather API!)**
- Automatic weather display on tour detail pages
- Real-time conditions at tour location
- **10-day forecast** from Google Weather (vs 5-day before)
- Weather suitability warnings
- Detailed metrics (temperature, humidity, wind, etc.)
- **Automatic fallback** to OpenWeatherMap if needed

**3. Better Planning**
- See weather conditions up to 10 days ahead
- Plan tours with confidence
- Get warnings about unfavorable weather
- Make data-driven scheduling decisions

### For Customers (When You Add It)

Weather can be easily added to public booking pages:
```svelte
<WeatherWidget 
    coordinates={tourCoordinates}
    locationName={tour.location}
    apiKey={PUBLIC_GOOGLE_MAPS_API_KEY}
    compact={true}
/>
```

## 📍 Where to See It

### Google Maps
- **Tour Creation:** `/tours/new` - Click "Pick on map"
- **Tour Editing:** `/tours/[id]/edit` - Click "Pick on map"
- **Location Field:** Anywhere tour location is edited

### Weather
- **Tour Details:** `/tours/[id]` - Weather widget in right sidebar
- **Next:** Add to booking pages for customers

## 🐛 Troubleshooting

**Maps not loading?**
- Check API key is set: `PUBLIC_GOOGLE_MAPS_API_KEY`
- Verify Maps JavaScript API is enabled
- Check browser console for errors
- Ensure billing is enabled on Google Cloud

**Weather not showing?**
- Check API key is set: `OPENWEATHER_API_KEY`
- Wait 10 minutes after creating OpenWeather account
- Tour must have a location set
- Location must be geocodable (valid address)

**Gray map tiles?**
- Enable billing on Google Cloud project
- Check API key restrictions
- Verify domain is allowed in restrictions

## 📖 Full Documentation

For detailed information, see:
- **`GOOGLE_MAPS_WEATHER_SETUP.md`** - Complete setup guide
- **`IMPLEMENTATION_SUMMARY.md`** - Technical details
- **`ENV_VARIABLES_EXAMPLE.md`** - All environment variables

## 💰 Cost

### Small Business (10 tours, 100 bookings/month)
- Google Maps: **FREE** (within $200 credit)
- Weather: **FREE** (within free tier)
- **Total: $0/month** ✅

### Medium Business (50 tours, 500 bookings/month)
- Google Maps: **FREE** (within $200 credit)  
- Weather: **FREE** (within free tier)
- **Total: $0/month** ✅

Even large businesses typically stay within free tiers!

## ✅ Checklist

- [ ] Got Google Maps API key
- [ ] Got OpenWeatherMap API key
- [ ] Added to `.env` file
- [ ] Deployed with new environment variables
- [ ] Tested location picker on tour creation
- [ ] Verified weather shows on tour detail page
- [ ] Checked browser console for errors

## 🎯 Optional Next Steps

1. **Add Weather to Booking Pages**
   - Show customers weather for their tour date
   - Set proper expectations
   - Reduce surprises

2. **Store Coordinates with Tours**
   - Avoid repeated geocoding
   - Faster weather loading
   - Add `locationCoordinates` field to tour schema

3. **Email Weather Summaries**
   - Include in booking confirmations
   - Send reminders with weather forecast

4. **Weather-Based Recommendations**
   - Suggest what customers should bring
   - Automatic "umbrella needed" messages

## 🎉 Success!

Your tour platform now has professional maps and weather integration!

**Need Help?**
- Check documentation files
- Review browser console
- Verify API keys are active
- Check API dashboards for errors

**Enjoy your upgraded platform! 🚀**


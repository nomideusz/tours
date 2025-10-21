# Google Maps & Weather Integration Setup Guide

This guide will help you set up Google Maps and Weather features for the Zaur tour platform.

## Overview

The platform now includes:
- **Google Maps** for location selection and display
- **Weather Integration** using OpenWeatherMap API for real-time weather data and forecasts
- Weather advisories for tour guides and customers
- Interactive map picker for precise location selection

## Required API Keys

### 1. Google Maps API Key

#### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for the project

#### Step 2: Enable Required APIs
Enable the following APIs for your project:
- **Maps JavaScript API** (for interactive maps)
- **Places API** (for location search)
- **Geocoding API** (for address lookups)

#### Step 3: Create API Key
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > API Key**
3. Copy your API key
4. **IMPORTANT**: Restrict your API key:
   - **Application restrictions**: Set HTTP referrers to your domain(s)
   - **API restrictions**: Only enable the 3 APIs listed above

#### Pricing
- Google Maps offers $200 free credit per month
- Typical costs:
  - Maps JavaScript API: $7/1,000 loads
  - Places API: $17/1,000 requests
  - Geocoding API: $5/1,000 requests
- For a small tour business, the free tier is usually sufficient

### 2. OpenWeatherMap API Key

#### Step 1: Create Account
1. Go to [OpenWeatherMap](https://openweathermap.org/)
2. Sign up for a free account

#### Step 2: Get API Key
1. Go to [API Keys page](https://home.openweathermap.org/api_keys)
2. Your default API key will be shown
3. Copy the API key (it takes ~10 minutes to activate)

#### Pricing
- **Free Plan**: Up to 1,000 API calls per day (sufficient for most tour businesses)
- **Startup Plan**: $40/month for 100,000 calls per day
- Includes:
  - Current weather data
  - 5-day/3-hour forecast
  - Weather alerts

## Environment Variable Setup

### Development (.env)

Create or update your `.env` file in the project root:

```bash
# Google Maps API Key (Public - exposed to client)
PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# OpenWeatherMap API Key (Private - server-side only)
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### Production (CapRover / Deployment)

Set environment variables in your hosting platform:

**CapRover:**
1. Go to your app in CapRover dashboard
2. Navigate to "App Configs" > "Environment Variables"
3. Add:
   - `PUBLIC_GOOGLE_MAPS_API_KEY` = your_google_maps_api_key
   - `OPENWEATHER_API_KEY` = your_openweather_api_key

**Other Platforms:**
- Vercel: Project Settings > Environment Variables
- Netlify: Site Settings > Build & Deploy > Environment
- Railway: Project > Variables

## Features & Usage

### For Tour Guides

#### 1. Location Selection with Google Maps
When creating or editing a tour:
- Click "Pick on map" button in the location field
- Interactive Google Maps modal opens
- Search for locations or click on the map
- Get precise coordinates automatically
- Location is saved with the tour

#### 2. Weather Dashboard
On tour detail pages:
- **Current Weather**: Real-time conditions at tour location
- **Weather Advisories**: Automatic warnings for:
  - Extreme temperatures (< 0°C or > 35°C)
  - Heavy rain or snow
  - Strong winds (> 50 km/h)
  - Poor visibility (< 1 km)
  - Thunderstorms
- **5-Day Forecast**: Plan ahead for upcoming tours
- **Tour-Specific Weather**: See forecast for scheduled tour date/time

#### 3. Weather Suitability Check
The system automatically assesses if weather conditions are suitable for tours and provides:
- ✅ **Suitable**: Good conditions, tour can proceed normally
- ⚠️ **Warnings**: Minor concerns, bring appropriate gear
- ❌ **Not Suitable**: Severe conditions, consider rescheduling

### For Customers (Public Booking Pages)

Customers see weather information when booking:
- Current conditions at tour location
- Forecast for their selected tour date/time
- What to bring based on weather (umbrellas, warm clothing, etc.)
- Weather advisories to set proper expectations

## Component Usage

### Weather Widget Component

Display current weather:

```svelte
<script>
	import WeatherWidget from '$lib/components/weather/WeatherWidget.svelte';
	import { PUBLIC_OPENWEATHER_API_KEY } from '$env/static/public';
	
	let tourCoordinates = { lat: 52.5200, lng: 13.4050 }; // Berlin
</script>

<WeatherWidget
	coordinates={tourCoordinates}
	locationName="Berlin, Germany"
	apiKey={PUBLIC_OPENWEATHER_API_KEY || ''}
	showDetails={true}
	compact={false}
/>
```

### Weather Forecast Component

Display 5-day forecast with optional tour-specific weather:

```svelte
<script>
	import WeatherForecast from '$lib/components/weather/WeatherForecast.svelte';
	import { PUBLIC_OPENWEATHER_API_KEY } from '$env/static/public';
	
	let tourCoordinates = { lat: 52.5200, lng: 13.4050 };
	let tourDateTime = new Date('2025-10-25T14:00:00'); // Optional
</script>

<WeatherForecast
	coordinates={tourCoordinates}
	tourDateTime={tourDateTime}
	locationName="Berlin"
	apiKey={PUBLIC_OPENWEATHER_API_KEY || ''}
	daysToShow={5}
/>
```

### Google Maps Location Picker

Already integrated in `LocationPicker.svelte`:

```svelte
<script>
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	
	let tourLocation = '';
	let userProfile = { location: 'Berlin, Germany' };
</script>

<LocationPicker
	bind:value={tourLocation}
	profileLocation={userProfile.location}
	enableGeolocation={true}
	enableMapsIntegration={true}
	label="Tour Meeting Point"
/>
```

## API Endpoints

### Current Weather
```
GET /api/weather/current?lat=52.5200&lng=13.4050
```

Returns:
```json
{
	"weather": { /* WeatherData object */ },
	"suitability": {
		"suitable": true,
		"warnings": ["Cold weather - warm clothing recommended"]
	},
	"summary": "☀️ 15°C - clear sky"
}
```

### Weather Forecast
```
GET /api/weather/forecast?lat=52.5200&lng=13.4050&date=2025-10-25T14:00:00Z
```

Returns:
```json
{
	"forecast": { /* WeatherForecast object */ },
	"tourWeather": { /* ForecastData for specific date */ }
}
```

## Integration with Tours

### Getting Coordinates from Tour Location

Tours store location as text (e.g., "Brandenburg Gate, Berlin"). To show weather:

1. **Option A: Geocode on Demand**
   ```typescript
   import { defaultMapService } from '$lib/utils/map-integration.js';
   
   const results = await defaultMapService.searchLocations(tour.location);
   if (results.length > 0) {
       const coordinates = results[0].coordinates;
       // Use coordinates for weather
   }
   ```

2. **Option B: Store Coordinates with Tour** (Recommended)
   
   Update tour schema to include coordinates:
   ```typescript
   // In tour type
   interface Tour {
       // ... existing fields
       locationCoordinates?: {
           lat: number;
           lng: number;
       };
   }
   ```
   
   Store coordinates when location is selected in the map picker.

### Recommended Implementation Locations

1. **Tour Details Page** (Guide Dashboard)
   - Current weather widget
   - 5-day forecast
   - Weather suitability assessment

2. **Tour Schedule Page**
   - Weather for each scheduled time slot
   - Warnings for slots with bad weather

3. **Public Booking Page**
   - Current conditions
   - Forecast for selected date/time
   - What to bring recommendations

4. **Email Notifications**
   - Include weather summary in booking confirmation
   - Send weather reminders 24 hours before tour

## Optimization Tips

### Caching Weather Data
Weather data doesn't change constantly. Implement caching:

```typescript
// Cache weather for 10 minutes
let weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function getCachedWeather(coordinates) {
    const key = `${coordinates.lat},${coordinates.lng}`;
    const cached = weatherCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    
    const data = await fetchWeather(coordinates);
    weatherCache.set(key, { data, timestamp: Date.now() });
    return data;
}
```

### Rate Limiting
- OpenWeatherMap free tier: Max 60 calls/minute
- Google Maps: No strict rate limits but billing applies
- Use debouncing for search inputs
- Cache frequently requested locations

### Error Handling
Both APIs can fail. Always provide fallbacks:

```svelte
{#if !apiKey}
    <p>Weather data unavailable - API not configured</p>
{:else if error}
    <p>Unable to load weather. {error}</p>
{:else}
    <!-- Weather data -->
{/if}
```

## Security Best Practices

### API Key Security

1. **Google Maps API Key** (Public)
   - Must be public (client-side JavaScript)
   - Use application restrictions (HTTP referrer)
   - Use API restrictions (only enable required APIs)
   - Monitor usage in Google Cloud Console

2. **OpenWeather API Key** (Private)
   - Keep server-side only
   - Never expose to client
   - Use API endpoints for client access
   - Monitor usage on OpenWeatherMap dashboard

### Rate Limiting Implementation

Implement server-side rate limiting:

```typescript
// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = requestCounts.get(ip);
    
    if (!record || now > record.resetTime) {
        requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
        return true;
    }
    
    if (record.count >= limit) {
        return false;
    }
    
    record.count++;
    return true;
}
```

## Testing

### Test URLs

**Development:**
- `http://localhost:5173` - Test map picker
- Create a test tour with location
- Verify weather displays correctly

**Production:**
- Test on your domain
- Verify API keys work
- Check browser console for errors
- Monitor API usage

### Common Issues

1. **"Google Maps failed to load"**
   - Check API key is correct
   - Verify Maps JavaScript API is enabled
   - Check browser console for specific error
   - Verify HTTP referrer restrictions match your domain

2. **"Weather API not configured"**
   - Check OPENWEATHER_API_KEY is set in environment
   - Verify API key is activated (takes ~10 min after creation)
   - Check API key is valid on OpenWeatherMap dashboard

3. **Map shows gray tiles**
   - Billing not enabled on Google Cloud project
   - API key restrictions too strict
   - JavaScript console shows specific error

4. **Weather data not updating**
   - Check browser network tab for failed requests
   - Verify coordinates are valid (lat: -90 to 90, lng: -180 to 180)
   - Check OpenWeatherMap API status page

## Cost Estimation

### Small Tour Business (10 tours, 100 bookings/month)

**Google Maps:**
- Map loads: ~500/month = $3.50
- Geocoding: ~200/month = $1.00
- **Total: ~$4.50/month** (within free $200 credit)

**OpenWeatherMap:**
- Weather checks: ~3,000/month
- **Total: $0** (within free tier)

### Medium Tour Business (50 tours, 500 bookings/month)

**Google Maps:**
- Map loads: ~2,500/month = $17.50
- Geocoding: ~1,000/month = $5.00
- **Total: ~$22.50/month** (within free $200 credit)

**OpenWeatherMap:**
- Weather checks: ~15,000/month
- **Total: $0** (within free tier)

### Large Tour Business (200 tours, 2,000 bookings/month)

**Google Maps:**
- Map loads: ~10,000/month = $70
- Geocoding: ~4,000/month = $20
- **Total: ~$90/month** (within free $200 credit)

**OpenWeatherMap:**
- Weather checks: ~60,000/month
- **Total: $0** (free tier sufficient with caching)

## Support & Resources

### Documentation Links
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [SvelteKit Environment Variables](https://kit.svelte.dev/docs/modules#$env-static-public)

### Getting Help
1. Check browser console for errors
2. Review API dashboards for usage/errors
3. Test with simple examples first
4. Check API status pages for outages

## Next Steps

After setup:
1. Test location picker in tour creation
2. Create a test tour with coordinates
3. Verify weather displays on tour pages
4. Test public booking page
5. Monitor API usage for first week
6. Adjust caching if needed

Congratulations! Your tour platform now has professional maps and weather integration! 🎉


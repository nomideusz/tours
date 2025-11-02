# Places API (New) Setup Guide

## Quick Fix: Enable Places API (New)

If you're getting **0 results** from Places API, follow these steps:

### 1. Enable Places API (New) in Google Cloud Console

**Important**: "Places API (New)" is **different** from the old "Places API"!

#### Step-by-Step:

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/

2. **Select your project**:
   - Use the project dropdown at the top
   - Select the project that has your API key

3. **Enable Places API (New)**:
   - Visit: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
   - Or search for "Places API (New)" in the API Library
   - Click **"ENABLE"**

4. **Verify it's enabled**:
   - Go to: https://console.cloud.google.com/apis/dashboard
   - Look for "Places API (New)" in the enabled APIs list

### 2. Check Your API Key Restrictions

Your API key might be restricted to only certain APIs:

1. **Go to Credentials**:
   - Visit: https://console.cloud.google.com/apis/credentials

2. **Click your API key**

3. **Check "API restrictions"**:
   - If "Restrict key" is selected:
     - Make sure "Places API (New)" is in the allowed list
     - Also keep "Geocoding API" for fallback
   
4. **Save changes**

### 3. Restart Your Dev Server

After enabling the API, restart your development server:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 4. Test Again

Try searching for "Eiffel Tower" or "Central Park" in the location picker.

**Expected console output:**
```
🗺️ Using Places API (New) for autocomplete
📤 Sending to Places API: { "input": "Eiffel Tower", ... }
📥 Places API response: { suggestionsCount: 5, ... }
✅ Places API returned 5 results
```

## Common Issues

### Issue 1: Still Getting 0 Results

**Check:**
1. Is billing enabled on your Google Cloud project?
2. Did you wait 1-2 minutes after enabling the API?
3. Is your API key correct in `.env`?

**Solution:**
```bash
# Check your .env file
cat .env | grep GOOGLE_MAPS_API_KEY

# Should show:
# GOOGLE_MAPS_API_KEY=AIza...
```

### Issue 2: "API key not valid"

**Error in console:**
```
❌ Places API error: {
  status: 403,
  message: "API key not valid..."
}
```

**Solution:**
1. Check your API key has no extra spaces
2. Regenerate the API key in Google Cloud Console
3. Update `.env` with the new key
4. Restart dev server

### Issue 3: "This API is not enabled for this project"

**Error in console:**
```
❌ Places API error: {
  status: 403,
  message: "Places API (New) has not been used in project..."
}
```

**Solution:**
- Go back to Step 1 and enable Places API (New)
- Make sure you're in the correct Google Cloud project

## Verify Setup

### Server Logs

When you type in the location picker, you should see in your **terminal/server logs**:

```
Places Autocomplete request: { input: 'Eiffel', types: undefined }
📤 Sending to Places API: {
  "input": "Eiffel",
  "languageCode": "en"
}
📥 Places API response: {
  suggestionsCount: 5,
  fullResponse: "{ suggestions: [...] }"
}
Places API: 5 suggestions for "Eiffel"
```

### Browser Console

In your browser console (F12), you should see:

```
🗺️ Using Places API (New) for autocomplete
✅ Places API returned 5 results
```

## Cost Information

Once enabled, you'll be charged:
- **$2.83 per 1,000 autocomplete requests** (with session tokens)
- **$0.017 per place details request** (Basic tier)

Much cheaper than the old Geocoding API! ($5/1000)

## Still Having Issues?

### Debug Mode

Add extra logging to see the exact API response:

```typescript
// In src/routes/api/places/autocomplete/+server.ts
// The enhanced logging is already added - check your terminal!
```

### Check API Quotas

Visit: https://console.cloud.google.com/apis/api/places-backend.googleapis.com/quotas

Make sure you have quota remaining.

### Test API Key Directly

Try calling the API directly with curl:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: YOUR_API_KEY_HERE" \
  -d '{
    "input": "Eiffel Tower",
    "languageCode": "en"
  }' \
  https://places.googleapis.com/v1/places:autocomplete
```

Expected response:
```json
{
  "suggestions": [
    {
      "placePrediction": {
        "placeId": "ChIJLU7jZClu5kcR4PcOOO6p3I0",
        "text": {
          "text": "Eiffel Tower"
        },
        ...
      }
    }
  ]
}
```

## Success Checklist

- ✅ Places API (New) enabled in Google Cloud Console
- ✅ API key has Places API (New) in allowed APIs
- ✅ Billing enabled on project
- ✅ `.env` has correct API key
- ✅ Dev server restarted
- ✅ Console shows "✅ Places API returned X results"

## Need Help?

1. Check the full error in **terminal/server logs** (not just browser console)
2. Look for the `📤 Sending to Places API:` log to see what's being sent
3. Look for the `📥 Places API response:` log to see what's returned
4. If you see a 403 error, it's usually API not enabled or key restrictions

---

**Quick Link**: https://console.cloud.google.com/apis/library/places-backend.googleapis.com


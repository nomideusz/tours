# Google Places API (New) Integration Guide

## Overview

This platform now integrates the **Google Places API (New)**, providing enhanced location search and autocomplete functionality for tour creation and management.

## What's New?

### Before (Geocoding API)
- Basic address search
- Generic location suggestions
- Limited metadata

### After (Places API New)
- 🎯 **Better Autocomplete**: More accurate place predictions
- 🏛️ **Rich Metadata**: Access to ratings, photos, opening hours
- 🗺️ **Smart Filtering**: Prioritizes tourist attractions and good meeting points
- 💰 **Cost Effective**: $2.83 per 1,000 requests (vs $5 for Geocoding)
- 🔄 **Automatic Fallback**: Falls back to Geocoding API if needed

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     LocationPicker.svelte                    │
│  (Tour Form Component - Meeting Point Selection)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│             GooglePlacesAPIService                          │
│        (src/lib/utils/map-integration.ts)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴────────────┐
          ▼                        ▼
┌──────────────────────┐  ┌──────────────────────┐
│  Places Autocomplete │  │   Place Details      │
│   /api/places/       │  │   /api/places/       │
│   autocomplete       │  │   details            │
└──────────┬───────────┘  └──────────┬───────────┘
           │                         │
           └─────────┬───────────────┘
                     ▼
           ┌─────────────────────────┐
           │  Google Places API (New)│
           │  places.googleapis.com  │
           └─────────────────────────┘
```

## Components & Files

### 1. Server Endpoints

#### `/api/places/autocomplete/+server.ts`
- **Purpose**: Autocomplete suggestions for locations
- **Method**: POST
- **Input**: 
  ```typescript
  {
    input: string,           // Search query
    types?: string[],        // Place types to filter
    locationBias?: {         // Geographic bias
      lat: number,
      lng: number,
      radius?: number
    },
    sessionToken?: string    // For session-based pricing
  }
  ```
- **Output**:
  ```typescript
  {
    suggestions: PlaceSuggestion[]
  }
  ```

#### `/api/places/details/+server.ts`
- **Purpose**: Get detailed information about a place
- **Method**: POST
- **Input**:
  ```typescript
  {
    placeId: string,         // Place ID from autocomplete
    fields?: string[]        // Fields to fetch (controls cost)
  }
  ```
- **Output**: `PlaceDetails` object with coordinates, ratings, photos, etc.

### 2. Type Definitions

**File**: `src/lib/types/places.ts`

Key types:
- `PlaceSuggestion` - Autocomplete result
- `PlaceDetails` - Full place information
- `MEETING_POINT_TYPES` - Recommended types for tour meeting points
- `TOUR_PLACE_TYPES` - All available place types

### 3. Service Layer

**File**: `src/lib/utils/map-integration.ts`

New class: `GooglePlacesAPIService`

Key methods:
```typescript
// Get autocomplete suggestions
await placesService.searchLocationsWithPlacesAPI(query, options);

// Get place details
await placesService.getPlaceDetails(placeId, fields);
```

Helper functions:
```typescript
// Create a Places API service instance
const placesService = getPlacesAPIService();

// Access default instance
import { defaultPlacesAPIService } from '$lib/utils/map-integration';
```

### 4. UI Component

**File**: `src/lib/components/LocationPicker.svelte`

Enhanced features:
- ✅ Uses Places API (New) by default
- ✅ Automatic fallback to Geocoding API
- ✅ Stores `placeId` for future use
- ✅ Prioritizes good meeting points (stations, landmarks, cafes)
- ✅ Shows POI markers in suggestions

## Usage Examples

### Basic Autocomplete

```svelte
<script>
  import LocationPicker from '$lib/components/LocationPicker.svelte';
  
  let location = $state('');
</script>

<LocationPicker
  bind:value={location}
  placeholder="Meeting point"
  enableGeolocation={true}
  enableMapsIntegration={true}
/>
```

### Direct API Usage

```typescript
import { getPlacesAPIService } from '$lib/utils/map-integration';
import { MEETING_POINT_TYPES } from '$lib/types/places';

// Search for places
const placesService = getPlacesAPIService();
const suggestions = await placesService.searchLocationsWithPlacesAPI(
  'Eiffel Tower',
  { types: MEETING_POINT_TYPES }
);

// Get place details
if (suggestions.length > 0) {
  const placeId = suggestions[0].placeId;
  const details = await placesService.getPlaceDetails(placeId);
  console.log('Place rating:', details?.rating);
  console.log('Address:', details?.fullAddress);
}
```

### Server-Side Usage

```typescript
// In any +server.ts file
export async function POST({ request }) {
  const { query } = await request.json();
  
  const response = await fetch('/api/places/autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      input: query,
      types: ['tourist_attraction', 'museum', 'park']
    })
  });
  
  const { suggestions } = await response.json();
  return json({ suggestions });
}
```

## Configuration

### Environment Variables

Required in `.env`:
```bash
# Server-side only (never exposed to client)
GOOGLE_MAPS_API_KEY=your_api_key_here

# Or use public key (will work but less secure)
PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Enable/Disable Places API

In `LocationPicker.svelte`, you can toggle between APIs:

```typescript
// Enable Places API (default)
let usePlacesAPI = $state(true);

// Disable to use only Geocoding API
let usePlacesAPI = $state(false);
```

## Cost Optimization

### Session Tokens

Implement session tokens to reduce costs:

```typescript
// Generate session token (TODO)
const sessionToken = generateSessionToken();

// Use in all related autocomplete requests
const suggestions = await placesService.searchLocationsWithPlacesAPI(
  query,
  { sessionToken }
);

// Call Place Details with same token
await placesService.getPlaceDetails(placeId, fields);
// This will charge only once for the entire session!
```

### Field Masking

When fetching place details, only request fields you need:

```typescript
// Basic (cheapest) - $0.017 per request
const fields = ['id', 'displayName', 'formattedAddress', 'location'];

// Advanced - $0.020 per request
const fields = ['rating', 'userRatingCount', 'currentOpeningHours'];

// Example
const details = await placesService.getPlaceDetails(placeId, fields);
```

## Pricing

| API Call | Cost (per 1,000) | Notes |
|----------|------------------|-------|
| Autocomplete (New) | $2.83 | With session tokens |
| Place Details (Basic) | $17.00 | id, name, address, location |
| Place Details (Advanced) | $20.00 | + ratings, hours, photos |
| Geocoding API (fallback) | $5.00 | Legacy pricing |

**Savings**: Places Autocomplete is **43% cheaper** than Geocoding API!

## Testing

### Manual Testing

1. **Create a new tour**:
   - Navigate to `/tours/new`
   - Start typing in "Meeting Point" field
   - Observe console logs showing Places API usage
   - Verify suggestions show real places

2. **Test fallback**:
   - Disable network temporarily
   - Type a location
   - Verify it falls back to popular locations

3. **Test geolocation**:
   - Click "Use current location"
   - Verify reverse geocoding works

### Console Logs

Look for these indicators:
```
🗺️ Using Places API (New) for autocomplete
✅ Places API returned 5 results
📍 Selected place ID: ChIJXyz123...
```

## Migration from Geocoding API

The integration is **backward compatible**:
- ✅ Old code using Geocoding API still works
- ✅ No breaking changes
- ✅ Automatic progressive enhancement
- ✅ Graceful degradation on errors

## Future Enhancements

### Phase 1 (Current)
- ✅ Places Autocomplete integration
- ✅ LocationPicker component upgrade
- ✅ Type definitions

### Phase 2 (Planned)
- [ ] Place Details card component
- [ ] Display ratings and photos in suggestions
- [ ] Session token management
- [ ] Place photos integration

### Phase 3 (Future)
- [ ] Nearby Search widget
- [ ] AI-powered area summaries
- [ ] Place recommendations
- [ ] Enhanced tour discovery

## Troubleshooting

### Issue: No suggestions appearing

**Check**:
1. Is `GOOGLE_MAPS_API_KEY` set in `.env`?
2. Is Places API enabled in Google Cloud Console?
3. Check browser console for errors
4. Verify API key has Places API (New) enabled

**Solution**:
- Enable Places API (New) in Google Cloud Console
- Check API key permissions
- Verify billing is enabled

### Issue: "API key not configured" error

**Check**: Environment variable is set correctly:
```bash
# Should be in .env (server-side)
GOOGLE_MAPS_API_KEY=AIza...

# Restart dev server after adding
npm run dev
```

### Issue: Suggestions but no coordinates

This is expected! Places Autocomplete only returns place IDs.
To get coordinates, call Place Details:

```typescript
const details = await placesService.getPlaceDetails(placeId);
console.log(details?.coordinates); // { lat, lng }
```

## Resources

- [Places API (New) Documentation](https://developers.google.com/maps/documentation/places/web-service/op-overview)
- [Places API Pricing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [Migration Guide](https://developers.google.com/maps/documentation/places/web-service/migrate-text)
- [Best Practices](https://developers.google.com/maps/documentation/places/web-service/policies)

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify API key configuration
3. Review this guide
4. Check Google Cloud Console quotas

---

**Last Updated**: November 2025
**API Version**: Places API (New) v1
**Status**: ✅ Production Ready


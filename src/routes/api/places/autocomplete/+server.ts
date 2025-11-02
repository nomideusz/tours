import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';

/**
 * Places API (New) - Autocomplete endpoint
 * 
 * Uses the new Google Places API for improved autocomplete with:
 * - Better place predictions
 * - Place IDs for detailed lookups
 * - Rich metadata (ratings, types, etc.)
 * - Session-based pricing ($2.83 per 1000 requests)
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { input, types, locationBias, sessionToken } = body;
		
		if (!input || input.trim().length < 2) {
			return json({ suggestions: [] });
		}
		
		const apiKey = env.GOOGLE_MAPS_API_KEY || env.PUBLIC_GOOGLE_MAPS_API_KEY;
		
		if (!apiKey) {
			console.error('Places API: GOOGLE_MAPS_API_KEY not configured');
			return json({ 
				error: 'Google Maps API key not configured',
				suggestions: [] 
			}, { status: 200 }); // Return 200 to allow graceful fallback
		}
		
		console.log('Places Autocomplete request:', { input, types });
		
		// Build request body for Places API (New)
		const requestBody: any = {
			input: input.trim(),
			languageCode: 'en'
		};
		
		// Add type restrictions if specified
		if (types && types.length > 0) {
			requestBody.includedPrimaryTypes = types;
		}
		
		// Add location bias if specified (for better local results)
		if (locationBias) {
			requestBody.locationBias = {
				circle: {
					center: {
						latitude: locationBias.lat,
						longitude: locationBias.lng
					},
					radius: locationBias.radius || 50000 // 50km default
				}
			};
		}
		
		// Add session token for session-based pricing
		if (sessionToken) {
			requestBody.sessionToken = sessionToken;
		}
		
		// Call Places API (New) Autocomplete
		console.log('📤 Sending to Places API:', JSON.stringify(requestBody, null, 2));
		
		const response = await fetch(
			'https://places.googleapis.com/v1/places:autocomplete',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Goog-Api-Key': apiKey
				},
				body: JSON.stringify(requestBody)
			}
		);
		
		const data = await response.json();
		
		if (!response.ok) {
			console.error('❌ Places API error:', {
				status: response.status,
				statusText: response.statusText,
				error: data.error,
				message: data.error?.message,
				details: data.error?.details
			});
			return json({ 
				error: 'Places API request failed',
				errorMessage: data.error?.message || 'Unknown error',
				suggestions: [] 
			}, { status: 200 });
		}
		
		console.log('📥 Places API response:', {
			suggestionsCount: data.suggestions?.length || 0,
			fullResponse: JSON.stringify(data, null, 2)
		});
		
		console.log(`Places API: ${data.suggestions?.length || 0} suggestions for "${input}"`);
		
		// Check if we got 0 results - might indicate API not enabled
		if (!data.suggestions || data.suggestions.length === 0) {
			console.warn('⚠️ Places API returned 0 results. This might indicate:');
			console.warn('   1. Places API (New) is not enabled in Google Cloud Console');
			console.warn('   2. API key lacks permissions for Places API (New)');
			console.warn('   3. The search query had no matching places');
			console.warn('   → Visit: https://console.cloud.google.com/apis/library/places-backend.googleapis.com');
		}
		
		// Transform suggestions to our format
		const suggestions = (data.suggestions || []).map((suggestion: any) => {
			const placePrediction = suggestion.placePrediction || {};
			
			return {
				placeId: placePrediction.placeId || '',
				name: placePrediction.text?.text || placePrediction.structuredFormat?.mainText?.text || '',
				fullAddress: placePrediction.structuredFormat?.secondaryText?.text || '',
				types: placePrediction.types || [],
				type: getLocationType(placePrediction.types || [])
			};
		});
		
		return json({ suggestions });
		
	} catch (error) {
		console.error('Places Autocomplete exception:', error);
		return json({ 
			error: 'Failed to fetch place suggestions',
			details: error instanceof Error ? error.message : 'Unknown error',
			suggestions: []
		}, { status: 200 }); // Return 200 to allow graceful fallback
	}
};

/**
 * Map Places API types to our simplified location types
 */
function getLocationType(types: string[]): 'address' | 'poi' | 'establishment' | 'locality' {
	if (types.includes('tourist_attraction') || 
		types.includes('point_of_interest') || 
		types.includes('museum') ||
		types.includes('park')) {
		return 'poi';
	}
	
	if (types.includes('establishment') || 
		types.includes('restaurant') || 
		types.includes('cafe')) {
		return 'establishment';
	}
	
	if (types.includes('locality') || 
		types.includes('sublocality') ||
		types.includes('neighborhood')) {
		return 'locality';
	}
	
	if (types.includes('street_address') || 
		types.includes('premise') ||
		types.includes('route')) {
		return 'address';
	}
	
	return 'establishment';
}


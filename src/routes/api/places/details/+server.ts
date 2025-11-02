import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';

/**
 * Places API (New) - Place Details endpoint
 * 
 * Fetches detailed information about a place using its Place ID.
 * Includes: address, coordinates, ratings, photos, opening hours, etc.
 * 
 * Pricing: $0.017 per Basic request
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { placeId, fields } = body;
		
		if (!placeId) {
			return json({ error: 'Place ID is required' }, { status: 400 });
		}
		
		const apiKey = env.GOOGLE_MAPS_API_KEY || env.PUBLIC_GOOGLE_MAPS_API_KEY;
		
		if (!apiKey) {
			console.error('Places API: GOOGLE_MAPS_API_KEY not configured');
			return json({ error: 'Google Maps API key not configured' }, { status: 503 });
		}
		
		console.log('Places Details request:', { placeId, fields });
		
		// Define default fields to fetch (Basic tier - cheapest)
		const defaultFields = [
			'id',
			'displayName',
			'formattedAddress',
			'location',
			'types',
			'viewport'
		];
		
		// Additional fields available (increase cost):
		// - rating, userRatingCount (Advanced tier)
		// - photos (Place Photos API - separate pricing)
		// - editorialSummary (Advanced tier)
		// - currentOpeningHours (Advanced tier)
		
		const fieldMask = (fields || defaultFields).join(',');
		
		// Call Places API (New) - Place Details
		const response = await fetch(
			`https://places.googleapis.com/v1/places/${placeId}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'X-Goog-Api-Key': apiKey,
					'X-Goog-FieldMask': fieldMask
				}
			}
		);
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('Places Details API error:', response.status, errorData);
			return json({ 
				error: 'Failed to fetch place details',
				status: response.status
			}, { status: response.status });
		}
		
		const data = await response.json();
		
		console.log(`Places API: Details fetched for ${placeId}`);
		
		// Transform to our format
		const placeDetails = {
			placeId: data.id,
			name: data.displayName?.text || '',
			fullAddress: data.formattedAddress || '',
			coordinates: data.location ? {
				lat: data.location.latitude,
				lng: data.location.longitude
			} : null,
			types: data.types || [],
			viewport: data.viewport ? {
				northeast: {
					lat: data.viewport.high.latitude,
					lng: data.viewport.high.longitude
				},
				southwest: {
					lat: data.viewport.low.latitude,
					lng: data.viewport.low.longitude
				}
			} : null,
			// Optional fields (if requested)
			rating: data.rating,
			userRatingCount: data.userRatingCount,
			editorialSummary: data.editorialSummary?.text,
			photos: data.photos?.map((photo: any) => ({
				name: photo.name,
				widthPx: photo.widthPx,
				heightPx: photo.heightPx
			}))
		};
		
		return json(placeDetails);
		
	} catch (error) {
		console.error('Places Details exception:', error);
		return json({ 
			error: 'Failed to fetch place details',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};


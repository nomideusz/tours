import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';

/**
 * Places API (New) - Place Photo endpoint
 * 
 * Returns a photo URL for a given photo resource name.
 * Photos are served directly from Google's CDN.
 * 
 * Pricing: $7 per 1,000 requests
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { photoName, maxWidth, maxHeight } = body;
		
		if (!photoName) {
			return json({ error: 'Photo name is required' }, { status: 400 });
		}
		
		const apiKey = env.GOOGLE_MAPS_API_KEY || env.PUBLIC_GOOGLE_MAPS_API_KEY;
		
		if (!apiKey) {
			console.error('Places API: GOOGLE_MAPS_API_KEY not configured');
			return json({ error: 'Google Maps API key not configured' }, { status: 503 });
		}
		
		// Build photo URL with size parameters
		// Format: places/{photoName}/media?maxHeightPx={height}&maxWidthPx={width}&key={apiKey}
		const params = new URLSearchParams();
		if (maxWidth) params.append('maxWidthPx', maxWidth.toString());
		if (maxHeight) params.append('maxHeightPx', maxHeight.toString());
		params.append('key', apiKey);
		
		const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?${params.toString()}`;
		
		console.log(`📸 Place Photo requested: ${photoName} (${maxWidth || 'auto'}w x ${maxHeight || 'auto'}h)`);
		
		return json({ 
			photoUrl,
			photoName,
			dimensions: {
				maxWidth: maxWidth || null,
				maxHeight: maxHeight || null
			}
		});
		
	} catch (error) {
		console.error('Place Photo exception:', error);
		return json({ 
			error: 'Failed to get place photo',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};


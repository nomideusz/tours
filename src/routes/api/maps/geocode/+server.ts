import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('query');
	
	if (!query) {
		console.error('Geocoding: No query parameter provided');
		return json({ error: 'Query parameter is required' }, { status: 400 });
	}
	
	const apiKey = env.GOOGLE_MAPS_API_KEY || env.PUBLIC_GOOGLE_MAPS_API_KEY;
	
	if (!apiKey) {
		console.error('Geocoding: GOOGLE_MAPS_API_KEY not configured in environment');
		return json({ error: 'Google Maps API key not configured' }, { status: 503 });
	}
	
	console.log('Geocoding request for:', query);
	
	try {
		// Call Google Maps Geocoding API from server
		const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
		
		const response = await fetch(geocodeUrl);
		const data = await response.json();
		
		console.log('Google Maps API response status:', data.status);
		
		if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
			console.error('Google Maps API error:', data.status, data.error_message || '');
			return json({ 
				error: 'Geocoding failed', 
				status: data.status,
				message: data.error_message || 'Unknown error'
			}, { status: 200 }); // Return 200 with error object instead of 500
		}
		
		if (data.status === 'ZERO_RESULTS') {
			console.log('No results found for query:', query);
			return json({ results: [] });
		}
		
		// Return top 5 results
		const results = data.results.slice(0, 5).map((result: any) => ({
			name: result.address_components?.[0]?.long_name || result.formatted_address,
			fullAddress: result.formatted_address,
			coordinates: {
				lat: result.geometry.location.lat,
				lng: result.geometry.location.lng
			},
			types: result.types
		}));
		
		console.log(`Geocoding successful: ${results.length} results for "${query}"`);
		
		return json({ results });
	} catch (error) {
		console.error('Geocoding exception:', error);
		return json({ 
			error: 'Failed to geocode location',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 200 }); // Return 200 with error to prevent infinite retries
	}
};


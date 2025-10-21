import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const lat = url.searchParams.get('lat');
	const lng = url.searchParams.get('lng');
	
	if (!lat || !lng) {
		console.error('Reverse geocoding: Missing coordinates');
		return json({ error: 'Latitude and longitude are required' }, { status: 400 });
	}
	
	const apiKey = env.GOOGLE_MAPS_API_KEY || env.PUBLIC_GOOGLE_MAPS_API_KEY;
	
	if (!apiKey) {
		console.error('Reverse geocoding: GOOGLE_MAPS_API_KEY not configured');
		return json({ error: 'Google Maps API key not configured' }, { status: 503 });
	}
	
	console.log('Reverse geocoding request for:', lat, lng);
	
	try {
		// Call Google Maps Geocoding API from server
		const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
		
		const response = await fetch(geocodeUrl);
		const data = await response.json();
		
		console.log('Google Maps reverse geocode status:', data.status);
		
		if (data.status !== 'OK' || !data.results.length) {
			console.error('Reverse geocoding failed:', data.status);
			return json({ 
				error: 'Unable to reverse geocode location',
				status: data.status
			}, { status: 200 }); // Return 200 to prevent retries
		}
		
		const result = data.results[0];
		
		console.log('Reverse geocoding successful:', result.formatted_address);
		
		return json({
			name: result.address_components?.[0]?.long_name || result.formatted_address,
			fullAddress: result.formatted_address,
			coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
			types: result.types
		});
	} catch (error) {
		console.error('Reverse geocoding exception:', error);
		return json({ 
			error: 'Failed to reverse geocode location',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 200 }); // Return 200 to prevent infinite retries
	}
};


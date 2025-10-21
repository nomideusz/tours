import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const lat = url.searchParams.get('lat');
	const lng = url.searchParams.get('lng');
	
	if (!lat || !lng) {
		return json({ error: 'Latitude and longitude required' }, { status: 400 });
	}
	
	const apiKey = env.GOOGLE_MAPS_API_KEY || env.PUBLIC_GOOGLE_MAPS_API_KEY;
	
	if (!apiKey) {
		return json({ error: 'Google Weather API key not configured' }, { status: 503 });
	}
	
	try {
		const weatherUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}`;
		
		const response = await fetch(weatherUrl);
		const contentType = response.headers.get('content-type');
		
		// Check if response is JSON
		if (!contentType || !contentType.includes('application/json')) {
			console.error('Google Weather API returned non-JSON (likely needs pilot access)');
			return json({ 
				error: 'Google Weather API not accessible (may need pilot program registration)',
				needsPilotAccess: true
			}, { status: 200 });
		}
		
		const data = await response.json();
		
		if (!response.ok) {
			console.error('Google Weather API error:', response.status, data);
			return json({ error: 'Weather API error', details: data }, { status: 200 });
		}
		
		return json(data);
	} catch (error) {
		console.error('Google Weather error:', error);
		return json({ 
			error: 'Failed to fetch weather',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 200 });
	}
};


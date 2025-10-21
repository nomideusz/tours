import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const lat = url.searchParams.get('lat');
	const lng = url.searchParams.get('lng');
	const type = url.searchParams.get('type') || 'daily';
	const days = url.searchParams.get('days') || '10';
	const hours = url.searchParams.get('hours') || '120';
	
	if (!lat || !lng) {
		return json({ error: 'Latitude and longitude required' }, { status: 400 });
	}
	
	const apiKey = env.GOOGLE_MAPS_API_KEY || env.PUBLIC_GOOGLE_MAPS_API_KEY;
	
	if (!apiKey) {
		return json({ error: 'Google Weather API key not configured' }, { status: 503 });
	}
	
	try {
		let weatherUrl: string;
		
		if (type === 'hourly') {
			weatherUrl = `https://weather.googleapis.com/v1/forecast/hours:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&hours=${hours}`;
		} else {
			// Request 10 days with pageSize to ensure we get all days
			weatherUrl = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&days=${days}&pageSize=${days}`;
		}
		
		const response = await fetch(weatherUrl);
		const contentType = response.headers.get('content-type');
		
		// Check if response is JSON
		if (!contentType || !contentType.includes('application/json')) {
			const text = await response.text();
			console.error('Google Weather API returned non-JSON (likely needs pilot access):', text.substring(0, 200));
			return json({ 
				error: 'Google Weather API not accessible (may need pilot program registration)',
				needsPilotAccess: true
			}, { status: 200 });
		}
		
		const data = await response.json();
		
		if (!response.ok) {
			console.error('Google Weather Forecast API error:', response.status, data);
			return json({ error: 'Weather Forecast API error', details: data }, { status: 200 });
		}
		
		return json(data);
	} catch (error) {
		console.error('Google Weather forecast error:', error);
		return json({ 
			error: 'Failed to fetch forecast',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 200 });
	}
};


import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createWeatherService, type LocationCoordinates } from '$lib/utils/weather-integration.js';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const lat = url.searchParams.get('lat');
	const lng = url.searchParams.get('lng');
	
	if (!lat || !lng) {
		return json({ error: 'Latitude and longitude are required' }, { status: 400 });
	}
	
	const apiKey = env.OPENWEATHER_API_KEY || env.PUBLIC_OPENWEATHER_API_KEY;
	
	if (!apiKey) {
		return json({ error: 'Weather API not configured' }, { status: 503 });
	}
	
	try {
		const coordinates: LocationCoordinates = {
			lat: parseFloat(lat),
			lng: parseFloat(lng)
		};
		
		const weatherService = createWeatherService('openweather', apiKey);
		const weather = await weatherService.getCurrentWeather(coordinates);
		
		if (!weather) {
			return json({ error: 'Unable to fetch weather data' }, { status: 404 });
		}
		
		// Get suitability assessment
		const suitability = weather ? weatherService.isWeatherSuitableForTours(weather) : null;
		
		return json({
			weather,
			suitability,
			summary: weatherService.getWeatherSummary(weather)
		});
	} catch (error) {
		console.error('Weather API error:', error);
		return json({ error: 'Failed to fetch weather data' }, { status: 500 });
	}
};


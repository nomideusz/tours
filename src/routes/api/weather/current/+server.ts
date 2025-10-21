import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createWeatherService, type LocationCoordinates } from '$lib/utils/weather-integration.js';
import { OPENWEATHER_API_KEY } from '$env/static/private';

export const GET: RequestHandler = async ({ url }) => {
	const lat = url.searchParams.get('lat');
	const lng = url.searchParams.get('lng');
	
	if (!lat || !lng) {
		return json({ error: 'Latitude and longitude are required' }, { status: 400 });
	}
	
	if (!OPENWEATHER_API_KEY) {
		return json({ error: 'Weather API not configured' }, { status: 503 });
	}
	
	try {
		const coordinates: LocationCoordinates = {
			lat: parseFloat(lat),
			lng: parseFloat(lng)
		};
		
		const weatherService = createWeatherService(OPENWEATHER_API_KEY);
		const weather = await weatherService.getCurrentWeather(coordinates);
		
		if (!weather) {
			return json({ error: 'Unable to fetch weather data' }, { status: 404 });
		}
		
		// Get suitability assessment
		const suitability = weatherService.isWeatherSuitableForTours(weather);
		
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


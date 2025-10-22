import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { createWeatherService, type LocationCoordinates } from '$lib/utils/weather-integration.js';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const lat = url.searchParams.get('lat');
	const lng = url.searchParams.get('lng');
	const targetDate = url.searchParams.get('date'); // Optional: specific date for tour
	
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
		const forecast = await weatherService.getForecast(coordinates);
		
		if (!forecast) {
			return json({ error: 'Unable to fetch forecast data' }, { status: 404 });
		}
		
		// If a specific date is provided, get weather for that time
		let tourWeather = null;
		if (targetDate) {
			const targetDateTime = new Date(targetDate);
			if (!isNaN(targetDateTime.getTime())) {
				tourWeather = await weatherService.getWeatherForDateTime(
					coordinates,
					targetDateTime
				);
			}
		}
		
		return json({
			forecast,
			tourWeather
		});
	} catch (error) {
		console.error('Forecast API error:', error);
		return json({ error: 'Failed to fetch forecast data' }, { status: 500 });
	}
};


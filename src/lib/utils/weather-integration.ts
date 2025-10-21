// Weather integration utilities for Zaur
// Provides weather data for tour locations using OpenWeatherMap API

export interface WeatherCondition {
	id: number;
	main: string;
	description: string;
	icon: string;
}

export interface WeatherData {
	temperature: number; // in Celsius
	feelsLike: number; // in Celsius
	humidity: number; // percentage
	windSpeed: number; // m/s
	cloudiness: number; // percentage
	visibility: number; // meters
	pressure: number; // hPa
	conditions: WeatherCondition[];
	rain?: { '1h'?: number; '3h'?: number }; // precipitation in mm
	snow?: { '1h'?: number; '3h'?: number }; // precipitation in mm
	dt: number; // timestamp
	timezone: number; // timezone offset in seconds
	sunrise?: number; // timestamp
	sunset?: number; // timestamp
}

export interface ForecastData {
	dt: number; // timestamp
	temperature: number;
	feelsLike: number;
	tempMin: number;
	tempMax: number;
	humidity: number;
	conditions: WeatherCondition[];
	rain?: number;
	snow?: number;
	windSpeed: number;
	cloudiness: number;
	pop: number; // probability of precipitation (0-1)
}

export interface WeatherForecast {
	list: ForecastData[];
	city: {
		name: string;
		country: string;
		timezone: number;
		sunrise: number;
		sunset: number;
	};
}

export interface LocationCoordinates {
	lat: number;
	lng: number;
}

/**
 * Weather service configuration
 */
export interface WeatherServiceConfig {
	apiKey: string;
	units?: 'metric' | 'imperial' | 'standard';
	language?: string;
}

/**
 * Abstract weather service class
 */
export abstract class WeatherService {
	protected config: WeatherServiceConfig;

	constructor(config: WeatherServiceConfig) {
		this.config = {
			units: 'metric', // Default to Celsius
			language: 'en',
			...config
		};
	}

	abstract getCurrentWeather(coordinates: LocationCoordinates): Promise<WeatherData | null>;
	abstract getForecast(coordinates: LocationCoordinates): Promise<WeatherForecast | null>;
	abstract getWeatherForDateTime(coordinates: LocationCoordinates, targetDate: Date): Promise<ForecastData | null>;
	
	// Shared utility methods
	getWeatherIconUrl(iconCode: string, size: '2x' | '4x' = '2x'): string {
		return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
	}

	convertWindSpeed(speedMs: number): number {
		return Math.round(speedMs * 3.6);
	}

	getWeatherEmoji(conditionId: number): string {
		if (conditionId >= 200 && conditionId < 300) return '⛈️';
		if (conditionId >= 300 && conditionId < 400) return '🌦️';
		if (conditionId >= 500 && conditionId < 600) {
			if (conditionId === 511) return '🌨️';
			return '🌧️';
		}
		if (conditionId >= 600 && conditionId < 700) return '❄️';
		if (conditionId >= 700 && conditionId < 800) return '🌫️';
		if (conditionId === 800) return '☀️';
		if (conditionId > 800) {
			if (conditionId === 801) return '🌤️';
			if (conditionId === 802) return '⛅';
			return '☁️';
		}
		return '🌡️';
	}

	getWeatherSummary(weather: WeatherData): string {
		const condition = weather.conditions[0];
		const temp = Math.round(weather.temperature);
		const emoji = this.getWeatherEmoji(condition.id);
		
		return `${emoji} ${temp}°C - ${condition.description}`;
	}

	isWeatherSuitableForTours(weather: WeatherData): {
		suitable: boolean;
		warnings: string[];
	} {
		const warnings: string[] = [];
		let suitable = true;

		if (weather.temperature < 0) {
			warnings.push('Freezing temperatures - dress warmly');
			suitable = false;
		} else if (weather.temperature < 5) {
			warnings.push('Cold weather - warm clothing recommended');
		} else if (weather.temperature > 35) {
			warnings.push('Very hot - stay hydrated and use sun protection');
			suitable = false;
		}

		if (weather.rain?.['1h'] && weather.rain['1h'] > 5) {
			warnings.push('Heavy rain expected - bring rain gear');
			suitable = false;
		} else if (weather.rain?.['1h'] && weather.rain['1h'] > 0) {
			warnings.push('Light rain possible - umbrella recommended');
		}

		if (weather.snow?.['1h'] && weather.snow['1h'] > 0) {
			warnings.push('Snow expected - appropriate footwear recommended');
			suitable = false;
		}

		const windKmh = this.convertWindSpeed(weather.windSpeed);
		if (windKmh > 50) {
			warnings.push('Strong winds - tour may be affected');
			suitable = false;
		} else if (windKmh > 30) {
			warnings.push('Moderate winds - secure loose items');
		}

		if (weather.visibility < 1000) {
			warnings.push('Poor visibility - take extra caution');
			suitable = false;
		}

		const conditionId = weather.conditions[0].id;
		if (conditionId >= 200 && conditionId < 300) {
			warnings.push('Thunderstorm - tour may be cancelled for safety');
			suitable = false;
		}

		return { suitable, warnings };
	}
}

/**
 * OpenWeatherMap implementation
 */
export class OpenWeatherMapService extends WeatherService {
	private baseUrl = 'https://api.openweathermap.org/data/2.5';

	/**
	 * Get current weather for coordinates
	 */
	async getCurrentWeather(coordinates: LocationCoordinates): Promise<WeatherData | null> {
		if (!this.config.apiKey) {
			console.warn('Weather API key not configured');
			return null;
		}

		try {
			const url = `${this.baseUrl}/weather?lat=${coordinates.lat}&lon=${coordinates.lng}&units=${this.config.units}&lang=${this.config.language}&appid=${this.config.apiKey}`;
			
			const response = await fetch(url);
			
			if (!response.ok) {
				console.error('Weather API error:', response.status, response.statusText);
				return null;
			}

			const data = await response.json();

			return {
				temperature: data.main.temp,
				feelsLike: data.main.feels_like,
				humidity: data.main.humidity,
				windSpeed: data.wind.speed,
				cloudiness: data.clouds.all,
				visibility: data.visibility,
				pressure: data.main.pressure,
				conditions: data.weather,
				rain: data.rain,
				snow: data.snow,
				dt: data.dt,
				timezone: data.timezone,
				sunrise: data.sys.sunrise,
				sunset: data.sys.sunset
			};
		} catch (error) {
			console.error('Failed to fetch weather data:', error);
			return null;
		}
	}

	/**
	 * Get weather forecast for the next 5 days (3-hour intervals)
	 */
	async getForecast(coordinates: LocationCoordinates): Promise<WeatherForecast | null> {
		if (!this.config.apiKey) {
			console.warn('Weather API key not configured');
			return null;
		}

		try {
			const url = `${this.baseUrl}/forecast?lat=${coordinates.lat}&lon=${coordinates.lng}&units=${this.config.units}&lang=${this.config.language}&appid=${this.config.apiKey}`;
			
			const response = await fetch(url);
			
			if (!response.ok) {
				console.error('Weather Forecast API error:', response.status, response.statusText);
				return null;
			}

			const data = await response.json();

			return {
				list: data.list.map((item: any) => ({
					dt: item.dt,
					temperature: item.main.temp,
					feelsLike: item.main.feels_like,
					tempMin: item.main.temp_min,
					tempMax: item.main.temp_max,
					humidity: item.main.humidity,
					conditions: item.weather,
					rain: item.rain?.['3h'],
					snow: item.snow?.['3h'],
					windSpeed: item.wind.speed,
					cloudiness: item.clouds.all,
					pop: item.pop
				})),
				city: {
					name: data.city.name,
					country: data.city.country,
					timezone: data.city.timezone,
					sunrise: data.city.sunrise,
					sunset: data.city.sunset
				}
			};
		} catch (error) {
			console.error('Failed to fetch weather forecast:', error);
			return null;
		}
	}

	/**
	 * Get weather for a specific date/time (from forecast data)
	 */
	async getWeatherForDateTime(
		coordinates: LocationCoordinates,
		targetDate: Date
	): Promise<ForecastData | null> {
		const forecast = await this.getForecast(coordinates);
		if (!forecast) return null;

		// Find the closest forecast to the target date
		const targetTimestamp = Math.floor(targetDate.getTime() / 1000);
		let closestForecast = forecast.list[0];
		let minDiff = Math.abs(closestForecast.dt - targetTimestamp);

		for (const item of forecast.list) {
			const diff = Math.abs(item.dt - targetTimestamp);
			if (diff < minDiff) {
				minDiff = diff;
				closestForecast = item;
			}
		}

		return closestForecast;
	}

}

/**
 * Google Weather API implementation (NEW - Pilot Program)
 * https://developers.google.com/maps/documentation/weather
 */
export class GoogleWeatherService extends WeatherService {
	private baseUrl = 'https://weather.googleapis.com/v1';

	/**
	 * Get current weather for coordinates
	 */
	async getCurrentWeather(coordinates: LocationCoordinates): Promise<WeatherData | null> {
		try {
			// Use server-side proxy to avoid CORS
			const url = `/api/weather/google/current?lat=${coordinates.lat}&lng=${coordinates.lng}`;
			
			const response = await fetch(url);
			const data = await response.json();
			
			if (!response.ok || data.error) {
				console.error('Google Weather API error:', data.error);
				return null;
			}

			// Google Weather currentConditions response structure
			console.log('🔍 Google Weather current conditions raw:', data);
			
			return {
				temperature: data.temperature?.degrees || 0,
				feelsLike: data.feelsLikeTemperature?.degrees || data.temperature?.degrees || 0,
				humidity: data.relativeHumidity?.percent || 0,
				windSpeed: (data.wind?.speed?.value || 0) / 3.6, // Convert km/h to m/s
				cloudiness: data.cloudCover?.percent || 0,
				visibility: data.visibility?.value || 10000,
				pressure: data.pressure?.value || 1013,
				conditions: [{
					id: this.mapGoogleWeatherTypeToId(data.weatherCondition?.type),
					main: this.getConditionMainFromType(data.weatherCondition?.type),
					description: data.weatherCondition?.description?.text || 'Unknown',
					icon: '01d'
				}],
				rain: data.precipitation24h?.qpf?.value ? { '1h': data.precipitation24h.qpf.value } : undefined,
				dt: Math.floor(Date.now() / 1000),
				timezone: 0,
				sunrise: data.sunEvents?.sunriseTime ? Math.floor(new Date(data.sunEvents.sunriseTime).getTime() / 1000) : undefined,
				sunset: data.sunEvents?.sunsetTime ? Math.floor(new Date(data.sunEvents.sunsetTime).getTime() / 1000) : undefined
			};
		} catch (error) {
			console.error('Failed to fetch Google Weather data:', error);
			return null;
		}
	}

	/**
	 * Get weather forecast
	 */
	async getForecast(coordinates: LocationCoordinates): Promise<WeatherForecast | null> {
		try {
			// Use server-side proxies to avoid CORS
			const dailyUrl = `/api/weather/google/forecast?lat=${coordinates.lat}&lng=${coordinates.lng}&type=daily&days=10`;
			
			const dailyResponse = await fetch(dailyUrl);
			const dailyData = await dailyResponse.json();
			
			if (!dailyResponse.ok || dailyData.error) {
				console.error('Google Weather Forecast API error:', dailyData.error);
				return null;
			}

			// Map to our standard format (Google uses forecastDays)
			const forecastList: ForecastData[] = [];
			
			console.log('🔍 Google Weather raw response:', dailyData);
			console.log('🔍 Number of forecast days:', dailyData.forecastDays?.length);
			
			if (dailyData.forecastDays && Array.isArray(dailyData.forecastDays)) {
				for (const day of dailyData.forecastDays) {
					const daytime = day.daytimeForecast || {};
					const nighttime = day.nighttimeForecast || {};
					
					// Use displayDate for more accurate date matching
					const dateStr = day.displayDate 
						? `${day.displayDate.year}-${String(day.displayDate.month).padStart(2, '0')}-${String(day.displayDate.day).padStart(2, '0')}`
						: day.interval?.startTime;
					
					const timestamp = Math.floor(new Date(dateStr || day.interval?.startTime || Date.now()).getTime() / 1000);
					
					forecastList.push({
						dt: timestamp,
						temperature: day.maxTemperature?.degrees || 0,
						feelsLike: day.feelsLikeMaxTemperature?.degrees || day.maxTemperature?.degrees || 0,
						tempMin: day.minTemperature?.degrees || 0,
						tempMax: day.maxTemperature?.degrees || 0,
						humidity: daytime.relativeHumidity || 50,
						conditions: [{
							id: this.mapGoogleWeatherTypeToId(daytime.weatherCondition?.type),
							main: this.getConditionMainFromType(daytime.weatherCondition?.type),
							description: daytime.weatherCondition?.description?.text || 'Unknown',
							icon: '01d'
						}],
						rain: daytime.precipitation?.qpf?.quantity,
						windSpeed: (daytime.wind?.speed?.value || 0) / 3.6, // Convert km/h to m/s
						cloudiness: daytime.cloudCover || 0,
						pop: (daytime.precipitation?.probability?.percent || 0) / 100
					});
				}
				
				console.log(`✅ Parsed ${forecastList.length} days from Google Weather`);
			} else {
				console.warn('⚠️ No forecastDays in Google Weather response');
			}

			return {
				list: forecastList,
				city: {
					name: 'Location',
					country: '',
					timezone: 0,
					sunrise: Math.floor(Date.now() / 1000),
					sunset: Math.floor(Date.now() / 1000)
				}
			};
		} catch (error) {
			console.error('Failed to fetch Google Weather forecast:', error);
			return null;
		}
	}

	/**
	 * Get weather for specific date/time
	 */
	async getWeatherForDateTime(
		coordinates: LocationCoordinates,
		targetDate: Date
	): Promise<ForecastData | null> {
		const forecast = await this.getForecast(coordinates);
		if (!forecast || !forecast.list.length) return null;

		// Match by date (ignore time) for daily forecasts
		const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
		
		// Try to find exact date match
		for (const item of forecast.list) {
			const itemDateStr = new Date(item.dt * 1000).toISOString().split('T')[0];
			if (itemDateStr === targetDateStr) {
				console.log(`✅ Found exact match for ${targetDateStr}:`, item);
				return item;
			}
		}
		
		// If no exact match, find closest date
		const targetTimestamp = Math.floor(targetDate.getTime() / 1000);
		let closestForecast = forecast.list[0];
		let minDiff = Math.abs(closestForecast.dt - targetTimestamp);

		for (const item of forecast.list) {
			const diff = Math.abs(item.dt - targetTimestamp);
			if (diff < minDiff) {
				minDiff = diff;
				closestForecast = item;
			}
		}

		console.log(`ℹ️ Using closest match for ${targetDateStr}:`, new Date(closestForecast.dt * 1000).toISOString().split('T')[0]);
		return closestForecast;
	}

	/**
	 * Map Google weather type to OpenWeatherMap-style IDs
	 */
	private mapGoogleWeatherTypeToId(type?: string): number {
		if (!type) return 800;
		
		const typeUpper = type.toUpperCase();
		if (typeUpper.includes('CLEAR') || typeUpper.includes('SUNNY')) return 800;
		if (typeUpper.includes('PARTLY')) return 801;
		if (typeUpper.includes('CLOUDY') || typeUpper.includes('OVERCAST')) return 803;
		if (typeUpper.includes('RAIN') || typeUpper.includes('DRIZZLE') || typeUpper.includes('SHOWER')) return 500;
		if (typeUpper.includes('THUNDER') || typeUpper.includes('STORM')) return 200;
		if (typeUpper.includes('SNOW') || typeUpper.includes('SLEET')) return 600;
		if (typeUpper.includes('FOG') || typeUpper.includes('MIST') || typeUpper.includes('HAZE')) return 701;
		
		return 800;
	}

	private getConditionMainFromType(type?: string): string {
		if (!type) return 'Clear';
		
		const typeUpper = type.toUpperCase();
		if (typeUpper.includes('CLEAR') || typeUpper.includes('SUNNY')) return 'Clear';
		if (typeUpper.includes('CLOUD')) return 'Clouds';
		if (typeUpper.includes('RAIN') || typeUpper.includes('DRIZZLE') || typeUpper.includes('SHOWER')) return 'Rain';
		if (typeUpper.includes('THUNDER') || typeUpper.includes('STORM')) return 'Thunderstorm';
		if (typeUpper.includes('SNOW') || typeUpper.includes('SLEET')) return 'Snow';
		if (typeUpper.includes('FOG') || typeUpper.includes('MIST')) return 'Mist';
		
		return 'Clear';
	}
}

/**
 * Get coordinates from location string using geocoding
 * This is a helper function to work with location text
 */
export async function getCoordinatesFromLocation(
	location: string
): Promise<LocationCoordinates | null> {
	// Try to parse coordinates from string (e.g., "52.5200, 13.4050")
	const coordMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
	if (coordMatch) {
		return {
			lat: parseFloat(coordMatch[1]),
			lng: parseFloat(coordMatch[2])
		};
	}

	// If not coordinates, we need to geocode the location
	// This would use the map service (Google Maps, etc.)
	// For now, return null and handle in component
	return null;
}

/**
 * Format temperature with unit
 */
export function formatTemperature(temp: number, unit: 'C' | 'F' = 'C'): string {
	return `${Math.round(temp)}°${unit}`;
}

/**
 * Format wind speed
 */
export function formatWindSpeed(speedMs: number, metric: boolean = true): string {
	if (metric) {
		return `${Math.round(speedMs * 3.6)} km/h`;
	} else {
		return `${Math.round(speedMs * 2.237)} mph`;
	}
}

/**
 * Format precipitation
 */
export function formatPrecipitation(mm: number | undefined): string {
	if (!mm || mm === 0) return 'None';
	if (mm < 0.1) return 'Trace';
	return `${mm.toFixed(1)} mm`;
}

/**
 * Create weather service (provider-specific)
 */
export function createWeatherService(
	provider: 'google' | 'openweather',
	apiKey: string
): WeatherService {
	if (provider === 'google') {
		return new GoogleWeatherService({
			apiKey,
			units: 'metric',
			language: 'en'
		});
	} else {
		return new OpenWeatherMapService({
			apiKey,
			units: 'metric',
			language: 'en'
		});
	}
}

/**
 * Create unified weather service with fallback
 * Tries Google Weather first, falls back to OpenWeatherMap
 */
export class UnifiedWeatherService extends WeatherService {
	private googleService: GoogleWeatherService | null;
	private openWeatherService: OpenWeatherMapService | null;
	private useGoogle: boolean;

	constructor(googleApiKey?: string, openWeatherApiKey?: string) {
		super({ apiKey: googleApiKey || openWeatherApiKey || '' });
		
		// Note: Google Weather is in closed pilot, so we prioritize OpenWeather for now
		// Once you have pilot access, Google will be tried first
		this.googleService = googleApiKey ? new GoogleWeatherService({ apiKey: googleApiKey }) : null;
		this.openWeatherService = openWeatherApiKey ? new OpenWeatherMapService({ apiKey: openWeatherApiKey }) : null;
		this.useGoogle = !!googleApiKey;
	}

	async getCurrentWeather(coordinates: LocationCoordinates): Promise<WeatherData | null> {
		// Try Google Weather first for current conditions (this works!)
		if (this.googleService) {
			try {
				const result = await this.googleService.getCurrentWeather(coordinates);
				if (result) {
					console.log('✅ Using Google Weather for current conditions');
					return result;
				}
			} catch (error) {
				console.warn('⚠️ Google Weather failed, trying OpenWeatherMap fallback:', error);
			}
		}

		// Fallback to OpenWeatherMap
		if (this.openWeatherService) {
			console.log('📡 Using OpenWeatherMap for current conditions');
			return this.openWeatherService.getCurrentWeather(coordinates);
		}

		return null;
	}

	async getForecast(coordinates: LocationCoordinates): Promise<WeatherForecast | null> {
		// Try Google Weather first (10-day forecast!)
		if (this.googleService) {
			try {
				const result = await this.googleService.getForecast(coordinates);
				if (result) {
					console.log('✅ Using Google Weather for forecast (10 days)');
					return result;
				}
			} catch (error) {
				console.warn('⚠️ Google Weather failed, trying OpenWeatherMap fallback:', error);
			}
		}

		// Fallback to OpenWeatherMap
		if (this.openWeatherService) {
			console.log('📡 Using OpenWeatherMap fallback for forecast (5 days)');
			try {
				return await this.openWeatherService.getForecast(coordinates);
			} catch (error) {
				console.error('❌ OpenWeatherMap also failed:', error);
				return null;
			}
		}

		console.warn('❌ No weather services available');
		return null;
	}

	async getWeatherForDateTime(
		coordinates: LocationCoordinates,
		targetDate: Date
	): Promise<ForecastData | null> {
		// Try Google Weather first
		if (this.googleService) {
			try {
				const result = await this.googleService.getWeatherForDateTime(coordinates, targetDate);
				if (result) {
					return result;
				}
			} catch (error) {
				console.warn('Google Weather specific date failed, trying OpenWeatherMap:', error);
			}
		}

		// Fallback to OpenWeatherMap
		if (this.openWeatherService) {
			return this.openWeatherService.getWeatherForDateTime(coordinates, targetDate);
		}

		return null;
	}
}

/**
 * Browser-safe environment config
 */
export const WEATHER_CONFIG = {
	// API keys from environment variables
	GOOGLE_WEATHER_API_KEY: '',
	OPENWEATHER_API_KEY: '',
	DEFAULT_UNITS: 'metric' as const,
	CACHE_DURATION: 10 * 60 * 1000, // 10 minutes in milliseconds
	FORECAST_LIMIT: 40 // 5 days * 8 (3-hour intervals per day)
};

/**
 * Create unified weather service with automatic fallback
 * Tries Google Weather (free pilot, 10-day forecast)
 * Falls back to OpenWeatherMap (proven, 5-day forecast)
 */
export function createUnifiedWeatherService(
	googleApiKey?: string,
	openWeatherApiKey?: string
): UnifiedWeatherService {
	return new UnifiedWeatherService(googleApiKey, openWeatherApiKey);
}


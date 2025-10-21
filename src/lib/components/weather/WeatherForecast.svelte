<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import { 
		createUnifiedWeatherService, 
		type ForecastData,
		type LocationCoordinates
	} from '$lib/utils/weather-integration.js';
	
	// Icons
	import Calendar from 'lucide-svelte/icons/calendar';
	import CloudRain from 'lucide-svelte/icons/cloud-rain';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	
	interface Props {
		coordinates: LocationCoordinates;
		tourDateTime?: Date;
		locationName?: string;
		apiKey?: string; // OpenWeather key (optional, for backward compatibility)
		daysToShow?: number;
	}
	
	let {
		coordinates,
		tourDateTime,
		locationName = '',
		apiKey = '',
		daysToShow = 10 // Google Weather supports 10 days!
	}: Props = $props();
	
	let forecast = $state<ForecastData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let specificTourWeather = $state<ForecastData | null>(null);
	
	// Fetch forecast data
	async function fetchForecast() {
		if (!browser) {
			loading = false;
			return;
		}
		
		// Get API keys from environment
		const googleKey = env.PUBLIC_GOOGLE_MAPS_API_KEY;
		const openWeatherKey = apiKey || env.PUBLIC_OPENWEATHER_API_KEY;
		
		if (!googleKey && !openWeatherKey) {
			loading = false;
			error = 'No weather API keys configured';
			return;
		}
		
		loading = true;
		error = null;
		
		try {
			const weatherService = createUnifiedWeatherService(googleKey, openWeatherKey);
			const forecastData = await weatherService.getForecast(coordinates);
			
			if (forecastData) {
				// Get daily forecasts (one per day at midday)
				const dailyForecasts: ForecastData[] = [];
				const seenDates = new Set<string>();
				
				for (const item of forecastData.list) {
					const date = new Date(item.dt * 1000);
					const dateKey = date.toDateString();
					
					// Take the midday forecast (12:00) or closest to it for each day
					if (!seenDates.has(dateKey) && dailyForecasts.length < daysToShow) {
						const hour = date.getHours();
						if (hour >= 11 && hour <= 14) {
							dailyForecasts.push(item);
							seenDates.add(dateKey);
						}
					}
				}
				
				forecast = dailyForecasts;
				
				// If a specific tour date/time is provided, get weather for that time
				if (tourDateTime) {
					specificTourWeather = await weatherService.getWeatherForDateTime(
						coordinates,
						tourDateTime
					);
				}
			} else {
				error = 'Unable to fetch forecast data';
			}
		} catch (err) {
			console.error('Forecast fetch error:', err);
			error = 'Failed to load forecast';
		} finally {
			loading = false;
		}
	}
	
	// Fetch forecast on mount
	onMount(() => {
		fetchForecast();
	});
	
	// Helper to get weather emoji
	function getWeatherEmoji(conditionId: number): string {
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
	
	function getDayName(timestamp: number): string {
		const date = new Date(timestamp * 1000);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		
		if (date.toDateString() === today.toDateString()) return 'Today';
		if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
		
		return date.toLocaleDateString('en-US', { weekday: 'short' });
	}
	
	function getFullDate(timestamp: number): string {
		const date = new Date(timestamp * 1000);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<div class="rounded-lg" style="background: var(--bg-primary); border: 1px solid var(--border-primary);">
	{#if !env.PUBLIC_GOOGLE_MAPS_API_KEY && !env.PUBLIC_OPENWEATHER_API_KEY && !apiKey}
		<div class="p-4 text-center">
			<p class="text-sm" style="color: var(--text-secondary);">
				Weather forecast unavailable - API key not configured
			</p>
		</div>
	{:else if loading}
		<div class="p-4 flex items-center justify-center">
			<div class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" style="color: var(--text-secondary);"></div>
			<span class="text-sm" style="color: var(--text-secondary);">Loading forecast...</span>
		</div>
	{:else if error}
		<div class="p-4">
			<p class="text-sm" style="color: var(--color-error-700);">{error}</p>
			<button
				type="button"
				onclick={fetchForecast}
				class="mt-2 text-xs underline"
				style="color: var(--color-error-600);"
			>
				Try again
			</button>
		</div>
	{:else}
		<!-- Header -->
		<div class="p-4 border-b" style="border-color: var(--border-primary);">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Calendar class="w-4 h-4" style="color: var(--text-secondary);" />
					<h3 class="font-semibold" style="color: var(--text-primary);">
						{locationName ? `${locationName} - ` : ''}Weather Forecast
					</h3>
				</div>
				<button
					type="button"
					onclick={fetchForecast}
					disabled={loading}
					class="p-1 rounded hover:bg-opacity-80"
					style="background: var(--bg-secondary);"
					title="Refresh forecast"
				>
					<RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" style="color: var(--text-secondary);" />
				</button>
			</div>
		</div>
		
		<!-- Tour-Specific Weather (if provided) -->
		{#if specificTourWeather && tourDateTime}
			<div class="p-4 border-b" style="background: var(--color-primary-50); border-color: var(--border-primary);">
				<div class="flex items-start gap-3">
					<Calendar class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--color-primary-600);" />
					<div class="flex-1">
						<p class="text-sm font-medium mb-1" style="color: var(--color-primary-900);">
							Tour Time: {tourDateTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
							at {tourDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
						</p>
						<div class="flex items-center gap-2">
							<span class="text-2xl">{getWeatherEmoji(specificTourWeather.conditions[0].id)}</span>
							<div>
								<p class="text-lg font-bold" style="color: var(--color-primary-900);">
									{Math.round(specificTourWeather.temperature)}°C
								</p>
								<p class="text-xs capitalize" style="color: var(--color-primary-700);">
									{specificTourWeather.conditions[0].description}
								</p>
							</div>
							{#if specificTourWeather.pop > 0.3}
								<div class="ml-auto flex items-center gap-1">
									<CloudRain class="w-4 h-4" style="color: var(--color-info-600);" />
									<span class="text-xs" style="color: var(--color-info-700);">
										{Math.round(specificTourWeather.pop * 100)}% rain
									</span>
								</div>
							{/if}
						</div>
						
						<!-- Warning for bad weather on tour day -->
						{#if specificTourWeather.conditions[0].id < 800 || specificTourWeather.pop > 0.6}
							<div class="mt-2 p-2 rounded flex items-start gap-2" style="background: var(--color-warning-100); border: 1px solid var(--color-warning-300);">
								<AlertCircle class="w-3 h-3 flex-shrink-0 mt-0.5" style="color: var(--color-warning-700);" />
								<p class="text-xs" style="color: var(--color-warning-800);">
									Weather may affect this tour. Consider checking conditions closer to the tour date.
								</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Daily Forecast -->
		<div class="p-4">
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
				{#each forecast as day}
					<div class="p-3 rounded-lg text-center" style="background: var(--bg-secondary); border: 1px solid var(--border-primary);">
						<p class="text-sm font-medium mb-1" style="color: var(--text-primary);">
							{getDayName(day.dt)}
						</p>
						<p class="text-xs mb-2" style="color: var(--text-tertiary);">
							{getFullDate(day.dt)}
						</p>
						<div class="text-3xl mb-2">
							{getWeatherEmoji(day.conditions[0].id)}
						</div>
						<div class="mb-1">
							<p class="text-lg font-bold" style="color: var(--text-primary);">
								{Math.round(day.temperature)}°C
							</p>
							{#if day.tempMin !== day.tempMax}
								<p class="text-xs" style="color: var(--text-secondary);">
									{Math.round(day.tempMin)}° / {Math.round(day.tempMax)}°
								</p>
							{/if}
						</div>
						<p class="text-xs capitalize line-clamp-2" style="color: var(--text-secondary);">
							{day.conditions[0].description}
						</p>
						{#if day.pop > 0.2}
							<div class="flex items-center justify-center gap-1 mt-2">
								<CloudRain class="w-3 h-3" style="color: var(--color-info-600);" />
								<span class="text-xs" style="color: var(--text-secondary);">
									{Math.round(day.pop * 100)}%
								</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>

